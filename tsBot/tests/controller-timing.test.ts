/**
 * Prüft die Aufteilung von `controller/timing.ts` in `controllCritical()` und
 * `controll()` (Plan 05, Befund 1, `docs/plans/05-cpu-verteilung.md`).
 *
 * `controllCritical()` läuft in `main.ts` **vor** der Creep-Schleife und darf
 * nie ausfallen: `memoryController.init()` und die Turmsteuerung
 * (`defenceController.tower()`). `controll()` läuft dahinter und enthält
 * beide Aufrufe nicht mehr — genau das ist die Verhaltensänderung, die dieser
 * Test nachweist. Ohne den zweiten Test ("controll() lässt die Türme nicht
 * feuern") wäre ein versehentlicher Doppelaufruf der Turmsteuerung in beiden
 * Funktionen unsichtbar: der erste Test bliebe trotzdem grün.
 *
 * Die gestellte Welt ist bewusst karg. `timing.ts` importiert
 * `controller/spawn.ts`, das beim Laden die komplette Rollentabelle
 * (`roles/index.ts`) zieht — das gelingt mit den Stub-Konstanten aus
 * `screeps-stubs.ts` bereits in `roles-miner.test.ts`/`roles-hauler.test.ts`.
 * Damit `spawnController.spawn()` in keinem dieser Tests wirklich läuft (er
 * bräuchte `Game.spawns` und eine vollständige Rollenwelt), liegt jeder Tick
 * auf einem Wert, an dem ausschließlich `% 11` zutrifft — `% 3`, `% 5`, `% 7`
 * und `% 1000` treffen nicht zu. Für `% 3` ist das nötig, weil der
 * Pixel-Zweig sonst `Game.cpu.generatePixel()` verlangt, das die Stubs nicht
 * kennen (Standard-Bucket dort ist 10 000).
 */

import assert from "node:assert/strict";
import test from "node:test";

import { captureConsole, game, installGlobals, memory, stubRooms } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

/** Ein Tick, an dem ausschließlich `% 11` zutrifft — siehe Kopfkommentar. */
const QUIET_TICK = 11;

interface HostileCreepStub {
  pos: unknown;
  body: Array<{ type: string }>;
}

interface TowerStub {
  id: string;
  pos: { getRangeTo(target: unknown): number };
  store: { getUsedCapacity(): number };
  attackCalls: unknown[];
  attack(target: unknown): number;
}

let hostileCreeps: HostileCreepStub[] = [];
let towersById: Map<string, TowerStub>;

/**
 * Turmkonstanten, die `screeps-stubs.ts` nicht führt — dort stehen nur
 * Konstanten, die *beim Laden* eines Bot-Moduls gebraucht werden. Diese hier
 * liest ausschließlich `defence.ts::tower()` zur Laufzeit. Reichweite 3 (im
 * Stub-Turm unten) liegt innerhalb der optimalen Reichweite, der Turm
 * schießt also mit vollem Schaden — mehr als genug gegen einen Gegner ohne
 * Heilteile.
 */
function installTowerConstants(): void {
  anyGlobal.TOWER_ENERGY_COST = 10;
  anyGlobal.TOWER_OPTIMAL_RANGE = 5;
  anyGlobal.TOWER_FALLOFF_RANGE = 20;
  anyGlobal.TOWER_FALLOFF = 0.3;
  anyGlobal.TOWER_POWER_ATTACK = 600;
  anyGlobal.HEAL_POWER = 12;
}

function makeHostileCreep(): HostileCreepStub {
  return { pos: {}, body: [{ type: ATTACK }] };
}

function makeTower(id: string): TowerStub {
  return {
    id,
    pos: { getRangeTo: () => 3 },
    store: { getUsedCapacity: () => 1000 },
    attackCalls: [],
    attack(target: unknown) {
      this.attackCalls.push(target);
      return OK;
    },
  };
}

/** Ein Raum, dessen `find(FIND_HOSTILE_CREEPS)` `hostileCreeps` liefert, sonst leer. */
function makeDefendedRoom() {
  return {
    name: ROOM,
    controller: { my: true, level: 4 },
    find(type: number) {
      if (type === FIND_HOSTILE_CREEPS) return hostileCreeps;
      return [];
    },
  };
}

/** Ein Raum unter Beschuss mit einem einsatzbereiten Turm — für die Turmtests. */
function setupThreatenedRoom(): void {
  installGlobals();
  installTowerConstants();
  stubRooms(ROOM);

  hostileCreeps = [makeHostileCreep()];
  towersById = new Map([["tower1", makeTower("tower1")]]);

  game().rooms[ROOM] = makeDefendedRoom();
  game().getObjectById = (id: string) => towersById.get(id) ?? null;
  game().time = QUIET_TICK;

  memory().rooms = {
    [ROOM]: { needDefence: true, tower: ["tower1"] },
  };
}

