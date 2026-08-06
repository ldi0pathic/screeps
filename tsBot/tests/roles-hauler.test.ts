/**
 * Prüft die Rolle "hauler" (`src/roles/hauler.ts`) und das neue Tor in
 * `Debitor.spawn` (`src/roles/debitor.ts`), mit denen sich die beiden Rollen
 * die Logistik im Heimatraum teilen (Plan 10, `docs/plans/10-logistikrollen.md`,
 * Runde 3).
 *
 * Der Hauler fährt den kurzen Weg Quellcontainer → Storage und übernimmt damit
 * den containergebundenen Debitor für `home == workroom`. Der Debitor bleibt
 * der Remote-Hauler und der Allrounder für Räume **ohne** Storage — die
 * Zuständigkeiten schließen sich gegenseitig aus, das ist der Gegenstand der
 * Tests am Dateiende.
 *
 * Weltaufbau in zwei Teilen, weil `doJob` und `spawn` unterschiedliche Stubs
 * brauchen:
 *
 * - `doJob` läuft über die Beschaffungs-/Ablieferketten aus `creep/base.ts` und
 *   `creep/transport.ts` — dafür passt `tests/support/creep-stubs.ts`
 *   (`stubActor`, `stubStructure`, …) unverändert, wie in
 *   `tests/creep-harvest.test.ts` und `tests/creep-transport.test.ts`. Ergänzt
 *   wird nur `checkHarvest`: dessen echte Logik kommt aus
 *   `installCreepChecks()` (`src/prototypes/creep-checks.ts`), gebunden an
 *   jeden Test-Creep, statt sie hier ein zweites Mal nachzubauen.
 * - `spawn` braucht `source.pos.findInRange` und `container.pos.findInRange`
 *   für die Container-/Link-Suche — dafür genügen, wie in
 *   `tests/roles-miner.test.ts`, einfache Objektliteral-Positionen mit genau
 *   dieser einen Methode; die globale `RoomPosition` aus `movement-stubs.ts`
 *   wird dafür nicht gebraucht.
 *
 * `_.filter` ist im Spiel global (lodash); hier reicht ein minimaler lokaler
 * Ersatz auf `Object.values`, weil `Game.creeps` ein Objekt und kein Array ist.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installCreepChecks } from "../src/prototypes/creep-checks";
import {
  actionCalls,
  configureRoom,
  installCreepWorld,
  registerObject,
  roomMemory,
  stubActor,
  stubRoom,
  stubStore,
  stubStructure,
} from "./support/creep-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

/** Eine Nachbarstruktur, wie sie `source.pos.findInRange`/`container.pos.findInRange` liefern. */
interface NearbyStub {
  id: string;
  structureType: string;
  pos: { findInRange(type: number, range: number, opts?: { filter?: any }): NearbyStub[] };
}

/** Wendet den `find`-Filter an, den `hauler.ts`/`debitor.ts` benutzen: ein Objekt-Shorthand. */
function applyStructureFilter(items: NearbyStub[], filter: any): NearbyStub[] {
  if (!filter) return items.slice();
  if (typeof filter === "function") return items.filter(filter);
  return items.filter(item => Object.entries(filter).every(([key, value]) => (item as any)[key] === value));
}

/** Eine Position, deren `findInRange` ausschließlich aus `neighbors` antwortet. */
function makePos(neighbors: NearbyStub[]): NearbyStub["pos"] {
  return {
    findInRange(type: number, _range: number, opts?: { filter?: any }): NearbyStub[] {
      if (type !== FIND_STRUCTURES) return [];
      return applyStructureFilter(neighbors, opts?.filter);
    },
  };
}

/**
 * Eine Energiequelle, registriert für `Game.getObjectById`. Optional mit einem
 * Container daneben, optional mit einem Link neben dem Container — genau die
 * beiden Funde, die `Hauler._spawn`/`Debitor._spawn` per `findInRange` machen.
 */
function stubHaulerSource(id: string, containerId?: string, linkId?: string) {
  const containerNeighbors: NearbyStub[] = linkId
    ? [{ id: linkId, structureType: STRUCTURE_LINK, pos: makePos([]) }]
    : [];

  const sourceNeighbors: NearbyStub[] = containerId
    ? [{ id: containerId, structureType: STRUCTURE_CONTAINER, pos: makePos(containerNeighbors) }]
    : [];

  const source = { id, pos: makePos(sourceNeighbors) };
  registerObject(source as any);
  return source;
}

