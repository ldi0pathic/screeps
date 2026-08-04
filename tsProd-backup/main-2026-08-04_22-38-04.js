// Build: 2026-08-04 22:38:04 +02:00
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    debitorProSource: 1,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb07b9099fc012e63c406"],
    mineralSources: [],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    //controller
    upgrader: 0
  },
  E58N4: {
    room: "E58N4",
    spawnRoom: "E59N4",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: false,
    sendDefender: true,
    sendClaimer: true,
    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c595"],
    mineralSources: [],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    destroy: ["63adb4b3aeebaa08e3aa2851"],
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
    debitorProSource: 1,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c593"],
    mineralSources: [],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,
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
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb08d9099fc012e63c58f", "5bbcb08d9099fc012e63c590"],
    mineralSources: ["5bbcb72cd867df5e54207db1"],
    useLinks: true,
    targetLinks: ["653aed0d2fa32d1c887ab4e7", "657f0915dbc7505af702443c"],
    spawnLink: "657f0915dbc7505af702443c",
    controllerLink: "653aed0d2fa32d1c887ab4e7",
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
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorProSource: 0,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb08d9099fc012e63c58c", "5bbcb08d9099fc012e63c58a"],
    mineralSources: ["5bbcb72cd867df5e54207db0"],
    mineralContainerId: "658f0b73615ae9c2e4995fb6",
    useLinks: true,
    targetLinks: ["655269336b163b788bbbaec1", "65380c0c74becf6de75f0370"],
    spawnLink: "655269336b163b788bbbaec1",
    controllerLink: "65380c0c74becf6de75f0370",
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
    debitorProSource: 2,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c588"],
    mineralSources: [],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,
    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    walls: [],
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
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb09f9099fc012e63c71f", "5bbcb09f9099fc012e63c71d"],
    mineralSources: ["5bbcb73ad867df5e54207e20"],
    mineralContainerId: null,
    useLinks: true,
    targetLinks: ["6666029dda8491c8c7f5b5f8", "65ad15e5e25690e38e742550"],
    spawnLink: "65ad15e5e25690e38e742550",
    controllerLink: "6666029dda8491c8c7f5b5f8",
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
    debitorProSource: 0,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb09e9099fc012e63c711"],
    mineralSources: ["5bbcb739d867df5e54207e1c"],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,
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
    debitorProSource: 2,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb09e9099fc012e63c70e"],
    mineralSources: [],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,
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
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,
    saveRoads: true,
    //mining
    debitorProSource: 0,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb09e9099fc012e63c70a", "5bbcb09e9099fc012e63c70b"],
    mineralSources: ["5bbcb739d867df5e54207e1a"],
    useLinks: true,
    targetLinks: ["655261fc8c582e53825955a1", "65354f9aade2340fef294995"],
    spawnLink: "655261fc8c582e53825955a1",
    controllerLink: "65354f9aade2340fef294995",
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
    const roomMemory = ensureRoomMemory(name);
    roomMemory.aktivPrioSpawn = Boolean(roomMemory.aktivPrioSpawn);
    roomMemory.hasLinks = Boolean(roomMemory.hasLinks);
    roomMemory.needDefence = Boolean(roomMemory.needDefence);
    roomMemory.invaderCore = Boolean(roomMemory.invaderCore);
    roomMemory.nuke = Boolean(roomMemory.nuke);
    (_c = roomMemory.aktivPrioSpawnCount) != null ? _c : roomMemory.aktivPrioSpawnCount = 0;
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
    const roomMemory = botMemory.rooms[name];
    if (!config.saveRoads && (roomMemory == null ? void 0 : roomMemory.roads)) {
      delete roomMemory.roads;
    }
  }
}
function writeStatus() {
  let message = "";
  for (const room in botMemory.rooms) {
    const roomMemory = botMemory.rooms[room];
    if (roomMemory == null ? void 0 : roomMemory.aktivPrioSpawn) message += `PrioSpawn im Raum ${room}
`;
    if (roomMemory == null ? void 0 : roomMemory.needDefence) message += `Angriff im Raum ${room}
`;
    if (roomMemory == null ? void 0 : roomMemory.invaderCore) message += `Core im Raum ${room}
`;
  }
  if (message) console.log(message);
}
function findAndSaveRoomWalls() {
  var _a;
  (_a = botMemory.rooms) != null ? _a : botMemory.rooms = {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config || config.maxwallRepairer < 1) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    ensureRoomMemory(name).wally = room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART
    }).map((structure) => structure.id);
  }
}
function findAndSaveRoomContainer() {
  var _a;
  (_a = botMemory.rooms) != null ? _a : botMemory.rooms = {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    ensureRoomMemory(name).container = room.find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_CONTAINER } }).map((structure) => structure.id);
  }
}
function findAndSaveRoomTower() {
  var _a;
  (_a = botMemory.rooms) != null ? _a : botMemory.rooms = {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    ensureRoomMemory(name).tower = room.find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }).map((structure) => structure.id);
  }
}
function findAndSaveTerminals() {
  botMemory.terminals = [];
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    const terminal = room.find(FIND_STRUCTURES, {
      filter: { structureType: STRUCTURE_TERMINAL }
    })[0];
    if (terminal) botMemory.terminals.push(terminal.id);
  }
}

