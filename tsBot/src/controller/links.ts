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
import { LinkList, usesLinks } from "./link-list";
import { storageIsFull } from "./storage-pressure";

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

/**
 * Untergrenze im Storage, unter der der Storage-Link nichts mehr abgibt.
 *
 * Der Rest bleibt für Spawn, Extensions und Türme. Der Wert deckt eine volle
 * Extension-Runde samt Turmnachschub mehrfach ab und darf sich nach einer
 * Messung ändern.
 */
export const STORAGE_FEED_RESERVE = 20000;

export class LinkNetwork {
  private readonly list: LinkList;

  constructor(private readonly roomName: string) {
    this.list = new LinkList(roomName);
  }

  /** Ein Durchgang: wählt Sender und Empfänger und sendet. */
  send(): void {
    // `usesLinks` prüft Sicht, Besitz und RCL in einem.
    if (!usesLinks(this.roomName)) {
      return;
    }

    const room = Game.rooms[this.roomName]!;

    if (!this.list.hasList) {
      // Analog zu ContainerList: einmal erheben, gesendet wird erst im
      // nächsten Tick, wenn die Liste im Memory liegt.
      if (this.list.isRoomKnown) {
        this.list.discover(room);
      }
      return;
    }

    const senders = this.readySenders();

    const sourceSenders = this.readySourceSenders();
    if(sourceSenders.length > 0) {
      senders.push(...sourceSenders);
    }

    // Der Storage-Link wird im Bedarfsfall vom Empfänger zum Sender — und zwar
    // **hinten** angehängt, damit geschenkte Quellenergie vor einer Abbuchung
    // aus dem Vorrat zum Zug kommt.
    const feed = this.feedSender();
    if (feed) {
      senders.push(feed);
    }

    if (senders.length === 0) {
      // Kein Sender bereit — weder ein Quell-Link noch der Storage-Link. Der
      // Ausstieg darf **nicht** vor `feedSender()` stehen: im Rückfall ist
      // `readySenders()` per Konstruktion leer, der Nachschub käme dann nie zum
      // Zug. Billig bleibt der Normalfall trotzdem, weil `feedSender()` zuerst
      // den Storage-Link ansieht und erst danach den Bedarf berechnet.
      return;
    }

    const receivers = this.receiversByPriority(room, feed !== null);

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
    return this.list.senders.filter(link => link.cooldown === 0 && link.store[RESOURCE_ENERGY] >= SEND_MIN);
  }

  /** Sendende SourceLinks mit abgelaufenem Cooldown und ausreichend Ladung. */
  private readySourceSenders(): StructureLink[] {
    return this.list.sourceLinks().filter(link => link.cooldown === 0 && link.store[RESOURCE_ENERGY] >= SEND_MIN);
  }

  /**
   * Der Storage-Link als Sender, wenn der Raum nachschieben muss — sonst `null`.
   *
   * Cooldown und Mindestladung werden hier geprüft und nicht in
   * `needsStorageFeed`: die Frage "muss nachgeschoben werden" beantwortet auch
   * der Linkkeeper, und für ihn ist der Cooldown des Links belanglos — er füllt
   * ihn ja gerade erst.
   */
  private feedSender(): StructureLink | null {
    // Erst der billige Blick: ohne sendebereiten Storage-Link mit lohnender
    // Ladung erübrigt sich die Bedarfsfrage — und das ist der Normalfall, weil
    // der Linkkeeper ihn sonst leerräumt.
    const link = this.list.spawnLink;
    if (!link || link.cooldown !== 0 || link.store[RESOURCE_ENERGY] < SEND_MIN) {
      return null;
    }

    if (!needsStorageFeed(this.roomName)) {
      return null;
    }

    return link;
  }

