/**
 * Wiederverwendbare Creep-Aktionen: Energiebeschaffung, Bewegung, Transport,
 * Controller-Upgrade und Spawnen.
 *
 * Ursprünglich aus `prod/creep.base.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`. Die Wrapper am Ende
 * delegieren wie im Original an `creep/goto` und `creep/transport`.
 */

import { bot } from "../globals";
import * as creepBaseGoTo from "./goto";
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

export function harvestRoomDrops(creep: Creep, type: string): boolean {

    var drop: any;
    if (creep.memory.useRoomDrop) {
        drop = Game.getObjectById(creep.memory.useRoomDrop);
    }
    else {
        drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) =>  d.amount > 100 });
    }

    if (drop) {
        switch (creep.pickup(drop)) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep, drop.pos);
                creep.memory.useRoomDrop = drop.id;
                return true;

            case OK:
                creep.memory.useRoomDrop = drop.id;
                creep.memory.fromId = drop.id;
                return true;

            case ERR_INVALID_TARGET:
            default:
                delete creep.memory.useRoomDrop;
                return false;
        }
    }
    delete creep.memory.useRoomDrop;
    return false;
}

export function harvestRoomTombstones(creep: Creep, type: string): boolean {

    var tombstone: any;
    if (creep.memory.useTombstone) {
        tombstone = Game.getObjectById(creep.memory.useTombstone);
    }
    else {
        tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity(type as ResourceConstant)! > 100 });
    }

    if (tombstone) {
        switch (creep.withdraw(tombstone, type as ResourceConstant)) {
            case ERR_NOT_IN_RANGE:
                creep.memory.useTombstone = tombstone.id;
                creepBaseGoTo.moveByMemory(creep,tombstone.pos);
                return true;

            case OK:
                creep.memory.useTombstone = tombstone.id;
                creep.memory.fromId = tombstone.id;
                return true;

            case ERR_INVALID_TARGET:
            default:
                delete creep.memory.useTombstone;
                return false;
        }
    }
    delete creep.memory.useTombstone;
    return false;
}

export function harvestCompleteRoomTombstones(creep: Creep): boolean {
    var tombstone: any;
    if (creep.memory.useTombstone) {
        tombstone = Game.getObjectById(creep.memory.useTombstone);
    }
    else {
        tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity() > 100 });
    }

    if (tombstone) {
        for (var resourceType in tombstone.store) {
            switch (creep.withdraw(tombstone, resourceType as ResourceConstant)) {
                case ERR_NOT_IN_RANGE:
                    creepBaseGoTo.moveByMemory(creep,tombstone.pos);
                    creep.memory.useTombstone = tombstone.id;
                    return true;

                case OK:
                    creep.memory.useTombstone = tombstone.id;
                    creep.memory.fromId = tombstone.id;
                    return true;

                case ERR_INVALID_TARGET:
                default:
                    delete creep.memory.useTombstone;
                    return false;
            }
        }
    }
    delete creep.memory.useTombstone;
    return false;
}

export function harvestRoomRuins(creep: Creep, type: string): boolean {
    var ruin: any;
    if (creep.memory.useRuin) {
        ruin = Game.getObjectById(creep.memory.useRuin);
    }
    else {
        ruin = creep.pos.findClosestByPath(FIND_RUINS, { filter: (d) => d.store.getUsedCapacity(type as ResourceConstant)! > 50 });
    }

    if (ruin) {
        switch (creep.withdraw(ruin, type as ResourceConstant)) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep,ruin.pos);
                creep.memory.useRuin = ruin.id;
                return true;

            case OK:
                creep.memory.useRuin = ruin.id;
                creep.memory.fromId = ruin.id;
                return true;

            case ERR_INVALID_TARGET:
            default:
                delete creep.memory.useRuin;
                return false;
        }

    }
    delete creep.memory.useRuin;
    return false;
}

export function harvestRoomStorage(creep: Creep, type: string): boolean {
    let storage = creep.room.storage;
    let min = type === "energy" ? (creep.store.getCapacity() * 0.5) : 50;
    if (storage && storage.store[type as ResourceConstant] > min) //Creep sollte min halbvoll werden
    {
        var state  = creep.withdraw(storage, type as ResourceConstant);
        switch (state) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep,storage.pos);
                return true;
            case OK:
                creep.memory.fromId = storage.id;
                return true;

            default:
                return false;
        }
    }

    return false;
}

