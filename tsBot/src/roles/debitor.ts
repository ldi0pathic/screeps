/**
 * Rolle "debitor": holt Energie/Mineralien aus dem Arbeitsraum (Storage,
 * Container, Links, Tombstones, Drops, Ruinen) und bringt sie zum Heimatraum
 * (Spawn, Turm, Terminal, Storage, Lab). Kümmert sich außerdem um das eigene
 * Spawnen inklusive Notfallspawn und Freelancer-Modus.
 *
 * Ursprünglich aus `prod/creep.debitor.js` übernommen. Diese Datei enthält
 * Fehlerkorrekturen gegenüber dem alten Bot, siehe `docs/aenderungen.md`.
 */

import { bot } from "../globals";
import { energySources } from "../controller/room-inventory";
import { linksDeliver } from "../controller/link-list";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import { carryMove } from "../creep/body";
import { RoundTrip, type RoundTripKeys } from "../creep/round-trip";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

const role = "debitor";

/** Raum-Memory-Schlüssel der gemessenen Umlaufdimensionierung, siehe `RoundTrip`. */
const ROUND_TRIP_KEYS: RoundTripKeys = { samples: "distances", size: "needDebitorSize", count: "needDebitors" };
const NEVER_SELL = {
    "energy": true,
    "power": true,
    "pixel": true,
    "XUH2O": true,
    "XUHO2": true,
    "XKHO2": true,
    "XKH2O": true,
    "XZH2O": true,
    "XZHO2": true,
    "XLH2O": true,
    "XLHO2": true,
    "XGH2O": true,
    "XGHO2": true
};

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Debitor implements CreepRole {
    /** Holt Energie/Mineralien aus dem Arbeitsraum und transportiert sie in den Heimatraum. */
    doJob(creep: Creep): void {

        if (!creep.memory.mineral)
            creep.memory.mineral = RESOURCE_ENERGY;

        creep.checkHarvest(
            () => this.recordRoundTrip(creep),
            () => {
                creep.memory.mineral = RESOURCE_ENERGY;
                this.recordRoundTrip(creep);
            }
        );

        if (creep.memory.home != creep.memory.workroom)
            creep.memory.distance = creep.memory.distance + 1;

        if (creep.checkInvasion()) {
            if (creep.room.name == creep.memory.workroom) {
                if (creep.memory.harvest) {
                    if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                    if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
                }
                else {
                    if (creepBase.TransportEnergyToHomeTower(creep)) return;
                }
                return;
            }

            return;
        };

        if (creep.memory.notfall) {
            if (creep.memory.harvest) {
                if (creepBase.harvestControllerLink(creep, creep.memory.mineral)) return;
                if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
                if (creepBase.harvestNotfall(creep)) return;

                if (creep.room.energyAvailable < 1000 && creep.store.getUsedCapacity() > 0) {
                    creep.memory.harvest = false;
                }
            }
            else {
                if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
                if (creepBase.TransportEnergyToHomeTower(creep)) return;
            }
            return;
        }

        if (creep.memory.harvest) {

            if (creepBase.goToWorkroom(creep)) return;


            if (creepBase.harvestCompleteRoomTombstones(creep)) return;
            if (creepBase.harvestRoomDrops(creep, creep.memory.mineral)) return;

            if (creepBase.harvestRoomRuins(creep, creep.memory.mineral)) return;

            if (creepBase.harvestMyContainer(creep, creep.memory.mineral)) return;

            const storage = creep.room.storage;
            const terminal = creep.room.terminal;

            if (storage && terminal && terminal.store.getFreeCapacity() > 50000) {

                const resources = Object.keys(storage.store).filter(r =>

                    (storage.store as any)[r] > 100 && !(NEVER_SELL as any)[r]
                ).filter(f => f != "energy");

                if (resources.length > 0) {

                    const resource = resources[0]!; // nimm erstes gefundenes (nicht wie prod/creep.debitor.js nur resource[0])
                    creep.memory.mineral = resource;
                    if (creepBase.harvestRoomStorage(creep, resource)) return;
                }
            }

            if (creep.memory.container == '' && creep.room.name == creep.memory.workroom) {
                if (creep.room.energyAvailable >= creep.room.energyCapacityAvailable * 0.99) {
                    if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
                    if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                }
                else {
                    if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                    if (creepBase.harvestRoomContainer(creep, creep.memory.mineral, 0.25)) return;
                }

                if (creep.room.energyAvailable < 1000 && creep.store.getUsedCapacity() > 0) {
                    creep.memory.harvest = false;
                }
            }
            else {
                if (creepBase.harvestRoomStorage(creep, creep.memory.mineral)) return;
                if (creep.store.getUsedCapacity() > creep.store.getFreeCapacity())
                {
                    creep.memory.harvest = false;
                }
            }

            if (creepBase.goToRoomFlag(creep)) return;
            return;
        }

        if (creepBase.goToMyHome(creep)) return;


        if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
            if (creepBase.TransportToHomeTerminal(creep)) return;
            if (creepBase.TransportToHomeStorage(creep)) return;
        }
        else if (creep.memory.home == creep.memory.workroom) {
            if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
            if (creepBase.TransportEnergyToHomeTower(creep)) return;
            if (creepBase.TransportToHomeTerminal(creep)) return;
            if (creepBase.TransportToHomeStorage(creep)) return;
            if (creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY)) return;

        }
        else {
            if (creepBase.TransportToHomeTerminal(creep)) return;
            if (creepBase.TransportToHomeStorage(creep)) return;
            if (creepBase.TransportEnergyToHomeSpawn(creep)) return;
            if (creepBase.TransportEnergyToHomeTower(creep)) return;
            if (creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY)) return;

        }

        return;
    }

    /**
     * Nimmt für `checkHarvest` eine Streckenmessung auf, solange die
     * Umlaufgröße für den Arbeitsraum noch nicht feststeht. Kein Effekt, wenn
     * Arbeits- und Heimatraum identisch sind (kein Remote-Umlauf).
     */
    private recordRoundTrip(creep: Creep): void {
        if (creep.memory.home == creep.memory.workroom)
            return;

        const roundTrip = new RoundTrip(creep.memory.workroom, ROUND_TRIP_KEYS);
        if (roundTrip.record(creep.memory.distance)) {
            creep.memory.distance = 0;
        }
    }

    /**
     *
     * @param {StructureSpawn} spawn
     */
    private bodyFor(spawn: StructureSpawn, workroom: string, mineraltype: string, containerId: string) {
        // Mineralien werden in kleinen Mengen geholt, dafür genügen zwei Paare.
        if (mineraltype != RESOURCE_ENERGY) {
            return carryMove(2);
        }

        // Fremder Raum: die Ladung folgt der Wegstrecke, nicht der Energie des
        // Spawnraums. Reicht ein Creep für die Strecke nicht, werden mehrere
        // kleinere geschickt (`needDebitors`).
        if (spawn.room.name != workroom) {
            const roundTrip = new RoundTrip(workroom, ROUND_TRIP_KEYS);
            const maxSetsForEnergy = BODIES.debitor.setsFor(spawn.room.energyCapacityAvailable);
            const carry = roundTrip.carryFor(maxSetsForEnergy);
            return carryMove(carry as number);
        }

        // Heimatraum ohne zugeordneten Container: kleineres Profil, der Creep läuft mehr.
        if (containerId == '') {
            return BODIES.debitorWithoutContainer.build(spawn.room.energyCapacityAvailable);
        }

        return BODIES.debitor.build(spawn.room.energyCapacityAvailable);
    }

    /** Spawnt einen Debitor für `workroom`, falls Bedarf besteht (inklusive Freelancer- und Notfallmodus). */
    spawn(spawn: StructureSpawn, workroom: string): boolean {
        if (bot.room[workroom]!.transferEnergie && spawn.room.name != workroom || spawn.room.name != workroom && !Memory.rooms[workroom]!.claimed)
            return false;

        // Heimatraum mit Storage: dort übernehmen `filler` (Storage → Spawn,
        // Extensions, Türme) und `hauler` (Quellcontainer → Storage). Der
        // Debitor bleibt der Remote-Hauler und der Allrounder für Räume **ohne**
        // Storage — die drei Bedingungen schließen sich damit gegenseitig aus,
        // es kann keinen Raum geben, der von beiden oder von keinem bedient wird.
        //
        // Bewusst am Bauwerk festgemacht und nicht am RCL: ein Raum kann RCL 4
        // erreicht haben, ohne das Storage gebaut zu haben.
        if (spawn.room.name == workroom && spawn.room.storage)
            return false;

        // Ein Quellcontainer mit Link braucht keinen Debitor — aber nur, wenn das
        // Linknetz die Energie auch wirklich abliefert. Ohne Empfänger am Storage
        // bliebe sie im Quell-Link liegen und der Raum verhungerte.
        if (bot.room[workroom]!.sendDebitor && bot.room[workroom]!.sendMiner && (!Memory.rooms[workroom]!.hasLinks || !linksDeliver(workroom))) {
            for (const sourceId of energySources(workroom)) {
                if (!Game.getObjectById(sourceId))
                    continue;

                if (this._spawn(spawn, workroom, sourceId, RESOURCE_ENERGY))
                    return true;
            }
        }
        else if (bot.room[workroom]!.sendFreeDebitor) {
            if (this._spawn(spawn, workroom, '', RESOURCE_ENERGY)) //Freelancer B)
                return true;
        }

        return false;
    }

    /**
     *
     * @param {StructureSpawn} spawn
     * @param {String} workroom
     * @param {String} container
     * @param {String} mineraltype
     */
    private _spawn(spawn: StructureSpawn, workroom: string, source: any, mineraltype: string) {
        bot.logWorkroom(workroom, 'here');
        let containerId = ''
        if (source != '') {
            var source: any = Game.getObjectById(source);
            let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: { structureType: STRUCTURE_CONTAINER }
            });

            if (container.length == 0)
                return false;

            containerId = container[0].id;

            var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                creep.memory.workroom == workroom &&
                creep.memory.container == containerId &&
                !creep.memory.notfall &&
                (creep.ticksToLive! > 100 || creep.spawning)
            ).length;

            if (!Memory.rooms[workroom]!.needDebitors)
                Memory.rooms[workroom]!.needDebitors = 1;

            if (Memory.rooms[workroom]!.needDebitors <= count)
                return false;

            let link = container[0].pos.findInRange(FIND_STRUCTURES, 1, {
                filter: { structureType: STRUCTURE_LINK }
            });

            if (link.length > 0) {
                Memory.rooms[workroom]!.hasLinks = true;

                // Vorher stand hier `Memory.rooms[workroom].useLinks` — einen
                // solchen Memory-Schlüssel setzt niemand, die Prüfung war also
                // immer falsch und der Zweig tot.
                if (linksDeliver(workroom))
                    return false;
            }
        }
        else {
            bot.logWorkroom(workroom, '2');
            var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                creep.memory.workroom == workroom &&
                creep.memory.container == '' &&
                !creep.memory.notfall &&
                (creep.ticksToLive! > 100 || creep.spawning)
            ).length;

            if (bot.room[workroom]!.debitorAsFreelancer! <= count)
                return false;
            bot.logWorkroom(workroom, '3');
            containerId = '';
        }

        var profil = this.bodyFor(spawn, workroom, mineraltype, containerId);
        bot.logWorkroom(workroom, '4');
        //wenn im aktuellen raum kein Debitor ist

        // `distance: 0` wie beim Transfer: ohne Startwert rechnet der erste Tick
        // `undefined + 1`, und der Streckenzähler steht auf `NaN`. Im Spiel heilt
        // das über die JSON-Serialisierung von `Memory`, im Testgeschirr nicht.
        if (!creepBase.spawn(spawn, profil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: mineraltype, container: containerId, notfall: false, distance: 0 })) {
            if (_.filter(Game.creeps, (creep: Creep) => creep.memory.role == role && creep.memory.workroom == workroom).length == 0 && spawn.room.name == workroom) {
                console.log("[" + spawn.room.name + "|" + workroom + "]Notfallspawn Debitor");
                var min = Math.min(Math.max(parseInt((spawn.room.energyAvailable / 100) as any), 1), 16);
                profil = Array(min).fill(CARRY).concat(Array(min).fill(MOVE));
                mineraltype = RESOURCE_ENERGY;
                return creepBase.spawn(spawn, profil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: mineraltype, container: '', notfall: true })
            }
            return false;
        }
        return true;
    }
}

export default new Debitor();
