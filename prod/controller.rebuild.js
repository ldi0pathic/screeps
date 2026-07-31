
module.exports = {
    rebuildRoads: function()
    {
        for (var name in global.room)
        {
            if (!global.room[name].saveRoads)
                continue;

            if (!Game.rooms[name] || Game.rooms[name].controller.level < 7)
                continue;

            const roomMemory = Memory.rooms[name];
            if (!roomMemory || !roomMemory.roads)
                continue;

            // Aktuelle Baustellen im Raum zählen
            const existingSites = Game.rooms[name].find(FIND_CONSTRUCTION_SITES);

            // Maximal 10 Baustellen pro Raum
            let freeSlots = 10 - existingSites.length;

            if (freeSlots <= 0)
                continue;

            for (const roadMemory of roomMemory.roads)
            {
                // Keine freien Slots mehr
                if (freeSlots <= 0)
                    break;

                const road = Game.getObjectById(roadMemory.id);

                if (!road)
                {
                    const pos = new RoomPosition(
                        roadMemory.pos.x,
                        roadMemory.pos.y,
                        name
                    );

                    const result = pos.createConstructionSite(STRUCTURE_ROAD);

                    if (result === OK)
                    {
                        Memory.rooms[name].autobuild =
                            (Memory.rooms[name].autobuild || 0) + 1;

                        freeSlots--;
                    }
                }
            }
        }
    }
}