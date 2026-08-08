// Build: 2026-08-08 14:37:22 +02:00
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  loop: () => loop
});
module.exports = __toCommonJS(main_exports);

// src/globals.ts
var bot = global;

// src/config.ts
var isString = (value) => typeof value === "string";
bot.room = bot.room || {};
bot.prio = bot.prio || {};
bot.const = bot.const || {};
bot.const = {
  maxRepairs: 5,
  logroom: "",
  //E59N3',//'E56N2'//'E59N4',
  showPaths: false
};
bot.transfer = {
  /*E59N7:
    {
       room: 'E59N7',
       source: [
       //  'E59N9',
          'E58N7',
          'E58N6',
       ]
    },
    E56N2:
    {
       room: 'E56N2',
       source: [
          'E59N4',
          'E58N6',
          'E58N7',
       ]
    },
    E59N3:
    {
       room: 'E59N3',
       source: [
          'E59N4',
  
       ]
    },
   */
};
bot.room = {
  E57N6: {
    room: "E57N6",
    spawnRoom: "E58N6",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,
    //mining
    debitorAsFreelancer: 0,
    energySources: ["5bbcb07b9099fc012e63c406"],
    mineralSources: [],
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    //controller
    upgrader: 0
  },
  E58N5: {
    room: "E58N5",
    spawnRoom: "E58N6",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,
    //mining
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c593"],
    mineralSources: [],
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    destroy: ["63542d26da5582631af71fcc", "6255d32e5fdb145fecd7d923"],
    //controller
    upgrader: 0
  },
  E58N6: {
    room: "E58N6",
    spawnRoom: "E58N6",
    sendMiner: true,
    sendDebitor: true,
    minHostile: 2,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorAsFreelancer: 1,
    energySources: ["5bbcb08d9099fc012e63c58f", "5bbcb08d9099fc012e63c590"],
    mineralSources: ["5bbcb72cd867df5e54207db1"],
    //structures
    repairer: 0,
    maxwallRepairer: 1,
    maxbuilder: 1,
    prioBuildings: [],
    //controller
    upgrader: 1
  },
  E58N7: {
    room: "E58N7",
    spawnRoom: "E58N7",
    sendMiner: true,
    sendDebitor: true,
    minHostile: 2,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorAsFreelancer: 1,
    energySources: ["5bbcb08d9099fc012e63c58c", "5bbcb08d9099fc012e63c58a"],
    mineralSources: ["5bbcb72cd867df5e54207db0"],
    mineralContainerId: "658f0b73615ae9c2e4995fb6",
    //structures
    repairer: 0,
    maxwallRepairer: 1,
    maxbuilder: 2,
    prioBuildings: [],
    //controller
    upgrader: 1
  },
  E58N8: {
    room: "E58N8",
    spawnRoom: "E59N9",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,
    //mining
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c588"],
    mineralSources: [],
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    //controller
    upgrader: 0
  },
  E59N3: {
    room: "E59N3",
    spawnRoom: "E59N3",
    transferEnergie: true,
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorAsFreelancer: 1,
    energySources: ["5bbcb09f9099fc012e63c71f", "5bbcb09f9099fc012e63c71d"],
    mineralSources: ["5bbcb73ad867df5e54207e20"],
    mineralContainerId: null,
    //structures
    repairer: 0,
    maxwallRepairer: 2,
    maxbuilder: 2,
    prioBuildings: [],
    //controller
    upgrader: 2
  },
  E59N7: {
    room: "E59N7",
    spawnRoom: "E58N7",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: false,
    sendDefender: true,
    sendClaimer: true,
    //mining
    debitorAsFreelancer: 0,
    energySources: ["5bbcb09e9099fc012e63c711"],
    mineralSources: ["5bbcb739d867df5e54207e1c"],
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    //controller
    upgrader: 0
  },
  E59N8: {
    room: "E59N8",
    spawnRoom: "E59N9",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,
    //mining
    debitorAsFreelancer: 0,
    energySources: ["5bbcb09e9099fc012e63c70e"],
    mineralSources: [],
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: ["64faa4011ae98a0ce014fda8", "64fb3dc4b140246d9bd1f0dd"],
    //controller
    upgrader: 0
  },
  E59N9: {
    room: "E59N9",
    spawnRoom: "E59N9",
    sendMiner: true,
    sendDebitor: true,
    minHostile: 2,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorAsFreelancer: 1,
    energySources: ["5bbcb09e9099fc012e63c70a", "5bbcb09e9099fc012e63c70b"],
    mineralSources: ["5bbcb739d867df5e54207e1a"],
    //structures
    repairer: 0,
    maxwallRepairer: 1,
    maxbuilder: 3,
    prioBuildings: [],
    //controller
    upgrader: 1
  }
};
bot.prio = {
  build: {
    [STRUCTURE_RAMPART]: 3,
    [STRUCTURE_WALL]: 3,
    [STRUCTURE_EXTENSION]: 1,
    [STRUCTURE_SPAWN]: 1,
    [STRUCTURE_TOWER]: 2,
    [STRUCTURE_CONTAINER]: 3,
    [STRUCTURE_LINK]: 1,
    [STRUCTURE_STORAGE]: 1,
    [STRUCTURE_LAB]: 4,
    [STRUCTURE_ROAD]: 5
  },
  repair: {
    // Ramparts zerfallen dauerhaft (300 Hits je 100 Ticks) und schützen die
    // Strukturen darunter; Walls zerfallen überhaupt nicht. Deshalb steht der
    // Rampart vor der Wall — vorher war er mit 7 die schlechteste Priorität,
    // schlechter noch als die Straße.
    [STRUCTURE_RAMPART]: 1,
    [STRUCTURE_WALL]: 2,
    [STRUCTURE_EXTENSION]: 2,
    [STRUCTURE_SPAWN]: 2,
    [STRUCTURE_TOWER]: 3,
    [STRUCTURE_STORAGE]: 4,
    [STRUCTURE_CONTAINER]: 5,
    [STRUCTURE_ROAD]: 6
  },
  hits: {
    [STRUCTURE_TOWER]: 0.75,
    [STRUCTURE_STORAGE]: 0.75,
    [STRUCTURE_CONTAINER]: 0.75,
    [STRUCTURE_WALL]: 5e-4,
    [STRUCTURE_RAMPART]: 1e-3,
    [STRUCTURE_ROAD]: 0.75
  }
};
bot.log = function(bool, msg) {
  if (bool && isString(msg)) {
    console.log(msg);
  } else if (bool) {
    console.log(JSON.stringify(msg));
  }
};
bot.logWorkroom = function(room, msg) {
  bot.log(bot.const.logroom == room, "[" + room + "] " + msg);
};

// src/controller/memory.ts
var botGlobal = global;
var botMemory = Memory;
function ensureRoomMemory(roomName) {
  var _a, _b;
  return (_b = (_a = botMemory.rooms)[roomName]) != null ? _b : _a[roomName] = {};
}
function init() {
  var _a, _b, _c;
  (_a = botMemory.terminals) != null ? _a : botMemory.terminals = [];
  if (botMemory.init) {
    return;
  }
  (_b = botMemory.rooms) != null ? _b : botMemory.rooms = {};
  for (const name in botGlobal.room) {
    const roomMemory2 = ensureRoomMemory(name);
    roomMemory2.aktivPrioSpawn = Boolean(roomMemory2.aktivPrioSpawn);
    roomMemory2.hasLinks = Boolean(roomMemory2.hasLinks);
    roomMemory2.needDefence = Boolean(roomMemory2.needDefence);
    roomMemory2.invaderCore = Boolean(roomMemory2.invaderCore);
    roomMemory2.nuke = Boolean(roomMemory2.nuke);
    (_c = roomMemory2.aktivPrioSpawnCount) != null ? _c : roomMemory2.aktivPrioSpawnCount = 0;
    botMemory.init = true;
  }
}
function clear() {
  if (!botMemory.rooms) {
    return;
  }
  for (const name in botMemory.rooms) {
    const config = botGlobal.room[name];
    if (!config) {
      delete botMemory.rooms[name];
      continue;
    }
    const roomMemory2 = botMemory.rooms[name];
    if (!config.saveRoads && (roomMemory2 == null ? void 0 : roomMemory2.roads)) {
      delete roomMemory2.roads;
    }
  }
}
function writeStatus() {
  let message = "";
  for (const room in botMemory.rooms) {
    const roomMemory2 = botMemory.rooms[room];
    if (roomMemory2 == null ? void 0 : roomMemory2.aktivPrioSpawn) message += `PrioSpawn im Raum ${room}
`;
    if (roomMemory2 == null ? void 0 : roomMemory2.needDefence) message += `Angriff im Raum ${room}
`;
    if (roomMemory2 == null ? void 0 : roomMemory2.invaderCore) message += `Core im Raum ${room}
`;
  }
  if (message) console.log(message);
}
function forEachManagedRoom(onlyRoom, visit) {
  for (const name in botGlobal.room) {
    if (onlyRoom && name !== onlyRoom) continue;
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    visit(name, config, room);
  }
}
function collectStructureIds(room, filter) {
  return room.find(FIND_STRUCTURES, { filter }).map((structure) => structure.id);
}
function findAndSaveRoomWalls(onlyRoom) {
  var _a;
  (_a = botMemory.rooms) != null ? _a : botMemory.rooms = {};
  forEachManagedRoom(onlyRoom, (name, config, room) => {
    if (config.maxwallRepairer < 1) return;
    ensureRoomMemory(name).wally = collectStructureIds(
      room,
      (structure) => structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART
    );
  });
}
function findAndSaveRoomContainer(onlyRoom) {
  var _a;
  (_a = botMemory.rooms) != null ? _a : botMemory.rooms = {};
  forEachManagedRoom(onlyRoom, (name, _config, room) => {
    ensureRoomMemory(name).container = collectStructureIds(
      room,
      (structure) => structure.structureType === STRUCTURE_CONTAINER
    );
  });
}
function findAndSaveRoomTower(onlyRoom) {
  var _a;
  (_a = botMemory.rooms) != null ? _a : botMemory.rooms = {};
  forEachManagedRoom(onlyRoom, (name, _config, room) => {
    ensureRoomMemory(name).tower = collectStructureIds(
      room,
      (structure) => structure.structureType === STRUCTURE_TOWER
    );
  });
}
function findAndSaveTerminals() {
  botMemory.terminals = [];
  forEachManagedRoom(void 0, (_name, _config, room) => {
    const terminal = room.find(FIND_STRUCTURES, {
      filter: { structureType: STRUCTURE_TERMINAL }
    })[0];
    if (terminal) botMemory.terminals.push(terminal.id);
  });
}

// src/controller/cleanup.ts
var FLAG_NAME = "cleanup";
var cleanupMemory = Memory;
function rememberedColor() {
  var _a;
  return (_a = cleanupMemory.cleanup) == null ? void 0 : _a.flagColor;
}
function remember(color) {
  var _a;
  if (color === void 0) {
    delete cleanupMemory.cleanup;
    return;
  }
  (_a = cleanupMemory.cleanup) != null ? _a : cleanupMemory.cleanup = {};
  cleanupMemory.cleanup.flagColor = color;
}
function orphanedRooms() {
  const rooms = cleanupMemory.rooms;
  if (!rooms) return [];
  return Object.keys(rooms).filter((name) => !bot.room[name]);
}
function isAffected(creep) {
  const workroom = creep.memory.workroom;
  const home = creep.memory.home;
  if (!workroom || !home) return true;
  return !bot.room[workroom] || !bot.room[home];
}
function affectedCreeps() {
  return Object.values(Game.creeps).filter(isAffected);
}
function hasNothingToDo(orphaned, creeps) {
  return orphaned.length === 0 && creeps.length === 0;
}
function report() {
  const orphaned = orphanedRooms();
  const creeps = affectedCreeps();
  if (hasNothingToDo(orphaned, creeps)) {
    console.log("[cleanup] Nichts zu tun: keine verwaisten Raeume, keine betroffenen Creeps.");
    return;
  }
  if (orphaned.length > 0) {
    console.log(`[cleanup] Raum-Memory ohne Config: ${orphaned.join(", ")}`);
  }
  console.log(`[cleanup] Creeps davon betroffen: ${creeps.length}`);
  for (const creep of creeps) {
    console.log(`  ${creep.name} (workroom ${creep.memory.workroom}, home ${creep.memory.home})`);
  }
  console.log("[cleanup] Nichts geaendert. Rot = ausfuehren.");
}
function execute() {
  const orphaned = orphanedRooms();
  const creeps = affectedCreeps();
  clear();
  let killed = 0;
  for (const creep of creeps) {
    const result = creep.suicide();
    if (result === OK) {
      killed += 1;
    } else {
      console.log(`[cleanup] suicide fehlgeschlagen fuer ${creep.name}: ${result}`);
    }
  }
  if (hasNothingToDo(orphaned, creeps)) {
    console.log("[cleanup] Nichts zu tun, Flagge entfernt.");
    return;
  }
  const rooms = orphaned.length > 0 ? orphaned.join(", ") : "keine Raeume";
  console.log(`[cleanup] ${rooms} geloescht, ${killed} Creeps suizidiert.`);
}
function reportUnknownColor() {
  console.log(
    `[cleanup] Flagge "${FLAG_NAME}": diese Farbe ist nicht belegt. Belegt sind gelb=Bericht, rot=ausfuehren.`
  );
}
function check() {
  const flag = Game.flags[FLAG_NAME];
  if (!flag) {
    if (rememberedColor() !== void 0) {
      remember(void 0);
    }
    return;
  }
  const previous = rememberedColor();
  if (flag.color === previous) return;
  if (flag.color === COLOR_YELLOW) {
    remember(flag.color);
    report();
    return;
  }
  if (flag.color === COLOR_RED) {
    execute();
    const removed = flag.remove();
    if (removed === OK) {
      remember(void 0);
    } else {
      remember(flag.color);
      console.log(`[cleanup] Flagge "${FLAG_NAME}" konnte nicht entfernt werden: ${removed}`);
    }
    return;
  }
  remember(flag.color);
  reportUnknownColor();
}

// src/controller/cpu-budget.ts
var LOW_TIER_BUCKET = 2e3;
var NORMAL_TIER_BUCKET = 500;
var LOG_INTERVAL = 100;
var lastReport = {};
function report2(tier, reason) {
  const last = lastReport[tier];
  if (last !== void 0 && Game.time - last < LOG_INTERVAL) return;
  lastReport[tier] = Game.time;
  console.log(`[cpu] Stufe "${tier}" ausgelassen: ${reason}`);
}
function mayRunLow() {
  const bucket = Game.cpu.bucket;
  if (bucket >= LOW_TIER_BUCKET) return true;
  const used = Game.cpu.getUsed();
  if (used <= Game.cpu.limit) return true;
  report2("niedrig", `Bucket ${Math.round(bucket)}, im Tick schon ${used.toFixed(1)} von ${Game.cpu.limit}`);
  return false;
}
function mayRunNormal() {
  const bucket = Game.cpu.bucket;
  if (bucket >= NORMAL_TIER_BUCKET) return true;
  report2("normal", `Bucket ${Math.round(bucket)} unter ${NORMAL_TIER_BUCKET}`);
  return false;
}

// src/profiler/types.ts
var WINDOW_TICKS = 100;
var DEFAULT_DETAIL_TICKS = 50;
var SECTION = {
  /** Raum-Visuals und Memory-Init, erste Schleife in `main.ts::loop`. */
  rooms: "rooms",
  /** Creep-Schleife gesamt, zweite Schleife in `main.ts::loop`. */
  creeps: "creeps",
  /** `controller/timing.ts::controll` gesamt. */
  timing: "timing",
  /** Türme, `defence.tower()`. */
  tower: "timing.tower",
  /** Terminal und Markt. */
  terminal: "timing.terminal",
  /** Pixelgenerierung. */
  pixel: "timing.pixel",
  /** Spawncontroller, `spawn.spawn()`. */
  spawn: "timing.spawn",
  /** Verteidigungsscan, `defence.check()`. */
  defence: "timing.defence",
  /** Statuslog, `memory.writeStatus()`. */
  status: "timing.status",
  /** Linknetz, `links.sendAll()`. */
  links: "timing.links",
  /** Tagessequenz, `daylie()`. */
  daily: "timing.daily",
  /**
   * Straßenwiederaufbau, `rebuild.rebuildRoads()`. Eigener Abschnitt, obwohl
   * der Aufruf innerhalb von `daylie()` steht: die Tagessequenz läuft nur alle
   * 28 800 Ticks, ihr Sammelwert `timing.daily` ist in einem üblichen Messfenster
   * deshalb null und verrät nichts über die Kosten des Planers.
   */
  roads: "timing.roads",
  /** Linkplaner, `link-planner.planReceiverLinks()`. Eigener Abschnitt aus demselben Grund wie `roads`. */
  linkplan: "timing.linkplan"
};

