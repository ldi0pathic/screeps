/**
 * Prüft Ortswechsel und Pfad-Caching (`src/creep/goto.ts`).
 *
 * Diese Tests sind **vor** dem Umbau des Moduls geschrieben und beschreiben das
 * Verhalten, wie es heute läuft: wann ein Pfad neu gesucht wird, wann der
 * gespeicherte gilt, wie der Stauzähler arbeitet und welche Rückgabecodes den
 * Pfad verwerfen. Sie sind damit die Absicherung dafür, dass der Umbau nichts
 * verändert.
 *
 * Hintergrund zu den Kosten: `docs/knowledge/efficiency/cpu-pathfinding.md`.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { drawnCircles } from "./support/screeps-stubs";
import {
  installMovement,
  moveCalls,
  movement,
  pathSearches,
  position,
  showPaths,
  straightPath,
  stubCreep,
  type CreepStub,
} from "./support/movement-stubs";

async function goto(): Promise<typeof import("../src/creep/goto")> {
  installMovement();
  return await import("../src/creep/goto");
}

/** Der Pfad, der laut Memory gespeichert ist. */
function storedPath(creep: CreepStub): string | undefined {
  return creep.memory.path;
}

test("am Ziel wird der gespeicherte Pfad verworfen", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6", {
    path: "alt",
    pathTarget: { x: 10, y: 10, roomName: "E58N6" },
    dontMove: 2,
    lastPos: { x: 9, y: 10 },
  });

  assert.equal(moveByMemory(creep as any, position(10, 10, "E58N6")), false);

  assert.equal(storedPath(creep), undefined);
  assert.equal(creep.memory.pathTarget, undefined);
  assert.equal(creep.memory.dontMove, undefined);
  assert.equal(creep.memory.lastPos, undefined);
  assert.equal(pathSearches.length, 0, "am Ziel wird nicht gesucht");
  assert.equal(moveCalls.length, 0);
});

test("ohne gespeicherten Pfad wird einmal gesucht und das Ziel gemerkt", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6");
  assert.equal(moveByMemory(creep as any, position(20, 15, "E58N6")), true);

  assert.equal(pathSearches.length, 1);
  assert.equal(pathSearches[0]!.ignoreCreeps, true, "regulär wird über Creeps hinweg gesucht");
  assert.deepEqual(pathSearches[0]!.to, { x: 20, y: 15, roomName: "E58N6" });

  assert.deepEqual(creep.memory.pathTarget, { x: 20, y: 15, roomName: "E58N6" });
  assert.equal(moveCalls.length, 1);
  assert.equal(moveCalls[0], storedPath(creep), "gelaufen wird der gespeicherte Pfad");
});

test("derselbe Zielpunkt im nächsten Tick sucht nicht erneut", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6");
  const target = position(20, 15, "E58N6");

  moveByMemory(creep as any, target);
  const pathAfterFirstTick = storedPath(creep);
  assert.equal(pathSearches.length, 1);

  // Zweiter Tick, Creep einen Schritt weiter, gleiches Ziel.
  creep.pos = position(11, 10, "E58N6");
  assert.equal(moveByMemory(creep as any, position(20, 15, "E58N6")), true);

  assert.equal(pathSearches.length, 1, "der gespeicherte Pfad gilt weiter");
  assert.equal(storedPath(creep), pathAfterFirstTick);
  assert.equal(moveCalls.length, 2);
});

test("ein anderes Ziel verwirft den gespeicherten Pfad", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6");
  moveByMemory(creep as any, position(20, 15, "E58N6"));

  movement.path = straightPath(10, 10, 3);
  moveByMemory(creep as any, position(30, 40, "E58N6"));

  assert.equal(pathSearches.length, 2);
  assert.deepEqual(creep.memory.pathTarget, { x: 30, y: 40, roomName: "E58N6" });
});

test("derselbe Punkt in einem anderen Raum gilt nicht als dasselbe Ziel", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6");
  moveByMemory(creep as any, position(25, 25, "E58N7"));
  moveByMemory(creep as any, position(25, 25, "E58N8"));

  assert.equal(pathSearches.length, 2, "der Raumname gehört zum Ziel");
  assert.equal(creep.memory.pathTarget.roomName, "E58N8");
});

