/**
 * Die Linkliste eines Raums (`Memory.rooms[<raum>].links`).
 *
 * Links kennen keine Rollen von sich aus — sie sind einfach Strukturen, die
 * Energie im Raum teleportieren. Was ein Link tut, ergibt sich erst aus seiner
 * Position: ein Link am Controller nimmt ab, ein Link am Storage nimmt ab, alle
 * übrigen Links senden (typischerweise an einer Quelle).
 *
 * Die zwei Empfänger standen früher als feste Ids in `config.ts`
 * (`spawnLink`/`controllerLink`). Das trägt nicht mehr, seit der Linkplaner
 * Links im laufenden Spiel baut — deren Ids kann niemand von Hand nachtragen.
 * Entschieden wird deshalb allein die Lage: der nächste Link zum Controller
 * (Reichweite 3, weil Upgrader auf dieser Distanz arbeiten) und der nächste zum
 * Storage (Reichweite 2, weil der Linkkeeper ein Feld braucht, das an Link
 * **und** Storage grenzt). Alle übrigen senden.
 *
 * Der Preis dieser Freiheit: liegt eine Quelle zufällig nahe am Controller,
 * würde ihr Quell-Link zum Empfänger. Dagegen hilft kein Code, sondern
 * Nachsehen — `discover()` meldet jede geänderte Zuordnung auf der Konsole.
 */

/**
 * Nutzt dieser Raum Links?
 *
 * Abgeleitet statt konfiguriert: ein eigener Raum, dessen RCL Links zulässt,
 * soll sie auch nutzen. Bewusst am **Kontingent** festgemacht und nicht daran,
 * ob schon Links stehen — sonst käme `controller/link-planner.ts` nie dazu, den
 * ersten zu bauen.
 *
 * `CONTROLLER_STRUCTURES` wird defensiv gelesen, weil `pnpm smoke` unbekannte
 * Konstanten über einen Proxy als `0` bereitstellt.
 */
export function usesLinks(roomName: string): boolean {
  const controller = Game.rooms[roomName]?.controller;
  if (!controller?.my) {
    return false;
  }

  return ((CONTROLLER_STRUCTURES as any)?.[STRUCTURE_LINK]?.[controller.level] ?? 0) > 0;
}

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

    const remaining = new Set(links.map(link => link.id));

    const controllerId = this.resolveController(room, links);
    if (controllerId) {
      remaining.delete(controllerId);
    }

    const spawnId = this.resolveSpawn(room, links, remaining);
    if (spawnId) {
      remaining.delete(spawnId);
    }

    const previous = memory.links;
    memory.links = {
      controller: controllerId,
      spawn: spawnId,
      sender: [...remaining],
    };

    this.reportChange(room.name, previous, memory.links);
  }

  /**
   * Meldet eine geänderte Zuordnung auf der Konsole — nur bei Änderung, nicht
   * bei jeder Erhebung.
   *
   * Der Grund ist Nachprüfbarkeit: seit die Empfänger nicht mehr in `config.ts`
   * stehen, entscheidet allein die Lage. Ob sie richtig entscheidet, sieht man
   * sonst nirgends. Ein Raum, in dem eine Quelle zufällig nah am Controller
   * liegt, würde deren Quell-Link zum Empfänger machen — das fällt hier auf.
   */
  private reportChange(roomName: string, previous: RoomLinks | undefined, current: RoomLinks): void {
    const unchanged =
      previous !== undefined &&
      previous.controller === current.controller &&
      previous.spawn === current.spawn &&
      previous.sender.length === current.sender.length &&
      previous.sender.every((id, index) => id === current.sender[index]);

    if (unchanged) {
      return;
    }

    console.log(
      `[${roomName}] Links: Controller=${current.controller ?? "-"}` +
        ` Storage=${current.spawn ?? "-"}` +
        ` Sender=${current.sender.length}`,
    );
  }

  /** Der Empfänger am Controller: der nächste Link in Reichweite 3. */
  private resolveController(room: Room, links: StructureLink[]): Id<StructureLink> | undefined {
    const controller = room.controller;
    if (!controller) {
      return undefined;
    }

    return this.nearestWithinRange(links, controller.pos, 3)?.id;
  }

  /** Der Empfänger am Storage: der nächste noch freie Link in Reichweite 2. */
  private resolveSpawn(
    room: Room,
    links: StructureLink[],
    candidates: Set<Id<StructureLink>>,
  ): Id<StructureLink> | undefined {
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

/**
 * Liefert das Linknetz des Raums die Energie tatsächlich ab?
 *
 * Nur dann darf ein Quellcontainer ohne Träger bleiben. Der RCL allein genügt
 * nicht: zwischen „Raum darf Links bauen" und „am Storage steht ein Empfänger,
 * der sie annimmt" liegen mehrere Tage Bauzeit, und in dieser Lücke bliebe die
 * Energie im Quell-Link liegen.
 *
 * Stand vorher als private Funktion in `roles/debitor.ts`; seit es mit `hauler`
 * einen zweiten Aufrufer gibt, gehört sie zur Linkliste.
 */
export function linksDeliver(roomName: string): boolean {
  return usesLinks(roomName) && new LinkList(roomName).spawnLink !== null;
}
