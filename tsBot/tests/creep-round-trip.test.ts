/**
 * Prüft `src/creep/round-trip.ts` (Klasse `RoundTrip`, Plan 03
 * `docs/plans/03-durchsatz-und-bodies.md`, Vorgehen Punkt 3): die gemessene
 * Umlaufdimensionierung, herausgelöst aus `Debitor.bodyFor`, ohne
 * Verhaltensänderung — siehe auch `docs/knowledge/efficiency/energy-economy.md`,
 * Abschnitt „Carry Throughput".
 *
 * Die Tests nageln bewusst die Eigenarten der übernommenen Arithmetik fest,
 * nicht nur den Normalfall — sonst fiele ein künftiges „das begradige ich mal"
 * nicht auf:
 *
 * - der „Median" ist `sortiert[ceil(länge * 0.5)]`, kein echter Median;
 * - bei einer einzelnen Messung liegt der Index außerhalb des Arrays, das
 *   Ergebnis ist `NaN` (abgefangen vom Aufrufer, `carryMove` in `debitor.ts`);
 * - `sort` verändert die Messreihe im Memory an Ort und Stelle;
 * - festgeschrieben wird ab einem Medianindex über 30, nicht ab mehr als
 *   30 Messwerten — das entspricht rund 61 rohen Messungen, nicht 31.
 *
 * `Memory.rooms[<raum>]` legt jeder Test selbst an (wie
 * `tests/controller-room-inventory.test.ts` und `tests/roles-hauler.test.ts`) —
 * im laufenden Bot übernimmt das `controller/memory.ts::init()` jeden Tick.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals, memory } from "./support/screeps-stubs";

const ROOM = "E58N6";

const KEYS = { samples: "distances", size: "needDebitorSize", count: "needDebitors" };

async function loadRoundTrip(): Promise<{ RoundTrip: typeof import("../src/creep/round-trip").RoundTrip }> {
  installGlobals();
  memory().rooms = { [ROOM]: {} };
  const mod = await import("../src/creep/round-trip");
  return { RoundTrip: mod.RoundTrip };
}

// --- record ----------------------------------------------------------------

test("record: sammelt Messwerte, solange die Größe nicht feststeht", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);

  assert.equal(roundTrip.record(10), true);
  assert.equal(roundTrip.record(20), true);

  assert.deepEqual(memory().rooms[ROOM][KEYS.samples], [10, 20]);
});

test("record: sobald die Größe festgeschrieben ist, wird nichts mehr aufgenommen", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);

  roundTrip.record(10);
  // Festschreibung von außen simuliert, wie es carryFor am Ende der Messphase tut.
  memory().rooms[ROOM][KEYS.size] = 13;

  assert.equal(roundTrip.record(20), false);
  assert.deepEqual(
    memory().rooms[ROOM][KEYS.samples],
    [10],
    "die bereits festgeschriebene Größe verhindert weitere Aufnahmen",
  );
});

test("record: eine Strecke von 0 oder weniger wird nicht gespeichert", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);

  assert.equal(roundTrip.record(0), false);
  assert.equal(roundTrip.record(-5), false);
  assert.equal(memory().rooms[ROOM][KEYS.samples], undefined);
});

// --- carryFor: die Ableitung selbst -----------------------------------------

test("carryFor: die gewünschte Tragfähigkeit passt in einen Creep", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  // Handrechnung: n=3, Index = ceil(3*0.5) = 2, sortiert [10,20,30][2] = 30.
  // carry = ceil(2*30/5) = ceil(12) = 12. maxSetsForEnergy(20) >= 12 -> ein Creep.
  room[KEYS.samples] = [30, 10, 20];

  const carry = roundTrip.carryFor(20);

  assert.equal(carry, 12);
  assert.equal(room[KEYS.count], 1);
  assert.equal(room[KEYS.size], undefined, "unter 31 Messwerten (Index <= 30) wird nichts festgeschrieben");
});

test("carryFor: passt die Tragfähigkeit nicht in einen Creep, werden mehrere kleinere gespawnt", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  // Handrechnung: n=3, Index=2, sortiert [100,200,300][2] = 300.
  // carry = ceil(2*300/5) = 120. maxSetsForEnergy(20) < 120, also mehrere Creeps:
  // count = ceil(120/20) = 6, carry = ceil(120/6) = 20.
  room[KEYS.samples] = [300, 100, 200];

  const carry = roundTrip.carryFor(20);

  assert.equal(carry, 20);
  assert.equal(room[KEYS.count], 6);
});

test("carryFor: der 'Median' ist der obere Mittelwert bei gerader Länge, kein echter Median", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  // n=4, Index = ceil(4*0.5) = 2, sortiert [10,20,30,40][2] = 30 (oberer der
  // beiden mittleren Werte 20/30). Ein echter Median wäre (20+30)/2 = 25 und
  // ergäbe carry = ceil(2*25/5) = 10 — der Code liefert stattdessen 12. Das ist
  // die bestehende Arithmetik aus `Debitor.bodyFor` und soll nicht begradigt
  // werden (siehe Kopfkommentar von `src/creep/round-trip.ts`).
  room[KEYS.samples] = [10, 20, 30, 40];

  const carry = roundTrip.carryFor(100);

  assert.equal(carry, 12, "sortiert[2] = 30, nicht der echte Median 25");
});

test("carryFor: eine einzelne Messung liefert NaN — abgefangen von carryMove in debitor.ts", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  // n=1, Index = ceil(1*0.5) = 1 — außerhalb des einelementigen Arrays.
  // sortiert[1] ist undefined, die Ableitung rechnet NaN weiter durch.
  room[KEYS.samples] = [50];

  const carry = roundTrip.carryFor(20);

  assert.ok(Number.isNaN(carry), "der Grenzfall einer einzigen Messung ist bewusst NaN, kein Wurf");
  assert.equal(room[KEYS.size], undefined, "NaN ist nie > 30, also wird trotz des Grenzfalls nichts festgeschrieben");
});

// --- carryFor: Festschreibung genau am Umschlagpunkt ------------------------

/** n aufsteigende Distanzen 1..n, in absteigender Reihenfolge — damit macht das Sortieren etwas sichtbares. */
function descendingDistances(n: number): number[] {
  const values: number[] = [];
  for (let i = n; i >= 1; i--) values.push(i);
  return values;
}

