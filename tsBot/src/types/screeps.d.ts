export {};

declare global {
  /**
   * lodash ist im Screeps-Runtime global verfügbar. `prod/` nutzt es an
   * einigen Stellen (`_.filter`, `_.sum`); die migrierten Module behalten
   * diese Aufrufe bei. Kein `@types/lodash` im Projekt, daher bewusst `any`.
   */
  const _: any;

  interface CreepMemory {
    [key: string]: any;
  }

  interface RoomMemory {
    [key: string]: any;
  }

  interface Memory {
    init?: boolean;
    terminals?: string[];
  }

  interface Creep {
    checkHarvest(action?: () => void, action2?: () => void): void;
    checkInvasion(): boolean;
    checkWorkroomPrioSpawn(): boolean;
    checkTombstones(min?: number): boolean;
    checkDrops(min?: number): boolean;
    checkRuins(min?: number): boolean;
    checkAllContainer(min?: number): boolean;
    checkSource(): void;
    checkSavedAction(): boolean;
  }

  interface StructureTerminal {
    sell(): void;
    buy(): void;
    buyPixel(): void;
  }

  namespace NodeJS {
    interface Global {
      room: Record<string, unknown>;
      prio: Record<string, unknown>;
      const: Record<string, unknown>;
      minSalePrice: Record<string, number>;
      maxOrderPrice: Record<string, number>;
      transfer: Record<string, unknown>;
      log(enabled: boolean, message: unknown): void;
      logWorkroom(room: string, message: string): void;
    }
  }
}