interface SpawnCallRecord {
  name: string;
  body: unknown[];
  memory: Record<string, any> | undefined;
  dryRun: boolean;
}

/** Alle `spawnCreep`-Aufrufe seit dem letzten `installHaulerWorld()`. */
const spawnCalls: SpawnCallRecord[] = [];

/** Nur die tatsächlichen Spawns, ohne den vorausgehenden `dryRun`-Testaufruf. */
function realSpawnCalls(): SpawnCallRecord[] {
  return spawnCalls.filter(call => !call.dryRun);
}

/** Ein `StructureSpawn`-Stub mit Raum, optionalem Storage und mitschreibendem `spawnCreep`. */
function stubSpawn(
  roomName: string,
  options: { storage?: any; energyCapacityAvailable?: number; controller?: any } = {},
) {
  return {
    room: {
      name: roomName,
      storage: options.storage,
      controller: options.controller,
      energyCapacityAvailable: options.energyCapacityAvailable ?? 550,
    },
    spawnCreep(body: unknown[], name: string, opts: any = {}): number {
      spawnCalls.push({ name, body, memory: opts.memory, dryRun: Boolean(opts.dryRun) });
      return OK;
    },
  };
}

let creepChecksInstalled = false;

/** Legt die Welt an: Creep-Stubs, echtes `checkHarvest`, `_.filter`, `logWorkroom`. */
function installHaulerWorld(): void {
  installCreepWorld();

  // `installCreepChecks()` schreibt auf `Creep.prototype` — die Klasse muss also
  // existieren, bevor sie aufgerufen wird. Ein leerer Konstruktor genügt, die
  // Test-Creeps bekommen ihre Eigenschaften ohnehin über `stubActor`.
  if (!anyGlobal.Creep) {
    anyGlobal.Creep = function CreepStub(this: unknown) {
      /* leer */
    };
  }
  if (!creepChecksInstalled) {
    installCreepChecks();
    creepChecksInstalled = true;
  }

  anyGlobal._ = {
    filter: (collection: Record<string, any>, predicate: (item: any) => boolean) =>
      Object.values(collection).filter(predicate),
  };

  // `Debitor._spawn` loggt darüber; im laufenden Bot kommt es aus `config.ts`.
  anyGlobal.logWorkroom = () => undefined;

  spawnCalls.length = 0;
}

/** Ein Hauler-Creep mit dem echten `checkHarvest` aus dem Prototyp gebunden. */
function stubHaulerCreep(
  x: number,
  y: number,
  roomName: string,
  memory: Record<string, any>,
  options: { store?: ReturnType<typeof stubStore>; room?: ReturnType<typeof stubRoom>; closest?: Record<number, unknown[]> } = {},
) {
  const creep = stubActor(x, y, roomName, {
    memory,
    store: options.store,
    room: options.room,
    closest: options.closest,
  });
  creep.checkHarvest = anyGlobal.Creep.prototype.checkHarvest.bind(creep);
  return creep;
}

async function loadHauler(): Promise<{ Hauler: typeof import("../src/roles/hauler").Hauler }> {
  installHaulerWorld();
  const mod = await import("../src/roles/hauler");
  return { Hauler: mod.Hauler };
}

async function loadRoles(): Promise<{
  Hauler: typeof import("../src/roles/hauler").Hauler;
  Debitor: typeof import("../src/roles/debitor").Debitor;
}> {
  installHaulerWorld();
  const haulerMod = await import("../src/roles/hauler");
  const debitorMod = await import("../src/roles/debitor");
  return { Hauler: haulerMod.Hauler, Debitor: debitorMod.Debitor };
}

// --- doJob -------------------------------------------------------------

test("doJob: geholt wird aus dem eigenen Container, nicht per Suche", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  stubStructure("container1", STRUCTURE_CONTAINER, 12, 10, ROOM, stubStore(2000, { energy: 500 }));

  const creep = stubHaulerCreep(
    10,
    10,
    ROOM,
    { role: "hauler", workroom: ROOM, home: ROOM, container: "container1", mineral: "energy", harvest: true },
    { store: stubStore(500, { energy: 100 }) },
  );

  hauler.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "withdraw", targetId: "container1", resource: "energy" }]);
  assert.equal(creep.memory.fromId, "container1");
});

