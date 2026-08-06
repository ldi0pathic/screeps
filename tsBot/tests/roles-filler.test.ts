/**
 * Prüft die Rolle "filler" (`src/roles/filler.ts`, Plan 10 „Logistik nach Job
 * schneiden statt nach Kaskade", Runde 3): Storage → Spawn, Extensions, Türme
 * im eigenen Heimatraum. Ersetzt den Freelancer-Debitor und den
 * Heimatraum-Anteil des Debitors; der Sinn ist CPU, deshalb tut die Rolle
 * wenig und immer dasselbe (kein Fernziel, kein Ausweichjob).
 *
 * `doJob` ruft `creep.checkHarvest()` auf — das ist der Prototyp aus
 * `prototypes/creep-checks.ts`. Damit er hier greift, braucht die gestellte
 * Welt überhaupt erst ein globales `Creep`, an dessen `prototype` er sich
 * hängen kann; `stubActor`-Creeps sind aber plain objects, deshalb wird die
 * Methode danach direkt auf jeden Test-Creep kopiert statt über eine
 * Prototypkette aufgelöst.
 *
 * `Filler.spawn` filtert `Game.creeps` über `_.filter` (lodash im Spiel
 * global) — `screeps-stubs.ts` legt kein `_` an, hier genügt ein minimaler
 * lokaler Ersatz mit `filter`/`find`.
 *
 * Zwei Zählungen in `spawn` unterscheiden sich absichtlich in einer Klammer:
 * die reguläre Zählung ignoriert einen Creep mit `ticksToLive <= 100` (der
 * Nachfolger soll rechtzeitig kommen), die Notfallprüfung dagegen fragt nur
 * „lebt überhaupt noch einer" — ganz ohne `ticksToLive`. Beides wird unten
 * getrennt geprüft, damit der Unterschied nicht wieder "vereinheitlicht" wird.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installCreepChecks } from "../src/prototypes/creep-checks";
import { moveCalls } from "./support/movement-stubs";
import {
  actionCalls,
  configureRoom,
  installCreepWorld,
  roomMemory,
  stubActor,
  stubRoom,
  stubStore,
  stubStructure,
} from "./support/creep-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

/** Aufzeichnung eines `spawnCreep`-Aufrufs, ob Dry-Run oder echt. */
interface SpawnCreepCall {
  profil: BodyPartConstant[];
  newName: string;
  memory?: Record<string, any>;
  dryRun: boolean;
}

/** Alle `spawnCreep`-Aufrufe seit der letzten Weltinstallation. */
let spawnCalls: SpawnCreepCall[] = [];

let fillerWorldInstalled = false;

/** Legt die Filler-Welt an: `Creep`, `installCreepChecks()`, ein minimales `_`. */
function installFillerWorld(): void {
  installCreepWorld();

  if (!fillerWorldInstalled) {
    fillerWorldInstalled = true;

    anyGlobal.Creep = function (this: any) {};
    installCreepChecks();

    anyGlobal._ = {
      filter<T>(collection: Record<string, T> | T[], predicate: (item: T) => boolean): T[] {
        const values = Array.isArray(collection) ? collection : Object.values(collection);
        return values.filter(predicate);
      },
      find<T>(collection: Record<string, T> | T[], predicate: (item: T) => boolean): T | undefined {
        const values = Array.isArray(collection) ? collection : Object.values(collection);
        return values.find(predicate);
      },
    };
  }

  spawnCalls = [];
}

async function loadFiller(): Promise<typeof import("../src/roles/filler")> {
  installFillerWorld();
  return await import("../src/roles/filler");
}

/** Kopiert `checkHarvest` direkt auf den Test-Creep — siehe Dateikopf. */
function addCheckHarvest<T>(creep: T): T {
  (creep as any).checkHarvest = anyGlobal.Creep.prototype.checkHarvest;
  return creep;
}

/** Kosten eines Rumpfs, wie `spawnCreep` sie im Dry-Run gegen die Energie prüft. */
function bodyCost(body: BodyPartConstant[]): number {
  return body.reduce((total, part) => total + (BODYPART_COST as any)[part], 0);
}

/**
 * Ein Spawn, dessen `spawnCreep` echten Dry-Run-Regeln folgt: bezahlbar ist
 * ein Rumpf, dessen Kosten die **verfügbare** (nicht die maximale) Energie
 * nicht übersteigen — genau der Unterschied, den der Notfallzweig ausnutzt.
 */
