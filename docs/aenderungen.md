# Änderungen am TypeScript-Bot

Der TypeScript-Bot in `tsBot/src/` wurde zunächst wortgleich aus dem alten
JavaScript-Bot in `prod/` übertragen — inklusive der dortigen Fehler. Direkt
danach wurden die hier aufgelisteten Fehler behoben.

`prod/` ist ab jetzt **nur noch Historie**: nichts muss mehr damit
übereinstimmen, und Verbesserungen am TypeScript-Bot brauchen keine
Rechtfertigung gegenüber dem alten Stand. Der Ordner bleibt liegen, um bei
Fragen nachschauen zu können, wie etwas ursprünglich gedacht war.

Diese Datei ist das Änderungsprotokoll: Jede Änderung, die das Spielverhalten
betrifft, gehört hier mit einer Zeile hinein — was, warum, und welche Wirkung
erwartet wird. Das ersetzt die Detektivarbeit, wenn sich der Bot nach einem
Deployment anders verhält als gedacht.

## Nach der Migration behobene Fehler

| Modul / Funktion | prod-Stelle | Was war falsch | Änderung |
| --- | --- | --- | --- |
| `creep/base.ts` · `upgradeController` | `creep.base.js:401` | `if (!controller && !controller.my)` — bei einem Raum **ohne** Controller ist der linke Teil wahr, der rechte greift dann auf `undefined.my` zu und wirft einen `TypeError`. Der Guard schützte also genau den Fall nicht, für den er gedacht war. | `&&` → `||` |
| `roles/debitor.ts` · `doJob` | `creep.debitor.js:122` | `creep.memory.mineral = resource[0]` speicherte nur das **erste Zeichen** des Ressourcennamens (`"X"` statt `"XKH2O"`). Der nachfolgende Transport nutzte dagegen den vollen Namen. | `resource[0]` → `resource` |
| `roles/claimer.ts` · `spawn` | `creep.claimer.js:66` | Operator-Vorrang: bei einem Controller ohne Signatur wurde `room.controller.sign.username` trotzdem ausgewertet → `TypeError`. Zusätzlich verglich `spawn.owner != ''` ein Objekt mit einem String und war immer wahr. | `sign` einmal vorab geprüft, toter Vergleich entfernt |
| `roles/claimer.ts` · `doJob` | `creep.claimer.js:29` | Der Claim-Zweig schrieb `Memory.rooms[creep.room.name].claimed`, der Reservierungs-Zweig `Memory.rooms[workroom].claimed` — zwei Schlüssel für denselben Sachverhalt. | einheitlich `workroom` |
| `roles/repairer.ts` · `spawn` | `creep.reparier.js:150` | `Game.rooms[workroom].find(...)` ohne Sichtprüfung. Ohne Sicht im Arbeitsraum wirft das eine Exception im Spawncontroller und bricht den **kompletten** Spawn-Durchlauf des Ticks ab. | Guard: ohne Sicht `return false` |
| `roles/upgrader.ts` · `spawn` | `creep.upgrader.js:85` | `spawn.room.storage.store` ohne Existenzprüfung. | Storage-Prüfung vorangestellt |
| `roles/defender.ts` · `_defend` | `creep.defender.js:113-120` | Die Auswahl des Abriss-Raums prüfte `destroyDone` des **aktuellen** Workrooms statt des Kandidatenraums und hatte kein `break` — dadurch gewann immer der letzte konfigurierte `destroy`-Raum. Mit zwei solchen Räumen (E58N4, E58N5) wurde E58N4 nie abgearbeitet. | Kandidatenraum prüfen, erster offener Raum gewinnt, `break` |
| `roles/builder.ts` · `doJob` | `creep.builder.js:29` | `harvestSpawnLink(creep, creep.memory.mineral)` war wirkungslos: Builder erhalten beim Spawnen kein `mineral` im Memory, `store[undefined]` ist immer `undefined`. | `RESOURCE_ENERGY` — Builder nutzen den Spawn-Link jetzt tatsächlich |

## Entfernter toter Code

