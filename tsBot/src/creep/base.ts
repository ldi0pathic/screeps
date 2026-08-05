/**
 * Wiederverwendbare Creep-Aktionen: Energiebeschaffung, Bewegung, Transport,
 * Controller-Upgrade und Spawnen.
 *
 * Ursprünglich aus `prod/creep.base.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`. Die Wrapper am Ende
 * delegieren wie im Original an `creep/goto` und `creep/transport`.
 */

import { LinkList } from "../controller/link-list";
import { bot } from "../globals";
import { ContainerList } from "./containers";
import * as creepBaseGoTo from "./goto";
import { RememberedTarget, collectFrom, withdrawFrom } from "./target";
import * as creepBaseTransport from "./transport";

export function harvest(creep: Creep): void {
    if (!creep.memory.harvest)
        return;

    if (harvestRoomRuins(creep, RESOURCE_ENERGY))
        return;

    if (harvestRoomStorage(creep, RESOURCE_ENERGY))
        return;

    if (harvestRoomDrops(creep, RESOURCE_ENERGY))
        return;

    if (harvestRoomTombstones(creep, RESOURCE_ENERGY))
        return;

    if (harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25))
        return;

    if (harvestRoomEnergySource(creep))
        return;

    //this.goToMyHome(creep);
}

/**
 * Liefert das gemerkte Ziel, oder sucht eines — aber nie beides: ist ein Ziel
 * gemerkt, das es nicht mehr gibt, wird in diesem Tick nicht ersatzweise gesucht.
 * Das begrenzt die Suchen je Tick und entspricht dem bisherigen Verhalten.
 */
function rememberedOrSearched<T>(remembered: RememberedTarget, search: () => T | null): T | null {
    return remembered.isRemembered ? remembered.resolve<T>() : search();
}

export function harvestRoomDrops(creep: Creep, type: string): boolean {
    const remembered = new RememberedTarget(creep.memory, "useRoomDrop");
    const drop: any = rememberedOrSearched(remembered, () =>
        creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) => d.amount > 100 }));

    if (!drop) {
        remembered.forget();
        return false;
    }

    return collectFrom(creep, drop, remembered, creep.pickup(drop));
}

export function harvestRoomTombstones(creep: Creep, type: string): boolean {
    const remembered = new RememberedTarget(creep.memory, "useTombstone");
    const tombstone: any = rememberedOrSearched(remembered, () =>
        creep.pos.findClosestByPath(FIND_TOMBSTONES,
            { filter: (d) => d.store.getUsedCapacity(type as ResourceConstant)! > 100 }));

    if (!tombstone) {
        remembered.forget();
        return false;
    }

    return collectFrom(creep, tombstone, remembered, creep.withdraw(tombstone, type as ResourceConstant));
}

export function harvestCompleteRoomTombstones(creep: Creep): boolean {
    const remembered = new RememberedTarget(creep.memory, "useTombstone");
    const tombstone: any = rememberedOrSearched(remembered, () =>
        creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity() > 100 }));

    if (!tombstone) {
        remembered.forget();
        return false;
    }

    // Nur die erste Ressource: abgeholt wird einmal je Tick, der Rest im nächsten.
    const resourceType = Object.keys(tombstone.store)[0];
    if (resourceType === undefined) {
        remembered.forget();
        return false;
    }

    return collectFrom(creep, tombstone, remembered,
        creep.withdraw(tombstone, resourceType as ResourceConstant));
}

export function harvestRoomRuins(creep: Creep, type: string): boolean {
    const remembered = new RememberedTarget(creep.memory, "useRuin");
    const ruin: any = rememberedOrSearched(remembered, () =>
        creep.pos.findClosestByPath(FIND_RUINS,
            { filter: (d) => d.store.getUsedCapacity(type as ResourceConstant)! > 50 }));

    if (!ruin) {
        remembered.forget();
        return false;
    }

    return collectFrom(creep, ruin, remembered, creep.withdraw(ruin, type as ResourceConstant));
}

