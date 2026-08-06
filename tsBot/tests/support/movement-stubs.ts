/**
 * Stubs für Bewegung und Pfade: `RoomPosition`, `Room.serializePath`,
 * `RoomVisual` und ein Creep, der jeden `moveByPath`-Aufruf mitschreibt.
 *
 * Aufbauend auf `screeps-stubs.ts` (Welt und Konstanten). Getrennt gehalten,
 * weil nur die Bewegungstests das brauchen — und weil hier bewusst
 * **vereinfacht** wird: die Pfadserialisierung des Spiels ist ein kompakter
 * String, hier ist es JSON. Der Bot behandelt den Wert ohnehin als opak, er gibt
 * ihn nur an `moveByPath` und `deserializePath` weiter.
 */

import { installGlobals, resetWorld } from "./screeps-stubs";

const anyGlobal = globalThis as any;

/** Ein Schritt eines Pfads, wie `findPathTo` ihn liefert. */
export interface PathStepStub {
  x: number;
  y: number;
  dx: number;
  dy: number;
  direction: number;
}

/** Ein Aufruf von `RoomPosition.findPathTo`. */
export interface PathSearch {
  from: { x: number; y: number; roomName: string };
  to: { x: number; y: number; roomName: string };
  ignoreCreeps: boolean | undefined;
  range: number | undefined;
}

/** Alle Pfadsuchen seit dem letzten `resetMovement()`. */
export const pathSearches: PathSearch[] = [];

/** Alle `moveByPath`-Aufrufe seit dem letzten `resetMovement()`. */
export const moveCalls: string[] = [];

/**
 * Rückgabewert des nächsten `moveByPath`. Umschaltbar, weil `moveByMemory` je
 * Rückgabecode etwas anderes tut (Stauzähler, Pfad verwerfen, abbrechen).
 */
export const movement = {
  moveResult: 0,
  /** Schritte, die eine Pfadsuche liefert. */
  path: [] as PathStepStub[],
};

/** Baut einen geraden Pfad aus `length` Schritten ab (`x`,`y`) nach rechts. */
export function straightPath(x: number, y: number, length: number): PathStepStub[] {
  return Array.from({ length }, (_unused, index) => ({
    x: x + index + 1,
    y,
    dx: 1,
    dy: 0,
    direction: 3,
  }));
}

let installed = false;

/** Legt die Bewegungs-Globals an. Mehrfachaufruf ist unschädlich. */
export function installMovement(): void {
  installGlobals();

  if (!installed) {
    installed = true;

    anyGlobal.RoomPosition = class RoomPositionStub {
      constructor(
        public x: number,
        public y: number,
        public roomName: string,
      ) {}

      isEqualTo(other: { x: number; y: number; roomName: string }): boolean {
        return this.x === other.x && this.y === other.y && this.roomName === other.roomName;
      }

      inRangeTo(other: { x: number; y: number }, range: number): boolean {
        return Math.abs(this.x - other.x) <= range && Math.abs(this.y - other.y) <= range;
      }

      findPathTo(
        target: { x: number; y: number; roomName: string },
        options?: { ignoreCreeps?: boolean; range?: number },
      ): PathStepStub[] {
        pathSearches.push({
          from: { x: this.x, y: this.y, roomName: this.roomName },
          to: { x: target.x, y: target.y, roomName: target.roomName },
          ignoreCreeps: options?.ignoreCreeps,
          range: options?.range,
        });
        return movement.path;
      }
    };

    // Der Bot behandelt den serialisierten Pfad als opak — JSON genügt.
    anyGlobal.Room = {
      serializePath: (steps: PathStepStub[]) => JSON.stringify(steps),
      deserializePath: (serialized: string) => JSON.parse(serialized) as PathStepStub[],
    };

    // `global.const` aus `config.ts`; `bot.const.showPaths` schaltet die
    // Pfadvisualisierung.
    anyGlobal["const"] = { showPaths: false };
  }

  resetMovement();
}

/** Leert die Aufzeichnungen und setzt die Vorgaben zurück. */
export function resetMovement(): void {
  resetWorld();
  pathSearches.length = 0;
  moveCalls.length = 0;
  movement.moveResult = anyGlobal.OK;
  movement.path = straightPath(10, 10, 5);
  anyGlobal["const"].showPaths = false;
}

/** Schaltet die Pfadvisualisierung des Bots. */
export function showPaths(enabled: boolean): void {
  anyGlobal["const"].showPaths = enabled;
}

export interface CreepStub {
  name: string;
  pos: any;
  memory: Record<string, any>;
  room: { name: string; find: (type: number) => unknown[] };
  moveByPath(serialized: string): number;
}

/** Ein Creep an (`x`,`y`) in `roomName`, mit leerem Memory. */
export function stubCreep(
  x: number,
  y: number,
  roomName: string,
  memory: Record<string, any> = {},
  flags: unknown[] = [],
): CreepStub {
  return {
    name: "creep_1",
    pos: new anyGlobal.RoomPosition(x, y, roomName),
    memory,
    room: {
      name: roomName,
      find: () => flags,
    },
    moveByPath(serialized: string): number {
      moveCalls.push(serialized);
      return movement.moveResult;
    },
  };
}

/** Eine `RoomPosition` der gestellten Laufzeit. */
export function position(x: number, y: number, roomName: string): any {
  return new anyGlobal.RoomPosition(x, y, roomName);
}
