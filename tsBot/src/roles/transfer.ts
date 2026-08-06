/**
 * Rolle "transfer": bringt Energie/Mineralien aus dem Arbeitsraum (Ruinen,
 * Drops, Tombstones, Storage, Container) zum Heimatraum (Tower, Terminal,
 * Lab, Storage, Container) bzw. an bedürftige Builder.
 *
 * Inhaltlich identisch zu `prod/creep.transfer.js`.
 */

import { bot } from "../globals";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import { carryMove } from "../creep/body";
import { RoundTrip, type RoundTripKeys } from "../creep/round-trip";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

const role = "transfer";

/** Raum-Memory-Schlüssel der gemessenen Umlaufdimensionierung, siehe `RoundTrip`. Eigene Schlüssel, damit die Messreihe des Debitors für denselben Arbeitsraum unangetastet bleibt. */
const ROUND_TRIP_KEYS: RoundTripKeys = { samples: "transferDistances", size: "transferSize", count: "transferCount" };

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Transfer implements CreepRole {
    /** Sammelt Energie/Mineralien aus dem Arbeitsraum und bringt sie zum Heimatraum bzw. an bedürftige Builder. */
    doJob(creep: Creep) {

        if(!creep.memory.mineral)
            creep.memory.mineral = RESOURCE_ENERGY;

        creep.checkHarvest(
            () => this.recordRoundTrip(creep),
            () => this.recordRoundTrip(creep)
        );

        if (creep.memory.home != creep.memory.workroom)
            creep.memory.distance = creep.memory.distance + 1;

        if (creep.memory.harvest) {

            if(creep.room.name == creep.memory.workroom)
            {
                if (creepBase.harvestRoomRuins(creep, RESOURCE_ENERGY))return;
                if (creepBase.harvestRoomDrops(creep, RESOURCE_ENERGY))return;
                if (creepBase.harvestRoomTombstones(creep, RESOURCE_ENERGY))return;

                if(creep.store.getUsedCapacity() > 1)
                    creep.memory.harvest = false;
            }

            if(creepBase.goToMyHome(creep)) return;

            if(creepBase.harvestRoomStorage(creep,creep.memory.mineral)) return;
            if(creepBase.harvestRoomContainer(creep,creep.memory.mineral,0.25)) return;


            if(creepBase.goToRoomFlag(creep)) return;

            return;
        }

        if(creepBase.goToWorkroom(creep))return;
        if(creepBase.TransportEnergyToHomeTower(creep))return;
        if(creepBase.TransportToHomeTerminal(creep))return;
        if(creepBase.TransportToHomeLab(creep, RESOURCE_ENERGY))return;
        if(creepBase.TransportToHomeStorage(creep))return;

        if(creepBase.TransportToHomeContainer(creep, creep.memory.mineral))return;
        var other: any = creep.room.find(FIND_MY_CREEPS, {filter: (c: any) =>
            {
                return (c.memory.role == 'builder'  ) && c.store.getFreeCapacity() > 0
            }});

            if(other.length > 0)

            {
                switch(creep.transfer(other[0],RESOURCE_ENERGY, other[0].store.getFreeCapacity()))
                {
                    case ERR_NOT_IN_RANGE:
                        creep.moveTo(other[0]);
                        return true;
                    case OK:
                        return true;
                }
            }
        if(creepBase.goToRoomFlag(creep)) return;
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
    /** Spawnt einen Transfer für `workroom`, falls Bedarf besteht und im Heimatraum genug Energie im Storage liegt. */
    spawn(spawn: StructureSpawn, workroom: string)
    {
        if(!bot.room[workroom]!.transferEnergie || spawn.room.name == workroom || !Memory.rooms[workroom]!.claimed)
            return false;

        if(this._spawn(spawn,workroom,RESOURCE_ENERGY))
            return true;

        return false;
    }

    /**
     *
     * @param {StructureSpawn} spawn
     * @param {String} workroom
     * @param {String} container
     * @param {String} mineraltype
     */
    private _spawn(spawn: StructureSpawn, workroom: string, mineraltype: string)
    {

        var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                    creep.memory.workroom == workroom &&
                                                    creep.memory.home == spawn.room.name && //hier wichtig, da mehere spawns infrage kommem
                                                    (creep.ticksToLive! > 100 || creep.spawning)
                                                    ).length;

        // `RoundTrip.count` leitet aus derselben Messung auch eine Creepzahl ab
        // (mehrere kleinere Träger, wenn eine Strecke für einen Creep zu lang
        // ist) — die hier zu benutzen wäre eine zweite, größere
        // Verhaltensänderung: mehrere Transfer-Creeps könnten den
        // Heimat-Storage schneller leeren, und ob das gewollt ist, entscheidet
        // eine Messung und nicht diese Runde. Deshalb bleibt es bei genau
        // einem Transfer je Spawn und Zielraum.
        if (1 <= count)
            return false;

        var storage = Game.rooms[spawn.room.name]!.storage;

        if(storage && storage.store[RESOURCE_ENERGY] < 10000 || !storage)
            return false;

        // Durchsatz hängt an der Strecke, nicht an der Raumkapazität: ein zu
        // großer Träger kostet nur Spawnzeit ohne Mehrertrag. Solange noch
        // keine Größe gemessen ist (frisches Raumpaar oder Messwert kein
        // endlicher Wert), bleibt es beim bisherigen Profil über die
        // Energiekapazität, damit der erste Transfer überhaupt fährt.
        const roundTrip = new RoundTrip(workroom, ROUND_TRIP_KEYS);
        const maxSetsForEnergy = BODIES.transfer.setsFor(spawn.room.energyCapacityAvailable);
        const carry = roundTrip.carryFor(maxSetsForEnergy);
        var profil = Number.isFinite(carry)
            ? carryMove(carry as number)
            : BODIES.transfer.build(spawn.room.energyCapacityAvailable);

       // `distance: 0` gehört dazu, seit die Rolle ihre Strecke misst: ohne den
       // Startwert rechnet der erste Tick `undefined + 1` und der Zähler steht
       // auf `NaN`. Im Spiel heilt das über die JSON-Serialisierung von `Memory`
       // (aus `NaN` wird `null`, und `null + 1` ist 1), im Testgeschirr ohne
       // diesen Umweg aber nicht — dort bliebe der Zähler dauerhaft `NaN`, und
       // `RoundTrip.record` verwirft solche Werte.
       return creepBase.spawn(spawn,profil, role + '_' + Game.time, { role: role, harvest: true, workroom: workroom, home: spawn.room.name, mineral: mineraltype, distance: 0 });
    }
}

export default new Transfer();
