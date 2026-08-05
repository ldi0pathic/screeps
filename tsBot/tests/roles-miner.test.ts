/**
 * Prüft die Rolle "miner" (`src/roles/miner.ts`), speziell die Sackgasse in
 * `doJob`, die vor dieser Runde behoben wurde: ab RCL 6 versucht ein
 * Energie-Miner ohne Link, sich selbst einen Quell-Link zu bauen
 * (`createConstructionSite(STRUCTURE_LINK)` auf den acht Nachbarfeldern der
 * eigenen Position). Nimmt **kein** Feld den Link an, lief die Schleife früher
 * durch, ohne `onPosition` zu setzen — der Miner wiederholte daraufhin
 * Quellensuche und Bauanfragen in **jedem** weiteren Tick seines Lebens. Im
 * Spiel gemessen: elf von fünfzehn Minern kosteten 0,01–0,06 CPU, vier davon
 * (ohne Link) 0,14–0,39.
 *
 * Die gestellte Welt ist bewusst klein und eigenständig (wie
 * `controller-link-planner.test.ts`): ein eigenes `RoomPosition` mit
 * `findInRange`/`createConstructionSite`/`findClosestByRange`, dazu Quelle,
 * Container und Miner-Creep als einfache Objekte. `creep-stubs.ts` /
 * `movement-stubs.ts` werden hier nicht gebraucht — der Miner ruft
 * `moveByMemory` in keinem der geprüften Zweige auf (überall steht der Creep
 * schon auf seinem Zielfeld), ein Pfad-Stub wäre also ungenutzter Ballast.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals, resetWorld } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

interface StructureStub {
  id?: string;
  pos: any;
  structureType?: string;
  store?: any;
  hits?: number;
  hitsMax?: number;
  progress?: number;
  progressTotal?: number;
  [key: string]: any;
}

/** Registrierte Strukturen/Baustellen, gefunden über `pos.findInRange`/`lookFor`. */
let structures: StructureStub[] = [];
let sites: StructureStub[] = [];

/** Wandfelder, geprüft über `pos.lookFor(LOOK_TERRAIN)`. */
let wallCells = new Set<string>();

/** Objekte, die `Game.getObjectById` findet. */
let objectsById = new Map<string, any>();

/** Aufzeichnungen der teuren Aufrufe, um die es in dieser Runde ging. */
let createConstructionSiteCalls: Array<{ x: number; y: number; roomName: string; structureType: string }> = [];
let findClosestByRangeCalls: number[] = [];
/** `lookFor(LOOK_STRUCTURES)`-Aufrufe: der Beleg dafür, dass ohne Containerbezug nicht nachgesehen wird. */
let lookForStructuresCalls: Array<{ x: number; y: number }> = [];

/** Ergebnis, das der nächste `createConstructionSite`-Aufruf liefert. */
let createConstructionSiteResult: number = 0;
/** Ergebnis, das der nächste `findClosestByRange`-Aufruf liefert. */
let findClosestByRangeResult: any = null;

let installed = false;

/** Legt die Miner-Welt an: eigenes `RoomPosition`, `Game.getObjectById`. */
function installMinerWorld(): void {
  installGlobals();

  if (!installed) {
    installed = true;

    anyGlobal.RoomPosition = class RoomPositionStub {
      constructor(
        public x: number,
        public y: number,
        public roomName: string,
      ) {}

      findInRange(type: number, range: number, opts?: { filter?: any }): StructureStub[] {
        const pool = type === FIND_STRUCTURES ? structures : type === FIND_CONSTRUCTION_SITES ? sites : [];
        const within = pool.filter(
          item => Math.max(Math.abs(item.pos.x - this.x), Math.abs(item.pos.y - this.y)) <= range,
        );
        return applyFindFilter(within, opts?.filter);
      }

      createConstructionSite(structureType: string): number {
        createConstructionSiteCalls.push({ x: this.x, y: this.y, roomName: this.roomName, structureType });
        return createConstructionSiteResult;
      }

      findClosestByRange(type: number): any {
        findClosestByRangeCalls.push(type);
        return findClosestByRangeResult;
      }

      lookFor(type: string): unknown[] {
        if (type === LOOK_TERRAIN) {
          return [wallCells.has(`${this.x},${this.y}`) ? "wall" : "plain"];
        }
        if (type === LOOK_STRUCTURES) {
          lookForStructuresCalls.push({ x: this.x, y: this.y });
          return structures.filter(
            item => item.pos.x === this.x && item.pos.y === this.y && item.pos.roomName === this.roomName,
          );
        }
        return [];
      }
    };
  }

  resetMinerWorld();
}

