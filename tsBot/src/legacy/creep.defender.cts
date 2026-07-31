// @ts-nocheck
const creepBase = require('./creep.base.cts');
require('./config.cts');
const role = "defender";

module.exports = {
    sayJob: function() { this.creep.say('⚔') },
    doJob: function (creep) 
    {

        //creep.suicide();
        if(creepBase.goToWorkroom(creep)) return;
        if(this._defend(creep)) return;
        

    },
    _defend: function(creep)
    {
        if(creep.room.name != creep.memory.workroom)
            return false;

        if(creep.memory.attackId)
        {
            var target = Game.getObjectById(creep.memory.attackId);
            if(target)
            {
                var result = creep.attack(target);
                creep.rangedAttack(target);
                if (result === OK) {      
                    var name = target.name ? target.name : target.structureType;
                    console.log(`[${creep.memory.workroom}] ${creep.name} greift ${name} an.`);
                }
                else
                {
                    creep.say('✊')
                    creep.moveTo(target, {reusePath: 5});
                }     
            }
            else
            {
                delete creep.memory.attackId;
            }     
        }
        else if(Memory.rooms[creep.memory.workroom].needDefence)
        {
            var enemies = creep.room.find(FIND_HOSTILE_CREEPS);
            if (enemies.length > 0) 
            {
                
                enemies.sort(function (a, b) 
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

                creep.memory.attackId = enemies[0].id;
                return true;
            }
            else
            {
                Memory.rooms[creep.memory.workroom].needDefence = false;     
            }
        }
        else if(Memory.rooms[creep.memory.workroom].invaderCore)
        {
            var core = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_INVADER_CORE});

            if(core.length > 0)
            {
                creep.memory.attackId = core[0].id;     
                return true;
            }
            else
            {
                Memory.rooms[creep.memory.workroom].invaderCore = false;
            }
        }
        else if(global.room[creep.memory.workroom].destroy && !Memory.rooms[creep.memory.workroom].destroyDone) 
        {
           
            for(var s of global.room[creep.memory.workroom].destroy)
            {     
                var target = Game.getObjectById(s);
               
                if(target && target.hits > 0)
                {
                    creep.memory.attackId = target.id;
                    return;
                }
            }    
            
            var walls = creep.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_WALL});

            if(walls.length > 0)
            {
                creep.memory.attackId = walls[0].id;
            }
            else
            {
                Memory.rooms[creep.memory.workroom].destroyDone = true;
            }
        }
        else
        {
            for(var room in global.room)
            {
                if(global.room[room].destroy &&!Memory.rooms[creep.memory.workroom].destroyDone)
                {
                    creep.memory.workroom = room;         
                }
            }
        }

        if (creep.getActiveBodyparts(ATTACK) + creep.getActiveBodyparts(RANGED_ATTACK) == 0) 
        {        
            creep.say('💥 Bye!');
            creep.suicide();
        }
    },
    _getProfil: function(spawn)
    {
        const totalCost =  BODYPART_COST[TOUGH] + 2*BODYPART_COST[MOVE] + BODYPART_COST[ATTACK] + BODYPART_COST[RANGED_ATTACK];
       
        var max = Math.min(5, parseInt(spawn.room.energyAvailable / totalCost));
     
        if(max == 0 || max == null)
        {
            return [MOVE,MOVE,ATTACK,RANGED_ATTACK];
        }

        return Array((max)).fill(TOUGH).concat(Array((max*2)).fill(MOVE).concat(Array((max)).fill(ATTACK)).concat(Array((max)).fill(RANGED_ATTACK)));
    },
    spawn: function(spawn,workroom)
    {
        if((!Memory.rooms[workroom].needDefence && !Memory.rooms[workroom].invaderCore) || !global.room[workroom].sendDefender)
            return false;

        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && 
                                                    creep.memory.workroom == workroom).length;
                                
        if (Memory.rooms[workroom].needDefence && 2 <= count || 
            Memory.rooms[workroom].invaderCore && 4 <= count)
            return false;
        
        if( creepBase.spawn(spawn, this._getProfil(spawn), role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name}))
        {
            Memory.cOfDefender += 1;
            return true;
        }
      
        return false;
    },
   
};