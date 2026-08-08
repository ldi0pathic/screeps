/**
 * Ziele der Beschaffungsketten: gemerkte Ziele und die Auswertung dessen, was
 * eine Aktion am Ziel gemeldet hat.
 *
 * Beides stand vorher zwölfmal fast gleich in `creep/base.ts` und
 * `creep/transport.ts`:
 *
 *     switch (aktion) {
 *       case ERR_NOT_IN_RANGE: hinlaufen; [Ziel merken]; return true;
 *       case OK:               [Ziel merken]; fromId = ziel.id; return true;
 *       default:               [Ziel vergessen]; return false;
 *     }
 *
 * Die drei Fälle bedeuten dabei immer dasselbe: *zu weit weg* (also hinlaufen und
 * im nächsten Tick wieder versuchen), *erledigt* und *daraus wird nichts*.
 *
 * `fromId` ist dabei nicht Buchhaltung, sondern Steuerung: es merkt sich die
 * Quelle der Ladung, damit der Creep sie nicht gleich wieder dorthin abliefert
 * (siehe `creep/transport.ts`).
 *
 * `deliverTo` ergänzt das Gegenstück für ein **gemerktes** Ablieferziel: gesucht
 * wird dort weiterhin in `findDeliveryTarget` (`./transport.ts`), hier wird nur
 * ausgewertet und bei Erfolg vergessen.
 */

import { moveByMemory } from "./goto";

/** Ein Ziel, das genug Eigenschaften hat, um es anzugehen. */
interface Approachable {
  id: string;
  pos: RoomPosition;
}

/**
 * Ein Ziel, das ein Creep sich über Ticks hinweg merkt — abgelegt unter einem
 * eigenen Memory-Schlüssel (`useRoomDrop`, `useTombstone`, `useRuin`,
 * `useContainer`, `useRoomSource`).
 *
 * Der Sinn ist CPU: ein gemerktes Ziel spart die Suche im nächsten Tick. Der
 * Preis ist, dass ein ungültig gewordenes Ziel wieder vergessen werden muss —
 * genau das ging in den einzelnen `delete`-Zeilen leicht unter.
 */
export class RememberedTarget {
  private readonly memory: Record<string, any>;

  constructor(
    memory: CreepMemory,
    private readonly key: string,
  ) {
    this.memory = memory as unknown as Record<string, any>;
  }

  /**
   * Ist überhaupt ein Ziel gemerkt?
   *
   * Der Unterschied zu `resolve()` ist wichtig: ist ein Ziel gemerkt, das es
   * nicht mehr gibt, wird **nicht** ersatzweise gesucht. Der Creep vergisst es
   * und versucht es im nächsten Tick neu — genau so verhielt sich der Code schon
   * vorher, und es begrenzt die Suchen je Tick.
   */
  get isRemembered(): boolean {
    return Boolean(this.memory[this.key]);
  }

  /** Das gemerkte Ziel, oder `null` wenn keines gemerkt ist oder es nicht mehr existiert. */
  resolve<T>(): T | null {
    const id = this.memory[this.key];
    if (!id) {
      return null;
    }
    return Game.getObjectById(id as Id<any>) as T | null;
  }

  /** Merkt das Ziel für die nächsten Ticks. */
  remember(target: Approachable): void {
    this.memory[this.key] = target.id;
  }

  /** Vergisst das Ziel. */
  forget(): void {
    delete this.memory[this.key];
  }
}

/**
 * Wertet aus, was eine Beschaffungsaktion am **gemerkten** Ziel gemeldet hat.
 *
 * `state` ist der Rückgabewert der Aktion, die der Aufrufer schon ausgeführt hat
 * (`creep.pickup(...)`, `creep.withdraw(...)`) — bewusst als Wert und nicht als
 * Rückruf, damit hier je Aufruf keine Funktion angelegt wird.
 */
