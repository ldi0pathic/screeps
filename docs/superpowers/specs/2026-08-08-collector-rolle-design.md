# Die Rolle `collector` — einsammeln und ins Terminal bringen

Stand: 2026-08-08. Ausgangslage: Seit Plan 10 (`docs/plans/10-logistikrollen.md`,
Commit `c925d10`) übernehmen `filler` und `hauler` die Logistik im Heimatraum.
Beide sind bewusst schmal geschnitten. Was der Heimatraum-Debitor sonst noch tat,
tut seitdem **niemand mehr**.

Ziel dieser Runde: **die Lücke schließen, die Plan 10 gerissen hat** — Mineralien
aus dem Storage ins Terminal, Gefallenes von besiegten Gegnern aufsammeln, den
Container am Extractor leeren, und im Terminal so viel Energie halten, dass der
Markt überhaupt handeln kann.

Verifikation: `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm smoke`.

## Die Diagnose, aus der diese Spec entstanden ist

Der Befund lautete zunächst „Mineralien sammeln sich im Storage und wandern nicht
ins Terminal". Der erste Verdacht — die Preisuntergrenze in
`prototypes/terminal-market.ts::sell` verkaufe nie unter 70 % des
Historiendurchschnitts, das Terminal laufe deshalb voll — war **falsch**. Die
Kette wird gar nicht erst betreten:

1. Der Umzug Storage → Terminal steht an genau **einer** Stelle im Bot:
   `roles/debitor.ts:106-122`. Er verlangt, dass der Creep in einem Raum steht,
   der Storage **und** Terminal hat — also im Heimatraum.
2. `roles/debitor.ts:233` verbietet seit `c925d10` genau das:
   `if (spawn.room.name == workroom && spawn.room.storage) return false;`
   In einem Heimatraum mit Storage wird kein Debitor mehr gespawnt.
3. Die Nachfolger haben den Job nicht übernommen, und zwar ausdrücklich:
   `hauler.ts:10` nennt „kein Mineralienverkauf, kein Terminal, kein Lab",
   `filler.ts:9` nennt „Tombstones, Drops, Ruinen, Mineralienverkauf, Terminal,
   Labs" als das, wofür der Filler bewusst **nicht** zahlt.
4. Der einzige verbleibende Kandidat wäre die Rolle `transfer` (`transfer.ts:53`
   holt Mineral aus dem Storage, `:64` liefert ins Terminal). Sie spawnt nie:
   `bot.transfer` ist in `config.ts` vollständig auskommentiert.

Es ist also eine **Regression**, kein Konstruktionsfehler: der Code lebt noch
vollständig, nur führt ihn niemand mehr aus. Deshalb gibt es auch keine
Fehlermeldung — es passiert schlicht nichts.

Gegenprobe im Spiel, erwartet wird eine leere Liste:

```js
_.filter(Game.creeps, c => c.memory.role == 'debitor' && c.memory.workroom == c.memory.home).map(c => c.name)
```

## A — Die Rolle

### A1 · Zweck und Zuschnitt

Ein Creep je Heimatraum mit Storage und Terminal. Rollenname **`collector`**,
englisch (CLAUDE.md: neue Schlüssel englisch; die deutschen Altnamen bleiben, wo
sie stehen).

Vier Aufgaben, **ein** Zweck: alles einsammeln, was nicht laufender
Energiebetrieb ist, und dorthin bringen, wo es hingehört.

Diese Begründung ist nötig, weil Plan 10 den Debitor genau wegen seiner
vierfachen `if`-Kaskade zerlegt hat. Der Unterschied, der den Zuschnitt hier
trägt:

- Beim Debitor waren es **verschiedene Zwecke** (Heimlogistik, Remote-Transport,
  Notfallspawn) in **vielen** Creeps — jeder zahlte je Tick für die Bedingungen
  der Jobs, die er nicht hatte.