// src/controller/defence.ts
function check() {
  for (var name in bot.room) {
    if (!bot.room[name].sendDefender) continue;
    if (Memory.rooms[name].invaderCoreEndTick && Game.time + 10 > Memory.rooms[name].invaderCoreEndTick) {
      Memory.rooms[name].invaderCore = false;
    }
    if (Memory.rooms[name].needDefenceEndTick && Game.time + 10 > Memory.rooms[name].needDefenceEndTick) {
      Memory.rooms[name].needDefence = false;
    }
    var room = Game.rooms[bot.room[name].room];
    if (!room) continue;
    var hostiles = room.find(FIND_HOSTILE_CREEPS);
    var core = room.find(FIND_HOSTILE_STRUCTURES, {
      filter: (s) => s.structureType == STRUCTURE_INVADER_CORE
    });
    var nukes = room.find(FIND_NUKES);
    Memory.rooms[name].needDefence = hostiles.length > 0;
    if (hostiles.length > (bot.room[name].minHostile || 1)) {
      let maxLifeTime = 0;
      for (var creep of hostiles) {
        if (creep.ticksToLive !== void 0 && creep.ticksToLive > maxLifeTime) {
          maxLifeTime = creep.ticksToLive;
        }
      }
      Memory.rooms[name].needDefenceEndTick = Game.time + maxLifeTime;
    }
    Memory.rooms[name].invaderCore = core.length > 0;
    if (core.length > 0) {
      Memory.rooms[name].claimed = false;
      var timeRemaining = 0;
      for (var effect of core[0].effects || []) {
        const time = effect.ticksRemaining;
        if (time > timeRemaining) {
          timeRemaining = time;
        }
      }
      Memory.rooms[name].invaderCoreEndTick = Game.time + timeRemaining;
    }
    if (nukes.length > 0) {
      var msg = "";
      Memory.rooms[name].nukepos = [];
      for (var nuke of nukes) {
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
function tower() {
  for (var name in bot.room) {
    var room = Game.rooms[name];
    if (!room || !room.controller || !room.controller.my || !Memory.rooms[name].tower || Memory.rooms[name].tower.length == 0)
      continue;
    if (Memory.rooms[name].needDefence) {
      var hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
      if (hostileCreeps.length > 0) {
        hostileCreeps.sort(function(a, b) {
          var costA = a.body.reduce(function(total, part) {
            return total + BODYPART_COST[part.type];
          }, 0);
          var costB = b.body.reduce(function(total, part) {
            return total + BODYPART_COST[part.type];
          }, 0);
          return costB - costA;
        });
        var totalHealPower = 0;
        for (var healer of hostileCreeps) {
          var healParts = healer.body.filter((part) => part.type === HEAL).length;
          totalHealPower += healParts * HEAL_POWER;
        }
        var target = null;
        for (var candidate of hostileCreeps) {
          var towerDamage = 0;
          for (var towerid of Memory.rooms[name].tower) {
            var t = Game.getObjectById(towerid);
            if (!t || t.store.getUsedCapacity(RESOURCE_ENERGY) < TOWER_ENERGY_COST) continue;
            var range = t.pos.getRangeTo(candidate.pos);
            if (range <= TOWER_OPTIMAL_RANGE) {
              towerDamage += TOWER_POWER_ATTACK;
            } else if (range >= TOWER_FALLOFF_RANGE) {
              towerDamage += TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF);
            } else {
              var fallOffShare = (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
              towerDamage += TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * fallOffShare);
            }
          }
          if (towerDamage > totalHealPower) {
            target = candidate;
            break;
          }
        }
        if (target) {
          for (var towerid of Memory.rooms[name].tower) {
            var tower2 = Game.getObjectById(towerid);
            if (tower2) tower2.attack(target);
          }
        } else {
          if (!Memory.rooms[name].structureHP) {
            Memory.rooms[name].structureHP = {};
            var allStructures = room.find(FIND_STRUCTURES);
            for (var structure of allStructures) {
              Memory.rooms[name].structureHP[structure.id] = structure.hits;
            }
          }
          var damagedStructure = null;
          var allStructures = room.find(FIND_STRUCTURES);
          for (var structure of allStructures) {
            if (Memory.rooms[name].structureHP[structure.id] && structure.hits < Memory.rooms[name].structureHP[structure.id]) {
              damagedStructure = structure;
              break;
            }
          }
          if (damagedStructure) {
            for (var towerid of Memory.rooms[name].tower) {
              var tower2 = Game.getObjectById(towerid);
              if (tower2) {
                tower2.repair(damagedStructure);
              }
            }
          }
        }
      } else {
        Memory.rooms[name].needDefence = false;
        delete Memory.rooms[name].structureHP;
      }
    } else if (Game.time % 3 == 2) {
      var damagedStructures = room.find(FIND_STRUCTURES, {
        filter: (structure2) => {
          return structure2.hits < (bot.prio.hits[structure2.structureType] || 0.5) * structure2.hitsMax;
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
        for (var towerid of Memory.rooms[name].tower) {
          var tower2 = Game.getObjectById(towerid);
          if (tower2 && tower2.store.getUsedCapacity([RESOURCE_ENERGY]) * 0.5 > tower2.store.getFreeCapacity([RESOURCE_ENERGY]))
            tower2.repair(damagedStructures[0]);
        }
      }
    }
  }
}

// src/controller/rebuild.ts
var botGlobal2 = global;
var botMemory2 = Memory;
function rebuildRoads() {
  var _a, _b;
  for (const name in botGlobal2.room) {
    const config = botGlobal2.room[name];
    const room = Game.rooms[name];
    if (!(config == null ? void 0 : config.saveRoads) || !room || ((_a = room.controller) == null ? void 0 : _a.level) === void 0 || room.controller.level < 7) {
      continue;
    }
    const roomMemory = botMemory2.rooms[name];
    if (!(roomMemory == null ? void 0 : roomMemory.roads)) continue;
    let freeSlots = 10 - room.find(FIND_CONSTRUCTION_SITES).length;
    if (freeSlots <= 0) continue;
    for (const roadMemory of roomMemory.roads) {
      if (freeSlots <= 0) break;
      if (Game.getObjectById(roadMemory.id)) continue;
      const result = new RoomPosition(roadMemory.pos.x, roadMemory.pos.y, name).createConstructionSite(STRUCTURE_ROAD);
      if (result === OK) {
        roomMemory.autobuild = ((_b = roomMemory.autobuild) != null ? _b : 0) + 1;
        freeSlots--;
      }
    }
  }
}

// src/creep/goto.ts
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
      ;
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
function moveByMemory(creep, target) {
  if (creep.pos.isEqualTo(target)) {
    delete creep.memory.path;
    delete creep.memory.pathTarget;
    delete creep.memory.dontMove;
    delete creep.memory.lastPos;
    return false;
  }
  var deserializePath;
  var serializedPath;
  if (creep.memory.dontMove > 3) {
    deserializePath = creep.pos.findPathTo(target, { ignoreCreeps: false });
    serializedPath = Room.serializePath(deserializePath);
    creep.memory.path = serializedPath;
    creep.memory.dontMove = 0;
    creep.moveByPath(serializedPath);
    return true;
  }
  var t = creep.memory.pathTarget;
  var p = creep.memory.path;
  if (p && t && t.roomName && target.isEqualTo(new RoomPosition(t.x, t.y, t.roomName))) {
    serializedPath = p;
  } else {
    deserializePath = creep.pos.findPathTo(target, { ignoreCreeps: true });
    serializedPath = Room.serializePath(deserializePath);
    creep.memory.path = serializedPath;
    creep.memory.pathTarget = {};
    creep.memory.pathTarget.x = target.x;
    creep.memory.pathTarget.y = target.y;
    creep.memory.pathTarget.roomName = target.roomName;
  }
  var state = creep.moveByPath(serializedPath);
  if (bot.const.showPaths) {
    if (!deserializePath)
      deserializePath = Room.deserializePath(serializedPath);
    const currentPos = creep.pos;
    const index = deserializePath.findIndex((pos) => pos.x === currentPos.x && pos.y === currentPos.y);
    if (index > 0) {
      const visual = new RoomVisual(creep.room.name);
      for (let i = index + 1; i < deserializePath.length; i++) {
        visual.circle(
          deserializePath[i].x,
          deserializePath[i].y,
          { fill: "transparent", radius: 0.25, stroke: "red" }
        );
      }
    }
  }
  switch (state) {
    case OK:
    case ERR_TIRED: {
      if (creep.memory.lastPos && creep.memory.lastPos.x == creep.pos.x && creep.memory.lastPos.y == creep.pos.y) {
        creep.memory.dontMove = (creep.memory.dontMove || 0) + 1;
      } else {
        creep.memory.lastPos = {};
        creep.memory.lastPos.x = creep.pos.x;
        creep.memory.lastPos.y = creep.pos.y;
        creep.memory.dontMove = 0;
      }
      return true;
    }
    case ERR_INVALID_ARGS:
    case ERR_NO_BODYPART:
    case ERR_NOT_FOUND: {
      delete creep.memory.path;
      delete creep.memory.pathTarget;
      delete creep.memory.dontMove;
      delete creep.memory.lastPos;
      return true;
    }
    default:
      return false;
  }
}

// src/creep/transport.ts
function _Transfer(creep, target, type) {
  if (target) {
    switch (creep.transfer(target, type)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, target.pos);
        return true;
      case OK:
        return true;
      default:
        return false;
    }
  }
  return false;
}
function TransportToHomeContainer(creep, type, mul) {
  var container;
  if (!mul) mul = 0.5;
  if (creep.memory.useContainer) {
    container = Game.getObjectById(creep.memory.useContainer);
  } else if (Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name].container) {
    var distance = Infinity;
    var minCap = creep.store.getUsedCapacity() * mul;
    for (var id of Memory.rooms[creep.room.name].container) {
      var c = Game.getObjectById(id);
      if (c && c.store.getFreeCapacity(type) > minCap && c.id != bot.room[creep.room.name].mineralContainerId && c.id != creep.memory.fromId) {
        var d = Math.sqrt(Math.pow(creep.pos.x - c.pos.x, 2) + Math.pow(creep.pos.y - c.pos.y, 2));
        if (d < distance) {
          distance = d;
          container = c;
          creep.memory.useContainer = container.id;
        }
      }
    }
  } else if (Memory.rooms[creep.room.name] && !Memory.rooms[creep.room.name].container) {
    var containers = creep.room.find(FIND_STRUCTURES, { filter: (structure) => {
      return structure.structureType === STRUCTURE_CONTAINER;
    } });
    Memory.rooms[creep.room.name].container = containers.map((c2) => {
      return c2.id;
    });
    return containers.length > 0;
  }
  if (container && container.store.getFreeCapacity() > 0) {
    switch (creep.transfer(container, type)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, container.pos);
        return true;
      case OK:
        delete creep.memory.useContainer;
        return true;
      default:
        return false;
    }
  }
  delete creep.memory.useContainer;
  return false;
}
function TransportToHomeTerminal(creep) {
  if (!creep.room.controller.my || creep.room.controller.level < 6)
    return false;
  var terminal;
  if (Memory.rooms[creep.memory.workroom].terminalId) {
    terminal = Game.getObjectById(Memory.rooms[creep.memory.workroom].terminalId);
    if (!terminal) {
      delete Memory.rooms[creep.memory.workroom].terminalId;
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
      Memory.rooms[creep.memory.workroom].terminalId = target[0].id;
      terminal = target[0];
    }
  }
  if (terminal && terminal.store.getFreeCapacity() > 0) {
    var t = false;
    for (var resourceType in creep.store) {
      if (resourceType == RESOURCE_ENERGY && terminal.store[RESOURCE_ENERGY] > 1e5)
        continue;
      if (_Transfer(creep, terminal, resourceType) && !t) {
        t = true;
      }
    }
    return t;
  }
  return false;
}
function TransportToHomeLab(creep, type) {
  var target = creep.pos.findClosestByPath(
    FIND_MY_STRUCTURES,
    {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_LAB && structure.store.getFreeCapacity([type]) > 0 && structure.id != creep.memory.fromId;
      }
    }
  );
  return _Transfer(creep, target, type);
}
function TransportEnergyToHomeSpawn(creep) {
  if (creep.memory.home != creep.room.name || creep.store[RESOURCE_ENERGY] == 0)
    return false;
  var target = creep.pos.findClosestByPath(
    FIND_MY_STRUCTURES,
    {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) && structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 0 && structure.id != creep.memory.fromId;
      }
    }
  );
  return _Transfer(creep, target, RESOURCE_ENERGY);
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
  if (towers.length > 0) {
    towers.sort((a, b) => b.store.getFreeCapacity(RESOURCE_ENERGY) - a.store.getFreeCapacity(RESOURCE_ENERGY));
    return _Transfer(creep, towers[0], RESOURCE_ENERGY);
  }
  return false;
}
function TransportToHomeStorage(creep) {
  var target = creep.room.storage;
  if (!target)
    return false;
  if (creep.memory.fromId == target.id)
    return false;
  for (var resourceType in creep.store) {
    _Transfer(creep, target, resourceType);
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
function harvestRoomDrops(creep, type) {
  var drop;
  if (creep.memory.useRoomDrop) {
    drop = Game.getObjectById(creep.memory.useRoomDrop);
  } else {
    drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) => d.amount > 100 });
  }
  if (drop) {
    switch (creep.pickup(drop)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, drop.pos);
        creep.memory.useRoomDrop = drop.id;
        return true;
      case OK:
        creep.memory.useRoomDrop = drop.id;
        creep.memory.fromId = drop.id;
        return true;
      case ERR_INVALID_TARGET:
      default:
        delete creep.memory.useRoomDrop;
        return false;
    }
  }
  delete creep.memory.useRoomDrop;
  return false;
}
function harvestRoomTombstones(creep, type) {
  var tombstone;
  if (creep.memory.useTombstone) {
    tombstone = Game.getObjectById(creep.memory.useTombstone);
  } else {
    tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity(type) > 100 });
  }
  if (tombstone) {
    switch (creep.withdraw(tombstone, type)) {
      case ERR_NOT_IN_RANGE:
        creep.memory.useTombstone = tombstone.id;
        moveByMemory(creep, tombstone.pos);
        return true;
      case OK:
        creep.memory.useTombstone = tombstone.id;
        creep.memory.fromId = tombstone.id;
        return true;
      case ERR_INVALID_TARGET:
      default:
        delete creep.memory.useTombstone;
        return false;
    }
  }
  delete creep.memory.useTombstone;
  return false;
}
function harvestCompleteRoomTombstones(creep) {
  var tombstone;
  if (creep.memory.useTombstone) {
    tombstone = Game.getObjectById(creep.memory.useTombstone);
  } else {
    tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity() > 100 });
  }
  if (tombstone) {
    for (var resourceType in tombstone.store) {
      switch (creep.withdraw(tombstone, resourceType)) {
        case ERR_NOT_IN_RANGE:
          moveByMemory(creep, tombstone.pos);
          creep.memory.useTombstone = tombstone.id;
          return true;
        case OK:
          creep.memory.useTombstone = tombstone.id;
          creep.memory.fromId = tombstone.id;
          return true;
        case ERR_INVALID_TARGET:
        default:
          delete creep.memory.useTombstone;
          return false;
      }
    }
  }
  delete creep.memory.useTombstone;
  return false;
}
function harvestRoomRuins(creep, type) {
  var ruin;
  if (creep.memory.useRuin) {
    ruin = Game.getObjectById(creep.memory.useRuin);
  } else {
    ruin = creep.pos.findClosestByPath(FIND_RUINS, { filter: (d) => d.store.getUsedCapacity(type) > 50 });
  }
  if (ruin) {
    switch (creep.withdraw(ruin, type)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, ruin.pos);
        creep.memory.useRuin = ruin.id;
        return true;
      case OK:
        creep.memory.useRuin = ruin.id;
        creep.memory.fromId = ruin.id;
        return true;
      case ERR_INVALID_TARGET:
      default:
        delete creep.memory.useRuin;
        return false;
    }
  }
  delete creep.memory.useRuin;
  return false;
}
function harvestRoomStorage(creep, type) {
  let storage = creep.room.storage;
  let min = type === "energy" ? creep.store.getCapacity() * 0.5 : 50;
  if (storage && storage.store[type] > min) {
    var state = creep.withdraw(storage, type);
    switch (state) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, storage.pos);
        return true;
      case OK:
        creep.memory.fromId = storage.id;
        return true;
      default:
        return false;
    }
  }
  return false;
}
function harvestRoomContainer(creep, type, mul) {
  if (!mul) mul = 0.5;
  var container;
  if (creep.memory.useContainer) {
    container = Game.getObjectById(creep.memory.useContainer);
  } else if (Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name].container && Memory.rooms[creep.room.name].container.length > 0) {
    var distance = Infinity;
    var minCap = creep.store.getFreeCapacity() * mul;
    for (var id of Memory.rooms[creep.room.name].container) {
      var c = Game.getObjectById(id);
      if (!c) {
        delete Memory.rooms[creep.room.name].container;
      }
      if (c && c.store.getUsedCapacity(type) > minCap) {
        var d = Math.sqrt(Math.pow(c.pos.x - creep.pos.x, 2) + Math.pow(c.pos.y - creep.pos.y, 2));
        if (d < distance) {
          distance = d;
          container = c;
          creep.memory.useContainer = c.id;
        }
      }
    }
  } else if (Memory.rooms[creep.room.name] && (!Memory.rooms[creep.room.name].container || Memory.rooms[creep.room.name].container && Memory.rooms[creep.room.name].container.length == 0)) {
    var containers = creep.room.find(FIND_STRUCTURES, { filter: (structure) => {
      return structure.structureType === STRUCTURE_CONTAINER;
    } });
    Memory.rooms[creep.room.name].container = containers.map((c2) => {
      return c2.id;
    });
    return containers.length > 0;
  }
  if (container && container.store.getUsedCapacity(type) > creep.store.getFreeCapacity() * mul) {
    switch (creep.withdraw(container, type)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, container.pos);
        return true;
      case OK:
        creep.memory.fromId = container.id;
        return true;
      default:
        delete creep.memory.useContainer;
        return false;
    }
  }
  delete creep.memory.useContainer;
  return false;
}
function harvestControllerLink(creep, type) {
  if (creep.memory.workroom != creep.room.name || !bot.room[creep.memory.workroom].controllerLink || !creep.room.controller.my || creep.room.controller.level < 5)
    return false;
  var link = Game.getObjectById(bot.room[creep.memory.workroom].controllerLink);
  if (link && link.store[type] > 100) {
    switch (creep.withdraw(link, type)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, link.pos);
        return true;
      case OK:
        creep.memory.fromId = link.id;
        return true;
      default:
        return false;
    }
  } else {
    creep.memory.noLink = true;
  }
  return false;
}
function harvestMyContainer(creep, type) {
  if (creep.memory.workroom != creep.room.name || creep.memory.container == "")
    return false;
  var container = Game.getObjectById(creep.memory.container);
  if (container) {
    if (container.store[type] < 100) {
      return false;
    }
    switch (creep.withdraw(container, type)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, container.pos);
        return true;
      case OK:
        creep.memory.fromId = container.id;
        return true;
      default:
        return false;
    }
  }
  return false;
}
function harvestNotfall(creep) {
  var notfall = creep.room.find(FIND_STRUCTURES, { filter: (structure) => {
    return (structure.structureType === STRUCTURE_LINK || structure.structureType === STRUCTURE_LAB || structure.structureType === STRUCTURE_NUKER || structure.structureType == STRUCTURE_TOWER) && structure.store[RESOURCE_ENERGY] > 0;
  } });
  if (notfall.length > 0) {
    notfall.sort(function(a, b) {
      return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
    });
    switch (creep.withdraw(notfall[0], RESOURCE_ENERGY)) {
      case ERR_NOT_IN_RANGE:
        moveByMemory(creep, notfall[0].pos);
        return true;
      case OK:
        creep.memory.fromId = notfall[0].id;
        return true;
      default:
        return false;
    }
  }
  return false;
}
function harvestRoomEnergySource(creep) {
  if (canHarvestEnergy(creep)) {
    var source;
    if (creep.memory.useRoomSource) {
      source = Game.getObjectById(creep.memory.useRoomSource);
    } else {
      source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
    }
    if (source && source.energy > 100) {
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        if (creep.moveTo(source) == ERR_NO_PATH) {
          delete creep.memory.useRoomSource;
          return false;
        }
      }
      creep.memory.useRoomSource = source.id;
      creep.memory.fromId = source.id;
      return true;
    }
    delete creep.memory.useRoomSource;
  }
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
function moveByMemory2(creep, target) {
  return moveByMemory(creep, target);
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
  const state = creep.upgradeController(controller);
  if (state === ERR_NOT_IN_RANGE || state === ERR_INVALID_TARGET && controller.upgradeBlocked > 0) {
    moveByMemory(creep, controller.pos);
  }
  if (!controller.sign || controller.sign.username == void 0 || controller.sign.username != creep.owner.username) {
    var c = creep.signController(controller, "\u2694");
    if (c === ERR_NOT_IN_RANGE) {
      moveByMemory(creep, controller.pos);
    }
  }
  return state == OK;
}
function spawn(spawn3, profil, newName, memory) {
  if (spawn3.spawnCreep(profil, newName, { dryRun: true }) === 0) {
    spawn3.spawnCreep(profil, newName, { memory });
    console.log("[" + spawn3.room.name + "|" + memory.workroom + "] spawn " + newName + " cost: " + calcProfil(profil));
    return true;
  }
  return false;
}

