/**
 * Prüft die Rolle "linkkeeper" (`src/roles/linkkeeper.ts`) an ihrer neuen
 * Stelle: der Creep pendelt nicht mehr nur Link → Storage, sondern füllt den
 * Link aus dem Storage, wenn der Raum den Controller-Link nachfüllen muss.
 *
 * Beide Richtungen hängen an derselben Funktion `needsStorageFeed`
 * (`src/controller/links.ts`) wie das Sendenetz — der Keeper handelt im Tick
 * **vor** dem Netz (`main.ts` fährt erst Creeps, dann `timing.controll()`),
 * eine eigene Regel würde deshalb genau in dem Tick den Link leerziehen, in dem
 * das Netz senden wollte.
 *
 * Der Standplatz wird über `memory.post` vorgegeben, damit `_findPost` nicht
 * gestellt werden muss — dessen Geometriesuche ist hier nicht Gegenstand.
 * `RoomPosition` kommt aus `movement-stubs.ts`, weil `doJob` die gemerkte
 * Position damit rekonstruiert.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installMovement } from "./support/movement-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";
const POST = { x: 20, y: 20 };

/** Eine Aktion des Creeps: `transfer` oder `withdraw`, mit Ziel-Id. */
interface ActionCall {
  action: "transfer" | "withdraw";
  targetId: string;
}

/** Alle Aktionen seit dem letzten `installKeeperWorld()`. */
let actionCalls: ActionCall[] = [];

/** Registry für `Game.getObjectById`, lokal für diese Testdatei. */
const registry = new Map<string, any>();

function installKeeperWorld(): void {
  installMovement();
  for (const key of Object.keys(anyGlobal.Game.rooms)) delete anyGlobal.Game.rooms[key];
  registry.clear();
  actionCalls = [];
  anyGlobal.Game.getObjectById = (id: string) => registry.get(id) ?? null;
}

async function loadLinkKeeper(): Promise<typeof import("../src/roles/linkkeeper")> {
  installKeeperWorld();
  return await import("../src/roles/linkkeeper");
}

/** Ein Link-Stub mit Energie und freiem Platz, registriert für `Game.getObjectById`. */
function stubLink(id: string, energy: number, cooldown = 0) {
  const link = {
    id,
    cooldown,
    store: {
      [RESOURCE_ENERGY]: energy,
      getUsedCapacity: (_resource?: string): number => energy,
      getFreeCapacity: (_resource?: string): number => LINK_CAPACITY - energy,
    },
  };
  registry.set(id, link);
  return link;
}

/** Ein Storage-Stub mit Gesamtbelegung und Energieanteil. */
function stubStorage(options: { used?: number; energy?: number } = {}) {
  const energy = options.energy ?? 300000;
  const used = options.used ?? energy;

  return {
    id: "storage",
    store: {
      [RESOURCE_ENERGY]: energy,
      getCapacity: (): number => 1000000,
      getUsedCapacity: (resource?: string): number => (resource === undefined ? used : energy),
    },
  };
}

/**
 * Baut die Welt für einen Tick des Keepers und liefert den Creep.
 *
 * Der Creep steht bereits auf seinem Standplatz (`memory.post` gesetzt und
 * `pos` gleich), damit `doJob` unmittelbar beim Pendeln ankommt.
 */
function setupKeeper(options: {
  carrying: number;
  linkEnergy: number;
  controllerLinkEnergy: number;
  senderEnergy: number;
  storageEnergy?: number;
  storageUsed?: number;
}) {
  const spawnLink = stubLink("spawn-link", options.linkEnergy);
  const controllerLink = stubLink("controller-link", options.controllerLinkEnergy);
  const sender = stubLink("sender", options.senderEnergy);
  const storage = stubStorage({ energy: options.storageEnergy, used: options.storageUsed });

  anyGlobal.Memory.rooms = {
    [ROOM]: { links: { controller: controllerLink.id, spawn: spawnLink.id, sender: [sender.id] } },
  };

  const room = {
    name: ROOM,
    controller: { my: true, level: 7 },
    storage,
  };
  anyGlobal.Game.rooms[ROOM] = room;

  const creep: any = {
    name: "linkkeeper_1",
    memory: { role: "linkkeeper", workroom: ROOM, home: ROOM, post: { ...POST } },
    room,
    pos: new anyGlobal.RoomPosition(POST.x, POST.y, ROOM),
    store: {
      getUsedCapacity: (_resource?: string): number => options.carrying,
    },
    say: (): number => OK,
    transfer(target: { id: string }): number {
      actionCalls.push({ action: "transfer", targetId: target.id });
      return OK;
    },
    withdraw(target: { id: string }): number {
      actionCalls.push({ action: "withdraw", targetId: target.id });
      return OK;
    },
  };

  return { creep, spawnLink, storage };
}

test("ohne Bedarf leert der Keeper den Link ins Storage — wie bisher", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  // Ein Quell-Link mit Ladung schließt den Rückfall aus.
  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 800,
    controllerLinkEnergy: 0,
    senderEnergy: 500,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "withdraw", targetId: "spawn-link" }]);
});

test("ohne Bedarf und mit Ladung liefert der Keeper zuerst ins Storage ab", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 800,
    linkEnergy: 800,
    controllerLinkEnergy: 0,
    senderEnergy: 500,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [
    { action: "transfer", targetId: "storage" },
    { action: "withdraw", targetId: "spawn-link" },
  ]);
});

test("mit Bedarf und leerer Ladung holt der Keeper Energie aus dem Storage", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 0,
    controllerLinkEnergy: 0,
    senderEnergy: 0,
  });

  keeper.doJob(creep);

  assert.deepEqual(
    actionCalls,
    [{ action: "withdraw", targetId: "storage" }],
    "die Richtung kehrt sich um: aus dem Storage statt aus dem Link",
  );
});

test("mit Bedarf und voller Ladung schiebt der Keeper sie in den Link", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 800,
    linkEnergy: 0,
    controllerLinkEnergy: 0,
    senderEnergy: 0,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "transfer", targetId: "spawn-link" }]);
});

test("mit Bedarf wird der Link nicht mehr geleert — sonst nähme das Sendenetz ihn leer vor", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 800,
    controllerLinkEnergy: 0,
    senderEnergy: 0,
  });

  keeper.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.action === "withdraw" && call.targetId === "spawn-link"),
    false,
    "der Keeper handelt im Tick vor dem Sendenetz — leerte er hier, hätte das Netz nichts zu senden",
  );
});

test("im Vollpumpmodus wird gefüllt, obwohl ein Quell-Link liefert", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  // Der Controller-Link hält mehr als `SEND_MIN` — der Rückfall ist damit
  // ausgeschlossen, allein der Überlauf löst aus. Bewusst **nicht** randvoll:
  // der Link-Stub dieser Datei leitet den freien Platz aus der Energie ab, und
  // ein Controller-Link mit weniger als `SEND_MIN` freiem Platz nimmt seit
  // `needsStorageFeed`s Empfängerprüfung nichts mehr an.
  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 0,
    controllerLinkEnergy: 500,
    senderEnergy: 500,
    storageEnergy: 400000,
    storageUsed: 950000,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "withdraw", targetId: "storage" }]);
});
