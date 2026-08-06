# Übergabe 2026-08-06: elf Commits, im Spiel zu prüfen

Stand: gepusht als `origin/analyse-vergleichsbot`, **nicht** nach `main` gemergt.
Im Spiel läuft also weiter der alte Bot. Diese Datei ist die Prüfliste für den
Tag, an dem er ausgetauscht wird.

Alle Änderungen sind lokal abgenommen — Typecheck, 239 Tests, Build und
Smoketest bei **jedem** Commit grün. **Keine** ist im Spiel gemessen; es gab
während der Arbeit keinen Spielzugriff. Genau das holt diese Liste nach.

---

## 1. Vor dem Deploy: Grundlinie sichern

Ohne diesen Schritt ist der alte Stand nicht mehr messbar, und alle
Wirkungsaussagen unten bleiben Behauptungen.

```
prof.on()                        // Detailmessung einschalten
                                 // ein volles Fenster abwarten (100 Ticks)
prof.baseline("vor-planrunde")   // Grundlinie festhalten
prof.mail()                      // Bericht zusätzlich per Mail sichern
```

Notier dir aus dem Bericht drei Zahlen von Hand, als Rückfallebene:
**CPU/Tick**, **Anteil `debitor`**, **`cpuMaxTick`**.

## 2. Deploy

```
git checkout main
git merge analyse-vergleichsbot
git push
```

Der GitHub-Sync des Spiels zieht `tsProd/main.js`. Der Build ist in jedem Commit
enthalten und passt zum jeweiligen Stand von `src/`.

Erkennbar ist der neue Stand an der ersten Zeile von `tsProd/main.js` — dem
Build-Stempel. Im Spiel siehst du ihn nicht direkt; verlass dich stattdessen auf
die Prüfpunkte unten.

## 3. Die ersten fünfzig Ticks: sieht es gesund aus?

In dieser Reihenfolge, weil ein Fehler weiter oben die Punkte darunter erklärt.

### 3.1 Läuft der Tick überhaupt durch?

Konsole auf Ausnahmen ansehen. `main.ts` fängt Rollenfehler je Creep ab und
meldet sie mit Rollennamen, ein Dauerfehler kommt zusätzlich einmal per Mail.

**Alarmzeichen:** eine Meldung `Job: filler (...)` oder `Job: hauler (...)`. Das
sind die neuen Rollen.

### 3.2 Spawnen Filler und Hauler?

```
_.countBy(Game.creeps, c => c.memory.role)
```

Erwartet in einem Raum **mit** Storage: mindestens ein `filler`, dazu ein
`hauler` je Quellcontainer, der **keinen** sendenden Link hat.

Erwartet in einem Raum **ohne** Storage: weiter `debitor`, kein Filler, kein
Hauler.

**Wenn gar nichts kommt**, ist fast immer die Zuständigkeitsgrenze schuld — sie
hängt am **Bauwerk**, nicht am RCL:

```
Game.rooms["E58N6"].storage        // muss ein Objekt sein, nicht undefined
```

### 3.3 Laufen die alten Debitoren aus?

**Das ist Absicht und sieht trotzdem nach zu vielen Creeps aus.** Rollennamen
stehen im Creep-Memory; die zum Umstellungszeitpunkt lebenden Debitoren müssen
ihre bis zu 1500 Ticks zu Ende arbeiten. Neue kommen nicht mehr nach.

```
_.filter(Game.creeps, c => c.memory.role === "debitor" && c.memory.home === c.memory.workroom).length
```

Diese Zahl muss über die nächsten 1500 Ticks auf **0** fallen. Fällt sie nicht,
spawnt irgendwo noch ein Heimatraum-Debitor — dann stimmt die Grenze in
`Debitor.spawn` nicht.

### 3.4 Feuern die Türme noch?

Die Türme laufen jetzt **vor** der Creep-Schleife statt danach. Ein Angriff ist
der einzige echte Test; ersatzweise reicht, dass kein Fehler aus
`controller/timing (kritischer Teil)` kommt.

---

## 4. Nach 100 Ticks: hat es gewirkt?

```
prof.compare("vor-planrunde")
```

Was ich erwarte, mit dem Grund dahinter:

| Kennzahl | Erwartung | Warum |
| --- | --- | --- |
| Anteil `debitor` | fällt deutlich unter 38,7 % | Die Arbeit verteilt sich auf `filler` und `hauler`, und die Ablieferziele werden gemerkt statt in jedem Tick neu gesucht |
| `filler` + `hauler` + `debitor` zusammen | **niedriger** als `debitor` vorher | Wäre die Summe gleich, hat die Aufteilung nur umverteilt und das Zielgedächtnis nicht gegriffen |
| `miner` je Creep | gleichmäßig statt gespreizt | Vorher kosteten 4 von 15 Minern das Fünf- bis Dreißigfache der übrigen |
| `cpuMaxTick` | sinkt | Staffelung: Verteidigungsscan und Tagesjobs treffen nicht mehr alle Räume im selben Tick |
| CPU/Tick im Mittel | etwa gleich | Die Staffelung verschiebt die Spitze, nicht die Summe |

**Die wichtigste Einzelzeile im Vergleich** ist `miner`: fällt der Anteil dort
nicht, war meine Diagnose der Endlossuche falsch.

### Der Verlauf über mehrere Fenster

```
prof.history()
```

Der erste Aufruf fordert nur das Speichersegment an, die Ausgabe kommt einen Tick
später — das ist die API, kein Fehler.

---

## 5. Was gezielt schiefgehen kann

### 5.1 Der RCL8-Upgrader zieht am Storage

Er hat jetzt **15 WORK statt 4** und verbraucht damit 15 Energie je Tick statt
0,5. Das ist der Zweck, aber es ist auch der einzige Punkt, an dem eine Änderung
Energie **kostet**.

```
Game.rooms["E58N6"].storage.store.energy
```

Er arbeitet, solange dort mehr als **100 000** liegen, oder wenn
`ticksToDowngrade` unter 100 000 fällt. Gespawnt wird er weiterhin erst ab
250 000.

**Alarmzeichen:** das Storage fällt unter 100 000 und der Upgrader arbeitet
trotzdem weiter. Dann greift die Drossel nicht.

**Gegenprobe, dass er überhaupt etwas tut:** `Game.rooms["E58N6"].controller.progress`
muss deutlich schneller wachsen als vorher — der Richtwert ist das Dreißigfache.

### 5.2 Der erste Transfer eines Raumpaars ist noch groß

Die Rolle dimensioniert sich jetzt aus der **gemessenen** Strecke. Solange keine
Messung vorliegt, bleibt es beim alten Profil — der erste muss erst fahren.

```
Memory.rooms["E57N6"].transferSize     // erscheint nach genügend Messungen
Memory.rooms["E57N6"].transferDistances // die laufende Messreihe
```

Die Festschreibung greift erst bei rund **61** Messungen, nicht bei 31: die
Schwelle zählt den Medianindex, nicht die Messwerte. Das ist bestehendes
Verhalten des Debitors, wörtlich übernommen — wundere dich also nicht, wenn
`transferSize` lange leer bleibt.

### 5.3 Die Rauminventur braucht Sicht

```
Memory.rooms["E58N6"].energySources
```

Wird einmal je Raum erhoben und danach nie wieder angefasst — Quellen sind
unveränderlich. Solange in `config.ts` etwas steht, **gewinnt die Config**; die
Erhebung wirkt nur dort, wo bisher nichts konfiguriert ist. Für alle neun
laufenden Räume ändert sich also nichts.

Beim ersten Tagesdurchgang erscheint je Raum eine Zeile:
`[E58N6] Vorkommen erhoben: 2 Quellen, 1 Minerale`

### 5.4 Die CPU-Stufen dürfen nicht anspringen

Sie sind eine Ausfallsicherung, keine Drossel für den Normalbetrieb. Im
Normalfall siehst du sie **nie**.

**Alarmzeichen:** eine Zeile `[cpu] Stufe "niedrig" ausgelassen: ...` oder
`Stufe "normal"`. Kommt die regelmäßig, sind die Schwellen falsch kalibriert —
melde mir dann die Zahlen aus der Meldung, sie enthält Bucket und verbrauchte
CPU.

---

## 6. Zwei Fragen, die nur du im Spiel beantworten kannst

### 6.1 Sind die Straßendaten tot?

```
Memory.rooms["E58N6"].roads
```

`findAndSaveRoads()` ist die **einzige** Stelle, die diese Liste füllt, und sie
wird nirgends aufgerufen — im alten Bot steht der Aufruf auskommentiert
(`prod/controller.timing.js:79`). Jemand hat das bewusst abgeschaltet, deshalb
habe ich es **nicht** wieder eingeschaltet.