function stubFillerSpawn(
  roomName: string,
  options: { storage?: unknown; energyCapacityAvailable?: number; energyAvailable?: number } = {},
): any {
  const energyCapacityAvailable = options.energyCapacityAvailable ?? 2300;
  const energyAvailable = options.energyAvailable ?? energyCapacityAvailable;

  return {
    room: {
      name: roomName,
      storage: options.storage,
      energyCapacityAvailable,
      energyAvailable,
    },
    spawnCreep(
      profil: BodyPartConstant[],
      newName: string,
      opts?: { dryRun?: boolean; memory?: Record<string, any> },
    ): number {
      const dryRun = Boolean(opts?.dryRun);
      spawnCalls.push({ profil: [...profil], newName, memory: opts?.memory, dryRun });

      if (dryRun) {
        return bodyCost(profil) <= energyAvailable ? OK : ERR_NOT_ENOUGH_ENERGY;
      }
      return OK;
    },
  };
}

/** Ein Filler-Creep in `Game.creeps`, wie ihn `Filler.spawn` selbst zählt. */
function registerFillerCreepInGame(
  name: string,
  workroom: string,
  ticksToLive: number,
  options: { role?: string; spawning?: boolean } = {},
): void {
  anyGlobal.Game.creeps[name] = {
    memory: { role: options.role ?? "filler", workroom },
    ticksToLive,
    spawning: options.spawning ?? false,
  };
}

test("Beschaffung: das Storage wird bevorzugt, ein Container bleibt unangetastet", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(9000, { energy: 5000 }));
  const container = stubStructure("container1", STRUCTURE_CONTAINER, 12, 10, ROOM, stubStore(2000, { energy: 2000 }));
  roomMemory(ROOM, { container: [container.id] });

  const creep = addCheckHarvest(
    stubActor(10, 10, ROOM, {
      store: stubStore(500),
      memory: { role: "filler", workroom: ROOM, home: ROOM, harvest: true, mineral: RESOURCE_ENERGY },
      room: stubRoom(ROOM, { storage }),
    }),
  );

  filler.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "withdraw", targetId: "storage", resource: RESOURCE_ENERGY }]);
  assert.equal(creep.memory.fromId, "storage");
  assert.equal(creep.memory.harvest, true, "der Zustand bleibt unverändert, bis der Creep voll ist");
});

test("Beschaffung: leeres Storage fällt auf die Quellcontainer zurück", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(9000, { energy: 0 }));
  const container = stubStructure("container1", STRUCTURE_CONTAINER, 12, 10, ROOM, stubStore(2000, { energy: 1000 }));
  roomMemory(ROOM, { container: [container.id] });

  const creep = addCheckHarvest(
    stubActor(10, 10, ROOM, {
      store: stubStore(500),
      memory: { role: "filler", workroom: ROOM, home: ROOM, harvest: true, mineral: RESOURCE_ENERGY },
      room: stubRoom(ROOM, { storage }),
    }),
  );

  filler.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "withdraw", targetId: "container1", resource: RESOURCE_ENERGY }]);
  assert.equal(
    creep.memory.fromId,
    "container1",
    "der hauler füllt sonst das Storage, aber in der Lücke soll der Spawn nicht verhungern",
  );
});

test("Abliefern: zuerst Spawn und Extensions, danach die Türme", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  const fullSpawn = stubStructure("spawn1", STRUCTURE_SPAWN, 20, 20, ROOM, stubStore(300, { energy: 300 }));
  const freeExtension = stubStructure("ext1", STRUCTURE_EXTENSION, 21, 20, ROOM, stubStore(50, { energy: 0 }));
  // Der Turm hat die größere Lücke — trotzdem darf er in diesem Tick nicht drankommen.
  const emptyTower = stubStructure("tower1", STRUCTURE_TOWER, 25, 25, ROOM, stubStore(1000, { energy: 0 }));

  const creep = addCheckHarvest(
    stubActor(10, 10, ROOM, {
      store: stubStore(500, { energy: 500 }),
      memory: { role: "filler", workroom: ROOM, home: ROOM, harvest: false, mineral: RESOURCE_ENERGY },
      room: stubRoom(ROOM, { found: { [FIND_MY_STRUCTURES]: [emptyTower] } }),
      closest: { [FIND_MY_STRUCTURES]: [fullSpawn, freeExtension] },
    }),
  );

  filler.doJob(creep);

  assert.equal(actionCalls.length, 1, "der Turm wird in diesem Tick nicht mehr bedient");
  assert.equal(actionCalls[0]!.targetId, "ext1", "die Extension gewinnt, obwohl der Turm eine größere Lücke hat");

  // Erst wenn Spawn und Extensions nichts mehr annehmen, kommt der Turm dran.
  installFillerWorld();
  const anotherFullSpawn = stubStructure("spawn1", STRUCTURE_SPAWN, 20, 20, ROOM, stubStore(300, { energy: 300 }));
  const fullExtension = stubStructure("ext1", STRUCTURE_EXTENSION, 21, 20, ROOM, stubStore(50, { energy: 50 }));
  const hungryTower = stubStructure("tower1", STRUCTURE_TOWER, 25, 25, ROOM, stubStore(1000, { energy: 0 }));

  const secondCreep = addCheckHarvest(
    stubActor(10, 10, ROOM, {
      store: stubStore(500, { energy: 500 }),
      memory: { role: "filler", workroom: ROOM, home: ROOM, harvest: false, mineral: RESOURCE_ENERGY },
      room: stubRoom(ROOM, {
        found: { [FIND_MY_STRUCTURES]: [anotherFullSpawn, fullExtension, hungryTower] },
      }),
      closest: { [FIND_MY_STRUCTURES]: [anotherFullSpawn, fullExtension] },
    }),
  );

  filler.doJob(secondCreep);

  assert.equal(actionCalls[0]!.targetId, "tower1", "ohne Lücke bei Spawn/Extension springt der Turm ein");
});

