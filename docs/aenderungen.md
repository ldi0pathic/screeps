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

## Runde 2026-08-05: Links ohne Konfiguration, Config verschlankt

Nachtrag zur Runde davor. Leitsatz, der dabei entstanden und in `CLAUDE.md`
festgehalten ist: **Absicht gehört in die Config, Tatsachen über die Welt
nicht.**

| Was | Warum | Wirkung |
| --- | --- | --- |
| `spawnLink` und `controllerLink` sind aus der Config verschwunden. `LinkList` entscheidet allein nach Lage; `linkkeeper`, `harvestControllerLink` und `upgrader` lesen sie jetzt von dort. | Von Hand gepflegte Ids tragen nicht mehr, seit der Linkplaner Links im laufenden Spiel baut. | Keine, solange die Lage stimmt. `discover()` meldet jede **geänderte** Zuordnung auf der Konsole — läge eine Quelle zufällig nahe am Controller, würde ihr Quell-Link zum Empfänger, und genau das fällt dort auf. |
| `useLinks` ist entfallen und wird aus `controller.my` und `CONTROLLER_STRUCTURES[link][RCL] > 0` abgeleitet (`usesLinks()`). | Links gibt es ab RCL5; ein eigener Raum, der so weit ist, soll sie nutzen. Bewusst am **Kontingent** festgemacht statt an vorhandenen Links — sonst käme der Planer nie dazu, den ersten zu bauen. | **Verhaltensänderung.** Jeder eigene Raum ab RCL5 beginnt selbständig, seine Empfängerlinks zu bauen. Bisher galt das nur in vier von Hand eingetragenen Räumen. |
| **Fehler im Linkplaner behoben:** er reserviert jetzt Plätze für die Sender, `reserve = min(Quellen ohne Link, erlaubteLinks − 1)`, gebaut wird nur bei `freie Plätze > reserve`. | Auf RCL5 sind nur zwei Links erlaubt. Der Planer hätte beide mit Empfängern belegt und keinen Platz für einen Quell-Link gelassen — ein Linknetz aus zwei Empfängern und keinem Sender bewegt nichts. Vorher fiel das nicht auf, weil `useLinks` nur in RCL8-Räumen stand. | Ergibt die üblichen Ausbaustufen: RCL5 ein Empfänger, RCL6 einer, RCL7 zwei, RCL8 zwei plus zwei freie Plätze. |
| **Zweiter toter Zweig behoben:** `debitor._spawn` prüfte `Memory.rooms[workroom].useLinks` — einen solchen Memory-Schlüssel setzt niemand, die Bedingung war immer falsch. Ersetzt durch `linksDeliver(workroom)`. | Ein Quellcontainer mit Link braucht keinen Debitor — aber nur, wenn das Linknetz die Energie auch abliefert. | `linksDeliver` verlangt zusätzlich einen **Empfänger am Storage**. Der RCL allein genügt nicht: zwischen „Raum darf Links bauen" und „ein Empfänger nimmt sie an" liegen Tage Bauzeit, und in dieser Lücke hätte das Wegfallen der Container-Debitoren den Raum ausgehungert. |
| **Toter Konfigwert entfernt:** `debitorProSource` und `walls`. | Beide las kein Modul; in `globals.ts` stand das sogar als Kommentar. | Keine. |
| **`resetWorld()` in den Test-Stubs leert jetzt auch `Game.rooms` und `Game.creeps`.** | Ein Raum aus dem vorigen Test blieb sichtbar; ein Test für „keine Sicht auf den Raum" prüfte dadurch das Gegenteil dessen, was er behauptet. | Keine im Bot. Kein bestehender Test ist daran zerbrochen. |
| **`CLAUDE.md` korrigiert:** `global.minSalePrice` und `global.maxOrderPrice` waren dort als Konfiguration beschrieben. | Beide existieren im TypeScript-Bot nirgends — Erbe aus `prod/`. | Keine. |

`config.ts` schrumpft von 346 auf 309 Zeilen. Der größere Gewinn ist nicht die
Länge, sondern dass eine Klasse von Fehlern wegfällt: eine Id in der Config, die
nach einem Wiederaufbau ins Leere zeigt.

**Noch offen:** `energySources`, `mineralSources` und `mineralContainerId` sind
ebenfalls Tatsachen. Sie bleiben vorerst, weil `miner.spawn` und `debitor.spawn`
sie für Räume **ohne Sicht** lesen — dafür braucht es erst einen einmalig
erhobenen Bestand im Memory. Das gehört zu Plan 02.

## Runde 2026-08-06: Profilerdaten überleben den Moment im Log

Ohne Verhaltensänderung am Bot. Anlass: der Detailbericht ging nur auf die
Konsole — wer den Moment verpasste, verlor ihn. `Memory.stats` hielt zwar die
groben Zahlen, aber immer nur das **letzte** Fenster, und die Grundlinien nur
Skalare.