test("carryFor: bei 60 rohen Messungen (Medianindex 30) wird noch NICHT festgeschrieben", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  // Index = ceil(60*0.5) = 30, die Bedingung ist `> 30` — trifft hier noch nicht zu.
  // Das ist die Überraschung an dieser Stelle: 30 ist der Index, nicht die Rohzahl,
  // deshalb liegt der tatsächliche Umschlagpunkt bei 61 Messungen, nicht bei 31 —
  // bewusst wörtlich aus `Debitor.bodyFor` übernommen, nicht begradigt.
  room[KEYS.samples] = descendingDistances(60);

  const carry = roundTrip.carryFor(20);

  assert.equal(carry, 13, "sortiert[30] ist der 31.-kleinste Wert = 31; ceil(2*31/5) = 13");
  assert.equal(room[KEYS.size], undefined, "Index 30 ist nicht > 30 — keine Festschreibung");
  assert.ok(Array.isArray(room[KEYS.samples]), "die Messreihe bleibt erhalten, solange nicht festgeschrieben wird");
});

test("carryFor: bei 61 rohen Messungen (Medianindex 31) wird festgeschrieben", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  // Index = ceil(61*0.5) = 31 > 30 — genau ein Wert mehr als im vorigen Test
  // kippt die Festschreibung. Rund 61 Messungen, wie im Auftrag beschrieben.
  room[KEYS.samples] = descendingDistances(61);

  const carry = roundTrip.carryFor(20);

  assert.equal(carry, 13, "sortiert[31] ist der 32.-kleinste Wert = 32; ceil(2*32/5) = ceil(12.8) = 13");
  assert.equal(room[KEYS.size], 13, "ab Index > 30 wird die Größe festgeschrieben");
  assert.equal(room[KEYS.samples], undefined, "die Messreihe wird beim Festschreiben verworfen");
  assert.equal(roundTrip.size, 13);
});

