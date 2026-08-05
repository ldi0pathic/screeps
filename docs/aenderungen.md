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

### Rollen auf Klassen, `@profile` und eine neue Rolle

| Was | Warum | Erwartete Wirkung |
| --- | --- | --- |
| Alle zehn Rollen sind Klassen mit `implements CreepRole`, `@profile` an der Klasse und ihrer Instanz als Default-Export. `roles/index.ts` importiert Defaults statt Namespaces. | An einem Modul-Namespace kann der Dekorator nicht greifen: esbuild erzeugt für `export function` **Getter**, und die Wrapping-Mechanik steigt bei Gettern aus (im Bundle als `__copyProps` mit `get: () => from[key]` sichtbar). Als Klassen wird jede Methode einzeln messbar. | Keine. Rein strukturell, alle Rümpfe wortgleich übernommen, nur eingerückt und interne Aufrufe auf `this.` umgestellt. Reihenfolge der Tabelle und damit die Spawn-Priorität im gebauten Bundle nachgeprüft. |
| Klassenmethoden werden in einen **eigenen** Eimer `methods` verbucht, nicht in `roles`. | `wrapRoles` verbucht die Rolle als Ganzes, `@profile` jede Methode. In einer Rangliste stünde dieselbe CPU zweimal und die Anteile summierten über 100 %. | Der Detailbericht hat einen vierten Block „Methoden". Die Fensterzeile nennt weiter die drei teuersten **Rollen** — das Abnahmekriterium aus Plan 01 bleibt erfüllt. |
| Toter `sayJob` aus allen zehn Rollen entfernt. | Griff auf `this.creep` zu, das an einem `Creep` nicht existiert; der Aufruf hätte geworfen. Niemand rief es auf. Dasselbe Muster wie beim schon entfernten `checkSavedAction`. | Keine. Reine Löschung, 20 Zeilen. |
| **Neue Rolle `linkkeeper`.** Steht dauerhaft auf dem einen Feld, das an den Link in der Basis (`spawnLink`) und an das Storage angrenzt, und schiebt die Energie aus dem Link ins Storage. Profil aus Konstanten abgeleitet: `ceil(LINK_CAPACITY / CARRY_CAPACITY)` = 16 `CARRY` plus ein `MOVE`, 850 Energie, 51 Ticks Spawnzeit. | Ein voller empfangender Link nimmt nichts mehr an und blockiert damit den Durchsatz **aller** Quell-Links, die auf ihn senden. Den Empfänger zu leeren ist Voraussetzung für den Durchsatz der Strecke, nicht Aufräumen. Ein `MOVE`, weil der Creep nach der Anreise dauerhaft still steht. | Energie aus den Quellräumen landet im Storage statt im Link. In `roles/index.ts` direkt hinter `debitor`, also mit hoher Spawn-Priorität. Eingeschaltet über `sendLinkkeeper` in E58N6, E58N7, E59N3 und E59N9. |
| `creepBase.harvestSpawnLink` samt aller drei Aufrufe entfernt (`builder` einmal, `debitor` zweimal). | Der `linkkeeper` übernimmt diese Aufgabe; die Energie steht danach im Storage. Kein toter Code. | Builder und Debitor holen die Energie über ihre bestehenden Rückfallpfade aus Storage, Container und Terminal. Im Builder war der Rückgabewert des Aufrufs ohnehin wirkungslos — dort stand direkt danach ein `return;` —, der Kontrollfluss ist also unverändert. `harvestControllerLink` für den **Controller**-Link bleibt bestehen. |

**Kopplung, die man kennen muss:** `sendLinkkeeper` und die Entfernung von
`harvestSpawnLink` gehören zusammen. Wer `sendLinkkeeper` in einem Raum mit
`useLinks` ausschaltet, hat niemanden mehr, der den Base-Link leert — er läuft
voll und blockiert die Quell-Links.

**Offen, weil erst im Spiel zu beobachten:** ob Screeps `transfer` und
`withdraw` im selben Tick beide auflöst. Ist offiziell nicht dokumentiert
(Quellenlage in `docs/knowledge/mechanics/creeps-actions.md`). Der `linkkeeper`
meldet beide Aktionen an und ist in beiden Fällen korrekt — der Umlauf dauert
dann einen Tick statt zwei. Mit `prof.detail()` messbar.

### Wissensbasis ergänzt

- `knowledge/mechanics/structures-rcl.md`, Abschnitt „Links": der `cooldown`
  gehört zum **sendenden** Link, der empfangende bekommt vom Empfangen keinen.
  Genau diese Verwechslung stand kurz davor, in die neue Rolle zu wandern. Dazu
  die Durchsatzformel und der `CARRY`-Bedarf zum Leeren in einem Zug.
