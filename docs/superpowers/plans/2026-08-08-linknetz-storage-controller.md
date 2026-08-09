# Storage speist den Controller-Link — Umsetzungsplan

> **Für agentische Bearbeiter:** ERFORDERLICHE SUB-SKILL: `superpowers:subagent-driven-development` (empfohlen) oder `superpowers:executing-plans`, um diesen Plan Aufgabe für Aufgabe umzusetzen. Die Schritte benutzen Checkbox-Syntax (`- [ ]`) zur Verfolgung.

**Ziel:** Der Controller-Link läuft nicht mehr leer, wenn die Quell-Links gerade nichts liefern — der Storage-Link springt ein, und der Linkkeeper füllt ihn dafür aus dem Storage statt ihn nur zu leeren.

**Architektur:** Eine reine Funktion `needsStorageFeed(roomName)` in `controller/links.ts` ist die einzige Entscheidungsstelle; sie stützt sich auf `storageIsFull(roomName)` aus dem neuen Modul `controller/storage-pressure.ts`. Sendenetz und Linkkeeper fragen dieselbe Funktion — nötig, weil `main.ts` erst alle Creeps und danach `controller.timing.controll()` fährt, der Keeper also **vor** dem Sendenetz handelt. Eine Flagge im Memory käme einen Tick zu spät.

**Tech-Stack:** TypeScript (strict + `noUncheckedIndexedAccess`), esbuild-Bundle nach `tsProd/main.js`, Tests mit `node --test` gegen die Stubs in `tsBot/tests/support/`.

**Spec:** `docs/superpowers/specs/2026-08-08-linknetz-storage-controller-design.md`

## Globale Randbedingungen

Diese gelten für **jede** Aufgabe. Sie stehen in `CLAUDE.md`, hier die für diesen Plan verbindlichen Punkte:

- **Alle Befehle laufen in `tsBot/`.** Vorher `cd tsBot`.
- **Bezeichner englisch, Kommentare und Logausgaben deutsch.** Bestehende Memory-Schlüssel (`spawn` für den Storage-Link, `harvest`, `post`, …) bleiben, wie sie sind.
- **Typecheck immer mit `--noEmit`:** `pnpm exec tsc --noEmit`. Bei parallelen Läufen zählen nur Fehler im eigenen Dateipfad.
- **`noUncheckedIndexedAccess` ist an.** Index-Zugriffe sind `T | undefined` und werden mit `!` bzw. `as` bedient, **nicht** mit zusätzlichen `if`-Abfragen — esbuild entfernt `!`/`as`, ein neuer Guard änderte das Verhalten.
- **Schwellenvergleiche positiv formulieren** (`store[type] > min`, nie `!(store[type] <= min)`): bei fehlender Ressource ist der Wert `undefined`, und dann sind beide Vergleiche falsch — die negierte Form verhielte sich anders.
- **Tests laden das Modul unter Test per `await import(...)` nach `installGlobals()`,** nie per statischem Import. `Game` und `Memory` werden geleert, nie ersetzt.
- **`pnpm build` nur in den Aufgaben 3, 4 und 5.** Aufgaben 1 und 2 legen Module an, die `main.ts` noch nicht importiert — esbuild bündelt sie deshalb nicht, `tsProd/main.js` änderte sich nur um den Build-Stempel. Ab Aufgabe 3 hängen sie am Bundle und werden mitgebaut, weil das Spiel über GitHub synct.
- **Ein Commit je Aufgabe.** Commit-Nachrichten deutsch, ohne Signatur-Zeilen.

Exakte Werte, die im Code stehen müssen:

| Konstante | Wert | Datei |
| --- | --- | --- |
| `STORAGE_FULL_RATIO` | `0.9` | `src/controller/storage-pressure.ts` |
| `STORAGE_FULL_MIN_ENERGY` | `100000` | `src/controller/storage-pressure.ts` |
| `STORAGE_FEED_RESERVE` | `20000` | `src/controller/links.ts` |
| `SEND_MIN` | `LINK_CAPACITY / 4` (vorhanden, unverändert) | `src/controller/links.ts` |

## Dateiübersicht

| Datei | Zuständigkeit | Aufgabe |
| --- | --- | --- |
| `src/controller/storage-pressure.ts` | **neu** — beantwortet allein: läuft der Storage eines Raums über? | 1 |
| `tests/controller-storage-pressure.test.ts` | **neu** — Tests dazu | 1 |
| `src/controller/links.ts` | `needsStorageFeed`, Storage-Link als Sender, Empfängerliste | 2, 3 |
| `tests/controller-links.test.ts` | erweitert um Storage-Stub und die neuen Fälle | 2, 3 |
| `src/roles/linkkeeper.ts` | zweite Richtung: Storage → Link | 4 |
| `tests/roles-linkkeeper.test.ts` | **neu** — Tests dazu | 4 |
| `src/roles/upgrader.ts` | `spawn()`: mindestens einer bei überlaufendem Storage | 5 |
| `tests/roles-upgrader.test.ts` | erweitert um die Spawn-Fälle | 5 |
| `docs/aenderungen.md`, `docs/rollen.md`, `docs/controller-und-automatik.md` | Verhaltensänderung dokumentieren | 6 |

`storage-pressure.ts` ist bewusst ein eigenes Modul und nicht Teil von `links.ts`: `roles/upgrader.ts` braucht es in Aufgabe 5, und der Upgrader soll wegen einer **Storage**-Frage nicht am **Link**-Modul hängen.

---

### Aufgabe 1: `storageIsFull` — läuft der Storage über?

**Dateien:**
- Anlegen: `tsBot/src/controller/storage-pressure.ts`
- Test: `tsBot/tests/controller-storage-pressure.test.ts`

**Schnittstellen:**
- Verbraucht: nichts (erste Aufgabe, reine Arithmetik über die Screeps-API)
- Liefert: `export function storageIsFull(roomName: string): boolean`, `export const STORAGE_FULL_RATIO = 0.9`, `export const STORAGE_FULL_MIN_ENERGY = 100000` — Aufgabe 2 und Aufgabe 5 importieren daraus.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

Neue Datei `tsBot/tests/controller-storage-pressure.test.ts`:

