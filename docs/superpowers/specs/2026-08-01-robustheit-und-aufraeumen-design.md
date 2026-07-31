# Robustheit und Aufräumen des TypeScript-Bots

Stand: 2026-08-01. Ausgangslage: Die TS-Migration ist abgeschlossen, der Bot
läuft live in mehreren Räumen (gemischte Reife, RCL bis 8). `prod/` ist kein
Vergleichsmaßstab mehr. Ziel dieser Runde ist **nicht** mehr Spieldurchsatz,
sondern dass der Bot nicht mehr hart ausfallen kann, plus Beseitigung von
Konfiguration und Code, die nichts tun.

Verifikation für alle Schritte: `pnpm exec tsc --noEmit` und `pnpm build`.
Kein Lauf auf lokalem Server oder PTR — so entschieden, weil alle Änderungen
entweder reine Guards sind oder eine bereits vorhandene, nie erreichte
Codepfad-Absicht erstmals wirksam machen.

## Analysegrundlage

Fünf parallele Leseanalysen über disjunkte Bereiche (Energiewirtschaft/Spawn,
CPU/Bewegung, Bau/Reparatur/Verteidigung, Upgrade/Expansion, Markt/Memory),
jede gegen die passende Datei aus `docs/knowledge/`. Jeder übernommene Befund
wurde am Code nachgeprüft. Drei Meldungen wurden dabei korrigiert:

- `claim` sei unbenutzt — falsch, `miner.ts:402` liest es. Das Feld bleibt.
- `bot.maxOrderPrice` gehöre zur Pixel-Logik — falsch, `buyPixel()` nutzt
  ausschließlich `getHistory('pixel')`. `maxOrderPrice` wird nur von der nie
  aufgerufenen `buy()` gelesen.
- Die Turm-Reparatursortierung mische nur Priorität mit absolutem Schaden —
  sie ist zusätzlich in der Schadensrichtung invertiert (siehe C1).

## A — Robustheit

### A1 · Fehlerisolation im Tick (`main.ts`)

Ist: `main.ts:81-86` loggt den Rollennamen und wirft weiter. Damit endet die
Creep-Schleife und `timer.controll()` (Zeile 89) läuft nicht mehr — Türme,
Spawncontroller, Verteidigungsscan und Tagesjobs fallen für diesen Tick
komplett aus. Ein deterministisch fehlschlagender Creep wiederholt das jeden
Tick, bis er nach bis zu 1500 Ticks stirbt.

Soll:

- Fehler pro Creep fangen, `console.log` mit Creep-Name, Rolle und
  `error.stack` (nicht nur `error`, sonst geht die Stelle verloren), dann
  `continue`.
- `timer.controll()` in jedem Fall ausführen.
- Nicht mehr weiterwerfen. Der Fehler bleibt in der Konsole sichtbar, der Tick
  wird fertig.
- Zusätzlich `Game.notify()` mit Gruppierungsintervall, damit ein Fehler nicht
  nur in der Konsole steht, sondern auch per Mail auffällt. Das Intervall ist
  der Schutz gegen die Mailflut bei Dauerfehlern: identische Meldungen werden
  von Screeps innerhalb des Intervalls zusammengefasst.
- Zusätzlich Guard für `jobs[role]`: ein Creep mit unbekannter Rolle im Memory
  (z. B. nach einer Umbenennung) führt heute zu `undefined.doJob` und damit zum
  gleichen Totalausfall. Solche Creeps werden geloggt und übersprungen —
  **nicht** suizidiert, sonst löscht eine Umbenennung im Code die ganze
  Population.

Abnahme: Sandbox-Lauf des Bundles, in dem eine Rolle wirft und ein Creep eine
unbekannte Rolle hat; `timer.controll()` muss trotzdem gelaufen sein.

### A2 · Reparierer ohne Null-Check (`roles/repairer.ts:55-69`)