| Was | Warum | Wirkung |
| --- | --- | --- |
| **`prof.compare(name)`** (`profiler/report.ts::formatComparison`): stellt eine Grundlinie dem laufenden Fenster gegenüber, Abschnitt für Abschnitt und Rolle für Rolle, sortiert nach dem Betrag der Änderung. Dafür hält `Baseline` jetzt auch `sections` und `roles`. | `prof.baselines()` konnte sagen, **dass** es teurer wurde, aber nicht **wo** — und genau dafür legt man Grundlinien an. | Neuer Befehl. Ein Eintrag, den es nur auf einer Seite gibt, wird als `neu` oder `weggefallen` markiert statt eine Zahl zu erfinden. |
| **`prof.mail()`** (`profiler/mail.ts`): schickt den Bericht über `Game.notify` an die Profiladresse, zerlegt in Blöcke `[i/n]`. | Der Bericht soll das Spiel überleben. | Neuer Befehl. Die API begrenzt auf 1000 Zeichen je Nachricht und 20 je Tick; ein Detailbericht braucht rund acht Blöcke. Mehr als 20 werden **nicht** stillschweigend abgeschnitten, die Rückgabe benennt die weggelassenen. |
| **`prof.history()`** (`profiler/history.ts`): Verlauf aller Fenster in **Speichersegment 99**, eine Zeile je Fenster, Ringpuffer über 1000 Zeilen mit harter 100-KB-Grenze. | `Memory` wird bei der ersten Berührung in **jedem** Tick per `JSON.parse` ausgepackt — Verlauf gehört dort nicht hin. Ein Segment kostet nichts, solange es nicht angefordert ist. | Neuer Befehl. Der erste Aufruf fordert das Segment nur an, die Ausgabe kommt einen Tick später — das ist die API, kein Fehler. |
| `Memory.profiler`-Budget von 1 KB auf 8 KB angehoben. | Die Grundlinien halten jetzt Abschnitte und Rollen. Auf zwei Nachkommastellen gerundet, weil feiner bei CPU-Werten Rauschen ist und jedes Zeichen in jedem Tick mitgeparst wird. | Bewusst gekaufte Tickkosten gegen die Antwort auf „welcher Abschnitt wurde teurer". Methoden und einzelne Creeps bleiben draußen. |
| Eigene Messpunkte gab es schon; **`RawMemory` ist jetzt auch im Smoketest gestellt**, und der prüft `prof.history()`, `prof.compare()` und `prof.baseline()` gegen das gebaute Bundle. | Ohne den Eintrag fiele `RawMemory` in den Proxy für unbekannte Konstanten und wäre `0` — der erste Zugriff hätte geworfen. | Der Smoketest deckt die neuen Befehle mit ab. `prof.mail()` bewusst nicht: er wertet jedes `Game.notify` als Fehlermeldung des Bots. |

**Ein Fehler, der beim Gegenlesen der eigenen Änderung auffiel:** `formatComparison`
prüfte nur, ob die **Grundlinie** Abschnitte kennt. Läuft das **laufende Fenster**
in `light`, hätte die Tabelle jede Zeile der Grundlinie als „weggefallen"
ausgewiesen — obwohl nichts weg ist, sondern nur niemand misst. Unterschieden
wird jetzt am Zustand (`metrics.mode === "full"`), nicht an leeren Listen: eine
leere Liste **in `full`** heißt sehr wohl „ist weg" und soll auch so dastehen.

## Runde 2026-08-06: Zielgedächtnis beim Abliefern (Plan 10, Runde 1)

Anlass ist die Messung in `docs/profiler/detail_01.txt`: `Debitor.doJob` ist mit
38,5 % der teuerste Posten des Bots, und die Ursache ist die Zielwahl, nicht die
Bewegung. `findDeliveryTarget` suchte in **jedem** Tick per
`findClosestByPath(FIND_MY_STRUCTURES)` das nächste Ablieferziel — auch in den
Ticks, die der Creep dorthin unterwegs war, und im ausgebauten Raum über 50+
Extensions plus Türme, Labs und Links. Die Beschaffungsseite hatte dieses
Problem seit der Runde vom 2026-08-05 nicht mehr; die Ablieferseite schon.

| Was | Warum | Wirkung |
| --- | --- | --- |
| `findDeliveryTarget` (`creep/transport.ts`) bekommt einen `RememberedTarget`. Memory-Schlüssel `useSupply` für Spawn und Extensions, `useLab` für Labore. | Die Suche gehört einmal je Ablieferung gemacht, nicht einmal je Tick des Hinwegs. Getrennte Schlüssel, weil ein Creep in derselben Kaskade beides probiert. | Statt einer Pfadsuche je Tick nur noch eine je Ziel. Betrifft jede Rolle, die abliefert: Debitor, Transfer, Builder. |
| Neu: `deliverTo` (`creep/target.ts`) als Gegenstück zu `collectFrom`. Setzt **kein** `fromId`, vergisst das Ziel bei `OK` und bei jedem Fehlercode, behält es nur bei `ERR_NOT_IN_RANGE`. | Nach einer Ablieferung ist die Extension voll oder der Creep leer — die Wahl ist verbraucht. `fromId` merkt sich die Quelle einer Ladung, und beim Abliefern gibt es keine. | Kein Verhaltensunterschied gegenüber `transferTo`, das für Terminal, Türme und Storage unverändert bleibt. |
| Ein gemerktes Ziel, das die Ladung nicht mehr annimmt, löst **im selben Tick** eine Ersatzsuche aus. | Bewusste Abweichung von der Beschaffungsseite, wo ein verschwundenes Ziel keine Ersatzsuche auslöst. Gäbe `findDeliveryTarget` hier `null` zurück, liefe die Kaskade der Rolle weiter und der Creep kippte seine Ladung ins Storage, statt die nächste Extension zu füllen. | Korrektheit, nicht Sparsamkeit. Ist als Test festgehalten. |

`findClosestByPath` bleibt bewusst stehen. Ein Wechsel auf `findClosestByRange`
wäre eine zweite Verhaltensänderung im selben Schritt; ob er nach dem
Zielgedächtnis überhaupt noch etwas bringt, entscheidet die Messung.

**Wirkung noch nicht gemessen.** Zum Zeitpunkt der Änderung gab es keinen
Spielzugriff. Nachzutragen nach dem nächsten Deploy über `prof.baseline(...)`
und `prof.compare(...)`.

## Runde 2026-08-06: Der Miner steht und fördert (Plan 10, Runde 2)

