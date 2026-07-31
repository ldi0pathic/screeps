"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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

// src/legacy/creep.base.goto.cts
var require_creep_base_goto = __commonJS({
  "src/legacy/creep.base.goto.cts"(exports2, module2) {
    "use strict";
    module2.exports = {
      goToMyHome: function(creep) {
        if (creep.memory.home && creep.room.name !== creep.memory.home) {
          var room = new RoomPosition(25, 25, creep.memory.home);
          return this.moveByMemory(creep, room);
        }
        return false;
      },
      goToRoomFlag: function(creep) {
        if (creep.memory.workroom != creep.memory.home) {
          const flags = creep.room.find(FIND_FLAGS);
          if (flags.length > 0 && !creep.pos.inRangeTo(flags[0].pos, 2)) {
            return this.moveByMemory(creep, flags[0].pos);
            ;
          }
        }
        return false;
      },
      goToWorkroom: function(creep) {
        if (creep.memory.workroom && creep.memory.workroom != creep.room.name) {
          var room = new RoomPosition(25, 25, creep.memory.workroom);
          return this.moveByMemory(creep, room);
        }
        return false;
      },
      moveByMemory: function(creep, target) {
        if (creep.pos.isEqualTo(target)) {
          delete creep.memory.path;
          delete creep.memory.pathTarget;
          delete creep.memory.dontMove;
          delete creep.memory.lastPos;
          return false;
        }
        var deserializePath;
        if (creep.memory.dontMove > 3) {
          deserializePath = creep.pos.findPathTo(target, { ignoreCreeps: false });
          serializedPath = Room.serializePath(deserializePath);
          creep.memory.path = serializedPath;
          creep.memory.dontMove = 0;
          return true;
        }
        var serializedPath;
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
        switch (state) {
          case OK:
          case ERR_TIRED: {
            if (creep.memory.lastPos && creep.memory.lastPos.x == creep.pos.x && creep.memory.lastPos.y == creep.pos.y) {
              creep.memory.dontMove = creep.memory.dontMove + 1;
            } else {
              creep.memory.lastPos = {};
              creep.memory.lastPos.x = creep.pos.x;
              creep.memory.lastPos.y = creep.pos.y;
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
    };
  }
});

// src/legacy/creep.base.transport.cts
var require_creep_base_transport = __commonJS({
  "src/legacy/creep.base.transport.cts"(exports2, module2) {
    "use strict";
    var creepBaseGoTo = require_creep_base_goto();
    module2.exports = {
      _Transfer: function(creep, target, type) {
        if (target) {
          switch (creep.transfer(target, type)) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, target.pos);
              return true;
            case OK:
              return true;
            default:
              return false;
          }
        }
        return false;
      },
      CheckIsFreelancer: function(creep) {
        return creep.memory.container == "";
      },
      TransportToHomeContainer: function(creep, type, mul) {
        var container;
        if (!mul) mul = 0.5;
        if (creep.memory.useContainer) {
          container = Game.getObjectById(creep.memory.useContainer);
        } else if (Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name].container) {
          var distance = Infinity;
          var minCap = creep.store.getUsedCapacity() * mul;
          for (var id of Memory.rooms[creep.room.name].container) {
            var c = Game.getObjectById(id);
            if (c && c.store.getFreeCapacity(type) > minCap && c.id != global.room[creep.room.name].mineralContainerId && c.id != creep.memory.fromId) {
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
              creepBaseGoTo.moveByMemory(creep, container.pos);
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
      },
      TransportToHomeTerminal: function(creep) {
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
            if (this._Transfer(creep, terminal, resourceType) && !t) {
              t = true;
            }
          }
          return t;
        }
        return false;
      },
      TransportToHomeLab: function(creep, type) {
        var target = creep.pos.findClosestByPath(
          FIND_MY_STRUCTURES,
          {
            filter: (structure) => {
              return structure.structureType === STRUCTURE_LAB && structure.store.getFreeCapacity([type]) > 0 && structure.id != creep.memory.fromId;
            }
          }
        );
        return this._Transfer(creep, target, type);
      },
      TransportEnergyToHomeSpawn: function(creep) {
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
        return this._Transfer(creep, target, RESOURCE_ENERGY);
      },
      TransportEnergyToHomeTower: function(creep) {
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
          return this._Transfer(creep, towers[0], RESOURCE_ENERGY);
        }
        return false;
      },
      TransportToHomeStorage: function(creep) {
        var target = creep.room.storage;
        if (!target)
          return false;
        if (global.room[creep.memory.workroom].spawnLink) {
          var link = Game.getObjectById(global.room[creep.memory.home].spawnLink);
          if (link.store[RESOURCE_ENERGY] < 100 && creep.memory.fromId == target.id)
            return false;
        } else if (creep.memory.fromId == target.id) return false;
        if (target) {
          for (var resourceType in creep.store) {
            this._Transfer(creep, target, resourceType);
          }
          return true;
        }
        return false;
      }
    };
  }
});

// src/legacy/creep.base.cts
var require_creep_base = __commonJS({
  "src/legacy/creep.base.cts"(exports2, module2) {
    "use strict";
    var creepBaseTransport = require_creep_base_transport();
    var creepBaseGoTo = require_creep_base_goto();
    module2.exports = {
      harvest: function(creep) {
        if (!creep.memory.harvest)
          return;
        if (this.harvestRoomRuins(creep, RESOURCE_ENERGY))
          return;
        if (this.harvestRoomStorage(creep, RESOURCE_ENERGY))
          return;
        if (this.harvestRoomDrops(creep, RESOURCE_ENERGY))
          return;
        if (this.harvestRoomTombstones(creep, RESOURCE_ENERGY))
          return;
        if (this.harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25))
          return;
        if (this.harvestRoomEnergySource(creep))
          return;
      },
      harvestRoomDrops: function(creep, type) {
        var drop;
        if (creep.memory.useRoomDrop) {
          drop = Game.getObjectById(creep.memory.useRoomDrop);
        } else {
          drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) => d.amount > 100 });
        }
        if (drop) {
          switch (creep.pickup(drop)) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, drop.pos);
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
      },
      harvestRoomTombstones: function(creep, type) {
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
              creepBaseGoTo.moveByMemory(creep, tombstone.pos);
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
      },
      harvestCompleteRoomTombstones: function(creep) {
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
                creepBaseGoTo.moveByMemory(creep, tombstone.pos);
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
      },
      harvestRoomRuins: function(creep, type) {
        var ruin;
        if (creep.memory.useRuin) {
          ruin = Game.getObjectById(creep.memory.useRuin);
        } else {
          ruin = creep.pos.findClosestByPath(FIND_RUINS, { filter: (d) => d.store.getUsedCapacity(type) > 50 });
        }
        if (ruin) {
          switch (creep.withdraw(ruin, type)) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, ruin.pos);
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
      },
      harvestRoomStorage: function(creep, type) {
        let storage = creep.room.storage;
        let min = type === "energy" ? creep.store.getCapacity() * 0.5 : 50;
        if (storage && storage.store[type] > min) {
          var state = creep.withdraw(storage, type);
          switch (state) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, storage.pos);
              return true;
            case OK:
              creep.memory.fromId = storage.id;
              return true;
            default:
              return false;
          }
        }
        return false;
      },
      harvestRoomContainer: function(creep, type, mul) {
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
              creepBaseGoTo.moveByMemory(creep, container.pos);
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
      },
      harvestSpawnLink: function(creep, type) {
        if (creep.memory.workroom != creep.room.name || !global.room[creep.memory.workroom].spawnLink)
          return false;
        var link = Game.getObjectById(global.room[creep.memory.workroom].spawnLink);
        if (link && link.store[type] > 100) {
          switch (creep.withdraw(link, type)) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, link.pos);
              return true;
            case OK:
              creep.memory.fromId = link.id;
              return true;
            default:
              return false;
          }
        }
        return false;
      },
      harvestControllerLink: function(creep, type) {
        if (creep.memory.workroom != creep.room.name || !global.room[creep.memory.workroom].controllerLink || !creep.room.controller.my || creep.room.controller.level < 5)
          return false;
        var link = Game.getObjectById(global.room[creep.memory.workroom].controllerLink);
        if (link && link.store[type] > 100) {
          switch (creep.withdraw(link, type)) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, link.pos);
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
      },
      harvestMyContainer: function(creep, type) {
        if (creep.memory.workroom != creep.room.name || creep.memory.container == "")
          return false;
        var container = Game.getObjectById(creep.memory.container);
        if (container) {
          if (container.store[type] < 100) {
            return false;
          }
          switch (creep.withdraw(container, type)) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, container.pos);
              return true;
            case OK:
              creep.memory.fromId = container.id;
              return true;
            default:
              return false;
          }
        }
        return false;
      },
      harvestNotfall: function(creep) {
        var notfall = creep.room.find(FIND_STRUCTURES, { filter: (structure) => {
          return (structure.structureType === STRUCTURE_LINK || structure.structureType === STRUCTURE_LAB || structure.structureType === STRUCTURE_NUKER || structure.structureType == STRUCTURE_TOWER) && structure.store[RESOURCE_ENERGY] > 0;
        } });
        if (notfall.length > 0) {
          notfall.sort(function(a, b) {
            return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
          });
          switch (creep.withdraw(notfall[0], RESOURCE_ENERGY)) {
            case ERR_NOT_IN_RANGE:
              creepBaseGoTo.moveByMemory(creep, notfall[0].pos);
              return true;
            case OK:
              creep.memory.fromId = notfall[0].id;
              return true;
            default:
              return false;
          }
        }
        return false;
      },
      harvestRoomEnergySource: function(creep) {
        if (this.canHarvestEnergy(creep)) {
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
      },
      canHarvestEnergy: function(creep) {
        return creep.getActiveBodyparts(WORK) > 0;
      },
      calcProfil: function(creepProfile) {
        let energyCost = 0;
        for (const bodyPart of creepProfile) {
          energyCost += BODYPART_COST[bodyPart];
        }
        return energyCost;
      },
      goToMyHome: function(creep) {
        return creepBaseGoTo.goToMyHome(creep);
      },
      goToRoomFlag: function(creep) {
        return creepBaseGoTo.goToRoomFlag(creep);
      },
      goToWorkroom: function(creep) {
        return creepBaseGoTo.goToWorkroom(creep);
      },
      moveByMemory: function(creep, target) {
        return creepBaseGoTo.moveByMemory(creep, target);
      },
      TransportEnergyToHomeSpawn: function(creep) {
        return creepBaseTransport.TransportEnergyToHomeSpawn(creep);
      },
      TransportEnergyToHomeTower: function(creep) {
        return creepBaseTransport.TransportEnergyToHomeTower(creep);
      },
      TransportToHomeTerminal: function(creep) {
        return creepBaseTransport.TransportToHomeTerminal(creep);
      },
      TransportToHomeStorage: function(creep) {
        return creepBaseTransport.TransportToHomeStorage(creep);
      },
      TransportToHomeContainer: function(creep, type, mul) {
        return creepBaseTransport.TransportToHomeContainer(creep, type, mul);
      },
      TransportToHomeLab: function(creep, type) {
        return creepBaseTransport.TransportToHomeLab(creep, type);
      },
      checkWorkroomPrioSpawn: function(creep) {
        if (Memory.rooms[creep.memory.workroom].aktivPrioSpawn) {
          if (this.TransportEnergyToHomeSpawn(creep)) {
            creep.say("\u{1F6A8}");
            return true;
          }
        }
        return false;
      },
      upgradeController: function(creep) {
        var controller = creep.room.controller;
        if (!controller && !controller.my)
          return;
        const state = creep.upgradeController(controller);
        if (state === ERR_NOT_IN_RANGE || state === ERR_INVALID_TARGET && controller.upgradeBlocked > 0) {
          creepBaseGoTo.moveByMemory(creep, controller.pos);
        }
        if (!controller.sign || controller.sign.username == void 0 || controller.sign.username != creep.owner.username) {
          var c = creep.signController(controller, "\u2694");
          if (c === ERR_NOT_IN_RANGE) {
            creepBaseGoTo.moveByMemory(creep, controller.pos);
          }
        }
        return state == OK;
      },
      spawn: function(spawn2, profil, newName, memory) {
        if (spawn2.spawnCreep(profil, newName, { dryRun: true }) === 0) {
          spawn2.spawnCreep(profil, newName, { memory });
          console.log("[" + spawn2.room.name + "|" + memory.workroom + "] spawn " + newName + " cost: " + this.calcProfil(profil));
          return true;
        }
        return false;
      }
    };
  }
});

