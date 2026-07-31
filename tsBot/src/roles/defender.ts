/**
 * Rolle "defender": greift Feinde und Invader-Cores an, zerstört auf Befehl
 * markierte Strukturen bzw. Wände und spawnt bei Verteidigungsbedarf.
 *
 * Ursprünglich aus `prod/creep.defender.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";


const role = "defender";

export function sayJob(this: any) { this.creep.say('⚔') }

export function doJob(creep: Creep) {

    //creep.suicide();
    if(creepBase.goToWorkroom(creep)) return;
    if(_defend(creep)) return;


}

export function _defend(creep: Creep) {
    if(creep.room.name != creep.memory.workroom)
        return false;

    if(creep.memory.attackId)
    {
        var target: any = Game.getObjectById(creep.memory.attackId);
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
    else if(Memory.rooms[creep.memory.workroom]!.needDefence)
    {
        var enemies = creep.room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length > 0)
        {

            enemies.sort(function (a: any, b: any)
            {
                var costA = a.body.reduce(function (total: number, part: any)
                {
                    return total + BODYPART_COST[part.type as BodyPartConstant]!;
                }, 0);

                var costB = b.body.reduce(function (total: number, part: any)
                {
                    return total + BODYPART_COST[part.type as BodyPartConstant]!;
                }, 0);

                return costB - costA;
            });

            creep.memory.attackId = enemies[0]!.id;
            return true;
        }
        else
        {
            Memory.rooms[creep.memory.workroom]!.needDefence = false;
        }
    }
    else if(Memory.rooms[creep.memory.workroom]!.invaderCore)
    {
        var core = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: (s: any) => s.structureType == STRUCTURE_INVADER_CORE});

        if(core.length > 0)
        {
            creep.memory.attackId = core[0]!.id;
            return true;
        }
        else
        {
            Memory.rooms[creep.memory.workroom]!.invaderCore = false;
        }
    }
    else if(bot.room[creep.memory.workroom]!.destroy && !Memory.rooms[creep.memory.workroom]!.destroyDone)
    {

        for(var s of bot.room[creep.memory.workroom]!.destroy!)
        {
            var target: any = Game.getObjectById(s);

            if(target && target.hits > 0)
            {
                creep.memory.attackId = target.id;
                return;
            }
        }

        var walls = creep.room.find(FIND_STRUCTURES, {filter: (s: any) => s.structureType == STRUCTURE_WALL});

        if(walls.length > 0)
        {
            creep.memory.attackId = walls[0]!.id;
        }
        else
        {
            Memory.rooms[creep.memory.workroom]!.destroyDone = true;
        }
    }
    else
    {
        // Fix ggü. prod/creep.defender.js: dort wird ohne break das destroyDone des
        // aktuellen (falschen) Workrooms geprüft, sodass immer der letzte Raum mit
        // destroy-Liste gewinnt. Hier: ersten Raum mit destroy-Liste nehmen, dessen
        // eigenes destroyDone nicht gesetzt ist, und dann abbrechen.
        for(var room in bot.room)
        {
            if(bot.room[room]!.destroy &&!Memory.rooms[room]?.destroyDone)
            {
                creep.memory.workroom = room;
                break;
            }
        }
    }

    if (creep.getActiveBodyparts(ATTACK) + creep.getActiveBodyparts(RANGED_ATTACK) == 0)
    {
        creep.say('💥 Bye!');
        creep.suicide();
    }
}

export function _getProfil(spawn: StructureSpawn): BodyPartConstant[]
{
    const totalCost =  BODYPART_COST[TOUGH] + 2*BODYPART_COST[MOVE] + BODYPART_COST[ATTACK] + BODYPART_COST[RANGED_ATTACK];

    var max = Math.min(5, parseInt((spawn.room.energyAvailable / totalCost) as any));

    if(max == 0 || max == null)
    {
        return [MOVE,MOVE,ATTACK,RANGED_ATTACK];
    }

    return Array((max)).fill(TOUGH).concat(Array((max*2)).fill(MOVE).concat(Array((max)).fill(ATTACK)).concat(Array((max)).fill(RANGED_ATTACK)));
}

export function spawn(spawn: StructureSpawn, workroom: string): boolean
{
    if((!Memory.rooms[workroom]!.needDefence && !Memory.rooms[workroom]!.invaderCore) || !bot.room[workroom]!.sendDefender)
        return false;

    var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom).length;

    if (Memory.rooms[workroom]!.needDefence && 2 <= count ||
        Memory.rooms[workroom]!.invaderCore && 4 <= count)
        return false;

    if( creepBase.spawn(spawn, _getProfil(spawn), role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name}))
    {
        (Memory as any).cOfDefender += 1;
        return true;
    }

    return false;
}