Anlass ist dieselbe Messung: fünfzehn Miner, elf davon kosten 0,01–0,06 CPU je
Tick, **vier** kosten 0,14 bis 0,39. Ein Miner steht auf seinem Container und
erntet — diese Spreizung durfte es nicht geben. Ursache waren zwei Sackgassen
im Standortzweig, aus denen `doJob` zurückkehrte, ohne einen Zustand erreicht
zu haben. Der Creep wiederholte dann in **jedem** weiteren Tick seines Lebens
Quellensuche, `findInRange` und bis zu acht Bauanfragen.

| Was | Warum | Wirkung |
| --- | --- | --- |
| Nimmt ab RCL 6 kein Nachbarfeld eine **Link**baustelle an, wird jetzt trotzdem `onPosition` gesetzt. | Vorher fiel der Zweig durch, ohne einen Zustand zu setzen. Kein Ausgang des Standortzweigs verlässt `doJob` mehr, ohne dass `onPosition` steht oder eine Baustelle angelegt wurde. | Die vier teuren Miner fallen auf das Niveau der übrigen elf. |
| Nimmt kein Nachbarfeld eine **Container**baustelle an, wird `memory.pos` auf das erste Feld ohne Wandterrain gesetzt — bisher tat das nur der `ERR_FULL`-Fall. | Dieselbe Sackgasse eine Ebene früher und schlimmer: ohne `pos` stand der Miner nirgends und förderte nie. | Der Miner arbeitet auch dann, wenn gerade kein Container gebaut werden kann. |
| Eine `memory.container`-Id, die nicht mehr trägt, wird nachgezogen: erst per `lookFor` auf dem **eigenen** Feld, sonst `onPosition = false` und Standplatz neu bestimmen. | Der Miner merkt sich die **Baustelle** als `container` — das fertige Bauwerk bekommt eine **neue** Id. Nach Fertigstellung zeigte die Id für den Rest des Creeplebens ins Leere, und der Container wurde nie wieder repariert. Container verfallen mit 5.000 Trefferpunkten je 100 Ticks. | Behobener Fehler mit Wirkung auf die Fördermenge, nicht nur auf CPU. |
| Die Quelle wird aus `creep.memory.source` gelesen statt per `findClosestByPath` neu bestimmt; Rückfall ist `findClosestByRange`. | Der Miner steht in diesem Moment direkt neben seiner Quelle, und deren Id steht seit dem Spawn im Memory. Eine Pfadsuche, um etwas zu bestimmen, das man schon weiß. | Eine Pfadsuche weniger je Standortbewertung. |

**Merkregel, die dabei entstanden ist und im Code steht:** eine gesetzte
`memory.container`-Id heißt „hier gehört ein Container hin", **keine** Id heißt
„hier wurde nachgesehen, es gibt keinen". Nur im ersten Fall wird nachgezogen —
sonst wäre die Endlosschleife durch die Hintertür zurück.

**Ein periodischer Wiederholungsversuch wurde erwogen und verworfen.** Der erste
Entwurf ließ einen Miner ohne Link seinen Standplatz alle 100 Ticks neu
bewerten. Das ist unnötig: der Miner wird nicht erneuert (`renewCreep` kommt im
Bot nicht vor), und `Miner._spawn` zählt einen vorhandenen Miner nur, solange
`ticksToLive > 300` (im Heimatraum 150) — der Nachfolger startet rund 200 Ticks
vor dem Ende ohne `onPosition` im Memory und durchläuft die Standortsuche
komplett neu. Der Versuch wiederholt sich damit einmal je Creepleben zum Preis
von null, während das Intervall zusätzlich einen Ausschlag erzeugt hätte: bei
`Game.time % 100` schlagen alle linklosen Miner im selben Tick zu.

Dieselbe Begründung trägt eine bewusst offen gelassene Lücke: baut jemand
**später** einen Container neben eine Quelle, deren Miner keinen hat, merkt der
laufende Miner das nicht. Ihn danach suchen zu lassen hieße, in jedem Tick eine
Umgebungssuche zu machen — genau die Kosten, die diese Runde entfernt. Sein
Nachfolger übernimmt den Container korrekt.

Nebenbei aufgefallen: `LOOK_TERRAIN` fehlte in `tests/support/screeps-stubs.ts`.
Dieselbe Tabelle stellt auch die Welt für `pnpm smoke`, dort fiel die Konstante
also in den Proxy für Unbekanntes und war `0`. Jetzt mit dem echten Wert
eingetragen, zusammen mit `ERR_RCL_NOT_ENOUGH` und `FIND_MINERALS`.

**Wirkung noch nicht gemessen.** Zum Zeitpunkt der Änderung gab es keinen
Spielzugriff. Nachzutragen nach dem nächsten Deploy.

## Runde 2026-08-06: Logistik nach Job geschnitten — `filler` und `hauler` (Plan 10, Runde 3)

`Debitor.doJob` bediente vier Jobs in einer `if`-Kaskade: Heimatversorgung,
Remote-Transport, Freelancer, Notfall. Jeder Creep wertete in jedem Tick auch
die Bedingungen der drei Jobs mit aus, die er nicht hat — Tombstones, Drops,
Ruinen, Mineralienverkauf aus dem Storage, Terminal, Labs. Ein Creep, dessen
einziger Job „Extension füllen" ist, zahlte für alles davon mit. Bei 38,7 %
Anteil war das der teuerste Posten des Bots.

