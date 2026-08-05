/**
 * Baut selbständig die beiden Empfänger-Links eines Raums: den Link am
 * Controller und den Link am Storage.
 *
 * Läuft in der Tagessequenz und legt je Aufruf höchstens eine Baustelle an –
 * analog zu `rebuild.ts` für Straßen. Anders als dort gibt es keine gemerkte
 * Position: die Kandidatensuche läuft jedes Mal neu über die Live-Geometrie
 * des Raums, weil ein Empfänger-Link nur einmal pro Raum entsteht und sich
 * danach erübrigt.
 *
 * Die Platzwahl bevorzugt kurze Distanzen zu den sendenden Links (Quell-Links
 * typischerweise), weil der Cooldown eines Links seiner Entfernung zum Ziel
 * entspricht – kurze Strecken heißen mehr Durchsatz. Gibt es noch keine
 * sendenden Links, dienen ersatzweise die Quellen des Raums als Referenz.
 */

import { bot } from "../globals";

// Straße, Container und Rampart tauchen hier bewusst nicht auf – sie
// blockieren einen Linkplatz nicht. OBSTACLE_OBJECT_TYPES ist die von Screeps
// gepflegte Liste blockierender Strukturtypen (siehe roles/linkkeeper.ts).
const blockingStructureTypes: string[] = OBSTACLE_OBJECT_TYPES;

/** Höchstens so viele Baustellen dürfen gleichzeitig in einem Raum liegen (wie rebuild.ts). */
const MAX_CONSTRUCTION_SITES = 10;

export class LinkPlanner {
  constructor(private readonly roomName: string) {}

  /** Legt höchstens eine Linkbaustelle an. `true`, wenn eine entstanden ist. */
  plan(): boolean {
    const config = bot.room[this.roomName];
    if (!config?.useLinks) return false;

    const room = Game.rooms[this.roomName];
    if (!room) return false;

    const controller = room.controller;
    if (!controller || !controller.my || controller.level < 5) return false;

    if (this.freeLinkSlots(room, controller.level) <= 0) return false;

    const freeConstructionSlots = MAX_CONSTRUCTION_SITES - room.find(FIND_CONSTRUCTION_SITES).length;
    if (freeConstructionSlots <= 0) return false;

    if (this.buildControllerLink(room, controller)) return true;
    return this.buildStorageLink(room, controller);
  }

