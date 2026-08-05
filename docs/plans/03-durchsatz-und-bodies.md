# Plan 03: Durchsatz und Körperprofile

Status: **teilweise umgesetzt.** Der gefundene Builder-Fehler ist behoben (Runde
2026-08-03), und die Formeln sind zusammengezogen: `src/creep/body.ts` (Klasse
`BodyProfile`) plus `src/creep/bodies.ts` (die dreizehn Profile), abgesichert
durch Tests, die die alten Formeln als Referenz mitführen — Branch
`modernisierung-koerperprofile`, ohne Verhaltensänderung.

**Offen bleibt der eigentliche Inhalt dieses Plans:** Creepzahlen und Rumpfgrößen
aus dem Durchsatz herzuleiten statt aus festen Zahlen in `config.ts`. Die
zentralen Profile sind dafür die Voraussetzung, nicht die Lösung.

Verhaltensänderung: **ja**, für den offenen Teil.

## Problem

Zwei getrennte Baustellen, die zusammengehören.

**Erstens: Creepzahlen sind feste Zahlen von Hand.** `upgrader: 1`,
`maxbuilder`, `maxwallRepairer`, `repairer`, `debitorAsFreelancer` stehen pro
Raum in `config.ts` und werden mit `count < X` verglichen
(`upgrader.ts:100-106`, `builder.ts:114-121`, `repairer.ts:165-171`). Keine
dieser Zahlen kennt den Storage-Füllstand, die Wegstrecke oder die Zahl der
Quellen. Bei jedem RCL-Schritt müssen sie von Hand nachgezogen werden — für
jeden Raum einzeln.

**Zweitens: sechs Körperprofil-Funktionen mit demselben Muster, aber jede
anders.** Alle rechnen
`numberOfSets = min(N, floor(energyCapacityAvailable / totalCost))`, aber mit
unterschiedlichen Deckeln (Miner 8, Builder 7, Repairer 3, Upgrader 8/9) und
uneinheitlichem Umgang mit dem Grenzfall.

## Gefundener Fehler

`builder.ts:96-103` hat **keinen** Rückfall für `numberOfSets == 0` und liefert
dann ein leeres Body-Array — `spawnCreep` schlägt damit grundsätzlich fehl. Das
ist derselbe Fehler, der beim Miner in der Runde vom 2026-08-01 behoben wurde
(`docs/aenderungen.md`, A4); `upgrader.ts:78` und `repairer.ts:144` behandeln
den Fall korrekt. Betrifft Räume mit einer Energiekapazität unter der
Set-Kosten-Schwelle, also RCL1 und Räume, die nach einem Angriff darunter
fallen.

Das ist ein eigener kleiner Bugfix-Commit, unabhängig von allem anderen in
diesem Plan. **Terminiert für die Profiler-Runde** (siehe
[Plan 01](01-profiler.md)), damit er nicht bis zur Umsetzung dieses Plans
liegen bleibt — er betrifft genau die frühen RCL-Stufen, die ein neu geclaimter
Raum durchläuft.

## Formeln aus dem Vergleichsbot

Aus `docs/plans/done/02-throughput-reference.md` dort, mit Herleitung und im
Code verwendet (`src/utils/BodyBuilder.ts`, `src/manager/SpawnDemandManager.ts`):

| Größe | Formel | Herkunft |
| --- | --- | --- |
| Miner-Sättigung | 5 WORK für eigene oder reservierte Quelle (10 e/t), 3 WORK für unreservierte (5 e/t) | `HARVEST_POWER` = 2 |
| Hauler-CARRY | `ceil(energyPerTick × roundTripTicks / 50)`, MOVE `ceil(CARRY/2)` auf Straße | Tragfähigkeit 50 je CARRY |
| Upgrader-WORK | `floor((storageEnergy − 20000) / 10000)`, bei RCL8 auf 15 begrenzt | Überschuss-gesteuert |
| Spawnlast | `bodyParts × 3 / 1500` | `CREEP_SPAWN_TIME` = 3 Ticks je Teil |
| Ersatzzeitpunkt | `ticksToLive < bodyLength × 3 + travelTicks + 10` | Spawnzeit plus Anreise plus Marge |