```typescript
/**
 * Prüft `storageIsFull` (`src/controller/storage-pressure.ts`): läuft der
 * Storage eines Raums über?
 *
 * Zwei Bedingungen, die beide gelten müssen — Belegungsgrad über
 * `STORAGE_FULL_RATIO` und Energie über `STORAGE_FULL_MIN_ENERGY`. Gemessen
 * wird der **gesamte** Belegungsgrad, weil "der Storage geht voll" eine Frage
 * des Platzes ist; der Energieboden verhindert die Kehrseite, dass ein mit
 * Mineralien vollstehender Storage mit dünnem Energiebestand eine ungedrosselte
 * Upgraderei auslöst.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals } from "./support/screeps-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

/**
 * Legt `Game.rooms[ROOM]` mit einem Storage an.
 *
 * `getUsedCapacity()` ohne Argument liefert die Gesamtbelegung, mit
 * `RESOURCE_ENERGY` den Energieanteil — genau die zwei Zahlen, die die Funktion
 * liest.
 */
function stubStorageRoom(options: { used: number; energy: number; capacity?: number }): void {
  const capacity = options.capacity ?? 1000000;

  anyGlobal.Game.rooms[ROOM] = {
    name: ROOM,
    storage: {
      store: {
        [RESOURCE_ENERGY]: options.energy,
        getCapacity: (): number => capacity,
        getUsedCapacity: (resource?: string): number =>
          resource === undefined ? options.used : options.energy,
      },
    },
  };
}

/** Legt die Welt an und lädt das Modul frisch, wie in den übrigen Controllertests. */
async function loadStoragePressure(): Promise<typeof import("../src/controller/storage-pressure")> {
  installGlobals();
  for (const key of Object.keys(anyGlobal.Game.rooms)) delete anyGlobal.Game.rooms[key];
  return await import("../src/controller/storage-pressure");
}

test("über 90 Prozent belegt und Energie über dem Boden: der Storage läuft über", async () => {
  const { storageIsFull } = await loadStoragePressure();

  stubStorageRoom({ used: 950000, energy: 400000 });

  assert.equal(storageIsFull(ROOM), true);
});

test("genau 90 Prozent reicht nicht — die Bedingung ist `>`, nicht `>=`", async () => {
  const { storageIsFull } = await loadStoragePressure();

  stubStorageRoom({ used: 900000, energy: 400000 });
  assert.equal(storageIsFull(ROOM), false, "genau 900000 von 1000000 ist noch kein Überlauf");

  stubStorageRoom({ used: 900001, energy: 400000 });
  assert.equal(storageIsFull(ROOM), true, "eine Einheit darüber genügt");
});

test("voll mit Mineralien, aber zu wenig Energie: kein Überlauf", async () => {
  const { storageIsFull, STORAGE_FULL_MIN_ENERGY } = await loadStoragePressure();

  stubStorageRoom({ used: 990000, energy: STORAGE_FULL_MIN_ENERGY });
  assert.equal(
    storageIsFull(ROOM),
    false,
    "genau der Boden reicht nicht — sonst zöge der Upgrader einen dünnen Energiebestand leer",
  );

  stubStorageRoom({ used: 990000, energy: STORAGE_FULL_MIN_ENERGY + 1 });
  assert.equal(storageIsFull(ROOM), true, "eine Einheit über dem Boden genügt");
});

test("ohne Sicht auf den Raum und ohne Storage: false, kein Wurf", async () => {
  const { storageIsFull } = await loadStoragePressure();

  assert.equal(storageIsFull(ROOM), false, "kein Game.rooms-Eintrag");

  anyGlobal.Game.rooms[ROOM] = { name: ROOM, storage: undefined };
  assert.equal(storageIsFull(ROOM), false, "Raum sichtbar, aber ohne Storage");
});
```

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
cd tsBot && pnpm test
```

Erwartet: FEHLSCHLAG mit `Cannot find module '../src/controller/storage-pressure'`.

- [ ] **Schritt 3: Die minimale Implementierung schreiben**

Neue Datei `tsBot/src/controller/storage-pressure.ts`:

```typescript
/**
 * Steht der Storage eines Raums unter Platzdruck?
 *
 * Eigenes Modul mit genau einer Frage, weil sie von zwei Seiten gestellt wird:
 * `controller/links.ts` entscheidet damit, ob der Storage-Link den
 * Controller-Link bedienungslos vollhält, und `roles/upgrader.ts` entscheidet
 * damit, ob trotz konfigurierter Null ein Upgrader gespawnt wird. Läge die
 * Funktion im Linkmodul, hinge der Upgrader wegen einer Storage-Frage am
 * Linkmodul.
 *
 * `controller/room-inventory.ts` ist bewusst nicht ihr Zuhause: dort stehen
 * unveränderliche Vorkommen (Quellen, Minerale), hier ein Wert, der sich jeden
 * Tick ändert.
 */

/**
 * Belegungsgrad, ab dem der Storage als "läuft über" gilt.
 *
 * Gemessen wird die **gesamte** Belegung und nicht nur die Energie — "der
 * Storage geht voll" ist eine Frage des Platzes, und das Einzige, was der Bot
 * dagegen tun kann, ist Energie in den Controller abzubauen.
 */
export const STORAGE_FULL_RATIO = 0.9;

/**
 * Energieboden für den Überlauf.
 *
 * Ohne ihn löste ein Storage, der mit Mineralien vollsteht und wenig Energie
 * hält, eine ungedrosselte Upgraderei auf einem dünnen Energiebestand aus.
 *
 * Trägt dieselbe Zahl wie `RCL8_WORK_RESERVE` in `roles/upgrader.ts`, bleibt
 * aber bewusst eine eigene Konstante: die eine beantwortet "darf der
 * RCL8-Upgrader arbeiten", diese hier "darf der Storage seinen Link speisen".
 * Sie zusammenzulegen wäre eine Kopplung, die nur solange trägt, wie die Zahlen
 * zufällig gleich sind.
 */
export const STORAGE_FULL_MIN_ENERGY = 100000;

/**
 * Läuft der Storage dieses Raums über?
 *
 * Ohne Sicht auf den Raum oder ohne Storage: `false`. Die Funktion wird aus dem
 * Spawncontroller heraus auch für Räume gefragt, die gerade nicht sichtbar
 * sind.
 */
export function storageIsFull(roomName: string): boolean {
  const storage = Game.rooms[roomName]?.storage;
  if (!storage) {
    return false;
  }

  const capacity = storage.store.getCapacity() ?? 0;
  if (capacity <= 0) {
    return false;
  }

  const used = storage.store.getUsedCapacity() ?? 0;

  // Beide Vergleiche positiv formuliert (siehe CLAUDE.md): fehlt ein Wert, ist
  // der Vergleich falsch, und das ist hier die sichere Seite.
  return used / capacity > STORAGE_FULL_RATIO && storage.store[RESOURCE_ENERGY] > STORAGE_FULL_MIN_ENERGY;
}
```

- [ ] **Schritt 4: Test laufen lassen und Erfolg bestätigen**

```bash
cd tsBot && pnpm test && pnpm exec tsc --noEmit
```

Erwartet: alle vier neuen Tests bestehen, Typecheck ohne Fehler in `src/controller/storage-pressure.ts`.

- [ ] **Schritt 5: Committen**

```bash
git add tsBot/src/controller/storage-pressure.ts tsBot/tests/controller-storage-pressure.test.ts
git commit -m "feat: storageIsFull erkennt einen ueberlaufenden Storage"
```

---

### Aufgabe 2: `needsStorageFeed` — die gemeinsame Regel

**Dateien:**
- Ändern: `tsBot/src/controller/links.ts` (Importe am Kopf, neue Konstante und Funktion am Dateiende vor `sendAll`)
- Ändern: `tsBot/tests/controller-links.test.ts` (`stubRoom` um `storage` erweitern, neue Tests anhängen)

**Schnittstellen:**
- Verbraucht: `storageIsFull(roomName: string): boolean` aus `./storage-pressure`
- Liefert: `export function needsStorageFeed(roomName: string): boolean`, `export const STORAGE_FEED_RESERVE = 20000` — Aufgabe 3 und Aufgabe 4 rufen die Funktion auf.

- [ ] **Schritt 1: Den Raum-Stub im Test um ein Storage erweitern**

In `tsBot/tests/controller-links.test.ts` die Funktion `stubRoom` ersetzen (sie hat heute `storage: undefined` fest verdrahtet):

```typescript
/**
 * Ein Raum mit RCL; `find(FIND_MY_STRUCTURES, …)` bedient nur `discover()`.
 *
 * `usesLinks()` liest `controller.my` und `controller.level` direkt vom Raum
 * (nicht mehr aus der Config) — deshalb trägt der Stub standardmäßig einen
 * eigenen Controller (`my: true`), sofern ein Level angegeben ist.
 *
 * `storage` ist seit `needsStorageFeed` nicht mehr fest `undefined`: die Regel
 * liest Belegung und Energiebestand des Storage.
 */
