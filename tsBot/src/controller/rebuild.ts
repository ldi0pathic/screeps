import type { BotRoomMemory, ManagedRoomConfig } from "./memory";

type RebuildMemory = Memory & {
  rooms: Record<string, BotRoomMemory>;
};

const botGlobal = global as typeof global & {
  room: Record<string, ManagedRoomConfig>;
};
const botMemory = Memory as RebuildMemory;

export function rebuildRoads(): void {
  for (const name in botGlobal.room) {
    const config = botGlobal.room[name];
    const room = Game.rooms[name];
    if (!config?.saveRoads || !room || room.controller?.level === undefined || room.controller.level < 7) {
      continue;
    }

    const roomMemory = botMemory.rooms[name];
    if (!roomMemory?.roads) continue;

    let freeSlots = 10 - room.find(FIND_CONSTRUCTION_SITES).length;
    if (freeSlots <= 0) continue;

    for (const roadMemory of roomMemory.roads) {
      if (freeSlots <= 0) break;
      if (Game.getObjectById(roadMemory.id as Id<StructureRoad>)) continue;

      const result = new RoomPosition(roadMemory.pos.x, roadMemory.pos.y, name)
        .createConstructionSite(STRUCTURE_ROAD);
      if (result === OK) {
        roomMemory.autobuild = (roomMemory.autobuild ?? 0) + 1;
        freeSlots--;
      }
    }
  }
}
