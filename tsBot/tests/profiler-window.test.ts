/**
 * Prüft das Messfenster (`src/profiler/window.ts`) — die Stelle, an der die
 * Kennzahlen des Profilers entstehen.
 *
 * Zwei Zusicherungen aus dem Entwurf stehen hier zur Prüfung: im Zustand `off`
 * läuft **kein** `Game.cpu.getUsed()`, und ein leeres Fenster liefert niemals
 * `NaN` oder `Infinity`.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { cpu, installGlobals, memory, resetWorld, stubRooms } from "./support/screeps-stubs";

type ProfilerState = import("../src/profiler/state").ProfilerState;
type MeasurementWindow = import("../src/profiler/window").MeasurementWindow;

/**
 * Frische Instanzen je Test: Fenster und Zustand sind Objekte, kein Modulzustand,
 * es gibt zwischen zwei Tests also nichts zurückzusetzen.
 */
async function profiler(): Promise<{ measure: MeasurementWindow; state: ProfilerState }> {
  installGlobals();
  resetWorld();

  const { MeasurementWindow } = await import("../src/profiler/window");
  const { ProfilerState } = await import("../src/profiler/state");

  const state = new ProfilerState();
  return { state, measure: new MeasurementWindow(state) };
}

/** Setzt den Zustand so, wie es `Profiler.tick()` je Tick tut. */
function setMode(state: ProfilerState, mode: "off" | "light" | "full"): void {
  memory().profiler = { mode };
  state.syncFromMemory();
}

/** Ein Tick: CPU-Verbrauch und Bucket vorgeben, Tick zählen und abschließen. */
function runTick(measure: MeasurementWindow, used: number, bucket: number, creeps: number): void {
  measure.beginTick();
  cpu.used = used;
  cpu.bucket = bucket;
  measure.endTick(creeps);
}

test("ein leeres Fenster liefert Nullen statt NaN", async () => {
  const { measure, state } = await profiler();
  setMode(state, "light");

  const metrics = measure.metrics();

  for (const [name, value] of Object.entries(metrics)) {
    if (typeof value !== "number") continue;
    assert.ok(Number.isFinite(value), `${name} ist ${value}`);
  }
  assert.equal(metrics.ticks, 0);
  assert.equal(metrics.cpuPerTick, 0);
  assert.equal(metrics.cpuPerRoom, 0);
  assert.equal(metrics.cpuPerCreep, 0);
  assert.equal(metrics.bucketMin, 0, "Infinity aus dem Rohzustand darf nicht nach außen");
  assert.deepEqual(metrics.sections, []);
  assert.deepEqual(metrics.roles, []);
});

test("im Zustand off wird nicht gemessen", async () => {
  const { measure, state } = await profiler();
  setMode(state, "off");
  stubRooms("E58N6");

  runTick(measure, 12, 9000, 5);
  runTick(measure, 12, 9000, 5);

  assert.equal(cpu.getUsedCalls, 0, "im Zustand off darf kein getUsed() laufen");
  assert.equal(measure.snapshot.ticks, 0, "und es darf auch kein Tick gezählt werden");
});

test("CPU pro Raum und pro Creep werden aus dem Fenster gemittelt", async () => {
  const { measure, state } = await profiler();
  setMode(state, "light");
  stubRooms("E58N6", "E58N7", "E59N3");

  runTick(measure, 5, 9000, 4);
  runTick(measure, 7, 8000, 4);

  const metrics = measure.metrics();

  assert.equal(metrics.ticks, 2);
  assert.equal(metrics.cpuPerTick, 6);
  assert.equal(metrics.rooms, 3);
  assert.equal(metrics.cpuPerRoom, 2);
  assert.equal(metrics.creeps, 4);
  assert.equal(metrics.cpuPerCreep, 1.5);
  assert.equal(metrics.cpuMaxTick, 7);
  assert.equal(metrics.bucketMean, 8500);
  assert.equal(metrics.bucketMin, 8000, "das Minimum ist das Frühwarnzeichen");
  assert.equal(metrics.limit, 20);
  assert.equal(metrics.tickLimit, 500);
  assert.equal(cpu.getUsedCalls, 2, "in light genau ein getUsed() je Tick");
});

test("Rollen und Abschnitte werden mit ihrem Anteil am Tick verbucht", async () => {
  const { measure, state } = await profiler();
  setMode(state, "full");
  stubRooms("E58N6");

  measure.beginTick();
  measure.recordRole("miner", 2);
  measure.recordRole("miner", 4);
  measure.recordRole("upgrader", 3);
  measure.recordMethod("Miner.doJob", 5);
  cpu.used = 20;
  cpu.bucket = 9000;
  measure.endTick(6);

  const metrics = measure.metrics();
  const [first, second] = metrics.roles;

  assert.equal(metrics.roles.length, 2);
  assert.equal(first!.name, "miner", "absteigend nach CPU pro Tick");
  assert.equal(first!.cpuPerTick, 6);
  assert.equal(first!.cpuPerCall, 3);
  assert.equal(first!.callsPerTick, 2);
  assert.equal(first!.max, 4);
  assert.equal(first!.share, 0.3, "Anteil bezogen auf den Gesamttick");
  assert.equal(second!.name, "upgrader");

  // Klassenmethoden stehen in einem eigenen Eimer: sonst zählte dieselbe CPU
  // zweimal (`miner` und `Miner.doJob`) und die Anteile summierten über 100 %.
  assert.deepEqual(
    metrics.methods.map(entry => entry.name),
    ["Miner.doJob"],
  );
});

test("einzelne Creeps nur während der Detailmessung", async () => {
  const { measure, state } = await profiler();
  setMode(state, "full");

  measure.recordCreep("miner-1", 1);
  assert.deepEqual(measure.metrics().creepDetail, [], "sonst 60 Creeps je Tick");

  state.startDetail(50);
  measure.recordCreep("miner-1", 1);
  assert.equal(measure.snapshot.creepDetail["miner-1"]?.calls, 1);
});

test("das Fenster ist nach 100 Ticks fällig", async () => {
  const { measure, state } = await profiler();
  setMode(state, "light");

  for (let tick = 0; tick < 99; tick += 1) {
    runTick(measure, 1, 9000, 1);
  }
  assert.equal(measure.isDue, false);

  runTick(measure, 1, 9000, 1);
  assert.equal(measure.isDue, true);
});