// src/profiler/flag.ts
var FLAG_NAME2 = "prof";
var SWITCH_COLORS = [
  { color: COLOR_GREY, request: "off", label: "grau", meaning: "aus", css: "#b4b4b4" },
  { color: COLOR_WHITE, request: "light", label: "wei\xDF", meaning: "light", css: "#ffffff" },
  { color: COLOR_GREEN, request: "full", label: "gr\xFCn", meaning: "full", css: "#00ff00" },
  {
    color: COLOR_RED,
    request: "detail",
    label: "rot",
    meaning: `Detail ${DEFAULT_DETAIL_TICKS}T`,
    css: "#ff3030"
  }
];
function bySwitchColor(color) {
  return SWITCH_COLORS.find((entry) => entry.color === color);
}
function byRequest(request) {
  return SWITCH_COLORS.find((entry) => entry.request === request);
}
function statusLine(data) {
  const window = data.ticks === 0 ? "noch keine Messung" : `Fenster ${data.ticks}T | CPU/Tick ${data.cpuPerTick.toFixed(2)}`;
  return data.detailRemaining > 0 ? `${window} | Detail noch ${data.detailRemaining}T` : window;
}
function isActive(entry, data) {
  if (entry.request === "detail") return data.detailRemaining > 0;
  return data.detailRemaining === 0 && entry.request === data.mode;
}
var FlagSwitch = class {
  constructor(state2, flagName = FLAG_NAME2) {
    this.state = state2;
    this.flagName = flagName;
  }
  /** Die Schalterflagge, falls gesetzt. */
  get flag() {
    return Game.flags[this.flagName];
  }
  /**
   * Liefert die Anforderung der Flagge — **nur** bei einer Farbänderung, danach
   * `null`, solange die Farbe steht. Eine unbelegte Farbe wird einmal gemeldet
   * und dann wie „keine Änderung" behandelt.
   */
  readRequest() {
    const flag = this.flag;
    if (flag === void 0) return null;
    if (flag.color === this.state.flagColor) return null;
    this.state.flagColor = flag.color;
    const entry = bySwitchColor(flag.color);
    if (entry === void 0) {
      const belegt = SWITCH_COLORS.map((item) => `${item.label}=${item.meaning}`).join(", ");
      console.log(
        `[prof] Flagge "${this.flagName}": diese Farbe ist nicht belegt. Belegt sind ${belegt}.`
      );
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
   * Ohne gesetzte Flagge tut die Methode nichts — dann kostet sie auch keinen
   * Intent.
   */
  acknowledge(request) {
    const flag = this.flag;
    if (flag === void 0) return;
    const color = byRequest(request).color;
    if (flag.color !== color) {
      flag.setColor(color, flag.secondaryColor);
    }
    this.state.flagColor = color;
  }
  /** Kurzbeschreibung der Flagge für `prof.status()`, `null` ohne Flagge. */
  describe() {
    const flag = this.flag;
    if (flag === void 0) return null;
    const entry = bySwitchColor(flag.color);
    const color = entry !== void 0 ? `${entry.label} = ${entry.meaning}` : "unbelegte Farbe";
    return `Flagge ${this.flagName} in ${flag.pos.roomName}: ${color}`;
  }
  /**
   * Zeichnet die Legende neben die Flagge. Nur wenn die Flagge steht — sie ist
   * damit der Ein- und Ausschalter der ganzen Anzeige. Room Visuals leben einen
   * Tick, das hier läuft deshalb jeden Tick erneut.
   */
  draw(data) {
    const flag = this.flag;
    if (flag === void 0) return;
    const visual = new RoomVisual(flag.pos.roomName);
    const toLeft = flag.pos.x >= 25;
    const x = toLeft ? flag.pos.x - 0.8 : flag.pos.x + 0.8;
    const align = toLeft ? "right" : "left";
    const top = Math.min(Math.max(flag.pos.y - 2, 0.8), 45);
    const lineHeight = 0.7;
    const style = {
      align,
      font: 0.5,
      backgroundColor: "#000000",
      backgroundPadding: 0.12
    };
    visual.text(`prof: ${data.mode}`, x, top, { ...style, color: "#ffffff" });
    SWITCH_COLORS.forEach((entry, index) => {
      const active = isActive(entry, data);
      visual.text(
        `${active ? "\u25B6" : "\xB7"} ${entry.label} = ${entry.meaning}`,
        x,
        top + lineHeight * (index + 1),
        { ...style, color: entry.css, opacity: active ? 1 : 0.4 }
      );
    });
    visual.text(statusLine(data), x, top + lineHeight * (SWITCH_COLORS.length + 1), {
      ...style,
      color: "#cccccc",
      opacity: 0.8
    });
  }
};

// src/profiler/state.ts
var _ProfilerState = class _ProfilerState {
  constructor() {
    /** Gespiegelter Zustand, einmal je Tick aus `Memory.profiler` übernommen. */
    __publicField(this, "mirroredMode", "off");
  }
  /** `Memory.profiler`, bei Bedarf mit Standard `off` angelegt. */
  get entry() {
    var _a;
    const memory = Memory;
    return (_a = memory.profiler) != null ? _a : memory.profiler = { mode: "off" };
  }
  /** Der gespiegelte Zustand. Billig — nur ein Feldzugriff. */
  get mode() {
    return this.mirroredMode;
  }
  /** Setzt den Zustand in `Memory` und im Spiegel. */
  set mode(mode) {
    this.entry.mode = mode;
    this.mirroredMode = mode;
  }
  /** Spiegelt den Zustand aus `Memory`. Einmal je Tick, als erstes. */
  syncFromMemory() {
    this.mirroredMode = this.entry.mode;
    return this.mirroredMode;
  }
  /** Startet die Detailmessung für `ticks` Ticks und merkt den Rückkehrzustand. */
  startDetail(ticks) {
    const entry = this.entry;
    if (entry.detailUntil === void 0) {
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
  cancelDetail() {
    const entry = this.entry;
    delete entry.detailUntil;
    delete entry.detailReturnTo;
  }
  /** Läuft gerade eine Detailmessung? */
  detailActive() {
    return this.entry.detailUntil !== void 0;
  }
  /** Restticks der Detailmessung, 0 wenn sie nicht läuft. */
  detailRemaining() {
    const until = this.entry.detailUntil;
    if (until === void 0) {
      return 0;
    }
    const remaining = until - Game.time;
    return remaining > 0 ? remaining : 0;
  }
  /**
   * Liefert `true` genau in dem Tick, in dem die Detailmessung abgelaufen ist,
   * und stellt dabei den Rückkehrzustand wieder her. Danach `false`.
   */
  expireDetail() {
    var _a;
    const entry = this.entry;
    if (entry.detailUntil === void 0 || Game.time < entry.detailUntil) {
      return false;
    }
    const returnTo = (_a = entry.detailReturnTo) != null ? _a : "off";
    this.cancelDetail();
    entry.mode = returnTo;
    this.mirroredMode = returnTo;
    return true;
  }
  /** Hält ein Fenster als benannte Grundlinie fest. */
  saveBaseline(name, baseline) {
    var _a, _b;
    const baselines = (_b = (_a = this.entry).baselines) != null ? _b : _a.baselines = {};
    baselines[name] = baseline;
    const names = Object.keys(baselines);
    if (names.length <= _ProfilerState.MAX_BASELINES) {
      return;
    }
    let oldestName = names[0];
    for (const candidate of names) {
      if (baselines[candidate].tick < baselines[oldestName].tick) {
        oldestName = candidate;
      }
    }
    delete baselines[oldestName];
  }
  /** Alle festgehaltenen Grundlinien, leeres Objekt statt `undefined`. */
  readBaselines() {
    var _a;
    return (_a = this.entry.baselines) != null ? _a : {};
  }
  /** Zuletzt verarbeitete Farbe der Schalterflagge, `undefined` wenn noch keine. */
  get flagColor() {
    return this.entry.flagColor;
  }
  /** Merkt eine Flaggenfarbe als verarbeitet, damit sie keine Flanke mehr auslöst. */
  set flagColor(color) {
    this.entry.flagColor = color;
  }
};
/** Höchstzahl gespeicherter Grundlinien, damit `Memory.profiler` klein bleibt. */
__publicField(_ProfilerState, "MAX_BASELINES", 8);
var ProfilerState = _ProfilerState;

// src/profiler/window.ts
function createEmptySnapshot() {
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
    creepDetail: {}
  };
}
function record(map, key, cpu) {
  const existing = map[key];
  if (existing === void 0) {
    map[key] = { total: cpu, max: cpu, calls: 1 };
    return;
  }
  existing.total += cpu;
  existing.calls += 1;
  if (cpu > existing.max) existing.max = cpu;
}
function safeDiv(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}
function rank(map, ticks, cpuTotal) {
  const entries = [];
  for (const name in map) {
    const stat = map[name];
    entries.push({
      name,
      cpuPerTick: safeDiv(stat.total, ticks),
      cpuPerCall: safeDiv(stat.total, stat.calls),
      callsPerTick: safeDiv(stat.calls, ticks),
      max: stat.max,
      share: safeDiv(stat.total, cpuTotal)
    });
  }
  entries.sort((a, b) => b.cpuPerTick - a.cpuPerTick);
  return entries;
}
var MeasurementWindow = class {
  constructor(state2) {
    this.state = state2;
    /** Startzeitpunkt (`Game.cpu.getUsed()`) je noch offener `begin()`-Messung. */
    __publicField(this, "openSections", /* @__PURE__ */ new Map());
    __publicField(this, "window", createEmptySnapshot());
  }
  /** Rohzustand des laufenden Fensters. */
  get snapshot() {
    return this.window;
  }
  /** `true`, wenn das Fenster `WINDOW_TICKS` Ticks voll hat. */
  get isDue() {
    return this.window.ticks >= WINDOW_TICKS;
  }
  /** Abschnittsmessung starten. Nur im Zustand `full` aktiv. */
  begin(section) {
    if (this.state.mode !== "full") return;
    this.openSections.set(section, Game.cpu.getUsed());
  }
  /** Abschnittsmessung beenden und verbuchen. Gleicher Wächter wie `begin`. */
  end(section) {
    if (this.state.mode !== "full") return;
    const start = this.openSections.get(section);
    if (start === void 0) return;
    this.openSections.delete(section);
    record(this.window.sections, section, Game.cpu.getUsed() - start);
  }
  /**
   * Tickgrenze am Anfang von `loop()`. Zählt nur den Tick fürs Fenster — bewusst
   * **kein** `Game.cpu.getUsed()` hier. Der eine sinnvolle Gesamtwert je Tick
   * wird zentral in `endTick` gelesen, siehe dortiger Kommentar.
   */
  beginTick() {
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
  endTick(creepCount) {
    const mode = this.state.mode;
    if (mode === "off") return;
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
  recordRole(role14, cpu) {
    record(this.window.roles, role14, cpu);
  }
  /** Zeit einer Klassenmethode verbuchen. Genutzt vom `@profile`-Dekorator. */
  recordMethod(key, cpu) {
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
  recordCreep(creepName, cpu) {
    if (this.state.mode !== "full") return;
    if (!this.state.detailActive()) return;
    record(this.window.creepDetail, creepName, cpu);
  }
  /**
   * Leitet die Kennzahlen aus dem laufenden Fenster ab. Die einzige Stelle, die
   * dividiert — jede Division ist gegen einen Nenner von 0 abgesichert, damit
   * ein leeres Fenster niemals `NaN`/`Infinity` liefert.
   */
  metrics() {
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
      creepDetail: rank(window.creepDetail, ticks, window.cpuTotal)
    };
  }
  /** Fenster verwerfen und neu beginnen. */
  reset() {
    this.openSections.clear();
    this.window = createEmptySnapshot();
  }
};

// src/profiler/runtime.ts
var state = new ProfilerState();
var measurement = new MeasurementWindow(state);
var flagSwitch = new FlagSwitch(state);

// src/profiler/decorator.ts
function wrapFunction(obj, key, className) {
  const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
  if (!descriptor || descriptor.get || descriptor.set) {
    return;
  }
  if (key === "constructor") {
    return;
  }
  const originalFunction = descriptor.value;
  if (!originalFunction || typeof originalFunction !== "function") {
    return;
  }
  const resolvedClassName = className != null ? className : obj.constructor ? obj.constructor.name : "";
  const memKey = `${resolvedClassName}.${String(key)}`;
  const savedName = `__${String(key)}__`;
  if (Reflect.has(obj, savedName)) {
    return;
  }
  Reflect.set(obj, savedName, originalFunction);
  Reflect.set(obj, key, function(...args) {
    if (state.mode !== "full") {
      return originalFunction.apply(this, args);
    }
    const start = Game.cpu.getUsed();
    const result = originalFunction.apply(this, args);
    measurement.recordMethod(memKey, Game.cpu.getUsed() - start);
    return result;
  });
}
function profile(target, key, _descriptor) {
  if (key === void 0) {
    const ctor = target;
    const prototype = ctor.prototype;
    for (const propertyKey of Object.getOwnPropertyNames(prototype)) {
      wrapFunction(prototype, propertyKey, ctor.name);
    }
    return;
  }
  const className = typeof target === "function" ? target.name : target.constructor.name;
  wrapFunction(target, key, className);
}
function wrapRoles(jobs2) {
  const wrapped = {};
  for (const role14 in jobs2) {
    const original = jobs2[role14];
    wrapped[role14] = {
      doJob(creep) {
        if (state.mode !== "full") {
          original.doJob(creep);
          return;
        }
        const start = Game.cpu.getUsed();
        original.doJob(creep);
        const cpu = Game.cpu.getUsed() - start;
        measurement.recordRole(role14, cpu);
        measurement.recordCreep(creep.name, cpu);
      },
      spawn(spawn3, workroom) {
        if (state.mode !== "full") {
          return original.spawn(spawn3, workroom);
        }
        const start = Game.cpu.getUsed();
        const result = original.spawn(spawn3, workroom);
        measurement.recordRole(`${role14}.spawn`, Game.cpu.getUsed() - start);
        return result;
      }
    };
  }
  return wrapped;
}

// src/controller/defence.ts
var HostileScanCache = class {
  constructor() {
    __publicField(this, "entries", /* @__PURE__ */ new Map());
  }
  get(room) {
    const cached = this.entries.get(room.name);
    if (cached && cached.tick === Game.time) return cached.hostiles;
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    this.entries.set(room.name, { tick: Game.time, hostiles });
    return hostiles;
  }
};
var CHECK_INTERVAL = 7;
var DefenceController = class {
  constructor() {
    __publicField(this, "hostileScan", new HostileScanCache());
  }
  /**
   * Verteidigungsscan, **gestaffelt**: ein Raum je Tick statt alle im selben.
   *
   * Wird seit Plan 05 in **jedem** Tick gerufen, nicht mehr nur alle sieben. Die
   * Häufigkeit je Raum bleibt dieselbe (`(Game.time + index) % 7`), aber die
   * Räume verteilen sich über die sieben Ticks. Das ändert nicht die Summe,
   * sondern die **Spitze** — und die entscheidet, ob der Tick durchläuft: greift
   * das CPU-Limit, bricht das Spiel den Rest stillschweigend ab. Mit neun Räumen
   * fielen bisher neun Raumscans in denselben Tick, jetzt sind es ein bis zwei.
   *
   * Der Versatz kommt aus der Position des Raums in `bot.room`. Die
   * Schlüsselreihenfolge eines Objekts ist für Stringschlüssel die
   * Einfügereihenfolge, also stabil — ein Raum behält seinen Tick, solange
   * `config.ts` unverändert bleibt. Ändert sie sich, verschiebt sich der Versatz
   * einmalig; das ist folgenlos, weil jede Prüfung für sich steht.
   *
   * `tower()` wird ausdrücklich **nicht** gestaffelt: Turmfeuer ist taktisch und
   * muss in jedem Tick für jeden bedrohten Raum laufen.
   */
  check() {
    let roomIndex = 0;
    for (const name in bot.room) {
      const offset = roomIndex++;
      if ((Game.time + offset) % CHECK_INTERVAL !== 0) continue;
      if (!bot.room[name].sendDefender) continue;
      if (Memory.rooms[name].invaderCoreEndTick && Game.time + 10 > Memory.rooms[name].invaderCoreEndTick) {
        Memory.rooms[name].invaderCore = false;
      }
      if (Memory.rooms[name].needDefenceEndTick && Game.time + 10 > Memory.rooms[name].needDefenceEndTick) {
        Memory.rooms[name].needDefence = false;
      }
      const room = Game.rooms[bot.room[name].room];
      if (!room) continue;
      const hostiles = this.hostileScan.get(room);
      const core = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_INVADER_CORE
      });
      const nukes = room.find(FIND_NUKES);
      Memory.rooms[name].needDefence = hostiles.length > 0;
      if (hostiles.length > (bot.room[name].minHostile || 1)) {
        let maxLifeTime = 0;
        for (const creep of hostiles) {
          if (creep.ticksToLive !== void 0 && creep.ticksToLive > maxLifeTime) {
            maxLifeTime = creep.ticksToLive;
          }
        }
        Memory.rooms[name].needDefenceEndTick = Game.time + maxLifeTime;
      }
      Memory.rooms[name].invaderCore = core.length > 0;
      if (core.length > 0) {
        Memory.rooms[name].claimed = false;
        let timeRemaining = 0;
        for (const effect of core[0].effects || []) {
          const time = effect.ticksRemaining;
          if (time > timeRemaining) {
            timeRemaining = time;
          }
        }
        Memory.rooms[name].invaderCoreEndTick = Game.time + timeRemaining;
      }
      if (nukes.length > 0) {
        let msg = "";
        Memory.rooms[name].nukepos = [];
        for (const nuke of nukes) {
          msg += "Raum " + nuke.room + " wird in " + nuke.timeToLand + " ticks von Raum " + nuke.launchRoomName + " aus genuked!\r\n";
          if (!Memory.rooms[name].nukepos.includes(nuke.pos))
            Memory.rooms[name].nukepos.push(nuke.pos);
        }
        if (msg.length > 0 && !Memory.rooms[name].nuke) Game.notify(msg);
      } else {
        if (Memory.rooms[name].nukepos) Memory.rooms[name].nukepos = [];
      }
      Memory.rooms[name].nuke = nukes.length > 0;
    }
  }
  tower() {
    for (const name in bot.room) {
      const room = Game.rooms[name];
      if (!room || !room.controller || !room.controller.my || !Memory.rooms[name].tower || Memory.rooms[name].tower.length === 0)
        continue;
      if (Memory.rooms[name].needDefence) {
        const hostileCreeps = this.hostileScan.get(room);
        if (hostileCreeps.length > 0) {
          hostileCreeps.sort(function(a, b) {
            const costA = a.body.reduce(function(total, part) {
              return total + BODYPART_COST[part.type];
            }, 0);
            const costB = b.body.reduce(function(total, part) {
              return total + BODYPART_COST[part.type];
            }, 0);
            return costB - costA;
          });
          let totalHealPower = 0;
          for (const healer of hostileCreeps) {
            const healParts = healer.body.filter((part) => part.type === HEAL).length;
            totalHealPower += healParts * HEAL_POWER;
          }
          let target = null;
          for (const candidate of hostileCreeps) {
            let towerDamage = 0;
            for (const t of this.resolveTowers(name)) {
              if (t.store.getUsedCapacity(RESOURCE_ENERGY) < TOWER_ENERGY_COST) continue;
              const range = t.pos.getRangeTo(candidate.pos);
              if (range <= TOWER_OPTIMAL_RANGE) {
                towerDamage += TOWER_POWER_ATTACK;
              } else if (range >= TOWER_FALLOFF_RANGE) {
                towerDamage += TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF);
              } else {
                const fallOffShare = (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
                towerDamage += TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * fallOffShare);
              }
            }
            if (towerDamage > totalHealPower) {
              target = candidate;
              break;
            }
          }
          if (target) {
            for (const t of this.resolveTowers(name)) t.attack(target);
          } else {
            const allStructures = room.find(FIND_STRUCTURES);
            if (!Memory.rooms[name].structureHP) {
              Memory.rooms[name].structureHP = {};
              for (const structure of allStructures) {
                Memory.rooms[name].structureHP[structure.id] = structure.hits;
              }
            }
            let damagedStructure = null;
            for (const structure of allStructures) {
              if (Memory.rooms[name].structureHP[structure.id] && structure.hits < Memory.rooms[name].structureHP[structure.id]) {
                damagedStructure = structure;
                break;
              }
            }
            if (damagedStructure) {
              for (const t of this.resolveTowers(name)) t.repair(damagedStructure);
            }
          }
        } else {
          Memory.rooms[name].needDefence = false;
          delete Memory.rooms[name].structureHP;
        }
      } else if (Game.time % 3 === 2) {
        const damagedStructures = room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.hits < (bot.prio.hits[structure.structureType] || 0.5) * structure.hitsMax;
          }
        });
        if (damagedStructures.length > 0) {
          damagedStructures.sort((a, b) => {
            const priorityA = bot.prio.repair[a.structureType] || 10;
            const priorityB = bot.prio.repair[b.structureType] || 10;
            if (priorityA !== priorityB) return priorityA - priorityB;
            const damageShareA = 1 - a.hits / a.hitsMax;
            const damageShareB = 1 - b.hits / b.hitsMax;
            return damageShareB - damageShareA;
          });
          for (const t of this.resolveTowers(name)) {
            if (t.store.getUsedCapacity([RESOURCE_ENERGY]) * 0.5 > t.store.getFreeCapacity([RESOURCE_ENERGY]))
              t.repair(damagedStructures[0]);
          }
        }
      }
    }
  }
  /**
   * Löst die im Raum-Memory gemerkten Turm-Ids zu lebenden Objekten auf.
   *
   * Eine tote Id (Turm zerstört) wird stillschweigend übersprungen — die
   * gemerkte Liste bleibt dabei unverändert liegen. Anders als bei
   * `LinkList`/`ContainerList`, die eine tote Id zum Anlass nehmen, die ganze
   * Liste zu verwerfen: für Türme gibt es diese Selbstheilung bewusst nicht,
   * das ist Aufgabe des Tagesjobs (`memoryController.findAndSaveRoomTower`).
   */
  resolveTowers(roomName) {
    const towers = [];
    for (const towerId of Memory.rooms[roomName].tower) {
      const tower = Game.getObjectById(towerId);
      if (tower) towers.push(tower);
    }
    return towers;
  }
};
DefenceController = __decorateClass([
  profile
], DefenceController);
var defence_default = new DefenceController();

// src/controller/link-list.ts
function usesLinks(roomName) {
  var _a, _b, _c;
  const controller = (_a = Game.rooms[roomName]) == null ? void 0 : _a.controller;
  if (!(controller == null ? void 0 : controller.my)) {
    return false;
  }
  return ((_c = (_b = CONTROLLER_STRUCTURES == null ? void 0 : CONTROLLER_STRUCTURES[STRUCTURE_LINK]) == null ? void 0 : _b[controller.level]) != null ? _c : 0) > 0;
}
var LinkList = class _LinkList {
  constructor(roomName) {
    this.roomName = roomName;
  }
  get roomMemory() {
    return Memory.rooms[this.roomName];
  }
  /**
   * Alle Links des Raums, frisch über die Live-Geometrie gesucht — bewusst
   * ohne Bezug zur klassifizierten Liste im Memory. Genutzt von `discover()`
   * selbst und vom Linkplaner (`link-planner.ts`), der bei jedem Aufruf neu
   * sucht statt einen Cache zu lesen (`build*Link`/`freeLinkSlots` laufen in
   * der Tagessequenz, nicht bei jedem Tick).
   *
   * Statisch, weil die Suche den Raum als Argument bekommt und `roomName` der
   * Instanz nicht braucht — sonst müsste der Aufrufer eine Instanz nur anlegen,
   * um sie wegzuwerfen.
   */
  static allLinks(room) {
    return room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_LINK
    });
  }
  /** Kennt der Bot den Raum überhaupt? Ohne Raum-Memory gibt es nichts zu tun. */
  get isRoomKnown() {
    return this.roomMemory !== void 0;
  }
  /** Liegt überhaupt eine Liste vor — auch eine ohne Sender? */
  get hasList() {
    var _a;
    return ((_a = this.roomMemory) == null ? void 0 : _a.links) !== void 0;
  }
  /**
   * Erhebt die Links des Raums, klassifiziert sie und schreibt sie ins Memory.
   *
   * Reihenfolge der Zuordnung: erst die Config, dann die Lage, und ein Link
   * ist nie beides — Controller zuerst, Storage aus dem Rest, alle übrigen
   * Links sind Sender.
   */
  discover(room) {
    const memory = this.roomMemory;
    if (!memory) {
      return;
    }
    const links = _LinkList.allLinks(room);
    const remaining = new Set(links.map((link) => link.id));
    const controllerId = this.resolveController(room, links);
    if (controllerId) {
      remaining.delete(controllerId);
    }
    const spawnId = this.resolveSpawn(room, links, remaining);
    if (spawnId) {
      remaining.delete(spawnId);
    }
    const previous = memory.links;
    memory.links = {
      controller: controllerId,
      spawn: spawnId,
      sender: [...remaining]
    };
    this.reportChange(room.name, previous, memory.links);
  }
  /**
   * Meldet eine geänderte Zuordnung auf der Konsole — nur bei Änderung, nicht
   * bei jeder Erhebung.
   *
   * Der Grund ist Nachprüfbarkeit: seit die Empfänger nicht mehr in `config.ts`
   * stehen, entscheidet allein die Lage. Ob sie richtig entscheidet, sieht man
   * sonst nirgends. Ein Raum, in dem eine Quelle zufällig nah am Controller
   * liegt, würde deren Quell-Link zum Empfänger machen — das fällt hier auf.
   */
  reportChange(roomName, previous, current) {
    var _a, _b;
    const unchanged = previous !== void 0 && previous.controller === current.controller && previous.spawn === current.spawn && previous.sender.length === current.sender.length && previous.sender.every((id, index) => id === current.sender[index]);
    if (unchanged) {
      return;
    }
    console.log(
      `[${roomName}] Links: Controller=${(_a = current.controller) != null ? _a : "-"} Storage=${(_b = current.spawn) != null ? _b : "-"} Sender=${current.sender.length}`
    );
  }
  /** Der Empfänger am Controller: der nächste Link in Reichweite 3. */
  resolveController(room, links) {
    var _a;
    const controller = room.controller;
    if (!controller) {
      return void 0;
    }
    return (_a = this.nearestWithinRange(links, controller.pos, 3)) == null ? void 0 : _a.id;
  }
  /** Der Empfänger am Storage: der nächste noch freie Link in Reichweite 2. */
  resolveSpawn(room, links, candidates) {
    var _a;
    const storage = room.storage;
    if (!storage) {
      return void 0;
    }
    const remainingLinks = links.filter((link) => candidates.has(link.id));
    return (_a = this.nearestWithinRange(remainingLinks, storage.pos, 2)) == null ? void 0 : _a.id;
  }
  /** Der nächstgelegene Link zu `pos`, sofern innerhalb von `range`. */
  nearestWithinRange(links, pos, range) {
    let nearest;
    let nearestDistance = Infinity;
    for (const link of links) {
      const distance = link.pos.getRangeTo(pos);
      if (distance <= range && distance < nearestDistance) {
        nearestDistance = distance;
        nearest = link;
      }
    }
    return nearest;
  }
  /** Verwirft die Liste; sie wird beim nächsten Tagesjob neu erhoben. */
  forget() {
    const memory = this.roomMemory;
    if (memory) {
      delete memory.links;
    }
  }
  /**
   * Löst eine gemerkte Id auf. Zeigt sie ins Leere (Link abgerissen), wird die
   * ganze Liste verworfen — analog zu `forgetListOnStaleId` in `ContainerList`,
   * hier aber ohne Ausnahme, weil es für Links keine zwei Seiten mit
   * unterschiedlichem Verhalten gibt.
   */
  resolve(id) {
    if (!id) {
      return null;
    }
    const link = Game.getObjectById(id);
    if (!link) {
      this.forget();
      return null;
    }
    return link;
  }
  /** Der Empfänger am Controller, oder null. */
  get controllerLink() {
    var _a, _b;
    return this.resolve((_b = (_a = this.roomMemory) == null ? void 0 : _a.links) == null ? void 0 : _b.controller);
  }
  /** Der Empfänger am Storage, oder null. */
  get spawnLink() {
    var _a, _b;
    return this.resolve((_b = (_a = this.roomMemory) == null ? void 0 : _a.links) == null ? void 0 : _b.spawn);
  }
  /** Alle sendenden Links, aufgelöst. */
  senders() {
    var _a, _b;
    const ids = (_b = (_a = this.roomMemory) == null ? void 0 : _a.links) == null ? void 0 : _b.sender;
    if (!ids) {
      return [];
    }
    const result = [];
    for (const id of ids) {
      const link = this.resolve(id);
      if (link) {
        result.push(link);
      }
    }
    return result;
  }
};
function linksDeliver(roomName) {
  return usesLinks(roomName) && new LinkList(roomName).spawnLink !== null;
}

