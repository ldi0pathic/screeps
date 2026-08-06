/**
 * Prüft den Profilerverlauf (`src/profiler/history.ts`) — die Ablage
 * abgeschlossener Messfenster in einem Speichersegment.
 *
 * Wichtig für die Stubs (`tests/support/screeps-stubs.ts`): ein Segment wird
 * erst im Tick **nach** `setActiveSegments` lesbar, `advanceSegmentTick()`
 * stellt genau diesen Wechsel nach.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceSegmentTick,
  game,
  installGlobals,
  rawMemory,
  resetWorld,
} from "./support/screeps-stubs";

type WindowMetrics = import("../src/profiler/types").WindowMetrics;

const anyGlobal = globalThis as any;

/** Lädt das Modul unter Test frisch, nach frischen Globals — wie im Projekt vorgeschrieben. */
async function loadHistory() {
  installGlobals();
  resetWorld();
  return import("../src/profiler/history");
}

/** Ein vollständiges `WindowMetrics`, mit sauberen Zwei-Dezimalstellen-Werten, damit `toFixed(2)` verlustfrei ist. */
function makeMetrics(overrides: Partial<WindowMetrics> = {}): WindowMetrics {
  return {
    ticks: 100,
    mode: "light",
    cpuPerTick: 12.34,
    cpuMaxTick: 15.67,
    cpuPerRoom: 3.21,
    cpuPerCreep: 0.99,
    rooms: 3,
    creeps: 42,
    bucketMean: 9000.4,
    bucketMin: 8000,
    limit: 20,
    tickLimit: 500,
    sections: [],
    roles: [],
    methods: [],
    creepDetail: [],
    ...overrides,
  };
}

/** Baut eine Verlaufszeile von Hand, im selben Feldformat wie `history.ts` schreibt — für vorbelegte Segmente. */
function line(tick: number, mode = "light"): string {
  return [tick.toFixed(2), "1.00", mode, "1.00", "1.00", "1.00", "1.00", "1.00", "1.00", "1.00", "1.00"].join(";");
}

test("requestSegment fordert genau das Verlaufssegment an", async () => {
  const history = await loadHistory();

  history.requestSegment();

  assert.deepEqual(rawMemory.setActiveSegmentsCalls.at(-1), [history.HISTORY_SEGMENT]);
});

test("das Segment ist erst nach dem Tickwechsel verfuegbar", async () => {
  const history = await loadHistory();

  history.requestSegment();
  assert.equal(history.isAvailable(), false, "vor dem Tickwechsel noch nicht lesbar");

  advanceSegmentTick();
  assert.equal(history.isAvailable(), true, "nach dem Tickwechsel lesbar");
});

test("append auf ein nicht bereites Segment schreibt nichts und liefert false", async () => {
  const history = await loadHistory();

  const ok = history.append(makeMetrics());

  assert.equal(ok, false);
  assert.equal(anyGlobal.RawMemory.segments[history.HISTORY_SEGMENT], undefined, "es darf nichts geschrieben worden sein");
});

test("angehaengte Fenster lassen sich unveraendert zuruecklesen", async () => {
  const history = await loadHistory();
  history.requestSegment();
  advanceSegmentTick();
  game().time = 555;

  const ok = history.append(makeMetrics({ ticks: 100, mode: "full" }));
  const entries = history.read();

  assert.equal(ok, true);
  assert.equal(entries.length, 1);
  const entry = entries[0]!;
  assert.equal(entry.tick, 555);
  assert.equal(entry.ticks, 100);
  assert.equal(entry.mode, "full");
  assert.equal(entry.cpuPerTick, 12.34);
  assert.equal(entry.cpuMaxTick, 15.67);
  assert.equal(entry.cpuPerRoom, 3.21);
  assert.equal(entry.cpuPerCreep, 0.99);
  assert.equal(entry.bucketMean, 9000.4);
  assert.equal(entry.bucketMin, 8000);
  assert.equal(entry.rooms, 3);
  assert.equal(entry.creeps, 42);
});

