/**
 * Rolle "builder": baut Baustellen ab Priorität und wechselt bei Bedarf ins
 * Sammeln von Energie bzw. Upgraden des Controllers.
 *
 * Ursprünglich aus `prod/creep.builder.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";
import * as creepBaseGoto from "../creep/goto";


const role = "builder";

export function doJob(creep: Creep) {
    creep.checkHarvest();
    if(creepBase.goToWorkroom(creep)) return;
    if (creep.memory.harvest) {
        creep.memory.repId = null;
        creepBase.harvest(creep);

        if(creep.store.getUsedCapacity() > creep.store.getFreeCapacity())
        {
            creep.memory.harvest = false;
        }

        // Fix ggü. prod/creep.builder.js: dort creep.memory.mineral, das bei Buildern nie gesetzt wird
        // (creepBase.spawn setzt nur role/workroom/home) - korrekt ist RESOURCE_ENERGY.
        if(creepBase.harvestSpawnLink(creep,RESOURCE_ENERGY))return;

        return;
    }

    if(creep.checkInvasion()) return;
    if(creepBase.goToWorkroom(creep)) return;
    if(creepBase.checkWorkroomPrioSpawn(creep)) return;

    if(_build(creep)) return;

    creepBase.upgradeController(creep);
}

export function _getPriority(structureType: BuildableStructureConstant): number {
    return bot.prio.build[structureType] || 99;
}

export function _build(creep: Creep): boolean {
    if(!creep.memory.id)
    {
        let structuresToBuild = creep.room.find(FIND_CONSTRUCTION_SITES);

        if(structuresToBuild.length > 0)
        {
            var structs = structuresToBuild.map(site => ({
                site,
                progress: site.progress,
                priority: _getPriority(site.structureType)
            }))
            .sort((a, b) => {
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
        if (target && target.progressTotal != undefined)
        {
            let state = creep.build(target);

            if (state === ERR_NOT_IN_RANGE)
            {
                creepBaseGoto.moveByMemory(creep, target.pos)
            }

            return true;
        }
        else
        {
            creep.memory.id = null;
        }
    }

    return false;
}

export function _getProfil(spawn: StructureSpawn): BodyPartConstant[]
{
    const totalCost =  3* BODYPART_COST[WORK] + 2* BODYPART_COST[CARRY] + 2*BODYPART_COST[MOVE];
    var maxEnergy = spawn.room.energyCapacityAvailable;
    var numberOfSets = Math.min(7,Math.floor(maxEnergy / totalCost));

    if(numberOfSets == 0)
    {
        // Minimalprofil für 300 Energie (RCL1): [WORK,CARRY,CARRY,MOVE,MOVE] = 100+50+50+50+50 = 300.
        // Vorher kam hier ein leeres Body-Array heraus, mit dem spawnCreep grundsätzlich fehlschlägt.
        return [WORK,CARRY,CARRY,MOVE,MOVE];
    }

    return Array((numberOfSets*3)).fill(WORK).concat(Array((numberOfSets*2)).fill(CARRY).concat(Array((numberOfSets*2)).fill(MOVE)));
}

export function spawn(spawn: StructureSpawn, workroom: string): boolean
{
    var maxbuilder = bot.room[workroom]!.maxbuilder!
    if(!bot.room[workroom]!.sendBuilder || maxbuilder < 1)
        return false;

    if(spawn.room.name != workroom && !Memory.rooms[workroom]!.claimed && !bot.room[workroom]!.claim)
        return false;

    var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom ).length;
    if(count == undefined)
        count = 0;

    if ( maxbuilder <= count)
        return false;


    var room = Game.rooms[workroom];
    var sites = 0;
    if(room)
        sites = room.find(FIND_CONSTRUCTION_SITES).length;

    if(sites == 0 || Math.max(sites / 5, 1) <= count)
        return false;


    return creepBase.spawn(spawn, _getProfil(spawn), role + '_' + Game.time, { role: role, workroom: workroom, home: spawn.room.name});
}
