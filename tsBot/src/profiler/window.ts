/**
 * Herzstück der Messung: ein gleitendes Fenster über `WINDOW_TICKS` Ticks samt
 * der einmaligen Ableitung der Kennzahlen aus diesem Rohzustand.
 *
 * Der Rohzustand lebt im Heap (Feld der Instanz), **nicht** in `Memory`:
 * `Memory` wird jeden Tick serialisiert, ein Fenster mit hunderten Einzelwerten
 * dort abzulegen wäre selbst ein CPU-Problem. Ein Global-Reset verwirft das
 * laufende Fenster damit — das ist gewollt.
 *
 * Als Klasse mit übergebenem `ProfilerState`: die Messung fragt den Zustand,
 * statt ihn zu kennen, und ein Test baut sich beides frisch, ohne Modulzustand
 * zurücksetzen zu müssen.
 */

import { bot } from "../globals";
import type { ProfilerState } from "./state";
import type { RankedEntry, SectionStats, WindowMetrics, WindowSnapshot } from "./types";
import { WINDOW_TICKS } from "./types";

/**
 * Neues, leeres Fenster. Referenziert bewusst kein `Game.*`, damit dieser
 * Aufruf auch außerhalb eines laufenden Ticks (Modul-Ladezeit) sicher ist.
 */
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
    methods: {},
    creepDetail: {},
  };
}

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

/** Baut die absteigend sortierte Rangliste für einen Eimer der Kennzahlen. */
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

export class MeasurementWindow {
  /** Startzeitpunkt (`Game.cpu.getUsed()`) je noch offener `begin()`-Messung. */
  private readonly openSections = new Map<string, number>();

  private window: WindowSnapshot = createEmptySnapshot();

  constructor(private readonly state: ProfilerState) {}

  /** Rohzustand des laufenden Fensters. */
  get snapshot(): WindowSnapshot {
    return this.window;
  }

  /** `true`, wenn das Fenster `WINDOW_TICKS` Ticks voll hat. */
  get isDue(): boolean {
    return this.window.ticks >= WINDOW_TICKS;
  }

  /** Abschnittsmessung starten. Nur im Zustand `full` aktiv. */
  begin(section: string): void {
    if (this.state.mode !== "full") return;
    this.openSections.set(section, Game.cpu.getUsed());
  }

  /** Abschnittsmessung beenden und verbuchen. Gleicher Wächter wie `begin`. */
  end(section: string): void {
    if (this.state.mode !== "full") return;

    const start = this.openSections.get(section);
    // Ein `end` ohne passendes `begin` kommt vor, wenn der Zustand zwischen den
    // beiden Aufrufen von `light` auf `full` wechselt — `begin` lief da noch
    // mit dem alten Wächter und hat nichts eingetragen. Stillschweigend verwerfen.
    if (start === undefined) return;

    this.openSections.delete(section);
    record(this.window.sections, section, Game.cpu.getUsed() - start);
  }

  /**
   * Tickgrenze am Anfang von `loop()`. Zählt nur den Tick fürs Fenster — bewusst
   * **kein** `Game.cpu.getUsed()` hier. Der eine sinnvolle Gesamtwert je Tick
   * wird zentral in `endTick` gelesen, siehe dortiger Kommentar.
   */
  beginTick(): void {
    // Im Zustand `off` läuft `endTick` nicht mit — es käme also nie CPU zum
    // gezählten Tick dazu. Ohne diesen Wächter würde `ticks` unabhängig davon
    // weiterlaufen: Wer den Profiler nach vielen Ticks in `off` einschaltet,
    // hätte sofort ein (scheinbar) volles Fenster mit fast keiner echten CPU
    // darin — `cpuPerTick` wäre erfunden und `isDue` fälschlich sofort wahr.
    if (this.state.mode === "off") return;

    if (this.window.ticks === 0) {
      this.window.startTick = Game.time;
    }
    this.window.ticks += 1;
  }