  /**
   * Empfänger nach Vorrang, gefiltert auf ausreichend freien Platz.
   *
   * Der Vorrang kippt bei RCL8: darunter bekommt der Controller-Link zuerst
   * (Upgraden bringt dort noch RCL-Fortschritt), ab RCL8 der Storage-Link
   * (dort zahlt Upgraden nur noch auf GCL ein). Empfänger dürfen dabei
   * teilweise befüllt werden — wer nur ganze Ladungen annimmt, bekäme als
   * halb gefüllter Empfänger nie etwas ab.
   *
   * `storageFeeds` überstimmt beides: sendet der Storage-Link gerade selbst,
   * fällt er aus der Liste. Sonst könnte `receivers.shift()` ihm sich selbst
   * zuteilen — und der Nebeneffekt ist erwünscht, weil die Quell-Ladungen dann
   * direkt an den Controller gehen statt über einen zweiten Sprung mit weiteren
   * drei Prozent Verlust.
   */
  private receiversByPriority(room: Room, storageFeeds: boolean): StructureLink[] {
    const controllerFirst = (room.controller?.level ?? 0) < 8;

    let ordered: (StructureLink | null)[];
    if (storageFeeds) {
      ordered = [this.list.controllerLink];
    } else if (controllerFirst) {
      ordered = [this.list.controllerLink, this.list.spawnLink];
    } else {
      ordered = [this.list.spawnLink, this.list.controllerLink];
    }

    return ordered.filter(
      (link): link is StructureLink => link !== null && (link.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) >= SEND_MIN,
    );
  }
}

/**
 * Muss der Storage dieses Raums seinen Link speisen?
 *
 * Die **einzige** Entscheidungsstelle dafür — gefragt vom Sendenetz
 * (`LinkNetwork.send`) und vom Linkkeeper (`roles/linkkeeper.ts`). Beide
 * brauchen im selben Tick dieselbe Antwort: `main.ts` fährt erst alle Creeps
 * und danach `controller.timing.controll()`, der Keeper handelt also vor dem
 * Sendenetz. Eine Flagge im Memory käme einen Tick zu spät — und ohne Abgleich
 * zöge der Keeper den Link genau in dem Tick leer, in dem das Netz ihn senden
 * wollte.
 *
 * Zwei Fälle: der **Rückfall** (die Quellen liefern gerade nicht) und das
 * **Vollpumpen** (der Storage läuft über, siehe `storageIsFull`).
 */
export function needsStorageFeed(roomName: string): boolean {
  // `usesLinks` prüft Sicht, Besitz und RCL in einem.
  if (!usesLinks(roomName)) {
    return false;
  }

  const storage = Game.rooms[roomName]?.storage;
  if (!storage) {
    return false;
  }

  const list = new LinkList(roomName);
  const controllerLink = list.controllerLink;
  if (!controllerLink || !list.spawnLink) {
    return false;
  }

  // Der Empfänger muss aufnehmen können. Ohne diese Bedingung fiele der
  // Storage-Link im Vollpumpmodus aus der Empfängerliste, obwohl niemand mehr
  // senden kann — dann bekämen auch die Quell-Links kein Ziel mehr, und das
  // Linknetz des Raums stünde still, bis der Upgrader den Controller-Link
  // wieder leer genug getrunken hat. Im Rückfall ist die Bedingung ohnehin
  // erfüllt (dort liegen unter SEND_MIN im Link, also ist reichlich frei) —
  // sie wirkt allein auf den Vollpumpmodus.
  if ((controllerLink.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) < SEND_MIN) {
    return false;
  }

  // Läuft der Storage über, wird ohne Rücksicht auf die Quellen nachgeschoben.
  if (storageIsFull(roomName)) {
    return true;
  }

  if (controllerLink.store[RESOURCE_ENERGY] >= SEND_MIN) {
    return false;
  }

  // Gemessen wird der **Inhalt** der Quell-Links, nicht ihr Cooldown: ein
  // beladener Quell-Link liefert ab, sobald sein Cooldown fällt, und der Bedarf
  // verschwindet von selbst. Zählte der Cooldown mit, feuerte der Rückfall in
  // jedem Cooldown-Tick, und der Storage bezahlte, was die Quellen ohnehin
  // liefern.
  if (list.senders.some(link => link.store[RESOURCE_ENERGY] >= SEND_MIN)) {
    return false;
  }

  if (list.sourceLinks().some(link => link.store[RESOURCE_ENERGY] >= SEND_MIN)) {
    return false;
  }

  return storage.store[RESOURCE_ENERGY] > STORAGE_FEED_RESERVE;
}

/** Alle verwalteten Räume, deren RCL Links zulässt. Aufruf je Tick aus `controller/timing.ts`. */
export function sendAll(): void {
  for (const roomName in bot.room) {
    new LinkNetwork(roomName).send();
  }
}

/** Erhebt die Linklisten neu. Aufruf aus der Tagessequenz. */
export function discoverAll(): void {
  for (const roomName in bot.room) {
    if (!usesLinks(roomName)) {
      continue;
    }

    new LinkList(roomName).discover(Game.rooms[roomName]!);
  }
}
