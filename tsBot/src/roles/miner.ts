/**
 * Rolle "miner": bewegt sich zur Energie- oder Mineralquelle, baut/repariert
 * den zugehörigen Container bzw. Link vor Ort und leitet überschüssige
 * Energie per Link weiter.
 *
 * Inhaltlich identisch zu `prod/creep.miner.js`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";

const role = "miner";

export function _clearMemory(creep: Creep) {
    delete creep.memory.pos;
    delete creep.memory._move;
    delete creep.memory.path;
    delete creep.memory.pathTarget;
    delete creep.memory.lastPos;
    delete creep.memory.dontMove;
}

/** @param {Creep} creep **/
export function doJob(creep: Creep) {

    if(creep.body.length > 30 && creep.memory.onPosition && Game.time % 2 == 1) return;

   /* if(creep.checkInvasion()) {
        creep.memory.onPosition = false;
        return;
    };*/

    if(!creep.memory.onPosition)
    {
        if(creepBase.goToWorkroom(creep)) return;

        let finalLocation: any;
        if(!creep.memory.pos)
        {


            var source: any = Game.getObjectById(creep.memory.source);

            let container: any = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: { structureType: STRUCTURE_CONTAINER }
            })[0];


            if(container)
            {
                finalLocation = container.pos;
                creep.memory.pos = container.pos;
                creep.memory.container = container.id;
            }
            else
            {
                let build: any = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                    filter: { structureType: STRUCTURE_CONTAINER }
                })[0];

                if(build)
                {
                    finalLocation = build.pos;
                    creep.memory.pos = build.pos;
                    creep.memory.container = build.id;
                }
                else
                {
                    var sourcePos = source.pos;
                    var adjacentSpots: RoomPosition[] = [];

                    for (let xOffset = -1; xOffset <= 1; xOffset++) {
                        for (let yOffset = -1; yOffset <= 1; yOffset++) {
                            if (xOffset === 0 && yOffset === 0) {
                                continue;
                            }

                            var x: any = sourcePos.x + xOffset;
                            var y: any = sourcePos.y + yOffset;

                            adjacentSpots.push(new RoomPosition(x, y, creep.memory.workroom));
                        }
                    }

                    for (var spot of adjacentSpots) {
                        var state: any = spot.createConstructionSite(STRUCTURE_CONTAINER);
                        if (state === OK) {
                            return;
                        }
                        if (state === ERR_FULL) {
                            finalLocation = adjacentSpots.find(p =>
                                p.lookFor(LOOK_TERRAIN)[0] !== 'wall'
                            );
                            creep.memory.pos = finalLocation;
                            return;
                        }
                        creep.say(state as any)
                    }

                    return false;
                }
            }
        }
        else
        {
           finalLocation = creep.memory.pos;
        }

        if (creep.pos.x == creep.memory.pos.x && creep.pos.y == creep.memory.pos.y)
        {
            var source: any = creep.pos.findClosestByPath(creep.memory.mineEnergy ? FIND_SOURCES : FIND_MINERALS);
            var state: any = creep.harvest(source);
            if (state === ERR_NOT_IN_RANGE)
            {
                creep.say('⁉');
            }
            else
            {
                creep.memory.source = source.id;
                if((creep.room.controller!.my && creep.room.controller!.level < 4) || !creep.room.controller!.my || !creep.memory.mineEnergy)
                {
                    creep.memory.onPosition = true;
                    _clearMemory(creep);

                    if(!creep.memory.mineEnergy)
                    {
                        var terminal: any = creep.pos.findInRange(FIND_STRUCTURES,1, {
                            filter: (s: any) => s.structureType === STRUCTURE_TERMINAL
                        })[0];

                        if(terminal)
                        {
                            creep.memory.terminal = terminal.id;
                        }
                    }
                    return;
                }

                const link: any = creep.pos.findInRange(FIND_STRUCTURES,1, {
                    filter: (s: any) => s.structureType === STRUCTURE_LINK
                })[0];

                if(link)
                {
                    creep.memory.link = link.id;
                    creep.memory.onPosition = true;
                    _clearMemory(creep);
                }
                else
                {
                    let build: any = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                        filter: { structureType: STRUCTURE_LINK }
                    })[0];

                    if(build)
                    {
                        creep.memory.build = build.id;
                        creep.memory.onPosition = true;
                        _clearMemory(creep);

                    }
                    else if(creep.room.controller!.level >= 6 && creep.memory.mineEnergy)
                    {
                        var creepPos = creep.pos;
                        var adjacentSpots: RoomPosition[] = [];

                        for (let xOffset = -1; xOffset <= 1; xOffset++) {
                            for (let yOffset = -1; yOffset <= 1; yOffset++) {
                                if (xOffset === 0 && yOffset === 0) {
                                    continue;
                                }

                                var x: any = creepPos.x + xOffset;
                                var y: any = creepPos.y + yOffset;

                                adjacentSpots.push(new RoomPosition(x, y, creep.memory.workroom));
                            }
                        }

                        for (var spot of adjacentSpots) {
                            if (spot.createConstructionSite(STRUCTURE_LINK) === OK) {
                                return;
                            }
                        }
                    }
                    else
                    {
                        creep.memory.onPosition = true;
                        _clearMemory(creep);
                        return;
                    }
                }
            }
        }
        else
            creepBase.moveByMemory(creep, new RoomPosition(finalLocation.x, finalLocation.y,finalLocation.roomName))
    }
    else
    {
        let source: any = Game.getObjectById(creep.memory.source);
        var container: any = Game.getObjectById(creep.memory.container);

        if(creep.memory.mineEnergy)
        {
            if(container)
            {

                if((container.progressTotal == undefined && container.store.getUsedCapacity() == 0&& source.energy <= 1) || (container.progressTotal != undefined  && source.energy <= 1) )
                {
                    creep.say('😴')
                    return;
                }

                if(creep.store.getFreeCapacity() > 0 && container.progressTotal == undefined && container.store.getUsedCapacity() > 0)
                {
                    creep.withdraw(container, RESOURCE_ENERGY);
                }

                if(container.progressTotal != undefined && container.progressTotal > container.progress)
                {
                    creep.say('🛠');
                    creep.build(container);
                }
                else if(container.progressTotal == undefined && ((container.hits < container.hitsMax && !creep.memory.notfall) || container.hits < 100))
                {
                    creep.say('🔧');
                    creep.repair(container);
                }

                else if(container.store.getFreeCapacity() == 0 && creep.store.getFreeCapacity() == 0 && !creep.memory.link)
                {
                    creep.say('🚯');
                    return;
                }
            }

            //link bauen
            if(creep.memory.build)
            {
                var build: any = Game.getObjectById(creep.memory.build);

                if(build && build.progressTotal != undefined && build.progressTotal > build.progress)
                {
                    creep.say('🛠');
                    creep.build(build);
                }
                else if(!build)
                {
                    delete creep.memory.build;

                    var link: any = creep.pos.findInRange(FIND_STRUCTURES,1, {
                        filter: (s: any) => s.structureType === STRUCTURE_LINK
                    })[0];

                    if(link)
                    {
                        creep.memory.link = link.id
                    }
                }
            }

            if( creep.memory.link && creep.store.getFreeCapacity() == 0)
            {
                var link: any = Game.getObjectById( creep.memory.link);

               if(link != null && link.cooldown < 1 && creep.transfer(link,RESOURCE_ENERGY) == ERR_FULL)
               {
                    var target: any;
                    if(creep.room.storage && creep.room.storage.store.getUsedCapacity()*0.5 > creep.room.storage.store.getFreeCapacity())
                    {
                        target = Game.getObjectById(bot.room[creep.room.name]!.controllerLink as any);
                    }
                    else
                    {
                        target = Game.getObjectById((bot.room[creep.room.name]!.targetLinks as any)[[Math.floor((Math.random()*bot.room[creep.room.name]!.targetLinks!.length))] as any]);
                    }

                    if(target && target.store.getFreeCapacity(RESOURCE_ENERGY) > 50)
                    {
                        link.transferEnergy(target);
                    }
                    else
                    {
                        if(container && container.store.getFreeCapacity() == 0 && creep.store.getFreeCapacity() == 0)
                        {
                            creep.say('🚯');
                            return;
                        }
                    }
               }
            }
        }
        else
        {

            if(container)
            {

                if(creep.store.getFreeCapacity() > 0 && container.progressTotal == undefined && container.store.getUsedCapacity() > 0)
                {
                    creep.withdraw(container, source.mineralType);

                    return;
                }

                if(creep.store.getFreeCapacity() == 0 &&  ((container.progressTotal == undefined && container.store.getFreeCapacity() == 0) || (container.progressTotal != undefined))&& !creep.memory.terminal)
                {
                    creep.say('🚯');
                    return;
                }
            }

            if( creep.memory.terminal && creep.store.getFreeCapacity() == 0)
            {
                var terminal: any = Game.getObjectById(creep.memory.terminal);
                if(terminal)
                {
                    creep.transfer( terminal,source.mineralType)
                }


            }

            if(creep.memory.extactor)
            {
                var extactor: any = Game.getObjectById(creep.memory.extactor);
                if(extactor && extactor.cooldown > 0)
                {
                    creep.say('😴')
                    return;
                }
            }
            else
            {
                let extr: any = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                    filter: { structureType: STRUCTURE_EXTRACTOR }
                })[0];
                if(extr)
                {
                    creep.memory.extactor = extr.id;
                    if(extr.cooldown > 0)
                    {
                        creep.say('😴')
                        return;
                    }
                }
            }
        }

        if( source.energy && source.energy <= 1 || source.mineralAmount && source.mineralAmount < 1 )
        {
            creep.say('😴')
            return;
        }

        var state: any = creep.harvest(source);

        if( state != OK)
        {
            if(state == ERR_TIRED || state == ERR_NOT_ENOUGH_ENERGY)
            {
                creep.say('😴')
            }
            else if(state == ERR_NO_BODYPART)
            {
                creep.suicide();
            }
            else
            {
                creep.say(state+' :(');
            }
        }
    }
}