| Was | Warum | Wirkung |
| --- | --- | --- |
| Neue Rolle **`filler`**: Storage → Spawn, Extensions, Türme, nur im eigenen Raum. Kein `goToWorkroom`, keine Distanzmessung, kein Tombstone-/Drop-/Ruinen-Scan, kein Mineralienverkauf, kein Terminal, kein Lab. | Der Job, der im ausgebauten Raum übrig bleibt, ist kurz und immer derselbe. Er verdient eine Rolle, die nur ihn kann. | Ersetzt den Freelancer-Debitor. Rumpf unverändert `BODIES.debitorWithoutContainer`. |
| Neue Rolle **`hauler`**: Quellcontainer → Storage, nur im eigenen Raum, einer je Container. | Übernimmt den containergebundenen Debitor für `home == workroom`. Entfällt je Quelle, sobald deren Link wirklich abliefert (`linksDeliver`). | Rumpf unverändert `BODIES.debitor`. |
| `Debitor.spawn` steigt für den Heimatraum **mit Storage** aus. | Damit schließen sich die drei Zuständigkeiten gegenseitig aus: kein Raum wird von beiden bedient und keiner von keinem. Am **Bauwerk** festgemacht, nicht am RCL — ein Raum kann RCL 4 erreicht haben, ohne das Storage gebaut zu haben. | `Debitor.doJob` bleibt **unverändert**: Rollennamen stehen im Creep-Memory, die lebenden Debitoren müssen ihre bis zu 1500 Ticks zu Ende arbeiten. Die toten Zweige fallen in einem späteren Commit weg. |
| `linksDeliver` von `roles/debitor.ts` nach `controller/link-list.ts` verschoben. | Seit es mit `hauler` einen zweiten Aufrufer gibt, gehört die Frage „liefert das Linknetz wirklich ab?" zur Linkliste. | Keine Verhaltensänderung. |
| **Spawn-Priorität geändert:** `filler` steht in `roles/index.ts` ganz vorn, `hauler` direkt hinter dem `linkkeeper`. | Sind Spawn und Extensions leer, spawnt der Raum überhaupt nichts mehr — auch keinen Ersatzfiller. Wer den Spawn füttert, muss vor allen stehen, die daraus bezahlt werden. Der Hauler ist wie der Linkkeeper eine Durchsatzsperre: ohne ihn läuft der Quellcontainer über und der Miner fördert ins Leere. | Verhaltensänderung an der Spawnreihenfolge. |

**Keine neue Config-Option und keine neue Zahl.** Die Absicht „dieser Raum soll
Logistik haben" steht schon in `sendDebitor`; die Rumpfprofile sind die, mit
denen Freelancer und Containerdebitor heute schon fahren. Diese Runde teilt
Rollen auf, sie dimensioniert nicht um — eine neue Zahl würde die Messung
verfälschen, die den Nutzen belegen soll. Ein Filler je Raum genügt nach
Durchsatz (20 Energie je Tick, rund zehn Ticks Umlauf → vier `CARRY` nach
`docs/knowledge/efficiency/energy-economy.md`); `debitorAsFreelancer` bleibt als
Obergrenze erhalten, damit Räume mit mehr Freelancern nichts verlieren.

**Eine Falle, die beim Gegenlesen auffiel:** der Notfallfiller trägt `notfall:
false`, nicht `true`. Das Flag steuert im Debitor einen eigenen Zweig in
`doJob`, den der Filler gar nicht hat — es hätte hier nur eine Nebenwirkung:
`controller/spawn.ts` überspringt für einen Spawn, unter dessen Heimatcreeps ein
`notfall` steht, das Spawnen **aller anderen** Arbeitsräume. Ein Notfallfiller
hätte die Remote-Räume also bis zu 1500 Ticks blockiert. Dieselbe Falle hat der
Notfallminer schon einmal gestellt.

**Wirkung noch nicht gemessen.** Zum Zeitpunkt der Änderung gab es keinen
Spielzugriff. Nachzutragen nach dem nächsten Deploy.

## Runde 2026-08-06: RCL8-Upgrader schöpft die erlaubte Rate aus (Plan 04)

GCL wächst **ausschließlich** aus Controller-Upgrades und ist die Erlaubnis,
einen weiteren Raum zu claimen. Bei RCL8 nimmt der Controller 15 Energie je Tick
an — der Bot schöpfte davon rund **3 %** aus. Zwei Ursachen, beide behoben:

| Was | Warum | Wirkung |
| --- | --- | --- |
| `BODIES.upgraderRcl8`: 4 WORK / 18 CARRY / 18 MOVE → **15 / 5 / 5**. | `UPGRADE_CONTROLLER_POWER` ist 1 Energie je WORK und Tick, die Grenze bei RCL8 liegt bei 15 — fünf Sätze zu drei WORK schöpfen sie genau aus. 18 CARRY waren 900 Tragfähigkeit für einen Creep, der am Controller-Link steht und 15 Energie je Tick verbraucht; wenige MOVE genügen, weil er danach steht. | Kosten 2000 Energie bei 25 Teilen. Die Energiekapazität eines RCL8-Raums liegt bei 12 900, der Rückfall greift dort nie. |
| Die Tickdrossel (`sparmodus`, `Game.time % level`) gilt ab RCL8 **nicht** mehr. Stattdessen entscheidet der Vorrat: gearbeitet wird bei mehr als 100 000 Energie im Storage — oder wenn `ticksToDowngrade` unter 100 000 fällt. | Die Tickdrossel achtelte die Leistung unabhängig davon, **ob** Energie da ist. Bei RCL8 ist RCL-Fortschritt kein Ziel mehr und der Raum hat typischerweise Überschuss; die richtige Frage ist der Vorrat, nicht der Tick. | Bei Überschuss 15 statt 0,5 Energie je Tick in den Controller — rund der dreißigfache GCL-Fortschritt je RCL8-Raum, und der Storage wird dabei abgebaut. |