// src/profiler/state.ts
var MAX_BASELINES = 8;
var profilerMemory = Memory;
var currentMode = "off";
function ensureMemory() {
  var _a;
  return (_a = profilerMemory.profiler) != null ? _a : profilerMemory.profiler = { mode: "off" };
}
function syncFromMemory() {
  currentMode = ensureMemory().mode;
  return currentMode;
}
function getMode() {
  return currentMode;
}
function setMode(mode) {
  ensureMemory().mode = mode;
  currentMode = mode;
}
function startDetail(ticks) {
  const memory = ensureMemory();
  if (memory.detailUntil === void 0) {
    memory.detailReturnTo = currentMode;
  }
  memory.detailUntil = Game.time + ticks;
  memory.mode = "full";
  currentMode = "full";
}
function cancelDetail() {
  const memory = ensureMemory();
  delete memory.detailUntil;
  delete memory.detailReturnTo;
}
function detailActive() {
  return ensureMemory().detailUntil !== void 0;
}
function detailRemaining() {
  const memory = ensureMemory();
  if (memory.detailUntil === void 0) {
    return 0;
  }
  const remaining = memory.detailUntil - Game.time;
  return remaining > 0 ? remaining : 0;
}
function expireDetail() {
  var _a;
  const memory = ensureMemory();
  if (memory.detailUntil === void 0 || Game.time < memory.detailUntil) {
    return false;
  }
  const returnTo = (_a = memory.detailReturnTo) != null ? _a : "off";
  delete memory.detailUntil;
  delete memory.detailReturnTo;
  memory.mode = returnTo;
  currentMode = returnTo;
  return true;
}
function saveBaseline(name, baseline) {
  var _a;
  const memory = ensureMemory();
  const baselines = (_a = memory.baselines) != null ? _a : memory.baselines = {};
  baselines[name] = baseline;
  const names = Object.keys(baselines);
  if (names.length <= MAX_BASELINES) {
    return;
  }
  let oldestName = names[0];
  let oldestTick = baselines[oldestName].tick;
  for (const candidate of names) {
    const tick2 = baselines[candidate].tick;
    if (tick2 < oldestTick) {
      oldestTick = tick2;
      oldestName = candidate;
    }
  }
  delete baselines[oldestName];
}
function readBaselines() {
  var _a;
  return (_a = ensureMemory().baselines) != null ? _a : {};
}
function getFlagColor() {
  return ensureMemory().flagColor;
}
function setFlagColor(color) {
  ensureMemory().flagColor = color;
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
  /** Tagessequenz, `daylie()`. */
  daily: "timing.daily"
};

