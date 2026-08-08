/**
 * Ortswechsel der Creeps auf gespeicherten Pfaden.
 *
 * Der Cache selbst steckt in `PathMemory` (`./path-memory.ts`); hier steht, wann
 * gesucht, wann der gespeicherte Weg genommen und wann er verworfen wird.
 *
 * Kostenhintergrund: `docs/knowledge/efficiency/cpu-pathfinding.md`. Eine
 * Pfadsuche ist das Teuerste, was ein Creep je Tick tun kann — deshalb wird der
 * Weg gespeichert und nur bei Zielwechsel, Stau oder einem Fehler am Pfad neu
 * gesucht.
 *
 * `range` an `moveByMemory` gibt an, wie nah am Ziel die Suche enden darf.
 * Vorgabe ist `0`, weil die meisten Ziele betretbare Felder sind — Container,
 * Straßen, Standplätze — und `roles/linkkeeper.ts` sowie `roles/miner.ts` die
 * Ankunft mit `creep.pos.isEqualTo(...)` prüfen.
 */

import { bot } from "../globals";
import { PathMemory } from "./path-memory";

/**
 * Ein Weg, wie er gebraucht wird: serialisiert zum Laufen und Speichern,
 * die Schritte nur, wenn sie ohnehin schon vorliegen.
 *
 * Der Unterschied ist CPU: nach einer Suche sind die Schritte da, ein
 * gespeicherter Weg müsste erst deserialisiert werden. Für das Laufen braucht es
 * sie nicht, nur für die Pfadvisualisierung.
 */
interface Route {
  serialized: string;
  steps?: PathStep[];
}

/** Sucht einen Weg und serialisiert ihn. */
function searchRoute(creep: Creep, target: RoomPosition, ignoreCreeps: boolean, range: number): Route {
  const steps = creep.pos.findPathTo(target, { ignoreCreeps: ignoreCreeps, range: range });
  return { serialized: Room.serializePath(steps), steps: steps };
}

/**
 * Zeichnet die noch offenen Schritte des Wegs, wenn `global.const.showPaths`
 * gesetzt ist. Nur Diagnose.
 */
function drawRemainingPath(creep: Creep, route: Route): void {
    const steps = route.steps ?? Room.deserializePath(route.serialized);
    const currentPos = creep.pos;

    const index = steps.findIndex(pos => pos.x === currentPos.x && pos.y === currentPos.y);
    if (index <= 0) {
        return;
    }

    const visual = new RoomVisual(creep.room.name);
    for (let i = index + 1; i < steps.length; i++) {
        visual.circle(steps[i]!.x, steps[i]!.y,
            { fill: 'transparent', radius: 0.25, stroke: 'red' });
    }
}

export function goToMyHome(creep: Creep): boolean {
    if (creep.memory.home && creep.room.name !== creep.memory.home)
    {
        var room = new RoomPosition(25, 25, creep.memory.home);
        return moveByMemory(creep, room);
    }
    return false;
}

export function goToRoomFlag(creep: Creep): boolean {
    if(creep.memory.workroom != creep.memory.home)
    {
        const flags = creep.room.find(FIND_FLAGS);
        if (flags.length > 0 && !creep.pos.inRangeTo(flags[0]!.pos, 2))
        {
            return moveByMemory(creep, flags[0]!.pos);
        }
    }
    return false;
}

export function goToWorkroom(creep: Creep): boolean {
    if(creep.memory.workroom && creep.memory.workroom != creep.room.name)
    {
        var room = new RoomPosition(25, 25, creep.memory.workroom);
        return moveByMemory(creep, room);
    }
    return false;
}

/**
 * Bewegt `creep` Richtung `target`, möglichst auf dem gespeicherten Weg.
 *
 * Rückgabewert: `true` bedeutet „für diesen Tick ist der Creep versorgt" — die
 * Rollen brechen daraufhin ihre Arbeit ab. `false` heißt, es gab keinen
 * Ortswechsel, der Creep kann etwas anderes tun.
 *
 * `range` schlüsselt nicht in den Cache: `PathMemory` merkt sich den Weg nur
 * zur Zielposition (`src/creep/path-memory.ts:78-87`), nicht zur Reichweite.
 * Läuft derselbe Creep dasselbe Ziel mit wechselnder Reichweite an,
 * überschreiben sich die gespeicherten Wege gegenseitig und lösen abwechselnd
 * Neusuchen aus.
 */
export function moveByMemory(creep: Creep, target: RoomPosition, range: number = 0): boolean {
    const cache = new PathMemory(creep.memory);

    if(creep.pos.isEqualTo(target))
    {
        cache.clear();
        return false;
    }

    // Festgefahren: einmal mit Rücksicht auf andere Creeps neu suchen. Bewusst
    // ohne neues `pathTarget` — der nächste Tick prüft den Cache wieder gegen
    // das alte Ziel.
    if(cache.isStuck)
    {
        const route = searchRoute(creep, target, false, range);
        cache.rememberPath(route.serialized);
        cache.resetStuck();

        creep.moveByPath(route.serialized);
        return true;
    }

    const known = cache.pathTo(target);
    let route: Route;
    if(known !== undefined)
    {
        route = { serialized: known };
    }
    else
    {
        route = searchRoute(creep, target, true, range);
        cache.rememberPathTo(route.serialized, target);
    }

    const state = creep.moveByPath(route.serialized);

    if (bot.const.showPaths)
    {
        drawRemainingPath(creep, route);
    }

    switch(state)
    {
        case OK:
        case ERR_TIRED:
        {
            cache.trackPosition(creep.pos);
            return true;
        }

        case ERR_INVALID_ARGS:
        case ERR_NO_BODYPART:
        case ERR_NOT_FOUND:
        {
            // Der gespeicherte Weg ist unbrauchbar geworden.
            cache.clear();
            return true; //damit er sein script für diesen Tick beendet
        }

        default:
        return false;
    }
}
