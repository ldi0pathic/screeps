/**
 * Spawncontroller: entscheidet, welcher Spawn welche Rolle für welchen
 * Arbeitsraum produziert.
 *
 * Verhaltensgleich zu `prod/controller.spawn.js`, aber idiomatisch
 * geschrieben (Stand aus der ersten Migrationsstufe, per Review gegen prod
 * geprüft). Die Reihenfolge der Entscheidungen — Notfall-Skip, Transfer,
 * Defender, Raumfilter, Rollenschleife — ist maßgeblich.
 */

import { bot } from "../globals";
import { jobs } from "../roles";

type CreepBotMemory = CreepMemory & {
  home?: string;
  notfall?: boolean;
};

export function spawn(): void {
  for (const spawnName in Game.spawns) {
    const spawn = Game.spawns[spawnName];
    if (!spawn || spawn.spawning) continue;

    const emergencyCreeps = Object.values(Game.creeps).filter((creep) => {
        const memory = creep.memory as CreepBotMemory;
        return memory.home === spawn.room.name && memory.notfall;
      });

    for (const roomName in bot.room) {
      const config = bot.room[roomName];
      if (!config) continue;
      const workroom = config.room;

      if (emergencyCreeps.length > 0 && workroom !== spawn.room.name) {
        bot.logWorkroom(workroom, `has NotfallCreep! >> ${JSON.stringify(emergencyCreeps)}`);
        continue;
      }

      const transfer = bot.transfer[workroom];
      if (transfer?.source.includes(spawn.room.name) && jobs.transfer!.spawn(spawn, workroom)) {
        bot.logWorkroom(workroom, "Spawn Transfer");
        break;
      }

      const roomMemory = Memory.rooms[workroom] as { needDefence?: boolean; invaderCore?: boolean };
      if (config.sendDefender && (roomMemory.needDefence || roomMemory.invaderCore)) {
        jobs.defender!.spawn(spawn, workroom);
        bot.logWorkroom(workroom, "Spawn Defender");
        continue;
      }

      if (config.spawnRoom !== spawn.room.name && config.room !== spawn.room.name) continue;
      if (roomMemory.invaderCore) continue;

      bot.logWorkroom(workroom, "Spawn JobLoop");
      for (const jobName in jobs) {
        bot.logWorkroom(workroom, `Spawn Job: ${jobName}`);
        if (jobs[jobName]!.spawn(spawn, workroom)) break;
      }
      if (spawn.spawning) break;
    }
  }
}