test("Nichts zu füllen: der Filler bleibt beladen stehen, ohne Storage-Rückgabe oder Bewegung", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  const fullSpawn = stubStructure("spawn1", STRUCTURE_SPAWN, 20, 20, ROOM, stubStore(300, { energy: 300 }));
  const fullExtension = stubStructure("ext1", STRUCTURE_EXTENSION, 21, 20, ROOM, stubStore(50, { energy: 50 }));
  const fullTower = stubStructure("tower1", STRUCTURE_TOWER, 25, 25, ROOM, stubStore(1000, { energy: 1000 }));
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 30, 30, ROOM, stubStore(900000, { energy: 0 }));

  const creep = addCheckHarvest(
    stubActor(10, 10, ROOM, {
      store: stubStore(500, { energy: 500 }),
      memory: {
        role: "filler",
        workroom: ROOM,
        home: ROOM,
        harvest: false,
        mineral: RESOURCE_ENERGY,
        // Woher die Ladung kam: würde `doJob` sie doch ins Storage kippen
        // wollen, bliebe genau dieser Ausschluss übrig — er greift hier nicht,
        // weil `doJob` `TransportToHomeStorage` gar nicht erst aufruft.
        fromId: "storage",
      },
      room: stubRoom(ROOM, { storage, found: { [FIND_MY_STRUCTURES]: [fullSpawn, fullExtension, fullTower] } }),
      closest: { [FIND_MY_STRUCTURES]: [fullSpawn, fullExtension] },
    }),
  );

  filler.doJob(creep);

  assert.equal(actionCalls.length, 0, "kein Transfer — weder an Spawn/Extension noch an den Turm noch ins Storage");
  assert.equal(moveCalls.length, 0, "keine Bewegung: der Filler bleibt sofort bereit für die nächste Lücke");
  assert.equal(creep.memory.harvest, false, "der Zustand bleibt unverändert");
});

test("spawn: nur der eigene Raum, ohne jede weitere Prüfung", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  // `bot.room[ROOM]` bleibt absichtlich unkonfiguriert: läse die Funktion
  // trotzdem weiter, würfe sie hier (Zugriff auf ein undefiniertes Objekt) —
  // der frühe `return false` ist also durch das Ausbleiben jedes Fehlers belegt.
  const spawn = stubFillerSpawn("E58N7");

  assert.equal(filler.spawn(spawn, ROOM), false);
  assert.equal(spawnCalls.length, 0);
});

test("spawn: ohne Storage bleibt der Debitor als Allrounder zuständig", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  configureRoom(ROOM, { sendDebitor: true });
  // RCL 4, aber kein Storage — bewusst am Bauwerk festgemacht, nicht am RCL.
  const spawn = stubFillerSpawn(ROOM, { storage: undefined });
  spawn.room.controller = { my: true, level: 4 };

  assert.equal(filler.spawn(spawn, ROOM), false);
  assert.equal(spawnCalls.length, 0);
});

test("spawn: ohne sendDebitor kein Filler, auch mit Storage", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  configureRoom(ROOM, { sendDebitor: false });
  const spawn = stubFillerSpawn(ROOM, { storage: {} });

  assert.equal(filler.spawn(spawn, ROOM), false);
  assert.equal(spawnCalls.length, 0);
});

