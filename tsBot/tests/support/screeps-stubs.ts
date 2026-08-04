/**
 * Stubs der Screeps-Laufzeit für Unittests.
 *
 * Der Bot läuft im Spiel gegen globale Objekte (`Game`, `Memory`, `RoomVisual`)
 * und globale Konstanten. Für einen Test ohne Spiel werden die hier angelegt.
 *
 * **Wichtig:** `Game` und `Memory` werden einmal angelegt und danach nur noch
 * *geleert*, nie ersetzt. Module des Bots greifen den Verweis beim Laden ab
 * (`profiler/state.ts`: `const profilerMemory = Memory as ...`) — ein neues
 * Objekt in `globalThis.Memory` würde dort nie ankommen, und der Test prüfte
 * anschließend ein Memory, in das niemand mehr schreibt.
 */

const anyGlobal = globalThis as any;

/** Farbkonstanten mit den echten Werten der Screeps-API. */
export const COLOR = {
  red: 1,
  purple: 2,
  blue: 3,
  cyan: 4,
  green: 5,
  yellow: 6,
  orange: 7,
  brown: 8,
  grey: 9,
  white: 10,
} as const;

/**
 * Spielkonstanten mit den echten Werten der Screeps-API.
 *
 * Eine Quelle für Unittests **und** `smoke.ts`: stünden die Werte zweimal, liefen
 * sie auseinander, und der Smoketest würde eine Welt stellen, in der die
 * Rumpfprofile anders rechnen als im Spiel.
 */
export const SCREEPS_CONSTANTS: Record<string, unknown> = {
  OK: 0,

  MOVE: "move",
  WORK: "work",
  CARRY: "carry",
  ATTACK: "attack",
  RANGED_ATTACK: "ranged_attack",
  TOUGH: "tough",
  HEAL: "heal",
  CLAIM: "claim",
  BODYPART_COST: {
    move: 50,
    work: 100,
    attack: 80,
    carry: 50,
    heal: 250,
    ranged_attack: 150,
    tough: 10,
    claim: 600,
  },
  MAX_CREEP_SIZE: 50,
  LINK_CAPACITY: 800,
  CARRY_CAPACITY: 50,

  ...Object.fromEntries(
    Object.entries(COLOR).map(([name, value]) => [`COLOR_${name.toUpperCase()}`, value]),
  ),
};

/** Ein von `RoomVisual.text()` gezeichneter Text. */
export interface DrawnText {
  roomName: string;
  text: string;
  x: number;
  y: number;
  style: Record<string, any>;
}

/** Alle Texte, die seit dem letzten `resetWorld()` gezeichnet wurden. */
export const drawnTexts: DrawnText[] = [];

/** Ein `setColor`-Aufruf: Haupt- und Zweitfarbe. */
export type SetColorCall = [number, number | undefined];

/** Alle `setColor`-Aufrufe seit dem letzten `resetWorld()`. */
export const setColorCalls: SetColorCall[] = [];

export interface FlagStub {
  name: string;
  color: number;
  secondaryColor: number;
  pos: { x: number; y: number; roomName: string };
  setColor(color: number, secondaryColor?: number): number;
}

/**
 * Steuerbare CPU-Werte. `getUsedCalls` ist der Nachweis für die Zusicherung des
 * Profilers, im Zustand `off` **kein** `Game.cpu.getUsed()` aufzurufen.
 */
export const cpu = {
  used: 0,
  bucket: 10000,
  limit: 20,
  tickLimit: 500,
  getUsedCalls: 0,
};

let installed = false;

