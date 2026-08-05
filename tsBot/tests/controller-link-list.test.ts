/**
 * Prüft `LinkList` (`src/controller/link-list.ts`): die Klassifizierung der
 * Links eines Raums nach Config und Lage, sowie das Auflösen und Verwerfen der
 * gemerkten Ids.
 *
 * Die gestellte `RoomPosition` aus `movement-stubs.ts` kennt kein `getRangeTo`
 * (nur `isEqualTo`/`inRangeTo`) — hier reicht ein einfaches Objektliteral mit
 * Chebyshev-Distanz, wie Screeps sie für Reichweiten verwendet. Ein eigener
 * `Game.getObjectById`-Registry ersetzt die Registrierung aus
 * `creep-stubs.ts`, damit dieser Test ohne die Bewegungs- und Aktions-Stubs
 * auskommt, die er nicht braucht.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals, memory } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;

/** Registry für `Game.getObjectById`, lokal für diese Testdatei. */
const registry = new Map<string, any>();

/** Legt Game/Memory an und verdrahtet `Game.getObjectById` gegen die lokale Registry. */
function installLinkWorld(): void {
  installGlobals();
  registry.clear();
  anyGlobal.Game.getObjectById = (id: string) => registry.get(id) ?? null;
}

async function loadLinkList(): Promise<typeof import("../src/controller/link-list")> {
  installLinkWorld();
  return await import("../src/controller/link-list");
}

/** Eine Position mit `getRangeTo` (Chebyshev-Distanz, wie im Spiel). */
function stubPos(x: number, y: number, roomName: string) {
  return {
    x,
    y,
    roomName,
    getRangeTo(other: { x: number; y: number }): number {
      return Math.max(Math.abs(x - other.x), Math.abs(y - other.y));
    },
  };
}

/** Ein Link, registriert für `Game.getObjectById`. */
function stubLink(id: string, x: number, y: number, roomName: string) {
  const link = { id, structureType: STRUCTURE_LINK, pos: stubPos(x, y, roomName), store: {} };
  registry.set(id, link);
  return link;
}

/** Ein Raum, dessen `find(FIND_MY_STRUCTURES, {filter})` aus der Linkliste antwortet. */
function stubRoom(
  name: string,
  links: ReturnType<typeof stubLink>[],
  options: { controller?: ReturnType<typeof stubPos>; storage?: ReturnType<typeof stubPos> } = {},
) {
  return {
    name,
    controller: options.controller ? { pos: options.controller } : undefined,
    storage: options.storage ? { pos: options.storage } : undefined,
    find(type: number, opts?: { filter?: (structure: any) => boolean }): any[] {
      if (type !== FIND_MY_STRUCTURES) return [];
      return opts?.filter ? links.filter(opts.filter) : links;
    },
  };
}

/** Trägt eine Raumkonfiguration in `global.room` ein (`controllerLink`/`spawnLink`). */
function setRoomConfig(name: string, config: Record<string, any>): void {
  anyGlobal.room[name] = config;
}

/** Legt `Memory.rooms[name]` an, damit `isRoomKnown` zutrifft. */
function setRoomMemory(name: string, value: Record<string, any> = {}): Record<string, any> {
  anyGlobal.Memory.rooms ??= {};
  anyGlobal.Memory.rooms[name] = value;
  return anyGlobal.Memory.rooms[name];
}

test("ohne Config: Lage entscheidet — Controller- und Storage-Link, alle übrigen senden", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName);

  const controllerPos = stubPos(25, 25, roomName);
  const storagePos = stubPos(10, 10, roomName);

  const controllerLink = stubLink("controller-link", 22, 25, roomName); // Reichweite 3
  const storageLink = stubLink("storage-link", 12, 10, roomName); // Reichweite 2
  const senderLink = stubLink("sender-link", 40, 40, roomName);

  const room = stubRoom(roomName, [controllerLink, storageLink, senderLink], {
    controller: controllerPos,
    storage: storagePos,
  });

  const list = new LinkList(roomName);
  list.discover(room as any);

  assert.equal(list.controllerLink?.id, "controller-link");
  assert.equal(list.spawnLink?.id, "storage-link");
  assert.deepEqual(
    list.senders().map(link => link.id),
    ["sender-link"],
  );
});

test("Config gewinnt über Lage, auch wenn ein anderer Link näher liegt", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName);

  const controllerPos = stubPos(25, 25, roomName);
  const storagePos = stubPos(10, 10, roomName);

  const nearController = stubLink("near-controller", 22, 25, roomName); // Reichweite 3
  const configuredController = stubLink("configured-controller", 20, 20, roomName); // weiter weg
  const nearStorage = stubLink("near-storage", 12, 10, roomName); // Reichweite 2
  const configuredSpawn = stubLink("configured-spawn", 5, 5, roomName); // weiter weg

  setRoomConfig(roomName, { controllerLink: "configured-controller", spawnLink: "configured-spawn" });

  const room = stubRoom(roomName, [nearController, configuredController, nearStorage, configuredSpawn], {
    controller: controllerPos,
    storage: storagePos,
  });

  const list = new LinkList(roomName);
  list.discover(room as any);

  assert.equal(list.controllerLink?.id, "configured-controller");
  assert.equal(list.spawnLink?.id, "configured-spawn");
  assert.deepEqual(
    list.senders().map(link => link.id).sort(),
    ["near-controller", "near-storage"],
  );
});

