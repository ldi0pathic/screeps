/**
 * Schalter auf der Karte: eine Flagge steuert den Profiler, ohne dass ein
 * Befehl getippt werden muss. Dazu eine Legende als Room Visual daneben, damit
 * man die Farbzuordnung nicht im Kopf haben muss.
 *
 * Warum eine Flagge: Screeps hat keine API für eigene Bedienelemente.
 * `RoomVisual` zeichnet nur und ist nicht klickbar, die im Umlauf befindlichen
 * „Konsolenknöpfe" hängen an Client-Internas. Eine Flagge ist dokumentierte
 * Spiel-API (`Game.flags`), nur für den Besitzer sichtbar, kostet keine Energie
 * und übersteht jeden Global-Reset. Der Flaggen-Namensraum gilt je Spieler —
 * eine gleichnamige Flagge eines anderen Spielers kann hier nichts auslösen.
 *
 * Die Flagge bleibt dauerhaft stehen, ihre **Hauptfarbe** ist der Zustand; die
 * Zweitfarbe bleibt frei für eigene Zwecke. Gehandelt wird nur bei einer
 * Farbänderung (Flanke) — eine stehende Flagge überstimmte sonst jeden
 * Konsolenbefehl im nächsten Tick. Die letzte verarbeitete Farbe liegt deshalb
 * in `Memory.profiler.flagColor` und nicht im Heap: nach einem Global-Reset
 * soll die Flagge nicht erneut auslösen.
 *
 * Wie `state` meldet dieses Modul nur, was gewünscht ist — umgeschaltet wird in
 * `index`. Abhängigkeitsrichtung: `types <- state <- flag`.
 */

import { getFlagColor, setFlagColor } from "./state";
import { DEFAULT_DETAIL_TICKS, type ProfilerMode } from "./types";

/** Name der Schalterflagge. Ort und Raum sind gleichgültig: `Game.flags` ist weltweit. */
export const FLAG_NAME = "prof";

/** Was die Flagge verlangt: ein Zustand oder der Start einer Detailmessung. */
export type FlagRequest = ProfilerMode | "detail";

/** Eine belegte Flaggenfarbe. */
interface SwitchColor {
  color: ColorConstant;
  request: FlagRequest;
  /** Farbname, wie ihn der Client zeigt. */
  label: string;
  /** Wirkung, kurz für die Legende. */
  meaning: string;
  /** Annäherung der Flaggenfarbe, für den Text der Legende. */
  css: string;
}

/**
 * Die belegten Farben, in der Reihenfolge der Legende. Einzige Quelle für
 * Farbzuordnung, Beschriftung und Rückmeldung — eine zweite Tabelle liefe
 * auseinander.
 */
const SWITCH_COLORS: SwitchColor[] = [
  { color: COLOR_GREY, request: "off", label: "grau", meaning: "aus", css: "#b4b4b4" },
  { color: COLOR_WHITE, request: "light", label: "weiß", meaning: "light", css: "#ffffff" },
  { color: COLOR_GREEN, request: "full", label: "grün", meaning: "full", css: "#00ff00" },
  {
    color: COLOR_RED,
    request: "detail",
    label: "rot",
    meaning: `Detail ${DEFAULT_DETAIL_TICKS}T`,
    css: "#ff3030",
  },
];

/** Werte für die Legende. Bewusst vorgerechnet: hier wird nichts aus `Game` gelesen. */
export interface LegendData {
  mode: ProfilerMode;
  /** Gezählte Ticks im laufenden Fenster. */
  ticks: number;
  cpuPerTick: number;
  /** Restticks der Detailmessung, 0 wenn keine läuft. */
  detailRemaining: number;
}

function bySwitchColor(color: ColorConstant): SwitchColor | undefined {
  return SWITCH_COLORS.find(entry => entry.color === color);
}

function byRequest(request: FlagRequest): SwitchColor {
  // Für jede Anforderung existiert genau eine Farbe in `SWITCH_COLORS`.
  return SWITCH_COLORS.find(entry => entry.request === request)!;
}

/** Die Schalterflagge, falls gesetzt. */
function switchFlag(): Flag | undefined {
  return Game.flags[FLAG_NAME];
}

/**
 * Liefert die Anforderung der Flagge — **nur** bei einer Farbänderung, danach
 * `null`, solange die Farbe steht. Eine unbelegte Farbe wird einmal gemeldet
 * und dann wie „keine Änderung" behandelt.
 */
