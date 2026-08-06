/**
 * Rolle "hauler": der kurze Weg im Heimatraum, Quellcontainer → Storage.
 *
 * Übernimmt den containergebundenen Debitor für den Fall `home == workroom`
 * (Plan 09/10, `docs/plans/10-logistikrollen.md`, Runde 3). Der Grund für die
 * Aufteilung ist CPU: `Debitor.doJob` bedient vier Jobs in einer
 * `if`-Kaskade, und jeder Creep wertet dabei auch die Bedingungen der Jobs
 * mit aus, die er gar nicht hat. Der Hauler tut deshalb wenig und immer
 * dasselbe — kein `goToWorkroom`, kein `goToMyHome`, keine Distanzmessung,
 * kein Tombstone-/Drop-/Ruinen-Scan, kein Mineralienverkauf, kein Terminal,
 * kein Lab. Der `debitor` bleibt der Remote-Hauler und der Allrounder für
 * Räume ohne Storage.
 *
 * Rollenname `role` steht künftig im Creep-Memory des laufenden Spiels und
 * darf sich danach nicht mehr ändern.
 */

import { bot } from "../globals";
import { energySources } from "../controller/room-inventory";
import { linksDeliver } from "../controller/link-list";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

const role = "hauler";

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Hauler implements CreepRole {
    /** Holt Energie aus dem Quellcontainer und bringt sie ins Storage des Heimatraums. */
    doJob(creep: Creep): void {
        creep.checkHarvest();

        if (creep.memory.harvest) {
            if (creepBase.harvestMyContainer(creep, RESOURCE_ENERGY)) return;
            return;
        }

        // Notventil: hängt der Raum am Prioritätsspawn, geht die Ladung direkt an
        // Spawn und Extensions statt den Umweg über das Storage. Sonst füllt sie
        // der `filler` — und wenn gerade keiner lebt, käme der Raum nicht hoch.
        if (creepBase.checkWorkroomPrioSpawn(creep)) return;

        // TransportToHomeStorage liefert nichts zurück, wenn `memory.fromId` auf
        // dem Storage steht — beim Hauler steht dort immer der Container, aus
        // dem er gerade geholt hat, der Weg ist also frei.
        if (creepBase.TransportToHomeStorage(creep)) return;
    }

    /** Spawnt einen Hauler für einen Quellcontainer des eigenen Raums, falls Bedarf besteht. */
    spawn(spawn: StructureSpawn, workroom: string): boolean {
        // Nur der eigene Raum: der Hauler kennt kein `goToWorkroom`, er würde in
        // einem fremden Raum nie ankommen.
        if (spawn.room.name != workroom)
            return false;

        // Ohne Miner gibt es keinen gefüllten Quellcontainer zum Abholen.
        if (!bot.room[workroom]!.sendDebitor || !bot.room[workroom]!.sendMiner)
            return false;

        // Ohne Storage gibt es kein Ziel; dann ist der `debitor` als Allrounder
        // zuständig. Bewusst am Bauwerk festgemacht, nicht am RCL.
        if (!spawn.room.storage)
            return false;

        for (const sourceId of energySources(workroom)) {
            const source = Game.getObjectById(sourceId);
            if (!source)
                continue;

            if (this._spawn(spawn, workroom, source))
                return true;
        }

        return false;
    }

    private _spawn(spawn: StructureSpawn, workroom: string, source: any): boolean {
        const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        if (container.length == 0)
            return false;

        const containerId = container[0].id;

        const count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
            creep.memory.workroom == workroom &&
            creep.memory.container == containerId &&
            (creep.ticksToLive! > 100 || creep.spawning)
        ).length;

        if (1 <= count)
            return false;

        const link = container[0].pos.findInRange(FIND_STRUCTURES, 1, {
            filter: { structureType: STRUCTURE_LINK }
        });

        if (link.length > 0) {
            Memory.rooms[workroom]!.hasLinks = true;

            // Zwischen „Raum darf Links bauen" und „am Storage steht ein
            // Empfänger, der sie annimmt" liegen mehrere Tage Bauzeit; erst wenn
            // das Linknetz wirklich abliefert, übernimmt es diese Quelle.
            if (linksDeliver(workroom))
                return false;
        }

        // Kein Notfallspawn: anders als der Filler füttert der Hauler nicht den
        // Spawn selbst, und die Notfallkette für die Förderung hängt am Miner
        // (`aktivPrioSpawn`) — nicht am Hauler.
        return creepBase.spawn(spawn, BODIES.debitor.build(spawn.room.energyCapacityAvailable), role + '_' + Game.time, {
            role: role,
            harvest: true,
            workroom: workroom,
            home: spawn.room.name,
            mineral: RESOURCE_ENERGY,
            container: containerId,
            notfall: false
        });
    }
}

export default new Hauler();
