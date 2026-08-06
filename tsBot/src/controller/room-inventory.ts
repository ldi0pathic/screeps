/**
 * Was in einem Raum steht, erhoben statt konfiguriert: Energiequellen und
 * Mineralvorkommen.
 *
 * Bisher standen beide als Id-Listen in `config.ts` — rund dreißig Zeilen
 * Handarbeit je Raum, und `controller/spawn.ts` überspringt jeden Raum ohne
 * passenden `bot.room`-Eintrag vollständig. Das ist die direkte Bremse für
 * „viele Räume": ein frisch geclaimter Raum tut nichts, bis jemand die Ids
 * nachträgt (Plan 02).
 *
 * ## Die Config gewinnt
 *
 * Ist in `config.ts` eine Liste gesetzt, gilt sie. Erst wenn sie fehlt oder
 * leer ist, entscheidet die Erhebung. Zwei Gründe:
 *
 * - **Jeder heute laufende Raum verhält sich unverändert.** Die Umstellung wirkt
 *   zuerst nur dort, wo bisher nichts konfiguriert ist — das hält das Risiko
 *   beherrschbar.
 * - Eine Fehlerkennung lässt sich im Spiel sofort übergehen, ohne Codeänderung.
 *
 * ## Keine Invalidierung
 *
 * Quellen und Minerale sind unveränderlich: sie werden weder zerstört noch
 * gebaut noch verschoben. Anders als bei Containern, Türmen oder Links gibt es
 * hier also nichts, was verfallen könnte — erhoben wird **einmal**, danach
 * kostet der Tagesjob nur noch einen Blick ins Memory. Eine gelöschte
 * Raum-Memory erhebt sich beim nächsten Durchgang von selbst neu.
 *
 * ## Sicht ist Voraussetzung
 *
 * `room.find` braucht Sicht. Für einen frisch geclaimten Raum heißt das: erst
 * fährt der Claimer hin (der hängt an keiner Quellenliste), damit entsteht
 * Sicht, und im nächsten Tagesdurchgang stehen die Quellen im Memory. Erst
 * danach spawnen Miner. Diese Reihenfolge ist beabsichtigt und die einzige, die
 * ohne Handarbeit auskommt.
 */

import { bot } from "../globals";

/** Raum-Memory mit den erhobenen Vorkommen. */
type InventoryMemory = RoomMemory & {
  energySources?: string[];
  mineralSources?: string[];
};

/** Liefert das Raum-Memory, angelegt falls nötig. */
function roomMemory(roomName: string): InventoryMemory {
  Memory.rooms[roomName] ??= {} as RoomMemory;
  return Memory.rooms[roomName] as InventoryMemory;
}

/**
 * Die Energiequellen des Raums: Config, sonst das Erhobene, sonst leer.
 *
 * Eine **leere** Config-Liste zählt wie keine — sonst könnte ein Raum, in dem
 * jemand `energySources: []` stehen ließ, nie fördern.
 */
export function energySources(roomName: string): string[] {
  const configured = bot.room[roomName]?.energySources;
  if (configured && configured.length > 0) return configured;

  return (Memory.rooms[roomName] as InventoryMemory | undefined)?.energySources ?? [];
}

/** Die Mineralvorkommen des Raums. Dieselbe Regel wie bei den Energiequellen. */
export function mineralSources(roomName: string): string[] {
  const configured = bot.room[roomName]?.mineralSources;
  if (configured && configured.length > 0) return configured;

  return (Memory.rooms[roomName] as InventoryMemory | undefined)?.mineralSources ?? [];
}

/**
 * Erhebt Quellen und Minerale eines Raums, falls noch nicht geschehen.
 *
 * Als Tagesjob gedacht, ein Raum je Tick (siehe `controller/timing.ts`). Ohne
 * Sicht passiert nichts — der nächste Durchgang versucht es erneut.
 *
 * `onlyRoom` folgt derselben Regel wie die übrigen Tagesjobs: ohne Argument
 * alle Räume, mit Argument genau dieser eine.
 */
export function discover(onlyRoom?: string): void {
  for (const name in bot.room) {
    if (onlyRoom && name !== onlyRoom) continue;

    const config = bot.room[name];
    if (!config) continue;

    const room = Game.rooms[config.room];
    if (!room) continue;

    const memory = roomMemory(name);

    // Einmalig: unveränderliche Vorkommen brauchen keine Auffrischung, und der
    // Job soll an jedem weiteren Tag nichts kosten.
    if (memory.energySources && memory.mineralSources) continue;

    memory.energySources = room.find(FIND_SOURCES).map(source => source.id);
    memory.mineralSources = room.find(FIND_MINERALS).map(mineral => mineral.id);

    console.log(
      `[${name}] Vorkommen erhoben: ${memory.energySources.length} Quellen, ` +
      `${memory.mineralSources.length} Minerale`,
    );
  }
}
