const jobs = require('./creep.jobs');
const memoryControll = require('./controller.memory');
const spawnControll = require('./controller.spawn');
const defenceControll = require('./controller.defence')
const rebuildControll = require('./controller.rebuild')

module.exports = {
    
    controll: function()
    {
        var tick = Game.time;

        memoryControll.init();
        defenceControll.tower();

        if (Memory.terminals && Memory.terminals.length > 0) {
            const idx = Game.time % Memory.terminals.length;
            const terminal = Game.getObjectById(Memory.terminals[idx]);
            if (terminal) {
            const TERMINAL_CAPACITY = 300000;
            
            const fill = terminal.store.getUsedCapacity() / TERMINAL_CAPACITY;
           

            if (fill > 0.8) {
                terminal.sell(); 
                terminal.sell(); 
               
            }

            terminal.sell();

            terminal.buyPixel()
            
            
            }
        }
       

        if(tick % 3 == 0)
        {
            if(Game.cpu.bucket == 10000) {
                Game.cpu.generatePixel();
            }
        }

        if(tick % 5 == 0)
        {
            spawnControll.spawn();
        }

        if(tick % 7 == 0)
        {
            defenceControll.check();
        }

        if(tick % 11 == 0)
        {
            memoryControll.writeStatus();    
        }

        this.daylie();

        //11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97
    },
    daylie: function()
    {
        const dayTicks = 86400 / 3;
        var tick = Game.time;

        switch(tick % dayTicks)
        {  
            case 0: memoryControll.clear();                     return;
            case 1: memoryControll.FindAndSaveRoomWalls();      return;
            case 2: memoryControll.FindAndSaveRoomContainer();  return;
            case 3: memoryControll.FindAndSaveRoomTower();      return;
            case 4: memoryControll.FindAndSaveTerminals();      return;
            case 5: rebuildControll.rebuildRoads();             return;    
           // case 6: memoryControll.FindAndSaveRoads();          return;
        }
    } 
}