Ist: `_repairPrio()` iteriert die statisch in `config.ts` verdrahteten
`prioBuildings`-IDs, holt `Game.getObjectById(buildingId)` und liest direkt
`building.hits`. Sobald eine dieser Strukturen zerstört oder abgerissen wird,
wirft die Rolle — zusammen mit A1 heute ein dauerhafter Totalausfall.

Soll: `if(!building) continue;` wie in `wally.ts:64`.

Abnahme: keine Eigenschaft mehr auf einem `getObjectById`-Ergebnis in dieser
Datei ohne vorherige Prüfung.

### A3 · Stau-Erkennung reparieren (`creep/goto.ts`)

Ist: `dontMove` wird ausschließlich in `goto.ts:54` auf `0` gesetzt — also
innerhalb des Zweigs, den der Zähler selbst erst freischalten müsste. Der erste
Hochzählversuch in Zeile 105 rechnet `undefined + 1` = `NaN`, und `NaN > 3` ist
für immer falsch. Die Stau-Behandlung war noch nie aktiv; ein blockierter Creep
befreit sich heute nur indirekt, wenn sein Pfad ausläuft und `moveByPath`
`ERR_NOT_FOUND` liefert.

Soll:

- `creep.memory.dontMove = (creep.memory.dontMove || 0) + 1;`
- Im `else`-Zweig (Position hat sich geändert) `dontMove` auf `0` zurücksetzen.
  Heute wächst der Zähler über die Lebenszeit nur an, auch wenn der Creep
  zwischendurch längst weitergelaufen ist.
- Im Stau-Zweig zusätzlich `creep.moveByPath(serializedPath)` aufrufen. Heute
  wird der neue Pfad berechnet und gespeichert, aber nicht benutzt — der Creep
  steht genau in dem Tick still, in dem die Blockade erkannt wird.
- Dabei die Hoisting-Kuriosität mitnehmen: `serializedPath` wird in Zeile 51
  zugewiesen, aber erst in Zeile 59 mit `var` deklariert.

Das ist die einzige Änderung dieser Runde, die einen bisher unerreichten
Codepfad erstmals aktiviert. Erwartete Wirkung: Ein Creep, der vier Ticks auf
derselben Kachel steht, bekommt einen Pfad mit `ignoreCreeps: false`, umgeht
also die Blockade statt gegen sie zu laufen.

Abnahme: Sandbox-Lauf, in dem sich die Position eines Creeps nicht ändert —
`dontMove` muss 1, 2, 3, 4 erreichen und im Tick danach der Neuberechnungszweig
greifen.

### A4 · Miner-Profil ohne Minimalfall (`roles/miner.ts:382-389`)

Ist: `numberOfSets = min(8, floor(energyCapacityAvailable / 450))`. Bei
`energyCapacityAvailable < 450` — RCL1 mit 300, oder RCL2 mit wenigen
Extensions — ist das `0`, und die Funktion liefert ein **leeres** Body-Array.
`creepBase.spawn` prüft mit `spawnCreep(..., {dryRun:true})`, das schlägt fehl,
und der Miner-Spawn läuft 25 Versuche à 5 Ticke ins Leere (~125 Ticks), bevor
der Notfallminer greift. `upgrader.ts:78-81` und `repairer.ts:144-147` haben
genau für diesen Fall einen Rückfall — dem Miner fehlt er.

Soll: `if(numberOfSets == 0) return [WORK,WORK,CARRY,MOVE];` — 300 Energie,
4 Energie/Tick, passt exakt in die RCL1-Kapazität und entspricht dem
Minimalprofil aus `docs/knowledge/efficiency/energy-economy.md`.

Abnahme: `_getProfil` liefert bei `energyCapacityAvailable = 300` ein nicht
leeres Body-Array, dessen Kosten 300 nicht übersteigen.

### A5 · Notfallminer blockiert seine eigene Ablösung (`roles/miner.ts:444-448`)

