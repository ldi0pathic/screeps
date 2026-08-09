/**
 * Prüft die Rumpfprofile (`src/creep/body.ts`, `src/creep/bodies.ts`).
 *
 * Die erwarteten Rümpfe stammen aus den Formeln, die vor dem Umbau in den elf
 * Rollen standen — dieser Test ist damit die Absicherung, dass das Zusammenziehen
 * die Rümpfe nicht verändert hat. Er braucht keine gestellte Welt: ein Profil
 * liest weder `Game` noch `Memory`, es bekommt die Energie übergeben.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { installGlobals } from "./support/screeps-stubs";

type BodiesModule = typeof import("../src/creep/bodies");
type BodyModule = typeof import("../src/creep/body");

async function load(): Promise<BodiesModule & BodyModule> {
  installGlobals();
  const bodies = await import("../src/creep/bodies");
  const body = await import("../src/creep/body");
  return { ...bodies, ...body };
}

/** Energiekosten eines Rumpfs. */
function cost(body: BodyPartConstant[]): number {
  return body.reduce((total, part) => total + BODYPART_COST[part], 0);
}

/** Zählt ein Teil im Rumpf. */
function count(body: BodyPartConstant[], part: BodyPartConstant): number {
  return body.filter(entry => entry === part).length;
}

test("BodyProfile: Satzkosten, Satzzahl und Rückfall", async () => {
  const { BodyProfile } = await load();

  const profile = new BodyProfile({
    sets: [
      { part: WORK, perSet: 3 },
      { part: CARRY, perSet: 1 },
      { part: MOVE, perSet: 2 },
    ],
    maxSets: 8,
    fallback: [WORK, WORK, CARRY, MOVE],
  });

  assert.equal(profile.setCost, 450, "3 WORK + 1 CARRY + 2 MOVE");
  assert.equal(profile.setsFor(449), 0);
  assert.equal(profile.setsFor(450), 1);
  assert.equal(profile.setsFor(999), 2);
  assert.equal(profile.setsFor(1_000_000), 8, "durch maxSets begrenzt");

  assert.deepEqual(profile.build(449), [WORK, WORK, CARRY, MOVE], "Rückfall unter einem Satz");
  assert.deepEqual(profile.build(450), [WORK, WORK, WORK, CARRY, MOVE, MOVE], "Reihenfolge des Bausatzes");

  // Ein unsinniger Wert darf keinen leeren Rumpf ergeben — mit dem schlägt
  // spawnCreep grundsätzlich fehl.
  assert.deepEqual(profile.build(-100), [WORK, WORK, CARRY, MOVE]);
  assert.deepEqual(profile.build(0), [WORK, WORK, CARRY, MOVE]);
});

test("BodyProfile: gebrochene Anzahl je Satz und Obergrenze je Teil", async () => {
  const { BodyProfile } = await load();

  const halfWork = new BodyProfile({
    sets: [
      { part: WORK, perSet: 0.5 },
      { part: CARRY, perSet: 2 },
    ],
    maxSets: 9,
    fallback: [WORK, CARRY],
  });
  // 9 Sätze * 0,5 = 4,5 WORK -> abwärts auf 4.
  assert.equal(count(halfWork.build(1_000_000), WORK), 4);
  assert.equal(count(halfWork.build(1_000_000), CARRY), 18);

  const cappedCarry = new BodyProfile({
    sets: [{ part: CARRY, perSet: 2, max: 16 }],
    maxSets: 9,
    fallback: [CARRY],
  });
  assert.equal(count(cappedCarry.build(1_000_000), CARRY), 16, "Obergrenze gilt über alle Sätze");
});