// src/controller/link-planner.ts
var blockingStructureTypes = OBSTACLE_OBJECT_TYPES;
var MAX_CONSTRUCTION_SITES = 10;
var LinkPlanner = class {
  constructor(roomName) {
    this.roomName = roomName;
  }
  /** Legt höchstens eine Linkbaustelle an. `true`, wenn eine entstanden ist. */
  plan() {
    if (!usesLinks(this.roomName)) return false;
    const room = Game.rooms[this.roomName];
    const controller = room.controller;
    const freeSlots = this.freeLinkSlots(room, controller.level);
    if (freeSlots <= 0) return false;
    const reserve = this.reservedSenderSlots(room, this.allowedLinks(controller.level));
    if (freeSlots <= reserve) return false;
    const freeConstructionSlots = MAX_CONSTRUCTION_SITES - room.find(FIND_CONSTRUCTION_SITES).length;
    if (freeConstructionSlots <= 0) return false;
    if (this.buildControllerLink(room, controller)) return true;
    return this.buildStorageLink(room, controller);
  }
  /** Wie viele Links dieser RCL insgesamt erlaubt sind. */
  allowedLinks(level) {
    var _a, _b;
    return (_b = (_a = CONTROLLER_STRUCTURES == null ? void 0 : CONTROLLER_STRUCTURES[STRUCTURE_LINK]) == null ? void 0 : _a[level]) != null ? _b : 0;
  }
  /** Wie viele Links in diesem Raum noch gebaut werden dürfen, abzüglich vorhandener und geplanter. */
  freeLinkSlots(room, level) {
    const allowed = this.allowedLinks(level);
    const built = LinkList.allLinks(room).length;
    const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: (s) => s.structureType === STRUCTURE_LINK }).length;
    return allowed - built - sites;
  }
  /** Anzahl der Quellen des Raums, in deren Reichweite 2 noch kein Link und keine Linkbaustelle steht. */
  sourcesWithoutLink(room) {
    return room.find(FIND_SOURCES).filter((source) => !this.hasLinkNear(room, source.pos, 2)).length;
  }
  /**
   * Plätze, die für Quell-Links reserviert bleiben, bevor ein Empfänger
   * gebaut wird: höchstens so viele wie es Quellen ohne Link gibt, aber
   * mindestens ein Platz bleibt immer für einen Empfänger übrig (`- 1`) –
   * auch wenn es mehr Quellen als erlaubte Links gäbe.
   */
  reservedSenderSlots(room, allowed) {
    return Math.min(this.sourcesWithoutLink(room), allowed - 1);
  }
  /** Plant den Controller-Link, falls in Reichweite 3 noch keiner steht (auch keine Baustelle). */
  buildControllerLink(room, controller) {
    if (this.hasLinkNear(room, controller.pos, 3)) return false;
    const candidates = this.candidatesNearController(room, controller.pos);
    const best = this.selectBest(candidates, room, controller, room.storage);
    if (!best) return false;
    return this.build(room, best, "Controller");
  }
  /** Plant den Storage-Link, falls ein Storage existiert und in Reichweite 2 noch keiner steht. */
  buildStorageLink(room, controller) {
    const storage = room.storage;
    if (!storage) return false;
    if (this.hasLinkNear(room, storage.pos, 2)) return false;
    const candidates = this.candidatesNearStorage(room, storage);
    const best = this.selectBest(candidates, room, controller, storage);
    if (!best) return false;
    return this.build(room, best, "Storage");
  }
  /** Steht (gebaut oder als Baustelle) bereits ein Link in `range` um `pos`? */
  hasLinkNear(room, pos, range) {
    const links = LinkList.allLinks(room);
    if (links.some((link) => link.pos.getRangeTo(pos) <= range)) return true;
    const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: (s) => s.structureType === STRUCTURE_LINK });
    return sites.some((site) => site.pos.getRangeTo(pos) <= range);
  }
  /**
   * Kandidatenfelder für den Controller-Link: bevorzugt Reichweite 2, damit
   * ein Upgrader (Arbeitsdistanz 3 zum Controller) neben dem Link stehen und
   * zugleich upgraden kann. Findet sich dort keins, weicht die Suche auf
   * Reichweite 3, danach auf Reichweite 1 aus.
   */
  candidatesNearController(room, controllerPos) {
    for (const range of [2, 3, 1]) {
      const positions = this.positionsAtRange(room, controllerPos, range).filter((pos) => this.isBuildable(pos, room));
      if (positions.length > 0) return positions;
    }
    return [];
  }
  /**
   * Kandidatenfelder für den Storage-Link: alle bebaubaren Felder bis
   * Reichweite 2, für die zusätzlich ein Standplatz für den Linkkeeper
   * existiert – ein begehbares Feld, das an Link **und** Storage zugleich
   * angrenzt (siehe roles/linkkeeper.ts::_findPost). Ohne diesen Platz wäre
   * der Link nicht leerbar.
   */
  candidatesNearStorage(room, storage) {
    const positions = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const x = storage.pos.x + dx;
        const y = storage.pos.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        const pos = new RoomPosition(x, y, room.name);
        if (!this.isBuildable(pos, room)) continue;
        if (!this.hasKeeperPost(pos, storage, room)) continue;
        positions.push(pos);
      }
    }
    return positions;
  }
  /** Gibt es ein Feld, das an `linkPos` und `storage` zugleich angrenzt und begehbar ist? */
  hasKeeperPost(linkPos, storage, room) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = linkPos.x + dx;
        const y = linkPos.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        const pos = new RoomPosition(x, y, room.name);
        if (!pos.isNearTo(storage.pos)) continue;
        if (!this.isBuildable(pos, room)) continue;
        return true;
      }
    }
    return false;
  }
  /** Alle Felder mit Chebyshev-Abstand `range` genau zu `center`, innerhalb der Raumgrenzen. */
  positionsAtRange(room, center, range) {
    const positions = [];
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== range) continue;
        const x = center.x + dx;
        const y = center.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        positions.push(new RoomPosition(x, y, room.name));
      }
    }
    return positions;
  }
  /** Feld begehbar und unverbaut: kein Wall-Terrain, kein blockierendes Bauwerk oder Baustelle. */
  isBuildable(pos, room) {
    if (pos.x < 1 || pos.x > 48 || pos.y < 1 || pos.y > 48) return false;
    const terrain = room.getTerrain();
    if ((terrain.get(pos.x, pos.y) & TERRAIN_MASK_WALL) !== 0) return false;
    const blockedByStructure = pos.lookFor(LOOK_STRUCTURES).some((s) => blockingStructureTypes.includes(s.structureType));
    if (blockedByStructure) return false;
    const blockedBySite = pos.lookFor(LOOK_CONSTRUCTION_SITES).some((s) => blockingStructureTypes.includes(s.structureType));
    return !blockedBySite;
  }
  /**
   * Wählt aus `candidates` das beste Feld: kleinste Summe der Entfernungen zu
   * den Referenzpositionen gewinnt, bei Gleichstand das Feld mit mehr
   * begehbaren Nachbarfeldern – ein Link soll keinen Engpass zubauen.
   */
  selectBest(candidates, room, controller, storage) {
    if (candidates.length === 0) return null;
    const referencePositions = this.referencePositions(room, controller, storage);
    let best = null;
    let bestScore = Infinity;
    let bestNeighbors = -1;
    for (const candidate of candidates) {
      const score = this.distanceSum(candidate, referencePositions);
      const neighbors = this.walkableNeighborCount(candidate, room);
      if (score < bestScore || score === bestScore && neighbors > bestNeighbors) {
        best = candidate;
        bestScore = score;
        bestNeighbors = neighbors;
      }
    }
    return best;
  }
  /**
   * Referenzpositionen für die Entfernungsbewertung: die sendenden Links des
   * Raums (weder Controller- noch Storage-Empfänger), ersatzweise die
   * Quellen, solange noch kein sendender Link existiert.
   */
  referencePositions(room, controller, storage) {
    const sendingLinks = this.sendingLinks(room, controller, storage);
    if (sendingLinks.length > 0) return sendingLinks.map((link) => link.pos);
    return room.find(FIND_SOURCES).map((source) => source.pos);
  }
  /** Alle gebauten Links des Raums, die weder Controller- noch Storage-Empfänger sind. */
  sendingLinks(room, controller, storage) {
    const links = LinkList.allLinks(room);
    return links.filter((link) => {
      if (link.pos.getRangeTo(controller.pos) <= 3) return false;
      if (storage && link.pos.getRangeTo(storage.pos) <= 2) return false;
      return true;
    });
  }
  distanceSum(pos, targets) {
    let sum = 0;
    for (const target of targets) sum += pos.getRangeTo(target);
    return sum;
  }
  walkableNeighborCount(pos, room) {
    const terrain = room.getTerrain();
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = pos.x + dx;
        const y = pos.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        if ((terrain.get(x, y) & TERRAIN_MASK_WALL) === 0) count++;
      }
    }
    return count;
  }
  /** Legt die Baustelle auf `pos` an und meldet das Ergebnis. */
  build(room, pos, label) {
    const result = pos.createConstructionSite(STRUCTURE_LINK);
    if (result !== OK) return false;
    console.log("[" + room.name + "] Linkbaustelle (" + label + "-Link) angelegt bei " + pos.x + "," + pos.y);
    return true;
  }
};
function planReceiverLinks(onlyRoom) {
  for (const roomName in bot.room) {
    if (onlyRoom && roomName !== onlyRoom) continue;
    new LinkPlanner(roomName).plan();
  }
}

// src/controller/storage-pressure.ts
var STORAGE_FULL_RATIO = 0.9;
var STORAGE_FULL_MIN_ENERGY = 1e5;
function storageIsFull(roomName) {
  var _a, _b, _c;
  const storage = (_a = Game.rooms[roomName]) == null ? void 0 : _a.storage;
  if (!storage) {
    return false;
  }
  const capacity = (_b = storage.store.getCapacity()) != null ? _b : 0;
  if (capacity <= 0) {
    return false;
  }
  const used = (_c = storage.store.getUsedCapacity()) != null ? _c : 0;
  return used / capacity > STORAGE_FULL_RATIO && storage.store[RESOURCE_ENERGY] > STORAGE_FULL_MIN_ENERGY;
}

// src/controller/links.ts
var SEND_MIN = LINK_CAPACITY / 4;
var STORAGE_FEED_RESERVE = 2e4;
var LinkNetwork = class {
  constructor(roomName) {
    this.roomName = roomName;
    __publicField(this, "list");
    this.list = new LinkList(roomName);
  }
  /** Ein Durchgang: wählt Sender und Empfänger und sendet. */
  send() {
    var _a;
    if (!usesLinks(this.roomName)) {
      return;
    }
    const room = Game.rooms[this.roomName];
    if (!this.list.hasList) {
      if (this.list.isRoomKnown) {
        this.list.discover(room);
      }
      return;
    }
    const senders = this.readySenders();
    const feed = this.feedSender();
    if (feed) {
      senders.push(feed);
    }
    if (senders.length === 0) {
      return;
    }
    const receivers = this.receiversByPriority(room, feed !== null);
    for (const sender of senders) {
      const receiver = receivers.shift();
      if (!receiver) {
        return;
      }
      const amount = Math.min(sender.store[RESOURCE_ENERGY], (_a = receiver.store.getFreeCapacity(RESOURCE_ENERGY)) != null ? _a : 0);
      if (amount < SEND_MIN) {
        continue;
      }
      sender.transferEnergy(receiver, amount);
    }
  }
  /** Sendende Links mit abgelaufenem Cooldown und ausreichend Ladung. */
  readySenders() {
    return this.list.senders().filter((link) => link.cooldown === 0 && link.store[RESOURCE_ENERGY] >= SEND_MIN);
  }
  /**
   * Der Storage-Link als Sender, wenn der Raum nachschieben muss — sonst `null`.
   *
   * Cooldown und Mindestladung werden hier geprüft und nicht in
   * `needsStorageFeed`: die Frage "muss nachgeschoben werden" beantwortet auch
   * der Linkkeeper, und für ihn ist der Cooldown des Links belanglos — er füllt
   * ihn ja gerade erst.
   */
  feedSender() {
    if (!needsStorageFeed(this.roomName)) {
      return null;
    }
    const link = this.list.spawnLink;
    if (!link || link.cooldown !== 0 || link.store[RESOURCE_ENERGY] < SEND_MIN) {
      return null;
    }
    return link;
  }
  /**
   * Empfänger nach Vorrang, gefiltert auf ausreichend freien Platz.
   *
   * Der Vorrang kippt bei RCL8: darunter bekommt der Controller-Link zuerst
   * (Upgraden bringt dort noch RCL-Fortschritt), ab RCL8 der Storage-Link
   * (dort zahlt Upgraden nur noch auf GCL ein). Empfänger dürfen dabei
   * teilweise befüllt werden — wer nur ganze Ladungen annimmt, bekäme als
   * halb gefüllter Empfänger nie etwas ab.
   *
   * `storageFeeds` überstimmt beides: sendet der Storage-Link gerade selbst,
   * fällt er aus der Liste. Sonst könnte `receivers.shift()` ihm sich selbst
   * zuteilen — und der Nebeneffekt ist erwünscht, weil die Quell-Ladungen dann
   * direkt an den Controller gehen statt über einen zweiten Sprung mit weiteren
   * drei Prozent Verlust.
   */
  receiversByPriority(room, storageFeeds) {
    var _a, _b;
    const controllerFirst = ((_b = (_a = room.controller) == null ? void 0 : _a.level) != null ? _b : 0) < 8;
    let ordered;
    if (storageFeeds) {
      ordered = [this.list.controllerLink];
    } else if (controllerFirst) {
      ordered = [this.list.controllerLink, this.list.spawnLink];
    } else {
      ordered = [this.list.spawnLink, this.list.controllerLink];
    }
    return ordered.filter(
      (link) => {
        var _a2;
        return link !== null && ((_a2 = link.store.getFreeCapacity(RESOURCE_ENERGY)) != null ? _a2 : 0) >= SEND_MIN;
      }
    );
  }
};
function needsStorageFeed(roomName) {
  var _a;
  if (!usesLinks(roomName)) {
    return false;
  }
  const storage = (_a = Game.rooms[roomName]) == null ? void 0 : _a.storage;
  if (!storage) {
    return false;
  }
  const list = new LinkList(roomName);
  const controllerLink = list.controllerLink;
  if (!controllerLink || !list.spawnLink) {
    return false;
  }
  if (storageIsFull(roomName)) {
    return true;
  }
  if (controllerLink.store[RESOURCE_ENERGY] >= SEND_MIN) {
    return false;
  }
  if (list.senders().some((link) => link.store[RESOURCE_ENERGY] >= SEND_MIN)) {
    return false;
  }
  return storage.store[RESOURCE_ENERGY] > STORAGE_FEED_RESERVE;
}
function sendAll() {
  for (const roomName in bot.room) {
    new LinkNetwork(roomName).send();
  }
}
function discoverAll() {
  for (const roomName in bot.room) {
    if (!usesLinks(roomName)) {
      continue;
    }
    new LinkList(roomName).discover(Game.rooms[roomName]);
  }
}

// src/controller/rebuild.ts
var botGlobal2 = global;
var botMemory2 = Memory;
function rebuildRoads(onlyRoom) {
  var _a, _b;
  for (const name in botGlobal2.room) {
    if (onlyRoom && name !== onlyRoom) continue;
    const config = botGlobal2.room[name];
    const room = Game.rooms[name];
    if (!(config == null ? void 0 : config.saveRoads) || !room || ((_a = room.controller) == null ? void 0 : _a.level) === void 0 || room.controller.level < 7) {
      continue;
    }
    const roomMemory2 = botMemory2.rooms[name];
    if (!(roomMemory2 == null ? void 0 : roomMemory2.roads)) continue;
    let freeSlots = 10 - room.find(FIND_CONSTRUCTION_SITES).length;
    if (freeSlots <= 0) continue;
    for (const roadMemory of roomMemory2.roads) {
      if (freeSlots <= 0) break;
      if (Game.getObjectById(roadMemory.id)) continue;
      const result = new RoomPosition(roadMemory.pos.x, roadMemory.pos.y, name).createConstructionSite(STRUCTURE_ROAD);
      if (result === OK) {
        roomMemory2.autobuild = ((_b = roomMemory2.autobuild) != null ? _b : 0) + 1;
        freeSlots--;
      }
    }
  }
}

// src/controller/room-inventory.ts
function roomMemory(roomName) {
  var _a, _b;
  (_b = (_a = Memory.rooms)[roomName]) != null ? _b : _a[roomName] = {};
  return Memory.rooms[roomName];
}
function energySources(roomName) {
  var _a, _b, _c;
  const configured = (_a = bot.room[roomName]) == null ? void 0 : _a.energySources;
  if (configured && configured.length > 0) return configured;
  return (_c = (_b = Memory.rooms[roomName]) == null ? void 0 : _b.energySources) != null ? _c : [];
}
function mineralSources(roomName) {
  var _a, _b, _c;
  const configured = (_a = bot.room[roomName]) == null ? void 0 : _a.mineralSources;
  if (configured && configured.length > 0) return configured;
  return (_c = (_b = Memory.rooms[roomName]) == null ? void 0 : _b.mineralSources) != null ? _c : [];
}
function discover(onlyRoom) {
  for (const name in bot.room) {
    if (onlyRoom && name !== onlyRoom) continue;
    const config = bot.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    const memory = roomMemory(name);
    if (memory.energySources && memory.mineralSources) continue;
    memory.energySources = room.find(FIND_SOURCES).map((source) => source.id);
    memory.mineralSources = room.find(FIND_MINERALS).map((mineral) => mineral.id);
    console.log(
      `[${name}] Vorkommen erhoben: ${memory.energySources.length} Quellen, ${memory.mineralSources.length} Minerale`
    );
  }
}

// src/creep/containers.ts
var ContainerList = class {
  constructor(roomName) {
    this.roomName = roomName;
  }
  get roomMemory() {
    return Memory.rooms[this.roomName];
  }
  /** Kennt der Bot den Raum überhaupt? Ohne Raum-Memory gibt es nichts zu tun. */
  get isRoomKnown() {
    return this.roomMemory !== void 0;
  }
  /**
   * Liegt überhaupt eine Liste vor — auch eine leere?
   *
   * Der Unterschied zu `hasEntries` ist keine Spitzfindigkeit: die Ablieferseite
   * behandelt eine **leere** Liste als „keine Container da" und erhebt sie nicht
   * neu, die Beschaffungsseite erhebt sie neu. Beides war schon so und bleibt so.
   */
  get hasList() {
    var _a;
    return ((_a = this.roomMemory) == null ? void 0 : _a.container) !== void 0;
  }
  /** Liegt eine nicht leere Liste vor? */
  get hasEntries() {
    var _a;
    const ids = (_a = this.roomMemory) == null ? void 0 : _a.container;
    return ids !== void 0 && ids.length > 0;
  }
  /** Verwirft die Liste; sie wird dann neu erhoben. */
  forget() {
    const memory = this.roomMemory;
    if (memory) {
      delete memory.container;
    }
  }
  /**
   * Erhebt die Container des Raums und schreibt die Liste ins Memory.
   * Liefert `true`, wenn es welche gibt — der Aufrufer beendet damit seinen Tick,
   * denn geholt oder abgeliefert wurde in diesem Durchgang noch nichts.
   */
  discover(room) {
    const memory = this.roomMemory;
    if (!memory) {
      return false;
    }
    const containers = room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
    });
    memory.container = containers.map((container) => container.id);
    return containers.length > 0;
  }
  /**
   * Der nächstgelegene Container, der `accepts` erfüllt — oder `null`.
   *
   * Verglichen wird die **quadrierte** Entfernung: für die Reihenfolge ist das
   * dasselbe wie die Wurzel, spart aber je Kandidat eine Wurzelberechnung.
   */
  nearest(creep, accepts, options = {}) {
    var _a;
    const ids = (_a = this.roomMemory) == null ? void 0 : _a.container;
    if (!ids) {
      return null;
    }
    let nearest = null;
    let nearestDistance = Infinity;
    for (const id of ids) {
      const container = Game.getObjectById(id);
      if (!container) {
        if (options.forgetListOnStaleId) {
          this.forget();
        }
        continue;
      }
      if (!accepts(container)) {
        continue;
      }
      const dx = container.pos.x - creep.pos.x;
      const dy = container.pos.y - creep.pos.y;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = container;
      }
    }
    return nearest;
  }
};

// src/creep/path-memory.ts
var STUCK_TICKS = 3;
var PathMemory = class {
  constructor(memory) {
    __publicField(this, "memory");
    this.memory = memory;
  }
  /** Der gespeicherte Weg, ohne Rücksicht auf sein Ziel. */
  get path() {
    return this.memory.path;
  }
  /** Ticks ohne Ortswechsel. */
  get stuckTicks() {
    var _a;
    return (_a = this.memory.dontMove) != null ? _a : 0;
  }
  /**
   * Steht der Creep lange genug still, dass ein Weg um andere Creeps herum
   * gesucht werden sollte?
   */
  get isStuck() {
    return this.stuckTicks > STUCK_TICKS;
  }
  /** Verwirft den gespeicherten Weg, **behält** die Stauerkennung. */
  forgetPath() {
    delete this.memory.path;
    delete this.memory.pathTarget;
  }
  /** Verwirft Weg **und** Stauerkennung. */
  clear() {
    this.forgetPath();
    delete this.memory.dontMove;
    delete this.memory.lastPos;
  }
  /**
   * Der gespeicherte Weg, falls er zu `target` gehört — sonst `undefined`.
   *
   * Zum Ziel gehört auch der Raumname: derselbe Punkt in einem anderen Raum ist
   * ein anderes Ziel. Ein `pathTarget` ohne Raumnamen gilt als unbrauchbar.
   */
  pathTo(target) {
    const stored = this.memory.pathTarget;
    if (!this.memory.path || !stored || !stored.roomName) {
      return void 0;
    }
    const sameTarget = stored.x === target.x && stored.y === target.y && stored.roomName === target.roomName;
    return sameTarget ? this.memory.path : void 0;
  }
  /** Merkt den Weg, ohne ein Ziel zu hinterlegen. */
  rememberPath(serializedPath) {
    this.memory.path = serializedPath;
  }
  /** Merkt Weg und Ziel — der reguläre Fall. */
  rememberPathTo(serializedPath, target) {
    this.memory.path = serializedPath;
    this.memory.pathTarget = { x: target.x, y: target.y, roomName: target.roomName };
  }
  /** Setzt den Stauzähler zurück, ohne die letzte Position zu vergessen. */
  resetStuck() {
    this.memory.dontMove = 0;
  }
  /**
   * Führt die Stauerkennung einen Tick weiter: steht der Creep noch auf der
   * gemerkten Position, steigt der Zähler; sonst wird die neue Position gemerkt
   * und der Zähler beginnt neu.
   */
  trackPosition(pos) {
    const last = this.memory.lastPos;
    if (last && last.x === pos.x && last.y === pos.y) {
      this.memory.dontMove = this.stuckTicks + 1;
      return;
    }
    this.memory.lastPos = { x: pos.x, y: pos.y };
    this.memory.dontMove = 0;
  }
};

// src/creep/goto.ts
function searchRoute(creep, target, ignoreCreeps, range) {
  const steps = creep.pos.findPathTo(target, { ignoreCreeps, range });
  return { serialized: Room.serializePath(steps), steps };
}
function drawRemainingPath(creep, route) {
  var _a;
  const steps = (_a = route.steps) != null ? _a : Room.deserializePath(route.serialized);
  const currentPos = creep.pos;
  const index = steps.findIndex((pos) => pos.x === currentPos.x && pos.y === currentPos.y);
  if (index <= 0) {
    return;
  }
  const visual = new RoomVisual(creep.room.name);
  for (let i = index + 1; i < steps.length; i++) {
    visual.circle(
      steps[i].x,
      steps[i].y,
      { fill: "transparent", radius: 0.25, stroke: "red" }
    );
  }
}
function goToMyHome(creep) {
  if (creep.memory.home && creep.room.name !== creep.memory.home) {
    var room = new RoomPosition(25, 25, creep.memory.home);
    return moveByMemory(creep, room);
  }
  return false;
}
function goToRoomFlag(creep) {
  if (creep.memory.workroom != creep.memory.home) {
    const flags = creep.room.find(FIND_FLAGS);
    if (flags.length > 0 && !creep.pos.inRangeTo(flags[0].pos, 2)) {
      return moveByMemory(creep, flags[0].pos);
    }
  }
  return false;
}
function goToWorkroom(creep) {
  if (creep.memory.workroom && creep.memory.workroom != creep.room.name) {
    var room = new RoomPosition(25, 25, creep.memory.workroom);
    return moveByMemory(creep, room);
  }
  return false;
}
function moveByMemory(creep, target, range = 0) {
  const cache = new PathMemory(creep.memory);
  if (creep.pos.isEqualTo(target)) {
    cache.clear();
    return false;
  }
  if (cache.isStuck) {
    const route2 = searchRoute(creep, target, false, range);
    cache.rememberPath(route2.serialized);
    cache.resetStuck();
    creep.moveByPath(route2.serialized);
    return true;
  }
  const known = cache.pathTo(target);
  let route;
  if (known !== void 0) {
    route = { serialized: known };
  } else {
    route = searchRoute(creep, target, true, range);
    cache.rememberPathTo(route.serialized, target);
  }
  const state2 = creep.moveByPath(route.serialized);
  if (bot.const.showPaths) {
    drawRemainingPath(creep, route);
  }
  switch (state2) {
    case OK:
    case ERR_TIRED: {
      cache.trackPosition(creep.pos);
      return true;
    }
    case ERR_INVALID_ARGS:
    case ERR_NO_BODYPART:
    case ERR_NOT_FOUND: {
      cache.clear();
      return true;
    }
    default:
      return false;
  }
}

