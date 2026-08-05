/**
 * Prüft `LinkNetwork` (`src/controller/links.ts`): einen Durchgang je Raum und
 * Tick, der Sender und Empfänger nach Vorrang wählt und mit expliziter Menge
 * sendet — als Ersatz für die frühere Zufallsauswahl durch den einzelnen
 * Miner.
 *
 * Die Linkliste (`Memory.rooms[<raum>].links`) wird in den meisten Tests
 * direkt gesetzt, statt `discover()` laufen zu lassen — deren Erhebung prüft
 * `controller-link-list.test.ts`. Ein eigener `Game.getObjectById`-Registry
 * löst die gemerkten Ids auf, wie im Vorbild dieser Datei.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;

/** Ein `transferEnergy`-Aufruf: Sender-Id, Ziel-Id und Menge. */
interface TransferCall {
  senderId: string;
  receiverId: string;
  amount: number;
}

/** Alle `transferEnergy`-Aufrufe seit dem letzten `installLinkWorld()`. */
let transferCalls: TransferCall[] = [];

/** Registry für `Game.getObjectById`, lokal für diese Testdatei. */
const registry = new Map<string, any>();

/**
 * Legt Game/Memory an, leert Registry und Aufzeichnung und verdrahtet `Game.getObjectById`.
 *
 * `resetWorld()` aus `screeps-stubs.ts` leert `Memory`, `Game.flags` und
 * `global.room`, aber bewusst nicht `Game.rooms` (kein Modul unter Test
 * braucht das bisher). Für diese Datei würde ein Raum aus einem früheren Test
 * sonst in „ohne Sicht auf den Raum" sichtbar bleiben — deshalb hier zusätzlich
 * geleert.
 */
function installLinkWorld(): void {
  installGlobals();
  for (const key of Object.keys(anyGlobal.Game.rooms)) delete anyGlobal.Game.rooms[key];
  registry.clear();
  transferCalls = [];
  anyGlobal.Game.getObjectById = (id: string) => registry.get(id) ?? null;
}

async function loadLinks(): Promise<typeof import("../src/controller/links")> {
  installLinkWorld();
  return await import("../src/controller/links");
}

/**
 * Ein Link-Stub mit fester Energie, festem freiem Platz und Cooldown.
 * `transferEnergy` protokolliert jeden Aufruf, statt etwas zu bewegen.
 */
function stubLink(id: string, energy: number, freeCapacity: number, cooldown = 0) {
  const link = {
    id,
    cooldown,
    store: {
      [RESOURCE_ENERGY]: energy,
      getFreeCapacity(_resource?: unknown): number {
        return freeCapacity;
      },
    },
    transferEnergy(target: { id: string }, amount: number): number {
      transferCalls.push({ senderId: id, receiverId: target.id, amount });
      return OK;
    },
  };
  registry.set(id, link);
  return link;
}

/** Ein Raum mit RCL; `find(FIND_MY_STRUCTURES, …)` bedient nur `discover()`. */
function stubRoom(name: string, options: { controllerLevel?: number; links?: any[] } = {}) {
  return {
    name,
    controller: options.controllerLevel !== undefined ? { level: options.controllerLevel } : undefined,
    storage: undefined,
    find(type: number, opts?: { filter?: (structure: any) => boolean }): any[] {
      if (type !== FIND_MY_STRUCTURES) return [];
      const links = options.links ?? [];
      return opts?.filter ? links.filter(opts.filter) : links;
    },
  };
}

/** Trägt die Raumkonfiguration (`useLinks`) in `global.room` ein. */
function setRoomConfig(name: string, config: Record<string, any> = { useLinks: true }): void {
  anyGlobal.room[name] = config;
}

/** Legt `Memory.rooms[name].links` direkt an — ohne `discover()` laufen zu lassen. */
function setLinks(name: string, links: { controller?: string; spawn?: string; sender: string[] }): void {
  anyGlobal.Memory.rooms ??= {};
  anyGlobal.Memory.rooms[name] = { links };
}

