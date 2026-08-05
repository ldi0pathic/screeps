/**
 * Prüft den Linkplaner (`src/controller/link-planner.ts`): wann er nichts tut
 * (fehlende Konfiguration, fehlende Sicht, Controller unter RCL5, keine freien
 * Linkplätze, zehn Baustellen), welchen der beiden Empfängerlinks er zuerst
 * plant, und wie die Platzwahl arbeitet (Reichweite, Bewertung nach
 * Entfernungssumme, Standplatz des Linkkeepers, Wand/Bauwerk/Straße).
 *
 * Die gestellte Welt ist absichtlich klein gehalten: ein Raum, wenige gesetzte
 * Felder (Wände über `walls`, Bauwerke über `blockingStructures`/`links`/
 * `roads`), alles andere frei. `buildWorld()` baut daraus `Game.rooms[...]`
 * und `bot.room[...]` neu auf; jeder Test ruft sie einmal auf.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { captureConsole, game, installGlobals, resetWorld } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

interface Vec2 {
  x: number;
  y: number;
}

interface StructureStub {
  pos: any;
  structureType: string;
}

interface SourceStub {
  pos: any;
}

let worldStructures: StructureStub[] = [];
let worldSites: StructureStub[] = [];
let worldSources: SourceStub[] = [];
let wallCells: Set<string> = new Set();
let createdSites: Array<{ x: number; y: number; roomName: string; structureType: string }> = [];

let installed = false;

/** Legt `RoomPosition` als globale Klasse an (einmalig, wie in `movement-stubs.ts`). */
function installLinkPlannerWorld(): void {
  installGlobals();
  if (installed) return;
  installed = true;

  anyGlobal.RoomPosition = class RoomPositionStub {
    constructor(
      public x: number,
      public y: number,
      public roomName: string,
    ) {}

    /** Chebyshev-Abstand, wie ihn die Screeps-API für Reichweiten verwendet. */
    getRangeTo(other: Vec2): number {
      return Math.max(Math.abs(this.x - other.x), Math.abs(this.y - other.y));
    }

    isNearTo(other: Vec2): boolean {
      return this.getRangeTo(other) <= 1;
    }

    lookFor(type: string): StructureStub[] {
      if (type === LOOK_STRUCTURES) {
        return worldStructures.filter(s => s.pos.x === this.x && s.pos.y === this.y && s.pos.roomName === this.roomName);
      }
      if (type === LOOK_CONSTRUCTION_SITES) {
        return worldSites.filter(s => s.pos.x === this.x && s.pos.y === this.y && s.pos.roomName === this.roomName);
      }
      return [];
    }

    createConstructionSite(structureType: string): number {
      createdSites.push({ x: this.x, y: this.y, roomName: this.roomName, structureType });
      return OK;
    }
  };
}

function pos(x: number, y: number, roomName = ROOM): any {
  return new anyGlobal.RoomPosition(x, y, roomName);
}

/** Leert die gestellte Welt, ohne `Game`/`Memory` zu ersetzen (siehe `screeps-stubs.ts`). */
function resetPlannerWorld(): void {
  resetWorld();

  const rooms = game().rooms;
  for (const key of Object.keys(rooms)) delete rooms[key];

  worldStructures = [];
  worldSites = [];
  worldSources = [];
  wallCells = new Set();
  createdSites = [];
}

interface ControllerSpec {
  pos: Vec2;
  level?: number;
  my?: boolean;
}

interface WorldSpec {
  controller?: ControllerSpec | null;
  storagePos?: Vec2 | null;
  walls?: Vec2[];
  links?: Vec2[];
  linkSites?: Vec2[];
  otherSites?: Array<Vec2 & { structureType?: string }>;
  blockingStructures?: Array<Vec2 & { structureType: string }>;
  roads?: Vec2[];
  sources?: Vec2[];
  useLinks?: boolean;
  hasConfig?: boolean;
  hasSight?: boolean;
}

