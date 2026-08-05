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

/**
 * Untergrenze im Storage, ab der ein RCL8-Upgrader arbeitet.
 *
 * Bewusst niedriger als die Spawnschwelle von 250 000 in `spawn()`: sonst
 * verstummte der Upgrader genau in dem Moment, in dem er anfängt, den
 * Überschuss abzubauen. Gespawnt wird bei klarem Überschuss, gearbeitet wird,
 * bis der Vorrat aufgebraucht ist.
 */
const RCL8_WORK_RESERVE = 100000;

/**
 * Restlaufzeit des Controllers, unterhalb derer der Vorrat keine Rolle mehr
 * spielt. Derselbe Wert, den auch das Spawn-Gate benutzt — läuft der Timer ab,
 * fällt der Raum eine Stufe zurück, und das wiegt schwerer als jeder Vorrat.
 */
const DOWNGRADE_ALARM = 100000;

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Upgrader implements CreepRole {
    /** Beschafft Energie und upgradet den Controller des Arbeitsraums, inklusive Sparmodus bei hohem Level. */
    doJob(creep: Creep): void {

        if(!this._mayWork(creep)) return;

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
     * Darf der Upgrader in diesem Tick überhaupt arbeiten?
     *
     * Zwei verschiedene Drosseln, und der Unterschied ist der Punkt von Plan 04:
     *
     * - **Bis RCL7** die alte Tickdrossel (`sparmodus`, gesetzt ab Stufe 6): der
     *   Creep arbeitet in einem von `level` Ticks. Grob, aber dort ist RCL-Fortschritt
     *   das Ziel und Energie knapp.
     * - **Ab RCL8** der Vorrat statt der Tickzahl. Der Controller nimmt dort nur
     *   noch 15 Energie je Tick an, und der Raum hat typischerweise Überschuss.
     *   Die Tickdrossel achtelte hier die Leistung unabhängig davon, ob Energie
     *   da ist — zusammen mit dem alten Rumpf kam der Raum auf 0,5 von 15
     *   erlaubten Energie je Tick, also 3 %. GCL wächst ausschließlich aus
     *   Controller-Upgrades und ist die Erlaubnis für den nächsten Raum.
     */
    private _mayWork(creep: Creep): boolean
    {
        const controller = creep.room.controller;

        // Kein Controller im aktuellen Raum: der Creep ist unterwegs, es gibt
        // nichts zu drosseln. Die Zeile ist kein Formalismus — die Vorgängerfassung
        // rechnete hier `Game.time % controller.level` auf `undefined`, sobald
        // `sparmodus` gesetzt war, und ein Upgrader auf dem Weg durch einen
        // Korridorraum brachte damit den ganzen Tick zum Absturz.
        if(!controller)
            return true;

        if(!controller.my || controller.level < 8)
        {
            return !creep.memory.sparmodus || Game.time % controller.level == 0;
        }

        // Der Downgrade-Timer schlägt den Vorrat: läuft er ab, verliert der Raum
        // eine Stufe. Dieselbe Grenze prüft `spawn()`, damit nicht der eine einen
        // Upgrader bestellt, den der andere verstummen lässt.
        if(controller.ticksToDowngrade < DOWNGRADE_ALARM)
            return true;

        // Positiv formuliert: fehlt der Wert, ist der Vergleich falsch. Eine
        // Negierung verhielte sich hier anders (siehe CLAUDE.md).
        const storage = creep.room.storage;
        return Boolean(storage && storage.store[RESOURCE_ENERGY] > RCL8_WORK_RESERVE);
    }

    /**
     * Ab RCL8 nimmt der Controller nur noch 15 Energie je Tick an; dort gilt das
     * Profil, das genau diese Rate ausschöpft (15 WORK).
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