Diese Werte sind gegen `docs/knowledge/quick-reference/constants.md` zu prüfen,
bevor sie in Code wandern — nicht abschreiben.

## Was wir schon besser machen

`roles/debitor.ts:43-51,195-221` **misst** die tatsächliche Umlaufzeit pro Creep,
bildet den Median über mehrere Creeps und rechnet `carry = ceil(2 × median / 5)`.
Der Vergleichsbot schätzt stattdessen aus Raumsprüngen — und zwar an zwei
Stellen widersprüchlich (`routeDistance × 6` gegen `routeLen × 3`). Seine
eigene Plandatei 17 führt „gemessene Umlaufzeit" als offenen Wunsch und nennt
als Quelle unseren alten `creep.debitor.js`.

**Also: nichts übernehmen, sondern ausweiten.** Die Messlogik aus `debitor.ts`
ist die Vorlage für `transfer.ts:78-82`, das heute stumpf
`min(25, floor(energyCapacityAvailable / 100))` rechnet — bei RCL8 also 25 CARRY
und 25 MOVE für 2500 Energie und 150 Spawnticks, unabhängig davon, ob der Weg
vom Container zum Storage fünf oder fünfzig Felder lang ist.

## Vorgehen

1. **Bugfix Builder-Minimalprofil.** Eigener Commit, keine Zustimmung nötig.
2. **Körperprofile zusammenziehen.** Ein Modul mit einer Funktion je Rolle, die
   bestehenden Formeln und Deckel **wörtlich** übernommen, plus ein einziger
   gemeinsamer 50-Teile-Schutz. Reines Verschieben, keine Verhaltensänderung —
   nachweisbar, indem für jede Rolle und mehrere Energiekapazitäten das alte
   und das neue Ergebnis verglichen werden.
3. **Streckenbasierte CARRY-Größe für `transfer`**, nach dem Muster aus
   `debitor.ts`. Verhaltensänderung, aber lokal.
4. **Bedarf statt Kopfzahl, eine Rolle pro Schritt.** Reihenfolge nach Nutzen:
   Upgrader (siehe Plan 04), dann Builder anhand der Baustellenzahl und
   -größe, dann Repairer. Die Zahlen aus `config.ts` bleiben als Obergrenze
   erhalten, damit ein Rechenfehler nicht sofort den Spawn flutet.
5. **Ersatzzeitpunkt aus Bodylänge.** Heute feste Schwellen 150/300/100/160,
   unabhängig von der Bodygröße. Ein Miner mit sechs Teilen braucht 18 Ticks
   Spawnzeit und hat damit über 130 Ticks unnötigen Puffer. Erst umstellen,
   wenn eine Anreisezeit-Schätzung vorliegt — sonst tauscht man eine grobe
   Zahl gegen eine andere.

## Nutzen

- Weniger Handarbeit pro Raum, und keine Nachpflege bei RCL-Schritten.
- Weniger verschwendete Spawnzeit: ein zu großer Hauler kostet Spawnticks ohne
  Mehrertrag, weil der Durchsatz an der Quelle hängt (maximal 10 e/t), nicht an
  der Tragfähigkeit.
- Ein Ort für den 50-Teile-Schutz statt sechs.

## Risiko

Punkt 2 ist risikoarm und nachweisbar gleichwertig. Punkt 4 ist der riskante
Teil: eine falsch kalibrierte Formel spawnt zu viel oder zu wenig. Deshalb
Obergrenzen aus `config.ts` beibehalten und je Rolle einzeln messen.

## Abnahmekriterien

- Für jede Rolle und für Energiekapazitäten 300, 550, 1800, 12900 liefert das
  neue Profilmodul dasselbe Body wie heute — bis auf den Builder-Grenzfall.
- `_getProfil` liefert nirgends mehr ein leeres Array.
- Nach jedem Bedarfsschritt: Creepzahl je Rolle und Energie je Tick aus Plan 01
  vor und nach der Änderung.
