/**
 * Die Rumpfprofile aller Rollen an einer Stelle.
 *
 * Vorher rechnete jede Rolle ihr Profil selbst, mit eigenen Zahlen im
 * Funktionsrumpf. Wer wissen wollte, wie groß ein Miner bei 2300 Energie wird,
 * musste `roles/miner.ts` lesen; wer die Zahlen vergleichen wollte, elf Dateien.
 * Hier stehen sie nebeneinander und sind ohne Spielwelt prüfbar.
 *
 * Was hier **nicht** steht: welches Profil gilt. Das entscheidet die Rolle —
 * beim Upgrader hängt es am RCL des Arbeitsraums, beim Debitor daran, ob der
 * Arbeitsraum der Heimatraum ist. Diese Auswahl ist Rollenwissen und bleibt
 * dort.
 *
 * Die Zahlen sind unverändert aus den Rollen übernommen; die Belege stehen in
 * `docs/knowledge/efficiency/energy-economy.md`. Absichtlich **keine**
 * Vereinheitlichung der Rückfallprofile: sie sind zwar ähnlich, aber jede Rolle
 * braucht dort andere Teile.
 */

import { BodyProfile } from "./body";

/**
 * Der Linkkeeper muss den ganzen Link in einem Zug aufnehmen: aus den
 * Spielkonstanten abgeleitet, nicht geraten.
 */
const LINK_CARRY_PARTS = Math.ceil(LINK_CAPACITY / CARRY_CAPACITY);

/** Der Claimer nimmt immer denselben Rumpf — 2 CLAIM reservieren doppelt so schnell. */
export const CLAIMER_BODY: BodyPartConstant[] = [CLAIM, CLAIM, MOVE, MOVE];

export const BODIES = {
  /** Miner: 3 WORK je CARRY, damit die Quelle ausgeschöpft wird. */
  miner: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 2 },
    ],
    maxSets: 8,
    // 2 WORK sättigen die Quelle nicht voll, liefern aber Energie.
    fallback: [WORK, WORK, CARRY, MOVE],
  }),

  builder: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 2 },
    ],
    maxSets: 7,
    fallback: [WORK, CARRY, CARRY, MOVE, MOVE],
  }),

  /** Repairer: derselbe Bausatz wie der Builder, aber höchstens drei Sätze. */
  repairer: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 2 },
    ],
    maxSets: 3,
    fallback: [WORK, CARRY, CARRY, MOVE, MOVE],
  }),

  /** Wallrepairer: ein WORK je Satz, dafür viel Ladung für lange Schichten. */
  wally: new BodyProfile({
    sets: [
      { part: WORK, perSet: 1 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 9,
    fallback: [WORK, CARRY, CARRY, MOVE, MOVE],
  }),

  /** Upgrader bis RCL7: zwei WORK je Satz. */
  upgrader: new BodyProfile({
    sets: [
      { part: WORK, perSet: 2 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 2 },
    ],
    maxSets: 8,
    fallback: [WORK, CARRY, MOVE, MOVE],
  }),

  /**
   * Upgrader ab RCL8: **genau** die erlaubte Rate ausschöpfen.
   *
   * Der Controller nimmt dort 15 Energie je Tick an, und `UPGRADE_CONTROLLER_POWER`
   * ist 1 je WORK — also fünf Sätze zu drei WORK. Mehr wäre bezahlte Untätigkeit,
   * weniger verschenkt GCL, und GCL ist die Erlaubnis für den nächsten Raum.
   *
   * Wenige CARRY, weil der Controller-Link in Reichweite 1 steht: 250
   * Tragfähigkeit reichen für rund siebzehn Ticks Arbeit. Wenige MOVE, weil der
   * Creep nach der Anreise steht — das Vorgängerprofil trug 18 CARRY und 18 MOVE
   * für eine Aufgabe, die 15 Energie je Tick verbraucht.
   *
   * Kosten 2000 Energie bei 25 Teilen; die Energiekapazität eines RCL8-Raums
   * liegt bei 12 900, der Rückfall greift dort also nie.
   */
  upgraderRcl8: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 5,
    fallback: [WORK, CARRY, MOVE],
  }),

  /** Extupgrader in einem Raum ohne Sicht oder unter RCL6. */
  extupgrader: new BodyProfile({
    sets: [
      { part: WORK, perSet: 2 },
      { part: CARRY, perSet: 2, max: 16 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 9,
    fallback: [WORK, CARRY, MOVE, MOVE],
  }),

  /** Extupgrader ab RCL6 des Arbeitsraums: ein WORK je Satz reicht. */
  extupgraderRcl6: new BodyProfile({
    sets: [
      { part: WORK, perSet: 1 },
      { part: CARRY, perSet: 2, max: 16 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 9,
    fallback: [WORK, CARRY, MOVE, MOVE],
  }),

  /**
   * Defender. Rechnet mit `energyAvailable` statt `energyCapacityAvailable` —
   * er soll sofort losgehen, nicht auf gefüllte Extensions warten.
   */
  defender: new BodyProfile({
    sets: [
      { part: TOUGH, perSet: 1 },
      { part: MOVE, perSet: 2 },
      { part: ATTACK, perSet: 1 },
      { part: RANGED_ATTACK, perSet: 1 },
    ],
    maxSets: 5,
    fallback: [MOVE, MOVE, ATTACK, RANGED_ATTACK],
  }),

  /** Transfer: reiner Träger zwischen zwei Räumen, ein MOVE je CARRY. */
  transfer: new BodyProfile({
    sets: [
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 25,
    fallback: [CARRY, MOVE],
  }),

  /** Debitor im Heimatraum. */
  debitor: new BodyProfile({
    sets: [
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 25,
    fallback: [CARRY, MOVE],
  }),

  /** Debitor ohne zugeordneten Container — kleiner, weil er mehr läuft. */
  debitorWithoutContainer: new BodyProfile({
    sets: [
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 20,
    fallback: [CARRY, MOVE],
  }),

  /**
   * Linkkeeper: genau ein Satz — der ganze Link in einem Zug, dazu ein einziges
   * MOVE, weil der Creep nach der Anreise dauerhaft still steht. Links gibt es
   * erst ab RCL5, das Vollprofil passt dort praktisch immer.
   */
  linkkeeper: new BodyProfile({
    sets: [
      { part: CARRY, perSet: LINK_CARRY_PARTS },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 1,
    // Rückfall: so viele CARRY wie neben dem MOVE hineinpassen, mindestens eines.
    fallback: (energy: number) => {
      const affordable = Math.max(
        1,
        Math.floor((energy - BODYPART_COST[MOVE]) / BODYPART_COST[CARRY]),
      );
      return [...Array<BodyPartConstant>(affordable).fill(CARRY), MOVE];
    },
  }),
} as const;
