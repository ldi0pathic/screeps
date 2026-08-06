/**
 * Prüft die Ablieferketten (`src/creep/transport.ts`).
 *
 * Geschrieben gegen die aktuelle Fassung, **vor** dem Umbau. Festgehalten wird
 * vor allem, welche Ziele überhaupt in Frage kommen: Kapazitätsschwellen, der
 * Ausschluss der eben benutzten Quelle (`fromId`) und die Auswahl des
 * nächstgelegenen Containers aus der Memory-Liste.
 *
 * Eine Eigenart des Bots wird hier absichtlich mitgeprüft, statt sie zu
 * begradigen: mehrere Aufrufe übergeben `getFreeCapacity` ein **Array**
 * (`[RESOURCE_ENERGY]`) statt der Ressourcenkonstante. Das wirkt nur, weil der
 * Wert bei der Schlüsselsuche zu `"energy"` wird. Der Store-Stub verhält sich
 * genauso — so bleibt sichtbar, dass der Umbau daran nichts geändert hat.
 *
 * Seit dem Zielgedächtnis in `findDeliveryTarget` (Memory-Schlüssel `useSupply`
 * für Spawn/Extensions, `useLab` für Labore) prüfen die Tests unten zusätzlich,
 * dass ein gemerktes Ziel die Suche tatsächlich spart — dafür zählt
 * `countClosestSearches` die Aufrufe von `findClosestByPath` mit.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { moveCalls } from "./support/movement-stubs";
import {
  actionCalls,
  actionResults,
  configureRoom,
  installCreepWorld,
  roomMemory,
  stubActor,
  stubRoom,
  stubStore,
  stubStructure,
} from "./support/creep-stubs";

async function transport(): Promise<typeof import("../src/creep/transport")> {
  installCreepWorld();
  return await import("../src/creep/transport");
}

/** `transferTo` steht bei seinem Gegenstück `withdrawFrom` in `target.ts`. */
async function loadTarget(): Promise<typeof import("../src/creep/target")> {
  installCreepWorld();
  return await import("../src/creep/target");
}

/**
 * Zählt die Aufrufe von `findClosestByPath` auf der Position eines
 * `stubActor`-Creeps, ohne den Stub selbst zu ändern — die Zählung ist der
 * eigentliche Gegenstand der Tests zum Zielgedächtnis.
 */
function countClosestSearches(creep: { pos: { findClosestByPath: (...args: any[]) => unknown } }): {
  calls: number;
} {
  const counter = { calls: 0 };
  const original = creep.pos.findClosestByPath;
  creep.pos.findClosestByPath = (...args: any[]) => {
    counter.calls += 1;
    return original(...args);
  };
  return counter;
}

test("abliefern: zu weit weg heißt hinlaufen, erledigt heißt fertig", async () => {
  const { transferTo } = await loadTarget();

  const target = stubStructure("ziel", "extension", 20, 20, "E58N6", stubStore(200, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", { store: stubStore(500, { energy: 500 }) });

  actionResults.transfer = ERR_NOT_IN_RANGE;
  assert.equal(transferTo(creep, target as any, RESOURCE_ENERGY), true);
  assert.equal(moveCalls.length, 1);

  installCreepWorld();
  const near = stubStructure("ziel", "extension", 11, 10, "E58N6", stubStore(200));
  const deliverer = stubActor(10, 10, "E58N6", { store: stubStore(500, { energy: 500 }) });
  assert.equal(transferTo(deliverer, near as any, RESOURCE_ENERGY), true);
  assert.equal(
    deliverer.memory.fromId,
    undefined,
    "beim Abliefern wird keine Quelle gemerkt — das ist Sache der Beschaffung",
  );

  // Ohne Ziel und bei einem unerwarteten Code passiert nichts.
  assert.equal(transferTo(deliverer, null, RESOURCE_ENERGY), false);
  actionResults.transfer = ERR_FULL;
  assert.equal(transferTo(deliverer, near as any, RESOURCE_ENERGY), false);
});

test("Spawn und Extensions: nur im Heimatraum, nicht die eben geleerte Quelle", async () => {
  const { TransportEnergyToHomeSpawn } = await transport();

  const spawn = stubStructure("spawn", "spawn", 20, 20, "E58N6", stubStore(300, { energy: 0 }));
  const extension = stubStructure("ext", "extension", 21, 20, "E58N6", stubStore(200, { energy: 0 }));

  // Arbeitsraum ist nicht der Heimatraum: nichts abliefern.
  const away = stubActor(10, 10, "E58N7", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6" },
    room: stubRoom("E58N7"),
  });
  assert.equal(TransportEnergyToHomeSpawn(away), false);
  assert.equal(actionCalls.length, 0);

  // Im Heimatraum: das erste passende Ziel bekommt die Energie.
  const atHome = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6" },
    closest: { [FIND_MY_STRUCTURES]: [spawn, extension] },
  });
  assert.equal(TransportEnergyToHomeSpawn(atHome), true);
  assert.equal(actionCalls[0]!.targetId, "spawn");

  // Woher die Ladung kam, wird ausgeschlossen.
  installCreepWorld();
  const fullSpawn = stubStructure("spawn", "spawn", 20, 20, "E58N6", stubStore(300, { energy: 0 }));
  const ext2 = stubStructure("ext", "extension", 21, 20, "E58N6", stubStore(200, { energy: 0 }));
  const fromSpawn = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6", fromId: "spawn" },
    closest: { [FIND_MY_STRUCTURES]: [fullSpawn, ext2] },
  });
  assert.equal(TransportEnergyToHomeSpawn(fromSpawn), true);
  assert.equal(actionCalls[0]!.targetId, "ext", "der Spawn war die Quelle");

  // Ohne Energie an Bord gar nicht erst.
  installCreepWorld();
  const empty = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 0 }),
    memory: { home: "E58N6" },
  });
  assert.equal(TransportEnergyToHomeSpawn(empty), false);
});

