/**
 * Rolle "filler": Storage → Spawn, Extensions, Türme im eigenen Heimatraum.
 *
 * Ersetzt den bisherigen Freelancer-Debitor (`memory.container === ''`,
 * `sendFreeDebitor`/`debitorAsFreelancer`) und den Heimatraum-Anteil des
 * Debitors. Der Grund für die eigene Rolle ist CPU, nicht Verhalten:
 * `Debitor.doJob` bedient vier Jobs in einer `if`-Kaskade, und jeder Creep
 * zahlt auch für die Bedingungen der Jobs mit, die er nicht hat — Tombstones,
 * Drops, Ruinen, Mineralienverkauf, Terminal, Labs. Der Filler tut deshalb
 * wenig und immer dasselbe: er hat weder Fernziel noch Ausweichjob, siehe
 * `docs/plans/10-logistikrollen.md`.
 *
 * Rollenname. Steht im Creep-Memory des laufenden Spiels und darf sich
 * danach nicht mehr ändern.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

const role = "filler";

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Filler implements CreepRole {
    /** Holt Energie aus dem Storage (Rückfall: Quellcontainer) und verteilt sie an Spawn und Türme. */
    doJob(creep: Creep): void {
        // Ohne Rückrufe: die Distanzmessung in den beiden Parametern nutzt nur
        // der Debitor für seine Remote-Dimensionierung.
        creep.checkHarvest();

        if (creep.memory.harvest) {
            if (creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY)) return;
            // Rückfall, wenn das Storage leer ist: die Quellcontainer. Der `hauler`
            // füllt das Storage, aber in der Lücke soll der Spawn nicht verhungern.
            if (creepBase.harvestRoomContainer(creep, RESOURCE_ENERGY, 0.25)) return;
            return;
        }

        if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
        if (creepBase.TransportEnergyToHomeTower(creep)) return;

        // Ist nichts zu füllen, bleibt der Filler beladen stehen statt die
        // Ladung ins Storage zurückzugeben: er ist damit sofort bereit, wenn
        // die nächste Extension leerläuft. `TransportToHomeStorage` würde
        // hier ohnehin nichts tun, weil `creep.memory.fromId` noch auf dem
        // Storage steht, aus dem er gerade geholt hat.
    }

    /** Spawnt Filler für `workroom`, solange dort ein Storage steht und Logistik gewünscht ist. */
    spawn(spawn: StructureSpawn, workroom: string): boolean {
        if (spawn.room.name != workroom)
            return false;

        if (!bot.room[workroom]!.sendDebitor)
            return false;

        // Bewusst am Bauwerk festgemacht, nicht am RCL: ein Raum kann RCL 4
        // erreicht haben, ohne das Storage gebaut zu haben. Ohne Storage gibt
        // es nichts, woraus der Filler schöpft — dann bleibt der Debitor als
        // Allrounder zuständig.
        if (!spawn.room.storage)
            return false;

        // Ein Filler reicht nach Durchsatz: bei zwei Quellen kommen 20 Energie
        // je Tick herein, und bei rund zehn Ticks Umlauf (Storage → Extension
        // → Storage) braucht das nach der Formel in
        // `docs/knowledge/efficiency/energy-economy.md`
        // (`ceil(energie_pro_tick × umlauf / 50)`) vier CARRY. Die Config-Zahl
        // bleibt als Obergrenze erhalten, damit Räume, die heute mehr
        // Freelancer bestellen, nichts verlieren.
        const wanted = Math.max(1, bot.room[workroom]!.debitorAsFreelancer ?? 0);

        const count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
            creep.memory.workroom == workroom &&
            (creep.ticksToLive! > 100 || creep.spawning)
        ).length;

        if (count >= wanted)
            return false;

        const profil = BODIES.debitorWithoutContainer.build(spawn.room.energyCapacityAvailable);

        if (creepBase.spawn(spawn, profil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: RESOURCE_ENERGY, container: '', notfall: false }))
            return true;

        // Notfallspawn: lebt kein Filler mehr im Raum, würde der Spawn ohne
        // ihn verhungern — deshalb ein Minimalprofil aus der verfügbaren
        // (nicht der maximalen) Energie, damit auch ein junger Raum sich
        // selbst aus der Lage befreien kann. Muster aus `roles/debitor.ts::_spawn`.
        //
        // **`notfall` bleibt hier bewusst `false`.** Das Flag steuert im Debitor
        // einen eigenen Zweig in `doJob`, den der Filler nicht hat — es hätte
        // hier nur eine Nebenwirkung: `controller/spawn.ts` überspringt für
        // einen Spawn, unter dessen Heimatcreeps ein `notfall` steht, das
        // Spawnen **aller anderen** Arbeitsräume. Ein Notfallfiller würde die
        // Remote-Räume also bis zu 1500 Ticks lang blockieren, und genau diese
        // Falle hat der Notfallminer schon einmal gestellt (siehe `miner.ts`).
        if (_.filter(Game.creeps, (creep: Creep) => creep.memory.role == role && creep.memory.workroom == workroom).length == 0) {
            console.log("[" + spawn.room.name + "|" + workroom + "]Notfallspawn Filler");
            const min = Math.min(Math.max(parseInt((spawn.room.energyAvailable / 100) as any), 1), 16);
            const notfallProfil = Array(min).fill(CARRY).concat(Array(min).fill(MOVE));
            return creepBase.spawn(spawn, notfallProfil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: RESOURCE_ENERGY, container: '', notfall: false });
        }

        return false;
    }
}

export default new Filler();
