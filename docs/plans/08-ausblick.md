# Plan 08: Ausblick — Phasenmodell, Layout, Labore

Status: **Ausblick, nicht terminiert.** Alles hier ist größer als die Pläne 01
bis 07 und sollte erst danach beurteilt werden.

## Phasenmodell je Raum

Der Vergleichsbot hat einen expliziten Zustandsautomaten
(`RoomPhaseManager.ts`, Zustände `phase1` bis `phase8`), der alle 10 bis 20
Ticks ein Profil je Raum berechnet und Flags liefert: Storage-Logistik erlaubt,
Links erlaubt, Remote-Abbau erlaubt, schnelles Wachstum, Sicherheitslage,
CPU-Stufe. Die Übergänge hängen nicht nur am RCL, sondern an harten
Bedingungen — Phase 4 nach 5 etwa erst bei Storage über 50 000 Energie **und**
keinem laufenden Spawn **und** keiner Bedrohung.

Bei uns sind dieselben Entscheidungen über die Rollen verstreut:
`miner.ts:139,181`, `upgrader.ts:19,25,67,74,97` und weitere prüfen direkt
`controller.level`. Es gibt kein zentrales „wo steht dieser Raum".

Der Reiz: das Phasenmodell wäre die saubere Grundlage für die Stufen aus Plan 05
und den Sparmodus aus Plan 06 — statt drei Mechanismen, die sich überlappen,
einer. Der Preis: alle Rollen müssten umgestellt werden, und ein Fehler in den
Übergangskriterien wirkt auf alle Räume gleichzeitig. Im Vergleichsbot löst ein
Phasenwechsel zudem Memory-Invalidierung aus — bei zehn produktiven Räumen genau
die Art Umschaltung, die einen Tick lang alles blockieren kann.

**Empfehlung:** nicht als eigenes Projekt starten. Wenn Plan 05 und 06 umgesetzt
sind, existiert faktisch schon ein Zustand je Raum. Dann prüfen, ob daraus ein
Phasenmodell wächst — von unten, aus dem was gebraucht wird, statt von oben als
Architekturvorgabe.

## Generischer Layout-Planer

Das ist der Punkt, an dem der Vergleichsbot am meisten enttäuscht und wir am
meisten selbst bauen müssten. Dort gibt es **kein** generisches Verfahren:
`LayoutManager.getLayout()` kennt genau einen Raum, die Koordinaten wurden im
Web-Planner von Hand gesetzt und mit `LayoutExporter` als Literal exportiert.
Kein Anker, kein Versatz, keine Drehung, keine Terrain-Prüfung. Für einen
zweiten Raum wäre dieselbe Handarbeit nötig — nur an anderer Stelle.

Wer das wirklich will, baut es selbst. Zwei gangbare Wege:

1. **Stempel mit Anker.** Ein relatives Muster (Bunker) einmal entwerfen, dann
   je Raum eine Ankerposition suchen, an der es kollisionsfrei aufs Terrain
   passt, und in vier Drehungen probieren. Überschaubar, liefert gleichmäßige
   Ergebnisse, verschenkt aber Platz in engen Räumen.
2. **Abstandsbasiert.** Über eine Distanztransformation die größte freie Fläche
   finden, dort den Kern setzen und Extensions in Ringen ergänzen. Flexibler,
   deutlich aufwendiger und schwerer nachvollziehbar.

Dazu gehört zwingend ein **Baustellen-Budget**: das Spiel erlaubt 100 Baustellen
insgesamt. Der Vergleichsbot begrenzt auf 5 je Raum und 80 global — die einzige
Zahl aus seinem Layout-Teil, die ohne Weiteres übernehmbar ist, und zwar erst
dann, wenn überhaupt automatisch platziert wird.

Nutzen: das würde die verbleibende Handarbeit beim Ausbau eines neuen Raums
beseitigen, also Plan 07 vollenden. Aufwand: das größte Einzelvorhaben in
diesem Satz.

## Labore, Boosts, Factory

Das erklärte Ausbauziel ist RCL8 einschließlich Labore und Boosts. Zum Stand:

- Unser Bot nutzt davon **nichts**. Mineralabbau existiert (`miner.ts` mit
  Extractor und Terminal), aber keine Verarbeitung.
- Der Vergleichsbot ebenfalls nicht: seine eigene Lückenliste führt
  `LabManager` und `FactoryManager` als abwesend und ausdrücklich „disabled until
  an explicit plan exists".

Es gibt hier also keine Vorlage, nur die Wissensbasis
(`docs/knowledge/mechanics/resources-boosts.md`). Das ist Neuland und gehört
ans Ende, aus zwei Gründen: Boosts zahlen sich erst aus, wenn die Wirtschaft
darunter steht, und auf einem 20-CPU-Server kostet jede weitere Struktur mit
eigener Logik Rechenzeit, die dann anderen Räumen fehlt.

Sinnvolle Vorstufe, falls die Richtung stimmt: **Mineralverkauf ausbauen** statt
Verarbeitung. Das nutzt die vorhandene Terminal- und Marktlogik, kostet fast
keine CPU und finanziert Pixelkäufe.

## Markt jenseits von Pixeln

`terminal-market.ts` verkauft heute nach einer Schwelle aus dem
Historien-Durchschnitt und kauft Pixel. Nach dem Aufräumen vom 2026-08-01 ist der
tote Kaufpfad entfernt. Wenn Labore kommen, braucht es einen echten Einkauf für
Basisminerale — dann lohnt es, die Rentabilitätsrechnung
(`Game.market.calcTransactionCost`, Energiekosten gegen Erlös) an einer Stelle
zu bündeln, statt sie je Funktion zu wiederholen.

## Observer

Ab RCL8 könnte ein Observer Räume aufklären, ohne Scouts zu schicken — das würde
Plan 07 verbilligen. Der Vergleichsbot beschreibt es, hat es aber nicht gebaut.
Frühestens sinnvoll, wenn die Aufklärung aus Plan 07 steht und ihre Kosten
gemessen sind.

## Was aus dem Vergleichsbot bewusst nicht kommt

Zusammengefasst, damit es nicht später doch eingeschleppt wird:

- Die `Ant`-Klassenhierarchie mit rollenlokalen Body-Formeln — dort selbst durch
  `BodyBuilder` und `SpawnDemandManager` abgelöst und nur noch über ein
  Altlast-Flag erreichbar.
- Die hartcodierte Raum-Layout-Datei.
- `ErrorMapper` mit vollem Sourcemap-Aufbau: verlangt einen Eingriff in die
  Build-Kette und kostet nach jedem Global-Reset laut eigenem Kommentar über
  30 CPU — auf 20 CPU pro Tick ein Eigentor. Unser `reportError` mit Rollenname
  und Stack deckt den praktischen Nutzen ab.
- Round-Robin-Drosselung für Miner: ein übersprungener Miner-Tick kostet echte
  Energie. Sein eigener Plan warnt davor ausdrücklich für alle Phasen außer dem
  Endgame.
- Automatischer Safe Mode: **beide** Bots verzichten bewusst darauf, seine
  Plandatei 08 hält manuelle Auslösung ausdrücklich für besser. Das bleibt so.
- Der zweistufige Link-Zähl-Cache und der Creep-Zähl-Cache: Aufwand ohne
  erkennbaren Gewinn bei unserer Raumzahl.