export function harvestRoomStorage(creep: Creep, type: string): boolean {
    const storage = creep.room.storage;
    // Energie erst holen, wenn es für eine halbe Ladung reicht; bei Mineralien
    // lohnt schon wenig.
    const min = type === "energy" ? (creep.store.getCapacity() * 0.5) : 50;

    // Bewusst als positive Bedingung: fehlt die Ressource im Storage, ist der
    // Wert `undefined` — und `undefined > min` ist falsch, `undefined <= min`
    // aber auch. Eine Negierung würde hier also das Verhalten kippen.
    if (storage && storage.store[type as ResourceConstant] > min) {
        return withdrawFrom(creep, storage, type);
    }

    return false;
}

export function harvestRoomContainer(creep: Creep, type: string, mul?: number): boolean {
    if (!mul) mul = 0.5;

    const remembered = new RememberedTarget(creep.memory, "useContainer");
    const containers = new ContainerList(creep.room.name);
    // Es soll sich lohnen: der Container muss einen guten Teil der Ladung füllen.
    const minAmount = creep.store.getFreeCapacity() * mul;

    let container: any = null;
    if (remembered.isRemembered) {
        container = remembered.resolve();
    }
    else if (containers.hasEntries) {
        // Eine Id ohne Objekt verwirft hier die ganze Liste — sie wird dann neu
        // erhoben. Die Ablieferseite in `transport.ts` tut das nicht.
        container = containers.nearest(creep,
            (candidate: any) => candidate.store.getUsedCapacity(type) > minAmount,
            { forgetListOnStaleId: true });

        if (container) {
            remembered.remember(container);
        }
    }
    else if (containers.isRoomKnown) {
        // Erst die Liste erheben; geholt wird im nächsten Tick.
        return containers.discover(creep.room);
    }

    if (container && container.store.getUsedCapacity(type) > minAmount) {
        if (withdrawFrom(creep, container, type)) {
            return true;
        }
    }

    // Nichts geholt: die Wahl war schlecht, im nächsten Tick neu suchen.
    remembered.forget();
    return false;
}

export function harvestControllerLink(creep: Creep, type: string): boolean {
    if (creep.memory.workroom != creep.room.name ||
        !creep.room.controller!.my ||
         creep.room.controller!.level <5)
        return false;

    // Welcher Link am Controller steht, weiß `ContainerList`s Gegenstück für
    // Links — aus der Lage erhoben, nicht mehr aus der Config.
    var link: any = new LinkList(creep.memory.workroom).controllerLink;

    if (link && link.store[type] > 100) {
        return withdrawFrom(creep, link, type);
    }

    // Kein Link oder leer: der Creep hört auf, es über den Link zu versuchen.
    creep.memory.noLink = true;
    return false;
}

export function harvestMyContainer(creep: Creep, type: string): boolean {
    if (creep.memory.workroom != creep.room.name || creep.memory.container == '')
        return false;

    var container: any = Game.getObjectById(creep.memory.container);

    if (!container || container.store[type] < 100) {
        return false;
    }

    return withdrawFrom(creep, container, type);
}

export function harvestNotfall(creep: Creep): boolean {

    var notfall = creep.room.find(FIND_STRUCTURES,  {filter: (structure: any) =>
    {
        return  (structure.structureType === STRUCTURE_LINK ||
        structure.structureType === STRUCTURE_LAB ||
        structure.structureType === STRUCTURE_NUKER ||
        structure.structureType == STRUCTURE_TOWER)
        && structure.store[RESOURCE_ENERGY] > 0
    }});

    if(notfall.length === 0)
    {
        return false;
    }

    // Der vollste Speicher zuerst: im Notfall zählt, schnell viel zu bekommen.
    notfall.sort(function (a: any, b: any)
    {
        return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
    });

    return withdrawFrom(creep, notfall[0]!, RESOURCE_ENERGY);
}

