# Die Rolle `collector` — Umsetzungsplan

> **Für agentische Bearbeiter:** ERFORDERLICHE SUB-SKILL: `superpowers:subagent-driven-development` (empfohlen) oder `superpowers:executing-plans`, um diesen Plan Aufgabe für Aufgabe umzusetzen. Die Schritte benutzen Checkbox-Syntax (`- [ ]`) zur Verfolgung.

**Ziel:** Eine Rolle `collector`, die im Heimatraum alles einsammelt, was nicht laufender Energiebetrieb ist — Gefallenes besiegter Gegner, Drops, Ruinen, den Container am Extractor und verkaufbare Ressourcen aus dem Storage — und ins Terminal bringt, samt genug Energie dort, damit der Markt überhaupt handeln kann.

**Architektur:** Eine Rollenklasse `Collector` mit `@profile`, die ausschließlich vorhandene Helfer aus `creep/base.ts` aufruft und keine eigenen Suchen schreibt. Der Zustandsautomat ist der übliche `memory.harvest`, umgeschaltet von `creep.checkHarvest()`. Vorgeschaltet wird die doppelt gepflegte `NEVER_SELL`-Liste an einer Stelle zusammengelegt, damit der Collector nicht ihre dritte Kopie wird.

**Tech-Stack:** TypeScript (strict + `noUncheckedIndexedAccess`), esbuild-Bundle nach `tsProd/main.js`, Tests mit `node --test` gegen die Stubs in `tsBot/tests/support/`.

**Spec:** `docs/superpowers/specs/2026-08-08-collector-rolle-design.md`

## Globale Randbedingungen

Gelten für **jede** Aufgabe:

- **Alle Befehle laufen in `tsBot/`.** Vorher `cd tsBot`.
- **Bezeichner englisch, Kommentare und Logausgaben deutsch.** Neue Schlüssel englisch; bestehende Memory-Schlüssel (`harvest`, `container`, `workroom`, `home`) bleiben, wie sie sind.
- **Der Rollenname `collector` steht künftig im Creep-Memory** und darf sich danach nicht mehr ändern.
- **Typecheck immer mit `--noEmit`:** `pnpm exec tsc --noEmit`. Bei parallelen Läufen zählen nur Fehler im eigenen Dateipfad.
- **`noUncheckedIndexedAccess` ist an.** Index-Zugriffe sind `T | undefined` und werden mit `!` bzw. `as` bedient, **nicht** mit zusätzlichen `if`-Abfragen — esbuild entfernt `!`/`as`, ein neuer Guard würde das Verhalten ändern.
- **Schwellenvergleiche positiv formulieren** (`store[type] > min`): bei fehlender Ressource ist der Wert `undefined`, und dann sind `>` und negiertes `<=` beide falsch.
- **Tests laden das Modul unter Test per `await import(...)` nach dem Anlegen der Globals,** nie per statischem Import. `Game` und `Memory` werden geleert, nie ersetzt.
- **Ein Rückfallprofil ist Pflicht** bei jedem Rumpfprofil: ein leeres Body-Array lässt `spawnCreep` immer fehlschlagen, dieser Fehler ist im Repo schon dreimal aufgetreten.
- **`pnpm build` ab Aufgabe 4.** Vorher hängt der neue Code an keinem Import aus `main.ts` und liegt deshalb nicht im Bundle; `tsProd/main.js` änderte sich nur um den Build-Stempel. Ab der Verdrahtung wird gebaut und mitcommittet, weil das Spiel über GitHub synct.
- **Ein Commit je Aufgabe,** Nachricht deutsch, ohne Signaturzeilen.

Exakte Werte, die im Code stehen müssen:

| Konstante | Wert | Datei |
| --- | --- | --- |
| `TERMINAL_ENERGY_TARGET` | `20000` | `src/roles/collector.ts` |
| `TERMINAL_FREE_MIN` | `50000` | `src/roles/collector.ts` |

## Dateiübersicht

| Datei | Zuständigkeit | Aufgabe |
| --- | --- | --- |
| `src/prototypes/terminal-market.ts` | `NEVER_SELL` wird exportiert — eine Quelle statt drei | 1 |
| `src/roles/debitor.ts` | importiert `NEVER_SELL` statt eigener Kopie | 1 |
| `src/creep/bodies.ts` | Rumpfprofil `collector` | 2 |
| `tests/creep-bodies.test.ts` | Referenzformel dazu | 2 |
| `src/roles/collector.ts` | **neu** — die Rolle | 3 |
| `tests/roles-collector.test.ts` | **neu** — Tests dazu | 3 |
| `src/roles/index.ts` | Verdrahtung, zwischen `defender` und `wally` | 4 |
| `docs/aenderungen.md`, `docs/rollen.md`, `docs/konfiguration-und-memory.md` | Doku | 5 |

