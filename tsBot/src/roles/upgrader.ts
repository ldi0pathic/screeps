/**
 * Rolle "upgrader": Controller-Upgrader mit eigener Energiebeschaffung
 * (Controller-Link, Storage, Container, Drops, Tombstones, Ruins, Quelle)
 * und einer Vorratsdrossel ("Sparmodus"), die erst bei voller Ausbaustufe
 * (RCL 8) greift — siehe `_mayWork` für die Begründung.
 *
 * Ursprünglich aus `prod/creep.upgrader.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import { LinkList } from "../controller/link-list";
import { storageIsFull } from "../controller/storage-pressure";
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
    /** Beschafft Energie und upgradet den Controller des Arbeitsraums; unter RCL 8 ungedrosselt, ab RCL 8 nur mit Vorrat (siehe `_mayWork`). */
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

        creepBase.upgradeController(creep);
    }

    /**
     * Darf der Upgrader in diesem Tick überhaupt arbeiten?
     *
     * Unter voller Ausbaustufe (RCL < 8) wird nicht mehr gedrosselt: dort ist
     * RCL-Fortschritt das Ziel, und die frühere Tickdrossel (ein Sechstel bis
     * ein Siebtel der Ticks) kostete echten Fortschritt (Plan 04, Punkt 3,
     * `docs/plans/04-rcl8-upgrader-und-gcl.md`). Ein Creep, der aus der Zeit vor
     * dieser Änderung noch `sparmodus: true` im Memory trägt, arbeitet ab dem
     * nächsten Tick ungedrosselt weiter — das Flag wird nirgends mehr gelesen
     * und absichtlich nicht aus dem Memory gelöscht, damit kein Migrationsschritt
     * nötig ist.
     *
     * Erst ab RCL8 drosselt der Vorrat statt der Tickzahl: der Controller nimmt
     * dort nur noch 15 Energie je Tick an, GCL wächst ausschließlich aus
     * Controller-Upgrades, und der Raum hat typischerweise Überschuss. Unterhalb
     * von RCL8 gibt es bewusst keine Vorratsschwelle — der Upgrader zieht dort
     * zuerst am Storage, `RCL8_WORK_RESERVE` schützt nur Stufe 8. Das ist keine
     * Lücke, sondern die gewollte Kehrseite der weggefallenen Tickdrossel.
     */
    private _mayWork(creep: Creep): boolean
    {
        const controller = creep.room.controller;

        // Kein Controller im aktuellen Raum (Creep unterwegs) oder Raum unter
        // voller Ausbaustufe: in beiden Fällen wird nicht gedrosselt. Die
        // `!controller`-Prüfung ist dabei kein Formalismus — die Vorgängerfassung
        // rechnete hier `Game.time % controller.level` auf `undefined`, sobald
        // `sparmodus` gesetzt war, und ein Upgrader auf dem Weg durch einen
        // Korridorraum brachte damit den ganzen Tick zum Absturz.
        if(!controller || !controller.my || controller.level < 8)
            return true;

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

    /**
     * Spawnt einen Upgrader für `workroom`, falls die konfigurierte Anzahl noch
     * nicht erreicht ist.
     *
     * Ausnahme: läuft der Storage über (`storageIsFull`), steht **mindestens
     * einer** da — auch bei `upgrader: 0` in der Config und auch dann, wenn das
     * RCL8-Gate ihn sonst verhinderte. Der Fall ist nicht theoretisch: bei 95
     * Prozent Belegung mit viel Mineral und 150 000 Energie greift das Gate
     * `storage < 250000` heute genau dann, wenn man den Upgrader braucht.
     *
     * Bewusst `Math.max(1, …)` und keine höhere Zahl: ab RCL8 nimmt der
     * Controller nur noch `CONTROLLER_MAX_UPGRADE_PER_TICK` (15) Energie je Tick
     * an — für den ganzen Raum. `BODIES.upgraderRcl8` schöpft das mit 15 WORK
     * allein aus, ein zweiter Upgrader brächte dort nichts.
     */
    spawn(spawn: StructureSpawn, workroom: string): boolean
    {
        const forced = storageIsFull(workroom);

        var uppis = bot.room[workroom]!.upgrader

        if(!forced && (!uppis || uppis < 1))
            return false;

        if(spawn.room.name != workroom)
            return false;

        if(!forced && spawn.room.controller!.level > 7 && spawn.room.controller!.ticksToDowngrade > 100000 && spawn.room.storage && spawn.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 250000)
            return false;

        var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                    creep.memory.workroom == workroom &&
                                                    (creep.ticksToLive! > 160 || creep.spawning)
                                                    ).length;

        const target = forced ? Math.max(1, uppis ?? 0) : uppis!;

        if ( target <= count)
            return false;

        var profil = this.bodyFor(spawn, workroom);

        return creepBase.spawn(spawn, profil, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0, noLink: false});
    }
}

export default new Upgrader();
