/**
 * Schreibt `Memory.stats` in der Grafana-Konvention der Screeps-Community
 * (screeps-grafana, screeps-stats): ein flaches Objekt aus Zahlen, dessen
 * Schlüssel unverändert nach Graphite durchgereicht werden. Punkte im
 * Schlüssel bilden dort die Hierarchie.
 */

import type { WindowMetrics } from "./types";

const statsMemory = Memory as Memory & { stats?: Record<string, number> };

/**
 * Prüft, ob ein Wert als Kennzahl geschrieben werden darf. `NaN` und
 * `Infinity` würde ein externer Sammler nicht verarbeiten können.
 */
function isWritable(value: number): boolean {
  return Number.isFinite(value);
}

function set(target: Record<string, number>, key: string, value: number): void {
  if (!isWritable(value)) return;
  target[key] = value;
}

/** Schreibt das abgeschlossene Fenster flach nach `Memory.stats`. */
export function writeStats(metrics: WindowMetrics): void {
  const stats: Record<string, number> = {};

  // Community-Standardschlüssel, wörtlich so von screeps-grafana erwartet.
  set(stats, "cpu.getUsed", metrics.cpuPerTick);
  set(stats, "cpu.limit", metrics.limit);
  set(stats, "cpu.tickLimit", metrics.tickLimit);
  set(stats, "cpu.bucket", metrics.bucketMean);

  // Eigene Kennzahlen unter dem Präfix `profiler.`.
  set(stats, "profiler.ticks", metrics.ticks);
  set(stats, "profiler.cpuPerTick", metrics.cpuPerTick);
  set(stats, "profiler.cpuMaxTick", metrics.cpuMaxTick);
  set(stats, "profiler.cpuPerRoom", metrics.cpuPerRoom);
  set(stats, "profiler.cpuPerCreep", metrics.cpuPerCreep);
  set(stats, "profiler.rooms", metrics.rooms);
  set(stats, "profiler.creeps", metrics.creeps);
  set(stats, "profiler.bucketMin", metrics.bucketMin);

  // Abschnittsnamen aus `SECTION` enthalten selbst Punkte (z. B. `timing.tower`)
  // und bilden damit in Graphite eine weitere Hierarchieebene — nicht ersetzen.
  for (const section of metrics.sections) {
    set(stats, `profiler.section.${section.name}.cpuPerTick`, section.cpuPerTick);
  }
  for (const role of metrics.roles) {
    set(stats, `profiler.role.${role.name}.cpuPerTick`, role.cpuPerTick);
  }

  // `metrics.methods` (Klassenmethoden aus dem `@profile`-Dekorator) wird
  // bewusst nicht geschrieben: der Eimer füllt sich nur im Zustand `full`, und
  // der ist nicht der Dauerzustand, aus dem ein Sammler zieht. Die Werte sind
  // zudem in den Rollen-Summen enthalten, wären hier also doppelt.
  // Einzelne Creeps werden bewusst nicht geschrieben: `creepDetail` enthält
  // während der Detailmessung bis zu 60 wechselnde Schlüssel je Fenster, die
  // `Memory` unnötig aufblähen und die Serialisierungskosten dauerhaft
  // erhöhen würden, sobald ein Creep stirbt und sein Schlüssel verwaist.

  // Komplett ersetzen statt ergänzen, sonst bleiben Schlüssel verwaister
  // Rollen oder Räume für immer stehen und `Memory` wächst still weiter.
  statsMemory.stats = stats;
}

/** Löscht `Memory.stats`. Für `prof.off()`. */
export function clearStats(): void {
  delete statsMemory.stats;
}
