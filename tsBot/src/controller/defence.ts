/**
 * Verteidigungslogik: erkennt feindliche Creeps, Invader-Cores und Nukes in
 * den überwachten Räumen und steuert die Towers (Angriff/Reparatur).
 * Inhaltlich identisch zu `prod/controller.defence.js`.
 */
import { bot } from "../globals";
import { profile } from "../profiler/decorator";

/**
 * Ein-Tick-Cache für den Feind-Scan je Raum.
 *
 * `check()` und `tower()` durchlaufen beide `bot.room` und fragen im selben
 * Tick `FIND_HOSTILE_CREEPS` für denselben Raum ab. Ohne Cache scannt das
 * zweimal je Raum und Tick, obwohl sich der Feindbestand innerhalb eines
 * Ticks nicht ändert — bei zehn Räumen und `tower()` jeden Tick ist genau das
 * einer der Posten, die linear mit der Raumzahl wachsen und die Spitzenlast
 * je Tick erhöhen.
 *
 * Der Cache gilt bewusst nur für den aktuellen Tick: der Vergleich läuft
 * gegen `Game.time`, nie gegen ein „schon gesehen"-Flag, und ist damit auch
 * bei einem Tickwechsel ohne Neuladen korrekt. Ein Mehrtick-Fenster (wie beim
 * Vergleichsbot mit drei Ticks) übernehmen wir bewusst nicht: Feinde bewegen
 * sich, und Turmfeuer ist taktisch. Der Cache lebt als privates Feld der
 * Instanz, nicht in `Memory` — ein globaler Reset leert ihn von selbst — und
 * wächst nicht unbegrenzt: es gibt je Tick höchstens so viele Einträge wie
 * Räume in `bot.room`, ältere Ticks werden beim nächsten Zugriff auf denselben
 * Raum überschrieben statt zusätzlich gespeichert.
 */
class HostileScanCache {
  private readonly entries = new Map<string, { tick: number; hostiles: Creep[] }>();

  get(room: Room): Creep[] {
    const cached = this.entries.get(room.name);
    if (cached && cached.tick === Game.time) return cached.hostiles;

    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    this.entries.set(room.name, { tick: Game.time, hostiles });
    return hostiles;
  }
}

/**
 * Wie oft jeder Raum geprüft wird. Unverändert alle 7 Ticks — neu ist nur, dass
 * nicht mehr alle Räume denselben Tick treffen.
 */
