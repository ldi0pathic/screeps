# Plan 04: RCL8-Upgrader und das GCL-Nadelöhr

Status: **Alle drei Punkte gebaut** (2026-08-06, siehe `docs/aenderungen.md`),
Wirkung noch nicht gemessen. **Punkt 3 ist entschieden**: die Tickdrossel
(`sparmodus`) entfällt unterhalb von RCL 8 vollständig, der Upgrader arbeitet
dort ab jetzt in jedem Tick (Commit `366ae98`). Zu messen bleibt
`controller.progress` je 1000 Ticks in den Räumen unter RCL 8, dazu
`storage.store.energy` als Gegenprobe.

Die offene Frage unten wurde nach dem Vorschlag dieses Plans entschieden: 250 000
bleibt die Spawnschwelle, 100 000 ist die Arbeitsuntergrenze
(`RCL8_WORK_RESERVE`). Dazu kam eine Bedingung, die im Vorschlag fehlte: fällt
`ticksToDowngrade` unter 100 000, wird unabhängig vom Vorrat gearbeitet — sonst
hätte das Spawn-Gate einen Upgrader bestellt, den die Arbeitsdrossel verstummen
lässt, und der Raum verlöre eine Stufe.

## Warum das das Hauptziel betrifft

Die Kette ist kurz und zwingend:

1. Ein weiterer Raum lässt sich nur claimen, wenn das **GCL** es zulässt.
2. GCL wächst **ausschließlich** durch Controller-Upgrades — auch in Räumen, die
   längst RCL8 sind und keinen RCL-Fortschritt mehr haben.
3. Unsere RCL8-Räume upgraden mit etwa **3 % der erlaubten Rate**.

Wer „möglichst viele Räume" will, hebt zuerst das.

## Rechnung

`upgrader.ts:71-85`, bei `controller.level > 7`:

- `multi = 0.5`, `totalCost = 0.5 × 100 + 2 × 50 + 2 × 50 = 250`
- `numberOfSets = min(9, floor(12900 / 250)) = 9`
- Body: `floor(9 × 0.5) = 4` WORK, 18 CARRY, 18 MOVE — 2200 von 12900 Energie

Dazu die Drossel in `upgrader.ts:19`:

```
if (creep.memory.sparmodus && Game.time % creep.room.controller.level != 0) return;
```

`sparmodus` wird bei `level > 5` gesetzt (`upgrader.ts:67`). Bei RCL8 arbeitet der
Creep also in **einem von acht** Ticks.

`UPGRADE_CONTROLLER_POWER` ist 1 Energie je WORK-Teil und Tick. Ergebnis:

**4 WORK × 1/8 Ticks = 0,5 Energie pro Tick im Mittel, gegen 15 erlaubte.**

18 CARRY sind zugleich absurd für einen Creep, der am Controller-Link steht: 900
Tragfähigkeit für eine Aufgabe, die pro Tick 15 Energie verbraucht.

## Was daran Absicht ist

Nicht alles davon ist ein Fehler. `upgrader.ts:97` spawnt bei RCL8 **gar keinen**
zusätzlichen Upgrader, solange `ticksToDowngrade > 100000` **und** der Storage
unter 250 000 Energie liegt. Die Absicht ist klar und richtig: bei RCL8 nur
upgraden, wenn Energie übrig ist oder der Downgrade-Timer knapp wird.

Der Fehler liegt nicht in der Absicht, sondern im Mittel: **wenn der Bot sich
zum Upgraden entscheidet, kann er es mit diesem Body und dieser Drossel nicht.**
Bei über 250 000 Energie im Storage — also klarem Überschuss — tröpfelt er mit
0,5 Energie pro Tick, statt den Überschuss mit 15 abzubauen.

## Vorschlag

1. **Bei RCL8 einen großen, stationären Upgrader.** Richtwert 15 WORK, damit die
   erlaubte Rate genau ausgeschöpft wird, dazu wenige CARRY (der
   Controller-Link steht in Reichweite 1) und wenige MOVE, weil der Creep steht.
   Der Vergleichsbot empfiehlt in seinem Plan 16 genau das:
   `[WORK×15, CARRY×5, MOVE×5]`, ausdrücklich „capped at RCL8 upgrade limit".
   Exakte Teilezahlen gegen `docs/knowledge/quick-reference/constants.md`
   prüfen, nicht schätzen.
