/**
 * Formatierung der Profiler-Ausgaben.
 *
 * Reine Textfunktionen: keine Konsolenausgabe, kein `Game`-Zugriff außer
 * `Game.time` (für die "jetzt"-Zeile in `formatBaselines`), kein Zustand.
 * Importiert bewusst nur Typen aus `./types` — siehe Abhängigkeitsrichtung
 * dort (`types <- report`).
 */
import type { Baseline, RankedEntry, WindowMetrics } from "./types";

/** Formatiert eine Zahl auf `decimals` Nachkommastellen, sicher gegen NaN/Infinity. */
function fmt(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(decimals);
}

/** Formatiert einen Anteil (0..1) als Prozentzahl, sicher gegen NaN/Infinity. */
function fmtPercent(share: number): string {
  if (!Number.isFinite(share)) return "-";
  return `${(share * 100).toFixed(1)}%`;
}

/** Die drei teuersten Einträge einer Rangliste als kurzer Text, z.B. für die Fensterzeile. */
function topEntries(entries: RankedEntry[], count: number): string {
  if (entries.length === 0) return "-";
  return entries
    .slice(0, count)
    .map(entry => `${entry.name} ${fmtPercent(entry.share)}`)
    .join(", ");
}

/** Eine kompakte Zeile für das abgeschlossene Fenster. */
export function formatWindowLine(metrics: WindowMetrics): string {
  const top = topEntries(metrics.roles, 3);
  return (
    `[prof] Fenster=${fmt(metrics.ticks, 0)}T` +
    ` | CPU/Tick=${fmt(metrics.cpuPerTick)}` +
    ` | CPU/Raum=${fmt(metrics.cpuPerRoom)}` +
    ` | CPU/Creep=${fmt(metrics.cpuPerCreep)}` +
    ` | Bucket~${fmt(metrics.bucketMean, 0)} (min ${fmt(metrics.bucketMin, 0)})` +
    ` | Limit=${fmt(metrics.limit, 0)}` +
    ` | Top: ${top}`
  );
}

/** Spaltenbreiten einer Tabelle, aus dem längsten Namen abgeleitet. */
interface TableWidths {
  name: number;
  cpuPerTick: number;
  cpuPerCall: number;
  callsPerTick: number;
  max: number;
  share: number;
}

const NUMBER_COLUMN_WIDTHS: Omit<TableWidths, "name"> = {
  cpuPerTick: 9,
  cpuPerCall: 10,
  callsPerTick: 12,
  max: 8,
  share: 8,
};

/** Baut eine Tabellenzeile aus einem `RankedEntry`, ausgerichtet an `widths`. */
function formatRankedRow(entry: RankedEntry, widths: TableWidths): string {
  return [
    entry.name.padEnd(widths.name),
    fmt(entry.cpuPerTick).padStart(widths.cpuPerTick),
    fmt(entry.cpuPerCall).padStart(widths.cpuPerCall),
    fmt(entry.callsPerTick).padStart(widths.callsPerTick),
    fmt(entry.max).padStart(widths.max),
    fmtPercent(entry.share).padStart(widths.share),
  ].join("  ");
}

/**
 * Baut einen benannten Tabellenblock aus einer Rangliste, sortiert nach
 * Gesamtanteil. Liefert eine leere Zeichenkette bei leerer Liste — leere
 * Blöcke werden dann beim Zusammenbau von `formatDetailReport` weggelassen.
 */
function formatRankedBlock(title: string, entries: RankedEntry[]): string {
  if (entries.length === 0) return "";

  const sorted = [...entries].sort((a, b) => b.share - a.share);
  const nameWidth = Math.max("Name".length, ...sorted.map(entry => entry.name.length));
  const widths: TableWidths = { name: nameWidth, ...NUMBER_COLUMN_WIDTHS };

  const header = [
    "Name".padEnd(widths.name),
    "CPU/Tick".padStart(widths.cpuPerTick),
    "CPU/Aufruf".padStart(widths.cpuPerCall),
    "Aufrufe/Tick".padStart(widths.callsPerTick),
    "Max".padStart(widths.max),
    "Anteil%".padStart(widths.share),
  ].join("  ");
  const separator = "-".repeat(header.length);
  const rows = sorted.map(entry => formatRankedRow(entry, widths));

  return [`== ${title} ==`, header, separator, ...rows].join("\n");
}