| Modul | prod-Stelle | Begründung |
| --- | --- | --- |
| `prototypes/creep-checks.ts` · `checkSource` | `prototype.creep.checks.js:129` | Leerer Rumpf, wird nirgends aufgerufen. |
| `prototypes/creep-checks.ts` · `checkSavedAction` | `prototype.creep.checks.js:134` | Greift auf `this.creep` zu, das an einem `Creep` nicht existiert — der Aufruf würde werfen. Wird nirgends aufgerufen. |

Die zugehörigen Deklarationen in `src/types/screeps.d.ts` sind ebenfalls
entfallen.

## Irreführend, aber verhaltensneutral bereinigt

`creepBase.harvest()` hat keinen Rückgabewert. In `builder`, `repairer` und
`wally` stand der Aufruf trotzdem in einer `if`-Bedingung
(`if(creepBase.harvest(creep)) return;`), die deshalb nie zutraf. Der Aufruf
steht jetzt für sich; das Laufzeitverhalten ist unverändert.

Wichtig für den Builder: weil die Bedingung nie zutraf, läuft der Code **nach**
dem Aufruf immer — der Umschalter auf „arbeiten“ bei mehr als halb gefülltem
Inventar und der Spawn-Link-Zugriff. Das bleibt so.

## Offen, weil bewusst zurückgestellt

- `roles/upgrader.ts` · `_getProfil`: bei RCL > 7 und sehr kleinem
  `energyCapacityAvailable` entstünden 0 `WORK`-Teile. Praktisch unerreichbar,
  weil RCL 8 eine hohe Energiekapazität voraussetzt.
- `roles/miner.ts`: `targetLinks[[Math.floor(...)]]` indiziert mit einem Array
  statt einer Zahl. Funktioniert wegen der String-Umwandlung des Schlüssels
  korrekt.
- `controller/memory.ts` · `init`: `Memory.init = true` wird innerhalb der
  Schleife über `global.room` gesetzt. Bei leerer Raumkonfiguration würde die
  Initialisierung jeden Tick erneut laufen — `global.room` ist nie leer.
- Konfigurationsfelder `walls` und `debitorProSource` werden von keinem Modul
  gelesen. Sie bleiben als Dokumentation der Absicht stehen.

## Runde 2026-08-01: Robustheit und Aufräumen

Fokus dieser Runde: der Bot darf nicht mehr hart ausfallen, dazu Entfernen von
Konfiguration und Code, die nichts bewirken. Details und Analysegrundlage in
`docs/superpowers/specs/2026-08-01-robustheit-und-aufraeumen-design.md`.

### Fehlerisolation

