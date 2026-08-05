/**
 * Prüft den Pfad-Cache (`src/creep/path-memory.ts`).
 *
 * Der Kern ist der Unterschied zwischen den beiden Löschregeln: `forgetPath()`
 * verwirft nur den Weg, `clear()` zusätzlich die Stauerkennung. Beide gab es
 * vorher schon, verteilt über zehn `delete`-Zeilen in drei Dateien — wer sie
 * verwechselt, setzt den Stauzähler zu früh zurück oder schleppt ihn über einen
 * Zielwechsel mit.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installMovement, position } from "./support/movement-stubs";

type PathMemoryClass = typeof import("../src/creep/path-memory").PathMemory;

async function load(): Promise<PathMemoryClass> {
  installMovement();
  const module = await import("../src/creep/path-memory");
  return module.PathMemory;
}

/** Ein Memory mit vollständig belegtem Cache. */
function filledMemory(): Record<string, any> {
  return {
    path: "abc",
    pathTarget: { x: 20, y: 15, roomName: "E58N6" },
    lastPos: { x: 10, y: 10 },
    dontMove: 2,
  };
}

test("forgetPath verwirft den Weg und behält die Stauerkennung", async () => {
  const PathMemory = await load();
  const memory = filledMemory();

  new PathMemory(memory as any).forgetPath();

  assert.equal(memory.path, undefined);
  assert.equal(memory.pathTarget, undefined);
  assert.deepEqual(memory.lastPos, { x: 10, y: 10 }, "der Creep steht weiter dort, wo er steht");
  assert.equal(memory.dontMove, 2);
});

test("clear verwirft auch die Stauerkennung", async () => {
  const PathMemory = await load();
  const memory = filledMemory();

  new PathMemory(memory as any).clear();

  assert.deepEqual(memory, {}, "kein Schlüssel des Caches bleibt stehen");
});

test("pathTo gibt den Weg nur für dasselbe Ziel heraus", async () => {
  const PathMemory = await load();
  const cache = new PathMemory(filledMemory() as any);

  assert.equal(cache.pathTo(position(20, 15, "E58N6")), "abc");
  assert.equal(cache.pathTo(position(21, 15, "E58N6")), undefined, "anderes x");
  assert.equal(cache.pathTo(position(20, 16, "E58N6")), undefined, "anderes y");
  assert.equal(cache.pathTo(position(20, 15, "E58N7")), undefined, "anderer Raum");
});

test("ohne Weg oder ohne Raumnamen gilt der Cache als leer", async () => {
  const PathMemory = await load();

  const withoutPath = new PathMemory({ pathTarget: { x: 20, y: 15, roomName: "E58N6" } } as any);
  assert.equal(withoutPath.pathTo(position(20, 15, "E58N6")), undefined);

  // Ein `pathTarget` ohne Raumnamen ist unbrauchbar — der Weg könnte in jedem
  // Raum liegen.
  const withoutRoom = new PathMemory({ path: "abc", pathTarget: { x: 20, y: 15 } } as any);
  assert.equal(withoutRoom.pathTo(position(20, 15, "E58N6")), undefined);
});

test("rememberPathTo merkt Ziel samt Raum, rememberPath nur den Weg", async () => {
  const PathMemory = await load();

  const withTarget: Record<string, any> = {};
  new PathMemory(withTarget as any).rememberPathTo("xyz", position(30, 40, "E58N7"));
  assert.equal(withTarget.path, "xyz");
  assert.deepEqual(withTarget.pathTarget, { x: 30, y: 40, roomName: "E58N7" });

  // Ohne Ziel: so merkt sich der Stau-Sonderfall seinen Ausweichweg. Ein altes
  // `pathTarget` bleibt dabei stehen, damit der nächste Tick wieder prüft.
  const stuck: Record<string, any> = { pathTarget: { x: 1, y: 2, roomName: "E58N6" } };
  new PathMemory(stuck as any).rememberPath("xyz");
  assert.equal(stuck.path, "xyz");
  assert.deepEqual(stuck.pathTarget, { x: 1, y: 2, roomName: "E58N6" });
});

test("die Stauerkennung zählt erst, wenn der Creep zweimal gleich steht", async () => {
  const PathMemory = await load();
  const memory: Record<string, any> = {};
  const cache = new PathMemory(memory as any);

  assert.equal(cache.stuckTicks, 0);
  assert.equal(cache.isStuck, false);

  cache.trackPosition(position(10, 10, "E58N6"));
  assert.deepEqual(memory.lastPos, { x: 10, y: 10 });
  assert.equal(cache.stuckTicks, 0, "erst gemerkt, noch kein Stau");

  cache.trackPosition(position(10, 10, "E58N6"));
  assert.equal(cache.stuckTicks, 1);
  cache.trackPosition(position(10, 10, "E58N6"));
  cache.trackPosition(position(10, 10, "E58N6"));
  assert.equal(cache.stuckTicks, 3);
  assert.equal(cache.isStuck, false, "drei Ticks sind noch kein Stau");

  cache.trackPosition(position(10, 10, "E58N6"));
  assert.equal(cache.stuckTicks, 4);
  assert.equal(cache.isStuck, true, "ab dem vierten Tick wird ausgewichen");

  // Bewegt sich der Creep, beginnt alles neu.
  cache.trackPosition(position(11, 10, "E58N6"));
  assert.equal(cache.stuckTicks, 0);
  assert.deepEqual(memory.lastPos, { x: 11, y: 10 });

  // resetStuck lässt die letzte Position stehen.
  cache.trackPosition(position(11, 10, "E58N6"));
  cache.resetStuck();
  assert.equal(cache.stuckTicks, 0);
  assert.deepEqual(memory.lastPos, { x: 11, y: 10 });
});