// src/legacy/config.cts
var require_config = __commonJS({
  "src/legacy/config.cts"() {
    "use strict";
    var isString = (value) => typeof value === "string";
    global.room = global.room || {};
    global.prio = global.prio || {};
    global.const = global.const || {};
    global.const = {
      maxRepairs: 5,
      logroom: ""
      //E59N3',//'E56N2'//'E59N4',
    }, global.minSalePrice = {
      H: 95,
      O: 5,
      U: 45,
      L: 18,
      X: 120
    }, global.maxOrderPrice = {
      pixel: 45e3
    }, global.transfer = {
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
    global.room = {
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
        energySources: [
          "5bbcb07b9099fc012e63c406"
        ],
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
        energySources: [
          "5bbcb08d9099fc012e63c595"
        ],
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
        destroy: [
          "63adb4b3aeebaa08e3aa2851"
        ],
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
        energySources: [
          "5bbcb08d9099fc012e63c593"
        ],
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
        destroy: [
          "63542d26da5582631af71fcc",
          "6255d32e5fdb145fecd7d923"
        ],
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
        saveRoads: true,
        //mining
        debitorProSource: 1,
        debitorAsFreelancer: 1,
        energySources: [
          "5bbcb08d9099fc012e63c58f",
          "5bbcb08d9099fc012e63c590"
        ],
        mineralSources: ["5bbcb72cd867df5e54207db1"],
        useLinks: true,
        targetLinks: [
          "653aed0d2fa32d1c887ab4e7",
          "657f0915dbc7505af702443c"
        ],
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
        saveRoads: true,
        //mining
        debitorProSource: 0,
        debitorAsFreelancer: 1,
        energySources: [
          "5bbcb08d9099fc012e63c58c",
          "5bbcb08d9099fc012e63c58a"
        ],
        mineralSources: [
          "5bbcb72cd867df5e54207db0"
        ],
        mineralContainerId: "658f0b73615ae9c2e4995fb6",
        useLinks: true,
        targetLinks: [
          "655269336b163b788bbbaec1",
          "65380c0c74becf6de75f0370"
        ],
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
        energySources: [
          "5bbcb08d9099fc012e63c588"
        ],
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
        saveRoads: true,
        //mining
        debitorProSource: 1,
        debitorAsFreelancer: 1,
        energySources: [
          "5bbcb09f9099fc012e63c71f",
          "5bbcb09f9099fc012e63c71d"
        ],
        mineralSources: ["5bbcb73ad867df5e54207e20"],
        mineralContainerId: null,
        useLinks: true,
        targetLinks: [
          "6666029dda8491c8c7f5b5f8",
          "65ad15e5e25690e38e742550"
        ],
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
        energySources: [
          "5bbcb09e9099fc012e63c711"
        ],
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
        energySources: [
          "5bbcb09e9099fc012e63c70e"
        ],
        mineralSources: [],
        useLinks: false,
        targetLinks: [],
        spawnLink: null,
        controllerLink: null,
        //structures
        repairer: 0,
        maxwallRepairer: 0,
        maxbuilder: 1,
        prioBuildings: [
          "64faa4011ae98a0ce014fda8",
          "64fb3dc4b140246d9bd1f0dd"
        ],
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
        saveRoads: true,
        //mining
        debitorProSource: 0,
        debitorAsFreelancer: 1,
        energySources: [
          "5bbcb09e9099fc012e63c70a",
          "5bbcb09e9099fc012e63c70b"
        ],
        mineralSources: ["5bbcb739d867df5e54207e1a"],
        useLinks: true,
        targetLinks: [
          "655261fc8c582e53825955a1",
          "65354f9aade2340fef294995"
        ],
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
    }, global.prio = {
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
        [STRUCTURE_RAMPART]: 7,
        [STRUCTURE_WALL]: 1,
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
    }, global.log = function(bool, msg) {
      if (bool && isString(msg)) {
        console.log(msg);
      } else if (bool) {
        console.log(JSON.stringify(msg));
      }
    }, global.logWorkroom = function(room, msg) {
      global.log(global.const.logroom == room, "[" + room + "] " + msg);
    };
  }
});

// src/legacy/creep.debitor.cts
var require_creep_debitor = __commonJS({
  "src/legacy/creep.debitor.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "debitor";
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
    module2.exports = {
      sayJob() {
        this.creep.say("\u{1F69B}");
      },
      doJob: function(creep) {
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
              if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
              if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
            } else {
              if (creepBase.TransportEnergyToHomeTower(creep)) return;
            }
            return;
          }
          return;
        }
        ;
        if (creep.memory.notfall) {
          if (creep.memory.harvest) {
            if (creepBase.harvestSpawnLink(creep, creep.memory.mineral)) return;
            if (creepBase.harvestControllerLink(creep, creep.memory.mineral)) return;
            if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
            if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
            if (creepBase.harvestNotfall(creep)) return;
            if (creep.room.energyAvailable < 1e3 && creep.store.getUsedCapacity() > 0) {
              creep.memory.harvest = false;
            }
          } else {
            if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
            if (creepBase.TransportEnergyToHomeTower(creep)) return;
          }
          return;
        }
        if (creep.memory.harvest) {
          if (creepBase.goToWorkroom(creep)) return;
          if (creepBase.harvestCompleteRoomTombstones(creep)) return;
          if (creepBase.harvestRoomDrops(creep, creep.memory.mineral)) return;
          if (creepBase.harvestRoomRuins(creep, creep.memory.mineral)) return;
          if (creepBase.harvestSpawnLink(creep, creep.memory.mineral)) return;
          if (creepBase.harvestMyContainer(creep, creep.memory.mineral)) return;
          const storage = creep.room.storage;
          const terminal = creep.room.terminal;
          if (storage && terminal && terminal.store.getFreeCapacity() > 5e4) {
            const resources = Object.keys(storage.store).filter(
              (r) => storage.store[r] > 100 && !NEVER_SELL[r]
            ).filter((f) => f != "energy");
            if (resources.length > 0) {
              const resource = resources[0];
              creep.memory.mineral = resource[0];
              if (creepBase.harvestRoomStorage(creep, resource)) return;
            }
          }
          if (creep.memory.container == "" && creep.room.name == creep.memory.workroom) {
            if (creep.room.energyAvailable >= creep.room.energyCapacityAvailable * 0.99) {
              if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
              if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
            } else {
              if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
              if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
            }
            if (creep.room.energyAvailable < 1e3 && creep.store.getUsedCapacity() > 0) {
              creep.memory.harvest = false;
            }
          } else {
            if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
            if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity()) {
              creep.memory.harvest = false;
            }
          }
          if (creepBase.goToRoomFlag(creep)) return;
          return;
        }
        if (creepBase.goToMyHome(creep)) return;
        if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
          if (creepBase.TransportToHomeTerminal(creep)) return;
          if (creepBase.TransportToHomeStorage(creep)) return;
        } else if (creep.memory.home == creep.memory.workroom) {
          if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
          if (creepBase.TransportEnergyToHomeTower(creep)) return;
          if (creepBase.TransportToHomeTerminal(creep)) return;
          if (creepBase.TransportToHomeStorage(creep)) return;
          if (creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY)) return;
        } else {
          if (creepBase.TransportToHomeTerminal(creep)) return;
          if (creepBase.TransportToHomeStorage(creep)) return;
          if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
          if (creepBase.TransportEnergyToHomeTower(creep)) return;
          if (creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY)) return;
        }
        return;
      },
      /**
       * 
       * @param {StructureSpawn} spawn 
       */
      getProfil(spawn2, workroom, mineraltype, containerId) {
        if (mineraltype == RESOURCE_ENERGY) {
          if (spawn2.room.name != workroom) {
            var carry = Memory.rooms[workroom].needDebitorSize;
            var distances = Memory.rooms[workroom].distances;
            var c = 1;
            if (!carry && distances) {
              var length = Math.ceil(distances.length * 0.5);
              var meridian = distances.sort(function(a, b) {
                return a - b;
              })[length];
              carry = Math.ceil(2 * meridian / 5);
              var max = Math.min(25, parseInt(spawn2.room.energyCapacityAvailable / 100));
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
          if (containerId == "" || spawn2.room.name != workroom) {
            var max = Math.min(Math.max(parseInt(spawn2.room.energyCapacityAvailable / 100), 1), 20);
            return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
          }
          var max = Math.min(25, parseInt(spawn2.room.energyCapacityAvailable / 100));
          return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
        } else {
          var mineral = 2;
          return Array(mineral).fill(CARRY).concat(Array(mineral).fill(MOVE));
        }
      },
      /**
      * 
      * @param {StructureSpawn} spawn 
      * @param {String} workroom 
      * @returns 
      */
      spawn: function(spawn2, workroom) {
        if (global.room[workroom].transferEnergie && spawn2.room.name != workroom || spawn2.room.name != workroom && !Memory.rooms[workroom].claimed)
          return false;
        if (global.room[workroom].sendDebitor && global.room[workroom].sendMiner && (!Memory.rooms[workroom].hasLinks || !global.room[workroom].useLinks)) {
          for (var id in global.room[workroom].energySources) {
            if (!Game.getObjectById(global.room[workroom].energySources[id]))
              continue;
            if (this._spawn(spawn2, workroom, global.room[workroom].energySources[id], RESOURCE_ENERGY))
              return true;
          }
        } else if (global.room[workroom].sendFreeDebitor) {
          if (this._spawn(spawn2, workroom, "", RESOURCE_ENERGY))
            return true;
        }
        return false;
      },
      /**
       * 
       * @param {StructureSpawn} spawn 
       * @param {String} workroom 
       * @param {String} container
       * @param {String} mineraltype
       */
      _spawn: function(spawn2, workroom, source, mineraltype) {
        global.logWorkroom(workroom, "here");
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
            (creep) => creep.memory.role == role && creep.memory.workroom == workroom && creep.memory.container == containerId && !creep.memory.notfall && (creep.ticksToLive > 100 || creep.spawning)
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
          global.logWorkroom(workroom, "2");
          var count = _.filter(
            Game.creeps,
            (creep) => creep.memory.role == role && creep.memory.workroom == workroom && creep.memory.container == "" && !creep.memory.notfall && (creep.ticksToLive > 100 || creep.spawning)
          ).length;
          if (global.room[workroom].debitorAsFreelancer <= count)
            return false;
          global.logWorkroom(workroom, "3");
          containerId = "";
        }
        var profil = this.getProfil(spawn2, workroom, mineraltype, containerId);
        global.logWorkroom(workroom, "4");
        if (!creepBase.spawn(spawn2, profil, role + "_" + Game.time, { role, harvest: true, workroom, home: spawn2.room.name, mineral: mineraltype, container: containerId, notfall: false })) {
          if (_.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom).length == 0 && spawn2.room.name == workroom) {
            console.log("[" + spawn2.room.name + "|" + workroom + "]Notfallspawn Debitor");
            var min = Math.min(Math.max(parseInt(spawn2.room.energyAvailable / 100), 1), 16);
            profil = Array(min).fill(CARRY).concat(Array(min).fill(MOVE));
            mineraltype = RESOURCE_ENERGY;
            return creepBase.spawn(spawn2, profil, role + "_" + Game.time, { role, harvest: true, workroom, home: spawn2.room.name, mineral: mineraltype, container: "", notfall: true });
          }
          return false;
        }
        return true;
      }
    };
  }
});