// src/profiler/window.ts
var openSections = /* @__PURE__ */ new Map();
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
var windowState = createEmptySnapshot();
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
function begin(section) {
  if (getMode() !== "full") return;
  openSections.set(section, Game.cpu.getUsed());
}
function end(section) {
  if (getMode() !== "full") return;
  const start = openSections.get(section);
  if (start === void 0) return;
  openSections.delete(section);
  record(windowState.sections, section, Game.cpu.getUsed() - start);
}
function beginTick() {
  if (getMode() === "off") return;
  if (windowState.ticks === 0) {
    windowState.startTick = Game.time;
  }
  windowState.ticks += 1;
}
function endTick(creepCount) {
  const mode = getMode();
  if (mode === "off") return;
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
function recordRole(role12, cpu) {
  record(windowState.roles, role12, cpu);
}
function recordMethod(key, cpu) {
  record(windowState.methods, key, cpu);
}
function recordCreep(creepName, cpu) {
  if (getMode() !== "full") return;
  if (!detailActive()) return;
  record(windowState.creepDetail, creepName, cpu);
}
function snapshot() {
  return windowState;
}
function metrics(snapshotState) {
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
    methods: rank(snapshotState.methods, ticks, snapshotState.cpuTotal),
    creepDetail: rank(snapshotState.creepDetail, ticks, snapshotState.cpuTotal)
  };
}
function reset() {
  openSections.clear();
  windowState = createEmptySnapshot();
}
function isDue() {
  return windowState.ticks >= WINDOW_TICKS;
}

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
    if (getMode() !== "full") {
      return originalFunction.apply(this, args);
    }
    const start = Game.cpu.getUsed();
    const result = originalFunction.apply(this, args);
    recordMethod(memKey, Game.cpu.getUsed() - start);
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
  for (const role12 in jobs2) {
    const original = jobs2[role12];
    wrapped[role12] = {
      doJob(creep) {
        if (getMode() !== "full") {
          original.doJob(creep);
          return;
        }
        const start = Game.cpu.getUsed();
        original.doJob(creep);
        const cpu = Game.cpu.getUsed() - start;
        recordRole(role12, cpu);
        recordCreep(creep.name, cpu);
      },
      spawn(spawn3, workroom) {
        if (getMode() !== "full") {
          return original.spawn(spawn3, workroom);
        }
        const start = Game.cpu.getUsed();
        const result = original.spawn(spawn3, workroom);
        recordRole(`${role12}.spawn`, Game.cpu.getUsed() - start);
        return result;
      }
    };
  }
  return wrapped;
}

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
        let state = creep.build(target);
        if (state === ERR_NOT_IN_RANGE) {
          moveByMemory(creep, target.pos);
        }
        return true;
      } else {
        creep.memory.id = null;
      }
    }
    return false;
  }
  _getProfil(spawn3) {
    const totalCost = 3 * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
    var maxEnergy = spawn3.room.energyCapacityAvailable;
    var numberOfSets = Math.min(7, Math.floor(maxEnergy / totalCost));
    if (numberOfSets == 0) {
      return [WORK, CARRY, CARRY, MOVE, MOVE];
    }
    return Array(numberOfSets * 3).fill(WORK).concat(Array(numberOfSets * 2).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
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
    return spawn(spawn3, this._getProfil(spawn3), role + "_" + Game.time, { role, workroom, home: spawn3.room.name });
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
          moveByMemory2(creep, controller.pos);
        }
        if (s === OK) {
          Memory.rooms[creep.memory.workroom].claimed = true;
        }
        return;
      }
      var state = creep.reserveController(controller);
      if (state === ERR_NOT_IN_RANGE) {
        moveByMemory2(creep, controller.pos);
      } else if (state == ERR_INVALID_TARGET) {
        creep.say("\u{1FA93}");
        creep.attackController(controller);
        Memory.rooms[creep.memory.workroom].claimed = false;
      } else if (state == OK) {
        Memory.rooms[creep.memory.workroom].claimed = true;
      }
      if (controller.sign.username != creep.owner.username) {
        creep.signController(controller, "\u2694");
      }
    }
  }
  _getProfil() {
    return [CLAIM, CLAIM, MOVE, MOVE];
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
    return spawn(spawn3, this._getProfil(), role2 + "_" + Game.time, { role: role2, workroom, home: spawn3.room.name });
  }
};
Claimer = __decorateClass([
  profile
], Claimer);
var claimer_default = new Claimer();

