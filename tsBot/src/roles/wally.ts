/**
 * Rolle "wally": repariert Walls/Ramparts im Arbeitsraum, erntet/transportiert
 * Energie dabei wie üblich und weicht bei Invasion auf Turm-Nachschub bzw.
 * Energiebeschaffung aus. Ohne Reparaturziel wird der Controller geupgradet.
 *
 * Ursprünglich aus `prod/creep.wallbuilder.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";


const role = "wally";

export function sayJob(this: any) { this.creep.say('🔧') }

export function doJob(creep: Creep) {
    creep.checkHarvest();

    if(creep.checkInvasion())
    {
        if(creep.memory.harvest)
        {
            if(creepBase.harvestRoomStorage(creep,RESOURCE_ENERGY)) return;
            if(creepBase.harvestRoomContainer(creep,RESOURCE_ENERGY,0.25)) return;
            return;
        }
        else
        {
            if(creepBase.TransportEnergyToHomeTower(creep))return;
        }
        return;
    }

    if (creep.memory.harvest)
    {

        creep.memory.wall = null;

        creepBase.harvest(creep);
        return;
    }


    if(creepBase.goToWorkroom(creep)) return;

    if(creepBase.checkWorkroomPrioSpawn(creep)) return;

    if(_repair(creep)) return;

    creepBase.upgradeController(creep);
}

export function _repair(creep: Creep): boolean {
    var targetWall: any;
    if(!creep.memory.wall)
    {
        var wall: any;
        for(var wallId in Memory.rooms[creep.memory.workroom]!.wally)
        {
            var w: any = Game.getObjectById((Memory.rooms[creep.memory.workroom]!.wally as any)[wallId]);

            if(!w)
                continue;

            if(!wall || wall.hits > w.hits)
            {
                wall = w;
            }
        }

        if(wall)
        {
            creep.memory.wall = wall.id;
            targetWall = wall;
        }
    }
    else
    {
        targetWall = Game.getObjectById(creep.memory.wall);

        if(targetWall.hits >= targetWall.hitsMax){
            creep.memory.wall = null;
            return false;
        }
    }

    if(targetWall)
    {
        const repairResult = creep.repair(targetWall);

        if (repairResult === ERR_NOT_IN_RANGE) {
            creepBase.moveByMemory(creep, targetWall.pos);
            return true;
        }

        return repairResult == OK;
    }
    else
    {
        creep.memory.wall = null;
        return false;
    }
}

export function _getProfil(spawn: StructureSpawn): BodyPartConstant[] {
    const totalCost =  BODYPART_COST[WORK] + 2*BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    var maxEnergy = spawn.room.energyCapacityAvailable;
    const numberOfSets = Math.min(9,Math.floor(maxEnergy / totalCost));
    if(numberOfSets == 0)
    {
        return [WORK,CARRY,CARRY,MOVE,MOVE];
    }
    return Array((numberOfSets)).fill(WORK).concat(Array((2*numberOfSets)).fill(CARRY).concat(Array((numberOfSets)).fill(MOVE)));
}

export function spawn(spawn: StructureSpawn, workroom: string): boolean {
    if(spawn.room.name != workroom && !Memory.rooms[workroom]!.claimed)
        return false;

    var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom).length;

    if (bot.room[workroom]!.maxwallRepairer! <= count)
        return false;

    var room = Game.rooms[workroom];
    if(!room)
        return false;

        var walls = room.find(FIND_STRUCTURES,  {filter: (structure: any) => {
            return  (structure.structureType === STRUCTURE_WALL ||
            structure.structureType === STRUCTURE_RAMPART) &&
            structure.hits < structure.hitsMax;
        }})

    if(walls.length == 0)
        return false;


    //Wenn keine Energiereserven vorhanden, kein Wallbuilder spawnen!
    var storage = Game.rooms[workroom]!.storage;
    if(storage && storage.store[RESOURCE_ENERGY] < 50000 || !storage)
        return false;


    var p = _getProfil(spawn);

    return creepBase.spawn(spawn, p, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name});
}
