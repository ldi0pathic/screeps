/**
 * Ablieferziele der Transport-Creeps: Spawn und Extensions, Türme, Storage,
 * Terminal, Labs und Container.
 *
 * Die Auswertung einer Ablieferung steckt in `transferTo` (`./target.ts`), die
 * Containerliste in `ContainerList` (`./containers.ts`) — beides teilt sich diese
 * Datei mit der Beschaffungsseite in `base.ts`.
 *
 * Die Filter-Callbacks der `find`-Aufrufe bleiben untypisiert (`any`), weil sie
 * strukturübergreifend auf `store` zugreifen.
 *
 * **Eigenart, die hier absichtlich unverändert bleibt:** mehrere Aufrufe
 * übergeben `getFreeCapacity` ein Array (`[RESOURCE_ENERGY]`) statt der
 * Ressourcenkonstante. Das wirkt nur, weil der Wert bei der Schlüsselsuche zu
 * `"energy"` wird; dokumentiert ist es nicht. Es zu begradigen könnte ändern,
 * welche Ziele gefunden werden, und gehört deshalb in eine Runde mit Messung —
 * siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import { ContainerList } from "./containers";
import { moveByMemory } from "./goto";
import { RememberedTarget, deliverTo, transferTo } from "./target";

/**
 * Nächstes eigenes Bauwerk eines der Typen, das `accepts` erfüllt und **nicht**
 * die Quelle der aktuellen Ladung ist.
 *
 * Terminal und Türme benutzen das bewusst nicht: der Terminal wird über eine
 * gemerkte Id gefunden, die Türme werden nach Lücke sortiert, und beide kennen
 * die `fromId`-Regel nicht.
 *
 * Ein gemerktes Ziel spart die Suche — aber nur, solange es die Ladung noch
 * annimmt. Anders als auf der Beschaffungsseite wird hier **im selben Tick**
 * ersatzweise gesucht: gäbe die Funktion stattdessen `null` zurück, liefe die
 * Kaskade der Rolle weiter und der Creep kippte seine Ladung ins Storage,
 * statt die nächste Extension zu füllen.
 */
function findDeliveryTarget(
    creep: Creep,
    remembered: RememberedTarget,
    types: string[],
    accepts: (structure: any) => boolean,
): AnyStructure | null {
    if (remembered.isRemembered) {
        const known: any = remembered.resolve();
        if (known && accepts(known) && known.id != creep.memory.fromId) {
            return known;
        }
        remembered.forget();
    }

    const found = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: (structure: any) =>
            types.includes(structure.structureType) &&
            accepts(structure) &&
            structure.id != creep.memory.fromId,
    });

    if (found) {
        remembered.remember(found);
    }
    return found;
}

export function TransportToHomeContainer(creep: Creep, type: string, mul?: number): boolean {
    if (!mul) mul = 0.5;

    const remembered = new RememberedTarget(creep.memory, "useContainer");
    const containers = new ContainerList(creep.room.name);
    // Es soll sich lohnen: der Container muss einen guten Teil der Ladung aufnehmen.
    const minFree = creep.store.getUsedCapacity() * mul;
    const mineralContainerId = bot.room[creep.room.name]!.mineralContainerId;

    let container: any = null;
    if (remembered.isRemembered) {
        container = remembered.resolve();
    }
    else if (containers.hasList) {
        // Auch eine leere Liste gilt hier als „keine Container da" — anders als
        // auf der Beschaffungsseite, die dann neu erhebt.
        container = containers.nearest(creep, (candidate: any) =>
            candidate.store.getFreeCapacity(type) > minFree &&
            candidate.id != mineralContainerId &&
            candidate.id != creep.memory.fromId);

        if (container) {
            remembered.remember(container);
        }
    }
    else if (containers.isRoomKnown) {
        // Erst die Liste erheben; abgeliefert wird im nächsten Tick.
        return containers.discover(creep.room);
    }

    if (container && container.store.getFreeCapacity() > 0) {
        // Hier bewusst nicht `transferTo`: die gemerkte Wahl wird **nur** nach
        // erfolgter Ablieferung vergessen, nicht schon auf dem Hinweg.
        switch (creep.transfer(container, type as ResourceConstant))
        {
            case ERR_NOT_IN_RANGE:
                moveByMemory(creep, container.pos);
                return true;

            case OK:
                remembered.forget();
                return true;

            default:
                return false;
        }
    }

    remembered.forget();
    return false;
}

