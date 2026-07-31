const creepBaseTransport = require('./creep.base.transport');
const creepBaseGoTo = require('./creep.base.goto');


module.exports =
{
   

    harvest: function (creep) {
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

        //this.goToMyHome(creep);
    },
    harvestRoomDrops: function (creep, type) {

        var drop;
        if (creep.memory.useRoomDrop) {
            drop = Game.getObjectById(creep.memory.useRoomDrop);
        }
        else {
            drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) =>  d.amount > 100 });
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
    harvestRoomTombstones: function (creep, type) {

        var tombstone;
        if (creep.memory.useTombstone) {
            tombstone = Game.getObjectById(creep.memory.useTombstone);
        }
        else {
            tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity(type) > 100 });
        }

        if (tombstone) {
            switch (creep.withdraw(tombstone, type)) {
                case ERR_NOT_IN_RANGE:
                    creep.memory.useTombstone = tombstone.id;
                    creepBaseGoTo.moveByMemory(creep,tombstone.pos);
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
    harvestCompleteRoomTombstones: function (creep) {
        var tombstone;
        if (creep.memory.useTombstone) {
            tombstone = Game.getObjectById(creep.memory.useTombstone);
        }
        else {
            tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity() > 100 });
        }

        if (tombstone) {
            for (var resourceType in tombstone.store) {
                switch (creep.withdraw(tombstone, resourceType)) {
                    case ERR_NOT_IN_RANGE:
                        creepBaseGoTo.moveByMemory(creep,tombstone.pos);
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
    harvestRoomRuins: function (creep, type) {
        var ruin;
        if (creep.memory.useRuin) {
            ruin = Game.getObjectById(creep.memory.useRuin);
        }
        else {
            ruin = creep.pos.findClosestByPath(FIND_RUINS, { filter: (d) => d.store.getUsedCapacity(type) > 50 });
        }

        if (ruin) {
            switch (creep.withdraw(ruin, type)) {
                case ERR_NOT_IN_RANGE:
                    creepBaseGoTo.moveByMemory(creep,ruin.pos);
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
    harvestRoomStorage: function (creep, type) {
        let storage = creep.room.storage;
        let min = type === "energy" ? (creep.store.getCapacity() * 0.5) : 50;
        if (storage && storage.store[type] > min) //Creep sollte min halbvoll werden
        {
            var state  = creep.withdraw(storage, type); 
            switch (state) {
                case ERR_NOT_IN_RANGE:
                    creepBaseGoTo.moveByMemory(creep,storage.pos);
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
    harvestRoomContainer: function (creep, type, mul) {
        if (!mul) mul = 0.5;
        var container;
        if (creep.memory.useContainer) {
            container = Game.getObjectById(creep.memory.useContainer);
        }
        else if(Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name].container && Memory.rooms[creep.room.name].container.length > 0) {
            var distance = Infinity;
            var minCap = creep.store.getFreeCapacity() * mul;
            for(var id of Memory.rooms[creep.room.name].container)
            { 
                var c = Game.getObjectById(id);
                if(!c){
                    delete Memory.rooms[creep.room.name].container;
                }
                if(c && c.store.getUsedCapacity(type) >  minCap)
                {
                    var d = Math.sqrt(Math.pow(c.pos.x - creep.pos.x, 2) + Math.pow(c.pos.y - creep.pos.y, 2));
                    if(d < distance)
                    {
                        //console.log('['+creep.room.name+'] d: '+d + ' << distance: '+distance + ' count >'+Memory.rooms[creep.room.name].container.length );
                        distance = d;
                        container = c;
                        creep.memory.useContainer = c.id;
                    }         
                }
            }  
        } else if(Memory.rooms[creep.room.name] && (!Memory.rooms[creep.room.name].container || (Memory.rooms[creep.room.name].container && Memory.rooms[creep.room.name].container.length == 0)))
        { 
            var containers = creep.room.find(FIND_STRUCTURES,  {filter: (structure) => 
            {
                return  structure.structureType === STRUCTURE_CONTAINER 
            }});
           
            Memory.rooms[creep.room.name].container = containers.map( c => {
                return c.id
            });   

            return (containers.length > 0);    
        }

        if (container && container.store.getUsedCapacity(type)  > creep.store.getFreeCapacity() * mul) {
            switch (creep.withdraw(container, type)) {
                case ERR_NOT_IN_RANGE:
                    creepBaseGoTo.moveByMemory(creep,container.pos);
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
    harvestSpawnLink: function (creep, type) {
        if (creep.memory.workroom != creep.room.name ||
            !global.room[creep.memory.workroom].spawnLink)
            return false;

        var link = Game.getObjectById(global.room[creep.memory.workroom].spawnLink);

        if (link && link.store[type] > 100) {
            switch (creep.withdraw(link, type)) {
                case ERR_NOT_IN_RANGE:
                    creepBaseGoTo.moveByMemory(creep,link.pos);
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
    harvestControllerLink: function (creep, type) {
        if (creep.memory.workroom != creep.room.name ||      
            !global.room[creep.memory.workroom].controllerLink ||
            !creep.room.controller.my ||
             creep.room.controller.level <5)
            return false;

        var link = Game.getObjectById(global.room[creep.memory.workroom].controllerLink);

        if (link && link.store[type] > 100) {
            switch (creep.withdraw(link, type)) {
                case ERR_NOT_IN_RANGE:
                    creepBaseGoTo.moveByMemory(creep,link.pos);
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
    harvestMyContainer: function (creep, type) {
        if (creep.memory.workroom != creep.room.name || creep.memory.container == '')
            return false;

        var container = Game.getObjectById(creep.memory.container);

        if (container) {
            if (container.store[type] < 100) {
                return false;
            }

            switch (creep.withdraw(container, type)) {
                case ERR_NOT_IN_RANGE:
                    creepBaseGoTo.moveByMemory(creep,container.pos);
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
    harvestNotfall: function (creep) {

        var notfall = creep.room.find(FIND_STRUCTURES,  {filter: (structure) => 
        {
            return  (structure.structureType === STRUCTURE_LINK ||  
            structure.structureType === STRUCTURE_LAB ||  
            structure.structureType === STRUCTURE_NUKER ||  
            structure.structureType == STRUCTURE_TOWER)
            && structure.store[RESOURCE_ENERGY] > 0
        }});
     
        if(notfall.length > 0)
        {
            notfall.sort(function (a, b) 
            {
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
    harvestRoomEnergySource: function (creep) {
        if (this.canHarvestEnergy(creep)) {
            var source;
            if (creep.memory.useRoomSource) {
                source = Game.getObjectById(creep.memory.useRoomSource);
            }
            else {
                source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
            }

            if (source && source.energy > 100) {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    if (creep.moveTo(source) == ERR_NO_PATH) { // z.B. falls durch miner blockiert
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
    canHarvestEnergy: function (creep) {
        return creep.getActiveBodyparts(WORK) > 0;
    },
    calcProfil: function (creepProfile) {
        let energyCost = 0;
        for (const bodyPart of creepProfile) {
            energyCost += BODYPART_COST[bodyPart];
        }
        return energyCost;
    },
    goToMyHome: function (creep) { return creepBaseGoTo.goToMyHome(creep) },
    goToRoomFlag: function (creep) { return creepBaseGoTo.goToRoomFlag(creep) },
    goToWorkroom: function (creep) { return creepBaseGoTo.goToWorkroom(creep) },
    moveByMemory: function (creep, target) { return creepBaseGoTo.moveByMemory(creep, target) },

    TransportEnergyToHomeSpawn: function (creep) { return creepBaseTransport.TransportEnergyToHomeSpawn(creep); },
    TransportEnergyToHomeTower: function (creep) { return creepBaseTransport.TransportEnergyToHomeTower(creep); },
    TransportToHomeTerminal: function (creep) { return creepBaseTransport.TransportToHomeTerminal(creep); },
    TransportToHomeStorage: function (creep) { return creepBaseTransport.TransportToHomeStorage(creep); },
    TransportToHomeContainer: function (creep, type, mul) { return creepBaseTransport.TransportToHomeContainer(creep, type, mul); },
    TransportToHomeLab: function (creep, type) { return creepBaseTransport.TransportToHomeLab(creep, type); },

    checkWorkroomPrioSpawn: function (creep) {
        if (Memory.rooms[creep.memory.workroom].aktivPrioSpawn) {
            if (this.TransportEnergyToHomeSpawn(creep)) {
                creep.say('🚨');
                return true;
            }
        }
        return false;
    },
    upgradeController: function (creep) {
       
        var controller = creep.room.controller;
        if (!controller && !controller.my)
            return;
      
        const state = creep.upgradeController(controller);
      
        if (state === ERR_NOT_IN_RANGE || 
            (state === ERR_INVALID_TARGET && controller.upgradeBlocked > 0)) {
            creepBaseGoTo.moveByMemory(creep,controller.pos);
            
        }

        if (!controller.sign ||
            controller.sign.username == undefined ||
            controller.sign.username != creep.owner.username) {

            var c = creep.signController(controller, '⚔')
            if (c === ERR_NOT_IN_RANGE) {
                creepBaseGoTo.moveByMemory(creep,controller.pos);
            }
           
        }

        return state == OK;
    },
    spawn: function (spawn, profil, newName, memory) {
        if (spawn.spawnCreep(profil, newName, { dryRun: true }) === 0) {
            spawn.spawnCreep(profil, newName, { memory: memory });
            console.log("[" + spawn.room.name + "|" + memory.workroom + "] spawn " + newName + " cost: " + this.calcProfil(profil));
            return true;
        }
        return false;
    }
};
