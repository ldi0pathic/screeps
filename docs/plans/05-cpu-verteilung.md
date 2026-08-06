# Plan 05: CPU-Verteilung über den Tick

Status: **Schritte 1 bis 4 gebaut** (2026-08-06, siehe `docs/aenderungen.md`),
Wirkung noch nicht gemessen. **Schritt 5 offen** (CPU-Stufen). Befund 6
(`range` an Pfadsuchen) ebenfalls offen — er braucht eine Einzelprüfung je
Aufrufstelle, ob der Creep ein Feld früher noch in Reichweite seines
`transfer`/`withdraw` steht.

Nachtrag zu Schritt 3: Plan nennt „Türme **und Notfall-Spawn**". Umgesetzt sind
nur die Türme. Einen eigenen Einstieg für den Notfallspawn gibt es nicht, und
den Spawncontroller ganz nach vorn zu ziehen wäre kontraproduktiv — er läuft nur
alle fünf Ticks und kostet je Aufruf ein Vielfaches der Türme (5,47 gegen 0,40
gemessen), würde die Spitze also vergrößern statt verkleinern.

Beim Staffeln der Tagesjobs gefunden: **der Straßenwiederaufbau arbeitet auf
einem Datenstand, den niemand mehr auffrischt.** `findAndSaveRoads()` ist die
einzige Stelle, die `Memory.rooms[<raum>].roads` füllt, und wird nirgends
gerufen — im alten Bot steht der Aufruf auskommentiert
(`prod/controller.timing.js:79`). Das ist eine Entscheidung des Betreibers, kein
Fehler; Einzelheiten in `docs/aenderungen.md`.

Bei 20 CPU ist das hier die Voraussetzung dafür, dass mehr Räume überhaupt
hineinpassen.

## Befund 1: Die Türme laufen zuletzt

`main.ts::loop` arbeitet erst alle Creeps ab und ruft **danach**
`timer.controll()` — und damit Türme, Spawncontroller und Verteidigungsscan.
Wenn das CPU-Limit während der Creep-Schleife greift, bricht das Spiel den Tick
ab: die Türme haben dann in diesem Tick nicht geschossen.

Der Vergleichsbot macht es umgekehrt und begründet es in
`docs/plans/README.md` dort ausdrücklich: *„CPU exhaustion silently drops all
remaining actions — critical work must always be early in the loop."* Seine
`main.ts:22-94` führt Notfall-Spawn und Turmverteidigung vor den normalen Jobs
aus.

Vorschlag: Türme und Notfall-Spawn **vor** die Creep-Schleife ziehen, der Rest
von `timer.controll()` bleibt dahinter. Das ist eine Reihenfolgeänderung im
Tick, also eine Verhaltensänderung — aber eine, die nur im Mangelfall
überhaupt sichtbar wird.

## Befund 2: Alle Räume im selben Tick

- `defence.ts:87-88` (`tower()`) läuft **jeden Tick** über alle zehn Räume aus
  `bot.room`, mit `find(FIND_HOSTILE_CREEPS)` und bis zu zwei
  `find(FIND_STRUCTURES)` je Raum.
- `defence.ts:8-9` (`check()`) läuft alle 7 Ticks — aber dann für **alle** Räume
  gebündelt in diesem einen Tick.
- Die Tagessequenz in `timing.ts:59-82` verteilt verschiedene *Aufgaben* über
  Ticks, jede Aufgabe bearbeitet aber alle Räume auf einmal.

Damit wächst die Spitzenlast linear mit der Raumzahl. Das Gegenmittel ist
Staffelung: `(Game.time + roomIndex) % interval === 0`, ein Raum je Tick. Die
Summe bleibt gleich, die Spitze sinkt auf ein Zehntel — und die Spitze
entscheidet, ob der Tick durchläuft.

Wichtig: **`tower()` darf nicht gestaffelt werden.** Turmfeuer ist taktisch und
muss jeden Tick für jeden bedrohten Raum laufen. Staffelbar sind `check()`, die
Tagesjobs und später die Aufklärung. Der teure Reparatur-Zweig in `tower()` ist
mit `Game.time % 3 == 2` bereits entschärft.

## Befund 3: Doppelter Scan in derselben Funktion

`defence.ts:163` und `:170` rufen **zweimal** `room.find(FIND_STRUCTURES)` ohne
Filter im selben Durchlauf auf — einmal für den Hits-Schnappschuss, einmal für
den Schadensvergleich. Eine Variable statt zwei Aufrufen. Kleinster Schritt im
ganzen Plansatz, **keine Verhaltensänderung.**

Ebenso: `tower()` sucht `FIND_HOSTILE_CREEPS` erneut, obwohl `check()` denselben
Raum kurz vorher schon geprüft hat. Der Vergleichsbot löst das mit einem
gecachten Feind-Scan (`DefenseManager.getHostileInfo`, 3 Ticks Cache) als
einziger Quelle. Für uns: ein Scan je Raum und Tick, von beiden Stellen
genutzt.

## Befund 4: Keine CPU-Steuerung

Es gibt bei uns keinen einzigen Zugriff auf `Game.cpu.bucket` oder
`Game.cpu.getUsed()` zur Steuerung. Der Vergleichsbot leitet aus
Bucket-Schwellen und einem Mittel über die letzten 10 Ticks ein Budget ab und
schaltet ganze Stufen ab, wenn es überschritten wird.

