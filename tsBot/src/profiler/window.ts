/**
 * Herzstück der Messung: Akkumulatoren im Heap (Modul-Scope), ein gleitendes
 * Fenster über `WINDOW_TICKS` Ticks und die einmalige Ableitung der
 * Kennzahlen aus diesem Rohzustand.
 *
 * Der Heap überlebt Ticks innerhalb eines Global-Resets, aber nicht den Reset
 * selbst — das ist hier gewollt: `Memory` wird jeden Tick serialisiert, ein
 * Fenster mit hunderten Einzelwerten dort abzulegen wäre selbst ein
 * CPU-Problem.
 */

import type { RankedEntry, SectionStats, WindowMetrics, WindowSnapshot } from "./types";
import { WINDOW_TICKS } from "./types";
import { detailActive, getMode } from "./state";
import { bot } from "../globals";

/** Startzeitpunkt (`Game.cpu.getUsed()`) je noch offener `begin()`-Messung. */
const openSections = new Map<string, number>();

/** Neues, leeres Fenster. Referenziert bewusst kein `Game.*`, damit dieser
 *  Aufruf auch außerhalb eines laufenden Ticks (Modul-Ladezeit) sicher ist. */
function createEmptySnapshot(): WindowSnapshot {
  return {
    startTick: 0,
    ticks: 0,
    mode: "off",
    cpuTotal: 0,
    cpuMax: 0,
    bucketTotal: 0,
    bucketMin: Infinity,
    roomTotal: 0,
    creepTotal: 0,
    limit: 0,
    tickLimit: 0,
    sections: {},
    roles: {},
    creepDetail: {},
  };
}

let windowState: WindowSnapshot = createEmptySnapshot();

/** Verbucht `cpu` unter `key` in `map`; legt den Eintrag beim ersten Treffer an. */
function record(map: Record<string, SectionStats>, key: string, cpu: number): void {
  const existing = map[key];
  if (existing === undefined) {
    map[key] = { total: cpu, max: cpu, calls: 1 };
    return;
  }
  existing.total += cpu;
  existing.calls += 1;
  if (cpu > existing.max) existing.max = cpu;
}

