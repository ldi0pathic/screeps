/**
 * Charakterisierungstest für `src/prototypes/terminal-market.ts`.
 *
 * Für diese Datei gab es bisher keinen Test — dieser hier hält das **heutige**
 * Verhalten von `sell()` und `buyPixel()` fest, bevor die Datei auf eine
 * Klasse mit `@profile` umgebaut wird. Vorbild für Aufbau und Stubs:
 * `tests/creep-transport.test.ts` und `tests/support/screeps-stubs.ts`.
 *
 * `Game.market` und `StructureTerminal` gehören keinem anderen Modul und
 * werden deshalb bewusst hier gestellt, nicht in `support/screeps-stubs.ts`.
 *
 * Zwei Kniffe machen die Zahlen unabhängig von Rundung und Entfernungslogik:
 * - `calcTransactionCost(amount, roomA, roomB)` liefert `amount * rate(roomB)`.
 *   Damit ist `transferEnergyCost / amount` immer genau die konfigurierte
 *   Rate, unabhängig von der verkauften Menge — der 0,789-Schwellenwert lässt
 *   sich so ohne Rundungsrisiko treffen.
 * - `pos.getRangeTo(new RoomPosition(25, 25, roomName))` liefert die über
 *   `distanceByRoom` konfigurierte Entfernung für genau diesen Raumnamen.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;

/** Ein Aufruf von `Game.market.deal`. */
interface DealCall {
  orderId: string;
  amount: number;
  roomName?: string;
}

/** Ein Aufruf von `Game.market.getAllOrders`. */
interface OrdersCall {
  type: string;
  resourceType: string;
}

let dealCalls: DealCall[] = [];
let ordersCalls: OrdersCall[] = [];
let getHistoryCalls: Array<string | undefined> = [];
let historyByResource: Record<string, Array<{ avgPrice: number }>> = {};
let ordersByResource: Record<string, any[]> = {};
let costPerUnit: Record<string, number> = {};
let credits = 1_000_000;
let dealResult: number = 0;

/**
 * Baut Marktwelt und Terminal-Prototyp neu auf. Jeder Test ruft das zuerst
 * auf, damit Aufzeichnungen aus dem vorigen Test nicht nachwirken.
 */
function resetMarketWorld(): void {
  installGlobals();

  anyGlobal.ORDER_BUY = "buy";
  anyGlobal.ORDER_SELL = "sell";

  dealCalls = [];
  ordersCalls = [];
  getHistoryCalls = [];
  historyByResource = {};
  ordersByResource = {};
  costPerUnit = {};
  credits = 1_000_000;
  dealResult = anyGlobal.OK;

  anyGlobal.RoomPosition = class RoomPositionStub {
    constructor(
      public x: number,
      public y: number,
      public roomName: string,
    ) {}
  };

  anyGlobal.Game.market = {
    get credits(): number {
      return credits;
    },
    getHistory(resource?: string) {
      getHistoryCalls.push(resource);
      return historyByResource[resource ?? ""] ?? [];
    },
    getAllOrders(filter: { type: string; resourceType: string }) {
      ordersCalls.push({ type: filter.type, resourceType: filter.resourceType });
      return ordersByResource[`${filter.type}:${filter.resourceType}`] ?? [];
    },
    calcTransactionCost(amount: number, _fromRoom: string, toRoom: string) {
      return amount * (costPerUnit[toRoom] ?? 0);
    },
    deal(orderId: string, amount: number, roomName?: string) {
      dealCalls.push({ orderId, amount, roomName });
      return dealResult;
    },
  };

  // Eigene Klasse je Reset, damit `installTerminalMarket()` immer den
  // Prototyp trifft, an dem auch die Testterminals hängen.
  anyGlobal.StructureTerminal = class StructureTerminalStub {};
}

async function loadTerminalMarket(): Promise<typeof import("../src/prototypes/terminal-market")> {
  return await import("../src/prototypes/terminal-market");
}

/** Ein Store mit `getUsedCapacity`/`getFreeCapacity`, Methoden nicht aufzählbar. */
function stubStore(contents: Record<string, number>, capacity = 300000): any {
  const store: any = { ...contents };

  Object.defineProperties(store, {
    getUsedCapacity: {
      enumerable: false,
      value: (resource?: string): number =>
        resource !== undefined
          ? (store[resource] ?? 0)
          : Object.keys(contents).reduce((sum, key) => sum + (store[key] ?? 0), 0),
    },
    getFreeCapacity: {
      enumerable: false,
      value: (resource?: string): number => capacity - store.getUsedCapacity(resource),
    },
  });

  return store;
}

interface TerminalOptions {
  roomName?: string;
  cooldown?: number;
  store: any;
  distanceByRoom?: Record<string, number>;
}

