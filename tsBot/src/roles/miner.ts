/**
 * Rolle "miner": bewegt sich zur Energie- oder Mineralquelle, baut/repariert
 * den zugehörigen Container bzw. Link vor Ort und leitet überschüssige
 * Energie per Link weiter.
 *
 * Inhaltlich identisch zu `prod/creep.miner.js`.
 */

import { bot } from "../globals";
import { energySources, mineralSources } from "../controller/room-inventory";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import { PathMemory } from "../creep/path-memory";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

const role = "miner";

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Miner implements CreepRole {
    private _clearMemory(creep: Creep) {
        delete creep.memory.pos;
        delete creep.memory._move;
        // Weg **und** Stauerkennung: der Miner wechselt hier seinen Standplatz,
        // die alte Position sagt danach nichts mehr über einen Stau.
        new PathMemory(creep.memory).clear();
    }

    /** Bewegt den Miner zur Quelle, baut/repariert dort Container bzw. Link und erntet. */
    doJob(creep: Creep): void {

        if(creep.memory.notfall)
        {
            // Notfallminer beendet sich selbst, sobald ein regulärer Miner für dieselbe
            // Quelle bereit ist – sonst stehen zwei Miner auf der Containerkachel und die
            // Notfallsperre in controller/spawn.ts bleibt bis zum natürlichen Tod bestehen.
            var replacement: any = _.find(Game.creeps, (c: Creep) => c.name != creep.name &&
                                                        c.memory.role == role &&
                                                        c.memory.workroom == creep.memory.workroom &&
                                                        c.memory.source == creep.memory.source &&
                                                        !c.memory.notfall &&
                                                        !c.spawning);
            if(replacement)
            {
                bot.logWorkroom(creep.memory.workroom, 'Notfallminer '+creep.name+' durch '+replacement.name+' ersetzt, beende mich.');
                creep.suicide();
                return;
            }
        }

        if(creep.body.length > 30 && creep.memory.onPosition && Game.time % 2 == 1) return;

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
                                break;
                            }
                            creep.say(state as any)
                        }

                        // Kein Feld nimmt eine Containerbaustelle an — das
                        // Baustellenkontingent ist voll (ERR_FULL) oder überall
                        // steht schon etwas. Der Miner stellt sich trotzdem an
                        // die Quelle: ohne `pos` liefe dieser ganze Block in
                        // jedem Tick erneut und gefördert würde nie etwas.
                        //
                        // `container` bleibt dabei bewusst ungesetzt. Das ist
                        // die Merkregel dieser Rolle: eine gesetzte Id heißt
                        // „hier gehört ein Container hin", keine Id heißt
                        // „hier ist nachgesehen worden, es gibt keinen".
                        creep.memory.pos = adjacentSpots.find(p =>
                            p.lookFor(LOOK_TERRAIN)[0] !== 'wall'
                        );
                        return;
                    }
                }
            }
            else
            {
               finalLocation = creep.memory.pos;
            }

            if (creep.pos.x == creep.memory.pos.x && creep.pos.y == creep.memory.pos.y)
            {
                // Die Quelle steht seit dem Spawn im Memory. Sie hier per Pfadsuche erneut zu
                // bestimmen war das Teuerste an dieser Stelle. Der Rückfall bleibt für den
                // Fall, dass die Id nicht mehr trägt — dann aber nach Entfernung statt nach
                // Weg: der Miner steht bereits neben der Quelle.
                var source: any = Game.getObjectById(creep.memory.source) ??
                    creep.pos.findClosestByRange(creep.memory.mineEnergy ? FIND_SOURCES : FIND_MINERALS);
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
                        this._clearMemory(creep);

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
                        this._clearMemory(creep);
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
                            this._clearMemory(creep);

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

                            // Kein Feld nimmt den Link an (Wand, Straße, die Quelle selbst, oder das
                            // Linkkontingent des Raums ist voll). Der Miner nimmt trotzdem seinen Platz
                            // ein — ohne diese Zeile bliebe `onPosition` false und die gesamte teure
                            // Standortsuche liefe in **jedem** Tick erneut.
                            //
                            // Ein neuer Anlauf ist deswegen nicht nötig: der Miner wird nicht erneuert
                            // (`renewCreep` gibt es im Bot nicht), sein Nachfolger startet ohne
                            // `onPosition` und durchläuft die Standortsuche komplett neu. Der Versuch
                            // wiederholt sich damit einmal je Creepleben, und solange der Miner auf dem
                            // Container steht, fördert er ohnehin — der Link ist Durchsatz, kein
                            // Betriebszustand.
                            creep.memory.onPosition = true;
                            this._clearMemory(creep);
                            return;
                        }
                        else
                        {
                            creep.memory.onPosition = true;
                            this._clearMemory(creep);
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

            // Die gemerkte Id trägt nicht mehr. Zwei Fälle: die Baustelle ist
            // fertig geworden — das fertige Bauwerk bekommt eine **neue** Id —,
            // oder der Container ist verfallen.
            //
            // Das ist keine Kosmetik: der Überschuss einer Ernte fällt auf den
            // Boden, und nur auf dem Containerfeld landet er automatisch im
            // Container (`docs/knowledge/mechanics/structures-rcl.md`). Neben
            // dem Container verfällt er. Deshalb wird erst auf dem eigenen Feld
            // nachgesehen — dort soll der Miner stehen, das ist ein Blick statt
            // einer Suche —, und sonst der Standplatz neu bestimmt.
            if(creep.memory.container && !container)
            {
                container = creep.pos.lookFor(LOOK_STRUCTURES)
                    .find((s: any) => s.structureType === STRUCTURE_CONTAINER);

                if(container)
                {
                    creep.memory.container = container.id;
                }
                else
                {
                    delete creep.memory.container;
                    creep.memory.onPosition = false;
                    return;
                }
            }

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

                // Der Miner füllt nur noch seinen eigenen Link. Wohin dieser weitersendet,
                // entscheidet `controller/links.ts` einmal je Raum und Tick — nach Vorrang
                // statt zufällig und mit expliziter Menge.
                if(creep.memory.link && creep.store.getFreeCapacity() == 0)
                {
                    var link: any = Game.getObjectById(creep.memory.link);
                    if(link)
                    {
                        creep.transfer(link, RESOURCE_ENERGY);
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

    /** Spawnt einen Miner für die nächste fällige Energie- oder Mineralquelle in `workroom`. */
    spawn(spawn: StructureSpawn, workroom: string): boolean {
        bot.logWorkroom(workroom,'Miner Spawn start');
        if(!bot.room[workroom]!.sendMiner)
            return false;

        if(spawn.room.name != workroom && !Memory.rooms[workroom]!.claimed && !bot.room[workroom]!.claim)
            return false;

        for(const sourceId of energySources(workroom))
        {
            if(!Game.getObjectById(sourceId))
                continue;

            if(this._spawn(spawn,workroom, sourceId, true))
                return true;
        }

        var room = Game.rooms[workroom];
        if(room && room.controller && room.controller.my && room.controller.level >= 6)
        {
            for(const sourceId of mineralSources(workroom))
            {
               var mineral: any =  Game.getObjectById(sourceId);
               if(!mineral || mineral.mineralAmount < 1)
                    return false;

                if(this._spawn(spawn,workroom, sourceId, false))
                    return true;
            }
        }
        return false;
    }

    private _spawn(spawn: StructureSpawn, workroom: string, source: string, mineEnergy: boolean) {

        var time = 300;
        if(workroom == spawn.room.name)
        {
            time = 150;
        }
        var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                    creep.memory.workroom == workroom &&
                                                    creep.memory.source == source &&
                                                    !creep.memory.notfall &&
                                                    (creep.ticksToLive! > time || creep.spawning)
                                                    ).length;

        if (1 <= count)
        {
            Memory.rooms[spawn.room.name]!.aktivPrioSpawn = false;
            return false;
        }

        if(!creepBase.spawn(spawn, BODIES.miner.build(spawn.room.energyCapacityAvailable), role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, source: source, mineEnergy:mineEnergy,notfall:false }))
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
}

export default new Miner();
