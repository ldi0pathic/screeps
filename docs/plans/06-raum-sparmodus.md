# Plan 06: Sparmodus und Rotationsbetrieb je Raum

Status: **Vorschlag des Betreibers, hier ausgearbeitet.** Verhaltensänderung:
**ja**, deutlich — braucht Zustimmung. Voraussetzung: **Plan 01** und **Plan 05**.

## Der Gedanke

Zehn Räume besitzen, aber nur fünf bis sechs wirklich betreiben. Der Rest läuft
in einem Sparmodus, der sich nach Bedarf ein- und ausschaltet.

Damit wird **Besitz von Betrieb entkoppelt**. Heute kostet jeder Raum in
`bot.room` unabhängig davon CPU, ob dort gerade etwas Sinnvolles passiert.
Die CPU-Last hängt fast vollständig an der Zahl der Creeps und der Raum-Scans —
nicht am Besitz. Genau das macht den Vorschlag so wirksam: die Obergrenze von
20 CPU begrenzt dann die Zahl der **aktiven** Räume, nicht die Zahl der Räume.

Der Vergleichsbot hat dafür kein Gegenstück. Sein Phasenmodell kennt einen
Endzustand `phase8`, in dem Räume von Planungsarbeit ausgenommen werden, aber
keine bedarfsgesteuerte Rotation. Das ist eine eigene Idee und meines Erachtens
die tragfähigste im ganzen Plansatz.

## Drei Betriebsstufen

| Stufe | Was läuft | Zweck |
| --- | --- | --- |
| **Ausbau** | alles wie heute: Builder, Wall-Repairer, Upgrader, Remote-Abbau | Der Raum wächst. Nur so viele Räume gleichzeitig, wie CPU zulässt. |
| **Sparbetrieb** | Miner und Hauler, Türme, Reparatur nur bei Verfall; keine Builder, keine Wall-Repairer, kein Upgrader, keine Remotes | Der Raum **verdient weiter** und füllt den Storage als Kriegskasse für seinen nächsten Ausbau-Abschnitt. |
| **Schlafbetrieb** | nur Türme und ein Downgrade-Wächter | Für fertige oder blockierte Räume. Nahezu keine CPU. |

Der wichtige Unterschied liegt zwischen Sparbetrieb und Schlafbetrieb. Im
Sparbetrieb laufen weiterhin rund fünf Creeps je Raum (zwei Miner, zwei bis drei
Hauler) und der Storage wächst. Wenn der Raum später in den Ausbau wechselt, hat
er einen gefüllten Storage und baut in kurzer Zeit viel — das ist wirksamer als
ein dauerhaft halb versorgter Ausbau, weil Bauen und Upgraden von einem Vorrat
zehren können, Fördern aber nicht schneller geht als 10 Energie pro Quelle und
Tick.

Daraus folgt ein angenehmer Nebeneffekt: **Rotation ist nicht nur billiger,
sondern kann schneller sein.** Fünf Räume, die abwechselnd mit vollem Storage
ausbauen, kommen weiter als zehn Räume, die alle gleichzeitig am Tropf hängen.

## Was den Wechsel auslöst

Vorschlag, alles messbar und ohne Raten:

**In den Ausbau wechseln**, wenn alle Bedingungen zutreffen:

- CPU-Reserve vorhanden: Mittelwert aus Plan 01 liegt unter einer Schwelle, und
  der Bucket ist stabil.
- Der Raum hat Vorrat, also Storage über einer Schwelle.
- Es gibt tatsächlich etwas zu tun: Baustellen vorhanden, oder RCL noch nicht 8,
  oder Wälle unter Zielhits.
- Die Zahl der Ausbau-Räume liegt unter der Obergrenze.

**In den Sparbetrieb wechseln**, wenn eines zutrifft:

- Storage unter der Untergrenze — der Raum ist ausgezehrt und soll sich erholen.
- Nichts zu bauen und RCL8 erreicht.
- Die Ausbau-Obergrenze ist überschritten und dieser Raum ist am längsten dran
  gewesen. Das ist der Rotationsschritt.

**In den Schlafbetrieb**, wenn der Raum fertig ist und der Storage voll bleibt,
oder wenn er dauerhaft blockiert ist (Invader Core, verlorene Reservierung).

**Sofort aufwachen** bei Bedrohung. Türme und Verteidigung liegen in der
kritischen Stufe aus Plan 05 und sind von jeder Drosselung ausgenommen. Ein
angegriffener Raum wechselt unabhängig von allen anderen Bedingungen in den
Ausbau, damit Defender gespawnt und Reparaturen gefahren werden.

Wechsel nur mit **Mindesthaltezeit** (Vorschlag: einige Tausend Ticks). Ohne
Hysterese pendelt der Zustand an der Schwelle hin und her, und jeder Wechsel
kostet, weil Creeps auslaufen und neu gespawnt werden müssen.

## Der Downgrade-Wächter