  /** Wie viele Links in diesem Raum noch gebaut werden dürfen, abzüglich vorhandener und geplanter. */
  private freeLinkSlots(room: Room, level: number): number {
    // Defensiv gelesen: der Smoketest (pnpm smoke) stellt unbekannte
    // Screeps-Konstanten über einen Proxy als 0 bereit; ein direkter
    // Doppelindex würde dort werfen und den Smoketest rot machen.
    const allowed = (CONTROLLER_STRUCTURES as any)?.[STRUCTURE_LINK]?.[level] ?? 0;

    const built = room.find(FIND_MY_STRUCTURES, { filter: (s: any) => s.structureType === STRUCTURE_LINK }).length;
    const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: (s: any) => s.structureType === STRUCTURE_LINK }).length;

    return allowed - built - sites;
  }

  /** Plant den Controller-Link, falls in Reichweite 3 noch keiner steht (auch keine Baustelle). */
  private buildControllerLink(room: Room, controller: StructureController): boolean {
    if (this.hasLinkNear(room, controller.pos, 3)) return false;

    const candidates = this.candidatesNearController(room, controller.pos);
    const best = this.selectBest(candidates, room, controller, room.storage);
    if (!best) return false;

    return this.build(room, best, "Controller");
  }

  /** Plant den Storage-Link, falls ein Storage existiert und in Reichweite 2 noch keiner steht. */
  private buildStorageLink(room: Room, controller: StructureController): boolean {
    const storage = room.storage;
    if (!storage) return false;
    if (this.hasLinkNear(room, storage.pos, 2)) return false;

    const candidates = this.candidatesNearStorage(room, storage);
    const best = this.selectBest(candidates, room, controller, storage);
    if (!best) return false;

    return this.build(room, best, "Storage");
  }

  /** Steht (gebaut oder als Baustelle) bereits ein Link in `range` um `pos`? */
  private hasLinkNear(room: Room, pos: RoomPosition, range: number): boolean {
    const links = room.find(FIND_MY_STRUCTURES, { filter: (s: any) => s.structureType === STRUCTURE_LINK }) as StructureLink[];
    if (links.some(link => link.pos.getRangeTo(pos) <= range)) return true;

    const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: (s: any) => s.structureType === STRUCTURE_LINK });
    return sites.some(site => site.pos.getRangeTo(pos) <= range);
  }

  /**
   * Kandidatenfelder für den Controller-Link: bevorzugt Reichweite 2, damit
   * ein Upgrader (Arbeitsdistanz 3 zum Controller) neben dem Link stehen und
   * zugleich upgraden kann. Findet sich dort keins, weicht die Suche auf
   * Reichweite 3, danach auf Reichweite 1 aus.
   */
  private candidatesNearController(room: Room, controllerPos: RoomPosition): RoomPosition[] {
    for (const range of [2, 3, 1]) {
      const positions = this.positionsAtRange(room, controllerPos, range).filter(pos => this.isBuildable(pos, room));
      if (positions.length > 0) return positions;
    }

    return [];
  }

  /**
   * Kandidatenfelder für den Storage-Link: alle bebaubaren Felder bis
   * Reichweite 2, für die zusätzlich ein Standplatz für den Linkkeeper
   * existiert – ein begehbares Feld, das an Link **und** Storage zugleich
   * angrenzt (siehe roles/linkkeeper.ts::_findPost). Ohne diesen Platz wäre
   * der Link nicht leerbar.
   */
  private candidatesNearStorage(room: Room, storage: StructureStorage): RoomPosition[] {
    const positions: RoomPosition[] = [];

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const x = storage.pos.x + dx;
        const y = storage.pos.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;

        const pos = new RoomPosition(x, y, room.name);
        if (!this.isBuildable(pos, room)) continue;
        if (!this.hasKeeperPost(pos, storage, room)) continue;

        positions.push(pos);
      }
    }

    return positions;
  }

  /** Gibt es ein Feld, das an `linkPos` und `storage` zugleich angrenzt und begehbar ist? */
  private hasKeeperPost(linkPos: RoomPosition, storage: StructureStorage, room: Room): boolean {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const x = linkPos.x + dx;
        const y = linkPos.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;

        const pos = new RoomPosition(x, y, room.name);
        if (!pos.isNearTo(storage.pos)) continue;
        if (!this.isBuildable(pos, room)) continue;

        return true;
      }
    }

    return false;
  }

  /** Alle Felder mit Chebyshev-Abstand `range` genau zu `center`, innerhalb der Raumgrenzen. */
  private positionsAtRange(room: Room, center: RoomPosition, range: number): RoomPosition[] {
    const positions: RoomPosition[] = [];

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== range) continue;

        const x = center.x + dx;
        const y = center.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;

        positions.push(new RoomPosition(x, y, room.name));
      }
    }

    return positions;
  }

  /** Feld begehbar und unverbaut: kein Wall-Terrain, kein blockierendes Bauwerk oder Baustelle. */
  private isBuildable(pos: RoomPosition, room: Room): boolean {
    if (pos.x < 1 || pos.x > 48 || pos.y < 1 || pos.y > 48) return false;

    const terrain = room.getTerrain();
    if ((terrain.get(pos.x, pos.y) & TERRAIN_MASK_WALL) !== 0) return false;

    const blockedByStructure = pos.lookFor(LOOK_STRUCTURES).some(s => blockingStructureTypes.includes(s.structureType));
    if (blockedByStructure) return false;

    const blockedBySite = pos.lookFor(LOOK_CONSTRUCTION_SITES).some(s => blockingStructureTypes.includes(s.structureType));
    return !blockedBySite;
  }

  /**
   * Wählt aus `candidates` das beste Feld: kleinste Summe der Entfernungen zu
   * den Referenzpositionen gewinnt, bei Gleichstand das Feld mit mehr
   * begehbaren Nachbarfeldern – ein Link soll keinen Engpass zubauen.
   */
  private selectBest(
    candidates: RoomPosition[],
    room: Room,
    controller: StructureController,
    storage: StructureStorage | undefined,
  ): RoomPosition | null {
    if (candidates.length === 0) return null;

    const referencePositions = this.referencePositions(room, controller, storage);

    let best: RoomPosition | null = null;
    let bestScore = Infinity;
    let bestNeighbors = -1;

    for (const candidate of candidates) {
      const score = this.distanceSum(candidate, referencePositions);
      const neighbors = this.walkableNeighborCount(candidate, room);

      if (score < bestScore || (score === bestScore && neighbors > bestNeighbors)) {
        best = candidate;
        bestScore = score;
        bestNeighbors = neighbors;
      }
    }

    return best;
  }

  /**
   * Referenzpositionen für die Entfernungsbewertung: die sendenden Links des
   * Raums (weder Controller- noch Storage-Empfänger), ersatzweise die
   * Quellen, solange noch kein sendender Link existiert.
   */
  private referencePositions(room: Room, controller: StructureController, storage: StructureStorage | undefined): RoomPosition[] {
    const sendingLinks = this.sendingLinks(room, controller, storage);
    if (sendingLinks.length > 0) return sendingLinks.map(link => link.pos);

    return room.find(FIND_SOURCES).map(source => source.pos);
  }

  /** Alle gebauten Links des Raums, die weder Controller- noch Storage-Empfänger sind. */
  private sendingLinks(room: Room, controller: StructureController, storage: StructureStorage | undefined): StructureLink[] {
    const links = room.find(FIND_MY_STRUCTURES, { filter: (s: any) => s.structureType === STRUCTURE_LINK }) as StructureLink[];

    return links.filter(link => {
      if (link.pos.getRangeTo(controller.pos) <= 3) return false;
      if (storage && link.pos.getRangeTo(storage.pos) <= 2) return false;
      return true;
    });
  }

  private distanceSum(pos: RoomPosition, targets: RoomPosition[]): number {
    let sum = 0;
    for (const target of targets) sum += pos.getRangeTo(target);
    return sum;
  }

  private walkableNeighborCount(pos: RoomPosition, room: Room): number {
    const terrain = room.getTerrain();
    let count = 0;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const x = pos.x + dx;
        const y = pos.y + dy;
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        if ((terrain.get(x, y) & TERRAIN_MASK_WALL) === 0) count++;
      }
    }

    return count;
  }

  /** Legt die Baustelle auf `pos` an und meldet das Ergebnis. */
  private build(room: Room, pos: RoomPosition, label: string): boolean {
    const result = pos.createConstructionSite(STRUCTURE_LINK);
    if (result !== OK) return false;

    console.log("[" + room.name + "] Linkbaustelle (" + label + "-Link) angelegt bei " + pos.x + "," + pos.y);
    return true;
  }
}

/** Plant und baut die fehlenden Empfängerlinks aller verwalteten Räume. */
export function planReceiverLinks(): void {
  for (const roomName in bot.room) {
    new LinkPlanner(roomName).plan();
  }
}