- `knowledge/mechanics/creeps-actions.md`, Abschnitt „Simultaneous Actions":
  offizielle Regeln von unbelegter Community-Beobachtung getrennt, die Frage
  `withdraw` + `transfer` ausdrücklich als offen markiert, und der Hinweis, dass
  `creep.store` sich innerhalb eines Ticks nicht ändert. Eine irreführende
  Aufzählung, die `transfer`/`drop`/`pickup` als frei kombinierbar darstellte,
  ist korrigiert.

### Behoben: Sonderregel in `TransportToHomeStorage`

| Modul / Funktion | Was war falsch | Änderung | Wirkung |
| --- | --- | --- | --- |
| `creep/transport.ts` · `TransportToHomeStorage` | Zwei Fehler in einer Sonderregel. **Erstens** Raumverwechslung: die Bedingung prüfte `bot.room[workroom].spawnLink`, der Zugriff darunter las `bot.room[home].spawnLink`. Fallen die beiden auseinander und hat der Heimatraum keinen Link, ist `link` `null` und `link.store[RESOURCE_ENERGY]` wirft. Nicht erreichbar, weil alle Räume mit `workroom != home` `spawnLink: null` haben — aber ein latenter Absturz. **Zweitens** war der Zweck entfallen: die Regel erlaubte einem Creep, der aus dem Storage genommen hatte, das Abliefern in dasselbe Storage, damit Energie aus dem Spawn-Link dorthin gelangt. Dieser Weg lief über `fromId == link.id`, gesetzt vom inzwischen entfernten `harvestSpawnLink`. | Sonderregel entfernt. Es bleibt die Grundregel: nicht dorthin abliefern, wo die Ladung geholt wurde. Damit entfallen beide `bot.room`-Zugriffe und der latente Absturz. Zusätzlich das redundante `if (target)` und das dadurch unerreichbare `return false;` aufgelöst. | In den vier Link-Räumen liefert ein Creep, der aus dem Storage genommen hat, seine Ladung nicht mehr dorthin zurück — das war ein Leerlauf. Er fällt stattdessen auf das nächste Ziel seiner Kette. Den Link leert jetzt der `linkkeeper` direkt. |

## Runde 2026-08-04: Schalter für den Profiler auf der Karte

| Was | Warum | Erwartete Wirkung |
| --- | --- | --- |
| Neues Modul `src/profiler/flag.ts`: eine Flagge namens `prof` schaltet den Profiler über ihre **Hauptfarbe** (grau = `off`, weiß = `light`, grün = `full`, rot startet `prof.detail(50)`). Verdrahtet ausschließlich in `profiler/index.ts::tick()`, `main.ts` bleibt unverändert. | Screeps hat keine API für eigene Bedienelemente: `RoomVisual` zeichnet nur und ist nicht klickbar, die verbreiteten „Konsolenknöpfe" (`javascript:`-Links, die den Angular-Injector des Clients anzapfen) hängen an undokumentierten Client-Internas und brechen mit jedem Umbau still. Eine Flagge ist dokumentierte Spiel-API, spielerprivat und übersteht den Global-Reset. | Ohne gesetzte Flagge nur ein Objektzugriff auf `Game.flags` je Tick. Der Flaggen-Namensraum gilt je Spieler — eine gleichnamige Flagge eines anderen Spielers kann nichts auslösen. |
| Gehandelt wird nur bei einer **Farbänderung** (Flanke); die letzte verarbeitete Farbe steht in `Memory.profiler.flagColor`. | Eine stehende Flagge würde sonst jeden Konsolenbefehl im nächsten Tick überstimmen. Die Farbe liegt in `Memory` und nicht im Heap, damit das auch nach einem Global-Reset gilt. | Ein zusätzlicher Zahlenschlüssel in `Memory.profiler`; die 1-KB-Grenze bleibt weit unterschritten. |
| Die Flagge wird bei jedem Zustandswechsel **mitgefärbt**, auch bei einem über die Konsole. Rot bedeutet „Detailmessung läuft" und fällt nach deren Selbstabschaltung auf die Farbe des Rückkehrzustands. | Zwei Anzeigen, die auseinanderlaufen können, sind schlimmer als keine: die Flagge darf nicht behaupten, der Profiler sei aus, während er messt. | Ein Intent (0,2 CPU) je Umschaltung, und nur wenn eine Flagge steht. |
| Legende als Room Visual neben der Flagge: alle vier Farben mit ihrer Wirkung, aktive Zeile mit `▶`, dazu Zustand, Fensterfüllstand, CPU pro Tick und Restticks der Detailmessung. Gezeichnet wird nur, solange die Flagge steht. | Ein Farbcode, den man im Kopf haben muss, wird nicht benutzt. Die Flagge ist damit zugleich der Schalter der Anzeige. | Sechs `text`-Aufrufe je Tick, gezeichnet in `prof.tick()` und damit **innerhalb** der Messung — die Kosten stehen in `CPU/Tick` und sind nicht versteckt. Room Visuals sieht nur der Besitzer. |
| **Verhaltensänderung:** `prof.off()`, `prof.light()` und `prof.on()` brechen eine laufende Detailmessung jetzt ab (`state.cancelDetail()`), mit Hinweis in der Konsole. | Vorher blieb `detailUntil` stehen: die Selbstabschaltung holte Ticks später den vorherigen Zustand zurück und machte damit ein ausdrückliches `prof.off()` wieder zunichte. | Wer während einer Detailmessung umschaltet, bekommt keinen Abschlussbericht; das Fenster zeigt weiterhin `prof.report()`. Ohne laufende Detailmessung unverändert. |

