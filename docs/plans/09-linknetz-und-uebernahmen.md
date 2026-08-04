# Plan 09: Linknetz betreiben — und was aus dem Vergleichsbot taugt

Status: **Vorschlag.** Verhaltensänderung: **ja** für Teil A.
Grundlage: Analyse von `C:\GIT\github\Screeps_TS` (der nie eingesetzte Bot),
Fokus in dieser Reihenfolge: CPU, dann Wartbarkeit.

## Kurzfassung

Das Linkmanagement lohnt sich — aber **nicht** an der Stelle, an der man es
vermutet.

- **Der Linkkeeper ist schon sparsam.** Er prüft je Tick zwei Zahlen und steigt
  aus, wenn nichts zu tun ist (`roles/linkkeeper.ts`: `if (carrying === 0 &&
  inLink === 0) return;`). Ihn von einem Manager „wecken" zu lassen, spart zwei
  Property-Zugriffe und kostet im schlechten Fall Durchsatz: der empfangende Link
  hat **keinen** Cooldown (`knowledge/mechanics/structures-rcl.md`), es gibt also
  nichts, worauf man warten könnte — jeder Tick Verzögerung ist verlorener
  Durchsatz. Diese Begründung steht schon als Kommentar im Code.
- **Der Hebel liegt auf der Senderseite.** Dort entscheidet heute jeder Miner
  einzeln, mit einer Zufallsauswahl und ohne Priorität. Das kostet keine CPU,
  aber Energie-Durchsatz — und Durchsatz ist das, was zusätzliche Räume bezahlt.
- **Und der wichtigste Punkt vorweg:** Plan 01 ist gebaut, hat aber **noch keine
  einzige Zahl geliefert**. Jede CPU-Aussage in diesem Plan ist eine Vermutung,
  bis `prof.light()` über 1000 Ticks gelaufen ist. Der billigste nächste Schritt
  für Fokus 1 ist deshalb nicht Code, sondern eine Messung.

---

# Teil A: Das Linknetz

## Was unser Bot heute tut

| Ort | Verhalten je Tick |
| --- | --- |
| `roles/miner.ts:287-306` | Ist der eigene Link voll (`transfer` liefert `ERR_FULL`), sucht der Miner ein Ziel: bei gut gefülltem Storage den `controllerLink`, sonst einen **zufälligen** Eintrag aus `targetLinks`. Gesendet wird, wenn das Ziel mehr als 50 frei hat. |
| `roles/linkkeeper.ts` | Steht auf dem Feld zwischen Basis-Link und Storage und pendelt Energie um. Steigt aus, wenn Link und eigener Store leer sind. |
| `creep/base.ts::harvestControllerLink` | Upgrader holen aus dem `controllerLink`, wenn dort mehr als 100 liegen; sonst setzen sie `noLink`. |

Die drei Link-IDs (`spawnLink`, `controllerLink`, `targetLinks`) stehen von Hand
in `config.ts` — das ist Plan 02 und hier nicht das Thema.

## Vier Schwächen, alle auf der Senderseite

1. **Zufällige Zielwahl.** `targetLinks[Math.floor(Math.random() * …)]`. Kein
   Vorrang, keine Rücksicht darauf, wer die Energie gerade braucht.
2. **Ein Cooldown kann für fast nichts verbrannt werden.** Geprüft wird nur
   `getFreeCapacity > 50`, gesendet wird ohne Mengenangabe — also „alles".
   Beides zusammen ist unsauber: entweder wird der Cooldown für eine Handvoll
   Energie ausgegeben, oder `transferEnergy` liefert `ERR_FULL` und es passiert
   **gar nichts**, während Miner und Container voll bleiben. Welche der beiden
   Auflösungen greift, gehört an der API nachgelesen; der Fix ist in beiden
   Fällen derselbe: die Menge explizit als `min(vorhanden, frei)` übergeben.
   Der Cooldown ist der eigentliche Verlust — er entspricht der Entfernung, bei
   20 Feldern also 20 Ticks, in denen bis zu 800 Energie hätten fließen können
   (`knowledge/mechanics/structures-rcl.md`: Durchsatz = `800 / Entfernung`).
3. **Senden hängt am Miner.** Nur wenn ein Miner gerade abliefert und `ERR_FULL`
   bekommt, wird überhaupt über Weiterleitung nachgedacht. Ein halb gefüllter
   Link bleibt liegen, sobald die Quelle erschöpft ist oder der Miner stirbt.