// src/creep/target.ts
var RememberedTarget = class {
  constructor(memory, key) {
    this.key = key;
    __publicField(this, "memory");
    this.memory = memory;
  }
  /**
   * Ist überhaupt ein Ziel gemerkt?
   *
   * Der Unterschied zu `resolve()` ist wichtig: ist ein Ziel gemerkt, das es
   * nicht mehr gibt, wird **nicht** ersatzweise gesucht. Der Creep vergisst es
   * und versucht es im nächsten Tick neu — genau so verhielt sich der Code schon
   * vorher, und es begrenzt die Suchen je Tick.
   */
  get isRemembered() {
    return Boolean(this.memory[this.key]);
  }
  /** Das gemerkte Ziel, oder `null` wenn keines gemerkt ist oder es nicht mehr existiert. */
  resolve() {
    const id = this.memory[this.key];
    if (!id) {
      return null;
    }
    return Game.getObjectById(id);
  }
  /** Merkt das Ziel für die nächsten Ticks. */
  remember(target) {
    this.memory[this.key] = target.id;
  }
  /** Vergisst das Ziel. */
  forget() {
    delete this.memory[this.key];
  }
};
function collectFrom(creep, target, remembered, state2) {
  switch (state2) {
    case ERR_NOT_IN_RANGE:
      moveByMemory(creep, target.pos, 1);
      remembered.remember(target);
      return true;
    case OK:
      remembered.remember(target);
      creep.memory.fromId = target.id;
      return true;
    default:
      remembered.forget();
      return false;
  }
}
function transferTo(creep, target, type) {
  if (!target) {
    return false;
  }
  switch (creep.transfer(target, type)) {
    case ERR_NOT_IN_RANGE:
      moveByMemory(creep, target.pos, 1);
      return true;
    case OK:
      return true;
    default:
      return false;
  }
}
function deliverTo(creep, target, remembered, type) {
  if (!target) {
    remembered.forget();
    return false;
  }
  switch (creep.transfer(target, type)) {
    case ERR_NOT_IN_RANGE:
      moveByMemory(creep, target.pos, 1);
      return true;
    case OK:
      remembered.forget();
      return true;
    default:
      remembered.forget();
      return false;
  }
}
function withdrawFrom(creep, target, type) {
  switch (creep.withdraw(target, type)) {
    case ERR_NOT_IN_RANGE:
      moveByMemory(creep, target.pos, 1);
      return true;
    case OK:
      creep.memory.fromId = target.id;
      return true;
    default:
      return false;
  }
}

// src/creep/transport.ts
function findDeliveryTarget(creep, remembered, types, accepts) {
  if (remembered.isRemembered) {
    const known = remembered.resolve();
    if (known && accepts(known) && known.id != creep.memory.fromId) {
      return known;
    }
    remembered.forget();
  }
  const found = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (structure) => types.includes(structure.structureType) && accepts(structure) && structure.id != creep.memory.fromId
  });
  if (found) {
    remembered.remember(found);
  }
  return found;
}
function TransportToHomeContainer(creep, type, mul) {
  if (!mul) mul = 0.5;
  const remembered = new RememberedTarget(creep.memory, "useContainer");
  const containers = new ContainerList(creep.room.name);
  const minFree = creep.store.getUsedCapacity() * mul;
  const mineralContainerId = bot.room[creep.room.name].mineralContainerId;
  let container = null;
  if (remembered.isRemembered) {
    container = remembered.resolve();
  } else if (containers.hasList) {
    container = containers.nearest(creep, (candidate) => candidate.store.getFreeCapacity(type) > minFree && candidate.id != mineralContainerId && candidate.id != creep.memory.fromId);
    if (container) {
      remembered.remember(container);
    }
  } else if (containers.isRoomKnown) {
    return containers.discover(creep.room);
  }
  if (container && container.store.getFreeCapacity() > 0) {
    switch (creep.transfer(container, type)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, container.pos, 1);
        return true;
      case OK:
        remembered.forget();
        return true;
      default:
        return false;
    }
  }
  remembered.forget();
  return false;
}
function TransportToHomeTerminal(creep) {
  if (!creep.room.controller.my || creep.room.controller.level < 6)
    return false;
  const roomMemory2 = Memory.rooms[creep.memory.workroom];
  var terminal;
  if (roomMemory2.terminalId) {
    terminal = Game.getObjectById(roomMemory2.terminalId);
    if (!terminal) {
      delete roomMemory2.terminalId;
      return false;
    }
  } else {
    var target = creep.room.find(
      FIND_MY_STRUCTURES,
      {
        filter: (structure) => {
          return structure.structureType === STRUCTURE_TERMINAL && structure.store.getFreeCapacity() > 0;
        }
      }
    );
    if (target.length > 0) {
      roomMemory2.terminalId = target[0].id;
      terminal = target[0];
    }
  }
  if (terminal && terminal.store.getFreeCapacity() > 0) {
    var delivered = false;
    for (var resourceType in creep.store) {
      if (resourceType == RESOURCE_ENERGY && terminal.store[RESOURCE_ENERGY] > 1e5)
        continue;
      if (transferTo(creep, terminal, resourceType)) {
        delivered = true;
      }
    }
    return delivered;
  }
  return false;
}
function TransportToHomeLab(creep, type) {
  const remembered = new RememberedTarget(creep.memory, "useLab");
  const target = findDeliveryTarget(creep, remembered, [STRUCTURE_LAB], (structure) => structure.store.getFreeCapacity([type]) > 0);
  return deliverTo(creep, target, remembered, type);
}
function TransportEnergyToHomeSpawn(creep) {
  if (creep.memory.home != creep.room.name || creep.store[RESOURCE_ENERGY] == 0)
    return false;
  const remembered = new RememberedTarget(creep.memory, "useSupply");
  const target = findDeliveryTarget(
    creep,
    remembered,
    [STRUCTURE_SPAWN, STRUCTURE_EXTENSION],
    (structure) => structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 0
  );
  return deliverTo(creep, target, remembered, RESOURCE_ENERGY);
}
function TransportEnergyToHomeTower(creep) {
  if (creep.store[RESOURCE_ENERGY] == 0)
    return false;
  var towers = creep.room.find(
    FIND_MY_STRUCTURES,
    {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 100;
      }
    }
  );
  if (towers.length === 0) {
    return false;
  }
  towers.sort((a, b) => b.store.getFreeCapacity(RESOURCE_ENERGY) - a.store.getFreeCapacity(RESOURCE_ENERGY));
  return transferTo(creep, towers[0], RESOURCE_ENERGY);
}
function TransportToHomeStorage(creep) {
  var target = creep.room.storage;
  if (!target)
    return false;
  if (creep.memory.fromId == target.id)
    return false;
  for (var resourceType in creep.store) {
    transferTo(creep, target, resourceType);
  }
  return true;
}

// src/creep/base.ts
function harvest(creep) {
  if (!creep.memory.harvest)
    return;
  if (harvestRoomRuins(creep, RESOURCE_ENERGY))
    return;
  if (harvestRoomStorage(creep, RESOURCE_ENERGY))
    return;
  if (harvestRoomDrops(creep, RESOURCE_ENERGY))
    return;
  if (harvestRoomTombstones(creep, RESOURCE_ENERGY))
    return;
  if (harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25))
    return;
  if (harvestRoomEnergySource(creep))
    return;
}
function rememberedOrSearched(remembered, search) {
  return remembered.isRemembered ? remembered.resolve() : search();
}
function harvestRoomDrops(creep, type) {
  const remembered = new RememberedTarget(creep.memory, "useRoomDrop");
  const drop = rememberedOrSearched(remembered, () => creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) => d.amount > 100 }));
  if (!drop) {
    remembered.forget();
    return false;
  }
  return collectFrom(creep, drop, remembered, creep.pickup(drop));
}
function harvestRoomTombstones(creep, type) {
  const remembered = new RememberedTarget(creep.memory, "useTombstone");
  const tombstone = rememberedOrSearched(remembered, () => creep.pos.findClosestByPath(
    FIND_TOMBSTONES,
    { filter: (d) => d.store.getUsedCapacity(type) > 100 }
  ));
  if (!tombstone) {
    remembered.forget();
    return false;
  }
  return collectFrom(creep, tombstone, remembered, creep.withdraw(tombstone, type));
}
function harvestCompleteRoomTombstones(creep) {
  const remembered = new RememberedTarget(creep.memory, "useTombstone");
  const tombstone = rememberedOrSearched(remembered, () => creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity() > 100 }));
  if (!tombstone) {
    remembered.forget();
    return false;
  }
  const resourceType = Object.keys(tombstone.store)[0];
  if (resourceType === void 0) {
    remembered.forget();
    return false;
  }
  return collectFrom(
    creep,
    tombstone,
    remembered,
    creep.withdraw(tombstone, resourceType)
  );
}
function harvestRoomRuins(creep, type) {
  const remembered = new RememberedTarget(creep.memory, "useRuin");
  const ruin = rememberedOrSearched(remembered, () => creep.pos.findClosestByPath(
    FIND_RUINS,
    { filter: (d) => d.store.getUsedCapacity(type) > 50 }
  ));
  if (!ruin) {
    remembered.forget();
    return false;
  }
  return collectFrom(creep, ruin, remembered, creep.withdraw(ruin, type));
}
function harvestRoomStorage(creep, type) {
  const storage = creep.room.storage;
  const min = type === "energy" ? creep.store.getCapacity() * 0.5 : 50;
  if (storage && storage.store[type] > min) {
    return withdrawFrom(creep, storage, type);
  }
  return false;
}
function harvestRoomContainer(creep, type, mul) {
  if (!mul) mul = 0.5;
  const remembered = new RememberedTarget(creep.memory, "useContainer");
  const containers = new ContainerList(creep.room.name);
  const minAmount = creep.store.getFreeCapacity() * mul;
  let container = null;
  if (remembered.isRemembered) {
    container = remembered.resolve();
  } else if (containers.hasEntries) {
    container = containers.nearest(
      creep,
      (candidate) => candidate.store.getUsedCapacity(type) > minAmount,
      { forgetListOnStaleId: true }
    );
    if (container) {
      remembered.remember(container);
    }
  } else if (containers.isRoomKnown) {
    return containers.discover(creep.room);
  }
  if (container && container.store.getUsedCapacity(type) > minAmount) {
    if (withdrawFrom(creep, container, type)) {
      return true;
    }
  }
  remembered.forget();
  return false;
}
function harvestControllerLink(creep, type) {
  if (creep.memory.workroom != creep.room.name || !creep.room.controller.my || creep.room.controller.level < 5)
    return false;
  var link = new LinkList(creep.memory.workroom).controllerLink;
  if (link && link.store[type] > 100) {
    return withdrawFrom(creep, link, type);
  }
  creep.memory.noLink = true;
  return false;
}
function harvestMyContainer(creep, type) {
  if (creep.memory.workroom != creep.room.name || creep.memory.container == "")
    return false;
  var container = Game.getObjectById(creep.memory.container);
  if (!container || container.store[type] < 100) {
    return false;
  }
  return withdrawFrom(creep, container, type);
}
function harvestNotfall(creep) {
  var notfall = creep.room.find(FIND_STRUCTURES, { filter: (structure) => {
    return (structure.structureType === STRUCTURE_LINK || structure.structureType === STRUCTURE_LAB || structure.structureType === STRUCTURE_NUKER || structure.structureType == STRUCTURE_TOWER) && structure.store[RESOURCE_ENERGY] > 0;
  } });
  if (notfall.length === 0) {
    return false;
  }
  notfall.sort(function(a, b) {
    return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
  });
  return withdrawFrom(creep, notfall[0], RESOURCE_ENERGY);
}
function harvestRoomEnergySource(creep) {
  if (!canHarvestEnergy(creep)) {
    return false;
  }
  const remembered = new RememberedTarget(creep.memory, "useRoomSource");
  const source = rememberedOrSearched(remembered, () => creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE));
  if (source && source.energy > 100) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      if (creep.moveTo(source) == ERR_NO_PATH) {
        remembered.forget();
        return false;
      }
    }
    remembered.remember(source);
    creep.memory.fromId = source.id;
    return true;
  }
  remembered.forget();
  return false;
}
function canHarvestEnergy(creep) {
  return creep.getActiveBodyparts(WORK) > 0;
}
function calcProfil(creepProfile) {
  let energyCost = 0;
  for (const bodyPart of creepProfile) {
    energyCost += BODYPART_COST[bodyPart];
  }
  return energyCost;
}
function goToMyHome2(creep) {
  return goToMyHome(creep);
}
function goToRoomFlag2(creep) {
  return goToRoomFlag(creep);
}
function goToWorkroom2(creep) {
  return goToWorkroom(creep);
}
function moveByMemory2(creep, target, range) {
  return moveByMemory(creep, target, range);
}
function TransportEnergyToHomeSpawn2(creep) {
  return TransportEnergyToHomeSpawn(creep);
}
function TransportEnergyToHomeTower2(creep) {
  return TransportEnergyToHomeTower(creep);
}
function TransportToHomeTerminal2(creep) {
  return TransportToHomeTerminal(creep);
}
function TransportToHomeStorage2(creep) {
  return TransportToHomeStorage(creep);
}
function TransportToHomeContainer2(creep, type, mul) {
  return TransportToHomeContainer(creep, type, mul);
}
function TransportToHomeLab2(creep, type) {
  return TransportToHomeLab(creep, type);
}
function checkWorkroomPrioSpawn(creep) {
  if (Memory.rooms[creep.memory.workroom].aktivPrioSpawn) {
    if (TransportEnergyToHomeSpawn2(creep)) {
      creep.say("\u{1F6A8}");
      return true;
    }
  }
  return false;
}
function upgradeController(creep) {
  var controller = creep.room.controller;
  if (!controller || !controller.my)
    return;
  const state2 = creep.upgradeController(controller);
  if (state2 === ERR_NOT_IN_RANGE || state2 === ERR_INVALID_TARGET && controller.upgradeBlocked > 0) {
    moveByMemory(creep, controller.pos, 1);
  }
  if (!controller.sign || controller.sign.username == void 0 || controller.sign.username != creep.owner.username) {
    var c = creep.signController(controller, "\u2694");
    if (c === ERR_NOT_IN_RANGE) {
      moveByMemory(creep, controller.pos, 1);
    }
  }
  return state2 == OK;
}
function spawn(spawn3, profil, newName, memory) {
  if (spawn3.spawnCreep(profil, newName, { dryRun: true }) === 0) {
    spawn3.spawnCreep(profil, newName, { memory });
    console.log("[" + spawn3.room.name + "|" + memory.workroom + "] spawn " + newName + " cost: " + calcProfil(profil));
    return true;
  }
  return false;
}

// src/creep/body.ts
var BodyProfile = class {
  constructor(spec) {
    this.spec = spec;
  }
  /** Energiekosten eines Satzes. */
  get setCost() {
    return this.spec.sets.reduce((total, entry) => total + BODYPART_COST[entry.part] * entry.perSet, 0);
  }
  /** Wie viele Sätze `energy` bezahlt, begrenzt durch `maxSets`. */
  setsFor(energy) {
    return Math.min(this.spec.maxSets, Math.floor(energy / this.setCost));
  }
  /** Der Rumpf für `energy`. Nie leer. */
  build(energy) {
    var _a;
    const sets = this.setsFor(energy);
    if (sets <= 0) {
      const fallback = this.spec.fallback;
      return typeof fallback === "function" ? fallback(energy) : [...fallback];
    }
    const body = [];
    for (const entry of this.spec.sets) {
      const count = Math.min(Math.floor(sets * entry.perSet), (_a = entry.max) != null ? _a : Infinity);
      for (let index = 0; index < count; index += 1) {
        body.push(entry.part);
      }
    }
    return body;
  }
};
function carryMove(count) {
  const pairs = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  return [...Array(pairs).fill(CARRY), ...Array(pairs).fill(MOVE)];
}

