// @ts-nocheck
const creepBase = require('./creep.base.cts');
const creepBaseGoto = require('./creep.base.goto.cts');
require('./config.cts');
const role = "builder";

module.exports = {
    sayJob: function() { this.creep.say('🔨') },
    doJob: function (creep) {
        creep.checkHarvest();
        if(creepBase.goToWorkroom(creep)) return;
        if (creep.memory.harvest) {
            creep.memory.repId = null;
            if(creepBase.harvest(creep)) return;

            if(creep.store.getUsedCapacity() > creep.store.getFreeCapacity())
            {
                creep.memory.harvest = false;
            }
            
            if(creepBase.harvestSpawnLink(creep,creep.memory.mineral))return;

            return;
        } 
        
        if(creep.checkInvasion()) return;
        if(creepBase.goToWorkroom(creep)) return;
        if(creepBase.checkWorkroomPrioSpawn(creep)) return;

        if(this._build(creep)) return;

        creepBase.upgradeController(creep);
    },
    _getPriority: function(structureType) {
        return global.prio.build[structureType] || 99;
    },  
    _build: function(creep){
        if(!creep.memory.id)
        {
            let structuresToBuild = creep.room.find(FIND_CONSTRUCTION_SITES);
 
            if(structuresToBuild.length > 0)
            {
                var structs = structuresToBuild.map(site => ({
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
            if (target && target.progressTotal != undefined) 
            {
                let state = creep.build(target);
               
                if (state === ERR_NOT_IN_RANGE) 
                {
                    creepBase.moveByMemory(creep, target.pos)   
                } 
               
                return true;   
            }
            else
            {
                creep.memory.id = null;   
            }       
        }
       
        return false;
    },
    _getProfil: function(spawn)
    {
        const totalCost =  3* BODYPART_COST[WORK] + 2* BODYPART_COST[CARRY] + 2*BODYPART_COST[MOVE];
        var maxEnergy = spawn.room.energyCapacityAvailable;
        var numberOfSets = Math.min(7,Math.floor(maxEnergy / totalCost));
        
        return Array((numberOfSets*3)).fill(WORK).concat(Array((numberOfSets*2)).fill(CARRY).concat(Array((numberOfSets*2)).fill(MOVE)));
    },
    spawn: function(spawn,workroom)
    {
        var maxbuilder = global.room[workroom].maxbuilder
        if(!global.room[workroom].sendBuilder || maxbuilder < 1)
            return false;

        if(spawn.room.name != workroom && !Memory.rooms[workroom].claimed && !global.room[workroom].claim)
            return false;
        
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && 
                                                    creep.memory.workroom == workroom ).length;
        if(count == undefined)
            count = 0;
                                        
        if ( maxbuilder <= count)
            return false;


        var room = Game.rooms[workroom];
        var sites = 0;
        if(room)
            sites = room.find(FIND_CONSTRUCTION_SITES).length;

        if(sites == 0 || Math.max(sites / 5, 1) <= count)
            return false;
        
        
        return creepBase.spawn(spawn, this._getProfil(spawn), role + '_' + Game.time, { role: role, workroom: workroom, home: spawn.room.name});      
    },

   
   
};