/**
 * Prüft den Mailversand des Profilers (`src/profiler/mail.ts`): die Zerlegung
 * eines Berichts in versandfertige Blöcke (`splitForNotify`) und den Versand
 * selbst (`mailReport`), aufgezeichnet über das gestellte `Game.notify` aus
 * den Stubs.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals, notifications, resetWorld } from "./support/screeps-stubs";

/** Frisches Modul je Test: Globals stehen, bevor `mail.ts` geladen wird. */
async function mail(): Promise<typeof import("../src/profiler/mail")> {
  installGlobals();
  resetWorld();
  return import("../src/profiler/mail");
}

test("kurzer Text ergibt genau einen Block, und Game.notify wird genau einmal gerufen", async () => {
  const { splitForNotify, mailReport } = await mail();

  const blocks = splitForNotify("Alles ruhig.");
  assert.deepEqual(blocks, ["[1/1] Alles ruhig."]);

  mailReport("Bericht", "Alles ruhig.");
  assert.equal(notifications.length, 1);
});

test("kein Block ist länger als NOTIFY_MAX_CHARS, auch mit Präfix", async () => {
  const { splitForNotify, NOTIFY_MAX_CHARS } = await mail();

  const lines = Array.from({ length: 200 }, (_, index) => `Zeile ${index}: ${"x".repeat(60)}`);
  const blocks = splitForNotify(lines.join("\n"));

  assert.ok(blocks.length > 1, "der Text muss für diesen Test mehrere Blöcke ergeben");
  for (const block of blocks) {
    assert.ok(block.length <= NOTIFY_MAX_CHARS, `Block zu lang: ${block.length} Zeichen`);
  }
});

test("Zeilen werden nicht mitten durchgeschnitten", async () => {
  const { splitForNotify } = await mail();

  const lines = Array.from({ length: 300 }, (_, index) => `Zeile ${index}: ${"a".repeat(20)}`);
  const original = lines.join("\n");
  const blocks = splitForNotify(original);

  assert.ok(blocks.length > 1, "der Text muss für diesen Test mehrere Blöcke ergeben");
  const reconstructed = blocks.map(block => block.replace(/^\[\d+\/\d+\] /, "")).join("\n");
  assert.equal(reconstructed, original);
});

test("eine einzelne überlange Zeile ohne Zeilenumbruch wird trotzdem zerlegt", async () => {
  const { splitForNotify } = await mail();

  const langeZeile = "y".repeat(2345);
  const blocks = splitForNotify(langeZeile, 100);

  assert.ok(blocks.length > 1, "die Zeile muss über mehrere Blöcke verteilt werden");
  for (const block of blocks) {
    assert.ok(block.length <= 100, `Block zu lang: ${block.length} Zeichen`);
  }
});

test("leerer Text ergibt ein leeres Array, und mailReport ruft kein Game.notify", async () => {
  const { splitForNotify, mailReport } = await mail();

  assert.deepEqual(splitForNotify("   "), []);

  const meldung = mailReport("Bericht", "   ");
  assert.equal(notifications.length, 0);
  assert.ok(meldung.length > 0, "die Konsole braucht trotzdem eine Rückmeldung");
});

test("mehr als 20 Blöcke: genau 20 Nachrichten, Rückgabe benennt die Weggelassenen", async () => {
  const { splitForNotify, mailReport, NOTIFY_MAX_PER_TICK } = await mail();

  const title = "Testbericht";
  const text = Array.from({ length: 25 }, (_, index) => `Zeile${index}-${"x".repeat(900)}`).join(
    "\n",
  );
  const erwarteteBloecke = splitForNotify(`${title}\n${text}`);
  assert.ok(erwarteteBloecke.length > NOTIFY_MAX_PER_TICK, "der Text muss über 20 Blöcke ergeben");

  const meldung = mailReport(title, text);

  assert.equal(notifications.length, NOTIFY_MAX_PER_TICK);
  const weggelassen = erwarteteBloecke.length - NOTIFY_MAX_PER_TICK;
  assert.ok(meldung.includes(String(weggelassen)), `Meldung nennt nicht ${weggelassen}: ${meldung}`);
});

test("groupInterval ist 0", async () => {
  const { mailReport } = await mail();

  mailReport("Bericht", "Kurzer Text.");

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]!.groupInterval, 0);
});

test("der Titel steht im ersten Block", async () => {
  const { mailReport } = await mail();

  mailReport("MeinTitel", "Kurzer Berichtstext.");

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]!.message, "[1/1] MeinTitel\nKurzer Berichtstext.");
});