/**
 * Wendet einen `find`-Filter an, wie ihn die echte API kennt: entweder eine
 * Funktion, oder ein Objekt-Shorthand (`{ structureType: STRUCTURE_LINK }`).
 * `miner.ts` benutzt beide Formen — `Array.prototype.filter` mit einem Objekt
 * statt einer Funktion würde sofort werfen, auch bei leerem Array.
 */
function applyFindFilter(items: StructureStub[], filter: any): StructureStub[] {
  if (!filter) return items.slice();
  if (typeof filter === "function") return items.filter(filter);
  return items.filter(item => Object.entries(filter).every(([key, value]) => item[key] === value));
}

/** Leert Welt und Aufzeichnungen, ohne `Game`/`Memory` zu ersetzen. */
function resetMinerWorld(): void {
  resetWorld();
  structures = [];
  sites = [];
  wallCells = new Set();
  objectsById.clear();
  createConstructionSiteCalls = [];
  findClosestByRangeCalls = [];
  lookForStructuresCalls = [];
  createConstructionSiteResult = OK;
  findClosestByRangeResult = null;
  anyGlobal.Game.getObjectById = (id: string) => objectsById.get(id) ?? null;
}

function registerObject<T extends { id: string }>(object: T): T {
  objectsById.set(object.id, object);
  return object;
}

/** Markiert ein Feld als Wand für `pos.lookFor(LOOK_TERRAIN)`. */
function markWall(x: number, y: number): void {
  wallCells.add(`${x},${y}`);
}

function pos(x: number, y: number, roomName = ROOM): any {
  return new anyGlobal.RoomPosition(x, y, roomName);
}

/** Eine Quelle, registriert für `Game.getObjectById`. */
function stubMinerSource(id: string, x: number, y: number, extra: Record<string, any> = {}) {
  return registerObject({ id, pos: pos(x, y), energy: 1500, ...extra });
}

/** Ein Container neben der Quelle, sowohl als Struktur auffindbar als auch per Id. */
function stubMinerContainer(id: string, x: number, y: number, overrides: Partial<StructureStub> = {}) {
  const container = registerObject({
    id,
    structureType: STRUCTURE_CONTAINER,
    pos: pos(x, y),
    hits: 250000,
    hitsMax: 250000,
    store: { getUsedCapacity: () => 500, getFreeCapacity: () => 1500 },
    ...overrides,
  });
  structures.push(container);
  return container;
}

/**
 * Ein Container, der auf dem Feld liegt (per `lookFor(LOOK_STRUCTURES)`
 * auffindbar), aber **nicht** über `Game.getObjectById` — genau der Fall einer
 * fertig gewordenen Baustelle, die eine neue Id bekommen hat, während die alte
 * (die Baustellen-Id) noch in `creep.memory.container` steht.
 */
function placeContainerOnTile(id: string, x: number, y: number, overrides: Partial<StructureStub> = {}) {
  const container: StructureStub = {
    id,
    structureType: STRUCTURE_CONTAINER,
    pos: pos(x, y),
    hits: 250000,
    hitsMax: 250000,
    store: { getUsedCapacity: () => 500, getFreeCapacity: () => 1500 },
    ...overrides,
  };
  structures.push(container);
  return container;
}