export function sayJob(this: any) { this.creep.say('⛏') }

 /**
 *
 * @param {StructureSpawn} spawn
 */
export function _getProfil(spawn: StructureSpawn, workroom: string): BodyPartConstant[] {

    const totalCost =  3* BODYPART_COST[WORK] + BODYPART_COST[CARRY] + 2*BODYPART_COST[MOVE];
    var maxEnergy = spawn.room.energyCapacityAvailable;
    var numberOfSets = Math.min(8,Math.floor(maxEnergy / totalCost));

    return Array((numberOfSets*3)).fill(WORK).concat(Array((numberOfSets)).fill(CARRY).concat(Array((numberOfSets*2)).fill(MOVE)));
}

/**
 *
 * @param {StructureSpawn} spawn
 * @param {String} workroom
 * @returns
 */
export function spawn(spawn: StructureSpawn, workroom: string) {
    bot.logWorkroom(workroom,'Miner Spawn start');
    if(!bot.room[workroom]!.sendMiner)
        return false;

    if(spawn.room.name != workroom && !Memory.rooms[workroom]!.claimed && !bot.room[workroom]!.claim)
        return false;

    for(var id in bot.room[workroom]!.energySources)
    {
        if(!Game.getObjectById((bot.room[workroom]!.energySources as any)[id]))
            continue;

        if(_spawn(spawn,workroom, (bot.room[workroom]!.energySources as any)[id], true))
            return true;
    }

    var room = Game.rooms[workroom];
    if(room && room.controller && room.controller.my && room.controller.level >= 6)
    {
        for(var id in bot.room[workroom]!.mineralSources)
        {
           var mineral: any =  Game.getObjectById((bot.room[workroom]!.mineralSources as any)[id]);
           if(!mineral || mineral.mineralAmount < 1)
                return false;

            if(_spawn(spawn,workroom, (bot.room[workroom]!.mineralSources as any)[id], false))
                return true;
        }
    }
    return false;
}

