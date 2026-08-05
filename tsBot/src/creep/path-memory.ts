/**
 * Der Pfad-Cache eines Creeps im Creep-Memory.
 *
 * Vier Schlüssel, die zusammengehören und bisher an zehn Stellen einzeln per
 * `delete` angefasst wurden (`creep/goto.ts`, `prototypes/creep-checks.ts`,
 * `roles/miner.ts`):
 *
 * - `path` — der serialisierte Weg, `pathTarget` — sein Ziel. Zusammen der Cache.
 * - `lastPos`, `dontMove` — die Stauerkennung: wo der Creep im letzten Tick stand
 *   und wie viele Ticks er sich nicht bewegt hat.
 *
 * Wichtig sind **zwei** verschiedene Löschregeln, die es vorher schon gab und die
 * hier Namen bekommen: `forgetPath()` verwirft nur den Weg (so machen es die
 * Zustandswechsel in `checkHarvest`), `clear()` zusätzlich die Stauerkennung (so
 * macht es `goto` am Ziel und der Miner beim Wechsel seiner Quelle). Wer beides
 * verwechselt, setzt entweder den Stauzähler zu früh zurück oder schleppt ihn
 * über einen Zielwechsel hinweg mit.
 *
 * Die Schlüsselnamen bleiben deutsch bzw. wie gehabt: sie stehen im Memory des
 * laufenden Spiels.
 */

/** Nur der Teil des Creep-Memory, um den es hier geht. */
type PathCacheMemory = CreepMemory & {
  path?: string;
  pathTarget?: { x?: number; y?: number; roomName?: string };
  lastPos?: { x?: number; y?: number };
  dontMove?: number;
};

/** Ab wie vielen Ticks ohne Ortswechsel ein Creep als festgefahren gilt. */
const STUCK_TICKS = 3;

export class PathMemory {
  private readonly memory: PathCacheMemory;

  constructor(memory: CreepMemory) {
    this.memory = memory as PathCacheMemory;
  }

  /** Der gespeicherte Weg, ohne Rücksicht auf sein Ziel. */
  get path(): string | undefined {
    return this.memory.path;
  }

  /** Ticks ohne Ortswechsel. */
  get stuckTicks(): number {
    return this.memory.dontMove ?? 0;
  }

  /**
   * Steht der Creep lange genug still, dass ein Weg um andere Creeps herum
   * gesucht werden sollte?
   */
  get isStuck(): boolean {
    return this.stuckTicks > STUCK_TICKS;
  }

  /** Verwirft den gespeicherten Weg, **behält** die Stauerkennung. */
  forgetPath(): void {
    delete this.memory.path;
    delete this.memory.pathTarget;
  }

  /** Verwirft Weg **und** Stauerkennung. */
  clear(): void {
    this.forgetPath();
    delete this.memory.dontMove;
    delete this.memory.lastPos;
  }

  /**
   * Der gespeicherte Weg, falls er zu `target` gehört — sonst `undefined`.
   *
   * Zum Ziel gehört auch der Raumname: derselbe Punkt in einem anderen Raum ist
   * ein anderes Ziel. Ein `pathTarget` ohne Raumnamen gilt als unbrauchbar.
   */
  pathTo(target: RoomPosition): string | undefined {
    const stored = this.memory.pathTarget;
    if (!this.memory.path || !stored || !stored.roomName) {
      return undefined;
    }

    const sameTarget =
      stored.x === target.x && stored.y === target.y && stored.roomName === target.roomName;
    return sameTarget ? this.memory.path : undefined;
  }

  /** Merkt den Weg, ohne ein Ziel zu hinterlegen. */
  rememberPath(serializedPath: string): void {
    this.memory.path = serializedPath;
  }

  /** Merkt Weg und Ziel — der reguläre Fall. */
  rememberPathTo(serializedPath: string, target: RoomPosition): void {
    this.memory.path = serializedPath;
    this.memory.pathTarget = { x: target.x, y: target.y, roomName: target.roomName };
  }

  /** Setzt den Stauzähler zurück, ohne die letzte Position zu vergessen. */
  resetStuck(): void {
    this.memory.dontMove = 0;
  }

  /**
   * Führt die Stauerkennung einen Tick weiter: steht der Creep noch auf der
   * gemerkten Position, steigt der Zähler; sonst wird die neue Position gemerkt
   * und der Zähler beginnt neu.
   */
  trackPosition(pos: RoomPosition): void {
    const last = this.memory.lastPos;
    if (last && last.x === pos.x && last.y === pos.y) {
      this.memory.dontMove = this.stuckTicks + 1;
      return;
    }

    this.memory.lastPos = { x: pos.x, y: pos.y };
    this.memory.dontMove = 0;
  }
}