test("mehrere append-Aufrufe ergeben mehrere Zeilen in der richtigen Reihenfolge", async () => {
  const history = await loadHistory();
  history.requestSegment();
  advanceSegmentTick();

  game().time = 100;
  history.append(makeMetrics({ ticks: 10 }));
  game().time = 200;
  history.append(makeMetrics({ ticks: 20 }));
  game().time = 300;
  history.append(makeMetrics({ ticks: 30 }));

  const entries = history.read();

  assert.equal(entries.length, 3);
  assert.deepEqual(
    entries.map(entry => [entry.tick, entry.ticks]),
    [
      [100, 10],
      [200, 20],
      [300, 30],
    ],
  );
});

test("der Ringpuffer verwirft die aeltesten Zeilen ueber HISTORY_MAX_ENTRIES hinaus", async () => {
  const history = await loadHistory();
  history.requestSegment();
  advanceSegmentTick();

  // Segment direkt mit HISTORY_MAX_ENTRIES Zeilen vorbelegen, statt tausendmal
  // append() zu rufen.
  const prefilled: string[] = [];
  for (let tick = 0; tick < history.HISTORY_MAX_ENTRIES; tick += 1) prefilled.push(line(tick));
  anyGlobal.RawMemory.segments[history.HISTORY_SEGMENT] = prefilled.join("\n");

  game().time = history.HISTORY_MAX_ENTRIES;
  history.append(makeMetrics());

  const entries = history.read();

  assert.equal(entries.length, history.HISTORY_MAX_ENTRIES, "die Zahl der Zeilen bleibt am Limit");
  assert.equal(entries[0]!.tick, 1, "die aelteste Zeile (Tick 0) ist herausgefallen");
  assert.equal(entries.at(-1)!.tick, history.HISTORY_MAX_ENTRIES, "die juengste Zeile bleibt erhalten");
});

test("kaputte Zeilen werden beim Lesen uebersprungen, ohne zu werfen", async () => {
  const history = await loadHistory();
  history.requestSegment();
  advanceSegmentTick();

  const brokenFieldCount = "1;2;3";
  const brokenNumber = ["abc", "1.00", "light", "1.00", "1.00", "1.00", "1.00", "1.00", "1.00", "1.00", "1.00"].join(
    ";",
  );
  anyGlobal.RawMemory.segments[history.HISTORY_SEGMENT] = [line(1), brokenFieldCount, brokenNumber, line(2)].join(
    "\n",
  );

  const entries = history.read();

  assert.deepEqual(
    entries.map(entry => entry.tick),
    [1, 2],
    "nur die zwei brauchbaren Zeilen kommen durch",
  );
});

test("clear leert den Verlauf", async () => {
  const history = await loadHistory();
  history.requestSegment();
  advanceSegmentTick();
  history.append(makeMetrics());

  history.clear();

  assert.deepEqual(history.read(), []);
});

test("format gibt bei leerem Verlauf einen Hinweis statt einer leeren Tabelle", async () => {
  const history = await loadHistory();

  const text = history.format([]);

  assert.match(text, /Kein Verlauf/, "ein deutscher Hinweis statt einer leeren Tabelle");
  assert.doesNotMatch(text, /^Tick/, "keine Kopfzeile ohne Daten");
});

test("die 100-KB-Groessengrenze eines Segments wird durch append nicht ueberschritten", async () => {
  const history = await loadHistory();
  history.requestSegment();
  advanceSegmentTick();

  // Viele Zeilen mit absichtlich langem Modus-Feld, damit das Segment schon
  // vor dem Anhängen deutlich über 100 KB liegt.
  const longMode = "x".repeat(2500);
  const bulky: string[] = [];
  for (let tick = 0; tick < 45; tick += 1) bulky.push(line(tick, longMode));
  anyGlobal.RawMemory.segments[history.HISTORY_SEGMENT] = bulky.join("\n");
  assert.ok(
    anyGlobal.RawMemory.segments[history.HISTORY_SEGMENT].length > 100 * 1024,
    "Testaufbau: das vorbelegte Segment muss ueber der Grenze liegen",
  );

  game().time = 99999;
  const ok = history.append(makeMetrics({ mode: "light" }));

  assert.equal(ok, true);
  const stored = anyGlobal.RawMemory.segments[history.HISTORY_SEGMENT] as string;
  assert.ok(stored.length <= 100 * 1024, `Segment ist ${stored.length} Zeichen lang`);

  const entries = history.read();
  assert.equal(entries.at(-1)!.tick, 99999, "die juengste Zeile bleibt trotz Kuerzung erhalten");
});