Bedienung, Farbtabelle und Regeln stehen in
[profiler-befehle.md](profiler-befehle.md#flaggen-schalter-statt-tippen), der
Memory-Schlüssel in
[konfiguration-und-memory.md](konfiguration-und-memory.md#profiler-memory-memoryprofiler-memorystats).

### Neu: Tests (`tsBot/tests/`, `pnpm test`, `pnpm smoke`)

Bis hierher war die Verifikation Typecheck plus Build — beides sagt nichts über
Verhalten. Ab jetzt:

| Was | Warum | Umfang |
| --- | --- | --- |
| `pnpm test`: Unittests in `tsBot/tests/` mit `node:test`, gebündelt von esbuild. Keine neue Abhängigkeit. | Die Flankenauswertung des Flaggen-Schalters und die Kennzahlen des Fensters sind genau die Art Logik, die im Spiel erst Ticks später auffällt. | 15 Tests: Flaggen-Schalter (Flanke, Quittung, unbelegte Farbe, Legende samt Raumrand) und Messfenster (leeres Fenster ohne `NaN`, kein `getUsed()` im Zustand `off`, CPU je Raum und Creep, Anteile, Detailmessung, Fälligkeit nach 100 Ticks). |
| `pnpm smoke`: baut und lädt danach das **gebaute** `tsProd/main.js` in einem `vm`-Kontext mit gestellter, leerer Welt; fährt 17 Ticks über alle drei Zustände und beide Flaggenwechsel. | Ein Unittest lädt einzelne Module. Ob das **Bundle** lädt, die Seiteneffekte von `config.ts` in der richtigen Reihenfolge laufen und ein ganzer Tick durchkommt, prüft nur der Lauf gegen das Artefakt. | Schlägt fehl, sobald ein Tick wirft oder der Bot über `Game.notify` einen Fehler meldet. Unbekannte Screeps-Konstanten liefert ein Proxy als `0` und meldet sie — tragfähig nur, weil die gestellten Räume auf jedes `find()` eine leere Liste geben. |

Die Testbasis lebt außerhalb von `tsconfig.json` (`include: ["src"]`), wie
`build.ts` und `upload.ts`: sie ist Werkzeug, nicht Bot. Details und die zwei
Regeln, an denen sonst still etwas kaputtgeht (`Memory` leeren statt ersetzen,
Modul erst nach den Globals laden), stehen in `CLAUDE.md`.

### Umbau: Profiler auf Klassen

Struktureller Umbau **ohne Verhaltensänderung**, direkt nach den Tests, weil
erst sie ihn belegbar machen: dieselben 15 Tests mit unveränderten Zusicherungen
laufen vor und nach dem Umbau, dazu Typecheck, Build und Smoketest.

| Was | Warum | Wirkung |
| --- | --- | --- |
| `profiler/state.ts` → Klasse `ProfilerState`, `window.ts` → `MeasurementWindow`, `flag.ts` → `FlagSwitch`, `index.ts` → `Profiler` (erfüllt `ProfilerHandle`). Modulzustand (`currentMode`, `windowState`, `openSections`, `lastMode`) wurde zu Feldern. | Der Zustand lag in Modulvariablen: ein Test musste ihn zwischen zwei Fällen zurücksetzen, und wer das vergaß, bekam Werte aus dem Vorgänger. Jetzt baut jeder Test seine eigenen Objekte. | Keine. Zusicherungen der Tests unverändert; im Bundle nachgeprüft, dass alle sechs `Game.cpu.getUsed()`-Stellen weiter hinter einem Zustandsvergleich liegen. |
| Abhängigkeiten werden übergeben statt importiert: `MeasurementWindow` und `FlagSwitch` bekommen den `ProfilerState`, `Profiler` alle drei. | Vorher griffen die Module über Modulfunktionen aufeinander zu — nicht ersetzbar und im Test nur global umschaltbar. | Aus `state.getMode()` wird `this.state.mode`, ein Feldzugriff statt eines Funktionsaufrufs. |
| Neue Datei `profiler/runtime.ts` als Zusammenbau (Composition Root) mit den drei Instanzen des laufenden Bots. | Der Dekorator `@profile` steht an den Rollenklassen und kann keine Argumente bekommen; er muss sich das Fenster selbst holen. Aus `index.ts` wäre das eine Importschleife (`index` → `decorator` → `index`). | Eine Datei mehr, dafür eine einzige Stelle, an der die Objekte entstehen. |
| `ProfilerState` liest `Memory` erst beim Zugriff statt den Verweis beim Laden festzuhalten. | Ein beim Laden festgehaltenes `Memory` bindet das Modul an das Objekt, das zufällig gerade dort stand. | Robuster gegenüber Ladereihenfolge: das Modul lädt auch, wenn `Memory` noch nicht steht. |
| `metrics()` nimmt kein Argument mehr (es war immer der eigene Rohzustand), `snapshot` und `isDue` sind Getter. | Drei Aufrufstellen lauteten `metrics(snapshot())` — eine Möglichkeit, versehentlich ein fremdes Fenster auszuwerten, ohne Nutzen. | Nur Schreibweise. |

Nicht umgebaut wurden `report.ts` und `stats.ts`: reine Funktionen ohne
Zustand, eine Klasse gewänne dort nichts.

**Nicht gebaut:** die klickbare Knopfzeile in der Konsole. Sie wäre bequemer,
hängt aber an Client-Internas, lebt im Log (scrollt weg, müsste also regelmäßig
neu ausgegeben werden und würde die Konsole zumüllen) und schickt rohes HTML an
jeden, der die Logs über die API abholt.

## Runde 2026-08-04: Körperprofile zusammengezogen

Zweite Modernisierungsrunde, **ohne Verhaltensänderung** im erreichbaren Bereich.
Umsetzt den strukturellen Teil von [Plan 03](plans/03-durchsatz-und-bodies.md);
die Durchsatzlogik dieses Plans bleibt offen.

| Was | Warum | Wirkung |
| --- | --- | --- |
| Neue Klasse `BodyProfile` (`src/creep/body.ts`): Bausatz aus Teilen mit Anzahl je Satz, Höchstzahl Sätze, Pflicht-Rückfall. Rechnet `min(maxSets, floor(Energie / Satzkosten))` und hängt die Teile in der Reihenfolge des Bausatzes an. | Acht der elf Rollen rechneten dieselben vier Zeilen selbst, jede mit eigenen Zahlen im Funktionsrumpf und eigenem Umgang mit dem Grenzfall. Zwei lieferten dort früher ein **leeres** Body-Array (A4, Builder-Fix). | Keine. Die Klasse liest weder `Game` noch `Memory`, sie bekommt die Energie übergeben — und ist deshalb ohne gestellte Welt prüfbar. |
| Neue Datei `src/creep/bodies.ts`: die dreizehn Profile aller Rollen nebeneinander. Die Rollen behalten nur die **Auswahl** (Upgrader nach RCL, Extupgrader nach Sicht und RCL, Debitor nach Heimatraum und Container). | Wer wissen wollte, wie groß ein Miner bei 2300 Energie wird, musste `roles/miner.ts` lesen; wer Zahlen vergleichen wollte, elf Dateien. Plan 03 braucht genau diese eine Stelle, um Rumpfgrößen später aus dem Durchsatz herzuleiten. | Keine. Elf lokale Profilfunktionen entfallen, `_getProfil` heißt jetzt `bodyFor` (englische Bezeichner). |
| Beleg: `tests/creep-bodies.test.ts` führt die **alten** Formeln als Referenz mit und vergleicht jedes Profil über 300 bis 12 900 Energie in Schritten von 50. | Ein Umbau an den Rümpfen ist nur dann harmlos, wenn dieselben Rümpfe herauskommen — und das ist mechanisch prüfbar, nicht Ansichtssache. | 9 neue Tests (24 gesamt). Dazu Zusicherungen, die vorher niemand prüfte: kein leerer Rumpf, höchstens 50 Teile, Kosten nie über der Energie. |
| `pnpm smoke` stellt jetzt Spawns und prüft jeden angeforderten Rumpf. | Der Smoketest fuhr Ticks, ohne je einen Rumpf zu rechnen — der geänderte Pfad war darin nicht enthalten. Außerdem fälschte er die Körperteil-Konstanten mit `0`; die Werte stehen jetzt für Unittests und Smoketest an einer Stelle (`tests/support/screeps-stubs.ts`). | 120 Rumpfanforderungen je Lauf (Upgrader und Claimer; die übrigen Rollen brechen in der leeren Welt vorher ab). |

**Eine bewusste Abweichung**, unerreichbar im Spiel: Transfer und Debitor liefern
unter 100 Energie Kapazität jetzt `[CARRY, MOVE]` statt eines leeren Rumpfs. Ein
Raum mit Spawn hat immer mindestens 300 — der Fall kann nicht eintreten, aber ein
Pflicht-Rückfall verhindert die Fehlerklasse dauerhaft.

**Gefunden, nicht geändert:** das Rückfallprofil des Defenders kostet 330 Energie
(`[MOVE, MOVE, ATTACK, RANGED_ATTACK]`), er rechnet aber mit `energyAvailable`.
Unter 330 vorrätiger Energie schlägt sein Spawn also fehl und wird im nächsten
Tick erneut versucht. Der Test hält das fest; ob dort ein billigerer Rumpf
sinnvoller ist, gehört zu Plan 03 (Verteidigung im Notfall) und nicht in einen
Umbau ohne Verhaltensänderung.


## Runde 2026-08-04: Pfad-Cache als Objekt

Dritte Modernisierungsrunde, **ohne Verhaltensänderung**. Diesmal war die
Reihenfolge streng test-zuerst: die dreizehn Tests zu `goto.ts` sind gegen die
**alte** Fassung geschrieben und dort grün gelaufen, bevor eine Zeile umgebaut
wurde.

| Was | Warum | Wirkung |
| --- | --- | --- |
| Neue Klasse `PathMemory` (`src/creep/path-memory.ts`) für die vier zusammengehörigen Memory-Schlüssel `path`, `pathTarget`, `lastPos`, `dontMove`. | Die Schlüssel wurden an **zehn** Stellen in drei Dateien einzeln per `delete` angefasst — und zwar nach zwei *verschiedenen* Regeln, die nirgends benannt waren. | Keine. `forgetPath()` verwirft nur den Weg (Zustandswechsel in `checkHarvest`), `clear()` zusätzlich die Stauerkennung (am Ziel, bei ungültigem Pfad, beim Standplatzwechsel des Miners). Genau die bisherigen Regeln, jetzt mit Namen. |
| `moveByMemory` in benannte Schritte zerlegt: Ankunft, Stau-Ausweichsuche, Cache oder Neusuche, Laufen, Auswertung des Rückgabecodes. Die Pfadvisualisierung ist eine eigene Funktion. | Eine Funktion mit fünf Aufgaben und den vier Memory-Schlüsseln mitten im Ablauf. Der Sonderfall „festgefahren" war nur an `dontMove > 3` zu erkennen. | Keine. Der CPU-Trick bleibt erhalten: nach einer Suche liegen die Schritte schon vor und werden für die Visualisierung nicht erneut deserialisiert. |
| Zielvergleich ohne `new RoomPosition(...)`: es werden `x`, `y` und `roomName` direkt verglichen. | Der Vergleich legte je Creep und Tick ein Wegwerf-Objekt an, nur um `isEqualTo` aufrufen zu können. | Verhaltensgleich (`isEqualTo` vergleicht genau diese drei Felder), eine Allokation je Creep und Tick weniger. |
| 19 neue Tests (43 gesamt), dazu Stubs für `RoomPosition`, `Room.serializePath` und einen Creep, der jeden `moveByPath`-Aufruf mitschreibt (`tests/support/movement-stubs.ts`). | Bewegung und Pfad-Caching sind der heißeste Pfad des Bots und waren völlig ungetestet. | Festgehalten sind jetzt auch die Feinheiten: derselbe Punkt in einem anderen Raum ist ein anderes Ziel, der Stauzähler springt erst beim zweiten gleichen Standort an, `ERR_TIRED` gilt als regulärer Schritt, und die drei Fehlercodes am Pfad verwerfen den Cache. |

**Gefunden, nicht geändert:** `moveByMemory` sucht ohne `range` — für Storage,
Link, Terminal und Spawn sind das nicht betretbare Ziele, und die Wissensbasis
warnt genau davor. Der Weg kommt trotzdem heraus, kostet aber mehr Ops als nötig.
Ein `range` ändert, wo der Creep stehen bleibt, und muss je Aufrufstelle geprüft
werden: aufgenommen als Befund 6 in [Plan 05](plans/05-cpu-verteilung.md).

## Runde 2026-08-05: Beschaffungsketten zusammengezogen

Vierte Modernisierungsrunde, **ohne Verhaltensänderung**. Wieder test-zuerst: die
fünfzehn Tests zu den Beschaffungsketten sind gegen die **alte** Fassung
geschrieben und liefen dort grün, bevor umgebaut wurde.

| Was | Warum | Wirkung |
| --- | --- | --- |
| Neue Datei `src/creep/target.ts` mit `RememberedTarget` (kapselt die `useX`-Memory-Schlüssel) sowie `collectFrom` und `withdrawFrom` (werten aus, was eine Aktion am Ziel gemeldet hat). | Derselbe `switch` stand **zwölfmal** fast gleich in `base.ts` und `transport.ts`: `ERR_NOT_IN_RANGE` → hinlaufen, `OK` → `fromId` setzen, sonst aufgeben. Dazu fünfmal „gemerktes Ziel aus dem Memory holen, sonst suchen". | Keine. Neun Funktionen in `base.ts` sind auf die Bausteine umgestellt; aus je 20 bis 30 Zeilen werden fünf bis acht. Die Rückgabecodes werden weiterhin genau gleich behandelt. |
| `ERR_INVALID_TARGET` steht nicht mehr einzeln vor dem `default` — es fällt in denselben Zweig. | Es tat vorher schon genau dasselbe wie `default`; die eigene `case`-Zeile suggerierte eine Sonderbehandlung, die es nicht gab. | Keine. |
| `RememberedTarget.isRemembered` macht eine bisher unbenannte Regel sichtbar: ist ein Ziel gemerkt, das es nicht mehr gibt, wird in diesem Tick **nicht** ersatzweise gesucht. | Beim Zusammenziehen wäre daraus fast ein `??` geworden — also eine Ersatzsuche, und damit mehr Pfadsuchen je Tick als vorher. Ein Test hält die Regel jetzt fest. | Keine, aber der teuerste Fehler, den dieser Umbau hätte machen können. |
| Der Store-Stub der Tests legt seine Methoden **nicht aufzählbar** an. | Der Bot läuft mehrfach mit `for (var resourceType in store)` über einen Store. Im Spiel liefert das nur Ressourcen; im Stub wäre `getUsedCapacity` als „Ressource" mitgelaufen und hätte ein falsches Verhalten bestätigt. | Betrifft nur die Tests — aber ohne diese Korrektur wären sie an der entscheidenden Stelle nichts wert. |
| Der Smoketest fälscht **keine** Konstante mehr: `FIND_*`, `STRUCTURE_*` und `OBSTACLE_OBJECT_TYPES` stehen jetzt zusammen mit den Körperteilen in `tests/support/screeps-stubs.ts` und werden von Unittests und Smoketest gemeinsam benutzt. | `OBSTACLE_OBJECT_TYPES` wird in `roles/linkkeeper.ts` beim Laden des Moduls gelesen. Als `0` gefälscht hätte der erste `includes()`-Aufruf geworfen — in der leeren Smoke-Welt fiel das nur nicht auf. | Die Warnliste des Smoketests ist leer. |

**Ein Fehler, den ich selbst eingebaut und beim Prüfen gefunden habe**, hier als
Warnung: beim Umstellen von `harvestRoomStorage` hatte ich
`if (storage && storage.store[type] > min)` zu `if (!storage || store[type] <= min) return false` negiert.
Fehlt die Ressource im Storage, ist der Wert `undefined` — und dann sind **beide**
Vergleiche falsch, die Bedingung kippt also. Solche Schwellenvergleiche bleiben
positiv formuliert; ein Test deckt den Fall jetzt ab.

**Gefunden, nicht geändert:** `creep/transport.ts` ruft mehrfach
`store.getFreeCapacity([RESOURCE_ENERGY])` — mit einem **Array** statt der
Ressourcenkonstante. Das funktioniert nur, weil der Wert bei der
Schlüsselsuche zu `"energy"` wird; dokumentiert ist es nicht. `transport.ts` ist
in dieser Runde bewusst unangetastet geblieben (Container-Auswahl und diese
Aufrufe gehören zusammen betrachtet) und ist der Kandidat für die nächste Runde.

## Runde 2026-08-05: Ablieferketten und Containerauswahl

Fünfte Modernisierungsrunde, **ohne Verhaltensänderung**. Wieder test-zuerst: die
acht Tests zu `transport.ts` liefen gegen die alte Fassung grün, bevor umgebaut
wurde.

| Was | Warum | Wirkung |
| --- | --- | --- |
| Neue Klasse `ContainerList` (`src/creep/containers.ts`) für `Memory.rooms[<raum>].container`: Liste kennen, bei Bedarf neu erheben, den nächstgelegenen passenden Container finden. **Was** passend heißt, gibt der Aufrufer als Prüfung mit — beim Holen zählt der Inhalt, beim Abliefern der freie Platz. | Beide Seiten suchten denselben Container aus derselben Liste, mit je eigener Entfernungsrechnung und gespiegelten Bedingungen: `base.ts` (holen) und `transport.ts` (abliefern). | Keine. Verglichen wird jetzt die **quadrierte** Entfernung — für die Reihenfolge dasselbe wie die Wurzel, spart aber je Kandidat eine Wurzelberechnung. |
| `_Transfer` heißt `transferTo` und steht in `creep/target.ts` bei seinem Gegenstück `withdrawFrom`. | Beides ist dieselbe Frage („handeln oder hinlaufen?"), nur in zwei Richtungen. Der Unterschied steht jetzt dort dokumentiert: beim Abliefern wird **kein** `fromId` gesetzt, denn es gibt keine Quelle. | Keine. Vier Ablieferfunktionen benutzen es. |
| Neuer Helfer `findDeliveryTarget` in `transport.ts` für die Suche „nächstes eigenes Bauwerk dieser Typen, das Platz hat und nicht die Quelle der Ladung ist". | Zweimal derselbe Filteraufbau. Terminal und Türme benutzen ihn bewusst **nicht**: der Terminal wird über eine gemerkte Id gefunden, die Türme nach Lücke sortiert, und beide kennen die `fromId`-Regel nicht. | Keine. |
| **Toter Code entfernt:** `CheckIsFreelancer` wurde exportiert, aber von keiner Datei benutzt. | Kein toter Code — Git ist das Archiv. | Keine. |

**Zwei Unterschiede zwischen Holen und Abliefern**, die vorher nur aus dem
Kontrollfluss zu lesen waren und jetzt benannt sind:

- Eine **leere** Containerliste bedeutet beim Abliefern „keine Container da"; die
  Beschaffungsseite erhebt sie dann neu (`hasList` gegen `hasEntries`).
- Eine Id ohne Objekt verwirft beim Holen die **ganze** Liste (sie wird neu
  erhoben), beim Abliefern wird sie stillschweigend übersprungen
  (`forgetListOnStaleId`).

Beides bleibt, wie es war. Ob die Ablieferseite nicht auch selbstheilend sein
sollte, ist eine Verhaltensfrage und gehört zu Plan 05.

**Drei Abweichungen, die ich beim Gegenlesen der eigenen Änderung gefunden habe**
— alle drei vor dem Commit zurückgedreht, und alle drei hätten die Tests sonst
gefunden:

1. `hasEntries` statt `hasList` beim Abliefern hätte aus einer leeren Liste eine
   Neuerhebung gemacht.
2. `transferTo` in der Containerablieferung hätte die gemerkte Wahl schon auf dem
   **Hinweg** vergessen, nicht erst nach der Ablieferung. Dort steht deshalb
   weiterhin ein eigener `switch`, mit Begründung im Code.
3. Beim Terminal hatte ich die Kapazitätsprüfung negiert — dieselbe Falle wie in
   der Runde davor. Sie ist wieder positiv formuliert.

## Runde 2026-08-05: Linknetz zentral gesteuert (Plan 09 Teil A)

Erste Runde **mit** Verhaltensänderung seit der Migration: wer wann wohin sendet,
ändert sich. Anlass war die erste Profilermessung aus dem Spiel
(`docs/profiler/`) — sie hat die Annahme widerlegt, auf der Plan 09 aufgebaut
war.

**Was die Messung ergeben hat.** 9,12 CPU/Tick bei Limit 20. Der Debitor ist mit
38,7 % der größte Posten, der Miner mit 11,1 % (0,07 je Creep) *nicht* die heiße
Rolle, für die Plan 09 ihn hielt. Der Linkkeeper kostet 0,10 CPU/Tick — der
Gegenbefund aus Plan 09, ihn nicht von einem Manager wecken zu lassen, ist damit
gemessen statt argumentiert. Die Umstellung hier ist deshalb **keine
CPU-Maßnahme, sondern eine Durchsatzmaßnahme**; sie wirkt auf die CPU nur
mittelbar, weil kürzere Wege kleinere und weniger Debitoren brauchen.

| Was | Warum | Wirkung |
| --- | --- | --- |
| Neue Klasse `LinkNetwork` (`src/controller/links.ts`), aufgerufen **jeden Tick** aus `controller/timing.ts`. Sie wählt je Raum die sendebereiten Links und die Empfänger nach Vorrang und sendet mit **expliziter Menge** `min(vorhanden, frei)`. | Bisher entschied jeder Miner einzeln: Ziel per `Math.random()` aus `targetLinks`, ohne Vorrang, ohne Mengenangabe. Ein Link-Cooldown entspricht der Entfernung zum Ziel (20 Felder = 20 Ticks, in denen bis zu 800 Energie hätten fließen können) und wurde so für beliebig kleine Mengen verbrannt. | **Verhaltensänderung.** Vorrang: unter RCL8 Controller-Link vor Storage-Link, ab RCL8 umgekehrt (dort zahlt Upgraden nur noch auf GCL ein). Zwei Sender zielen im selben Tick nie auf denselben Empfänger. |
| Neue Klasse `LinkList` (`src/controller/link-list.ts`) für `Memory.rooms[<raum>].links`: erheben, klassifizieren, auflösen. **Controller- und Storage-Link sind Empfänger, alle übrigen Links sind Sender.** | Die Quell-Links standen nirgends: der Miner fand „seinen" Link per `findInRange` und legte die Id in **sein** Creep-Memory — das Wissen starb mit ihm. | Keine für sich. Zuordnung zuerst aus der Config (`spawnLink`, `controllerLink`), sonst aus der Lage: ≤3 zum Controller, ≤2 zum Storage. |
| Neue Klasse `LinkPlanner` (`src/controller/link-planner.ts`): baut die beiden Empfängerlinks selbst, höchstens eine Baustelle je Tagesdurchlauf und Raum. | Ein Raum soll vier Links haben (zwei an den Quellen, einer am Spawn, einer am Controller). Von Hand gepflegte Ids skalieren dabei nicht. | **Neu.** Platzwahl: Controller-Link bevorzugt auf Reichweite 2 (Upgrader arbeiten auf 3 und können daneben stehen), Storage-Link nur auf Feldern, für die ein Standplatz des Linkkeepers existiert. Es gewinnt das Feld mit der kleinsten Entfernungssumme zu den sendenden Links — der Cooldown ist die Entfernung, kurze Strecken heißen Durchsatz. |
| Der Miner verliert seine Weiterleitung (`roles/miner.ts`), er füllt nur noch seinen eigenen Link. | Siehe oben. | **Nebenbei ein Fehler behoben:** die alte Bedingung `link.cooldown < 1 && creep.transfer(...)` hat den Link **gar nicht befüllt**, solange sein Cooldown lief. Der Cooldown gehört zum *sendenden* Link und hat mit dem Einlagern nichts zu tun. |
| `targetLinks` ist aus `config.ts` und `globals.ts` entfernt. | Nach dem Schnitt im Miner las es niemand mehr. Kein toter Code, kein toter Konfigwert. | Keine. |
| Eigene Profilerabschnitte `timing.links`, `timing.roads` und `timing.linkplan`. | Der Straßenplaner lief bisher nur innerhalb des Sammelwerts `timing.daily`. Weil die Tagessequenz alle 28 800 Ticks läuft, stand der in der Messung auf 0,00 und verriet nichts über seine Kosten. | Keine. Die nächste Messung zeigt beide Planer einzeln. |

**Zwei Entscheidungen, die bewusst so getroffen sind:**

- **`SEND_MIN = LINK_CAPACITY / 4` (200).** Eine Quelle liefert 10 Energie/Tick,
  ein Linkpaar über 20 Felder trägt 40/Tick — der Cooldown ist also nicht der
  Engpass, Warten kostet nichts. Die Schwelle verhindert allein, dass ein
  Cooldown für eine Handvoll Energie verbrannt wird.
- **Gesendet wird jeden Tick, nicht getaktet.** Der *empfangende* Link hat keinen
  Cooldown, es gibt also nichts, worauf man warten könnte; jeder ausgelassene
  Tick wäre verlorener Durchsatz. Ohne sendebereiten Link ist der Durchgang
  billig — er liest zwei Zahlen je Sender und steigt aus.

**Drei Fehler des Vergleichsbots, die hier ausdrücklich nicht übernommen wurden**
(vgl. Plan 09 Teil B): `800` hartcodiert statt `LINK_CAPACITY`; „nur senden, wenn
der Empfänger die **ganze** Ladung aufnehmen kann" (ein halb gefüllter Empfänger
bekäme so nie etwas); ein Zielzähler, der auch weiterläuft, wenn nichts gesendet
wurde.

**Was noch nicht gemessen ist.** Es gibt keine Grundlinie vor der Umstellung —
`prof.baseline("vor-linknetz")` ist nicht gelaufen, weil die Änderung in einem
Zug entstanden ist. Die Wirkung auf den Durchsatz ist deshalb bis zur nächsten
Messung eine begründete Erwartung, keine Zahl.