// src/legacy/creep.transfer.cts
var require_creep_transfer = __commonJS({
  "src/legacy/creep.transfer.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "transfer";
    module2.exports = {
      sayJob() {
        this.creep.say("\u{1F69B}");
      },
      doJob: function(creep) {
        if (!creep.memory.mineral)
          creep.memory.mineral = RESOURCE_ENERGY;
        creep.checkHarvest();
        if (creep.memory.harvest) {
          if (creep.room.name == creep.memory.workroom) {
            if (creepBase.harvestRoomRuins(creep, RESOURCE_ENERGY)) return;
            if (creepBase.harvestRoomDrops(creep, RESOURCE_ENERGY)) return;
            if (creepBase.harvestRoomTombstones(creep, RESOURCE_ENERGY)) return;
            if (creep.store.getUsedCapacity() > 1)
              creep.memory.harvest = false;
          }
          if (creepBase.goToMyHome(creep)) return;
          if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
          if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
          if (creepBase.goToRoomFlag(creep)) return;
          return;
        }
        if (creepBase.goToWorkroom(creep)) return;
        if (creepBase.TransportEnergyToHomeTower(creep)) return;
        if (creepBase.TransportToHomeTerminal(creep)) return;
        if (creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY)) return;
        if (creepBase.TransportToHomeStorage(creep)) return;
        if (creepBase.TransportToHomeContainer(creep, creep.memory.mineral)) return;
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
        if (creepBase.goToRoomFlag(creep)) return;
        return;
      },
      /**
       * 
       * @param {StructureSpawn} spawn 
       */
      getProfil(spawn2) {
        var max = Math.min(25, parseInt(spawn2.room.energyCapacityAvailable / 100));
        return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
      },
      /**
      * 
      * @param {StructureSpawn} spawn 
      * @param {String} workroom 
      * @returns 
      */
      spawn: function(spawn2, workroom) {
        if (!global.room[workroom].transferEnergie || spawn2.room.name == workroom || !Memory.rooms[workroom].claimed)
          return false;
        if (this._spawn(spawn2, workroom, RESOURCE_ENERGY))
          return true;
        return false;
      },
      /**
       * 
       * @param {StructureSpawn} spawn 
       * @param {String} workroom 
       * @param {String} container
       * @param {String} mineraltype
       */
      _spawn: function(spawn2, workroom, mineraltype) {
        var count = _.filter(
          Game.creeps,
          (creep) => creep.memory.role == role && creep.memory.workroom == workroom && creep.memory.home == spawn2.room.name && //hier wichtig, da mehere spawns infrage kommem
          (creep.ticksToLive > 100 || creep.spawning)
        ).length;
        if (1 <= count)
          return false;
        var storage = Game.rooms[spawn2.room.name].storage;
        if (storage && storage.store[RESOURCE_ENERGY] < 1e4 || !storage)
          return false;
        var profil = this.getProfil(spawn2);
        return creepBase.spawn(spawn2, profil, role + "_" + Game.time, { role, harvest: true, workroom, home: spawn2.room.name, mineral: mineraltype });
      }
    };
  }
});

