/**
 * Verlauf abgeschlossener Messfenster in einem Speichersegment.
 *
 * `Memory.stats` (siehe `stats.ts`) hält immer nur das **letzte** Fenster, und
 * `Memory` wird in **jedem** Tick per `JSON.parse` ausgepackt — ein Verlauf
 * über viele Fenster gehört da nicht hin, die Kosten wüchsen mit jedem Eintrag
 * mit. Ein Speichersegment (`RawMemory.segments`) kostet dagegen nichts,
 * solange es nicht aktiv ist, und wird nur auf Anfrage gelesen bzw.
 * geschrieben.
 *
 * Importiert bewusst nur Typen aus `./types` — siehe Abhängigkeitsrichtung
 * dort (`types <- history`). Kein `console.log`: eine Bibliotheksdatei ohne
 * Konsolenausgabe, die Ausgabe macht `prof.history()` in `index.ts`.
 *
 * **Format im Segment: kein JSON.** Eine Zeile je Fenster, Felder mit `;`
 * getrennt, Zahlen auf zwei Nachkommastellen, in der Reihenfolge der Felder
 * von `HistoryEntry`. JSON würde je Eintrag die Feldnamen wiederholen und die
 * 100 KB Segmentgröße um ein Vielfaches früher sprengen.
 */

import type { WindowMetrics } from "./types";

/** Segment für den Profilerverlauf. 99, damit niedrige Nummern frei bleiben. */
export const HISTORY_SEGMENT = 99;

/** Ringpuffer: ältere Zeilen fallen raus, sobald es zu viele werden. */
export const HISTORY_MAX_ENTRIES = 1000;

/**
 * Harte Größengrenze eines Segments (API-Grenze). Vor jedem Schreiben wird
 * geprüft, dass die Zeichenkette diese Grenze nicht überschreitet — notfalls
 * werden weitere alte Zeilen verworfen. Lieber Verlauf verlieren als das
 * Segment zu sprengen.
 */
const MAX_SEGMENT_CHARS = 100 * 1024;

/** Eine Zeile Verlauf. */
export interface HistoryEntry {
  tick: number;
  ticks: number;
  mode: string;
  cpuPerTick: number;
  cpuMaxTick: number;
  cpuPerRoom: number;
  cpuPerCreep: number;
  bucketMean: number;
  bucketMin: number;
  rooms: number;
  creeps: number;
}

/** Reihenfolge der Felder im Segment — Schreiben und Lesen benutzen dieselbe. */
const FIELD_COUNT = 11;

/** `true`, solange `RawMemory` in dieser Laufzeit existiert (Smoketest stellt eine karge Welt). */
function hasRawMemory(): boolean {
  return typeof RawMemory !== "undefined";
}

/** Fordert das Segment an. Lesbar wird es im nächsten Tick. */
export function requestSegment(): void {
  if (!hasRawMemory()) return;
  RawMemory.setActiveSegments([HISTORY_SEGMENT]);
}

/** Ist das Segment in diesem Tick lesbar und beschreibbar? */
export function isAvailable(): boolean {
  if (!hasRawMemory()) return false;
  return RawMemory.segments[HISTORY_SEGMENT] !== undefined;
}

/** Baut eine Verlaufszeile aus einem abgeschlossenen Fenster. Der Tick ist der aktuelle Spieltick. */
function buildEntry(metrics: WindowMetrics): HistoryEntry {
  return {
    tick: Game.time,
    ticks: metrics.ticks,
    mode: metrics.mode,
    cpuPerTick: metrics.cpuPerTick,
    cpuMaxTick: metrics.cpuMaxTick,
    cpuPerRoom: metrics.cpuPerRoom,
    cpuPerCreep: metrics.cpuPerCreep,
    bucketMean: metrics.bucketMean,
    bucketMin: metrics.bucketMin,
    rooms: metrics.rooms,
    creeps: metrics.creeps,
  };
}

/** Serialisiert eine Zeile: Zahlen auf zwei Nachkommastellen, Felder mit `;` getrennt. */
function serializeEntry(entry: HistoryEntry): string {
  return [
    entry.tick.toFixed(2),
    entry.ticks.toFixed(2),
    entry.mode,
    entry.cpuPerTick.toFixed(2),
    entry.cpuMaxTick.toFixed(2),
    entry.cpuPerRoom.toFixed(2),
    entry.cpuPerCreep.toFixed(2),
    entry.bucketMean.toFixed(2),
    entry.bucketMin.toFixed(2),
    entry.rooms.toFixed(2),
    entry.creeps.toFixed(2),
  ].join(";");
}

/**
 * Liest eine Zeile zurück. Liefert `undefined` bei falscher Feldzahl oder
 * einer Zahl, die sich nicht parsen lässt (`NaN`) — eine halb geschriebene
 * oder beschädigte Zeile darf den Bot nicht umbringen, sie wird beim Lesen
 * einfach übersprungen.
 */
function parseEntry(line: string): HistoryEntry | undefined {
  const fields = line.split(";");
  if (fields.length !== FIELD_COUNT) return undefined;

  const mode = fields[2]!;
  const numberFields = [
    fields[0]!,
    fields[1]!,
    fields[3]!,
    fields[4]!,
    fields[5]!,
    fields[6]!,
    fields[7]!,
    fields[8]!,
    fields[9]!,
    fields[10]!,
  ].map(Number);
  if (numberFields.some(value => !Number.isFinite(value))) return undefined;
  if (mode.length === 0) return undefined;

  const [tick, ticks, cpuPerTick, cpuMaxTick, cpuPerRoom, cpuPerCreep, bucketMean, bucketMin, rooms, creeps] =
    numberFields;

  return {
    tick: tick!,
    ticks: ticks!,
    mode,
    cpuPerTick: cpuPerTick!,
    cpuMaxTick: cpuMaxTick!,
    cpuPerRoom: cpuPerRoom!,
    cpuPerCreep: cpuPerCreep!,
    bucketMean: bucketMean!,
    bucketMin: bucketMin!,
    rooms: rooms!,
    creeps: creeps!,
  };
}