export function collectFrom(
  creep: Creep,
  target: Approachable,
  remembered: RememberedTarget,
  state: ScreepsReturnCode,
): boolean {
  switch (state) {
    case ERR_NOT_IN_RANGE:
      // Reichweite 1: Storage, Link, Terminal, Spawn, Extension, Tower und Lab
      // sind nicht betretbar, eine Suche ohne `range` sucht dort ein Feld, das
      // kein Creep je erreicht, und erschöpft ihre Ops mit der aussichtslosen
      // Restsuche. Am Verhalten ändert das nichts: die Aktion gelingt schon auf
      // Reichweite 1, `moveByMemory` wird dann gar nicht mehr gerufen — der
      // letzte Schritt wurde also auch vorher nie gegangen. Siehe
      // `docs/knowledge/efficiency/cpu-pathfinding.md` und Befund 6 in
      // `docs/plans/05-cpu-verteilung.md`.
      moveByMemory(creep, target.pos, 1);
      remembered.remember(target);
      return true;

    case OK:
      remembered.remember(target);
      creep.memory.fromId = target.id;
      return true;

    default:
      remembered.forget();
      return false;
  }
}

/**
 * Liefert `type` an `target` ab. Gegenstück zu `withdrawFrom`, mit einem
 * bewussten Unterschied: hier wird **kein** `fromId` gesetzt. Das merkt sich die
 * Quelle einer Ladung, und beim Abliefern gibt es keine.
 *
 * Ein fehlendes Ziel ist zulässig und heißt `false` — die Aufrufer geben das
 * Ergebnis einer Suche direkt weiter.
 */
export function transferTo(
  creep: Creep,
  target: AnyStructure | null | undefined,
  type: string,
): boolean {
  if (!target) {
    return false;
  }

  switch (creep.transfer(target, type as ResourceConstant)) {
    case ERR_NOT_IN_RANGE:
      moveByMemory(creep, target.pos, 1);
      return true;

    case OK:
      return true;

    default:
      return false;
  }
}

/**
 * Liefert `type` an ein **gemerktes** Ziel ab.
 *
 * Zwei bewusste Unterschiede zu `collectFrom`: es wird kein `fromId` gesetzt
 * (das merkt sich die Quelle einer Ladung, beim Abliefern gibt es keine), und
 * ein erfolgreicher Transfer **vergisst** das Ziel — danach ist die Extension
 * voll oder der Creep leer, in beiden Fällen ist die Wahl verbraucht.
 *
 * Gemerkt wird die Wahl in `findDeliveryTarget` (`./transport.ts`), sobald dort
 * gesucht wurde. Hier wird deshalb nur noch vergessen: bei `ERR_NOT_IN_RANGE`
 * läuft der Creep weiter zu demselben Ziel, sonst ist es verbraucht.
 */
export function deliverTo(
  creep: Creep,
  target: AnyStructure | null | undefined,
  remembered: RememberedTarget,
  type: string,
): boolean {
  if (!target) {
    remembered.forget();
    return false;
  }

  switch (creep.transfer(target, type as ResourceConstant)) {
    case ERR_NOT_IN_RANGE:
      moveByMemory(creep, target.pos, 1);
      return true;

    case OK:
      remembered.forget();
      return true;

    default:
      remembered.forget();
      return false;
  }
}

/**
 * Holt `type` aus `target`. Für Ziele, die nicht gesucht werden müssen, weil sie
 * feststehen: Storage, Controller-Link, der eigene Container, Notfallspeicher.
 *
 * `false` heißt „daraus wird nichts" — der Aufrufer probiert dann das nächste
 * Ziel seiner Kette.
 */
export function withdrawFrom(creep: Creep, target: Approachable, type: string): boolean {
  switch (creep.withdraw(target as unknown as Structure, type as ResourceConstant)) {
    case ERR_NOT_IN_RANGE:
      moveByMemory(creep, target.pos, 1);
      return true;

    case OK:
      creep.memory.fromId = target.id;
      return true;

    default:
      return false;
  }
}