/** Ein Terminal am aktuellen `StructureTerminal.prototype`, siehe Dateikopf. */
function stubTerminal(options: TerminalOptions): any {
  const terminal = Object.create(anyGlobal.StructureTerminal.prototype);
  terminal.cooldown = options.cooldown ?? 0;
  terminal.store = options.store;
  terminal.room = { name: options.roomName ?? "W1N1" };

  const distanceByRoom = options.distanceByRoom ?? {};
  terminal.pos = {
    getRangeTo(target: { roomName: string }): number {
      return distanceByRoom[target.roomName] ?? 0;
    },
  };

  return terminal;
}

// ---------------------------------------------------------------------------
// sell()
// ---------------------------------------------------------------------------

test("sell: Cooldown wird beachtet (> 1 blockiert, <= 1 erlaubt)", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  const blocked = stubTerminal({ cooldown: 2, store: stubStore({ energy: 2000, Z: 100 }) });
  blocked.sell();
  assert.equal(ordersCalls.length, 0, "bei Cooldown > 1 wird der Markt gar nicht erst befragt");
  assert.equal(dealCalls.length, 0);

  resetMarketWorld();
  await loadTerminalMarket();
  installTerminalMarket();
  historyByResource.Z = [{ avgPrice: 10 }];
  ordersByResource["buy:Z"] = [{ id: "ok1", roomName: "WOK", amount: 50, price: 8 }];
  costPerUnit.WOK = 0.1;

  const allowed = stubTerminal({ cooldown: 1, store: stubStore({ energy: 2000, Z: 100 }) });
  allowed.sell();
  assert.equal(dealCalls.length, 1, "bei Cooldown 1 verkauft das Terminal weiterhin");
});

test("sell: NEVER_SELL-Ressourcen werden nicht verkauft", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.Z = [{ avgPrice: 10 }];
  ordersByResource["buy:Z"] = [{ id: "z1", roomName: "WZ", amount: 100, price: 8 }];
  costPerUnit.WZ = 0.1;

  const terminal = stubTerminal({
    store: stubStore({ energy: 2000, pixel: 100, power: 50, Z: 100 }),
  });
  terminal.sell();

  assert.deepEqual(
    ordersCalls.map(c => c.resourceType),
    ["Z"],
    "nur die verkäufliche Ressource wird am Markt angefragt",
  );
  assert.equal(
    getHistoryCalls.includes("pixel") || getHistoryCalls.includes("power") || getHistoryCalls.includes("energy"),
    false,
    "für NEVER_SELL-Ressourcen wird nicht einmal die Historie geholt",
  );
  assert.equal(dealCalls.length, 1);
});

test("sell: T1-Boosts und ihre Zwischenprodukte bekommen den Festpreis 0,001 ohne Historienabfrage", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  ordersByResource["buy:UH2O"] = [{ id: "boost", roomName: "WBOOST", amount: 100, price: 0.01 }];
  costPerUnit.WBOOST = 0.01;

  const boostTerminal = stubTerminal({ store: stubStore({ energy: 2000, UH2O: 100 }) });
  boostTerminal.sell();

  assert.equal(getHistoryCalls.includes("UH2O"), false, "T1-Boost: kein Blick in die Historie");
  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.orderId, "boost");

  resetMarketWorld();
  await loadTerminalMarket();
  installTerminalMarket();
  ordersByResource["buy:UH"] = [{ id: "intermediate", roomName: "WINT", amount: 100, price: 0.01 }];
  costPerUnit.WINT = 0.01;

  const intermediateTerminal = stubTerminal({ store: stubStore({ energy: 2000, UH: 100 }) });
  intermediateTerminal.sell();

  assert.equal(getHistoryCalls.includes("UH"), false, "T1-Zwischenprodukt: kein Blick in die Historie");
  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.orderId, "intermediate");
});

test("sell: Fallback-Preis aus der Historie ist der Faktor 0,7 auf den Durchschnitt", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  // Durchschnitt 15, Mindestpreis also 10.5.
  historyByResource.Z = [{ avgPrice: 10 }, { avgPrice: 20 }];
  ordersByResource["buy:Z"] = [
    { id: "zu-billig", roomName: "WLOW", amount: 50, price: 10 },
    { id: "reicht", roomName: "WHIGH", amount: 50, price: 11 },
  ];
  costPerUnit.WLOW = 0.1;
  costPerUnit.WHIGH = 0.1;

  const terminal = stubTerminal({
    store: stubStore({ energy: 2000, Z: 100 }),
    distanceByRoom: { WLOW: 1, WHIGH: 2 },
  });
  terminal.sell();

  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.orderId, "reicht", "nur das Angebot über dem Mindestpreis wird angenommen");

  resetMarketWorld();
  await loadTerminalMarket();
  installTerminalMarket();
  historyByResource.Z = [{ avgPrice: 10 }, { avgPrice: 20 }];
  ordersByResource["buy:Z"] = [{ id: "zu-billig", roomName: "WLOW", amount: 50, price: 10 }];
  costPerUnit.WLOW = 0.1;

  const noneQualify = stubTerminal({ store: stubStore({ energy: 2000, Z: 100 }) });
  noneQualify.sell();
  assert.equal(dealCalls.length, 0, "bleibt jedes Angebot unter dem Mindestpreis, wird nichts verkauft");
});