test("doJob: abgeliefert wird ins Storage", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));

  const creep = stubHaulerCreep(
    10,
    10,
    ROOM,
    { role: "hauler", workroom: ROOM, home: ROOM, container: "container1", mineral: "energy", harvest: false },
    { store: stubStore(500, { energy: 500 }), room: stubRoom(ROOM, { storage }) },
  );

  hauler.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "transfer", targetId: "storage", resource: "energy" }]);
});

test("doJob: Notventil bei aktivPrioSpawn liefert direkt an Spawn/Extension statt ans Storage", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, { aktivPrioSpawn: true });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  const spawnStructure = stubStructure("spawn1", STRUCTURE_SPAWN, 20, 20, ROOM, stubStore(300, { energy: 0 }));
  const extension = stubStructure("ext1", STRUCTURE_EXTENSION, 21, 20, ROOM, stubStore(200, { energy: 0 }));

  const creep = stubHaulerCreep(
    10,
    10,
    ROOM,
    { role: "hauler", workroom: ROOM, home: ROOM, container: "container1", mineral: "energy", harvest: false },
    {
      store: stubStore(500, { energy: 500 }),
      room: stubRoom(ROOM, { storage }),
      closest: { [FIND_MY_STRUCTURES]: [spawnStructure, extension] },
    },
  );

  hauler.doJob(creep);

  assert.equal(actionCalls[0]!.targetId, "spawn1", "die Ladung geht direkt an den Spawn, nicht ans Storage");
});

test("doJob: ohne aktivPrioSpawn bleibt es beim Storage, auch wenn Spawn/Extension Platz hätten", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, { aktivPrioSpawn: false });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  const spawnStructure = stubStructure("spawn1", STRUCTURE_SPAWN, 20, 20, ROOM, stubStore(300, { energy: 0 }));

  const creep = stubHaulerCreep(
    10,
    10,
    ROOM,
    { role: "hauler", workroom: ROOM, home: ROOM, container: "container1", mineral: "energy", harvest: false },
    {
      store: stubStore(500, { energy: 500 }),
      room: stubRoom(ROOM, { storage }),
      closest: { [FIND_MY_STRUCTURES]: [spawnStructure] },
    },
  );

  hauler.doJob(creep);

  assert.equal(actionCalls[0]!.targetId, "storage");
});

// --- spawn ---------------------------------------------------------------

test("spawn: nur der eigene Raum", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1");

  const spawnInAnotherRoom = stubSpawn("E58N7", { storage });

  assert.equal(hauler.spawn(spawnInAnotherRoom as any, ROOM), false);
  assert.equal(realSpawnCalls().length, 0);
});

test("spawn: ohne Storage kein Hauler, auch auf RCL4 nicht — die Bedingung hängt am Bauwerk, nicht am RCL", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  stubHaulerSource("source1", "container1");

  // RCL4, aber kein Storage im Raum.
  const spawnStub = stubSpawn(ROOM, { controller: { my: true, level: 4 } });

  assert.equal(hauler.spawn(spawnStub as any, ROOM), false);
  assert.equal(realSpawnCalls().length, 0);
});

test("spawn: ohne sendDebitor kein Hauler", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: false, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1");

  assert.equal(hauler.spawn(stubSpawn(ROOM, { storage }) as any, ROOM), false);
});

test("spawn: ohne sendMiner kein Hauler", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: false, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1");

  assert.equal(hauler.spawn(stubSpawn(ROOM, { storage }) as any, ROOM), false);
});

test("spawn: eine Quelle ohne Container bekommt keinen Hauler", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1"); // kein Container daneben

  assert.equal(hauler.spawn(stubSpawn(ROOM, { storage }) as any, ROOM), false);
  assert.equal(realSpawnCalls().length, 0);
});

test("spawn: zwei Quellen mit je einem Container ergeben zwei Hauler mit je eigener Container-Id", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1", "source2"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1");
  stubHaulerSource("source2", "container2");
  const spawnStub = stubSpawn(ROOM, { storage });

  assert.equal(hauler.spawn(spawnStub as any, ROOM), true);
  const firstContainerId = realSpawnCalls()[0]!.memory!.container;
  assert.ok(
    firstContainerId === "container1" || firstContainerId === "container2",
    "der erste Hauler bekommt einen der beiden Container",
  );

  // Der gerade gespawnte Hauler lebt im echten Bot erst ab dem nächsten Tick —
  // für den Zähler in `_spawn` genügt es, ihn hier direkt einzutragen.
  anyGlobal.Game.creeps["hauler_new"] = {
    memory: { role: "hauler", workroom: ROOM, container: firstContainerId },
    ticksToLive: 1500,
  };

  assert.equal(hauler.spawn(spawnStub as any, ROOM), true);
  const secondContainerId = realSpawnCalls()[1]!.memory!.container;
  assert.notEqual(secondContainerId, firstContainerId, "der zweite Hauler bekommt den jeweils anderen Container");
});

