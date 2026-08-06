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

/**
 * Ausführlicher Bericht der Detailmessung, sortiert nach Gesamtanteil.
 *
 * Der Block „Methoden" ist in „Rollen" verschachtelt: die CPU einer
 * Klassenmethode aus dem `@profile`-Dekorator steckt auch in der Summe ihrer
 * Rolle. Die Prozentanteile über alle Blöcke hinweg summieren deshalb
 * absichtlich über 100 % — das ist kein Fehler im Bericht.
 */
export function formatDetailReport(metrics: WindowMetrics): string {
  const blocks = [
    formatRankedBlock("Abschnitte", metrics.sections),
    formatRankedBlock("Rollen", metrics.roles),
    formatRankedBlock("Methoden", metrics.methods),
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

/** Formatiert eine Differenz mit Vorzeichen, damit die Richtung auf einen Blick stimmt. */
function fmtSigned(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

/** Eine Zeile im Vorher-Nachher-Vergleich. */
interface ComparisonRow {
  name: string;
  before: number;
  after: number;
  diff: number;
  /** Markiert eine Zeile, die nur auf einer Seite vorkam — keine erfundene Zahl auf der fehlenden Seite. */
  status?: "weggefallen" | "neu";
}

interface ComparisonWidths {
  name: number;
  before: number;
  after: number;
  diff: number;
  note: number;
}

/** Vergleichszeilen für die vier skalaren Gesamtkennzahlen. Beide Seiten kennen sie immer, also nie markiert. */
function buildOverallRows(baseline: Baseline, current: WindowMetrics): ComparisonRow[] {
  const metrics: Array<[string, number, number]> = [
    ["cpuPerTick", baseline.cpuPerTick, current.cpuPerTick],
    ["cpuPerRoom", baseline.cpuPerRoom, current.cpuPerRoom],
    ["cpuPerCreep", baseline.cpuPerCreep, current.cpuPerCreep],
    ["bucketMean", baseline.bucketMean, current.bucketMean],
  ];

  return metrics
    .map(([entryName, before, after]) => ({ name: entryName, before, after, diff: after - before }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/**
 * Vergleichszeilen aus der Grundlinie (nur `cpuPerTick` je Name) und der
 * Rangliste des laufenden Fensters. Ein Name nur in der Grundlinie ist
 * `weggefallen`, ein Name nur im laufenden Fenster ist `neu` — in beiden
 * Fällen steht auf der fehlenden Seite 0, keine erfundene Zahl.
 */
function buildComparisonRows(before: Record<string, number> | undefined, after: RankedEntry[]): ComparisonRow[] {
  const afterByName = new Map(after.map(entry => [entry.name, entry.cpuPerTick]));
  const names = new Set<string>([...Object.keys(before ?? {}), ...afterByName.keys()]);

  const rows: ComparisonRow[] = [...names].map(entryName => {
    const beforeValue = before?.[entryName];
    const afterValue = afterByName.get(entryName);
    const hasBefore = beforeValue !== undefined;
    const hasAfter = afterValue !== undefined;
    const beforeNumber = beforeValue ?? 0;
    const afterNumber = afterValue ?? 0;

    const row: ComparisonRow = {
      name: entryName,
      before: beforeNumber,
      after: afterNumber,
      diff: afterNumber - beforeNumber,
    };
    if (hasBefore && !hasAfter) row.status = "weggefallen";
    if (!hasBefore && hasAfter) row.status = "neu";
    return row;
  });

  return rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/** Baut eine Vergleichszeile, ausgerichtet an `widths`. */
function formatComparisonRow(row: ComparisonRow, widths: ComparisonWidths): string {
  const note = row.status ?? "";
  return [
    row.name.padEnd(widths.name),
    fmt(row.before).padStart(widths.before),
    fmt(row.after).padStart(widths.after),
    fmtSigned(row.diff).padStart(widths.diff),
    note.padEnd(widths.note),
  ]
    .join("  ")
    .trimEnd();
}

/** Baut einen benannten Vergleichsblock. Liefert eine leere Zeichenkette bei leerer Liste. */
function formatComparisonBlock(title: string, rows: ComparisonRow[]): string {
  if (rows.length === 0) return "";

  const nameWidth = Math.max("Name".length, ...rows.map(row => row.name.length));
  const beforeWidth = Math.max("Vorher".length, ...rows.map(row => fmt(row.before).length));
  const afterWidth = Math.max("Jetzt".length, ...rows.map(row => fmt(row.after).length));
  const diffWidth = Math.max("Diff".length, ...rows.map(row => fmtSigned(row.diff).length));
  const noteWidth = Math.max("Hinweis".length, ...rows.map(row => (row.status ?? "").length));
  const widths: ComparisonWidths = {
    name: nameWidth,
    before: beforeWidth,
    after: afterWidth,
    diff: diffWidth,
    note: noteWidth,
  };

  const header = [
    "Name".padEnd(widths.name),
    "Vorher".padStart(widths.before),
    "Jetzt".padStart(widths.after),
    "Diff".padStart(widths.diff),
    "Hinweis".padEnd(widths.note),
  ]
    .join("  ")
    .trimEnd();
  const separator = "-".repeat(header.length);
  const dataRows = rows.map(row => formatComparisonRow(row, widths));

  return [`== ${title} ==`, header, separator, ...dataRows].join("\n");
}

/**
 * Stellt eine Grundlinie dem laufenden Fenster gegenüber — Abschnitt für
 * Abschnitt und Rolle für Rolle.
 *
 * Jede Zeile ist absteigend nach dem Betrag der Differenz sortiert: was sich
 * am stärksten geändert hat, steht oben, das ist der Zweck der Tabelle. Ein
 * Abschnitt oder eine Rolle, der/die nur auf einer Seite vorkommt, wird als
 * „weggefallen" bzw. „neu" markiert statt eine erfundene Zahl auf der
 * fehlenden Seite zu zeigen. Kennt die Grundlinie keine Abschnitte und Rollen
 * (Zustand `light` bei ihrer Aufnahme), gibt es dafür einen Hinweis statt
 * leerer Tabellen.
 */
export function formatComparison(name: string, baseline: Baseline, current: WindowMetrics): string {
  const header =
    `Vergleich "${name}" (Grundlinie Tick ${fmt(baseline.tick, 0)}, ${fmt(baseline.ticks, 0)} Ticks)` +
    ` vs. jetzt (${fmt(current.ticks, 0)} Ticks)`;

  const blocks = [header, formatComparisonBlock("Gesamt", buildOverallRows(baseline, current))];

  const baselineHasDetail = baseline.sections !== undefined || baseline.roles !== undefined;
  // Am Zustand festgemacht, nicht an leeren Listen: nur `full` misst Abschnitte
  // und Rollen überhaupt. Eine leere Liste **im Zustand `full`** heißt dagegen
  // wirklich „ist weg" — und genau das soll als „weggefallen" sichtbar bleiben.
  const currentHasDetail = current.mode === "full";

  if (!baselineHasDetail) {
    blocks.push(
      "Die Grundlinie kennt nur Gesamtzahlen (Zustand light bei ihrer Aufnahme). " +
        "Für einen Vergleich je Abschnitt und Rolle ist eine neue Grundlinie im Zustand full nötig.",
    );
  } else if (!currentHasDetail) {
    // Ohne diesen Zweig stünde jede Zeile der Grundlinie als „weggefallen" da —
    // sie ist aber nicht weg, es misst nur gerade niemand. Eine Tabelle, die
    // das Gegenteil dessen behauptet, was der Fall ist, wäre schlimmer als
    // keine Tabelle.
    blocks.push(
      "Das laufende Fenster kennt keine Abschnitte und Rollen (Zustand light). " +
        "Für den Vergleich mit prof.on() messen.",
    );
  } else {
    blocks.push(formatComparisonBlock("Abschnitte", buildComparisonRows(baseline.sections, current.sections)));
    blocks.push(formatComparisonBlock("Rollen", buildComparisonRows(baseline.roles, current.roles)));
  }

  return blocks.filter(block => block.length > 0).join("\n\n");
}