/** Baut aus einer knappen Beschreibung `Game.rooms[ROOM]` und `bot.room[ROOM]` neu auf. */
function buildWorld(spec: WorldSpec): void {
  installLinkPlannerWorld();
  resetPlannerWorld();

  for (const w of spec.walls ?? []) wallCells.add(`${w.x},${w.y}`);

  for (const l of spec.links ?? []) worldStructures.push({ pos: pos(l.x, l.y), structureType: STRUCTURE_LINK });
  for (const b of spec.blockingStructures ?? []) worldStructures.push({ pos: pos(b.x, b.y), structureType: b.structureType });
  for (const r of spec.roads ?? []) worldStructures.push({ pos: pos(r.x, r.y), structureType: STRUCTURE_ROAD });

  for (const s of spec.linkSites ?? []) worldSites.push({ pos: pos(s.x, s.y), structureType: STRUCTURE_LINK });
  for (const o of spec.otherSites ?? []) worldSites.push({ pos: pos(o.x, o.y), structureType: o.structureType ?? STRUCTURE_ROAD });

  for (const src of spec.sources ?? []) worldSources.push({ pos: pos(src.x, src.y) });

  const controller = spec.controller
    ? {
        my: spec.controller.my ?? true,
        level: spec.controller.level ?? 5,
        pos: pos(spec.controller.pos.x, spec.controller.pos.y),
      }
    : undefined;

  const storage = spec.storagePos ? { pos: pos(spec.storagePos.x, spec.storagePos.y) } : undefined;
  if (storage) worldStructures.push({ pos: storage.pos, structureType: STRUCTURE_STORAGE });

  const room = {
    name: ROOM,
    controller,
    storage,
    find(type: number, opts?: { filter?: (s: any) => boolean }): any[] {
      let items: any[];
      if (type === FIND_MY_STRUCTURES) items = worldStructures;
      else if (type === FIND_CONSTRUCTION_SITES) items = worldSites;
      else if (type === FIND_SOURCES) items = worldSources;
      else items = [];

      return opts?.filter ? items.filter(opts.filter) : items.slice();
    },
    getTerrain() {
      return {
        get(x: number, y: number): number {
          return wallCells.has(`${x},${y}`) ? TERRAIN_MASK_WALL : 0;
        },
      };
    },
  };

  if (spec.hasSight ?? true) game().rooms[ROOM] = room;

  if (spec.hasConfig ?? true) {
    anyGlobal.room[ROOM] = { room: ROOM, spawnRoom: ROOM, useLinks: spec.useLinks ?? true };
  }
}

/** Alle Felder mit Chebyshev-Abstand `range` genau zu (`cx`,`cy`) – Vorbild für die gestellten Wände. */
function ringCells(cx: number, cy: number, range: number): Vec2[] {
  const cells: Vec2[] = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== range) continue;
      cells.push({ x: cx + dx, y: cy + dy });
    }
  }
  return cells;
}

async function loadPlanner(): Promise<typeof import("../src/controller/link-planner")> {
  installLinkPlannerWorld();
  return await import("../src/controller/link-planner");
}

/** Ruft `plan()` auf und fängt dabei `console.log` ab – `restore()` läuft in jedem Pfad. */
function runPlan(planner: { plan(): boolean }): boolean {
  const output = captureConsole();
  try {
    return planner.plan();
  } finally {
    output.restore();
  }
}

test("ohne Konfiguration für den Raum unternimmt der Planer nichts", async () => {
  const { LinkPlanner } = await loadPlanner();

  buildWorld({ hasConfig: false, controller: { pos: { x: 10, y: 10 }, level: 5 } });

  assert.equal(runPlan(new LinkPlanner(ROOM)), false);
  assert.equal(createdSites.length, 0);
});

test("mit Konfiguration aber ohne useLinks unternimmt der Planer nichts", async () => {
  const { LinkPlanner } = await loadPlanner();

  buildWorld({ useLinks: false, controller: { pos: { x: 10, y: 10 }, level: 5 } });

  assert.equal(runPlan(new LinkPlanner(ROOM)), false);
  assert.equal(createdSites.length, 0);
});

test("ohne Sicht auf den Raum unternimmt der Planer nichts", async () => {
  const { LinkPlanner } = await loadPlanner();

  buildWorld({ hasSight: false, controller: { pos: { x: 10, y: 10 }, level: 5 } });

  assert.equal(runPlan(new LinkPlanner(ROOM)), false);
  assert.equal(createdSites.length, 0);
});