test("Türme: der leerste zuerst, und erst ab 100 fehlender Energie", async () => {
  const { TransportEnergyToHomeTower } = await transport();

  // Freie Kapazität: 400, 900 und 50.
  const halfFull = stubStructure("turm-halb", "tower", 20, 20, "E58N6", stubStore(1000, { energy: 600 }));
  const nearlyEmpty = stubStructure("turm-leer", "tower", 25, 25, "E58N6", stubStore(1000, { energy: 100 }));
  const nearlyFull = stubStructure("turm-voll", "tower", 21, 20, "E58N6", stubStore(1000, { energy: 950 }));

  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    room: stubRoom("E58N6", { found: { [FIND_MY_STRUCTURES]: [halfFull, nearlyEmpty, nearlyFull] } }),
  });

  assert.equal(TransportEnergyToHomeTower(creep), true);
  assert.equal(actionCalls[0]!.targetId, "turm-leer", "der mit der größten Lücke");

  // Ein Turm, dem weniger als 100 fehlt, ist kein Ziel.
  installCreepWorld();
  const almostFull = stubStructure("turm", "tower", 20, 20, "E58N6", stubStore(1000, { energy: 950 }));
  const pickyCreep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    room: stubRoom("E58N6", { found: { [FIND_MY_STRUCTURES]: [almostFull] } }),
  });
  assert.equal(TransportEnergyToHomeTower(pickyCreep), false);
  assert.equal(actionCalls.length, 0);
});

test("Storage: alles hinein, aber nicht dorthin zurück, wo es geholt wurde", async () => {
  const { TransportToHomeStorage } = await transport();

  const storage = stubStructure("storage", "storage", 20, 20, "E58N6", stubStore(900000, { energy: 1000 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 300, XKH2O: 200 }),
    room: stubRoom("E58N6", { storage }),
  });

  assert.equal(TransportToHomeStorage(creep), true);
  assert.deepEqual(
    actionCalls.map(call => call.resource),
    [RESOURCE_ENERGY, "XKH2O"],
    "jede Ressource wird angeboten",
  );

  // Kam die Ladung aus dem Storage, wäre das ein Leerlauf.
  installCreepWorld();
  const sameStorage = stubStructure("storage", "storage", 20, 20, "E58N6", stubStore(900000));
  const returning = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 300 }),
    memory: { fromId: "storage" },
    room: stubRoom("E58N6", { storage: sameStorage }),
  });
  assert.equal(TransportToHomeStorage(returning), false);
  assert.equal(actionCalls.length, 0);

  // Ohne Storage im Raum.
  installCreepWorld();
  const noStorage = stubActor(10, 10, "E58N6", { store: stubStore(500, { energy: 300 }) });
  assert.equal(TransportToHomeStorage(noStorage), false);
});

