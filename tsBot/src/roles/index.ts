/**
 * Rollentabelle: Abbildung von `creep.memory.role` auf das Rollenmodul.
 *
 * Ersetzt `prod/creep.jobs.js`. **Die Reihenfolge der Properties ist die
 * Spawn-Priorität** in `controller/spawn.ts` – nicht umsortieren. Die
 * Schlüssel stehen im laufenden Spiel im Creep-Memory und dürfen sich nicht
 * ändern.
 */

import * as builder from "./builder";
import * as claimer from "./claimer";
import * as debitor from "./debitor";
import * as defender from "./defender";
import * as extupgrader from "./extupgrader";
import * as miner from "./miner";
import * as repairer from "./repairer";
import * as transfer from "./transfer";
import * as upgrader from "./upgrader";
import * as wally from "./wally";

/** Was jedes Rollenmodul mindestens bereitstellt. */
export interface CreepRole {
  doJob(creep: Creep): void;
  spawn(spawn: StructureSpawn, workroom: string): boolean;
}

export const jobs: Record<string, CreepRole> = {
  debitor,
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