/** Ausführlicher Bericht der Detailmessung, sortiert nach Gesamtanteil. */
export function formatDetailReport(metrics: WindowMetrics): string {
  const blocks = [
    formatRankedBlock("Abschnitte", metrics.sections),
    formatRankedBlock("Rollen", metrics.roles),
    formatRankedBlock("Creeps", metrics.creepDetail),
  ].filter(block => block.length > 0);

  if (blocks.length === 0) {
    return "Keine Detaildaten im laufenden Fenster. Mit prof.detail() eine Messung starten.";
  }

  return blocks.join("\n\n");
}

/** Werte einer Grundlinienzeile, unabhängig davon ob aus `Baseline` oder `WindowMetrics` gewonnen. */
interface BaselineRowData {
  name: string;
  tick: number;
  ticks: number;
  cpuPerTick: number;
  cpuPerRoom: number;
  cpuPerCreep: number;
  bucketMean: number;
}

interface BaselineTableWidths {
  name: number;
  tick: number;
  ticks: number;
  cpuPerTick: number;
  cpuPerRoom: number;
  cpuPerCreep: number;
  bucketMean: number;
}

const BASELINE_NUMBER_WIDTHS: Omit<BaselineTableWidths, "name"> = {
  tick: 10,
  ticks: 6,
  cpuPerTick: 10,
  cpuPerRoom: 10,
  cpuPerCreep: 11,
  bucketMean: 11,
};

/** Baut eine Grundlinienzeile, ausgerichtet an `widths`. */
function formatBaselineRow(row: BaselineRowData, widths: BaselineTableWidths): string {
  return [
    row.name.padEnd(widths.name),
    fmt(row.tick, 0).padStart(widths.tick),
    fmt(row.ticks, 0).padStart(widths.ticks),
    fmt(row.cpuPerTick).padStart(widths.cpuPerTick),
    fmt(row.cpuPerRoom).padStart(widths.cpuPerRoom),
    fmt(row.cpuPerCreep).padStart(widths.cpuPerCreep),
    fmt(row.bucketMean).padStart(widths.bucketMean),
  ].join("  ");
}

/** Grundlinien nebeneinander, für den vorher/nachher-Vergleich. */
export function formatBaselines(
  baselines: Record<string, Baseline>,
  current: WindowMetrics | null,
): string {
  const names = Object.keys(baselines);
  if (names.length === 0) {
    return "Keine Grundlinien vorhanden. Mit prof.baseline(name) eine anlegen.";
  }

  const rows: BaselineRowData[] = names.map(name => {
    const baseline = baselines[name]!;
    return {
      name,
      tick: baseline.tick,
      ticks: baseline.ticks,
      cpuPerTick: baseline.cpuPerTick,
      cpuPerRoom: baseline.cpuPerRoom,
      cpuPerCreep: baseline.cpuPerCreep,
      bucketMean: baseline.bucketMean,
    };
  });

  if (current !== null) {
    rows.push({
      name: "jetzt",
      tick: Game.time,
      ticks: current.ticks,
      cpuPerTick: current.cpuPerTick,
      cpuPerRoom: current.cpuPerRoom,
      cpuPerCreep: current.cpuPerCreep,
      bucketMean: current.bucketMean,
    });
  }

  const nameWidth = Math.max("Name".length, ...rows.map(row => row.name.length));
  const widths: BaselineTableWidths = { name: nameWidth, ...BASELINE_NUMBER_WIDTHS };

  const header = [
    "Name".padEnd(widths.name),
    "Tick".padStart(widths.tick),
    "Ticks".padStart(widths.ticks),
    "CPU/Tick".padStart(widths.cpuPerTick),
    "CPU/Raum".padStart(widths.cpuPerRoom),
    "CPU/Creep".padStart(widths.cpuPerCreep),
    "Bucket-Ø".padStart(widths.bucketMean),
  ].join("  ");
  const separator = "-".repeat(header.length);
  const dataRows = rows.map(row => formatBaselineRow(row, widths));

  return [header, separator, ...dataRows].join("\n");
}