/** Legt nur das Raum-Memory an (ohne Linkliste), damit `isRoomKnown` zutrifft. */
function setRoomKnown(name: string): void {
  anyGlobal.Memory.rooms ??= {};
  anyGlobal.Memory.rooms[name] ??= {};
}

test("kein Sendeversuch unter SEND_MIN: weder bei zu wenig Energie noch bei zu wenig freiem Platz", async () => {
  const { LinkNetwork, SEND_MIN } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const weakSender = stubLink("sender", SEND_MIN - 1, 0);
  const openReceiver = stubLink("controller-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: openReceiver.id, sender: [weakSender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();
  assert.equal(transferCalls.length, 0, "Sender unter SEND_MIN sendet nicht");

  installLinkWorld();
  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const readySender = stubLink("sender", SEND_MIN, 0);
  const tightReceiver = stubLink("controller-link", 0, SEND_MIN - 1);
  setLinks(roomName, { controller: tightReceiver.id, sender: [readySender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();
  assert.equal(transferCalls.length, 0, "Empfänger mit zu wenig Platz bekommt nichts");
});

test("Vorrang unter RCL8: Controller-Link zuerst, ab RCL8 kippt es auf den Storage-Link", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  function runAndGetFirstReceiver(level: number): string | undefined {
    installLinkWorld();
    setRoomConfig(roomName);
    setRoomKnown(roomName);
    const sender = stubLink("sender", 500, 0);
    const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
    const spawnLink = stubLink("spawn-link", 0, LINK_CAPACITY);
    setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [sender.id] });
    anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: level });

    new LinkNetwork(roomName).send();
    return transferCalls[0]?.receiverId;
  }

  assert.equal(runAndGetFirstReceiver(7), "controller-link", "unter RCL8 zuerst der Controller-Link");
  assert.equal(runAndGetFirstReceiver(8), "spawn-link", "ab RCL8 zuerst der Storage-Link");
});

