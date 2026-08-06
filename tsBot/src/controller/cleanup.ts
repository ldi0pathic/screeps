/**
 * Aufräumflagge für aufgegebene Räume: eine Flagge namens `cleanup`, mit der
 * der Betreiber auf Zuruf abräumt, was sonst erst der nächste Tagestick
 * erledigt (`memory.ts::clear()`, läuft nur bei `Game.time % 28800 === 0`).
 * Ohne diesen Knopf bleibt ein aus `bot.room` entfernter Raum bis zu einem Tag
 * lang in `Memory.rooms` stehen, `writeStatus()` meldet weiter Ereignisse aus
 * ihm, und seine Creeps arbeiten bis zu 1500 Ticks lang ins Leere.
 *
 * Bedienung, wie im Auftrag festgelegt:
 *   - gelb (`COLOR_YELLOW`): Bericht. Listet, was gelöscht *würde*. Ändert
 *     nichts, die Flagge bleibt stehen.
 *   - rot (`COLOR_RED`): Ausführen. Räumt auf, meldet das Ergebnis und
 *     entfernt die Flagge selbst.
 *   - jede andere Farbe: eine Zeile, welche Farben belegt sind, sonst nichts.
 *
 * Flankensteuerung wie bei der Profilerflagge (`profiler/flag.ts`,
 * `FlagSwitch.readRequest`): ausgelöst wird nur eine **Änderung** der Farbe,
 * die zuletzt verarbeitete Farbe steht in `Memory.cleanup.flagColor` und nicht
 * im Heap, damit ein Global-Reset keine stehende Flagge erneut auslöst.
 */

import { bot } from "../globals";
import * as memoryController from "./memory";

/** Name der Aufräumflagge. Ort und Raum sind gleichgültig, `Game.flags` ist weltweit. */
const FLAG_NAME = "cleanup";

/**
 * `src/types/screeps.d.ts` ist gesperrt, deshalb wie in `controller/memory.ts`
 * (Zeile 31-35 dort) lokal deklariert und gecastet, statt die Ambient-Typen zu
 * erweitern. `rooms` wird hier nur gelesen (Schlüsselliste für den Bericht),
 * `cleanup.flagColor` ist der Speicherplatz der Flankensteuerung.
 */
type CleanupMemory = Memory & {
  rooms?: Record<string, unknown>;
  cleanup?: { flagColor?: ColorConstant };
};

const cleanupMemory = Memory as CleanupMemory;

function rememberedColor(): ColorConstant | undefined {
  return cleanupMemory.cleanup?.flagColor;
}

/** `undefined` löscht die Notiz wieder — nötig, damit eine neu gesetzte Flagge erneut auslöst. */
function remember(color: ColorConstant | undefined): void {
  if (color === undefined) {
    delete cleanupMemory.cleanup;
    return;
  }
  cleanupMemory.cleanup ??= {};
  cleanupMemory.cleanup.flagColor = color;
}

/**
 * Raum-Namen aus `Memory.rooms`, für die es keinen Eintrag in `bot.room` gibt.
 *
 * Dieselbe Prüfung steht ein zweites Mal in `memoryController.clear()`, das
 * das eigentliche Löschen übernimmt (die Regel soll nur dort stehen). `clear()`
 * gibt aber nichts zurück, weil es beim Tagesjob niemanden interessiert, was
 * gelöscht wurde — für den Bericht hier wird die Liste deshalb noch einmal
 * gebildet. Das ist eine bewusst in Kauf genommene Verdopplung.
 */
function orphanedRooms(): string[] {
  const rooms = cleanupMemory.rooms;
  if (!rooms) return [];
  return Object.keys(rooms).filter(name => !bot.room[name]);
}

/**
 * Entscheidung des Betreibers, wörtlich: ein Creep gilt als betroffen, wenn
 * `workroom` ODER `home` nicht (mehr) in `bot.room` steht — nicht UND. Das
 * trifft ausdrücklich auch Creeps, deren `home` verwaist ist, während ihr
 * `workroom` noch lebt und sie dort gerade nützlich arbeiten:
 *
 * | workroom      | home          | Ergebnis                              |
 * | ------------- | ------------- | -------------------------------------- |
 * | weg           | da            | tot                                     |
 * | da            | weg           | tot — arbeitet noch nützlich, trotzdem  |
 * | weg           | weg           | tot                                     |
 * | da            | da            | lebt                                    |
 *
 * Fehlt `workroom` oder `home` im Memory ganz (kein String), gilt der Creep
 * ebenfalls als betroffen: ohne Heimat oder Arbeitsraum ist er ohnehin nicht
 * zuzuordnen.
 */
