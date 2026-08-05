/**
 * Rollentabelle: Abbildung von `creep.memory.role` auf das Rollenobjekt.
 *
 * Ersetzt `prod/creep.jobs.js`. **Die Reihenfolge der Properties ist die
 * Spawn-Priorität** in `controller/spawn.ts` – nicht umsortieren. Die
 * Schlüssel stehen im laufenden Spiel im Creep-Memory und dürfen sich nicht
 * ändern.
 *
 * Die Rollen sind Klassen mit `@profile` und exportieren ihre Instanz als
 * Default. Deshalb stehen hier Default-Importe und nicht mehr
 * `import * as rolle` — an einem Modul-Namespace kann der Dekorator nicht
 * greifen, weil esbuild für `export function` Getter erzeugt und die
 * Wrapping-Mechanik bei Gettern aussteigt.
 */

import builder from "./builder";
import claimer from "./claimer";
import debitor from "./debitor";
import defender from "./defender";
import extupgrader from "./extupgrader";
import filler from "./filler";
import hauler from "./hauler";
import linkkeeper from "./linkkeeper";
import miner from "./miner";
import repairer from "./repairer";
import transfer from "./transfer";
import upgrader from "./upgrader";
import wally from "./wally";

/** Was jedes Rollenobjekt mindestens bereitstellt. */
export interface CreepRole {
  doJob(creep: Creep): void;
  spawn(spawn: StructureSpawn, workroom: string): boolean;
}

export const jobs: Record<string, CreepRole> = {
  // Ganz vorn mit Absicht: sind Spawn und Extensions leer, spawnt der Raum
  // überhaupt nichts mehr — auch keinen Ersatzfiller. Wer den Spawn füttert,
  // muss vor allen stehen, die daraus bezahlt werden.
  filler,
  debitor,
  // Weit vorn mit Absicht: ein voller Empfänger-Link nimmt nichts mehr an und
  // blockiert damit den Durchsatz aller Quell-Links, die auf ihn senden.
  linkkeeper,
  // Direkt hinter dem Linkkeeper: ohne Träger läuft der Quellcontainer über
  // und der Miner fördert ins Leere. Beides sind Durchsatzsperren.
  hauler,
  transfer,
  miner,
  claimer,
  builder,
  repairer,
  upgrader,
  extupgrader,
  defender,
  wally,
};
