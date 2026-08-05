# Verbesserungspläne

Ziel: **maximale Effizienz und möglichst viele Räume vollständig ausbauen**, bis
RCL8 einschließlich Labore und Boosts. Harte Randbedingung: **20 CPU pro Tick.**

Diese Pläne entstanden aus dem Vergleich unseres laufenden Bots mit
`C:\GIT\github\Screeps_TS` — einem nie eingesetzten Bot desselben Betreibers mit
reicherer Architektur und 19 eigenen Planungsdokumenten.

## Was der Vergleichsbot wirklich liefert

Wichtig für die Erwartungshaltung, weil die Dateinamen dort mehr versprechen als
der Code hält. Alles hier wurde am Code geprüft, nicht aus den Plänen abgelesen:

| Erwartet | Tatsächlich |
| --- | --- |
| Automatischer Raum-Layouter | Nein. `LayoutManager.getLayout()` kennt genau einen Raum (`case "W5N8"`), die Koordinaten wurden im Web-Planner von Hand gebaut und per `LayoutExporter` exportiert. Kein Anker, kein Offset, keine Rotation, keine Terrain-Analyse. |
| Automatische Expansion | Nein. `ScoutPlanner.getBestExpansionTarget()` wird nirgends aufgerufen, `ClaimerCreepMemory.targetClaim` nie gesetzt. Das Claimen ist dort so manuell wie bei uns. |
| GCL-Grenze beachtet | Nein. Kein einziger `Game.gcl`-Zugriff im ganzen Baum. |
| `pull`-Mechanik fürs Endgame | Nein, nur als Idee in Plan 16 beschrieben. |
| Observer, Markt, Labore, Factory | Nein, laut eigener Lückenliste (Plan 18) alle vier abwesend. |
| Gemessene Remote-Distanzen | Nein — dort geschätzt (und zwischen zwei Stellen widersprüchlich: `routeDistance × 6` gegen `routeLen × 3`). **Unsere** gemessene Lösung in `roles/debitor.ts` ist die bessere; sie steht in Plan 17 dort sogar als offener Wunsch. |

Echt vorhanden und wertvoll sind: automatische Strukturerkennung per `find` mit
Memory-Cache, ein CPU-Budget mit Stufen, Staggering der Raum-Scans, ein
Phasenmodell, zentrale Körperprofil-Formeln, ein gecachter Feind-Scan und
Durchsatzformeln mit Herleitung.

## Die Kette, die über „viele Räume" entscheidet

Nicht offensichtlich, aber der wichtigste Zusammenhang dieser Analyse:

**Räume claimen braucht GCL → GCL kommt ausschließlich aus
Controller-Upgrades → unsere RCL8-Räume upgraden mit rund 0,5 von 15 erlaubten
Energie pro Tick, also etwa 3 %.**

Damit ist der RCL8-Upgrader (Plan 04) kein Detail am Rand, sondern der direkte
Hebel auf das Hauptziel. Er ist zugleich der kleinste Eingriff im ganzen Satz:
eine Rollendatei.

Die zweite Kette betrifft die CPU-Seite und stammt aus einem Einwurf des
Betreibers: **CPU kostet der Betrieb eines Raums, nicht sein Besitz.** Die Last
hängt fast vollständig an der Zahl der Creeps und der Raum-Scans. Wenn nur eine
Teilmenge der Räume ausbaut und der Rest in einem Sparbetrieb weiterfördert,
begrenzen die 20 CPU die Zahl der **aktiven** Räume statt der Zahl der Räume
(Plan 06). Das ist der Unterschied zwischen „fünf Räume möglich" und „zehn
Räume besitzen, fünf davon gerade ausbauen".

## Reihenfolge