function stubRoom(
  name: string,
  options: {
    controllerLevel?: number;
    controllerMy?: boolean;
    links?: any[];
    storage?: any;
  } = {},
) {
  return {
    name,
    controller:
      options.controllerLevel !== undefined
        ? { my: options.controllerMy ?? true, level: options.controllerLevel }
        : undefined,
    storage: options.storage,
    find(type: number, opts?: { filter?: (structure: any) => boolean }): any[] {
      if (type !== FIND_MY_STRUCTURES) return [];
      const links = options.links ?? [];
      return opts?.filter ? links.filter(opts.filter) : links;
    },
  };
}

/**
 * Ein Storage-Stub mit Gesamtbelegung und Energieanteil.
 *
 * `used` ist die Gesamtbelegung (für `storageIsFull`), `energy` der
 * Energieanteil (für `STORAGE_FEED_RESERVE`). Voreinstellung: reichlich Energie,
 * aber weit unter dem Überlauf — der Normalfall in den meisten Tests.
 */
function stubStorage(options: { used?: number; energy?: number } = {}) {
  const energy = options.energy ?? 300000;
  const used = options.used ?? energy;

  return {
    store: {
      [RESOURCE_ENERGY]: energy,
      getCapacity: (): number => 1000000,
      getUsedCapacity: (resource?: string): number => (resource === undefined ? used : energy),
    },
  };
}
```

- [ ] **Schritt 2: Die fehlschlagenden Tests schreiben**

Ans Ende von `tsBot/tests/controller-links.test.ts` anhängen:

```typescript
// --- needsStorageFeed --------------------------------------------------------

/**
 * Baut die Standardwelt für `needsStorageFeed`: Raum mit RCL7, Storage,
 * Controller-Link, Storage-Link und einem Quell-Link.
 *
 * Die vier Zahlen sind die Stellschrauben der Regel — jeder Test dreht genau an
 * einer davon.
 */
function setupFeedWorld(options: {
  controllerLinkEnergy: number;
  senderEnergy: number;
  storageEnergy: number;
  storageUsed?: number;
  controllerLevel?: number;
}): void {
  const roomName = "E58N6";

  registerRoom(roomName);
  setRoomKnown(roomName);

  const controllerLink = stubLink("controller-link", options.controllerLinkEnergy, LINK_CAPACITY);
  const spawnLink = stubLink("spawn-link", 0, LINK_CAPACITY);
  const sender = stubLink("sender", options.senderEnergy, 0);
  setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [sender.id] });

  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, {
    controllerLevel: options.controllerLevel ?? 7,
    storage: stubStorage({ energy: options.storageEnergy, used: options.storageUsed }),
  });
}

test("Rückfall: leerer Controller-Link, kein Quell-Link mit Ladung, Storage über der Reserve", async () => {
  const { needsStorageFeed, SEND_MIN } = await loadLinks();

  setupFeedWorld({
    controllerLinkEnergy: SEND_MIN - 1,
    senderEnergy: SEND_MIN - 1,
    storageEnergy: 300000,
  });

  assert.equal(needsStorageFeed("E58N6"), true);
});

test("ein Quell-Link mit Ladung liefert selbst: kein Nachschub aus dem Storage", async () => {
  const { needsStorageFeed, SEND_MIN } = await loadLinks();

  setupFeedWorld({
    controllerLinkEnergy: 0,
    senderEnergy: SEND_MIN,
    storageEnergy: 300000,
  });

  assert.equal(
    needsStorageFeed("E58N6"),
    false,
    "gemessen wird der Inhalt des Quell-Links, nicht sein Cooldown — er liefert ab, sobald der fällt",
  );
});

test("der Controller-Link ist ausreichend gefüllt: kein Nachschub", async () => {
  const { needsStorageFeed, SEND_MIN } = await loadLinks();

  setupFeedWorld({
    controllerLinkEnergy: SEND_MIN,
    senderEnergy: 0,
    storageEnergy: 300000,
  });

  assert.equal(needsStorageFeed("E58N6"), false, "genau SEND_MIN reicht — die Bedingung ist `<`");
});

test("Storage unter der Reserve: kein Nachschub, egal wie leer der Controller-Link ist", async () => {
  const { needsStorageFeed, STORAGE_FEED_RESERVE } = await loadLinks();

  setupFeedWorld({
    controllerLinkEnergy: 0,
    senderEnergy: 0,
    storageEnergy: STORAGE_FEED_RESERVE,
  });

  assert.equal(needsStorageFeed("E58N6"), false, "genau die Reserve reicht nicht — die Bedingung ist `>`");
});

test("Vollpumpmodus: überlaufender Storage schiebt nach, auch bei liefernden Quellen und vollem Controller-Link", async () => {
  const { needsStorageFeed } = await loadLinks();

  setupFeedWorld({
    controllerLinkEnergy: LINK_CAPACITY,
    senderEnergy: 500,
    storageEnergy: 400000,
    storageUsed: 950000,
  });

  assert.equal(needsStorageFeed("E58N6"), true);
});

test("ohne erhobenen Storage-Link gibt es nichts zu speisen", async () => {
  const { needsStorageFeed } = await loadLinks();
  const roomName = "E58N6";

  registerRoom(roomName);
  setRoomKnown(roomName);
  const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: controllerLink.id, sender: [] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, {
    controllerLevel: 7,
    storage: stubStorage({ energy: 300000 }),
  });

  assert.equal(needsStorageFeed(roomName), false);
});

