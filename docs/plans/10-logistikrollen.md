# Plan 10: Logistik nach Job schneiden statt nach Kaskade

Status: **Runde 1 und 2 in Arbeit** (2026-08-06), Runde 3 spezifiziert, nicht
gebaut. Anlass: der Debitor ist mit 38,7 % der teuerste Posten des Bots und
kommt in Plan 09 nur als Nachtrag vor.

## Ausgangslage

Aus `docs/profiler/detail_01.txt`, gemessen im Spiel über 100 Ticks:

| Rolle | CPU/Tick | Creeps | CPU je Creep | Anteil |
| --- | --- | --- | --- | --- |
| debitor | 3,56 | 13 | 0,27 | 38,7 % |
| miner | 1,02 | 15 | 0,07 | 11,1 % |

Zwei Befunde, die diesen Plan tragen:

**Der Debitor bezahlt seine Zielwahl, nicht seine Bewegung.**
`creep/transport.ts::findDeliveryTarget` sucht in **jedem** Tick per
`findClosestByPath(FIND_MY_STRUCTURES)` das nächste Ablieferziel — auch in den
zehn Ticks, die der Creep dorthin unterwegs ist. Die Beschaffungsseite hat
dieses Problem seit `f64f25a` nicht mehr (`RememberedTarget`), die
Ablieferseite schon.

**Beim Miner ist es nicht „der Miner", sondern vier von fünfzehn.** Elf Miner
kosten 0,01–0,06, vier kosten 0,14 bis 0,39. Die vier hängen in
`roles/miner.ts` im Standortzweig fest: findet sich ab RCL 6 kein Feld für den
Quell-Link, läuft die Platzierungsschleife durch, ohne `onPosition` zu setzen —
und der Miner wiederholt Pfadsuche, zwei `findInRange` und acht Bauanfragen in
jedem weiteren Tick seines Lebens.

## Die eigentliche Ursache: eine Rolle für vier Jobs

`Debitor.doJob` bedient heute vier verschiedene Aufgaben in einer einzigen
`if`-Kaskade — Heimatversorgung, Remote-Transport, Freelancer, Notfall. Jeder
Creep wertet in jedem Tick auch die Bedingungen der drei Jobs mit aus, die er
nicht hat: Tombstones, Drops, Ruinen, Mineralienverkauf aus dem Storage,
Terminal, Labs. Ein Creep, dessen einziger Job „Extension füllen" ist, zahlt
für alles davon mit.

Welche dieser Jobs es in einem Raum überhaupt gibt, hängt am Ausbaustand — und
zwar nicht am RCL als Zahl, sondern an den Bauwerken, die er freischaltet:

| Ausbaustand | Wer holt | Wer füllt |
| --- | --- | --- |
| kein Storage (bis RCL 3) | Allrounder: Quelle/Container → Spawn, Extensions | derselbe Creep |
| Storage vorhanden (ab RCL 4) | `hauler`: Quellcontainer → Storage | `filler`: Storage → Spawn, Extensions, Turm |
| Quell-Link sendet (ab RCL 5) | Linknetz ersetzt den `hauler` für diese Quelle | `filler`, gespeist vom `linkkeeper` |
| alle Quellen mit Link (RCL 8) | kein Heim-`hauler` mehr | `filler` allein |

Die Bedingung ist deshalb überall `room.storage` bzw. `linksDeliver(workroom)`,
**nicht** `controller.level >= 4`: ein Raum kann RCL 4 erreicht haben, ohne das
Storage gebaut zu haben. Das ist dieselbe Regel wie in Plan 09 — Tatsachen über
die Welt werden erhoben, nicht konfiguriert.

## Reihenfolge

Drei Runden, jede ein eigener Commit. Die ersten beiden sind Fehlerbehebungen
mit CPU-Wirkung und ändern keine Rollenstruktur; sie kommen zuerst, damit ihre
Wirkung getrennt messbar ist und damit der `filler` das Zielgedächtnis erbt,
statt es später nachgerüstet zu bekommen.

### Runde 1 — Zielgedächtnis beim Abliefern

`findDeliveryTarget` bekommt einen `RememberedTarget` (`useSupply` für
Spawn/Extensions, `useLab` für Labore), dazu `deliverTo` in `creep/target.ts`
als Gegenstück zu `collectFrom`.

Ein bewusster Unterschied zur Beschaffungsseite: dort löst ein gemerktes, aber
verschwundenes Ziel **keine** Ersatzsuche im selben Tick aus. Hier schon —
gäbe `findDeliveryTarget` stattdessen `null` zurück, liefe die Kaskade der
Rolle weiter und der Creep kippte seine Ladung ins Storage, statt die nächste
Extension zu füllen. Die Regel ist hier also nicht Sparsamkeit, sondern
Korrektheit.

Wirkt auf jede Rolle, die abliefert: Debitor, Transfer, Builder, Filler.

### Runde 2 — Der Miner hört auf, endlos zu suchen