**Die Arbeitsschwelle liegt bewusst unter der Spawnschwelle.** `spawn()` verlangt
weiterhin 250 000 Energie im Storage, bevor bei RCL8 überhaupt ein Upgrader
entsteht; gearbeitet wird bis 100 000 herunter. Mit derselben Zahl auf beiden
Seiten verstummte der Upgrader genau in dem Moment, in dem er anfängt, den
Überschuss abzubauen.

**Der Downgrade-Timer schlägt den Vorrat.** Dieselbe Grenze prüfen jetzt
`spawn()` und die Arbeitsdrossel — sonst bestellte der eine einen Upgrader, den
der andere verstummen ließe, und der Raum verlöre eine Stufe.

**Nicht in dieser Runde:** die Tickdrossel bei RCL6 und RCL7. Dort greift sie mit
Faktor 1/6 bzw. 1/7 und kostet echten RCL-Fortschritt, nicht nur GCL — das ist
ein eigener Schritt mit eigener Messung (Plan 04, Punkt 3).

`tests/creep-bodies.test.ts` führt die alten Formeln als Referenz mit und hat die
Rumpfänderung sofort gemeldet — genau dafür ist der Test da. `upgraderRcl8` steht
dort jetzt in einer benannten Liste `deliberatelyChanged` statt die Prüfung
aufzuweichen: ein **neu** hinzugefügtes Profil ohne Referenz fällt weiterhin auf.

**Wirkung noch nicht gemessen.** Kennzahl nach dem nächsten Deploy ist der
Controller-Fortschritt je 1000 Ticks, dazu die Storage-Energie als Gegenprobe,
dass der Upgrader den Raum nicht leerzieht.

**Beim Testen der Drossel gefunden und mitbehoben:** stand `memory.sparmodus`
und hatte der Raum **keinen** Controller — ein Upgrader auf dem Weg durch einen
Korridorraum —, rechnete die alte Zeile `Game.time % creep.room.controller!.level`
auf `undefined` und warf einen `TypeError`. `main.ts` wirft Rollenfehler weiter,
das hätte also den **kompletten Tick** abgebrochen: alle Rollen nach dem
Upgrader und den Timing-Controller mit Türmen und Spawn. `_mayWork` steigt jetzt
vor der Drossel aus, wenn kein Controller da ist.

## Runde 2026-08-06: Ein Feind-Scan je Raum und Tick (Plan 05, Schritte 1 und 2)

**Ohne Verhaltensänderung.** Der Bot tut danach exakt dasselbe, nur mit weniger
Raumscans. Anlass ist Plan 05: bei zehn Räumen wächst die **Spitzenlast** je Tick
linear mit der Raumzahl, und die Spitze entscheidet, ob der Tick durchläuft —
greift das CPU-Limit, bricht das Spiel den Rest stillschweigend ab.

| Was | Warum | Wirkung |
| --- | --- | --- |
| `defence.ts::tower()` rief im Reparaturzweig **zweimal** `room.find(FIND_STRUCTURES)` ohne Filter auf — einmal für den Hits-Schnappschuss, einmal für den Schadensvergleich. Jetzt eine Variable. | Zwischen beiden Aufrufen passierte nichts, das die Liste ändern könnte (kein `destroy`, kein Bau, kein anderer `find`) — geprüft, bevor zusammengelegt wurde. | Ein Strukturscan je Raum und Tick weniger im Reparaturzweig. |
| Neue Klasse `HostileScanCache`: `check()` und `tower()` teilen sich einen `FIND_HOSTILE_CREEPS`-Scan je Raum und Tick. | Beide durchlaufen `bot.room` und fragten denselben Raum im selben Tick zweimal ab, obwohl sich der Feindbestand innerhalb eines Ticks nicht ändert. | Halbiert die Feind-Scans in den Ticks, in denen beide laufen (alle 7). |

Drei Eigenschaften des Caches, die bewusst so sind:

- **Er gilt genau einen Tick.** Der Vergleich läuft gegen `Game.time`, nie gegen
  ein „schon gesehen"-Flag — damit ist er auch bei einem Tickwechsel ohne
  Neuladen korrekt. Das Dreitickfenster des Vergleichsbots übernehmen wir
  **nicht**: Feinde bewegen sich, und Turmfeuer ist taktisch.
- **Er lebt im Modul, nicht in `Memory`.** Ein globaler Reset leert ihn von
  selbst, und er kostet keine Tickkosten beim `JSON.parse` von `Memory`.
- **Er wächst nicht.** Es gibt höchstens so viele Einträge wie Räume in
  `bot.room`; ältere Ticks werden beim nächsten Zugriff überschrieben statt
  zusätzlich gespeichert.

**`tower()` wird ausdrücklich nicht gestaffelt.** Turmfeuer muss in jedem Tick
für jeden bedrohten Raum laufen. Gestaffelt werden `check()` und die Tagesjobs,
das ist ein eigener Schritt.

Beim Lesen gemeldet, **nicht** geändert: im nicht-`needDefence`-Zweig von
`tower()` steht ein dritter Strukturscan für den regulären Reparaturmodus
(`Game.time % 3 == 2`). Er liegt in einem anderen Zweig als die beiden oben und
gehört in einen eigenen Schritt.

## Runde 2026-08-06: Türme laufen vor der Creep-Schleife (Plan 05, Schritt 3)

**Verhaltensänderung** — eine Reihenfolgeänderung im Tick, die nur im Mangelfall
überhaupt sichtbar wird.

`main.ts::loop` arbeitete erst alle Creeps ab und rief **danach**
`timer.controll()` — und damit Türme, Spawncontroller und Verteidigungsscan.
Greift das CPU-Limit während der Creep-Schleife, bricht das Spiel den Tick ab:
alles Spätere findet stillschweigend nicht mehr statt, die Türme hätten in so
einem Tick **nicht geschossen**.

