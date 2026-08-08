/**
 * Prüft die Rolle "collector" (`src/roles/collector.ts`).
 *
 * Sie schließt die Lücke, die Plan 10 gerissen hat: seit `filler` und `hauler`
 * den Heimatraum-Debitor ersetzt haben, holt niemand mehr Mineralien aus dem
 * Storage, sammelt Gefallenes auf oder hält Energie im Terminal — der Code dafür
 * lebte noch im Debitor, der in Räumen mit Storage aber nicht mehr spawnt.
 *
 * Die Sammelstufen sind nach **Verfallsgeschwindigkeit** sortiert; genau das
 * prüfen die Reihenfolgetests. `doJob` ruft `creep.checkHarvest()` — den
 * Prototyp aus `prototypes/creep-checks.ts` —, deshalb wird er wie in
 * `tests/roles-filler.test.ts` direkt auf jeden Test-Creep kopiert.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installCreepChecks } from "../src/prototypes/creep-checks";
import { position } from "./support/movement-stubs";
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

let collectorWorldInstalled = false;

/** Legt die Welt an: `Creep`, `installCreepChecks()`, ein minimales `_`. */
function installCollectorWorld(): void {
  installCreepWorld();

  if (!collectorWorldInstalled) {
    collectorWorldInstalled = true;

    anyGlobal.Creep = function (this: any) {};
    installCreepChecks();

    anyGlobal._ = {
      filter<T>(collection: Record<string, T> | T[], predicate: (item: T) => boolean): T[] {
        const values = Array.isArray(collection) ? collection : Object.values(collection);
        return values.filter(predicate);
      },
    };
  }
}

async function loadCollector(): Promise<typeof import("../src/roles/collector")> {
  installCollectorWorld();
  return await import("../src/roles/collector");
}

/** Kopiert `checkHarvest` direkt auf den Test-Creep — siehe Dateikopf. */
function addCheckHarvest<T>(creep: T): T {
  (creep as any).checkHarvest = anyGlobal.Creep.prototype.checkHarvest;
  return creep;
}

// --- Sammeln: Reihenfolge nach Verfall -----------------------------------------

test("Tombstones kommen vor allem anderen — sie zerfallen und nehmen den Inhalt mit", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  // Ein Grabstein ist keine Struktur, deshalb kein `stubStructure`: er braucht
  // nur Id, Store und Position, und `Game.getObjectById` muss ihn finden.
  const tombstone = registerObject({
    id: "tombstone",
    store: stubStore(500, { [RESOURCE_ENERGY]: 300 }),
    pos: position(10, 10, ROOM),
  } as any);

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { O: 5000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: 50000 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
      closest: { [FIND_TOMBSTONES]: [tombstone] },
    }),
  );

  collector.doJob(creep);

  assert.equal(actionCalls.length > 0, true, "es wurde etwas getan");
  assert.equal(
    actionCalls[0]!.targetId,
    "tombstone",
    "der Grabstein wird vor dem Storage bedient — er verfaellt, das Mineral im Storage nicht",
  );
});

test("ohne Tombstone und ohne Drop wird die verkaufbare Ressource aus dem Storage geholt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { O: 5000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: 50000 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(actionCalls.some(call => call.targetId === "storage" && call.resource === "O"), true);
});

test("eine Ressource auf der NEVER_SELL-Liste wird nicht aus dem Storage geholt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  // `power` steht auf der Liste, `energy` ohnehin — es bleibt nichts zu holen.
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { power: 5000, [RESOURCE_ENERGY]: 500000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: 50000 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.resource === "power"),
    false,
    "power steht auf NEVER_SELL und wird nicht angefasst",
  );
});

// --- Energiedeckung im Terminal ------------------------------------------------

test("liegt zu wenig Energie im Terminal, holt der Collector welche aus dem Storage", async () => {
  const { Collector, TERMINAL_ENERGY_TARGET } = await loadCollector();
  const collector = new Collector();

  // Kein Mineral im Storage: die Energiestufe ist die einzige, die greifen kann.
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { [RESOURCE_ENERGY]: 500000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: TERMINAL_ENERGY_TARGET - 1 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.targetId === "storage" && call.resource === RESOURCE_ENERGY),
    true,
  );
});

test("liegt genug Energie im Terminal, holt der Collector keine", async () => {
  const { Collector, TERMINAL_ENERGY_TARGET } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { [RESOURCE_ENERGY]: 500000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: TERMINAL_ENERGY_TARGET }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.targetId === "storage"),
    false,
    "genau die Zielgroesse reicht — die Bedingung ist `<`, nicht `<=`",
  );
});

