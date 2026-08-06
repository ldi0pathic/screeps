/** Der TypeScript-Einstieg des Bots. */

// Muss als erstes geladen werden: das Modul füllt `global.*` per Seiteneffekt.
import "./config";

import * as controllerMemory from "./controller/memory";
import * as timer from "./controller/timing";
import { bot } from "./globals";
import * as prof from "./profiler";
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

/**
 * Führt einen Abschnitt des Schedulers gemessen aus und hält einen Fehler darin
 * vom Rest des Ticks fern.
 *
 * Kritischer und regulärer Teil benutzen bewusst **denselben** Messabschnitt
 * (`SECTION.timing`), damit die Zahlen beider Hälften vergleichbar bleiben.
 * `end()` steht hinter dem `catch`: ein geworfener Fehler hat CPU gekostet und
 * gehört mitgezählt.
 */
function runTimed(kind: string, label: string, step: () => void): void {
  prof.begin(prof.SECTION.timing);
  try {
    step();
  } catch (error) {
    reportError(kind, `${label}\n${(error as Error)?.stack ?? String(error)}`);
  }
  prof.end(prof.SECTION.timing);
}

// Registriert die Prototyp-Erweiterungen vor dem ersten Tick.
// Reihenfolge wie in `prod/prototype.js`: erst die Creep-Checks, dann der Markt.
installCreepChecks();
installTerminalMarket();

/**
 * Rollentabelle mit CPU-Messung. Einmal beim Modulladen umhüllt, damit
 * `roles/index.ts` und die zehn Rollendateien keinen Profiler-Aufruf enthalten
 * müssen. Die Schlüsselreihenfolge bleibt erhalten — sie *ist* die
 * Spawn-Priorität in `controller/spawn.ts`.
 */
const measuredJobs = prof.wrapRoles(jobs);

export function loop(): void {
  prof.tick();

  // Zuerst, nicht zuletzt: Raum-Memory und Türme. Greift das CPU-Limit während
  // der Creep-Schleife, bricht das Spiel den Tick ab und alles Spätere fällt
  // stillschweigend aus — Turmfeuer darf davon nie betroffen sein.
  runTimed("timing.kritisch", "controller/timing (kritischer Teil)", () => {
    timer.controllCritical();
  });

  prof.begin(prof.SECTION.rooms);
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
  prof.end(prof.SECTION.rooms);

  prof.begin(prof.SECTION.creeps);
  let processedCreeps = 0;

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
    const job = measuredJobs[creepMemory.role];
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
    // Vor dem Aufruf zählen: ein Creep, dessen Rolle wirft, hat trotzdem CPU
    // gekostet und gehört in die Bezugsgröße für "CPU pro Creep".
    processedCreeps += 1;

    try {
      job.doJob(creep);
    } catch (error) {
      reportError(
        `rolle:${creepMemory.role}`,
        `Job: ${creepMemory.role} (${name})\n${(error as Error)?.stack ?? String(error)}`,
      );
    }
  }
  prof.end(prof.SECTION.creeps);

  runTimed("timing", "controller/timing", () => {
    timer.controll();
  });

  // Muss die letzte Anweisung sein: `Game.cpu.getUsed()` wird hier als
  // Gesamtwert des Ticks gelesen. Was danach käme, wäre nicht mitgezählt.
  prof.endTick(processedCreeps);
}