`timing.ts` hat dafür `controllCritical()` bekommen: Raum-Memory und Türme.
`main.ts` ruft es als erstes, noch vor der Visualisierungsschleife. Der Rest von
`controll()` bleibt hinter den Creeps.

Zwei Entscheidungen dabei:

- **Der Spawncontroller bleibt hinten.** Plan 05 nennt „Türme und Notfall-Spawn",
  aber einen eigenen Einstieg nur für den Notfallspawn gibt es nicht — ihn
  herauszulösen wäre ein Umbau des Spawncontrollers. Er nach vorn zu ziehen wäre
  zudem kontraproduktiv: er läuft nur alle fünf Ticks, kostet je Aufruf ein
  Vielfaches der Türme (5,47 gegen 0,40 gemessen) und würde die Spitze
  vergrößern statt verkleinern. Ein Tick Verzögerung beim Spawnen ist folgenlos,
  ein ausgelassener Turmschuss kann den Raum kosten.
- **`memoryController.init()` wandert mit nach vorn.** Es muss vor jedem Zugriff
  auf `Memory.rooms` laufen — auch vor der Visualisierungsschleife in `main.ts`,
  die es bisher nur über einen `catch` nachholte.

Gemessen wird beides unter demselben Profilerabschnitt `timing`, damit die
Zahlen mit den bisherigen Fenstern vergleichbar bleiben.

Nebenbei: `Game.cpu.generatePixel` fehlte im gemeinsamen Teststub. Der erste
Test, der `controll()` aufrief, musste seinen Tick deshalb um die Pixelerzeugung
herumlegen. Jetzt nachgetragen und mitgezählt (`cpu.generatePixelCalls`).

## Runde 2026-08-06: Raumarbeit gestaffelt statt gebündelt (Plan 05, Schritt 4)

**Verhaltensänderung an der Taktung, nicht an der Arbeit.** Jeder Raum wird
genauso oft bearbeitet wie vorher — nur nicht mehr alle im selben Tick. Die
Summe bleibt gleich, die **Spitze** sinkt, und die Spitze entscheidet, ob der
Tick durchläuft: greift das CPU-Limit, bricht das Spiel den Rest stillschweigend
ab.

| Was | Vorher | Jetzt |
| --- | --- | --- |
| `defence.ts::check()` | alle 7 Ticks, dann **alle** neun Räume gebündelt | jeden Tick gerufen, bearbeitet je Raum nach `(Game.time + Position) % 7` — ein bis zwei Räume je Tick, jeder Raum weiterhin alle 7 Ticks |
| Tagessequenz `daylie()` | sieben feste `case`-Nummern, jede Nummer ein Job über **alle** Räume | ein Paar aus (Job, Raum) je Tick: fünf staffelbare Jobs × Raumzahl, dazu Slot 0 und 1 ungestaffelt |
| `findAndSaveRoomWalls`, `findAndSaveRoomContainer`, `findAndSaveRoomTower`, `rebuildRoads`, `planReceiverLinks` | liefen über alle Räume | haben einen optionalen ersten Parameter `onlyRoom?: string`. **Ohne** Argument unverändert alle Räume — die Funktionen sind auch von Hand aus der Konsole aufrufbar. |

`clear()` und `findAndSaveTerminals()` bleiben ungestaffelt: beide bauen **eine**
Liste über alle Räume auf und müssen sie in einem Zug schreiben, häppchenweise
wäre sie zwischendurch unvollständig. Das steht jetzt als Kommentar an beiden
Funktionen.

**`tower()` wird weiterhin nicht gestaffelt.** Turmfeuer ist taktisch und muss in
jedem Tick für jeden bedrohten Raum laufen.

Ein Nebeneffekt, der in die richtige Richtung geht: `planReceiverLinks()` legte
bisher „höchstens eine Baustelle **je Raum**" an — bei neun Räumen also bis zu
neun im selben Tick, denn die Schleife über die Räume hatte kein `break`. Durch
die Staffelung ist es jetzt höchstens **eine je Tick**. Das ist strenger als
vorher, nicht lockerer.

### Befund, bewusst nicht behoben: der Straßenwiederaufbau arbeitet auf einem toten Datenstand

`memory.ts::findAndSaveRoads()` ist die **einzige** Stelle, die
`Memory.rooms[<raum>].roads` füllt — und sie wird nirgends aufgerufen. Der
Tagesjob `rebuildRoads` liest genau diese Liste (`if (!roomMemory?.roads)
continue;`) und tut ohne sie nichts.

Das ist keine Migrationslücke: im alten Bot steht der Aufruf **auskommentiert**
in `prod/controller.timing.js:79` (`// case 6: memoryControll.FindAndSaveRoads();`).
Jemand hat das absichtlich abgeschaltet. Der TypeScript-Bot hat den Zustand
getreu übernommen.

Damit gibt es zwei Möglichkeiten, und beide sind eine Entscheidung des
Betreibers, keine technische Frage:

- Die Straßenliste im laufenden Spiel stammt noch vom alten Bot und wird nie
  aufgefrischt. `rebuildRoads` baut dann Straßen nach einem alten Schnappschuss
  wieder auf — inklusive solcher, die man absichtlich hat verfallen lassen.
- Oder es gibt gar keine Liste mehr, dann ist der ganze Zweig samt
  `saveRoads`-Flag in vier Räumen toter Code.

Nachzusehen ist das im Spiel mit einem Blick auf
`Memory.rooms["E58N6"].roads`. Bis dahin bleibt der Code, wie er ist —
etwas wieder einzuschalten, das ein Mensch bewusst abgeschaltet hat, wäre keine
Fehlerbehebung.