`NEVER_SELL` zieht nach `prototypes/terminal-market.ts` und nicht in ein neues Modul: dort steht die Logik, die die Liste auswertet (`sell()`), sie ist also Marktwissen. Ein eigenes Modul für eine Konstante wäre ein Ordner mehr ohne Gewinn.

---

### Aufgabe 1: `NEVER_SELL` an eine Stelle legen

Reine Aufräumarbeit **ohne Verhaltensänderung**, bewusst vor der neuen Rolle und in einem eigenen Commit — damit ein späterer Rückschritt sie von der Rolle trennen kann.

**Dateien:**
- Ändern: `tsBot/src/prototypes/terminal-market.ts` (Zeile 44: `const NEVER_SELL` → `export const NEVER_SELL`)
- Ändern: `tsBot/src/roles/debitor.ts` (Zeilen 25-39: eigene Kopie löschen, Import ergänzen)

**Interfaces:**
- Verbraucht: nichts
- Liefert: `export const NEVER_SELL: Record<string, boolean>` aus `src/prototypes/terminal-market.ts` — Aufgabe 3 importiert sie ebenfalls.

- [ ] **Schritt 1: Belegen, dass beide Listen heute identisch sind**

```bash
cd tsBot
sed -n '44,58p' src/prototypes/terminal-market.ts
sed -n '25,39p' src/roles/debitor.ts
```

Erwartet: dieselben dreizehn Schlüssel (`energy`, `power`, `pixel`, `XUH2O`, `XUHO2`, `XKHO2`, `XKH2O`, `XZH2O`, `XZHO2`, `XLH2O`, `XLHO2`, `XGH2O`, `XGHO2`). **Weichen sie ab, brich ab und melde es** — dann ist das Zusammenlegen eine Verhaltensänderung und gehört anders geplant.

- [ ] **Schritt 2: Die Liste exportierbar machen**

In `tsBot/src/prototypes/terminal-market.ts` die Deklaration ersetzen:

```typescript
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
```

- [ ] **Schritt 3: Die Kopie im Debitor entfernen**

In `tsBot/src/roles/debitor.ts` den Block `const NEVER_SELL = { … };` (Zeilen 25-39) **ersatzlos löschen** und den Import ergänzen:

```typescript
import { NEVER_SELL } from "../prototypes/terminal-market";
```

Die Verwendung in `doJob` (Zeile 113, `!(NEVER_SELL as any)[r]`) bleibt unverändert — der Cast steht dort schon und ist nicht Gegenstand dieser Aufgabe.

- [ ] **Schritt 4: Typecheck und Tests**

```bash
cd tsBot && pnpm exec tsc --noEmit && pnpm test
```

Erwartet: keine Fehler, alle Tests unverändert grün. Es gibt keinen neuen Test — die Änderung ist verhaltensgleich, und `tests/terminal-market.test.ts` deckt `sell()` bereits ab.

- [ ] **Schritt 5: Committen**

```bash
git add tsBot/src/prototypes/terminal-market.ts tsBot/src/roles/debitor.ts
git commit -m "refactor: NEVER_SELL steht nur noch an einer Stelle"
```

---

### Aufgabe 2: Rumpfprofil `collector`

**Dateien:**
- Ändern: `tsBot/src/creep/bodies.ts` (neuer Eintrag im `BODIES`-Objekt)
- Ändern: `tsBot/tests/creep-bodies.test.ts` (Referenzformel anhängen)

**Interfaces:**
- Verbraucht: `BodyProfile` aus `./body` (vorhanden)
- Liefert: `BODIES.collector` mit `.build(energyCapacityAvailable: number): BodyPartConstant[]` — Aufgabe 3 ruft es auf.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

Ans Ende von `tsBot/tests/creep-bodies.test.ts` anhängen:

```typescript
test("collector: zehn Sätze CARRY+MOVE, Rückfall bei knapper Energie", async () => {
  const { BODIES } = await loadBodies();

  // 10 Sätze à (CARRY 50 + MOVE 50) = 1000 Energie.
  const full = BODIES.collector.build(2300);
  assert.equal(full.filter(part => part === CARRY).length, 10);
  assert.equal(full.filter(part => part === MOVE).length, 10);

  // Genau die Kosten eines Satzes: ein Satz passt.
  const single = BODIES.collector.build(100);
  assert.equal(single.filter(part => part === CARRY).length, 1);
  assert.equal(single.filter(part => part === MOVE).length, 1);

  // Unter einem Satz greift der Rückfall — nie ein leeres Array, sonst
  // schlägt spawnCreep immer fehl.
  const fallback = BODIES.collector.build(50);
  assert.notEqual(fallback.length, 0, "ein leeres Body-Array laesst spawnCreep immer fehlschlagen");
  assert.deepEqual(fallback, [CARRY, MOVE]);
});
```