// src/creep/bodies.ts
var LINK_CARRY_PARTS = Math.ceil(LINK_CAPACITY / CARRY_CAPACITY);
var CLAIMER_BODY = [CLAIM, CLAIM, MOVE, MOVE];
var BODIES = {
  /** Miner: 3 WORK je CARRY, damit die Quelle ausgeschöpft wird. */
  miner: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 2 }
    ],
    maxSets: 8,
    // 2 WORK sättigen die Quelle nicht voll, liefern aber Energie.
    fallback: [WORK, WORK, CARRY, MOVE]
  }),
  builder: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 2 }
    ],
    maxSets: 7,
    fallback: [WORK, CARRY, CARRY, MOVE, MOVE]
  }),
  /** Repairer: derselbe Bausatz wie der Builder, aber höchstens drei Sätze. */
  repairer: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 2 }
    ],
    maxSets: 3,
    fallback: [WORK, CARRY, CARRY, MOVE, MOVE]
  }),
  /** Wallrepairer: ein WORK je Satz, dafür viel Ladung für lange Schichten. */
  wally: new BodyProfile({
    sets: [
      { part: WORK, perSet: 1 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 9,
    fallback: [WORK, CARRY, CARRY, MOVE, MOVE]
  }),
  /** Upgrader bis RCL7: zwei WORK je Satz. */
  upgrader: new BodyProfile({
    sets: [
      { part: WORK, perSet: 2 },
      { part: CARRY, perSet: 2 },
      { part: MOVE, perSet: 2 }
    ],
    maxSets: 8,
    fallback: [WORK, CARRY, MOVE, MOVE]
  }),
  /**
   * Upgrader ab RCL8: **genau** die erlaubte Rate ausschöpfen.
   *
   * Der Controller nimmt dort 15 Energie je Tick an, und `UPGRADE_CONTROLLER_POWER`
   * ist 1 je WORK — also fünf Sätze zu drei WORK. Mehr wäre bezahlte Untätigkeit,
   * weniger verschenkt GCL, und GCL ist die Erlaubnis für den nächsten Raum.
   *
   * Wenige CARRY, weil der Controller-Link in Reichweite 1 steht: 250
   * Tragfähigkeit reichen für rund siebzehn Ticks Arbeit. Wenige MOVE, weil der
   * Creep nach der Anreise steht — das Vorgängerprofil trug 18 CARRY und 18 MOVE
   * für eine Aufgabe, die 15 Energie je Tick verbraucht.
   *
   * Kosten 2000 Energie bei 25 Teilen; die Energiekapazität eines RCL8-Raums
   * liegt bei 12 900, der Rückfall greift dort also nie.
   */
  upgraderRcl8: new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 5,
    fallback: [WORK, CARRY, MOVE]
  }),
  /** Extupgrader in einem Raum ohne Sicht oder unter RCL6. */
  extupgrader: new BodyProfile({
    sets: [
      { part: WORK, perSet: 2 },
      { part: CARRY, perSet: 2, max: 16 },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 9,
    fallback: [WORK, CARRY, MOVE, MOVE]
  }),
  /** Extupgrader ab RCL6 des Arbeitsraums: ein WORK je Satz reicht. */
  extupgraderRcl6: new BodyProfile({
    sets: [
      { part: WORK, perSet: 1 },
      { part: CARRY, perSet: 2, max: 16 },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 9,
    fallback: [WORK, CARRY, MOVE, MOVE]
  }),
  /**
   * Defender. Rechnet mit `energyAvailable` statt `energyCapacityAvailable` —
   * er soll sofort losgehen, nicht auf gefüllte Extensions warten.
   */
  defender: new BodyProfile({
    sets: [
      { part: TOUGH, perSet: 1 },
      { part: MOVE, perSet: 2 },
      { part: ATTACK, perSet: 1 },
      { part: RANGED_ATTACK, perSet: 1 }
    ],
    maxSets: 5,
    fallback: [MOVE, MOVE, ATTACK, RANGED_ATTACK]
  }),
  /** Transfer: reiner Träger zwischen zwei Räumen, ein MOVE je CARRY. */
  transfer: new BodyProfile({
    sets: [
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 25,
    fallback: [CARRY, MOVE]
  }),
  /** Debitor im Heimatraum. */
  debitor: new BodyProfile({
    sets: [
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 25,
    fallback: [CARRY, MOVE]
  }),
  /** Debitor ohne zugeordneten Container — kleiner, weil er mehr läuft. */
  debitorWithoutContainer: new BodyProfile({
    sets: [
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 20,
    fallback: [CARRY, MOVE]
  }),
  /**
   * Linkkeeper: genau ein Satz — der ganze Link in einem Zug, dazu ein einziges
   * MOVE, weil der Creep nach der Anreise dauerhaft still steht. Links gibt es
   * erst ab RCL5, das Vollprofil passt dort praktisch immer.
   */
  linkkeeper: new BodyProfile({
    sets: [
      { part: CARRY, perSet: LINK_CARRY_PARTS },
      { part: MOVE, perSet: 1 }
    ],
    maxSets: 1,
    // Rückfall: so viele CARRY wie neben dem MOVE hineinpassen, mindestens eines.
    fallback: (energy) => {
      const affordable = Math.max(
        1,
        Math.floor((energy - BODYPART_COST[MOVE]) / BODYPART_COST[CARRY])
      );
      return [...Array(affordable).fill(CARRY), MOVE];
    }
  })
};

// src/roles/builder.ts
var role = "builder";
var Builder = class {
  /** Sammelt bei Bedarf Energie, baut sonst die Baustelle mit der höchsten Priorität oder upgradet den Controller. */
  doJob(creep) {
    creep.checkHarvest();
    if (goToWorkroom2(creep)) return;
    if (creep.memory.harvest) {
      creep.memory.repId = null;
      harvest(creep);
      if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity()) {
        creep.memory.harvest = false;
      }
      return;
    }
    if (creep.checkInvasion()) return;
    if (goToWorkroom2(creep)) return;
    if (checkWorkroomPrioSpawn(creep)) return;
    if (this._build(creep)) return;
    upgradeController(creep);
  }
  _getPriority(structureType) {
    return bot.prio.build[structureType] || 99;
  }
  _build(creep) {
    if (!creep.memory.id) {
      let structuresToBuild = creep.room.find(FIND_CONSTRUCTION_SITES);
      if (structuresToBuild.length > 0) {
        var structs = structuresToBuild.map((site) => ({
          site,
          progress: site.progress,
          priority: this._getPriority(site.structureType)
        })).sort((a, b) => {
          if (a.priority === b.priority) {
            return b.progress - a.progress;
          }
          return a.priority - b.priority;
        });
        creep.memory.id = structs[0].site.id;
        return true;
      }
    } else {
      let target = Game.getObjectById(creep.memory.id);
      if (target && target.progressTotal != void 0) {
        let state2 = creep.build(target);
        if (state2 === ERR_NOT_IN_RANGE) {
          moveByMemory(creep, target.pos);
        }
        return true;
      } else {
        creep.memory.id = null;
      }
    }
    return false;
  }
  /** Spawnt einen Builder für `workroom`, falls Bedarf, Baustellen und freie Kapazität es erlauben. */
  spawn(spawn3, workroom) {
    var maxbuilder = bot.room[workroom].maxbuilder;
    if (!bot.room[workroom].sendBuilder || maxbuilder < 1)
      return false;
    if (spawn3.room.name != workroom && !Memory.rooms[workroom].claimed && !bot.room[workroom].claim)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom).length;
    if (count == void 0)
      count = 0;
    if (maxbuilder <= count)
      return false;
    var room = Game.rooms[workroom];
    var sites = 0;
    if (room)
      sites = room.find(FIND_CONSTRUCTION_SITES).length;
    if (sites == 0 || Math.max(sites / 5, 1) <= count)
      return false;
    return spawn(spawn3, BODIES.builder.build(spawn3.room.energyCapacityAvailable), role + "_" + Game.time, { role, workroom, home: spawn3.room.name });
  }
};
Builder = __decorateClass([
  profile
], Builder);
var builder_default = new Builder();

// src/roles/claimer.ts
var role2 = "claimer";
var Claimer = class {
  /** Bewegt den Creep in den Arbeitsraum und claimt bzw. reserviert dessen Controller. */
  doJob(creep) {
    if (goToWorkroom2(creep)) return;
    var room = Game.rooms[creep.memory.workroom];
    if (!room)
      return;
    var controller = room.controller;
    var claim = bot.room[creep.memory.workroom].claim;
    if (controller) {
      if (claim) {
        var s = creep.claimController(controller);
        if (s === ERR_NOT_IN_RANGE) {
          moveByMemory2(creep, controller.pos, 1);
        }
        if (s === OK) {
          Memory.rooms[creep.memory.workroom].claimed = true;
        }
        return;
      }
      var state2 = creep.reserveController(controller);
      if (state2 === ERR_NOT_IN_RANGE) {
        moveByMemory2(creep, controller.pos, 1);
      } else if (state2 == ERR_INVALID_TARGET) {
        creep.say("\u{1FA93}");
        creep.attackController(controller);
        Memory.rooms[creep.memory.workroom].claimed = false;
      } else if (state2 == OK) {
        Memory.rooms[creep.memory.workroom].claimed = true;
      }
      if (controller.sign.username != creep.owner.username) {
        creep.signController(controller, "\u2694");
      }
    }
  }
  /** Spawnt einen Claimer für `workroom`, falls Bedarf besteht und keiner unterwegs ist. */
  spawn(spawn3, workroom) {
    if (!bot.room[workroom].sendClaimer)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role2 && creep.memory.workroom == workroom && (creep.ticksToLive > 100 || creep.spawning)).length;
    var room = Game.rooms[workroom];
    if (room && room.controller && room.controller.sign && (room.controller.sign.username == spawn3.owner.username || room.controller.sign.username == "Screeps") && room.controller.reservation && room.controller.reservation.ticksToEnd > 3e3)
      return false;
    if (1 <= count)
      return false;
    return spawn(spawn3, CLAIMER_BODY, role2 + "_" + Game.time, { role: role2, workroom, home: spawn3.room.name });
  }
};
Claimer = __decorateClass([
  profile
], Claimer);
var claimer_default = new Claimer();

// src/creep/round-trip.ts
var RoundTrip = class {
  constructor(workroom, keys) {
    this.workroom = workroom;
    this.keys = keys;
  }
  /** Ob die Größe bereits festgeschrieben ist — ab dann werden keine neuen Messwerte mehr aufgenommen. */
  get isFixed() {
    return !!Memory.rooms[this.workroom][this.keys.size];
  }
  /** Die festgeschriebene Tragfähigkeit (CARRY-Paare), falls schon bekannt. */
  get size() {
    return Memory.rooms[this.workroom][this.keys.size];
  }
  /** Die zuletzt abgeleitete bzw. festgeschriebene Creepzahl, falls schon bekannt. */
  get count() {
    return Memory.rooms[this.workroom][this.keys.count];
  }
  /**
   * Nimmt eine gemessene Umlaufstrecke (ein Weg, nicht der ganze Umlauf) auf,
   * solange die Größe noch nicht feststeht. Liefert `true`, wenn der Wert
   * gespeichert wurde — der Aufrufer setzt dann sein eigenes
   * `creep.memory.distance` zurück auf 0 (das gehört dem Creep, nicht dieser
   * Klasse).
   */
  record(distance) {
    if (this.isFixed)
      return false;
    if (!(distance > 0))
      return false;
    const room = Memory.rooms[this.workroom];
    if (!room[this.keys.samples])
      room[this.keys.samples] = [];
    room[this.keys.samples].push(distance);
    return true;
  }
  /**
   * Leitet aus den gesammelten Strecken die nötige Tragfähigkeit (CARRY-Paare
   * je Creep) ab. `maxSetsForEnergy` ist die maximal bezahlbare Satzzahl bei
   * der verfügbaren Energie (heute `BODIES.debitor.setsFor(...)`) — reicht ein
   * Creep für die errechnete Tragfähigkeit nicht, wird die Creepzahl
   * (`count`) erhöht und die Tragfähigkeit entsprechend geteilt.
   *
   * Ist die Größe schon festgeschrieben, wird nur ihr Wert zurückgegeben.
   * Stehen weder Festschreibung noch Messwerte zur Verfügung, liefert die
   * Methode `undefined`.
   */
  carryFor(maxSetsForEnergy) {
    const room = Memory.rooms[this.workroom];
    let carry = room[this.keys.size];
    const distances = room[this.keys.samples];
    if (!carry && distances) {
      const length = Math.ceil(distances.length * 0.5);
      const median = distances.sort(function(a, b) {
        return a - b;
      })[length];
      carry = Math.ceil(2 * median / 5);
      if (maxSetsForEnergy >= carry) {
        room[this.keys.count] = 1;
      } else {
        const count = room[this.keys.count] = Math.ceil(carry / maxSetsForEnergy);
        carry = Math.ceil(carry / count);
      }
      if (length > 30) {
        room[this.keys.size] = carry;
        delete room[this.keys.samples];
      }
    }
    return carry;
  }
};

// src/roles/debitor.ts
var role3 = "debitor";
var ROUND_TRIP_KEYS = { samples: "distances", size: "needDebitorSize", count: "needDebitors" };
var NEVER_SELL = {
  "energy": true,
  "power": true,
  "pixel": true,
  "XUH2O": true,
  "XUHO2": true,
  "XKHO2": true,
  "XKH2O": true,
  "XZH2O": true,
  "XZHO2": true,
  "XLH2O": true,
  "XLHO2": true,
  "XGH2O": true,
  "XGHO2": true
};
var Debitor = class {
  /** Holt Energie/Mineralien aus dem Arbeitsraum und transportiert sie in den Heimatraum. */
  doJob(creep) {
    if (!creep.memory.mineral)
      creep.memory.mineral = RESOURCE_ENERGY;
    creep.checkHarvest(
      () => this.recordRoundTrip(creep),
      () => {
        creep.memory.mineral = RESOURCE_ENERGY;
        this.recordRoundTrip(creep);
      }
    );
    if (creep.memory.home != creep.memory.workroom)
      creep.memory.distance = creep.memory.distance + 1;
    if (creep.checkInvasion()) {
      if (creep.room.name == creep.memory.workroom) {
        if (creep.memory.harvest) {
          if (harvestRoomStorage(creep, creep.memory.mineral)) return;
          if (harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
        } else {
          if (TransportEnergyToHomeTower2(creep)) return;
        }
        return;
      }
      return;
    }
    ;
    if (creep.memory.notfall) {
      if (creep.memory.harvest) {
        if (harvestControllerLink(creep, creep.memory.mineral)) return;
        if (harvestRoomStorage(creep, creep.memory.mineral)) return;
        if (harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
        if (harvestNotfall(creep)) return;
        if (creep.room.energyAvailable < 1e3 && creep.store.getUsedCapacity() > 0) {
          creep.memory.harvest = false;
        }
      } else {
        if (TransportEnergyToHomeSpawn2(creep)) return;
        if (TransportEnergyToHomeTower2(creep)) return;
      }
      return;
    }
    if (creep.memory.harvest) {
      if (goToWorkroom2(creep)) return;
      if (harvestCompleteRoomTombstones(creep)) return;
      if (harvestRoomDrops(creep, creep.memory.mineral)) return;
      if (harvestRoomRuins(creep, creep.memory.mineral)) return;
      if (harvestMyContainer(creep, creep.memory.mineral)) return;
      const storage = creep.room.storage;
      const terminal = creep.room.terminal;
      if (storage && terminal && terminal.store.getFreeCapacity() > 5e4) {
        const resources = Object.keys(storage.store).filter(
          (r) => storage.store[r] > 100 && !NEVER_SELL[r]
        ).filter((f) => f != "energy");
        if (resources.length > 0) {
          const resource = resources[0];
          creep.memory.mineral = resource;
          if (harvestRoomStorage(creep, resource)) return;
        }
      }
      if (creep.memory.container == "" && creep.room.name == creep.memory.workroom) {
        if (creep.room.energyAvailable >= creep.room.energyCapacityAvailable * 0.99) {
          if (harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
          if (harvestRoomStorage(creep, creep.memory.mineral)) return;
        } else {
          if (harvestRoomStorage(creep, creep.memory.mineral)) return;
          if (harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
        }
        if (creep.room.energyAvailable < 1e3 && creep.store.getUsedCapacity() > 0) {
          creep.memory.harvest = false;
        }
      } else {
        if (harvestRoomStorage(creep, creep.memory.mineral)) return;
        if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity()) {
          creep.memory.harvest = false;
        }
      }
      if (goToRoomFlag2(creep)) return;
      return;
    }
    if (goToMyHome2(creep)) return;
    if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      if (TransportToHomeTerminal2(creep)) return;
      if (TransportToHomeStorage2(creep)) return;
    } else if (creep.memory.home == creep.memory.workroom) {
      if (TransportEnergyToHomeSpawn2(creep)) return;
      if (TransportEnergyToHomeTower2(creep)) return;
      if (TransportToHomeTerminal2(creep)) return;
      if (TransportToHomeStorage2(creep)) return;
      if (TransportToHomeLab2(creep, RESOURCE_ENERGY)) return;
    } else {
      if (TransportToHomeTerminal2(creep)) return;
      if (TransportToHomeStorage2(creep)) return;
      if (TransportEnergyToHomeSpawn2(creep)) return;
      if (TransportEnergyToHomeTower2(creep)) return;
      if (TransportToHomeLab2(creep, RESOURCE_ENERGY)) return;
    }
    return;
  }
  /**
   * Nimmt für `checkHarvest` eine Streckenmessung auf, solange die
   * Umlaufgröße für den Arbeitsraum noch nicht feststeht. Kein Effekt, wenn
   * Arbeits- und Heimatraum identisch sind (kein Remote-Umlauf).
   */
  recordRoundTrip(creep) {
    if (creep.memory.home == creep.memory.workroom)
      return;
    const roundTrip = new RoundTrip(creep.memory.workroom, ROUND_TRIP_KEYS);
    if (roundTrip.record(creep.memory.distance)) {
      creep.memory.distance = 0;
    }
  }
  /**
   *
   * @param {StructureSpawn} spawn
   */
  bodyFor(spawn3, workroom, mineraltype, containerId) {
    if (mineraltype != RESOURCE_ENERGY) {
      return carryMove(2);
    }
    if (spawn3.room.name != workroom) {
      const roundTrip = new RoundTrip(workroom, ROUND_TRIP_KEYS);
      const maxSetsForEnergy = BODIES.debitor.setsFor(spawn3.room.energyCapacityAvailable);
      const carry = roundTrip.carryFor(maxSetsForEnergy);
      return carryMove(carry);
    }
    if (containerId == "") {
      return BODIES.debitorWithoutContainer.build(spawn3.room.energyCapacityAvailable);
    }
    return BODIES.debitor.build(spawn3.room.energyCapacityAvailable);
  }
  /** Spawnt einen Debitor für `workroom`, falls Bedarf besteht (inklusive Freelancer- und Notfallmodus). */
  spawn(spawn3, workroom) {
    if (bot.room[workroom].transferEnergie && spawn3.room.name != workroom || spawn3.room.name != workroom && !Memory.rooms[workroom].claimed)
      return false;
    if (spawn3.room.name == workroom && spawn3.room.storage)
      return false;
    if (bot.room[workroom].sendDebitor && bot.room[workroom].sendMiner && (!Memory.rooms[workroom].hasLinks || !linksDeliver(workroom))) {
      for (const sourceId of energySources(workroom)) {
        if (!Game.getObjectById(sourceId))
          continue;
        if (this._spawn(spawn3, workroom, sourceId, RESOURCE_ENERGY))
          return true;
      }
    } else if (bot.room[workroom].sendFreeDebitor) {
      if (this._spawn(spawn3, workroom, "", RESOURCE_ENERGY))
        return true;
    }
    return false;
  }
  /**
   *
   * @param {StructureSpawn} spawn
   * @param {String} workroom
   * @param {String} container
   * @param {String} mineraltype
   */
  _spawn(spawn3, workroom, source, mineraltype) {
    bot.logWorkroom(workroom, "here");
    let containerId = "";
    if (source != "") {
      var source = Game.getObjectById(source);
      let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: { structureType: STRUCTURE_CONTAINER }
      });
      if (container.length == 0)
        return false;
      containerId = container[0].id;
      var count = _.filter(
        Game.creeps,
        (creep) => creep.memory.role == role3 && creep.memory.workroom == workroom && creep.memory.container == containerId && !creep.memory.notfall && (creep.ticksToLive > 100 || creep.spawning)
      ).length;
      if (!Memory.rooms[workroom].needDebitors)
        Memory.rooms[workroom].needDebitors = 1;
      if (Memory.rooms[workroom].needDebitors <= count)
        return false;
      let link = container[0].pos.findInRange(FIND_STRUCTURES, 1, {
        filter: { structureType: STRUCTURE_LINK }
      });
      if (link.length > 0) {
        Memory.rooms[workroom].hasLinks = true;
        if (linksDeliver(workroom))
          return false;
      }
    } else {
      bot.logWorkroom(workroom, "2");
      var count = _.filter(
        Game.creeps,
        (creep) => creep.memory.role == role3 && creep.memory.workroom == workroom && creep.memory.container == "" && !creep.memory.notfall && (creep.ticksToLive > 100 || creep.spawning)
      ).length;
      if (bot.room[workroom].debitorAsFreelancer <= count)
        return false;
      bot.logWorkroom(workroom, "3");
      containerId = "";
    }
    var profil = this.bodyFor(spawn3, workroom, mineraltype, containerId);
    bot.logWorkroom(workroom, "4");
    if (!spawn(spawn3, profil, role3 + "_" + Game.time, { role: role3, harvest: true, workroom, home: spawn3.room.name, mineral: mineraltype, container: containerId, notfall: false, distance: 0 })) {
      if (_.filter(Game.creeps, (creep) => creep.memory.role == role3 && creep.memory.workroom == workroom).length == 0 && spawn3.room.name == workroom) {
        console.log("[" + spawn3.room.name + "|" + workroom + "]Notfallspawn Debitor");
        var min = Math.min(Math.max(parseInt(spawn3.room.energyAvailable / 100), 1), 16);
        profil = Array(min).fill(CARRY).concat(Array(min).fill(MOVE));
        mineraltype = RESOURCE_ENERGY;
        return spawn(spawn3, profil, role3 + "_" + Game.time, { role: role3, harvest: true, workroom, home: spawn3.room.name, mineral: mineraltype, container: "", notfall: true });
      }
      return false;
    }
    return true;
  }
};
Debitor = __decorateClass([
  profile
], Debitor);
var debitor_default = new Debitor();

// src/roles/defender.ts
var role4 = "defender";
var Defender = class {
  /** Bewegt den Creep in den Arbeitsraum und greift Feinde bzw. markierte Ziele an. */
  doJob(creep) {
    if (goToWorkroom2(creep)) return;
    if (this._defend(creep)) return;
  }
  _defend(creep) {
    var _a;
    if (creep.room.name != creep.memory.workroom)
      return false;
    if (creep.memory.attackId) {
      var target = Game.getObjectById(creep.memory.attackId);
      if (target) {
        var result = creep.attack(target);
        creep.rangedAttack(target);
        if (result === OK) {
          var name = target.name ? target.name : target.structureType;
          console.log(`[${creep.memory.workroom}] ${creep.name} greift ${name} an.`);
        } else {
          creep.say("\u270A");
          creep.moveTo(target, { reusePath: 5 });
        }
      } else {
        delete creep.memory.attackId;
      }
    } else if (Memory.rooms[creep.memory.workroom].needDefence) {
      var enemies = creep.room.find(FIND_HOSTILE_CREEPS);
      if (enemies.length > 0) {
        enemies.sort(function(a, b) {
          var costA = a.body.reduce(function(total, part) {
            return total + BODYPART_COST[part.type];
          }, 0);
          var costB = b.body.reduce(function(total, part) {
            return total + BODYPART_COST[part.type];
          }, 0);
          return costB - costA;
        });
        creep.memory.attackId = enemies[0].id;
        return true;
      } else {
        Memory.rooms[creep.memory.workroom].needDefence = false;
      }
    } else if (Memory.rooms[creep.memory.workroom].invaderCore) {
      var core = creep.room.find(FIND_HOSTILE_STRUCTURES, { filter: (s2) => s2.structureType == STRUCTURE_INVADER_CORE });
      if (core.length > 0) {
        creep.memory.attackId = core[0].id;
        return true;
      } else {
        Memory.rooms[creep.memory.workroom].invaderCore = false;
      }
    } else if (bot.room[creep.memory.workroom].destroy && !Memory.rooms[creep.memory.workroom].destroyDone) {
      for (var s of bot.room[creep.memory.workroom].destroy) {
        var target = Game.getObjectById(s);
        if (target && target.hits > 0) {
          creep.memory.attackId = target.id;
          return;
        }
      }
      var walls = creep.room.find(FIND_STRUCTURES, { filter: (s2) => s2.structureType == STRUCTURE_WALL });
      if (walls.length > 0) {
        creep.memory.attackId = walls[0].id;
      } else {
        Memory.rooms[creep.memory.workroom].destroyDone = true;
      }
    } else {
      for (var room in bot.room) {
        if (bot.room[room].destroy && !((_a = Memory.rooms[room]) == null ? void 0 : _a.destroyDone)) {
          creep.memory.workroom = room;
          break;
        }
      }
    }
    if (creep.getActiveBodyparts(ATTACK) + creep.getActiveBodyparts(RANGED_ATTACK) == 0) {
      creep.say("\u{1F4A5} Bye!");
      creep.suicide();
    }
  }
  /** Spawnt einen Defender für `workroom`, falls Verteidigungsbedarf besteht und das Limit nicht erreicht ist. */
  spawn(spawn3, workroom) {
    if (!Memory.rooms[workroom].needDefence && !Memory.rooms[workroom].invaderCore || !bot.room[workroom].sendDefender)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role4 && creep.memory.workroom == workroom).length;
    if (Memory.rooms[workroom].needDefence && 2 <= count || Memory.rooms[workroom].invaderCore && 4 <= count)
      return false;
    if (spawn(spawn3, BODIES.defender.build(spawn3.room.energyAvailable), role4 + "_" + Game.time, { role: role4, workroom, home: spawn3.room.name })) {
      Memory.cOfDefender += 1;
      return true;
    }
    return false;
  }
};
Defender = __decorateClass([
  profile
], Defender);
var defender_default = new Defender();

// src/roles/extupgrader.ts
var role5 = "extupgrader";
var ExtUpgrader = class {
  /** Beschafft Energie aus Link/Storage/Container/Quelle und upgradet damit den Controller. */
  doJob(creep) {
    if (goToWorkroom2(creep)) return;
    creep.checkHarvest();
    if (creep.memory.harvest) {
      if (harvestControllerLink(creep, RESOURCE_ENERGY)) return;
      if (harvestRoomStorage(creep, RESOURCE_ENERGY)) return;
      if (harvestRoomContainer(creep, RESOURCE_ENERGY)) return;
      if (harvestRoomEnergySource(creep)) return;
    }
    upgradeController(creep);
  }
  /**
   * Ab RCL6 des Arbeitsraums reicht ein WORK je Satz. Ohne Sicht dort gilt das
   * größere Profil — dann ist der Ausbaustand unbekannt.
   */
  bodyFor(spawn3, workroom) {
    const rcl6 = Game.rooms[workroom] && Game.rooms[workroom].controller.level >= 6;
    const profil = rcl6 ? BODIES.extupgraderRcl6 : BODIES.extupgrader;
    return profil.build(spawn3.room.energyCapacityAvailable);
  }
  /** Spawnt einen Extupgrader für `workroom`, falls Bedarf besteht und noch nicht genug unterwegs sind. */
  spawn(spawn3, workroom) {
    if (spawn3.room.name == workroom)
      return false;
    var uppis = bot.room[workroom].upgrader;
    if (!uppis || uppis < 1)
      return false;
    var count = _.filter(
      Game.creeps,
      (creep) => creep.memory.role == role5 && creep.memory.workroom == workroom && (creep.ticksToLive > 300 || creep.spawning)
    ).length;
    if (uppis <= count)
      return false;
    var profil = this.bodyFor(spawn3, workroom);
    return spawn(spawn3, profil, role5 + "_" + Game.time, { role: role5, workroom, home: spawn3.room.name, repairs: 0 });
  }
};
ExtUpgrader = __decorateClass([
  profile
], ExtUpgrader);
var extupgrader_default = new ExtUpgrader();

// src/roles/filler.ts
var role6 = "filler";
var Filler = class {
  /** Holt Energie aus dem Storage (Rückfall: Quellcontainer) und verteilt sie an Spawn und Türme. */
  doJob(creep) {
    creep.checkHarvest();
    if (creep.memory.harvest) {
      if (harvestRoomStorage(creep, RESOURCE_ENERGY)) return;
      if (harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25)) return;
      return;
    }
    if (TransportEnergyToHomeSpawn2(creep)) return;
    if (TransportEnergyToHomeTower2(creep)) return;
  }
  /** Spawnt Filler für `workroom`, solange dort ein Storage steht und Logistik gewünscht ist. */
  spawn(spawn3, workroom) {
    var _a;
    if (spawn3.room.name != workroom)
      return false;
    if (!bot.room[workroom].sendDebitor)
      return false;
    if (!spawn3.room.storage)
      return false;
    const wanted = Math.max(1, (_a = bot.room[workroom].debitorAsFreelancer) != null ? _a : 0);
    const count = _.filter(
      Game.creeps,
      (creep) => creep.memory.role == role6 && creep.memory.workroom == workroom && (creep.ticksToLive > 100 || creep.spawning)
    ).length;
    if (count >= wanted)
      return false;
    const profil = BODIES.debitorWithoutContainer.build(spawn3.room.energyCapacityAvailable);
    if (spawn(spawn3, profil, role6 + "_" + Game.time, { role: role6, harvest: true, workroom, home: spawn3.room.name, mineral: RESOURCE_ENERGY, container: "", notfall: false }))
      return true;
    if (_.filter(Game.creeps, (creep) => creep.memory.role == role6 && creep.memory.workroom == workroom).length == 0) {
      console.log("[" + spawn3.room.name + "|" + workroom + "]Notfallspawn Filler");
      const min = Math.min(Math.max(parseInt(spawn3.room.energyAvailable / 100), 1), 16);
      const notfallProfil = Array(min).fill(CARRY).concat(Array(min).fill(MOVE));
      return spawn(spawn3, notfallProfil, role6 + "_" + Game.time, { role: role6, harvest: true, workroom, home: spawn3.room.name, mineral: RESOURCE_ENERGY, container: "", notfall: false });
    }
    return false;
  }
};
Filler = __decorateClass([
  profile
], Filler);
var filler_default = new Filler();

// src/roles/hauler.ts
var role7 = "hauler";
var Hauler = class {
  /** Holt Energie aus dem Quellcontainer und bringt sie ins Storage des Heimatraums. */
  doJob(creep) {
    creep.checkHarvest();
    if (creep.memory.harvest) {
      if (harvestMyContainer(creep, RESOURCE_ENERGY)) return;
      return;
    }
    if (checkWorkroomPrioSpawn(creep)) return;
    if (TransportToHomeStorage2(creep)) return;
  }
  /** Spawnt einen Hauler für einen Quellcontainer des eigenen Raums, falls Bedarf besteht. */
  spawn(spawn3, workroom) {
    if (spawn3.room.name != workroom)
      return false;
    if (!bot.room[workroom].sendDebitor || !bot.room[workroom].sendMiner)
      return false;
    if (!spawn3.room.storage)
      return false;
    for (const sourceId of energySources(workroom)) {
      const source = Game.getObjectById(sourceId);
      if (!source)
        continue;
      if (this._spawn(spawn3, workroom, source))
        return true;
    }
    return false;
  }
  _spawn(spawn3, workroom, source) {
    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: { structureType: STRUCTURE_CONTAINER }
    });
    if (container.length == 0)
      return false;
    const containerId = container[0].id;
    const count = _.filter(
      Game.creeps,
      (creep) => creep.memory.role == role7 && creep.memory.workroom == workroom && creep.memory.container == containerId && (creep.ticksToLive > 100 || creep.spawning)
    ).length;
    if (1 <= count)
      return false;
    const link = container[0].pos.findInRange(FIND_STRUCTURES, 1, {
      filter: { structureType: STRUCTURE_LINK }
    });
    if (link.length > 0) {
      Memory.rooms[workroom].hasLinks = true;
      if (linksDeliver(workroom))
        return false;
    }
    return spawn(spawn3, BODIES.debitor.build(spawn3.room.energyCapacityAvailable), role7 + "_" + Game.time, {
      role: role7,
      harvest: true,
      workroom,
      home: spawn3.room.name,
      mineral: RESOURCE_ENERGY,
      container: containerId,
      notfall: false
    });
  }
};
Hauler = __decorateClass([
  profile
], Hauler);
var hauler_default = new Hauler();

