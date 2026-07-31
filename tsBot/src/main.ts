/** Der TypeScript-Einstieg des Bots. */

// Muss als erstes geladen werden: das Modul füllt `global.*` per Seiteneffekt.
import "./config";

import * as controllerMemory from "./controller/memory";
import * as timer from "./controller/timing";
import { bot } from "./globals";
import { installCreepChecks } from "./prototypes/creep-checks";
import { installTerminalMarket } from "./prototypes/terminal-market";
import { jobs } from "./roles";

type VisualRoomMemory = RoomMemory & {
  nuke?: boolean;
  nukepos?: RoomPosition[];
};

type BotCreepMemory = CreepMemory & {
  role?: string;
};

const botMemory = Memory as Memory & {
  init?: boolean;
};

// Registriert die Prototyp-Erweiterungen vor dem ersten Tick.
// Reihenfolge wie in `prod/prototype.js`: erst die Creep-Checks, dann der Markt.
installCreepChecks();
installTerminalMarket();

export function loop(): void {
  for (const name in bot.room) {
    const room = Game.rooms[name];

    try {
      const roomMemory = Memory.rooms[name] as VisualRoomMemory;
      if (roomMemory.nuke && roomMemory.nukepos!.length > 0) {
        for (const nuke of roomMemory.nukepos!) {
          new RoomVisual(name).circle(nuke.x, nuke.y, {
            fill: "transparent",
            radius: 5,
            stroke: "#ff0000",
          });
        }
      }
    } catch {
      botMemory.init = false;
      controllerMemory.init();
    }

    if (room?.controller?.my) {
      new RoomVisual(name).text(
        `${room.energyAvailable}/${room.energyCapacityAvailable}`,
        2,
        1,
        { color: "white", font: 0.8 },
      );
    }
  }

  for (const name in Memory.creeps) {
    const creep = Game.creeps[name];

    if (!creep) {
      delete Memory.creeps[name];
      continue;
    }

    const creepMemory = creep.memory as BotCreepMemory;
    if (!creepMemory.role) {
      if (creep.suicide() === OK) {
        delete Memory.creeps[name];
      }
      continue;
    }

    if (creep.spawning) {
      continue;
    }

    try {
      jobs[creepMemory.role]!.doJob(creep);
    } catch (error) {
      console.log(`Job: ${creepMemory.role}`);
      throw error;
    }
  }

  timer.controll();
}