test("Terminal: ab RCL6, Id wird gemerkt, zu viel Energie wird nicht eingelagert", async () => {
  const { TransportToHomeTerminal } = await transport();

  const terminal = stubStructure("terminal", "terminal", 20, 20, "E58N6", stubStore(300000, { energy: 5000 }));
  const memory = roomMemory("E58N6", {});
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 300 }),
    memory: { workroom: "E58N6" },
    room: stubRoom("E58N6", {
      controller: { my: true, level: 6 },
      found: { [FIND_MY_STRUCTURES]: [terminal] },
    }),
  });

  assert.equal(TransportToHomeTerminal(creep), true);
  assert.equal(memory.terminalId, "terminal", "die Id wird für die nächsten Ticks gemerkt");
  assert.equal(actionCalls[0]!.resource, RESOURCE_ENERGY);

  // Unter RCL6 nicht.
  installCreepWorld();
  roomMemory("E58N6", {});
  const early = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 300 }),
    memory: { workroom: "E58N6" },
    room: stubRoom("E58N6", { controller: { my: true, level: 5 } }),
  });
  assert.equal(TransportToHomeTerminal(early), false);

  // Über 100 000 Energie im Terminal wird keine Energie mehr eingelagert —
  // Mineralien schon.
  installCreepWorld();
  const fullTerminal = stubStructure("terminal", "terminal", 20, 20, "E58N6", stubStore(300000, { energy: 150000 }));
  roomMemory("E58N6", { terminalId: fullTerminal.id });
  const mixedCreep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 300, XKH2O: 100 }),
    memory: { workroom: "E58N6" },
    room: stubRoom("E58N6", { controller: { my: true, level: 8 } }),
  });
  assert.equal(TransportToHomeTerminal(mixedCreep), true);
  assert.deepEqual(
    actionCalls.map(call => call.resource),
    ["XKH2O"],
    "Energie wird übersprungen",
  );

  // Eine gemerkte Id, die es nicht mehr gibt, wird verworfen.
  installCreepWorld();
  const staleMemory = roomMemory("E58N6", { terminalId: "verschwunden" });
  const confused = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 300 }),
    memory: { workroom: "E58N6" },
    room: stubRoom("E58N6", { controller: { my: true, level: 8 } }),
  });
  assert.equal(TransportToHomeTerminal(confused), false);
  assert.equal(staleMemory.terminalId, undefined);
});

test("Labor: freie Kapazität für den Stoff, nicht die eigene Quelle", async () => {
  const { TransportToHomeLab } = await transport();

  const lab = stubStructure("lab", "lab", 20, 20, "E58N6", stubStore(3000, { XKH2O: 100 }));
  const sourceLab = stubStructure("lab-quelle", "lab", 21, 20, "E58N6", stubStore(3000));

  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { XKH2O: 200 }),
    memory: { fromId: "lab-quelle" },
    closest: { [FIND_MY_STRUCTURES]: [sourceLab, lab] },
  });

  assert.equal(TransportToHomeLab(creep, "XKH2O"), true);
  assert.equal(actionCalls[0]!.targetId, "lab");
});

test("Container: der nächste mit Platz, ohne Mineralcontainer und ohne die Quelle", async () => {
  const { TransportToHomeContainer } = await transport();

  const near = stubStructure("nah", "container", 12, 10, "E58N6", stubStore(2000, { energy: 0 }));
  const far = stubStructure("fern", "container", 45, 45, "E58N6", stubStore(2000, { energy: 0 }));
  const mineral = stubStructure("mineral", "container", 11, 10, "E58N6", stubStore(2000, { energy: 0 }));
  const source = stubStructure("quelle", "container", 11, 11, "E58N6", stubStore(2000, { energy: 0 }));

  configureRoom("E58N6", { mineralContainerId: mineral.id });
  roomMemory("E58N6", { container: [mineral.id, source.id, far.id, near.id] });

  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 400 }),
    memory: { fromId: source.id },
  });

  assert.equal(TransportToHomeContainer(creep, RESOURCE_ENERGY), true);
  assert.equal(actionCalls[0]!.targetId, "nah");
  assert.equal(
    creep.memory.useContainer,
    undefined,
    "nach dem Abliefern wird die Wahl wieder vergessen",
  );

  // Ein voller Container ist kein Ziel.
  installCreepWorld();
  const full = stubStructure("voll", "container", 12, 10, "E58N6", stubStore(2000, { energy: 2000 }));
  roomMemory("E58N6", { container: [full.id] });
  configureRoom("E58N6", {});
  const stuck = stubActor(10, 10, "E58N6", { store: stubStore(500, { energy: 400 }) });
  assert.equal(TransportToHomeContainer(stuck, RESOURCE_ENERGY), false);
  assert.equal(actionCalls.length, 0);
});

