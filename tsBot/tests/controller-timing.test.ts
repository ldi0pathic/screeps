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