/** Liest den Verlauf. Leeres Array, wenn das Segment nicht bereit oder leer ist. */
export function read(): HistoryEntry[] {
  if (!isAvailable()) return [];

  const raw = RawMemory.segments[HISTORY_SEGMENT];
  if (raw === undefined || raw.length === 0) return [];

  const entries: HistoryEntry[] = [];
  for (const line of raw.split("\n")) {
    if (line.length === 0) continue;
    const entry = parseEntry(line);
    if (entry !== undefined) entries.push(entry);
  }
  return entries;
}

/** Hängt ein abgeschlossenes Fenster an. `false`, wenn das Segment nicht bereit war. */
export function append(metrics: WindowMetrics): boolean {
  if (!isAvailable()) return false;

  const entries = read();
  entries.push(buildEntry(metrics));

  // Ringpuffer: mehr als HISTORY_MAX_ENTRIES Zeilen -> die aeltesten fallen weg.
  while (entries.length > HISTORY_MAX_ENTRIES) entries.shift();

  let serialized = entries.map(serializeEntry).join("\n");
  // Harte Groessengrenze: notfalls weitere alte Zeilen verwerfen, lieber
  // Verlauf verlieren als das Segment (100 KB) zu sprengen.
  while (serialized.length > MAX_SEGMENT_CHARS && entries.length > 0) {
    entries.shift();
    serialized = entries.map(serializeEntry).join("\n");
  }

  RawMemory.segments[HISTORY_SEGMENT] = serialized;
  return true;
}

/** Verwirft den Verlauf. Ohne bereites Segment gibt es nichts zu verwerfen. */
export function clear(): void {
  if (!isAvailable()) return;
  RawMemory.segments[HISTORY_SEGMENT] = "";
}

/** Formatiert eine Zahl auf `decimals` Nachkommastellen, sicher gegen NaN/Infinity. */
function fmt(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(decimals);
}

/** Spaltenbreiten der Verlaufstabelle. */
const COLUMN_WIDTHS = {
  tick: 8,
  ticks: 6,
  mode: 6,
  cpuPerTick: 9,
  cpuMaxTick: 8,
  cpuPerRoom: 9,
  cpuPerCreep: 10,
  bucketMean: 10,
  bucketMin: 11,
  rooms: 6,
  creeps: 7,
} as const;

/** Baut eine Tabellenzeile aus einer Verlaufszeile, ausgerichtet an `COLUMN_WIDTHS`. */
function formatRow(entry: HistoryEntry): string {
  return [
    fmt(entry.tick, 0).padStart(COLUMN_WIDTHS.tick),
    fmt(entry.ticks, 0).padStart(COLUMN_WIDTHS.ticks),
    entry.mode.padStart(COLUMN_WIDTHS.mode),
    fmt(entry.cpuPerTick).padStart(COLUMN_WIDTHS.cpuPerTick),
    fmt(entry.cpuMaxTick).padStart(COLUMN_WIDTHS.cpuMaxTick),
    fmt(entry.cpuPerRoom).padStart(COLUMN_WIDTHS.cpuPerRoom),
    fmt(entry.cpuPerCreep).padStart(COLUMN_WIDTHS.cpuPerCreep),
    fmt(entry.bucketMean, 0).padStart(COLUMN_WIDTHS.bucketMean),
    fmt(entry.bucketMin, 0).padStart(COLUMN_WIDTHS.bucketMin),
    fmt(entry.rooms).padStart(COLUMN_WIDTHS.rooms),
    fmt(entry.creeps).padStart(COLUMN_WIDTHS.creeps),
  ].join("  ");
}

/** Formatiert den Verlauf als Tabelle, jüngste Zeile zuletzt. */
export function format(entries: HistoryEntry[]): string {
  if (entries.length === 0) {
    // Bewusst in Befehlen gesprochen: `requestSegment` und `append` kann in der
    // Konsole niemand tippen, der Verlauf entsteht beim Messen von selbst.
    return "Kein Verlauf vorhanden. Mit prof.light() oder prof.on() messen — je volles Fenster (100 Ticks) kommt eine Zeile dazu.";
  }

  const header = [
    "Tick".padStart(COLUMN_WIDTHS.tick),
    "Ticks".padStart(COLUMN_WIDTHS.ticks),
    "Modus".padStart(COLUMN_WIDTHS.mode),
    "CPU/Tick".padStart(COLUMN_WIDTHS.cpuPerTick),
    "CPU/Max".padStart(COLUMN_WIDTHS.cpuMaxTick),
    "CPU/Raum".padStart(COLUMN_WIDTHS.cpuPerRoom),
    "CPU/Creep".padStart(COLUMN_WIDTHS.cpuPerCreep),
    "Bucket-Ø".padStart(COLUMN_WIDTHS.bucketMean),
    "Bucket-Min".padStart(COLUMN_WIDTHS.bucketMin),
    "Räume".padStart(COLUMN_WIDTHS.rooms),
    "Creeps".padStart(COLUMN_WIDTHS.creeps),
  ].join("  ");
  const separator = "-".repeat(header.length);
  const rows = entries.map(formatRow);

  return [header, separator, ...rows].join("\n");
}
