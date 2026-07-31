// @ts-nocheck

module.exports = {
    init: function()
    { 
        if(!Memory.terminals)
        {
            Memory.terminals = [];
        }

        if(Memory.init)
            return;

        if(!Memory.rooms)
        {
            Memory.rooms = {};
        }

        for(var name in global.room)
        {
            if (!Memory.rooms[name]) 
            {
                Memory.rooms[name] = {};
            }

            Memory.rooms[name].aktivPrioSpawn = Memory.rooms[name].aktivPrioSpawn ? true : false;
            Memory.rooms[name].hasLinks = Memory.rooms[name].hasLinks? true : false;
            Memory.rooms[name].needDefence = Memory.rooms[name].needDefence ? true: false;
            Memory.rooms[name].invaderCore =  Memory.rooms[name].invaderCore ? true : false;
            Memory.rooms[name].nuke =  Memory.rooms[name].nuke ? true : false;
            Memory.rooms[name].aktivPrioSpawnCount = Memory.rooms[name].aktivPrioSpawnCount || 0;
        
            Memory.init = true;
        }
    },
    clear: function()
    {
        if(Memory.rooms)
        {
            for( var name in Memory.rooms)
            {
                if(!global.room[name])
                {
                    delete Memory.rooms[name]     
                    continue;
                }

                if(!global.room[name].saveRoads && Memory.rooms[name].roads)
                {
                    delete Memory.rooms[name].roads;
                }         
            }
        }
    },
    writeStatus: function()
    {
        var msg = "";
        for(var room in Memory.rooms)
        {
           if(Memory.rooms[room].aktivPrioSpawn)
           {
                msg += "PrioSpawn im Raum "+room+"\n";
           }
           if(Memory.rooms[room].needDefence)
           {
                msg += "Angriff im Raum "+room+"\n";
           }
           if(Memory.rooms[room].invaderCore)
           {
                msg += "Core im Raum "+room+"\n";
           }
        }
        if(msg != "")
            console.log(msg);
    },
    FindAndSaveRoomWalls: function()
    {
        if(!Memory.rooms)
        {
            Memory.rooms = {};
        }

        for(var name in global.room)
        {
            if(global.room[name].maxwallRepairer < 1)
                continue;

            if (!Memory.rooms[name]) 
            {
                Memory.rooms[name] = {};
            }

            var room = Game.rooms[global.room[name].room];
            
            if(!room)
                continue;

            var walls = room.find(FIND_STRUCTURES,  {filter: (structure) => 
                {
                    return  (structure.structureType === STRUCTURE_WALL || 
                    structure.structureType === STRUCTURE_RAMPART) 
                }});
           
            Memory.rooms[name].wally = walls.map( w => {
                return w.id
            });           
        }
    },
    FindAndSaveRoomContainer: function()
    {
        if(!Memory.rooms)
        {
            Memory.rooms = {};
        }

        for(var name in global.room)
        {
            if (!Memory.rooms[name]) 
            {
                Memory.rooms[name] = {};
            }

            var room = Game.rooms[global.room[name].room];
            
            if(!room)
                continue;

            var container = room.find(FIND_STRUCTURES,  {filter: (structure) => 
                {
                    return  structure.structureType === STRUCTURE_CONTAINER 
                }});
           
            Memory.rooms[name].container = container.map( c => {
                return c.id
            });           
        }
    },
    FindAndSaveRoomTower: function()
    {
        if(!Memory.rooms)
        {
            Memory.rooms = {};
        }

        for(var name in global.room)
        {
            if (!Memory.rooms[name]) 
            {
                Memory.rooms[name] = {};
            }

            var room = Game.rooms[global.room[name].room];
            if(!room)
                continue;
            var tower = room.find(FIND_STRUCTURES,  {filter: (structure) => 
                {
                    return  structure.structureType === STRUCTURE_TOWER 
                }});
           
            Memory.rooms[name].tower = tower.map( c => {
                return c.id
            });           
        }
    },
    FindAndSaveTerminals: function()
    {
        Memory.terminals = [];
        
        for(var name in global.room)
        { 
            var room = Game.rooms[global.room[name].room];
            if(!room)
                continue;

            var terminal = room.find(FIND_STRUCTURES,  {filter: (structure) => 
                {
                    return  structure.structureType === STRUCTURE_TERMINAL 
                }});
           
            if(terminal.length > 0)
                Memory.terminals.push(terminal[0].id);     
        }
    },
    FindAndSaveRoads: function()
    {
        for(var name in global.room)
        {
            if(!global.room[name].saveRoads)
                continue;

            var room = Game.rooms[global.room[name].room];
            if(!room)
                continue;

            const roads = room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType === STRUCTURE_ROAD
            });

            const constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
                filter: (site) => site.structureType === STRUCTURE_ROAD
            });

            Memory.rooms = Memory.rooms || {};
            Memory.rooms[name] = Memory.rooms[name] || {};
            Memory.rooms[name].roads = [
            ...roads.map(road => ({
                id: road.id,
                pos: road.pos,
                type: 'b'
            })),
            ...constructionSites.map(site => ({
                id: site.id,
                pos: site.pos,
                type: 'c'
            }))
    ];

        }
    }
};