2. **Drossel über den Energievorrat statt über die Tickzahl.** Der
   `Game.time % level`-Sparmodus ist ein grobes Werkzeug: er halbiert bis
   achtelt die Leistung unabhängig davon, ob Energie da ist. Besser: arbeiten,
   solange Storage bzw. Controller-Link über einer Schwelle liegen, und sonst
   aussetzen. Das Spawn-Gate aus `upgrader.ts:97` bleibt unverändert — es
   entscheidet weiter, **ob** ein Upgrader existiert.
3. **Sparmodus bei RCL6 und RCL7 überprüfen.** Dort greift dieselbe Drossel mit
   Faktor 1/6 bzw. 1/7, und dort kostet sie echten RCL-Fortschritt, nicht nur
   GCL. Das ist ein eigener Schritt mit eigener Messung.

   **Entschieden am 2026-08-06 (Commit `366ae98`):** die Tickdrossel entfällt
   unterhalb von RCL 8 vollständig, statt sie nur zu überprüfen. Der Upgrader
   arbeitet unter RCL 8 jetzt in jedem Tick; `BODIES.upgrader` (zwei WORK je
   Satz, bis zu acht Sätze) liefert damit bis 16 WORK durchgehend bei RCL 7 und
   rund 10 bei RCL 6, statt zuvor ~2,3 beziehungsweise ~1,7 Energie je Tick im
   Mittel — Faktor 6 bis 7. Bewusste Kehrseite: unter RCL 8 gibt es dabei keine
   Vorratsschwelle, der Upgrader zieht zuerst am Storage. Details in
   `docs/aenderungen.md`, Runde „Der Upgrader drosselt nur bei voller
   Ausbaustufe".

## Risiko

Klein und lokal. Ein 15-WORK-Upgrader verbraucht 15 Energie pro Tick — mehr, als
ein einzelner Link nachliefert, wenn der Storage leer ist. Genau dagegen wirkt
Punkt 2: die Vorratsschwelle. Ohne Punkt 2 wäre Punkt 1 gefährlich, weil der
Creep den Raum aussaugen könnte.

Zweite Sorge: der Body kostet mehr beim Spawnen (15 WORK sind 1500 Energie
allein für die WORK-Teile). Bei RCL8 mit 250 000 Energie im Storage ist das
nachrangig, bei einem gerade auf RCL8 gestiegenen Raum nicht — deshalb greift
die Änderung nur oberhalb der bestehenden Storage-Schwelle.

## Nutzen

Bei Storage-Überschuss statt 0,5 nun bis zu 15 Energie pro Tick in den
Controller. Das ist ungefähr der dreißigfache GCL-Fortschritt aus jedem
RCL8-Raum — und GCL ist die Erlaubnis für den nächsten Raum. Zusätzlich wird
Energie abgebaut, die heute im Storage liegt und nichts tut.

## Abnahmekriterien

- Body bei RCL8 hat 15 WORK und höchstens 50 Teile, Kosten unter
  `energyCapacityAvailable`.
- Controller-Fortschritt je 1000 Ticks vor und nach der Änderung, gemessen nach
  Plan 01 — die Kennzahl dafür ist dort schon vorgesehen.
- Storage-Energie sinkt nicht unter die gewählte Schwelle; nachweisbar über
  denselben Messlauf.
- Der Upgrader setzt bei leerem Storage aus, statt den Raum leerzuziehen.

## Offene Frage an den Betreiber

Welche Storage-Schwelle soll der RCL8-Upgrader als „Überschuss" ansehen? Das
bestehende Spawn-Gate nennt 250 000. Vorschlag: dieselbe Zahl für das Spawnen
beibehalten und für die laufende Arbeit eine niedrigere Untergrenze wählen
(etwa 100 000), damit der Upgrader nicht sofort wieder verstummt, sobald er
angefangen hat abzubauen.
