# Profiler: Befehle für die Spielkonsole

Referenz zur Bedienung des CPU-Profilers (`tsBot/src/profiler/`). Warum es ihn
gibt und was er misst, steht in
[Controller und Automatik](controller-und-automatik.md#profiler-profiler);
der Entwurf in [Plan 01](plans/01-profiler.md).

Das Handle liegt auf `global` (`bot.prof` in `globals.ts`, und `bot` ist dasselbe
Objekt wie `global`). In der Spielkonsole tippt man deshalb **ohne Präfix**:

```javascript
prof.status()
```

Jeder Befehl gibt eine Zeichenkette zurück, die Konsole zeigt also immer eine
Rückmeldung statt `undefined`.

## Übersicht

| Befehl | Wirkung |
| --- | --- |
| `prof.light()` | Zustand `light` — nur Gesamttick, Bucket, CPU pro Raum und pro Creep |
| `prof.on()` | Zustand `full` — zusätzlich Abschnitte, Rollen und Klassenmethoden |
| `prof.off()` | Messung aus, `Memory.stats` wird gelöscht |
| `prof.status()` | Zustand, Fensterfüllstand, Restticks der Detailmessung, Farbe der Schalterflagge |
| `prof.report()` | Bericht über das laufende Fenster, sofort |
| `prof.reset()` | Laufendes Fenster verwerfen und neu beginnen |
| `prof.detail(ticks)` | Detailmessung je Creep für `ticks` Ticks (Vorgabe 50), danach automatisch zurück |
| `prof.baseline(name)` | Laufendes Fenster als benannte Grundlinie in `Memory` festhalten |
| `prof.baselines()` | Alle Grundlinien plus die Zeile `jetzt` nebeneinander |

Ohne Tippen geht es auch: eine Flagge namens `prof` schaltet über ihre Farbe,
siehe [Flaggen-Schalter](#flaggen-schalter-statt-tippen).

## Zustände

| Zustand | Was gemessen wird | `Game.cpu.getUsed()` je Tick |
| --- | --- | --- |
| `off` | nichts. Standard nach dem Deployment | 0 |
| `light` | Gesamttick, Bucket, Räume, Creeps | 1 |
| `full` | zusätzlich Abschnitte, Rollen, `@profile`-Methoden | ~15 + 1 je Creep |

- Der Zustand steht in `Memory.profiler.mode` und **übersteht einen
  Global-Reset**. Umschalten braucht kein neues Deployment.
- Ein Zustandswechsel **verwirft das laufende Fenster** — sonst mischte es Ticks
  aus `light` und `full`, und die abgeleiteten Zahlen wären nicht vergleichbar.
- Die Zähler des Fensters liegen im Heap, nicht in `Memory`. Ein Global-Reset
  (Deployment, Serverneustart) löscht sie: nach einem Deployment beginnt die
  Messung bei 0 Ticks, auch wenn der Zustand erhalten bleibt.
- `light` ist der sinnvolle Dauerzustand. `full` nur zum Suchen.

## Ausgabe alle 100 Ticks

Ist der Profiler an, gibt jedes volle Fenster (100 Ticks) von allein eine Zeile
aus und schreibt `Memory.stats`; danach beginnt ein frisches Fenster.

```
[prof] Fenster=100T | CPU/Tick=8.43 | CPU/Raum=2.81 | CPU/Creep=0.14 | Bucket~9821 (min 9540) | Limit=20 | Top: miner 18.2%, transfer 12.7%, upgrader 9.4%
```

- `CPU/Raum` ist die Zahl, die über die Zahl der Räume entscheidet: CPU pro Tick
  geteilt durch die Zahl der Räume aus `global.room`.
- `Bucket min` ist das Frühwarnzeichen. Sinkt es über mehrere Fenster, war die
  letzte Änderung zu teuer.
- `Top` nennt die drei teuersten **Rollen** und bleibt in `light` leer (`-`),
  weil dort keine Rollen gemessen werden.

## Detailbericht

`prof.report()` hängt an die Fensterzeile bis zu vier Tabellenblöcke, sofern
Daten vorliegen: **Abschnitte**, **Rollen**, **Methoden**, **Creeps**. Spalten je
Zeile: `Name`, `CPU/Tick`, `CPU/Aufruf`, `Aufrufe/Tick`, `Max`, `Anteil%`,
sortiert nach Anteil.

Die Blöcke sind **verschachtelt**, nicht disjunkt: `timing.tower` steckt schon in
`timing`, `Miner.doJob` schon in `miner`. Die Prozentanteile über alle Blöcke
hinweg summieren deshalb absichtlich über 100 % — `Anteil%` bezieht sich immer
auf den Gesamttick, nie auf den Elterneintrag.

Abschnittsnamen (aus `SECTION` in `profiler/types.ts`):

| Name | Ort |
| --- | --- |
| `rooms` | Raum-Visuals und Memory-Init, erste Schleife in `main.ts::loop` |
| `creeps` | Creep-Schleife gesamt, zweite Schleife in `main.ts::loop` |
| `timing` | `controller/timing.ts::controll()` gesamt |
| `timing.tower` | Türme, `defence.tower()` |
| `timing.terminal` | Terminal und Markt |
| `timing.pixel` | Pixelgenerierung |
| `timing.spawn` | Spawncontroller |
| `timing.defence` | Verteidigungsscan |
| `timing.status` | Statuslog |
| `timing.links` | Linknetz, `links.sendAll()` — jeden Tick |
| `timing.daily` | Tagessequenz |
| `timing.roads` | Straßenwiederaufbau, innerhalb der Tagessequenz |
| `timing.linkplan` | Linkplaner, innerhalb der Tagessequenz |

`timing.roads` und `timing.linkplan` stecken in `timing.daily`. Sie haben eigene Messpunkte, weil die Tagessequenz nur alle 28.800 Ticks läuft: in einem üblichen Messfenster steht `timing.daily` auf 0,00 und verrät nichts über die Kosten der beiden Planer.

Rollen erscheinen unter ihrem Rollennamen (`miner`, `transfer`, …), ihre
Spawnprüfung zusätzlich als `<rolle>.spawn`. Klassenmethoden aus dem
`@profile`-Dekorator stehen im Block „Methoden" als `<Klasse>.<methode>`.

Der Block **Creeps** füllt sich **nur während einer Detailmessung** — sonst
landeten alle rund 60 Creeps jeden Tick in der Liste.

## Detailmessung

```javascript
prof.detail()      // 50 Ticks (Vorgabe)
prof.detail(200)   // 200 Ticks
```

- Schaltet für die Dauer auf `full`, misst zusätzlich **jeden einzelnen Creep**
  und beginnt ein frisches Fenster.
- Nach Ablauf gibt sie von allein den Abschlussbericht aus und schaltet auf den
  Zustand zurück, der vorher galt (`off`, `light` oder `full`).
- Restticks zeigt `prof.status()`. Ein zweiter Aufruf während der Messung
  verlängert sie und lässt den Rückkehrzustand unverändert.
- Mehr als 100 Ticks anzufordern ist möglich, aber das Fenster ist 100 Ticks
  lang: die reguläre Fensterzeile läuft zwischendurch und setzt die Zähler
  zurück, der Abschlussbericht deckt dann nur den Rest ab.
- `prof.off()`, `prof.light()` und `prof.on()` **brechen eine laufende
  Detailmessung ab** — ohne Abschlussbericht, dafür ohne dass sie Ticks später
  den alten Zustand zurückholt. Das Fenster zeigt `prof.report()` weiterhin.

## Vorher/nachher vergleichen

1. `prof.light()` (oder `prof.on()`, wenn Rollen verglichen werden sollen).
2. **Mindestens 1000 Ticks** laufen lassen. Kürzere Fenster schwanken zu stark,
   weil Spawnwellen, die Tagessequenz (alle 28.800 Ticks) und Angriffe die Werte
   verzerren. Das Fenster ist nur 100 Ticks lang — für 1000 Ticks entweder mehrere
   Fensterzeilen im Log vergleichen oder `Memory.stats` extern sammeln.
3. `prof.baseline("vor-plan-02")` — hält das Fenster fest. Unter 1000 gemessenen
   Ticks warnt der Befehl, speichert aber trotzdem.
4. Genau **eine** Änderung umsetzen und ausrollen.
5. Erneut messen, dann `prof.baselines()`:

```
Name          Tick   Ticks    CPU/Tick    CPU/Raum    CPU/Creep     Bucket-Ø
------------------------------------------------------------------------------
vor-plan-02   58412    1000        8.43        2.81         0.14      9821.00
jetzt         61250     100        7.16        2.39         0.12      9944.00
```

Die Zeile `jetzt` ist das laufende Fenster, keine gespeicherte Grundlinie.
Höchstens **8** Grundlinien werden gehalten; bei Überlauf fällt die älteste
heraus. Beide Fenster gehören nach [aenderungen.md](aenderungen.md).

## Flaggen-Schalter statt tippen

Screeps hat keine API für eigene Bedienelemente: `RoomVisual` zeichnet nur und
ist nicht klickbar. Der einzige Weg, ohne Konsolenbefehl zu schalten, ist eine
**Flagge** — dokumentierte Spiel-API, nur für dich sichtbar, kostet keine
Energie und übersteht jeden Global-Reset.

Setze irgendwo eine Flagge mit dem Namen **`prof`** (der Ort ist gleichgültig,
`Game.flags` gilt weltweit; praktisch ist ein freies Feld neben dem Spawn deines
Hauptraums). Die Flagge bleibt dauerhaft stehen — geschaltet wird über ihre
**Hauptfarbe**:

| Hauptfarbe | Wirkung |
| --- | --- |
| grau (`COLOR_GREY`) | `off` |
| weiß (`COLOR_WHITE`) | `light` |
| grün (`COLOR_GREEN`) | `full` |
| rot (`COLOR_RED`) | Detailmessung über 50 Ticks starten |

Farbe ändern: Flagge im Client anklicken und die Farbe im Flaggen-Dialog
umstellen. Falls dir der Client das nicht anbietet, geht es immer über den
zweiten Weg — **eine neue Flagge mit demselben Namen ersetzt die alte**, also
einfach nochmal setzen, gleiche Bezeichnung, andere Farbe.

Neben der Flagge zeichnet der Bot die Legende als Room Visual: alle vier Farben
mit ihrer Wirkung, die aktive Zeile mit `▶` hervorgehoben, darunter Zustand,
Fensterfüllstand, CPU pro Tick und die Restticks einer laufenden Detailmessung.

Regeln, die man kennen muss:

- **Nur die Farbänderung wirkt** (Flanke), nicht die stehende Farbe. Sonst
  überstimmte die Flagge im nächsten Tick jeden Konsolenbefehl. Die letzte
  verarbeitete Farbe steht in `Memory.profiler.flagColor` und übersteht damit
  auch einen Global-Reset.
- **Die Flagge lügt nicht:** ein Umschalten über die Konsole färbt sie mit. Rot
  heißt „misst gerade"; nach der Detailmessung fällt sie von allein auf die
  Farbe des Zustands zurück, in dem der Profiler weiterläuft.
- Die **Zweitfarbe** ist unbelegt und bleibt für eigene Zwecke frei.
- Eine unbelegte Hauptfarbe wird einmal in der Konsole gemeldet und sonst
  ignoriert.
- Eine gleichnamige Flagge eines **anderen Spielers** kann hier nichts
  auslösen: der Flaggen-Namensraum gilt je Spieler. Deine Flaggen sieht kein
  anderer, und Room Visuals siehst nur du.
- Die Legende wird **nur gezeichnet, solange die Flagge steht** — sie ist damit
  auch der Schalter der Anzeige. Ihre Kosten (sechs `text`-Aufrufe je Tick)
  fallen in die Messung, sind also in `CPU/Tick` enthalten.
- Steht keine Flagge, kostet die Mechanik einen Objektzugriff auf `Game.flags`
  je Tick und sonst nichts.

## Memory prüfen

```javascript
JSON.stringify(Memory.profiler).length   // muss unter 1024 bleiben
Memory.profiler                          // mode, detailUntil, detailReturnTo, baselines
Memory.stats                             // flaches Zahlenobjekt in Grafana-Konvention
delete Memory.profiler.baselines         // alle Grundlinien wegwerfen
```

`Memory.stats` schreibt jedes volle Fenster neu (komplett ersetzt, damit keine
verwaisten Schlüssel stehenbleiben) und wird von `prof.off()` gelöscht. Schlüssel
und Aufteilung stehen in
[Konfiguration und Speicher](konfiguration-und-memory.md#profiler-memory-memoryprofiler-memorystats).

## Grenzen

- `Game.cpu.getUsed()` am Ende von `loop()` erfasst die **Serialisierung von
  `Memory`** nicht, die das Spiel danach vornimmt. Alle Zahlen sind eine
  Untergrenze.
- Im Zustand `off` läuft kein einziges `getUsed()` — die Eigenkosten der Messung
  lassen sich deshalb nur als Differenz `light` gegen `full` über je 500 Ticks
  bestimmen, nicht gegen `off`.
- Ein leeres Fenster liefert keine erfundenen Zahlen: `prof.report()` und
  `prof.baseline(name)` melden stattdessen, dass kein Tick gemessen wurde.
