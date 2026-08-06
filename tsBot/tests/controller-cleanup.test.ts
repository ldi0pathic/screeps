/**
 * Prüft die Aufräumflagge für aufgegebene Räume (`src/controller/cleanup.ts`).
 *
 * Der wichtigste Test ist die Wahrheitstabelle aus dem Auftrag: ein Creep wird
 * suizidiert, wenn `workroom` ODER `home` nicht in `bot.room` steht — nicht
 * UND. Daneben die Flankensteuerung (nur eine Farbänderung löst aus) und dass
 * gelb wirklich nichts verändert.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOR,
  captureConsole,
  game,
  installGlobals,
  memory,
  removeFlag,
  resetWorld,
  stubFlag,
  stubRooms,
} from "./support/screeps-stubs";

/**
 * Frisches Modul je Test, Globals stehen davor: `cleanup.ts` liest
 * `COLOR_YELLOW`/`COLOR_RED` erst zur Laufzeit in `check()`, aber `../globals`
 * greift `global.room` beim Import ab.
 */
async function loadCleanup(): Promise<typeof import("../src/controller/cleanup")> {
  installGlobals();
  resetWorld();
  return import("../src/controller/cleanup");
}

/** Ein Creep, wie ihn `Memory.creeps`/`Game.creeps` im Spiel führen — nur die Felder, die `cleanup.ts` liest. */
function stubCreep(name: string, memory: Record<string, any>, suicideResult: number = OK) {
  const suicideCalls: number[] = [];
  const creep = {
    name,
    memory,
    suicide(): number {
      suicideCalls.push(1);
      return suicideResult;
    },
  };
  game().creeps[name] = creep;
  return { creep, suicideCalls };
}

/** Trägt ein verwaistes Raum-Memory ein, wie es ein entfernter Raum hinterlässt. */
function stubOrphanedRoomMemory(...names: string[]): void {
  memory().rooms ??= {};
  for (const name of names) {
    memory().rooms[name] = {};
  }
}

/**
 * Setzt die `cleanup`-Flagge. `stubFlag()` aus den (gesperrten) Stubs bringt
 * kein `remove()` mit — das hier hängt es lokal an, damit `check()` bei rot
 * `flag.remove()` rufen kann, ohne `tests/support/screeps-stubs.ts` anzufassen.
 */
function stubCleanupFlag(color: number): void {
  const flag = stubFlag(color, { name: "cleanup" }) as any;
  flag.remove = () => {
    removeFlag("cleanup");
    return OK;
  };
}

test("ohne Flagge passiert nichts, Memory.rooms bleibt unangetastet", async () => {
  const { check } = await loadCleanup();
  stubOrphanedRoomMemory("E59N4");

  const console1 = captureConsole();
  try {
    check();
    assert.equal(console1.lines.length, 0);
  } finally {
    console1.restore();
  }

  assert.ok(memory().rooms.E59N4, "verwaistes Raum-Memory darf ohne Flagge nicht angefasst werden");
});

test("gelb berichtet und aendert nichts", async () => {
  const { check } = await loadCleanup();
  stubRooms("E58N6");
  stubOrphanedRoomMemory("E59N4", "E56N2");
  const { suicideCalls } = stubCreep("miner_1", { workroom: "E59N4", home: "E58N6" });
  stubFlag(COLOR.yellow, { name: "cleanup" });

  const console1 = captureConsole();
  try {
    check();
    assert.equal(suicideCalls.length, 0, "gelb darf keinen Creep suizidieren");
    assert.ok(
      console1.lines.some(line => line.includes("E59N4") && line.includes("E56N2")),
      "die verwaisten Raeume gehoeren in den Bericht",
    );
    assert.ok(console1.lines.some(line => /Creeps davon betroffen: 1/.test(line)));
    assert.ok(console1.lines.some(line => line.includes("miner_1")));
    assert.ok(console1.lines.some(line => /Nichts geaendert/.test(line)));
  } finally {
    console1.restore();
  }

  assert.ok(memory().rooms.E59N4, "gelb loescht kein Raum-Memory");
  assert.ok(memory().rooms.E56N2, "gelb loescht kein Raum-Memory");
});

test("gelb zweimal hintereinander (gleiche Farbe) berichtet nur einmal", async () => {
  const { check } = await loadCleanup();
  stubOrphanedRoomMemory("E59N4");
  stubFlag(COLOR.yellow, { name: "cleanup" });

  const console1 = captureConsole();
  try {
    check();
    const firstRunLines = console1.lines.length;
    assert.ok(firstRunLines > 0, "der erste Aufruf muss berichten");

    check();
    assert.equal(console1.lines.length, firstRunLines, "eine stehende Flagge loest kein zweites Mal aus");
  } finally {
    console1.restore();
  }
});