export function TransportToHomeTerminal(creep: Creep): boolean {
    if(!creep.room.controller!.my || creep.room.controller!.level < 6)
        return false;

    const roomMemory = Memory.rooms[creep.memory.workroom]!;
    var terminal: any;

    if(roomMemory.terminalId)
    {
        terminal = Game.getObjectById(roomMemory.terminalId);
        if(!terminal)
        {
            // Gemerkte Id ohne Objekt: verwerfen und im nächsten Tick neu suchen.
            delete roomMemory.terminalId;
            return false;
        }
    }
    else
    {
        var target = creep.room.find(FIND_MY_STRUCTURES,
            {
                filter: (structure: any) => {
                    return (
                        structure.structureType === STRUCTURE_TERMINAL
                    ) && structure.store.getFreeCapacity() > 0 ;
                }
            });

        if(target.length > 0)
        {
            roomMemory.terminalId = target[0]!.id;
            terminal = target[0];
        }
    }

    // Positive Bedingung: eine Negierung verhielte sich anders, sobald der Wert
    // fehlt (siehe die Notiz zu Schwellenvergleichen in CLAUDE.md).
    if(terminal && terminal.store.getFreeCapacity() > 0)
    {
        var delivered = false;
        for (var resourceType in creep.store)
        {
            //verhindern, das zuviel Energie eingelagert wird :/
            if(resourceType == RESOURCE_ENERGY &&
                terminal.store[RESOURCE_ENERGY] > 100000)
                continue;

            if(transferTo(creep, terminal, resourceType))
            {
                delivered = true;
            }
        }
        return delivered;
    }

    return false;
}

export function TransportToHomeLab(creep: Creep, type: string): boolean {
    const remembered = new RememberedTarget(creep.memory, "useLab");
    const target = findDeliveryTarget(creep, remembered, [STRUCTURE_LAB], (structure: any) =>
        structure.store.getFreeCapacity([type]) > 0);

    return deliverTo(creep, target, remembered, type);
}

export function TransportEnergyToHomeSpawn(creep: Creep): boolean {
    if(creep.memory.home != creep.room.name ||
       creep.store[RESOURCE_ENERGY] == 0)
        return false;

    const remembered = new RememberedTarget(creep.memory, "useSupply");
    const target = findDeliveryTarget(creep, remembered, [STRUCTURE_SPAWN, STRUCTURE_EXTENSION],
        (structure: any) => structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 0);

    return deliverTo(creep, target, remembered, RESOURCE_ENERGY);
}

export function TransportEnergyToHomeTower(creep: Creep): boolean {
    if(creep.store[RESOURCE_ENERGY] == 0)
        return false;

    var towers = creep.room.find(FIND_MY_STRUCTURES,
        {
            filter: (structure: any) => {
                return (
                    structure.structureType === STRUCTURE_TOWER
                ) && structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 100;
            }
        });

    if (towers.length === 0)
    {
        return false;
    }

    // Der Turm mit der größten Lücke zuerst: er ist am ehesten schussunfähig.
    towers.sort((a: any, b: any) => b.store.getFreeCapacity(RESOURCE_ENERGY) - a.store.getFreeCapacity(RESOURCE_ENERGY));
    return transferTo(creep, towers[0]!, RESOURCE_ENERGY);
}

export function TransportToHomeStorage(creep: Creep): boolean {
    var target = creep.room.storage;

    if(!target)
        return false;

    // Nicht dorthin abliefern, wo die Ladung gerade geholt wurde - das wäre ein
    // Leerlauf. Die frühere Ausnahme für `spawnLink` ist entfallen: sie sollte
    // Energie aus dem Spawn-Link ins Storage lassen, diesen Weg gibt es seit
    // dem Entfernen von `harvestSpawnLink` nicht mehr. Den Link leert jetzt die
    // Rolle `linkkeeper` direkt.
    if(creep.memory.fromId == target.id)
        return false;

    for (var resourceType in creep.store) {
        transferTo(creep, target, resourceType);
    }
    return true;
}
