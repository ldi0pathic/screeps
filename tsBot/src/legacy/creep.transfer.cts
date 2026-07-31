// @ts-nocheck
const creepBase = require('./creep.base.cts');
require('./config.cts');
const role = "transfer";
module.exports =
{
    sayJob() { this.creep.say('🚛') },
    doJob: function (creep) {

        if(!creep.memory.mineral)
            creep.memory.mineral = RESOURCE_ENERGY;

        creep.checkHarvest();

        if (creep.memory.harvest) {
          
            if(creep.room.name == creep.memory.workroom)
            {
                if (creepBase.harvestRoomRuins(creep, RESOURCE_ENERGY))return;
                if (creepBase.harvestRoomDrops(creep, RESOURCE_ENERGY))return;
                if (creepBase.harvestRoomTombstones(creep, RESOURCE_ENERGY))return;

                if(creep.store.getUsedCapacity() > 1)
                    creep.memory.harvest = false;
            }

            if(creepBase.goToMyHome(creep)) return;
            
            if(creepBase.harvestRoomStorage(creep,creep.memory.mineral)) return;
            if(creepBase.harvestRoomContainer(creep,creep.memory.mineral,0.25)) return;  

           
            if(creepBase.goToRoomFlag(creep)) return;
            
            return;           
        }
      
        if(creepBase.goToWorkroom(creep))return;
        if(creepBase.TransportEnergyToHomeTower(creep))return; 
        if(creepBase.TransportToHomeTerminal(creep))return;
        if(creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY))return;
        if(creepBase.TransportToHomeStorage(creep))return; 
      
        if(creepBase.TransportToHomeContainer(creep, creep.memory.mineral))return;
        var other = creep.room.find(FIND_MY_CREEPS, {filter: (c) => 
            {
                return (c.memory.role == 'builder'  ) && c.store.getFreeCapacity() > 0
            }});
           
            if(other.length > 0)
        
            {
                switch(creep.transfer(other[0],RESOURCE_ENERGY, other[0].store.getFreeCapacity()))
                {
                    case ERR_NOT_IN_RANGE:
                        creep.moveTo(other[0]);
                        return true;
                    case OK:
                        return true;
                }
            }
        if(creepBase.goToRoomFlag(creep)) return;
        return;        
    },
    /**
     * 
     * @param {StructureSpawn} spawn 
     */
    getProfil(spawn) 
    {     
        var max = Math.min(25,parseInt(spawn.room.energyCapacityAvailable / 100));
        return Array(max).fill(CARRY).concat(Array(max).fill(MOVE));  
    },
    /**
    * 
    * @param {StructureSpawn} spawn 
    * @param {String} workroom 
    * @returns 
    */
    spawn: function(spawn,workroom)
    {
        if(!global.room[workroom].transferEnergie || spawn.room.name == workroom || !Memory.rooms[workroom].claimed)
            return false;
 
        if(this._spawn(spawn,workroom,RESOURCE_ENERGY)) 
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
    _spawn: function (spawn, workroom, mineraltype) 
    { 
      
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && 
                                                    creep.memory.workroom == workroom && 
                                                    creep.memory.home == spawn.room.name && //hier wichtig, da mehere spawns infrage kommem
                                                    (creep.ticksToLive > 100 || creep.spawning)
                                                    ).length;
                                               
        if (1 <= count)
            return false;

        var storage = Game.rooms[spawn.room.name].storage;
       
        if(storage && storage.store[RESOURCE_ENERGY] < 10000 || !storage)
            return false;      
           
        var profil = this.getProfil(spawn);
        
       return creepBase.spawn(spawn,profil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: mineraltype }); 
    },
}