function tower(): TowerStub {
  return towersById.get("tower1")!;
}

test("controllCritical() lässt die Türme feuern", async () => {
  setupThreatenedRoom();
  const { controllCritical } = await import("../src/controller/timing");

  controllCritical();

  assert.equal(tower().attackCalls.length, 1, "der Turm hat genau einmal angegriffen");
  assert.equal(tower().attackCalls[0], hostileCreeps[0], "angegriffen wird der gefundene Feind");
});

test("controll() lässt die Türme nicht feuern", async () => {
  setupThreatenedRoom();
  const { controll } = await import("../src/controller/timing");

  controll();

  assert.equal(
    tower().attackCalls.length,
    0,
    "controll() ruft die Turmsteuerung nicht mehr auf — sie steht jetzt in controllCritical()",
  );
});

test("controllCritical() initialisiert das Raum-Memory", async () => {
  installGlobals();
  installTowerConstants();
  stubRooms(ROOM);
  game().time = QUIET_TICK;
  // Kein Game.rooms[ROOM], kein vorhandenes Memory.rooms — der karge Fall:
  // defenceController.tower() muss darauf ohne Wurf mit `continue` reagieren.
  const { controllCritical } = await import("../src/controller/timing");

  controllCritical();

  assert.equal(memory().init, true, "Memory.init wird gesetzt");
  assert.deepEqual(memory().terminals, [], "Memory.terminals wird angelegt");

  const roomMemory = memory().rooms[ROOM];
  assert.ok(roomMemory, "Memory.rooms[ROOM] wird angelegt");
  assert.equal(roomMemory.aktivPrioSpawn, false);
  assert.equal(roomMemory.hasLinks, false);
  assert.equal(roomMemory.needDefence, false);
  assert.equal(roomMemory.invaderCore, false);
  assert.equal(roomMemory.nuke, false);
  assert.equal(roomMemory.aktivPrioSpawnCount, 0);
});

test("controll() macht den Rest weiter: das Statuslog läuft bei % 11", async () => {
  installGlobals();
  stubRooms(ROOM);
  game().time = QUIET_TICK;
  memory().rooms = {
    [ROOM]: { aktivPrioSpawn: true },
  };
  const { controll } = await import("../src/controller/timing");

  const capturedConsole = captureConsole();
  try {
    controll();
  } finally {
    capturedConsole.restore();
  }

  assert.ok(
    capturedConsole.lines.some(line => line.includes(`PrioSpawn im Raum ${ROOM}`)),
    "memoryController.writeStatus() lief bei % 11 und hat geloggt",
  );
});

/* --------------------------------------------------------------------------
 * Plan 05, Befund 2: Staffelung des Verteidigungsscans (`defence.ts::check()`)
 * und der Tagessequenz (`timing.ts::daylie()`).
 *
 * Gemeinsamer Nenner beider Prüfungen ist ein Raum-Stub, dessen `find()` jeden
 * Aufruf protokolliert: welcher Job welchen Raum tatsächlich anfasst, lässt
 * sich über die ersetzten Modulfunktionen (`controller/memory.ts`,
 * `controller/rebuild.ts`, `controller/link-planner.ts`) nicht direkt
 * beobachten, wohl aber über ihre einzige gemeinsame Wirkung: sie rufen
 * `room.find()` auf dem ihnen übergebenen Raum auf. Ein Log genügt, um sowohl
 * "genau ein Raum je Tick" als auch "kein Raum bleibt aus" nachzuweisen.
 * -------------------------------------------------------------------------- */

interface FindLogEntry {
  room: string;
  type: number;
}

/** Ein Raum, dessen `find()` jeden Aufruf protokolliert und stets leer antwortet. */
function makeLoggingRoom(name: string, log: FindLogEntry[]): { name: string; find(type: number): unknown[] } {
  return {
    name,
    find(type: number) {
      log.push({ room: name, type });
      return [];
    },
  };
}

test("defenceController.check() prüft über sieben aufeinanderfolgende Ticks jeden Raum genau einmal", async () => {
  installGlobals();
  const { check } = await import("../src/controller/defence");

  const roomNames = Array.from({ length: 9 }, (_, i) => `D${i}`);
  const findLog: FindLogEntry[] = [];
  for (const name of roomNames) {
    anyGlobal.room[name] = { room: name, spawnRoom: name, sendDefender: true };
    memory().rooms ??= {};
    memory().rooms[name] = {};
    game().rooms[name] = makeLoggingRoom(name, findLog);
  }

  const handledCount = new Map(roomNames.map(name => [name, 0]));
  const START_TICK = 2000;

  for (let tick = START_TICK; tick < START_TICK + 7; tick++) {
    game().time = tick;
    findLog.length = 0;

    check();

    for (const touchedRoom of new Set(findLog.map(entry => entry.room))) {
      handledCount.set(touchedRoom, (handledCount.get(touchedRoom) ?? 0) + 1);
    }
  }

  for (const name of roomNames) {
    assert.equal(handledCount.get(name), 1, `${name} wurde über sieben Ticks genau einmal geprüft`);
  }
});