  /**
   * Tickende. Verbucht Gesamttick, Bucket, Räume und Creeps. Läuft in `light`
   * und `full`, aber nicht in `off`.
   */
  endTick(creepCount: number): void {
    const mode = this.state.mode;
    if (mode === "off") return;

    // `getUsed()` liefert hier den Gesamtwert des Ticks, keine Differenz zu
    // einem Startwert: es zählt alles, was das Skript in diesem Tick verbraucht
    // hat, einschließlich der Deserialisierung von `Memory` vor `loop()` — genau
    // die Zahl, die gegen `Game.cpu.limit` läuft. `beginTick()` liest deshalb
    // bewusst kein `getUsed()`; im Zustand `light` läuft so nur dieser eine Aufruf.
    const cpu = Game.cpu.getUsed();
    const window = this.window;

    window.mode = mode;
    window.cpuTotal += cpu;
    if (cpu > window.cpuMax) window.cpuMax = cpu;

    const bucket = Game.cpu.bucket;
    window.bucketTotal += bucket;
    if (bucket < window.bucketMin) window.bucketMin = bucket;

    window.roomTotal += Object.keys(bot.room).length;
    window.creepTotal += creepCount;

    window.limit = Game.cpu.limit;
    window.tickLimit = Game.cpu.tickLimit;
  }

  /** Rollenzeit verbuchen. Genutzt vom Rollen-Wrapper in `decorator.ts`. */
  recordRole(role: string, cpu: number): void {
    record(this.window.roles, role, cpu);
  }

  /** Zeit einer Klassenmethode verbuchen. Genutzt vom `@profile`-Dekorator. */
  recordMethod(key: string, cpu: number): void {
    // Eigener Eimer statt `roles`: der Dekorator umhüllt jede Methode einer
    // Rollenklasse, `wrapRoles` verbucht daneben die Rolle als Ganzes — beides
    // in einer Rangliste würde dieselbe CPU doppelt zählen.
    record(this.window.methods, key, cpu);
  }

  /**
   * Zeit eines einzelnen Creeps verbuchen. Der Rollen-Wrapper in `decorator.ts`
   * ruft das bewusst bei jedem `doJob` im Zustand `full` auf, ohne selbst nach
   * Detailmessung zu unterscheiden. Der Vertrag in `types.ts` verlangt aber, dass
   * `creepDetail` nur während der Detailmessung gefüllt wird (sonst landen alle
   * ~60 Creeps jeden Tick in der sortierten Liste), also sitzt der Wächter hier.
   * Der Zustand zuerst, damit in `light` gar nicht erst auf `Memory.profiler`
   * zugegriffen wird.
   */
  recordCreep(creepName: string, cpu: number): void {
    if (this.state.mode !== "full") return;
    if (!this.state.detailActive()) return;
    record(this.window.creepDetail, creepName, cpu);
  }

  /**
   * Leitet die Kennzahlen aus dem laufenden Fenster ab. Die einzige Stelle, die
   * dividiert — jede Division ist gegen einen Nenner von 0 abgesichert, damit
   * ein leeres Fenster niemals `NaN`/`Infinity` liefert.
   */
  metrics(): WindowMetrics {
    const window = this.window;
    const ticks = window.ticks;
    const rooms = safeDiv(window.roomTotal, ticks);
    const creeps = safeDiv(window.creepTotal, ticks);
    const cpuPerTick = safeDiv(window.cpuTotal, ticks);

    return {
      ticks,
      mode: window.mode,
      cpuPerTick,
      cpuMaxTick: window.cpuMax,
      cpuPerRoom: safeDiv(cpuPerTick, rooms),
      cpuPerCreep: safeDiv(cpuPerTick, creeps),
      rooms,
      creeps,
      bucketMean: safeDiv(window.bucketTotal, ticks),
      bucketMin: window.bucketMin === Infinity ? 0 : window.bucketMin,
      limit: window.limit,
      tickLimit: window.tickLimit,
      sections: rank(window.sections, ticks, window.cpuTotal),
      roles: rank(window.roles, ticks, window.cpuTotal),
      methods: rank(window.methods, ticks, window.cpuTotal),
      creepDetail: rank(window.creepDetail, ticks, window.cpuTotal),
    };
  }

  /** Fenster verwerfen und neu beginnen. */
  reset(): void {
    this.openSections.clear();
    this.window = createEmptySnapshot();
  }
}
