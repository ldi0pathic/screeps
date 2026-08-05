/**
 * Prüft die Drossel des Upgraders (`src/roles/upgrader.ts`, private Methode
 * `_mayWork`, Plan 04 `docs/plans/04-rcl8-upgrader-und-gcl.md`) sowie die
 * RCL8-Rumpfwahl in `bodyFor`.
 *
 * GCL wächst ausschließlich aus Controller-Upgrades. Bis RCL7 galt eine grobe
 * Tickdrossel (`sparmodus`: arbeiten in einem von `level` Ticks), die bei
 * RCL8 zusammen mit dem alten Rumpf nur 3 % der erlaubten Rate ausschöpfte.
 * Ab RCL8 gilt jetzt eine Vorratsdrossel: gearbeitet wird, solange der
 * Downgrade-Timer knapp wird oder das Storage einen Überschuss über
 * `RCL8_WORK_RESERVE` (100 000) hat — unabhängig von `Game.time`.
 *
 * `_mayWork` ist privat und wird deshalb ausschließlich über `doJob` geprüft:
 * läuft die Drossel, darf **nichts** passieren (kein `checkHarvest`, keine
 * Aktion); läuft sie nicht, muss der Creep nachweislich weiterarbeiten.
 * Nachweis dafür ist hier ein zählender `checkHarvest`-Spion auf dem
 * Test-Creep, wie ihn `tests/roles-miner.test.ts` und `tests/roles-hauler.test.ts`
 * für andere Prüfungen ebenfalls direkt auf den Creep legen statt den echten
 * Prototyp aus `prototypes/creep-checks.ts` zu bemühen — hier reicht der
 * Zähler, weil `checkHarvest`s eigenes Verhalten nicht Gegenstand dieser Datei
 * ist.
 *
 * Damit `doJob` nach dem `checkHarvest`-Aufruf nicht auf fehlenden Methoden
 * stolpert, ist der Creep so gebaut, dass die Beschaffungskette aus
 * `creep/base.ts` bis zum Ende (oder bis zu einem erfolgreichen `withdraw` aus
 * dem Storage) durchläuft, ohne zu werfen: `memory.noLink = true` überspringt
 * die Controller-Link-Suche (kein `LinkList`/`Memory.rooms[...].links` nötig),
 * `room.find` liefert für die Containerliste eine leere Trefferliste,
 * `pos.findClosestByPath` liefert `null` für Drops/Tombstones/Ruinen, und
 * `getActiveBodyparts` liefert 0, damit `harvestRoomEnergySource` ohne
 * Quellensuche `false` meldet. Ist ein Storage mit Energie vorhanden, greift
 * `harvestRoomStorage` zuerst und beendet den Tick über einen erfolgreichen
 * `withdraw` — das ist zugleich der Beleg für "irgendeine Aktion".
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals } from "./support/screeps-stubs";

// `bodies.ts` liest `LINK_CAPACITY` schon beim Laden (siehe dessen Kopf) —
// ein statischer Import liefe vor `installGlobals()` und träfe die Konstante
// noch nicht an. Deshalb wie das Modul unter Test per `await import(...)`
// nach dem Anlegen der Globals geladen, nicht statisch.
async function loadBodies(): Promise<typeof import("../src/creep/bodies")> {
  return await import("../src/creep/bodies");
}

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

interface ControllerStubOptions {
  my?: boolean;
  ticksToDowngrade?: number;
}

/** Ein Controller-Stub mit den drei Feldern, die `_mayWork` liest. */
function controllerStub(level: number, options: ControllerStubOptions = {}) {
  return { my: options.my ?? true, level, ticksToDowngrade: options.ticksToDowngrade ?? 200000 };
}

interface UpgraderCreepOptions {
  controller?: ReturnType<typeof controllerStub> | undefined;
  /** Energie im Storage des Raums. `undefined` heißt: kein Storage vorhanden. */
  storageEnergy?: number;
  memory?: Record<string, any>;
}

/** Aufzeichnungen eines gestellten Upgrader-Creeps, siehe Dateikopf. */
interface UpgraderCreepState {
  checkHarvestCalls: number;
  withdrawCalls: number;
}

/**
 * Baut einen minimalen Upgrader-Creep: gerade genug, damit `doJob` die
 * Beschaffungskette durchläuft, ohne zu werfen — siehe Dateikopf für die
 * Begründung jedes einzelnen Stubs.
 */
function stubUpgraderCreep(options: UpgraderCreepOptions = {}): { creep: any; state: UpgraderCreepState } {
  const state: UpgraderCreepState = { checkHarvestCalls: 0, withdrawCalls: 0 };

  const storage =
    options.storageEnergy === undefined ? undefined : { store: { [RESOURCE_ENERGY]: options.storageEnergy } };

  const creep: any = {
    memory: {
      role: "upgrader",
      workroom: ROOM,
      home: ROOM,
      harvest: true,
      // Umgeht die Controller-Link-Suche per Kurzschluss (`&&`) — die
      // Linklogik ist nicht Gegenstand dieser Datei, siehe Dateikopf.
      noLink: true,
      ...options.memory,
    },
    room: {
      name: ROOM,
      controller: options.controller,
      storage,
      find: () => [],
    },
    pos: {
      findClosestByPath: () => null,
    },
    store: {
      getCapacity: () => 100,
      getUsedCapacity: () => 0,
      getFreeCapacity: () => 100,
    },
    getActiveBodyparts: () => 0,
    checkHarvest(): void {
      state.checkHarvestCalls += 1;
    },
    withdraw(): number {
      state.withdrawCalls += 1;
      return OK;
    },
  };

  return { creep, state };
}

