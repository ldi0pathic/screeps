/**
 * Rolle "collector": sammelt im Heimatraum alles ein, was nicht laufender
 * Energiebetrieb ist, und bringt es dorthin, wo es hingehört.
 *
 * Schließt die Lücke aus Plan 10 (`docs/plans/10-logistikrollen.md`): seit
 * `filler` und `hauler` den Heimatraum-Debitor ersetzt haben, wird
 * `roles/debitor.ts:106-122` in Räumen mit Storage nie mehr ausgeführt — dort
 * stand der einzige Umzug Storage → Terminal im ganzen Bot. Mineralien blieben
 * seitdem im Storage liegen, Gefallenes im Raum, und das Terminal bekam keine
 * Energie mehr, ohne die `TerminalMarket.sell` gar nicht erst anläuft.
 *
 * Vier Aufgaben in einer Rolle sind hier Absicht, obwohl Plan 10 den Debitor
 * genau wegen seiner Kaskade zerlegt hat: dort waren es **verschiedene Zwecke**
 * in **vielen** Creeps, und jeder zahlte je Tick für Bedingungen, die ihn nichts
 * angingen. Hier ist es **ein Zweck** in **einem** Creep je Raum. Wächst die
 * Rolle über diesen Zweck hinaus, ist das das Signal, sie zu teilen — nicht die
 * Zahl ihrer Zweige.
 */

import { mineralSources } from "../controller/room-inventory";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import { NEVER_SELL } from "../prototypes/terminal-market";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

/**
 * Rollenname. Steht im Creep-Memory des laufenden Spiels und darf sich
 * nicht ändern.
 */
const role = "collector";

/**
 * Zielbestand an Energie im Terminal.
 *
 * `TerminalMarket.sell` steigt unter 1000 Energie im Terminal aus und bezahlt
 * daraus die Transferkosten — bei 5000 Einheiten über zwanzig Räume rund 2400
 * Energie je Handel. Der Wert deckt mehrere Handel und liegt weit unter der
 * Grenze von 100 000, ab der `TransportToHomeTerminal` Energie ohnehin abweist.
 *
 * Er steuert nur das **Holen**: abgeliefert wird über
 * `TransportToHomeTerminal`, das seine eigene Grenze mitbringt. Zwei Regeln für
 * dieselbe Frage wären eine zu viel.
 */
export const TERMINAL_ENERGY_TARGET = 20000;

/**
 * Überlaufschutz: nachgeliefert wird nur, solange so viel im Terminal frei ist.
 *
 * Dieselbe Zahl, die schon der alte Debitor benutzte — keine Neuerfindung,
 * sondern der bisherige Stand.
 */