Für uns ist das eine **Ausfallsicherung, kein Effizienzgewinn** — bei vollem
Bucket läuft ohnehin alles. Der Nutzen zeigt sich genau dann, wenn es knapp
wird: nach einem Angriff, bei vielen gleichzeitigen Neuberechnungen, nach einem
Global-Reset.

Einteilung, die zu unserem Bot passt:

| Stufe | Inhalt | Darf ausfallen |
| --- | --- | --- |
| kritisch | Türme, Notfall-Spawn, Miner und Hauler | nie |
| normal | übrige Rollen, Spawncontroller, Verteidigungsscan | nur bei sehr niedrigem Bucket |
| niedrig | Statuslog, Straßenwiederaufbau, Tagesjobs, Terminal und Markt | zuerst |

Reihenfolge: erst Plan 01 messen, dann Schwellen aus den gemessenen Werten
ableiten. Schwellen ohne Messung wären geraten.

## Befund 5: Pixel verbrauchen den Sicherheitspuffer

`timing.ts:40` erzeugt ein Pixel, sobald der Bucket bei 10 000 steht. Das kostet
genau die 10 000 Bucket, die auf einem 20-CPU-Server der Puffer für schlechte
Ticks sind. Der Vergleichsbot nennt in seiner Regelliste ausdrücklich
*„Pixel generation off by default. Never auto-enable on a 20 CPU server."*

Das ist eine Abwägung, keine technische Frage: Pixel sind für dich echter
Gegenwert (du tauschst sie gegen Skins), aber sie kosten die Reserve. Siehe
offene Frage unten.

## Befund 6: Pfadsuche auf nicht betretbare Ziele

`moveByMemory` sucht mit `creep.pos.findPathTo(target)` **ohne** `range`. Für
Container und Straßen ist das richtig, für Storage, Link, Terminal und Spawn
nicht: diese Felder sind nicht betretbar. Die Wissensbasis
(`knowledge/efficiency/cpu-pathfinding.md`) ist dazu eindeutig — *„If target is
not walkable, set `range >= 1`; otherwise CPU is wasted searching for an
impossible tile."* Der Weg kommt trotzdem heraus (das Spiel liefert den Pfad zum
nächstgelegenen erreichbaren Feld), aber die Suche verbraucht mehr Ops als nötig.

Betroffen sind die Aufrufe in `creep/base.ts` (Storage, Link) und
`creep/transport.ts`. Der Umbau des Pfad-Caches (Runde 2026-08-04) hat die
Stelle nur umsortiert und **nicht** geändert, weil ein `range` das Zielverhalten
ändert: der Creep bleibt dann ein Feld früher stehen, und ob jede aufrufende
Stelle damit noch in Reichweite ihres `transfer`/`withdraw` ist, muss einzeln
geprüft werden. Gehört gemessen (Plan 01) und dann gezielt geändert.

## Vorgehen

1. Doppelten `find` in `defence.ts` zusammenlegen. Kein Zustimmungsbedarf.
2. Feind-Scan je Raum einmal pro Tick, von `check()` und `tower()` gemeinsam
   genutzt.
3. Türme und Notfall-Spawn vor die Creep-Schleife.
4. `check()` und die Tagesjobs auf einen Raum je Tick staffeln.
5. CPU-Stufen einführen, mit Schwellen aus den Messwerten von Plan 01.

## Abnahmekriterien

- CPU pro Tick und CPU pro Raum aus Plan 01 vor und nach jedem Schritt.
- Spitzenwert `max` pro Tick sinkt nach Schritt 4 messbar, der Mittelwert bleibt
  nahezu gleich — genau das ist der Zweck der Staffelung.
- Nach Schritt 3: künstlich erzeugte CPU-Knappheit lässt die Türme trotzdem
  feuern. Prüfbar in der Sandbox mit gedrosseltem `Game.cpu.getUsed()`.
- Nach Schritt 5: bei niedrigem Bucket fällt nur die niedrige Stufe aus,
  belegbar über das Log.

## Pixelfrage: nach der Messung entschieden — bleibt unverändert

Die Messung liegt vor (`docs/profiler/`) und zeigt, dass der Puffer heute nicht
gebraucht wird:

- **CPU je Tick 9,12** bei einem Limit von 20. Der teuerste gemessene Abschnitt
  war `creeps` mit 10,01, der zweitteuerste `timing` mit 7,23 — selbst wenn
  beide Spitzen in denselben Tick fielen, bliebe man unter dem Limit.
- **Bucket im Mittel 2043, Minimum 1545.** Das ist die Nebenwirkung der
  Pixelerzeugung, aber 1545 Bucket sind immer noch rund 150 Ticks Reserve bei
  10 CPU Überziehung.

Damit bleibt die Pixelerzeugung, wie sie ist. Sie kostet Reserve, die der Bot
derzeit nicht braucht, und Pixel sind echter Gegenwert.

**Was die Entscheidung umdrehen würde**, nachprüfbar mit `prof.history()`:
steigt `cpuMaxTick` in die Nähe von 20 oder fällt `bucketMin` unter etwa 500,
ist der Puffer keine Rücklage mehr, sondern knapp — dann greift die mittlere
Variante (nur erzeugen, wenn der Bucket eine Weile stabil voll war). Beide Werte
stehen in jeder Verlaufszeile, es braucht dafür keine neue Messung.
