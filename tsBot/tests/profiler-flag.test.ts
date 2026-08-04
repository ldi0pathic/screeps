/**
 * Prüft den Flaggen-Schalter des Profilers (`src/profiler/flag.ts`).
 *
 * Der Kern ist die Flankenauswertung: eine **stehende** Flagge darf nichts
 * auslösen, sonst überstimmte sie im nächsten Tick jeden Konsolenbefehl.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOR,
  captureConsole,
  drawnTexts,
  installGlobals,
  memory,
  removeFlag,
  resetWorld,
  setColorCalls,
  stubFlag,
} from "./support/screeps-stubs";

/**
 * Das Modul wird erst **nach** dem Anlegen der Globals geladen: `state.ts`
 * greift `Memory` beim Laden ab, und `flag.ts` baut seine Farbtabelle aus den
 * `COLOR_*`-Konstanten.
 */
let loaded: typeof import("../src/profiler/flag") | undefined;

async function flagSwitch(): Promise<typeof import("../src/profiler/flag")> {
  installGlobals();
  resetWorld();
  loaded ??= await import("../src/profiler/flag");
  return loaded;
}

test("ohne Flagge passiert nichts", async () => {
  const flag = await flagSwitch();

  assert.equal(flag.readRequest(), null);
  assert.equal(flag.describe(), null);

  flag.draw({ mode: "off", ticks: 0, cpuPerTick: 0, detailRemaining: 0 });
  assert.equal(drawnTexts.length, 0, "die Legende gehört an die Flagge, nicht in den Raum");

  // Ohne Flagge darf nichts in Memory landen: `flagColor` ist nur die Notiz
  // über eine verarbeitete Farbe.
  assert.equal(memory().profiler?.flagColor, undefined);
});

test("jede Farbe schaltet ihren Zustand, aber nur bei der Änderung", async () => {
  const flag = await flagSwitch();

  stubFlag(COLOR.grey);
  assert.equal(flag.readRequest(), "off");
  assert.equal(memory().profiler.flagColor, COLOR.grey, "verarbeitete Farbe wird gemerkt");

  // Dieselbe Farbe steht weiter — keine zweite Auslösung.
  assert.equal(flag.readRequest(), null);
  assert.equal(flag.readRequest(), null);

  stubFlag(COLOR.white);
  assert.equal(flag.readRequest(), "light");

  stubFlag(COLOR.green);
  assert.equal(flag.readRequest(), "full");

  stubFlag(COLOR.red);
  assert.equal(flag.readRequest(), "detail");
});

test("die Quittung färbt die Flagge und erzeugt keine neue Flanke", async () => {
  const flag = await flagSwitch();

  const placed = stubFlag(COLOR.red, { secondaryColor: COLOR.brown });
  assert.equal(flag.readRequest(), "detail");

  // Rückkehr aus der Detailmessung in den Zustand `light`.
  flag.acknowledge("light");
  assert.deepEqual(setColorCalls, [[COLOR.white, COLOR.brown]], "Zweitfarbe bleibt erhalten");
  assert.equal(placed.color, COLOR.white);
  assert.equal(memory().profiler.flagColor, COLOR.white);
  assert.equal(flag.readRequest(), null, "die eigene Farbänderung darf nicht zurückschlagen");

  // Gleiche Farbe noch einmal: kein zweiter Intent.
  flag.acknowledge("light");
  assert.equal(setColorCalls.length, 1);
});

test("eine unbelegte Farbe wird genau einmal gemeldet", async () => {
  const flag = await flagSwitch();
  stubFlag(COLOR.blue);

  const console1 = captureConsole();
  try {
    assert.equal(flag.readRequest(), null, "unbelegte Farbe schaltet nichts");
    assert.equal(console1.lines.length, 1);
    assert.match(console1.lines[0]!, /nicht belegt/);
    assert.match(console1.lines[0]!, /grau=aus/);

    // Zweiter Tick mit derselben Farbe: still.
    assert.equal(flag.readRequest(), null);
    assert.equal(console1.lines.length, 1);
  } finally {
    console1.restore();
  }
});

test("describe() nennt Raum, Farbe und Wirkung", async () => {
  const flag = await flagSwitch();

  stubFlag(COLOR.green, { roomName: "E58N7" });
  assert.equal(flag.describe(), "Flagge prof in E58N7: grün = full");

  stubFlag(COLOR.blue);
  assert.match(flag.describe()!, /unbelegte Farbe/);

  removeFlag();
  assert.equal(flag.describe(), null);
});

test("die Legende hebt den geltenden Zustand hervor", async () => {
  const flag = await flagSwitch();
  stubFlag(COLOR.white);

  flag.draw({ mode: "light", ticks: 42, cpuPerTick: 8.437, detailRemaining: 0 });

  assert.equal(drawnTexts.length, 6, "Kopfzeile, vier Farben, Statuszeile");
  assert.equal(drawnTexts[0]!.roomName, "E58N6");
  assert.match(drawnTexts[0]!.text, /prof: light/);

  const active = drawnTexts.filter(line => line.text.startsWith("▶"));
  assert.equal(active.length, 1, "genau eine Zeile ist die geltende");
  assert.match(active[0]!.text, /weiß = light/);

  assert.match(drawnTexts[5]!.text, /Fenster 42T/);
  assert.match(drawnTexts[5]!.text, /CPU\/Tick 8\.44/);
});

test("während der Detailmessung ist rot die geltende Zeile", async () => {
  const flag = await flagSwitch();
  stubFlag(COLOR.red);

  // Gemessen wird dabei im Zustand `full` — hervorgehoben gehört trotzdem rot,
  // sonst zeigte die Legende „full" als Dauerzustand.
  flag.draw({ mode: "full", ticks: 10, cpuPerTick: 9, detailRemaining: 31 });

  const active = drawnTexts.filter(line => line.text.startsWith("▶"));
  assert.equal(active.length, 1);
  assert.match(active[0]!.text, /rot = Detail 50T/);
  assert.match(drawnTexts[5]!.text, /Detail noch 31T/);
});

test("ein leeres Fenster nennt keine erfundene Zahl", async () => {
  const flag = await flagSwitch();
  stubFlag(COLOR.grey);

  flag.draw({ mode: "off", ticks: 0, cpuPerTick: 0, detailRemaining: 0 });
  assert.match(drawnTexts[5]!.text, /noch keine Messung/);
});

test("die Legende bleibt im Raum, auch am Rand", async () => {
  const flag = await flagSwitch();

  // Rechte Raumhälfte: der Text muss nach links kippen, sonst liefe er über den
  // Rand hinaus. Unten und oben darf er den Raum nicht verlassen.
  stubFlag(COLOR.grey, { x: 47, y: 48 });
  flag.draw({ mode: "off", ticks: 1, cpuPerTick: 1, detailRemaining: 0 });

  for (const line of drawnTexts) {
    assert.equal(line.style.align, "right", `Zeile "${line.text}" läuft nach rechts aus dem Raum`);
    assert.ok(line.x >= 0 && line.x <= 49, `x=${line.x} liegt außerhalb`);
    assert.ok(line.y >= 0 && line.y <= 49, `y=${line.y} liegt außerhalb`);
  }

  resetWorld();
  stubFlag(COLOR.grey, { x: 2, y: 0 });
  flag.draw({ mode: "off", ticks: 1, cpuPerTick: 1, detailRemaining: 0 });

  for (const line of drawnTexts) {
    assert.equal(line.style.align, "left");
    assert.ok(line.y >= 0 && line.y <= 49, `y=${line.y} liegt außerhalb`);
  }
});