test("ohne eigenen Controller ab RCL5 unternimmt der Planer nichts", async () => {
  const { LinkPlanner } = await loadPlanner();

  // Kein Controller im Raum.
  buildWorld({ controller: null });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "kein Controller");
  assert.equal(createdSites.length, 0);

  // Controller gehört nicht uns.
  buildWorld({ controller: { pos: { x: 10, y: 10 }, my: false, level: 5 } });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "fremder Controller");
  assert.equal(createdSites.length, 0);

  // Controller liegt unterhalb RCL5.
  buildWorld({ controller: { pos: { x: 10, y: 10 }, level: 4 } });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "RCL unter 5");
  assert.equal(createdSites.length, 0);
});

test("ohne freie Linkplätze bei RCL5 unternimmt der Planer nichts", async () => {
  const { LinkPlanner } = await loadPlanner();

  // Bei RCL5 sind zwei Links erlaubt; zwei fertige Links füllen beide Plätze.
  buildWorld({
    controller: { pos: { x: 10, y: 10 }, level: 5 },
    links: [
      { x: 30, y: 30 },
      { x: 32, y: 32 },
    ],
  });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "zwei fertige Links");
  assert.equal(createdSites.length, 0);

  // Ein Link und eine Linkbaustelle füllen die Plätze ebenso.
  buildWorld({
    controller: { pos: { x: 10, y: 10 }, level: 5 },
    links: [{ x: 30, y: 30 }],
    linkSites: [{ x: 32, y: 32 }],
  });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "ein Link und eine Linkbaustelle");
  assert.equal(createdSites.length, 0);
});

test("bei zehn vorhandenen Baustellen unternimmt der Planer nichts", async () => {
  const { LinkPlanner } = await loadPlanner();

  const otherSites = Array.from({ length: 10 }, (_unused, index) => ({
    x: 5 + index,
    y: 5,
    structureType: STRUCTURE_ROAD,
  }));

  buildWorld({ controller: { pos: { x: 20, y: 20 }, level: 5 }, otherSites });

  assert.equal(runPlan(new LinkPlanner(ROOM)), false);
  assert.equal(createdSites.length, 0);
});

test("fehlen beide Links, plant der Planer zuerst den Controller-Link und nur eine Baustelle", async () => {
  const { LinkPlanner } = await loadPlanner();

  buildWorld({
    controller: { pos: { x: 20, y: 20 }, level: 5 },
    storagePos: { x: 30, y: 30 },
  });

  const result = runPlan(new LinkPlanner(ROOM));

  assert.equal(result, true);
  assert.equal(createdSites.length, 1, "nur eine Baustelle je Aufruf");
  assert.equal(createdSites[0]!.structureType, STRUCTURE_LINK);
  // Voll offener Raum: der erste Kandidat auf Reichweite 2 gewinnt (18,18).
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [18, 18]);
});

test("steht der Controller-Link schon, wird der Storage-Link geplant", async () => {
  const { LinkPlanner } = await loadPlanner();

  buildWorld({
    controller: { pos: { x: 20, y: 20 }, level: 5 },
    storagePos: { x: 30, y: 30 },
    links: [{ x: 20, y: 22 }], // Reichweite 2 zum Controller, zählt als Controller-Link
  });

  const result = runPlan(new LinkPlanner(ROOM));

  assert.equal(result, true);
  assert.equal(createdSites.length, 1);
  // Voll offener Raum: der erste Kandidat um den Storage gewinnt (28,28).
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [28, 28]);
});

test("stehen beide Links schon, passiert nichts mehr", async () => {
  const { LinkPlanner } = await loadPlanner();

  // RCL6 erlaubt drei Links, ein Platz bliebe frei – trotzdem baut der Planer
  // nichts, weil beide Empfängerlinks schon existieren.
  buildWorld({
    controller: { pos: { x: 20, y: 20 }, level: 6 },
    storagePos: { x: 30, y: 30 },
    links: [
      { x: 20, y: 22 },
      { x: 30, y: 29 },
    ],
  });

  assert.equal(runPlan(new LinkPlanner(ROOM)), false);
  assert.equal(createdSites.length, 0);
});