test("carryMove: Paare, Mindestgröße und fehlende Angabe", async () => {
  const { carryMove } = await load();

  assert.deepEqual(carryMove(2), [CARRY, CARRY, MOVE, MOVE]);
  assert.deepEqual(carryMove(0), [CARRY, MOVE], "nie ein leerer Rumpf");
  // `Memory.rooms[...].needDebitorSize` kann fehlen; der alte Code lieferte
  // über `Array(undefined)` genau ein Paar.
  assert.deepEqual(carryMove(undefined as unknown as number), [CARRY, MOVE]);
});

test("die Rümpfe der Rollen bei voller Kapazität", async () => {
  const { BODIES } = await load();
  const rcl8 = 12_900;

  // Miner: 8 Sätze aus 3 WORK, 1 CARRY, 2 MOVE.
  const miner = BODIES.miner.build(rcl8);
  assert.deepEqual([count(miner, WORK), count(miner, CARRY), count(miner, MOVE)], [24, 8, 16]);
  assert.equal(cost(miner), 3600);

  // Builder: 7 Sätze, Repairer derselbe Bausatz mit nur 3 Sätzen.
  const builder = BODIES.builder.build(rcl8);
  assert.deepEqual([count(builder, WORK), count(builder, CARRY), count(builder, MOVE)], [21, 14, 14]);
  const repairer = BODIES.repairer.build(rcl8);
  assert.deepEqual([count(repairer, WORK), count(repairer, CARRY), count(repairer, MOVE)], [9, 6, 6]);

  // Wally: 9 Sätze aus 1 WORK, 2 CARRY, 1 MOVE.
  const wally = BODIES.wally.build(rcl8);
  assert.deepEqual([count(wally, WORK), count(wally, CARRY), count(wally, MOVE)], [9, 18, 9]);

  // Upgrader bis RCL7 gegen Upgrader ab RCL8.
  const upgrader = BODIES.upgrader.build(rcl8);
  assert.deepEqual([count(upgrader, WORK), count(upgrader, CARRY), count(upgrader, MOVE)], [16, 16, 16]);

  // Ab RCL8 nimmt der Controller 15 Energie je Tick an, und
  // UPGRADE_CONTROLLER_POWER ist 1 je WORK — der Rumpf schöpft die erlaubte
  // Rate also genau aus. Vorher standen hier [4, 18, 18]: vier WORK für eine
  // 15er-Grenze und 900 Tragfähigkeit für einen Creep, der am Controller-Link
  // steht. Siehe Plan 04.
  const upgraderRcl8 = BODIES.upgraderRcl8.build(rcl8);
  assert.deepEqual(
    [count(upgraderRcl8, WORK), count(upgraderRcl8, CARRY), count(upgraderRcl8, MOVE)],
    [15, 5, 5],
  );
  assert.ok(upgraderRcl8.length <= MAX_CREEP_SIZE, "25 Teile, die Obergrenze ist 50");

  // Extupgrader: CARRY bei 16 abgeschnitten.
  const extupgrader = BODIES.extupgrader.build(rcl8);
  assert.deepEqual(
    [count(extupgrader, WORK), count(extupgrader, CARRY), count(extupgrader, MOVE)],
    [18, 16, 9],
  );
  const extupgraderRcl6 = BODIES.extupgraderRcl6.build(rcl8);
  assert.deepEqual(
    [count(extupgraderRcl6, WORK), count(extupgraderRcl6, CARRY), count(extupgraderRcl6, MOVE)],
    [9, 16, 9],
  );

  // Träger: ein MOVE je CARRY, Transfer bis 25 Paare, Debitor ohne Container 20.
  assert.deepEqual(BODIES.transfer.build(rcl8), [
    ...Array<BodyPartConstant>(25).fill(CARRY),
    ...Array<BodyPartConstant>(25).fill(MOVE),
  ]);
  assert.equal(BODIES.transfer.build(rcl8).length, MAX_CREEP_SIZE, "genau die 50 erlaubten Teile");
  assert.equal(count(BODIES.debitor.build(rcl8), CARRY), 25);
  assert.equal(count(BODIES.debitorWithoutContainer.build(rcl8), CARRY), 20);

  // Linkkeeper: der ganze Link in einem Zug, dazu genau ein MOVE.
  const linkkeeper = BODIES.linkkeeper.build(1800);
  assert.equal(count(linkkeeper, CARRY), 16, "800 Link / 50 CARRY_CAPACITY");
  assert.equal(count(linkkeeper, MOVE), 1);
  assert.equal(cost(linkkeeper), 850);
});