4. **N Miner entscheiden unabhängig.** Zwei Quell-Links können im selben Tick
   denselben Empfänger anvisieren; der zweite Versuch ist vergeudet.

## Vorschlag: `controller/links.ts` mit einer Klasse `LinkNetwork`

Ein Durchgang je Raum und Tick, aufgerufen aus `controller/timing.ts` — dort, wo
schon Türme und Terminal getaktet werden. Der Kern ist eine Regel statt einer
Zufallswahl:

```
sender  = Quell- und Remote-Links mit cooldown === 0 und Energie >= SEND_MIN
empfänger = nach Vorrang:
            1. Controller-Link, wenn RCL < 8 und dort < 200 liegen
            2. Basis-/Storage-Link, wenn dort < 200 liegen
            3. Controller-Link ab RCL8 (dort zahlt Upgraden nur noch GCL)
senden  = für jedes Paar: transferEnergy(ziel, min(senderEnergie, zielFrei))
          nur, wenn min(...) >= SEND_MIN — sonst lohnt der Cooldown nicht
```

Der Vergleichsbot macht das in `manager/LinkManager.ts` fast so, mit drei
Fehlern, die wir nicht mitnehmen (siehe Teil B): `800` hartcodiert statt
`LINK_CAPACITY`, „nur senden, wenn der Empfänger **alles** aufnehmen kann" (ein
halb gefüllter Empfänger bekommt so nie etwas), und ein Zielzähler, der auch
weiterläuft, wenn nichts gesendet wurde.

**Was der Miner danach noch tut:** Energie in seinen Link legen. Die
Weiterleitung entfällt dort komplett — samt `Math.random()` und samt dem
Sonderfall, der heute den Storage-Füllstand abfragt, um zwischen Controller- und
Ziel-Link zu wählen. Das ist ein spürbarer Schnitt in der heißesten Rolle.

**Was der Linkkeeper davon merkt:** nichts. Er bleibt, wie er ist — er prüft den
Empfänger-Link weiter jeden Tick, weil dieser keinen Cooldown hat und jede
Verzögerung Durchsatz kostet. Der Nutzen für ihn ist mittelbar: ein Empfänger,
der nach Vorrang befüllt wird statt zufällig, gibt ihm gleichmäßiger Arbeit.
Falls das Messfenster später zeigt, dass sein Leerlauf-Durchgang tatsächlich
messbar CPU kostet, ist der billigere Weg **kein** Signal vom Manager, sondern
ein `Game.time % 2`-Takt für den Leerlauffall — mit Messung davor, nicht ohne.

## Verhaltensänderung, Risiko, Abnahme

Es **ist** eine Verhaltensänderung: welcher Link wann wohin sendet, ändert sich.

- Risiko mittel. Falsch gesetzte Vorränge verlangsamen den Ausbau, brechen aber
  nichts: fällt das Linknetz komplett aus, holen Upgrader und Debitoren ihre
  Energie über die bestehenden Rückfallketten (Storage, Container).
- Testbar ohne Spiel: die Auswahlregel ist reine Logik über Zahlen. Die
  Stub-Basis aus den Runden 3 bis 5 (`tests/support/creep-stubs.ts`) reicht dafür
  aus — Links sind Strukturen mit Store und `cooldown`.
- Abnahme: (1) kein Sendeversuch, dessen Menge unter `SEND_MIN` liegt;
  (2) Controller-Link unter RCL8 bekommt vor dem Storage-Link;
  (3) zwei Sender zielen im selben Tick nie auf denselben Empfänger;
  (4) Messfenster nach Plan 01 vor und nach der Umstellung, plus
  Controller-Fortschritt je 1000 Ticks — das ist die Zahl, die sich verbessern
  soll.

---

# Teil B: Übernahmen aus dem Vergleichsbot

Sortiert nach Fokus 1 (CPU), danach Wartbarkeit. Zeilenangaben beziehen sich auf
`C:\GIT\github\Screeps_TS`.

## Lohnt für CPU