Falls die Hilfsfunktion in dieser Datei anders heißt als `loadBodies`, benutze den vorhandenen Namen — die Datei lädt `bodies.ts` bereits irgendwie, lege keinen zweiten Lader an.

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
cd tsBot && pnpm test
```

Erwartet: FEHLSCHLAG — `BODIES.collector` ist `undefined`.

- [ ] **Schritt 3: Das Profil ergänzen**

In `tsBot/src/creep/bodies.ts` innerhalb des `BODIES`-Objekts einfügen (die Reihenfolge im Objekt ist beliebig, hänge es hinter `linkkeeper`):

```typescript
  /**
   * Collector: reines CARRY/MOVE für kurze Wege im eigenen Raum.
   *
   * Keine Durchsatzformel dahinter — der Collector hat keine Frist und fährt
   * nur zwischen Storage, Terminal und dem, was gerade im Raum liegt. Zehn
   * Sätze (500 Einheiten Ladung) sind reichlich und kosten 1000 Energie, was ab
   * RCL6 — dort steht das Terminal, ohne das die Rolle nicht spawnt — in jeden
   * Spawn passt.
   */
  collector: new BodyProfile({
    sets: [
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 1 },
    ],
    maxSets: 10,
    fallback: [CARRY, MOVE],
  }),
```

- [ ] **Schritt 4: Test laufen lassen und Erfolg bestätigen**

```bash
cd tsBot && pnpm test && pnpm exec tsc --noEmit
```

- [ ] **Schritt 5: Committen**

```bash
git add tsBot/src/creep/bodies.ts tsBot/tests/creep-bodies.test.ts
git commit -m "feat: Rumpfprofil fuer die Rolle collector"
```

---

### Aufgabe 3: Die Rolle `collector`

**Dateien:**
- Anlegen: `tsBot/src/roles/collector.ts`
- Anlegen: `tsBot/tests/roles-collector.test.ts`

**Interfaces:**
- Verbraucht: `NEVER_SELL` aus `../prototypes/terminal-market` (Aufgabe 1); `BODIES.collector` (Aufgabe 2); aus `../creep/base` die Funktionen `harvestCompleteRoomTombstones(creep): boolean`, `harvestRoomDrops(creep, type: string): boolean`, `harvestRoomRuins(creep, type: string): boolean`, `harvestRoomStorage(creep, type: string): boolean`, `harvestMyContainer(creep, type: string): boolean`, `TransportToHomeTerminal(creep): boolean`, `TransportToHomeStorage(creep): boolean`, `spawn(spawn, profil, newName, memory): boolean`; `mineralSources(roomName): string[]` aus `../controller/room-inventory`
- Liefert: `export class Collector implements CreepRole` und `export default new Collector()` — Aufgabe 4 importiert den Default.

**Zwei Eigenheiten der Helfer, die den Entwurf tragen:**

- `harvestRoomDrops(creep, type)` **ignoriert seinen `type`-Parameter**: die Funktion filtert nur auf `amount > 100` und ruft `creep.pickup(drop)`. Sie hebt damit jeden Drop auf, auch Mineralien besiegter Gegner. Der Parameter wird trotzdem übergeben, weil die Signatur ihn verlangt.
- `harvestMyContainer(creep, type)` liest `creep.memory.container`. Der Collector benutzt genau das für den Extractor-Container — er merkt sich dessen Id dort und braucht keine eigene Suchfunktion.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

Neue Datei `tsBot/tests/roles-collector.test.ts`:

```typescript
/**
 * Prüft die Rolle "collector" (`src/roles/collector.ts`).
 *
 * Sie schließt die Lücke, die Plan 10 gerissen hat: seit `filler` und `hauler`
 * den Heimatraum-Debitor ersetzt haben, holt niemand mehr Mineralien aus dem
 * Storage, sammelt Gefallenes auf oder hält Energie im Terminal — der Code dafür
 * lebte noch im Debitor, der in Räumen mit Storage aber nicht mehr spawnt.
 *
 * Die Sammelstufen sind nach **Verfallsgeschwindigkeit** sortiert; genau das
 * prüfen die Reihenfolgetests. `doJob` ruft `creep.checkHarvest()` — den
 * Prototyp aus `prototypes/creep-checks.ts` —, deshalb wird er wie in
 * `tests/roles-filler.test.ts` direkt auf jeden Test-Creep kopiert.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installCreepChecks } from "../src/prototypes/creep-checks";
import { position } from "./support/movement-stubs";
import {
  actionCalls,
  configureRoom,
  installCreepWorld,
  registerObject,
  roomMemory,
  stubActor,
  stubRoom,
  stubStore,
  stubStructure,
} from "./support/creep-stubs";

const anyGlobal = globalThis as any;
const ROOM = "E58N6";

let collectorWorldInstalled = false;

/** Legt die Welt an: `Creep`, `installCreepChecks()`, ein minimales `_`. */
function installCollectorWorld(): void {
  installCreepWorld();

  if (!collectorWorldInstalled) {
    collectorWorldInstalled = true;

    anyGlobal.Creep = function (this: any) {};
    installCreepChecks();

    anyGlobal._ = {
      filter<T>(collection: Record<string, T> | T[], predicate: (item: T) => boolean): T[] {
        const values = Array.isArray(collection) ? collection : Object.values(collection);
        return values.filter(predicate);
      },
    };
  }
}