| Modul / Funktion | Was war falsch | Änderung | Wirkung |
| --- | --- | --- | --- |
| `main.ts` · `loop` | Ein Fehler in einer Rolle wurde geloggt und weitergeworfen; damit endete die Creep-Schleife und `timer.controll()` (Türme, Spawncontroller, Verteidigungsscan, Tagesjobs) lief für den Rest des Ticks nicht mehr. Ein deterministisch fehlschlagender Creep wiederholte das bis zu 1500 Ticks lang, bis er starb. | Fehler pro Creep fangen und überspringen (`continue`), `timer.controll()` selbst ebenfalls in `try`/`catch`. Ein Creep mit einer im Code nicht mehr existierenden Rolle (z. B. nach einer Umbenennung) wird gemeldet und übersprungen, **nicht** suizidiert. Meldung geht bei jedem Auftreten in die Konsole, zusätzlich einmalig je Fehlerart bis zum nächsten Global-Reset per `Game.notify` als Mail. | Ein defekter Creep oder eine unbekannte Rolle legt nicht mehr den ganzen Tick lahm; Türme und Spawncontroller laufen immer. |
| `roles/repairer.ts` · `_repairPrio` | Griff ohne Prüfung auf `Game.getObjectById(...).hits` zu; die IDs stammen aus der statischen Liste `prioBuildings` in `config.ts`. Wurde eine dieser Strukturen zerstört, warf die Rolle jeden Tick — zusammen mit dem alten `main.ts`-Verhalten ein dauerhafter Totalausfall. | `if(!building) continue;`, analog zu `wally.ts`. | Eine zerstörte `prioBuildings`-Struktur blockiert den Repairer nicht mehr. |
| `roles/repairer.ts` · `_repair` | Die Sortierung der Reparaturziele nutzte `site.progress` — eine Kopie aus `builder.ts`, wo das Feld existiert. An `Structure` gibt es `progress` nicht, der Tiebreak war also immer `NaN` und die Reihenfolge innerhalb einer Prioritätsklasse willkürlich. | Bei gleicher Priorität wird jetzt nach absolutem Schaden (`hitsMax - hits`) absteigend sortiert. | Innerhalb einer Prioritätsklasse wird zuerst die am stärksten beschädigte Struktur repariert. |
| `roles/miner.ts` · `_getProfil` | Bei Raum-Energiekapazität unter 450 (RCL1, oder ein Raum, der nach einem Angriff darunter fällt) lieferte die Funktion ein leeres Body-Array; `spawnCreep` schlägt damit grundsätzlich fehl. Der Miner-Spawn lief rund 125 Ticks ins Leere, bevor der Notfallminer griff. | Rückfall auf `[WORK,WORK,CARRY,MOVE]` für genau 300 Energie, wie bei `upgrader` und `repairer` bereits vorhanden. | Miner können auch bei sehr niedriger Energiekapazität sofort regulär spawnen. |
| `roles/miner.ts` · `_spawn` / `doJob` | Der Zähl-Filter schloss Notfall-Creeps nicht aus (anders als `debitor.ts`); ein 1-WORK-Notfallminer galt bis zu 1350 Ticks als versorgte Quelle. Zusätzlich unterdrückt `controller/spawn.ts` das Spawnen für alle Arbeitsräume außer dem Spawnraum, solange ein Notfall-Creep lebt, und `notfall` wurde nie zurückgesetzt. | Notfallminer zählen im Filter nicht mehr als regulärer Miner (`!creep.memory.notfall`); der Notfallminer beendet sich selbst (`suicide()`), sobald für dieselbe Quelle ein fertiger regulärer Miner existiert. | Ein Notfallminer blockiert nicht mehr bis zu 1500 Ticks lang die Creep-Produktion der Nachbarräume desselben Spawns. |
| `creep/goto.ts` · `moveByMemory` | `dontMove` wurde nur innerhalb des Zweigs auf `0` gesetzt, den der Zähler selbst erst freischalten müsste; das Hochzählen ergab deshalb `undefined + 1` = `NaN`, die Schwelle `> 3` wurde nie erreicht. Die Stau-Erkennung war folglich noch nie aktiv. | Zähler startet bei `0` und zählt korrekt hoch, wird zurückgesetzt, sobald sich der Creep bewegt hat. Der Stau-Zweig ruft jetzt zusätzlich `moveByPath` mit dem neu berechneten Pfad auf, statt ihn ungenutzt zu lassen. | Ein Creep, der vier Ticks auf derselben Kachel steht, bekommt einen Pfad, der andere Creeps berücksichtigt, statt weiter gegen die Blockade zu laufen. |
| `controller/defence.ts` · `tower` (Reparatur) | `score = priorität * schaden`, aufsteigend sortiert, wählte innerhalb einer Prioritätsklasse das am wenigsten beschädigte Ziel; absolute Schadenswerte sind zudem zwischen Strukturtypen nicht vergleichbar (Rampart bis 300 Mio. Hits gegen eine Straße). | Erst nach `prio.repair` aufsteigend, bei Gleichstand nach anteiligem Schaden (`1 - hits/hitsMax`) absteigend — dieselbe Regel wie beim Repairer-Creep. | Türme reparieren bei gleicher Priorität zuerst die am stärksten beschädigte Struktur, unabhängig vom Strukturtyp. |
| `controller/defence.ts` · `tower` (Angriff) | Türme stellten jede Offensive komplett ein, sobald ein Gegner mindestens fünf `HEAL`-Teile hatte; ein Escort-Creep für 1250 Energie schaltete damit die gesamte Turmabwehr ab. | Summierter Turmschaden aller schussfähigen Türme (Abstandsformel mit `TOWER_POWER_ATTACK`, `TOWER_OPTIMAL_RANGE`, `TOWER_FALLOFF`, `TOWER_FALLOFF_RANGE`; Türme unter `TOWER_ENERGY_COST` zählen nicht mit) wird gegen die konservativ summierte Heilleistung aller feindlichen Creeps (`HEAL_POWER` je `HEAL`-Teil, Boosts unberücksichtigt) verglichen. Angegriffen wird der erste Gegner der nach Bauteilkosten sortierten Liste, dessen Heilung der Turmschaden übersteigt; erfüllt keiner das, bleibt der reaktive Reparaturmodus. | Türme greifen auch gegen begleitete Angreifer an, solange ihr Schaden die Heilung überwiegt. |
| `config.ts` · `bot.prio.repair` | `RAMPART: 7` war die schlechteste Priorität, schlechter als `ROAD: 6`, obwohl `WALL: 1` die beste hatte — verkehrt, weil Ramparts dauerhaft 300 Hits je 100 Ticks verlieren und Walls gar nicht zerfallen. | `RAMPART: 1`, `WALL: 2`. | Ramparts werden bei knapper Reparaturkapazität vor Walls und anderen Strukturen behandelt. |

