# Plan 01: Profiler und Kennzahlen

Status: **Stufe 1 und 2 umgesetzt** (Branch `plan-01-profiler`),
Stufe 3 zurückgestellt, Zahlen werden im Spiel erhoben.

## Warum zuerst

Der Server hat **20 CPU pro Tick**, und das ist die eigentliche Obergrenze für
die Anzahl der Räume — nicht Energie, nicht GCL. Jede Erweiterung aus den
folgenden Plänen kostet CPU und muss sich rechnen. Ohne Messung passiert sonst
zweierlei:

- Verbesserungen lassen sich nicht belegen. „Fühlt sich schneller an" ist bei
  einem Bot, der über Tausende Ticks läuft, keine Aussage.
- Optimiert wird an der falschen Stelle. Die Wissensbasis
  (`docs/knowledge/efficiency/cpu-pathfinding.md`) warnt ausdrücklich davor,
  absolute CPU-Zahlen zu schätzen — sie hängen von der Umgebung ab.

Deshalb ist der Profiler Schritt 0. Er liefert die Grundlinie, gegen die alles
Weitere gemessen wird, und beantwortet die eine Frage, die über „viele Räume"
entscheidet: **wie viel CPU kostet ein Raum, und woran genau?**

## Ausgangslage

- `prod/profiler.js` (350 Zeilen) ist der verbreitete prototypenwickelnde
  Profiler mit `Game.profiler.profile(ticks)`, `stream`, `email`, `background`.
  In `prod/main.js:11` ist er auskommentiert, in den TS-Bot wurde er nie
  übernommen (siehe `CLAUDE.md`).
- Der nie eingesetzte Bot in `C:\GIT\github\Screeps_TS` hat einen schlanken
  `src/utils/MovementProfiler.ts`: `startMeasurement`/`endMeasurement` je
  Operation, Ausgabe von avg/max/min/calls alle 50 Ticks, danach Reset.
- Unser TS-Bot hat heute **keine** Messung. `controller/memory.ts::writeStatus`
  loggt alle 11 Ticks nur Alarmzustände (`aktivPrioSpawn`, `needDefence`,
  `invaderCore`) und auch die nur, wenn einer davon aktiv ist.

Der prototypenwickelnde Profiler ist mächtig, aber er verteuert **jeden**
Screeps-API-Aufruf. Auf einem 20-CPU-Server ist er als Dauerbetrieb
ausgeschlossen. Deshalb drei Stufen mit unterschiedlichem Preis.

## Aufbau

### Stufe 1 — Grundlinie, dauerhaft an

Grobe Abschnittsmessung über `Game.cpu.getUsed()`-Differenzen an wenigen
Stellen. Ziel: unter 0,1 CPU pro Tick Eigenkosten.

Messpunkte:

| Abschnitt | Ort |
| --- | --- |
| Gesamttick | `main.ts::loop` Anfang bis Ende |
| Raum-Visuals und Memory-Init | erste Schleife in `main.ts::loop` |
| Creep-Schleife gesamt | zweite Schleife in `main.ts::loop` |
| je Rolle summiert | um `job.doJob(creep)` |
| `timer.controll()` gesamt | Aufruf in `main.ts::loop` |
| Türme, Terminal, Spawn, Verteidigungsscan, Tagesjob | in `controller/timing.ts` |

Daraus abgeleitete Kennzahlen, das eigentliche Produkt dieser Stufe:

- **CPU pro Raum** = Gesamttick geteilt durch Zahl der verwalteten Räume.
  Bestimmt direkt, wie viele Räume in 20 CPU passen.
- **CPU pro Creep** und CPU je Rolle, absolut und als Anteil.
- **Bucket-Verlauf**: Mittelwert und Minimum über das Fenster. Ein sinkender
  Bucket ist das Frühwarnzeichen, dass die letzte Änderung zu teuer war.