test("eine Config-Id ohne passenden Link im Raum wird ignoriert — die Lage-Regel greift", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName);

  const controllerPos = stubPos(25, 25, roomName);
  const nearController = stubLink("near-controller", 22, 25, roomName); // Reichweite 3

  setRoomConfig(roomName, { controllerLink: "verschwunden" });

  const room = stubRoom(roomName, [nearController], { controller: controllerPos });

  const list = new LinkList(roomName);
  list.discover(room as any);

  assert.equal(list.controllerLink?.id, "near-controller");
});

test("ein Link ist nie beides: liegt er bei Controller und Storage, wird er nur Controller-Empfänger", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName);

  const controllerPos = stubPos(25, 25, roomName);
  const storagePos = stubPos(26, 25, roomName);
  const bothLink = stubLink("both", 24, 25, roomName); // Reichweite 1 zum Controller, 2 zum Storage

  const room = stubRoom(roomName, [bothLink], { controller: controllerPos, storage: storagePos });

  const list = new LinkList(roomName);
  list.discover(room as any);

  assert.equal(list.controllerLink?.id, "both");
  assert.equal(list.spawnLink, null);
  assert.deepEqual(list.senders(), []);
});

test("Links außerhalb beider Reichweiten sind Sender", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName);

  const controllerPos = stubPos(25, 25, roomName);
  const storagePos = stubPos(10, 10, roomName);
  const farLink = stubLink("far", 40, 40, roomName); // Reichweite 15 zum Controller, 30 zum Storage

  const room = stubRoom(roomName, [farLink], { controller: controllerPos, storage: storagePos });

  const list = new LinkList(roomName);
  list.discover(room as any);

  assert.equal(list.controllerLink, null);
  assert.equal(list.spawnLink, null);
  assert.deepEqual(
    list.senders().map(link => link.id),
    ["far"],
  );
});

test("ohne Storage im Raum gibt es keinen Storage-Empfänger — die übrigen Links bleiben Sender", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName);

  const controllerPos = stubPos(25, 25, roomName);
  const controllerLink = stubLink("controller-link", 22, 25, roomName);
  const otherLink = stubLink("other", 12, 10, roomName); // wäre mit Storage der Storage-Link

  const room = stubRoom(roomName, [controllerLink, otherLink], { controller: controllerPos });

  const list = new LinkList(roomName);
  list.discover(room as any);

  assert.equal(list.controllerLink?.id, "controller-link");
  assert.equal(list.spawnLink, null);
  assert.deepEqual(
    list.senders().map(link => link.id),
    ["other"],
  );
});

test("controllerLink, spawnLink und senders() liefern die aufgelösten Objekte", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName, { links: { controller: "c", spawn: "s", sender: ["x", "y"] } });

  const c = stubLink("c", 1, 1, roomName);
  const s = stubLink("s", 2, 2, roomName);
  const x = stubLink("x", 3, 3, roomName);
  const y = stubLink("y", 4, 4, roomName);

  const list = new LinkList(roomName);

  assert.equal(list.controllerLink, c);
  assert.equal(list.spawnLink, s);
  assert.deepEqual(list.senders(), [x, y]);
});

test("eine verschwundene Id verwirft die ganze Liste, ohne zu werfen", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName, { links: { controller: "weg", spawn: "auch-weg", sender: [] } });

  const list = new LinkList(roomName);

  assert.equal(list.controllerLink, null);
  assert.equal(memory().rooms[roomName].links, undefined, "die Liste ist komplett verworfen");
});

test("senders() überspringt eine verschwundene Id, statt zu werfen", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName, { links: { sender: ["weg", "valide"] } });
  const valid = stubLink("valide", 5, 5, roomName);

  const list = new LinkList(roomName);
  const result = list.senders();

  assert.deepEqual(result, [valid]);
  assert.equal(
    memory().rooms[roomName].links,
    undefined,
    "die Liste wurde beim Fehlschlag der ersten Id verworfen",
  );
});

test("hasList ist erst nach discover() wahr — auch ohne gefundene Links im Raum", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  setRoomMemory(roomName);

  const list = new LinkList(roomName);
  assert.equal(list.hasList, false);

  const room = stubRoom(roomName, []);
  list.discover(room as any);

  assert.equal(list.hasList, true);
});

test("isRoomKnown ist falsch ohne Raum-Memory — discover() schreibt dann nichts", async () => {
  const { LinkList } = await loadLinkList();
  const roomName = "E58N6";
  // `Memory.rooms` selbst ist im laufenden Bot immer da (angelegt von
  // `controller/memory.ts::init()`) — hier fehlt gezielt nur der Eintrag für
  // diesen einen Raum.
  anyGlobal.Memory.rooms = {};

  const list = new LinkList(roomName);
  assert.equal(list.isRoomKnown, false);

  const room = stubRoom(roomName, [stubLink("l", 1, 1, roomName)]);
  assert.doesNotThrow(() => list.discover(room as any));

  assert.equal(memory().rooms[roomName], undefined);
});
