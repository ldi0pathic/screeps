/**
 * Typisierter Zugriff auf die statische Konfiguration in `global.*`.
 *
 * `bot` ist dasselbe Objekt wie `global` – der Handle existiert nur, damit die
 * Konfiguration typisiert gelesen werden kann. `global.const` lässt sich nicht
 * als globale Variable deklarieren (reserviertes Wort), deshalb der Handle
 * statt einer `declare global`-Deklaration.
 */

/** Eine Raumdefinition aus `global.room`. */
export interface RoomConfig {
  room: string;
  /** Raum, dessen Spawns die Creeps für diesen Arbeitsraum stellen. */
  spawnRoom: string;

  transferEnergie?: boolean;
  claim?: boolean;
  sendMiner?: boolean;
  sendDebitor?: boolean;
  sendFreeDebitor?: boolean;
  sendBuilder?: boolean;
  sendDefender?: boolean;
  sendClaimer?: boolean;
  /** Ab wie vielen Feinden Verteidigung ausgelöst wird (Standard 1). */
  minHostile?: number;
  saveRoads?: boolean;

  // Abbau
  /** Derzeit von keinem Modul gelesen, nur dokumentierender Konfigwert. */
  debitorProSource?: number;
  debitorAsFreelancer?: number;
  energySources?: string[];
  mineralSources?: string[];
  mineralContainerId?: string | null;

  useLinks?: boolean;
  targetLinks?: string[];
  spawnLink?: string | null;
  controllerLink?: string | null;

  // Strukturen
  repairer?: number;
  maxwallRepairer?: number;
  maxbuilder?: number;
  prioBuildings?: string[];
  destroy?: string[];
  /** Derzeit von keinem Modul gelesen. */
  walls?: string[];

  // Controller
  upgrader?: number;
}

/** Ein Eintrag aus `global.transfer`: Zielraum mit seinen Quellräumen. */
export interface TransferConfig {
  room: string;
  source: string[];
}

/** Prioritätstabellen; kleinerer Wert bedeutet höhere Priorität. */
export interface PrioConfig {
  build: Partial<Record<StructureConstant, number>>;
  repair: Partial<Record<StructureConstant, number>>;
  /** Reparaturschwelle als Anteil der Maximalhits. */
  hits: Partial<Record<StructureConstant, number>>;
}

export interface ConstConfig {
  maxRepairs: number;
  /** Optionaler Filter für `logWorkroom`; leer heißt kein Logging. */
  logroom: string;
  /** Zeichnet den Restpfad jedes bewegten Creeps. Nur zur Fehlersuche. */
  showPaths: boolean;
}

export interface BotGlobal {
  room: Record<string, RoomConfig>;
  prio: PrioConfig;
  const: ConstConfig;
  transfer: Record<string, TransferConfig>;
  log(condition: boolean, message: unknown): void;
  logWorkroom(room: string, message: string): void;
}

export const bot = global as typeof global & BotGlobal;
