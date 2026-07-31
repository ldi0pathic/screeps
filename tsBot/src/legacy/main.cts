// @ts-nocheck
const controllerMemory = require('./controller.memory.cts');
const  timer = require('./controller.timing.cts');
const jobs = require('./creep.jobs.cts');
const profiler = require('./profiler.cts');

//require('./prototype.creep.checks.cts')();

require('./prototype.cts');


//profiler.enable();
module.exports.loop = function () {
    //profiler.wrap(function() 
    {   
  
      //  controllerMemory.FindAndSaveTerminals();
      //controllerMemory.FindAndSaveRoads();
      //controllerMemory.clear();
        try {
            for(var name in global.room)
            {  
                var room = Game.rooms[name];

                try
                {
                    if(Memory.rooms[name].nuke && Memory.rooms[name].nukepos.length > 0)
                    {
                        for(var nuke of Memory.rooms[name].nukepos)
                        {
                            new RoomVisual(name).circle(nuke.x, nuke.y,{fill: 'transparent', radius: 5, stroke: '#ff0000'});         
                        }     
                    }
                }
                catch
                {
                    Memory.init = false;
                    controllerMemory.init();
                }
            
                if (room && room.controller && room.controller.my) 
                {
                    new RoomVisual(name).text(room.energyAvailable+'/'+room.energyCapacityAvailable, 2, 1, {color: 'white', font: 0.8})  
                }    
            }

            for(var name in Memory.creeps) 
            {
                var creep = Game.creeps[name];

                if(!creep)
                {
                    delete Memory.creeps[name];
                    continue;
                }
                    
                if(!creep.memory.role)
                {
                    if(creep.suicide() === OK)
                        delete Memory.creeps[name];

                    continue;
                }

                if(creep.spawning)
                    continue;
                    
                try 
                {
                    if(creep.memory.role)
                    {
                        jobs[creep.memory.role].doJob(creep);
                    }        
                } 
                catch (error)
                {
                    console.log("Job: "+creep.memory.role);
                    throw error;
                }
            }

        } catch (error) {
            throw error;
        }
        timer.controll();
    }//);
}