- Hier ist es **ein Zweck** in **einem** Creep je Raum. Die vier Quellen sind
  Erscheinungsformen desselben Auftrags, und die Kosten fallen einmal je Raum an,
  nicht je Logistik-Creep.

Wächst die Rolle später über diesen Zweck hinaus, ist das das Signal, sie wieder
zu teilen — nicht die Zahl ihrer `if`-Zweige.

### A2 · Platz in der Rollentabelle

`roles/index.ts`, zwischen `defender` und `wally`. **Die Reihenfolge der
Properties ist die Spawn-Priorität** — Verteidigung schlägt Wirtschaft, aber
Einsammeln schlägt Mauerreparatur.

## B — Reihenfolge im Tick

Der Zustandsautomat ist der übliche: `creep.checkHarvest()` schaltet zwischen
Sammeln und Abliefern (`memory.harvest`).

### B1 · Sammeln

Sortiert nach **Verfallsgeschwindigkeit** — was zuerst verschwindet, kommt zuerst
dran. Jede Stufe steigt bei Erfolg aus (`return`), wie in den übrigen Rollen.

| # | Quelle | Helfer | Warum an dieser Stelle |
| --- | --- | --- | --- |
| 1 | Tombstones | `harvestCompleteRoomTombstones` | Gefallenes besiegter Gegner; der Grabstein zerfällt und nimmt den Inhalt mit |
| 2 | Drops | `harvestRoomDrops` | verfallen sichtbar je Tick |
| 3 | Ruinen | `harvestRoomRuins` | zerfallen, aber langsamer |
| 4 | Extractor-Container | neu, siehe B3 | verfällt nicht, läuft aber über und blockiert den Miner |
| 5 | Storage → verkaufbare Ressource | `harvestRoomStorage` | verfällt gar nicht, liegt nur im Weg |
| 6 | Storage → Energie | `harvestRoomStorage` | nur wenn das Terminal unter der Deckungsgrenze liegt (B4) |

Die Helfer für 1 bis 3 gibt es in `creep/base.ts` bereits. Die Rolle ruft sie —
sie schreibt keine eigene Suche.

Für Stufe 5 gilt dieselbe Auswahl wie bisher im Debitor: die **erste** Ressource
im Storage, die mehr als 100 Einheiten hält, nicht Energie ist und nicht auf der
`NEVER_SELL`-Liste steht.

### B2 · Abliefern

`TransportToHomeTerminal`, Rückfall `TransportToHomeStorage` — für die ganze
Ladung, ohne Fallunterscheidung.

**Die Deckungsgrenze steuert das Holen, nicht das Abliefern.** Das ist kein
Versehen: `creep/transport.ts:168-170` trägt eine eigene, fest eingebaute
Energiegrenze (100 000), oberhalb derer `TransportToHomeTerminal` Energie
abweist. Eine zweite Grenze im Abliefern danebenzustellen hieße, zwei Regeln für
dieselbe Frage zu pflegen. Stattdessen holt der Collector Energie überhaupt nur
dann, wenn das Terminal unter `TERMINAL_ENERGY_TARGET` liegt (B4, Stufe 6) —
der Bestand dort pendelt sich damit bei der Zielgröße plus höchstens einer
Ladung ein.

### B3 · Der Container am Extractor

Den holt seit Plan 10 ebenfalls niemand mehr ab: `Hauler.spawn` läuft über
`energySources(workroom)` und ordnet nur Energiequellen zu, und
`Hauler.doJob` holt ausschließlich `RESOURCE_ENERGY`.

Der Collector sucht den Container am Mineralvorkommen über
`controller/room-inventory.ts::mineralSources` und `pos.findInRange(..., 1, …)`
— dasselbe Muster, mit dem `Hauler.spawn` seinen Quellcontainer findet. Steht
dort kein Container, entfällt die Stufe wortlos.