test("ohne Storage im Raum und ohne Sicht: false, kein Wurf", async () => {
  const { needsStorageFeed } = await loadLinks();
  const roomName = "E58N6";

  registerRoom(roomName);
  setRoomKnown(roomName);
  const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
  const spawnLink = stubLink("spawn-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, { controllerLevel: 7 });

  assert.equal(needsStorageFeed(roomName), false, "Raum sichtbar, aber ohne Storage");

  installLinkWorld();
  registerRoom(roomName);
  setRoomKnown(roomName);
  assert.doesNotThrow(() => needsStorageFeed(roomName));
  assert.equal(needsStorageFeed(roomName), false, "ohne Sicht auf den Raum");
});
```

- [ ] **Schritt 3: Test laufen lassen und Fehlschlag bestätigen**

```bash
cd tsBot && pnpm test
```

Erwartet: FEHLSCHLAG — `needsStorageFeed is not a function` bzw. `STORAGE_FEED_RESERVE` ist `undefined`.

- [ ] **Schritt 4: Die minimale Implementierung schreiben**

In `tsBot/src/controller/links.ts` den Importblock ergänzen:

```typescript
import { bot } from "../globals";
import { LinkList, usesLinks } from "./link-list";
import { storageIsFull } from "./storage-pressure";
```

Direkt unter der bestehenden Konstante `SEND_MIN` einfügen:

```typescript
/**
 * Untergrenze im Storage, unter der der Storage-Link nichts mehr abgibt.
 *
 * Der Rest bleibt für Spawn, Extensions und Türme. Der Wert deckt eine volle
 * Extension-Runde samt Turmnachschub mehrfach ab und darf sich nach einer
 * Messung ändern.
 */
export const STORAGE_FEED_RESERVE = 20000;
```

Vor `sendAll()` einfügen:

```typescript
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
  if (list.senders().some(link => link.store[RESOURCE_ENERGY] >= SEND_MIN)) {
    return false;
  }

  return storage.store[RESOURCE_ENERGY] > STORAGE_FEED_RESERVE;
}
```

- [ ] **Schritt 5: Test laufen lassen und Erfolg bestätigen**

```bash
cd tsBot && pnpm test && pnpm exec tsc --noEmit
```

Erwartet: die sieben neuen Tests bestehen, die bestehenden `LinkNetwork`-Tests weiterhin auch.

- [ ] **Schritt 6: Committen**

```bash
git add tsBot/src/controller/links.ts tsBot/tests/controller-links.test.ts
git commit -m "feat: needsStorageFeed entscheidet ueber den Nachschub in den Controller-Link"
```

---

### Aufgabe 3: Der Storage-Link wird zum Sender

**Dateien:**
- Ändern: `tsBot/src/controller/links.ts` (`LinkNetwork.send`, neue private Methode `feedSender`, `receiversByPriority` bekommt einen Parameter)
- Ändern: `tsBot/tests/controller-links.test.ts` (neue Tests anhängen)
- Erzeugt: `tsProd/main.js` per `pnpm build`

**Schnittstellen:**
- Verbraucht: `needsStorageFeed(roomName)` und `SEND_MIN` aus derselben Datei
- Liefert: verändertes Laufzeitverhalten von `LinkNetwork.send()`; keine neue öffentliche Signatur.

- [ ] **Schritt 1: Die fehlschlagenden Tests schreiben**

Ans Ende von `tsBot/tests/controller-links.test.ts` anhängen:

```typescript
// --- Storage-Link als Sender --------------------------------------------------

test("der Storage-Link sendet an den Controller-Link, wenn kein Quell-Link liefert", async () => {
  const { LinkNetwork, SEND_MIN } = await loadLinks();
  const roomName = "E58N6";

  registerRoom(roomName);
  setRoomKnown(roomName);
  const emptySender = stubLink("sender", SEND_MIN - 1, 0);
  const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
  const spawnLink = stubLink("spawn-link", 500, 0);
  setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [emptySender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, {
    controllerLevel: 7,
    storage: stubStorage({ energy: 300000 }),
  });

  new LinkNetwork(roomName).send();

  assert.equal(transferCalls.length, 1);
  assert.equal(transferCalls[0]!.senderId, "spawn-link");
  assert.equal(transferCalls[0]!.receiverId, "controller-link");
  assert.equal(transferCalls[0]!.amount, 500, "min(Ladung des Storage-Links, freier Platz am Controller)");
});

test("solange nachgeschoben wird, ist der Storage-Link kein Empfänger", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  registerRoom(roomName);
  setRoomKnown(roomName);
  // Ein Quell-Link mit Ladung würde den Rückfall ausschließen — deshalb hier der
  // Vollpumpmodus, in dem beides zugleich gilt.
  const readySender = stubLink("sender", 500, 0);
  const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
  const spawnLink = stubLink("spawn-link", 500, LINK_CAPACITY);
  setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [readySender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, {
    controllerLevel: 8,
    storage: stubStorage({ energy: 400000, used: 950000 }),
  });

  new LinkNetwork(roomName).send();

  assert.equal(
    transferCalls.every(call => call.receiverId !== "spawn-link"),
    true,
    "ein überlaufender Storage soll nicht noch weiter befüllt werden — auch nicht auf RCL8, wo er sonst Vorrang hätte",
  );
});

test("im Vollpumpmodus bedient zuerst der Quell-Link den Controller, der Storage-Link steht hinten", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  registerRoom(roomName);
  setRoomKnown(roomName);
  const readySender = stubLink("sender", 500, 0);
  const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
  const spawnLink = stubLink("spawn-link", 500, LINK_CAPACITY);
  setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [readySender.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, {
    controllerLevel: 7,
    storage: stubStorage({ energy: 400000, used: 950000 }),
  });

  new LinkNetwork(roomName).send();

  assert.equal(transferCalls.length, 1, "es gibt nur einen Empfänger, also kommt nur ein Sender zum Zug");
  assert.equal(
    transferCalls[0]!.senderId,
    "sender",
    "geschenkte Quellenergie vor einer Abbuchung aus dem Vorrat",
  );
});

test("Storage-Link mit Cooldown oder zu wenig Ladung: kein Nachschub, kein Wurf", async () => {
  const { LinkNetwork, SEND_MIN } = await loadLinks();
  const roomName = "E58N6";

  function runWithSpawnLink(energy: number, cooldown: number): number {
    installLinkWorld();
    registerRoom(roomName);
    setRoomKnown(roomName);
    const weakSender = stubLink("sender", 0, 0);
    const controllerLink = stubLink("controller-link", 0, LINK_CAPACITY);
    const spawnLink = stubLink("spawn-link", energy, 0, cooldown);
    setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [weakSender.id] });
    anyGlobal.Game.rooms[roomName] = stubRoom(roomName, {
      controllerLevel: 7,
      storage: stubStorage({ energy: 300000 }),
    });

    new LinkNetwork(roomName).send();
    return transferCalls.length;
  }

  assert.equal(runWithSpawnLink(500, 5), 0, "der Storage-Link hat Cooldown");
  assert.equal(runWithSpawnLink(SEND_MIN - 1, 0), 0, "der Storage-Link hat zu wenig Ladung");
  assert.equal(runWithSpawnLink(SEND_MIN, 0), 1, "genau SEND_MIN genügt");
});

test("ohne Bedarf bleibt alles wie bisher: der Storage-Link ist Empfänger", async () => {
  const { LinkNetwork } = await loadLinks();
  const roomName = "E58N6";

  registerRoom(roomName);
  setRoomKnown(roomName);
  const senderA = stubLink("sender-a", 500, 0);
  const senderB = stubLink("sender-b", 500, 0);
  const controllerLink = stubLink("controller-link", 500, LINK_CAPACITY);
  const spawnLink = stubLink("spawn-link", 0, LINK_CAPACITY);
  setLinks(roomName, { controller: controllerLink.id, spawn: spawnLink.id, sender: [senderA.id, senderB.id] });
  anyGlobal.Game.rooms[roomName] = stubRoom(roomName, {
    controllerLevel: 7,
    storage: stubStorage({ energy: 300000 }),
  });

  new LinkNetwork(roomName).send();

  assert.deepEqual(
    transferCalls.map(call => call.receiverId).sort(),
    ["controller-link", "spawn-link"],
    "beide Empfänger werden bedient wie vor der Änderung",
  );
});
```

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
cd tsBot && pnpm test
```

