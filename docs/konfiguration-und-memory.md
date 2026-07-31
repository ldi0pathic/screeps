# Konfiguration und Memory

## Statische Konfiguration (`prod/config.js`)

Die Datei definiert globale Werte. Wichtig ist, dass sie `global.room` vollständig setzt (nicht nur ergänzt); sie ist die maßgebliche Liste der verwalteten Räume.

Globale Gruppen:

- `global.const`: allgemeine Einstellungen, derzeit u. a. `maxRepairs` und ein optionaler Log-Raum.
- `global.minSalePrice`: Mindestverkaufspreise nach Ressource für die Marktlogik.
- `global.maxOrderPrice`: Preisobergrenzen, derzeit für Pixel.
- `global.transfer`: konfigurierte Terminal-Transferziele mit Quellen.
- `global.room`: Raumdefinitionen.
- `global.prio`: Prioritätswerte für Bauen, Reparaturen und zulässige Hitquoten.

Eine Raumdefinition enthält typischerweise `room`, `spawnRoom`, Flags zum Entsenden von Rollen (`sendMiner`, `sendDebitor`, `sendBuilder`, `sendDefender`, `sendClaimer`), Quellen-IDs, Link-IDs, Baulimits und Upgrader-Anzahl. Nicht jeder Raum muss sichtbar oder selbst besessen sein; `spawnRoom` kann die Produktion aus einem anderen Raum anfordern.

Die Prioritätstabellen verwenden kleinere Werte als höhere Priorität. `build` bevorzugt u. a. Extensions, Spawns, Links und Storage; `repair` bevorzugt Walls, danach kritische Gebäudetypen. `hits` definiert die Reparaturschwelle als Anteil der Maximalhits (Wände `0,0005`, Ramparts `0,001`).

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