Ist: Der Zähl-Filter in `_spawn` schließt Notfall-Creeps nicht aus
(`debitor.ts:291` macht das korrekt — die Asymmetrie ist ein Versehen). Sobald
der 1-WORK-Notfallminer existiert, gilt `count >= 1` und ein regulär
dimensionierter Miner wird für diese Quelle nicht mehr versucht, bis die TTL
unter 150 (lokal) bzw. 300 (remote) fällt — bis zu 1350 Ticks mit 2 statt
10 Energie/Tick. Verschärfend: `notfall` wird nirgends zurückgesetzt und kein
Notfall-Creep beendet sich selbst, während `controller/spawn.ts:34-37` für die
**gesamte** Lebenszeit jedes Notfall-Creeps das Spawnen für alle Arbeitsräume
außer dem Spawnraum unterdrückt. Ein einzelner Notfallminer legt damit bis zu
1500 Ticks lang die Creep-Produktion aller Nachbarräume desselben Spawns still.

Soll:

- Zähl-Filter um `!creep.memory.notfall` ergänzen, damit ein regulärer Miner
  nachgezogen wird, sobald die Energie dafür reicht.
- Der Notfallminer beendet sich, sobald für dieselbe Quelle ein regulärer Miner
  existiert, der nicht mehr spawnt: `creep.suicide()` in `doJob`. Ohne das
  stehen zwei Miner auf einer Containerkachel, und die Sperre in `spawn.ts`
  bleibt bis zum natürlichen Tod bestehen.

Die Sperrlogik in `controller/spawn.ts` selbst bleibt unangetastet — sie ist als
"im Notfall alles auf den Heimatraum konzentrieren" plausibel; das Problem ist
allein, dass der Notfallzustand nie endet.

Abnahme: Der Zähl-Filter enthält `!creep.memory.notfall`; ein Notfallminer mit
regulärem Gegenstück für dieselbe Quelle ruft `suicide()`.

## B — Aufräumen ohne Spielrisiko

### B1 · Reparaturziel-Sortierung ist wirkungslos (`roles/repairer.ts:102-112`)

Ist: Der Tiebreak innerhalb einer Prioritätsklasse sortiert nach
`site.progress`. Dieses Feld existiert nur an `ConstructionSite`, nicht an
`Structure` — der Code ist eine Kopie aus `builder.ts:59`, wo es korrekt ist.
`b.progress - a.progress` ist damit immer `NaN`, die Reihenfolge innerhalb einer
Klasse also willkürlich statt "am stärksten beschädigt zuerst".

Soll: Nach absolutem Schaden sortieren, `hitsMax - hits`, absteigend.

### B2 · Tote Marktkonfiguration und toter Marktcode entfernen

- `StructureTerminal.prototype.buy` (`terminal-market.ts:133-179`): kein
  Aufrufer, und mit schwächerer Preislogik als `buyPixel` — bei einer künftigen
  Reaktivierung eine Falle.
- `bot.maxOrderPrice` (`config.ts:30-32`): wird ausschließlich von `buy()`
  gelesen. `buyPixel()` nutzt es nicht. Wird ersatzlos entfernt — so bleibt die
  Pixel-Obergrenze allein der Marktdurchschnitt, und es gibt kein Feld mehr, das
  eine Deckelung vorgibt, die es nicht durchsetzt.
- `bot.minSalePrice` (`config.ts:22-28`): wird nirgends gelesen. Die wirksame
  Verkaufsschwelle ist `getHistory(resource)`-Durchschnitt × 0.7 in
  `getFallbackPrice` (`terminal-market.ts:51-65`).
- Zugehörige Deklarationen in `globals.ts:78-79` und die `buy`-Deklaration in
  `types/screeps.d.ts`.
- `docs/konfiguration-und-memory.md` beschreibt `minSalePrice` bislang als
  wirksam — die Zeile muss weg.

