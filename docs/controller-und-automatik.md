# Controller und Automatik

## Tick-Ablauf und Fehlerbehandlung (`main.ts`)

`loop()` zeichnet zuerst Raum-Visuals und initialisiert Raum-Memory bei Bedarf neu, dann arbeitet es `Memory.creeps` ab: Creeps ohne Rolle werden suizidiert, Creeps mit einer im Code nicht mehr existierenden Rolle (`jobs[role]` liefert nichts, z. B. nach einer Umbenennung) werden gemeldet und **übersprungen, nicht suizidiert** — sonst würde eine Rollenumbenennung die ganze betroffene Population löschen. Für jeden verbleibenden Creep läuft `jobs[role].doJob(creep)` einzeln in `try`/`catch`; ein Fehler bleibt auf diesen Creep begrenzt, die Schleife läuft weiter. `controller/timing.ts::controll()` wird danach in jedem Fall ausgeführt, ebenfalls in `try`/`catch` abgesichert.

Jede gefangene Fehlerart (unbekannte Rolle, Rollenfehler je Rollenname, Fehler in `controll()`) wird bei jedem Auftreten in die Konsole geloggt; zusätzlich löst das erste Auftreten je Fehlerart bis zum nächsten Global-Reset eine `Game.notify()`-Mail aus — so bleibt ein Dauerfehler auch außerhalb der Konsole sichtbar, ohne eine Mailflut zu erzeugen.

## Zeitsteuerung (`controller.timing.js`)

`controll()` wird am Ende jedes Hauptticks ausgeführt. Es initialisiert Raum-Memory und führt die Towersteuerung in jedem Tick aus. Anschließend bearbeitet es einen Terminal, ausgewählt per `Game.time % Memory.terminals.length`: bei über 80 % Füllstand wird dessen `sell()` dreimal aufgerufen, sonst einmal; danach versucht es `buyPixel()`.

Periodische Aufgaben:

| Intervall | Aufgabe |
| --- | --- |
| jeder Tick | Linknetz senden (`links.sendAll()`) |
| 3 Ticks | Bei vollem CPU-Bucket ein Pixel generieren |
| 5 Ticks | Spawncontroller ausführen |
| 7 Ticks | Sichtbare Räume auf Feinde, Cores und Nukes prüfen |
| 11 Ticks | Raumstatus loggen |
| 1000 Ticks | Linklisten neu erheben (`links.discoverAll()`) |
| ca. täglich (28.800 Ticks) | Memory bereinigen, Wände/Container/Türme/Terminals speichern, Straßen wiederaufbauen und Empfängerlinks planen |

Die tägliche Sequenz verteilt ihre Aufgaben auf aufeinanderfolgende Ticks, und zwar in zwei Klassen: **zwei ungestaffelte Slots** ganz vorn (Slot 0 `memory.clear()`, Slot 1 `findAndSaveTerminals()` — beide bauen *eine* Liste über alle Räume und müssen sie in einem Zug schreiben) und danach **sechs gestaffelte Jobs** (`STAGGERED_DAILY_JOBS` in `controller/timing.ts`), von denen je Tick genau ein Paar aus Job und Raum läuft. Bei neun Räumen dauert der gestaffelte Teil also 54 Ticks. Das Speichern von Straßen ist aktuell auskommentiert; ohne bereits vorhandenes `Memory.rooms[name].roads` kann der darauffolgende Straßenbau nichts wiederherstellen.

Die Linkliste hängt bewusst **nicht** an der Tagessequenz, sondern an `% 1000`: sie heilt sich selbst, wenn ein Link *verschwindet* (eine Id ohne Objekt verwirft die ganze Liste), aber nicht, wenn einer *dazukommt* — und genau das tut der Linkplaner. 28.800 Ticks wären dafür zu lang.

