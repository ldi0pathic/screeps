const creepBase = require('./creep.base');
require('./config');
const role = "debitor";
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
module.exports =
{
    sayJob() { this.creep.say('🚛') },
    doJob: function (creep) {

        if (!creep.memory.mineral)
            creep.memory.mineral = RESOURCE_ENERGY;

        creep.checkHarvest(
            function () {
                if (this.memory.home == this.memory.workroom)
                    return;

                if (!Memory.rooms[this.memory.workroom].needDebitorSize) {
                    if (this.memory.distance > 0) {
                        if (!Memory.rooms[this.memory.workroom].distances)
                            Memory.rooms[this.memory.workroom].distances = [];

                        Memory.rooms[this.memory.workroom].distances.push(this.memory.distance)
                        this.memory.distance = 0
                    }
                }
            },
            function () {
                creep.memory.mineral = RESOURCE_ENERGY;
                if (this.memory.home == this.memory.workroom)
                    return;

                if (!Memory.rooms[this.memory.workroom].needDebitorSize) {
                    if (this.memory.distance > 0) {
                        if (!Memory.rooms[this.memory.workroom].distances)
                            Memory.rooms[this.memory.workroom].distances = [];

                        Memory.rooms[this.memory.workroom].distances.push(this.memory.distance)
                        this.memory.distance = 0
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
                }
                else {
                    if (creepBase.TransportEnergyToHomeTower(creep)) return;
                }
                return;
            }

            return;
        };

        if (creep.memory.notfall) {
            if (creep.memory.harvest) {
                if (creepBase.harvestSpawnLink(creep, creep.memory.mineral)) return;
                if (creepBase.harvestControllerLink(creep, creep.memory.mineral)) return;
                if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
                if (creepBase.harvestNotfall(creep)) return;

                if (creep.room.energyAvailable < 1000 && creep.store.getUsedCapacity() > 0) {
                    creep.memory.harvest = false;
                }
            }
            else {
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

            if (storage && terminal && terminal.store.getFreeCapacity() > 50000) {

                const resources = Object.keys(storage.store).filter(r =>

                    storage.store[r] > 100 && !NEVER_SELL[r]
                ).filter(f => f != "energy");

                if (resources.length > 0) {

                    const resource = resources[0]; // nimm erstes gefundenes
                    creep.memory.mineral = resource[0];
                    if (creepBase.harvestRoomStorage(creep, resource)) return;
                }
            }
            
            if (creep.memory.container == '' && creep.room.name == creep.memory.workroom) {
                if (creep.room.energyAvailable >= creep.room.energyCapacityAvailable * 0.99) {
                    if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
                    if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                }
                else {
                    if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                    if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
                }

                if (creep.room.energyAvailable < 1000 && creep.store.getUsedCapacity() > 0) {
                    creep.memory.harvest = false;
                }
            }
            else {
                if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity())
                {
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
        }
        else if (creep.memory.home == creep.memory.workroom) {
            if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
            if (creepBase.TransportEnergyToHomeTower(creep)) return;
            if (creepBase.TransportToHomeTerminal(creep)) return;
            if (creepBase.TransportToHomeStorage(creep)) return;
            if (creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY)) return;
           
        }
        else {
            if (creepBase.TransportToHomeTerminal(creep)) return;
            if (creepBase.TransportToHomeStorage(creep)) return;
            if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
            if (creepBase.TransportEnergyToHomeTower(creep)) return;    
            if (creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY)) return;
          
        }

        //if(creepBase.TransportToHomeContainer(creep, creep.memory.mineral))return;

        return;
    },
    /**
     * 
     * @param {StructureSpawn} spawn 
     */
    getProfil(spawn, workroom, mineraltype, containerId) {
        if (mineraltype == RESOURCE_ENERGY) {
            if (spawn.room.name != workroom) {
                var carry = Memory.rooms[workroom].needDebitorSize;
                var distances = Memory.rooms[workroom].distances;
                var c = 1;
                if (!carry && distances) {
                    var length = Math.ceil(distances.length * 0.5)
                    var meridian = distances.sort(function (a, b) {
                        return a - b;
                    })[length];
                    carry = Math.ceil((2 * meridian) / 5)
                    var max = Math.min(25, parseInt(spawn.room.energyCapacityAvailable / 100));

                    if (max >= carry) {
                        Memory.rooms[workroom].needDebitors = 1;
                    }
                    else {
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

            if (containerId == '' || spawn.room.name != workroom) {
                var max = Math.min(Math.max(parseInt(spawn.room.energyCapacityAvailable / 100), 1), 20);
                return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
            }

            var max = Math.min(25, parseInt(spawn.room.energyCapacityAvailable / 100));
            return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));
        }
        else {
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
    spawn: function (spawn, workroom) {
        if (global.room[workroom].transferEnergie && spawn.room.name != workroom || spawn.room.name != workroom && !Memory.rooms[workroom].claimed)
            return false;

        if (global.room[workroom].sendDebitor && global.room[workroom].sendMiner && (!Memory.rooms[workroom].hasLinks || !global.room[workroom].useLinks)) {
            for (var id in global.room[workroom].energySources) {
                if (!Game.getObjectById(global.room[workroom].energySources[id]))
                    continue;

                if (this._spawn(spawn, workroom, global.room[workroom].energySources[id], RESOURCE_ENERGY))
                    return true;
            }
        }
        else if (global.room[workroom].sendFreeDebitor) {
            if (this._spawn(spawn, workroom, '', RESOURCE_ENERGY)) //Freelancer B)
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
    _spawn: function (spawn, workroom, source, mineraltype) {
        global.logWorkroom(workroom, 'here');
        let containerId = ''
        if (source != '') {
            var source = Game.getObjectById(source);
            let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: { structureType: STRUCTURE_CONTAINER }
            });

            if (container.length == 0)
                return false;

            containerId = container[0].id;

            var count = _.filter(Game.creeps, (creep) => creep.memory.role == role &&
                creep.memory.workroom == workroom &&
                creep.memory.container == containerId &&
                !creep.memory.notfall &&
                (creep.ticksToLive > 100 || creep.spawning)
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
        }
        else {
            global.logWorkroom(workroom, '2');
            var count = _.filter(Game.creeps, (creep) => creep.memory.role == role &&
                creep.memory.workroom == workroom &&
                creep.memory.container == '' &&
                !creep.memory.notfall &&
                (creep.ticksToLive > 100 || creep.spawning)
            ).length;

            if (global.room[workroom].debitorAsFreelancer <= count)
                return false;
            global.logWorkroom(workroom, '3');
            containerId = '';
        }

        var profil = this.getProfil(spawn, workroom, mineraltype, containerId);
        global.logWorkroom(workroom, '4');
        //wenn im aktuellen raum kein Debitor ist

        if (!creepBase.spawn(spawn, profil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: mineraltype, container: containerId, notfall: false })) {
            if (_.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.workroom == workroom).length == 0 && spawn.room.name == workroom) {
                console.log("[" + spawn.room.name + "|" + workroom + "]Notfallspawn Debitor");
                var min = Math.min(Math.max(parseInt(spawn.room.energyAvailable / 100), 1), 16);
                profil = Array(min).fill(CARRY).concat(Array(min).fill(MOVE));
                mineraltype = RESOURCE_ENERGY;
                return creepBase.spawn(spawn, profil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: mineraltype, container: '', notfall: true })
            }
            return false;
        }
        return true;
    },
}
