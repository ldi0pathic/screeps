/**
 * Öffentliche Schnittstelle des Profilers.
 *
 * Hier läuft zusammen, was `state`, `window`, `report`, `stats` und `decorator`
 * beitragen — und nur hier wird auf die Konsole geschrieben. Die Teilmodule
 * liefern Text, sie drucken ihn nicht: so bleibt steuerbar, wann die Konsole
 * etwas sieht. Sie ist das einzige Diagnosefenster im Spiel.
 *
 * Das Modul wirkt zusätzlich über einen Seiteneffekt: es legt den Handle als
 * `bot.prof` ab. Weil `bot` dasselbe Objekt wie `global` ist, tippt man im
 * Spiel `prof.report()`.
 */

import { bot } from "../globals";
import { formatBaselines, formatDetailReport, formatWindowLine } from "./report";
import * as state from "./state";
import { clearStats, writeStats } from "./stats";
import {
  DEFAULT_DETAIL_TICKS,
  type Baseline,
  type ProfilerHandle,
  type ProfilerMode,
  type WindowMetrics,
} from "./types";
import * as measure from "./window";

export { SECTION } from "./types";
export { profile, wrapRoles } from "./decorator";
export type { ProfilerHandle, ProfilerMode } from "./types";

/** Abschnittsmessung. Im Zustand `off` und `light` ein sofortiges `return`. */
export const begin = measure.begin;
/** Gegenstück zu `begin`. */
export const end = measure.end;

/**
 * Zustand des letzten Ticks. Wechselt der Zustand, wird das laufende Fenster
 * verworfen — sonst mischte ein Fenster Ticks aus `light` und `full` und die
 * abgeleiteten Zahlen wären nicht vergleichbar.
 */
let lastMode: ProfilerMode = "off";

/** Kennzahlen des laufenden Fensters. */
function currentMetrics(): WindowMetrics {
  return measure.metrics(measure.snapshot());
}

/** Wechselt den Zustand und beginnt ein frisches Fenster. */
function switchMode(mode: ProfilerMode): void {
  if (state.getMode() === mode) return;
  state.setMode(mode);
  lastMode = mode;
  measure.reset();
}

/**
 * Tickgrenze am Anfang von `loop()`. Spiegelt den über die Konsole gesetzten
 * Zustand aus `Memory` und beendet eine abgelaufene Detailmessung.
 */
export function tick(): void {
  const mode = state.syncFromMemory();

  // Selbstabschaltung der Detailmessung: Abschlussbericht ausgeben, solange die
  // Daten noch im Fenster stehen, danach frisch beginnen.
  if (state.expireDetail()) {
    console.log(`[prof] Detailmessung beendet.\n${formatDetailReport(currentMetrics())}`);
    measure.reset();
    lastMode = state.getMode();
    measure.beginTick();
    return;
  }

  if (mode !== lastMode) {
    lastMode = mode;
    measure.reset();
  }

  measure.beginTick();
}

/**
 * Tickende. Verbucht den Tick und gibt das Fenster aus, sobald es voll ist.
 */
export function endTick(creepCount: number): void {
  measure.endTick(creepCount);

  if (!measure.isDue()) return;

  const metrics = currentMetrics();
  console.log(formatWindowLine(metrics));
  writeStats(metrics);
  measure.reset();
}

/** Baut aus den laufenden Kennzahlen eine Grundlinie — bewusst nur Skalare. */
function toBaseline(metrics: WindowMetrics): Baseline {
  return {
    tick: Game.time,
    ticks: metrics.ticks,
    mode: metrics.mode,
    cpuPerTick: metrics.cpuPerTick,
    cpuPerRoom: metrics.cpuPerRoom,
    cpuPerCreep: metrics.cpuPerCreep,
    bucketMean: metrics.bucketMean,
    rooms: metrics.rooms,
    creeps: metrics.creeps,
  };
}

const handle: ProfilerHandle = {
  on(): string {
    switchMode("full");
    return "Profiler: full — Gesamttick, Abschnitte und Rollen. Fensterzeile alle 100 Ticks.";
  },

  light(): string {
    switchMode("light");
    return "Profiler: light — nur Gesamttick, Bucket, CPU pro Raum und pro Creep.";
  },

  off(): string {
    switchMode("off");
    clearStats();
    return "Profiler: aus. Es läuft kein Game.cpu.getUsed() mehr.";
  },

  status(): string {
    const mode = state.getMode();
    const metrics = currentMetrics();
    const detail = state.detailActive()
      ? ` | Detailmessung noch ${state.detailRemaining()} Ticks`
      : "";
    return `Profiler: ${mode} | Fenster ${metrics.ticks}/100 Ticks${detail}`;
  },

  report(): string {
    const metrics = currentMetrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster. Mit prof.light() oder prof.on() einschalten.";
    }

    const line = formatWindowLine(metrics);
    if (metrics.sections.length === 0 && metrics.roles.length === 0) {
      return line;
    }
    return `${line}\n${formatDetailReport(metrics)}`;
  },

  reset(): string {
    measure.reset();
    return "Fenster verworfen, Messung beginnt neu.";
  },

  detail(ticks = DEFAULT_DETAIL_TICKS): string {
    if (!Number.isFinite(ticks) || ticks < 1) {
      return `Ungültige Tickzahl. Beispiel: prof.detail(${DEFAULT_DETAIL_TICKS})`;
    }

    const returnTo = state.getMode();
    state.startDetail(Math.floor(ticks));
    lastMode = "full";
    measure.reset();
    return `Detailmessung für ${Math.floor(ticks)} Ticks gestartet, danach zurück auf ${returnTo}.`;
  },

  baseline(name: string): string {
    if (!name) {
      return 'Name fehlt. Beispiel: prof.baseline("vor-plan-02")';
    }

    const metrics = currentMetrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster — es gibt nichts festzuhalten.";
    }
    if (metrics.ticks < 1000) {
      // Kein Abbruch, nur ein Hinweis: kürzere Fenster schwanken zu stark, weil
      // Spawnwellen, die Tagessequenz (alle 28 800 Ticks) und Angriffe die
      // Werte verzerren. Die Grundlinie wird trotzdem gespeichert.
      state.saveBaseline(name, toBaseline(metrics));
      return `Grundlinie "${name}" gespeichert — Achtung, nur ${metrics.ticks} Ticks. Für einen belastbaren Vergleich mindestens 1000 Ticks messen.`;
    }

    state.saveBaseline(name, toBaseline(metrics));
    return `Grundlinie "${name}" über ${metrics.ticks} Ticks gespeichert.`;
  },

  baselines(): string {
    const metrics = currentMetrics();
    return formatBaselines(state.readBaselines(), metrics.ticks > 0 ? metrics : null);
  },
};

bot.prof = handle;