/** Legt die Welt an und lädt die Rolle frisch, wie in den übrigen Rollentests. */
async function loadUpgrader(): Promise<typeof import("../src/roles/upgrader")> {
  installGlobals();
  anyGlobal.Memory.rooms = { [ROOM]: {} };
  return await import("../src/roles/upgrader");
}

// --- Drossel ---------------------------------------------------------------

test("RCL8 mit Überschuss: der Upgrader arbeitet in jedem Tick, auch bei Werten, die kein Vielfaches von acht sind", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { creep, state } = stubUpgraderCreep({
    controller: controllerStub(8),
    storageEnergy: 300000,
  });

  const ticks = [1000, 1001, 1003, 1007, 1008, 1015, 1024];
  for (const time of ticks) {
    anyGlobal.Game.time = time;
    upgrader.doJob(creep);
  }

  assert.equal(
    state.checkHarvestCalls,
    ticks.length,
    "der Creep arbeitet in jedem geprüften Tick, unabhängig davon, ob der Tick ein Vielfaches von acht ist",
  );
  assert.equal(state.withdrawCalls, ticks.length, "jeder Arbeitstick holt sich Energie aus dem Storage");
});

test("RCL8 ohne Überschuss: der Upgrader setzt aus", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { creep, state } = stubUpgraderCreep({
    controller: controllerStub(8),
    storageEnergy: 50000,
  });

  upgrader.doJob(creep);

  assert.equal(state.checkHarvestCalls, 0, "ohne Überschuss passiert nichts");
  assert.equal(state.withdrawCalls, 0);
});

test("RCL8: der Downgrade-Timer schlägt den Vorrat", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { creep, state } = stubUpgraderCreep({
    controller: controllerStub(8, { ticksToDowngrade: 99999 }),
    storageEnergy: 50000,
  });

  upgrader.doJob(creep);

  assert.equal(
    state.checkHarvestCalls,
    1,
    "läuft der Downgrade-Timer, arbeitet der Creep trotz niedrigem Vorrat — sonst verlöre der Raum die Stufe",
  );
});

test("RCL8: die Vorratsgrenze liegt bei genau 100000 — exakt reicht nicht, 100050 reicht", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const atThreshold = stubUpgraderCreep({ controller: controllerStub(8), storageEnergy: 100000 });
  upgrader.doJob(atThreshold.creep);
  assert.equal(atThreshold.state.checkHarvestCalls, 0, "genau 100000 reicht nicht — die Bedingung ist `>`, nicht `>=`");

  const aboveThreshold = stubUpgraderCreep({ controller: controllerStub(8), storageEnergy: 100050 });
  upgrader.doJob(aboveThreshold.creep);
  assert.equal(aboveThreshold.state.checkHarvestCalls, 1, "100050 reicht");
});

test("RCL8 ohne Storage: der Upgrader setzt aus, außer der Downgrade-Timer ruft", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const withoutTimer = stubUpgraderCreep({ controller: controllerStub(8) });
  upgrader.doJob(withoutTimer.creep);
  assert.equal(withoutTimer.state.checkHarvestCalls, 0, "ohne Storage und ohne Downgrade-Gefahr bleibt er untätig");

  const withTimer = stubUpgraderCreep({ controller: controllerStub(8, { ticksToDowngrade: 500 }) });
  upgrader.doJob(withTimer.creep);
  assert.equal(
    withTimer.state.checkHarvestCalls,
    1,
    "der Downgrade-Timer arbeitet auch ganz ohne Storage im Raum",
  );
});

test("unter RCL8 gilt weiter die Tickdrossel — ein voller Storage ändert daran nichts", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { creep, state } = stubUpgraderCreep({
    controller: controllerStub(7),
    storageEnergy: 300000,
    memory: { sparmodus: true },
  });

  anyGlobal.Game.time = 14; // Vielfaches von 7
  upgrader.doJob(creep);
  assert.equal(state.checkHarvestCalls, 1, "bei einem Vielfachen von level (7) arbeitet der Creep");

  anyGlobal.Game.time = 15; // kein Vielfaches von 7
  upgrader.doJob(creep);
  assert.equal(
    state.checkHarvestCalls,
    1,
    "sonst bleibt er untätig — auch mit vollem Storage: dieser Schritt ist ausdrücklich noch nicht angefasst (Plan 04, Punkt 3)",
  );
});