test("spawn: genau einer je Raum, mit debitorAsFreelancer entsprechend mehr", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  // Ohne `debitorAsFreelancer` (also 0): `wanted` ist trotzdem mindestens 1.
  configureRoom(ROOM, { sendDebitor: true });
  registerFillerCreepInGame("filler_1", ROOM, 200);
  const spawnDefault = stubFillerSpawn(ROOM, { storage: {} });

  assert.equal(filler.spawn(spawnDefault, ROOM), false, "es lebt schon einer");
  assert.equal(spawnCalls.length, 0, "es wird nicht einmal ein Dry-Run versucht");

  // debitorAsFreelancer: 2 — zwei Lebende reichen ebenfalls.
  installFillerWorld();
  configureRoom(ROOM, { sendDebitor: true, debitorAsFreelancer: 2 });
  registerFillerCreepInGame("filler_1", ROOM, 200);
  registerFillerCreepInGame("filler_2", ROOM, 300);
  const spawnTwoAlive = stubFillerSpawn(ROOM, { storage: {} });

  assert.equal(filler.spawn(spawnTwoAlive, ROOM), false, "zwei von zwei sind genug");
  assert.equal(spawnCalls.length, 0);

  // debitorAsFreelancer: 2, aber nur einer lebt — der zweite wird gespawnt.
  installFillerWorld();
  configureRoom(ROOM, { sendDebitor: true, debitorAsFreelancer: 2 });
  registerFillerCreepInGame("filler_1", ROOM, 200);
  const spawnOneMissing = stubFillerSpawn(ROOM, { storage: {} });

  assert.equal(filler.spawn(spawnOneMissing, ROOM), true, "einer von zweien fehlt noch");
  const real = spawnCalls.filter(call => !call.dryRun);
  assert.equal(real.length, 1);
  assert.equal(real[0]!.memory!.role, "filler");
  assert.equal(real[0]!.memory!.notfall, false);
});

test("spawn: ein Filler mit ticksToLive <= 100 zählt für die reguläre Zählung nicht mehr mit", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  configureRoom(ROOM, { sendDebitor: true });
  // Genau die Grenze: `ticksToLive > 100` ist hier falsch, der Creep zählt nicht.
  registerFillerCreepInGame("filler_1", ROOM, 100);
  const spawn = stubFillerSpawn(ROOM, { storage: {} });

  assert.equal(filler.spawn(spawn, ROOM), true, "der Nachfolger kommt rechtzeitig, statt auf das Lebensende zu warten");
  const real = spawnCalls.filter(call => !call.dryRun);
  assert.equal(real.length, 1);
});

test("spawn: Notfallprofil aus CARRY/MOVE-Paaren, wenn das reguläre Profil nicht bezahlbar ist", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  configureRoom(ROOM, { sendDebitor: true });
  // Kein Filler lebt. Das reguläre Profil richtet sich nach der Kapazität
  // (teuer), verfügbar ist aber nur ein Bruchteil davon — der Dry-Run des
  // regulären Profils schlägt fehl, der Notfallzweig greift.
  const spawn = stubFillerSpawn(ROOM, { storage: {}, energyCapacityAvailable: 2300, energyAvailable: 300 });

  assert.equal(filler.spawn(spawn, ROOM), true);

  const real = spawnCalls.filter(call => !call.dryRun);
  assert.equal(real.length, 1, "genau ein erfolgreicher Spawn — das Notfallprofil");

  const profil = real[0]!.profil;
  const carryParts = profil.filter(part => part === CARRY).length;
  const moveParts = profil.filter(part => part === MOVE).length;
  assert.equal(carryParts, 3, "min(max(floor(300/100), 1), 16) = 3 Paare");
  assert.equal(moveParts, 3);
  assert.equal(carryParts, moveParts, "immer paarweise CARRY und MOVE");

  // Kern der Regel, nicht nur Kosmetik: `controller/spawn.ts` überspringt für
  // einen Spawn, unter dessen Heimatcreeps ein `notfall` steht, das Spawnen
  // **aller anderen** Arbeitsräume dieses Spawns. Ein `notfall: true` würde die
  // Remote-Räume bis zu 1500 Ticks lang blockieren — anders als beim
  // Notfalldebitor bleibt der Notfallfiller deshalb bewusst bei `notfall: false`.
  assert.equal(real[0]!.memory!.notfall, false);
});

test("spawn: lebt noch ein Filler, gibt es keinen Notfallspawn — auch ein sterbender zählt hier noch", async () => {
  const { Filler } = await loadFiller();
  const filler = new Filler();

  configureRoom(ROOM, { sendDebitor: true });
  // Zählt für die reguläre Prüfung nicht mehr mit (ticksToLive <= 100), blockiert
  // den Notfallzweig aber trotzdem: dessen Prüfung fragt nur „lebt überhaupt
  // noch einer", ganz ohne `ticksToLive`.
  registerFillerCreepInGame("filler_1", ROOM, 5);
  const spawn = stubFillerSpawn(ROOM, { storage: {}, energyCapacityAvailable: 2300, energyAvailable: 300 });

  assert.equal(filler.spawn(spawn, ROOM), false);
  assert.equal(spawnCalls.some(call => !call.dryRun), false, "kein einziger echter Spawn-Aufruf");
});
