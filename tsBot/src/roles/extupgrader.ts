/**
 * Rolle "extupgrader": Controller-Upgrader mit eigener Energiebeschaffung
 * (Controller-Link, Storage, Container, Quelle).
 *
 * Inhaltlich identisch zu `prod/creep.extupgrader.js`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

const role = "extupgrader";

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class ExtUpgrader implements CreepRole {
    /** Beschafft Energie aus Link/Storage/Container/Quelle und upgradet damit den Controller. */
    doJob(creep: Creep): void {

        if(creepBase.goToWorkroom(creep)) return;

        creep.checkHarvest();

        if (creep.memory.harvest)
        {
            if(creepBase.harvestControllerLink(creep,RESOURCE_ENERGY))return;
            if(creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY))return;
            if(creepBase.harvestRoomContainer(creep, RESOURCE_ENERGY))return;
            if(creepBase.harvestRoomEnergySource(creep)) return;
        }

        creepBase.upgradeController(creep);
    }

    /**
     * Ab RCL6 des Arbeitsraums reicht ein WORK je Satz. Ohne Sicht dort gilt das
     * größere Profil — dann ist der Ausbaustand unbekannt.
     */
    private bodyFor(spawn: StructureSpawn, workroom: string): BodyPartConstant[]
    {
        const rcl6 = Game.rooms[workroom] && Game.rooms[workroom]!.controller!.level >= 6;
        const profil = rcl6 ? BODIES.extupgraderRcl6 : BODIES.extupgrader;
        return profil.build(spawn.room.energyCapacityAvailable);
    }

    /** Spawnt einen Extupgrader für `workroom`, falls Bedarf besteht und noch nicht genug unterwegs sind. */
    spawn(spawn: StructureSpawn, workroom: string): boolean
    {
        if(spawn.room.name == workroom)
            return false;

        var uppis = bot.room[workroom]!.upgrader
        if(!uppis || uppis < 1)
            return false;


        var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                    creep.memory.workroom == workroom &&
                                                    (creep.ticksToLive! > 300 || creep.spawning)
                                                    ).length;

        if ( uppis <= count)
            return false;

        var profil = this.bodyFor(spawn, workroom);

        return creepBase.spawn(spawn, profil, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0});
    }
}

export default new ExtUpgrader();
