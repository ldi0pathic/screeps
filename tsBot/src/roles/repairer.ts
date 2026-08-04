/**
 * Rolle "repairer": repariert Gebäude im Arbeitsraum. Kümmert sich zuerst um
 * priorisierte Bauten (`prioBuildings`) und danach um alle beschädigten
 * Strukturen, sortiert nach Priorität und Baufortschritt.
 *
 * Ursprünglich aus `prod/creep.reparier.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`. (Dateiname hier bewusst
 * korrigiert auf `repairer.ts`; der Rollenschlüssel bleibt `repairer`).
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

const role = "repairer";

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Repairer implements CreepRole {
    /** Repariert priorisierte und beschädigte Strukturen im Arbeitsraum, sonst wird der Controller aufgewertet. */
    doJob(creep: Creep): void {
        creep.checkHarvest(function()
        {
            creep.memory.repairs +=1
        });

        if (creep.memory.harvest) {
            creepBase.harvest(creep);

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

        if(this._repairPrio(creep)) return;
        if(this._repair(creep)) return;

        creepBase.upgradeController(creep);
    }

    private _getPriority(structureType: any): number {
        return bot.prio.repair[structureType as StructureConstant] || 99;
    }

    private _getMinHitRange(structureType: any): number {
        return bot.prio.hits[structureType as StructureConstant] || 0.5;
    }

    private _repairPrio(creep: Creep): boolean {
        if(!creep.memory.prioId)
        {
            for(var id in bot.room[creep.memory.workroom]!.prioBuildings)
            {
                var buildingId: any = (bot.room[creep.memory.workroom]!.prioBuildings as any)[id];
                var building: any = Game.getObjectById(buildingId);

                // Fest verdrahtete IDs aus prioBuildings können verschwinden (Struktur
                // zerstört/abgerissen); ohne diesen Guard würde der Zugriff auf building.hits
                // eine Exception werfen und main.ts würde jeden Tick erneut abbrechen.
                if(!building) continue;

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

    private _repair(creep: Creep): boolean {
        if(!creep.memory.id)
        {
            let structuresToRepair = creep.room.find(FIND_STRUCTURES, {
                filter: (structure: any) => {
                    return (structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax)
            }});


            if(structuresToRepair.length > 0)
            {
                var structs = structuresToRepair.map((site: any) => ({
                    site,
                    damage: site.hitsMax - site.hits,
                    priority: this._getPriority(site.structureType)
                }))
                .sort((a: any, b: any) => {
                    if (a.priority === b.priority) {
                        return b.damage - a.damage;
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

    private _getProfil(spawn: StructureSpawn): BodyPartConstant[]
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

    /** Spawnt einen Repairer für `workroom`, falls Bedarf besteht und noch nicht genug unterwegs sind. */
    spawn(spawn: StructureSpawn, workroom: string): boolean
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

            // Ohne Sicht im Arbeitsraum ist Game.rooms[workroom] undefined; ohne
            // diesen Guard würde find() eine Exception werfen und den kompletten
            // Spawn-Durchlauf dieses Ticks abbrechen.
            const workroomVisible = Game.rooms[workroom];
            if(!workroomVisible)
                return false;

            let structuresToRepair = workroomVisible.find(FIND_STRUCTURES, {
                filter: (structure: any) => {
                    return (structure.hits < this._getMinHitRange(structure.structureType) * structure.hitsMax)
            }});

        if(structuresToRepair.length <= 1)
            return false;

        return creepBase.spawn(spawn, this._getProfil(spawn), role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0})
    }
}

export default new Repairer();