`memoryController.clear()` (`controller/memory.ts:63`) räumt `Memory.rooms`-Einträge auf, die keinen Eintrag mehr in `bot.room` haben — der einzige Mechanismus, der das tut. Er läuft aber nur bei `Game.time % 28800 === 0`, also **einem Tick je Tagesdurchgang**, und zusätzlich nur, wenn `cpuBudget.mayRunLow()` zustimmt. Ein Raum, der aus der Config entfernt wird, bleibt deshalb bis zu einem Tag lang in `Memory.rooms` stehen, und `writeStatus()` (das über **alle** Einträge in `Memory.rooms` berichtet, nicht nur über `bot.room`) meldet in dieser Zeit weiter Ereignisse aus ihm. Seine Creeps arbeiten dabei bis zu 1500 Ticks lang ins Leere, weil kein Spawncontroller sie ersetzt, aber auch keiner sie stoppt.

Dagegen gibt es die **Aufräumflagge `cleanup`** (`controller/cleanup.ts`, verdrahtet in `controll()` jeden Tick und ungetaktet, direkt vor dem Spawncontroller): Ort und Raum der Flagge sind gleichgültig, `Game.flags` ist weltweit. Gelb (`COLOR_YELLOW`) berichtet nur, was gelöscht *würde*; rot (`COLOR_RED`) ruft `clear()` sofort auf, suizidiert jeden Creep, dessen `workroom` **oder** `home` nicht mehr in `bot.room` steht, und entfernt die Flagge selbst. Ausgelöst wird nur bei einer **Farbänderung** — dasselbe Flankenmuster wie bei der Profilerflagge `prof` weiter unten, mit der zuletzt verarbeiteten Farbe in `Memory.cleanup.flagColor` statt im Heap. Ohne gesetzte Flagge kostet der Aufruf nur einen Zugriff auf `Game.flags`.

## Spawncontroller (`controller.spawn.js`)

Der Controller iteriert über freie Spawns und dann über alle konfigurierten Arbeitsräume. Ein Notfallcreep der Heimatbasis blockiert Fremdraum-Spawns. Die Reihenfolge ist:

1. konfigurierte Energie-Transfers (`global.transfer`)
2. Defender bei Verteidigungsbedarf oder Invader Core
3. alle Rollen aus `creep.jobs`, sofern der Spawn dem Raum zugeordnet ist

Während ein Invader Core gemeldet ist, werden für diesen Arbeitsraum keine normalen Rollen erzeugt. Die tatsächliche Rollenreihenfolge ist die Property-Reihenfolge der Jobtabelle: Debitor, Transfer, Miner, Claimer, Builder, Repairer, Upgrader, Fern-Upgrader, Defender, Wally.

## Verteidigung (`controller.defence.js`)

`check()` setzt für sichtbare, verteidigungsfähige Räume `needDefence` anhand feindlicher Creeps, `invaderCore` anhand feindlicher Invader Cores und `nuke` anhand anfliegender Nukes. Bei Nukes wird einmalig eine Screeps-Benachrichtigung ausgelöst und die Einschlagpositionen werden als `nukepos` gespeichert.

`tower()` sortiert während `needDefence` die feindlichen Creeps nach Bauteilkosten absteigend und prüft der Reihe nach, ob sich ein Angriff lohnt: Für jeden Kandidaten wird der summierte Schaden aller schussfähigen Türme (Türme mit weniger als `TOWER_ENERGY_COST` Energie zählen nicht mit) über die offizielle Abstandsformel (`TOWER_POWER_ATTACK`, `TOWER_OPTIMAL_RANGE`, `TOWER_FALLOFF`, `TOWER_FALLOFF_RANGE`) gegen die konservativ summierte Heilleistung aller feindlichen Creeps (`HEAL_POWER` je `HEAL`-Teil, Boosts unberücksichtigt) verglichen. Übersteigt der Turmschaden die Heilleistung, wird dieser Gegner angegriffen. Erfüllt kein Gegner das, wechseln die Türme in den defensiven Reparaturmodus: Sie vergleichen die aktuellen Struktur-Hits mit einem zu Beginn der Verteidigung angelegten Snapshot und reparieren die erste beschädigte Struktur. Außerhalb der Verteidigung reparieren sie alle drei Ticks beschädigte Strukturen, sortiert nach `prio.repair` aufsteigend und bei Gleichstand nach anteiligem Schaden (`1 - hits/hitsMax`) absteigend — dieselbe Regel wie beim Repairer-Creep —, wenn sie ausreichend Energie haben.