## Runde 2026-08-06: CPU-Stufen als Ausfallsicherung (Plan 05, Schritt 5)

Neu: `controller/cpu-budget.ts` mit zwei Fragen — `mayRunLow()` und
`mayRunNormal()`. Verdrahtet in `timing.ts`.

| Stufe | Inhalt | Fällt aus, wenn |
| --- | --- | --- |
| kritisch | Türme, Raum-Memory (`controllCritical`) | **nie** — fragt gar nicht erst nach |
| normal | Spawncontroller, Verteidigungsscan | Bucket unter 500 |
| niedrig | Statuslog, Terminal und Markt, Tagesjobs | Bucket unter 2000 **und** der laufende Tick hat `Game.cpu.limit` schon überschritten |

**Es ist eine Ausfallsicherung, kein Effizienzgewinn.** Bei vollem Bucket und
einem Tick weit unter dem Limit gibt es nichts zu sparen; eine Drossel, die im
Normalbetrieb etwas abschaltet, wäre eine Verschlechterung ohne Gegenwert. Der
Nutzen zeigt sich, wenn das CPU-Limit mitten im Tick greift: dann bricht das
Spiel den Rest **stillschweigend** ab, und ohne Stufen fällt aus, was zufällig
hinten steht, statt dessen, was am wenigsten wehtut.

**Warum die niedrige Stufe zwei Bedingungen hat.** Der Bucket allein wäre das
falsche Signal: er wird regelmäßig von der Pixelerzeugung auf 0 gefahren —
gemessenes Mittel 2043, Minimum 1545 — und das ist gewollt, kein Notstand. Eine
reine Bucket-Schwelle hätte Terminal und Markt nach jedem Pixel für rund hundert
Ticks stillgelegt, also gut ein Zehntel der Handelszeit. Erst die zweite
Bedingung (`getUsed() > limit`) macht daraus eine echte Notlage; bei gemessenen
9,12 CPU je Tick greift sie im Normalbetrieb nie.

**Warum `Game.cpu.limit` und nicht `tickLimit`.** `tickLimit` enthält den Bucket
und liegt deshalb fast immer bei 500 — eine Prüfung dagegen spräche nie an.
`limit` ist das, was ein Tick verbrauchen darf, ohne den Puffer anzugreifen.

Ausfälle werden gemeldet, aber höchstens alle 100 Ticks je Stufe: ein Ausfall
gehört sichtbar gemacht, ein Dauerzustand darf die Konsole nicht unbrauchbar
machen — und die Meldung selbst kostet in einem Tick, der ohnehin knapp ist.

## Runde 2026-08-06: Quellen und Minerale werden erhoben, nicht konfiguriert (Plan 02, Schritt 1)

Neu: `controller/room-inventory.ts` mit `energySources(raum)`,
`mineralSources(raum)` und dem Tagesjob `discover(raum?)`. Miner, Debitor und
Hauler lesen die Quellen jetzt von dort statt direkt aus `bot.room[...]`.

**Warum das mehr ist als Aufräumen:** `controller/spawn.ts` überspringt jeden
Raum ohne passenden `bot.room`-Eintrag vollständig. Ein frisch geclaimter Raum
tut also gar nichts, bis jemand die Quellen-Ids von Hand nachträgt — bei zehn
Räumen sind das rund dreißig Zeilen Handarbeit je Raum. Das ist die direkte
Bremse für das eigentliche Ziel, viele Räume zu betreiben.

**Die Config gewinnt.** Ist in `config.ts` eine Liste gesetzt und nicht leer,
gilt sie; erst sonst entscheidet die Erhebung. Damit verhält sich jeder heute
laufende Raum unverändert, und die Automatik greift nur dort, wo bisher nichts
steht. Eine Fehlerkennung lässt sich außerdem im Spiel sofort übergehen, ohne
Codeänderung. Eine **leere** Liste zählt dabei wie keine — sonst könnte ein
Raum, in dem jemand `energySources: []` stehen ließ, nie fördern.

**Keine Invalidierung, und das ist kein Versehen.** Quellen und Minerale werden
weder zerstört noch gebaut noch verschoben. Anders als bei Containern, Türmen
oder Links gibt es nichts, was verfallen könnte: erhoben wird einmal, danach
kostet der Tagesjob nur noch einen Blick ins Memory. Eine gelöschte Raum-Memory
erhebt sich beim nächsten Durchgang von selbst neu.

**Sicht ist Voraussetzung**, und daraus folgt die Reihenfolge für einen neuen
Raum: erst fährt der Claimer hin (der hängt an keiner Quellenliste), damit
entsteht Sicht, im nächsten Tagesdurchgang stehen die Quellen im Memory, und
erst danach spawnen Miner. Das ist die einzige Reihenfolge, die ohne Handarbeit
auskommt.

Die Schleifen in den drei Rollen wurden bei der Gelegenheit von
`for (var id in ...)` mit `(... as any)[id]` auf `for (const sourceId of ...)`
umgestellt — dieselben Stellen, keine Logikänderung. Insbesondere bleibt der
Unterschied erhalten, dass der Mineralzweig des Miners bei einem nicht
auflösbaren Vorkommen mit `return false` aus der ganzen Methode aussteigt,
während die Energiezweige `continue` machen.

**Noch offen aus Plan 02:** `mineralContainerId` und `prioBuildings` stehen
weiter in der Config. Schritt 2 (Links geometrisch zuordnen) ist mit dem
Linknetz aus Plan 09 bereits erledigt.

## Runde 2026-08-06: Umlaufmessung als eigene Klasse (Plan 03, Vorbereitung zu Punkt 3)

**Ohne Verhaltensänderung.** Neu: `creep/round-trip.ts` mit der Klasse
`RoundTrip`. Der Debitor benutzt sie, rechnet aber Bit für Bit dasselbe wie
vorher.