export const TERMINAL_FREE_MIN = 50000;

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Collector implements CreepRole {
    /** Sammelt oder liefert ab, je nach `memory.harvest`. */
    doJob(creep: Creep): void {
        creep.checkHarvest();

        if (creep.memory.harvest) {
            this._collect(creep);
            return;
        }

        this._deliver(creep);
    }

    /**
     * Sammeln, sortiert nach Verfallsgeschwindigkeit: was zuerst verschwindet,
     * kommt zuerst dran. Grabsteine nehmen ihren Inhalt beim Zerfall mit, Drops
     * schrumpfen je Tick, Ruinen halten länger; was im Storage liegt, verfällt
     * gar nicht und wartet.
     */
    private _collect(creep: Creep): void {
        if (creepBase.harvestCompleteRoomTombstones(creep)) return;

        // Der `type` wird von `harvestRoomDrops` nicht ausgewertet — die
        // Funktion hebt jeden Drop über 100 Einheiten auf, auch Mineralien
        // besiegter Gegner. Die Signatur verlangt das Argument trotzdem.
        if (creepBase.harvestRoomDrops(creep, RESOURCE_ENERGY)) return;

        if (creepBase.harvestRoomRuins(creep, RESOURCE_ENERGY)) return;

        // Ab hier wird nur noch geholt, was auch abgeliefert werden kann.
        if (!this._terminalHasRoom(creep)) return;

        if (this._collectMineralContainer(creep)) return;
        if (this._collectSellable(creep)) return;

        this._collectTerminalEnergy(creep);
    }

    /**
     * Hat das Terminal überhaupt noch Platz?
     *
     * Ohne diese Prüfung trüge der Collector Ware zu einem vollen Terminal und
     * legte sie über den Rückfall wieder ins Storage — ein Umlauf ohne Wirkung.
     */
    private _terminalHasRoom(creep: Creep): boolean {
        const terminal = creep.room.terminal;
        return Boolean(terminal && (terminal.store.getFreeCapacity() ?? 0) > TERMINAL_FREE_MIN);
    }

    /**
     * Leert den Container am Mineralvorkommen.
     *
     * Den holt seit Plan 10 sonst niemand ab: `Hauler.spawn` läuft über
     * `energySources` und `Hauler.doJob` holt ausschließlich Energie. Die Id
     * landet in `memory.container`, damit `harvestMyContainer` sie benutzen kann
     * — eine eigene Suche braucht es dafür nicht.
     */
    private _collectMineralContainer(creep: Creep): boolean {
        const containerId = this._mineralContainerId(creep);
        if (!containerId) return false;

        creep.memory.container = containerId;

        const container: any = Game.getObjectById(containerId);
        if (!container) {
            creep.memory.container = '';
            return false;
        }

        // Die erste Ressource, die nicht Energie ist. Energie am Extractor
        // gehört dem `hauler`, nicht dieser Rolle.
        const mineral = Object.keys(container.store).find(resource => resource !== RESOURCE_ENERGY);
        if (!mineral) return false;

        return creepBase.harvestMyContainer(creep, mineral);
    }

    /** Der Container neben dem Mineralvorkommen des Raums, oder `null`. */
    private _mineralContainerId(creep: Creep): string | null {
        for (const mineralId of mineralSources(creep.room.name)) {
            const mineral: any = Game.getObjectById(mineralId);
            if (!mineral) continue;

            const containers = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: { structureType: STRUCTURE_CONTAINER },
            });

            if (containers.length > 0) return containers[0].id;
        }

        return null;
    }

    /**
     * Die erste verkaufbare Ressource aus dem Storage.
     *
     * Dieselbe Auswahl, die der Debitor traf, bevor er im Heimatraum nicht mehr
     * spawnte: mehr als 100 Einheiten, nicht Energie, nicht auf `NEVER_SELL`.
     */
    private _collectSellable(creep: Creep): boolean {
        const storage = creep.room.storage;
        if (!storage) return false;

        const sellable = Object.keys(storage.store).find(resource =>
            resource !== RESOURCE_ENERGY &&
            !NEVER_SELL[resource] &&
            (storage.store as any)[resource] > 100
        );

        if (!sellable) return false;

        return creepBase.harvestRoomStorage(creep, sellable);
    }

    /** Energie aus dem Storage, solange das Terminal unter der Zielgröße liegt. */
    private _collectTerminalEnergy(creep: Creep): boolean {
        const terminal = creep.room.terminal;
        if (!terminal) return false;

        // `getUsedCapacity` statt `store[…]`: der Store liefert für eine
        // fehlende Ressource `undefined`, und eine negierte Schwelle kippte
        // dann genau im wichtigsten Fall — dem leeren Terminal, für das diese
        // Konstante da ist (siehe die Notiz in `creep/base.ts`).
        if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) < TERMINAL_ENERGY_TARGET) {
            return creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY);
        }

        return false;
    }

    /** Abliefern: erst das Terminal, dann das Storage als Rückfall. */
    private _deliver(creep: Creep): void {
        if (creepBase.TransportToHomeTerminal(creep)) return;
        creepBase.TransportToHomeStorage(creep);
    }

    /**
     * Spawnt den einzigen Collector für `workroom`.
     *
     * Abgeleitet statt konfiguriert: ein eigener Raum mit Storage **und**
     * Terminal bekommt einen. Kein Config-Schlüssel — beides sind Tatsachen über
     * die Welt, und die gehören nach CLAUDE.md nicht in die Config.
     *
     * Am Bauwerk festgemacht und nicht am RCL: ein Raum kann RCL 6 erreicht
     * haben, ohne das Terminal gebaut zu haben. Dieselbe Begründung steht schon
     * bei `Filler.spawn`.
     */
    spawn(spawn: StructureSpawn, workroom: string): boolean {
        // Die Rolle kennt kein `goToWorkroom` — sie käme in einem fremden Raum
        // nie an.
        if (spawn.room.name != workroom)
            return false;

        if (!spawn.room.storage || !spawn.room.terminal)
            return false;

        if (_.filter(Game.creeps, (creep: Creep) => creep.memory.role == role && creep.memory.workroom == workroom).length >= 1)
            return false;

        return creepBase.spawn(
            spawn,
            BODIES.collector.build(spawn.room.energyCapacityAvailable),
            role + '_' + Game.time,
            // `mineral` wie bei Filler und Hauler: fehlt der Schlüssel, ist er
            // `undefined`, `checkHarvest` liest ihn als "nicht Energie" und
            // kippt den Creep bei jeder Teilladung sofort zurück ins Abliefern.
            { role: role, workroom: workroom, home: spawn.room.name, harvest: true, container: '', mineral: RESOURCE_ENERGY },
        );
    }
}

export default new Collector();
