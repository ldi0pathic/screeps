/**
 * Zustand des Profilers.
 *
 * Der Zustand wird **einmal je Tick** aus `Memory.profiler` in die
 * Modulvariable `currentMode` gespiegelt (`syncFromMemory`). Jede Prüfung im
 * heißen Pfad (z. B. in `main.ts`/`controller/timing.ts`, ob überhaupt
 * `Game.cpu.getUsed()` aufgerufen werden soll) liest danach nur noch
 * `getMode()` — nie direkt `Memory`.
 */

import type { ProfilerMode, ProfilerMemory, Baseline } from "./types";

/** Höchstzahl gespeicherter Grundlinien, damit `Memory.profiler` klein bleibt. */
const MAX_BASELINES = 8;

const profilerMemory = Memory as Memory & { profiler?: ProfilerMemory };

/** Gespiegelter Zustand, einmal je Tick aus `Memory.profiler` übernommen. */
let currentMode: ProfilerMode = "off";

/** Legt `Memory.profiler` bei Bedarf mit Standard `off` an. */
function ensureMemory(): ProfilerMemory {
  return (profilerMemory.profiler ??= { mode: "off" });
}

/** Spiegelt den Zustand aus Memory in die Modulvariable. Einmal je Tick, als erstes. */
export function syncFromMemory(): ProfilerMode {
  currentMode = ensureMemory().mode;
  return currentMode;
}

/** Der gespiegelte Zustand. Billig — nur eine Modulvariable. */
export function getMode(): ProfilerMode {
  return currentMode;
}

/** Setzt den Zustand in Memory und in der Modulvariable. */
export function setMode(mode: ProfilerMode): void {
  ensureMemory().mode = mode;
  currentMode = mode;
}

/** Startet die Detailmessung für `ticks` Ticks und merkt den Rückkehrzustand. */
export function startDetail(ticks: number): void {
  const memory = ensureMemory();

  // Läuft die Detailmessung schon, bleibt der ursprüngliche Rückkehrzustand
  // erhalten — sonst würde ein zweites `prof.detail()` während der Messung
  // fälschlich "full" als Rückkehrzustand festschreiben.
  if (memory.detailUntil === undefined) {
    memory.detailReturnTo = currentMode;
  }

  memory.detailUntil = Game.time + ticks;
  memory.mode = "full";
  currentMode = "full";
}

/**
 * Bricht eine laufende Detailmessung ab, **ohne** den Rückkehrzustand
 * anzuwenden. Für einen Zustandswechsel über Konsole oder Flagge: wer
 * ausdrücklich `off`, `light` oder `full` verlangt, will nicht, dass die
 * Detailmessung Ticks später ihren alten Zustand zurückholt.
 */
export function cancelDetail(): void {
  const memory = ensureMemory();
  delete memory.detailUntil;
  delete memory.detailReturnTo;
}

/** Läuft gerade eine Detailmessung? */
export function detailActive(): boolean {
  return ensureMemory().detailUntil !== undefined;
}

/** Restticks der Detailmessung, 0 wenn sie nicht läuft. */
export function detailRemaining(): number {
  const memory = ensureMemory();
  if (memory.detailUntil === undefined) {
    return 0;
  }

  const remaining = memory.detailUntil - Game.time;
  return remaining > 0 ? remaining : 0;
}

/**
 * Liefert `true` genau in dem Tick, in dem die Detailmessung abgelaufen ist,
 * und stellt dabei den Rückkehrzustand wieder her. Danach `false`.
 */
export function expireDetail(): boolean {
  const memory = ensureMemory();
  if (memory.detailUntil === undefined || Game.time < memory.detailUntil) {
    return false;
  }

  const returnTo = memory.detailReturnTo ?? "off";
  delete memory.detailUntil;
  delete memory.detailReturnTo;
  memory.mode = returnTo;
  currentMode = returnTo;
  return true;
}

/** Hält das laufende Fenster als benannte Grundlinie fest. */
export function saveBaseline(name: string, baseline: Baseline): void {
  const memory = ensureMemory();
  const baselines = (memory.baselines ??= {});
  baselines[name] = baseline;

  const names = Object.keys(baselines);
  if (names.length <= MAX_BASELINES) {
    return;
  }

  // `Memory.profiler` muss unter 1 KB bleiben: bei Überlauf fliegt die
  // älteste Grundlinie (kleinstes `tick`) raus, statt unbegrenzt zu wachsen.
  let oldestName = names[0]!;
  let oldestTick = baselines[oldestName]!.tick;
  for (const candidate of names) {
    const tick = baselines[candidate]!.tick;
    if (tick < oldestTick) {
      oldestTick = tick;
      oldestName = candidate;
    }
  }
  delete baselines[oldestName];
}

/** Alle festgehaltenen Grundlinien, leeres Objekt statt `undefined`. */
export function readBaselines(): Record<string, Baseline> {
  return ensureMemory().baselines ?? {};
}

/** Zuletzt verarbeitete Farbe der Schalterflagge, `undefined` wenn noch keine. */
export function getFlagColor(): ColorConstant | undefined {
  return ensureMemory().flagColor;
}

/** Merkt eine Flaggenfarbe als verarbeitet, damit sie keine Flanke mehr auslöst. */
export function setFlagColor(color: ColorConstant): void {
  ensureMemory().flagColor = color;
}