- `Game.cpu.limit` und `tickLimit` mitschreiben, damit die Zahlen später
  vergleichbar bleiben.

Zusätzlich Wirtschaftskennzahlen, sonst optimiert man CPU auf Kosten des
Ertrags — „Effizienz" ist beides:

- Controller-Fortschritt je 1000 Ticks, je Raum (misst den Ausbaufortschritt).
- Energie in Storage und Terminal je Raum, als Trend statt Momentwert.
- Zahl lebender Creeps je Rolle, gegen die Sollzahl aus `config.ts`.
- Energie, die in Spawns geflossen ist (Maß für Verschwendung durch zu große
  oder zu oft ersetzte Creeps).

Speicherung: gleitendes Fenster über N Ticks (Vorschlag 100) in
`Memory.profiler`, nur **aggregiert** — Summe, Maximum, Zähler pro Abschnitt.
Keine Rohreihen, weil `Memory` bei jedem Tick serialisiert wird und die Kosten
mit der Größe wachsen (`docs/knowledge/systems/runtime-memory.md`). Zielgröße
wenige hundert Byte.

Ausgabe: kompakte Zeile alle 100 Ticks, plus Abruf über die Konsole. Kein
Dauergeschwätz — die Konsole ist das einzige Diagnosefenster im Spiel und darf
nicht zugemüllt werden.

### Stufe 2 — Detailmessung, auf Abruf

Pro Creep und pro Controller-Funktion messen, eingeschaltet über die Konsole
für eine begrenzte Zahl von Ticks, danach automatisch aus. Bericht mit avg,
max, Aufrufzahl und Anteil am Tick, sortiert nach Gesamtanteil — nach dem
Muster von `MovementProfiler` im anderen Bot, aber mit Selbstabschaltung.

Damit findet man Engpässe innerhalb einer Rolle: welcher Creep, welche
Beschaffungsfunktion, welcher `find`-Aufruf.

### Stufe 3 — Prototypen-Profiler, selten

`prod/profiler.js` nach TypeScript übernehmen, ausschließlich per Konsole für
wenige Ticks aktivierbar, mit deutlichem Hinweis auf die Eigenkosten. Nur für
tiefe Untersuchungen, etwa wenn Stufe 2 zeigt, dass die Zeit in Screeps-eigenen
Aufrufen verschwindet und nicht im eigenen Code.

Diese Stufe ist optional und kommt nur, wenn Stufe 1 und 2 eine Frage offen
lassen.

## Bedienung

Konsolenzugriff über `prof` (kein Präfix), damit im Spiel ohne
Neu-Deployment umgeschaltet werden kann:

- `prof.light()` — Zustand `light`: nur Gesamttick und Bucket
- `prof.on()` — Zustand `full`: zusätzlich Abschnitte und Rollen
- `prof.off()` — Zustand `off`: Messung völlig ausgeschaltet
- `prof.status()` — Zustand anzeigen und Restticks der Detailmessung
- `prof.report()` — aktuellen Fensterbericht ausgeben
- `prof.reset()` — Fenster verwerfen und neu beginnen
- `prof.detail(ticks)` — Stufe 2 für die angegebene Zahl Ticks
- `prof.baseline(name)` — aktuelles Fenster als benannte Grundlinie
  festhalten, damit „vorher/nachher" nicht von Hand notiert werden muss
- `prof.baselines()` — alle gespeicherten Grundlinien nebeneinander

## Vorgehen beim Vergleich vorher/nachher

1. Profiler einbauen, ohne sonst etwas zu ändern.
2. Grundlinie über mindestens 1000 Ticks aufnehmen und als Grundlinie
   festhalten. Kürzere Fenster schwanken zu stark, weil Spawnwellen,
   Tagesjobs (alle 28 800 Ticks) und Angriffe die Werte verzerren.