| # | Was | Warum | Aufwand |
| --- | --- | --- | --- |
| B1 | **CPU-Stufen** (`manager/CPUManager.ts:31-40`, `main.ts:50-91`): kritische Arbeit zuerst, danach Stufen, die unter Druck ausfallen. | Genau das, was Plan 05 als Befund 1 und 4 beschreibt — hier gibt es eine erprobte Form dafür. Auf 20 CPU ist das der Unterschied zwischen „Türme schießen immer" und „Türme schießen, wenn noch Zeit war". | mittel, gehört zu Plan 05 |
| B2 | **Staffelung mit Raumindex** (`main.ts:29-38`, `CPUManager.shouldRunEvery`): `(Game.time + offset) % interval`, Offset aus dem Raumindex. | Unsere Tagesjobs und `defence.check()` laufen für **alle** Räume im selben Tick. Die Staffelung senkt die Spitze, nicht den Mittelwert — und die Spitze ist das, was den Tick abschneidet. | klein, gehört zu Plan 05 |
| B3 | **Heap-Cache mit TTL** (`storage/LinkStorage.ts:10-13,132-147`): `Map` + `lastUpdate` + Ablaufzeit, plus gezieltes Verwerfen bei einem `null`-Treffer. | Unsere ID-Listen (`container`, `tower`, `wally`, `roads`) liegen in `Memory` und werden **nur** von der Tagessequenz erneuert — alle 28 800 Ticks. Ein Heap-Cache ist billiger (keine Serialisierung je Tick) und frischer. Wichtig: `Memory` als Rückfall behalten, der Heap überlebt keinen Global-Reset. | mittel |
| B4 | **Pfadcache je Tick** (`utils/SharedRouteCache.ts`): mehrere Creeps mit gleichem Ziel teilen eine Suche innerhalb eines Ticks. | Bei uns nur dann ein Gewinn, wenn im selben Tick mehrere Creeps dasselbe Ziel neu suchen. Unsere Pfade liegen im Creep-Memory und werden erst bei Zielwechsel neu gesucht — der Fall ist also selten. **Erst messen** (`prof.detail()` zeigt Pfadsuchen je Tick), dann entscheiden. | klein, aber ohne Messung nicht begründbar |

## Lohnt für Wartbarkeit

| # | Was | Warum |
| --- | --- | --- |
| B5 | **Linktopologie geometrisch bestimmen** (`storage/LinkStorage.ts:48-124`): Quelle ≤2, Controller ≤3, Storage ≤2, Rest „remote". | Steht schon als Schritt 2 in [Plan 02](02-strukturerkennung.md). Teil A dieses Plans setzt darauf auf: erst wissen, welcher Link welche Rolle hat, dann entscheiden, wer sendet. |
| B6 | **`ErrorMapper`** (`utils/ErrorMapper.ts`): Stacktraces über die Sourcemap auf TypeScript-Zeilen zurückrechnen. | Unsere Fehlerausgabe nennt heute Positionen im gebündelten `tsProd/main.js`. Kostet nur beim ersten Auftreten eines Fehlers CPU. |
| B7 | **Spawnbedarf als Daten** (`manager/SpawnDemandManager.ts`, `roles/base/Ant.ts` mit `getMaxCreeps`/`shouldSpawn`). | Deckt sich mit Plan 03: Creepzahlen aus Durchsatz statt aus festen Zahlen in `config.ts`. Ihre Aufteilung „Rolle beschreibt ihren Bedarf, ein Manager entscheidet" ist die brauchbare Idee daraus. |

## Nicht übernehmen