test("defenceController.check() bearbeitet in keinem einzelnen Tick alle Räume auf einmal", async () => {
  installGlobals();
  const { check } = await import("../src/controller/defence");

  const roomNames = Array.from({ length: 9 }, (_, i) => `D${i}`);
  const findLog: FindLogEntry[] = [];
  for (const name of roomNames) {
    anyGlobal.room[name] = { room: name, spawnRoom: name, sendDefender: true };
    memory().rooms ??= {};
    memory().rooms[name] = {};
    game().rooms[name] = makeLoggingRoom(name, findLog);
  }

  const START_TICK = 5000;
  for (let tick = START_TICK; tick < START_TICK + 7; tick++) {
    game().time = tick;
    findLog.length = 0;

    check();

    const touchedRooms = new Set(findLog.map(entry => entry.room));
    assert.ok(
      touchedRooms.size >= 1 && touchedRooms.size <= 2,
      `Tick ${tick}: erwartet 1-2 bearbeitete Räume bei 9 Räumen und Intervall 7, waren ${touchedRooms.size}`,
    );
    assert.ok(
      touchedRooms.size < roomNames.length,
      `Tick ${tick}: nicht alle ${roomNames.length} Räume dürfen im selben Tick bearbeitet werden`,
    );
  }
});

test("daylie() räumt bei Slot 0 auf, ohne einen gestaffelten Job zu starten", async () => {
  installGlobals();
  const { daylie } = await import("../src/controller/timing");

  const roomNames = ["S1", "S2"];
  for (const name of roomNames) {
    anyGlobal.room[name] = { room: name, spawnRoom: name, saveRoads: false };
  }

  const findLog: FindLogEntry[] = [];
  for (const name of roomNames) game().rooms[name] = makeLoggingRoom(name, findLog);

  memory().rooms = {
    S1: { roads: [{ id: "x", pos: {}, type: "b" }] },
    S2: {},
    // Raum ohne zugehörige Config in `bot.room` — clear() muss ihn entfernen.
    Ghost: {},
  };

  game().time = 28_800 * 3 + 0; // Slot 0

  daylie();

  assert.equal(memory().rooms.Ghost, undefined, "clear() entfernt Räume ohne Config");
  assert.equal(memory().rooms.S1.roads, undefined, "clear() entfernt roads, wenn saveRoads=false");
  assert.equal(findLog.length, 0, "Slot 0 löst keinen gestaffelten Job aus — kein find()-Aufruf");
  assert.equal(memory().terminals, undefined, "Slot 0 sammelt keine Terminals");
});

test("daylie() sammelt bei Slot 1 alle Terminals in einem Zug, nicht gestaffelt", async () => {
  installGlobals();
  const { daylie } = await import("../src/controller/timing");

  const roomNames = ["S1", "S2", "S3"];
  for (const name of roomNames) anyGlobal.room[name] = { room: name, spawnRoom: name };
  memory().rooms = { S1: {}, S2: {}, S3: {} };

  const findLog: FindLogEntry[] = [];
  const terminalByRoom: Record<string, { id: string }> = {
    S1: { id: "term-S1" },
    S2: { id: "term-S2" },
    S3: { id: "term-S3" },
  };
  for (const name of roomNames) {
    game().rooms[name] = {
      name,
      find(type: number) {
        findLog.push({ room: name, type });
        if (type === FIND_STRUCTURES) return [terminalByRoom[name]];
        return [];
      },
    };
  }

  game().time = 28_800 * 4 + 1; // Slot 1

  daylie();

  const touchedRooms = new Set(findLog.map(entry => entry.room));
  assert.deepEqual(
    [...touchedRooms].sort(),
    roomNames.slice().sort(),
    "Slot 1 durchläuft alle Räume in einem einzigen Tick — anders als die gestaffelten Jobs",
  );
  assert.deepEqual(
    (memory().terminals as string[]).slice().sort(),
    ["term-S1", "term-S2", "term-S3"],
    "Memory.terminals enthält nach einem Durchlauf alle Terminals",
  );
});