// src/legacy/creep.miner.cts
var require_creep_miner = __commonJS({
  "src/legacy/creep.miner.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "miner";
    module2.exports = {
      _clearMemory: function(creep) {
        delete creep.memory.pos;
        delete creep.memory._move;
        delete creep.memory.path;
        delete creep.memory.pathTarget;
        delete creep.memory.lastPos;
        delete creep.memory.dontMove;
      },
      /** @param {Creep} creep **/
      doJob: function(creep) {
        if (creep.body.length > 30 && creep.memory.onPosition && Game.time % 2 == 1) return;
        if (!creep.memory.onPosition) {
          if (creepBase.goToWorkroom(creep)) return;
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
                return false;
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
            creepBase.moveByMemory(creep, new RoomPosition(finalLocation.x, finalLocation.y, finalLocation.roomName));
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
                  target = Game.getObjectById(global.room[creep.room.name].controllerLink);
                } else {
                  target = Game.getObjectById(global.room[creep.room.name].targetLinks[[Math.floor(Math.random() * global.room[creep.room.name].targetLinks.length)]]);
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
      },
      sayJob() {
        this.creep.say("\u26CF");
      },
      /**
      * 
      * @param {StructureSpawn} spawn 
      */
      _getProfil: function(spawn2, workroom) {
        const totalCost = 3 * BODYPART_COST[WORK] + BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
        var maxEnergy = spawn2.room.energyCapacityAvailable;
        var numberOfSets = Math.min(8, Math.floor(maxEnergy / totalCost));
        return Array(numberOfSets * 3).fill(WORK).concat(Array(numberOfSets).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
      },
      /**
       * 
       * @param {StructureSpawn} spawn 
       * @param {String} workroom 
       * @returns 
       */
      spawn: function(spawn2, workroom) {
        global.logWorkroom(workroom, "Miner Spawn start");
        if (!global.room[workroom].sendMiner)
          return false;
        if (spawn2.room.name != workroom && !Memory.rooms[workroom].claimed && !global.room[workroom].claim)
          return false;
        for (var id in global.room[workroom].energySources) {
          if (!Game.getObjectById(global.room[workroom].energySources[id]))
            continue;
          if (this._spawn(spawn2, workroom, global.room[workroom].energySources[id], true))
            return true;
        }
        var room = Game.rooms[workroom];
        if (room && room.controller && room.controller.my && room.controller.level >= 6) {
          for (var id in global.room[workroom].mineralSources) {
            var mineral = Game.getObjectById(global.room[workroom].mineralSources[id]);
            if (!mineral || mineral.mineralAmount < 1)
              return false;
            if (this._spawn(spawn2, workroom, global.room[workroom].mineralSources[id], false))
              return true;
          }
        }
        return false;
      },
      /**
       * 
       * @param {StructureSpawn} spawn 
       * @param {String} workroom 
       * @param {String} source 
       * @returns 
       */
      _spawn: function(spawn2, workroom, source, mineEnergy) {
        var time = 300;
        if (workroom == spawn2.room.name) {
          time = 150;
        }
        var count = _.filter(
          Game.creeps,
          (creep) => creep.memory.role == role && creep.memory.workroom == workroom && creep.memory.source == source && (creep.ticksToLive > time || creep.spawning)
        ).length;
        if (1 <= count) {
          Memory.rooms[spawn2.room.name].aktivPrioSpawn = false;
          return false;
        }
        if (!creepBase.spawn(spawn2, this._getProfil(spawn2, workroom), role + "_" + Game.time, { role, workroom, home: spawn2.room.name, source, mineEnergy, notfall: false })) {
          Memory.rooms[spawn2.room.name].aktivPrioSpawn = true;
          Memory.rooms[spawn2.room.name].aktivPrioSpawnCount = (Memory.rooms[spawn2.room.name].aktivPrioSpawnCount || 0) + 1;
          if (Memory.rooms[spawn2.room.name].aktivPrioSpawnCount > 25) {
            if (_.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom && creep.memory.source == source).length > 0)
              return false;
            console.log("[" + spawn2.room.name + "|" + workroom + "] Spawn NotfallMiner!!!");
            creepBase.spawn(spawn2, [WORK, CARRY, MOVE], role + "_" + Game.time, { role, workroom, home: spawn2.room.name, source, mineEnergy, notfall: true });
            Memory.rooms[spawn2.room.name].aktivPrioSpawnCount = 0;
            return true;
          }
          return false;
        }
        Memory.rooms[spawn2.room.name].aktivPrioSpawnCount = 0;
        return true;
      }
    };
  }
});

