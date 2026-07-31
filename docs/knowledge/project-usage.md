# Project Usage Notes

Use this to apply the official-docs knowledge to this repository.

Repo entry points (`tsBot/src/`, see `CLAUDE.md` and `docs/architektur.md` for the full picture):

- `main.ts`: tick loop. Clears `Memory.creeps`, dispatches each creep to `jobs[creep.memory.role].doJob(creep)`, then calls `controller/timing.ts::controll()`.
- `controller/timing.ts`: the scheduler. Tower control and one terminal (round-robin) run every tick; `% 3` pixel generation, `% 5` spawn control (`controller/spawn.ts`), `% 7` defence scan, `% 11` status log; plus a 28,800-tick daily sequence that spreads Memory cleanup and wall/container/tower/terminal/road cache rebuilding across separate ticks.
- `controller/spawn.ts`: spawn decisions. Priority order comes from the property order of `roles/index.ts`, not from a separate priority field.
- `roles/index.ts`: the role table (`role name -> CreepRole { doJob, spawn }`). Property order *is* spawn priority — do not reorder, and do not rename keys (they are persisted in live Creep memory).
- `creep/goto.ts`: path caching and stuck handling (`moveByMemory`, `memory.path`/`memory.pathTarget`/`memory.dontMove`).
- `creep/base.ts` (+ `transport.ts`): shared creep actions; `memory.harvest` is the harvest/deliver state machine, toggled by `checkHarvest()`; `memory.fromId` avoids returning to the just-used source.
- `prototypes/creep-checks.ts`, `prototypes/terminal-market.ts`: prototype extensions (`Creep.checkHarvest`, `StructureTerminal.sell/buy/buyPixel`).
- `config.ts`: static configuration (managed rooms, per-room limits, build/repair priority tables), a side-effect module read through the typed `bot` handle from `globals.ts`.

There is no CPU manager and no room-extension cache layer in this repo. CPU is managed purely through the modulo intervals in `timing.ts` and by caching IDs/paths in `Memory` (e.g. `memory.path`, the wall/container/tower/terminal ID lists that `controller/memory.ts` fills on the daily sequence, `Memory.terminals`). There are no automated tests and no linter; verification is `pnpm exec tsc --noEmit` plus `pnpm build` (both run from `tsBot/`), ultimately confirmed on the local Docker server or PTR.

## Good Fits For This Codebase

- Keep CPU-heavy operations spread across modulo intervals like the ones in `timing.ts`, rather than running them every tick.
- Keep round-robin execution for noncritical, per-tick-optional work (see the terminal round-robin in `timing.ts::controll()`).
- Cache stable target IDs in creep memory — this codebase already does it (`memory.fromId`, the daily-refreshed wall/container/tower/terminal ID lists, `Memory.terminals`).
- There is no cached-finder abstraction here; prefer a `bot.room[...]` config lookup (`config.ts`) over a raw `room.find` when the answer is already static data, and if a new cached finder is worth adding, follow the pattern in `controller/memory.ts` (cache an ID list in `Memory.rooms[name]`, refresh it on one day of the daily sequence).
- Use source throughput numbers when tuning miner/debitor/upgrader counts — `config.ts` holds `energySources`, `debitorAsFreelancer` and `upgrader` per room. Note `debitorProSource` is present in the config but currently read by no module (see `docs/aenderungen.md`).
- Use the RCL table when adding construction/layout logic; today the closest existing hooks are `prioBuildings`/`destroy` per room in `config.ts`, there is no dedicated RCL-driven layout module yet.

## Checks Before Changing Roles

- Does the body saturate the target source?
- Is `MOVE` ratio correct for expected terrain/load?
- Does spawn replacement account for body size * 3 ticks and travel time?
- Does the creep issue only one final movement command?
- Are expensive target scans cached or staggered (e.g. moved onto one day of `timing.ts`'s daily sequence instead of running every tick)?

## Checks Before Changing Movement

- Path to non-walkable target uses range 1+.
- Repathing in `moveByMemory` is triggered by target change (`memory.pathTarget` no longer matches the new target) or by the stuck counter: `memory.dontMove` increments whenever the creep's position is unchanged tick-to-tick, and a value above 3 forces a fresh path that no longer ignores creeps.
- There is no CostMatrix caching here — `moveByMemory` calls `pos.findPathTo` directly per creep on every repath. Only add CostMatrix caching if profiling shows repeated per-creep pathfinding in the same room/tick is actually expensive.
- `findClosestByRange` is used when exact path distance is unnecessary.
- `memory.path`/`memory.pathTarget` live in `Memory` and so survive a global reset, but carry no explicit TTL or version field — invalidation is only the target-equality check plus the stuck counter above. Role code is expected to `delete` both keys itself whenever it changes a creep's target.

## Checks Before Changing Repairs

- Containers have different decay in owned vs unowned rooms.
- Roads decay passively and faster under traffic.
- Ramparts decay forever; walls do not.
- Repair target thresholds avoid scanning/sorting every tick — see `bot.prio.repair`/`bot.prio.hits` in `config.ts`, shared by builder, repairer and towers.

## Checks Before Changing Resource Pickup

- Tombstones and ruins may be better than harvesting.
- Use `.store` APIs, not deprecated `.energy`/`.storeCapacity` aliases.
- Decay timers make scavenging time-sensitive.

## Official Docs To Recheck

- Constants/API: https://docs.screeps.com/api/
- CPU: https://docs.screeps.com/cpu-limit.html
- Creep movement: https://docs.screeps.com/creeps.html
- Simultaneous actions: https://docs.screeps.com/simultaneous-actions.html