test("carryFor: nach der Festschreibung wird nicht mehr neu gerechnet, sondern nur der gespeicherte Wert gelesen", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  room[KEYS.samples] = descendingDistances(61);
  const first = roundTrip.carryFor(20);
  assert.equal(first, 13);
  assert.equal(room[KEYS.samples], undefined, "Vorbedingung: die Messreihe ist bereits verworfen");

  // Ein völlig anderer maxSetsForEnergy-Wert und keine Messreihe mehr — trotzdem
  // liefert carryFor unverändert den festgeschriebenen Wert, ohne neu zu rechnen.
  const second = roundTrip.carryFor(1);

  assert.equal(second, 13, "die Festschreibung gewinnt, maxSetsForEnergy wird danach ignoriert");
});

test("record: nach der Festschreibung liefert isFixed intern true — record nimmt nichts mehr auf", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  room[KEYS.samples] = descendingDistances(61);
  roundTrip.carryFor(20);

  assert.equal(roundTrip.record(999), false, "nach der Festschreibung nimmt record keine Messwerte mehr auf");
});

// --- Eigenständigkeit der Schlüssel ------------------------------------------

test("zwei Instanzen mit verschiedenen Schlüsselnamen auf demselben Raum stören sich nicht", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const room = memory().rooms[ROOM];

  const debitorKeys = { samples: "distances", size: "needDebitorSize", count: "needDebitors" };
  const transferKeys = { samples: "transferDistances", size: "needTransferSize", count: "needTransfers" };

  const debitorRoundTrip = new RoundTrip(ROOM, debitorKeys);
  const transferRoundTrip = new RoundTrip(ROOM, transferKeys);

  debitorRoundTrip.record(10);
  transferRoundTrip.record(999);

  assert.deepEqual(room[debitorKeys.samples], [10]);
  assert.deepEqual(room[transferKeys.samples], [999]);

  // Die Festschreibung des einen Nutzers greift nicht in die Messreihe des anderen.
  room[debitorKeys.samples] = descendingDistances(61);
  debitorRoundTrip.carryFor(20);

  assert.equal(room[debitorKeys.size], 13);
  assert.equal(room[transferKeys.size], undefined, "der zweite Nutzer bleibt von der Festschreibung des ersten unberührt");
  assert.deepEqual(room[transferKeys.samples], [999], "und behält seine eigene, unangetastete Messreihe");
});

// --- Sortieren verändert die Messreihe im Memory an Ort und Stelle ----------

test("carryFor: sort() verändert die Messreihe im Memory an Ort und Stelle (bestehendes Verhalten, nicht kopieren)", async () => {
  const { RoundTrip } = await loadRoundTrip();
  const roundTrip = new RoundTrip(ROOM, KEYS);
  const room = memory().rooms[ROOM];

  const rawSamples = [30, 10, 20];
  room[KEYS.samples] = rawSamples;

  // Nicht festgeschrieben (Index 2 <= 30), die Messreihe bleibt im Memory stehen —
  // aber dasselbe Array-Objekt, jetzt aufsteigend sortiert.
  roundTrip.carryFor(100);

  assert.equal(room[KEYS.samples], rawSamples, "dieselbe Array-Referenz, nicht kopiert");
  assert.deepEqual(rawSamples, [10, 20, 30], "sort() hat das Ausgangsarray in place verändert");
});