/** Legt die globalen Objekte an. Mehrfachaufruf ist unschädlich. */
export function installGlobals(): void {
  if (installed) {
    resetWorld();
    return;
  }
  installed = true;

  // `bodies.ts` liest die Teilkonstanten schon beim Laden — sie müssen vor dem
  // Import des Moduls unter Test stehen.
  for (const [name, value] of Object.entries(SCREEPS_CONSTANTS)) {
    anyGlobal[name] = value;
  }

  anyGlobal.RoomVisual = class RoomVisualStub {
    constructor(public readonly roomName: string) {}

    text(text: string, x: number, y: number, style: Record<string, any> = {}): this {
      drawnTexts.push({ roomName: this.roomName, text, x, y, style });
      return this;
    }

    circle(): this {
      return this;
    }
  };

  // `global.room` ist die statische Raumkonfiguration aus `config.ts`.
  // `profiler/window.ts` zählt darüber die verwalteten Räume.
  anyGlobal.room = {};

  anyGlobal.Memory = {};
  anyGlobal.Game = {
    time: 1000,
    flags: {} as Record<string, FlagStub>,
    creeps: {},
    rooms: {},
    cpu: {
      getUsed(): number {
        cpu.getUsedCalls += 1;
        return cpu.used;
      },
      get bucket(): number {
        return cpu.bucket;
      },
      get limit(): number {
        return cpu.limit;
      },
      get tickLimit(): number {
        return cpu.tickLimit;
      },
    },
    notify: () => undefined,
  };
}

/** Leert Welt und Aufzeichnungen, ohne `Game`/`Memory` zu ersetzen. */
export function resetWorld(): void {
  for (const key of Object.keys(anyGlobal.Memory)) delete anyGlobal.Memory[key];
  for (const key of Object.keys(anyGlobal.Game.flags)) delete anyGlobal.Game.flags[key];
  for (const key of Object.keys(anyGlobal.room)) delete anyGlobal.room[key];
  anyGlobal.Game.time = 1000;
  cpu.used = 0;
  cpu.bucket = 10000;
  cpu.limit = 20;
  cpu.tickLimit = 500;
  cpu.getUsedCalls = 0;
  drawnTexts.length = 0;
  setColorCalls.length = 0;
}

/** Trägt Räume in `global.room` ein, als hätte `config.ts` sie definiert. */
export function stubRooms(...names: string[]): void {
  for (const name of names) {
    anyGlobal.room[name] = { room: name, spawnRoom: name };
  }
}

/** `Memory` der Laufzeit, für Prüfungen im Test. */
export function memory(): Record<string, any> {
  return anyGlobal.Memory;
}

/** `Game` der Laufzeit, für Prüfungen im Test. */
export function game(): Record<string, any> {
  return anyGlobal.Game;
}

/**
 * Setzt eine Flagge in `Game.flags`.
 *
 * `setColor` übernimmt die Farbe sofort, obwohl es im Spiel ein Intent ist, der
 * erst am Tickende wirkt. Das ist zulässig, weil `profiler/index.ts::tick()` die
 * Flagge genau einmal je Tick liest — zwischen Aufruf und Wirkung kann also
 * nichts sehen, dass die alte Farbe noch steht.
 */
export function stubFlag(
  color: number,
  options: { name?: string; secondaryColor?: number; x?: number; y?: number; roomName?: string } = {},
): FlagStub {
  const flag: FlagStub = {
    name: options.name ?? "prof",
    color,
    secondaryColor: options.secondaryColor ?? COLOR.white,
    pos: {
      x: options.x ?? 10,
      y: options.y ?? 20,
      roomName: options.roomName ?? "E58N6",
    },
    setColor(next: number, nextSecondary?: number): number {
      setColorCalls.push([next, nextSecondary]);
      this.color = next;
      return anyGlobal.OK;
    },
  };

  anyGlobal.Game.flags[flag.name] = flag;
  return flag;
}

/** Entfernt die Flagge wieder. */
export function removeFlag(name = "prof"): void {
  delete anyGlobal.Game.flags[name];
}

/** Fängt `console.log` ab. `restore()` gehört in jeden Pfad, auch den Fehlerfall. */
export function captureConsole(): { lines: string[]; restore(): void } {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => void lines.push(args.map(String).join(" "));
  return {
    lines,
    restore() {
      console.log = original;
    },
  };
}
