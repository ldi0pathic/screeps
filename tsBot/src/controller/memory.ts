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

export function findAndSaveRoomWalls(): void {
  botMemory.rooms ??= {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    // Ohne `maxwallRepairer` greift der Vergleich wie in prod nicht
    // (`undefined < 1` ist false), der Raum wird also nicht übersprungen.
    if (!config || config.maxwallRepairer! < 1) continue;

    const room = Game.rooms[config.room];
    if (!room) continue;

    ensureRoomMemory(name).wally = room
      .find(FIND_STRUCTURES, {
        filter: (structure) =>
          structure.structureType === STRUCTURE_WALL ||
          structure.structureType === STRUCTURE_RAMPART,
      })
      .map((structure) => structure.id);
  }
}

export function findAndSaveRoomContainer(): void {
  botMemory.rooms ??= {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    ensureRoomMemory(name).container = room
      .find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_CONTAINER } })
      .map((structure) => structure.id);
  }
}

export function findAndSaveRoomTower(): void {
  botMemory.rooms ??= {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    ensureRoomMemory(name).tower = room
      .find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } })
      .map((structure) => structure.id);
  }
}

export function findAndSaveTerminals(): void {
  botMemory.terminals = [];
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config) continue;
    const room = Game.rooms[config.room];
    if (!room) continue;
    const terminal = room.find(FIND_STRUCTURES, {
      filter: { structureType: STRUCTURE_TERMINAL },
    })[0];
    if (terminal) botMemory.terminals.push(terminal.id);
  }
}

export function findAndSaveRoads(): void {
  // Wie die drei Schwesterfunktionen: prod legt `Memory.rooms` hier zur
  // Sicherheit an, bevor geschrieben wird.
  botMemory.rooms ??= {};
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    if (!config || !config.saveRoads) continue;

    const room = Game.rooms[config.room];
    if (!room) continue;

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
  }
}