test("die Rümpfe der Rollen an der unteren Grenze (300 Energie, RCL1)", async () => {
  const { BODIES, CLAIMER_BODY } = await load();
  const rcl1 = 300;

  // Kein Profil darf hier einen leeren Rumpf liefern — genau dieser Fehler ist
  // in diesem Repo schon dreimal aufgetreten (docs/aenderungen.md, A4).
  const capacityProfiles = [
    BODIES.miner,
    BODIES.builder,
    BODIES.repairer,
    BODIES.wally,
    BODIES.upgrader,
    BODIES.upgraderRcl8,
    BODIES.extupgrader,
    BODIES.extupgraderRcl6,
    BODIES.transfer,
    BODIES.debitor,
    BODIES.debitorWithoutContainer,
    BODIES.linkkeeper,
  ];

  for (const profile of capacityProfiles) {
    const body = profile.build(rcl1);
    assert.ok(body.length > 0, "leerer Rumpf");
    assert.ok(
      cost(body) <= rcl1,
      `Rumpf kostet ${cost(body)} und passt damit nicht in einen RCL1-Raum`,
    );
  }

  assert.deepEqual(BODIES.miner.build(rcl1), [WORK, WORK, CARRY, MOVE]);
  assert.deepEqual(BODIES.upgrader.build(rcl1), [WORK, CARRY, MOVE, MOVE]);
  assert.deepEqual(BODIES.transfer.build(rcl1), [
    ...Array<BodyPartConstant>(3).fill(CARRY),
    ...Array<BodyPartConstant>(3).fill(MOVE),
  ]);
  // Linkkeeper: was neben dem einen MOVE hineinpasst.
  assert.deepEqual(BODIES.linkkeeper.build(rcl1), [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE]);

  assert.deepEqual(CLAIMER_BODY, [CLAIM, CLAIM, MOVE, MOVE], "unabhängig von der Energie");
});

test("der Defender rechnet mit der vorhandenen Energie, nicht mit der Kapazität", async () => {
  const { BODIES } = await load();

  // Fünf Sätze aus TOUGH, 2 MOVE, ATTACK, RANGED_ATTACK je 340 Energie.
  const full = BODIES.defender.build(1700);
  assert.deepEqual(
    [count(full, TOUGH), count(full, MOVE), count(full, ATTACK), count(full, RANGED_ATTACK)],
    [5, 10, 5, 5],
  );
  assert.equal(cost(full), 1700);

  // Bekannte Eigenart, hier festgehalten statt geändert: der Rückfall kostet 330
  // und ist damit teurer als ein RCL1-Raum vorrätig hat. Der Spawn schlägt dann
  // fehl und wird im nächsten Tick erneut versucht.
  const fallback = BODIES.defender.build(300);
  assert.deepEqual(fallback, [MOVE, MOVE, ATTACK, RANGED_ATTACK]);
  assert.equal(cost(fallback), 330);
});

/**
 * Die Formeln, wie sie vor dem Zusammenziehen in den elf Rollen standen —
 * wörtlich übernommen, damit der Vergleich etwas wert ist. Sie sind die
 * Referenz: was hier herauskommt, muss `BODIES` auch liefern.
 */
function legacySetBody(
  energy: number,
  setCost: number,
  maxSets: number,
  fallback: BodyPartConstant[],
  parts: Array<[BodyPartConstant, number, number?]>,
): BodyPartConstant[] {
  const sets = Math.min(maxSets, Math.floor(energy / setCost));
  if (sets === 0) return fallback;

  let body: BodyPartConstant[] = [];
  for (const [part, perSet, cap] of parts) {
    const total = Math.min(Math.floor(sets * perSet), cap ?? Infinity);
    body = body.concat(Array<BodyPartConstant>(total).fill(part));
  }
  return body;
}

