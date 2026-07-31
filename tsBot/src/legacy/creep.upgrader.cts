// @ts-nocheck
const creepBase = require('./creep.base.cts');
require('./config.cts');
const role = "upgrader";

module.exports = {
    sayJob: function() { this.creep.say('🔑') },
    doJob: function (creep) {

        if(creep.memory.sparmodus && Game.time % creep.room.controller.level != 0) return;

        creep.checkHarvest();

        if (creep.memory.harvest) 
        {
            if(!creep.memory.noLink && global.room[creep.memory.workroom].controllerLink && (creep.room.controller.my && creep.room.controller.level >= 5) )
            {
                if(creepBase.harvestControllerLink(creep,RESOURCE_ENERGY)) return;     
               
            }
            else
            {
               
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

            if(creep.store.getUsedCapacity() > creep.store.getFreeCapacity())
            {
                creep.memory.harvest = false;
            }

            return;
        } 

        if(creep.checkInvasion()) return;
        if(creepBase.goToWorkroom(creep)) return;
        if(creepBase.checkWorkroomPrioSpawn(creep)) return;

        if(creepBase.upgradeController(creep))
        {
            creep.memory.sparmodus = creep.room.controller.level > 5;
        }
    },
    _getProfil: function(spawn, workroom)
    {   var numberOfSets = 0;
        
        var multi = Game.rooms[workroom].controller.level > 7 ? 0.5 : 2;
        const totalCost = multi * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2* BODYPART_COST[MOVE];
        var maxEnergy = spawn.room.energyCapacityAvailable;
        numberOfSets = Math.min(Game.rooms[workroom].controller.level > 7 ? 9:8 ,Math.floor(maxEnergy / totalCost));
        if(numberOfSets == 0)
        {
            return [WORK,CARRY,MOVE,MOVE];
        }
       
        return Array(Math.floor(numberOfSets*multi)).fill(WORK).concat(Array(numberOfSets*2).fill(CARRY).concat(Array((numberOfSets*2)).fill(MOVE)));
      
    },
    spawn: function(spawn,workroom)
    { 
        var uppis = global.room[workroom].upgrader
        
        if(!uppis || uppis < 1)
            return false;

        if(spawn.room.name != workroom)
            return false;

        if(spawn.room.controller.level > 7 && spawn.room.controller.ticksToDowngrade > 100000 && spawn.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 250000)
            return false;
           
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && 
                                                    creep.memory.workroom == workroom &&          
                                                    (creep.ticksToLive > 160 || creep.spawning)
                                                    ).length;
                                           
        if ( uppis <= count)
            return false;

        var profil = this._getProfil(spawn, workroom);

        return creepBase.spawn(spawn, profil, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0, noLink: false});
    },
   
};
