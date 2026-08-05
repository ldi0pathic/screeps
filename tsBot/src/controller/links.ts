/**
 * Zentrale Sendesteuerung für Links.
 *
 * Ersetzt die bisherige Entscheidung durch den einzelnen Miner: der wählte
 * sein Sendeziel per `Math.random()` aus `targetLinks`, ohne Vorrang, ohne
 * Mengenangabe, und nur solange er selbst lebte und voll war. Das kostete
 * Durchsatz — ein Link-Cooldown entspricht der Entfernung zum Ziel (bei 20
 * Feldern also 20 Ticks, in denen bis zu 800 Energie hätten fließen können)
 * und wurde so auch für beliebig kleine Mengen verbrannt. Ab jetzt entscheidet
 * ein Durchgang je Raum und Tick nach Vorrang, hier gebündelt. Die
 * Weiterleitung im Miner ist bereits entfernt.
 */

import { bot } from "../globals";
import { LinkList } from "./link-list";

/**
 * Kleinste Menge, für die sich ein Sendevorgang lohnt.
 *
 * Eine Quelle liefert 3000 Energie je 300 Ticks, also 10/Tick; ein Linkpaar
 * über 20 Felder trägt 800/20 = 40 Energie/Tick. Der Cooldown ist damit nicht
 * der Engpass, Warten kostet nichts — `SEND_MIN` verhindert allein, dass ein
 * Cooldown für eine Handvoll Energie verbrannt wird. Der Wert ist ein Viertel
 * von `LINK_CAPACITY` und darf sich nach einer Messung ändern.
 */
export const SEND_MIN = LINK_CAPACITY / 4;

export class LinkNetwork {
  private readonly list: LinkList;

  constructor(private readonly roomName: string) {
    this.list = new LinkList(roomName);
  }

  /** Ein Durchgang: wählt Sender und Empfänger und sendet. */
  send(): void {
    const roomConfig = bot.room[this.roomName];
    if (!roomConfig?.useLinks) {
      return;
    }

    const room = Game.rooms[this.roomName];
    if (!room) {
      return;
    }

    if (!this.list.hasList) {
      // Analog zu ContainerList: einmal erheben, gesendet wird erst im
      // nächsten Tick, wenn die Liste im Memory liegt.
      if (this.list.isRoomKnown) {
        this.list.discover(room);
      }
      return;
    }

    const senders = this.readySenders();
    if (senders.length === 0) {
      // Der billige Normalfall: kein Sender bereit, nichts zu tun.
      return;
    }

    const receivers = this.receiversByPriority(room);

    for (const sender of senders) {
      const receiver = receivers.shift();
      if (!receiver) {
        return;
      }

      const amount = Math.min(sender.store[RESOURCE_ENERGY], receiver.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0);
      if (amount < SEND_MIN) {
        // Kann nach den Filtern in readySenders/receiversByPriority nicht
        // eintreten, bleibt als Sicherung stehen.
        continue;
      }

      // Menge immer explizit angeben: ohne zweites Argument sendet der Link
      // "alles" und läuft bei zu vollem Empfänger auf ERR_FULL — dann
      // passiert gar nichts, während die Quell-Container volllaufen.
      sender.transferEnergy(receiver, amount);
    }
  }

  /** Sendende Links mit abgelaufenem Cooldown und ausreichend Ladung. */
  private readySenders(): StructureLink[] {
    return this.list.senders().filter(link => link.cooldown === 0 && link.store[RESOURCE_ENERGY] >= SEND_MIN);
  }

  /**
   * Empfänger nach Vorrang, gefiltert auf ausreichend freien Platz.
   *
   * Der Vorrang kippt bei RCL8: darunter bekommt der Controller-Link zuerst
   * (Upgraden bringt dort noch RCL-Fortschritt), ab RCL8 der Storage-Link
   * (dort zahlt Upgraden nur noch auf GCL ein). Empfänger dürfen dabei
   * teilweise befüllt werden — wer nur ganze Ladungen annimmt, bekäme als
   * halb gefüllter Empfänger nie etwas ab.
   */
  private receiversByPriority(room: Room): StructureLink[] {
    const controllerFirst = (room.controller?.level ?? 0) < 8;
    const ordered = controllerFirst
      ? [this.list.controllerLink, this.list.spawnLink]
      : [this.list.spawnLink, this.list.controllerLink];

    return ordered.filter(
      (link): link is StructureLink => link !== null && (link.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) >= SEND_MIN,
    );
  }
}

/** Alle verwalteten Räume mit `useLinks`. Aufruf je Tick aus `controller/timing.ts`. */
export function sendAll(): void {
  for (const roomName in bot.room) {
    new LinkNetwork(roomName).send();
  }
}

/** Erhebt die Linklisten neu. Aufruf aus der Tagessequenz. */
export function discoverAll(): void {
  for (const roomName in bot.room) {
    const roomConfig = bot.room[roomName];
    const room = Game.rooms[roomName];
    if (!roomConfig?.useLinks || !room) {
      continue;
    }

    new LinkList(roomName).discover(room);
  }
}
