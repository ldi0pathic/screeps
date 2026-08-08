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

test("genau der Schwellenwert reicht nicht — die Bedingung ist `>`, nicht `>=`", async () => {
  const { storageIsFull, STORAGE_FULL_RATIO } = await loadStoragePressure();

  // Gegen die Konstante gerechnet statt gegen 900000/900001: eine geänderte
  // Schwelle soll den Test brechen, nicht still an ihm vorbeilaufen.
  const capacity = 1000000;
  const atRatio = capacity * STORAGE_FULL_RATIO;

  stubStorageRoom({ used: atRatio, energy: 400000, capacity });
  assert.equal(storageIsFull(ROOM), false, "genau der Belegungsgrad ist noch kein Überlauf");

  stubStorageRoom({ used: atRatio + 1, energy: 400000, capacity });
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
