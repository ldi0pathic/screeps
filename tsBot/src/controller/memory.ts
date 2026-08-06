import type { RoomLinks } from "./link-list";

export type ManagedRoomConfig = {
  room: string;
  saveRoads?: boolean;
  maxwallRepairer?: number;
};

export type BotRoomMemory = RoomMemory & {
  /** Klassifizierte Links des Raums, erhoben von `controller/link-list.ts`. */
  links?: RoomLinks;
  aktivPrioSpawn?: boolean;
  aktivPrioSpawnCount?: number;
  hasLinks?: boolean;
  needDefence?: boolean;
  invaderCore?: boolean;
  nuke?: boolean;
  wally?: string[];
  container?: string[];
  tower?: string[];
  roads?: Array<{ id: string; pos: RoomPosition; type: "b" | "c" }>;
  autobuild?: number;
};

type BotMemory = Memory & {
  init?: boolean;
  terminals?: string[];
  rooms: Record<string, BotRoomMemory>;
};

const botGlobal = global as typeof global & {
  room: Record<string, ManagedRoomConfig>;
};

const botMemory = Memory as BotMemory;

function ensureRoomMemory(roomName: string): BotRoomMemory {
  return (botMemory.rooms[roomName] ??= {});
}

export function init(): void {
  botMemory.terminals ??= [];

  if (botMemory.init) {
    return;
  }

  botMemory.rooms ??= {};
  for (const name in botGlobal.room) {
    const roomMemory = ensureRoomMemory(name);
    roomMemory.aktivPrioSpawn = Boolean(roomMemory.aktivPrioSpawn);
    roomMemory.hasLinks = Boolean(roomMemory.hasLinks);
    roomMemory.needDefence = Boolean(roomMemory.needDefence);
    roomMemory.invaderCore = Boolean(roomMemory.invaderCore);
    roomMemory.nuke = Boolean(roomMemory.nuke);
    roomMemory.aktivPrioSpawnCount ??= 0;
    botMemory.init = true;
  }
}

// Baut `Memory.rooms` in einem Zug über alle Räume auf/ab; häppchenweise wäre
// die Bereinigung zwischendurch unvollständig. Kein `onlyRoom`-Parameter.
export function clear(): void {
  if (!botMemory.rooms) {
    return;
  }

  for (const name in botMemory.rooms) {
    const config = botGlobal.room[name];
    if (!config) {
      delete botMemory.rooms[name];
      continue;
    }

    const roomMemory = botMemory.rooms[name];
    if (!config.saveRoads && roomMemory?.roads) {
      delete roomMemory.roads;
    }
  }
}

export function writeStatus(): void {
  let message = "";
  for (const room in botMemory.rooms) {
    const roomMemory = botMemory.rooms[room];
    if (roomMemory?.aktivPrioSpawn) message += `PrioSpawn im Raum ${room}\n`;
    if (roomMemory?.needDefence) message += `Angriff im Raum ${room}\n`;
    if (roomMemory?.invaderCore) message += `Core im Raum ${room}\n`;
  }
  if (message) console.log(message);
}

/**
 * Läuft über die verwalteten Räume (`bot.room`) und reicht Name, Konfiguration
 * und den sichtbaren `Room` an `visit` weiter — das gemeinsame Gerüst der
 * fünf Finder unten, die sich nur in ihrem Filter und ihrem Guard
 * unterscheiden.
 *
 * `onlyRoom`: Staffelung nach Plan 05 (Befund 2) — ohne Argument läuft die
 * Funktion wie bisher über alle Räume aus `bot.room` (auch für den
 * Handaufruf aus der Konsole wichtig); mit Argument bearbeitet sie genau
 * diesen einen Raum, sofern er in `bot.room` steht, sonst passiert nichts.
 * `timing.ts::daylie()` gibt so jedem (Job, Raum)-Paar seinen eigenen Tick,
 * damit die Spitzenlast pro Tick sinkt statt mit der Raumzahl zu wachsen.
 * `findAndSaveTerminals` und `findAndSaveRoads` reichen bewusst kein
 * `onlyRoom` durch (`undefined`) — sie laufen ungestaffelt über alle Räume.
 */