test("sell: höchstens ein deal pro Aufruf, auch mit mehreren verkäuflichen Ressourcen", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.Z = [{ avgPrice: 10 }];
  historyByResource.L = [{ avgPrice: 10 }];
  ordersByResource["buy:Z"] = [{ id: "z1", roomName: "WZ", amount: 50, price: 8 }];
  ordersByResource["buy:L"] = [{ id: "l1", roomName: "WL", amount: 50, price: 8 }];
  costPerUnit.WZ = 0.1;
  costPerUnit.WL = 0.1;

  const terminal = stubTerminal({ store: stubStore({ energy: 2000, Z: 100, L: 100 }) });
  terminal.sell();

  assert.equal(dealCalls.length, 1, "sell() kehrt nach dem ersten erfolgreichen deal zurück");
  assert.deepEqual(
    ordersCalls.map(c => c.resourceType),
    ["Z"],
    "die zweite Ressource wird gar nicht erst abgefragt",
  );
});

test("sell: leere Historie verkauft die Ressource nicht", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  // historyByResource.Z bleibt unbesetzt -> getHistory liefert [].
  const terminal = stubTerminal({ store: stubStore({ energy: 2000, Z: 100 }) });
  terminal.sell();

  assert.equal(ordersCalls.length, 0, "ohne Mindestpreis wird der Markt gar nicht befragt");
  assert.equal(dealCalls.length, 0);
});

test("sell: leere Orderliste verkauft die Ressource nicht", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.Z = [{ avgPrice: 10 }];
  // ordersByResource["buy:Z"] bleibt unbesetzt -> getAllOrders liefert [].

  const terminal = stubTerminal({ store: stubStore({ energy: 2000, Z: 100 }) });
  terminal.sell();

  assert.deepEqual(ordersCalls.map(c => c.resourceType), ["Z"]);
  assert.equal(dealCalls.length, 0);
});

test("sell: teurer Transfer wird übersprungen, das nächste Angebot zieht", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.Z = [{ avgPrice: 10 }]; // Mindestpreis 7
  ordersByResource["buy:Z"] = [
    { id: "teurer-transfer", roomName: "WEXP", amount: 100, price: 8 },
    { id: "guenstiger-transfer", roomName: "WCHEAP", amount: 100, price: 8 },
  ];
  costPerUnit.WEXP = 1.0; // costPerRes 1.0 >= 0.789 -> wird übersprungen
  costPerUnit.WCHEAP = 0.5; // costPerRes 0.5 < 0.789 -> wird angenommen

  const terminal = stubTerminal({
    store: stubStore({ energy: 2000, Z: 1000 }),
    // Das teurere Angebot liegt näher, damit die Sortierung es zuerst versucht.
    distanceByRoom: { WEXP: 1, WCHEAP: 2 },
  });
  terminal.sell();

  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.orderId, "guenstiger-transfer");
  assert.equal(dealCalls[0]!.amount, 100);
});

test("sell: fehlt die Energie für den vollen Transfer, wird die Menge gekappt", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.Z = [{ avgPrice: 10 }]; // Mindestpreis 7
  ordersByResource["buy:Z"] = [{ id: "gross", roomName: "WBIG", amount: 2000, price: 8 }];
  costPerUnit.WBIG = 0.7; // unter 0,789, also grundsätzlich verkäuflich

  const terminal = stubTerminal({
    // 1000 Energie, aber genug Z, dass die Order (2000) nicht durch die
    // eigenen Bestände begrenzt wird.
    store: stubStore({ energy: 1000, Z: 2000 }),
  });
  terminal.sell();

  // amount = min(order.amount=2000, capa=2000) = 2000
  // transferEnergyCost = 2000 * 0.7 = 1400 > terminalEnergy (1000)
  // amount = floor(1000 / 0.7) = 1428
  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.amount, 1428);
});

// ---------------------------------------------------------------------------
// buyPixel()
// ---------------------------------------------------------------------------