// src/legacy/creep.claimer.cts
var require_creep_claimer = __commonJS({
  "src/legacy/creep.claimer.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "claimer";
    module2.exports = {
      sayJob: function() {
        this.creep.say("\u{1F4CC}");
      },
      doJob: function(creep) {
        if (creepBase.goToWorkroom(creep)) return;
        var room = Game.rooms[creep.memory.workroom];
        if (!room)
          return;
        var controller = room.controller;
        var claim = global.room[creep.memory.workroom].claim;
        if (controller) {
          if (claim) {
            var s = creep.claimController(controller);
            if (s === ERR_NOT_IN_RANGE) {
              creepBase.moveByMemory(creep, controller.pos);
            }
            if (s === OK) {
              Memory.rooms[creep.room.name].claimed = true;
            }
            return;
          }
          var state = creep.reserveController(controller);
          if (state === ERR_NOT_IN_RANGE) {
            creepBase.moveByMemory(creep, controller.pos);
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
      },
      _getProfil: function() {
        return [CLAIM, CLAIM, MOVE, MOVE];
      },
      spawn: function(spawn2, workroom) {
        if (!global.room[workroom].sendClaimer)
          return false;
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom && (creep.ticksToLive > 100 || creep.spawning)).length;
        var room = Game.rooms[workroom];
        if (room && room.controller && (room.controller.sign && (spawn2.owner != "" && room.controller.sign.username == spawn2.owner.username) || room.controller.sign.username == "Screeps") && room.controller.reservation && room.controller.reservation.ticksToEnd > 3e3)
          return false;
        if (1 <= count)
          return false;
        return creepBase.spawn(spawn2, this._getProfil(), role + "_" + Game.time, { role, workroom, home: spawn2.room.name });
      }
    };
  }
});

// src/legacy/creep.builder.cts
var require_creep_builder = __commonJS({
  "src/legacy/creep.builder.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    var creepBaseGoto = require_creep_base_goto();
    require_config();
    var role = "builder";
    module2.exports = {
      sayJob: function() {
        this.creep.say("\u{1F528}");
      },
      doJob: function(creep) {
        creep.checkHarvest();
        if (creepBase.goToWorkroom(creep)) return;
        if (creep.memory.harvest) {
          creep.memory.repId = null;
          if (creepBase.harvest(creep)) return;
          if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity()) {
            creep.memory.harvest = false;
          }
          if (creepBase.harvestSpawnLink(creep, creep.memory.mineral)) return;
          return;
        }
        if (creep.checkInvasion()) return;
        if (creepBase.goToWorkroom(creep)) return;
        if (creepBase.checkWorkroomPrioSpawn(creep)) return;
        if (this._build(creep)) return;
        creepBase.upgradeController(creep);
      },
      _getPriority: function(structureType) {
        return global.prio.build[structureType] || 99;
      },
      _build: function(creep) {
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
              creepBase.moveByMemory(creep, target.pos);
            }
            return true;
          } else {
            creep.memory.id = null;
          }
        }
        return false;
      },
      _getProfil: function(spawn2) {
        const totalCost = 3 * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
        var maxEnergy = spawn2.room.energyCapacityAvailable;
        var numberOfSets = Math.min(7, Math.floor(maxEnergy / totalCost));
        return Array(numberOfSets * 3).fill(WORK).concat(Array(numberOfSets * 2).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
      },
      spawn: function(spawn2, workroom) {
        var maxbuilder = global.room[workroom].maxbuilder;
        if (!global.room[workroom].sendBuilder || maxbuilder < 1)
          return false;
        if (spawn2.room.name != workroom && !Memory.rooms[workroom].claimed && !global.room[workroom].claim)
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
        return creepBase.spawn(spawn2, this._getProfil(spawn2), role + "_" + Game.time, { role, workroom, home: spawn2.room.name });
      }
    };
  }
});

// src/legacy/creep.reparier.cts
var require_creep_reparier = __commonJS({
  "src/legacy/creep.reparier.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "repairer";
    module2.exports = {
      sayJob: function() {
        this.creep.say("\u{1F527}");
      },
      doJob: function(creep) {
        creep.checkHarvest(function() {
          creep.memory.repairs += 1;
        });
        if (creep.memory.harvest) {
          if (creepBase.harvest(creep)) return;
          return;
        }
        if (creep.memory.repairs > global.const.maxRepairs) {
          creep.memory.repairs = 0;
          creep.memory.id = null;
        }
        if (creep.checkInvasion()) return;
        if (creepBase.goToWorkroom(creep)) return;
        if (creepBase.checkWorkroomPrioSpawn(creep)) return;
        if (this._repairPrio(creep)) return;
        if (this._repair(creep)) return;
        creepBase.upgradeController(creep);
      },
      _getPriority: function(structureType) {
        return global.prio.repair[structureType] || 99;
      },
      _getMinHitRange: function(structureType) {
        return global.prio.hits[structureType] || 0.5;
      },
      _repairPrio: function(creep) {
        if (!creep.memory.prioId) {
          for (var id in global.room[creep.memory.workroom].prioBuildings) {
            var buildingId = global.room[creep.memory.workroom].prioBuildings[id];
            var building = Game.getObjectById(buildingId);
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
              creepBase.moveByMemory(creep, target.pos);
            }
            return true;
          }
          creep.memory.repairs = 0;
          creep.memory.prioId = null;
        }
        return false;
      },
      _repair: function(creep) {
        if (!creep.memory.id) {
          let structuresToRepair = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax;
            }
          });
          if (structuresToRepair.length > 0) {
            var structs = structuresToRepair.map((site) => ({
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
          if (target && target.hits < target.hitsMax) {
            let state = creep.repair(target);
            if (state === ERR_NOT_IN_RANGE) {
              creepBase.moveByMemory(creep, target.pos);
            }
            return true;
          }
          creep.memory.repairs = 0;
          creep.memory.id = null;
        }
        return false;
      },
      _getProfil: function(spawn2) {
        const totalCost = 3 * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
        var maxEnergy = spawn2.room.energyCapacityAvailable;
        const numberOfSets = Math.min(3, Math.floor(maxEnergy / totalCost));
        if (numberOfSets == 0) {
          return [WORK, CARRY, CARRY, MOVE, MOVE];
        }
        return Array(numberOfSets * 3).fill(WORK).concat(Array(numberOfSets * 2).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
      },
      spawn: function(spawn2, workroom) {
        var minRepairer = global.room[workroom].repairer;
        if (minRepairer < 1)
          return false;
        if (spawn2.room.name != workroom && !Memory.rooms[workroom].claimed)
          return false;
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom).length;
        if (count == void 0)
          count = 0;
        if (minRepairer <= count)
          return false;
        let structuresToRepair = Game.rooms[workroom].find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax;
          }
        });
        if (structuresToRepair.length <= 1)
          return false;
        return creepBase.spawn(spawn2, this._getProfil(spawn2), role + "_" + Game.time, { role, workroom, home: spawn2.room.name, repairs: 0 });
      }
    };
  }
});