test("unter RCL8 ohne sparmodus arbeitet der Creep in jedem Tick", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { creep, state } = stubUpgraderCreep({
    controller: controllerStub(6),
    storageEnergy: 300000,
    memory: { sparmodus: false },
  });

  const ticks = [1, 2, 3, 4, 5, 6, 7];
  for (const time of ticks) {
    anyGlobal.Game.time = time;
    upgrader.doJob(creep);
  }

  assert.equal(state.checkHarvestCalls, ticks.length);
});

test("ohne Controller im Raum wird nicht gedrosselt und nichts geworfen", async () => {
  // Mehr als ein Randfall: `main.ts` wirft Rollenfehler weiter, statt sie
  // abzufangen. Ein Upgrader mit `sparmodus` (ab Level 6 gesetzt), der durch
  // einen Korridorraum ohne Controller läuft, rechnete vorher
  // `Game.time % controller.level` auf `undefined` — ein `TypeError`, der den
  // **kompletten Tick** abgebrochen hätte: alle Rollen nach ihm und der
  // Timing-Controller mit Türmen und Spawn.
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { creep, state } = stubUpgraderCreep({
    controller: undefined,
    memory: { sparmodus: true },
  });

  // Bewusst kein Vielfaches irgendeiner plausiblen Controller-Stufe (2–8) —
  // genau der Fall, in dem die alte Rechnung geworfen hätte.
  anyGlobal.Game.time = 13;

  assert.doesNotThrow(() => upgrader.doJob(creep));
  assert.equal(state.checkHarvestCalls, 1, "ohne Controller gibt es nichts zu drosseln — der Creep arbeitet weiter");
});

// --- bodyFor (über spawn()) --------------------------------------------------

interface SpawnCreepCall {
  profil: BodyPartConstant[];
  newName: string;
  memory?: Record<string, any>;
}

/** Ein Spawn-Stub, dessen `spawnCreep` jeden Aufruf (Dry-Run und echt) mitschreibt und immer erfolgreich meldet. */
function stubUpgraderSpawn(workroom: string, controllerLevel: number, energyCapacityAvailable: number) {
  const spawnCalls: SpawnCreepCall[] = [];
  const spawnObj: any = {
    room: {
      name: workroom,
      // Kein Storage: umgeht das RCL8-Spawn-Gate (`upgrader.ts` verlangt dort
      // zusätzlich `ticksToDowngrade`/Storage-Füllstand) — hier geht es nur um
      // die Rumpfwahl, nicht um das Spawn-Gate selbst.
      storage: undefined,
      controller: { my: true, level: controllerLevel, ticksToDowngrade: 200000 },
      energyCapacityAvailable,
    },
    spawnCreep(profil: BodyPartConstant[], newName: string, opts: { memory?: Record<string, any> } = {}): number {
      spawnCalls.push({ profil: [...profil], newName, memory: opts.memory });
      return OK;
    },
  };
  return { spawnObj, spawnCalls };
}

test("bodyFor: ab Stufe 8 gilt das RCL8-Profil (15 WORK, 5 CARRY, 5 MOVE)", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  anyGlobal.room[ROOM] = { room: ROOM, spawnRoom: ROOM, upgrader: 1 };
  anyGlobal.Game.rooms[ROOM] = { controller: { level: 8 } };
  anyGlobal._ = {
    filter: (collection: Record<string, any>, predicate: (item: any) => boolean) =>
      Object.values(collection).filter(predicate),
  };

  const { spawnObj, spawnCalls } = stubUpgraderSpawn(ROOM, 8, 12900);

  assert.equal(upgrader.spawn(spawnObj, ROOM), true);

  const { BODIES } = await loadBodies();
  const body = spawnCalls[spawnCalls.length - 1]!.profil;
  assert.deepEqual(body, BODIES.upgraderRcl8.build(12900), "derselbe Rumpf wie das RCL8-Profil direkt liefert");
  assert.equal(body.filter(part => part === WORK).length, 15);
  assert.equal(body.filter(part => part === CARRY).length, 5);
  assert.equal(body.filter(part => part === MOVE).length, 5);
});

test("bodyFor: unter Stufe 8 gilt weiter das reguläre Profil", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  anyGlobal.room[ROOM] = { room: ROOM, spawnRoom: ROOM, upgrader: 1 };
  anyGlobal.Game.rooms[ROOM] = { controller: { level: 7 } };
  anyGlobal._ = {
    filter: (collection: Record<string, any>, predicate: (item: any) => boolean) =>
      Object.values(collection).filter(predicate),
  };

  const { spawnObj, spawnCalls } = stubUpgraderSpawn(ROOM, 7, 2300);

  assert.equal(upgrader.spawn(spawnObj, ROOM), true);

  const { BODIES } = await loadBodies();
  const body = spawnCalls[spawnCalls.length - 1]!.profil;
  assert.deepEqual(body, BODIES.upgrader.build(2300), "derselbe Rumpf wie das reguläre Profil direkt liefert");
  assert.notEqual(body.filter(part => part === WORK).length, 15, "nicht das RCL8-Profil");
});