**Kein Befund, sondern eine Lage:** steht der Extractor-Container direkt neben dem
Terminal, liefert der Miner schon selbst dorthin (`roles/miner.ts:371-376`) und
diese Stufe findet nie etwas. Das ist in Ordnung — sie kostet dann einen
Nullvergleich.

### B4 · Die Energiedeckung im Terminal

Der Punkt, ohne den alles andere wirkungslos bliebe: `TerminalMarket.sell`
(`prototypes/terminal-market.ts:69-77`) steigt bei **weniger als 1000 Energie im
Terminal** sofort aus und bezahlt daraus die Transferkosten — bei 5000 Einheiten
über 20 Räume rund 2400 Energie je Handel.

Energie gelangt heute über dieselbe tote Kette ins Terminal wie das Mineral. Ein
Terminal ohne Energie verkauft also auch dann nichts, wenn Mineral darin liegt.

| Konstante | Wert | Wofür |
| --- | --- | --- |
| `TERMINAL_ENERGY_TARGET` | 20 000 | Zielbestand an Energie im Terminal — deckt mehrere Handel und liegt weit unter der 100 000er Grenze, ab der `TransportToHomeTerminal` Energie ohnehin abweist |
| `TERMINAL_FREE_MIN` | 50 000 | Überlaufschutz: nachgeliefert wird nur, solange im Terminal mindestens so viel frei ist |

`TERMINAL_FREE_MIN` übernimmt die Zahl, die der alte Debitor schon benutzte
(`debitor.ts:109`) — der Wert ist damit keine Neuerfindung, sondern der
bisherige Stand. `TERMINAL_ENERGY_TARGET` ist eine Setzung und darf sich nach
einer Beobachtung im Spiel ändern.

Beide Konstanten stehen bei der Rolle, nicht in der Config: es sind
Betriebsgrößen des Marktes, keine Absicht je Raum.

## C — Spawnbedingung und Rumpf

### C1 · Abgeleitet, nicht konfiguriert

Ein Collector je Raum, wenn alle drei Bedingungen gelten:

- `spawn.room.name === workroom` — die Rolle kennt kein `goToWorkroom`, sie
  arbeitet nur im eigenen Raum,
- der Raum hat ein **Storage**,
- der Raum hat ein **Terminal**.

Kein neuer Config-Schlüssel. Terminal und Storage sind Tatsachen über die Welt,
und die gehören nach CLAUDE.md nicht in die Config — dieselbe Begründung, mit der
`controller/link-list.ts::usesLinks` den RCL liest statt eines Flags.
`roles/linkkeeper.ts` trägt noch ein `sendLinkkeeper`; das ist der ältere Stil,
dem hier bewusst nicht gefolgt wird.

Am Bauwerk festgemacht und nicht am RCL — ein Raum kann RCL 6 erreicht haben,
ohne das Terminal gebaut zu haben. Dieselbe Begründung steht schon bei
`Filler.spawn`.

### C2 · Rumpf

Reines CARRY/MOVE als eigenes Profil `collector` in `creep/bodies.ts`, gebaut aus
`spawn.room.energyCapacityAvailable`. Ein Rückfallprofil ist **Pflicht** — ein
leeres Body-Array lässt `spawnCreep` immer fehlschlagen, dieser Fehler ist im
Repo schon dreimal aufgetreten.

Die Größe folgt keiner Durchsatzformel: der Collector fährt kurze Wege im eigenen
Raum und hat keine Frist. 10 Sätze `CARRY`+`MOVE` (500 Einheiten Ladung) sind
reichlich und passen ab RCL6 in jeden Spawn.

## Abnahme

Testbar ohne Spiel gegen die Stubs in `tsBot/tests/support/`; die
Ablieferketten sind dieselben, die `tests/creep-transport.test.ts` schon prüft.

1. Ohne Terminal oder ohne Storage im Raum: kein Collector wird gespawnt.
2. Mit beidem und ohne lebenden Collector: `spawn()` liefert `true`; mit einem
   lebenden liefert es `false`.
