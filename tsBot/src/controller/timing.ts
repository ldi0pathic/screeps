import * as defenceController from "./defence";
import * as linkPlannerController from "./link-planner";
import * as linksController from "./links";
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

/**
 * Der Teil des Ticks, der niemals ausfallen darf — gerufen von `main.ts`
 * **vor** der Creep-Schleife.
 *
 * Greift das CPU-Limit während der Creep-Schleife, bricht das Spiel den Tick
 * ab: alles danach findet stillschweigend nicht mehr statt. Vorher lagen die
 * Türme hinter allen Creeps und hätten in so einem Tick nicht geschossen.
 * Turmfeuer ist taktisch — ein ausgelassener Spawn kostet einen Tick, ein
 * ausgelassener Turmschuss kann den Raum kosten.
 *
 * Der Spawncontroller bleibt bewusst **hinten**: er läuft nur alle fünf Ticks,
 * kostet je Aufruf ein Vielfaches der Türme, und ein Tick Verzögerung beim
 * Spawnen ist folgenlos. Einen eigenen Einstieg nur für den Notfallspawn gibt
 * es nicht; ihn herauszulösen wäre ein Umbau des Spawncontrollers und gehört
 * in einen eigenen Schritt (Plan 05).
 *
 * `memoryController.init()` steht hier, weil es vor jedem Zugriff auf
 * `Memory.rooms` laufen muss — auch vor der Visualisierungsschleife in `main.ts`.
 */
export function controllCritical(): void {
  memoryController.init();

  begin(SECTION.tower);
  defenceController.tower();
  end(SECTION.tower);
}

export function controll(): void {
  const tick = Game.time;

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

  begin(SECTION.links);
  // Die Linkliste wird alle 1000 Ticks neu erhoben statt in der Tagessequenz:
  // sie heilt sich zwar selbst, wenn ein Link **verschwindet** (eine Id ohne
  // Objekt verwirft die Liste), aber nicht, wenn einer **dazukommt** — und
  // genau das tut der Linkplaner. 28 800 Ticks wären dafür zu lang.
  if (tick % 1000 === 0) {
    linksController.discoverAll();
  }
  // Jeden Tick, nicht getaktet: der empfangende Link hat keinen Cooldown, es
  // gibt also nichts, worauf man warten könnte — jeder ausgelassene Tick wäre
  // verlorener Durchsatz. Ohne sendebereiten Link ist der Durchgang billig.
  linksController.sendAll();
  end(SECTION.links);

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
      begin(SECTION.roads);
      rebuildController.rebuildRoads();
      end(SECTION.roads);
      return;
    case 6:
      begin(SECTION.linkplan);
      linkPlannerController.planReceiverLinks();
      end(SECTION.linkplan);
      return;
  }
}