test("eine Linkbaustelle zählt wie ein fertiger Link", async () => {
  const { LinkPlanner } = await loadPlanner();

  // Baustelle beim Controller verhindert eine zweite.
  buildWorld({
    controller: { pos: { x: 20, y: 20 }, level: 5 },
    linkSites: [{ x: 20, y: 22 }],
  });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "Controller-Linkbaustelle zählt");
  assert.equal(createdSites.length, 0);

  // Baustelle beim Storage verhindert eine zweite; der Controller-Link ist fertig.
  buildWorld({
    controller: { pos: { x: 20, y: 20 }, level: 6 },
    storagePos: { x: 30, y: 30 },
    links: [{ x: 20, y: 22 }],
    linkSites: [{ x: 30, y: 29 }],
  });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "Storage-Linkbaustelle zählt");
  assert.equal(createdSites.length, 0);
});

test("ohne Storage wird kein Storage-Link geplant", async () => {
  const { LinkPlanner } = await loadPlanner();

  // Ohne Storage wird trotzdem der Controller-Link geplant.
  buildWorld({ controller: { pos: { x: 20, y: 20 }, level: 5 } });
  assert.equal(runPlan(new LinkPlanner(ROOM)), true, "Controller-Link entsteht auch ohne Storage");
  assert.equal(createdSites.length, 1);

  // Steht der Controller-Link schon, passiert ohne Storage nichts mehr.
  buildWorld({
    controller: { pos: { x: 20, y: 20 }, level: 5 },
    links: [{ x: 20, y: 22 }],
  });
  assert.equal(runPlan(new LinkPlanner(ROOM)), false, "kein Storage vorhanden");
  assert.equal(createdSites.length, 0);
});

test("der Controller-Link landet auf Reichweite 2, wenn dort ein freies Feld ist", async () => {
  const { LinkPlanner } = await loadPlanner();

  const controllerPos = { x: 10, y: 10 };
  const freeCell = { x: 12, y: 10 };
  const walls = ringCells(controllerPos.x, controllerPos.y, 2).filter(
    c => !(c.x === freeCell.x && c.y === freeCell.y),
  );

  buildWorld({ controller: { pos: controllerPos, level: 5 }, walls });

  assert.equal(runPlan(new LinkPlanner(ROOM)), true);
  assert.equal(createdSites.length, 1);
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [freeCell.x, freeCell.y]);
});

test("sind alle Felder auf Reichweite 2 blockiert, weicht die Wahl auf Reichweite 3 aus", async () => {
  const { LinkPlanner } = await loadPlanner();

  const controllerPos = { x: 10, y: 10 };
  const freeCell = { x: 13, y: 10 };
  const walls = [
    ...ringCells(controllerPos.x, controllerPos.y, 2),
    ...ringCells(controllerPos.x, controllerPos.y, 3).filter(c => !(c.x === freeCell.x && c.y === freeCell.y)),
  ];

  buildWorld({ controller: { pos: controllerPos, level: 5 }, walls });

  assert.equal(runPlan(new LinkPlanner(ROOM)), true);
  assert.equal(createdSites.length, 1);
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [freeCell.x, freeCell.y]);
});

test("sind auch Felder auf Reichweite 3 blockiert, weicht die Wahl auf Reichweite 1 aus", async () => {
  const { LinkPlanner } = await loadPlanner();

  const controllerPos = { x: 10, y: 10 };
  const freeCell = { x: 11, y: 10 };
  const walls = [
    ...ringCells(controllerPos.x, controllerPos.y, 2),
    ...ringCells(controllerPos.x, controllerPos.y, 3),
    ...ringCells(controllerPos.x, controllerPos.y, 1).filter(c => !(c.x === freeCell.x && c.y === freeCell.y)),
  ];

  buildWorld({ controller: { pos: controllerPos, level: 5 }, walls });

  assert.equal(runPlan(new LinkPlanner(ROOM)), true);
  assert.equal(createdSites.length, 1);
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [freeCell.x, freeCell.y]);
});