// src/roles/linkkeeper.ts
var role8 = "linkkeeper";
var blockingStructureTypes2 = OBSTACLE_OBJECT_TYPES;
var LinkKeeper = class {
  /** Bewegt den Creep auf seinen Standplatz zwischen Link und Storage und pendelt dort Energie um. */
  doJob(creep) {
    if (goToWorkroom2(creep)) return;
    if (!creep.memory.post) {
      const storage2 = creep.room.storage;
      const link2 = storage2 ? new LinkList(creep.memory.workroom).spawnLink : null;
      const post2 = link2 && storage2 ? this._findPost(link2, storage2, creep.memory.workroom) : null;
      if (!post2) {
        creep.say("\u2753");
        return;
      }
      creep.memory.post = { x: post2.x, y: post2.y };
    }
    const post = new RoomPosition(creep.memory.post.x, creep.memory.post.y, creep.memory.workroom);
    if (!creep.pos.isEqualTo(post)) {
      moveByMemory2(creep, post);
      return;
    }
    const storage = creep.room.storage;
    if (!storage) return;
    const link = new LinkList(creep.memory.workroom).spawnLink;
    if (!link) return;
    const carrying = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    const inLink = link.store.getUsedCapacity(RESOURCE_ENERGY);
    if (needsStorageFeed(creep.memory.workroom)) {
      if (carrying > 0) creep.transfer(link, RESOURCE_ENERGY);
      else creep.withdraw(storage, RESOURCE_ENERGY);
      return;
    }
    if (carrying === 0 && inLink === 0) return;
    if (carrying > 0) creep.transfer(storage, RESOURCE_ENERGY);
    if (inLink > 0) creep.withdraw(link, RESOURCE_ENERGY);
  }
  /**
   * Sucht das einzige Feld, das an Link und Storage zugleich angrenzt.
   * Das Ergebnis landet im Creep-Memory und wird deshalb nur einmal je
   * Creep berechnet.
   */
  _findPost(link, storage, roomName) {
    const terrain = Game.rooms[roomName].getTerrain();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = link.pos.x + dx;
        const y = link.pos.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        const pos = new RoomPosition(x, y, roomName);
        if (!pos.isNearTo(storage.pos)) continue;
        if ((terrain.get(x, y) & TERRAIN_MASK_WALL) !== 0) continue;
        const blocked = pos.lookFor(LOOK_STRUCTURES).some((s) => blockingStructureTypes2.includes(s.structureType)) || pos.lookFor(LOOK_CONSTRUCTION_SITES).some((s) => blockingStructureTypes2.includes(s.structureType));
        if (blocked) continue;
        return pos;
      }
    }
    return null;
  }
  /** Spawnt den einzigen Linkkeeper für `workroom`, falls Links dort genutzt werden und noch keiner lebt. */
  spawn(spawn3, workroom) {
    if (!bot.room[workroom].sendLinkkeeper)
      return false;
    if (!usesLinks(workroom) || !new LinkList(workroom).spawnLink)
      return false;
    if (spawn3.room.name != workroom)
      return false;
    if (!spawn3.room.storage)
      return false;
    if (_.filter(Game.creeps, (creep) => creep.memory.role == role8 && creep.memory.workroom == workroom).length >= 1)
      return false;
    return spawn(spawn3, BODIES.linkkeeper.build(spawn3.room.energyCapacityAvailable), role8 + "_" + Game.time, { role: role8, workroom, home: spawn3.room.name });
  }
};
LinkKeeper = __decorateClass([
  profile
], LinkKeeper);
var linkkeeper_default = new LinkKeeper();

// src/roles/miner.ts
var role9 = "miner";
var Miner = class {
  _clearMemory(creep) {
    delete creep.memory.pos;
    delete creep.memory._move;
    new PathMemory(creep.memory).clear();
  }
  /** Bewegt den Miner zur Quelle, baut/repariert dort Container bzw. Link und erntet. */
  doJob(creep) {
    var _a;
    if (creep.memory.notfall) {
      var replacement = _.find(Game.creeps, (c) => c.name != creep.name && c.memory.role == role9 && c.memory.workroom == creep.memory.workroom && c.memory.source == creep.memory.source && !c.memory.notfall && !c.spawning);
      if (replacement) {
        bot.logWorkroom(creep.memory.workroom, "Notfallminer " + creep.name + " durch " + replacement.name + " ersetzt, beende mich.");
        creep.suicide();
        return;
      }
    }
    if (creep.body.length > 30 && creep.memory.onPosition && Game.time % 2 == 1) return;
    if (!creep.memory.onPosition) {
      if (goToWorkroom2(creep)) return;
      let finalLocation;
      if (!creep.memory.pos) {
        var source = Game.getObjectById(creep.memory.source);
        let container2 = source.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: { structureType: STRUCTURE_CONTAINER }
        })[0];
        if (container2) {
          finalLocation = container2.pos;
          creep.memory.pos = container2.pos;
          creep.memory.container = container2.id;
        } else {
          let build2 = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
            filter: { structureType: STRUCTURE_CONTAINER }
          })[0];
          if (build2) {
            finalLocation = build2.pos;
            creep.memory.pos = build2.pos;
            creep.memory.container = build2.id;
          } else {
            var sourcePos = source.pos;
            var adjacentSpots = [];
            for (let xOffset = -1; xOffset <= 1; xOffset++) {
              for (let yOffset = -1; yOffset <= 1; yOffset++) {
                if (xOffset === 0 && yOffset === 0) {
                  continue;
                }
                var x = sourcePos.x + xOffset;
                var y = sourcePos.y + yOffset;
                adjacentSpots.push(new RoomPosition(x, y, creep.memory.workroom));
              }
            }
            for (var spot of adjacentSpots) {
              var state2 = spot.createConstructionSite(STRUCTURE_CONTAINER);
              if (state2 === OK) {
                return;
              }
              if (state2 === ERR_FULL) {
                break;
              }
              creep.say(state2);
            }
            creep.memory.pos = adjacentSpots.find(
              (p) => p.lookFor(LOOK_TERRAIN)[0] !== "wall"
            );
            return;
          }
        }
      } else {
        finalLocation = creep.memory.pos;
      }
      if (creep.pos.x == creep.memory.pos.x && creep.pos.y == creep.memory.pos.y) {
        var source = (_a = Game.getObjectById(creep.memory.source)) != null ? _a : creep.pos.findClosestByRange(creep.memory.mineEnergy ? FIND_SOURCES : FIND_MINERALS);
        var state2 = creep.harvest(source);
        if (state2 === ERR_NOT_IN_RANGE) {
          creep.say("\u2049");
        } else {
          creep.memory.source = source.id;
          if (creep.room.controller.my && creep.room.controller.level < 4 || !creep.room.controller.my || !creep.memory.mineEnergy) {
            creep.memory.onPosition = true;
            this._clearMemory(creep);
            if (!creep.memory.mineEnergy) {
              var terminal = creep.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: (s) => s.structureType === STRUCTURE_TERMINAL
              })[0];
              if (terminal) {
                creep.memory.terminal = terminal.id;
              }
            }
            return;
          }
          const link2 = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (s) => s.structureType === STRUCTURE_LINK
          })[0];
          if (link2) {
            creep.memory.link = link2.id;
            creep.memory.onPosition = true;
            this._clearMemory(creep);
          } else {
            let build2 = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
              filter: { structureType: STRUCTURE_LINK }
            })[0];
            if (build2) {
              creep.memory.build = build2.id;
              creep.memory.onPosition = true;
              this._clearMemory(creep);
            } else if (creep.room.controller.level >= 6 && creep.memory.mineEnergy) {
              var creepPos = creep.pos;
              var adjacentSpots = [];
              for (let xOffset = -1; xOffset <= 1; xOffset++) {
                for (let yOffset = -1; yOffset <= 1; yOffset++) {
                  if (xOffset === 0 && yOffset === 0) {
                    continue;
                  }
                  var x = creepPos.x + xOffset;
                  var y = creepPos.y + yOffset;
                  adjacentSpots.push(new RoomPosition(x, y, creep.memory.workroom));
                }
              }
              for (var spot of adjacentSpots) {
                if (spot.createConstructionSite(STRUCTURE_LINK) === OK) {
                  return;
                }
              }
              creep.memory.onPosition = true;
              this._clearMemory(creep);
              return;
            } else {
              creep.memory.onPosition = true;
              this._clearMemory(creep);
              return;
            }
          }
        }
      } else
        moveByMemory2(creep, new RoomPosition(finalLocation.x, finalLocation.y, finalLocation.roomName));
    } else {
      let source2 = Game.getObjectById(creep.memory.source);
      var container = Game.getObjectById(creep.memory.container);
      if (creep.memory.container && !container) {
        container = creep.pos.lookFor(LOOK_STRUCTURES).find((s) => s.structureType === STRUCTURE_CONTAINER);
        if (container) {
          creep.memory.container = container.id;
        } else {
          delete creep.memory.container;
          creep.memory.onPosition = false;
          return;
        }
      }
      if (creep.memory.mineEnergy) {
        if (container) {
          if (container.progressTotal == void 0 && container.store.getUsedCapacity() == 0 && source2.energy <= 1 || container.progressTotal != void 0 && source2.energy <= 1) {
            creep.say("\u{1F634}");
            return;
          }
          if (creep.store.getFreeCapacity() > 0 && container.progressTotal == void 0 && container.store.getUsedCapacity() > 0) {
            creep.withdraw(container, RESOURCE_ENERGY);
          }
          if (container.progressTotal != void 0 && container.progressTotal > container.progress) {
            creep.say("\u{1F6E0}");
            creep.build(container);
          } else if (container.progressTotal == void 0 && (container.hits < container.hitsMax && !creep.memory.notfall || container.hits < 100)) {
            creep.say("\u{1F527}");
            creep.repair(container);
          } else if (container.store.getFreeCapacity() == 0 && creep.store.getFreeCapacity() == 0 && !creep.memory.link) {
            creep.say("\u{1F6AF}");
            return;
          }
        }
        if (creep.memory.build) {
          var build = Game.getObjectById(creep.memory.build);
          if (build && build.progressTotal != void 0 && build.progressTotal > build.progress) {
            creep.say("\u{1F6E0}");
            creep.build(build);
          } else if (!build) {
            delete creep.memory.build;
            var link = creep.pos.findInRange(FIND_STRUCTURES, 1, {
              filter: (s) => s.structureType === STRUCTURE_LINK
            })[0];
            if (link) {
              creep.memory.link = link.id;
            }
          }
        }
        if (creep.memory.link && creep.store.getFreeCapacity() == 0) {
          var link = Game.getObjectById(creep.memory.link);
          if (link) {
            creep.transfer(link, RESOURCE_ENERGY);
          }
        }
      } else {
        if (container) {
          if (creep.store.getFreeCapacity() > 0 && container.progressTotal == void 0 && container.store.getUsedCapacity() > 0) {
            creep.withdraw(container, source2.mineralType);
            return;
          }
          if (creep.store.getFreeCapacity() == 0 && (container.progressTotal == void 0 && container.store.getFreeCapacity() == 0 || container.progressTotal != void 0) && !creep.memory.terminal) {
            creep.say("\u{1F6AF}");
            return;
          }
        }
        if (creep.memory.terminal && creep.store.getFreeCapacity() == 0) {
          var terminal = Game.getObjectById(creep.memory.terminal);
          if (terminal) {
            creep.transfer(terminal, source2.mineralType);
          }
        }
        if (creep.memory.extactor) {
          var extactor = Game.getObjectById(creep.memory.extactor);
          if (extactor && extactor.cooldown > 0) {
            creep.say("\u{1F634}");
            return;
          }
        } else {
          let extr = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
            filter: { structureType: STRUCTURE_EXTRACTOR }
          })[0];
          if (extr) {
            creep.memory.extactor = extr.id;
            if (extr.cooldown > 0) {
              creep.say("\u{1F634}");
              return;
            }
          }
        }
      }
      if (source2.energy && source2.energy <= 1 || source2.mineralAmount && source2.mineralAmount < 1) {
        creep.say("\u{1F634}");
        return;
      }
      var state2 = creep.harvest(source2);
      if (state2 != OK) {
        if (state2 == ERR_TIRED || state2 == ERR_NOT_ENOUGH_ENERGY) {
          creep.say("\u{1F634}");
        } else if (state2 == ERR_NO_BODYPART) {
          creep.suicide();
        } else {
          creep.say(state2 + " :(");
        }
      }
    }
  }
  /** Spawnt einen Miner für die nächste fällige Energie- oder Mineralquelle in `workroom`. */
  spawn(spawn3, workroom) {
    bot.logWorkroom(workroom, "Miner Spawn start");
    if (!bot.room[workroom].sendMiner)
      return false;
    if (spawn3.room.name != workroom && !Memory.rooms[workroom].claimed && !bot.room[workroom].claim)
      return false;
    for (const sourceId of energySources(workroom)) {
      if (!Game.getObjectById(sourceId))
        continue;
      if (this._spawn(spawn3, workroom, sourceId, true))
        return true;
    }
    var room = Game.rooms[workroom];
    if (room && room.controller && room.controller.my && room.controller.level >= 6) {
      for (const sourceId of mineralSources(workroom)) {
        var mineral = Game.getObjectById(sourceId);
        if (!mineral || mineral.mineralAmount < 1)
          return false;
        if (this._spawn(spawn3, workroom, sourceId, false))
          return true;
      }
    }
    return false;
  }
  _spawn(spawn3, workroom, source, mineEnergy) {
    var time = 300;
    if (workroom == spawn3.room.name) {
      time = 150;
    }
    var count = _.filter(
      Game.creeps,
      (creep) => creep.memory.role == role9 && creep.memory.workroom == workroom && creep.memory.source == source && !creep.memory.notfall && (creep.ticksToLive > time || creep.spawning)
    ).length;
    if (1 <= count) {
      Memory.rooms[spawn3.room.name].aktivPrioSpawn = false;
      return false;
    }
    if (!spawn(spawn3, BODIES.miner.build(spawn3.room.energyCapacityAvailable), role9 + "_" + Game.time, { role: role9, workroom, home: spawn3.room.name, source, mineEnergy, notfall: false })) {
      Memory.rooms[spawn3.room.name].aktivPrioSpawn = true;
      Memory.rooms[spawn3.room.name].aktivPrioSpawnCount = (Memory.rooms[spawn3.room.name].aktivPrioSpawnCount || 0) + 1;
      if (Memory.rooms[spawn3.room.name].aktivPrioSpawnCount > 25) {
        if (_.filter(Game.creeps, (creep) => creep.memory.role == role9 && creep.memory.workroom == workroom && creep.memory.source == source).length > 0)
          return false;
        console.log("[" + spawn3.room.name + "|" + workroom + "] Spawn NotfallMiner!!!");
        spawn(spawn3, [WORK, CARRY, MOVE], role9 + "_" + Game.time, { role: role9, workroom, home: spawn3.room.name, source, mineEnergy, notfall: true });
        Memory.rooms[spawn3.room.name].aktivPrioSpawnCount = 0;
        return true;
      }
      return false;
    }
    Memory.rooms[spawn3.room.name].aktivPrioSpawnCount = 0;
    return true;
  }
};
Miner = __decorateClass([
  profile
], Miner);
var miner_default = new Miner();

// src/roles/repairer.ts
var role10 = "repairer";
var Repairer = class {
  /** Repariert priorisierte und beschädigte Strukturen im Arbeitsraum, sonst wird der Controller aufgewertet. */
  doJob(creep) {
    creep.checkHarvest(function() {
      creep.memory.repairs += 1;
    });
    if (creep.memory.harvest) {
      harvest(creep);
      return;
    }
    if (creep.memory.repairs > bot.const.maxRepairs) {
      creep.memory.repairs = 0;
      creep.memory.id = null;
    }
    if (creep.checkInvasion()) return;
    if (goToWorkroom2(creep)) return;
    if (checkWorkroomPrioSpawn(creep)) return;
    if (this._repairPrio(creep)) return;
    if (this._repair(creep)) return;
    upgradeController(creep);
  }
  _getPriority(structureType) {
    return bot.prio.repair[structureType] || 99;
  }
  _getMinHitRange(structureType) {
    return bot.prio.hits[structureType] || 0.5;
  }
  _repairPrio(creep) {
    if (!creep.memory.prioId) {
      for (var id in bot.room[creep.memory.workroom].prioBuildings) {
        var buildingId = bot.room[creep.memory.workroom].prioBuildings[id];
        var building = Game.getObjectById(buildingId);
        if (!building) continue;
        if (building.hits < building.hitsMax * 0.9) {
          creep.memory.prioId = buildingId;
          return true;
        }
      }
    } else {
      let target = Game.getObjectById(creep.memory.prioId);
      if (target && target.hits < target.hitsMax) {
        let state2 = creep.repair(target);
        if (state2 === ERR_NOT_IN_RANGE) {
          moveByMemory2(creep, target.pos);
        }
        return true;
      }
      creep.memory.repairs = 0;
      creep.memory.prioId = null;
    }
    return false;
  }
  _repair(creep) {
    if (!creep.memory.id) {
      let structuresToRepair = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax;
        }
      });
      if (structuresToRepair.length > 0) {
        var structs = structuresToRepair.map((site) => ({
          site,
          damage: site.hitsMax - site.hits,
          priority: this._getPriority(site.structureType)
        })).sort((a, b) => {
          if (a.priority === b.priority) {
            return b.damage - a.damage;
          }
          return a.priority - b.priority;
        });
        creep.memory.id = structs[0].site.id;
        return true;
      }
    } else {
      let target = Game.getObjectById(creep.memory.id);
      if (target && target.hits < target.hitsMax) {
        let state2 = creep.repair(target);
        if (state2 === ERR_NOT_IN_RANGE) {
          moveByMemory2(creep, target.pos);
        }
        return true;
      }
      creep.memory.repairs = 0;
      creep.memory.id = null;
    }
    return false;
  }
  /** Spawnt einen Repairer für `workroom`, falls Bedarf besteht und noch nicht genug unterwegs sind. */
  spawn(spawn3, workroom) {
    var minRepairer = bot.room[workroom].repairer;
    if (minRepairer < 1)
      return false;
    if (spawn3.room.name != workroom && !Memory.rooms[workroom].claimed)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role10 && creep.memory.workroom == workroom).length;
    if (count == void 0)
      count = 0;
    if (minRepairer <= count)
      return false;
    const workroomVisible = Game.rooms[workroom];
    if (!workroomVisible)
      return false;
    let structuresToRepair = workroomVisible.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax;
      }
    });
    if (structuresToRepair.length <= 1)
      return false;
    return spawn(spawn3, BODIES.repairer.build(spawn3.room.energyCapacityAvailable), role10 + "_" + Game.time, { role: role10, workroom, home: spawn3.room.name, repairs: 0 });
  }
};
Repairer = __decorateClass([
  profile
], Repairer);
var repairer_default = new Repairer();

// src/roles/transfer.ts
var role11 = "transfer";
var ROUND_TRIP_KEYS2 = { samples: "transferDistances", size: "transferSize", count: "transferCount" };
var Transfer = class {
  /** Sammelt Energie/Mineralien aus dem Arbeitsraum und bringt sie zum Heimatraum bzw. an bedürftige Builder. */
  doJob(creep) {
    if (!creep.memory.mineral)
      creep.memory.mineral = RESOURCE_ENERGY;
    creep.checkHarvest(
      () => this.recordRoundTrip(creep),
      () => this.recordRoundTrip(creep)
    );
    if (creep.memory.home != creep.memory.workroom)
      creep.memory.distance = creep.memory.distance + 1;
    if (creep.memory.harvest) {
      if (creep.room.name == creep.memory.workroom) {
        if (harvestRoomRuins(creep, RESOURCE_ENERGY)) return;
        if (harvestRoomDrops(creep, RESOURCE_ENERGY)) return;
        if (harvestRoomTombstones(creep, RESOURCE_ENERGY)) return;
        if (creep.store.getUsedCapacity() > 1)
          creep.memory.harvest = false;
      }
      if (goToMyHome2(creep)) return;
      if (harvestRoomStorage(creep, creep.memory.mineral)) return;
      if (harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
      if (goToRoomFlag2(creep)) return;
      return;
    }
    if (goToWorkroom2(creep)) return;
    if (TransportEnergyToHomeTower2(creep)) return;
    if (TransportToHomeTerminal2(creep)) return;
    if (TransportToHomeLab2(creep, RESOURCE_ENERGY)) return;
    if (TransportToHomeStorage2(creep)) return;
    if (TransportToHomeContainer2(creep, creep.memory.mineral)) return;
    var other = creep.room.find(FIND_MY_CREEPS, { filter: (c) => {
      return c.memory.role == "builder" && c.store.getFreeCapacity() > 0;
    } });
    if (other.length > 0) {
      switch (creep.transfer(other[0], RESOURCE_ENERGY, other[0].store.getFreeCapacity())) {
        case ERR_NOT_IN_RANGE:
          creep.moveTo(other[0]);
          return true;
        case OK:
          return true;
      }
    }
    if (goToRoomFlag2(creep)) return;
    return;
  }
  /**
   * Nimmt für `checkHarvest` eine Streckenmessung auf, solange die
   * Umlaufgröße für den Arbeitsraum noch nicht feststeht. Kein Effekt, wenn
   * Arbeits- und Heimatraum identisch sind (kein Remote-Umlauf).
   */
  recordRoundTrip(creep) {
    if (creep.memory.home == creep.memory.workroom)
      return;
    const roundTrip = new RoundTrip(creep.memory.workroom, ROUND_TRIP_KEYS2);
    if (roundTrip.record(creep.memory.distance)) {
      creep.memory.distance = 0;
    }
  }
  /**
   *
   * @param {StructureSpawn} spawn
   */
  /** Spawnt einen Transfer für `workroom`, falls Bedarf besteht und im Heimatraum genug Energie im Storage liegt. */
  spawn(spawn3, workroom) {
    if (!bot.room[workroom].transferEnergie || spawn3.room.name == workroom || !Memory.rooms[workroom].claimed)
      return false;
    if (this._spawn(spawn3, workroom, RESOURCE_ENERGY))
      return true;
    return false;
  }
  /**
   *
   * @param {StructureSpawn} spawn
   * @param {String} workroom
   * @param {String} container
   * @param {String} mineraltype
   */
  _spawn(spawn3, workroom, mineraltype) {
    var count = _.filter(
      Game.creeps,
      (creep) => creep.memory.role == role11 && creep.memory.workroom == workroom && creep.memory.home == spawn3.room.name && //hier wichtig, da mehere spawns infrage kommem
      (creep.ticksToLive > 100 || creep.spawning)
    ).length;
    if (1 <= count)
      return false;
    var storage = Game.rooms[spawn3.room.name].storage;
    if (storage && storage.store[RESOURCE_ENERGY] < 1e4 || !storage)
      return false;
    const roundTrip = new RoundTrip(workroom, ROUND_TRIP_KEYS2);
    const maxSetsForEnergy = BODIES.transfer.setsFor(spawn3.room.energyCapacityAvailable);
    const carry = roundTrip.carryFor(maxSetsForEnergy);
    var profil = Number.isFinite(carry) ? carryMove(carry) : BODIES.transfer.build(spawn3.room.energyCapacityAvailable);
    return spawn(spawn3, profil, role11 + "_" + Game.time, { role: role11, harvest: true, workroom, home: spawn3.room.name, mineral: mineraltype, distance: 0 });
  }
};
Transfer = __decorateClass([
  profile
], Transfer);
var transfer_default = new Transfer();

// src/roles/upgrader.ts
var role12 = "upgrader";
var RCL8_WORK_RESERVE = 1e5;
var DOWNGRADE_ALARM = 1e5;
var Upgrader = class {
  /** Beschafft Energie und upgradet den Controller des Arbeitsraums; unter RCL 8 ungedrosselt, ab RCL 8 nur mit Vorrat (siehe `_mayWork`). */
  doJob(creep) {
    if (!this._mayWork(creep)) return;
    creep.checkHarvest();
    if (creep.memory.harvest) {
      if (!creep.memory.noLink && new LinkList(creep.memory.workroom).controllerLink && (creep.room.controller.my && creep.room.controller.level >= 5)) {
        if (harvestControllerLink(creep, RESOURCE_ENERGY)) return;
      } else {
        if (harvestRoomStorage(creep, RESOURCE_ENERGY))
          return;
        if (harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25))
          return;
        if (harvestRoomDrops(creep, RESOURCE_ENERGY))
          return;
        if (harvestRoomTombstones(creep, RESOURCE_ENERGY))
          return;
        if (harvestRoomRuins(creep, RESOURCE_ENERGY))
          return;
        if (harvestRoomEnergySource(creep))
          return;
      }
      if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity()) {
        creep.memory.harvest = false;
      }
      return;
    }
    if (creep.checkInvasion()) return;
    if (goToWorkroom2(creep)) return;
    if (checkWorkroomPrioSpawn(creep)) return;
    upgradeController(creep);
  }
  /**
   * Darf der Upgrader in diesem Tick überhaupt arbeiten?
   *
   * Unter voller Ausbaustufe (RCL < 8) wird nicht mehr gedrosselt: dort ist
   * RCL-Fortschritt das Ziel, und die frühere Tickdrossel (ein Sechstel bis
   * ein Siebtel der Ticks) kostete echten Fortschritt (Plan 04, Punkt 3,
   * `docs/plans/04-rcl8-upgrader-und-gcl.md`). Ein Creep, der aus der Zeit vor
   * dieser Änderung noch `sparmodus: true` im Memory trägt, arbeitet ab dem
   * nächsten Tick ungedrosselt weiter — das Flag wird nirgends mehr gelesen
   * und absichtlich nicht aus dem Memory gelöscht, damit kein Migrationsschritt
   * nötig ist.
   *
   * Erst ab RCL8 drosselt der Vorrat statt der Tickzahl: der Controller nimmt
   * dort nur noch 15 Energie je Tick an, GCL wächst ausschließlich aus
   * Controller-Upgrades, und der Raum hat typischerweise Überschuss. Unterhalb
   * von RCL8 gibt es bewusst keine Vorratsschwelle — der Upgrader zieht dort
   * zuerst am Storage, `RCL8_WORK_RESERVE` schützt nur Stufe 8. Das ist keine
   * Lücke, sondern die gewollte Kehrseite der weggefallenen Tickdrossel.
   */
  _mayWork(creep) {
    const controller = creep.room.controller;
    if (!controller || !controller.my || controller.level < 8)
      return true;
    if (controller.ticksToDowngrade < DOWNGRADE_ALARM)
      return true;
    const storage = creep.room.storage;
    return Boolean(storage && storage.store[RESOURCE_ENERGY] > RCL8_WORK_RESERVE);
  }
  /**
   * Ab RCL8 nimmt der Controller nur noch 15 Energie je Tick an; dort gilt das
   * Profil, das genau diese Rate ausschöpft (15 WORK).
   */
  bodyFor(spawn3, workroom) {
    const profil = Game.rooms[workroom].controller.level > 7 ? BODIES.upgraderRcl8 : BODIES.upgrader;
    return profil.build(spawn3.room.energyCapacityAvailable);
  }
  /**
   * Spawnt einen Upgrader für `workroom`, falls die konfigurierte Anzahl noch
   * nicht erreicht ist.
   *
   * Ausnahme: läuft der Storage über (`storageIsFull`), steht **mindestens
   * einer** da — auch bei `upgrader: 0` in der Config und auch dann, wenn das
   * RCL8-Gate ihn sonst verhinderte. Der Fall ist nicht theoretisch: bei 95
   * Prozent Belegung mit viel Mineral und 150 000 Energie greift das Gate
   * `storage < 250000` heute genau dann, wenn man den Upgrader braucht.
   *
   * Bewusst `Math.max(1, …)` und keine höhere Zahl: ab RCL8 nimmt der
   * Controller nur noch `CONTROLLER_MAX_UPGRADE_PER_TICK` (15) Energie je Tick
   * an — für den ganzen Raum. `BODIES.upgraderRcl8` schöpft das mit 15 WORK
   * allein aus, ein zweiter Upgrader brächte dort nichts.
   */
  spawn(spawn3, workroom) {
    const forced = storageIsFull(workroom);
    var uppis = bot.room[workroom].upgrader;
    if (!forced && (!uppis || uppis < 1))
      return false;
    if (spawn3.room.name != workroom)
      return false;
    if (!forced && spawn3.room.controller.level > 7 && spawn3.room.controller.ticksToDowngrade > 1e5 && spawn3.room.storage && spawn3.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 25e4)
      return false;
    var count = _.filter(
      Game.creeps,
      (creep) => creep.memory.role == role12 && creep.memory.workroom == workroom && (creep.ticksToLive > 160 || creep.spawning)
    ).length;
    const target = forced ? Math.max(1, uppis != null ? uppis : 0) : uppis;
    if (target <= count)
      return false;
    var profil = this.bodyFor(spawn3, workroom);
    return spawn(spawn3, profil, role12 + "_" + Game.time, { role: role12, workroom, home: spawn3.room.name, repairs: 0, noLink: false });
  }
};
Upgrader = __decorateClass([
  profile
], Upgrader);
var upgrader_default = new Upgrader();

