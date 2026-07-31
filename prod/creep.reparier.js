const creepBase = require('./creep.base');
require('./config');
const role = "repairer";

module.exports = {
    
    sayJob: function() { this.creep.say('🔧') },
    doJob: function (creep) {
        creep.checkHarvest(function()
        {
            creep.memory.repairs +=1
        });

        if (creep.memory.harvest) {
            if(creepBase.harvest(creep)) return;

            return;
        } 

        if(creep.memory.repairs > global.const.maxRepairs)
        {
            creep.memory.repairs = 0;
            creep.memory.id = null;
        }
        
        if(creep.checkInvasion()) return;
        if(creepBase.goToWorkroom(creep)) return;
        if(creepBase.checkWorkroomPrioSpawn(creep)) return;

        if(this._repairPrio(creep)) return;
        if(this._repair(creep)) return;

        creepBase.upgradeController(creep);
    },
    _getPriority: function(structureType) {
        return global.prio.repair[structureType] || 99;
    },
    _getMinHitRange: function(structureType) {
        return global.prio.hits[structureType] || 0.5;
    },
    _repairPrio: function(creep){
        if(!creep.memory.prioId)
        {
            for(var id in global.room[creep.memory.workroom].prioBuildings)
            {
                var buildingId = global.room[creep.memory.workroom].prioBuildings[id];
                var building = Game.getObjectById(buildingId);

                if(building.hits < building.hitsMax*0.9)
                {
                    creep.memory.prioId = buildingId;
                    return true;
                }
            }
        }
        else
        {
            let target = Game.getObjectById(creep.memory.prioId);
                
            if (target && target.hits < target.hitsMax) 
            {
                let state = creep.repair(target);
                
                if (state === ERR_NOT_IN_RANGE) 
                {
                    creepBase.moveByMemory(creep, target.pos);
                } 
               
                return true;   
            } 
            creep.memory.repairs = 0;
            creep.memory.prioId = null;
        }
        return false;
    },
    _repair: function(creep){
        if(!creep.memory.id)
        {
            let structuresToRepair = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax)
            }});

          
            if(structuresToRepair.length > 0)
            {
                var structs = structuresToRepair.map(site => ({
                    site,
                    progress: site.progress,
                    priority: this._getPriority(site.structureType)
                }))
                .sort((a, b) => {
                    if (a.priority === b.priority) {
                        return b.progress - a.progress;
                    }
                    return a.priority - b.priority;
                });

                creep.memory.id = structs[0].site.id;  
                return true;
            }
        }
        else
        {
            let target = Game.getObjectById(creep.memory.id);
                
            if (target && target.hits < target.hitsMax) 
            {
                let state = creep.repair(target);
                
                if (state === ERR_NOT_IN_RANGE) 
                {
                    creepBase.moveByMemory(creep, target.pos);    
                } 
               
                return true;   
            } 
            creep.memory.repairs = 0;
            creep.memory.id = null;
        }
        return false;
    },
    _getProfil: function(spawn)
    {
        const totalCost = 3 * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
        var maxEnergy = spawn.room.energyCapacityAvailable;
        const numberOfSets = Math.min(3,Math.floor(maxEnergy / totalCost));
        if(numberOfSets == 0)
        {
            return [WORK,CARRY,CARRY,MOVE,MOVE];
        }
        return Array((numberOfSets*3)).fill(WORK).concat(Array((numberOfSets*2)).fill(CARRY).concat(Array((numberOfSets*2)).fill(MOVE)));
    },
    spawn: function(spawn,workroom)
    {  
        var minRepairer = global.room[workroom].repairer
        if(minRepairer < 1)
            return false;

        if(spawn.room.name != workroom && !Memory.rooms[workroom].claimed)
            return false;
             
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && 
                                                    creep.memory.workroom == workroom).length;
        if(count == undefined)
            count = 0;      

        if ( minRepairer <= count)
            return false;

            let structuresToRepair = Game.rooms[workroom].find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax)
            }});

        if(structuresToRepair.length <= 1)
            return false;

        return creepBase.spawn(spawn, this._getProfil(spawn), role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0}) 
    },
   
};