async function loadMiner(): Promise<typeof import("../src/roles/miner")> {
  installMinerWorld();
  return await import("../src/roles/miner");
}

/** Ein Miner-Creep, wie ihn `Miner._spawn` erzeugt, plus optionalem Zusatz-Memory. */
function stubMinerCreep(x: number, y: number, memory: Record<string, any>, controller: { my?: boolean; level: number }) {
  const creep: any = {
    name: "miner_1",
    pos: pos(x, y),
    body: [] as unknown[],
    memory,
    room: {
      name: memory.workroom ?? ROOM,
      controller: { my: controller.my ?? true, level: controller.level },
    },
    store: { getFreeCapacity: () => 50, getUsedCapacity: () => 0 },
    say: () => undefined,
    harvest: (target: any) => {
      harvestCalls.push(target);
      return harvestResult;
    },
    withdraw: (target: any) => {
      withdrawCalls.push(target);
      return OK;
    },
    transfer: (target: any) => {
      transferCalls.push(target);
      return OK;
    },
    build: (target: any) => {
      buildCalls.push(target);
      return OK;
    },
    repair: (target: any) => {
      repairCalls.push(target);
      return OK;
    },
    suicide: () => undefined,
  };
  return creep;
}

let harvestCalls: any[] = [];
let withdrawCalls: any[] = [];
let transferCalls: any[] = [];
let buildCalls: any[] = [];
let repairCalls: any[] = [];
// Literal statt `OK`: dieser Modulcode läuft schon beim Import, bevor der
// erste Test `installMinerWorld()` aufgerufen und damit die Globals angelegt
// hat — `OK` wäre an dieser Stelle noch nicht definiert.
let harvestResult = 0;

test.beforeEach(() => {
  harvestCalls = [];
  withdrawCalls = [];
  transferCalls = [];
  buildCalls = [];
  repairCalls = [];
  harvestResult = 0;
});

test("kein Platz für den Link heißt trotzdem Standplatz", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4);
  stubMinerContainer("container1", 5, 5);

  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    container: "container1",
    mineEnergy: true,
    notfall: false,
    onPosition: false,
    pos: { x: 5, y: 5, roomName: ROOM },
  }, { my: true, level: 6 });

  // Jedes Feld lehnt den Link ab — Linkkontingent des Raums erschöpft.
  createConstructionSiteResult = ERR_RCL_NOT_ENOUGH;

  miner.doJob(creep);

  assert.equal(creep.memory.onPosition, true, "der Miner nimmt seinen Platz trotzdem ein");
  assert.equal(createConstructionSiteCalls.length, 8, "alle acht Nachbarfelder wurden versucht");
  assert.ok(
    createConstructionSiteCalls.every(call => call.structureType === STRUCTURE_LINK),
    "versucht wurde ausschließlich ein Link",
  );
  assert.equal(creep.memory.link, undefined, "kein Link wurde gefunden oder gebaut");
});

test("der Creep bleibt über mehrere Ticks hinweg billig, auch bei einem Vielfachen von 100", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4);

  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    mineEnergy: true,
    notfall: false,
    onPosition: true,
  }, { my: true, level: 6 });

  // Ohne Interval-Wiederbewertung darf gar kein Tick mehr etwas Teures auslösen —
  // ausdrücklich auch nicht bei einem Vielfachen von 100, das früher den
  // Rebewertungs-Zweig auslöste.
  for (const time of [1001, 1050, 1100, 1101, 1200]) {
    anyGlobal.Game.time = time;
    miner.doJob(creep);
  }

  assert.equal(createConstructionSiteCalls.length, 0, "keine weitere Bauanfrage über alle Ticks hinweg");
  assert.equal(findClosestByRangeCalls.length, 0, "keine Pfad-/Positionssuche über alle Ticks hinweg");
  assert.equal(creep.memory.onPosition, true, "onPosition bleibt durchgehend gesetzt");
});