Kein Verhaltensunterschied, da alle drei Dinge heute nichts tun. Passt zum
aktuellen Nutzungsprofil: verkaufen plus Pixel kaufen, keine Labore.

### B3 · Pfad-Visualisierung hinter ein Flag (`creep/goto.ts:80-93`)

Ist: Nach jedem `moveByPath` wird der Pfad aus dem Cache wieder
deserialisiert, der Restpfad vollständig durchsucht und pro Wegpunkt ein
`RoomVisual.circle` gezeichnet — für jeden Creep, jeden Tick, ohne Schalter.

Soll: `bot.const.showPaths` (Standard `false`) in `config.ts` ergänzen und den
ganzen Block inklusive `deserializePath` und `findIndex` dahinter legen.

### B4 · Kleinigkeiten

- `terminal-market.ts:200`: Faktor `1.1` bei Kommentar "5% über Marktavg".
  Der Kommentar wird korrigiert, der Faktor bleibt — die Preisobergrenze für
  Pixelkäufe ist eine Spielentscheidung, kein Aufräumen.
- Fünf auskommentierte Codezeilen entfernen: `goto.ts:97`, `claimer.ts:19`,
  `debitor.ts:188`, `defender.ts:19`, `wally.ts:41`.
- **Kein** flächiges `var` → `let/const` und **kein** `==` → `===`. Bei 200
  bzw. 141 Vorkommen wäre das ein Diff, in dem ein Verhaltensfehler nicht mehr
  auffällt, und `==` → `===` ist bei `null`/`undefined` nicht bedeutungsgleich.
  Modernisiert wird nur, was in den Dateien dieser Runde ohnehin angefasst wird.

## C — Verteidigung

### C1 · Türme reparieren das am wenigsten beschädigte Ziel (`controller/defence.ts:171-181`)

Ist: `score = priority * (hitsMax - hits)`, sortiert **aufsteigend**, und
`damagedStructures[0]` wird repariert. Kleinere Prioritätszahl ist besser —
insoweit richtig. Aber weil der Schaden multiplikativ eingeht und aufsteigend
sortiert wird, gewinnt innerhalb einer Prioritätsklasse das Ziel mit dem
**geringsten** Schaden. Zusätzlich ist der absolute Fehlbetrag zwischen
Strukturtypen nicht vergleichbar: ein Rampart mit 300 Mio. `hitsMax` erzeugt bei
gleichem Prozentschaden einen um Größenordnungen höheren Wert als eine Straße.

Soll: Erst nach `prio.repair` aufsteigend, bei Gleichstand nach
`1 - hits/hitsMax` absteigend — also dieselbe Regel wie im Repairer nach B1,
nur prozentual. Damit sind Creep- und Turmreparatur konsistent.

### C2 · Rampart-Reparaturpriorität (`config.ts:394-403`)

Ist: `RAMPART: 7` ist die schlechteste Priorität, schlechter als `ROAD: 6`,
während `WALL: 1` die beste hat. Ein Rampart verliert dauerhaft 300 Hits je
100 Ticks; eine Wall zerfällt laut `docs/knowledge/mechanics/structures-rcl.md`
überhaupt nicht. Die Rangfolge ist also genau verkehrt.

Soll: `RAMPART: 1`, `WALL: 2`. Wirkt nur, wenn mehrere Typen gleichzeitig unter
ihrer `prio.hits`-Schwelle liegen — bei Ramparts ist das 0.001, also erst kurz
vor dem Zerfall, weshalb die Wirkung im Alltag klein und im Belagerungsfall
relevant ist.

### C3 · Türme stellen das Feuer bei 5 HEAL-Teilen komplett ein (`controller/defence.ts:103-155`)

Ist: Existiert ein feindlicher Creep mit ≥5 `HEAL`-Teilen, greifen die Türme
**keinen** Gegner mehr an und wechseln in reaktive Strukturreparatur. Ein
Escort-Creep für 1250 Energie schaltet damit die gesamte Turmoffensive eines
Raums ab, während die begleitenden Angreifer ungestört arbeiten. Ein einzelner
Turm macht auf Reichweite ≤5 bereits 600 Schaden pro Tick, 5 HEAL-Teile heilen
maximal 60 (angrenzend) bzw. 20 (auf Distanz).

