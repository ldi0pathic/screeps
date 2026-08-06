/**
 * Öffentliche Schnittstelle des Profilers.
 *
 * Hier läuft zusammen, was `state`, `window`, `flag`, `report`, `stats` und
 * `decorator` beitragen — und nur hier wird auf die Konsole geschrieben. Die
 * Teilmodule liefern Text, sie drucken ihn nicht: so bleibt steuerbar, wann die
 * Konsole etwas sieht. Sie ist das einzige Diagnosefenster im Spiel.
 *
 * Das Modul wirkt zusätzlich über einen Seiteneffekt: es legt den Profiler als
 * `bot.prof` ab. Weil `bot` dasselbe Objekt wie `global` ist, tippt man im
 * Spiel `prof.report()`.
 */

import { bot } from "../globals";
import type { FlagSwitch } from "./flag";
import * as history from "./history";
import { mailReport } from "./mail";
import { formatBaselines, formatComparison, formatDetailReport, formatWindowLine } from "./report";
import { flagSwitch, measurement, state } from "./runtime";
import type { ProfilerState } from "./state";
import { clearStats, writeStats } from "./stats";
import {
  DEFAULT_DETAIL_TICKS,
  type Baseline,
  type ProfilerHandle,
  type ProfilerMode,
  type RankedEntry,
  type WindowMetrics,
} from "./types";
import type { MeasurementWindow } from "./window";

export { SECTION } from "./types";
export { profile, wrapRoles } from "./decorator";
export type { ProfilerHandle, ProfilerMode } from "./types";

/**
 * Rundet eine Rangliste auf `name -> cpuPerTick`, zwei Nachkommastellen.
 *
 * Die Rundung ist kein Schönheitsfehler, sondern Absicht: die Grundlinie liegt
 * in `Memory` und wird damit in **jedem** Tick mitgeparst. `0.07` statt
 * `0.07213948...` spart je Eintrag ein Vielfaches an Zeichen, und feiner als
 * zwei Stellen ist bei CPU-Messwerten ohnehin Rauschen.
 */
function toCpuMap(entries: RankedEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of entries) {
    map[entry.name] = Math.round(entry.cpuPerTick * 100) / 100;
  }
  return map;
}

/**
 * Baut aus Kennzahlen eine Grundlinie.
 *
 * Abschnitte und Rollen kommen mit — ohne sie kann `prof.compare` zwar sagen,
 * dass es teurer wurde, aber nicht **wo**. Methoden und einzelne Creeps bleiben
 * draußen: sie sind der Großteil der Datenmenge, und Creep-Schlüssel verwaisen
 * mit dem Creep.
 */
