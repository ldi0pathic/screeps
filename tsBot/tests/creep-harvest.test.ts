/**
 * Prüft die Beschaffungsketten (`src/creep/base.ts`).
 *
 * Geschrieben gegen die aktuelle Fassung, **vor** dem Umbau: hier steht fest, was
 * die zwölf gleichartigen Ketten heute tun — wann ein Ziel gemerkt und wann es
 * vergessen wird, wann `fromId` gesetzt wird (das verhindert später das
 * Zurückliefern in dieselbe Quelle) und wann hingelaufen statt gehandelt wird.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { moveCalls } from "./support/movement-stubs";
import {
  actionCalls,
  actionResults,
  installCreepWorld,
  roomMemory,
  stubActor,
  stubDrop,
  stubRoom,
  stubSource,
  stubStore,
  stubStructure,
} from "./support/creep-stubs";

async function base(): Promise<typeof import("../src/creep/base")> {
  installCreepWorld();
  return await import("../src/creep/base");
}

test("Drops: das gemerkte Ziel wird ohne neue Suche benutzt", async () => {
  const { harvestRoomDrops } = await base();

  const drop = stubDrop("drop1", 500, 12, 10, "E58N6");
  // Kandidatentabelle bleibt leer: würde gesucht, käme nichts heraus.
  const creep = stubActor(10, 10, "E58N6", { memory: { useRoomDrop: drop.id } });

  assert.equal(harvestRoomDrops(creep, RESOURCE_ENERGY), true);
  assert.deepEqual(actionCalls, [{ action: "pickup", targetId: "drop1" }]);
  assert.equal(creep.memory.fromId, "drop1", "die Quelle wird für die Abgabe gemerkt");
});

test("Drops: ohne gemerktes Ziel entscheidet der Filter über 100 Einheiten", async () => {
  const { harvestRoomDrops } = await base();

  const tooSmall = stubDrop("klein", 80, 11, 10, "E58N6");
  const worthIt = stubDrop("gross", 500, 15, 10, "E58N6");
  const creep = stubActor(10, 10, "E58N6", {
    closest: { [FIND_DROPPED_RESOURCES]: [tooSmall, worthIt] },
  });

  assert.equal(harvestRoomDrops(creep, RESOURCE_ENERGY), true);
  assert.equal(actionCalls[0]!.targetId, "gross");
  assert.equal(creep.memory.useRoomDrop, "gross", "das gefundene Ziel wird gemerkt");
});

test("Drops: zu weit weg heißt hinlaufen und merken", async () => {
  const { harvestRoomDrops } = await base();
  actionResults.pickup = ERR_NOT_IN_RANGE;

  const drop = stubDrop("drop1", 500, 30, 30, "E58N6");
  const creep = stubActor(10, 10, "E58N6", { closest: { [FIND_DROPPED_RESOURCES]: [drop] } });

  assert.equal(harvestRoomDrops(creep, RESOURCE_ENERGY), true);
  assert.equal(moveCalls.length, 1, "es wird gelaufen");
  assert.equal(creep.memory.useRoomDrop, "drop1");
  assert.equal(creep.memory.fromId, undefined, "geholt wurde noch nichts");
});

test("Drops: ein ungültiges Ziel wird vergessen", async () => {
  const { harvestRoomDrops } = await base();
  actionResults.pickup = ERR_INVALID_TARGET;

  const drop = stubDrop("drop1", 500, 12, 10, "E58N6");
  const creep = stubActor(10, 10, "E58N6", { memory: { useRoomDrop: drop.id } });

  assert.equal(harvestRoomDrops(creep, RESOURCE_ENERGY), false);
  assert.equal(creep.memory.useRoomDrop, undefined);

  // Und ohne jedes Ziel ebenso.
  const emptyRoom = stubActor(10, 10, "E58N6", { memory: { useRoomDrop: "weg" } });
  assert.equal(harvestRoomDrops(emptyRoom, RESOURCE_ENERGY), false);
  assert.equal(emptyRoom.memory.useRoomDrop, undefined);
});

test("ein gemerktes Ziel, das es nicht mehr gibt, löst keine Ersatzsuche aus", async () => {
  const { harvestRoomDrops } = await base();

  // Der Drop im Memory existiert nicht mehr, ein anderer läge aber bereit.
  const other = stubDrop("anderer", 500, 12, 10, "E58N6");
  const creep = stubActor(10, 10, "E58N6", {
    memory: { useRoomDrop: "verschwunden" },
    closest: { [FIND_DROPPED_RESOURCES]: [other] },
  });

  // Bewusst so: der Creep vergisst und versucht es im nächsten Tick neu. Das
  // begrenzt die Zahl der Suchen je Tick — eine Suche ist das Teuerste, was er tun kann.
  assert.equal(harvestRoomDrops(creep, RESOURCE_ENERGY), false);
  assert.equal(actionCalls.length, 0, "kein Ausweichziel in diesem Tick");
  assert.equal(creep.memory.useRoomDrop, undefined);
});

test("Grabsteine und Ruinen: eigene Schwellen, gleiche Kette", async () => {
  const { harvestRoomTombstones, harvestRoomRuins } = await base();

  // Grabstein: mehr als 100 der gesuchten Ressource.
  const smallTomb = stubStructure("tomb-klein", "tombstone", 11, 10, "E58N6", stubStore(500, { energy: 90 }));
  const fullTomb = stubStructure("tomb", "tombstone", 12, 10, "E58N6", stubStore(500, { energy: 300 }));
  const tombCreep = stubActor(10, 10, "E58N6", {
    closest: { [FIND_TOMBSTONES]: [smallTomb, fullTomb] },
  });

  assert.equal(harvestRoomTombstones(tombCreep, RESOURCE_ENERGY), true);
  assert.equal(actionCalls[0]!.targetId, "tomb");
  assert.equal(actionCalls[0]!.resource, RESOURCE_ENERGY);
  assert.equal(tombCreep.memory.useTombstone, "tomb");
  assert.equal(tombCreep.memory.fromId, "tomb");

  // Ruine: hier genügen 50.
  installCreepWorld();
  const ruin = stubStructure("ruine", "ruin", 12, 10, "E58N6", stubStore(500, { energy: 60 }));
  const tooSmall = stubStructure("ruine-klein", "ruin", 11, 10, "E58N6", stubStore(500, { energy: 40 }));
  const ruinCreep = stubActor(10, 10, "E58N6", { closest: { [FIND_RUINS]: [tooSmall, ruin] } });

  assert.equal(harvestRoomRuins(ruinCreep, RESOURCE_ENERGY), true);
  assert.equal(actionCalls[0]!.targetId, "ruine");
  assert.equal(ruinCreep.memory.useRuin, "ruine");
});

test("Grabstein leerräumen: die erste Ressource im Store gewinnt", async () => {
  const { harvestCompleteRoomTombstones } = await base();

  const tomb = stubStructure(
    "tomb",
    "tombstone",
    12,
    10,
    "E58N6",
    stubStore(500, { XKH2O: 120, energy: 300 }),
  );
  const creep = stubActor(10, 10, "E58N6", { closest: { [FIND_TOMBSTONES]: [tomb] } });

  assert.equal(harvestCompleteRoomTombstones(creep), true);
  assert.equal(actionCalls.length, 1, "nur ein Abholvorgang je Tick");
  assert.equal(actionCalls[0]!.resource, "XKH2O", "Reihenfolge des Stores");
  assert.equal(creep.memory.fromId, "tomb");
});

test("Storage: Energie erst ab halber Ladekapazität, andere Ressourcen ab 50", async () => {
  const { harvestRoomStorage } = await base();

  // Creep mit 500 Kapazität: Energie erst ab mehr als 250 im Storage.
  const lowStorage = stubStructure("storage", "storage", 20, 20, "E58N6", stubStore(9000, { energy: 200 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500),
    room: stubRoom("E58N6", { storage: lowStorage }),
  });
  assert.equal(harvestRoomStorage(creep, RESOURCE_ENERGY), false, "zu wenig für eine halbe Ladung");
  assert.equal(actionCalls.length, 0);

  const fullStorage = stubStructure("storage", "storage", 20, 20, "E58N6", stubStore(9000, { energy: 5000 }));
  const richCreep = stubActor(10, 10, "E58N6", {
    store: stubStore(500),
    room: stubRoom("E58N6", { storage: fullStorage }),
  });
  assert.equal(harvestRoomStorage(richCreep, RESOURCE_ENERGY), true);
  assert.equal(richCreep.memory.fromId, "storage");

  // Mineralien: 50 genügen.
  installCreepWorld();
  const mineralStorage = stubStructure("storage", "storage", 20, 20, "E58N6", stubStore(9000, { XKH2O: 60 }));
  const mineralCreep = stubActor(10, 10, "E58N6", {
    store: stubStore(500),
    room: stubRoom("E58N6", { storage: mineralStorage }),
  });
  assert.equal(harvestRoomStorage(mineralCreep, "XKH2O"), true);
});

test("Storage: eine Ressource, die gar nicht drin liegt, wird nicht geholt", async () => {
  const { harvestRoomStorage } = await base();

  // `store["XKH2O"]` ist hier `undefined`. Der Vergleich muss positiv formuliert
  // bleiben: `undefined > min` ist falsch, `undefined <= min` aber auch — eine
  // negierte Bedingung würde hier einen Abholversuch auslösen.
  const storage = stubStructure("storage", "storage", 20, 20, "E58N6", stubStore(9000, { energy: 5000 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500),
    room: stubRoom("E58N6", { storage }),
  });

  assert.equal(harvestRoomStorage(creep, "XKH2O"), false);
  assert.equal(actionCalls.length, 0);
  assert.equal(creep.memory.fromId, undefined);
});

test("Controller-Link: alle Bedingungen, sonst wird noLink gesetzt", async () => {
  const { harvestControllerLink } = await base();

  const link = stubStructure("clink", "link", 20, 20, "E58N6", stubStore(800, { energy: 500 }));
  roomMemory("E58N6", { links: { controller: link.id, sender: [] } });

  const creep = stubActor(10, 10, "E58N6", {
    memory: { workroom: "E58N6" },
    room: stubRoom("E58N6", { controller: { my: true, level: 6 } }),
  });
  assert.equal(harvestControllerLink(creep, RESOURCE_ENERGY), true);
  assert.equal(creep.memory.fromId, "clink");

  // Leerer Link: der Creep merkt sich, dass es über den Link nicht geht.
  installCreepWorld();
  const emptyLink = stubStructure("clink", "link", 20, 20, "E58N6", stubStore(800, { energy: 50 }));
  roomMemory("E58N6", { links: { controller: emptyLink.id, sender: [] } });
  const waiting = stubActor(10, 10, "E58N6", {
    memory: { workroom: "E58N6" },
    room: stubRoom("E58N6", { controller: { my: true, level: 6 } }),
  });
  assert.equal(harvestControllerLink(waiting, RESOURCE_ENERGY), false);
  assert.equal(waiting.memory.noLink, true);

  // Unter RCL5 gar nicht erst.
  installCreepWorld();
  roomMemory("E58N6", { links: { controller: "clink", sender: [] } });
  const early = stubActor(10, 10, "E58N6", {
    memory: { workroom: "E58N6" },
    room: stubRoom("E58N6", { controller: { my: true, level: 4 } }),
  });
  assert.equal(harvestControllerLink(early, RESOURCE_ENERGY), false);
  assert.equal(early.memory.noLink, undefined, "keine Aussage über den Link");
});

test("Notfall: der Speicher mit der meisten Energie zuerst", async () => {
  const { harvestNotfall } = await base();

  const tower = stubStructure("tower", "tower", 20, 20, "E58N6", stubStore(1000, { energy: 300 }));
  const lab = stubStructure("lab", "lab", 21, 20, "E58N6", stubStore(2000, { energy: 900 }));
  const emptyLink = stubStructure("link", "link", 22, 20, "E58N6", stubStore(800, { energy: 0 }));

  const creep = stubActor(10, 10, "E58N6", {
    room: stubRoom("E58N6", { found: { [FIND_STRUCTURES]: [tower, lab, emptyLink] } }),
  });

  assert.equal(harvestNotfall(creep), true);
  assert.equal(actionCalls[0]!.targetId, "lab", "900 Energie schlagen 300");
  assert.equal(creep.memory.fromId, "lab");
});

test("Quelle: braucht WORK, mehr als 100 Energie und einen Weg", async () => {
  const { harvestRoomEnergySource } = await base();

  const source = stubSource("quelle", 3000, 20, 20, "E58N6");

  // Ohne WORK-Teil geht nichts.
  const hauler = stubActor(10, 10, "E58N6", {
    workParts: 0,
    closest: { [FIND_SOURCES_ACTIVE]: [source] },
  });
  assert.equal(harvestRoomEnergySource(hauler), false);
  assert.equal(actionCalls.length, 0);

  // Mit WORK: Quelle wird gemerkt.
  installCreepWorld();
  const goodSource = stubSource("quelle", 3000, 20, 20, "E58N6");
  const miner = stubActor(10, 10, "E58N6", { closest: { [FIND_SOURCES_ACTIVE]: [goodSource] } });
  assert.equal(harvestRoomEnergySource(miner), true);
  assert.equal(miner.memory.useRoomSource, "quelle");
  assert.equal(miner.memory.fromId, "quelle");

  // Blockierter Weg (z. B. durch den Miner): Quelle vergessen und aufgeben.
  installCreepWorld();
  const blockedSource = stubSource("quelle", 3000, 20, 20, "E58N6");
  actionResults.harvest = ERR_NOT_IN_RANGE;
  actionResults.moveTo = ERR_NO_PATH;
  const blocked = stubActor(10, 10, "E58N6", {
    memory: { useRoomSource: blockedSource.id },
    closest: { [FIND_SOURCES_ACTIVE]: [blockedSource] },
  });
  assert.equal(harvestRoomEnergySource(blocked), false);
  assert.equal(blocked.memory.useRoomSource, undefined);
});

test("Container: der nächstgelegene mit genug Inhalt, aus der Memory-Liste", async () => {
  const { harvestRoomContainer } = await base();

  const near = stubStructure("nah", "container", 12, 10, "E58N6", stubStore(2000, { energy: 1000 }));
  const far = stubStructure("fern", "container", 40, 40, "E58N6", stubStore(2000, { energy: 1000 }));
  const nearButEmpty = stubStructure("nah-leer", "container", 11, 10, "E58N6", stubStore(2000, { energy: 10 }));
  roomMemory("E58N6", { container: [nearButEmpty.id, far.id, near.id] });

  const creep = stubActor(10, 10, "E58N6", { store: stubStore(500) });

  assert.equal(harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25), true);
  assert.equal(actionCalls[0]!.targetId, "nah", "leere und ferne Container fallen heraus");
  assert.equal(creep.memory.fromId, "nah");
  assert.equal(creep.memory.useContainer, "nah", "die Wahl wird für den nächsten Tick gemerkt");
});

test("Container: ohne Liste im Memory wird sie angelegt und dieser Tick übersprungen", async () => {
  const { harvestRoomContainer } = await base();

  const container = stubStructure("c1", "container", 12, 10, "E58N6", stubStore(2000, { energy: 1000 }));
  const memory = roomMemory("E58N6", {});
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500),
    room: stubRoom("E58N6", { found: { [FIND_STRUCTURES]: [container] } }),
  });

  assert.equal(harvestRoomContainer(creep, RESOURCE_ENERGY), true, "es gibt Container");
  assert.deepEqual(memory.container, ["c1"], "die Liste ist jetzt gefüllt");
  assert.equal(actionCalls.length, 0, "in diesem Tick wird nur gesucht, nicht geholt");
});