- Jeder Ausgang des Standortzweigs setzt `onPosition`. Findet sich kein Platz
  für den Link, nimmt der Miner trotzdem seinen Standplatz ein.
- Die Quelle wird aus `creep.memory.source` gelesen statt per `findClosestByPath`
  neu bestimmt. Der Miner steht in diesem Moment direkt neben ihr.

Ein periodischer Wiederholungsversuch wurde erwogen und **verworfen**. Der
Miner wird nicht erneuert (`renewCreep` kommt im Bot nicht vor), und
`Miner._spawn` zählt einen vorhandenen Miner nur, solange `ticksToLive > 300`
(im Heimatraum 150) — der Nachfolger startet also rund 200 Ticks vor dem Ende,
ohne `onPosition` im Memory, und durchläuft die Standortsuche komplett neu. Der
Versuch wiederholt sich damit einmal je Creepleben zum Preis von null. Ein
Intervall hätte ihn nur häufiger gemacht und, weil `Game.time % n` bei allen
linklosen Minern im selben Tick zuschlägt, einen Ausschlag erzeugt. Solange der
Miner auf dem Container steht, fördert er ohnehin: der Link ist Durchsatz, kein
Betriebszustand.

Erwartung: die vier teuren Miner fallen auf das Niveau der elf übrigen.

**Nicht in dieser Runde:** die Container- und Linkplatzierung ganz aus der
Rolle nach `controller/link-planner.ts` zu ziehen. Der Planer dort kennt das
Linkkontingent des Raums schon und wäre die richtige Stelle — aber er entscheidet
dann mit, welchen Link ein Miner als `memory.link` bekommt, und das ist ein
Eingriff in den Durchsatz, kein CPU-Fix. Eigene Runde.

### Runde 3 — `filler` und `hauler`

Zwei neue Rollen, geschnitten nach Job:

**`filler`** — Storage/Container → Spawn, Extensions, Türme. Nur im
Heimatraum, kein `goToWorkroom`, kein `goToMyHome`, keine Distanzmessung, kein
Tombstone-/Drop-/Ruinen-Scan, kein Mineralienverkauf. Übernimmt den heutigen
Freelancer (`sendFreeDebitor`, `memory.container === ''`).

**`hauler`** — Quellcontainer → Storage. Nur im Heimatraum, nur solange die
Quelle keinen sendenden Link hat. Die Abschaltbedingung ist die, die heute schon
in `debitor.spawn` steht: `Memory.rooms[workroom].hasLinks && linksDeliver(workroom)`.

**`debitor`** — bleibt der Remote-Hauler und der Allrounder für Räume ohne
Storage. Der Name bleibt, weil er im Creep-Memory des laufenden Spiels steht.

#### Umstellung in zwei Commits

Rollennamen stehen im Creep-Memory; ein lebender Creep darf seinen Eintrag in
`roles/index.ts` nicht verlieren.

1. `filler` und `hauler` **daneben** anlegen, die Spawnbedingungen dorthin
   verschieben. `Debitor.doJob` bleibt unverändert — die lebenden Debitoren
   arbeiten ihre bis zu 1500 Ticks ab, neue kommen nicht mehr nach.
2. Erst wenn keiner mehr lebt: die toten Zweige aus `debitor.ts` schneiden.

#### Spawn-Priorität

Die Property-Reihenfolge in `roles/index.ts` *ist* die Priorität. Der `filler`
gehört ganz nach vorn: sind die Extensions leer, spawnt gar nichts mehr, auch
kein Ersatzfiller. Neue Reihenfolge:

```
filler, debitor, linkkeeper, hauler, transfer, miner, claimer, …
```

Das ist eine Verhaltensänderung und gehört nach `docs/aenderungen.md`.

#### Offen, vor der Umsetzung zu klären

- **Wie viele Filler je Raum?** Gegen
  `docs/knowledge/efficiency/energy-economy.md` rechnen, nicht schätzen. Der
  Bedarf hängt an `energyCapacityAvailable` (die zu füllende Menge) und an der
  Tragfähigkeit des Rumpfs, nicht an einer festen Zahl.
- **Rumpfprofile** kommen nach `creep/bodies.ts`, mit Rückfallprofil — ein
  leeres Body-Array lässt `spawnCreep` immer fehlschlagen.
- **Braucht der Filler `findClosestByPath` überhaupt?** Extensions stehen fest;
  eine erhobene Liste im Raum-Memory nach dem Muster von `ContainerList` wäre
  billiger als jede Suche. Erst nach der Messung von Runde 1 entscheiden — es
  kann sein, dass das Zielgedächtnis schon reicht.

## Abnahme

Je Runde: `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm smoke`.
Runde 3 zusätzlich mit eigenen Tests je neuer Rolle.

Die CPU-Wirkung ist lokal **nicht** messbar. Sie wird nach dem nächsten Deploy
mit `prof.baseline(...)` vor und `prof.compare(...)` nach der Runde festgehalten
und in `docs/aenderungen.md` nachgetragen. Ohne diesen Nachtrag gilt keine
Runde als abgeschlossen.