test("die Rümpfe sind dieselben wie vor dem Zusammenziehen", async () => {
  const { BODIES } = await load();

  const legacy: Array<{
    name: keyof typeof BODIES;
    from: number;
    body: (energy: number) => BodyPartConstant[];
  }> = [
    {
      name: "miner",
      from: 300,
      body: energy =>
        legacySetBody(energy, 450, 8, [WORK, WORK, CARRY, MOVE], [[WORK, 3], [CARRY, 1], [MOVE, 2]]),
    },
    {
      name: "builder",
      from: 300,
      body: energy =>
        legacySetBody(energy, 500, 7, [WORK, CARRY, CARRY, MOVE, MOVE], [[WORK, 3], [CARRY, 2], [MOVE, 2]]),
    },
    {
      name: "repairer",
      from: 300,
      body: energy =>
        legacySetBody(energy, 500, 3, [WORK, CARRY, CARRY, MOVE, MOVE], [[WORK, 3], [CARRY, 2], [MOVE, 2]]),
    },
    {
      name: "wally",
      from: 300,
      body: energy =>
        legacySetBody(energy, 250, 9, [WORK, CARRY, CARRY, MOVE, MOVE], [[WORK, 1], [CARRY, 2], [MOVE, 1]]),
    },
    {
      name: "upgrader",
      from: 300,
      body: energy =>
        legacySetBody(energy, 400, 8, [WORK, CARRY, MOVE, MOVE], [[WORK, 2], [CARRY, 2], [MOVE, 2]]),
    },
    // `upgraderRcl8` steht hier bewusst **nicht** mehr: sein Rumpf ist mit Plan 04
    // absichtlich vom alten Bot abgewichen (4 WORK → 15, 18 CARRY → 5, 18 MOVE →
    // 5). Die alte Formel als Referenz mitzuführen hieße, die Änderung jedes Mal
    // als Fehler zu melden. Der Sollwert steht stattdessen oben im Test
    // „die Rümpfe der Rollen bei voller Kapazität".
    {
      name: "extupgrader",
      from: 300,
      body: energy =>
        legacySetBody(energy, 350, 9, [WORK, CARRY, MOVE, MOVE], [[WORK, 2], [CARRY, 2, 16], [MOVE, 1]]),
    },
    {
      name: "extupgraderRcl6",
      from: 300,
      body: energy =>
        legacySetBody(energy, 250, 9, [WORK, CARRY, MOVE, MOVE], [[WORK, 1], [CARRY, 2, 16], [MOVE, 1]]),
    },
    {
      // Der Defender bekommt `energyAvailable` übergeben, deshalb ab 0.
      name: "defender",
      from: 0,
      body: energy =>
        legacySetBody(
          energy,
          340,
          5,
          [MOVE, MOVE, ATTACK, RANGED_ATTACK],
          [[TOUGH, 1], [MOVE, 2], [ATTACK, 1], [RANGED_ATTACK, 1]],
        ),
    },
    {
      // Träger: ab 100, weil die alte Fassung darunter ein leeres Array lieferte
      // — siehe eigener Test unten.
      name: "transfer",
      from: 100,
      body: energy => legacySetBody(energy, 100, 25, [], [[CARRY, 1], [MOVE, 1]]),
    },
    {
      name: "debitor",
      from: 100,
      body: energy => legacySetBody(energy, 100, 25, [], [[CARRY, 1], [MOVE, 1]]),
    },
    {
      name: "debitorWithoutContainer",
      from: 0,
      body: energy => {
        // Alte Fassung: min(max(trunc(cap/100), 1), 20) — also mindestens ein Paar.
        const max = Math.min(Math.max(Math.trunc(energy / 100), 1), 20);
        return [
          ...Array<BodyPartConstant>(max).fill(CARRY),
          ...Array<BodyPartConstant>(max).fill(MOVE),
        ];
      },
    },
    {
      name: "linkkeeper",
      from: 0,
      body: energy => {
        if (energy >= 850) {
          return [...Array<BodyPartConstant>(16).fill(CARRY), MOVE];
        }
        const affordable = Math.max(1, Math.floor((energy - 50) / 50));
        return [...Array<BodyPartConstant>(affordable).fill(CARRY), MOVE];
      },
    },
    {
      name: "collector",
      from: 0,
      body: energy =>
        legacySetBody(energy, 100, 10, [CARRY, MOVE], [[CARRY, 1], [MOVE, 1]]),
    },
  ];

  /**
   * Profile, die **absichtlich** von der alten Formel abweichen und deshalb
   * keine Referenz mehr haben. Die Liste ist bewusst benannt statt die Prüfung
   * unten aufzuweichen: ein neu hinzugefügtes Profil ohne Referenz soll weiter
   * auffallen, und wer hier etwas einträgt, muss es begründen können.
   */
  const deliberatelyChanged: Array<keyof typeof BODIES> = [
    // Plan 04: 4 WORK / 18 CARRY / 18 MOVE → 15 / 5 / 5. Der Controller nimmt ab
    // RCL8 fünfzehn Energie je Tick an; das alte Profil schöpfte davon 3 % aus.
    "upgraderRcl8",
  ];

  assert.equal(
    legacy.length + deliberatelyChanged.length,
    Object.keys(BODIES).length,
    "jedes Profil braucht seine Referenz oder einen Eintrag in deliberatelyChanged",
  );

  for (const name of deliberatelyChanged) {
    assert.ok(
      !legacy.some(entry => entry.name === name),
      `${name} kann nicht zugleich eine Referenz und eine bewusste Abweichung haben`,
    );
  }

  for (const { name, from, body } of legacy) {
    for (let energy = from; energy <= 12_900; energy += 50) {
      assert.deepEqual(
        BODIES[name].build(energy),
        body(energy),
        `${name} bei ${energy} Energie weicht von der alten Formel ab`,
      );
    }
  }
});