test("kein Doppelziel: zwei Sender treffen im selben Tick nie denselben Empfänger", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const senderA = stubLink("sender-a", 500, 0);
  const senderB = stubLink("sender-b", 500, 0);
  const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
  const spawnLink = stubLink("spawn-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [senderA.id, senderB.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();

  assert.equal(transferCalls.length, 2, "beide Sender kommen bei zwei Empfängern zum Zug");
  assert.deepEqual(
    transferCalls.map(call => call.receiverId).sort(),
    ["controller-link", "spawn-link"],
    "jeder Empfänger bekommt genau einen Sender",
  );

  installLinkWorld();
  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const onlySenderA = stubLink("sender-a", 500, 0);
  const onlySenderB = stubLink("sender-b", 500, 0);
  const singleReceiver = stubLink("controller-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: singleReceiver.id, sender: [onlySenderA.id, onlySenderB.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();
  assert.equal(transferCalls.length, 1, "bei nur einem Empfänger sendet nur einer der beiden Sender");
});

test("Menge explizit und richtig: min(Energie des Senders, freier Platz des Empfängers) in beiden Richtungen", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const limitedSender = stubLink("sender", 300, 0);
  const spaciousReceiver = stubLink("controller-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: spaciousReceiver.id, sender: [limitedSender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();
  assert.equal(transferCalls.length, 1);
  assert.equal(transferCalls[0]!.amount, 300, "der Sender begrenzt die Menge");

  installLinkWorld();
  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const fullSender = stubLink("sender", 700, 0);
  const tightReceiver = stubLink("controller-link", 0, 250);
  setLinks(roomName, { controller: tightReceiver.id, sender: [fullSender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();
  assert.equal(transferCalls.length, 1);
  assert.equal(transferCalls[0]!.amount, 250, "der Empfänger begrenzt die Menge");
  assert.equal(transferCalls[0]!.receiverId, "controller-link");
});

test("ein Sender mit Cooldown wird übersprungen, ein anderer bereiter sendet trotzdem", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const cooling = stubLink("cooling", 500, 0, 5);
  const ready = stubLink("ready", 500, 0, 0);
  const receiver = stubLink("controller-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: receiver.id, sender: [cooling.id, ready.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();

  assert.equal(transferCalls.length, 1);
  assert.equal(transferCalls[0]!.senderId, "ready", "der Link mit Cooldown wird übersprungen");
});

test("Teilbefüllung: ein Empfänger mit wenig, aber ausreichend freiem Platz wird nicht übersprungen", async () => {
  const { LinkNetwork, SEND_MIN } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const sender = stubLink("sender", 500, 0);
  const partialReceiver = stubLink("controller-link", 0, SEND_MIN);
  setLinks(roomName, { controller: partialReceiver.id, sender: [sender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();

  assert.equal(transferCalls.length, 1);
  assert.equal(transferCalls[0]!.amount, SEND_MIN);
});

test("ohne useLinks in der Config passiert nichts, auch wenn alles bereit wäre", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName, { useLinks: false });
  setRoomKnown(roomName);
  const sender = stubLink("sender", 500, 0);
  const receiver = stubLink("controller-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: receiver.id, sender: [sender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  new LinkNetwork(roomName).send();
  assert.equal(transferCalls.length, 0);
});

test("ohne Sicht auf den Raum passiert nichts", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const sender = stubLink("sender", 500, 0);
  const receiver = stubLink("controller-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: receiver.id, sender: [sender.id] });
  // Bewusst kein Game.rooms[roomName].

  assert.doesNotThrow(() => new LinkNetwork(roomName).send());
  assert.equal(transferCalls.length, 0);
});

test("ohne Linkliste im Memory wird nichts gesendet, stattdessen eine Liste erhoben", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName); // Raum bekannt, aber noch keine Linkliste.
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7, links: [] });

  new LinkNetwork(roomName).send();

  assert.equal(transferCalls.length, 0, "im selben Tick wird nur erhoben, nicht gesendet");
  assert.notEqual(anyGlobal.Memory.rooms[roomName].links, undefined, "die Liste wurde erhoben");
});

test("ohne verfügbaren Empfänger (keiner vorhanden oder alle zu knapp) wird nicht gesendet, kein Wurf", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  setRoomConfig(roomName);
  setRoomKnown(roomName);
  const sender = stubLink("sender", 500, 0);
  setLinks(roomName, { sender: [sender.id] }); // weder Controller- noch Storage-Link hinterlegt
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  assert.doesNotThrow(() => new LinkNetwork(roomName).send());
  assert.equal(transferCalls.length, 0);
});

test("sendAll() läuft über alle konfigurierten Räume und überspringt die ohne useLinks", async () => {
  const { sendAll } = await loadLinks();
  const roomWithLinks = "E58N6";
  const roomWithoutLinks = "E58N7";

  setRoomConfig(roomWithLinks);
  setRoomConfig(roomWithoutLinks, { useLinks: false });
  setRoomKnown(roomWithLinks);
  setRoomKnown(roomWithoutLinks);

  const senderA = stubLink("sender-a", 500, 0);
  const receiverA = stubLink("controller-a", 0, LINK_CAPACITY);
  setLinks(roomWithLinks, { controller: receiverA.id, sender: [senderA.id] });
  anyGlobal.Game.rooms[roomWithLinks] = stubRoom(roomWithLinks, { controllerLevel: 7 });

  const senderB = stubLink("sender-b", 500, 0);
  const receiverB = stubLink("controller-b", 0, LINK_CAPACITY);
  setLinks(roomWithoutLinks, { controller: receiverB.id, sender: [senderB.id] });
  anyGlobal.Game.rooms[roomWithoutLinks] = stubRoom(roomWithoutLinks, { controllerLevel: 7 });

  sendAll();

  assert.equal(transferCalls.length, 1, "nur der Raum mit useLinks sendet");
  assert.equal(transferCalls[0]!.senderId, "sender-a");
});