### Aufräumen ohne Verhaltensänderung

- `StructureTerminal.prototype.buy` entfernt: kein Aufrufer im Projekt, schwächere Preislogik als `buyPixel` und damit eine Falle bei künftiger Reaktivierung. Die zugehörige Deklaration in `types/screeps.d.ts` ist mit entfallen.
- `bot.maxOrderPrice` entfernt: war ausschließlich von `buy()` gelesen; `buyPixel()` nutzt stattdessen ausschließlich `Game.market.getHistory('pixel')`.
- `bot.minSalePrice` entfernt: wurde nirgends gelesen. Die wirksame Verkaufsschwelle bleibt der Durchschnitt aus `Game.market.getHistory(resource)` mal 0,7 in `getFallbackPrice`.
- Kommentar bei `buyPixel` korrigiert: der Faktor `1.1` bedeutet 10 % über dem Marktdurchschnitt, nicht 5 %. Der Faktor selbst ist unverändert.
- Vier auskommentierte Codezeilen entfernt in `roles/claimer.ts`, `roles/debitor.ts`, `roles/defender.ts`, `roles/wally.ts`.

### Pfad-Visualisierung hinter Schalter

`creep/goto.ts` zeichnete bisher für jeden bewegten Creep in jedem Tick den Restpfad als Kreise, inklusive Deserialisieren und Durchsuchen des gecachten Pfads. Das liegt jetzt hinter `bot.const.showPaths` (Standard `false` in `config.ts`), nur zur Fehlersuche einzuschalten.

### Sprachkonvention

Neue Bezeichner (Variablen, Funktionen, Typen) werden künftig englisch benannt; Kommentare, Logausgaben und Doku bleiben deutsch. Bestehende Memory- und Konfigurationsschlüssel sowie die Rollennamen bleiben deutsch, weil sie im laufenden Spiel im Creep- und Room-Memory stehen.

## Runde 2026-08-03: Profiler und Kennzahlen (Plan 01)

Fokus dieser Runde: messen können, bevor optimiert wird. Der Server hat 20 CPU
pro Tick, und das ist die Obergrenze für die Zahl der Räume — nicht Energie und
nicht GCL. Grundlage ist [Plan 01](plans/01-profiler.md).

### Neu: CPU-Profiler (`src/profiler/`)