Erwartet: FEHLSCHLAG — die vier neuen Nachschub-Tests melden `transferCalls.length` `0` statt `1` bzw. eine falsche Sender-Id. Der letzte Test ("ohne Bedarf") besteht schon jetzt.

- [ ] **Schritt 3: `send()` und `receiversByPriority` umbauen**

In `tsBot/src/controller/links.ts` die Methode `send()` ersetzen:

```typescript
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

    // Der Storage-Link wird im Bedarfsfall vom Empfänger zum Sender — und zwar
    // **hinten** angehängt, damit geschenkte Quellenergie vor einer Abbuchung
    // aus dem Vorrat zum Zug kommt.
    const feed = this.feedSender();
    if (feed) {
      senders.push(feed);
    }

    if (senders.length === 0) {
      // Der billige Normalfall: kein Sender bereit, nichts zu tun.
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

  /**
   * Der Storage-Link als Sender, wenn der Raum nachschieben muss — sonst `null`.
   *
   * Cooldown und Mindestladung werden hier geprüft und nicht in
   * `needsStorageFeed`: die Frage "muss nachgeschoben werden" beantwortet auch
   * der Linkkeeper, und für ihn ist der Cooldown des Links belanglos — er füllt
   * ihn ja gerade erst.
   */
  private feedSender(): StructureLink | null {
    if (!needsStorageFeed(this.roomName)) {
      return null;
    }

    const link = this.list.spawnLink;
    if (!link || link.cooldown !== 0 || link.store[RESOURCE_ENERGY] < SEND_MIN) {
      return null;
    }

    return link;
  }
```

Anschließend `receiversByPriority` ersetzen:

```typescript
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
```

- [ ] **Schritt 4: Test und Typecheck laufen lassen**

```bash
cd tsBot && pnpm test && pnpm exec tsc --noEmit
```

Erwartet: alle Tests bestehen, insbesondere die bestehenden Vorrang- und Doppelziel-Tests unverändert.

- [ ] **Schritt 5: Bauen und Rauchtest**

```bash
cd tsBot && pnpm build && pnpm smoke
```

Erwartet: Build ohne Fehler, `pnpm smoke` fährt 17 Ticks ohne Wurf und ohne `Game.notify`-Fehlermeldung.

- [ ] **Schritt 6: Committen**

```bash
git add tsBot/src/controller/links.ts tsBot/tests/controller-links.test.ts tsProd/main.js tsProd-backup
git commit -m "feat: der Storage-Link sendet bei Bedarf an den Controller-Link"
```

---

### Aufgabe 4: Der Linkkeeper füllt in beide Richtungen

**Dateien:**
- Ändern: `tsBot/src/roles/linkkeeper.ts` (Import und das Ende von `doJob`)
- Anlegen: `tsBot/tests/roles-linkkeeper.test.ts`
- Erzeugt: `tsProd/main.js` per `pnpm build`

**Schnittstellen:**
- Verbraucht: `needsStorageFeed(roomName: string): boolean` aus `../controller/links`
- Liefert: verändertes Laufzeitverhalten von `LinkKeeper.doJob`; keine neue Signatur.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

Neue Datei `tsBot/tests/roles-linkkeeper.test.ts`:

```typescript
/**
 * Prüft die Rolle "linkkeeper" (`src/roles/linkkeeper.ts`) an ihrer neuen
 * Stelle: der Creep pendelt nicht mehr nur Link → Storage, sondern füllt den
 * Link aus dem Storage, wenn der Raum den Controller-Link nachfüllen muss.
 *
 * Beide Richtungen hängen an derselben Funktion `needsStorageFeed`
 * (`src/controller/links.ts`) wie das Sendenetz — der Keeper handelt im Tick
 * **vor** dem Netz (`main.ts` fährt erst Creeps, dann `timing.controll()`),
 * eine eigene Regel würde deshalb genau in dem Tick den Link leerziehen, in dem
 * das Netz senden wollte.
 *
 * Der Standplatz wird über `memory.post` vorgegeben, damit `_findPost` nicht
 * gestellt werden muss — dessen Geometriesuche ist hier nicht Gegenstand.
 * `RoomPosition` kommt aus `movement-stubs.ts`, weil `doJob` die gemerkte
 * Position damit rekonstruiert.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installMovement } from "./support/movement-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";
const POST = { x: 20, y: 20 };

/** Eine Aktion des Creeps: `transfer` oder `withdraw`, mit Ziel-Id. */
interface ActionCall {
  action: "transfer" | "withdraw";
  targetId: string;
}

/** Alle Aktionen seit dem letzten `installKeeperWorld()`. */
let actionCalls: ActionCall[] = [];

/** Registry für `Game.getObjectById`, lokal für diese Testdatei. */
const registry = new Map<string, any>();

function installKeeperWorld(): void {
  installMovement();
  for (const key of Object.keys(anyGlobal.Game.rooms)) delete anyGlobal.Game.rooms[key];
  registry.clear();
  actionCalls = [];
  anyGlobal.Game.getObjectById = (id: string) => registry.get(id) ?? null;
}

async function loadLinkKeeper(): Promise<typeof import("../src/roles/linkkeeper")> {
  installKeeperWorld();
  return await import("../src/roles/linkkeeper");
}

/** Ein Link-Stub mit Energie und freiem Platz, registriert für `Game.getObjectById`. */
function stubLink(id: string, energy: number, cooldown = 0) {
  const link = {
    id,
    cooldown,
    store: {
      [RESOURCE_ENERGY]: energy,
      getUsedCapacity: (_resource?: string): number => energy,
      getFreeCapacity: (_resource?: string): number => LINK_CAPACITY - energy,
    },
  };
  registry.set(id, link);
  return link;
}

/** Ein Storage-Stub mit Gesamtbelegung und Energieanteil. */
function stubStorage(options: { used?: number; energy?: number } = {}) {
  const energy = options.energy ?? 300000;
  const used = options.used ?? energy;

  return {
    id: "storage",
    store: {
      [RESOURCE_ENERGY]: energy,
      getCapacity: (): number => 1000000,
      getUsedCapacity: (resource?: string): number => (resource === undefined ? used : energy),
    },
  };
}

/**
 * Baut die Welt für einen Tick des Keepers und liefert den Creep.
 *
 * Der Creep steht bereits auf seinem Standplatz (`memory.post` gesetzt und
 * `pos` gleich), damit `doJob` unmittelbar beim Pendeln ankommt.
 */
function setupKeeper(options: {
  carrying: number;
  linkEnergy: number;
  controllerLinkEnergy: number;
  senderEnergy: number;
  storageEnergy?: number;
  storageUsed?: number;
}) {
  const spawnLink = stubLink("spawn-link", options.linkEnergy);
  const controllerLink = stubLink("controller-link", options.controllerLinkEnergy);
  const sender = stubLink("sender", options.senderEnergy);
  const storage = stubStorage({ energy: options.storageEnergy, used: options.storageUsed });

  anyGlobal.Memory.rooms = {
    [ROOM]: { links: { controller: controllerLink.id, spawn: spawnLink.id, sender: [sender.id] } },
  };

  const room = {
    name: ROOM,
    controller: { my: true, level: 7 },
    storage,
  };
  anyGlobal.Game.rooms[ROOM] = room;

  const creep: any = {
    name: "linkkeeper_1",
    memory: { role: "linkkeeper", workroom: ROOM, home: ROOM, post: { ...POST } },
    room,
    pos: new anyGlobal.RoomPosition(POST.x, POST.y, ROOM),
    store: {
      getUsedCapacity: (_resource?: string): number => options.carrying,
    },
    say: (): number => OK,
    transfer(target: { id: string }): number {
      actionCalls.push({ action: "transfer", targetId: target.id });
      return OK;
    },
    withdraw(target: { id: string }): number {
      actionCalls.push({ action: "withdraw", targetId: target.id });
      return OK;
    },
  };

  return { creep, spawnLink, storage };
}

test("ohne Bedarf leert der Keeper den Link ins Storage — wie bisher", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  // Ein Quell-Link mit Ladung schließt den Rückfall aus.
  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 800,
    controllerLinkEnergy: 0,
    senderEnergy: 500,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "withdraw", targetId: "spawn-link" }]);
});

test("ohne Bedarf und mit Ladung liefert der Keeper zuerst ins Storage ab", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 800,
    linkEnergy: 800,
    controllerLinkEnergy: 0,
    senderEnergy: 500,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [
    { action: "transfer", targetId: "storage" },
    { action: "withdraw", targetId: "spawn-link" },
  ]);
});

test("mit Bedarf und leerer Ladung holt der Keeper Energie aus dem Storage", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 0,
    controllerLinkEnergy: 0,
    senderEnergy: 0,
  });

  keeper.doJob(creep);

  assert.deepEqual(
    actionCalls,
    [{ action: "withdraw", targetId: "storage" }],
    "die Richtung kehrt sich um: aus dem Storage statt aus dem Link",
  );
});

test("mit Bedarf und voller Ladung schiebt der Keeper sie in den Link", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 800,
    linkEnergy: 0,
    controllerLinkEnergy: 0,
    senderEnergy: 0,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "transfer", targetId: "spawn-link" }]);
});

test("mit Bedarf wird der Link nicht mehr geleert — sonst nähme das Sendenetz ihn leer vor", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 800,
    controllerLinkEnergy: 0,
    senderEnergy: 0,
  });

  keeper.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.action === "withdraw" && call.targetId === "spawn-link"),
    false,
    "der Keeper handelt im Tick vor dem Sendenetz — leerte er hier, hätte das Netz nichts zu senden",
  );
});

test("im Vollpumpmodus wird gefüllt, obwohl ein Quell-Link liefert", async () => {
  const { LinkKeeper } = await loadLinkKeeper();
  const keeper = new LinkKeeper();

  const { creep } = setupKeeper({
    carrying: 0,
    linkEnergy: 0,
    controllerLinkEnergy: LINK_CAPACITY,
    senderEnergy: 500,
    storageEnergy: 400000,
    storageUsed: 950000,
  });

  keeper.doJob(creep);

  assert.deepEqual(actionCalls, [{ action: "withdraw", targetId: "storage" }]);
});
```

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
cd tsBot && pnpm test
```

Erwartet: die drei Bedarfs-Tests schlagen fehl — der Keeper leert weiterhin den Link, statt ihn zu füllen. Die beiden Tests "ohne Bedarf" bestehen schon jetzt.

- [ ] **Schritt 3: Die zweite Richtung einbauen**

In `tsBot/src/roles/linkkeeper.ts` den Import ergänzen:

```typescript
import { LinkList, usesLinks } from "../controller/link-list";
import { needsStorageFeed } from "../controller/links";
```

Danach den Kommentarblock und die letzten vier Zeilen von `doJob` ersetzen — alles ab `const carrying`:

```typescript
        const carrying = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        const inLink = link.store.getUsedCapacity(RESOURCE_ENERGY);

        // Muss der Raum den Controller-Link nachfüllen, kehrt sich die Richtung
        // um: der Keeper holt dann aus dem Storage und legt in den Link, statt
        // ihn zu leeren. Gefragt wird dieselbe Funktion, die auch das Sendenetz
        // fragt — der Keeper handelt im selben Tick **vor** dem Netz (`main.ts`
        // fährt erst alle Creeps, dann `timing.controll()`). Eine eigene Regel
        // oder eine Flagge aus dem Vortick zöge den Link genau in dem Tick leer,
        // in dem das Netz ihn senden wollte.
        if (needsStorageFeed(creep.memory.workroom)) {
            if (carrying > 0) creep.transfer(link, RESOURCE_ENERGY);
            else creep.withdraw(storage, RESOURCE_ENERGY);
            return;
        }

        // Bewusst jeden Tick geprüft statt eine Schlafdauer zu raten: der
        // empfangende Link hat keinen eigenen Cooldown (der liegt beim
        // sendenden Link), es gibt also nichts, worauf man warten könnte – ein
        // Tick Verzögerung wäre hier nur verlorener Durchsatz.
        if (carrying === 0 && inLink === 0) return;

        // Ob Screeps transfer und withdraw im selben Tick beide auflöst, ist
        // offiziell nicht dokumentiert (nur eine unsichere Forenaussage).
        // Lösen beide aus, dauert der Umlauf einen Tick, sonst zwei – beides
        // ist korrekt, es gibt keinen Fehlerfall. Deshalb wird nicht geraten:
        // beide Aktionen werden angemeldet und später mit dem Profiler
        // gemessen. Ein ERR_FULL beim withdraw ist erwartbar.
        if (carrying > 0) creep.transfer(storage, RESOURCE_ENERGY);
        if (inLink > 0) creep.withdraw(link, RESOURCE_ENERGY);
```

Zusätzlich den Dateikopf anpassen — er beschreibt heute nur eine Richtung. Den zweiten Absatz ersetzen durch:

```typescript
 * Existiert, weil ein voller empfangender Link sonst nicht mehr abnehmen kann
 * und dadurch den Durchsatz aller sendenden Quell-Links blockiert – die
 * bleiben dann selbst voll und können keine neue Energie mehr aufnehmen.
 * Link und Storage stehen in der Basis so, dass genau ein Feld an beide
 * angrenzt; dort steht der Creep dauerhaft.
 *
 * Seit der Storage-Link auch senden kann, pendelt der Keeper in **beide**
 * Richtungen: `needsStorageFeed` (`controller/links.ts`) entscheidet je Tick,
 * ob er den Link leert oder ihn aus dem Storage füllt.
```

- [ ] **Schritt 4: Test und Typecheck laufen lassen**

```bash
cd tsBot && pnpm test && pnpm exec tsc --noEmit
```

Erwartet: alle sechs Tests der neuen Datei bestehen.

- [ ] **Schritt 5: Bauen und Rauchtest**

```bash
cd tsBot && pnpm build && pnpm smoke
```

Erwartet: Build ohne Fehler, 17 Ticks ohne Wurf.

- [ ] **Schritt 6: Committen**

```bash
git add tsBot/src/roles/linkkeeper.ts tsBot/tests/roles-linkkeeper.test.ts tsProd/main.js tsProd-backup
git commit -m "feat: der Linkkeeper fuellt den Storage-Link bei Bedarf aus dem Storage"
```

---

### Aufgabe 5: Upgrader — mindestens einer bei überlaufendem Storage

**Dateien:**
- Ändern: `tsBot/src/roles/upgrader.ts` (Import und `spawn()`)
- Ändern: `tsBot/tests/roles-upgrader.test.ts` (neue Tests anhängen)
- Erzeugt: `tsProd/main.js` per `pnpm build`

**Schnittstellen:**
- Verbraucht: `storageIsFull(roomName: string): boolean` aus `../controller/storage-pressure`
- Liefert: verändertes Laufzeitverhalten von `Upgrader.spawn`; keine neue Signatur.

**Ausdrücklich nicht Teil dieser Aufgabe:** `_mayWork` bleibt unangetastet. Im Vollpumpmodus liegt die Storage-Energie zwangsläufig über 100 000, und genau das ist ab RCL8 schon heute die Bedingung; unter RCL8 wird gar nicht gedrosselt. Eine zusätzliche Regel dort wäre toter Code.

- [ ] **Schritt 1: Die fehlschlagenden Tests schreiben**

Ans Ende von `tsBot/tests/roles-upgrader.test.ts` anhängen:

```typescript
// --- Spawn bei überlaufendem Storage -----------------------------------------

