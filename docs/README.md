# Screeps-Wissensdatenbank

Diese Dokumentation beschreibt das Verhalten des Bots in `tsBot/src/`. Sie wird als technische Orientierung für Wartung und Erweiterungen geführt; die Laufzeitdaten liegen in Screeps `Memory` und sind daher nicht Teil des Repositories.

Die Seiten zu Rollen, Controllern und Creep-Grundbausteinen sind während der
Migration aus dem alten JavaScript-Bot entstanden und beschreiben weiterhin das
gültige Verhalten. Wo der TypeScript-Bot inzwischen abweicht, steht es in
[aenderungen.md](aenderungen.md). Bei einer Verhaltensänderung gehören beide
Stellen mitgepflegt.

## Herkunft: TypeScript-Migration

Die Migration ist **abgeschlossen** und `prod/` ist nur noch Historie — der
Code muss nicht mehr damit übereinstimmen. `tsBot/src/` besteht ausschließlich
aus echten TypeScript-Modulen, der Zwischenstand `src/legacy/` (wörtliche
`.cts`-Kopien mit `@ts-nocheck`) existiert nicht mehr.

Aufteilung:

| Verzeichnis | Inhalt | Herkunft in `prod/` |
| --- | --- | --- |
| `src/main.ts` | Tick-Schleife | `main.js` |
| `src/config.ts` | statische Konfiguration (`global.*`) | `config.js` |
| `src/globals.ts` | typisierter Zugriff auf `global.*` | – (neu) |
| `src/controller/` | `memory`, `timing`, `spawn`, `rebuild`, `defence` | `controller.*.js` |
| `src/creep/` | `base`, `goto`, `transport` | `creep.base*.js` |
| `src/roles/` | zehn Rollen plus `index.ts` (Rollentabelle) | `creep.<rolle>.js`, `creep.jobs.js` |
| `src/prototypes/` | `creep-checks`, `terminal-market` | `prototype.creep.checks.js`, `prototype.terminal.market.js` |

Nicht übernommen wurden `profiler.js` und `prototype.creep.override.js`: Beide
sind schon in `prod/` nicht aktiv. Sie bleiben dort als Referenz liegen.

Beim Übertragen wurden nur Umformungen vorgenommen, die der Bundler ohnehin
wieder einzieht: `module.exports`-Objekt zu `export function`, interne
`this.foo()`-Aufrufe zu direkten Aufrufen, `global.foo` zu `bot.foo` sowie
TypeScript-Annotationen und `!`/`as`-Zusicherungen. Belegt wurde das, indem
beide Fassungen mit esbuild gebündelt und die Funktionsquelltexte normalisiert
verglichen wurden — 105 Funktionen in 16 Modulen stimmten zeichengenau
überein. Danach wurden die in [aenderungen.md](aenderungen.md) protokollierten
Fehler behoben; seitdem ist `prod/` kein Vergleichsmaßstab mehr.

Die vier Controller `memory`, `timing`, `spawn` und `rebuild` stammen aus einer
früheren Migrationsstufe und sind idiomatisch statt wortgleich geschrieben.
Sie wurden gegen `prod/` reviewt und gelten als verhaltensgleich; die einzige
bewusst abweichende Stelle ist `rebuild.ts`, das einen Raum ohne Controller
überspringt, wo `prod/controller.rebuild.js` eine Ausnahme wirft.

Der Builder schreibt den gebündelten Einstieg nach `tsProd/main.js`. Das ist die
Datei, die das Spiel über GitHub synct.

## Wissensbasis und Änderungsprotokoll

- [Screeps-Wissensbasis](knowledge/README.md) — Zusammenfassungen der offiziellen Doku und von Community-Wissen (CPU, Pathfinding, Energiewirtschaft, RCL, Kampf, Markt, Boosts, Spielphasen). Der Index nennt pro Fragestellung genau eine Datei; vor inhaltlichen Änderungen an Rollen, Bewegung, Spawn-Profilen oder Marktlogik dort nachlesen statt schätzen.
- [Änderungen am TypeScript-Bot](aenderungen.md) — Protokoll aller Änderungen, die das Spielverhalten betreffen, samt der nach der Migration behobenen Fehler.

## Einstieg

- [Architektur und Tick-Ablauf](architektur.md)
- [Konfiguration und Speicher](konfiguration-und-memory.md)
- [Creep-Grundbausteine und Rollenvermittlung](creep-grundbausteine.md)
- [Rollen](rollen.md)
- [Controller und Automatik](controller-und-automatik.md)
- [Profiler: Befehle für die Spielkonsole](profiler-befehle.md)
- Weitere Seiten werden beim Analysieren der Rollen, Controller und Prototypen ergänzt.

## Begriffe

`global.room` ist die statische Raumkonfiguration aus `prod/config.js`. `Memory.rooms` ist der persistente, dynamische Raumzustand. Ein „Job“ ist das Rollenmodul eines Creeps und wird über `creep.memory.role` ausgewählt.
