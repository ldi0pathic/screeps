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

/**
 * Bereits per Mail gemeldete Fehler, damit ein Dauerfehler nicht jeden Tick
 * eine Benachrichtigung auslöst. Die Menge lebt nur bis zum nächsten
 * Global-Reset — danach darf derselbe Fehler erneut melden, sonst würde ein
 * über Stunden bestehendes Problem irgendwann stillschweigend übergangen.
 */
const reportedErrors = new Set<string>();

/**
 * Meldet einen Fehler, ohne den Tick abzubrechen: Konsole bei jedem Auftreten,
 * Mail nur beim ersten Mal je Fehlerart.
 */
function reportError(kind: string, message: string): void {
  console.log(message);

  if (reportedErrors.has(kind)) return;
  reportedErrors.add(kind);
  Game.notify(message, 180);
}

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

    // Eine Rolle, die es nicht gibt (z. B. nach einer Umbenennung im Code),
    // darf den Tick nicht abbrechen. Der Creep wird übersprungen und nicht
    // suizidiert — sonst löscht eine Umbenennung die ganze Population.
    const job = jobs[creepMemory.role];
    if (!job) {
      reportError(
        `rolle-unbekannt:${creepMemory.role}`,
        `Creep ${name}: unbekannte Rolle "${creepMemory.role}"`,
      );
      continue;
    }

    // Fehler bleiben auf diesen Creep begrenzt. Vorher brach ein einzelner
    // defekter Creep den ganzen Tick ab, inklusive Türmen, Spawncontroller
    // und Verteidigungsscan.
    try {
      job.doJob(creep);
    } catch (error) {
      reportError(
        `rolle:${creepMemory.role}`,
        `Job: ${creepMemory.role} (${name})\n${(error as Error)?.stack ?? String(error)}`,
      );
    }
  }

  try {
    timer.controll();
  } catch (error) {
    reportError(
      "timing",
      `controller/timing\n${(error as Error)?.stack ?? String(error)}`,
    );
  }
}