3. Liegt ein Tombstone und zugleich Mineral im Storage, wird der **Tombstone**
   zuerst bedient — die Reihenfolge nach Verfall ist die Aussage der Rolle.
4. Eine Ressource, die auf der `NEVER_SELL`-Liste steht, wird nicht aus dem
   Storage geholt; Energie ebenfalls nicht über Stufe 5.
5. Nicht-Energie geht ins Terminal, nicht ins Storage.
6. Liegt im Terminal weniger als `TERMINAL_ENERGY_TARGET` Energie, holt der
   Collector Energie aus dem Storage; liegt mehr darin, holt er keine.
7. Sind im Terminal weniger als `TERMINAL_FREE_MIN` frei, liefert er nichts mehr
   nach.
8. `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm smoke` fehlerfrei.

## Risiko

**Gering.** Die Rolle nimmt niemandem etwas weg: sie greift auf Ressourcen zu,
die heute unangetastet liegen bleiben. Fällt sie aus, ist der Zustand genau der
heutige.

Der einzige Weg, mit dem sie schaden könnte, ist ein zu gieriger Energiezugriff
auf das Storage — dagegen steht `TERMINAL_ENERGY_TARGET` als harte Obergrenze für
den Bestand im Terminal, nicht als Durchsatzgröße: liegt dort genug, holt der
Collector keine Energie mehr.

Ein zweiter, bewusst offener Punkt: die Rolle steht im Leerlauf herum und prüft
je Tick ihre sechs Stufen. Das ist ein Creep je Raum, und die Alternative — den
Spawncontroller vorher prüfen zu lassen — verlagert die Scans dorthin, wo sie
teurer sind (`timing.spawn` ist laut Messung schon die CPU-Spitze,
`docs/plans/09-linknetz-und-uebernahmen.md`). Wenn die Messung später zeigt, dass
der Leerlauf spürbar kostet, ist ein Takt (`Game.time % n`) für die Stufen 1 bis 3
der billigere Weg — mit Messung davor, nicht ohne.

## Reihenfolge der Umsetzung

Jeder Schritt ein eigener Commit; `tsProd/main.js` wird mitgebaut, sobald die
Rolle am Bundle hängt.

1. **`NEVER_SELL` an eine Stelle legen.** Die Liste steht heute doppelt
   (`roles/debitor.ts:25` und `prototypes/terminal-market.ts:44`) und muss von
   Hand synchron gehalten werden; der Collector wäre die dritte Fundstelle. Sie
   zieht in ein eigenes Modul um, beide Bestandsstellen importieren sie. Reine
   Aufräumarbeit **ohne Verhaltensänderung** — deshalb zuerst und in einem
   eigenen Commit, damit ein späterer Rückschritt sie von der neuen Rolle
   trennen kann.
2. Rumpfprofil `collector` in `creep/bodies.ts` plus Test.
3. `roles/collector.ts` mit `doJob` (Stufen 1 bis 6) und `spawn`, plus Test.
4. Verdrahtung in `roles/index.ts` zwischen `defender` und `wally`.
5. `docs/aenderungen.md`, `docs/rollen.md` und
   `docs/konfiguration-und-memory.md` nachziehen.

Schritt 4 macht der Hauptagent — `roles/index.ts` ist eine gemeinsam genutzte
Datei.

## Nicht Teil dieser Spec

- **Die Preislogik in `sell()`.** Ob 70 % des Historiendurchschnitts eine gute
  Untergrenze sind, ist eine eigene Frage. Sie wird erst beantwortbar, wenn
  überhaupt wieder Ware im Terminal ankommt — also nach dieser Runde.
- **Der tote Mineralpfad im Debitor.** `debitor.ts:106-122` bleibt vorerst
  stehen: der Debitor bedient weiterhin Räume **ohne** Storage, und dort ist der
  Zweig erreichbar. Ob er das faktisch je ist, gehört nachgemessen, bevor man ihn
  entfernt.