- Kommt `undefined`: der Tagesjob `rebuildRoads` und das `saveRoads`-Flag in vier
  Räumen sind toter Code und gehören weg.
- Kommt eine Liste: sie stammt noch vom alten JavaScript-Bot und wird nie
  aufgefrischt. `rebuildRoads` baut dann nach einem alten Schnappschuss wieder
  auf — auch Straßen, die du absichtlich hast verfallen lassen.

Beides ist eine Entscheidung, keine technische Frage. Sag mir das Ergebnis, dann
räume ich in die passende Richtung auf.

### 6.2 Bleibt die Pixelerzeugung an?

Ich habe sie **angelassen**. Die Messung sprach dafür: 9,12 CPU je Tick bei Limit
20, Bucket im Minimum 1545 — der Puffer wird nicht gebraucht, und Pixel sind
echter Gegenwert.

Umdrehen würde ich das, wenn `prof.history()` zeigt, dass `cpuMaxTick` in die
Nähe von 20 kommt oder `bucketMin` unter etwa 500 fällt. Beide Werte stehen in
jeder Verlaufszeile.

---

## 7. Wenn etwas kippt

Der Bot läuft live und synct über GitHub, also ist der Rückweg ein Commit:

```
git revert <commit>            # eine einzelne Runde zurücknehmen
git push
```

Jede Runde ist ein eigener Commit mit eigenem Build — ein Rückschritt lässt sich
eindeutig zuordnen. Die riskantesten drei, in dieser Reihenfolge:

| Commit | Runde | Warum riskant |
| --- | --- | --- |
| `c925d10` | `filler` und `hauler` | Fasst Spawn-Priorität und die Heimatlogistik an |
| `7b095cc` | RCL8-Upgrader | Einziger Punkt, der zusätzlich Energie **verbraucht** |
| `23e87be` | Türme vor der Creep-Schleife | Ändert die Reihenfolge im Tick |

Ein kompletter Rückzug ist `git revert eb4b5c3..3953c3e` oder schlicht `main` auf
`d6efd19` zurücksetzen.

---

## 8. Die elf Commits

| Commit | Plan | Inhalt |
| --- | --- | --- |
| `3953c3e` | 10 | Ablieferziele merken statt in jedem Tick neu suchen |
| `44ea18e` | 10 | Miner erreicht immer einen Standplatz und behält seinen Container |
| `c925d10` | 10 | Logistik nach Job schneiden — `filler` und `hauler` |
| `7b095cc` | 04 | RCL8-Upgrader schöpft die erlaubte Rate aus |
| `2ad2a42` | 05 | Ein Feind-Scan je Raum und Tick |
| `23e87be` | 05 | Türme laufen vor der Creep-Schleife |
| `f26b0a0` | 05 | Raumarbeit gestaffelt statt gebündelt |
| `bca2267` | 05 | CPU-Stufen als Ausfallsicherung |
| `73ba8fd` | 02 | Quellen und Minerale erheben statt konfigurieren |
| `6793664` | 03 | Umlaufmessung als eigene Klasse |
| `eb4b5c3` | 03 | Transfer dimensioniert sich aus der gemessenen Strecke |

Die ausführliche Begründung je Runde steht in `docs/aenderungen.md`, der Stand je
Plan in `docs/plans/README.md`.

## 9. Was als nächstes anstünde

Offen und der Reihe nach am wertvollsten:

1. **Plan 06 — Sparmodus und Rotationsbetrieb.** Besitz von Betrieb entkoppeln.
   Nach Plan 05 ist die Voraussetzung da. Das ist der Schritt, der aus „fünf
   Räume möglich" ein „zehn besitzen, sechs betreiben" macht.
2. **Plan 07 — Expansion.** Der ausgesprochene Wunsch, automatisch zu claimen.
   Braucht 06 als Fundament.
3. **Plan 03 Punkt 4** — Builder- und Repairerzahl aus dem Bedarf statt aus
   festen Zahlen.
4. **Plan 04 Punkt 3** — die Tickdrossel bei RCL 6 und 7. Dort kostet sie echten
   RCL-Fortschritt, nicht nur GCL.
5. **Plan 05 Befund 6** — `range` an den Pfadsuchen auf nicht betretbare Ziele.
   Braucht eine Einzelprüfung je Aufrufstelle, ob der Creep ein Feld früher noch
   in Reichweite seines `transfer`/`withdraw` steht.

Beide großen Pläne (06, 07) sind keine Runde mehr, sondern jeweils ein eigener
Entwurf.