// src/legacy/creep.upgrader.cts
var require_creep_upgrader = __commonJS({
  "src/legacy/creep.upgrader.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "upgrader";
    module2.exports = {
      sayJob: function() {
        this.creep.say("\u{1F511}");
      },
      doJob: function(creep) {
        if (creep.memory.sparmodus && Game.time % creep.room.controller.level != 0) return;
        creep.checkHarvest();
        if (creep.memory.harvest) {
          if (!creep.memory.noLink && global.room[creep.memory.workroom].controllerLink && (creep.room.controller.my && creep.room.controller.level >= 5)) {
            if (creepBase.harvestControllerLink(creep, RESOURCE_ENERGY)) return;
          } else {
            if (creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY))
              return;
            if (creepBase.harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25))
              return;
            if (creepBase.harvestRoomDrops(creep, RESOURCE_ENERGY))
              return;
            if (creepBase.harvestRoomTombstones(creep, RESOURCE_ENERGY))
              return;
            if (creepBase.harvestRoomRuins(creep, RESOURCE_ENERGY))
              return;
            if (creepBase.harvestRoomEnergySource(creep))
              return;
          }
          if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity()) {
            creep.memory.harvest = false;
          }
          return;
        }
        if (creep.checkInvasion()) return;
        if (creepBase.goToWorkroom(creep)) return;
        if (creepBase.checkWorkroomPrioSpawn(creep)) return;
        if (creepBase.upgradeController(creep)) {
          creep.memory.sparmodus = creep.room.controller.level > 5;
        }
      },
      _getProfil: function(spawn2, workroom) {
        var numberOfSets = 0;
        var multi = Game.rooms[workroom].controller.level > 7 ? 0.5 : 2;
        const totalCost = multi * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
        var maxEnergy = spawn2.room.energyCapacityAvailable;
        numberOfSets = Math.min(Game.rooms[workroom].controller.level > 7 ? 9 : 8, Math.floor(maxEnergy / totalCost));
        if (numberOfSets == 0) {
          return [WORK, CARRY, MOVE, MOVE];
        }
        return Array(Math.floor(numberOfSets * multi)).fill(WORK).concat(Array(numberOfSets * 2).fill(CARRY).concat(Array(numberOfSets * 2).fill(MOVE)));
      },
      spawn: function(spawn2, workroom) {
        var uppis = global.room[workroom].upgrader;
        if (!uppis || uppis < 1)
          return false;
        if (spawn2.room.name != workroom)
          return false;
        if (spawn2.room.controller.level > 7 && spawn2.room.controller.ticksToDowngrade > 1e5 && spawn2.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 25e4)
          return false;
        var count = _.filter(
          Game.creeps,
          (creep) => creep.memory.role == role && creep.memory.workroom == workroom && (creep.ticksToLive > 160 || creep.spawning)
        ).length;
        if (uppis <= count)
          return false;
        var profil = this._getProfil(spawn2, workroom);
        return creepBase.spawn(spawn2, profil, role + "_" + Game.time, { role, workroom, home: spawn2.room.name, repairs: 0, noLink: false });
      }
    };
  }
});

// src/legacy/creep.extupgrader.cts
var require_creep_extupgrader = __commonJS({
  "src/legacy/creep.extupgrader.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "extupgrader";
    module2.exports = {
      sayJob: function() {
        this.creep.say("\u{1F511}");
      },
      doJob: function(creep) {
        if (creepBase.goToWorkroom(creep)) return;
        creep.checkHarvest();
        if (creep.memory.harvest) {
          if (creepBase.harvestControllerLink(creep, RESOURCE_ENERGY)) return;
          if (creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY)) return;
          if (creepBase.harvestRoomContainer(creep, RESOURCE_ENERGY)) return;
          if (creepBase.harvestRoomEnergySource(creep)) return;
        }
        creepBase.upgradeController(creep);
      },
      _getProfil: function(spawn2, workroom) {
        var numberOfSets = 0;
        var multi = Game.rooms[workroom] && Game.rooms[workroom].controller.level >= 6 ? 1 : 2;
        const totalCost = multi * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
        var maxEnergy = spawn2.room.energyCapacityAvailable;
        numberOfSets = Math.min(9, Math.floor(maxEnergy / totalCost));
        if (numberOfSets == 0) {
          return [WORK, CARRY, MOVE, MOVE];
        }
        var carry = Math.min(numberOfSets * 2, 16);
        return Array(numberOfSets * multi).fill(WORK).concat(Array(carry).fill(CARRY).concat(Array(numberOfSets).fill(MOVE)));
      },
      spawn: function(spawn2, workroom) {
        if (spawn2.room.name == workroom)
          return false;
        var uppis = global.room[workroom].upgrader;
        if (!uppis || uppis < 1)
          return false;
        var count = _.filter(
          Game.creeps,
          (creep) => creep.memory.role == role && creep.memory.workroom == workroom && (creep.ticksToLive > 300 || creep.spawning)
        ).length;
        if (uppis <= count)
          return false;
        var profil = this._getProfil(spawn2, workroom);
        return creepBase.spawn(spawn2, profil, role + "_" + Game.time, { role, workroom, home: spawn2.room.name, repairs: 0 });
      }
    };
  }
});

// src/legacy/creep.defender.cts
var require_creep_defender = __commonJS({
  "src/legacy/creep.defender.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "defender";
    module2.exports = {
      sayJob: function() {
        this.creep.say("\u2694");
      },
      doJob: function(creep) {
        if (creepBase.goToWorkroom(creep)) return;
        if (this._defend(creep)) return;
      },
      _defend: function(creep) {
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
        } else if (global.room[creep.memory.workroom].destroy && !Memory.rooms[creep.memory.workroom].destroyDone) {
          for (var s of global.room[creep.memory.workroom].destroy) {
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
          for (var room in global.room) {
            if (global.room[room].destroy && !Memory.rooms[creep.memory.workroom].destroyDone) {
              creep.memory.workroom = room;
            }
          }
        }
        if (creep.getActiveBodyparts(ATTACK) + creep.getActiveBodyparts(RANGED_ATTACK) == 0) {
          creep.say("\u{1F4A5} Bye!");
          creep.suicide();
        }
      },
      _getProfil: function(spawn2) {
        const totalCost = BODYPART_COST[TOUGH] + 2 * BODYPART_COST[MOVE] + BODYPART_COST[ATTACK] + BODYPART_COST[RANGED_ATTACK];
        var max = Math.min(5, parseInt(spawn2.room.energyAvailable / totalCost));
        if (max == 0 || max == null) {
          return [MOVE, MOVE, ATTACK, RANGED_ATTACK];
        }
        return Array(max).fill(TOUGH).concat(Array(max * 2).fill(MOVE).concat(Array(max).fill(ATTACK)).concat(Array(max).fill(RANGED_ATTACK)));
      },
      spawn: function(spawn2, workroom) {
        if (!Memory.rooms[workroom].needDefence && !Memory.rooms[workroom].invaderCore || !global.room[workroom].sendDefender)
          return false;
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom).length;
        if (Memory.rooms[workroom].needDefence && 2 <= count || Memory.rooms[workroom].invaderCore && 4 <= count)
          return false;
        if (creepBase.spawn(spawn2, this._getProfil(spawn2), role + "_" + Game.time, { role, workroom, home: spawn2.room.name })) {
          Memory.cOfDefender += 1;
          return true;
        }
        return false;
      }
    };
  }
});