test("wer steht, erhöht den Stauzähler; wer sich bewegt, setzt ihn zurück", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6");

  // Erster Tick: noch kein `lastPos`, also nur merken.
  moveByMemory(creep as any, position(20, 15, "E58N6"));
  assert.deepEqual(creep.memory.lastPos, { x: 10, y: 10 });
  assert.equal(creep.memory.dontMove, 0);

  // Zweiter Tick auf demselben Feld: Stauzähler steigt.
  moveByMemory(creep as any, position(20, 15, "E58N6"));
  assert.equal(creep.memory.dontMove, 1);
  moveByMemory(creep as any, position(20, 15, "E58N6"));
  assert.equal(creep.memory.dontMove, 2);

  // Bewegt: Zähler zurück, neue Position gemerkt.
  creep.pos = position(11, 10, "E58N6");
  moveByMemory(creep as any, position(20, 15, "E58N6"));
  assert.equal(creep.memory.dontMove, 0);
  assert.deepEqual(creep.memory.lastPos, { x: 11, y: 10 });
});

test("ab vier Ticks Stillstand wird mit Rücksicht auf Creeps neu gesucht", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6", {
    path: "alt",
    pathTarget: { x: 20, y: 15, roomName: "E58N6" },
    dontMove: 4,
    lastPos: { x: 10, y: 10 },
  });

  assert.equal(moveByMemory(creep as any, position(20, 15, "E58N6")), true);

  assert.equal(pathSearches.length, 1);
  assert.equal(
    pathSearches[0]!.ignoreCreeps,
    false,
    "nur im Stau wird um andere Creeps herum gesucht",
  );
  assert.equal(creep.memory.dontMove, 0, "der Zähler beginnt neu");
  assert.equal(moveCalls.length, 1);
  assert.notEqual(storedPath(creep), "alt");
});

test("ERR_NOT_FOUND und Co. verwerfen den Pfad, brechen aber den Tick ab", async () => {
  const { moveByMemory } = await goto();

  for (const code of [ERR_INVALID_ARGS, ERR_NO_BODYPART, ERR_NOT_FOUND]) {
    installMovement();
    movement.moveResult = code;

    const creep = stubCreep(10, 10, "E58N6", { dontMove: 2, lastPos: { x: 10, y: 10 } });
    assert.equal(moveByMemory(creep as any, position(20, 15, "E58N6")), true, `Code ${code}`);

    assert.equal(storedPath(creep), undefined, `Code ${code}: Pfad bleibt stehen`);
    assert.equal(creep.memory.pathTarget, undefined);
    assert.equal(creep.memory.dontMove, undefined);
    assert.equal(creep.memory.lastPos, undefined);
  }
});

test("ein unerwarteter Rückgabecode meldet keinen Ortswechsel", async () => {
  const { moveByMemory } = await goto();
  movement.moveResult = ERR_BUSY;

  const creep = stubCreep(10, 10, "E58N6");
  assert.equal(moveByMemory(creep as any, position(20, 15, "E58N6")), false);

  // Der Pfad bleibt erhalten: es war kein Fehler am Pfad.
  assert.notEqual(storedPath(creep), undefined);
});

test("ERR_TIRED zählt wie ein regulärer Schritt", async () => {
  const { moveByMemory } = await goto();
  movement.moveResult = ERR_TIRED;

  const creep = stubCreep(10, 10, "E58N6");
  assert.equal(moveByMemory(creep as any, position(20, 15, "E58N6")), true);
  assert.deepEqual(creep.memory.lastPos, { x: 10, y: 10 });
});

test("showPaths zeichnet nur die noch offenen Schritte", async () => {
  const { moveByMemory } = await goto();

  movement.path = straightPath(10, 10, 5); // Schritte auf x = 11..15
  showPaths(true);

  // Der Creep steht auf dem zweiten Schritt des Pfads.
  const creep = stubCreep(12, 10, "E58N6");
  moveByMemory(creep as any, position(20, 10, "E58N6"));

  assert.deepEqual(
    drawnCircles.map(circle => circle.x),
    [13, 14, 15],
    "gezeichnet wird ab dem Feld hinter dem Creep",
  );

  // Steht der Creep nicht auf dem Pfad, wird nichts gezeichnet.
  drawnCircles.length = 0;
  const elsewhere = stubCreep(40, 40, "E58N6");
  moveByMemory(elsewhere as any, position(20, 10, "E58N6"));
  assert.equal(drawnCircles.length, 0);
});