// src/roles/debitor.ts
var role3 = "debitor";
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
      function() {
        if (this.memory.home == this.memory.workroom)
          return;
        if (!Memory.rooms[this.memory.workroom].needDebitorSize) {
          if (this.memory.distance > 0) {
            if (!Memory.rooms[this.memory.workroom].distances)
              Memory.rooms[this.memory.workroom].distances = [];
            Memory.rooms[this.memory.workroom].distances.push(this.memory.distance);
            this.memory.distance = 0;
          }
        }
      },
      function() {
        creep.memory.mineral = RESOURCE_ENERGY;
        if (this.memory.home == this.memory.workroom)
          return;
        if (!Memory.rooms[this.memory.workroom].needDebitorSize) {
          if (this.memory.distance > 0) {
            if (!Memory.rooms[this.memory.workroom].distances)
              Memory.rooms[this.memory.workroom].distances = [];
            Memory.rooms[this.memory.workroom].distances.push(this.memory.distance);
            this.memory.distance = 0;
          }
        }
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
   *
   * @param {StructureSpawn} spawn
   */
  getProfil(spawn3, workroom, mineraltype, containerId) {
    if (mineraltype == RESOURCE_ENERGY) {
      if (spawn3.room.name != workroom) {
        var carry = Memory.rooms[workroom].needDebitorSize;
        var distances = Memory.rooms[workroom].distances;
        var c = 1;
        if (!carry && distances) {
          var length = Math.ceil(distances.length * 0.5);
          var meridian = distances.sort(function(a, b) {
            return a - b;
          })[length];
          carry = Math.ceil(2 * meridian / 5);
          var max = Math.min(25, parseInt(spawn3.room.energyCapacityAvailable / 100));
          if (max >= carry) {
            Memory.rooms[workroom].needDebitors = 1;
          } else {
            c = Memory.rooms[workroom].needDebitors = Math.ceil(carry / max);
            carry = Math.ceil(carry / c);
          }
          if (length > 30) {
            Memory.rooms[workroom].needDebitorSize = carry;
            delete Memory.rooms[workroom].distances;
          }
        }
        return Array(carry).fill(CARRY).concat(Array(carry).fill(MOVE));
      }
      if (containerId == "" || spawn3.room.name != workroom) {
        var max = Math.min(Math.max(parseInt(spawn3.room.energyCapacityAvailable / 100), 1), 20);
        return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
      }
      var max = Math.min(25, parseInt(spawn3.room.energyCapacityAvailable / 100));
      return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
    } else {
      var mineral = 2;
      return Array(mineral).fill(CARRY).concat(Array(mineral).fill(MOVE));
    }
  }
  /** Spawnt einen Debitor für `workroom`, falls Bedarf besteht (inklusive Freelancer- und Notfallmodus). */
  spawn(spawn3, workroom) {
    if (bot.room[workroom].transferEnergie && spawn3.room.name != workroom || spawn3.room.name != workroom && !Memory.rooms[workroom].claimed)
      return false;
    if (bot.room[workroom].sendDebitor && bot.room[workroom].sendMiner && (!Memory.rooms[workroom].hasLinks || !bot.room[workroom].useLinks)) {
      for (var id in bot.room[workroom].energySources) {
        if (!Game.getObjectById(bot.room[workroom].energySources[id]))
          continue;
        if (this._spawn(spawn3, workroom, bot.room[workroom].energySources[id], RESOURCE_ENERGY))
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
        if (Memory.rooms[workroom].useLinks)
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
    var profil = this.getProfil(spawn3, workroom, mineraltype, containerId);
    bot.logWorkroom(workroom, "4");
    if (!spawn(spawn3, profil, role3 + "_" + Game.time, { role: role3, harvest: true, workroom, home: spawn3.room.name, mineral: mineraltype, container: containerId, notfall: false })) {
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
  _getProfil(spawn3) {
    const totalCost = BODYPART_COST[TOUGH] + 2 * BODYPART_COST[MOVE] + BODYPART_COST[ATTACK] + BODYPART_COST[RANGED_ATTACK];
    var max = Math.min(5, parseInt(spawn3.room.energyAvailable / totalCost));
    if (max == 0 || max == null) {
      return [MOVE, MOVE, ATTACK, RANGED_ATTACK];
    }
    return Array(max).fill(TOUGH).concat(Array(max * 2).fill(MOVE).concat(Array(max).fill(ATTACK)).concat(Array(max).fill(RANGED_ATTACK)));
  }
  /** Spawnt einen Defender für `workroom`, falls Verteidigungsbedarf besteht und das Limit nicht erreicht ist. */
  spawn(spawn3, workroom) {
    if (!Memory.rooms[workroom].needDefence && !Memory.rooms[workroom].invaderCore || !bot.room[workroom].sendDefender)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role4 && creep.memory.workroom == workroom).length;
    if (Memory.rooms[workroom].needDefence && 2 <= count || Memory.rooms[workroom].invaderCore && 4 <= count)
      return false;
    if (spawn(spawn3, this._getProfil(spawn3), role4 + "_" + Game.time, { role: role4, workroom, home: spawn3.room.name })) {
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
  _getProfil(spawn3, workroom) {
    var numberOfSets = 0;
    var multi = Game.rooms[workroom] && Game.rooms[workroom].controller.level >= 6 ? 1 : 2;
    const totalCost = multi * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    var maxEnergy = spawn3.room.energyCapacityAvailable;
    numberOfSets = Math.min(9, Math.floor(maxEnergy / totalCost));
    if (numberOfSets == 0) {
      return [WORK, CARRY, MOVE, MOVE];
    }
    var carry = Math.min(numberOfSets * 2, 16);
    return Array(numberOfSets * multi).fill(WORK).concat(Array(carry).fill(CARRY).concat(Array(numberOfSets).fill(MOVE)));
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
    var profil = this._getProfil(spawn3, workroom);
    return spawn(spawn3, profil, role5 + "_" + Game.time, { role: role5, workroom, home: spawn3.room.name, repairs: 0 });
  }
};
ExtUpgrader = __decorateClass([
  profile
], ExtUpgrader);
var extupgrader_default = new ExtUpgrader();

// src/roles/linkkeeper.ts
var role6 = "linkkeeper";
var blockingStructureTypes = OBSTACLE_OBJECT_TYPES;
var LinkKeeper = class {
  /** Bewegt den Creep auf seinen Standplatz zwischen Link und Storage und pendelt dort Energie um. */
  doJob(creep) {
    if (goToWorkroom2(creep)) return;
    if (!creep.memory.post) {
      const storage2 = creep.room.storage;
      const link2 = storage2 ? Game.getObjectById(bot.room[creep.memory.workroom].spawnLink) : null;
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
    const link = Game.getObjectById(bot.room[creep.memory.workroom].spawnLink);
    if (!link) return;
    const carrying = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    const inLink = link.store.getUsedCapacity(RESOURCE_ENERGY);
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
        const blocked = pos.lookFor(LOOK_STRUCTURES).some((s) => blockingStructureTypes.includes(s.structureType)) || pos.lookFor(LOOK_CONSTRUCTION_SITES).some((s) => blockingStructureTypes.includes(s.structureType));
        if (blocked) continue;
        return pos;
      }
    }
    return null;
  }
  _getProfil(spawn3) {
    const maxCarryParts = Math.ceil(LINK_CAPACITY / CARRY_CAPACITY);
    const fullProfil = Array(maxCarryParts).fill(CARRY).concat([MOVE]);
    const fullCost = maxCarryParts * BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (spawn3.room.energyCapacityAvailable >= fullCost) {
      return fullProfil;
    }
    const affordableCarryParts = Math.max(1, Math.floor((spawn3.room.energyCapacityAvailable - BODYPART_COST[MOVE]) / BODYPART_COST[CARRY]));
    return Array(affordableCarryParts).fill(CARRY).concat([MOVE]);
  }
  /** Spawnt den einzigen Linkkeeper für `workroom`, falls Links dort genutzt werden und noch keiner lebt. */
  spawn(spawn3, workroom) {
    if (!bot.room[workroom].sendLinkkeeper)
      return false;
    if (!bot.room[workroom].useLinks || !bot.room[workroom].spawnLink)
      return false;
    if (spawn3.room.name != workroom)
      return false;
    if (!spawn3.room.storage)
      return false;
    if (_.filter(Game.creeps, (creep) => creep.memory.role == role6 && creep.memory.workroom == workroom).length >= 1)
      return false;
    return spawn(spawn3, this._getProfil(spawn3), role6 + "_" + Game.time, { role: role6, workroom, home: spawn3.room.name });
  }
};
LinkKeeper = __decorateClass([
  profile
], LinkKeeper);
var linkkeeper_default = new LinkKeeper();

// src/roles/miner.ts
var role7 = "miner";
var Miner = class {
  _clearMemory(creep) {
    delete creep.memory.pos;
    delete creep.memory._move;
    delete creep.memory.path;
    delete creep.memory.pathTarget;
    delete creep.memory.lastPos;
    delete creep.memory.dontMove;
  }
  /** Bewegt den Miner zur Quelle, baut/repariert dort Container bzw. Link und erntet. */
  doJob(creep) {
    if (creep.memory.notfall) {
      var replacement = _.find(Game.creeps, (c) => c.name != creep.name && c.memory.role == role7 && c.memory.workroom == creep.memory.workroom && c.memory.source == creep.memory.source && !c.memory.notfall && !c.spawning);
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
              var state = spot.createConstructionSite(STRUCTURE_CONTAINER);
              if (state === OK) {
                return;
              }
              if (state === ERR_FULL) {
                finalLocation = adjacentSpots.find(
                  (p) => p.lookFor(LOOK_TERRAIN)[0] !== "wall"
                );
                creep.memory.pos = finalLocation;
                return;
              }
              creep.say(state);
            }
            return;
          }
        }
      } else {
        finalLocation = creep.memory.pos;
      }
      if (creep.pos.x == creep.memory.pos.x && creep.pos.y == creep.memory.pos.y) {
        var source = creep.pos.findClosestByPath(creep.memory.mineEnergy ? FIND_SOURCES : FIND_MINERALS);
        var state = creep.harvest(source);
        if (state === ERR_NOT_IN_RANGE) {
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
          if (link != null && link.cooldown < 1 && creep.transfer(link, RESOURCE_ENERGY) == ERR_FULL) {
            var target;
            if (creep.room.storage && creep.room.storage.store.getUsedCapacity() * 0.5 > creep.room.storage.store.getFreeCapacity()) {
              target = Game.getObjectById(bot.room[creep.room.name].controllerLink);
            } else {
              target = Game.getObjectById(bot.room[creep.room.name].targetLinks[[Math.floor(Math.random() * bot.room[creep.room.name].targetLinks.length)]]);
            }
            if (target && target.store.getFreeCapacity(RESOURCE_ENERGY) > 50) {
              link.transferEnergy(target);
            } else {
              if (container && container.store.getFreeCapacity() == 0 && creep.store.getFreeCapacity() == 0) {
                creep.say("\u{1F6AF}");
                return;
              }
            }
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
      var state = creep.harvest(source2);
      if (state != OK) {
        if (state == ERR_TIRED || state == ERR_NOT_ENOUGH_ENERGY) {
          creep.say("\u{1F634}");
        } else if (state == ERR_NO_BODYPART) {
          creep.suicide();
        } else {
          creep.say(state + " :(");
        }
      }
    }
  }
  _getProfil(spawn3, workroom) {
    const totalCost = 3 * BODYPART_COST[WORK] + BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
    var maxEnergy = spawn3.room.energyCapacityAvailable;
    var numberOfSets = Math.min(8, Math.floor(maxEnergy / totalCost));
    if (numberOfSets == 0) {
      return [WORK, WORK, CARRY, MOVE];
    }
    return Array(numberOfSets * 3).fill(WORK).concat(Array(numberOfSets).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
  }
  /** Spawnt einen Miner für die nächste fällige Energie- oder Mineralquelle in `workroom`. */
  spawn(spawn3, workroom) {
    bot.logWorkroom(workroom, "Miner Spawn start");
    if (!bot.room[workroom].sendMiner)
      return false;
    if (spawn3.room.name != workroom && !Memory.rooms[workroom].claimed && !bot.room[workroom].claim)
      return false;
    for (var id in bot.room[workroom].energySources) {
      if (!Game.getObjectById(bot.room[workroom].energySources[id]))
        continue;
      if (this._spawn(spawn3, workroom, bot.room[workroom].energySources[id], true))
        return true;
    }
    var room = Game.rooms[workroom];
    if (room && room.controller && room.controller.my && room.controller.level >= 6) {
      for (var id in bot.room[workroom].mineralSources) {
        var mineral = Game.getObjectById(bot.room[workroom].mineralSources[id]);
        if (!mineral || mineral.mineralAmount < 1)
          return false;
        if (this._spawn(spawn3, workroom, bot.room[workroom].mineralSources[id], false))
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
      (creep) => creep.memory.role == role7 && creep.memory.workroom == workroom && creep.memory.source == source && !creep.memory.notfall && (creep.ticksToLive > time || creep.spawning)
    ).length;
    if (1 <= count) {
      Memory.rooms[spawn3.room.name].aktivPrioSpawn = false;
      return false;
    }
    if (!spawn(spawn3, this._getProfil(spawn3, workroom), role7 + "_" + Game.time, { role: role7, workroom, home: spawn3.room.name, source, mineEnergy, notfall: false })) {
      Memory.rooms[spawn3.room.name].aktivPrioSpawn = true;
      Memory.rooms[spawn3.room.name].aktivPrioSpawnCount = (Memory.rooms[spawn3.room.name].aktivPrioSpawnCount || 0) + 1;
      if (Memory.rooms[spawn3.room.name].aktivPrioSpawnCount > 25) {
        if (_.filter(Game.creeps, (creep) => creep.memory.role == role7 && creep.memory.workroom == workroom && creep.memory.source == source).length > 0)
          return false;
        console.log("[" + spawn3.room.name + "|" + workroom + "] Spawn NotfallMiner!!!");
        spawn(spawn3, [WORK, CARRY, MOVE], role7 + "_" + Game.time, { role: role7, workroom, home: spawn3.room.name, source, mineEnergy, notfall: true });
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
var role8 = "repairer";
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
        let state = creep.repair(target);
        if (state === ERR_NOT_IN_RANGE) {
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
        let state = creep.repair(target);
        if (state === ERR_NOT_IN_RANGE) {
          moveByMemory2(creep, target.pos);
        }
        return true;
      }
      creep.memory.repairs = 0;
      creep.memory.id = null;
    }
    return false;
  }
  _getProfil(spawn3) {
    const totalCost = 3 * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
    var maxEnergy = spawn3.room.energyCapacityAvailable;
    const numberOfSets = Math.min(3, Math.floor(maxEnergy / totalCost));
    if (numberOfSets == 0) {
      return [WORK, CARRY, CARRY, MOVE, MOVE];
    }
    return Array(numberOfSets * 3).fill(WORK).concat(Array(numberOfSets * 2).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
  }
  /** Spawnt einen Repairer für `workroom`, falls Bedarf besteht und noch nicht genug unterwegs sind. */
  spawn(spawn3, workroom) {
    var minRepairer = bot.room[workroom].repairer;
    if (minRepairer < 1)
      return false;
    if (spawn3.room.name != workroom && !Memory.rooms[workroom].claimed)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role8 && creep.memory.workroom == workroom).length;
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
    return spawn(spawn3, this._getProfil(spawn3), role8 + "_" + Game.time, { role: role8, workroom, home: spawn3.room.name, repairs: 0 });
  }
};
Repairer = __decorateClass([
  profile
], Repairer);
var repairer_default = new Repairer();

// src/roles/transfer.ts
var role9 = "transfer";
var Transfer = class {
  /** Sammelt Energie/Mineralien aus dem Arbeitsraum und bringt sie zum Heimatraum bzw. an bedürftige Builder. */
  doJob(creep) {
    if (!creep.memory.mineral)
      creep.memory.mineral = RESOURCE_ENERGY;
    creep.checkHarvest();
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
   *
   * @param {StructureSpawn} spawn
   */
  getProfil(spawn3) {
    var max = Math.min(25, parseInt(spawn3.room.energyCapacityAvailable / 100));
    return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
  }
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
      (creep) => creep.memory.role == role9 && creep.memory.workroom == workroom && creep.memory.home == spawn3.room.name && //hier wichtig, da mehere spawns infrage kommem
      (creep.ticksToLive > 100 || creep.spawning)
    ).length;
    if (1 <= count)
      return false;
    var storage = Game.rooms[spawn3.room.name].storage;
    if (storage && storage.store[RESOURCE_ENERGY] < 1e4 || !storage)
      return false;
    var profil = this.getProfil(spawn3);
    return spawn(spawn3, profil, role9 + "_" + Game.time, { role: role9, harvest: true, workroom, home: spawn3.room.name, mineral: mineraltype });
  }
};
Transfer = __decorateClass([
  profile
], Transfer);
var transfer_default = new Transfer();

// src/roles/upgrader.ts
var role10 = "upgrader";
var Upgrader = class {
  /** Beschafft Energie und upgradet den Controller des Arbeitsraums, inklusive Sparmodus bei hohem Level. */
  doJob(creep) {
    if (creep.memory.sparmodus && Game.time % creep.room.controller.level != 0) return;
    creep.checkHarvest();
    if (creep.memory.harvest) {
      if (!creep.memory.noLink && bot.room[creep.memory.workroom].controllerLink && (creep.room.controller.my && creep.room.controller.level >= 5)) {
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
    if (upgradeController(creep)) {
      creep.memory.sparmodus = creep.room.controller.level > 5;
    }
  }
  _getProfil(spawn3, workroom) {
    var numberOfSets = 0;
    var multi = Game.rooms[workroom].controller.level > 7 ? 0.5 : 2;
    const totalCost = multi * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
    var maxEnergy = spawn3.room.energyCapacityAvailable;
    numberOfSets = Math.min(Game.rooms[workroom].controller.level > 7 ? 9 : 8, Math.floor(maxEnergy / totalCost));
    if (numberOfSets == 0) {
      return [WORK, CARRY, MOVE, MOVE];
    }
    return Array(Math.floor(numberOfSets * multi)).fill(WORK).concat(Array(numberOfSets * 2).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
  }
  /** Spawnt einen Upgrader für `workroom`, falls die konfigurierte Anzahl noch nicht erreicht ist. */
  spawn(spawn3, workroom) {
    var uppis = bot.room[workroom].upgrader;
    if (!uppis || uppis < 1)
      return false;
    if (spawn3.room.name != workroom)
      return false;
    if (spawn3.room.controller.level > 7 && spawn3.room.controller.ticksToDowngrade > 1e5 && spawn3.room.storage && spawn3.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 25e4)
      return false;
    var count = _.filter(
      Game.creeps,
      (creep) => creep.memory.role == role10 && creep.memory.workroom == workroom && (creep.ticksToLive > 160 || creep.spawning)
    ).length;
    if (uppis <= count)
      return false;
    var profil = this._getProfil(spawn3, workroom);
    return spawn(spawn3, profil, role10 + "_" + Game.time, { role: role10, workroom, home: spawn3.room.name, repairs: 0, noLink: false });
  }
};
Upgrader = __decorateClass([
  profile
], Upgrader);
var upgrader_default = new Upgrader();

// src/roles/wally.ts
var role11 = "wally";
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
  _getProfil(spawn3) {
    const totalCost = BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    var maxEnergy = spawn3.room.energyCapacityAvailable;
    const numberOfSets = Math.min(9, Math.floor(maxEnergy / totalCost));
    if (numberOfSets == 0) {
      return [WORK, CARRY, CARRY, MOVE, MOVE];
    }
    return Array(numberOfSets).fill(WORK).concat(Array(2 * numberOfSets).fill(CARRY).concat(Array(numberOfSets).fill(MOVE)));
  }
  /** Spawnt einen Wallrepairer für `workroom`, falls Bedarf, Rumpfbudget und Energiereserve passen. */
  spawn(spawn3, workroom) {
    if (spawn3.room.name != workroom && !Memory.rooms[workroom].claimed)
      return false;
    var count = _.filter(Game.creeps, (creep) => creep.memory.role == role11 && creep.memory.workroom == workroom).length;
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
    var p = this._getProfil(spawn3);
    return spawn(spawn3, p, role11 + "_" + Game.time, { role: role11, workroom, home: spawn3.room.name });
  }
};
Wally = __decorateClass([
  profile
], Wally);
var wally_default = new Wally();

// src/roles/index.ts
var jobs = {
  debitor: debitor_default,
  // Weit vorn mit Absicht: ein voller Empfänger-Link nimmt nichts mehr an und
  // blockiert damit den Durchsatz aller Quell-Links, die auf ihn senden.
  linkkeeper: linkkeeper_default,
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
      const roomMemory = Memory.rooms[workroom];
      if (config.sendDefender && (roomMemory.needDefence || roomMemory.invaderCore)) {
        jobs.defender.spawn(spawn3, workroom);
        bot.logWorkroom(workroom, "Spawn Defender");
        continue;
      }
      if (config.spawnRoom !== spawn3.room.name && config.room !== spawn3.room.name) continue;
      if (roomMemory.invaderCore) continue;
      bot.logWorkroom(workroom, "Spawn JobLoop");
      for (const jobName in jobs) {
        bot.logWorkroom(workroom, `Spawn Job: ${jobName}`);
        if (jobs[jobName].spawn(spawn3, workroom)) break;
      }
      if (spawn3.spawning) break;
    }
  }
}

// src/profiler/flag.ts
var FLAG_NAME = "prof";
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
function switchFlag() {
  return Game.flags[FLAG_NAME];
}
function readRequest() {
  const flag = switchFlag();
  if (flag === void 0) return null;
  if (flag.color === getFlagColor()) return null;
  setFlagColor(flag.color);
  const entry = bySwitchColor(flag.color);
  if (entry === void 0) {
    const belegt = SWITCH_COLORS.map((item) => `${item.label}=${item.meaning}`).join(", ");
    console.log(`[prof] Flagge "${FLAG_NAME}": diese Farbe ist nicht belegt. Belegt sind ${belegt}.`);
    return null;
  }
  return entry.request;
}
function acknowledge(request) {
  const flag = switchFlag();
  if (flag === void 0) return;
  const color = byRequest(request).color;
  if (flag.color === color) {
    setFlagColor(color);
    return;
  }
  flag.setColor(color, flag.secondaryColor);
  setFlagColor(color);
}
function describe() {
  const flag = switchFlag();
  if (flag === void 0) return null;
  const entry = bySwitchColor(flag.color);
  const color = entry !== void 0 ? `${entry.label} = ${entry.meaning}` : "unbelegte Farbe";
  return `Flagge ${FLAG_NAME} in ${flag.pos.roomName}: ${color}`;
}
function statusLine(data) {
  const window = data.ticks === 0 ? "noch keine Messung" : `Fenster ${data.ticks}T | CPU/Tick ${data.cpuPerTick.toFixed(2)}`;
  return data.detailRemaining > 0 ? `${window} | Detail noch ${data.detailRemaining}T` : window;
}
function isActive(entry, data) {
  if (entry.request === "detail") return data.detailRemaining > 0;
  return data.detailRemaining === 0 && entry.request === data.mode;
}
function draw(data) {
  const flag = switchFlag();
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

// src/profiler/report.ts
function fmt(value, decimals = 2) {
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
function formatWindowLine(metrics2) {
  const top = topEntries(metrics2.roles, 3);
  return `[prof] Fenster=${fmt(metrics2.ticks, 0)}T | CPU/Tick=${fmt(metrics2.cpuPerTick)} | CPU/Raum=${fmt(metrics2.cpuPerRoom)} | CPU/Creep=${fmt(metrics2.cpuPerCreep)} | Bucket~${fmt(metrics2.bucketMean, 0)} (min ${fmt(metrics2.bucketMin, 0)}) | Limit=${fmt(metrics2.limit, 0)} | Top: ${top}`;
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
    fmt(entry.cpuPerTick).padStart(widths.cpuPerTick),
    fmt(entry.cpuPerCall).padStart(widths.cpuPerCall),
    fmt(entry.callsPerTick).padStart(widths.callsPerTick),
    fmt(entry.max).padStart(widths.max),
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
function formatDetailReport(metrics2) {
  const blocks = [
    formatRankedBlock("Abschnitte", metrics2.sections),
    formatRankedBlock("Rollen", metrics2.roles),
    formatRankedBlock("Methoden", metrics2.methods),
    formatRankedBlock("Creeps", metrics2.creepDetail)
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
    fmt(row.tick, 0).padStart(widths.tick),
    fmt(row.ticks, 0).padStart(widths.ticks),
    fmt(row.cpuPerTick).padStart(widths.cpuPerTick),
    fmt(row.cpuPerRoom).padStart(widths.cpuPerRoom),
    fmt(row.cpuPerCreep).padStart(widths.cpuPerCreep),
    fmt(row.bucketMean).padStart(widths.bucketMean)
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

// src/profiler/stats.ts
var statsMemory = Memory;
function isWritable(value) {
  return Number.isFinite(value);
}
function set(target, key, value) {
  if (!isWritable(value)) return;
  target[key] = value;
}
function writeStats(metrics2) {
  const stats = {};
  set(stats, "cpu.getUsed", metrics2.cpuPerTick);
  set(stats, "cpu.limit", metrics2.limit);
  set(stats, "cpu.tickLimit", metrics2.tickLimit);
  set(stats, "cpu.bucket", metrics2.bucketMean);
  set(stats, "profiler.ticks", metrics2.ticks);
  set(stats, "profiler.cpuPerTick", metrics2.cpuPerTick);
  set(stats, "profiler.cpuMaxTick", metrics2.cpuMaxTick);
  set(stats, "profiler.cpuPerRoom", metrics2.cpuPerRoom);
  set(stats, "profiler.cpuPerCreep", metrics2.cpuPerCreep);
  set(stats, "profiler.rooms", metrics2.rooms);
  set(stats, "profiler.creeps", metrics2.creeps);
  set(stats, "profiler.bucketMin", metrics2.bucketMin);
  for (const section of metrics2.sections) {
    set(stats, `profiler.section.${section.name}.cpuPerTick`, section.cpuPerTick);
  }
  for (const role12 of metrics2.roles) {
    set(stats, `profiler.role.${role12.name}.cpuPerTick`, role12.cpuPerTick);
  }
  statsMemory.stats = stats;
}
function clearStats() {
  delete statsMemory.stats;
}

// src/profiler/index.ts
var begin2 = begin;
var end2 = end;
var lastMode = "off";
function currentMetrics() {
  return metrics(snapshot());
}
function switchMode(mode) {
  if (detailActive()) {
    cancelDetail();
    console.log("[prof] Laufende Detailmessung abgebrochen, kein Abschlussbericht \u2014 prof.report() zeigt das Fenster.");
  }
  if (getMode() !== mode) {
    setMode(mode);
    lastMode = mode;
    reset();
  }
  acknowledge(mode);
}
function applyFlagRequest() {
  const request = readRequest();
  if (request === null) return;
  if (request === "detail") {
    console.log(`[prof] Flagge: ${handle.detail()}`);
    return;
  }
  const message = request === "off" ? handle.off() : request === "light" ? handle.light() : handle.on();
  console.log(`[prof] Flagge: ${message}`);
}
function drawFlagLegend() {
  const snapshotState = snapshot();
  draw({
    mode: getMode(),
    ticks: snapshotState.ticks,
    cpuPerTick: snapshotState.ticks > 0 ? snapshotState.cpuTotal / snapshotState.ticks : 0,
    detailRemaining: detailRemaining()
  });
}
function tick() {
  syncFromMemory();
  applyFlagRequest();
  drawFlagLegend();
  if (expireDetail()) {
    console.log(`[prof] Detailmessung beendet.
${formatDetailReport(currentMetrics())}`);
    lastMode = getMode();
    acknowledge(lastMode);
    reset();
    beginTick();
    return;
  }
  const mode = getMode();
  if (mode !== lastMode) {
    lastMode = mode;
    reset();
  }
  beginTick();
}
function endTick2(creepCount) {
  endTick(creepCount);
  if (!isDue()) return;
  const metrics2 = currentMetrics();
  console.log(formatWindowLine(metrics2));
  writeStats(metrics2);
  reset();
}
function toBaseline(metrics2) {
  return {
    tick: Game.time,
    ticks: metrics2.ticks,
    mode: metrics2.mode,
    cpuPerTick: metrics2.cpuPerTick,
    cpuPerRoom: metrics2.cpuPerRoom,
    cpuPerCreep: metrics2.cpuPerCreep,
    bucketMean: metrics2.bucketMean,
    rooms: metrics2.rooms,
    creeps: metrics2.creeps
  };
}
var handle = {
  on() {
    switchMode("full");
    return "Profiler: full \u2014 Gesamttick, Abschnitte und Rollen. Fensterzeile alle 100 Ticks.";
  },
  light() {
    switchMode("light");
    return "Profiler: light \u2014 nur Gesamttick, Bucket, CPU pro Raum und pro Creep.";
  },
  off() {
    switchMode("off");
    clearStats();
    return "Profiler: aus. Es l\xE4uft kein Game.cpu.getUsed() mehr.";
  },
  status() {
    const mode = getMode();
    const metrics2 = currentMetrics();
    const detail = detailActive() ? ` | Detailmessung noch ${detailRemaining()} Ticks` : "";
    const flag = describe();
    const switchState = flag !== null ? ` | ${flag}` : "";
    return `Profiler: ${mode} | Fenster ${metrics2.ticks}/100 Ticks${detail}${switchState}`;
  },
  report() {
    const metrics2 = currentMetrics();
    if (metrics2.ticks === 0) {
      return "Kein gemessener Tick im Fenster. Mit prof.light() oder prof.on() einschalten.";
    }
    const line = formatWindowLine(metrics2);
    if (metrics2.sections.length === 0 && metrics2.roles.length === 0) {
      return line;
    }
    return `${line}
${formatDetailReport(metrics2)}`;
  },
  reset() {
    reset();
    return "Fenster verworfen, Messung beginnt neu.";
  },
  detail(ticks = DEFAULT_DETAIL_TICKS) {
    if (!Number.isFinite(ticks) || ticks < 1) {
      return `Ung\xFCltige Tickzahl. Beispiel: prof.detail(${DEFAULT_DETAIL_TICKS})`;
    }
    const returnTo = getMode();
    startDetail(Math.floor(ticks));
    lastMode = "full";
    reset();
    acknowledge("detail");
    return `Detailmessung f\xFCr ${Math.floor(ticks)} Ticks gestartet, danach zur\xFCck auf ${returnTo}.`;
  },
  baseline(name) {
    if (!name) {
      return 'Name fehlt. Beispiel: prof.baseline("vor-plan-02")';
    }
    const metrics2 = currentMetrics();
    if (metrics2.ticks === 0) {
      return "Kein gemessener Tick im Fenster \u2014 es gibt nichts festzuhalten.";
    }
    if (metrics2.ticks < 1e3) {
      saveBaseline(name, toBaseline(metrics2));
      return `Grundlinie "${name}" gespeichert \u2014 Achtung, nur ${metrics2.ticks} Ticks. F\xFCr einen belastbaren Vergleich mindestens 1000 Ticks messen.`;
    }
    saveBaseline(name, toBaseline(metrics2));
    return `Grundlinie "${name}" \xFCber ${metrics2.ticks} Ticks gespeichert.`;
  },
  baselines() {
    const metrics2 = currentMetrics();
    return formatBaselines(readBaselines(), metrics2.ticks > 0 ? metrics2 : null);
  }
};
bot.prof = handle;

// src/controller/timing.ts
var botMemory3 = Memory;
function controll() {
  const tick2 = Game.time;
  init();
  begin2(SECTION.tower);
  tower();
  end2(SECTION.tower);
  begin2(SECTION.terminal);
  const terminalIds = botMemory3.terminals;
  if (terminalIds && terminalIds.length > 0) {
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
  end2(SECTION.terminal);
  if (tick2 % 3 === 0 && Game.cpu.bucket === 1e4) {
    begin2(SECTION.pixel);
    Game.cpu.generatePixel();
    end2(SECTION.pixel);
  }
  if (tick2 % 5 === 0) {
    begin2(SECTION.spawn);
    spawn2();
    end2(SECTION.spawn);
  }
  if (tick2 % 7 === 0) {
    begin2(SECTION.defence);
    check();
    end2(SECTION.defence);
  }
  if (tick2 % 11 === 0) {
    begin2(SECTION.status);
    writeStatus();
    end2(SECTION.status);
  }
  begin2(SECTION.daily);
  daylie();
  end2(SECTION.daily);
}
function daylie() {
  const dayTicks = 86400 / 3;
  switch (Game.time % dayTicks) {
    case 0:
      clear();
      return;
    case 1:
      findAndSaveRoomWalls();
      return;
    case 2:
      findAndSaveRoomContainer();
      return;
    case 3:
      findAndSaveRoomTower();
      return;
    case 4:
      findAndSaveTerminals();
      return;
    case 5:
      rebuildRoads();
      return;
  }
}

// src/prototypes/creep-checks.ts
function installCreepChecks() {
  Creep.prototype.checkHarvest = function(action, action2) {
    if (!this.memory.harvest && this.store.getUsedCapacity() === 0) {
      if (typeof action == "function")
        action.call(this);
      this.memory.harvest = true;
      this.memory.fromId = null;
      this.say("\u{1F6D2}");
      delete this.memory.path;
      delete this.memory.pathTarget;
    }
    if (this.memory.harvest && this.store.getFreeCapacity() === 0) {
      if (typeof action2 == "function")
        action2.call(this);
      this.memory.harvest = false;
      delete this.memory.useRoomSource;
      delete this.memory.path;
      delete this.memory.pathTarget;
      delete this.memory.useContainer;
    }
    if (this.memory.harvest && this.store.getUsedCapacity() > 0 && this.memory.mineral !== "energy") {
      this.memory.harvest = false;
      delete this.memory.useRoomSource;
      delete this.memory.path;
      delete this.memory.pathTarget;
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
  Creep.prototype.checkTombstones = function(min = 100) {
    const tombstone = this.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity() > min });
    if (tombstone) {
      this.memory.withdraw = tombstone.id;
      return true;
    }
    return false;
  };
  Creep.prototype.checkDrops = function(min = 100) {
    const drop = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) => d.amount > min });
    if (drop) {
      this.memory.pickup = drop.id;
      return true;
    }
    return false;
  };
  Creep.prototype.checkRuins = function(min = 100) {
    const ruin = this.pos.findClosestByPath(FIND_RUINS, { filter: (d) => d.store.getUsedCapacity() > min });
    if (ruin) {
      this.memory.withdraw = ruin.id;
      return true;
    }
    return false;
  };
  Creep.prototype.checkAllContainer = function(min) {
    if (!min) {
      min = this.store.getFreeCapacity() * 0.25;
    }
    var container;
    if (Memory.rooms[this.room.name] && Memory.rooms[this.room.name].container) {
      var distance = Infinity;
      for (var id of Memory.rooms[this.room.name].container) {
        var c = Game.getObjectById(id);
        if (c && c.store.getUsedCapacity() > min) {
          var d = Math.sqrt(Math.pow(this.pos.x - c.pos.x, 2) + Math.pow(this.pos.y - c.pos.y, 2));
          if (d < distance) {
            distance = d;
            container = c;
          }
        }
      }
    } else if (Memory.rooms[this.room.name] && !Memory.rooms[this.room.name].container) {
      var containers = this.room.find(FIND_STRUCTURES, { filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER;
      } });
      Memory.rooms[this.room.name].container = containers.map((c2) => {
        return c2.id;
      });
      return containers.length > 0;
    }
    if (container) {
      this.memory.withdraw = container.id;
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
function getFallbackPrice(resource) {
  if (T1_BOOSTS[resource]) {
    return 1e-3;
  }
  if (T1_INTERMEDIATES[resource]) {
    return 1e-3;
  }
  const history = Game.market.getHistory(resource);
  if (!history || !history.length) return null;
  const avg = history.reduce((s, h) => s + h.avgPrice, 0) / history.length;
  return avg * 0.7;
}
function installTerminalMarket() {
  StructureTerminal.prototype.sell = function() {
    if (this.cooldown > 1) return;
    var terminalEnergy = this.store.getUsedCapacity(RESOURCE_ENERGY);
    if (terminalEnergy < 1e3 || terminalEnergy >= this.store.getUsedCapacity())
      return;
    for (var resource in this.store) {
      if (NEVER_SELL2[resource]) continue;
      var minPrice = getFallbackPrice(resource);
      if (!minPrice) continue;
      var orders = Game.market.getAllOrders({
        type: ORDER_BUY,
        resourceType: resource
      });
      var marketOrdersWithDistances = orders.filter((o) => o.price >= minPrice).map((order2) => {
        var distance = this.pos.getRangeTo(
          new RoomPosition(25, 25, order2.roomName)
        );
        return {
          order: order2,
          distance
        };
      }).sort((a, b) => a.distance - b.distance);
      var capa = this.store.getUsedCapacity(resource);
      for (let i = 0; i < marketOrdersWithDistances.length; i++) {
        var order = marketOrdersWithDistances[i].order;
        var amount = order.amount > capa ? capa : order.amount;
        var transferEnergyCost = Game.market.calcTransactionCost(
          amount,
          this.room.name,
          order.roomName
        );
        var costPerRes = transferEnergyCost / amount;
        if (costPerRes < 0.789) {
          if (transferEnergyCost > terminalEnergy)
            amount = Math.floor(terminalEnergy / costPerRes);
          if (OK == Game.market.deal(order.id, amount, this.room.name)) {
            console.log(
              "[" + this.room.name + "] " + resource + " verkauft: " + amount + " zu " + order.price
            );
            return;
          }
        }
      }
    }
  };
  StructureTerminal.prototype.buyPixel = function() {
    if (this.cooldown > 1) return;
    const terminalEnergy = this.store.getUsedCapacity("energy");
    const freeCapacity = this.store.getFreeCapacity();
    if (terminalEnergy < 1e3 || freeCapacity <= 10) return;
    const resource = "pixel";
    const marketHistory = Game.market.getHistory(resource);
    if (!marketHistory || !marketHistory.length) return;
    const avgPrice = marketHistory.reduce((sum, h) => sum + h.avgPrice, 0) / marketHistory.length;
    const fairPrice = Math.floor(avgPrice * 1.1);
    const orders = Game.market.getAllOrders({
      type: ORDER_SELL,
      resourceType: resource
    });
    if (!orders.length) return;
    const valid = orders.filter((o) => o.roomName).map((o) => {
      const energyCost = Game.market.calcTransactionCost(
        1,
        this.room.name,
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
        terminalEnergy / Game.market.calcTransactionCost(1, this.room.name, order.roomName)
      )
    );
    if (amount <= 0) return;
    if (OK === Game.market.deal(order.id, amount, this.room.name)) {
      console.log(
        `[${this.room.name}] Pixel Sniper: ${amount} zu ${order.price} (effektiv inkl. Energie: ${valid[0].effectivePrice.toFixed(2)})`
      );
    }
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
installCreepChecks();
installTerminalMarket();
var measuredJobs = wrapRoles(jobs);
function loop() {
  var _a, _b, _c;
  tick();
  begin2(SECTION.rooms);
  for (const name in bot.room) {
    const room = Game.rooms[name];
    try {
      const roomMemory = Memory.rooms[name];
      if (roomMemory.nuke && roomMemory.nukepos.length > 0) {
        for (const nuke of roomMemory.nukepos) {
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
  end2(SECTION.rooms);
  begin2(SECTION.creeps);
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
  end2(SECTION.creeps);
  begin2(SECTION.timing);
  try {
    controll();
  } catch (error) {
    reportError(
      "timing",
      `controller/timing
${(_c = error == null ? void 0 : error.stack) != null ? _c : String(error)}`
    );
  }
  end2(SECTION.timing);
  endTick2(processedCreeps);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loop
});
