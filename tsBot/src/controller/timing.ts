import * as defenceController from "./defence";
import * as memoryController from "./memory";
import * as rebuildController from "./rebuild";
import * as spawnController from "./spawn";
// Messpunkte für den CPU-Profiler: klammern die Abschnitte des Schedulers ein.
import { begin, end, SECTION } from "../profiler";

interface TerminalMarket extends StructureTerminal {
  sell(): void;
  buyPixel(): void;
}

type BotMemory = Memory & {
  terminals?: string[];
};

const botMemory = Memory as BotMemory;

export function controll(): void {
  const tick = Game.time;

  memoryController.init();
  begin(SECTION.tower);
  defenceController.tower();
  end(SECTION.tower);

  begin(SECTION.terminal);
  const terminalIds = botMemory.terminals;
  if (terminalIds && terminalIds.length > 0) {
    const terminalId = terminalIds[Game.time % terminalIds.length];
    if (terminalId) {
      const terminal = Game.getObjectById(terminalId as Id<StructureTerminal>) as TerminalMarket | null;
      if (terminal) {
        const fill = terminal.store.getUsedCapacity() / 300_000;
        if (fill > 0.8) {
          terminal.sell();
          terminal.sell();
        }
        terminal.sell();
        terminal.buyPixel();
      }
    }
  }
  end(SECTION.terminal);

  if (tick % 3 === 0 && Game.cpu.bucket === 10_000) {
    begin(SECTION.pixel);
    Game.cpu.generatePixel();
    end(SECTION.pixel);
  }

  if (tick % 5 === 0) {
    begin(SECTION.spawn);
    spawnController.spawn();
    end(SECTION.spawn);
  }

  if (tick % 7 === 0) {
    begin(SECTION.defence);
    defenceController.check();
    end(SECTION.defence);
  }

  if (tick % 11 === 0) {
    begin(SECTION.status);
    memoryController.writeStatus();
    end(SECTION.status);
  }

  begin(SECTION.daily);
  daylie();
  end(SECTION.daily);
}

export function daylie(): void {
  const dayTicks = 86_400 / 3;

  switch (Game.time % dayTicks) {
    case 0:
      memoryController.clear();
      return;
    case 1:
      memoryController.findAndSaveRoomWalls();
      return;
    case 2:
      memoryController.findAndSaveRoomContainer();
      return;
    case 3:
      memoryController.findAndSaveRoomTower();
      return;
    case 4:
      memoryController.findAndSaveTerminals();
      return;
    case 5:
      rebuildController.rebuildRoads();
      return;
  }
}
