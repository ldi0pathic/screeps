// smoke.ts - Smoketest gegen das **gebaute** Bundle `../tsProd/main.js`.
//
// Die Unittests in `tests/` prüfen einzelne Module. Hier wird das Ergebnis des
// Builds genommen — genau die Datei, die das Spiel über GitHub zieht — in einer
// gestellten Welt geladen und ein paar Ticks gefahren. Damit fällt auf, was ein
// Typecheck nicht sieht: ein Fehler beim Laden des Moduls, eine kaputte
// Reihenfolge der Seiteneffekte in `config.ts`, oder ein Tick, der wirft.
//
// Aufruf über `pnpm smoke` (baut vorher). Die Welt ist absichtlich leer: keine
// Sicht, keine Creeps, keine Spawns. Der Bot muss auch damit durchlaufen.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const BUNDLE = resolve("..", "tsProd", "main.js");

/** Screeps-Konstanten, die der Bot beim Laden oder im Tick wirklich braucht. */
const CONSTANTS: Record<string, unknown> = {
  OK: 0,
  ERR_NOT_OWNER: -1,
  ERR_NO_PATH: -2,
  ERR_NAME_EXISTS: -3,
  ERR_BUSY: -4,
  ERR_NOT_FOUND: -5,
  ERR_NOT_ENOUGH_RESOURCES: -6,
  ERR_NOT_ENOUGH_ENERGY: -6,
  ERR_INVALID_TARGET: -7,
  ERR_FULL: -8,
  ERR_NOT_IN_RANGE: -9,
  ERR_INVALID_ARGS: -10,
  ERR_TIRED: -11,
  RESOURCE_ENERGY: "energy",
  STRUCTURE_SPAWN: "spawn",
  STRUCTURE_EXTENSION: "extension",
  STRUCTURE_ROAD: "road",
  STRUCTURE_WALL: "constructedWall",
  STRUCTURE_RAMPART: "rampart",
  STRUCTURE_LINK: "link",
  STRUCTURE_STORAGE: "storage",
  STRUCTURE_TOWER: "tower",
  STRUCTURE_CONTAINER: "container",
  STRUCTURE_TERMINAL: "terminal",
  STRUCTURE_LAB: "lab",
  STRUCTURE_CONTROLLER: "controller",
  COLOR_RED: 1,
  COLOR_PURPLE: 2,
  COLOR_BLUE: 3,
  COLOR_CYAN: 4,
  COLOR_GREEN: 5,
  COLOR_YELLOW: 6,
  COLOR_ORANGE: 7,
  COLOR_BROWN: 8,
  COLOR_GREY: 9,
  COLOR_WHITE: 10,
};

/** Minimales lodash: der Bot benutzt genau `filter`, `find` und `sum`. */
const lodash = {
  filter<T>(collection: Record<string, T> | T[], predicate: (item: T) => boolean): T[] {
    return Object.values(collection).filter(predicate);
  },
  find<T>(collection: Record<string, T> | T[], predicate: (item: T) => boolean): T | undefined {
    return Object.values(collection).find(predicate);
  },
  sum<T>(collection: Record<string, T> | T[], selector: (item: T) => number): number {
    return Object.values(collection).reduce((total, item) => total + selector(item), 0);
  },
};

/** Ein Raum ohne Sicht auf irgendetwas: alles Suchen liefert leere Listen. */
function stubRoom(name: string) {
  return {
    name,
    energyAvailable: 300,
    energyCapacityAvailable: 300,
    controller: {
      my: true,
      level: 1,
      progress: 0,
      progressTotal: 200,
      ticksToDowngrade: 20_000,
    },
    storage: undefined,
    terminal: undefined,
    find: () => [],
    lookForAt: () => [],
    createConstructionSite: () => CONSTANTS.OK,
    getPositionAt: (x: number, y: number) => ({ x, y, roomName: name }),
  };
}

const reportedNotifications: string[] = [];
const logged: string[] = [];