export function harvestRoomEnergySource(creep: Creep): boolean {
    if (!canHarvestEnergy(creep)) {
        return false;
    }

    const remembered = new RememberedTarget(creep.memory, "useRoomSource");
    const source: any = rememberedOrSearched(remembered, () =>
        creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE));

    // Positive Bedingung wie beim Storage: eine Negierung verhielte sich anders,
    // sobald `energy` fehlt.
    if (source && source.energy > 100) {
        // Bewusst `moveTo` statt des gespeicherten Pfads: die Quelle ist oft vom
        // Miner besetzt, und `moveTo` meldet das als ERR_NO_PATH.
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(source) == ERR_NO_PATH) {
                remembered.forget();
                return false;
            }
        }

        remembered.remember(source);
        creep.memory.fromId = source.id;
        return true;
    }

    remembered.forget();
    return false;
}

export function canHarvestEnergy(creep: Creep): boolean {
    return creep.getActiveBodyparts(WORK) > 0;
}

export function calcProfil(creepProfile: BodyPartConstant[]): number {
    let energyCost = 0;
    for (const bodyPart of creepProfile) {
        energyCost += BODYPART_COST[bodyPart]!;
    }
    return energyCost;
}

export function goToMyHome(creep: Creep) { return creepBaseGoTo.goToMyHome(creep) }
export function goToRoomFlag(creep: Creep) { return creepBaseGoTo.goToRoomFlag(creep) }
export function goToWorkroom(creep: Creep) { return creepBaseGoTo.goToWorkroom(creep) }
export function moveByMemory(creep: Creep, target: RoomPosition) { return creepBaseGoTo.moveByMemory(creep, target) }

export function TransportEnergyToHomeSpawn(creep: Creep) { return creepBaseTransport.TransportEnergyToHomeSpawn(creep); }
export function TransportEnergyToHomeTower(creep: Creep) { return creepBaseTransport.TransportEnergyToHomeTower(creep); }
export function TransportToHomeTerminal(creep: Creep) { return creepBaseTransport.TransportToHomeTerminal(creep); }
export function TransportToHomeStorage(creep: Creep) { return creepBaseTransport.TransportToHomeStorage(creep); }
export function TransportToHomeContainer(creep: Creep, type: string, mul?: number) { return creepBaseTransport.TransportToHomeContainer(creep, type, mul); }
export function TransportToHomeLab(creep: Creep, type: string) { return creepBaseTransport.TransportToHomeLab(creep, type); }

export function checkWorkroomPrioSpawn(creep: Creep): boolean {
    if (Memory.rooms[creep.memory.workroom]!.aktivPrioSpawn) {
        if (TransportEnergyToHomeSpawn(creep)) {
            creep.say('🚨');
            return true;
        }
    }
    return false;
}

// Fix gegenüber prod/creep.base.js: dort `&&` statt `||` – bei Räumen ohne Controller warf die Prüfung einen TypeError.
export function upgradeController(creep: Creep): boolean | void {

    var controller = creep.room.controller;
    if (!controller || !controller.my)
        return;

    const state = creep.upgradeController(controller);

    if (state === ERR_NOT_IN_RANGE ||
        (state === ERR_INVALID_TARGET && controller.upgradeBlocked > 0)) {

        creepBaseGoTo.moveByMemory(creep,controller.pos);

    }

    if (!controller.sign ||
        controller.sign!.username == undefined ||
        controller.sign!.username != creep.owner.username) {

        var c = creep.signController(controller, '⚔')
        if (c === ERR_NOT_IN_RANGE) {
            creepBaseGoTo.moveByMemory(creep,controller.pos);
        }

    }

    return state == OK;
}

export function spawn(
    spawn: StructureSpawn,
    profil: BodyPartConstant[],
    newName: string,
    memory: any,
): boolean {
    if (spawn.spawnCreep(profil, newName, { dryRun: true }) === 0) {
        spawn.spawnCreep(profil, newName, { memory: memory });
        console.log("[" + spawn.room.name + "|" + memory.workroom + "] spawn " + newName + " cost: " + calcProfil(profil));
        return true;
    }
    return false;
}
