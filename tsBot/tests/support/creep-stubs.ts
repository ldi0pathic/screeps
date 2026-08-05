/**
 * Stubs für Creeps, Stores und Strukturen — alles, was die Beschaffungs- und
 * Transportketten in `creep/base.ts` und `creep/transport.ts` anfassen.
 *
 * Baut auf `movement-stubs.ts` auf (`RoomPosition`, `Room.serializePath`, der
 * mitschreibende `moveByPath`), damit ein Test beides zusammen benutzen kann: die
 * Kette entscheidet ja gerade zwischen „handeln" und „hinlaufen".
 *
 * Die Aktionen des Creeps (`withdraw`, `pickup`, `transfer`, `harvest`) liefern
 * einen vorgegebenen Rückgabecode und schreiben mit, womit sie aufgerufen wurden.
 * Genau daran hängt das Verhalten der Ketten.
 */

import { installMovement, moveCalls, movement, position, resetMovement } from "./movement-stubs";

const anyGlobal = globalThis as any;

/** Ein Aufruf einer Creep-Aktion. */
export interface ActionCall {
  action: "withdraw" | "pickup" | "transfer" | "harvest" | "moveTo";
  targetId: string;
  resource?: string;
}

/** Alle Aktionsaufrufe seit dem letzten `resetCreepWorld()`. */
export const actionCalls: ActionCall[] = [];

/**
 * Rückgabecodes der Aktionen. Je Aktion einzeln, weil eine Kette oft von einem
 * `ERR_NOT_IN_RANGE` beim Handeln und einem `OK` beim Laufen lebt.
 */
export const actionResults: Record<string, number> = {};

/** Objekte, die `Game.getObjectById` finden soll. */
const objectsById = new Map<string, any>();

/** Legt ein Objekt unter seiner Id ab, damit `Game.getObjectById` es findet. */
export function registerObject<T extends { id: string }>(object: T): T {
  objectsById.set(object.id, object);
  return object;
}

export interface StoreStub {
  [resource: string]: any;
  getUsedCapacity(resource?: string): number;
  getFreeCapacity(resource?: string): number;
  getCapacity(resource?: string): number;
}

/**
 * Ein Store mit Kapazität und Inhalt. Vereinfacht gegenüber dem Spiel: hier ist
 * jeder Store ein allgemeiner Store, der jede Ressource aufnehmen kann.
 */
export function stubStore(capacity: number, contents: Record<string, number> = {}): StoreStub {
  const store: any = { ...contents };

  // Die Methoden werden **nicht aufzählbar** angelegt: der Bot läuft mehrfach mit
  // `for (var resourceType in store)` über einen Store, und im Spiel liefert das
  // ausschließlich Ressourcen. Wären sie aufzählbar, würde hier eine
  // `getUsedCapacity`-„Ressource" mitlaufen, die es nicht gibt.
  Object.defineProperties(store, {
    getUsedCapacity: {
      enumerable: false,
      value: (resource?: string): number => {
        if (resource !== undefined) return store[resource] ?? 0;
        return Object.keys(contents).reduce((total, key) => total + (store[key] ?? 0), 0);
      },
    },
    getCapacity: { enumerable: false, value: (): number => capacity },
    getFreeCapacity: {
      enumerable: false,
      value: (resource?: string): number => capacity - store.getUsedCapacity(resource),
    },
  });

  return store as StoreStub;
}

export interface StructureStub {
  id: string;
  structureType: string;
  pos: any;
  store: StoreStub;
  hits?: number;
  hitsMax?: number;
}

/** Eine Struktur mit Store, registriert für `Game.getObjectById`. */
export function stubStructure(
  id: string,
  structureType: string,
  x: number,
  y: number,
  roomName: string,
  store: StoreStub = stubStore(2000),
): StructureStub {
  return registerObject({ id, structureType, pos: position(x, y, roomName), store });
}

/** Eine liegende Ressource. */
export function stubDrop(id: string, amount: number, x: number, y: number, roomName: string) {
  return registerObject({
    id,
    amount,
    resourceType: "energy",
    pos: position(x, y, roomName),
  });
}

/** Eine Quelle. */
export function stubSource(id: string, energy: number, x: number, y: number, roomName: string) {
  return registerObject({ id, energy, pos: position(x, y, roomName) });
}

