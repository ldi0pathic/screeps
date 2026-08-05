/**
 * Die Linkliste eines Raums (`Memory.rooms[<raum>].links`).
 *
 * Links kennen keine Rollen von sich aus — sie sind einfach Strukturen, die
 * Energie im Raum teleportieren. Was ein Link tut, ergibt sich erst aus seiner
 * Position: ein Link am Controller nimmt ab, ein Link am Storage nimmt ab, alle
 * übrigen Links senden (typischerweise an einer Quelle).
 *
 * Die zwei Empfänger stehen heute als feste Ids in `config.ts`
 * (`spawnLink`/`controllerLink`), aber der Linkplaner baut neue Links im
 * laufenden Spiel — deren Ids kann niemand von Hand nachtragen. Darum die
 * Lage-Regel als Fallback: der nächste Link zum Controller (Reichweite 3, weil
 * Upgrader auf dieser Distanz arbeiten) bzw. zum Storage (Reichweite 2, weil der
 * Linkkeeper ein Feld braucht, das an Link **und** Storage grenzt) wird zum
 * Empfänger, wenn die Config keinen liefert.
 */

import { bot } from "../globals";

/** Die klassifizierten Links eines Raums, wie sie im Memory liegen. */
export interface RoomLinks {
  /** Empfänger am Controller. */
  controller?: string;
  /** Empfänger am Storage (heißt historisch `spawnLink`). */
  spawn?: string;
  /** Alle übrigen Links des Raums — sie senden. */
  sender: string[];
}

/** Raum-Memory, soweit es hier interessiert. */
type LinkRoomMemory = RoomMemory & {
  links?: RoomLinks;
};

export class LinkList {
  constructor(private readonly roomName: string) {}

  private get roomMemory(): LinkRoomMemory | undefined {
    return Memory.rooms[this.roomName] as LinkRoomMemory | undefined;
  }

  /** Kennt der Bot den Raum überhaupt? Ohne Raum-Memory gibt es nichts zu tun. */
  get isRoomKnown(): boolean {
    return this.roomMemory !== undefined;
  }

  /** Liegt überhaupt eine Liste vor — auch eine ohne Sender? */
  get hasList(): boolean {
    return this.roomMemory?.links !== undefined;
  }

  /**
   * Erhebt die Links des Raums, klassifiziert sie und schreibt sie ins Memory.
   *
   * Reihenfolge der Zuordnung: erst die Config, dann die Lage, und ein Link
   * ist nie beides — Controller zuerst, Storage aus dem Rest, alle übrigen
   * Links sind Sender.
   */
  discover(room: Room): void {
    const memory = this.roomMemory;
    if (!memory) {
      return;
    }

    const links = room.find(FIND_MY_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_LINK,
    }) as StructureLink[];

    const roomConfig = bot.room[room.name];
    const remaining = new Set(links.map(link => link.id));

    const controllerId = this.resolveController(room, links, roomConfig?.controllerLink);
    if (controllerId) {
      remaining.delete(controllerId);
    }

    const spawnId = this.resolveSpawn(room, links, roomConfig?.spawnLink, remaining);
    if (spawnId) {
      remaining.delete(spawnId);
    }

    memory.links = {
      controller: controllerId,
      spawn: spawnId,
      sender: [...remaining],
    };
  }

  /** Der Empfänger am Controller nach Config, sonst nach Lage (Reichweite 3). */
  private resolveController(
    room: Room,
    links: StructureLink[],
    configuredId: string | null | undefined,
  ): Id<StructureLink> | undefined {
    const configured = links.find(link => link.id === configuredId);
    if (configured) {
      return configured.id;
    }

    const controller = room.controller;
    if (!controller) {
      return undefined;
    }

    return this.nearestWithinRange(links, controller.pos, 3)?.id;
  }

  /** Der Empfänger am Storage nach Config, sonst nach Lage (Reichweite 2). */
  private resolveSpawn(
    room: Room,
    links: StructureLink[],
    configuredId: string | null | undefined,
    candidates: Set<Id<StructureLink>>,
  ): Id<StructureLink> | undefined {
    const configured = links.find(link => link.id === configuredId);
    if (configured) {
      return configured.id;
    }

    const storage = room.storage;
    if (!storage) {
      return undefined;
    }

    const remainingLinks = links.filter(link => candidates.has(link.id));
    return this.nearestWithinRange(remainingLinks, storage.pos, 2)?.id;
  }

  /** Der nächstgelegene Link zu `pos`, sofern innerhalb von `range`. */
  private nearestWithinRange(
    links: StructureLink[],
    pos: RoomPosition,
    range: number,
  ): StructureLink | undefined {
    let nearest: StructureLink | undefined;
    let nearestDistance = Infinity;

    for (const link of links) {
      const distance = link.pos.getRangeTo(pos);
      if (distance <= range && distance < nearestDistance) {
        nearestDistance = distance;
        nearest = link;
      }
    }

    return nearest;
  }

  /** Verwirft die Liste; sie wird beim nächsten Tagesjob neu erhoben. */
  forget(): void {
    const memory = this.roomMemory;
    if (memory) {
      delete memory.links;
    }
  }

  /**
   * Löst eine gemerkte Id auf. Zeigt sie ins Leere (Link abgerissen), wird die
   * ganze Liste verworfen — analog zu `forgetListOnStaleId` in `ContainerList`,
   * hier aber ohne Ausnahme, weil es für Links keine zwei Seiten mit
   * unterschiedlichem Verhalten gibt.
   */
  private resolve(id: string | undefined): StructureLink | null {
    if (!id) {
      return null;
    }

    const link = Game.getObjectById(id as Id<StructureLink>);
    if (!link) {
      this.forget();
      return null;
    }

    return link;
  }

  /** Der Empfänger am Controller, oder null. */
  get controllerLink(): StructureLink | null {
    return this.resolve(this.roomMemory?.links?.controller);
  }

  /** Der Empfänger am Storage, oder null. */
  get spawnLink(): StructureLink | null {
    return this.resolve(this.roomMemory?.links?.spawn);
  }

  /** Alle sendenden Links, aufgelöst. */
  senders(): StructureLink[] {
    const ids = this.roomMemory?.links?.sender;
    if (!ids) {
      return [];
    }

    const result: StructureLink[] = [];
    for (const id of ids) {
      const link = this.resolve(id);
      if (link) {
        result.push(link);
      }
    }

    return result;
  }
}
