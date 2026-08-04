/**
 * Rolle "linkkeeper": leert den Link in der Basis und schiebt die Energie ins
 * Storage.
 *
 * Existiert, weil ein voller empfangender Link sonst nicht mehr abnehmen kann
 * und dadurch den Durchsatz aller sendenden Quell-Links blockiert – die
 * bleiben dann selbst voll und können keine neue Energie mehr aufnehmen.
 * Link und Storage stehen in der Basis so, dass genau ein Feld an beide
 * angrenzt; dort steht der Creep dauerhaft.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

/**
 * Rollenname. Steht im Creep-Memory des laufenden Spiels und darf sich
 * nicht ändern.
 */
const role = "linkkeeper";

// Straße, Container und Rampart tauchen hier bewusst nicht auf – sie blockieren
// den Standplatz nicht. OBSTACLE_OBJECT_TYPES ist die von Screeps gepflegte
// Liste blockierender Strukturtypen.
const blockingStructureTypes: string[] = OBSTACLE_OBJECT_TYPES;

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class LinkKeeper implements CreepRole {
    /** Bewegt den Creep auf seinen Standplatz zwischen Link und Storage und pendelt dort Energie um. */
    doJob(creep: Creep): void {

        if (creepBase.goToWorkroom(creep)) return;

        if (!creep.memory.post) {
            const storage = creep.room.storage;
            const link = storage
                ? Game.getObjectById<StructureLink>(bot.room[creep.memory.workroom]!.spawnLink!)
                : null;

            const post = link && storage ? this._findPost(link, storage, creep.memory.workroom) : null;

            if (!post) {
                creep.say('❓');
                return;
            }

            creep.memory.post = { x: post.x, y: post.y };
        }

        const post = new RoomPosition(creep.memory.post.x, creep.memory.post.y, creep.memory.workroom);

        // Vorbedingung für alles Weitere: der Creep steht wirklich auf dem Standplatz.
        // Bewusst nicht am Rückgabewert von moveByMemory festgemacht – der liefert im
        // default-Zweig ebenfalls false, ohne dass das Ziel erreicht ist.
        if (!creep.pos.isEqualTo(post)) {
            creepBase.moveByMemory(creep, post);
            return;
        }

        const storage = creep.room.storage;
        if (!storage) return;

        const link = Game.getObjectById<StructureLink>(bot.room[creep.memory.workroom]!.spawnLink!);
        if (!link) return;

        const carrying = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        const inLink = link.store.getUsedCapacity(RESOURCE_ENERGY);

        // Bewusst jeden Tick geprüft statt eine Schlafdauer zu raten: der
        // empfangende Link hat keinen eigenen Cooldown (der liegt beim
        // sendenden Link), es gibt also nichts, worauf man warten könnte – ein
        // Tick Verzögerung wäre hier nur verlorener Durchsatz.
        if (carrying === 0 && inLink === 0) return;

        // Ob Screeps transfer und withdraw im selben Tick beide auflöst, ist
        // offiziell nicht dokumentiert (nur eine unsichere Forenaussage).
        // Lösen beide aus, dauert der Umlauf einen Tick, sonst zwei – beides
        // ist korrekt, es gibt keinen Fehlerfall. Deshalb wird nicht geraten:
        // beide Aktionen werden angemeldet und später mit dem Profiler
        // gemessen. Ein ERR_FULL beim withdraw ist erwartbar.
        if (carrying > 0) creep.transfer(storage, RESOURCE_ENERGY);
        if (inLink > 0) creep.withdraw(link, RESOURCE_ENERGY);
    }

    /**
     * Sucht das einzige Feld, das an Link und Storage zugleich angrenzt.
     * Das Ergebnis landet im Creep-Memory und wird deshalb nur einmal je
     * Creep berechnet.
     */
    private _findPost(link: StructureLink, storage: StructureStorage, roomName: string): RoomPosition | null {
        const terrain = Game.rooms[roomName]!.getTerrain();

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const x = link.pos.x + dx;
                const y = link.pos.y + dy;
                if (x < 1 || x > 48 || y < 1 || y > 48) continue;

                const pos = new RoomPosition(x, y, roomName);
                if (!pos.isNearTo(storage.pos)) continue;
                if ((terrain.get(x, y) & TERRAIN_MASK_WALL) !== 0) continue;

                const blocked = pos.lookFor(LOOK_STRUCTURES).some(s => blockingStructureTypes.includes(s.structureType)) ||
                    pos.lookFor(LOOK_CONSTRUCTION_SITES).some(s => blockingStructureTypes.includes(s.structureType));
                if (blocked) continue;

                return pos;
            }
        }

        return null;
    }

    /** Spawnt den einzigen Linkkeeper für `workroom`, falls Links dort genutzt werden und noch keiner lebt. */
    spawn(spawn: StructureSpawn, workroom: string): boolean {
        if (!bot.room[workroom]!.sendLinkkeeper)
            return false;

        if (!bot.room[workroom]!.useLinks || !bot.room[workroom]!.spawnLink)
            return false;

        if (spawn.room.name != workroom)
            return false;

        if (!spawn.room.storage)
            return false;

        if (_.filter(Game.creeps, (creep: Creep) => creep.memory.role == role && creep.memory.workroom == workroom).length >= 1)
            return false;

        return creepBase.spawn(spawn, BODIES.linkkeeper.build(spawn.room.energyCapacityAvailable), role + '_' + Game.time, { role: role, workroom: workroom, home: spawn.room.name });
    }
}

export default new LinkKeeper();