async function loadCollector(): Promise<typeof import("../src/roles/collector")> {
  installCollectorWorld();
  return await import("../src/roles/collector");
}

/** Kopiert `checkHarvest` direkt auf den Test-Creep — siehe Dateikopf. */
function addCheckHarvest<T>(creep: T): T {
  (creep as any).checkHarvest = anyGlobal.Creep.prototype.checkHarvest;
  return creep;
}

// --- Sammeln: Reihenfolge nach Verfall -----------------------------------------

test("Tombstones kommen vor allem anderen — sie zerfallen und nehmen den Inhalt mit", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  // Ein Grabstein ist keine Struktur, deshalb kein `stubStructure`: er braucht
  // nur Id, Store und Position, und `Game.getObjectById` muss ihn finden.
  const tombstone = registerObject({
    id: "tombstone",
    store: stubStore(500, { [RESOURCE_ENERGY]: 300 }),
    pos: position(10, 10, ROOM),
  } as any);

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { O: 5000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: 50000 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
      closest: { [FIND_TOMBSTONES]: [tombstone] },
    }),
  );

  collector.doJob(creep);

  assert.equal(actionCalls.length > 0, true, "es wurde etwas getan");
  assert.equal(
    actionCalls[0]!.targetId,
    "tombstone",
    "der Grabstein wird vor dem Storage bedient — er verfaellt, das Mineral im Storage nicht",
  );
});

test("ohne Tombstone und ohne Drop wird die verkaufbare Ressource aus dem Storage geholt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { O: 5000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: 50000 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(actionCalls.some(call => call.targetId === "storage" && call.resource === "O"), true);
});

test("eine Ressource auf der NEVER_SELL-Liste wird nicht aus dem Storage geholt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  // `power` steht auf der Liste, `energy` ohnehin — es bleibt nichts zu holen.
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { power: 5000, [RESOURCE_ENERGY]: 500000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: 50000 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.resource === "power"),
    false,
    "power steht auf NEVER_SELL und wird nicht angefasst",
  );
});

// --- Energiedeckung im Terminal ------------------------------------------------

test("liegt zu wenig Energie im Terminal, holt der Collector welche aus dem Storage", async () => {
  const { Collector, TERMINAL_ENERGY_TARGET } = await loadCollector();
  const collector = new Collector();

  // Kein Mineral im Storage: die Energiestufe ist die einzige, die greifen kann.
  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { [RESOURCE_ENERGY]: 500000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: TERMINAL_ENERGY_TARGET - 1 }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.targetId === "storage" && call.resource === RESOURCE_ENERGY),
    true,
  );
});

test("liegt genug Energie im Terminal, holt der Collector keine", async () => {
  const { Collector, TERMINAL_ENERGY_TARGET } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { [RESOURCE_ENERGY]: 500000 }));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000, { [RESOURCE_ENERGY]: TERMINAL_ENERGY_TARGET }));

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.some(call => call.targetId === "storage"),
    false,
    "genau die Zielgroesse reicht — die Bedingung ist `<`, nicht `<=`",
  );
});

test("ist im Terminal zu wenig frei, wird nichts mehr nachgeliefert", async () => {
  const { Collector, TERMINAL_FREE_MIN } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000, { O: 5000 }));
  // Belegt bis auf weniger als TERMINAL_FREE_MIN.
  const terminal = stubStructure(
    "terminal",
    STRUCTURE_TERMINAL,
    21,
    21,
    ROOM,
    stubStore(300000, { [RESOURCE_ENERGY]: 300000 - (TERMINAL_FREE_MIN - 1) }),
  );

  const room = stubRoom(ROOM, { storage, terminal });
  configureRoom(ROOM, {});
  roomMemory(ROOM, {});

  const creep: any = addCheckHarvest(
    stubActor(15, 15, ROOM, {
      store: stubStore(500),
      memory: { role: "collector", workroom: ROOM, home: ROOM, harvest: true, container: "" },
      room,
    }),
  );

  collector.doJob(creep);

  assert.equal(
    actionCalls.length,
    0,
    "bei vollem Terminal wird nichts mehr aus Storage oder Extractor-Container geholt — " +
      "Tombstones und Drops dagegen sammelt der Collector weiter ein, die verfallen sonst",
  );
});

// --- Spawnbedingung ------------------------------------------------------------