export function harvestRoomContainer(creep: Creep, type: string, mul?: number): boolean {
    if (!mul) mul = 0.5;
    var container: any;
    if (creep.memory.useContainer) {
        container = Game.getObjectById(creep.memory.useContainer);
    }
    else if(Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name]!.container && Memory.rooms[creep.room.name]!.container.length > 0) {
        var distance = Infinity;
        var minCap = creep.store.getFreeCapacity() * mul;
        for(var id of Memory.rooms[creep.room.name]!.container)
        {
            var c: any = Game.getObjectById(id);
            if(!c){
                delete Memory.rooms[creep.room.name]!.container;
            }
            if(c && c.store.getUsedCapacity(type) >  minCap)
            {
                var d = Math.sqrt(Math.pow(c.pos.x - creep.pos.x, 2) + Math.pow(c.pos.y - creep.pos.y, 2));
                if(d < distance)
                {
                    //console.log('['+creep.room.name+'] d: '+d + ' << distance: '+distance + ' count >'+Memory.rooms[creep.room.name].container.length );
                    distance = d;
                    container = c;
                    creep.memory.useContainer = c.id;
                }
            }
        }
    } else if(Memory.rooms[creep.room.name] && (!Memory.rooms[creep.room.name]!.container || (Memory.rooms[creep.room.name]!.container && Memory.rooms[creep.room.name]!.container.length == 0)))
    {
        var containers = creep.room.find(FIND_STRUCTURES,  {filter: (structure) =>
        {
            return  structure.structureType === STRUCTURE_CONTAINER
        }});

        Memory.rooms[creep.room.name]!.container = containers.map( c => {
            return c.id
        });

        return (containers.length > 0);
    }

    if (container && container.store.getUsedCapacity(type)  > creep.store.getFreeCapacity() * mul) {
        switch (creep.withdraw(container, type as ResourceConstant)) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep,container.pos);
                return true;
            case OK:
                creep.memory.fromId = container.id;
                return true;

            default:
                delete creep.memory.useContainer;
                return false;
        }
    }
    delete creep.memory.useContainer;
    return false;
}

export function harvestSpawnLink(creep: Creep, type: string): boolean {
    if (creep.memory.workroom != creep.room.name ||
        !bot.room[creep.memory.workroom]!.spawnLink)
        return false;

    var link: any = Game.getObjectById(bot.room[creep.memory.workroom]!.spawnLink!);

    if (link && link.store[type] > 100) {
        switch (creep.withdraw(link, type as ResourceConstant)) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep,link.pos);
                return true;
            case OK:
                creep.memory.fromId = link.id;
                return true;

            default:
                return false;
        }
    }
    return false;
}

export function harvestControllerLink(creep: Creep, type: string): boolean {
    if (creep.memory.workroom != creep.room.name ||
        !bot.room[creep.memory.workroom]!.controllerLink ||
        !creep.room.controller!.my ||
         creep.room.controller!.level <5)
        return false;

    var link: any = Game.getObjectById(bot.room[creep.memory.workroom]!.controllerLink!);

    if (link && link.store[type] > 100) {
        switch (creep.withdraw(link, type as ResourceConstant)) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep,link.pos);
                return true;
            case OK:
                creep.memory.fromId = link.id;
                return true;

            default:
                return false;
        }
    } else {
        creep.memory.noLink = true;
    }
    return false;
}

export function harvestMyContainer(creep: Creep, type: string): boolean {
    if (creep.memory.workroom != creep.room.name || creep.memory.container == '')
        return false;

    var container: any = Game.getObjectById(creep.memory.container);

    if (container) {
        if (container.store[type] < 100) {
            return false;
        }

        switch (creep.withdraw(container, type as ResourceConstant)) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep,container.pos);
                return true;
            case OK:
                creep.memory.fromId = container.id;
                return true;

            default:
                return false;
        }
    }
    return false;
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

    if(notfall.length > 0)
    {
        notfall.sort(function (a: any, b: any)
        {
            return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
        });

        switch (creep.withdraw(notfall[0]!, RESOURCE_ENERGY)) {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep, notfall[0]!.pos);
                return true;
            case OK:
                creep.memory.fromId = notfall[0]!.id;
                return true;

            default:
                return false;
        }
    }
    return false;
}

export function harvestRoomEnergySource(creep: Creep): boolean {
    if (canHarvestEnergy(creep)) {
        var source: any;
        if (creep.memory.useRoomSource) {
            source = Game.getObjectById(creep.memory.useRoomSource);
        }
        else {
            source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        }

        if (source && source.energy > 100) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                if (creep.moveTo(source) == ERR_NO_PATH) { // z.B. falls durch miner blockiert
                    delete creep.memory.useRoomSource;
                    return false;
                }
            }
            creep.memory.useRoomSource = source.id;
            creep.memory.fromId = source.id;
            return true;
        }
        delete creep.memory.useRoomSource;
    }
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
