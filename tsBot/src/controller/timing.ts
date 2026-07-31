import * as memoryController from "./memory";
import * as rebuildController from "./rebuild";
import * as spawnController from "./spawn";

interface DefenceController {
  check(): void;
  tower(): void;
}

interface TerminalMarket extends StructureTerminal {
  sell(): void;
  buyPixel(): void;
}

type BotMemory = Memory & {
  terminals?: string[];
};

const botMemory = Memory as BotMemory;
const defenceController: DefenceController = require("../legacy/controller.defence.cts");

export function controll(): void {
  const tick = Game.time;

  memoryController.init();
  defenceController.tower();

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

  if (tick % 3 === 0 && Game.cpu.bucket === 10_000) {
    Game.cpu.generatePixel();
  }

  if (tick % 5 === 0) {
    spawnController.spawn();
  }

  if (tick % 7 === 0) {
    defenceController.check();
  }

  if (tick % 11 === 0) {
    memoryController.writeStatus();
  }

  daylie();
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
