// @ts-nocheck
module.exports = {
    check: function()
    { 
        for(var name in global.room)
        {  
            if(! global.room[name].sendDefender)
                continue;

            if(Memory.rooms[name].invaderCoreEndTick &&
                (Game.time + 10) > Memory.rooms[name].invaderCoreEndTick )
            {
                Memory.rooms[name].invaderCore = false;
            }
            
            if(Memory.rooms[name].needDefenceEndTick &&
                (Game.time + 10) > Memory.rooms[name].needDefenceEndTick )
            {
                Memory.rooms[name].needDefence = false;
            }
            
            var room = Game.rooms[global.room[name].room];

            if(!room)
                continue;

            var hostiles = room.find(FIND_HOSTILE_CREEPS);
            var core = room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_INVADER_CORE});
            var nukes = room.find(FIND_NUKES);

            Memory.rooms[name].needDefence = hostiles.length > 0;
            if(hostiles.length > (global.room[name].minHostile || 1))
            {
                let maxLifeTime = 0;

                for (var creep of hostiles) {
                    if (creep.ticksToLive !== undefined && creep.ticksToLive > maxLifeTime) {
                        maxLifeTime = creep.ticksToLive;
                    }
                }
                Memory.rooms[name].needDefenceEndTick = Game.time + maxLifeTime;
            }
            
            Memory.rooms[name].invaderCore = core.length > 0;
            if(core.length > 0)
            {
                Memory.rooms[name].claimed = false;
                var timeRemaining = 0;
                for(var effect of (core[0].effects || []))
                {
                    const time = effect.ticksRemaining;
                    if(time > timeRemaining)
                    {
                        timeRemaining = time;
                    }
                }
                Memory.rooms[name].invaderCoreEndTick = Game.time + timeRemaining;
            }    

            if(nukes.length > 0 )
            {
                var msg = "";
                Memory.rooms[name].nukepos = [];
                for(var nuke of nukes)
                {
                    msg += "Raum "+nuke.room+ " wird in "+nuke.timeToLand+" ticks von Raum "+nuke.launchRoomName+" aus genuked!\r\n";
                   
                    if(!Memory.rooms[name].nukepos.includes(nuke.pos))
                        Memory.rooms[name].nukepos.push(nuke.pos);
                }

                if(msg.length > 0 && !Memory.rooms[name].nuke)
                    Game.notify(msg);   
            }
            else
            {  if (Memory.rooms[name].nukepos) 
                    Memory.rooms[name].nukepos = [];
            }
           
            Memory.rooms[name].nuke = nukes.length > 0;
        }
    },
    tower: function()
    {
        for(var name in global.room)
        {  
            var room = Game.rooms[name];
            if(!room ||  !room.controller || !room.controller.my|| !Memory.rooms[name].tower || Memory.rooms[name].tower.length == 0)
                continue;  

            if(Memory.rooms[name].needDefence)
            {
                var hostileCreeps = room.find(FIND_HOSTILE_CREEPS);

                if (hostileCreeps.length > 0) 
                {
                    var strongHealers = hostileCreeps.filter(creep => {
                        var healParts = creep.body.filter(part => part.type === HEAL).length;
                        return healParts >= 5; 
                    });
                    
                    if (strongHealers.length === 0) 
                    {
                        // Sortiere die feindlichen Creeps nach ihren Bodypart-Kosten in absteigender Reihenfolge
                        hostileCreeps.sort(function (a, b) 
                        {
                            var costA = a.body.reduce(function (total, part) 
                            {
                                return total + BODYPART_COST[part.type];
                            }, 0);
        
                            var costB = b.body.reduce(function (total, part) 
                            {
                                return total + BODYPART_COST[part.type];
                            }, 0);
        
                            return costB - costA;
                        });
        
                        for(var towerid of Memory.rooms[name].tower)
                        {
                                var tower = Game.getObjectById(towerid);
                                if(tower)
                                    tower.attack(hostileCreeps[0]);
                        }
                    }
                    else
                    {
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
                    
                }
                else
                {
                    Memory.rooms[name].needDefence = false;
                    delete Memory.rooms[name].structureHP;
                }
            }   
            else if( Game.time %3 == 2)
            {
                var damagedStructures = room.find(FIND_STRUCTURES,
                {
                    filter: (structure) => 
                    {
                        return (structure.hits < (global.prio.hits[structure.structureType] || 0.5) * structure.hitsMax)
                    }
                });

                if(damagedStructures.length > 0) 
                {
                    damagedStructures.sort((a, b) => {
                        const priorityA = global.prio.repair[a.structureType] || 10;
                        const priorityB = global.prio.repair[b.structureType] || 10;

                        const damageA = a.hitsMax - a.hits;
                        const damageB = b.hitsMax - b.hits;
                    
                        const scoreA = priorityA * damageA;
                        const scoreB = priorityB * damageB;
                        return scoreA - scoreB;
                    });

                    for(var towerid of Memory.rooms[name].tower)
                    { 
                        var tower = Game.getObjectById(towerid);
                        if(tower && tower.store.getUsedCapacity([RESOURCE_ENERGY]) * 0.5 > tower.store.getFreeCapacity([RESOURCE_ENERGY]))
                            tower.repair(damagedStructures[0]);
                    }
                    
                }
            }
        }
    }
};