export interface RoomStubOptions {
  storage?: StructureStub | undefined;
  terminal?: StructureStub | undefined;
  /** Was `find(type)` je Suchtyp liefert. */
  found?: Record<number, unknown[]>;
  controller?: Record<string, any> | undefined;
}

/** Ein Raum, dessen `find` aus einer Tabelle antwortet. */
export function stubRoom(name: string, options: RoomStubOptions = {}) {
  const found = options.found ?? {};
  return {
    name,
    storage: options.storage,
    terminal: options.terminal,
    controller: options.controller ?? { my: true, level: 8 },
    find(type: number, opts?: { filter?: (item: any) => boolean }): unknown[] {
      const candidates = found[type] ?? [];
      return opts?.filter ? candidates.filter(opts.filter) : candidates;
    },
  };
}

export interface ActorOptions {
  store?: StoreStub;
  memory?: Record<string, any>;
  room?: ReturnType<typeof stubRoom>;
  /** Was `findClosestByPath`/`findClosestByRange` je Suchtyp liefert. */
  closest?: Record<number, unknown[]>;
  workParts?: number;
}

/**
 * Ein Creep, der handeln kann. `findClosestByPath` filtert die vorgegebenen
 * Kandidaten und liefert den ersten — das genügt, weil die Ketten die Auswahl
 * über den Filter treffen, nicht über die Entfernung.
 */
export function stubActor(x: number, y: number, roomName: string, options: ActorOptions = {}) {
  const closest = options.closest ?? {};

  function findClosest(type: number, opts?: { filter?: (item: any) => boolean }): unknown {
    const candidates = closest[type] ?? [];
    const matching = opts?.filter ? candidates.filter(opts.filter) : candidates;
    return matching[0] ?? null;
  }

  const pos: any = position(x, y, roomName);
  pos.findClosestByPath = findClosest;
  pos.findClosestByRange = findClosest;

  const creep: any = {
    name: "creep_1",
    pos,
    store: options.store ?? stubStore(500),
    memory: options.memory ?? {},
    room: options.room ?? stubRoom(roomName),
    owner: { username: "test" },
    getActiveBodyparts: () => options.workParts ?? 1,
    say: () => undefined,

    // Schreibt wie der Creep aus `movement-stubs` mit: die Ketten entscheiden
    // zwischen Handeln und Hinlaufen, beides muss prüfbar sein.
    moveByPath(serialized: string): number {
      moveCalls.push(serialized);
      return movement.moveResult;
    },

    withdraw(target: any, resource: string): number {
      actionCalls.push({ action: "withdraw", targetId: target.id, resource });
      return actionResults.withdraw ?? anyGlobal.OK;
    },
    pickup(target: any): number {
      actionCalls.push({ action: "pickup", targetId: target.id });
      return actionResults.pickup ?? anyGlobal.OK;
    },
    transfer(target: any, resource: string): number {
      actionCalls.push({ action: "transfer", targetId: target.id, resource });
      return actionResults.transfer ?? anyGlobal.OK;
    },
    harvest(target: any): number {
      actionCalls.push({ action: "harvest", targetId: target.id });
      return actionResults.harvest ?? anyGlobal.OK;
    },
    moveTo(target: any): number {
      actionCalls.push({ action: "moveTo", targetId: target.id ?? "pos" });
      return actionResults.moveTo ?? anyGlobal.OK;
    },
  };

  return creep;
}

/** Legt die Welt an: Bewegung plus Creep-Aktionen. */
export function installCreepWorld(): void {
  installMovement();

  anyGlobal.Game.getObjectById = (id: string) => objectsById.get(id) ?? null;

  resetCreepWorld();
}

/** Leert Aufzeichnungen, Rückgabecodes und die Objekttabelle. */
export function resetCreepWorld(): void {
  resetMovement();
  actionCalls.length = 0;
  for (const key of Object.keys(actionResults)) delete actionResults[key];
  objectsById.clear();
}

/** Trägt eine Raumkonfiguration in `global.room` ein. */
export function configureRoom(name: string, config: Record<string, any>): void {
  anyGlobal.room[name] = { room: name, spawnRoom: name, ...config };
}

/** Legt `Memory.rooms[name]` an. */
export function roomMemory(name: string, memory: Record<string, any> = {}): Record<string, any> {
  anyGlobal.Memory.rooms ??= {};
  anyGlobal.Memory.rooms[name] = memory;
  return anyGlobal.Memory.rooms[name];
}