Der Punkt, an dem dieser Plan schiefgehen kann. Ein Controller verliert sein
Level, wenn zu lange nicht geupgradet wird; die Fristen je RCL stehen in
`docs/knowledge/quick-reference/constants.md` und sind dort nachzulesen, nicht
zu schätzen. Ein RCL8-Raum hat viel Luft, ein RCL4-Raum deutlich weniger.

Regel: fällt `ticksToDowngrade` unter einen Sicherheitsabstand, wird unabhängig
von der Stufe ein Upgrader gespawnt, bis der Timer wieder oben ist. Das ist
billig — ein einzelner Creep für wenige hundert Ticks — und verhindert den
einzigen wirklich teuren Fehler dieses Plans: einen abgestuften Raum.

Unser Bot hat dafür heute nur eine halbe Vorkehrung. `upgrader.ts:97` prüft
`ticksToDowngrade > 100000` als Bedingung, um **nicht** zu spawnen; es gibt aber
keinen Pfad, der bei knappem Timer die Priorität erhöht. Für diesen Plan muss
das ergänzt werden.

## Was zusätzlich pro Raum Geld kostet

Beim Umsetzen nicht vergessen: nicht nur Creeps kosten CPU pro Raum.

- `main.ts::loop` zeichnet in der ersten Schleife für **jeden** Raum aus
  `bot.room` Visuals und prüft das Raum-Memory — jeden Tick, unabhängig von der
  Stufe. Gehört gestaffelt oder an die Stufe gekoppelt.
- `defence.ts::tower()` läuft jeden Tick über alle Räume (Plan 05, Befund 2).
  Türme bleiben kritisch, aber der Reparaturzweig eines Schlaf-Raums braucht
  nicht jeden dritten Tick zu laufen.
- Die Tagesjobs in `timing.ts::daylie` erfassen Strukturen aller Räume.

Ohne diese Punkte spart die Rotation nur den Creep-Anteil und nicht den
Scan-Anteil.

## Verhältnis zu den anderen Plänen

- **Plan 01** liefert die Messgröße, an der die Obergrenze hängt. Ohne CPU pro
  Raum ist „so viele wie möglich" nicht bestimmbar.
- **Plan 05** liefert die Stufeneinteilung, auf der der Sparmodus aufsetzt. Es
  wäre falsch, zwei getrennte Drosselmechanismen zu bauen.
- **Plan 04** wird durch diesen Plan wichtiger, nicht unwichtiger: mehr besessene
  Räume brauchen mehr GCL, und GCL kommt aus Upgrades. Ein Raum im Sparbetrieb
  mit wachsendem Storage ist außerdem der ideale Kandidat für einen kräftigen
  Upgrader, sobald er in den Ausbau wechselt.
- **Plan 07** (Expansion) wird durch diesen Plan überhaupt erst sinnvoll: neue
  Räume claimen darf die bestehenden nicht ausbremsen. Mit Rotation kostet ein
  weiterer Raum zunächst nur einen Platz in der Warteschlange, nicht laufend
  CPU.

## Risiko

Hoch, weil es das Verhalten aller Räume gleichzeitig betrifft. Absicherung:

- Erst **einen** Raum von Hand in den Sparbetrieb schalten und messen, was das
  an CPU spart und was es an Fortschritt kostet. Dafür genügt ein Schalter in
  `config.ts`, ohne jede Automatik.
- Erst danach die Automatik mit Hysterese ergänzen.
- Der Downgrade-Wächter muss vor der Automatik stehen, nicht danach.

## Abnahmekriterien

- Ein Raum im Sparbetrieb kostet messbar weniger CPU; der Betrag steht im
  Änderungsprotokoll und ist die Grundlage für die Obergrenze.
- Der Storage eines Raums im Sparbetrieb wächst, statt zu stagnieren.
- `ticksToDowngrade` sinkt in keinem Raum unter den Sicherheitsabstand — über
  mindestens ein Messfenster von 10 000 Ticks belegt.
- Ein Angriff auf einen Schlaf-Raum weckt ihn im selben Tick; die Türme feuern.
- Kein Raum wechselt seine Stufe häufiger als die Mindesthaltezeit erlaubt.

## Offene Fragen an den Betreiber

1. Wie viele Räume sollen gleichzeitig im Ausbau sein — feste Zahl (etwa 5) oder
   aus der gemessenen CPU-Reserve abgeleitet? Vorschlag: zuerst fest, weil
   nachvollziehbar, später abgeleitet.
2. Soll der Sparbetrieb weiterhin fördern (Storage füllen) oder wirklich fast
   alles abschalten? Vorschlag: fördern — die Kriegskasse ist der eigentliche
   Gewinn des Modells.
3. Rotation nach Zeit (jeder Raum kommt der Reihe nach dran) oder nach Nutzen
   (der Raum mit dem größten Storage und dem meisten Rückstand zuerst)?
   Vorschlag: nach Nutzen, mit einer Alterskomponente, damit kein Raum
   dauerhaft hinten bleibt.