test("ist im Terminal zu wenig frei, wird nichts mehr nachgeliefert", async () => {
  const { Collector, TERMINAL_FREE_MIN } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { O: 5000 }));
  // Belegt bis auf weniger als TERMINAL_FREE_MIN.
  const terminal = stubStructure(
    "terminal",
    STRUCTURE_TERMINAL,
    21,
    21,
    ROOM,
    stubStore(300000, { [RESOURCE_ENERGY]: 300000 - (TERMINAL_FREE_MIN - 1) }),
  );

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.length,
    0,
    "bei vollem Terminal wird nichts mehr aus Storage oder Extractor-Container geholt — " +
      "Tombstones und Drops dagegen sammelt der Collector weiter ein, die verfallen sonst",
  );
});

// --- Spawnbedingung ------------------------------------------------------------

/**
 * Ein Spawn-Stub, dessen `spawnCreep` jeden Aufruf mitschreibt und OK meldet.
 *
 * `creepBase.spawn` ruft `spawnCreep` zweimal auf: einmal als `dryRun`-Probe,
 * einmal echt. Das `dryRun`-Flag wird mitgeschrieben, damit ein Test die Probe
 * herausfiltern kann — dieselbe Unterscheidung wie in `roles-filler.test.ts`
 * und `roles-hauler.test.ts`.
 */
function stubCollectorSpawn(roomName: string, options: { storage?: unknown; terminal?: unknown } = {}) {
  const spawnCalls: { profil: BodyPartConstant[]; newName: string; memory?: Record<string, any>; dryRun: boolean }[] = [];

  const spawnObj: any = {
    room: {
      name: roomName,
      storage: options.storage,
      terminal: options.terminal,
      energyCapacityAvailable: 2300,
    },
    spawnCreep(
      profil: BodyPartConstant[],
      newName: string,
      opts?: { dryRun?: boolean; memory?: Record<string, any> },
    ): number {
      spawnCalls.push({ profil: [...profil], newName, memory: opts?.memory, dryRun: Boolean(opts?.dryRun) });
      return OK;
    },
  };

  return { spawnObj, spawnCalls };
}

test("ohne Terminal oder ohne Storage wird kein Collector gespawnt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000));

  const ohneTerminal = stubCollectorSpawn(ROOM, { storage });
  assert.equal(collector.spawn(ohneTerminal.spawnObj, ROOM), false, "ohne Terminal nicht");

  const ohneStorage = stubCollectorSpawn(ROOM, { terminal });
  assert.equal(collector.spawn(ohneStorage.spawnObj, ROOM), false, "ohne Storage nicht");
});

test("mit Storage und Terminal wird genau einer gespawnt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000));

  const { spawnObj, spawnCalls } = stubCollectorSpawn(ROOM, { storage, terminal });
  assert.equal(collector.spawn(spawnObj, ROOM), true);

  // Nur die echten Spawns, ohne die vorausgehende `dryRun`-Probe aus
  // `creepBase.spawn` — siehe die Erklärung an `stubCollectorSpawn`.
  const real = spawnCalls.filter(call => !call.dryRun);
  assert.equal(real.length, 1, "genau ein echter spawnCreep-Aufruf");
  assert.notEqual(real[0]!.profil.length, 0, "ein leeres Body-Array laesst spawnCreep immer fehlschlagen");
  assert.equal(
    real[0]!.memory!.mineral,
    RESOURCE_ENERGY,
    "ohne diesen Schluessel kippt checkHarvest bei jeder Teilladung sofort in den Abliefermodus",
  );
  assert.equal(real[0]!.memory!.harvest, true);

  // Schlüssel setzen statt `Game.creeps` zu ersetzen — `resetWorld()` leert das
  // vorhandene Objekt, ein neues käme dort nie an.
  anyGlobal.Game.creeps["collector_1"] = { memory: { role: "collector", workroom: ROOM } };
  assert.equal(collector.spawn(spawnObj, ROOM), false, "einer genuegt");
});

test("aus einem fremden Raum wird nicht gespawnt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000));

  const { spawnObj } = stubCollectorSpawn("E58N7", { storage, terminal });
  assert.equal(collector.spawn(spawnObj, ROOM), false, "die Rolle kennt kein goToWorkroom");
});

test("ein Terminal ganz ohne Energie bekommt welche — der wichtigste Fall, nicht der Randfall", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { [RESOURCE_ENERGY]: 500000 }));
  // Ganz leer: genau die Lage, in der `sell()` mangels Energie nie anläuft.
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "", mineral: RESOURCE_ENERGY },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.targetId === "storage" && call.resource === RESOURCE_ENERGY),
    true,
  );
});

test("nimmt das Terminal nichts an, geht die Ladung ins Storage statt festzuhaengen", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000));
  // Randvoll: TransportToHomeTerminal findet kein Ziel mit freiem Platz.
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: 300000 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500, { O: 500 }),
      // `fromId` auf dem Storage: genau der Zustand nach `harvestRoomStorage`.
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: false, container: "", mineral: RESOURCE_ENERGY, fromId: "storage" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.targetId === "storage"),
    true,
    "die Ladung geht zurueck ins Storage, statt beim Creep zu bleiben",
  );
});