function toBaseline(metrics: WindowMetrics): Baseline {
  const baseline: Baseline = {
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

  // Nur im Zustand `full` gibt es überhaupt Abschnitte und Rollen. Leere
  // Objekte zu schreiben würde `compare` später vorgaukeln, alles sei
  // weggefallen — deshalb bleiben die Felder dann ganz weg.
  if (metrics.mode === "full") {
    baseline.sections = toCpuMap(metrics.sections);
    baseline.roles = toCpuMap(metrics.roles);
  }

  return baseline;
}

/**
 * Der Profiler: Tickgrenzen, Konsolenbefehle und die Auswertung des Fensters.
 *
 * Die Konsolenmethoden erfüllen `ProfilerHandle` und liefern deshalb alle eine
 * Zeichenkette — die Konsole zeigt sonst `undefined`.
 */
export class Profiler implements ProfilerHandle {
  /**
   * Zustand des letzten Ticks. Wechselt der Zustand, wird das laufende Fenster
   * verworfen — sonst mischte ein Fenster Ticks aus `light` und `full` und die
   * abgeleiteten Zahlen wären nicht vergleichbar.
   */
  private lastMode: ProfilerMode = "off";

  constructor(
    private readonly state: ProfilerState,
    private readonly measurement: MeasurementWindow,
    private readonly flagSwitch: FlagSwitch,
  ) {}

  /**
   * Tickgrenze am Anfang von `loop()`. Spiegelt den über Konsole oder Flagge
   * gesetzten Zustand aus `Memory` und beendet eine abgelaufene Detailmessung.
   */
  tick(): void {
    this.state.syncFromMemory();

    // Das Verlaufssegment muss angefordert sein, bevor am Fensterende
    // hineingeschrieben werden kann — ein Schreibzugriff auf ein nicht aktives
    // Segment verpufft. Im Zustand `off` bleibt es unangetastet und kostet
    // nichts.
    if (this.state.mode !== "off") {
      history.requestSegment();
    }

    // Vor der Messung, damit ein Farbwechsel schon in diesem Tick greift.
    this.applyFlagRequest();
    this.drawFlagLegend();

    // Selbstabschaltung der Detailmessung: Abschlussbericht ausgeben, solange die
    // Daten noch im Fenster stehen, danach frisch beginnen.
    if (this.state.expireDetail()) {
      console.log(
        `[prof] Detailmessung beendet.\n${formatDetailReport(this.measurement.metrics())}`,
      );
      this.lastMode = this.state.mode;
      this.flagSwitch.acknowledge(this.lastMode);
      this.measurement.reset();
      this.measurement.beginTick();
      return;
    }

    if (this.state.mode !== this.lastMode) {
      this.lastMode = this.state.mode;
      this.measurement.reset();
    }

    this.measurement.beginTick();
  }

  /** Tickende. Verbucht den Tick und gibt das Fenster aus, sobald es voll ist. */
  endTick(creepCount: number): void {
    this.measurement.endTick(creepCount);

    if (!this.measurement.isDue) return;

    const metrics = this.measurement.metrics();
    console.log(formatWindowLine(metrics));
    writeStats(metrics);
    // Scheitert stillschweigend, solange das Segment noch nicht bereit ist —
    // das ist genau ein Fenster Verzögerung nach dem Einschalten, kein Fehler.
    history.append(metrics);
    this.measurement.reset();
  }

  on(): string {
    this.switchMode("full");
    return "Profiler: full — Gesamttick, Abschnitte und Rollen. Fensterzeile alle 100 Ticks.";
  }

  light(): string {
    this.switchMode("light");
    return "Profiler: light — nur Gesamttick, Bucket, CPU pro Raum und pro Creep.";
  }

  off(): string {
    this.switchMode("off");
    clearStats();
    return "Profiler: aus. Es läuft kein Game.cpu.getUsed() mehr.";
  }

  status(): string {
    const detail = this.state.detailActive()
      ? ` | Detailmessung noch ${this.state.detailRemaining()} Ticks`
      : "";
    const flag = this.flagSwitch.describe();
    const switchState = flag !== null ? ` | ${flag}` : "";
    return `Profiler: ${this.state.mode} | Fenster ${this.measurement.snapshot.ticks}/100 Ticks${detail}${switchState}`;
  }

  report(): string {
    const metrics = this.measurement.metrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster. Mit prof.light() oder prof.on() einschalten.";
    }

    const line = formatWindowLine(metrics);
    if (metrics.sections.length === 0 && metrics.roles.length === 0) {
      return line;
    }
    return `${line}\n${formatDetailReport(metrics)}`;
  }

  reset(): string {
    this.measurement.reset();
    return "Fenster verworfen, Messung beginnt neu.";
  }

  detail(ticks = DEFAULT_DETAIL_TICKS): string {
    if (!Number.isFinite(ticks) || ticks < 1) {
      return `Ungültige Tickzahl. Beispiel: prof.detail(${DEFAULT_DETAIL_TICKS})`;
    }

    const returnTo = this.state.mode;
    this.state.startDetail(Math.floor(ticks));
    this.lastMode = "full";
    this.measurement.reset();
    // Rot heißt „misst gerade"; die Selbstabschaltung färbt die Flagge zurück.
    this.flagSwitch.acknowledge("detail");
    return `Detailmessung für ${Math.floor(ticks)} Ticks gestartet, danach zurück auf ${returnTo}.`;
  }

  baseline(name: string): string {
    if (!name) {
      return 'Name fehlt. Beispiel: prof.baseline("vor-plan-02")';
    }

    const metrics = this.measurement.metrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster — es gibt nichts festzuhalten.";
    }

    this.state.saveBaseline(name, toBaseline(metrics));

    if (metrics.ticks < 1000) {
      // Kein Abbruch, nur ein Hinweis: kürzere Fenster schwanken zu stark, weil
      // Spawnwellen, die Tagessequenz (alle 28 800 Ticks) und Angriffe die
      // Werte verzerren. Die Grundlinie ist trotzdem gespeichert.
      return `Grundlinie "${name}" gespeichert — Achtung, nur ${metrics.ticks} Ticks. Für einen belastbaren Vergleich mindestens 1000 Ticks messen.`;
    }

    return `Grundlinie "${name}" über ${metrics.ticks} Ticks gespeichert.`;
  }

  baselines(): string {
    const metrics = this.measurement.metrics();
    return formatBaselines(this.state.readBaselines(), metrics.ticks > 0 ? metrics : null);
  }

  compare(name: string): string {
    if (!name) {
      return 'Name fehlt. Beispiel: prof.compare("vor-linknetz")';
    }

    const baseline = this.state.readBaselines()[name];
    if (!baseline) {
      return `Keine Grundlinie "${name}". Vorhandene zeigt prof.baselines().`;
    }

    const metrics = this.measurement.metrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster — es gibt nichts zu vergleichen.";
    }

    return formatComparison(name, baseline, metrics);
  }

  mail(): string {
    const report = this.report();
    return mailReport(`[prof] Bericht Tick ${Game.time}`, report);
  }

  history(): string {
    if (!history.isAvailable()) {
      // Segmente werden erst im nächsten Tick lesbar — das ist die API, kein
      // Fehler. Anfordern und den Nutzer wiederkommen lassen.
      history.requestSegment();
      return "Verlaufssegment angefordert. prof.history() im nächsten Tick noch einmal aufrufen.";
    }

    return history.format(history.read());
  }

  /**
   * Wechselt den Zustand und beginnt ein frisches Fenster.
   *
   * Ein ausdrücklicher Zustandswechsel beendet außerdem eine laufende
   * Detailmessung: wer `off`, `light` oder `full` verlangt, will nicht, dass ihm
   * Ticks später die Selbstabschaltung den alten Zustand zurückholt.
   */
  private switchMode(mode: ProfilerMode): void {
    if (this.state.detailActive()) {
      this.state.cancelDetail();
      console.log(
        "[prof] Laufende Detailmessung abgebrochen, kein Abschlussbericht — prof.report() zeigt das Fenster.",
      );
    }

    if (this.state.mode !== mode) {
      this.state.mode = mode;
      this.lastMode = mode;
      this.measurement.reset();
    }

    this.flagSwitch.acknowledge(mode);
  }

  /** Führt aus, was die Schalterflagge verlangt — nur bei einer Farbänderung. */
  private applyFlagRequest(): void {
    const request = this.flagSwitch.readRequest();
    if (request === null) return;

    if (request === "detail") {
      console.log(`[prof] Flagge: ${this.detail()}`);
      return;
    }

    const message =
      request === "off" ? this.off() : request === "light" ? this.light() : this.on();
    console.log(`[prof] Flagge: ${message}`);
  }

  /**
   * Zeichnet die Legende neben die Schalterflagge.
   *
   * Bewusst aus dem Rohzustand statt aus `metrics()`: die Kennzahlen sortieren
   * vier Ranglisten, und das jeden Tick nur für eine Textzeile zu tun wäre genau
   * die Art Kosten, die der Profiler aufspüren soll.
   */
  private drawFlagLegend(): void {
    const window = this.measurement.snapshot;
    this.flagSwitch.draw({
      mode: this.state.mode,
      ticks: window.ticks,
      cpuPerTick: window.ticks > 0 ? window.cpuTotal / window.ticks : 0,
      detailRemaining: this.state.detailRemaining(),
    });
  }
}

/** Der Profiler des laufenden Bots. */
export const profiler = new Profiler(state, measurement, flagSwitch);

bot.prof = profiler;

/**
 * Freistehende Fassade für `main.ts` und `controller/timing.ts`. Die Messpunkte
 * dort sollen keine Instanz kennen müssen — und im Zustand `off` bleibt der
 * Aufruf ein sofortiges `return`.
 */
export function tick(): void {
  profiler.tick();
}

/** Gegenstück zu `tick`, muss die letzte Anweisung von `loop()` sein. */
export function endTick(creepCount: number): void {
  profiler.endTick(creepCount);
}

/** Abschnittsmessung. Im Zustand `off` und `light` ein sofortiges `return`. */
export function begin(section: string): void {
  measurement.begin(section);
}

/** Gegenstück zu `begin`. */
export function end(section: string): void {
  measurement.end(section);
}