/**
 * Ein Storage-Stub für `storageIsFull` und das RCL8-Spawn-Gate.
 *
 * `used` ist die Gesamtbelegung, `energy` der Energieanteil. Das Gate liest
 * `getUsedCapacity(RESOURCE_ENERGY)`, `storageIsFull` beide Zahlen.
 */
function stubUpgraderStorage(options: { used: number; energy: number }) {
  return {
    store: {
      [RESOURCE_ENERGY]: options.energy,
      getCapacity: (): number => 1000000,
      getUsedCapacity: (resource?: string): number =>
        resource === undefined ? options.used : options.energy,
    },
  };
}

/**
 * Baut die Welt für `spawn()`: `global.room`-Eintrag, sichtbarer Raum mit
 * Storage und ein `_.filter`-Ersatz für die Creep-Zählung.
 */
function setupUpgraderSpawnWorld(options: {
  configuredUpgraders: number;
  controllerLevel: number;
  storage: ReturnType<typeof stubUpgraderStorage> | undefined;
  ticksToDowngrade?: number;
}) {
  const controller = {
    my: true,
    level: options.controllerLevel,
    ticksToDowngrade: options.ticksToDowngrade ?? 200000,
  };

  anyGlobal.room[ROOM] = { room: ROOM, spawnRoom: ROOM, upgrader: options.configuredUpgraders };
  anyGlobal.Game.rooms[ROOM] = { name: ROOM, controller, storage: options.storage };
  anyGlobal._ = {
    filter: (collection: Record<string, any>, predicate: (item: any) => boolean) =>
      Object.values(collection).filter(predicate),
  };

  const spawnCalls: { profil: BodyPartConstant[]; newName: string }[] = [];
  const spawnObj: any = {
    room: {
      name: ROOM,
      storage: options.storage,
      controller,
      energyCapacityAvailable: 12900,
    },
    spawnCreep(profil: BodyPartConstant[], newName: string): number {
      spawnCalls.push({ profil: [...profil], newName });
      return OK;
    },
  };

  return { spawnObj, spawnCalls };
}

test("überlaufender Storage: es wird gespawnt, auch bei upgrader: 0 in der Config", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { spawnObj } = setupUpgraderSpawnWorld({
    configuredUpgraders: 0,
    controllerLevel: 8,
    storage: stubUpgraderStorage({ used: 950000, energy: 400000 }),
  });

  assert.equal(
    upgrader.spawn(spawnObj, ROOM),
    true,
    "läuft der Storage über, steht trotz konfigurierter Null einer da",
  );
});

test("überlaufender Storage mit viel Mineral: das RCL8-Gate mit den 250000 wird übergangen", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  // 95 Prozent belegt, aber nur 150000 Energie — das Gate `storage < 250000`
  // verhinderte den Upgrader heute genau dann, wenn man ihn braucht.
  const { spawnObj } = setupUpgraderSpawnWorld({
    configuredUpgraders: 1,
    controllerLevel: 8,
    storage: stubUpgraderStorage({ used: 950000, energy: 150000 }),
  });

  assert.equal(upgrader.spawn(spawnObj, ROOM), true);
});

test("ohne Überlauf bleibt die konfigurierte Null eine Null", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { spawnObj } = setupUpgraderSpawnWorld({
    configuredUpgraders: 0,
    controllerLevel: 7,
    storage: stubUpgraderStorage({ used: 300000, energy: 300000 }),
  });

  assert.equal(upgrader.spawn(spawnObj, ROOM), false, "eine gewollte Null bleibt Null, solange der Storage Luft hat");
});

test("ohne Überlauf greift das RCL8-Gate weiterhin", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { spawnObj } = setupUpgraderSpawnWorld({
    configuredUpgraders: 1,
    controllerLevel: 8,
    storage: stubUpgraderStorage({ used: 200000, energy: 200000 }),
  });

  assert.equal(upgrader.spawn(spawnObj, ROOM), false, "unter 250000 Energie und ohne Überlauf wird nicht gespawnt");
});

test("überlaufender Storage: genau einer, kein zweiter — ab RCL8 deckelt der Controller ohnehin bei 15 je Tick", async () => {
  const { Upgrader } = await loadUpgrader();
  const upgrader = new Upgrader();

  const { spawnObj } = setupUpgraderSpawnWorld({
    configuredUpgraders: 0,
    controllerLevel: 8,
    storage: stubUpgraderStorage({ used: 950000, energy: 400000 }),
  });

  // Schlüssel setzen statt `Game.creeps` zu ersetzen — `resetWorld()` leert das
  // vorhandene Objekt, ein neues käme dort nie an.
  anyGlobal.Game.creeps["upgrader_1"] = {
    memory: { role: "upgrader", workroom: ROOM },
    ticksToLive: 1000,
    spawning: false,
  };

  assert.equal(upgrader.spawn(spawnObj, ROOM), false, "einer genügt");
});
```

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
cd tsBot && pnpm test
```

Erwartet: die ersten beiden neuen Tests schlagen fehl (`false` statt `true`), die übrigen bestehen bereits.

- [ ] **Schritt 3: `spawn()` umbauen**

In `tsBot/src/roles/upgrader.ts` den Import ergänzen:

```typescript
import { LinkList } from "../controller/link-list";
import { storageIsFull } from "../controller/storage-pressure";
```

Danach `spawn()` ersetzen:

```typescript
    /**
     * Spawnt einen Upgrader für `workroom`, falls die konfigurierte Anzahl noch
     * nicht erreicht ist.
     *
     * Ausnahme: läuft der Storage über (`storageIsFull`), steht **mindestens
     * einer** da — auch bei `upgrader: 0` in der Config und auch dann, wenn das
     * RCL8-Gate ihn sonst verhinderte. Der Fall ist nicht theoretisch: bei 95
     * Prozent Belegung mit viel Mineral und 150 000 Energie greift das Gate
     * `storage < 250000` heute genau dann, wenn man den Upgrader braucht.
     *
     * Bewusst `Math.max(1, …)` und keine höhere Zahl: ab RCL8 nimmt der
     * Controller nur noch `CONTROLLER_MAX_UPGRADE_PER_TICK` (15) Energie je Tick
     * an — für den ganzen Raum. `BODIES.upgraderRcl8` schöpft das mit 15 WORK
     * allein aus, ein zweiter Upgrader brächte dort nichts.
     */
    spawn(spawn: StructureSpawn, workroom: string): boolean
    {
        const forced = storageIsFull(workroom);

        var uppis = bot.room[workroom]!.upgrader

        if(!forced && (!uppis || uppis < 1))
            return false;

        if(spawn.room.name != workroom)
            return false;

        if(!forced && spawn.room.controller!.level > 7 && spawn.room.controller!.ticksToDowngrade > 100000 && spawn.room.storage && spawn.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 250000)
            return false;

        var count = _.filter(Game.creeps, (creep: Creep) => creep.memory.role == role &&
                                                    creep.memory.workroom == workroom &&
                                                    (creep.ticksToLive! > 160 || creep.spawning)
                                                    ).length;

        const target = forced ? Math.max(1, uppis ?? 0) : uppis!;

        if ( target <= count)
            return false;

        var profil = this.bodyFor(spawn, workroom);

        return creepBase.spawn(spawn, profil, role + '_' + Game.time,{ role: role, workroom: workroom, home: spawn.room.name, repairs:0, noLink: false});
    }
```

- [ ] **Schritt 4: Test und Typecheck laufen lassen**

```bash
cd tsBot && pnpm test && pnpm exec tsc --noEmit
```

Erwartet: alle Tests bestehen, auch die beiden bestehenden `bodyFor`-Tests.

- [ ] **Schritt 5: Bauen und Rauchtest**

```bash
cd tsBot && pnpm build && pnpm smoke
```

- [ ] **Schritt 6: Committen**

```bash
git add tsBot/src/roles/upgrader.ts tsBot/tests/roles-upgrader.test.ts tsProd/main.js tsProd-backup
git commit -m "feat: bei ueberlaufendem Storage steht mindestens ein Upgrader"
```

---

### Aufgabe 6: Dokumentation nachziehen

**Dateien:**
- Ändern: `docs/aenderungen.md` (neuer Eintrag oben in der laufenden Runde)
- Ändern: `docs/rollen.md` (Abschnitt zum Linkkeeper und zum Upgrader)
- Ändern: `docs/controller-und-automatik.md` (Abschnitt zum Linknetz)

**Schnittstellen:**
- Verbraucht: die fertigen Änderungen aus den Aufgaben 1 bis 5
- Liefert: nichts für spätere Aufgaben — letzter Schritt.

- [ ] **Schritt 1: Bestehende Struktur lesen**

```bash
grep -n "Link" docs/aenderungen.md | head -30
grep -n "linkkeeper\|Linkkeeper" docs/rollen.md
grep -n "Linknetz\|LinkNetwork" docs/controller-und-automatik.md
```

Die vorhandene Gliederung und Überschriftenebene übernehmen, keine neue Struktur erfinden.

- [ ] **Schritt 2: `docs/aenderungen.md` ergänzen**

Ein Eintrag im Stil der Datei — was, warum, erwartete Wirkung:

```markdown
- **Der Storage-Link speist den Controller-Link.** Bisher war er reiner
  Empfänger; jetzt sendet er, wenn die Quell-Links nichts liefern
  (`needsStorageFeed` in `controller/links.ts`) oder der Storage überläuft
  (`storageIsFull` in `controller/storage-pressure.ts`, über 90 Prozent Belegung
  bei mehr als 100 000 Energie). Der Linkkeeper füllt den Link dafür aus dem
  Storage, statt ihn nur zu leeren — beide Seiten fragen dieselbe Funktion, weil
  der Keeper im Tick vor dem Sendenetz handelt. Zusätzlich steht bei
  überlaufendem Storage mindestens ein Upgrader, auch bei `upgrader: 0` in der
  Config und trotz des RCL8-Gates. Erwartete Wirkung: der Upgrader wartet nicht
  mehr auf einen leeren Controller-Link und läuft nicht zu Fuß zum Storage; ein
  volllaufender Storage bekommt einen Abfluss. Untergrenzen: 20 000 Energie im
  Rückfall, 100 000 im Vollpumpmodus.
```

- [ ] **Schritt 3: `docs/rollen.md` ergänzen**

Im Abschnitt zum Linkkeeper die zweite Richtung beschreiben (er pendelt nicht mehr nur Link → Storage, sondern füllt bei Bedarf aus dem Storage in den Link; entschieden von `needsStorageFeed`). Im Abschnitt zum Upgrader den Spawn-Vorrang bei überlaufendem Storage ergänzen, samt dem Hinweis, dass ab RCL8 genau einer genügt (`CONTROLLER_MAX_UPGRADE_PER_TICK` = 15 für den ganzen Raum).

- [ ] **Schritt 4: `docs/controller-und-automatik.md` ergänzen**

Im Abschnitt zum Linknetz ergänzen: der Storage-Link ist nicht mehr nur Empfänger. Die beiden Fälle nennen (Rückfall und Vollpumpmodus), dass er in der Senderliste **hinten** steht (Quellenergie vor Vorratsabbuchung) und dass er währenddessen aus der Empfängerliste fällt — was ab RCL8 den dort dokumentierten Vorrang „Storage-Link zuerst" überstimmt.

- [ ] **Schritt 5: Abschließende Verifikation**

```bash
cd tsBot && pnpm exec tsc --noEmit && pnpm test && pnpm build && pnpm smoke
```

Erwartet: alle vier fehlerfrei.

- [ ] **Schritt 6: Committen**

```bash
git add docs/aenderungen.md docs/rollen.md docs/controller-und-automatik.md
git commit -m "docs: Storage-Nachschub in den Controller-Link dokumentiert"
```

---

## Abnahmekriterien des Gesamtplans

Aus der Spec übernommen; der Hauptagent prüft sie selbst nach, statt den Meldungen der Bearbeiter zu glauben.

1. Kein Sendeversuch unter `SEND_MIN` — für den Storage-Link wie für Quell-Links. (Aufgabe 3, Test „Storage-Link mit Cooldown oder zu wenig Ladung")
2. Hält ein Quell-Link eine Ladung ≥ `SEND_MIN`, sendet der Storage-Link nicht — außer im Vollpumpmodus. (Aufgabe 2, Test „ein Quell-Link mit Ladung liefert selbst")
3. Storage-Energie unter `STORAGE_FEED_RESERVE`: kein Nachschub, auf jeder Stufe. (Aufgabe 2)
4. Ist `needsStorageFeed` wahr, taucht der Storage-Link nicht in der Empfängerliste auf. (Aufgabe 3, Test „solange nachgeschoben wird")
5. Der Linkkeeper füllt genau dann, wenn `needsStorageFeed` wahr ist, und leert sonst. (Aufgabe 4)
6. `storageIsFull` und kein Upgrader im Raum → `spawn()` liefert `true`, auch bei `upgrader: 0` und Downgrade-Timer über 100 000. (Aufgabe 5)
7. `storageIsFull` ist falsch, sobald die Energie unter `STORAGE_FULL_MIN_ENERGY` liegt — auch bei 99 Prozent Belegung mit Mineralien. (Aufgabe 1)
8. Im Vollpumpmodus mit einem bereiten Quell-Link bekommt der Controller-Link die Quellenergie, nicht die aus dem Storage. (Aufgabe 3)
9. `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm smoke` fehlerfrei. (Aufgabe 6, Schritt 5)
