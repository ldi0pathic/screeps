const creepBase = require('./creep.base');
require('./config');
const role = "claimer";

module.exports = {
    sayJob: function() { this.creep.say('📌') },
    doJob: function (creep) {
        
       // if(creepBase.checkInvasion(creep)) return;
        if(creepBase.goToWorkroom(creep)) return;
        
        var room = Game.rooms[creep.memory.workroom];
        if(!room)
            return;
        var controller = room.controller;
        var claim = global.room[creep.memory.workroom].claim;

        if (controller) {
            if(claim)
            {
                var s = creep.claimController(controller);
                if (s === ERR_NOT_IN_RANGE) {
                    creepBase.moveByMemory(creep, controller.pos)   
                }
                if(s === OK)
                {
                    Memory.rooms[creep.room.name].claimed = true;
                }
                return;
            }
            var state = creep.reserveController(controller);
            if (state === ERR_NOT_IN_RANGE) {
                creepBase.moveByMemory(creep, controller.pos)   
            }
            else if(state == ERR_INVALID_TARGET)
            {
                creep.say('🪓')
                creep.attackController(controller);
                Memory.rooms[creep.memory.workroom].claimed = false;
            }
            else if(state == OK)
            {
                Memory.rooms[creep.memory.workroom].claimed = true;
            }

            if(controller.sign.username != creep.owner.username)
            {
               creep.signController(controller,'⚔');
            }
        }
    },
    _getProfil: function()
    {
       return  [CLAIM, CLAIM, MOVE,MOVE];
    },
    spawn: function(spawn,workroom)
    { 
        if(!global.room[workroom].sendClaimer)
            return false;
           
        var count = _.filter(Game.creeps, (creep) => creep.memory.role == role && 
                                                    creep.memory.workroom == workroom && 
                                                    (creep.ticksToLive > 100 || creep.spawning)).length;
        var room = Game.rooms[workroom];
        
        if(room && room.controller && (room.controller.sign && (spawn.owner != ''  && (room.controller.sign.username == spawn.owner.username)) || room.controller.sign.username == 'Screeps' ) && room.controller.reservation && room.controller.reservation.ticksToEnd > 3000)
            return false;
        
        if ( 1 <= count)
            return false;
          
        return creepBase.spawn(spawn, this._getProfil(), role + '_' + Game.time, { role: role, workroom: workroom, home: spawn.room.name});
    },
   
};