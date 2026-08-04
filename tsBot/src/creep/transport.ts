/**
 * Ablieferziele der Transport-Creeps: Spawn/Extensions, Türme, Storage,
 * Terminal, Labs und Container.
 *
 * Inhaltlich identisch zu `prod/creep.base.transport.js`. Die Filter-Callbacks
 * der `find`-Aufrufe bleiben vorerst untypisiert (`any`), weil sie
 * strukturübergreifend auf `store` zugreifen.
 */

import { bot } from "../globals";
import * as creepBaseGoTo from "./goto";

export function _Transfer(
    creep: Creep,
    target: AnyStructure | null | undefined,
    type: string,
): boolean {
    if (target) {
        switch (creep.transfer(target, type as ResourceConstant))
        {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep, target.pos);
                return true;

            case OK:
                return true;

            default:
                return false;
        }
    }
    return false;
}

export function CheckIsFreelancer(creep: Creep): boolean {
    return creep.memory.container == '';
}

export function TransportToHomeContainer(creep: Creep, type: string, mul?: number): boolean {
    var container: any;
    if(!mul) mul = 0.5;
    if (creep.memory.useContainer) {
        container = Game.getObjectById(creep.memory.useContainer);
    }
    else if(Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name]!.container) {
        var distance = Infinity;
        var minCap = creep.store.getUsedCapacity() * mul;
        for(var id of Memory.rooms[creep.room.name]!.container)
        {
            var c: any = Game.getObjectById(id);
            if(c && c.store.getFreeCapacity(type) >  minCap && c.id != bot.room[creep.room.name]!.mineralContainerId && c.id != creep.memory.fromId )
            {
                var d = Math.sqrt(Math.pow(creep.pos.x - c.pos.x, 2) + Math.pow(creep.pos.y - c.pos.y, 2));
                if(d < distance)
                {
                    distance = d;
                    container = c;
                    creep.memory.useContainer = container.id;
                }
            }
        }
    }
    else if(Memory.rooms[creep.room.name] && !Memory.rooms[creep.room.name]!.container)
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

    if (container && container.store.getFreeCapacity() > 0) {
        switch (creep.transfer(container, type as ResourceConstant))
        {
            case ERR_NOT_IN_RANGE:
                creepBaseGoTo.moveByMemory(creep, container.pos);
                return true;

            case OK:
                delete creep.memory.useContainer;
                return true;

            default:
                return false;
        }
    }
    delete creep.memory.useContainer;
    return false;
}

export function TransportToHomeTerminal(creep: Creep): boolean {
    if(!creep.room.controller!.my || creep.room.controller!.level < 6)
        return false;

    var terminal: any;
    if(Memory.rooms[creep.memory.workroom]!.terminalId )
    {
        terminal = Game.getObjectById(Memory.rooms[creep.memory.workroom]!.terminalId);
        if(!terminal)
        {
            delete Memory.rooms[creep.memory.workroom]!.terminalId;
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
            Memory.rooms[creep.memory.workroom]!.terminalId = target[0]!.id;
            terminal = target[0];
        }
    }

    if(terminal && terminal.store.getFreeCapacity() > 0)
    {
        var t = false;
        for (var resourceType in creep.store)
        {
            //verhindern, das zuviel Energie eingelagert wird :/
            if(resourceType == RESOURCE_ENERGY &&
                terminal.store[RESOURCE_ENERGY] > 100000)
                continue;

            if(_Transfer(creep, terminal, resourceType) && !t)
            {
                t = true;
            }
        }
        return t;
    }
    return false;
}

export function TransportToHomeLab(creep: Creep, type: string): boolean {
    var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
        {
            filter: (structure: any) => {
                return (
                    structure.structureType === STRUCTURE_LAB
                ) && structure.store.getFreeCapacity([type]) > 0
                  && structure.id != creep.memory.fromId;
            }
        });

    return _Transfer(creep, target, type);
}

export function TransportEnergyToHomeSpawn(creep: Creep): boolean {
    if(creep.memory.home != creep.room.name ||
       creep.store[RESOURCE_ENERGY] == 0)
        return false;

    var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
        {
            filter: (structure: any) => {
                return (
                    structure.structureType === STRUCTURE_SPAWN ||
                    structure.structureType === STRUCTURE_EXTENSION
                ) && structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 0
                && structure.id != creep.memory.fromId;
            }
        });

    return _Transfer(creep, target, RESOURCE_ENERGY);
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

    if (towers.length > 0)
    {
        towers.sort((a: any, b: any) => b.store.getFreeCapacity(RESOURCE_ENERGY) - a.store.getFreeCapacity(RESOURCE_ENERGY));
        return _Transfer(creep, towers[0], RESOURCE_ENERGY);
    }
    return false;
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
        _Transfer(creep, target, resourceType);
    }
    return true;
}