| Was | Grund |
| --- | --- |
| `extensions/RoomExtension.ts:23-61` **`getMaxAvailableEnergy()`** | Zählt Spawns und Extensions mit **zwei `find`-Aufrufen je Aufruf**, um eine Zahl zu bekommen, die `room.energyCapacityAvailable` kostenlos liefert. Das ist genau das CPU-Antimuster, das wir vermeiden wollen. Unsere Rumpfprofile lesen die fertige Zahl. |
| `utils/PathingManager.ts:64-66` **`plainCost: 2, swampCost: 10`** | Die offizielle Doku nennt `1`/`5` ausdrücklich als das **schnellere** Paar für gleichwertige Pfade (`knowledge/efficiency/cpu-pathfinding.md`). |
| `utils/PathingManager.ts:83-91` und `utils/Movement.ts:78-94` **Serialisierung mit `direction: TOP`** | Alle Schritte werden mit derselben Richtung und `dx/dy = 0` serialisiert. Ein so erzeugter Pfad beschreibt „immer nach oben"; `moveByPath` läuft damit nicht das, was gesucht wurde. Sieht nach einem echten Fehler aus — jedenfalls nichts, was man übernimmt. Unser `goto.ts` serialisiert das Ergebnis von `findPathTo` unverändert. |
| `manager/LinkManager.ts:41-47` **Sendebedingung** | `800` hartcodiert statt `LINK_CAPACITY`; gesendet wird nur, wenn der Empfänger die **ganze** Ladung aufnehmen kann (ein halb gefüllter Empfänger bekommt nie etwas); der Zielzähler läuft auch weiter, wenn nichts gesendet wurde. Die Idee ja, die Umsetzung nein. |
| `manager/CPUManager.ts:5` **`TOTAL_CPU_LIMIT = 20`** | Hartcodiert, obwohl `Game.cpu.limit` daneben benutzt wird. Bei einem CPU-Unlock wäre die Zahl falsch. |
| `utils/MovementProfiler.ts` | Unser Profiler (Plan 01) kann mehr: Zustände, Fenster, Grundlinien, `Memory.stats`. |
| `roles/base/Ant.ts` + `AntFactory` (Klassenhierarchie mit Generics über das Creep-Memory) | Unsere zehn Rollenklassen mit `implements CreepRole` reichen. Eine Hierarchie mit Typparametern über dem Memory bringt hier keinen Nutzen, den wir nicht schon haben. |
| `manager/LayoutManager.ts`, `layouts/*`, `utils/LayoutBuilder.ts` (850 Zeilen Bauplan-Automatik) | Eigenes, großes Thema — steht in [Plan 08](08-ausblick.md). Nichts, was man nebenbei überträgt. |

## Weitere Beobachtungen, festgehalten für später

- **Der Vergleichsbot löst das Link-Leeren selbst nicht über einen Manager.**
  Sein Gegenstück zu unserem Linkkeeper ist `roles/FillerAnt.ts:20-43`: der Creep
  fragt den Storage-Link **jeden Tick** selbst ab, mit der Link-Id im Creep-Memory
  (`harvestLinkId`), und der Manager schickt ihm dabei kein Signal. Wer dort also
  nach einer Vorlage für „nicht jeden Tick reinschauen" sucht, findet keine — was
  den Befund in Teil A stützt.
- **Sein `FillerAnt` kann mehr als unser Linkkeeper:** er zieht auch aus Storage
  und aus Containern in Spawn-Nähe und füllt damit Spawn und Extensions. Unser
  Linkkeeper pendelt ausschließlich Link → Storage, das Füllen der Extensions
  machen Debitor und Transfer. Beides ist in sich schlüssig; eine Zusammenlegung
  wäre ein Rollenentwurf und keine Übernahme.
- **Cache-Fristen dort:** Linkkategorien 250 Ticks, die reine „gibt es Links?"-
  Prüfung 500 Ticks (`storage/LinkStorage.ts:12-13`). Als Anhaltspunkt für B3
  brauchbar — Container und Türme ändern sich seltener als Links, dort darf die
  Frist länger sein.
- **Nicht bewertet, weil eigenes Thema:** `IntelManager`, `ScoutPlanner`,
  `RemotePlanner`, `RoomPhaseManager`, `CleanUpManager` und
  `NukeMitigationManager`. Das sind Aufklärung, Expansion, Raumphasen und
  Aufräumen — inhaltlich [Plan 06](06-raum-sparmodus.md) und
  [Plan 07](07-expansion.md). Wer die dort angeht, findet im Vergleichsbot
  Vorlagen; für Fokus CPU und Wartbarkeit des Bestands tragen sie nichts bei.

## Reihenfolge, die ich vorschlage

1. **Messen.** `prof.light()` auf PTR oder live, 1000 Ticks, `prof.baseline("vor-plan-09")`. Ohne das ist B1 bis B4 nicht priorisierbar.
2. **Teil A** (Linknetz senden) — wirkt auf Durchsatz, ist testbar, und schneidet Code aus der heißesten Rolle.
3. **B2 und B1** (Staffelung, dann Stufen) aus Plan 05 — mit den Zahlen aus Schritt 1.
4. **B3** (Heap-Cache mit TTL) für Container-, Turm- und Wall-Listen.
5. B5 (Plan 02) je nachdem, wie oft neue Räume dazukommen; B6 nebenbei.