/** Baut die gestellte Welt. `roomNames` kommt aus `global.room` des Bundles. */
function makeGame(roomNames: string[]) {
  return {
    time: 1000,
    cpu: {
      limit: 20,
      tickLimit: 500,
      bucket: 10_000,
      getUsed: () => 1.5,
      generatePixel: () => CONSTANTS.OK,
    },
    rooms: Object.fromEntries(roomNames.map(name => [name, stubRoom(name)])),
    creeps: {},
    spawns: {},
    structures: {},
    constructionSites: {},
    flags: {} as Record<string, unknown>,
    market: { getAllOrders: () => [], deal: () => CONSTANTS.OK, incomingTransactions: [] },
    map: { describeExits: () => ({}), getRoomLinearDistance: () => 1 },
    getObjectById: () => null,
    notify: (message: string) => void reportedNotifications.push(message),
  };
}

class RoomVisualStub {
  constructor(public readonly roomName: string) {}
  text(): this {
    return this;
  }
  circle(): this {
    return this;
  }
  rect(): this {
    return this;
  }
  line(): this {
    return this;
  }
  poly(): this {
    return this;
  }
}

/** Prototypen, an die `prototypes/` seine Erweiterungen hängt. */
const PROTOTYPE_HOSTS = {
  Creep: class Creep {},
  Room: class Room {},
  RoomPosition: class RoomPosition {},
  Source: class Source {},
  Structure: class Structure {},
  StructureSpawn: class StructureSpawn {},
  StructureTerminal: class StructureTerminal {},
  StructureTower: class StructureTower {},
  StructureContainer: class StructureContainer {},
  StructureStorage: class StructureStorage {},
  StructureLink: class StructureLink {},
  ConstructionSite: class ConstructionSite {},
  Flag: class Flag {},
};

/**
 * Lädt das Bundle in einem eigenen Kontext.
 *
 * Der Kontext ist ein Proxy: unbekannte globale Bezeichner liefern `0` statt
 * einen `ReferenceError`, und jeder davon wird gemeldet. So bricht der
 * Smoketest nicht an einer Konstante ab, die er nicht kennt — er sagt stattdessen,
 * welche gefehlt hat.
 */
function loadBundle(): {
  loop: () => void;
  sandbox: any;
  /** Zielobjekt des Proxys. Nötig, weil am Proxy jedes `in` wahr ist. */
  base: Record<string, any>;
  faked: Set<string>;
} {
  const source = readFileSync(BUNDLE, "utf8");
  const faked = new Set<string>();

  const base: Record<string, any> = {
    ...CONSTANTS,
    ...PROTOTYPE_HOSTS,
    _: lodash,
    RoomVisual: RoomVisualStub,
    PathFinder: { search: () => ({ path: [], incomplete: true }), CostMatrix: class {} },
    Memory: {},
    console: {
      log: (...args: unknown[]) => void logged.push(args.map(String).join(" ")),
    },
    module: { exports: {} as Record<string, any> },
    exports: {},
    require: (name: string) => {
      throw new Error(`Das Bundle verlangt ein Modul: ${name}`);
    },
  };

  const sandbox: any = new Proxy(base, {
    // `has: () => true` lässt jeden Bezeichner auflösen, verdeckt damit aber auch
    // die Intrinsics des Kontexts (`Reflect`, `JSON`, `Math`, …). Deshalb fällt
    // `get` zuerst auf die echten Built-ins des Hosts zurück und fälscht nur,
    // was es nirgends gibt — das sind dann Screeps-Konstanten.
    has: () => true,
    get(target, key) {
      if (key in target) return target[key as string];
      if (typeof key === "string") {
        if (key in globalThis) return (globalThis as any)[key];
        faked.add(key);
        return 0;
      }
      return undefined;
    },
    set(target, key, value) {
      target[key as string] = value;
      return true;
    },
  });

  base.global = sandbox;
  base.globalThis = sandbox;

  // Die Welt muss stehen, bevor das Bundle lädt: `config.ts` füllt `global.*`
  // per Seiteneffekt, `prototypes/` hängt sich an die Prototypen.
  base.Game = makeGame([]);

  vm.createContext(sandbox);
  new vm.Script(source, { filename: "tsProd/main.js" }).runInContext(sandbox);

  const loop = base.module.exports.loop;
  assert.equal(typeof loop, "function", "das Bundle exportiert kein loop()");

  return { loop, sandbox, base, faked };
}