| Was | Warum | Erwartete Wirkung |
| --- | --- | --- |
| Neues Modul `src/profiler/` mit drei Zuständen `off` / `light` / `full`, umschaltbar zur Laufzeit über die Spielkonsole (`prof.off()`, `prof.light()`, `prof.on()`). Zustand in `Memory.profiler.mode`, übersteht den Global-Reset. | Ohne Messung ist keine Verbesserung belegbar und es wird an der falschen Stelle optimiert. Ein Flag in `config.ts` hätte für jedes Umschalten ein Deployment gebraucht. | Im Standardzustand `off` **keine** Verhaltensänderung: es läuft kein einziges `Game.cpu.getUsed()`. Nachgeprüft am gebauten Bundle — alle sieben `getUsed()`-Stellen liegen hinter einem Zustandsvergleich. |
| Drei Zustände statt eines Schalters. | Im Zustand `off` läuft kein `getUsed()` — damit lässt sich auch nicht messen, was das Messen kostet. Erst der Vergleich `light` gegen `full` liefert die Eigenkosten. | `light` (ein `getUsed()` je Tick) ist der Dauerzustand, `full` (zusätzlich Abschnitte und Rollen) nur für die Fehlersuche. |
| Messpunkte in `main.ts` (Raumschleife, Creep-Schleife, `timer.controll()`) und `controller/timing.ts` (Türme, Terminal, Pixel, Spawn, Verteidigung, Statuslog, Tagessequenz). | Diese sieben Abschnitte sind die Kostenträger des Ticks. | Keine; die Aufrufe sind im Zustand `off` und `light` ein sofortiges `return`. |
| Rollenmessung über einen Wrapper um die Rollentabelle statt über Aufrufe in den Rollen. | `roles/index.ts` und alle zehn Rollendateien bleiben dadurch unverändert, kein Profiler-Aufruf steht in Rollencode. | Eine zusätzliche Indirektion je `doJob`/`spawn`. Die Schlüsselreihenfolge der Tabelle — und damit die Spawn-Priorität in `controller/spawn.ts` — bleibt erhalten. Ausnahmen aus Rollen gehen unverändert durch, die Fehlerbehandlung in `main.ts` bleibt wirksam. |
| Zähler im Heap, nicht in `Memory`. In `Memory.profiler` steht nur der Zustand plus höchstens acht Grundlinien aus `prof.baseline(name)`. | `Memory` wird jeden Tick serialisiert, die Kosten wachsen mit der Größe (`knowledge/systems/runtime-memory.md`). | `Memory.profiler` bleibt unter 1 KB, im Spiel prüfbar mit `JSON.stringify(Memory.profiler).length`. |
| Fensterergebnis zusätzlich flach nach `Memory.stats` in der Grafana-Konvention der Community. | Ein externer Sammler (screeps-grafana) wird damit später ohne Codeänderung möglich; Graphen über Tausende Ticks sagen mehr als Konsolenzeilen. | Ein Objekt aus rund 20 Zahlen, nur bei eingeschaltetem Profiler. `prof.off()` löscht es. |

Nicht übernommen wurde Fremdcode: `screepers/screeps-profiler` liegt schon als
`prod/profiler.js` im Repo und ist als Monkey-Patching aller Prototypen bei
20 CPU kein Dauerbetrieb (das bleibt Stufe 3 des Plans, zurückgestellt).
`screepers/screeps-typescript-profiler` legt seine Zähler unbegrenzt in `Memory`
ab, liest den Zustand bei jedem gewrappten Aufruf aus `Memory` und schaltet über
eine Build-Konstante. Übernommen ist daraus nur die Wrapping-Mechanik in
`profiler/decorator.ts`, mit ersetztem Zustand und ersetzter Speicherung.

`experimentalDecorators` in `tsconfig.json` ist für das noch ungenutzte
`@profile` gesetzt, das der anstehende Umbau der Rollen auf Klassen braucht.

**Offen:** die Eigenkosten von `light` und `full` sind noch nicht gemessen. Sie
gehören hierher, sobald je 500 Ticks in beiden Zuständen gelaufen sind — bis
dahin ist die Aussage „kostet fast nichts" unbelegt.

### Behoben: Builder ohne Rückfallprofil

| Modul / Funktion | Was war falsch | Änderung | Wirkung |
| --- | --- | --- | --- |
| `roles/builder.ts` · `_getProfil` | Bei `energyCapacityAvailable` unter 550 wurde `numberOfSets` zu 0 und die Funktion lieferte ein leeres Body-Array; `spawnCreep` schlägt damit grundsätzlich fehl. Betroffen sind RCL1-Räume und Räume, die nach einem Angriff darunter fallen — also genau die Phase, die ein neu geclaimter Raum durchläuft. Derselbe Fehler wie beim Miner am 2026-08-01 (A4 oben). | Rückfall auf `[WORK,CARRY,CARRY,MOVE,MOVE]` für genau 300 Energie, wortgleich zu `repairer._getProfil` mit derselben Profilform. | Ab 550 Energie unverändert. Unter 550 entsteht jetzt ein kleiner Builder statt keiner. |