test("bei mehreren Kandidaten gewinnt die kleinste Entfernungssumme zu den sendenden Links", async () => {
  const { LinkPlanner } = await loadPlanner();

  const controllerPos = { x: 10, y: 10 };
  const candidateA = { x: 12, y: 10 }; // näher am sendenden Link
  const candidateB = { x: 8, y: 10 }; // weiter weg

  // Nur diese zwei Felder auf Reichweite 2 bleiben frei, der Rest ist Wand.
  const walls = ringCells(controllerPos.x, controllerPos.y, 2).filter(
    c => !(c.x === candidateA.x && c.y === candidateA.y) && !(c.x === candidateB.x && c.y === candidateB.y),
  );

  // Ein sendender Link weit auf der Seite von candidateA (weit genug weg vom
  // Controller, um nicht selbst als Empfänger-Link zu zählen).
  buildWorld({
    controller: { pos: controllerPos, level: 5 },
    walls,
    links: [{ x: 40, y: 10 }],
  });

  assert.equal(runPlan(new LinkPlanner(ROOM)), true);
  assert.equal(createdSites.length, 1);
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [candidateA.x, candidateA.y]);
});

test("ohne sendende Links dienen die Quellen als Bezug", async () => {
  const { LinkPlanner } = await loadPlanner();

  const controllerPos = { x: 10, y: 10 };
  const candidateA = { x: 12, y: 10 };
  const candidateB = { x: 8, y: 10 }; // näher an der Quelle

  const walls = ringCells(controllerPos.x, controllerPos.y, 2).filter(
    c => !(c.x === candidateA.x && c.y === candidateA.y) && !(c.x === candidateB.x && c.y === candidateB.y),
  );

  buildWorld({
    controller: { pos: controllerPos, level: 5 },
    walls,
    sources: [{ x: 8, y: 11 }],
  });

  assert.equal(runPlan(new LinkPlanner(ROOM)), true);
  assert.equal(createdSites.length, 1);
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [candidateB.x, candidateB.y]);
});

test("der Storage-Link braucht einen Standplatz für den Linkkeeper", async () => {
  const { LinkPlanner } = await loadPlanner();

  const storagePos = { x: 30, y: 30 };
  const controllerPos = { x: 5, y: 5 };
  const goodCell = { x: 28, y: 30 }; // das einzige gültige Feld
  const enablerCell = { x: 29, y: 30 }; // ermöglicht den Standplatz für goodCell, ist selbst keiner
  const disqualified = { x: 32, y: 29 }; // frei, aber ohne Standplatz für den Linkkeeper

  const freeCells = [storagePos, goodCell, enablerCell, disqualified];
  const walls: Vec2[] = [];
  for (let x = storagePos.x - 2; x <= storagePos.x + 2; x++) {
    for (let y = storagePos.y - 2; y <= storagePos.y + 2; y++) {
      if (freeCells.some(c => c.x === x && c.y === y)) continue;
      walls.push({ x, y });
    }
  }

  buildWorld({
    controller: { pos: controllerPos, level: 5 },
    storagePos,
    walls,
    links: [{ x: controllerPos.x, y: controllerPos.y + 2 }], // Controller-Link steht schon
  });

  const result = runPlan(new LinkPlanner(ROOM));

  assert.equal(result, true);
  assert.equal(createdSites.length, 1);
  assert.deepEqual(
    [createdSites[0]!.x, createdSites[0]!.y],
    [goodCell.x, goodCell.y],
    "das erreichbare, aber postlose Feld scheidet aus",
  );
});

test("Wandfelder und blockierende Bauwerke scheiden aus, eine Straße aber nicht", async () => {
  const { LinkPlanner } = await loadPlanner();

  const controllerPos = { x: 10, y: 10 };
  const roadCell = { x: 12, y: 10 };
  const spawnCell = { x: 10, y: 8 };
  const extensionCell = { x: 8, y: 10 };

  const openCells = [roadCell, spawnCell, extensionCell];
  const walls = ringCells(controllerPos.x, controllerPos.y, 2).filter(
    c => !openCells.some(o => o.x === c.x && o.y === c.y),
  );

  buildWorld({
    controller: { pos: controllerPos, level: 5 },
    walls,
    roads: [roadCell],
    blockingStructures: [
      { x: spawnCell.x, y: spawnCell.y, structureType: STRUCTURE_SPAWN },
      { x: extensionCell.x, y: extensionCell.y, structureType: STRUCTURE_EXTENSION },
    ],
  });

  assert.equal(runPlan(new LinkPlanner(ROOM)), true);
  assert.equal(createdSites.length, 1);
  assert.deepEqual([createdSites[0]!.x, createdSites[0]!.y], [roadCell.x, roadCell.y]);
});
