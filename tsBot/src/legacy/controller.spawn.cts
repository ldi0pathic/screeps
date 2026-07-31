// @ts-nocheck
const jobs = require('./creep.jobs.cts');

module.exports = {
    spawn: function()
    { 
        for(var spawnName in Game.spawns)
        {
            var spawn = Game.spawns[spawnName];
            
            if(spawn.spawning) 
                continue;

            var count = _.filter(Game.creeps, (creep) => 
                creep.memory.home == spawn.room.name && 
                creep.memory.notfall
                ).length;

             for(var room in global.room)
             {   
                var workroom = global.room[room].room;
                if(count > 0 && workroom != spawn.room.name)
                {
                    global.logWorkroom(workroom,'has NotfallCreep! >> '+JSON.stringify(_.filter(Game.creeps, (creep) => 
                    creep.memory.home == spawn.room.name && 
                    creep.memory.notfall
                    )));
                    continue;
                }
                    
                if(global.transfer[workroom] && global.transfer[workroom].source.includes(spawn.room.name))
                { 
                    if(jobs.transfer.spawn(spawn,workroom))
                    {
                        global.logWorkroom(workroom,'Spawn Transfer'); 
                        break;
                    }       
                }

                if(global.room[workroom].sendDefender && (Memory.rooms[workroom].needDefence || Memory.rooms[workroom].invaderCore))
                {
                    jobs.defender.spawn(spawn,workroom);      
                    global.logWorkroom(workroom,'Spawn Defender'); 
                    continue;   
                }
             
                if( global.room[room].spawnRoom != spawn.room.name && global.room[room].room != spawn.room.name)
                    continue;

                if(Memory.rooms[workroom].invaderCore)
                    continue;

                    global.logWorkroom(workroom,'Spawn JobLoop'); 
                for(var job in jobs)
                {     
                    global.logWorkroom(workroom,'Spawn Job: '+job); 
                    if(jobs[job].spawn(spawn,workroom))
                        break;
                }
                if(spawn.spawning) 
                    break;
             }   
        }
    }
}