/** Ein Spawn-Stub, dessen `spawnCreep` jeden Aufruf mitschreibt und OK meldet. */
function stubCollectorSpawn(roomName: string, options: { storage?: unknown; terminal?: unknown } = {}) {
  const spawnCalls: { profil: BodyPartConstant[]; newName: string; memory?: Record<string, any> }[] = [];

  const spawnObj: any = {
    room: {
      name: roomName,
      storage: options.storage,
      terminal: options.terminal,
      energyCapacityAvailable: 2300,
    },
    spawnCreep(profil: BodyPartConstant[], newName: string, opts?: { memory?: Record<string, any> }): number {
      spawnCalls.push({ profil: [...profil], newName, memory: opts?.memory });
      return OK;
    },
  };

  return { spawnObj, spawnCalls };
}

test("ohne Terminal oder ohne Storage wird kein Collector gespawnt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000));

  const ohneTerminal = stubCollectorSpawn(ROOM, { storage });
  assert.equal(collector.spawn(ohneTerminal.spawnObj, ROOM), false, "ohne Terminal nicht");

  const ohneStorage = stubCollectorSpawn(ROOM, { terminal });
  assert.equal(collector.spawn(ohneStorage.spawnObj, ROOM), false, "ohne Storage nicht");
});

test("mit Storage und Terminal wird genau einer gespawnt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000));

  const { spawnObj } = stubCollectorSpawn(ROOM, { storage, terminal });
  assert.equal(collector.spawn(spawnObj, ROOM), true);

  // Schlüssel setzen statt `Game.creeps` zu ersetzen — `resetWorld()` leert das
  // vorhandene Objekt, ein neues käme dort nie an.
  anyGlobal.Game.creeps["collector_1"] = { memory: { role: "collector", workroom: ROOM } };
  assert.equal(collector.spawn(spawnObj, ROOM), false, "einer genuegt");
});

test("aus einem fremden Raum wird nicht gespawnt", async () => {
  const { Collector } = await loadCollector();
  const collector = new Collector();

  const storage = stubStructure("storage", STRUCTURE_STORAGE, 20, 20, ROOM, stubStore(1000000));
  const terminal = stubStructure("terminal", STRUCTURE_TERMINAL, 21, 21, ROOM, stubStore(300000));

  const { spawnObj } = stubCollectorSpawn("E58N7", { storage, terminal });
  assert.equal(collector.spawn(spawnObj, ROOM), false, "die Rolle kennt kein goToWorkroom");
});
```

**Wenn ein Test wegen der Stub-Mechanik nicht so ausfällt wie beschrieben** (etwa weil `stubActor` eine Suchart nicht bedient, die der Helfer benutzt), melde das im Bericht mit deiner Analyse und passe **den Stubaufbau** an — nicht die geprüfte Aussage. Die Aussagen oben sind die Abnahmekriterien der Spec.

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
cd tsBot && pnpm test
```

Erwartet: FEHLSCHLAG mit `Cannot find module '../src/roles/collector'`.

- [ ] **Schritt 3: Die Rolle schreiben**

Neue Datei `tsBot/src/roles/collector.ts`:

```typescript
/**
 * Rolle "collector": sammelt im Heimatraum alles ein, was nicht laufender
 * Energiebetrieb ist, und bringt es dorthin, wo es hingehört.
 *
 * Schließt die Lücke aus Plan 10 (`docs/plans/10-logistikrollen.md`): seit
 * `filler` und `hauler` den Heimatraum-Debitor ersetzt haben, wird
 * `roles/debitor.ts:106-122` in Räumen mit Storage nie mehr ausgeführt — dort
 * stand der einzige Umzug Storage → Terminal im ganzen Bot. Mineralien blieben
 * seitdem im Storage liegen, Gefallenes im Raum, und das Terminal bekam keine
 * Energie mehr, ohne die `TerminalMarket.sell` gar nicht erst anläuft.
 *
 * Vier Aufgaben in einer Rolle sind hier Absicht, obwohl Plan 10 den Debitor
 * genau wegen seiner Kaskade zerlegt hat: dort waren es **verschiedene Zwecke**
 * in **vielen** Creeps, und jeder zahlte je Tick für Bedingungen, die ihn nichts
 * angingen. Hier ist es **ein Zweck** in **einem** Creep je Raum. Wächst die
 * Rolle über diesen Zweck hinaus, ist das das Signal, sie zu teilen — nicht die
 * Zahl ihrer Zweige.
 */

import { mineralSources } from "../controller/room-inventory";
import * as creepBase from "../creep/base";
import { BODIES } from "../creep/bodies";
import { NEVER_SELL } from "../prototypes/terminal-market";
import type { CreepRole } from "../roles";
import { profile } from "../profiler/decorator";

/**
 * Rollenname. Steht im Creep-Memory des laufenden Spiels und darf sich
 * nicht ändern.
 */
const role = "collector";

/**
 * Zielbestand an Energie im Terminal.
 *
 * `TerminalMarket.sell` steigt unter 1000 Energie im Terminal aus und bezahlt
 * daraus die Transferkosten — bei 5000 Einheiten über zwanzig Räume rund 2400
 * Energie je Handel. Der Wert deckt mehrere Handel und liegt weit unter der
 * Grenze von 100 000, ab der `TransportToHomeTerminal` Energie ohnehin abweist.
 *
 * Er steuert nur das **Holen**: abgeliefert wird über
 * `TransportToHomeTerminal`, das seine eigene Grenze mitbringt. Zwei Regeln für
 * dieselbe Frage wären eine zu viel.
 */
export const TERMINAL_ENERGY_TARGET = 20000;

/**
 * Überlaufschutz: nachgeliefert wird nur, solange so viel im Terminal frei ist.
 *
 * Dieselbe Zahl, die schon der alte Debitor benutzte — keine Neuerfindung,
 * sondern der bisherige Stand.
 */
export const TERMINAL_FREE_MIN = 50000;

/** Siehe Dateikopf. `@profile` misst jede Methode dieser Klasse. */
@profile
export class Collector implements CreepRole {
    /** Sammelt oder liefert ab, je nach `memory.harvest`. */
    doJob(creep: Creep): void {
        creep.checkHarvest();

        if (creep.memory.harvest) {
            this._collect(creep);
            return;
        }

        this._deliver(creep);
    }

    /**
     * Sammeln, sortiert nach Verfallsgeschwindigkeit: was zuerst verschwindet,
     * kommt zuerst dran. Grabsteine nehmen ihren Inhalt beim Zerfall mit, Drops
     * schrumpfen je Tick, Ruinen halten länger; was im Storage liegt, verfällt
     * gar nicht und wartet.
     */
    private _collect(creep: Creep): void {
        if (creepBase.harvestCompleteRoomTombstones(creep)) return;

        // Der `type` wird von `harvestRoomDrops` nicht ausgewertet — die
        // Funktion hebt jeden Drop über 100 Einheiten auf, auch Mineralien
        // besiegter Gegner. Die Signatur verlangt das Argument trotzdem.
        if (creepBase.harvestRoomDrops(creep, RESOURCE_ENERGY)) return;

        if (creepBase.harvestRoomRuins(creep, RESOURCE_ENERGY)) return;

        // Ab hier wird nur noch geholt, was auch abgeliefert werden kann.
        if (!this._terminalHasRoom(creep)) return;

        if (this._collectMineralContainer(creep)) return;
        if (this._collectSellable(creep)) return;

        this._collectTerminalEnergy(creep);
    }

    /**
     * Hat das Terminal überhaupt noch Platz?
     *
     * Ohne diese Prüfung trüge der Collector Ware zu einem vollen Terminal und
     * legte sie über den Rückfall wieder ins Storage — ein Umlauf ohne Wirkung.
     */
    private _terminalHasRoom(creep: Creep): boolean {
        const terminal = creep.room.terminal;
        return Boolean(terminal && (terminal.store.getFreeCapacity() ?? 0) > TERMINAL_FREE_MIN);
    }

    /**
     * Leert den Container am Mineralvorkommen.
     *
     * Den holt seit Plan 10 sonst niemand ab: `Hauler.spawn` läuft über
     * `energySources` und `Hauler.doJob` holt ausschließlich Energie. Die Id
     * landet in `memory.container`, damit `harvestMyContainer` sie benutzen kann
     * — eine eigene Suche braucht es dafür nicht.
     */
    private _collectMineralContainer(creep: Creep): boolean {
        const containerId = this._mineralContainerId(creep);
        if (!containerId) return false;

        creep.memory.container = containerId;

        const container: any = Game.getObjectById(containerId);
        if (!container) {
            creep.memory.container = '';
            return false;
        }

        // Die erste Ressource, die nicht Energie ist. Energie am Extractor
        // gehört dem `hauler`, nicht dieser Rolle.
        const mineral = Object.keys(container.store).find(resource => resource !== RESOURCE_ENERGY);
        if (!mineral) return false;

        return creepBase.harvestMyContainer(creep, mineral);
    }

    /** Der Container neben dem Mineralvorkommen des Raums, oder `null`. */
    private _mineralContainerId(creep: Creep): string | null {
        for (const mineralId of mineralSources(creep.room.name)) {
            const mineral: any = Game.getObjectById(mineralId);
            if (!mineral) continue;

            const containers = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: { structureType: STRUCTURE_CONTAINER },
            });

            if (containers.length > 0) return containers[0].id;
        }

        return null;
    }

    /**
     * Die erste verkaufbare Ressource aus dem Storage.
     *
     * Dieselbe Auswahl, die der Debitor traf, bevor er im Heimatraum nicht mehr
     * spawnte: mehr als 100 Einheiten, nicht Energie, nicht auf `NEVER_SELL`.
     */
    private _collectSellable(creep: Creep): boolean {
        const storage = creep.room.storage;
        if (!storage) return false;

        const sellable = Object.keys(storage.store).find(resource =>
            resource !== RESOURCE_ENERGY &&
            !NEVER_SELL[resource] &&
            (storage.store as any)[resource] > 100
        );

        if (!sellable) return false;

        return creepBase.harvestRoomStorage(creep, sellable);
    }

    /** Energie aus dem Storage, solange das Terminal unter der Zielgröße liegt. */
    private _collectTerminalEnergy(creep: Creep): boolean {
        const terminal = creep.room.terminal;

        // Positiv formuliert: fehlt der Wert, ist der Vergleich falsch — und
        // dann wird nichts geholt, was hier die sichere Seite ist.
        if (!terminal || !(terminal.store[RESOURCE_ENERGY] < TERMINAL_ENERGY_TARGET)) {
            return false;
        }

        return creepBase.harvestRoomStorage(creep, RESOURCE_ENERGY);
    }

    /** Abliefern: erst das Terminal, dann das Storage als Rückfall. */
    private _deliver(creep: Creep): void {
        if (creepBase.TransportToHomeTerminal(creep)) return;
        creepBase.TransportToHomeStorage(creep);
    }

    /**
     * Spawnt den einzigen Collector für `workroom`.
     *
     * Abgeleitet statt konfiguriert: ein eigener Raum mit Storage **und**
     * Terminal bekommt einen. Kein Config-Schlüssel — beides sind Tatsachen über
     * die Welt, und die gehören nach CLAUDE.md nicht in die Config.
     *
     * Am Bauwerk festgemacht und nicht am RCL: ein Raum kann RCL 6 erreicht
     * haben, ohne das Terminal gebaut zu haben. Dieselbe Begründung steht schon
     * bei `Filler.spawn`.
     */
    spawn(spawn: StructureSpawn, workroom: string): boolean {
        // Die Rolle kennt kein `goToWorkroom` — sie käme in einem fremden Raum
        // nie an.
        if (spawn.room.name != workroom)
            return false;

        if (!spawn.room.storage || !spawn.room.terminal)
            return false;

        if (_.filter(Game.creeps, (creep: Creep) => creep.memory.role == role && creep.memory.workroom == workroom).length >= 1)
            return false;

        return creepBase.spawn(
            spawn,
            BODIES.collector.build(spawn.room.energyCapacityAvailable),
            role + '_' + Game.time,
            { role: role, workroom: workroom, home: spawn.room.name, harvest: true, container: '' },
        );
    }
}

export default new Collector();
```