function smoke(): void {
  const { loop, sandbox, base, faked } = loadBundle();

  // Die Räume der Konfiguration bekommen jetzt ihre (blinden) Raumobjekte.
  const configuredRooms = Object.keys(sandbox.room ?? {});
  assert.ok(configuredRooms.length > 0, "config.ts hat global.room nicht gefüllt");
  sandbox.Game = makeGame(configuredRooms);

  assert.equal(typeof sandbox.prof, "object", "der Profiler hängt nicht an global.prof");

  // Fünf aufeinanderfolgende Ticks: 1000 trifft den Spawncontroller (% 5),
  // 1001 den Verteidigungsscan (% 7), 1002 Pixel (% 3) und Statuslog (% 11).
  const modes = ["off", "light", "full"] as const;
  for (const mode of modes) {
    sandbox.prof[mode === "off" ? "off" : mode === "light" ? "light" : "on"]();

    for (let offset = 0; offset < 5; offset += 1) {
      sandbox.Game.time = 1000 + offset;
      loop();
    }

    const report = sandbox.prof.report();
    assert.equal(typeof report, "string", `prof.report() liefert keinen Text in ${mode}`);
    if (mode !== "off") {
      assert.match(report, /CPU\/Tick/, `Bericht ohne CPU-Zahl in ${mode}`);
    }
  }

  // Der Flaggen-Schalter: eine grüne Flagge muss den Zustand `full` setzen.
  sandbox.prof.off();
  sandbox.Game.flags["prof"] = {
    name: "prof",
    color: CONSTANTS.COLOR_GREEN,
    secondaryColor: CONSTANTS.COLOR_WHITE,
    pos: { x: 25, y: 25, roomName: configuredRooms[0]! },
    setColor(color: number) {
      this.color = color;
      return CONSTANTS.OK;
    },
  };
  sandbox.Game.time += 1;
  loop();
  assert.match(sandbox.prof.status(), /full/, "die grüne Flagge hat nicht auf full geschaltet");
  assert.match(sandbox.prof.status(), /Flagge prof/, "prof.status() nennt die Flagge nicht");

  // Und grau muss sie wieder ausschalten.
  sandbox.Game.flags["prof"].color = CONSTANTS.COLOR_GREY;
  sandbox.Game.time += 1;
  loop();
  assert.match(sandbox.prof.status(), /off/, "die graue Flagge hat nicht ausgeschaltet");

  const errors = logged.filter(line => /error|exception|undefined is not|cannot read/i.test(line));

  console.log(`✅ Smoketest: ${modes.length * 5 + 2} Ticks gelaufen, kein Absturz`);
  console.log(`   Räume aus config.ts: ${configuredRooms.length}`);
  // Namen, die inzwischen existieren, waren nur zu früh gelesen — etwa
  // `global.room`, bevor `config.ts` es gesetzt hat. Das ist keine Lücke.
  const stillMissing = [...faked].filter(name => !(name in base)).sort();
  if (stillMissing.length > 0) {
    // Unschädlich, solange die gestellte Welt ihre Argumente ignoriert:
    // `find()` und `lookForAt()` liefern hier immer eine leere Liste.
    console.log(`   ⚠ unbekannte Screeps-Konstanten mit 0 belegt: ${stillMissing.join(", ")}`);
  }
  if (reportedNotifications.length > 0) {
    console.log(`   ⚠ ${reportedNotifications.length} Meldung(en) über Game.notify:`);
    for (const message of reportedNotifications.slice(0, 5)) {
      console.log(`     - ${message.split("\n")[0]}`);
    }
  }
  assert.equal(errors.length, 0, `Fehlerausgaben im Log:\n${errors.slice(0, 5).join("\n")}`);
  assert.equal(
    reportedNotifications.length,
    0,
    "der Bot hat Fehler gemeldet — siehe Ausgabe darüber",
  );
}

smoke();