3. Erst danach die nächste Verbesserung umsetzen, jeweils **eine** pro Messung.
4. Nach jeder Änderung erneut mindestens 1000 Ticks messen und beide Fenster
   nebeneinander in `docs/aenderungen.md` festhalten.

## Eigenkosten belegen

Der Profiler darf das nicht verfälschen, was er messen soll. Umgesetzt mit
drei Zuständen:

- `Memory.profiler.mode` hält `off`, `light` oder `full`, zur Laufzeit über
  die Konsole (`prof.off()`, `prof.light()`, `prof.on()`) umschaltbar und
  übersteht einen Global-Reset. Standard nach dem Deployment ist `off`.
- Im Zustand `off` läuft kein `Game.cpu.getUsed()` — damit lässt sich auch
  nicht messen, wie teuer das Messen ist. Der Vergleich `light` gegen `full`
  über je 500 Ticks liefert die Eigenkosten.
- `light` ist zugleich der sinnvolle Dauerzustand: nur Gesamttick und Bucket,
  deutlich billiger als `full`.

## Abnahmekriterien

- `bot.prof.report()` liefert im Spiel eine Zeile mit CPU pro Tick, CPU pro
  Raum, CPU pro Creep, Bucket-Mittel und den drei teuersten Rollen.
- `Memory.profiler` bleibt unter 1 KB, nachweisbar über
  `JSON.stringify(Memory.profiler).length`.
- Stufe 2 schaltet sich nach der angegebenen Tickzahl selbst ab.
- Eigenkosten von Stufe 1 gemessen und dokumentiert.
- Typecheck und Build fehlerfrei.

## Verhaltensänderung

**Nein**, mit einer Ausnahme, die Zustimmung braucht: die Messung selbst kostet
CPU, und auf einem 20-CPU-Server ist auch ein Zehntel CPU nicht nichts. Der
Ausschalter ist deshalb Teil des Plans.

## In dieser Runde mitzunehmen

Ein Fehler, der bei der Analyse auffiel und mit dem Profiler zusammen erledigt
wird — als **eigener Commit**, nicht vermischt:

`roles/builder.ts:96-103` hat keinen Rückfall für `numberOfSets == 0` und
liefert dann ein **leeres** Body-Array, mit dem `spawnCreep` grundsätzlich
fehlschlägt. Es ist derselbe Fehler, der beim Miner am 2026-08-01 behoben wurde
(`docs/aenderungen.md`, A4); `upgrader.ts:78` und `repairer.ts:144` behandeln
den Fall korrekt. Betroffen sind Räume unter der Set-Kosten-Schwelle, also RCL1
und Räume, die nach einem Angriff darunter fallen — genau die Räume, die ein
automatisch geclaimter Neuraum durchläuft.

Reiner Guard, keine Verhaltensänderung im Normalbetrieb. Details und Begründung
in [Plan 03](03-durchsatz-und-bodies.md).

## Entschieden: Messpunkte und Wrapper

Aufteilung der Messpunkte auf `main.ts` und `controller/timing.ts` bedeutet,
dass beide Dateien Profiler-Aufrufe enthalten. Umgesetzt wurde die Lösung:
**beides, aufgeteilt.**

- Direkte Messpunkte in `main.ts` und `controller/timing.ts` für die Abschnitte
  (Gesamttick, Raum-Visuals, Creep-Schleife, Controller-Funktionen).
- Ein Wrapper um die Rollentabelle für die Rollen, damit `roles/index.ts` und
  die zehn Rollendateien unverändert bleiben.

Die Indirektion in jedem `doJob`-Aufruf, die im Vorschlag noch als Nachteil des
Wrappers stand, bleibt damit bestehen — sie ist der bezahlte Preis dafür, dass
kein Rollencode einen Profiler-Aufruf enthält. Im ausgeschalteten Zustand kostet
sie einen Funktionsaufruf und den Vergleich einer Modulvariablen, kein
`Game.cpu.getUsed()`.