const CHECK_INTERVAL = 7;

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class DefenceController {
  private readonly hostileScan = new HostileScanCache();

  /**
   * Verteidigungsscan, **gestaffelt**: ein Raum je Tick statt alle im selben.
   *
   * Wird seit Plan 05 in **jedem** Tick gerufen, nicht mehr nur alle sieben. Die
   * Häufigkeit je Raum bleibt dieselbe (`(Game.time + index) % 7`), aber die
   * Räume verteilen sich über die sieben Ticks. Das ändert nicht die Summe,
   * sondern die **Spitze** — und die entscheidet, ob der Tick durchläuft: greift
   * das CPU-Limit, bricht das Spiel den Rest stillschweigend ab. Mit neun Räumen
   * fielen bisher neun Raumscans in denselben Tick, jetzt sind es ein bis zwei.
   *
   * Der Versatz kommt aus der Position des Raums in `bot.room`. Die
   * Schlüsselreihenfolge eines Objekts ist für Stringschlüssel die
   * Einfügereihenfolge, also stabil — ein Raum behält seinen Tick, solange
   * `config.ts` unverändert bleibt. Ändert sie sich, verschiebt sich der Versatz
   * einmalig; das ist folgenlos, weil jede Prüfung für sich steht.
   *
   * `tower()` wird ausdrücklich **nicht** gestaffelt: Turmfeuer ist taktisch und
   * muss in jedem Tick für jeden bedrohten Raum laufen.
   */
  check(): void {
    let roomIndex = 0;

    for (const name in bot.room) {
      const offset = roomIndex++;

      if ((Game.time + offset) % CHECK_INTERVAL !== 0) continue;

      if (!bot.room[name]!.sendDefender) continue;

      if (
        Memory.rooms[name]!.invaderCoreEndTick &&
        Game.time + 10 > Memory.rooms[name]!.invaderCoreEndTick
      ) {
        Memory.rooms[name]!.invaderCore = false;
      }

      if (
        Memory.rooms[name]!.needDefenceEndTick &&
        Game.time + 10 > Memory.rooms[name]!.needDefenceEndTick
      ) {
        Memory.rooms[name]!.needDefence = false;
      }

      const room = Game.rooms[bot.room[name]!.room];

      if (!room) continue;

      const hostiles = this.hostileScan.get(room);
      const core = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s: any) => s.structureType === STRUCTURE_INVADER_CORE
      });
      const nukes = room.find(FIND_NUKES);

      Memory.rooms[name]!.needDefence = hostiles.length > 0;
      if (hostiles.length > (bot.room[name]!.minHostile || 1)) {
        let maxLifeTime = 0;

        for (const creep of hostiles) {
          if (creep.ticksToLive !== undefined && creep.ticksToLive > maxLifeTime) {
            maxLifeTime = creep.ticksToLive;
          }
        }
        Memory.rooms[name]!.needDefenceEndTick = Game.time + maxLifeTime;
      }

      Memory.rooms[name]!.invaderCore = core.length > 0;
      if (core.length > 0) {
        Memory.rooms[name]!.claimed = false;
        let timeRemaining = 0;
        for (const effect of core[0]!.effects || []) {
          const time = effect.ticksRemaining;
          if (time > timeRemaining) {
            timeRemaining = time;
          }
        }
        Memory.rooms[name]!.invaderCoreEndTick = Game.time + timeRemaining;
      }

      if (nukes.length > 0) {
        let msg = "";
        Memory.rooms[name]!.nukepos = [];
        for (const nuke of nukes) {
          msg +=
            "Raum " +
            nuke.room +
            " wird in " +
            nuke.timeToLand +
            " ticks von Raum " +
            nuke.launchRoomName +
            " aus genuked!\r\n";

          if (!Memory.rooms[name]!.nukepos.includes(nuke.pos))
            Memory.rooms[name]!.nukepos.push(nuke.pos);
        }

        if (msg.length > 0 && !Memory.rooms[name]!.nuke) Game.notify(msg);
      } else {
        if (Memory.rooms[name]!.nukepos) Memory.rooms[name]!.nukepos = [];
      }

      Memory.rooms[name]!.nuke = nukes.length > 0;
    }
  }

  tower(): void {
    for (const name in bot.room) {
      const room = Game.rooms[name];
      if (
        !room ||
        !room.controller ||
        !room.controller.my ||
        !Memory.rooms[name]!.tower ||
        Memory.rooms[name]!.tower.length === 0
      )
        continue;

      if (Memory.rooms[name]!.needDefence) {
        const hostileCreeps = this.hostileScan.get(room);

        if (hostileCreeps.length > 0) {
          // Sortiere die feindlichen Creeps nach ihren Bodypart-Kosten in absteigender Reihenfolge
          hostileCreeps.sort(function (a: any, b: any) {
            const costA = a.body.reduce(function (total: any, part: any) {
              return total + BODYPART_COST[part.type as BodyPartConstant]!;
            }, 0);

            const costB = b.body.reduce(function (total: any, part: any) {
              return total + BODYPART_COST[part.type as BodyPartConstant]!;
            }, 0);

            return costB - costA;
          });

          // Konservative Heilleistung des Gegners: HEAL_POWER (12/Tick, adjacent
          // heal - die höhere der beiden Heilraten) pro HEAL-Teil, summiert über
          // alle feindlichen Creeps im Raum. Boosts werden nicht berücksichtigt,
          // dadurch wird zugunsten des Gegners gerechnet (eher zu viel Heilung
          // angenommen als zu wenig).
          let totalHealPower = 0;
          for (const healer of hostileCreeps) {
            const healParts = healer.body.filter((part: any) => part.type === HEAL).length;
            totalHealPower += healParts * HEAL_POWER;
          }

          // Erster Gegner (nach Bauteilkosten sortiert), für den der summierte
          // Turmschaden aller schussfähigen Türme die Heilleistung übersteigt.
          let target: any = null;
          for (const candidate of hostileCreeps) {
            let towerDamage = 0;
            for (const t of this.resolveTowers(name)) {
              // Unter TOWER_ENERGY_COST kann der Turm nicht schießen, sein
              // Schaden darf also nicht mitgerechnet werden.
              if (t.store.getUsedCapacity(RESOURCE_ENERGY) < TOWER_ENERGY_COST) continue;

              const range = t.pos.getRangeTo(candidate.pos);
              if (range <= TOWER_OPTIMAL_RANGE) {
                towerDamage += TOWER_POWER_ATTACK;
              } else if (range >= TOWER_FALLOFF_RANGE) {
                towerDamage += TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF);
              } else {
                const fallOffShare = (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
                towerDamage += TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * fallOffShare);
              }
            }

            if (towerDamage > totalHealPower) {
              target = candidate;
              break;
            }
          }

          if (target) {
            for (const t of this.resolveTowers(name)) t.attack(target);
          } else {
            const allStructures = room.find(FIND_STRUCTURES);

            if (!Memory.rooms[name]!.structureHP) {
              Memory.rooms[name]!.structureHP = {};
              for (const structure of allStructures) {
                Memory.rooms[name]!.structureHP[structure.id] = structure.hits;
              }
            }

            let damagedStructure = null;
            for (const structure of allStructures) {
              if (
                Memory.rooms[name]!.structureHP[structure.id] &&
                structure.hits < Memory.rooms[name]!.structureHP[structure.id]
              ) {
                damagedStructure = structure;
                break;
              }
            }

            if (damagedStructure) {
              for (const t of this.resolveTowers(name)) t.repair(damagedStructure);
            }
          }
        } else {
          Memory.rooms[name]!.needDefence = false;
          delete Memory.rooms[name]!.structureHP;
        }
      } else if (Game.time % 3 === 2) {
        const damagedStructures = room.find(FIND_STRUCTURES, {
          filter: (structure: any) => {
            return (
              structure.hits <
              (bot.prio.hits[structure.structureType as StructureConstant] || 0.5) * structure.hitsMax
            );
          }
        });

        if (damagedStructures.length > 0) {
          damagedStructures.sort((a: any, b: any) => {
            const priorityA = bot.prio.repair[a.structureType as StructureConstant] || 10;
            const priorityB = bot.prio.repair[b.structureType as StructureConstant] || 10;

            if (priorityA !== priorityB) return priorityA - priorityB;

            // Bei gleicher Priorität nach anteiligem Schaden absteigend, nicht nach
            // absoluten Hits: die sind zwischen Strukturtypen nicht vergleichbar
            // (Rampart bis zu 300 Mio. hitsMax gegen deutlich kleinere Werte bei
            // Straßen). Anders als roles/repairer.ts, das an dieser Stelle nach
            // absolutem Schaden sortiert (`hitsMax - hits`).
            const damageShareA = 1 - a.hits / a.hitsMax;
            const damageShareB = 1 - b.hits / b.hitsMax;
            return damageShareB - damageShareA;
          });

          for (const t of this.resolveTowers(name)) {
            // `[RESOURCE_ENERGY]` statt `RESOURCE_ENERGY` steht schon so in der
            // Vorlage (prod/controller.defence.js) — unverändert übernommen,
            // `as any` bedient hier nur die jetzt strengere Typisierung von
            // `resolveTowers()`, ohne den Aufruf selbst zu ändern.
            if ((t.store as any).getUsedCapacity([RESOURCE_ENERGY]) * 0.5 > (t.store as any).getFreeCapacity([RESOURCE_ENERGY]))
              t.repair(damagedStructures[0]!);
          }
        }
      }
    }
  }

  /**
   * Löst die im Raum-Memory gemerkten Turm-Ids zu lebenden Objekten auf.
   *
   * Eine tote Id (Turm zerstört) wird stillschweigend übersprungen — die
   * gemerkte Liste bleibt dabei unverändert liegen. Anders als bei
   * `LinkList`/`ContainerList`, die eine tote Id zum Anlass nehmen, die ganze
   * Liste zu verwerfen: für Türme gibt es diese Selbstheilung bewusst nicht,
   * das ist Aufgabe des Tagesjobs (`memoryController.findAndSaveRoomTower`).
   */
  private resolveTowers(roomName: string): StructureTower[] {
    const towers: StructureTower[] = [];
    for (const towerId of Memory.rooms[roomName]!.tower) {
      const tower = Game.getObjectById(towerId as Id<StructureTower>);
      if (tower) towers.push(tower);
    }
    return towers;
  }
}

export default new DefenceController();