// src/legacy/creep.wallbuilder.cts
var require_creep_wallbuilder = __commonJS({
  "src/legacy/creep.wallbuilder.cts"(exports2, module2) {
    "use strict";
    var creepBase = require_creep_base();
    require_config();
    var role = "wally";
    module2.exports = {
      sayJob: function() {
        this.creep.say("\u{1F527}");
      },
      doJob: function(creep) {
        creep.checkHarvest();
        if (creep.checkInvasion()) {
          if (creep.memory.harvest) {
            if (creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY)) return;
            if (creepBase.harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25)) return;
            return;
          } else {
            if (creepBase.TransportEnergyToHomeTower(creep)) return;
          }
          return;
        }
        if (creep.memory.harvest) {
          creep.memory.wall = null;
          if (creepBase.harvest(creep)) return;
          return;
        }
        if (creepBase.goToWorkroom(creep)) return;
        if (creepBase.checkWorkroomPrioSpawn(creep)) return;
        if (this._repair(creep)) return;
        creepBase.upgradeController(creep);
      },
      _repair: function(creep) {
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
        }
        if (targetWall) {
          const repairResult = creep.repair(targetWall);
          if (repairResult === ERR_NOT_IN_RANGE) {
            creepBase.moveByMemory(creep, targetWall.pos);
            return true;
          }
          return repairResult == OK;
        } else {
          creep.memory.wall = null;
          return true;
        }
      },
      _getProfil: function(spawn2) {
        const totalCost = BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
        var maxEnergy = spawn2.room.energyCapacityAvailable;
        const numberOfSets = Math.min(9, Math.floor(maxEnergy / totalCost));
        if (numberOfSets == 0) {
          return [WORK, CARRY, CARRY, MOVE, MOVE];
        }
        return Array(numberOfSets).fill(WORK).concat(Array(2 * numberOfSets).fill(CARRY).concat(Array(numberOfSets).fill(MOVE)));
      },
      spawn: function(spawn2, workroom) {
        if (spawn2.room.name != workroom && !Memory.rooms[workroom].claimed)
          return false;
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom).length;
        if (global.room[workroom].maxwallRepairer <= count)
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
        var p = this._getProfil(spawn2);
        return creepBase.spawn(spawn2, p, role + "_" + Game.time, { role, workroom, home: spawn2.room.name });
      }
    };
  }
});

// src/legacy/creep.jobs.cts
var require_creep_jobs = __commonJS({
  "src/legacy/creep.jobs.cts"(exports2, module2) {
    "use strict";
    module2.exports = {
      debitor: require_creep_debitor(),
      transfer: require_creep_transfer(),
      miner: require_creep_miner(),
      claimer: require_creep_claimer(),
      builder: require_creep_builder(),
      repairer: require_creep_reparier(),
      upgrader: require_creep_upgrader(),
      extupgrader: require_creep_extupgrader(),
      defender: require_creep_defender(),
      wally: require_creep_wallbuilder()
    };
  }
});

// src/legacy/controller.defence.cts
var require_controller_defence = __commonJS({
  "src/legacy/controller.defence.cts"(exports2, module2) {
    "use strict";
    module2.exports = {
      check: function() {
        for (var name in global.room) {
          if (!global.room[name].sendDefender)
            continue;
          if (Memory.rooms[name].invaderCoreEndTick && Game.time + 10 > Memory.rooms[name].invaderCoreEndTick) {
            Memory.rooms[name].invaderCore = false;
          }
          if (Memory.rooms[name].needDefenceEndTick && Game.time + 10 > Memory.rooms[name].needDefenceEndTick) {
            Memory.rooms[name].needDefence = false;
          }
          var room = Game.rooms[global.room[name].room];
          if (!room)
            continue;
          var hostiles = room.find(FIND_HOSTILE_CREEPS);
          var core = room.find(FIND_HOSTILE_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_INVADER_CORE });
          var nukes = room.find(FIND_NUKES);
          Memory.rooms[name].needDefence = hostiles.length > 0;
          if (hostiles.length > (global.room[name].minHostile || 1)) {
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
            if (msg.length > 0 && !Memory.rooms[name].nuke)
              Game.notify(msg);
          } else {
            if (Memory.rooms[name].nukepos)
              Memory.rooms[name].nukepos = [];
          }
          Memory.rooms[name].nuke = nukes.length > 0;
        }
      },
      tower: function() {
        for (var name in global.room) {
          var room = Game.rooms[name];
          if (!room || !room.controller || !room.controller.my || !Memory.rooms[name].tower || Memory.rooms[name].tower.length == 0)
            continue;
          if (Memory.rooms[name].needDefence) {
            var hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
            if (hostileCreeps.length > 0) {
              var strongHealers = hostileCreeps.filter((creep) => {
                var healParts = creep.body.filter((part) => part.type === HEAL).length;
                return healParts >= 5;
              });
              if (strongHealers.length === 0) {
                hostileCreeps.sort(function(a, b) {
                  var costA = a.body.reduce(function(total, part) {
                    return total + BODYPART_COST[part.type];
                  }, 0);
                  var costB = b.body.reduce(function(total, part) {
                    return total + BODYPART_COST[part.type];
                  }, 0);
                  return costB - costA;
                });
                for (var towerid of Memory.rooms[name].tower) {
                  var tower = Game.getObjectById(towerid);
                  if (tower)
                    tower.attack(hostileCreeps[0]);
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
                    var tower = Game.getObjectById(towerid);
                    if (tower) {
                      tower.repair(damagedStructure);
                    }
                  }
                }
              }
            } else {
              Memory.rooms[name].needDefence = false;
              delete Memory.rooms[name].structureHP;
            }
          } else if (Game.time % 3 == 2) {
            var damagedStructures = room.find(
              FIND_STRUCTURES,
              {
                filter: (structure2) => {
                  return structure2.hits < (global.prio.hits[structure2.structureType] || 0.5) * structure2.hitsMax;
                }
              }
            );
            if (damagedStructures.length > 0) {
              damagedStructures.sort((a, b) => {
                const priorityA = global.prio.repair[a.structureType] || 10;
                const priorityB = global.prio.repair[b.structureType] || 10;
                const damageA = a.hitsMax - a.hits;
                const damageB = b.hitsMax - b.hits;
                const scoreA = priorityA * damageA;
                const scoreB = priorityB * damageB;
                return scoreA - scoreB;
              });
              for (var towerid of Memory.rooms[name].tower) {
                var tower = Game.getObjectById(towerid);
                if (tower && tower.store.getUsedCapacity([RESOURCE_ENERGY]) * 0.5 > tower.store.getFreeCapacity([RESOURCE_ENERGY]))
                  tower.repair(damagedStructures[0]);
              }
            }
          }
        }
      }
    };
  }
});

// src/legacy/prototype.creep.checks.cts
var require_prototype_creep_checks = __commonJS({
  "src/legacy/prototype.creep.checks.cts"(exports2, module2) {
    "use strict";
    module2.exports = function() {
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
      Creep.prototype.checkSource = function() {
      };
      Creep.prototype.checkSavedAction = function() {
        if (this.creep.harvest) {
          if (this.withdraw()) return true;
          if (this.pickup()) return true;
          if (this.harvest()) return true;
        } else {
        }
        return false;
      };
    };
  }
});