/**
 *
 * @param {StructureSpawn} spawn
 * @param {String} workroom
 * @param {String} source
 * @returns
 */
export function _spawn(spawn: StructureSpawn, workroom: string, source: string, mineEnergy: boolean) {

    var time = 300;
    if(workroom == spawn.room.name)
    {
        time = 150;
    }
    var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom &&
                                                creep.memory.source == source &&
                                                (creep.ticksToLive! > time || creep.spawning)
                                                ).length;

    if (1 <= count)
    {
        Memory.rooms[spawn.room.name]!.aktivPrioSpawn = false;
        return false;
    }

    if(!creepBase.spawn(spawn, _getProfil(spawn, workroom), role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, source: source, mineEnergy:mineEnergy,notfall:false }))
    {
        Memory.rooms[spawn.room.name]!.aktivPrioSpawn = true;
        Memory.rooms[spawn.room.name]!.aktivPrioSpawnCount = (Memory.rooms[spawn.room.name]!.aktivPrioSpawnCount || 0) + 1;

        if(Memory.rooms[spawn.room.name]!.aktivPrioSpawnCount > 25)
        {
           if(_.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                creep.memory.workroom == workroom && creep.memory.source == source ).length > 0)
            return false;

            console.log("["+spawn.room.name+"|"+workroom+"] Spawn NotfallMiner!!!")
            creepBase.spawn(spawn, [WORK,CARRY,MOVE], role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, source: source, mineEnergy:mineEnergy, notfall:true })
            Memory.rooms[spawn.room.name]!.aktivPrioSpawnCount = 0;
            return true;
        }
        return false;
    }

    Memory.rooms[spawn.room.name]!.aktivPrioSpawnCount = 0;
    return true;
}
