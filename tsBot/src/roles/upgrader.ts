/**
 * Rolle "upgrader": Controller-Upgrader mit eigener Energiebeschaffung
 * (Controller-Link, Storage, Container, Drops, Tombstones, Ruins, Quelle)
 * und "Sparmodus" bei hohem Controller-Level.
 *
 * Ursprünglich aus `prod/creep.upgrader.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";

const role = "upgrader";

export function doJob(creep: Creep) {

    if(creep.memory.sparmodus && Game.time % creep.room.controller!.level != 0) return;

    creep.checkHarvest();

    if (creep.memory.harvest)
    {
        if(!creep.memory.noLink && bot.room[creep.memory.workroom]!.controllerLink && (creep.room.controller!.my && creep.room.controller!.level >= 5) )
        {
            if(creepBase.harvestControllerLink(creep,RESOURCE_ENERGY)) return;

        }
        else
        {

            if (creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY))
                return;

            if (creepBase.harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25))
                return;

            if (creepBase.harvestRoomDrops(creep, RESOURCE_ENERGY))
                return;

            if (creepBase.harvestRoomTombstones(creep, RESOURCE_ENERGY))
                return;

            if (creepBase.harvestRoomRuins(creep, RESOURCE_ENERGY))
                return;

            if (creepBase.harvestRoomEnergySource(creep))
                return;

        }

        if(creep.store.getUsedCapacity() > creep.store.getFreeCapacity())
        {
            creep.memory.harvest = false;
        }

        return;
    }

    if(creep.checkInvasion()) return;
    if(creepBase.goToWorkroom(creep)) return;
    if(creepBase.checkWorkroomPrioSpawn(creep)) return;

    if(creepBase.upgradeController(creep))
    {
        creep.memory.sparmodus = creep.room.controller!.level > 5;
    }
}

export function _getProfil(spawn: StructureSpawn, workroom: string): BodyPartConstant[]
{   var numberOfSets = 0;

    var multi = Game.rooms[workroom]!.controller!.level > 7 ? 0.5 : 2;
    const totalCost = multi * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2* BODYPART_COST[MOVE];
    var maxEnergy = spawn.room.energyCapacityAvailable;
    numberOfSets = Math.min(Game.rooms[workroom]!.controller!.level > 7 ? 9:8 ,Math.floor(maxEnergy / totalCost));
    if(numberOfSets == 0)
    {
        return [WORK,CARRY,MOVE,MOVE];
    }

    return Array(Math.floor(numberOfSets*multi)).fill(WORK).concat(Array(numberOfSets*2).fill(CARRY).concat(Array((numberOfSets*2)).fill(MOVE)));

}

export function spawn(spawn: StructureSpawn, workroom: string): boolean
{
    var uppis = bot.room[workroom]!.upgrader

    if(!uppis || uppis < 1)
        return false;

    if(spawn.room.name != workroom)
        return false;

    if(spawn.room.controller!.level > 7 && spawn.room.controller!.ticksToDowngrade > 100000 && spawn.room.storage && spawn.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 250000)
        return false;

    var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom &&
                                                (creep.ticksToLive! > 160 || creep.spawning)
                                                ).length;

    if ( uppis <= count)
        return false;

    var profil = _getProfil(spawn, workroom);

    return creepBase.spawn(spawn, profil, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0, noLink: false});
}
