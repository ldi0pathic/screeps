const creepBase = require('./creep.base');
require('./config');
const role = "extupgrader";

module.exports = {
    sayJob: function() { this.creep.say('🔑') },
    doJob: function (creep) {

        if(creepBase.goToWorkroom(creep)) return;

        creep.checkHarvest();
        
        if (creep.memory.harvest) 
        {
            if(creepBase.harvestControllerLink(creep,RESOURCE_ENERGY))return;
            if(creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY))return; 
            if(creepBase.harvestRoomContainer(creep, RESOURCE_ENERGY))return; 
            if(creepBase.harvestRoomEnergySource(creep)) return;
        } 
       
        creepBase.upgradeController(creep);
    },
    _getProfil: function(spawn, workroom)
    {   var numberOfSets = 0;
        
        var multi = Game.rooms[workroom] && Game.rooms[workroom].controller.level >= 6 ? 1 : 2;
        const totalCost = multi * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] +BODYPART_COST[MOVE];
        var maxEnergy = spawn.room.energyCapacityAvailable;
        numberOfSets = Math.min(9,Math.floor(maxEnergy / totalCost));
        if(numberOfSets == 0)
        {
            return [WORK,CARRY,MOVE,MOVE];
        }
        var carry = Math.min(numberOfSets*2,16);
        
        return Array((numberOfSets*multi)).fill(WORK).concat(Array(carry).fill(CARRY).concat(Array((numberOfSets)).fill(MOVE)));
      
    },
    spawn: function(spawn,workroom)
    {
        if(spawn.room.name == workroom)
            return false;

        var uppis = global.room[workroom].upgrader
        if(!uppis || uppis < 1)
            return false;

 
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && 
                                                    creep.memory.workroom == workroom &&          
                                                    (creep.ticksToLive > 300 || creep.spawning)
                                                    ).length;
                                           
        if ( uppis <= count)
            return false;

        var profil = this._getProfil(spawn, workroom);

        return creepBase.spawn(spawn, profil, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0});
    },
   
};