test("ein frischer Miner ohne onPosition nimmt den Standortversuch von selbst wieder auf", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4);
  stubMinerContainer("container1", 5, 5);

  // Genau das Memory, das `Miner._spawn` setzt — kein `onPosition`, kein `pos`.
  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    mineEnergy: true,
    notfall: false,
  }, { my: true, level: 6 });

  createConstructionSiteResult = ERR_RCL_NOT_ENOUGH;

  miner.doJob(creep);

  assert.equal(creep.memory.container, "container1", "der Container wird über die Quelle gefunden");
  assert.equal(createConstructionSiteCalls.length, 8, "der frische Miner versucht den Link erneut");
  assert.equal(creep.memory.onPosition, true, "und nimmt am Ende trotzdem seinen Platz ein");
});

test("ein vorhandener Link beendet die Suche sofort", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4);
  stubMinerContainer("container1", 5, 5);
  structures.push({ id: "link1", structureType: STRUCTURE_LINK, pos: pos(5, 6) });

  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    container: "container1",
    mineEnergy: true,
    notfall: false,
    onPosition: false,
    pos: { x: 5, y: 5, roomName: ROOM },
  }, { my: true, level: 6 });

  miner.doJob(creep);

  assert.equal(creep.memory.link, "link1");
  assert.equal(creep.memory.onPosition, true);
  assert.equal(createConstructionSiteCalls.length, 0, "ohne Bauanfrage, der Link steht schon");
});

test("die Quelle kommt aus dem Memory, ohne erneute Suche", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4);

  // RCL unter 4: nimmt den einfachen Rückweg, ohne die Link-Logik zu berühren.
  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    mineEnergy: true,
    notfall: false,
    onPosition: false,
    pos: { x: 5, y: 5, roomName: ROOM },
  }, { my: true, level: 3 });

  miner.doJob(creep);

  assert.equal(findClosestByRangeCalls.length, 0, "das gemerkte Objekt wird gefunden, keine Suche nötig");
  assert.equal(creep.memory.source, "source1");
  assert.equal(harvestCalls.length, 1);
  assert.equal(harvestCalls[0]!.id, "source1", "geerntet wird das Objekt aus dem Memory");
});

test("trägt die gemerkte Id nicht mehr, greift der Rückfall über findClosestByRange", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  // "source1" wird bewusst NICHT registriert — Game.getObjectById liefert null.
  const fallbackSource = { id: "fallback1", energy: 1500 };
  findClosestByRangeResult = fallbackSource;

  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    mineEnergy: true,
    notfall: false,
    onPosition: false,
    pos: { x: 5, y: 5, roomName: ROOM },
  }, { my: true, level: 3 });

  miner.doJob(creep);

  assert.deepEqual(findClosestByRangeCalls, [FIND_SOURCES], "Rückfall sucht per Entfernung, nicht per Weg");
  assert.equal(creep.memory.source, "fallback1", "die neu gefundene Quelle wird gemerkt");
  assert.equal(harvestCalls[0]!.id, "fallback1");
});

test("kein Feld nimmt eine Containerbaustelle an: der Miner stellt sich trotzdem hin, ohne einen Container zu merken", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  // Quelle bei (5,4); die acht Nachbarfelder in Erzeugungsreihenfolge:
  // (4,3) (4,4) (4,5) (5,3) (5,5) (6,3) (6,4) (6,5). Die ersten beiden sind
  // Wand, (4,5) ist das erste freie Feld — das muss die Wahl sein.
  stubMinerSource("source1", 5, 4);
  markWall(4, 3);
  markWall(4, 4);

  // Kein Feld nimmt die Containerbaustelle an — weder leer (ERR_FULL) noch
  // voll, sondern schlicht besetzt (ERR_INVALID_TARGET): die Schleife läuft
  // komplett durch, statt beim ersten Fehlschlag abzubrechen.
  createConstructionSiteResult = ERR_INVALID_TARGET;

  // Frisches Memory: kein `pos`, kein `container` — der Miner ist noch nie
  // hier gewesen.
  const creep = stubMinerCreep(5, 4, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    mineEnergy: true,
    notfall: false,
  }, { my: true, level: 6 });

  miner.doJob(creep);

  assert.equal(createConstructionSiteCalls.length, 8, "alle acht Nachbarfelder wurden versucht");
  assert.deepEqual(
    [creep.memory.pos.x, creep.memory.pos.y],
    [4, 5],
    "das erste Feld ohne Wandterrain wird der Standplatz",
  );
  assert.equal(creep.memory.container, undefined, "kein Container gemerkt — hier wurde nur nachgesehen");
});