/** Division, die bei einem Nenner von 0 einfach 0 liefert statt `NaN`/`Infinity`. */
function safeDiv(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

/** Baut die absteigend sortierte Rangliste für einen Abschnitt der Kennzahlen. */
function rank(map: Record<string, SectionStats>, ticks: number, cpuTotal: number): RankedEntry[] {
  const entries: RankedEntry[] = [];
  for (const name in map) {
    const stat = map[name]!;
    entries.push({
      name,
      cpuPerTick: safeDiv(stat.total, ticks),
      cpuPerCall: safeDiv(stat.total, stat.calls),
      callsPerTick: safeDiv(stat.calls, ticks),
      max: stat.max,
      share: safeDiv(stat.total, cpuTotal),
    });
  }
  entries.sort((a, b) => b.cpuPerTick - a.cpuPerTick);
  return entries;
}

/** Abschnittsmessung starten. Nur im Zustand `full` aktiv. */
export function begin(section: string): void {
  if (getMode() !== "full") return;
  openSections.set(section, Game.cpu.getUsed());
}

/** Abschnittsmessung beenden und verbuchen. Gleicher Wächter wie `begin`. */
export function end(section: string): void {
  if (getMode() !== "full") return;
  const start = openSections.get(section);
  // Ein `end` ohne passendes `begin` kommt vor, wenn der Zustand zwischen den
  // beiden Aufrufen von `light` auf `full` wechselt — `begin` lief da noch
  // mit dem alten Wächter und hat nichts eingetragen. Stillschweigend verwerfen.
  if (start === undefined) return;
  openSections.delete(section);
  record(windowState.sections, section, Game.cpu.getUsed() - start);
}

/**
 * Tickgrenze am Anfang von `loop()`. Zählt nur den Tick fürs Fenster — bewusst
 * **kein** `Game.cpu.getUsed()` hier. Der eine sinnvolle Gesamtwert je Tick
 * wird zentral in `endTick` gelesen, siehe dortiger Kommentar.
 */
export function beginTick(): void {
  // Im Zustand `off` läuft `endTick` nicht mit — es käme also nie CPU zum
  // gezählten Tick dazu. Ohne diesen Wächter würde `ticks` unabhängig davon
  // weiterlaufen: Wer den Profiler nach vielen Ticks in `off` einschaltet,
  // hätte sofort ein (scheinbar) volles Fenster mit fast keiner echten CPU
  // darin — `cpuPerTick` wäre erfunden und `isDue()` fälschlich sofort wahr.
  if (getMode() === "off") return;

  if (windowState.ticks === 0) {
    windowState.startTick = Game.time;
  }
  windowState.ticks += 1;
}

/**
 * Tickende. Verbucht Gesamttick, Bucket, Räume und Creeps. Läuft in `light`
 * und `full`, aber nicht in `off`.
 */
export function endTick(creepCount: number): void {
  const mode = getMode();
  if (mode === "off") return;

  // `getUsed()` liefert hier den Gesamtwert des Ticks, keine Differenz zu
  // einem Startwert: es zählt alles, was das Skript in diesem Tick verbraucht
  // hat, einschließlich der Deserialisierung von `Memory` vor `loop()` — genau
  // die Zahl, die gegen `Game.cpu.limit` läuft. `beginTick()` liest deshalb
  // bewusst kein `getUsed()`; im Zustand `light` läuft so nur dieser eine Aufruf.
  const cpu = Game.cpu.getUsed();

  windowState.mode = mode;
  windowState.cpuTotal += cpu;
  if (cpu > windowState.cpuMax) windowState.cpuMax = cpu;

  const bucket = Game.cpu.bucket;
  windowState.bucketTotal += bucket;
  if (bucket < windowState.bucketMin) windowState.bucketMin = bucket;

  windowState.roomTotal += Object.keys(bot.room).length;
  windowState.creepTotal += creepCount;

  windowState.limit = Game.cpu.limit;
  windowState.tickLimit = Game.cpu.tickLimit;
}

/** Rollenzeit verbuchen. Genutzt vom Rollen-Wrapper in `decorator.ts`. */
export function recordRole(role: string, cpu: number): void {
  record(windowState.roles, role, cpu);
}

/**
 * Zeit eines einzelnen Creeps verbuchen. Der Rollen-Wrapper in `decorator.ts`
 * ruft das bewusst bei jedem `doJob` im Zustand `full` auf, ohne selbst nach
 * Detailmessung zu unterscheiden — er entscheidet das bewusst nicht selbst.
 * Der Vertrag in `types.ts` verlangt aber, dass `creepDetail` nur während der
 * Detailmessung gefüllt wird (sonst landen alle ~60 Creeps jeden Tick in der
 * sortierten Liste), also sitzt der Wächter hier. `getMode()` zuerst, damit im
 * Zustand `light` gar nicht erst auf `Memory.profiler` zugegriffen wird.
 */
export function recordCreep(creepName: string, cpu: number): void {
  if (getMode() !== "full") return;
  if (!detailActive()) return;
  record(windowState.creepDetail, creepName, cpu);
}

/** Rohzustand des laufenden Fensters. */
export function snapshot(): WindowSnapshot {
  return windowState;
}

/**
 * Leitet die Kennzahlen aus einem `WindowSnapshot` ab. Die einzige Stelle, die
 * dividiert — jede Division ist gegen einen Nenner von 0 abgesichert, damit
 * ein leeres Fenster niemals `NaN`/`Infinity` liefert.
 */
export function metrics(snapshotState: WindowSnapshot): WindowMetrics {
  const ticks = snapshotState.ticks;
  const rooms = safeDiv(snapshotState.roomTotal, ticks);
  const creeps = safeDiv(snapshotState.creepTotal, ticks);
  const cpuPerTick = safeDiv(snapshotState.cpuTotal, ticks);

  return {
    ticks,
    mode: snapshotState.mode,
    cpuPerTick,
    cpuMaxTick: snapshotState.cpuMax,
    cpuPerRoom: safeDiv(cpuPerTick, rooms),
    cpuPerCreep: safeDiv(cpuPerTick, creeps),
    rooms,
    creeps,
    bucketMean: safeDiv(snapshotState.bucketTotal, ticks),
    bucketMin: snapshotState.bucketMin === Infinity ? 0 : snapshotState.bucketMin,
    limit: snapshotState.limit,
    tickLimit: snapshotState.tickLimit,
    sections: rank(snapshotState.sections, ticks, snapshotState.cpuTotal),
    roles: rank(snapshotState.roles, ticks, snapshotState.cpuTotal),
    creepDetail: rank(snapshotState.creepDetail, ticks, snapshotState.cpuTotal),
  };
}

/** Fenster verwerfen und neu beginnen. */
export function reset(): void {
  openSections.clear();
  windowState = createEmptySnapshot();
}

/** `true`, wenn das Fenster `WINDOW_TICKS` Ticks voll hat. */
export function isDue(): boolean {
  return windowState.ticks >= WINDOW_TICKS;
}
