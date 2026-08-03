/**
 * Verträge des Profilers.
 *
 * Diese Datei enthält bewusst **keinen ausführbaren Code**: sie ist die
 * gemeinsame Grundlage aller Profiler-Module und darf deshalb von jedem davon
 * importiert werden, ohne eine Importschleife zu erzeugen.
 *
 * Abhängigkeitsrichtung, die nicht verletzt werden darf:
 *
 *     types  <-  state  <-  window  <-  decorator
 *     types  <-  report
 *     types  <-  stats
 *     alle   <-  index
 *
 * `state` importiert **nicht** `window` oder `report`. Läuft die Detailmessung
 * ab, meldet `state` das nur; gehandelt wird in `index`.
 */

/**
 * Die drei Zustände des Profilers.
 *
 * - `off`   — keine Messung. Es läuft **kein** `Game.cpu.getUsed()`.
 * - `light` — nur Gesamttick und Bucket, zwei `getUsed()` je Tick. Der
 *             sinnvolle Dauerzustand.
 * - `full`  — zusätzlich alle Abschnitte und alle Rollen.
 */
export type ProfilerMode = "off" | "light" | "full";

/** Länge des gleitenden Fensters in Ticks. */
export const WINDOW_TICKS = 100;

/** Vorgabe für `prof.detail()` ohne Argument. */
export const DEFAULT_DETAIL_TICKS = 50;

/**
 * Namen der Messabschnitte. Zentral vergeben, damit die Messpunkte in
 * `main.ts` und `controller/timing.ts` und die Auswertung dieselben
 * Zeichenketten benutzen — ein Tippfehler wäre sonst ein stiller Messfehler.
 */
export const SECTION = {
  /** Raum-Visuals und Memory-Init, erste Schleife in `main.ts::loop`. */
  rooms: "rooms",
  /** Creep-Schleife gesamt, zweite Schleife in `main.ts::loop`. */
  creeps: "creeps",
  /** `controller/timing.ts::controll` gesamt. */
  timing: "timing",
  /** Türme, `defence.tower()`. */
  tower: "timing.tower",
  /** Terminal und Markt. */
  terminal: "timing.terminal",
  /** Pixelgenerierung. */
  pixel: "timing.pixel",
  /** Spawncontroller, `spawn.spawn()`. */
  spawn: "timing.spawn",
  /** Verteidigungsscan, `defence.check()`. */
  defence: "timing.defence",
  /** Statuslog, `memory.writeStatus()`. */
  status: "timing.status",
  /** Tagessequenz, `daylie()`. */
  daily: "timing.daily",
} as const;

/** Kennzahlen eines Abschnitts, einer Rolle oder eines Creeps im Fenster. */
export interface SectionStats {
  /** Summe der gemessenen CPU über alle Aufrufe im Fenster. */
  total: number;
  /** Teuerster einzelner Aufruf im Fenster. */
  max: number;
  /** Zahl der Aufrufe im Fenster. */
  calls: number;
}

/**
 * Rohzustand des laufenden Fensters. Lebt im Heap, **nicht** in `Memory`:
 * `Memory` wird jeden Tick serialisiert, und die Kosten wachsen mit der Größe.
 */
export interface WindowSnapshot {
  /** Tick, an dem das Fenster begonnen hat. */
  startTick: number;
  /** Zahl der bisher gezählten Ticks im Fenster. */
  ticks: number;
  /** Zustand, in dem gemessen wurde. */
  mode: ProfilerMode;

  /** Summe der Gesamttick-CPU über alle Ticks des Fensters. */
  cpuTotal: number;
  /** Teuerster einzelner Tick im Fenster. */
  cpuMax: number;
  /** Summe von `Game.cpu.bucket` über alle Ticks. */
  bucketTotal: number;
  /** Kleinster beobachteter Bucket-Wert im Fenster. */
  bucketMin: number;
  /** Summe der verwalteten Räume über alle Ticks. */
  roomTotal: number;
  /** Summe der verarbeiteten Creeps über alle Ticks. */
  creepTotal: number;
  /** `Game.cpu.limit` beim letzten Tick des Fensters. */
  limit: number;
  /** `Game.cpu.tickLimit` beim letzten Tick des Fensters. */
  tickLimit: number;

  /** Abschnitte, Schlüssel aus `SECTION`. */
  sections: Record<string, SectionStats>;
  /** Rollen, Schlüssel sind die Rollennamen aus `roles/index.ts`. */
  roles: Record<string, SectionStats>;
  /** Einzelne Creeps. Nur während der Detailmessung gefüllt. */
  creepDetail: Record<string, SectionStats>;
}

