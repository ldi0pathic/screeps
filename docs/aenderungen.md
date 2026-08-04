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