// src/roles/wally.ts
var role13 = "wally";
var Wally = class {
  /** Erntet, weicht bei Invasion aus, repariert Walls/Ramparts oder upgradet sonst den Controller. */
  doJob(creep) {
    creep.checkHarvest();
    if (creep.checkInvasion()) {
      if (creep.memory.harvest) {
        if (harvestRoomStorage(creep, RESOURCE_ENERGY)) return;
        if (harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25)) return;
        return;
      } else {
        if (TransportEnergyToHomeTower2(creep)) return;
      }
      return;
    }
    if (creep.memory.harvest) {
      creep.memory.wall = null;
      harvest(creep);
      return;
    }
    if (goToWorkroom2(creep)) return;
    if (checkWorkroomPrioSpawn(creep)) return;
    if (this._repair(creep)) return;
    upgradeController(creep);
  }
  _repair(creep) {
    var targetWall;
    if (!creep.memory.wall) {
      var wall;
      for (var wallId in Memory.rooms[creep.memory.workroom].wally) {
        var w = Game.getObjectById(Memory.rooms[creep.memory.workroom].wally[wallId]);
        if (!w)
          continue;
        if (!wall || wall.hits > w.hits) {
          wall = w;
        }
      }
      if (wall) {
        creep.memory.wall = wall.id;
        targetWall = wall;
      }
    } else {
      targetWall = Game.getObjectById(creep.memory.wall);
      if (targetWall.hits >= targetWall.hitsMax) {
        creep.memory.wall = null;
        return false;
      }
    }
    if (targetWall) {
      const repairResult = creep.repair(targetWall);
      if (repairResult === ERR_NOT_IN_RANGE) {
        moveByMemory2(creep, targetWall.pos);
        return true;
      }
      return repairResult == OK;
    } else {
      creep.memory.wall = null;
      return false;
    }
  }
  /** Spawnt einen Wallrepairer für `workroom`, falls Bedarf, Rumpfbudget und Energiereserve passen. */
  spawn(spawn3, workroom) {
    if (spawn3.room.name != workroom && !Memory.rooms[workroom].claimed)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role13 && creep.memory.workroom == workroom).length;
    if (bot.room[workroom].maxwallRepairer <= count)
      return false;
    var room = Game.rooms[workroom];
    if (!room)
      return false;
    var walls = room.find(FIND_STRUCTURES, { filter: (structure) => {
      return (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) && structure.hits < structure.hitsMax;
    } });
    if (walls.length == 0)
      return false;
    var storage = Game.rooms[workroom].storage;
    if (storage && storage.store[RESOURCE_ENERGY] < 5e4 || !storage)
      return false;
    var p = BODIES.wally.build(spawn3.room.energyCapacityAvailable);
    return spawn(spawn3, p, role13 + "_" + Game.time, { role: role13, workroom, home: spawn3.room.name });
  }
};
Wally = __decorateClass([
  profile
], Wally);
var wally_default = new Wally();

// src/roles/index.ts
var jobs = {
  // Ganz vorn mit Absicht: sind Spawn und Extensions leer, spawnt der Raum
  // überhaupt nichts mehr — auch keinen Ersatzfiller. Wer den Spawn füttert,
  // muss vor allen stehen, die daraus bezahlt werden.
  filler: filler_default,
  debitor: debitor_default,
  // Weit vorn mit Absicht: ein voller Empfänger-Link nimmt nichts mehr an und
  // blockiert damit den Durchsatz aller Quell-Links, die auf ihn senden.
  linkkeeper: linkkeeper_default,
  // Direkt hinter dem Linkkeeper: ohne Träger läuft der Quellcontainer über
  // und der Miner fördert ins Leere. Beides sind Durchsatzsperren.
  hauler: hauler_default,
  transfer: transfer_default,
  miner: miner_default,
  claimer: claimer_default,
  builder: builder_default,
  repairer: repairer_default,
  upgrader: upgrader_default,
  extupgrader: extupgrader_default,
  defender: defender_default,
  wally: wally_default
};

// src/controller/spawn.ts
function spawn2() {
  for (const spawnName in Game.spawns) {
    const spawn3 = Game.spawns[spawnName];
    if (!spawn3 || spawn3.spawning) continue;
    const emergencyCreeps = Object.values(Game.creeps).filter((creep) => {
      const memory = creep.memory;
      return memory.home === spawn3.room.name && memory.notfall;
    });
    for (const roomName in bot.room) {
      const config = bot.room[roomName];
      if (!config) continue;
      const workroom = config.room;
      if (emergencyCreeps.length > 0 && workroom !== spawn3.room.name) {
        bot.logWorkroom(workroom, `has NotfallCreep! >> ${JSON.stringify(emergencyCreeps)}`);
        continue;
      }
      const transfer = bot.transfer[workroom];
      if ((transfer == null ? void 0 : transfer.source.includes(spawn3.room.name)) && jobs.transfer.spawn(spawn3, workroom)) {
        bot.logWorkroom(workroom, "Spawn Transfer");
        break;
      }
      const roomMemory2 = Memory.rooms[workroom];
      if (config.sendDefender && (roomMemory2.needDefence || roomMemory2.invaderCore)) {
        jobs.defender.spawn(spawn3, workroom);
        bot.logWorkroom(workroom, "Spawn Defender");
        continue;
      }
      if (config.spawnRoom !== spawn3.room.name && config.room !== spawn3.room.name) continue;
      if (roomMemory2.invaderCore) continue;
      bot.logWorkroom(workroom, "Spawn JobLoop");
      for (const jobName in jobs) {
        bot.logWorkroom(workroom, `Spawn Job: ${jobName}`);
        if (jobs[jobName].spawn(spawn3, workroom)) break;
      }
      if (spawn3.spawning) break;
    }
  }
}

// src/profiler/history.ts
var HISTORY_SEGMENT = 99;
var HISTORY_MAX_ENTRIES = 1e3;
var MAX_SEGMENT_CHARS = 100 * 1024;
var FIELD_COUNT = 11;
function hasRawMemory() {
  return typeof RawMemory !== "undefined";
}
function requestSegment() {
  if (!hasRawMemory()) return;
  RawMemory.setActiveSegments([HISTORY_SEGMENT]);
}
function isAvailable() {
  if (!hasRawMemory()) return false;
  return RawMemory.segments[HISTORY_SEGMENT] !== void 0;
}
function buildEntry(metrics) {
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
    creeps: metrics.creeps
  };
}
function serializeEntry(entry) {
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
    entry.creeps.toFixed(2)
  ].join(";");
}
function parseEntry(line) {
  const fields = line.split(";");
  if (fields.length !== FIELD_COUNT) return void 0;
  const mode = fields[2];
  const numberFields = [
    fields[0],
    fields[1],
    fields[3],
    fields[4],
    fields[5],
    fields[6],
    fields[7],
    fields[8],
    fields[9],
    fields[10]
  ].map(Number);
  if (numberFields.some((value) => !Number.isFinite(value))) return void 0;
  if (mode.length === 0) return void 0;
  const [tick2, ticks, cpuPerTick, cpuMaxTick, cpuPerRoom, cpuPerCreep, bucketMean, bucketMin, rooms, creeps] = numberFields;
  return {
    tick: tick2,
    ticks,
    mode,
    cpuPerTick,
    cpuMaxTick,
    cpuPerRoom,
    cpuPerCreep,
    bucketMean,
    bucketMin,
    rooms,
    creeps
  };
}
function read() {
  if (!isAvailable()) return [];
  const raw = RawMemory.segments[HISTORY_SEGMENT];
  if (raw === void 0 || raw.length === 0) return [];
  const entries = [];
  for (const line of raw.split("\n")) {
    if (line.length === 0) continue;
    const entry = parseEntry(line);
    if (entry !== void 0) entries.push(entry);
  }
  return entries;
}
function append(metrics) {
  if (!isAvailable()) return false;
  const entries = read();
  entries.push(buildEntry(metrics));
  while (entries.length > HISTORY_MAX_ENTRIES) entries.shift();
  let serialized = entries.map(serializeEntry).join("\n");
  while (serialized.length > MAX_SEGMENT_CHARS && entries.length > 0) {
    entries.shift();
    serialized = entries.map(serializeEntry).join("\n");
  }
  RawMemory.segments[HISTORY_SEGMENT] = serialized;
  return true;
}
function fmt(value, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(decimals);
}
var COLUMN_WIDTHS = {
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
  creeps: 7
};
function formatRow(entry) {
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
    fmt(entry.creeps).padStart(COLUMN_WIDTHS.creeps)
  ].join("  ");
}
function format(entries) {
  if (entries.length === 0) {
    return "Kein Verlauf vorhanden. Mit prof.light() oder prof.on() messen \u2014 je volles Fenster (100 Ticks) kommt eine Zeile dazu.";
  }
  const header = [
    "Tick".padStart(COLUMN_WIDTHS.tick),
    "Ticks".padStart(COLUMN_WIDTHS.ticks),
    "Modus".padStart(COLUMN_WIDTHS.mode),
    "CPU/Tick".padStart(COLUMN_WIDTHS.cpuPerTick),
    "CPU/Max".padStart(COLUMN_WIDTHS.cpuMaxTick),
    "CPU/Raum".padStart(COLUMN_WIDTHS.cpuPerRoom),
    "CPU/Creep".padStart(COLUMN_WIDTHS.cpuPerCreep),
    "Bucket-\xD8".padStart(COLUMN_WIDTHS.bucketMean),
    "Bucket-Min".padStart(COLUMN_WIDTHS.bucketMin),
    "R\xE4ume".padStart(COLUMN_WIDTHS.rooms),
    "Creeps".padStart(COLUMN_WIDTHS.creeps)
  ].join("  ");
  const separator = "-".repeat(header.length);
  const rows = entries.map(formatRow);
  return [header, separator, ...rows].join("\n");
}