- [ ] **Schritt 4: Test und Typecheck laufen lassen**

```bash
cd tsBot && pnpm test && pnpm exec tsc --noEmit
```

Erwartet: alle neuen Tests bestehen, die bestehenden unverändert.

- [ ] **Schritt 5: Committen**

```bash
git add tsBot/src/roles/collector.ts tsBot/tests/roles-collector.test.ts
git commit -m "feat: Rolle collector sammelt ein und beliefert das Terminal"
```

---

### Aufgabe 4: Verdrahtung in der Rollentabelle

**Diese Aufgabe macht der Hauptagent** — `roles/index.ts` ist eine gemeinsam genutzte Datei, und die Reihenfolge ihrer Properties **ist** die Spawn-Priorität.

**Dateien:**
- Ändern: `tsBot/src/roles/index.ts`
- Erzeugt: `tsProd/main.js` per `pnpm build`

**Interfaces:**
- Verbraucht: `export default new Collector()` aus `./collector` (Aufgabe 3)
- Liefert: den Rollenschlüssel `collector` in `jobs` — ab hier spawnt der Bot die Rolle wirklich.

- [ ] **Schritt 1: Import ergänzen**

In `tsBot/src/roles/index.ts` bei den Importen, alphabetisch zwischen `claimer` und `debitor`:

```typescript
import collector from "./collector";
```

- [ ] **Schritt 2: In die Tabelle eintragen**

Zwischen `defender` und `wally` einfügen — **nicht** woanders:

```typescript
  defender,
  // Wirtschaft statt Durchsatz: der Collector räumt auf und beliefert das
  // Terminal. Hinter der Verteidigung, weil ein Raum unter Beschuss andere
  // Sorgen hat — vor `wally`, weil Einsammeln mehr bringt als Mauerreparatur.
  collector,
  wally,
```

- [ ] **Schritt 3: Typecheck, Tests, Build und Rauchtest**

```bash
cd tsBot && pnpm exec tsc --noEmit && pnpm test && pnpm build && pnpm smoke
```

Erwartet: alle vier fehlerfrei. `pnpm smoke` fährt 17 Ticks; die neue Rolle läuft dort in einer leeren Welt mit, ohne zu werfen.

