/**
 * Prüft `src/controller/room-inventory.ts` (Plan 02, Schritt 1,
 * `docs/plans/02-strukturerkennung.md`): Energiequellen und Mineralvorkommen
 * werden erhoben statt von Hand in `config.ts` gepflegt.
 *
 * Zentrale Zusage: **die Config gewinnt.** Ist in `bot.room[<raum>]` eine
 * nicht-leere Liste gesetzt, gilt sie unabhängig davon, was im Memory steht —
 * jeder heute laufende Raum verhält sich dadurch unverändert. Eine leere
 * Config-Liste (`energySources: []`) zählt dagegen wie gar keine, sonst könnte
 * ein Raum mit versehentlich leerer Liste nie fördern.
 *
 * `discover()` ist der Tagesjob: er erhebt `FIND_SOURCES`/`FIND_MINERALS`
 * genau einmal je Raum, danach kostet ein weiterer Durchlauf keinen
 * `find()`-Aufruf mehr — Quellen und Minerale sind unveränderlich (siehe
 * Kopfkommentar der geprüften Datei). Ein Raum-Stub, dessen `find()` die
 * Aufrufe mitzählt, macht das direkt beobachtbar.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { captureConsole, game, installGlobals, memory, stubRooms } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

/** Ein Raum, dessen `find()` aus einer Tabelle antwortet und die Aufrufe mitzählt. */
function stubDiscoverableRoom(
  name: string,
  sourceIds: string[],
  mineralIds: string[],
): { room: { name: string; find(type: number): { id: string }[] }; findCalls: number[] } {
  const findCalls: number[] = [];
  const room = {
    name,
    find(type: number): { id: string }[] {
      findCalls.push(type);
      if (type === FIND_SOURCES) return sourceIds.map(id => ({ id }));
      if (type === FIND_MINERALS) return mineralIds.map(id => ({ id }));
      return [];
    },
  };
  return { room, findCalls };
}

// --- energySources / mineralSources ---------------------------------------

test("energySources: eine gesetzte Config-Liste gewinnt gegen abweichendes Memory", async () => {
  installGlobals();
  stubRooms(ROOM);
  anyGlobal.room[ROOM].energySources = ["config-source"];
  memory().rooms = { [ROOM]: { energySources: ["memory-source"] } };

  const { energySources } = await import("../src/controller/room-inventory");

  assert.deepEqual(energySources(ROOM), ["config-source"]);
});

test("energySources: eine leere Config-Liste zählt wie keine — das Memory greift", async () => {
  installGlobals();
  stubRooms(ROOM);
  anyGlobal.room[ROOM].energySources = [];
  memory().rooms = { [ROOM]: { energySources: ["memory-source"] } };

  const { energySources } = await import("../src/controller/room-inventory");

  assert.deepEqual(energySources(ROOM), ["memory-source"]);
});

test("energySources: ohne Config und ohne Memory ein leeres Array, kein Wurf", async () => {
  installGlobals();
  stubRooms(ROOM);
  // `Memory.rooms` selbst existiert bereits — im laufenden Bot legt
  // `controller/memory.ts::init()` es jeden Tick vor allem anderen an
  // (`controllCritical()` läuft vor der Creep-Schleife). Ohne dieses Setup
  // wirft `energySources` beim Indexzugriff auf `Memory.rooms[roomName]`.
  memory().rooms = {};

  const { energySources } = await import("../src/controller/room-inventory");

  assert.deepEqual(energySources(ROOM), []);
});

test("mineralSources: eine gesetzte Config-Liste gewinnt gegen abweichendes Memory", async () => {
  installGlobals();
  stubRooms(ROOM);
  anyGlobal.room[ROOM].mineralSources = ["config-mineral"];
  memory().rooms = { [ROOM]: { mineralSources: ["memory-mineral"] } };

  const { mineralSources } = await import("../src/controller/room-inventory");

  assert.deepEqual(mineralSources(ROOM), ["config-mineral"]);
});

test("mineralSources: eine leere Config-Liste zählt wie keine — das Memory greift", async () => {
  installGlobals();
  stubRooms(ROOM);
  anyGlobal.room[ROOM].mineralSources = [];
  memory().rooms = { [ROOM]: { mineralSources: ["memory-mineral"] } };

  const { mineralSources } = await import("../src/controller/room-inventory");

  assert.deepEqual(mineralSources(ROOM), ["memory-mineral"]);
});

test("mineralSources: ohne Config und ohne Memory ein leeres Array, kein Wurf", async () => {
  installGlobals();
  stubRooms(ROOM);
  memory().rooms = {}; // siehe Kommentar bei energySources oben

  const { mineralSources } = await import("../src/controller/room-inventory");

  assert.deepEqual(mineralSources(ROOM), []);
});

// --- discover --------------------------------------------------------------