test("Container: ohne Liste im Memory wird sie angelegt", async () => {
  const { TransportToHomeContainer } = await transport();

  const container = stubStructure("c1", "container", 12, 10, "E58N6", stubStore(2000));
  const memory = roomMemory("E58N6", {});
  configureRoom("E58N6", {});

  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 400 }),
    room: stubRoom("E58N6", { found: { [FIND_STRUCTURES]: [container] } }),
  });

  assert.equal(TransportToHomeContainer(creep, RESOURCE_ENERGY), true, "es gibt Container");
  assert.deepEqual(memory.container, ["c1"]);
  assert.equal(actionCalls.length, 0, "in diesem Tick wird nur gesucht");

  // Eine **leere** Liste führt dagegen nicht zum Suchen — das ist der
  // Unterschied zur Beschaffungsseite in base.ts, dort wird dann neu gesucht.
  installCreepWorld();
  const emptyList = roomMemory("E58N6", { container: [] });
  configureRoom("E58N6", {});
  const creepWithEmptyList = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 400 }),
    room: stubRoom("E58N6", { found: { [FIND_STRUCTURES]: [container] } }),
  });
  assert.equal(TransportToHomeContainer(creepWithEmptyList, RESOURCE_ENERGY), false);
  assert.deepEqual(emptyList.container, [], "die leere Liste bleibt leer");
});

test("Spawn: das gemerkte Ziel spart die Suche im nächsten Aufruf", async () => {
  const { TransportEnergyToHomeSpawn } = await transport();

  const spawn = stubStructure("spawn", "spawn", 20, 20, "E58N6", stubStore(300, { energy: 0 }));
  const extension = stubStructure("ext", "extension", 21, 20, "E58N6", stubStore(200, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6" },
    closest: { [FIND_MY_STRUCTURES]: [spawn, extension] },
  });
  const searches = countClosestSearches(creep);

  // Erster Aufruf: der Creep ist noch nicht am Ziel, also bleibt es gemerkt.
  actionResults.transfer = ERR_NOT_IN_RANGE;
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(creep.memory.useSupply, "spawn", "das gefundene Ziel wird unter useSupply gemerkt");
  assert.equal(searches.calls, 1, "die erste Ablieferung sucht einmal");

  // Zweiter Aufruf im selben Zustand: keine erneute Suche, dasselbe Ziel.
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(creep.memory.useSupply, "spawn", "es bleibt dasselbe Ziel");
  assert.equal(searches.calls, 1, "der zweite Aufruf sucht nicht noch einmal");
});

test("Spawn: nach erfolgreicher Ablieferung ist das Ziel vergessen", async () => {
  const { TransportEnergyToHomeSpawn } = await transport();

  const spawn = stubStructure("spawn", "spawn", 20, 20, "E58N6", stubStore(300, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6" },
    closest: { [FIND_MY_STRUCTURES]: [spawn] },
  });

  actionResults.transfer = OK;
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(
    creep.memory.useSupply,
    undefined,
    "nach OK ist die Extension voll oder der Creep leer — die Wahl ist verbraucht",
  );
});

test("Spawn: unterwegs zum Ziel bleibt es gemerkt", async () => {
  const { TransportEnergyToHomeSpawn } = await transport();

  const spawn = stubStructure("spawn", "spawn", 20, 20, "E58N6", stubStore(300, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6" },
    closest: { [FIND_MY_STRUCTURES]: [spawn] },
  });

  actionResults.transfer = ERR_NOT_IN_RANGE;
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(moveCalls.length, 1, "der Creep läuft zum gemerkten Ziel hin");
  assert.equal(creep.memory.useSupply, "spawn", "das Ziel bleibt gemerkt, solange der Creep unterwegs ist");
});

test("Spawn: ein volles gemerktes Ziel löst im selben Tick eine neue Suche aus", async () => {
  const { TransportEnergyToHomeSpawn } = await transport();

  const fullExt = stubStructure("voll", "extension", 20, 20, "E58N6", stubStore(200, { energy: 200 }));
  const freeExt = stubStructure("frei", "extension", 21, 20, "E58N6", stubStore(200, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6", useSupply: fullExt.id },
    closest: { [FIND_MY_STRUCTURES]: [freeExt] },
  });
  const searches = countClosestSearches(creep);

  actionResults.transfer = ERR_NOT_IN_RANGE;
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(actionCalls[0]!.targetId, "frei", "die volle Extension nimmt nichts mehr an");
  assert.equal(searches.calls, 1, "genau eine Ersatzsuche im selben Tick");
  assert.equal(creep.memory.useSupply, "frei", "die neue Wahl wird gemerkt");
});