| # | Plan | Zweck | Verhaltensänderung | Stand |
| --- | --- | --- | --- | --- |
| 01 | [Profiler und Kennzahlen](01-profiler.md) | Grundlinie messen, Engpässe finden. Ohne das ist alles Weitere Raten. | nein | Stufe 1+2 umgesetzt, Stufe 3 zurückgestellt |
| 02 | [Strukturerkennung statt Hand-IDs](02-strukturerkennung.md) | Quellen, Links, Container automatisch finden. Größter Hebel gegen Handarbeit pro Raum. | ja | offen |
| 03 | [Durchsatz und Körperprofile](03-durchsatz-und-bodies.md) | Bodies und Creepzahlen aus Durchsatz statt fester Zahlen. Enthält einen gefundenen Bug. | ja | Bug behoben, Profile zentralisiert; Durchsatzlogik offen |
| 04 | [RCL8-Upgrader und GCL](04-rcl8-upgrader-und-gcl.md) | Ungenutzte Upgrade-Kapazität heben — das GCL-Nadelöhr. | ja | offen |
| 05 | [CPU-Verteilung](05-cpu-verteilung.md) | Scans staffeln, CPU-Stufen als Ausfallsicherung. | ja | offen |
| 06 | [Sparmodus und Rotationsbetrieb](06-raum-sparmodus.md) | Besitz von Betrieb entkoppeln: zehn Räume besitzen, sechs betreiben. | ja | offen |
| 07 | [Expansion](07-expansion.md) | Aufklärung, Raumbewertung, Remote-Rentabilität, automatisches Claimen. | ja | offen |
| 08 | [Ausblick: Phasen, Layout, Labore](08-ausblick.md) | Was danach kommt und was wir selbst bauen müssen. | ja | offen |
| 09 | [Linknetz und Übernahmen](09-linknetz-und-uebernahmen.md) | Links zentral senden statt zufällig aus dem Miner; dazu die Auswertung, was aus dem Vergleichsbot taugt und was nicht. | ja | Teil A gebaut |
| 10 | [Logistikrollen](10-logistikrollen.md) | Den teuersten Posten des Bots zerlegen: Zielgedächtnis beim Abliefern, Miner ohne Endlossuche, `filler` und `hauler` als eigene Rollen. | ja | gebaut, Wirkung ungemessen |

Begründung der Reihenfolge: 01 liefert die Messgrundlage. 02 bis 04 sind kleine,
lokal begrenzte Schritte mit direkter Wirkung auf Wachstum — sie zahlen sich aus,
bevor irgendetwas Großes gebaut wird. 05 ist die Voraussetzung dafür, dass mehr
Räume überhaupt in 20 CPU passen, und 06 zieht daraus den eigentlichen Schluss.
07 ist der ausgesprochene Wunsch (automatisch claimen), braucht aber 01 bis 06
als Fundament — ein geclaimter Raum ohne Strukturerkennung tut nichts, und ohne
Rotation bremst er die bestehenden. 08 ist ehrlich als Ausblick markiert, weil
dort der größte Teil Eigenbau ist.

## Grundregeln

1. **Erst messen, dann ändern.** Jede Änderung mit einem Vorher- und einem
   Nachher-Fenster über mindestens 1000 Ticks, festgehalten in
   `docs/aenderungen.md`.
2. **Eine Änderung pro Commit.** Der Bot läuft live und synct über GitHub.
3. **Keine Raum-Scans für alle Räume im selben Tick.** Mit 10 Räumen und 20 CPU
   ist das der Unterschied zwischen Luft und Bucket-Verfall.
4. **Kritische Arbeit zuerst im Tick.** Wenn das CPU-Limit zuschlägt, fällt
   stillschweigend alles Weitere aus — Türme, Notfall-Spawn und Miner dürfen
   nie in einer abschaltbaren Stufe liegen.
5. **Statische Konfiguration wird Startwert, nicht Wahrheit.** `config.ts` soll
   künftig überschreiben und aussperren können, nicht das Verhalten tragen.
6. **Keine geschätzten Zahlen im Code.** Werte gegen
   `docs/knowledge/quick-reference/constants.md` prüfen.
7. **Die Wirtschaft nicht gegen CPU optimieren.** Ein übersprungener Miner-Tick
   kostet echte Energie, ein übersprungener Statuslog nicht. Beim Drosseln
   zählt dieser Unterschied.

## Spannung im Ziel, die benannt werden muss

RCL8 mit Laboren und Boosts in vielen Räumen bei 20 CPU ist ambitioniert. Labore
und Boosts kosten CPU und viel neuen Code, und sie zahlen sich erst aus, wenn
die Wirtschaft darunter steht. Deshalb stehen sie in Plan 07 am Ende und nicht
vorne. Wenn die Messung aus Plan 01 zeigt, dass wir bei 10 Räumen schon nahe an
den 20 CPU sind, ist die Reihenfolge „Wirtschaft, dann GCL, dann Expansion, dann
Labore" nicht Bequemlichkeit, sondern Notwendigkeit.