## Straßenwiederaufbau (`controller.rebuild.js`)

Für Räume mit `saveRoads` und RCL mindestens 7 erstellt `rebuildRoads()` fehlende, zuvor gespeicherte Straßen erneut als Baustellen. Pro Raum werden höchstens zehn gleichzeitige Baustellen zugelassen. Erfolgreiche automatische Baustellen werden in `Memory.rooms[name].autobuild` gezählt.

## Linknetz (`controller/links.ts`, `controller/link-list.ts`)

Ein Raum hat im Zielzustand vier Links: zwei an den Quellen, einen am Spawn/Storage und einen am Controller. **Empfänger sind Controller- und Storage-Link, alle übrigen Links senden.**

`LinkList` hält den Bestand in `Memory.rooms[<raum>].links` (`{ controller, spawn, sender[] }`). Zugeordnet wird allein nach Lage: der nächste Link in Reichweite 3 zum Controller, der nächste in Reichweite 2 zum Storage, alle übrigen senden. Config-Ids gibt es dafür nicht mehr — sie trügen nicht, seit der Linkplaner Links im laufenden Spiel baut. Zeigt eine gemerkte Id ins Leere, wird die **ganze** Liste verworfen und neu erhoben. Jede geänderte Zuordnung wird auf der Konsole gemeldet, damit eine Fehlzuordnung auffällt.

Ob ein Raum überhaupt Links nutzt, beantwortet `usesLinks(raum)`: eigener Controller und ein RCL, dessen Kontingent Links zulässt (ab RCL5). Auch das steht nicht mehr in der Config.

`LinkNetwork.send()` läuft je Raum und Tick:

1. Sender sind die sendenden Links mit `cooldown === 0` und mindestens `SEND_MIN` Energie. Gibt es keinen, ist der Durchgang hier zu Ende — das ist der billige Normalfall.
2. Empfänger nach Vorrang, gefiltert auf mindestens `SEND_MIN` freien Platz: unter RCL8 zuerst der Controller-Link (Upgraden bringt dort noch RCL-Fortschritt), ab RCL8 zuerst der Storage-Link (dort zahlt Upgraden nur noch auf GCL ein).
3. Jeder Empfänger wird höchstens **einmal je Tick** bedient, damit zwei Sender nicht auf dasselbe Ziel zielen.
4. Gesendet wird mit **expliziter Menge** `min(vorhanden, frei)`. Ohne Mengenangabe sendet ein Link „alles" und läuft bei zu vollem Empfänger auf `ERR_FULL` — dann passiert gar nichts, während die Quell-Container volllaufen.

`SEND_MIN` ist `LINK_CAPACITY / 4` (200). Eine Quelle liefert 10 Energie/Tick, ein Linkpaar über 20 Felder trägt 40/Tick — der Cooldown ist also nicht der Engpass, und die Schwelle verhindert allein, dass er für eine Handvoll Energie verbrannt wird.

Gesendet wird jeden Tick statt getaktet, weil der *empfangende* Link keinen Cooldown hat: es gibt nichts, worauf man warten könnte, und jeder ausgelassene Tick wäre verlorener Durchsatz. Dieselbe Begründung trägt den Linkkeeper, der den Storage-Link jeden Tick prüft.

## Linkplaner (`controller/link-planner.ts`)

Baut die beiden Empfängerlinks selbst, ein Aufruf je Tagesdurchlauf und höchstens **eine** Baustelle je Raum. Voraussetzungen: `usesLinks` (Sicht, eigener Controller, RCL ab 5), ein freier Linkplatz laut `CONTROLLER_STRUCTURES` (RCL5 zwei, RCL6 drei, RCL7 vier, RCL8 sechs) und weniger als zehn Baustellen im Raum. Eine laufende Baustelle zählt dabei wie ein fertiger Link.