// src/legacy/prototype.terminal.market.cts
var require_prototype_terminal_market = __commonJS({
  "src/legacy/prototype.terminal.market.cts"(exports2, module2) {
    "use strict";
    module2.exports = function() {
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
      const T1_BOOSTS = {
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
      const T1_INTERMEDIATES = {
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
      const NEVER_SELL = {
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
      StructureTerminal.prototype.sell = function() {
        if (this.cooldown > 1)
          return;
        var terminalEnergy = this.store.getUsedCapacity(RESOURCE_ENERGY);
        if (terminalEnergy < 1e3 || terminalEnergy >= this.store.getUsedCapacity())
          return;
        for (var resource in this.store) {
          if (NEVER_SELL[resource]) continue;
          var minPrice = getFallbackPrice(resource);
          if (!minPrice)
            continue;
          var orders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: resource });
          var marketOrdersWithDistances = orders.filter((o) => o.price >= minPrice).map((order2) => {
            var distance = this.pos.getRangeTo(new RoomPosition(25, 25, order2.roomName));
            return {
              order: order2,
              distance
            };
          }).sort((a, b) => a.distance - b.distance);
          var capa = this.store.getUsedCapacity(resource);
          for (let i = 0; i < marketOrdersWithDistances.length; i++) {
            var order = marketOrdersWithDistances[i].order;
            var amount = order.amount > capa ? capa : order.amount;
            var transferEnergyCost = Game.market.calcTransactionCost(amount, this.room.name, order.roomName);
            var costPerRes = transferEnergyCost / amount;
            if (costPerRes < 0.789) {
              if (transferEnergyCost > terminalEnergy)
                amount = Math.floor(terminalEnergy / costPerRes);
              if (OK == Game.market.deal(order.id, amount, this.room.name)) {
                console.log("[" + this.room.name + "] " + resource + " verkauft: " + amount + " zu " + order.price);
                return;
              }
            }
          }
        }
      };
      StructureTerminal.prototype.buy = function() {
        if (this.cooldown > 1)
          return;
        var terminalEnergy = this.store.getUsedCapacity(RESOURCE_ENERGY);
        if (terminalEnergy < 1e3 || this.store.getFreeCapacity() <= 10)
          return;
        for (var resource in global.maxOrderPrice) {
          const orders = Game.market.getAllOrders({
            type: ORDER_SELL,
            resourceType: resource
          });
          const valid = orders.filter((o) => o.roomName).map((o) => {
            const energyCost = Game.market.calcTransactionCost(
              1,
              this.room.name,
              o.roomName
            );
            return { o, energyCost };
          }).filter(
            (x) => x.o.price <= global.maxOrderPrice[resource] && x.energyCost <= 5e3
          ).sort((a, b) => a.o.price - b.o.price);
          if (!valid.length) return;
          const order = valid[0].o;
          const amount = Math.min(
            50,
            order.amount,
            Math.floor(Game.market.credits / order.price)
          );
          if (amount <= 0) return;
          if (OK === Game.market.deal(order.id, amount, this.room.name)) {
            console.log(`[${this.room.name}] Pixel gekauft: ${amount} zu ${order.price}`);
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
        const orders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: resource });
        if (!orders.length) return;
        const valid = orders.filter((o) => o.roomName).map((o) => {
          const energyCost = Game.market.calcTransactionCost(1, this.room.name, o.roomName);
          const effectivePrice = o.price + energyCost / Math.min(o.amount, 50);
          return { o, energyCost, effectivePrice };
        }).filter((x) => x.effectivePrice <= fairPrice && x.energyCost <= terminalEnergy).sort((a, b) => a.effectivePrice - b.effectivePrice);
        if (!valid.length) return;
        const order = valid[0].o;
        const amount = Math.min(
          50,
          order.amount,
          Math.floor(Game.market.credits / order.price),
          Math.floor(terminalEnergy / Game.market.calcTransactionCost(1, this.room.name, order.roomName))
        );
        if (amount <= 0) return;
        if (OK === Game.market.deal(order.id, amount, this.room.name)) {
          console.log(`[${this.room.name}] Pixel Sniper: ${amount} zu ${order.price} (effektiv inkl. Energie: ${valid[0].effectivePrice.toFixed(2)})`);
        }
      };
    };
  }
});

// src/legacy/prototype.cts
var require_prototype = __commonJS({
  "src/legacy/prototype.cts"(exports2, module2) {
    "use strict";
    module2.exports = {
      creepChecks: require_prototype_creep_checks()(),
      // creepOverride: require('./prototype.creep.override.cts')(),
      marked: require_prototype_terminal_market()()
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  loop: () => loop
});
module.exports = __toCommonJS(main_exports);

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
  var _a, _b;
  (_a = botMemory.rooms) != null ? _a : botMemory.rooms = {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config || ((_b = config.maxwallRepairer) != null ? _b : 0) < 1) continue;
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

// src/controller/spawn.ts
var botGlobal3 = global;
var logger = global;
var jobs = require_creep_jobs();
function spawn() {
  for (const spawnName in Game.spawns) {
    const spawn2 = Game.spawns[spawnName];
    if (!spawn2 || spawn2.spawning) continue;
    const emergencyCreeps = Object.values(Game.creeps).filter((creep) => {
      const memory = creep.memory;
      return memory.home === spawn2.room.name && memory.notfall;
    });
    for (const roomName in botGlobal3.room) {
      const config = botGlobal3.room[roomName];
      if (!config) continue;
      const workroom = config.room;
      if (emergencyCreeps.length > 0 && workroom !== spawn2.room.name) {
        logger.logWorkroom(workroom, `has NotfallCreep! >> ${JSON.stringify(emergencyCreeps)}`);
        continue;
      }
      const transfer = botGlobal3.transfer[workroom];
      if ((transfer == null ? void 0 : transfer.source.includes(spawn2.room.name)) && jobs.transfer.spawn(spawn2, workroom)) {
        logger.logWorkroom(workroom, "Spawn Transfer");
        break;
      }
      const roomMemory = Memory.rooms[workroom];
      if (config.sendDefender && (roomMemory.needDefence || roomMemory.invaderCore)) {
        jobs.defender.spawn(spawn2, workroom);
        logger.logWorkroom(workroom, "Spawn Defender");
        continue;
      }
      if (config.spawnRoom !== spawn2.room.name && config.room !== spawn2.room.name) continue;
      if (roomMemory.invaderCore) continue;
      logger.logWorkroom(workroom, "Spawn JobLoop");
      for (const jobName in jobs) {
        logger.logWorkroom(workroom, `Spawn Job: ${jobName}`);
        if (jobs[jobName].spawn(spawn2, workroom)) break;
      }
      if (spawn2.spawning) break;
    }
  }
}

// src/controller/timing.ts
var botMemory3 = Memory;
var defenceController = require_controller_defence();
function controll() {
  const tick = Game.time;
  init();
  defenceController.tower();
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
  if (tick % 3 === 0 && Game.cpu.bucket === 1e4) {
    Game.cpu.generatePixel();
  }
  if (tick % 5 === 0) {
    spawn();
  }
  if (tick % 7 === 0) {
    defenceController.check();
  }
  if (tick % 11 === 0) {
    writeStatus();
  }
  daylie();
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

// src/main.ts
var botGlobal4 = global;
var botMemory4 = Memory;
var jobs2 = require_creep_jobs();
require_prototype();
function loop() {
  var _a;
  for (const name in botGlobal4.room) {
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
    try {
      jobs2[creepMemory.role].doJob(creep);
    } catch (error) {
      console.log(`Job: ${creepMemory.role}`);
      throw error;
    }
  }
  controll();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loop
});
