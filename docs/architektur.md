# Architektur und Tick-Ablauf

Der Einstiegspunkt ist `prod/main.js`. Beim Laden der Rollentabelle wird die Raumkonfiguration über die Rollenmodule geladen; anschließend werden über `prod/prototype.js` Prototyp-Erweiterungen initialisiert. Pro Screeps-Tick führt `main.js` die zentrale Schleife aus.

## Ablauf pro Tick

1. Für jeden konfigurierten Raum (`global.room`) liest die Schleife `Game.rooms[name]`.
2. Nuklearpositionen aus `Memory.rooms[name].nukepos` werden bei aktivem `nuke` mit `RoomVisual` markiert. Ist der Raum-Memory unvollständig, wird `controller.memory.init()` ausgeführt.
3. In eigenen, sichtbaren Räumen wird die aktuelle und maximale Spawn-Energie als Visual angezeigt.
4. `Memory.creeps` wird bereinigt: nicht mehr existierende Creeps werden gelöscht; Creeps ohne Rolle werden suizidiert und danach aus dem Memory entfernt.
5. Jeder fertige Creep wird an `jobs[creep.memory.role].doJob(creep)` delegiert. Fehler werden mit der Rollenbezeichnung geloggt und erneut geworfen.
6. Zum Schluss wird `controller.timing.controll()` aufgerufen. Dieser Controller steuert die periodischen Systemaufgaben.

## Abhängigkeiten

`main.js` verwendet `controller.memory`, `controller.timing`, `creep.jobs` und optional `profiler`. Die Rollenlogik darf daher davon ausgehen, dass ein Creep eine gültige `memory.role` besitzt und über die Rollentabelle erreichbar ist.

## Fehlerverhalten

Die äußere Fehlerbehandlung wirft Fehler weiter; es gibt keine Fehlerunterdrückung. Ein fehlerhaftes Rollenmodul kann somit den Tick abbrechen. Die fehlende Rollenbezeichnung ist hingegen ein bereinigbarer Konfigurationsfehler und führt zum kontrollierten Entfernen des Creeps.
