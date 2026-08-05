/**
 * Zustand des Profilers: Zustandsschalter, Detailmessung, Grundlinien und die
 * Farbe der Schalterflagge — alles, was einen Global-Reset überleben muss und
 * deshalb in `Memory.profiler` liegt.
 *
 * Der Zustand wird **einmal je Tick** aus `Memory.profiler` in das Feld
 * `mirroredMode` gespiegelt (`syncFromMemory`). Jede Prüfung im heißen Pfad
 * (z. B. ob überhaupt `Game.cpu.getUsed()` laufen soll) liest danach nur noch
 * `mode` — nie direkt `Memory`.
 *
 * Als Klasse, damit ein Test seine eigene Instanz bauen kann, statt Modulzustand
 * zurücksetzen zu müssen. `Memory` wird deshalb auch **erst beim Zugriff**
 * gelesen (`entry`) und nicht im Konstruktor festgehalten: sonst hinge die
 * Instanz für immer an dem Objekt, das beim Erzeugen zufällig in `Memory` stand.
 */

import type { Baseline, ProfilerMemory, ProfilerMode } from "./types";

export class ProfilerState {
  /** Höchstzahl gespeicherter Grundlinien, damit `Memory.profiler` klein bleibt. */
  private static readonly MAX_BASELINES = 8;

  /** Gespiegelter Zustand, einmal je Tick aus `Memory.profiler` übernommen. */
  private mirroredMode: ProfilerMode = "off";

  /** `Memory.profiler`, bei Bedarf mit Standard `off` angelegt. */
  private get entry(): ProfilerMemory {
    const memory = Memory as Memory & { profiler?: ProfilerMemory };
    return (memory.profiler ??= { mode: "off" });
  }

  /** Der gespiegelte Zustand. Billig — nur ein Feldzugriff. */
  get mode(): ProfilerMode {
    return this.mirroredMode;
  }

  /** Setzt den Zustand in `Memory` und im Spiegel. */
  set mode(mode: ProfilerMode) {
    this.entry.mode = mode;
    this.mirroredMode = mode;
  }

  /** Spiegelt den Zustand aus `Memory`. Einmal je Tick, als erstes. */
  syncFromMemory(): ProfilerMode {
    this.mirroredMode = this.entry.mode;
    return this.mirroredMode;
  }

  /** Startet die Detailmessung für `ticks` Ticks und merkt den Rückkehrzustand. */
  startDetail(ticks: number): void {
    const entry = this.entry;

    // Läuft die Detailmessung schon, bleibt der ursprüngliche Rückkehrzustand
    // erhalten — sonst würde ein zweites `prof.detail()` während der Messung
    // fälschlich "full" als Rückkehrzustand festschreiben.
    if (entry.detailUntil === undefined) {
      entry.detailReturnTo = this.mirroredMode;
    }

    entry.detailUntil = Game.time + ticks;
    entry.mode = "full";
    this.mirroredMode = "full";
  }

  /**
   * Bricht eine laufende Detailmessung ab, **ohne** den Rückkehrzustand
   * anzuwenden. Für einen Zustandswechsel über Konsole oder Flagge: wer
   * ausdrücklich `off`, `light` oder `full` verlangt, will nicht, dass die
   * Detailmessung Ticks später ihren alten Zustand zurückholt.
   */
  cancelDetail(): void {
    const entry = this.entry;
    delete entry.detailUntil;
    delete entry.detailReturnTo;
  }

  /** Läuft gerade eine Detailmessung? */
  detailActive(): boolean {
    return this.entry.detailUntil !== undefined;
  }

  /** Restticks der Detailmessung, 0 wenn sie nicht läuft. */
  detailRemaining(): number {
    const until = this.entry.detailUntil;
    if (until === undefined) {
      return 0;
    }

    const remaining = until - Game.time;
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Liefert `true` genau in dem Tick, in dem die Detailmessung abgelaufen ist,
   * und stellt dabei den Rückkehrzustand wieder her. Danach `false`.
   */
  expireDetail(): boolean {
    const entry = this.entry;
    if (entry.detailUntil === undefined || Game.time < entry.detailUntil) {
      return false;
    }

    const returnTo = entry.detailReturnTo ?? "off";
    this.cancelDetail();
    entry.mode = returnTo;
    this.mirroredMode = returnTo;
    return true;
  }

  /** Hält ein Fenster als benannte Grundlinie fest. */
  saveBaseline(name: string, baseline: Baseline): void {
    const baselines = (this.entry.baselines ??= {});
    baselines[name] = baseline;

    const names = Object.keys(baselines);
    if (names.length <= ProfilerState.MAX_BASELINES) {
      return;
    }

    // `Memory.profiler` muss unter 1 KB bleiben: bei Überlauf fliegt die
    // älteste Grundlinie (kleinstes `tick`) raus, statt unbegrenzt zu wachsen.
    let oldestName = names[0]!;
    for (const candidate of names) {
      if (baselines[candidate]!.tick < baselines[oldestName]!.tick) {
        oldestName = candidate;
      }
    }
    delete baselines[oldestName];
  }

  /** Alle festgehaltenen Grundlinien, leeres Objekt statt `undefined`. */
  readBaselines(): Record<string, Baseline> {
    return this.entry.baselines ?? {};
  }

  /** Zuletzt verarbeitete Farbe der Schalterflagge, `undefined` wenn noch keine. */
  get flagColor(): ColorConstant | undefined {
    return this.entry.flagColor;
  }

  /** Merkt eine Flaggenfarbe als verarbeitet, damit sie keine Flanke mehr auslöst. */
  set flagColor(color: ColorConstant) {
    this.entry.flagColor = color;
  }
}
