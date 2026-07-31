# Screeps-Wissensdatenbank

Diese Dokumentation beschreibt den aktuellen JavaScript-Code in `prod/`. Sie wird als technische Orientierung für Wartung und Erweiterungen geführt; die Laufzeitdaten liegen in Screeps `Memory` und sind daher nicht Teil des Repositories.

## Einstieg

- [Architektur und Tick-Ablauf](architektur.md)
- [Konfiguration und Speicher](konfiguration-und-memory.md)
- [Creep-Grundbausteine und Rollenvermittlung](creep-grundbausteine.md)
- [Rollen](rollen.md)
- [Controller und Automatik](controller-und-automatik.md)
- Weitere Seiten werden beim Analysieren der Rollen, Controller und Prototypen ergänzt.

## Begriffe

`global.room` ist die statische Raumkonfiguration aus `prod/config.js`. `Memory.rooms` ist der persistente, dynamische Raumzustand. Ein „Job“ ist das Rollenmodul eines Creeps und wird über `creep.memory.role` ausgewählt.