**Der Planer reserviert Plätze für die Sender.** Quell-Links baut nicht er, sondern der Miner neben seinem Quellcontainer. Ohne Reservierung würde er auf RCL5 beide erlaubten Plätze mit Empfängern belegen — ein Linknetz aus zwei Empfängern und keinem Sender bewegt nichts. Die Regel: `reserve = min(Quellen ohne Link, erlaubteLinks − 1)`, gebaut wird nur bei `freie Plätze > reserve`. Das `− 1` hält immer einen Platz für einen Empfänger frei. Bei zwei Quellen ergibt das die üblichen Ausbaustufen:

| RCL | erlaubt | reserve | Empfänger |
| --- | --- | --- | --- |
| 5 | 2 | 1 | einer |
| 6 | 3 | 2 | einer |
| 7 | 4 | 2 | zwei |
| 8 | 6 | 2 | zwei (zwei Plätze bleiben frei) |

Zuerst entsteht der Controller-Link, danach der Storage-Link. Kandidatenfelder:

- **Controller-Link:** Reichweite genau 2 zum Controller, ersatzweise 3, danach 1. Auf Abstand 2 kann ein Upgrader neben dem Link stehen und zugleich upgraden (Arbeitsdistanz 3).
- **Storage-Link:** Reichweite bis 2 zum Storage, aber nur Felder, für die ein **Standplatz des Linkkeepers** existiert — ein begehbares Feld, das an Link *und* Storage zugleich angrenzt. Ohne diesen Platz wäre der Link nicht leerbar.

Beide filtern Wandfelder, blockierende Bauwerke und blockierende Baustellen (Straße, Container und Rampart blockieren nicht). Es gewinnt das Feld mit der kleinsten Summe der Entfernungen zu den sendenden Links — der Cooldown eines Links ist seine Entfernung zum Ziel, kurze Strecken heißen Durchsatz. Gibt es noch keinen sendenden Link, dienen die Quellen als Bezug. Bei Gleichstand gewinnt das Feld mit mehr begehbaren Nachbarn, damit der Link keinen Engpass zubaut.

## Profiler (`profiler/`)

Der Server rechnet mit 20 CPU pro Tick — das ist die Obergrenze für die Zahl gleichzeitig verwalteter Räume, nicht Energie und nicht GCL. Ohne Messung lässt sich keine Verbesserung belegen, und es wird leicht an der falschen Stelle optimiert. Der Profiler liefert die Grundlinie für alle weiteren Ausbauschritte (`docs/plans/`). Er ist ein aktiver, in den TS-Bot eingebauter Nachfolger des unten beschriebenen, inaktiven `profiler.js` des alten JS-Bots.

Drei Zustände, kein einfacher Schalter:

| Zustand | Was läuft | `Game.cpu.getUsed()` je Tick |
| --- | --- | --- |
| `off` | nichts, Standard nach dem Deployment | 0 |
| `light` | Gesamttick, Bucket, CPU pro Raum, CPU pro Creep | 1 |
| `full` | zusätzlich alle Abschnitte und alle Rollen | ~15 + 1 je Creep |

Drei statt zwei Zustände, weil sich die Eigenkosten der Messung sonst nicht ermitteln lassen: Im Zustand `off` läuft überhaupt kein `getUsed()`, damit lässt sich also nicht messen, was das Messen selbst kostet. Erst der Vergleich von `light` gegen `full` über je 500 Ticks liefert diese Eigenkosten. `light` ist der sinnvolle Dauerzustand.

Bedienung über die Konsole, Handle auf `global` (wie `bot` in `globals.ts`), man tippt im Spiel also `prof.report()`:

| Befehl | Wirkung |
| --- | --- |
| `prof.on()` | Zustand `full` |
| `prof.light()` | Zustand `light` |
| `prof.off()` | Zustand `off` |
| `prof.status()` | Zustand und Restticks der Detailmessung |
| `prof.report()` | Bericht über das laufende Fenster |
| `prof.reset()` | Laufendes Fenster verwerfen und neu beginnen |
| `prof.detail(ticks)` | Detailmessung für `ticks` Ticks, danach automatische Rückschaltung mit Abschlussbericht |
| `prof.baseline(name)` | Laufendes Fenster als benannte Grundlinie festhalten |
| `prof.baselines()` | Alle festgehaltenen Grundlinien nebeneinander |

