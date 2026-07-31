/**
 * Rolle "repairer": repariert Gebäude im Arbeitsraum. Kümmert sich zuerst um
 * priorisierte Bauten (`prioBuildings`) und danach um alle beschädigten
 * Strukturen, sortiert nach Priorität und Baufortschritt.
 *
 * Inhaltlich identisch zu `prod/creep.reparier.js` (Dateiname hier bewusst
 * korrigiert auf `repairer.ts`; der Rollenschlüssel bleibt `repairer`).
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";


const role = "repairer";

export function sayJob(this: any) { this.creep.say('🔧') }

export function doJob(creep: Creep) {
    creep.checkHarvest(function()
    {
        creep.memory.repairs +=1
    });

    if (creep.memory.harvest) {
        if(creepBase.harvest(creep) as any) return;

        return;
    }

    if(creep.memory.repairs > bot.const.maxRepairs)
    {
        creep.memory.repairs = 0;
        creep.memory.id = null;
    }

    if(creep.checkInvasion()) return;
    if(creepBase.goToWorkroom(creep)) return;
    if(creepBase.checkWorkroomPrioSpawn(creep)) return;

    if(_repairPrio(creep)) return;
    if(_repair(creep)) return;

    creepBase.upgradeController(creep);
}

export function _getPriority(structureType: any): number {
    return bot.prio.repair[structureType as StructureConstant] || 99;
}

export function _getMinHitRange(structureType: any): number {
    return bot.prio.hits[structureType as StructureConstant] || 0.5;
}

export function _repairPrio(creep: Creep): boolean {
    if(!creep.memory.prioId)
    {
        for(var id in bot.room[creep.memory.workroom]!.prioBuildings)
        {
            var buildingId: any = (bot.room[creep.memory.workroom]!.prioBuildings as any)[id];
            var building: any = Game.getObjectById(buildingId);

            if(building.hits < building.hitsMax*0.9)
            {
                creep.memory.prioId = buildingId;
                return true;
            }
        }
    }
    else
    {
        let target: any = Game.getObjectById(creep.memory.prioId);

        if (target && target.hits < target.hitsMax)
        {
            let state = creep.repair(target);

            if (state === ERR_NOT_IN_RANGE)
            {
                creepBase.moveByMemory(creep, target.pos);
            }

            return true;
        }
        creep.memory.repairs = 0;
        creep.memory.prioId = null;
    }
    return false;
}

export function _repair(creep: Creep): boolean {
    if(!creep.memory.id)
    {
        let structuresToRepair = creep.room.find(FIND_STRUCTURES, {
            filter: (structure: any) => {
                return (structure.hits < _getMinHitRange(structure.structureType) * structure.hitsMax)
        }});


        if(structuresToRepair.length > 0)
        {
            var structs = structuresToRepair.map((site: any) => ({
                site,
                progress: site.progress,
                priority: _getPriority(site.structureType)
            }))
            .sort((a: any, b: any) => {
                if (a.priority === b.priority) {
                    return b.progress - a.progress;
                }
                return a.priority - b.priority;
            });

            creep.memory.id = structs[0]!.site.id;
            return true;
        }
    }
    else
    {
        let target: any = Game.getObjectById(creep.memory.id);

        if (target && target.hits < target.hitsMax)
        {
            let state = creep.repair(target);

            if (state === ERR_NOT_IN_RANGE)
            {
                creepBase.moveByMemory(creep, target.pos);
            }

            return true;
        }
        creep.memory.repairs = 0;
        creep.memory.id = null;
    }
    return false;
}

export function _getProfil(spawn: StructureSpawn): BodyPartConstant[]
{
    const totalCost = 3 * BODYPART_COST[WORK] + 2 * BODYPART_COST[CARRY] + 2 * BODYPART_COST[MOVE];
    var maxEnergy = spawn.room.energyCapacityAvailable;
    const numberOfSets = Math.min(3,Math.floor(maxEnergy / totalCost));
    if(numberOfSets == 0)
    {
        return [WORK,CARRY,CARRY,MOVE,MOVE];
    }
    return Array((numberOfSets*3)).fill(WORK).concat(Array((numberOfSets*2)).fill(CARRY).concat(Array((numberOfSets*2)).fill(MOVE)));
}

export function spawn(spawn: StructureSpawn, workroom: string): boolean
{
    var minRepairer = bot.room[workroom]!.repairer!
    if(minRepairer < 1)
        return false;

    if(spawn.room.name != workroom && !Memory.rooms[workroom]!.claimed)
        return false;

    var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom).length;
    if(count == undefined)
        count = 0;

    if ( minRepairer <= count)
        return false;

        let structuresToRepair = Game.rooms[workroom]!.find(FIND_STRUCTURES, {
            filter: (structure: any) => {
                return (structure.hits < _getMinHitRange(structure.structureType) * structure.hitsMax)
        }});

    if(structuresToRepair.length <= 1)
        return false;

    return creepBase.spawn(spawn, _getProfil(spawn), role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0})
}