test("Spawn: ein verschwundenes gemerktes Ziel löst ebenfalls eine neue Suche aus", async () => {
  const { TransportEnergyToHomeSpawn } = await transport();

  const extension = stubStructure("ext", "extension", 21, 20, "E58N6", stubStore(200, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6", useSupply: "verschwunden" },
    closest: { [FIND_MY_STRUCTURES]: [extension] },
  });
  const searches = countClosestSearches(creep);

  actionResults.transfer = ERR_NOT_IN_RANGE;
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(actionCalls[0]!.targetId, "ext");
  assert.equal(searches.calls, 1, "die Ersatzsuche findet im selben Tick statt");
  assert.equal(creep.memory.useSupply, "ext");
});

test("Spawn: die eben geleerte Quelle bleibt ausgeschlossen, auch wenn sie gemerkt ist", async () => {
  const { TransportEnergyToHomeSpawn } = await transport();

  const spawn = stubStructure("spawn", "spawn", 20, 20, "E58N6", stubStore(300, { energy: 0 }));
  const extension = stubStructure("ext", "extension", 21, 20, "E58N6", stubStore(200, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500 }),
    memory: { home: "E58N6", useSupply: spawn.id, fromId: spawn.id },
    closest: { [FIND_MY_STRUCTURES]: [spawn, extension] },
  });
  const searches = countClosestSearches(creep);

  actionResults.transfer = ERR_NOT_IN_RANGE;
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(actionCalls[0]!.targetId, "ext", "der Spawn war die eben geleerte Quelle");
  assert.equal(searches.calls, 1, "das gemerkte, aber ausgeschlossene Ziel löst eine Ersatzsuche aus");
  assert.equal(creep.memory.useSupply, "ext");
});

test("useSupply und useLab stören sich nicht, wenn ein Creep beides probiert", async () => {
  const { TransportEnergyToHomeSpawn, TransportToHomeLab } = await transport();

  const spawn = stubStructure("spawn", "spawn", 20, 20, "E58N6", stubStore(300, { energy: 0 }));
  const lab = stubStructure("lab", "lab", 22, 20, "E58N6", stubStore(3000, { XKH2O: 0 }));
  const creep = stubActor(10, 10, "E58N6", {
    store: stubStore(500, { energy: 500, XKH2O: 200 }),
    memory: { home: "E58N6" },
    closest: { [FIND_MY_STRUCTURES]: [spawn, lab] },
  });

  actionResults.transfer = ERR_NOT_IN_RANGE;
  assert.equal(TransportEnergyToHomeSpawn(creep), true);
  assert.equal(TransportToHomeLab(creep, "XKH2O"), true);

  assert.equal(creep.memory.useSupply, "spawn");
  assert.equal(creep.memory.useLab, "lab");
  assert.notEqual(
    creep.memory.useSupply,
    creep.memory.useLab,
    "beide Ketten merken sich ihr Ziel unter getrennten Schlüsseln",
  );
});

test("abliefern an ein gemerktes Ziel: deliverTo setzt kein fromId", async () => {
  const { deliverTo, RememberedTarget } = await loadTarget();

  const target = stubStructure("ziel", "extension", 11, 10, "E58N6", stubStore(200, { energy: 0 }));
  const creep = stubActor(10, 10, "E58N6", { store: stubStore(500, { energy: 500 }) });
  const remembered = new RememberedTarget(creep.memory, "useSupply");
  remembered.remember(target as any);

  actionResults.transfer = OK;
  assert.equal(deliverTo(creep, target as any, remembered, RESOURCE_ENERGY), true);
  assert.equal(creep.memory.fromId, undefined, "beim Abliefern wird keine Quelle gemerkt — Sache der Beschaffung");
  assert.equal(creep.memory.useSupply, undefined, "nach OK ist die Wahl verbraucht");

  // Ohne übergebenes Ziel: das Ergebnis ist `false`, die Wahl wird trotzdem vergessen.
  installCreepWorld();
  const creepOhneZiel = stubActor(10, 10, "E58N6", { store: stubStore(500, { energy: 500 }) });
  const rememberedOhneZiel = new RememberedTarget(creepOhneZiel.memory, "useSupply");
  rememberedOhneZiel.remember(target as any);

  assert.equal(deliverTo(creepOhneZiel, null, rememberedOhneZiel, RESOURCE_ENERGY), false);
  assert.equal(creepOhneZiel.memory.fromId, undefined);
  assert.equal(creepOhneZiel.memory.useSupply, undefined, "ohne Ziel wird die gemerkte Wahl verworfen");
});