test("ohne showPaths wird nicht gezeichnet", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(12, 10, "E58N6");
  moveByMemory(creep as any, position(20, 10, "E58N6"));
  assert.equal(drawnCircles.length, 0);
});

test("goToWorkroom, goToMyHome und goToRoomFlag greifen nur, wenn sie zuständig sind", async () => {
  const { goToWorkroom, goToMyHome, goToRoomFlag } = await goto();

  // Im Arbeitsraum ist nichts zu tun.
  const atWork = stubCreep(10, 10, "E58N6", { workroom: "E58N6", home: "E58N6" });
  assert.equal(goToWorkroom(atWork as any), false);
  assert.equal(goToMyHome(atWork as any), false);
  assert.equal(pathSearches.length, 0);

  // Anderer Raum: Ziel ist die Raummitte.
  const away = stubCreep(10, 10, "E58N7", { workroom: "E58N6", home: "E58N9" });
  assert.equal(goToWorkroom(away as any), true);
  assert.deepEqual(pathSearches[0]!.to, { x: 25, y: 25, roomName: "E58N6" });
  assert.equal(pathSearches[0]!.range, 0, "die Raummitte ist betretbar");

  installMovement();
  const goingHome = stubCreep(10, 10, "E58N7", { workroom: "E58N6", home: "E58N9" });
  assert.equal(goToMyHome(goingHome as any), true);
  assert.deepEqual(pathSearches[0]!.to, { x: 25, y: 25, roomName: "E58N9" });
  assert.equal(pathSearches[0]!.range, 0, "die Raummitte ist betretbar");

  // Raumflagge: nur außerhalb des Heimatraums und nur, wenn sie weiter als 2 Felder weg ist.
  installMovement();
  const flag = { pos: position(30, 30, "E58N6") };
  const nearFlag = stubCreep(29, 30, "E58N6", { workroom: "E58N6", home: "E58N9" }, [flag]);
  assert.equal(goToRoomFlag(nearFlag as any), false, "in Reichweite wird nicht gelaufen");

  const farFromFlag = stubCreep(10, 10, "E58N6", { workroom: "E58N6", home: "E58N9" }, [flag]);
  assert.equal(goToRoomFlag(farFromFlag as any), true);
  assert.deepEqual(pathSearches[0]!.to, { x: 30, y: 30, roomName: "E58N6" });
  assert.equal(pathSearches[0]!.range, 0, "die Flaggenposition ist betretbar");

  // Im Heimatraum ist die Flagge uninteressant.
  installMovement();
  const homeCreep = stubCreep(10, 10, "E58N9", { workroom: "E58N9", home: "E58N9" }, [flag]);
  assert.equal(goToRoomFlag(homeCreep as any), false);
  assert.equal(pathSearches.length, 0);
});

test("ohne Reichweite wird bis auf das Feld selbst gesucht", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6");
  // Vorgabe ist 0: betretbare Ziele (Container, Standplätze) müssen erreicht
  // werden, und `roles/linkkeeper.ts` sowie `roles/miner.ts` prüfen die Ankunft
  // mit `creep.pos.isEqualTo(...)` — das setzt eine Suche mit `range: 0` voraus.
  moveByMemory(creep as any, position(20, 15, "E58N6"));

  assert.equal(pathSearches[0]!.range, 0);
});

test("eine übergebene Reichweite kommt an der Suche an", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6");
  moveByMemory(creep as any, position(20, 15, "E58N6"), 1);

  assert.equal(pathSearches[0]!.range, 1);
});

test("der Stau-Zweig sucht mit derselben Reichweite wie die reguläre Suche", async () => {
  const { moveByMemory } = await goto();

  const creep = stubCreep(10, 10, "E58N6", {
    path: "alt",
    pathTarget: { x: 20, y: 15, roomName: "E58N6" },
    dontMove: 4,
    lastPos: { x: 10, y: 10 },
  });

  moveByMemory(creep as any, position(20, 15, "E58N6"), 1);

  assert.equal(pathSearches.length, 1);
  // Der Stau-Zweig speichert seinen Weg mit `rememberPath()` unter dem alten
  // `pathTarget`. Suchte er mit einer anderen Reichweite als die reguläre
  // Suche, läge im Cache ein Weg zu einem anderen Endpunkt als der, den der
  // nächste Tick unter demselben `pathTarget` erwartet.
  assert.equal(pathSearches[0]!.ignoreCreeps, false);
  assert.equal(pathSearches[0]!.range, 1);
});
