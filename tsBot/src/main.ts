/** Der TypeScript-Einstieg des Bots. */

import * as controllerMemory from "./controller/memory";
import * as timer from "./controller/timing";
import { installCreepChecks } from "./prototypes/creep-checks";

type VisualRoomMemory = RoomMemory & {
  nuke?: boolean;
  nukepos?: RoomPosition[];
};

type BotCreepMemory = CreepMemory & {
  role?: string;
};

interface CreepJob {
  doJob(creep: Creep): void;
}

const botGlobal = global as typeof global & {
  room: Record<string, unknown>;
};

const botMemory = Memory as Memory & {
  init?: boolean;
};

// Die Controller und Rollen werden in den folgenden Schritten einzeln aus
// `legacy/` migriert. Bis dahin behalten sie ihre CommonJS-Schnittstelle.
const jobs: Record<string, CreepJob> = require("./legacy/creep.jobs.cts");

// Registriert die Prototyp-Erweiterungen vor dem ersten Tick.
installCreepChecks();
require("./legacy/prototype.terminal.market.cts");

export function loop(): void {
  for (const name in botGlobal.room) {
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