test("buyPixel: Cooldown wird beachtet (> 1 blockiert, <= 1 erlaubt)", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  const blocked = stubTerminal({ cooldown: 2, store: stubStore({ energy: 2000 }, 300000) });
  blocked.buyPixel();
  assert.equal(getHistoryCalls.length, 0, "bei Cooldown > 1 wird nicht einmal die Historie geholt");
  assert.equal(dealCalls.length, 0);

  resetMarketWorld();
  await loadTerminalMarket();
  installTerminalMarket();
  historyByResource.pixel = [{ avgPrice: 10 }];
  ordersByResource["sell:pixel"] = [{ id: "ok1", roomName: "WOK", amount: 10, price: 5 }];
  costPerUnit.WOK = 0.01;

  const allowed = stubTerminal({ cooldown: 1, store: stubStore({ energy: 2000 }, 300000) });
  allowed.buyPixel();
  assert.equal(dealCalls.length, 1, "bei Cooldown 1 kauft das Terminal weiterhin");
});

test("buyPixel: Preisgrenze ist der Faktor 1,1 auf den Historiendurchschnitt", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  // Durchschnitt 100 -> faire Grenze floor(110) = 110.
  historyByResource.pixel = [{ avgPrice: 100 }];
  ordersByResource["sell:pixel"] = [
    { id: "zu-teuer", roomName: "WPRICEY", amount: 10, price: 115 },
    { id: "passt", roomName: "WFAIR", amount: 10, price: 100 },
  ];
  costPerUnit.WPRICEY = 0.01;
  costPerUnit.WFAIR = 0.01;

  const terminal = stubTerminal({ store: stubStore({ energy: 100000 }, 300000) });
  terminal.buyPixel();

  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.orderId, "passt", "nur das Angebot unter der Preisgrenze wird gekauft");

  resetMarketWorld();
  await loadTerminalMarket();
  installTerminalMarket();
  historyByResource.pixel = [{ avgPrice: 100 }];
  ordersByResource["sell:pixel"] = [{ id: "zu-teuer", roomName: "WPRICEY", amount: 10, price: 115 }];
  costPerUnit.WPRICEY = 0.01;

  const noneQualify = stubTerminal({ store: stubStore({ energy: 100000 }, 300000) });
  noneQualify.buyPixel();
  assert.equal(dealCalls.length, 0, "liegt jedes Angebot über der Grenze, wird nichts gekauft");
});

test("buyPixel: die feste Mengenobergrenze ist 50", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.pixel = [{ avgPrice: 10 }]; // faire Grenze 11
  ordersByResource["sell:pixel"] = [{ id: "riesig", roomName: "WCAP", amount: 1000, price: 1 }];
  costPerUnit.WCAP = 0.01;
  credits = 1_000_000; // begrenzt hier nicht

  const terminal = stubTerminal({ store: stubStore({ energy: 1_000_000 }, 2_000_000) });
  terminal.buyPixel();

  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.amount, 50, "weder Orderumfang, Credits noch Energie sind hier das Limit");
});

test("buyPixel: höchstens ein deal pro Aufruf, das günstigste Angebot gewinnt", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.pixel = [{ avgPrice: 100 }]; // faire Grenze 110
  ordersByResource["sell:pixel"] = [
    { id: "teurer", roomName: "WX", amount: 10, price: 50 },
    { id: "guenstiger", roomName: "WY", amount: 10, price: 20 },
  ];
  costPerUnit.WX = 0.01;
  costPerUnit.WY = 0.01;

  const terminal = stubTerminal({ store: stubStore({ energy: 100000 }, 300000) });
  terminal.buyPixel();

  assert.equal(dealCalls.length, 1);
  assert.equal(dealCalls[0]!.orderId, "guenstiger");
});

test("buyPixel: leere Historie kauft nichts", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  // historyByResource.pixel bleibt unbesetzt -> getHistory liefert [].
  const terminal = stubTerminal({ store: stubStore({ energy: 100000 }, 300000) });
  terminal.buyPixel();

  assert.deepEqual(getHistoryCalls, ["pixel"]);
  assert.equal(ordersCalls.length, 0, "ohne faire Preisgrenze wird der Markt gar nicht befragt");
  assert.equal(dealCalls.length, 0);
});

test("buyPixel: leere Orderliste kauft nichts", async () => {
  resetMarketWorld();
  const { installTerminalMarket } = await loadTerminalMarket();
  installTerminalMarket();

  historyByResource.pixel = [{ avgPrice: 10 }];
  // ordersByResource["sell:pixel"] bleibt unbesetzt -> getAllOrders liefert [].

  const terminal = stubTerminal({ store: stubStore({ energy: 100000 }, 300000) });
  terminal.buyPixel();

  assert.deepEqual(ordersCalls, [{ type: "sell", resourceType: "pixel" }]);
  assert.equal(dealCalls.length, 0);
});