Der Zustand liegt in `Memory.profiler.mode` und übersteht einen Global-Reset — Umschalten braucht **kein** neues Deployment.

Alternativ zur Konsole schaltet eine **Flagge** namens `prof`: ihre Hauptfarbe ist der Zustand (grau = `off`, weiß = `light`, grün = `full`, rot startet die Detailmessung), und daneben zeichnet der Bot die Farbzuordnung als Room Visual. Screeps hat keine API für eigene Bedienelemente — die Flagge ist der einzige Weg, ohne Tippen zu schalten. Details in [Profiler: Befehle für die Spielkonsole](profiler-befehle.md#flaggen-schalter-statt-tippen).

Ausführlich mit Ausgabeformaten, Spaltenbedeutung und dem Vorgehen beim Vergleich vorher/nachher: [Profiler: Befehle für die Spielkonsole](profiler-befehle.md).

Gemessen werden die Raum-/Memory-Schleife und die Creep-Schleife aus `main.ts` (siehe oben), `controll()` aus `controller/timing.ts` als Ganzes und darin einzeln Türme, Terminal, Pixel, Spawncontroller, Verteidigungsscan, Statuslog und die Tagessequenz — dieselbe Aufteilung wie in der Tabelle unter Zeitsteuerung. Dazu jede Rolle einzeln, gemessen über einen Wrapper um die Rollentabelle, damit `roles/index.ts` und die zehn Rollendateien unverändert bleiben.

Die Auswertung läuft über ein gleitendes Fenster von 100 Ticks; danach gibt eine kompakte Konsolenzeile CPU pro Tick, CPU pro Raum, CPU pro Creep, Bucket-Mittel und die drei teuersten Rollen aus. Die Zähler des laufenden Fensters liegen im Heap, nicht in `Memory` — `Memory` wird jeden Tick serialisiert. In `Memory` steht ausschließlich der Zustand.

`prof.detail(ticks)` misst zusätzlich jeden einzelnen Creep und schaltet sich nach der angegebenen Tickzahl selbst wieder ab, mit Abschlussbericht.

Grenze, die man kennen muss: `Game.cpu.getUsed()` am Ende von `loop()` erfasst nicht die Serialisierung von `Memory`, die das Spiel danach vornimmt. Die gemessenen Zahlen sind also eine Untergrenze.

Vorgehen bei einer Änderung: vorher eine Grundlinie über mindestens 1000 Ticks aufnehmen und mit `prof.baseline(name)` festhalten, dann die Änderung vornehmen, dann erneut mindestens 1000 Ticks messen. Kürzere Fenster schwanken zu stark, weil Spawnwellen, die Tagessequenz (alle 28.800 Ticks, siehe Zeitsteuerung) und Angriffe die Werte verzerren.

## Optionaler Profiler (alter JS-Bot, inaktiv)

`profiler.js` kann Game-/Screeps-Prototypfunktionen wrappen und CPU-Zeiten nach Funktion in `Memory.profiler` aggregieren. In `main.js` sind sowohl `profiler.enable()` als auch der `profiler.wrap(...)`-Block auskommentiert, daher ist er standardmäßig inaktiv. Nach Aktivierung stehen `Game.profiler.stream`, `email`, `profile`, `background`, `restart`, `reset` und `output` bereit.

## Nicht aktivierter Override

`prototype.creep.override.js` wird in `prototype.js` nicht geladen und überschreibt daher derzeit keine Creep-Methoden. Er ist als alternative, memorygesteuerte Implementierung von `withdraw`, `pickup`, `harvest` und `move` angelegt. Bei Standardaufrufen delegiert er an die ursprüngliche Screeps-API; die memorygesteuerten Varianten werden nur ohne Zielargument verwendet.