/** Eine Zeile im nach Gesamtanteil sortierten Bericht. */
export interface RankedEntry {
  name: string;
  /** Mittlere CPU je Tick des Fensters. */
  cpuPerTick: number;
  /** Mittlere CPU je Aufruf. */
  cpuPerCall: number;
  /** Mittlere Aufrufe je Tick. */
  callsPerTick: number;
  /** Teuerster einzelner Aufruf im Fenster. */
  max: number;
  /** Anteil am Gesamttick, 0 bis 1. */
  share: number;
}

/**
 * Aus einem `WindowSnapshot` abgeleitete Kennzahlen. Die Division passiert
 * **einmal** in `window.metrics()`; `report` und `stats` rechnen nicht selbst,
 * damit beide dieselben Zahlen zeigen.
 */
export interface WindowMetrics {
  ticks: number;
  mode: ProfilerMode;

  /** CPU pro Tick — die Grundzahl. */
  cpuPerTick: number;
  /** Teuerster einzelner Tick. */
  cpuMaxTick: number;
  /**
   * CPU pro Raum: Gesamttick geteilt durch die Zahl der verwalteten Räume.
   * Bestimmt direkt, wie viele Räume in 20 CPU passen.
   */
  cpuPerRoom: number;
  /** CPU pro Creep. */
  cpuPerCreep: number;

  /** Mittlere Zahl verwalteter Räume im Fenster. */
  rooms: number;
  /** Mittlere Zahl verarbeiteter Creeps im Fenster. */
  creeps: number;

  bucketMean: number;
  /** Ein sinkendes Minimum ist das Frühwarnzeichen für zu teure Änderungen. */
  bucketMin: number;
  limit: number;
  tickLimit: number;

  /** Abschnitte, absteigend nach `cpuPerTick`. */
  sections: RankedEntry[];
  /** Rollen, absteigend nach `cpuPerTick`. */
  roles: RankedEntry[];
  /** Einzelne Creeps, absteigend. Leer außerhalb der Detailmessung. */
  creepDetail: RankedEntry[];
}

/**
 * Benannte Grundlinie. Bewusst nur Skalare: das Ding liegt in `Memory` und
 * muss klein bleiben (Abnahmekriterium: `Memory.profiler` unter 1 KB).
 */
export interface Baseline {
  /** Tick, an dem die Grundlinie festgehalten wurde. */
  tick: number;
  ticks: number;
  mode: ProfilerMode;
  cpuPerTick: number;
  cpuPerRoom: number;
  cpuPerCreep: number;
  bucketMean: number;
  rooms: number;
  creeps: number;
}

/**
 * `Memory.profiler` — nur Zustand, keine Messwerte. Die Zähler leben im Heap.
 */
export interface ProfilerMemory {
  /** Der gewünschte Zustand. Überlebt den Global-Reset. */
  mode: ProfilerMode;
  /** Tick, bis zu dem die Detailmessung läuft. Fehlt, wenn sie aus ist. */
  detailUntil?: number;
  /** Zustand, auf den nach Ablauf der Detailmessung zurückgeschaltet wird. */
  detailReturnTo?: ProfilerMode;
  /** Benannte Grundlinien, angelegt über `prof.baseline(name)`. */
  baselines?: Record<string, Baseline>;
}

/**
 * Konsolenhandle. Wird als `bot.prof` zugewiesen; weil `bot` dasselbe Objekt
 * wie `global` ist, tippt man im Spiel `prof.report()`.
 *
 * Jede Methode liefert eine Zeichenkette, damit die Konsole eine Rückmeldung
 * zeigt, statt `undefined` auszugeben.
 */
export interface ProfilerHandle {
  /** Zustand `full`: Abschnitte und Rollen messen. */
  on(): string;
  /** Zustand `light`: nur Gesamttick und Bucket. */
  light(): string;
  /** Aus. Danach läuft kein `Game.cpu.getUsed()` mehr. */
  off(): string;
  /** Zustand und Restticks der Detailmessung. */
  status(): string;
  /** Bericht über das laufende Fenster. */
  report(): string;
  /** Laufendes Fenster verwerfen und neu beginnen. */
  reset(): string;
  /** Detailmessung für `ticks` Ticks, danach automatisch zurück. */
  detail(ticks?: number): string;
  /** Laufendes Fenster als benannte Grundlinie festhalten. */
  baseline(name: string): string;
  /** Alle festgehaltenen Grundlinien nebeneinander ausgeben. */
  baselines(): string;
}