test("rot loescht das verwaiste Raum-Memory, suizidiert betroffene Creeps und entfernt die Flagge", async () => {
  const { check } = await loadCleanup();
  stubRooms("E58N6");
  stubOrphanedRoomMemory("E59N4");
  const { suicideCalls } = stubCreep("miner_1", { workroom: "E59N4", home: "E58N6" });
  stubCleanupFlag(COLOR.red);

  const console1 = captureConsole();
  try {
    check();
    assert.equal(suicideCalls.length, 1, "der betroffene Creep muss suizidiert werden");
    assert.ok(console1.lines.some(line => line.includes("E59N4") && /geloescht/.test(line)));
    assert.ok(console1.lines.some(line => /1 Creeps suizidiert/.test(line)));
  } finally {
    console1.restore();
  }

  assert.equal(memory().rooms.E59N4, undefined, "rot loescht das verwaiste Raum-Memory");
  assert.equal(game().flags.cleanup, undefined, "rot entfernt die Flagge selbst");
});

test("rot laesst Creeps eines konfigurierten Raums in Ruhe", async () => {
  const { check } = await loadCleanup();
  stubRooms("E58N6");
  const { suicideCalls } = stubCreep("upgrader_1", { workroom: "E58N6", home: "E58N6" });
  stubCleanupFlag(COLOR.red);

  const console1 = captureConsole();
  try {
    check();
  } finally {
    console1.restore();
  }

  assert.equal(suicideCalls.length, 0, "ein Creep eines konfigurierten Raums bleibt am Leben");
});

test("das Kriterium: workroom ODER home nicht in bot.room, nicht UND", async () => {
  const { check } = await loadCleanup();
  stubRooms("E58N6");

  const beideWeg = stubCreep("beideWeg", { workroom: "E59N4", home: "E56N2" });
  const nurWorkroomWeg = stubCreep("nurWorkroomWeg", { workroom: "E59N4", home: "E58N6" });
  const nurHomeWeg = stubCreep("nurHomeWeg", { workroom: "E58N6", home: "E59N4" });
  const beideDa = stubCreep("beideDa", { workroom: "E58N6", home: "E58N6" });

  stubCleanupFlag(COLOR.red);

  const console1 = captureConsole();
  try {
    check();
  } finally {
    console1.restore();
  }

  assert.equal(beideWeg.suicideCalls.length, 1, "workroom und home weg: tot");
  assert.equal(nurWorkroomWeg.suicideCalls.length, 1, "nur workroom weg: tot");
  assert.equal(nurHomeWeg.suicideCalls.length, 1, "nur home weg, obwohl workroom lebt und nuetzlich waere: trotzdem tot");
  assert.equal(beideDa.suicideCalls.length, 0, "workroom und home da: lebt");
});

test("ein fehlgeschlagener suicide() wird gemeldet", async () => {
  const { check } = await loadCleanup();
  stubOrphanedRoomMemory("E59N4");
  const { suicideCalls } = stubCreep("miner_1", { workroom: "E59N4", home: "E59N4" }, ERR_BUSY);
  stubCleanupFlag(COLOR.red);

  const console1 = captureConsole();
  try {
    check();
    assert.equal(suicideCalls.length, 1);
    assert.ok(
      console1.lines.some(line => line.includes("miner_1") && line.includes(String(ERR_BUSY))),
      "ein fehlgeschlagener suicide() gehoert mit Creepnamen und Rueckgabecode in die Konsole",
    );
  } finally {
    console1.restore();
  }
});

test("eine unbelegte Farbe aendert nichts", async () => {
  const { check } = await loadCleanup();
  stubOrphanedRoomMemory("E59N4");
  const { suicideCalls } = stubCreep("miner_1", { workroom: "E59N4", home: "E59N4" });
  stubFlag(COLOR.blue, { name: "cleanup" });

  const console1 = captureConsole();
  try {
    check();
    assert.ok(console1.lines.some(line => line.includes("nicht belegt")));
  } finally {
    console1.restore();
  }

  assert.equal(suicideCalls.length, 0);
  assert.ok(memory().rooms.E59N4, "eine unbelegte Farbe darf nichts loeschen");
  assert.ok(game().flags.cleanup, "eine unbelegte Farbe entfernt die Flagge nicht");

  removeFlag("cleanup");
});
