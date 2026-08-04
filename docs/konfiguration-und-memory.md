# Konfiguration und Memory

## Statische Konfiguration (`prod/config.js`)

Die Datei definiert globale Werte. Wichtig ist, dass sie `global.room` vollständig setzt (nicht nur ergänzt); sie ist die maßgebliche Liste der verwalteten Räume.

Globale Gruppen:

- `global.const`: allgemeine Einstellungen, derzeit u. a. `maxRepairs`, ein optionaler Log-Raum und der Debug-Schalter `showPaths` (Standard `false`).
- `global.transfer`: konfigurierte Terminal-Transferziele mit Quellen.
- `global.room`: Raumdefinitionen.
- `global.prio`: Prioritätswerte für Bauen, Reparaturen und zulässige Hitquoten.

Eine Raumdefinition enthält typischerweise `room`, `spawnRoom`, Flags zum Entsenden von Rollen (`sendMiner`, `sendDebitor`, `sendBuilder`, `sendDefender`, `sendClaimer`), Quellen-IDs, Link-IDs, Baulimits und Upgrader-Anzahl. Nicht jeder Raum muss sichtbar oder selbst besessen sein; `spawnRoom` kann die Produktion aus einem anderen Raum anfordern.

Der Schalter `sendLinkkeeper` aktiviert die Rolle `linkkeeper` für den Raum. Sie schiebt die Energie aus dem Link in der Basis (`spawnLink`) kontinuierlich ins Storage. Muss an sein, solange `useLinks` für den Raum gilt: Der frühere Direktzugriff `harvestSpawnLink` ist entfernt, weshalb ohne `sendLinkkeeper` niemand sonst den Link leert. Ein voller Empfänger-Link blockiert dann alle Quell-Links, die auf ihn senden. Voraussetzungen: `useLinks` gesetzt, `spawnLink` konfiguriert, ein Storage im Raum, der Raum ist sein eigener Spawnraum. Höchstens ein Creep je Raum. Derzeit gesetzt in E58N6, E58N7, E59N3 und E59N9.

Die Prioritätstabellen verwenden kleinere Werte als höhere Priorität. `build` bevorzugt u. a. Extensions, Spawns, Links und Storage; `repair` bevorzugt Ramparts vor Walls, danach kritische Gebäudetypen — Ramparts stehen vor Walls, weil sie dauerhaft 300 Hits je 100 Ticks verlieren, während Walls gar nicht zerfallen. `hits` definiert die Reparaturschwelle als Anteil der Maximalhits (Wände `0,0005`, Ramparts `0,001`).

`showPaths` schaltet die Pfad-Visualisierung in `creep/goto.ts::moveByMemory` frei (roter `RoomVisual`-Restpfad je bewegtem Creep); im Normalbetrieb bleibt sie aus, weil sie jeden Tick den gecachten Pfad erneut deserialisiert und durchsucht.

`global.log(bool, msg)` loggt nur bei wahrer Bedingung. `global.logWorkroom(room, msg)` verwendet dafür den optionalen Filter `global.const.logroom` und ermöglicht gezieltes Spawn-Debugging pro Arbeitsraum.

## Persistenter Zustand (`Memory`)

`controller.memory.init()` legt für jeden konfigurierten Raum `Memory.rooms[name]` an und normalisiert die booleschen Flags `aktivPrioSpawn`, `hasLinks`, `needDefence`, `invaderCore` und `nuke`. Die globale Markierung `Memory.init` verhindert erneute Initialisierung.

`clear()` entfernt Memory für nicht mehr konfigurierte Räume und verwirft gespeicherte Straßen, falls `saveRoads` in der Konfiguration deaktiviert wurde.

## Gespeicherte Objektlisten

Die manuellen Helfer in `controller.memory` suchen sichtbare Räume ab und speichern IDs in `Memory.rooms[name]`:

- `wally`: Wände und Ramparts (nur bei `maxwallRepairer >= 1`)
- `container`: Container
- `tower`: Türme
- `roads`: Straßen und Straßen-Baustellen, mit `id`, `pos` und Typ `b`/`c`

`FindAndSaveTerminals()` speichert Terminal-IDs zentral in `Memory.terminals`. Diese Suchfunktionen werden nicht automatisch aus `main.js` ausgeführt; die dort vorhandenen Aufrufe sind auskommentiert.

`writeStatus()` gibt aktive Prioritäts-Spawns, Verteidigungsbedarf und Invader Cores als zusammengefasste Konsolennachricht aus.

## Profiler-Memory (`Memory.profiler`, `Memory.stats`)

`tsBot/src/profiler` bringt zwei neue Memory-Bereiche mit. Beide Schlüsselsätze sind neu vergeben und deshalb englisch benannt — anders als Bestandsschlüssel wie `notfall` oder `wally`, die aus Kompatibilitätsgründen deutsch bleiben.

### `Memory.profiler` — Zustand, keine Messwerte

Die laufenden Zähler eines Fensters (Abschnitte, Rollen, Ticks) leben im Heap, nicht in `Memory`, weil `Memory` jeden Tick serialisiert wird und die Kosten mit der Größe wachsen (siehe `docs/knowledge/systems/runtime-memory.md`). `Memory.profiler` speichert nur, in welchem Zustand der Profiler ist. Schlüssel aus `ProfilerMemory` (`tsBot/src/profiler/types.ts`):

- `mode`: `"off"` / `"light"` / `"full"`. Standard `"off"`, wird beim ersten Zugriff angelegt. Überlebt den Global-Reset, Umschalten braucht daher kein Deployment.
- `detailUntil`: Tick, bis zu dem die Detailmessung läuft; fehlt, wenn sie aus ist.
- `detailReturnTo`: Zustand, auf den nach Ablauf der Detailmessung zurückgeschaltet wird.
- `baselines`: benannte Grundlinien aus `prof.baseline(name)`. Je Eintrag nur Skalare (`tick`, `ticks`, `mode`, `cpuPerTick`, `cpuPerRoom`, `cpuPerCreep`, `bucketMean`, `rooms`, `creeps`). Auf 8 Einträge begrenzt, beim Überlauf fällt die älteste heraus, damit `Memory.profiler` unter 1 KB bleibt — im Spiel prüfbar mit `JSON.stringify(Memory.profiler).length`.

### `Memory.stats` — Ausgabe

Ein flaches Objekt aus Zahlen in der Grafana-Konvention der Screeps-Community (screeps-grafana, screeps-stats): ein externer Sammler reicht die Schlüssel unverändert nach Graphite durch, Punkte im Schlüssel bilden die Hierarchie dort. Ein Sammler ist aktuell nicht eingerichtet; der Zweck ist, dass Graphen später ohne Codeänderung möglich sind. `Memory.stats` wird bei jedem Fensterende komplett ersetzt statt ergänzt — sonst blieben Schlüssel verwaister Rollen für immer stehen.

Schlüssel: die Community-Standardnamen `cpu.getUsed`, `cpu.limit`, `cpu.tickLimit`, `cpu.bucket`; dazu unter dem Präfix `profiler.` die Werte `ticks`, `cpuPerTick`, `cpuMaxTick`, `cpuPerRoom`, `cpuPerCreep`, `rooms`, `creeps`, `bucketMin`; dazu `profiler.section.<name>.cpuPerTick` je Abschnitt und `profiler.role.<name>.cpuPerTick` je Rolle. Die Abschnittsnamen enthalten selbst Punkte (`timing.tower`) und bilden in Graphite damit eine weitere Ebene. Einzelne Creeps stehen **nicht** darin — das wären bis zu 60 wechselnde Schlüssel je Fenster.