test("Träger unter 100 Energie: Rückfall statt leerem Rumpf", async () => {
  const { BODIES } = await load();

  // Bewusste Abweichung von der alten Fassung: dort ergab `Array(0).fill(CARRY)`
  // einen **leeren** Rumpf, mit dem `spawnCreep` grundsätzlich fehlschlägt.
  // Unerreichbar, weil ein Raum mit Spawn immer mindestens 300 Energie Kapazität
  // hat — aber derselbe Fehler wie in docs/aenderungen.md, A4.
  assert.deepEqual(BODIES.transfer.build(99), [CARRY, MOVE]);
  assert.deepEqual(BODIES.debitor.build(99), [CARRY, MOVE]);
});

test("über den ganzen Energiebereich: bezahlbar und höchstens 50 Teile", async () => {
  const { BODIES } = await load();

  const profiles = Object.entries(BODIES).filter(([name]) => name !== "defender");

  for (const [name, profile] of profiles) {
    for (let energy = 300; energy <= 12_900; energy += 50) {
      const body = profile.build(energy);

      assert.ok(body.length > 0, `${name} bei ${energy}: leerer Rumpf`);
      assert.ok(
        body.length <= MAX_CREEP_SIZE,
        `${name} bei ${energy}: ${body.length} Teile, erlaubt sind ${MAX_CREEP_SIZE}`,
      );
      assert.ok(
        cost(body) <= energy,
        `${name} bei ${energy}: Rumpf kostet ${cost(body)}`,
      );
    }
  }
});

test("collector: zehn Sätze CARRY+MOVE, Rückfall bei knapper Energie", async () => {
  const { BODIES } = await load();

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
