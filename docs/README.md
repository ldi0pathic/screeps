# Screeps-Wissensdatenbank

Diese Dokumentation beschreibt den aktuellen JavaScript-Code in `prod/`. Sie wird als technische Orientierung für Wartung und Erweiterungen geführt; die Laufzeitdaten liegen in Screeps `Memory` und sind daher nicht Teil des Repositories.

## TypeScript-Migration

Der erste lauffähige Migrationsstand liegt in `tsBot/src/legacy/`. Dort ist jedes
Modul aus `prod/` als CommonJS-TypeScript-Datei (`.cts`) abgelegt. Der Einstieg
`tsBot/src/main.ts` exportiert dessen unveränderte `loop()`-Funktion, sodass der
gebündelte Bot dasselbe Laufzeitverhalten hat wie `prod/main.js`.

Die Dateien tragen in diesem Übergangsstand `@ts-nocheck`: Die Konvertierung
ändert weder Steuerfluss noch Screeps-Memory-Schema. Die schrittweise
Neuentwicklung kann nun Modul für Modul erfolgen; dabei werden jeweils der
`@ts-nocheck`-Kommentar, CommonJS-`require` und untypisierte globale Zugriffe
durch echte TypeScript-Module und Typen ersetzt.

Bereits migriert sind der Einstieg `src/main.ts` sowie die Controller für
Memory (`src/controller/memory.ts`) und Timing (`src/controller/timing.ts`).
Die Rollen, Verteidigung, Spawnsteuerung, Straßenbau und Prototypen bleiben
vorerst in `src/legacy/` und werden in kleinen, einzeln testbaren Schritten
ersetzt.

Der Builder schreibt den gebündelten Einstieg nach `tsProd/main.js` neben den
bisherigen `prod/`-Ordner. Dadurch kann die neue Variante getrennt vom
laufenden JavaScript-Bot bereitgestellt und getestet werden.

## Einstieg

- [Architektur und Tick-Ablauf](architektur.md)
- [Konfiguration und Speicher](konfiguration-und-memory.md)
- [Creep-Grundbausteine und Rollenvermittlung](creep-grundbausteine.md)
- [Rollen](rollen.md)
- [Controller und Automatik](controller-und-automatik.md)
- Weitere Seiten werden beim Analysieren der Rollen, Controller und Prototypen ergänzt.

## Begriffe

`global.room` ist die statische Raumkonfiguration aus `prod/config.js`. `Memory.rooms` ist der persistente, dynamische Raumzustand. Ein „Job“ ist das Rollenmodul eines Creeps und wird über `creep.memory.role` ausgewählt.
