type SpawnJob = {
  spawn(spawn: StructureSpawn, workroom: string): boolean;
};

type RoomConfig = {
  room: string;
  spawnRoom: string;
  sendDefender?: boolean;
};

type TransferConfig = {
  source: string[];
};

type CreepBotMemory = CreepMemory & {
  home?: string;
  notfall?: boolean;
};

const botGlobal = global as typeof global & {
  room: Record<string, RoomConfig>;
  transfer: Record<string, TransferConfig>;
};
const logger = global as typeof global & {
  logWorkroom(room: string, message: string): void;
};

const jobs: Record<string, SpawnJob> = require("../legacy/creep.jobs.cts");

export function spawn(): void {
  for (const spawnName in Game.spawns) {
    const spawn = Game.spawns[spawnName];
    if (!spawn || spawn.spawning) continue;

    const emergencyCreeps = Object.values(Game.creeps).filter((creep) => {
        const memory = creep.memory as CreepBotMemory;
        return memory.home === spawn.room.name && memory.notfall;
      });

    for (const roomName in botGlobal.room) {
      const config = botGlobal.room[roomName];
      if (!config) continue;
      const workroom = config.room;

      if (emergencyCreeps.length > 0 && workroom !== spawn.room.name) {
        logger.logWorkroom(workroom, `has NotfallCreep! >> ${JSON.stringify(emergencyCreeps)}`);
        continue;
      }

      const transfer = botGlobal.transfer[workroom];
      if (transfer?.source.includes(spawn.room.name) && jobs.transfer!.spawn(spawn, workroom)) {
        logger.logWorkroom(workroom, "Spawn Transfer");
        break;
      }

      const roomMemory = Memory.rooms[workroom] as { needDefence?: boolean; invaderCore?: boolean };
      if (config.sendDefender && (roomMemory.needDefence || roomMemory.invaderCore)) {
        jobs.defender!.spawn(spawn, workroom);
        logger.logWorkroom(workroom, "Spawn Defender");
        continue;
      }

      if (config.spawnRoom !== spawn.room.name && config.room !== spawn.room.name) continue;
      if (roomMemory.invaderCore) continue;

      logger.logWorkroom(workroom, "Spawn JobLoop");
      for (const jobName in jobs) {
        logger.logWorkroom(workroom, `Spawn Job: ${jobName}`);
        if (jobs[jobName]!.spawn(spawn, workroom)) break;
      }
      if (spawn.spawning) break;
    }
  }
}
