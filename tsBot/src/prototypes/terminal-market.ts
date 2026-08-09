/**
 * Marktlogik als Terminal-Prototypen: `sell()` und `buyPixel()`.
 *
 * Die eigentliche Logik steckt in der Klasse `TerminalMarket`, damit `@profile`
 * sie messen kann (Vorbild: `controller/link-planner.ts`, `roles/upgrader.ts`).
 * `installTerminalMarket()` hängt an `StructureTerminal.prototype` nur noch
 * dünne Aufrufer — die Signatur `sell(): void` / `buyPixel(): void` muss exakt
 * zur Ambient-Deklaration in `types/screeps.d.ts` passen, die hier nicht
 * angefasst wird.
 *
 * Verhaltensgleich zum ursprünglichen Stand ohne Klasse (siehe
 * `docs/aenderungen.md`); inhaltlich weiterhin nah an
 * `prod/prototype.terminal.market.js`.
 */

import { profile } from "../profiler/decorator";

const T1_BOOSTS: Record<string, boolean> = {
  UH2O: true,
  UHO2: true,
  KH2O: true,
  KHO2: true,
  ZH2O: true,
  ZHO2: true,
  LH2O: true,
  LHO2: true,
  GH2O: true,
  GHO2: true,
};

const T1_INTERMEDIATES: Record<string, boolean> = {
  UH: true,
  UO: true,
  KH: true,
  KO: true,
  ZH: true,
  ZO: true,
  LH: true,
  LO: true,
  GH: true,
  GO: true,
};

/**
 * Was nie verkauft wird.
 *
 * Steht hier und nicht bei den Rollen, weil `sell()` sie auswertet — es ist
 * Marktwissen. Gelesen wird sie außerdem von `roles/debitor.ts` und
 * `roles/collector.ts`, die entscheiden, was sie überhaupt erst ins Terminal
 * tragen. Vorher stand die Liste zweimal im Code und musste von Hand synchron
 * gehalten werden.
 */