// src/profiler/mail.ts
var NOTIFY_MAX_CHARS = 1e3;
var NOTIFY_MAX_PER_TICK = 20;
function prefixLength(digitWidth) {
  return 4 + 2 * digitWidth;
}
function greedySplitLines(lines, maxContentChars) {
  const blocks = [];
  let current = "";
  for (const line of lines) {
    if (line.length > maxContentChars) {
      if (current.length > 0) {
        blocks.push(current);
        current = "";
      }
      let rest = line;
      while (rest.length > 0) {
        blocks.push(rest.slice(0, maxContentChars));
        rest = rest.slice(maxContentChars);
      }
      continue;
    }
    const candidate = current.length === 0 ? line : `${current}
${line}`;
    if (candidate.length <= maxContentChars) {
      current = candidate;
    } else {
      blocks.push(current);
      current = line;
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}
function splitForNotify(text, maxChars = NOTIFY_MAX_CHARS) {
  if (text.trim().length === 0) return [];
  const lines = text.split("\n");
  let digitWidth = 1;
  let blocks = [];
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const maxContentChars = Math.max(1, maxChars - prefixLength(digitWidth));
    blocks = greedySplitLines(lines, maxContentChars);
    const neededWidth = String(blocks.length).length;
    if (neededWidth === digitWidth) break;
    digitWidth = neededWidth;
  }
  const total = blocks.length;
  return blocks.map((block, index) => `[${index + 1}/${total}] ${block}`);
}
function mailReport(title, text) {
  if (text.trim().length === 0) {
    return "Leerer Bericht, nichts verschickt.";
  }
  const blocks = splitForNotify(`${title}
${text}`);
  if (blocks.length === 0) {
    return "Leerer Bericht, nichts verschickt.";
  }
  const toSend = blocks.slice(0, NOTIFY_MAX_PER_TICK);
  for (const block of toSend) {
    Game.notify(block, 0);
  }
  const omitted = blocks.length - toSend.length;
  if (omitted > 0) {
    return `Bericht als ${toSend.length} E-Mail(s) verschickt, ${omitted} Block(e) weggelassen (Limit ${NOTIFY_MAX_PER_TICK} je Tick).`;
  }
  return `Bericht als ${toSend.length} E-Mail(s) verschickt.`;
}

// src/profiler/report.ts
function fmt2(value, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(decimals);
}
function fmtPercent(share) {
  if (!Number.isFinite(share)) return "-";
  return `${(share * 100).toFixed(1)}%`;
}
function topEntries(entries, count) {
  if (entries.length === 0) return "-";
  return entries.slice(0, count).map((entry) => `${entry.name} ${fmtPercent(entry.share)}`).join(", ");
}
function formatWindowLine(metrics) {
  const top = topEntries(metrics.roles, 3);
  return `[prof] Fenster=${fmt2(metrics.ticks, 0)}T | CPU/Tick=${fmt2(metrics.cpuPerTick)} | CPU/Raum=${fmt2(metrics.cpuPerRoom)} | CPU/Creep=${fmt2(metrics.cpuPerCreep)} | Bucket~${fmt2(metrics.bucketMean, 0)} (min ${fmt2(metrics.bucketMin, 0)}) | Limit=${fmt2(metrics.limit, 0)} | Top: ${top}`;
}
var NUMBER_COLUMN_WIDTHS = {
  cpuPerTick: 9,
  cpuPerCall: 10,
  callsPerTick: 12,
  max: 8,
  share: 8
};
function formatRankedRow(entry, widths) {
  return [
    entry.name.padEnd(widths.name),
    fmt2(entry.cpuPerTick).padStart(widths.cpuPerTick),
    fmt2(entry.cpuPerCall).padStart(widths.cpuPerCall),
    fmt2(entry.callsPerTick).padStart(widths.callsPerTick),
    fmt2(entry.max).padStart(widths.max),
    fmtPercent(entry.share).padStart(widths.share)
  ].join("  ");
}
function formatRankedBlock(title, entries) {
  if (entries.length === 0) return "";
  const sorted = [...entries].sort((a, b) => b.share - a.share);
  const nameWidth = Math.max("Name".length, ...sorted.map((entry) => entry.name.length));
  const widths = { name: nameWidth, ...NUMBER_COLUMN_WIDTHS };
  const header = [
    "Name".padEnd(widths.name),
    "CPU/Tick".padStart(widths.cpuPerTick),
    "CPU/Aufruf".padStart(widths.cpuPerCall),
    "Aufrufe/Tick".padStart(widths.callsPerTick),
    "Max".padStart(widths.max),
    "Anteil%".padStart(widths.share)
  ].join("  ");
  const separator = "-".repeat(header.length);
  const rows = sorted.map((entry) => formatRankedRow(entry, widths));
  return [`== ${title} ==`, header, separator, ...rows].join("\n");
}
function formatDetailReport(metrics) {
  const blocks = [
    formatRankedBlock("Abschnitte", metrics.sections),
    formatRankedBlock("Rollen", metrics.roles),
    formatRankedBlock("Methoden", metrics.methods),
    formatRankedBlock("Creeps", metrics.creepDetail)
  ].filter((block) => block.length > 0);
  if (blocks.length === 0) {
    return "Keine Detaildaten im laufenden Fenster. Mit prof.detail() eine Messung starten.";
  }
  return blocks.join("\n\n");
}
var BASELINE_NUMBER_WIDTHS = {
  tick: 10,
  ticks: 6,
  cpuPerTick: 10,
  cpuPerRoom: 10,
  cpuPerCreep: 11,
  bucketMean: 11
};
function formatBaselineRow(row, widths) {
  return [
    row.name.padEnd(widths.name),
    fmt2(row.tick, 0).padStart(widths.tick),
    fmt2(row.ticks, 0).padStart(widths.ticks),
    fmt2(row.cpuPerTick).padStart(widths.cpuPerTick),
    fmt2(row.cpuPerRoom).padStart(widths.cpuPerRoom),
    fmt2(row.cpuPerCreep).padStart(widths.cpuPerCreep),
    fmt2(row.bucketMean).padStart(widths.bucketMean)
  ].join("  ");
}
function formatBaselines(baselines, current) {
  const names = Object.keys(baselines);
  if (names.length === 0) {
    return "Keine Grundlinien vorhanden. Mit prof.baseline(name) eine anlegen.";
  }
  const rows = names.map((name) => {
    const baseline = baselines[name];
    return {
      name,
      tick: baseline.tick,
      ticks: baseline.ticks,
      cpuPerTick: baseline.cpuPerTick,
      cpuPerRoom: baseline.cpuPerRoom,
      cpuPerCreep: baseline.cpuPerCreep,
      bucketMean: baseline.bucketMean
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
      bucketMean: current.bucketMean
    });
  }
  const nameWidth = Math.max("Name".length, ...rows.map((row) => row.name.length));
  const widths = { name: nameWidth, ...BASELINE_NUMBER_WIDTHS };
  const header = [
    "Name".padEnd(widths.name),
    "Tick".padStart(widths.tick),
    "Ticks".padStart(widths.ticks),
    "CPU/Tick".padStart(widths.cpuPerTick),
    "CPU/Raum".padStart(widths.cpuPerRoom),
    "CPU/Creep".padStart(widths.cpuPerCreep),
    "Bucket-\xD8".padStart(widths.bucketMean)
  ].join("  ");
  const separator = "-".repeat(header.length);
  const dataRows = rows.map((row) => formatBaselineRow(row, widths));
  return [header, separator, ...dataRows].join("\n");
}
function fmtSigned(value, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}
function buildOverallRows(baseline, current) {
  const metrics = [
    ["cpuPerTick", baseline.cpuPerTick, current.cpuPerTick],
    ["cpuPerRoom", baseline.cpuPerRoom, current.cpuPerRoom],
    ["cpuPerCreep", baseline.cpuPerCreep, current.cpuPerCreep],
    ["bucketMean", baseline.bucketMean, current.bucketMean]
  ];
  return metrics.map(([entryName, before, after]) => ({ name: entryName, before, after, diff: after - before })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}
function buildComparisonRows(before, after) {
  const afterByName = new Map(after.map((entry) => [entry.name, entry.cpuPerTick]));
  const names = /* @__PURE__ */ new Set([...Object.keys(before != null ? before : {}), ...afterByName.keys()]);
  const rows = [...names].map((entryName) => {
    const beforeValue = before == null ? void 0 : before[entryName];
    const afterValue = afterByName.get(entryName);
    const hasBefore = beforeValue !== void 0;
    const hasAfter = afterValue !== void 0;
    const beforeNumber = beforeValue != null ? beforeValue : 0;
    const afterNumber = afterValue != null ? afterValue : 0;
    const row = {
      name: entryName,
      before: beforeNumber,
      after: afterNumber,
      diff: afterNumber - beforeNumber
    };
    if (hasBefore && !hasAfter) row.status = "weggefallen";
    if (!hasBefore && hasAfter) row.status = "neu";
    return row;
  });
  return rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}
function formatComparisonRow(row, widths) {
  var _a;
  const note = (_a = row.status) != null ? _a : "";
  return [
    row.name.padEnd(widths.name),
    fmt2(row.before).padStart(widths.before),
    fmt2(row.after).padStart(widths.after),
    fmtSigned(row.diff).padStart(widths.diff),
    note.padEnd(widths.note)
  ].join("  ").trimEnd();
}
function formatComparisonBlock(title, rows) {
  if (rows.length === 0) return "";
  const nameWidth = Math.max("Name".length, ...rows.map((row) => row.name.length));
  const beforeWidth = Math.max("Vorher".length, ...rows.map((row) => fmt2(row.before).length));
  const afterWidth = Math.max("Jetzt".length, ...rows.map((row) => fmt2(row.after).length));
  const diffWidth = Math.max("Diff".length, ...rows.map((row) => fmtSigned(row.diff).length));
  const noteWidth = Math.max("Hinweis".length, ...rows.map((row) => {
    var _a;
    return ((_a = row.status) != null ? _a : "").length;
  }));
  const widths = {
    name: nameWidth,
    before: beforeWidth,
    after: afterWidth,
    diff: diffWidth,
    note: noteWidth
  };
  const header = [
    "Name".padEnd(widths.name),
    "Vorher".padStart(widths.before),
    "Jetzt".padStart(widths.after),
    "Diff".padStart(widths.diff),
    "Hinweis".padEnd(widths.note)
  ].join("  ").trimEnd();
  const separator = "-".repeat(header.length);
  const dataRows = rows.map((row) => formatComparisonRow(row, widths));
  return [`== ${title} ==`, header, separator, ...dataRows].join("\n");
}
function formatComparison(name, baseline, current) {
  const header = `Vergleich "${name}" (Grundlinie Tick ${fmt2(baseline.tick, 0)}, ${fmt2(baseline.ticks, 0)} Ticks) vs. jetzt (${fmt2(current.ticks, 0)} Ticks)`;
  const blocks = [header, formatComparisonBlock("Gesamt", buildOverallRows(baseline, current))];
  const baselineHasDetail = baseline.sections !== void 0 || baseline.roles !== void 0;
  const currentHasDetail = current.mode === "full";
  if (!baselineHasDetail) {
    blocks.push(
      "Die Grundlinie kennt nur Gesamtzahlen (Zustand light bei ihrer Aufnahme). F\xFCr einen Vergleich je Abschnitt und Rolle ist eine neue Grundlinie im Zustand full n\xF6tig."
    );
  } else if (!currentHasDetail) {
    blocks.push(
      "Das laufende Fenster kennt keine Abschnitte und Rollen (Zustand light). F\xFCr den Vergleich mit prof.on() messen."
    );
  } else {
    blocks.push(formatComparisonBlock("Abschnitte", buildComparisonRows(baseline.sections, current.sections)));
    blocks.push(formatComparisonBlock("Rollen", buildComparisonRows(baseline.roles, current.roles)));
  }
  return blocks.filter((block) => block.length > 0).join("\n\n");
}

// src/profiler/stats.ts
var statsMemory = Memory;
function isWritable(value) {
  return Number.isFinite(value);
}
function set(target, key, value) {
  if (!isWritable(value)) return;
  target[key] = value;
}
function writeStats(metrics) {
  const stats = {};
  set(stats, "cpu.getUsed", metrics.cpuPerTick);
  set(stats, "cpu.limit", metrics.limit);
  set(stats, "cpu.tickLimit", metrics.tickLimit);
  set(stats, "cpu.bucket", metrics.bucketMean);
  set(stats, "profiler.ticks", metrics.ticks);
  set(stats, "profiler.cpuPerTick", metrics.cpuPerTick);
  set(stats, "profiler.cpuMaxTick", metrics.cpuMaxTick);
  set(stats, "profiler.cpuPerRoom", metrics.cpuPerRoom);
  set(stats, "profiler.cpuPerCreep", metrics.cpuPerCreep);
  set(stats, "profiler.rooms", metrics.rooms);
  set(stats, "profiler.creeps", metrics.creeps);
  set(stats, "profiler.bucketMin", metrics.bucketMin);
  for (const section of metrics.sections) {
    set(stats, `profiler.section.${section.name}.cpuPerTick`, section.cpuPerTick);
  }
  for (const role14 of metrics.roles) {
    set(stats, `profiler.role.${role14.name}.cpuPerTick`, role14.cpuPerTick);
  }
  statsMemory.stats = stats;
}
function clearStats() {
  delete statsMemory.stats;
}

// src/profiler/index.ts
function toCpuMap(entries) {
  const map = {};
  for (const entry of entries) {
    map[entry.name] = Math.round(entry.cpuPerTick * 100) / 100;
  }
  return map;
}
function toBaseline(metrics) {
  const baseline = {
    tick: Game.time,
    ticks: metrics.ticks,
    mode: metrics.mode,
    cpuPerTick: metrics.cpuPerTick,
    cpuPerRoom: metrics.cpuPerRoom,
    cpuPerCreep: metrics.cpuPerCreep,
    bucketMean: metrics.bucketMean,
    rooms: metrics.rooms,
    creeps: metrics.creeps
  };
  if (metrics.mode === "full") {
    baseline.sections = toCpuMap(metrics.sections);
    baseline.roles = toCpuMap(metrics.roles);
  }
  return baseline;
}
var Profiler = class {
  constructor(state2, measurement2, flagSwitch2) {
    this.state = state2;
    this.measurement = measurement2;
    this.flagSwitch = flagSwitch2;
    /**
     * Zustand des letzten Ticks. Wechselt der Zustand, wird das laufende Fenster
     * verworfen — sonst mischte ein Fenster Ticks aus `light` und `full` und die
     * abgeleiteten Zahlen wären nicht vergleichbar.
     */
    __publicField(this, "lastMode", "off");
  }
  /**
   * Tickgrenze am Anfang von `loop()`. Spiegelt den über Konsole oder Flagge
   * gesetzten Zustand aus `Memory` und beendet eine abgelaufene Detailmessung.
   */
  tick() {
    this.state.syncFromMemory();
    if (this.state.mode !== "off") {
      requestSegment();
    }
    this.applyFlagRequest();
    this.drawFlagLegend();
    if (this.state.expireDetail()) {
      console.log(
        `[prof] Detailmessung beendet.
${formatDetailReport(this.measurement.metrics())}`
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
  endTick(creepCount) {
    this.measurement.endTick(creepCount);
    if (!this.measurement.isDue) return;
    const metrics = this.measurement.metrics();
    console.log(formatWindowLine(metrics));
    writeStats(metrics);
    append(metrics);
    this.measurement.reset();
  }
  on() {
    this.switchMode("full");
    return "Profiler: full \u2014 Gesamttick, Abschnitte und Rollen. Fensterzeile alle 100 Ticks.";
  }
  light() {
    this.switchMode("light");
    return "Profiler: light \u2014 nur Gesamttick, Bucket, CPU pro Raum und pro Creep.";
  }
  off() {
    this.switchMode("off");
    clearStats();
    return "Profiler: aus. Es l\xE4uft kein Game.cpu.getUsed() mehr.";
  }
  status() {
    const detail = this.state.detailActive() ? ` | Detailmessung noch ${this.state.detailRemaining()} Ticks` : "";
    const flag = this.flagSwitch.describe();
    const switchState = flag !== null ? ` | ${flag}` : "";
    return `Profiler: ${this.state.mode} | Fenster ${this.measurement.snapshot.ticks}/100 Ticks${detail}${switchState}`;
  }
  report() {
    const metrics = this.measurement.metrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster. Mit prof.light() oder prof.on() einschalten.";
    }
    const line = formatWindowLine(metrics);
    if (metrics.sections.length === 0 && metrics.roles.length === 0) {
      return line;
    }
    return `${line}
${formatDetailReport(metrics)}`;
  }
  reset() {
    this.measurement.reset();
    return "Fenster verworfen, Messung beginnt neu.";
  }
  detail(ticks = DEFAULT_DETAIL_TICKS) {
    if (!Number.isFinite(ticks) || ticks < 1) {
      return `Ung\xFCltige Tickzahl. Beispiel: prof.detail(${DEFAULT_DETAIL_TICKS})`;
    }
    const returnTo = this.state.mode;
    this.state.startDetail(Math.floor(ticks));
    this.lastMode = "full";
    this.measurement.reset();
    this.flagSwitch.acknowledge("detail");
    return `Detailmessung f\xFCr ${Math.floor(ticks)} Ticks gestartet, danach zur\xFCck auf ${returnTo}.`;
  }
  baseline(name) {
    if (!name) {
      return 'Name fehlt. Beispiel: prof.baseline("vor-plan-02")';
    }
    const metrics = this.measurement.metrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster \u2014 es gibt nichts festzuhalten.";
    }
    this.state.saveBaseline(name, toBaseline(metrics));
    if (metrics.ticks < 1e3) {
      return `Grundlinie "${name}" gespeichert \u2014 Achtung, nur ${metrics.ticks} Ticks. F\xFCr einen belastbaren Vergleich mindestens 1000 Ticks messen.`;
    }
    return `Grundlinie "${name}" \xFCber ${metrics.ticks} Ticks gespeichert.`;
  }
  baselines() {
    const metrics = this.measurement.metrics();
    return formatBaselines(this.state.readBaselines(), metrics.ticks > 0 ? metrics : null);
  }
  compare(name) {
    if (!name) {
      return 'Name fehlt. Beispiel: prof.compare("vor-linknetz")';
    }
    const baseline = this.state.readBaselines()[name];
    if (!baseline) {
      return `Keine Grundlinie "${name}". Vorhandene zeigt prof.baselines().`;
    }
    const metrics = this.measurement.metrics();
    if (metrics.ticks === 0) {
      return "Kein gemessener Tick im Fenster \u2014 es gibt nichts zu vergleichen.";
    }
    return formatComparison(name, baseline, metrics);
  }
  mail() {
    const report3 = this.report();
    return mailReport(`[prof] Bericht Tick ${Game.time}`, report3);
  }
  history() {
    if (!isAvailable()) {
      requestSegment();
      return "Verlaufssegment angefordert. prof.history() im n\xE4chsten Tick noch einmal aufrufen.";
    }
    return format(read());
  }
  /**
   * Wechselt den Zustand und beginnt ein frisches Fenster.
   *
   * Ein ausdrücklicher Zustandswechsel beendet außerdem eine laufende
   * Detailmessung: wer `off`, `light` oder `full` verlangt, will nicht, dass ihm
   * Ticks später die Selbstabschaltung den alten Zustand zurückholt.
   */
  switchMode(mode) {
    if (this.state.detailActive()) {
      this.state.cancelDetail();
      console.log(
        "[prof] Laufende Detailmessung abgebrochen, kein Abschlussbericht \u2014 prof.report() zeigt das Fenster."
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
  applyFlagRequest() {
    const request = this.flagSwitch.readRequest();
    if (request === null) return;
    if (request === "detail") {
      console.log(`[prof] Flagge: ${this.detail()}`);
      return;
    }
    const message = request === "off" ? this.off() : request === "light" ? this.light() : this.on();
    console.log(`[prof] Flagge: ${message}`);
  }
  /**
   * Zeichnet die Legende neben die Schalterflagge.
   *
   * Bewusst aus dem Rohzustand statt aus `metrics()`: die Kennzahlen sortieren
   * vier Ranglisten, und das jeden Tick nur für eine Textzeile zu tun wäre genau
   * die Art Kosten, die der Profiler aufspüren soll.
   */
  drawFlagLegend() {
    const window = this.measurement.snapshot;
    this.flagSwitch.draw({
      mode: this.state.mode,
      ticks: window.ticks,
      cpuPerTick: window.ticks > 0 ? window.cpuTotal / window.ticks : 0,
      detailRemaining: this.state.detailRemaining()
    });
  }
};
var profiler = new Profiler(state, measurement, flagSwitch);
bot.prof = profiler;
function tick() {
  profiler.tick();
}
function endTick(creepCount) {
  profiler.endTick(creepCount);
}
function begin(section) {
  measurement.begin(section);
}
function end(section) {
  measurement.end(section);
}

// src/controller/timing.ts
var botMemory3 = Memory;
function controllCritical() {
  init();
  begin(SECTION.tower);
  defence_default.tower();
  end(SECTION.tower);
}
function controll() {
  const tick2 = Game.time;
  begin(SECTION.terminal);
  const terminalIds = botMemory3.terminals;
  if (mayRunLow() && terminalIds && terminalIds.length > 0) {
    const terminalId = terminalIds[Game.time % terminalIds.length];
    if (terminalId) {
      const terminal = Game.getObjectById(terminalId);
      if (terminal) {
        const fill = terminal.store.getUsedCapacity() / 3e5;
        if (fill > 0.8) {
          terminal.sell();
          terminal.sell();
        }
        terminal.sell();
        terminal.buyPixel();
      }
    }
  }
  end(SECTION.terminal);
  begin(SECTION.links);
  if (tick2 % 1e3 === 0) {
    discoverAll();
  }
  sendAll();
  end(SECTION.links);
  if (tick2 % 3 === 0 && Game.cpu.bucket === 1e4) {
    begin(SECTION.pixel);
    Game.cpu.generatePixel();
    end(SECTION.pixel);
  }
  check();
  if (tick2 % 5 === 0 && mayRunNormal()) {
    begin(SECTION.spawn);
    spawn2();
    end(SECTION.spawn);
  }
  if (mayRunNormal()) {
    begin(SECTION.defence);
    defence_default.check();
    end(SECTION.defence);
  }
  if (tick2 % 11 === 0 && mayRunLow()) {
    begin(SECTION.status);
    writeStatus();
    end(SECTION.status);
  }
  if (mayRunLow()) {
    begin(SECTION.daily);
    daylie();
    end(SECTION.daily);
  }
}
var DAY_TICKS = 86400 / 3;
var STAGGERED_DAILY_JOBS = [
  // Zuerst: ohne Quellenliste spawnt in einem frisch geclaimten Raum kein Miner.
  // Nach der ersten Erhebung kostet der Job nur noch einen Blick ins Memory.
  { run: discover },
  { run: findAndSaveRoomWalls },
  { run: findAndSaveRoomContainer },
  { run: findAndSaveRoomTower },
  { section: SECTION.roads, run: rebuildRoads },
  { section: SECTION.linkplan, run: planReceiverLinks }
];
var STAGGER_START = 2;
function daylie() {
  const slot = Game.time % DAY_TICKS;
  if (slot === 0) {
    clear();
    return;
  }
  if (slot === 1) {
    findAndSaveTerminals();
    return;
  }
  const roomNames = Object.keys(bot.room);
  if (roomNames.length === 0) return;
  const index = slot - STAGGER_START;
  if (index < 0 || index >= STAGGERED_DAILY_JOBS.length * roomNames.length) return;
  const job = STAGGERED_DAILY_JOBS[Math.floor(index / roomNames.length)];
  const roomName = roomNames[index % roomNames.length];
  if (!job.section) {
    job.run(roomName);
    return;
  }
  begin(job.section);
  job.run(roomName);
  end(job.section);
}

// src/prototypes/creep-checks.ts
function installCreepChecks() {
  Creep.prototype.checkHarvest = function(action, action2) {
    const pathCache = new PathMemory(this.memory);
    if (!this.memory.harvest && this.store.getUsedCapacity() === 0) {
      if (typeof action == "function")
        action.call(this);
      this.memory.harvest = true;
      this.memory.fromId = null;
      this.say("\u{1F6D2}");
      pathCache.forgetPath();
    }
    if (this.memory.harvest && this.store.getFreeCapacity() === 0) {
      if (typeof action2 == "function")
        action2.call(this);
      this.memory.harvest = false;
      delete this.memory.useRoomSource;
      pathCache.forgetPath();
      delete this.memory.useContainer;
    }
    if (this.memory.harvest && this.store.getUsedCapacity() > 0 && this.memory.mineral !== "energy") {
      this.memory.harvest = false;
      delete this.memory.useRoomSource;
      pathCache.forgetPath();
      delete this.memory.useContainer;
    }
  };
  Creep.prototype.checkInvasion = function() {
    if (Memory.rooms[this.memory.workroom].needDefence || Memory.rooms[this.memory.workroom].invaderCore && Game.rooms[this.memory.workroom] && Game.rooms[this.memory.workroom].controller && Game.rooms[this.memory.workroom].controller.reservation && Game.rooms[this.memory.workroom].controller.reservation.username != this.owner.username) {
      this.say("\u260E");
      return true;
    }
    return false;
  };
  Creep.prototype.checkWorkroomPrioSpawn = function() {
    if (Memory.rooms[this.memory.workroom].aktivPrioSpawn) {
      this.say("\u{1F6A8}");
      return true;
    }
    return false;
  };
}

// src/prototypes/terminal-market.ts
var T1_BOOSTS = {
  UH2O: true,
  UHO2: true,
  KH2O: true,
  KHO2: true,
  ZH2O: true,
  ZHO2: true,
  LH2O: true,
  LHO2: true,
  GH2O: true,
  GHO2: true
};
var T1_INTERMEDIATES = {
  UH: true,
  UO: true,
  KH: true,
  KO: true,
  ZH: true,
  ZO: true,
  LH: true,
  LO: true,
  GH: true,
  GO: true
};
var NEVER_SELL2 = {
  energy: true,
  power: true,
  pixel: true,
  XUH2O: true,
  XUHO2: true,
  XKHO2: true,
  XKH2O: true,
  XZH2O: true,
  XZHO2: true,
  XLH2O: true,
  XLHO2: true,
  XGH2O: true,
  XGHO2: true
};
var TerminalMarket = class {
  /**
   * Verkauft höchstens eine Ressource je Aufruf über eine Kauf-Order am Markt.
   * Energie wird nie verkauft, sondern nur als Deckung für die Transferkosten
   * geprüft.
   */
  sell(terminal) {
    if (terminal.cooldown > 1) return;
    const terminalEnergy = terminal.store.getUsedCapacity(RESOURCE_ENERGY);
    if (terminalEnergy < 1e3 || terminalEnergy >= terminal.store.getUsedCapacity())
      return;
    for (const resource in terminal.store) {
      if (NEVER_SELL2[resource]) continue;
      const minPrice = this.getFallbackPrice(resource);
      if (!minPrice) continue;
      const orders = Game.market.getAllOrders({
        type: ORDER_BUY,
        resourceType: resource
      });
      const marketOrdersWithDistances = orders.filter((o) => o.price >= minPrice).map((order) => {
        const distance = terminal.pos.getRangeTo(
          new RoomPosition(25, 25, order.roomName)
        );
        return {
          order,
          distance
        };
      }).sort((a, b) => a.distance - b.distance);
      const capa = terminal.store.getUsedCapacity(resource);
      for (let i = 0; i < marketOrdersWithDistances.length; i++) {
        const order = marketOrdersWithDistances[i].order;
        let amount = order.amount > capa ? capa : order.amount;
        const transferEnergyCost = Game.market.calcTransactionCost(
          amount,
          terminal.room.name,
          order.roomName
        );
        const costPerRes = transferEnergyCost / amount;
        if (costPerRes < 0.789) {
          if (transferEnergyCost > terminalEnergy)
            amount = Math.floor(terminalEnergy / costPerRes);
          if (OK == Game.market.deal(order.id, amount, terminal.room.name)) {
            console.log(
              "[" + terminal.room.name + "] " + resource + " verkauft: " + amount + " zu " + order.price
            );
            return;
          }
        }
      }
    }
  }
  /**
   * Kauft Pixel, solange ein Angebot unter der fairen Preisgrenze liegt.
   * Effektivpreis schließt die Transferenergie mit ein.
   */
  buyPixel(terminal) {
    if (terminal.cooldown > 1) return;
    const terminalEnergy = terminal.store.getUsedCapacity("energy");
    const freeCapacity = terminal.store.getFreeCapacity();
    if (terminalEnergy < 1e3 || freeCapacity <= 10) return;
    const resource = "pixel";
    const avgPrice = this.averageHistoryPrice(resource);
    if (avgPrice === null) return;
    const fairPrice = Math.floor(avgPrice * 1.1);
    const orders = Game.market.getAllOrders({
      type: ORDER_SELL,
      resourceType: resource
    });
    if (!orders.length) return;
    const valid = orders.filter((o) => o.roomName).map((o) => {
      const energyCost = Game.market.calcTransactionCost(
        1,
        terminal.room.name,
        o.roomName
      );
      const effectivePrice = o.price + energyCost / Math.min(o.amount, 50);
      return { o, energyCost, effectivePrice };
    }).filter(
      (x) => x.effectivePrice <= fairPrice && x.energyCost <= terminalEnergy
    ).sort((a, b) => a.effectivePrice - b.effectivePrice);
    if (!valid.length) return;
    const order = valid[0].o;
    const amount = Math.min(
      50,
      order.amount,
      Math.floor(Game.market.credits / order.price),
      Math.floor(
        terminalEnergy / Game.market.calcTransactionCost(1, terminal.room.name, order.roomName)
      )
    );
    if (amount <= 0) return;
    if (OK === Game.market.deal(order.id, amount, terminal.room.name)) {
      console.log(
        `[${terminal.room.name}] Pixel Sniper: ${amount} zu ${order.price} (effektiv inkl. Energie: ${valid[0].effectivePrice.toFixed(2)})`
      );
    }
  }
  /**
   * Ersatzpreis für eine Ressource ohne eigene Order-Logik: T1-Boosts und
   * ihre Zwischenprodukte sind praktisch geschenkt, sonst 70 % des
   * Historiendurchschnitts. `null`, wenn auch das nicht zu ermitteln ist.
   */
  getFallbackPrice(resource) {
    if (T1_BOOSTS[resource]) {
      return 1e-3;
    }
    if (T1_INTERMEDIATES[resource]) {
      return 1e-3;
    }
    const avg = this.averageHistoryPrice(resource);
    if (avg === null) return null;
    return avg * 0.7;
  }
  /**
   * Durchschnittspreis über die komplette Markthistorie einer Ressource,
   * `null` ohne Historie. Der Faktor auf diesen Durchschnitt (0,7 beim
   * Verkauf, 1,1 beim Pixelkauf) bleibt bei den Aufrufern — das ist fachlich
   * verschieden und keine Wiederholung.
   */
  averageHistoryPrice(resource) {
    const history = Game.market.getHistory(resource);
    if (!history || !history.length) return null;
    return history.reduce((sum, entry) => sum + entry.avgPrice, 0) / history.length;
  }
};
TerminalMarket = __decorateClass([
  profile
], TerminalMarket);
var terminalMarket = new TerminalMarket();
function installTerminalMarket() {
  StructureTerminal.prototype.sell = function() {
    terminalMarket.sell(this);
  };
  StructureTerminal.prototype.buyPixel = function() {
    terminalMarket.buyPixel(this);
  };
}

// src/main.ts
var botMemory4 = Memory;
var reportedErrors = /* @__PURE__ */ new Set();
function reportError(kind, message) {
  console.log(message);
  if (reportedErrors.has(kind)) return;
  reportedErrors.add(kind);
  Game.notify(message, 180);
}
function runTimed(kind, label, step) {
  var _a;
  begin(SECTION.timing);
  try {
    step();
  } catch (error) {
    reportError(kind, `${label}
${(_a = error == null ? void 0 : error.stack) != null ? _a : String(error)}`);
  }
  end(SECTION.timing);
}
installCreepChecks();
installTerminalMarket();
var measuredJobs = wrapRoles(jobs);
function loop() {
  var _a, _b;
  tick();
  runTimed("timing.kritisch", "controller/timing (kritischer Teil)", () => {
    controllCritical();
  });
  begin(SECTION.rooms);
  for (const name in bot.room) {
    const room = Game.rooms[name];
    try {
      const roomMemory2 = Memory.rooms[name];
      if (roomMemory2.nuke && roomMemory2.nukepos.length > 0) {
        for (const nuke of roomMemory2.nukepos) {
          new RoomVisual(name).circle(nuke.x, nuke.y, {
            fill: "transparent",
            radius: 5,
            stroke: "#ff0000"
          });
        }
      }
    } catch {
      botMemory4.init = false;
      init();
    }
    if ((_a = room == null ? void 0 : room.controller) == null ? void 0 : _a.my) {
      new RoomVisual(name).text(
        `${room.energyAvailable}/${room.energyCapacityAvailable}`,
        2,
        1,
        { color: "white", font: 0.8 }
      );
    }
  }
  end(SECTION.rooms);
  begin(SECTION.creeps);
  let processedCreeps = 0;
  for (const name in Memory.creeps) {
    const creep = Game.creeps[name];
    if (!creep) {
      delete Memory.creeps[name];
      continue;
    }
    const creepMemory = creep.memory;
    if (!creepMemory.role) {
      if (creep.suicide() === OK) {
        delete Memory.creeps[name];
      }
      continue;
    }
    if (creep.spawning) {
      continue;
    }
    const job = measuredJobs[creepMemory.role];
    if (!job) {
      reportError(
        `rolle-unbekannt:${creepMemory.role}`,
        `Creep ${name}: unbekannte Rolle "${creepMemory.role}"`
      );
      continue;
    }
    processedCreeps += 1;
    try {
      job.doJob(creep);
    } catch (error) {
      reportError(
        `rolle:${creepMemory.role}`,
        `Job: ${creepMemory.role} (${name})
${(_b = error == null ? void 0 : error.stack) != null ? _b : String(error)}`
      );
    }
  }
  end(SECTION.creeps);
  runTimed("timing", "controller/timing", () => {
    controll();
  });
  endTick(processedCreeps);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loop
});
