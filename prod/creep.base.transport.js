const creepBaseGoTo = require('./creep.base.goto');
module.exports = 
{
    _Transfer: function(creep, target, type)
    {
        if (target) {
            switch (creep.transfer(target, type))
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
    },
    CheckIsFreelancer: function(creep)
    {
        return creep.memory.container == '';
    },
    TransportToHomeContainer: function(creep, type, mul)
    {
        var container;
        if(!mul) mul = 0.5;
        if (creep.memory.useContainer) {
            container = Game.getObjectById(creep.memory.useContainer);
        }
        else if(Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name].container) {
            var distance = Infinity;
            var minCap = creep.store.getUsedCapacity() * mul;
            for(var id of Memory.rooms[creep.room.name].container)
            {
                var c = Game.getObjectById(id);
                if(c && c.store.getFreeCapacity(type) >  minCap && c.id != global.room[creep.room.name].mineralContainerId && c.id != creep.memory.fromId )
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
        else if(Memory.rooms[creep.room.name] && !Memory.rooms[creep.room.name].container)
        {
            var containers = creep.room.find(FIND_STRUCTURES,  {filter: (structure) => 
            {
                return  structure.structureType === STRUCTURE_CONTAINER 
            }});
           
            Memory.rooms[creep.room.name].container = containers.map( c => {
                return c.id
            });   

            return (containers.length > 0);    
        }

        if (container && container.store.getFreeCapacity() > 0) {
            switch (creep.transfer(container, type))
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
    },
    TransportToHomeTerminal: function(creep)
    {
        if(!creep.room.controller.my || creep.room.controller.level < 6)
            return false;

        var terminal;
        if(Memory.rooms[creep.memory.workroom].terminalId )
        {
            terminal = Game.getObjectById(Memory.rooms[creep.memory.workroom].terminalId);
            if(!terminal)
            {
                delete Memory.rooms[creep.memory.workroom].terminalId;
                return false;
            }
                
        }
        else
        {
            var target = creep.room.find(FIND_MY_STRUCTURES,
                {
                    filter: (structure) => {
                        return (
                            structure.structureType === STRUCTURE_TERMINAL 
                        ) && structure.store.getFreeCapacity() > 0 ;
                    }
                });

            if(target.length > 0)
            {
                Memory.rooms[creep.memory.workroom].terminalId = target[0].id;
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

                if(this._Transfer(creep, terminal, resourceType) && !t)
                {
                    t = true;
                }             
            } 
            return t;
        }
        return false;   
    },
  
    TransportToHomeLab: function(creep, type)
    {
        var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
            {
                filter: (structure) => {
                    return (
                        structure.structureType === STRUCTURE_LAB 
                    ) && structure.store.getFreeCapacity([type]) > 0 
                      && structure.id != creep.memory.fromId;
                }
            });

        return this._Transfer(creep, target, type);    
    },
    TransportEnergyToHomeSpawn: function(creep)
    {    
        if(creep.memory.home != creep.room.name || 
           creep.store[RESOURCE_ENERGY] == 0)
            return false;
         
        var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,
            {
                filter: (structure) => {
                    return (
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_EXTENSION
                    ) && structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 0
                    && structure.id != creep.memory.fromId;
                }
            });
         
        return this._Transfer(creep, target, RESOURCE_ENERGY);    
    },
    TransportEnergyToHomeTower: function(creep)
    {
        if(creep.store[RESOURCE_ENERGY] == 0)
            return false;
        
        var towers = creep.room.find(FIND_MY_STRUCTURES,
            {
                filter: (structure) => {
                    return (
                        structure.structureType === STRUCTURE_TOWER    
                    ) && structure.store.getFreeCapacity([RESOURCE_ENERGY]) > 100;
                }
            });

        if (towers.length > 0) 
        {
            towers.sort((a, b) => b.store.getFreeCapacity(RESOURCE_ENERGY) - a.store.getFreeCapacity(RESOURCE_ENERGY));
            return this._Transfer(creep, towers[0], RESOURCE_ENERGY);    
        }
        return false;
    },
    TransportToHomeStorage: function(creep)
    {  
        var target = creep.room.storage;

        if(!target)
            return false;

        //ansonsten werden lnks nicht inden storage geleert :( 
        if(global.room[creep.memory.workroom].spawnLink)
        {
            var link = Game.getObjectById(global.room[creep.memory.home].spawnLink);

            if(link.store[RESOURCE_ENERGY] < 100 && creep.memory.fromId == target.id)
                return false;
        }
        else if(creep.memory.fromId == target.id) return false;
            
        

        if (target) {
            for (var resourceType in creep.store) {
                this._Transfer(creep, target, resourceType);    
            } 
            return true;
        }
        return false;
    }
};