function isAffected(creep: Creep): boolean {
  const workroom = creep.memory.workroom;
  const home = creep.memory.home;
  if (!workroom || !home) return true;
  return !bot.room[workroom] || !bot.room[home];
}

function affectedCreeps(): Creep[] {
  return Object.values(Game.creeps).filter(isAffected);
}

function hasNothingToDo(orphaned: string[], creeps: Creep[]): boolean {
  return orphaned.length === 0 && creeps.length === 0;
}

/** Gelb: listet, was rot löschen würde. Ändert nichts. */
function report(): void {
  const orphaned = orphanedRooms();
  const creeps = affectedCreeps();

  if (hasNothingToDo(orphaned, creeps)) {
    console.log("[cleanup] Nichts zu tun: keine verwaisten Raeume, keine betroffenen Creeps.");
    return;
  }

  if (orphaned.length > 0) {
    console.log(`[cleanup] Raum-Memory ohne Config: ${orphaned.join(", ")}`);
  }
  console.log(`[cleanup] Creeps davon betroffen: ${creeps.length}`);
  for (const creep of creeps) {
    console.log(`  ${creep.name} (workroom ${creep.memory.workroom}, home ${creep.memory.home})`);
  }
  console.log("[cleanup] Nichts geaendert. Rot = ausfuehren.");
}

/** Rot: räumt tatsächlich auf. */
function execute(): void {
  const orphaned = orphanedRooms();
  const creeps = affectedCreeps();

  // Löschen übernimmt memoryController.clear(), nicht diese Funktion selbst —
  // die Regel, welcher Raum verwaist ist, soll nur an einer Stelle stehen.
  // Nebenwirkung, die hier niemanden überraschen soll: clear() löscht dabei
  // auch die `roads`-Liste konfigurierter Räume ohne `saveRoads` — reguläres
  // Tagesverhalten, hier nur vorgezogen, kein Schaden.
  memoryController.clear();

  let killed = 0;
  for (const creep of creeps) {
    const result = creep.suicide();
    if (result === OK) {
      killed += 1;
    } else {
      // Die Flagge ist nach diesem Aufruf weg, niemand sieht danach noch hin —
      // ein Fehlschlag (z. B. ERR_BUSY bei einem noch spawnenden Creep) muss
      // deshalb jetzt in die Konsole, nicht erst beim nächsten Blick.
      console.log(`[cleanup] suicide fehlgeschlagen fuer ${creep.name}: ${result}`);
    }
  }

  // `Memory.creeps[name]` wird hier bewusst nicht gelöscht: der Creep stirbt
  // erst am Tickende, und `main.ts` räumt das Creep-Memory ohnehin auf. Ein
  // sofortiges Löschen ließe den noch lebenden Creep im nächsten Tick mit
  // leerem Memory in seine Rolle laufen.
  if (hasNothingToDo(orphaned, creeps)) {
    console.log("[cleanup] Nichts zu tun, Flagge entfernt.");
    return;
  }

  const rooms = orphaned.length > 0 ? orphaned.join(", ") : "keine Raeume";
  console.log(`[cleanup] ${rooms} geloescht, ${killed} Creeps suizidiert.`);
}

/** Meldet, welche Farben belegt sind — für jede unbekannte Farbe der Flagge. */
function reportUnknownColor(): void {
  console.log(
    `[cleanup] Flagge "${FLAG_NAME}": diese Farbe ist nicht belegt. Belegt sind gelb=Bericht, rot=ausfuehren.`,
  );
}

/**
 * Einstiegspunkt für den Scheduler (`controller/timing.ts`), ein Aufruf je
 * Tick genügt. Ohne gesetzte Flagge kostet der Aufruf nur den Zugriff auf
 * `Game.flags[FLAG_NAME]` und den Farbvergleich — kein `find`, keine Schleife
 * über `Game.creeps`, kein Zugriff auf `Memory.rooms`.
 */
export function check(): void {
  const flag = Game.flags[FLAG_NAME];
  if (!flag) return;

  const previous = rememberedColor();
  if (flag.color === previous) return;

  if (flag.color === COLOR_YELLOW) {
    remember(flag.color);
    report();
    return;
  }

  if (flag.color === COLOR_RED) {
    execute();
    // Merken entfernen: die Flagge ist jetzt weg, eine später neu gesetzte
    // gelbe Flagge muss wieder auslösen können.
    remember(undefined);
    flag.remove();
    return;
  }

  remember(flag.color);
  reportUnknownColor();
}
