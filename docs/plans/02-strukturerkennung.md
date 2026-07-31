# Plan 02: Strukturerkennung statt Hand-IDs

Status: **Vorschlag.** Verhaltensänderung: **ja** — braucht Zustimmung.

## Problem

Für jeden Raum stehen in `config.ts` von Hand eingetragene Objekt-IDs:
`energySources`, `mineralSources`, `targetLinks`, `spawnLink`,
`controllerLink`, `mineralContainerId`, `prioBuildings`. Bei zehn Räumen sind
das rund 30 Zeilen Handarbeit pro Raum (`config.ts:53-368`).

Folgen:

- **Ein neuer Raum kostet Handarbeit, bevor überhaupt etwas spawnt.**
  `controller/spawn.ts:52` überspringt jeden Raum ohne passenden
  `bot.room`-Eintrag vollständig. Das ist die direkte Bremse für „viele Räume".
- **Stille Fehler beim Ausbau.** Wird ein Link neu gebaut oder verschoben und
  die ID nicht nachgetragen, liefert `Game.getObjectById` `null` und der Miner
  sendet ins Leere — ohne Meldung.
- **IDs überleben ihre Strukturen nicht.** Eine zerstörte und neu gebaute
  Struktur hat eine neue ID. Genau daraus entstand der Absturz, der in
  `docs/aenderungen.md` als A2 protokolliert ist (`prioBuildings`).

Bemerkenswert: `controller/memory.ts:87-171` macht das für Walls, Container,
Türme, Terminals und Straßen längst richtig — `find` plus Cache im Raum-Memory.
Ausgerechnet die Werte, die von Hand gepflegt werden, sind davon ausgenommen.

## Vorlage im Vergleichsbot

- `src/extensions/RoomExtension.ts:6-21,110-221` — durchgängiges Muster
  `if (memory.X) return memory.X; sonst find(...) und cachen`, für Quellen,
  Minerale, Storage, Container und Links.
- `src/storage/LinkStorage.ts:48-124` — Links werden **geometrisch kategorisiert**
  statt konfiguriert: Quelle ≤2 Felder, Controller ≤3, Storage ≤2, Rest
  „remote". Cache 250 Ticks.
- `src/manager/RoomPhaseManager.ts:34-37` — Cache wird bei Zustandswechsel
  gezielt verworfen.

## Vorgehen

Schrittweise, jeder Schritt einzeln messbar und einzeln zurücknehmbar:

1. **Quellen und Minerale.** Neue Cache-Funktion nach dem Muster von
   `findAndSaveRoomContainer`, gefüllt aus `room.find(FIND_SOURCES)` bzw.
   `FIND_MINERALS`. Ergebnis nach `Memory.rooms[name]`. Danach lesen die Rollen
   von dort statt aus `bot.room[...].energySources`.
2. **Links geometrisch zuordnen.** `spawnLink`, `controllerLink` und die
   Ziel-Links aus der Lage bestimmen (Reichweite zu Spawn, Controller, Storage,
   Quelle). Das ersetzt die drei Konfigurationsfelder.
3. **`config.ts` auf Ausnahmen zurückschneiden.** Die Felder bleiben als
   **optionale Übersteuerung** erhalten: ist ein Wert gesetzt, gilt er; ist er
   leer, entscheidet die Erkennung. So bleibt jeder heute laufende Raum
   unverändert, und nur neue Räume verlassen sich auf die Automatik.

Punkt 3 ist der Grund, warum das Risiko beherrschbar bleibt: die Umstellung
wirkt zuerst nur dort, wo heute nichts konfiguriert ist.

## Cache-Invalidierung

Der wunde Punkt jeder Erkennung. Regeln:

- Gecachte IDs bei jedem Lesen gegen `Game.getObjectById` prüfen; ist das
  Ergebnis `null`, den Eintrag verwerfen und neu suchen. Das haben
  `harvestRoomContainer` (`creep/base.ts:217-229`) und Plan A2 bereits als
  Muster.
- Zusätzlich eine langsame vollständige Neuerfassung im bestehenden Tagesjob
  (`controller/timing.ts::daylie`), damit sich auch stille Änderungen
  einsammeln.
- Quellen und Minerale sind unveränderlich — sie brauchen keine
  Invalidierung, nur eine einmalige Erfassung.

## Nutzen

- Ein neuer Raum braucht keine ID-Recherche mehr. Das ist die Voraussetzung
  dafür, dass automatisches Claimen (Plan 06) überhaupt etwas bringt — sonst
  claimt der Bot einen Raum, in dem er anschließend nichts tut.
- Weniger stille Fehler beim Ausbau bestehender Räume.
- CPU-neutral: `find` läuft einmal je Raum und Lebenszyklus, nicht pro Tick.

## Risiko

Mittel. Die geometrische Link-Zuordnung kann in unübersichtlichen Räumen falsch
greifen — ein als „Controller-Link" erkannter Quell-Link verteilt Energie falsch,
bis der Cache abläuft. Deshalb Schritt 2 erst nach Schritt 1, und zuerst nur in
**einem** Raum ohne konfigurierte Links erproben.

## Abnahmekriterien

- Ein Raum ohne `energySources` in `config.ts` fördert trotzdem beide Quellen.
- Eine zerstörte und neu gebaute Struktur wird ohne Eingriff wieder benutzt.
- Alle heute konfigurierten Räume verhalten sich unverändert; belegt über den
  Konfigurationsvergleich im Prüfskript und ein Messfenster nach Plan 01.
- `JSON.stringify(Memory.rooms).length` wächst um weniger als 20 %.

## Offene Frage an den Betreiber

Sollen die IDs in `config.ts` nach erfolgreicher Umstellung **entfernt** werden,
oder als Übersteuerung stehen bleiben? Vorschlag: stehen lassen, aber in der
Doku als „Ausnahme, normalerweise leer" kennzeichnen. Entfernen wäre sauberer,
nimmt aber die Möglichkeit, eine Fehlerkennung im Spiel schnell zu übergehen.