Soll: Die feste Teilezahl durch einen Vergleich ersetzen:

- Turmschaden je Ziel über alle Türme des Raums summieren, mit der offiziellen
  Abstandsformel (`TOWER_POWER_ATTACK`, `TOWER_OPTIMAL_RANGE`,
  `TOWER_FALLOFF`, `TOWER_FALLOFF_RANGE` — exakte Werte aus
  `docs/knowledge/mechanics/combat-defense.md` bzw.
  `docs/knowledge/quick-reference/constants.md`, nicht schätzen).
- Heilleistung der Gegner konservativ als 12 pro HEAL-Teil über alle
  feindlichen Creeps summieren (Boosts unberücksichtigt, also zu Gunsten des
  Gegners gerechnet).
- Ziel angreifen, wenn der Turmschaden die Heilleistung übersteigt; nur sonst in
  den Reparaturmodus wechseln. Zielauswahl bleibt wie heute der teuerste
  Gegner.

Das ist der riskanteste Punkt dieser Runde und kommt deshalb zuletzt.

## Reihenfolge und Aufteilung

Ein Commit pro Punkt, jeweils mit Zeile in `docs/aenderungen.md`. Reihenfolge:
A1 zuerst, weil es das Sicherheitsnetz für alles andere ist; C3 zuletzt.

1. A1 `main.ts` — Hauptagent (gemeinsam genutzte Datei)
2. A2 + B1 `roles/repairer.ts` — ein Subagent
3. A4 + A5 `roles/miner.ts` — ein Subagent
4. A3 + B3 + B4-Zeile `creep/goto.ts` — ein Subagent
5. C1 + C3 `controller/defence.ts` — ein Subagent
6. B2 `prototypes/terminal-market.ts` — ein Subagent; die Anteile in
   `config.ts`, `globals.ts` und `types/screeps.d.ts` macht der Hauptagent
7. C2 `config.ts` — Hauptagent
8. B4-Reste in `claimer.ts`, `debitor.ts`, `defender.ts`, `wally.ts` — ein
   Subagent
9. Doku: `aenderungen.md`, `rollen.md`, `controller-und-automatik.md`,
   `creep-grundbausteine.md`, `konfiguration-und-memory.md` — ein Subagent,
   erst nachdem der Code steht

Subagenten dürfen `main.ts`, `globals.ts`, `config.ts`, `roles/index.ts`,
`types/screeps.d.ts`, `git` und `pnpm build` nicht anfassen und beachten beim
Typecheck nur Fehler in ihrer eigenen Datei.

## Bewusst nicht in dieser Runde

- Kein Room-Planner, keine automatische Expansion (großes eigenes Projekt).
- Kein `activateSafeMode()`: Safe Mode ist eine knappe Ressource, eine falsch
  kalibrierte Schwelle verschwendet sie an harmlose Scouts. Braucht eine eigene
  Runde mit definierter Auslösebedingung.
- Keine Neudimensionierung von Miner-, Hauler- oder Upgrader-Bodies, obwohl
  belegt überdimensioniert bzw. bei RCL8 unterdimensioniert. Das ist
  Energiewirtschaft, nicht Robustheit, und gehört als eigene Runde mit
  Beobachtung im Spiel gemacht.
- Kein CPU-Bucket-Gating.
- Kein `Memory`-Abgleich von `claimed` gegen `controller.reservation`.
- `nukepos.includes(nuke.pos)` (`defence.ts:73`) vergleicht `RoomPosition`-Objekte
  per Referenz und liefert nie `true`; Folge sind Doppeleinträge in einer reinen
  Anzeigeliste bei einem extrem seltenen Ereignis.
