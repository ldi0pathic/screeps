import * as cpuBudget from "./cpu-budget";
import * as defenceController from "./defence";
import * as linkPlannerController from "./link-planner";
import * as linksController from "./links";
import * as memoryController from "./memory";
import * as rebuildController from "./rebuild";
import * as spawnController from "./spawn";
import { bot } from "../globals";
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

  // Terminal und Markt sind die niedrige Stufe: ein ausgelassener Verkauf
  // kostet einen Tick Handel, ein abgebrochener Tick kostet die Türme.
  begin(SECTION.terminal);
  const terminalIds = botMemory.terminals;
  if (cpuBudget.mayRunLow() && terminalIds && terminalIds.length > 0) {
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

  if (tick % 5 === 0 && cpuBudget.mayRunNormal()) {
    begin(SECTION.spawn);
    spawnController.spawn();
    end(SECTION.spawn);
  }

  // Jeden Tick, nicht mehr alle sieben: `check()` staffelt selbst und nimmt sich
  // je Tick nur die Räume vor, die dran sind. Die Häufigkeit je Raum bleibt bei
  // sieben Ticks, aber die Spitze verteilt sich — und die Spitze entscheidet, ob
  // der Tick durchläuft. Ohne fällige Räume ist der Durchgang eine leere Schleife.
  if (cpuBudget.mayRunNormal()) {
    begin(SECTION.defence);
    defenceController.check();
    end(SECTION.defence);
  }

  if (tick % 11 === 0 && cpuBudget.mayRunLow()) {
    begin(SECTION.status);
    memoryController.writeStatus();
    end(SECTION.status);
  }

  // Die Tagesjobs sind die niedrigste Stufe: sie laufen ohnehin nur einen Tick
  // je Paar aus (Job, Raum) und holen einen ausgelassenen Durchgang am nächsten
  // Tag nach. Ein Ausfall kostet hier am wenigsten.
  if (cpuBudget.mayRunLow()) {
    begin(SECTION.daily);
    daylie();
    end(SECTION.daily);
  }
}

/** Länge der Tagessequenz in Ticks. */
const DAY_TICKS = 86_400 / 3;

/**
 * Tagesjobs, die je Raum einzeln laufen können — **einer je Tick**.
 *
 * Vorher bearbeitete jeder dieser Jobs in seinem einen Tick **alle** Räume; bei
 * neun Räumen fielen damit neun Raumscans zusammen. Die Summe ändert sich durch
 * die Staffelung nicht, wohl aber die Spitze — und die entscheidet, ob der Tick
 * durchläuft: greift das CPU-Limit, bricht das Spiel den Rest stillschweigend
 * ab (Plan 05, Befund 2).
 *
 * `section` ist der Profilerabschnitt, sofern der Job einen eigenen hat; die
 * übrigen laufen unter `timing.daily`.
 */
const STAGGERED_DAILY_JOBS: Array<{ section?: string; run: (roomName: string) => void }> = [
  { run: memoryController.findAndSaveRoomWalls },
  { run: memoryController.findAndSaveRoomContainer },
  { run: memoryController.findAndSaveRoomTower },
  { section: SECTION.roads, run: rebuildController.rebuildRoads },
  { section: SECTION.linkplan, run: linkPlannerController.planReceiverLinks },
];

/** Erster Tick der Tagessequenz, ab dem die gestaffelten Jobs laufen. */
const STAGGER_START = 2;

export function daylie(): void {
  const slot = Game.time % DAY_TICKS;

  // Diese beiden bleiben ungestaffelt: sie bauen **eine** Liste über alle Räume
  // auf und müssen sie in einem Zug schreiben. Häppchenweise wäre sie
  // zwischendurch unvollständig.
  if (slot === 0) {
    memoryController.clear();
    return;
  }
  if (slot === 1) {
    memoryController.findAndSaveTerminals();
    return;
  }

  const roomNames = Object.keys(bot.room);
  if (roomNames.length === 0) return;

  // Ein Paar aus (Job, Raum) je Tick. Die Reihenfolge der Schlüssel eines
  // Objekts ist für Stringschlüssel die Einfügereihenfolge, also stabil —
  // ändert sich `config.ts`, verschiebt sich die Zuordnung einmalig, was
  // folgenlos ist, weil jeder Job für sich steht.
  const index = slot - STAGGER_START;
  if (index < 0 || index >= STAGGERED_DAILY_JOBS.length * roomNames.length) return;

  const job = STAGGERED_DAILY_JOBS[Math.floor(index / roomNames.length)]!;
  const roomName = roomNames[index % roomNames.length]!;

  if (!job.section) {
    job.run(roomName);
    return;
  }

  begin(job.section);
  job.run(roomName);
  end(job.section);
}
