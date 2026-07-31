# Controller und Automatik

## Zeitsteuerung (`controller.timing.js`)

`controll()` wird am Ende jedes Hauptticks ausgeführt. Es initialisiert Raum-Memory und führt die Towersteuerung in jedem Tick aus. Anschließend bearbeitet es einen Terminal, ausgewählt per `Game.time % Memory.terminals.length`: bei über 80 % Füllstand wird dessen `sell()` dreimal aufgerufen, sonst einmal; danach versucht es `buyPixel()`.

Periodische Aufgaben:

| Intervall | Aufgabe |
| --- | --- |
| 3 Ticks | Bei vollem CPU-Bucket ein Pixel generieren |
| 5 Ticks | Spawncontroller ausführen |
| 7 Ticks | Sichtbare Räume auf Feinde, Cores und Nukes prüfen |
| 11 Ticks | Raumstatus loggen |
| ca. täglich (28.800 Ticks) | Memory bereinigen, Wände/Container/Türme/Terminals speichern und Straßen wiederaufbauen |

Die tägliche Sequenz verteilt die sechs Aufgaben auf aufeinanderfolgende Ticks. Das Speichern von Straßen ist aktuell auskommentiert; ohne bereits vorhandenes `Memory.rooms[name].roads` kann der darauffolgende Straßenbau nichts wiederherstellen.

## Spawncontroller (`controller.spawn.js`)

Der Controller iteriert über freie Spawns und dann über alle konfigurierten Arbeitsräume. Ein Notfallcreep der Heimatbasis blockiert Fremdraum-Spawns. Die Reihenfolge ist:

1. konfigurierte Energie-Transfers (`global.transfer`)
2. Defender bei Verteidigungsbedarf oder Invader Core
3. alle Rollen aus `creep.jobs`, sofern der Spawn dem Raum zugeordnet ist

Während ein Invader Core gemeldet ist, werden für diesen Arbeitsraum keine normalen Rollen erzeugt. Die tatsächliche Rollenreihenfolge ist die Property-Reihenfolge der Jobtabelle: Debitor, Transfer, Miner, Claimer, Builder, Repairer, Upgrader, Fern-Upgrader, Defender, Wally.

## Verteidigung (`controller.defence.js`)

`check()` setzt für sichtbare, verteidigungsfähige Räume `needDefence` anhand feindlicher Creeps, `invaderCore` anhand feindlicher Invader Cores und `nuke` anhand anfliegender Nukes. Bei Nukes wird einmalig eine Screeps-Benachrichtigung ausgelöst und die Einschlagpositionen werden als `nukepos` gespeichert.

`tower()` greift während `needDefence` den teuersten feindlichen Creep an, solange kein starker Heiler (mindestens fünf `HEAL`-Teile) vorhanden ist. Gegen starke Heiler werden Türme defensiv verwendet: Sie vergleichen die aktuellen Struktur-Hits mit einem Snapshot und reparieren die erste beschädigte Struktur. Außerhalb der Verteidigung reparieren sie alle drei Ticks beschädigte Strukturen nach Reparaturpriorität, wenn sie ausreichend Energie haben.

## Straßenwiederaufbau (`controller.rebuild.js`)

Für Räume mit `saveRoads` und RCL mindestens 7 erstellt `rebuildRoads()` fehlende, zuvor gespeicherte Straßen erneut als Baustellen. Pro Raum werden höchstens zehn gleichzeitige Baustellen zugelassen. Erfolgreiche automatische Baustellen werden in `Memory.rooms[name].autobuild` gezählt.

## Optionaler Profiler

`profiler.js` kann Game-/Screeps-Prototypfunktionen wrappen und CPU-Zeiten nach Funktion in `Memory.profiler` aggregieren. In `main.js` sind sowohl `profiler.enable()` als auch der `profiler.wrap(...)`-Block auskommentiert, daher ist er standardmäßig inaktiv. Nach Aktivierung stehen `Game.profiler.stream`, `email`, `profile`, `background`, `restart`, `reset` und `output` bereit.

## Nicht aktivierter Override

`prototype.creep.override.js` wird in `prototype.js` nicht geladen und überschreibt daher derzeit keine Creep-Methoden. Er ist als alternative, memorygesteuerte Implementierung von `withdraw`, `pickup`, `harvest` und `move` angelegt. Bei Standardaufrufen delegiert er an die ursprüngliche Screeps-API; die memorygesteuerten Varianten werden nur ohne Zielargument verwendet.