test("daylie() gibt ab Slot 2 jedem (Job, Raum)-Paar genau einen eigenen Tick", async () => {
  installGlobals();
  const { daylie } = await import("../src/controller/timing");

  const roomNames = ["A1", "A2", "A3"];
  // Reihenfolge von STAGGERED_DAILY_JOBS in timing.ts: Wälle, Container,
  // Türme, Straßen, Linkplaner — fünf Jobs.
  const JOB_COUNT = 5;

  for (const name of roomNames) {
    anyGlobal.room[name] = { room: name, spawnRoom: name, maxwallRepairer: 1, saveRoads: true };
  }

  memory().rooms = {};
  for (const name of roomNames) {
    // `roads: []` erfüllt die Vorbedingung von rebuildRoads (roomMemory?.roads
    // muss vorhanden sein), bleibt aber leer, damit kein RoomPosition-Stub
    // gebraucht wird.
    memory().rooms[name] = { roads: [] };
  }

  const findLog: FindLogEntry[] = [];
  for (const name of roomNames) {
    game().rooms[name] = {
      name,
      // level 7 erlaubt sowohl rebuildRoads (verlangt >= 7) als auch
      // planReceiverLinks (usesLinks() verlangt ein Kontingent > 0; bei
      // Level 7 sind das 4 Links laut CONTROLLER_STRUCTURES-Stub).
      controller: { my: true, level: 7 },
      find(type: number) {
        findLog.push({ room: name, type });
        // planReceiverLinks liest hierüber die Anzahl gebauter Links; 4
        // Treffer gegen ein Kontingent von 4 lassen freeSlots auf 0 fallen,
        // sodass der Job direkt danach abbricht — ohne RoomPosition-Stub.
        if (type === FIND_MY_STRUCTURES) {
          return [
            { structureType: STRUCTURE_LINK },
            { structureType: STRUCTURE_LINK },
            { structureType: STRUCTURE_LINK },
            { structureType: STRUCTURE_LINK },
          ];
        }
        return [];
      },
    };
  }

  const DAY_BASE = 28_800 * 5;
  const touchesPerRoom = new Map(roomNames.map(name => [name, 0]));
  const roomsPerJobWindow: string[][] = Array.from({ length: JOB_COUNT }, () => []);

  for (let index = 0; index < JOB_COUNT * roomNames.length; index++) {
    const slot = 2 + index;
    game().time = DAY_BASE + slot;
    findLog.length = 0;

    daylie();

    const touchedRooms = new Set(findLog.map(entry => entry.room));
    assert.equal(touchedRooms.size, 1, `Slot ${slot}: genau ein Raum darf bearbeitet werden`);

    const [touchedRoom] = [...touchedRooms];
    const expectedRoom = roomNames[index % roomNames.length]!;
    assert.equal(touchedRoom, expectedRoom, `Slot ${slot}: erwarteter Raum wäre ${expectedRoom}`);

    const jobIndex = Math.floor(index / roomNames.length);
    roomsPerJobWindow[jobIndex]!.push(touchedRoom!);
    touchesPerRoom.set(touchedRoom!, (touchesPerRoom.get(touchedRoom!) ?? 0) + 1);
  }

  for (const name of roomNames) {
    assert.equal(
      touchesPerRoom.get(name),
      JOB_COUNT,
      `${name} muss von jedem der ${JOB_COUNT} Jobs genau einmal bearbeitet worden sein`,
    );
  }
  for (let jobIndex = 0; jobIndex < JOB_COUNT; jobIndex++) {
    const distinctRoomsInWindow = new Set(roomsPerJobWindow[jobIndex]);
    assert.equal(
      distinctRoomsInWindow.size,
      roomNames.length,
      `Job ${jobIndex}: innerhalb seines Fensters muss jeder Raum genau einmal drankommen`,
    );
  }
});

test("daylie() tut nichts mehr, sobald das letzte (Job, Raum)-Paar durch ist", async () => {
  installGlobals();
  const { daylie } = await import("../src/controller/timing");

  const roomNames = ["A1", "A2", "A3"];
  const JOB_COUNT = 5;
  for (const name of roomNames) {
    anyGlobal.room[name] = { room: name, spawnRoom: name, maxwallRepairer: 1, saveRoads: true };
  }

  const findLog: FindLogEntry[] = [];
  for (const name of roomNames) game().rooms[name] = makeLoggingRoom(name, findLog);

  // Erster Slot jenseits des gültigen Bereichs (Indizes 0 .. JOB_COUNT*R - 1).
  const slotAfterLastPair = 2 + JOB_COUNT * roomNames.length;
  game().time = 28_800 * 6 + slotAfterLastPair;

  daylie();

  assert.equal(findLog.length, 0, "hinter dem letzten Paar darf kein find()-Aufruf mehr stattfinden");
});

test("daylie() wirft ohne konfigurierte Räume nicht", async () => {
  installGlobals(); // resetWorld() leert auch bot.room

  const { daylie } = await import("../src/controller/timing");

  game().time = 28_800 * 7 + 5; // irgendein Slot ab STAGGER_START

  assert.doesNotThrow(() => daylie());
});
