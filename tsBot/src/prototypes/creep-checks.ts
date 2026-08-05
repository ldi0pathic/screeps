/**
 * Creep-Prototypen: Zustandsprüfungen, die alle Rollen benutzen.
 *
 * Ursprünglich aus `prod/prototype.creep.checks.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`. Die
 * Nicht-null-Assertions bedienen nur `noUncheckedIndexedAccess`; esbuild
 * entfernt sie, der erzeugte Code ist derselbe wie in prod/.
 */

import { PathMemory } from "../creep/path-memory";

export function installCreepChecks(): void {
    Creep.prototype.checkHarvest = function (action, action2) {
        // Bei jedem Zustandswechsel wird der gespeicherte Weg verworfen — das
        // Ziel ändert sich mit dem Zustand. Die Stauerkennung bleibt bewusst
        // stehen: der Creep steht ja weiter dort, wo er steht.
        const pathCache = new PathMemory(this.memory);

        if (!this.memory.harvest && this.store.getUsedCapacity() === 0) {
            if (typeof (action) == "function")
                action.call(this);

            this.memory.harvest = true;
            this.memory.fromId = null;
            this.say('🛒');
            pathCache.forgetPath();
        }
        if (this.memory.harvest && this.store.getFreeCapacity() === 0) {
            if (typeof (action2) == "function")
                action2.call(this);

            this.memory.harvest = false;
            delete this.memory.useRoomSource;
            pathCache.forgetPath();
            delete this.memory.useContainer;
        }

        if (this.memory.harvest && this.store.getUsedCapacity() > 0 && this.memory.mineral !== "energy") {
            this.memory.harvest = false;
            delete this.memory.useRoomSource;
            pathCache.forgetPath();
            delete this.memory.useContainer;
        }
    };

    Creep.prototype.checkInvasion = function () {
        if (Memory.rooms[this.memory.workroom]!.needDefence ||
            (Memory.rooms[this.memory.workroom]!.invaderCore &&
                Game.rooms[this.memory.workroom] &&
                Game.rooms[this.memory.workroom]!.controller &&
                Game.rooms[this.memory.workroom]!.controller!.reservation &&
                Game.rooms[this.memory.workroom]!.controller!.reservation!.username != this.owner.username)) {
            this.say('☎');
            return true;
        }
        return false;
    };

    Creep.prototype.checkWorkroomPrioSpawn = function () {
        if (Memory.rooms[this.memory.workroom]!.aktivPrioSpawn) {
            this.say('🚨');
            return true;
        }
        return false;
    };

    Creep.prototype.checkTombstones = function(min = 100)
    {
        const tombstone = this.pos.findClosestByPath(FIND_TOMBSTONES, { filter: (d) => d.store.getUsedCapacity() > min });
        if (tombstone) {
            this.memory.withdraw = tombstone.id;
            return true;
        }
        return false;
    };

    Creep.prototype.checkDrops = function(min = 100)
    {
        const drop = this.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) =>  d.amount > min });
        if (drop) {
            this.memory.pickup = drop.id;
            return true;
        }
        return false;
    };

    Creep.prototype.checkRuins = function(min = 100)
    {
        const ruin = this.pos.findClosestByPath(FIND_RUINS, { filter: (d) => d.store.getUsedCapacity() > min});
        if (ruin) {
            this.memory.withdraw = ruin.id;
            return true;
        }
        return false;
    };

    Creep.prototype.checkAllContainer = function(min)
    {
        if(!min)
        {
            min = this.store.getFreeCapacity() * 0.25;
        }
        var container: AnyStoreStructure | undefined;
        if(Memory.rooms[this.room.name] && Memory.rooms[this.room.name]!.container) {
            var distance = Infinity;
            for(var id of Memory.rooms[this.room.name]!.container as Id<AnyStoreStructure>[])
            {
                var c = Game.getObjectById(id);
                if(c && c.store.getUsedCapacity()! > min)
                {
                    var d = Math.sqrt(Math.pow(this.pos.x - c.pos.x, 2) + Math.pow(this.pos.y - c.pos.y, 2));
                    if(d < distance)
                    {
                        distance = d;
                        container = c;
                    }
                }
            }
        }
        else if(Memory.rooms[this.room.name] && !Memory.rooms[this.room.name]!.container)
        {
            var containers = this.room.find(FIND_STRUCTURES,  {filter: (structure) =>
            {
                return  structure.structureType === STRUCTURE_CONTAINER
            }});

            Memory.rooms[this.room.name]!.container = containers.map( c => {
                return c.id
            });

            return (containers.length > 0);
        }

        if(container)
        {
            this.memory.withdraw = container.id;
            return true;
        }
        return false;
    };
}
