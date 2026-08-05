/**
 * Die Containerliste eines Raums (`Memory.rooms[<raum>].container`).
 *
 * Container sind das Zwischenlager des Raums: Miner füllen sie, Debitoren leeren
 * sie. Beide Seiten suchten bisher denselben nächstgelegenen Container aus
 * derselben Memory-Liste — einmal in `creep/base.ts` (holen), einmal in
 * `creep/transport.ts` (abliefern), mit gespiegelten Bedingungen und je eigener
 * Entfernungsrechnung.
 *
 * Hier steckt, was beide Seiten gleich machen: die Liste kennen, sie bei Bedarf
 * neu erheben und den nächstgelegenen passenden Container finden. **Was** passend
 * heißt, gibt der Aufrufer als Prüfung mit — beim Holen zählt der Inhalt, beim
 * Abliefern der freie Platz.
 */

/** Raum-Memory, soweit es hier interessiert. */
type ContainerRoomMemory = RoomMemory & {
  container?: string[];
};

export interface NearestOptions {
  /**
   * Eine Id in der Liste, zu der es kein Objekt mehr gibt, verwirft die ganze
   * Liste — sie wird dann beim nächsten Durchgang neu erhoben.
   *
   * Nur die Beschaffungsseite tut das; die Ablieferseite überspringt eine solche
   * Id stillschweigend. Der Unterschied ist alt und bleibt hier bewusst
   * erhalten, damit dieser Umbau kein Verhalten ändert.
   */
  forgetListOnStaleId?: boolean;
}

export class ContainerList {
  constructor(private readonly roomName: string) {}

  private get roomMemory(): ContainerRoomMemory | undefined {
    return Memory.rooms[this.roomName] as ContainerRoomMemory | undefined;
  }

  /** Kennt der Bot den Raum überhaupt? Ohne Raum-Memory gibt es nichts zu tun. */
  get isRoomKnown(): boolean {
    return this.roomMemory !== undefined;
  }

  /**
   * Liegt überhaupt eine Liste vor — auch eine leere?
   *
   * Der Unterschied zu `hasEntries` ist keine Spitzfindigkeit: die Ablieferseite
   * behandelt eine **leere** Liste als „keine Container da" und erhebt sie nicht
   * neu, die Beschaffungsseite erhebt sie neu. Beides war schon so und bleibt so.
   */
  get hasList(): boolean {
    return this.roomMemory?.container !== undefined;
  }

  /** Liegt eine nicht leere Liste vor? */
  get hasEntries(): boolean {
    const ids = this.roomMemory?.container;
    return ids !== undefined && ids.length > 0;
  }

  /** Verwirft die Liste; sie wird dann neu erhoben. */
  forget(): void {
    const memory = this.roomMemory;
    if (memory) {
      delete memory.container;
    }
  }

  /**
   * Erhebt die Container des Raums und schreibt die Liste ins Memory.
   * Liefert `true`, wenn es welche gibt — der Aufrufer beendet damit seinen Tick,
   * denn geholt oder abgeliefert wurde in diesem Durchgang noch nichts.
   */
  discover(room: Room): boolean {
    const memory = this.roomMemory;
    if (!memory) {
      return false;
    }

    const containers = room.find(FIND_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER,
    });

    memory.container = containers.map(container => container.id);
    return containers.length > 0;
  }

  /**
   * Der nächstgelegene Container, der `accepts` erfüllt — oder `null`.
   *
   * Verglichen wird die **quadrierte** Entfernung: für die Reihenfolge ist das
   * dasselbe wie die Wurzel, spart aber je Kandidat eine Wurzelberechnung.
   */
  nearest(
    creep: Creep,
    accepts: (container: any) => boolean,
    options: NearestOptions = {},
  ): any {
    const ids = this.roomMemory?.container;
    if (!ids) {
      return null;
    }

    let nearest: any = null;
    let nearestDistance = Infinity;

    for (const id of ids) {
      const container: any = Game.getObjectById(id as Id<any>);

      if (!container) {
        if (options.forgetListOnStaleId) {
          this.forget();
        }
        continue;
      }

      if (!accepts(container)) {
        continue;
      }

      const dx = container.pos.x - creep.pos.x;
      const dy = container.pos.y - creep.pos.y;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = container;
      }
    }

    return nearest;
  }
}