function forEachManagedRoom(
  onlyRoom: string | undefined,
  visit: (name: string, config: ManagedRoomConfig, room: Room) => void,
): void {
  for (const name in botGlobal.room) {
    if (onlyRoom && name !== onlyRoom) continue;
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    visit(name, config, room);
  }
}

/** Findet Strukturen nach `filter` und liefert nur ihre Ids — das Kernstück jedes Finders. */
function collectStructureIds(room: Room, filter: (structure: AnyStructure) => boolean): string[] {
  return room.find(FIND_STRUCTURES, { filter }).map((structure) => structure.id);
}

export function findAndSaveRoomWalls(onlyRoom?: string): void {
  botMemory.rooms ??= {};
  forEachManagedRoom(onlyRoom, (name, config, room) => {
    // Ohne `maxwallRepairer` greift der Vergleich wie in prod nicht
    // (`undefined < 1` ist false), der Raum wird also nicht übersprungen.
    if (config.maxwallRepairer! < 1) return;

    ensureRoomMemory(name).wally = collectStructureIds(
      room,
      (structure) => structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART,
    );
  });
}

// `onlyRoom`: siehe Kommentar an `forEachManagedRoom`.
export function findAndSaveRoomContainer(onlyRoom?: string): void {
  botMemory.rooms ??= {};
  forEachManagedRoom(onlyRoom, (name, _config, room) => {
    ensureRoomMemory(name).container = collectStructureIds(
      room,
      (structure) => structure.structureType === STRUCTURE_CONTAINER,
    );
  });
}

// `onlyRoom`: siehe Kommentar an `forEachManagedRoom`.
export function findAndSaveRoomTower(onlyRoom?: string): void {
  botMemory.rooms ??= {};
  forEachManagedRoom(onlyRoom, (name, _config, room) => {
    ensureRoomMemory(name).tower = collectStructureIds(
      room,
      (structure) => structure.structureType === STRUCTURE_TOWER,
    );
  });
}

// Baut `Memory.terminals` in einem Zug über alle Räume auf; häppchenweise
// wäre die Liste zwischendurch unvollständig. Kein `onlyRoom`-Parameter.
// Andere Rückgabestruktur als die drei Finder oben (eine globale Liste statt
// Raum-Memory), deshalb ohne `collectStructureIds`, aber mit derselben
// Raum-Iteration wie sie.
export function findAndSaveTerminals(): void {
  botMemory.terminals = [];
  forEachManagedRoom(undefined, (_name, _config, room) => {
    const terminal = room.find(FIND_STRUCTURES, {
      filter: { structureType: STRUCTURE_TERMINAL },
    })[0];
    if (terminal) botMemory.terminals!.push(terminal.id);
  });
}

// Kein `onlyRoom`-Parameter — läuft wie `findAndSaveTerminals` ungestaffelt
// über alle Räume, gesteuert vom `saveRoads`-Flag statt vom Handaufruf.
export function findAndSaveRoads(): void {
  // Wie die drei Schwesterfunktionen: prod legt `Memory.rooms` hier zur
  // Sicherheit an, bevor geschrieben wird.
  botMemory.rooms ??= {};
  forEachManagedRoom(undefined, (name, config, room) => {
    if (!config.saveRoads) return;

    const roads = room.find(FIND_STRUCTURES, {
      filter: { structureType: STRUCTURE_ROAD },
    });
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
      filter: { structureType: STRUCTURE_ROAD },
    });

    ensureRoomMemory(name).roads = [
      ...roads.map((road) => ({ id: road.id, pos: road.pos, type: "b" as const })),
      ...constructionSites.map((site) => ({ id: site.id, pos: site.pos, type: "c" as const })),
    ];
  });
}
