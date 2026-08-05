/**
 * Rumpfprofile: aus einem Bausatz und der verfügbaren Energie einen Creep-Rumpf
 * bauen.
 *
 * Acht der elf Rollen rechneten dieselben vier Zeilen selbst: Kosten eines
 * Bausatzes summieren, `min(Obergrenze, floor(Energie / Kosten))` Sätze bilden,
 * bei null Sätzen ein Minimalprofil liefern, sonst die Teile in fester
 * Reihenfolge aneinanderhängen. Jede Kopie hatte eigene Zahlen und eigene
 * Sonderfälle — und zwei davon lieferten bei null Sätzen ein **leeres** Array,
 * mit dem `spawnCreep` grundsätzlich fehlschlägt (`docs/aenderungen.md`, A4 und
 * der Builder-Fix).
 *
 * Hier steckt nur die Arithmetik. Welche Profile es gibt, steht in `bodies.ts`;
 * welches davon gilt, entscheidet die Rolle.
 */

/** Ein Teil im Bausatz, mit seiner Anzahl je Satz. */
export interface BodySetEntry {
  part: BodyPartConstant;
  /**
   * Anzahl dieses Teils je Satz. Darf gebrochen sein: der Upgrader nimmt ab
   * RCL8 ein halbes `WORK` je Satz, weil dort ein einzelnes `WORK` schon 15
   * Energie je Tick umsetzt. Gerundet wird abwärts, über alle Sätze zusammen.
   */
  perSet: number;
  /** Obergrenze über alle Sätze zusammen (Extupgrader: höchstens 16 `CARRY`). */
  max?: number;
}

export interface BodyProfileSpec {
  /** Der Bausatz, **in der Reihenfolge des späteren Rumpfs**. */
  sets: BodySetEntry[];
  /** Höchstzahl Sätze. Begrenzt Kosten, Spawnzeit und die 50 Teile je Creep. */
  maxSets: number;
  /**
   * Rumpf, wenn nicht einmal ein Satz bezahlbar ist. **Pflichtangabe**: ein
   * leerer Rumpf lässt `spawnCreep` immer fehlschlagen, und genau dieser Fehler
   * ist in diesem Repo schon dreimal aufgetreten. Als Funktion, wenn der
   * Rückfall von der Energie abhängt (Linkkeeper).
   */
  fallback: BodyPartConstant[] | ((energy: number) => BodyPartConstant[]);
}

/**
 * Ein Rumpfprofil. Unveränderlich und ohne Spielzugriff — `build()` bekommt die
 * Energie übergeben und liest weder `Game` noch `Memory`. Deshalb ist es ohne
 * gestellte Welt prüfbar.
 */
export class BodyProfile {
  constructor(private readonly spec: BodyProfileSpec) {}

  /** Energiekosten eines Satzes. */
  get setCost(): number {
    return this.spec.sets.reduce((total, entry) => total + BODYPART_COST[entry.part] * entry.perSet, 0);
  }

  /** Wie viele Sätze `energy` bezahlt, begrenzt durch `maxSets`. */
  setsFor(energy: number): number {
    return Math.min(this.spec.maxSets, Math.floor(energy / this.setCost));
  }

  /** Der Rumpf für `energy`. Nie leer. */
  build(energy: number): BodyPartConstant[] {
    const sets = this.setsFor(energy);

    // `<= 0` statt `=== 0`: bei einem unsinnigen Energiewert käme sonst über
    // negative Anzahlen ein leerer Rumpf heraus statt des Rückfalls.
    if (sets <= 0) {
      const fallback = this.spec.fallback;
      return typeof fallback === "function" ? fallback(energy) : [...fallback];
    }

    const body: BodyPartConstant[] = [];
    for (const entry of this.spec.sets) {
      const count = Math.min(Math.floor(sets * entry.perSet), entry.max ?? Infinity);
      for (let index = 0; index < count; index += 1) {
        body.push(entry.part);
      }
    }
    return body;
  }
}

/**
 * `count` Paare aus `CARRY` und `MOVE` — ein Transportrumpf, der sich auf
 * Straßen und im Gelände gleich schnell bewegt.
 *
 * Für die Fälle, in denen die Anzahl nicht aus der Energie folgt, sondern aus
 * der Wegstrecke (`roles/debitor.ts`).
 */
export function carryMove(count: number): BodyPartConstant[] {
  // Mindestens ein Paar, und `undefined`/`NaN` ergibt eines statt einer
  // Ausnahme: `Memory.rooms[...].needDebitorSize` kann fehlen, und der alte
  // Code lieferte über `Array(undefined)` genau ein Paar.
  const pairs = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  return [...Array<BodyPartConstant>(pairs).fill(CARRY), ...Array<BodyPartConstant>(pairs).fill(MOVE)];
}