test("spawn: ein lebender Hauler an einem Container verhindert den zweiten dort", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1");

  anyGlobal.Game.creeps["hauler_alive"] = {
    memory: { role: "hauler", workroom: ROOM, container: "container1" },
    ticksToLive: 1500,
  };

  assert.equal(hauler.spawn(stubSpawn(ROOM, { storage }) as any, ROOM), false);
  assert.equal(realSpawnCalls().length, 0);
});

test("spawn: ein Hauler mit ticksToLive <= 100 zählt nicht mehr mit", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1");

  anyGlobal.Game.creeps["hauler_dying"] = {
    memory: { role: "hauler", workroom: ROOM, container: "container1" },
    ticksToLive: 100,
  };

  assert.equal(hauler.spawn(stubSpawn(ROOM, { storage }) as any, ROOM), true, "der sterbende Hauler blockiert nicht mehr");
  assert.equal(realSpawnCalls()[0]!.memory!.container, "container1");
});

test("spawn: ein Link mit sendendem Linknetz schaltet den Hauler für diese Quelle ab", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  const memory = roomMemory(ROOM, { links: { spawn: "storage-link", sender: [] } });
  registerObject({ id: "storage-link" } as any);
  anyGlobal.Game.rooms[ROOM] = { controller: { my: true, level: 6 } };

  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1", "source-link1");

  assert.equal(hauler.spawn(stubSpawn(ROOM, { storage }) as any, ROOM), false);
  assert.equal(realSpawnCalls().length, 0);
  assert.equal(memory.hasLinks, true, "der Fund des Links wird gemerkt, obwohl der Hauler ausbleibt");
});

test("spawn: ein Link ohne Storage-Empfänger schaltet den Hauler NICHT ab (die wichtigere Richtung)", async () => {
  const { Hauler } = await loadHauler();
  const hauler = new Hauler();

  const memory = roomMemory(ROOM, {});
  // Der Raum nutzt Links (RCL 6), aber die Linkliste hat noch keinen
  // Storage-Empfänger — der Bau des Empfängers hinkt dem des Quell-Links
  // typischerweise Tage hinterher.
  anyGlobal.Game.rooms[ROOM] = { controller: { my: true, level: 6 } };

  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1", "source-link1");

  assert.equal(
    hauler.spawn(stubSpawn(ROOM, { storage }) as any, ROOM),
    true,
    "ohne Empfänger am Storage bliebe die Energie sonst im Quell-Link liegen",
  );
  assert.equal(realSpawnCalls()[0]!.memory!.container, "container1");
  assert.equal(memory.hasLinks, true, "der Fund des Links wird trotzdem gemerkt");
});

// --- Zuständigkeitsgrenze zwischen hauler und debitor --------------------

test("Zuständigkeitsgrenze: mit Storage übernimmt der Hauler, der Debitor steigt aus", async () => {
  const { Hauler, Debitor } = await loadRoles();
  const hauler = new Hauler();
  const debitor = new Debitor();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 25, 25, ROOM, stubStore(100000));
  stubHaulerSource("source1", "container1");
  const spawnStub = stubSpawn(ROOM, { storage });

  assert.equal(hauler.spawn(spawnStub as any, ROOM), true, "der Hauler übernimmt die Quelle");
  assert.equal(debitor.spawn(spawnStub as any, ROOM), false, "der Debitor bleibt für den Heimatraum mit Storage untätig");
});

test("Zuständigkeitsgrenze: ohne Storage bleibt der Debitor zuständig, der Hauler steigt aus", async () => {
  const { Hauler, Debitor } = await loadRoles();
  const hauler = new Hauler();
  const debitor = new Debitor();

  roomMemory(ROOM, {});
  configureRoom(ROOM, { sendDebitor: true, sendMiner: true, energySources: ["source1"] });
  stubHaulerSource("source1", "container1");
  const spawnStub = stubSpawn(ROOM, {}); // kein Storage

  assert.equal(hauler.spawn(spawnStub as any, ROOM), false, "ohne Storage ist der Hauler nicht zuständig");
  assert.equal(debitor.spawn(spawnStub as any, ROOM), true, "der Debitor übernimmt stattdessen als Allrounder");
});
