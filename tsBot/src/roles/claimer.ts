/**
 * Rolle "claimer": beansprucht oder reserviert den Controller eines
 * Arbeitsraums.
 *
 * Ursprünglich aus `prod/creep.claimer.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";


const role = "claimer";

export function doJob(creep: Creep) {

    if(creepBase.goToWorkroom(creep)) return;

    var room = Game.rooms[creep.memory.workroom];
    if(!room)
        return;
    var controller: any = room.controller;
    var claim = bot.room[creep.memory.workroom]!.claim;

    if (controller) {
        if(claim)
        {
            var s = creep.claimController(controller);
            if (s === ERR_NOT_IN_RANGE) {
                creepBase.moveByMemory(creep, controller.pos)
            }
            if(s === OK)
            {
                Memory.rooms[creep.memory.workroom]!.claimed = true;
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
            Memory.rooms[creep.memory.workroom]!.claimed = false;
        }
        else if(state == OK)
        {
            Memory.rooms[creep.memory.workroom]!.claimed = true;
        }

        if(controller.sign.username != creep.owner.username)
        {
           creep.signController(controller,'⚔');
        }
    }
}

export function _getProfil(): BodyPartConstant[]
{
   return  [CLAIM, CLAIM, MOVE,MOVE];
}

export function spawn(spawn: StructureSpawn, workroom: string)
{
    if(!bot.room[workroom]!.sendClaimer)
        return false;

    var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom &&
                                                (creep.ticksToLive! > 100 || creep.spawning)).length;
    var room: any = Game.rooms[workroom];

    if(room && room.controller && room.controller.sign && (room.controller.sign.username == spawn.owner.username || room.controller.sign.username == 'Screeps') && room.controller.reservation && room.controller.reservation.ticksToEnd > 3000)
        return false;

    if ( 1 <= count)
        return false;

    return creepBase.spawn(spawn, _getProfil(), role + '_' + Game.time, { role: role, workroom: workroom, home: spawn.room.name});
}