test("fertig gewordene Baustelle: die neue Id des Containers wird nachgezogen", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4, { energy: 1500 });
  // Auf dem Feld des Creeps steht der fertige Container — mit einer anderen
  // Id als der Baustellen-Id, die noch im Memory steht.
  placeContainerOnTile("newContainerId", 5, 5);

  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    container: "oldSiteId", // trägt nicht mehr: Game.getObjectById liefert null
    mineEnergy: true,
    notfall: false,
    onPosition: true,
  }, { my: true, level: 6 });

  miner.doJob(creep);

  assert.equal(creep.memory.container, "newContainerId", "die neue Id wird übernommen");
  assert.equal(creep.memory.onPosition, true, "der Standplatz bleibt gültig");
  assert.equal(harvestCalls.length, 1, "der Miner arbeitet in diesem Tick ganz normal weiter");
});

test("Container verschwunden: Standplatz wird verworfen, der nächste Tick führt wieder zu einem Standplatz", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4, { energy: 1500 });
  // Nichts steht auf dem Feld des Creeps — der Container ist ersatzlos weg.

  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    container: "oldSiteId", // trägt nicht mehr, und auch sonst nichts gefunden
    mineEnergy: true,
    notfall: false,
    onPosition: true,
  }, { my: true, level: 6 });

  miner.doJob(creep);

  assert.equal(creep.memory.container, undefined, "der Containerbezug wird verworfen");
  assert.equal(creep.memory.onPosition, false, "der Standplatz gilt nicht mehr");
  assert.equal(harvestCalls.length, 0, "der Tick endet mit dem Verwerfen, es wird nicht mehr geerntet");

  // Nächster Tick: keine Wände in der Nähe der Quelle — der Setup-Zweig muss
  // von selbst wieder zu einem Standplatz führen, statt untätig zu bleiben.
  createConstructionSiteResult = ERR_INVALID_TARGET;
  miner.doJob(creep);

  assert.equal(createConstructionSiteCalls.length, 8, "der Setup-Zweig läuft im nächsten Tick erneut komplett");
  assert.notEqual(creep.memory.pos, undefined, "und findet wieder einen Standplatz, statt untätig zu bleiben");
  assert.equal(creep.memory.container, undefined, "weiterhin kein Container gemerkt");
});

test("ohne Containerbezug wird nicht nachgesehen", async () => {
  const { Miner } = await loadMiner();
  const miner = new Miner();

  stubMinerSource("source1", 5, 4, { energy: 1500 });

  const creep = stubMinerCreep(5, 5, {
    role: "miner",
    workroom: ROOM,
    home: ROOM,
    source: "source1",
    // Kein `container` im Memory — das ist der Fall aus Punkt 1: hier wurde
    // schon einmal nachgesehen, es gibt keinen.
    mineEnergy: true,
    notfall: false,
    onPosition: true,
  }, { my: true, level: 6 });

  miner.doJob(creep);

  assert.equal(lookForStructuresCalls.length, 0, "ohne gemerkte Id gibt es keine Suche auf dem eigenen Feld");
  assert.equal(creep.memory.container, undefined);
  assert.equal(creep.memory.onPosition, true, "der Standplatz bleibt unangetastet");
  assert.equal(harvestCalls.length, 1, "der Miner arbeitet trotzdem ganz normal weiter");
});
