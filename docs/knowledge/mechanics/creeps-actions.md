# Creep Mechanics And Actions

Use this for method ranges, body requirements, conflicts, and action design.

Sources:

- https://docs.screeps.com/api/
- https://docs.screeps.com/creeps.html
- https://docs.screeps.com/simultaneous-actions.html
- https://docs.screeps.com/game-loop.html

## Body Order And Damage

Official:

- Creeps have up to 50 body parts.
- Each part has 100 hits.
- Damage is applied to body parts in spawn order.
- Fully damaged parts stop working.

Design:

- Put `TOUGH` first for damage soak.
- Put key active parts later if they should survive longer.
- Boosted `TOUGH` is counted left-to-right by `boostCreep`; other boosted parts right-to-left.

## Movement

Official:

- `MOVE` reduces fatigue by 2/tick.
- Non-`MOVE` parts generate fatigue on movement: road 1, plain 2, swamp 10.
- Empty `CARRY` parts do not generate fatigue.
- Creep cannot move with fatigue > 0.
- `move`, `moveByPath`, `moveTo` return `ERR_TIRED` when fatigue is non-zero.

## Action Ranges

| Method | Parts | Range |
|---|---|---:|
| `harvest` | `WORK` | 1 |
| `build` | `WORK`, `CARRY` | 3 |
| `repair` | `WORK`, `CARRY` | 3 |
| `upgradeController` | `WORK`, `CARRY` | 3 |
| `transfer` | `CARRY` | 1 |
| `withdraw` | `CARRY` | 1 |
| `pickup` | `CARRY` | 0 or 1 |
| `claimController` | `CLAIM` | 1 |
| `reserveController` | `CLAIM` | 1 |
| `attackController` | `CLAIM` | 1 |
| `heal` | `HEAL` | 1 |
| `rangedHeal` | `HEAL` | 3 |
| `attack` | `ATTACK` | 1 |
| `rangedAttack` | `RANGED_ATTACK` | 3 |
| `dismantle` | `WORK` | 1 |

## Simultaneous Actions

Background: game state is fixed during `main`; all effects apply only on tick transition — see [runtime-memory.md](../systems/runtime-memory.md) "Runtime Model" and https://docs.screeps.com/game-loop.html. A `withdraw` this tick does not change `creep.store` until next tick, so a role must never branch on its own cargo having "already arrived" within the same tick.

Official (https://docs.screeps.com/simultaneous-actions.html):

- Commands are scheduled during `main` and resolved later.
- Action methods are grouped into priority pipelines; the page states this only as a diagram (`action-priorities.png`), not as an enumerated list in text — do not treat any specific grouping of methods as officially enumerated.
- "If you try to execute all the dependent methods within one tick, only the most right one will be executed" (i.e. within one pipeline, only the highest-priority scheduled action actually runs).
- "The sequence of calling commands for different methods in the code is irrelevant, only the aforementioned priorities matter."
- If the same method is called multiple times in a tick, the last call wins.
- `transfer` cannot be executed more than once per tick to different targets — only one `transfer` call takes effect.
- Methods from different (independent) pipelines can run in the same tick.

Unverified (community, https://screeps.com/forum/topic/2483/simultaneous-actions-clarification, forum user "Estecka", who states themself they are not sure of the exact execution order):

- Claim: actions that remove resources from a creep run before actions that fill it, within a tick.
- Example given: a harvester can `transfer` its carried energy into a container and `harvest` again in the same tick (drain-then-fill order favors the harvester).
- Counter-example given: an upgrader cannot `withdraw` energy and `upgradeController` with that same energy in the same tick (fill-then-use does not chain).

Open question: whether `withdraw` and `transfer` (different resource, e.g. take from link, put into storage) can both execute in the same tick is **not answered** by the official page or by the forum thread above — the forum thread only discusses withdraw-then-use and harvest/transfer-then-harvest cases, not withdraw-then-transfer. Treat this as unresolved until confirmed by testing (see Implementation below).

Implementation:

- One movement command per creep per tick; last `move`/`moveTo` wins.
- Avoid issuing `repair` on full structures: it can return `OK` and block other useful work in its pipeline.
- Check target state before scheduling expensive/competing actions.
- For a "withdraw from link, transfer to storage" style role: call both `withdraw` and `transfer` every tick regardless of whether the previous tick's action is confirmed yet. Do not gate `transfer` on having observed the withdrawn resource in `creep.store` first — per the Background note above, that would never fire in the same tick it happens.
- Assume the slower case (one action executes per tick, so a full cycle costs 2 ticks) as the default until measured; do not assume both execute together to claim single-tick throughput.
- To settle whether a tick can do both: log `creep.store` and the return codes of both calls across a few ticks on a live/local server and compare against actual resource deltas, rather than relying on assumption.

## Harvest

Official:

- Requires `WORK`.
- Adjacent target.
- If no empty `CARRY`, harvested resource drops to ground.
- Mineral harvest requires extractor.
- Deposits/extractors can return `ERR_TIRED` due cooldown.

Design:

- Static miner can omit `CARRY` only if standing on container/link or dropping intentionally.
- Mineral miners need extractor and should handle 5 tick extractor cooldown.

## Build, Repair, Upgrade

Official:

- Build and repair range is 3.
- Upgrade range is 3.
- `WORK` scales action amount.
- Repair consumes 1 energy per 100 hits.
- Build progress is 5 per `WORK` per tick.
- Upgrade is 1 control point per `WORK` per tick.

Design:

- Builder/upgrader positioning can use range 3, not adjacency.
- Repair threshold logic saves CPU and energy logistics.

## Reserve And Claim

Official:

- Claim uses `CLAIM`, adjacent.
- Reserve increases reservation by 1 tick per `CLAIM` part per tick.
- Reservation max is 5000.
- Reserving neutral room restores sources to full capacity.

Design:

- Reserve remotes to double source yield from 1500 to 3000 per regen.
- Claim creeps have 600 tick lifetime; route distance matters heavily.

## Pull

Official pattern:

- Puller calls `pull(target)`.
- Pulled creep calls `move(puller)`.
- Puller also moves.

Use for:

- Low- or zero-`MOVE` creeps.
- Siege/body transport where active parts matter more than speed.