export const NEVER_SELL: Record<string, boolean> = {
  energy: true,
  power: true,
  pixel: true,
  XUH2O: true,
  XUHO2: true,
  XKHO2: true,
  XKH2O: true,
  XZH2O: true,
  XZHO2: true,
  XLH2O: true,
  XLHO2: true,
  XGH2O: true,
  XGHO2: true,
};

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class TerminalMarket {
  /**
   * Verkauft höchstens eine Ressource je Aufruf über eine Kauf-Order am Markt.
   * Energie wird nie verkauft, sondern nur als Deckung für die Transferkosten
   * geprüft.
   */
  sell(terminal: StructureTerminal): void {
    if (terminal.cooldown > 1) return;

    const terminalEnergy = terminal.store.getUsedCapacity(RESOURCE_ENERGY);

    if (
      terminalEnergy < 1000 ||
      terminalEnergy >= terminal.store.getUsedCapacity()
    )
      return;

    for (const resource in terminal.store) {
      if (NEVER_SELL[resource]) continue;

      const minPrice = this.getFallbackPrice(resource);
      if (!minPrice) continue;

      const orders = Game.market.getAllOrders({
        type: ORDER_BUY,
        resourceType: resource as MarketResourceConstant,
      });

      const marketOrdersWithDistances = orders
        .filter((o) => o.price >= minPrice!)
        .map((order) => {
          const distance = terminal.pos.getRangeTo(
            new RoomPosition(25, 25, order.roomName!),
          );
          return {
            order,
            distance,
          };
        })
        .sort((a, b) => a.distance - b.distance);

      const capa = terminal.store.getUsedCapacity(resource as ResourceConstant);
      for (let i = 0; i < marketOrdersWithDistances.length; i++) {
        const order = marketOrdersWithDistances[i]!.order;
        let amount = order.amount > capa! ? capa! : order.amount;
        const transferEnergyCost = Game.market.calcTransactionCost(
          amount,
          terminal.room.name,
          order.roomName!,
        );

        const costPerRes = transferEnergyCost / amount;
        if (costPerRes < 0.789) {
          if (transferEnergyCost > terminalEnergy)
            amount = Math.floor(terminalEnergy / costPerRes);

          if (OK == Game.market.deal(order.id, amount, terminal.room.name)) {
            console.log(
              "[" +
                terminal.room.name +
                "] " +
                resource +
                " verkauft: " +
                amount +
                " zu " +
                order.price,
            );
            return;
          }
        }
      }
    }
  }

  /**
   * Kauft Pixel, solange ein Angebot unter der fairen Preisgrenze liegt.
   * Effektivpreis schließt die Transferenergie mit ein.
   */
  buyPixel(terminal: StructureTerminal): void {
    if (terminal.cooldown > 1) return;

    const terminalEnergy = terminal.store.getUsedCapacity("energy");
    const freeCapacity = terminal.store.getFreeCapacity();

    if (terminalEnergy < 1000 || freeCapacity <= 10) return;

    const resource = "pixel"; // <-- hier den String verwenden

    // fairer Preis anhand Markt-Historie
    const avgPrice = this.averageHistoryPrice(resource);
    if (avgPrice === null) return;
    const fairPrice = Math.floor(avgPrice * 1.1); // 10% über Marktavg (Historie)

    const orders = Game.market.getAllOrders({
      type: ORDER_SELL,
      resourceType: resource,
    });
    if (!orders.length) return;

    const valid = orders
      .filter((o) => o.roomName)
      .map((o) => {
        const energyCost = Game.market.calcTransactionCost(
          1,
          terminal.room.name,
          o.roomName!,
        );
        const effectivePrice = o.price + energyCost / Math.min(o.amount, 50);
        return { o, energyCost, effectivePrice };
      })
      .filter(
        (x) => x.effectivePrice <= fairPrice && x.energyCost <= terminalEnergy,
      )
      .sort((a, b) => a.effectivePrice - b.effectivePrice);

    if (!valid.length) return;

    const order = valid[0]!.o;
    const amount = Math.min(
      50,
      order.amount,
      Math.floor(Game.market.credits / order.price),
      Math.floor(
        terminalEnergy /
          Game.market.calcTransactionCost(1, terminal.room.name, order.roomName!),
      ),
    );

    if (amount <= 0) return;

    if (OK === Game.market.deal(order.id, amount, terminal.room.name)) {
      console.log(
        `[${terminal.room.name}] Pixel Sniper: ${amount} zu ${order.price} (effektiv inkl. Energie: ${valid[0]!.effectivePrice.toFixed(2)})`,
      );
    }
  }

  /**
   * Ersatzpreis für eine Ressource ohne eigene Order-Logik: T1-Boosts und
   * ihre Zwischenprodukte sind praktisch geschenkt, sonst 70 % des
   * Historiendurchschnitts. `null`, wenn auch das nicht zu ermitteln ist.
   */
  private getFallbackPrice(resource: string): number | null {
    if (T1_BOOSTS[resource]) {
      return 0.001; // praktisch geschenkt
    }

    if (T1_INTERMEDIATES[resource]) {
      return 0.001; // praktisch geschenkt
    }

    const avg = this.averageHistoryPrice(resource);
    if (avg === null) return null;

    return avg * 0.7;
  }

  /**
   * Durchschnittspreis über die komplette Markthistorie einer Ressource,
   * `null` ohne Historie. Der Faktor auf diesen Durchschnitt (0,7 beim
   * Verkauf, 1,1 beim Pixelkauf) bleibt bei den Aufrufern — das ist fachlich
   * verschieden und keine Wiederholung.
   */
  private averageHistoryPrice(resource: MarketResourceConstant | string): number | null {
    const history = Game.market.getHistory(resource as MarketResourceConstant);
    if (!history || !history.length) return null;

    return history.reduce((sum, entry) => sum + entry.avgPrice, 0) / history.length;
  }
}

const terminalMarket = new TerminalMarket();

/** Dünne Aufrufer auf `StructureTerminal.prototype`, siehe Dateikopf. */
export function installTerminalMarket(): void {
  StructureTerminal.prototype.sell = function (this: StructureTerminal): void {
    terminalMarket.sell(this);
  };

  StructureTerminal.prototype.buyPixel = function (this: StructureTerminal): void {
    terminalMarket.buyPixel(this);
  };
}
