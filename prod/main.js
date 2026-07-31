const controllerMemory = require('./controller.memory');
const  timer = require('./controller.timing');
const jobs = require('./creep.jobs');
const profiler = require('./profiler');

//require('./prototype.creep.checks')();

require('./prototype');


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