export function readRequest(): FlagRequest | null {
  const flag = switchFlag();
  if (flag === undefined) return null;
  if (flag.color === getFlagColor()) return null;

  setFlagColor(flag.color);

  const entry = bySwitchColor(flag.color);
  if (entry === undefined) {
    const belegt = SWITCH_COLORS.map(item => `${item.label}=${item.meaning}`).join(", ");
    console.log(`[prof] Flagge "${FLAG_NAME}": diese Farbe ist nicht belegt. Belegt sind ${belegt}.`);
    return null;
  }

  return entry.request;
}

/**
 * Färbt die Flagge passend zu `request` und merkt die Farbe als verarbeitet, so
 * dass daraus keine Flanke wird. Damit lügt die Flagge nie: auch ein Umschalten
 * über die Konsole färbt sie mit, rot bedeutet „misst gerade", und nach der
 * Detailmessung fällt sie von allein auf die Farbe des Zustands zurück, in dem
 * der Profiler weiterläuft.
 *
 * Ohne gesetzte Flagge tut die Funktion nichts — dann kostet sie auch keinen
 * Intent.
 */
export function acknowledge(request: FlagRequest): void {
  const flag = switchFlag();
  if (flag === undefined) return;

  const color = byRequest(request).color;
  if (flag.color === color) {
    setFlagColor(color);
    return;
  }

  flag.setColor(color, flag.secondaryColor);
  // Schon jetzt merken, obwohl der Farbwechsel erst am Tickende wirkt: sonst
  // sähe der nächste Tick eine Flanke und würde die Farbe erneut auslösen.
  setFlagColor(color);
}

/** Kurzbeschreibung der Flagge für `prof.status()`, `null` ohne Flagge. */
export function describe(): string | null {
  const flag = switchFlag();
  if (flag === undefined) return null;

  const entry = bySwitchColor(flag.color);
  const color = entry !== undefined ? `${entry.label} = ${entry.meaning}` : "unbelegte Farbe";
  return `Flagge ${FLAG_NAME} in ${flag.pos.roomName}: ${color}`;
}

/** Statuszeile unter der Legende. */
function statusLine(data: LegendData): string {
  const window =
    data.ticks === 0
      ? "noch keine Messung"
      : `Fenster ${data.ticks}T | CPU/Tick ${data.cpuPerTick.toFixed(2)}`;
  return data.detailRemaining > 0 ? `${window} | Detail noch ${data.detailRemaining}T` : window;
}

/** Ist diese Farbe gerade die wirksame? */
function isActive(entry: SwitchColor, data: LegendData): boolean {
  if (entry.request === "detail") return data.detailRemaining > 0;
  // Während der Detailmessung läuft der Zustand `full`; hervorgehoben wird dann
  // die rote Zeile, nicht die grüne.
  return data.detailRemaining === 0 && entry.request === data.mode;
}

/**
 * Zeichnet die Legende neben die Flagge. Nur wenn die Flagge steht — sie ist
 * damit der Ein- und Ausschalter der ganzen Anzeige. Room Visuals leben einen
 * Tick, das hier läuft deshalb jeden Tick erneut.
 */
export function draw(data: LegendData): void {
  const flag = switchFlag();
  if (flag === undefined) return;

  const visual = new RoomVisual(flag.pos.roomName);

  // In der rechten Raumhälfte nach links kippen, sonst liefe der Text über den
  // Rand hinaus.
  const toLeft = flag.pos.x >= 25;
  const x = toLeft ? flag.pos.x - 0.8 : flag.pos.x + 0.8;
  const align: "left" | "right" = toLeft ? "right" : "left";
  // Der Block ist sechs Zeilen hoch und soll im Raum bleiben.
  const top = Math.min(Math.max(flag.pos.y - 2, 0.8), 45);
  const lineHeight = 0.7;

  const style: TextStyle = {
    align,
    font: 0.5,
    backgroundColor: "#000000",
    backgroundPadding: 0.12,
  };

  visual.text(`prof: ${data.mode}`, x, top, { ...style, color: "#ffffff" });

  SWITCH_COLORS.forEach((entry, index) => {
    const active = isActive(entry, data);
    visual.text(
      `${active ? "▶" : "·"} ${entry.label} = ${entry.meaning}`,
      x,
      top + lineHeight * (index + 1),
      { ...style, color: entry.css, opacity: active ? 1 : 0.4 },
    );
  });

  visual.text(statusLine(data), x, top + lineHeight * (SWITCH_COLORS.length + 1), {
    ...style,
    color: "#cccccc",
    opacity: 0.8,
  });
}
