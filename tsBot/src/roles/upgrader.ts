/**
 * Rolle "upgrader": Controller-Upgrader mit eigener Energiebeschaffung
 * (Controller-Link, Storage, Container, Drops, Tombstones, Ruins, Quelle)
 * und "Sparmodus" bei hohem Controller-Level.
 *
 * Ursprünglich aus `prod/creep.upgrader.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import { LinkList } from "../controller/link-list";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

/**
 * Rollenname. Steht im Creep-Memory des laufenden Spiels und darf sich
 * nicht ändern.
 */
const role = "upgrader";

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Upgrader implements CreepRole {
    /** Beschafft Energie und upgradet den Controller des Arbeitsraums, inklusive Sparmodus bei hohem Level. */
    doJob(creep: Creep): void {

        if(creep.memory.sparmodus && Game.time % creep.room.controller!.level != 0) return;

        creep.checkHarvest();

        if (creep.memory.harvest)
        {
            if(!creep.memory.noLink && new LinkList(creep.memory.workroom).controllerLink && (creep.room.controller!.my && creep.room.controller!.level >= 5) )
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

    /**
     * Ab RCL8 nimmt der Controller nur noch 15 Energie je Tick an; dort gilt das
     * sparsame Profil mit einem halben WORK je Satz.
     */
    private bodyFor(spawn: StructureSpawn, workroom: string): BodyPartConstant[]
    {
        const profil = Game.rooms[workroom]!.controller!.level > 7 ? BODIES.upgraderRcl8 : BODIES.upgrader;
        return profil.build(spawn.room.energyCapacityAvailable);
    }

    /** Spawnt einen Upgrader für `workroom`, falls die konfigurierte Anzahl noch nicht erreicht ist. */
    spawn(spawn: StructureSpawn, workroom: string): boolean
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

        var profil = this.bodyFor(spawn, workroom);

        return creepBase.spawn(spawn, profil, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0, noLink: false});
    }
}

export default new Upgrader();