Der Debitor ist die einzige Rolle im Bot, die ihre Dimensionierung **misst**
statt sie zu schätzen: er zählt die tatsächliche Umlaufzeit seiner Creeps und
leitet daraus Tragfähigkeit und Anzahl ab. Das ist die bessere Lösung — der
Vergleichsbot schätzt aus Raumsprüngen und widerspricht sich dabei an zwei
Stellen selbst. Nur steckte sie mitten in `Debitor.bodyFor` fest, weshalb
`transfer.ts` weiter stumpf `min(25, energieKapazität / 100)` rechnet: bei RCL8
also 25 CARRY und 25 MOVE für 2500 Energie und 150 Spawnticks, unabhängig davon,
ob der Weg fünf oder fünfzig Felder lang ist.

Die Memory-Schlüssel kommen aus dem Konstruktor
(`{ samples: "distances", size: "needDebitorSize", count: "needDebitors" }`).
Das ist der Grund für die Klasse: die bestehenden Schlüssel stehen im laufenden
Spiel und dürfen sich nicht ändern, aber ein zweiter Nutzer braucht eigene, um
dem Debitor nicht seine Messreihe wegzunehmen.

Die beiden wortgleich duplizierten `checkHarvest`-Rückrufe in `Debitor.doJob`
sind dabei zu einer Methode zusammengefasst — dieselbe Stelle, keine
Logikänderung.

### Drei Eigenarten, wörtlich erhalten statt begradigt

- **Der „Median" ist keiner.** Der Index ist `ceil(länge × 0,5)` auf der
  sortierten Reihe, also bei gerader Länge der obere der beiden mittleren Werte.
- **Die Festschreibung greift bei rund 61 Messungen, nicht bei 31.** Verglichen
  wird nicht die Zahl der Messwerte, sondern der Medianindex — `length > 30`
  steht dort für „mehr als 30 **Indexschritte**". Das ist die überraschendste
  Stelle der ganzen Arithmetik und jetzt als Test festgehalten.
- **Eine einzige Messung liefert `NaN`**, weil der Medianindex dann außerhalb
  des Arrays liegt. Abgefangen wird das weiter unten in `carryMove`. Auch das ist
  festgehalten, damit es nicht unbemerkt kippt.

Nachgewiesen wurde die Gleichwertigkeit durch einen Zahlenvergleich alt gegen
neu über fünf Messreihen (1, 5, 10, 31, 40 Werte) mal drei Energiekapazitäten
(300, 2300, 12900) plus vier Reihen um den Umschlagpunkt herum — alle Ergebnisse
identisch.

**Noch offen:** `transfer.ts` benutzt die Klasse noch nicht. Das ist der
eigentliche Punkt 3 des Plans und kommt als eigener Commit mit
Verhaltensänderung.

## Runde 2026-08-06: Transfer misst seine Strecke (Plan 03, Punkt 3)

**Verhaltensänderung, lokal.** `transfer` dimensionierte seinen Rumpf bisher aus
der Raumenergie: `min(25, energieKapazität / 100)` Paare aus CARRY und MOVE. Bei
RCL8 sind das **25 CARRY und 25 MOVE — 2500 Energie und 150 Spawnticks**,
unabhängig davon, ob der Weg fünf oder fünfzig Felder lang ist. Der Durchsatz
hängt aber an der Strecke und an der Quelle, nicht an der Tragfähigkeit; ein zu
großer Träger kostet nur Spawnzeit ohne Mehrertrag.

Jetzt misst die Rolle ihren Umlauf wie der Debitor und benutzt `RoundTrip` mit
**eigenen** Memory-Schlüsseln (`transferDistances`, `transferSize`,
`transferCount`), damit die Messreihe des Debitors für denselben Arbeitsraum
unangetastet bleibt.

Was das an Zahlen bedeutet, bei 12 900 Energiekapazität:

| Gemessener Umlauf | Rumpf vorher | Rumpf jetzt |
| --- | --- | --- |
| 10 Ticks | 25 CARRY + 25 MOVE, 2500 Energie, 150 Spawnticks | 4 CARRY + 4 MOVE, 400 Energie, 24 Spawnticks |
| 100 Ticks | 25 CARRY + 25 MOVE, 2500 Energie, 150 Spawnticks | 20 CARRY + 20 MOVE, 2000 Energie, 120 Spawnticks |

Solange **noch keine** Messung vorliegt, bleibt es beim alten Profil — der erste
Transfer eines Raumpaars muss überhaupt erst fahren, damit es etwas zu messen
gibt.

**Die Anzahl bleibt bei einem Transfer je Spawn und Zielraum.** `RoundTrip`
leitet zwar auch eine Creepzahl ab und schreibt sie ins Memory, aber sie hier zu
benutzen wäre eine zweite, größere Verhaltensänderung: mehrere Transfer-Creeps
können den Heimat-Storage schneller leeren, als er sich füllt. Ob das gewollt
ist, entscheidet eine Messung im Spiel und nicht diese Runde. Der Grund steht als
Kommentar an der Stelle.

**Nebenbei behoben:** `creep.memory.distance` wurde beim Spawnen nie auf `0`
gesetzt, der erste Tick rechnete also `undefined + 1` und der Zähler stand auf
`NaN`. Im Spiel heilt das über die JSON-Serialisierung von `Memory` — aus `NaN`
wird `null`, und `null + 1` ist 1 —, im Testgeschirr ohne diesen Umweg aber
nicht: dort bliebe der Zähler dauerhaft `NaN`, und `RoundTrip.record` verwirft
solche Werte. Jetzt bei Debitor **und** Transfer mit `distance: 0` initialisiert.
