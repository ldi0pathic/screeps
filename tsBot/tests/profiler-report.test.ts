/**
 * Prüft `formatComparison` aus `src/profiler/report.ts` — den
 * Vorher-Nachher-Vergleich einer Grundlinie mit dem laufenden Fenster,
 * Abschnitt für Abschnitt und Rolle für Rolle.
 *
 * Die übrigen Formatierer aus `report.ts` (`formatWindowLine`,
 * `formatDetailReport`, `formatBaselines`) haben hier bewusst keinen Test —
 * das ist nicht Gegenstand dieser Datei.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals, resetWorld } from "./support/screeps-stubs";

type Baseline = import("../src/profiler/types").Baseline;
type RankedEntry = import("../src/profiler/types").RankedEntry;
type WindowMetrics = import("../src/profiler/types").WindowMetrics;

/** Baut eine Grundlinie mit sinnvollen Vorgaben, überschreibbar je Test. */
function makeBaseline(overrides: Partial<Baseline> = {}): Baseline {
  return {
    tick: 1000,
    ticks: 100,
    mode: "full",
    cpuPerTick: 10,
    cpuPerRoom: 5,
    cpuPerCreep: 1,
    bucketMean: 9000,
    rooms: 2,
    creeps: 10,
    ...overrides,
  };
}

/** Baut einen `RankedEntry`, überschreibbar je Test — nur `name` und `cpuPerTick` sind für den Vergleich relevant. */
function makeEntry(name: string, cpuPerTick: number, overrides: Partial<RankedEntry> = {}): RankedEntry {
  return {
    name,
    cpuPerTick,
    cpuPerCall: cpuPerTick,
    callsPerTick: 1,
    max: cpuPerTick,
    share: 0,
    ...overrides,
  };
}

/** Baut ein laufendes Fenster mit sinnvollen Vorgaben, überschreibbar je Test. */
function makeCurrent(overrides: Partial<WindowMetrics> = {}): WindowMetrics {
  return {
    ticks: 80,
    mode: "full",
    cpuPerTick: 10,
    cpuMaxTick: 10,
    cpuPerRoom: 5,
    cpuPerCreep: 1,
    rooms: 2,
    creeps: 10,
    bucketMean: 9000,
    bucketMin: 8500,
    limit: 20,
    tickLimit: 500,
    sections: [],
    roles: [],
    methods: [],
    creepDetail: [],
    ...overrides,
  };
}

/** Lädt `formatComparison` erst nach dem Anlegen der Globals. */
async function loadFormatComparison(): Promise<typeof import("../src/profiler/report").formatComparison> {
  installGlobals();
  resetWorld();
  const { formatComparison } = await import("../src/profiler/report");
  return formatComparison;
}

test("ein teurer gewordener Abschnitt erscheint mit positiver Differenz und Vorzeichen", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline({ sections: { "timing.tower": 1 }, roles: {} });
  const current = makeCurrent({ sections: [makeEntry("timing.tower", 1.5)] });

  const text = formatComparison("vor-umbau", baseline, current);

  assert.match(text, /timing\.tower\s+1\.00\s+1\.50\s+\+0\.50/);
});

test("ein billiger gewordener Abschnitt erscheint mit negativer Differenz", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline({ sections: { "timing.terminal": 2 }, roles: {} });
  const current = makeCurrent({ sections: [makeEntry("timing.terminal", 1.03)] });

  const text = formatComparison("vor-umbau", baseline, current);

  assert.match(text, /timing\.terminal\s+2\.00\s+1\.03\s+-0\.97/);
});

test("sortiert nach dem Betrag der Differenz absteigend, auch bei negativer Änderung", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline({
    sections: { klein: 1, gross: 5 },
    roles: {},
  });
  const current = makeCurrent({
    sections: [makeEntry("klein", 1.2), makeEntry("gross", 1)],
  });

  const text = formatComparison("vor-umbau", baseline, current);

  const sectionBlock = text.split("== Abschnitte ==")[1]!;
  const grossIndex = sectionBlock.indexOf("gross");
  const kleinIndex = sectionBlock.indexOf("klein");
  assert.ok(
    grossIndex !== -1 && kleinIndex !== -1 && grossIndex < kleinIndex,
    "der Abschnitt mit der größten Änderung (gross: -4) steht vor dem mit der kleineren (klein: +0.2)",
  );
});

test("ein nur in der Grundlinie vorhandener Abschnitt gilt als weggefallen", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline({ sections: { "timing.roads": 3 }, roles: {} });
  const current = makeCurrent({ sections: [] });

  const text = formatComparison("vor-umbau", baseline, current);

  assert.match(text, /timing\.roads\s+3\.00\s+0\.00\s+-3\.00\s+weggefallen/);
});

test("ein nur jetzt vorhandener Abschnitt gilt als neu", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline({ sections: {}, roles: {} });
  const current = makeCurrent({ sections: [makeEntry("timing.links", 0.4)] });

  const text = formatComparison("vor-umbau", baseline, current);

  assert.match(text, /timing\.links\s+0\.00\s+0\.40\s+\+0\.40\s+neu/);
});

test("eine Grundlinie ohne sections/roles erzeugt keine leere Tabelle, sondern einen Hinweis", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline();
  const current = makeCurrent({ sections: [makeEntry("timing.tower", 1)] });

  const text = formatComparison("licht-grundlinie", baseline, current);

  assert.ok(!text.includes("== Abschnitte =="), "keine leere/erfundene Abschnitte-Tabelle");
  assert.ok(!text.includes("== Rollen =="), "keine leere/erfundene Rollen-Tabelle");
  assert.match(text, /Zustand light/);
  assert.match(text, /full/);
});

test("Rollen werden genauso behandelt wie Abschnitte", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline({ sections: {}, roles: { miner: 2 } });
  const current = makeCurrent({ roles: [makeEntry("miner", 3)] });

  const text = formatComparison("vor-umbau", baseline, current);

  assert.match(text, /== Rollen ==/);
  assert.match(text, /miner\s+2\.00\s+3\.00\s+\+1\.00/);
});

test("misst das laufende Fenster keine Abschnitte, gilt die Grundlinie nicht als weggefallen", async () => {
  const formatComparison = await loadFormatComparison();
  // Grundlinie aus `full`, laufendes Fenster aus `light`: ohne Sonderfall stünde
  // jede Zeile der Grundlinie als „weggefallen" da, obwohl nur niemand misst.
  const baseline = makeBaseline({ sections: { "timing.tower": 1 }, roles: { miner: 2 } });
  const current = makeCurrent({ mode: "light", sections: [], roles: [] });

  const text = formatComparison("vor-umbau", baseline, current);

  assert.ok(!text.includes("weggefallen"), "nichts ist weggefallen, es misst nur niemand");
  assert.ok(!text.includes("== Abschnitte =="), "keine Tabelle ohne Messwerte");
  assert.match(text, /Zustand light/);
  assert.match(text, /prof\.on\(\)/);
});

test("der Kopf nennt Tick und Tickzahl der Grundlinie sowie die Tickzahl des laufenden Fensters", async () => {
  const formatComparison = await loadFormatComparison();
  const baseline = makeBaseline({ tick: 12345, ticks: 100, sections: {}, roles: {} });
  const current = makeCurrent({ ticks: 42 });

  const text = formatComparison("vor-umbau", baseline, current);
  const headLine = text.split("\n")[0]!;

  assert.match(headLine, /12345/);
  assert.match(headLine, /100/);
  assert.match(headLine, /42/);
});
