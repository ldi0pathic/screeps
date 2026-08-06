/**
 * Prüft `controller/cpu-budget.ts` (Plan 05, Befund 4).
 *
 * Die beiden Stufenfunktionen sind eine **Ausfallsicherung, kein
 * Effizienzgewinn**: bei vollem Bucket und einem Tick weit unter dem Limit
 * darf nichts abgeschaltet werden. `mayRunLow()` verweigert nur, wenn *beide*
 * Bedingungen zutreffen (Bucket unter der Schwelle **und** der laufende Tick
 * schon über dem Limit) — eine reine Bucket-Schwelle träfe auch den Normalfall
 * nach jeder Pixelerzeugung, siehe Dateikopf von `cpu-budget.ts`.
 * `mayRunNormal()` hängt allein am Bucket, aber sehr tief.
 *
 * Modulzustand: `cpu-budget.ts` merkt sich den Tick der letzten Meldung je
 * Stufe in einer Modulvariable (`lastReport`), die über alle Tests dieser
 * Datei hinweg bestehen bleibt — `resetWorld()`/`installGlobals()` leeren nur
 * die *Welt* (`Game`, `Memory`, `cpu`-Stub), nicht dieses Modul. Deshalb setzt
 * jeder Test, der eine Drosselung prüft oder eine Meldung auslöst, `Game.time`
 * auf eine eigene, weit auseinanderliegende Basis — sonst könnte die Meldung
 * eines früheren Tests im selben Lauf die Drosselung dieses Tests auslösen.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { captureConsole, cpu, game, installGlobals } from "./support/screeps-stubs";

test("voller Bucket: beide Stufen laufen, mayRunLow() ruft dabei kein Game.cpu.getUsed() auf", async () => {
  installGlobals(); // Standard-Bucket 10000, limit 20, used 0 — siehe screeps-stubs.ts
  const { mayRunLow, mayRunNormal } = await import("../src/controller/cpu-budget");

  assert.equal(mayRunLow(), true, "voller Bucket: niedrige Stufe läuft");
  assert.equal(
    cpu.getUsedCalls,
    0,
    "der billige Pfad darf Game.cpu.getUsed() nicht aufrufen — er läuft in jedem Tick",
  );

  assert.equal(mayRunNormal(), true, "voller Bucket: normale Stufe läuft");
});

test("dünner Bucket, aber Tick im Budget: niedrige Stufe läuft trotzdem", async () => {
  installGlobals();
  cpu.bucket = 1500;
  cpu.used = 9;
  cpu.limit = 20;
  const { mayRunLow } = await import("../src/controller/cpu-budget");

  assert.equal(
    mayRunLow(),
    true,
    "das ist der gemessene Normalfall (9 von 20 CPU) — der Bucket allein darf nicht abschalten",
  );
});

test("dünner Bucket und überzogener Tick: niedrige Stufe fällt aus und meldet es", async () => {
  installGlobals();
  game().time = 100_000; // eigene Basis, siehe Kopfkommentar
  cpu.bucket = 1500;
  cpu.used = 25;
  cpu.limit = 20;
  const { mayRunLow } = await import("../src/controller/cpu-budget");

  const capturedConsole = captureConsole();
  try {
    assert.equal(mayRunLow(), false, "Bucket dünn und Tick über dem Limit: die niedrige Stufe fällt aus");
    assert.equal(capturedConsole.lines.length, 1, "der Ausfall wird gemeldet");
  } finally {
    capturedConsole.restore();
  }
});

test("die Grenze liegt bei getUsed() > limit, nicht >=", async () => {
  installGlobals();
  cpu.bucket = 1500;
  cpu.used = 20;
  cpu.limit = 20; // used === limit: noch kein Überzug
  const { mayRunLow } = await import("../src/controller/cpu-budget");

  assert.equal(mayRunLow(), true, "used gleich limit ist noch kein Überzug — die Stufe läuft noch");
});

test("Bucket unter 500: normale Stufe fällt aus, Grenze genau bei 500", async () => {
  installGlobals();
  game().time = 110_000; // eigene Basis, getrennt von den Meldungstests der niedrigen Stufe
  const { mayRunNormal } = await import("../src/controller/cpu-budget");

  cpu.bucket = 499;
  const capturedConsole = captureConsole();
  try {
    assert.equal(mayRunNormal(), false, "Bucket 499: unter der Schwelle, die normale Stufe fällt aus");
    assert.equal(capturedConsole.lines.length, 1, "der Ausfall wird gemeldet");
  } finally {
    capturedConsole.restore();
  }

  cpu.bucket = 500;
  assert.equal(mayRunNormal(), true, "Bucket genau 500: die Schwelle ist >= 500, die Stufe läuft");
});

test("die Meldung der niedrigen Stufe wird gedrosselt: zwei Ausfälle in 100 Ticks ergeben eine Zeile", async () => {
  installGlobals();
  game().time = 200_000; // eigene Basis, weit entfernt von anderen Meldungstests
  cpu.bucket = 1500;
  cpu.used = 25;
  cpu.limit = 20;
  const { mayRunLow } = await import("../src/controller/cpu-budget");

  const capturedConsole = captureConsole();
  try {
    assert.equal(mayRunLow(), false, "erster Ausfall");
    assert.equal(capturedConsole.lines.length, 1, "erste Meldung");

    game().time += 50; // innerhalb der 100-Tick-Drosselung
    assert.equal(mayRunLow(), false, "zweiter Ausfall, aber gedrosselt");
    assert.equal(capturedConsole.lines.length, 1, "keine zweite Zeile innerhalb von 100 Ticks");

    game().time += 101; // jetzt mehr als 100 Ticks seit der ersten Meldung
    assert.equal(mayRunLow(), false, "dritter Ausfall, außerhalb der Drosselung");
    assert.equal(capturedConsole.lines.length, 2, "nach mehr als 100 Ticks kommt die zweite Zeile");
  } finally {
    capturedConsole.restore();
  }
});

test("die Meldung der normalen Stufe wird unabhängig von der niedrigen gedrosselt", async () => {
  installGlobals();
  game().time = 300_000; // eigene Basis, weit entfernt von den anderen Meldungstests
  cpu.bucket = 100;
  const { mayRunNormal } = await import("../src/controller/cpu-budget");

  const capturedConsole = captureConsole();
  try {
    assert.equal(mayRunNormal(), false, "erster Ausfall");
    assert.equal(capturedConsole.lines.length, 1, "erste Meldung");

    game().time += 50; // innerhalb der 100-Tick-Drosselung
    assert.equal(mayRunNormal(), false, "zweiter Ausfall, aber gedrosselt");
    assert.equal(capturedConsole.lines.length, 1, "keine zweite Zeile innerhalb von 100 Ticks");

    game().time += 101; // jetzt mehr als 100 Ticks seit der ersten Meldung
    assert.equal(mayRunNormal(), false, "dritter Ausfall, außerhalb der Drosselung");
    assert.equal(capturedConsole.lines.length, 2, "nach mehr als 100 Ticks kommt die zweite Zeile");
  } finally {
    capturedConsole.restore();
  }
});

test("eine gedrosselte niedrige Meldung unterdrückt die Meldung der normalen Stufe nicht", async () => {
  installGlobals();
  game().time = 400_000; // eigene Basis
  // Ein Bucket, der beide Stufen gleichzeitig ausfallen lässt (< 500 und < 2000),
  // damit im selben Tick sowohl "niedrig" als auch "normal" melden.
  cpu.bucket = 100;
  cpu.used = 25;
  cpu.limit = 20;
  const { mayRunLow, mayRunNormal } = await import("../src/controller/cpu-budget");

  const capturedConsole = captureConsole();
  try {
    assert.equal(mayRunLow(), false, "niedrige Stufe fällt aus und meldet");
    assert.equal(mayRunNormal(), false, "normale Stufe fällt im selben Tick ebenfalls aus");

    assert.equal(
      capturedConsole.lines.length,
      2,
      "beide Stufen melden getrennt — die Drosselung der einen unterdrückt die andere nicht",
    );
    assert.ok(capturedConsole.lines.some(line => line.includes("niedrig")), "eine Zeile nennt die niedrige Stufe");
    assert.ok(capturedConsole.lines.some(line => line.includes("normal")), "eine Zeile nennt die normale Stufe");
  } finally {
    capturedConsole.restore();
  }
});