- [ ] **Schritt 4: Committen**

```bash
git add tsBot/src/roles/index.ts tsProd/main.js tsProd-backup
git commit -m "feat: collector in die Rollentabelle eingehaengt"
```

---

### Aufgabe 5: Dokumentation nachziehen

**Dateien:**
- Ändern: `docs/aenderungen.md`, `docs/rollen.md`, `docs/konfiguration-und-memory.md`

**Interfaces:**
- Verbraucht: die fertigen Änderungen aus den Aufgaben 1 bis 4
- Liefert: nichts für spätere Aufgaben — letzter Schritt.

- [ ] **Schritt 1: Bestehende Struktur lesen**

```bash
grep -n "^### \`" docs/rollen.md
grep -n "^## " docs/aenderungen.md | tail -5
grep -n "^## " docs/konfiguration-und-memory.md
```

Vorhandene Gliederung und Überschriftenebene übernehmen, keine neue Struktur erfinden.

- [ ] **Schritt 2: `docs/aenderungen.md`**

Eintrag im Stil der Datei — was, warum, erwartete Wirkung. Der Kern, der dort stehen muss:

```markdown
- **Neue Rolle `collector`.** Seit Plan 10 ersetzen `filler` und `hauler` den
  Heimatraum-Debitor; `Debitor.spawn` steigt in Räumen mit Storage aus
  (`debitor.ts:233`). Damit wurde `debitor.ts:106-122` dort nie mehr ausgeführt
  — die **einzige** Stelle im Bot, die Mineralien aus dem Storage ins Terminal
  bringt. Nebenwirkung: auch Tombstones, Drops und Ruinen im Heimatraum blieben
  liegen, und das Terminal bekam keine Energie mehr, ohne die
  `TerminalMarket.sell` gar nicht erst anläuft. Der `collector` übernimmt alle
  vier Aufgaben, einer je Raum mit Storage und Terminal. Erwartete Wirkung:
  Mineralien fließen wieder ab, Gefallenes wird eingesammelt, der Markt kann
  handeln.
```

- [ ] **Schritt 3: `docs/rollen.md`**

Einen Abschnitt `### \`collector\`` an der Stelle einfügen, an der die Rolle in der Spawn-Priorität steht (zwischen `defender` und `wally`), mit: Zweck, die sechs Sammelstufen samt Begründung der Reihenfolge (Verfallsgeschwindigkeit), die beiden Schwellen `TERMINAL_ENERGY_TARGET` und `TERMINAL_FREE_MIN`, und die Spawnbedingung (Storage **und** Terminal im eigenen Raum, kein Config-Schlüssel).

- [ ] **Schritt 4: `docs/konfiguration-und-memory.md`**

Zwei Punkte ergänzen: dass der Collector **keinen** Config-Schlüssel hat (abgeleitet aus Storage und Terminal, anders als `sendLinkkeeper`), und dass er `memory.container` für den Extractor-Container benutzt — denselben Schlüssel, den auch Debitor und Hauler tragen.

- [ ] **Schritt 5: Abschließende Verifikation**

```bash
cd tsBot && pnpm exec tsc --noEmit && pnpm test && pnpm build && pnpm smoke
```

- [ ] **Schritt 6: Committen**

```bash
git add docs/aenderungen.md docs/rollen.md docs/konfiguration-und-memory.md
git commit -m "docs: die Rolle collector dokumentiert"
```

---

## Abnahmekriterien des Gesamtplans

Aus der Spec übernommen; der Hauptagent prüft sie selbst nach, statt den Meldungen der Bearbeiter zu glauben.

1. Ohne Terminal oder ohne Storage im Raum wird kein Collector gespawnt. (Aufgabe 3)
2. Mit beidem und ohne lebenden Collector liefert `spawn()` `true`, mit einem lebenden `false`. (Aufgabe 3)
3. Liegt ein Tombstone und zugleich Mineral im Storage, wird der Tombstone zuerst bedient. (Aufgabe 3)
4. Eine Ressource auf `NEVER_SELL` wird nicht aus dem Storage geholt, Energie nicht über die Verkaufsstufe. (Aufgabe 3)
5. Nicht-Energie geht ins Terminal, nicht ins Storage. (Aufgabe 3, `_deliver`)
6. Unter `TERMINAL_ENERGY_TARGET` holt der Collector Energie, darüber nicht. (Aufgabe 3)
7. Unter `TERMINAL_FREE_MIN` freiem Platz liefert er nichts mehr nach. (Aufgabe 3)
8. `NEVER_SELL` steht nach Aufgabe 1 nur noch an einer Stelle — `grep -rn "XGHO2" tsBot/src` liefert genau einen Treffer.
9. `collector` steht in `roles/index.ts` zwischen `defender` und `wally`. (Aufgabe 4)
10. `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm smoke` fehlerfrei. (Aufgabe 5)