test("discover: ohne Sicht auf den Raum passiert nichts, kein Wurf", async () => {
  installGlobals();
  stubRooms(ROOM);
  // Kein Game.rooms[ROOM] — keine Sicht.

  const { discover } = await import("../src/controller/room-inventory");

  assert.doesNotThrow(() => discover());
  assert.equal(memory().rooms?.[ROOM], undefined, "ohne Sicht wird nichts ins Memory geschrieben");
});

test("discover: erhebt Quellen und Minerale und meldet es auf der Konsole", async () => {
  installGlobals();
  stubRooms(ROOM);
  memory().rooms = {}; // im laufenden Bot durch controller/memory.ts::init() garantiert
  const { room, findCalls } = stubDiscoverableRoom(ROOM, ["source1", "source2"], ["mineral1"]);
  game().rooms[ROOM] = room;

  const { discover } = await import("../src/controller/room-inventory");

  const captured = captureConsole();
  try {
    discover();
  } finally {
    captured.restore();
  }

  assert.deepEqual(memory().rooms[ROOM].energySources, ["source1", "source2"]);
  assert.deepEqual(memory().rooms[ROOM].mineralSources, ["mineral1"]);
  assert.ok(findCalls.includes(FIND_SOURCES), "FIND_SOURCES wurde abgefragt");
  assert.ok(findCalls.includes(FIND_MINERALS), "FIND_MINERALS wurde abgefragt");
  assert.ok(
    captured.lines.some(line => line.includes(ROOM) && line.includes("2") && line.includes("1")),
    "die Erhebung wird auf der Konsole gemeldet",
  );
});

test("discover: ein zweiter Durchgang löst kein find() mehr aus", async () => {
  installGlobals();
  stubRooms(ROOM);
  memory().rooms = {};
  const { room, findCalls } = stubDiscoverableRoom(ROOM, ["source1"], ["mineral1"]);
  game().rooms[ROOM] = room;

  const { discover } = await import("../src/controller/room-inventory");

  const first = captureConsole();
  try {
    discover();
  } finally {
    first.restore();
  }
  assert.ok(findCalls.length > 0, "der erste Durchgang erhebt tatsächlich");

  findCalls.length = 0;
  const second = captureConsole();
  try {
    discover();
  } finally {
    second.restore();
  }

  assert.equal(findCalls.length, 0, "der zweite Durchgang ruft kein find() mehr auf");
});

test("discover: ein Raum ohne Minerale bekommt trotzdem eine leere Liste und wird beim zweiten Durchgang übersprungen", async () => {
  installGlobals();
  stubRooms(ROOM);
  memory().rooms = {};
  const { room, findCalls } = stubDiscoverableRoom(ROOM, ["source1"], []);
  game().rooms[ROOM] = room;

  const { discover } = await import("../src/controller/room-inventory");

  const first = captureConsole();
  try {
    discover();
  } finally {
    first.restore();
  }

  assert.deepEqual(memory().rooms[ROOM].mineralSources, [], "die leere Liste wird trotzdem gespeichert");

  findCalls.length = 0;
  const second = captureConsole();
  try {
    discover();
  } finally {
    second.restore();
  }

  assert.equal(
    findCalls.length,
    0,
    "ein Raum ohne Minerale darf beim zweiten Durchgang kein find() mehr auslösen — " +
      "die Prüfung im Code geht auf 'Liste vorhanden' (memory.mineralSources ist ein Array, " +
      "auch leer noch truthy), nicht auf 'Liste nicht leer'",
  );
});

test("discover(onlyRoom): erhebt genau den angegebenen Raum, der andere bleibt unberührt", async () => {
  installGlobals();
  stubRooms(ROOM, "E58N7");
  memory().rooms = {};
  const first = stubDiscoverableRoom(ROOM, ["source1"], []);
  const second = stubDiscoverableRoom("E58N7", ["source2"], []);
  game().rooms[ROOM] = first.room;
  game().rooms["E58N7"] = second.room;

  const { discover } = await import("../src/controller/room-inventory");

  const captured = captureConsole();
  try {
    discover(ROOM);
  } finally {
    captured.restore();
  }

  assert.ok(memory().rooms[ROOM], "der angegebene Raum wurde erhoben");
  assert.equal(memory().rooms["E58N7"], undefined, "der andere Raum bleibt unberührt");
  assert.equal(second.findCalls.length, 0, "der andere Raum bekommt kein find()");
});

test("discover(onlyRoom): ein unbekannter Raumname tut nichts und wirft nicht", async () => {
  installGlobals();
  stubRooms(ROOM);
  const { room } = stubDiscoverableRoom(ROOM, ["source1"], []);
  game().rooms[ROOM] = room;

  const { discover } = await import("../src/controller/room-inventory");

  assert.doesNotThrow(() => discover("E99N99"));
  assert.equal(memory().rooms?.[ROOM], undefined, "der konfigurierte Raum bleibt unberührt, weil onlyRoom nicht passt");
});
