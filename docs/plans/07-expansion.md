# Plan 07: Expansion — Aufklärung, Bewertung, Claimen

Status: **Vorschlag.** Verhaltensänderung: **ja**, größte im Satz — braucht
Zustimmung. Voraussetzungen: **Plan 02** (sonst tut ein neuer Raum nichts) und
**Plan 06** (sonst bremst jeder neue Raum die bestehenden).

Der Betreiber will, dass der Bot selbständig claimt. Das ist machbar, aber der
Vergleichsbot liefert dafür weniger, als seine Dateinamen vermuten lassen.

## Was dort tatsächlich fehlt

Am Code geprüft, nicht aus den Plänen abgelesen:

- `ScoutPlanner.getBestExpansionTarget()` existiert, wird aber **im ganzen Baum
  nirgends aufgerufen**.
- `ClaimerCreepMemory.targetClaim` ist deklariert, wird aber **nie gesetzt**.
- **Keine GCL-Prüfung**, kein einziger `Game.gcl`-Zugriff.
- Das RCL8-Observer-Scouting aus seinem Plan 14 ist nicht implementiert.

Das Claimen ist dort also genauso manuell wie bei uns. Verwertbar sind die
Bausteine — Aufklärung, Bewertungsschema, Rentabilitätsrechnung, Gefahren-Policy
— nicht die Automatik.

## Baustein 1: Aufklärung und Intel-Memory

Vorlage: `ScoutPlanner.discoverFrontier()` (BFS über
`Game.map.describeExits()`, Tiefe 6, alle 500 Ticks, Warteschlange auf 30
Einträge begrenzt) und `IntelManager.scanRoom()`, das je Raum ein kompaktes
Objekt nach `Memory.intel[raumname]` schreibt: Besitzer, Reservierung,
Quellen-IDs und -Anzahl, Controllerposition, Bedrohungslage, Ablauf eines
Invader Cores, Routendistanz.

Bei uns: nichts davon. Nachbarräume werden nie erfasst.

Wichtig beim Nachbau — **Memory-Wachstum begrenzen.** `Memory` wird jeden Tick
serialisiert, die Kosten wachsen mit der Größe
(`docs/knowledge/systems/runtime-memory.md`). Regeln: nur die Felder speichern,
die eine Entscheidung tragen; Einträge mit Alter über einer Schwelle verwerfen;
Gesamtzahl deckeln; Größe über die Kennzahlen aus Plan 01 mitschreiben.

Aufwand: groß, weil eine neue Rolle (Scout) und ein neues Memory-Schema
entstehen. Risiko für laufende Räume: gering, weil rein additiv.

## Baustein 2: Bewertung eines Kandidaten

Vorlage aus dessen Plan 14, im Code als vereinfachte Fassung vorhanden:

- Harte Filter zuerst: genau zwei Quellen, claimbarer Controller, nicht von
  Fremden besetzt oder reserviert, kein Highway, kein Source-Keeper-Raum, nicht
  direkt an einen eigenen Raum angrenzend.
- Dann Punkte: Verteidigbarkeit 35, Wirtschaft 25, Mineral 15,
  Remote-Potenzial 15, Logistik 10.
- Auslösen erst ab Punktzahl 75, zusätzlich Storage im Mutterraum über 50 000
  und Bucket über 5000.

**Diese Schwellen sind in der Quelle selbst als Vorschlag gekennzeichnet, nicht
gemessen.** Sie taugen als Startwert, nicht als Wahrheit. Beim Übernehmen muss
jede Zahl im Code als solche kommentiert und später kalibriert werden.

Die Gewichtung ist plausibel: Verteidigbarkeit vor Wirtschaft ist für einen
passiv spielenden Bot richtig, weil ein schlecht verteidigbarer Raum dauerhaft
Energie und CPU verschlingt.

## Baustein 3: GCL-Prüfung — Eigenbau

Weder unser Bot noch der Vergleichsbot prüfen, ob ein Claim überhaupt erlaubt
ist. `claimController` liefert dann `ERR_GCL_NOT_ENOUGH`, und unser
`roles/claimer.ts` behandelt nur `ERR_NOT_IN_RANGE` und `OK` — der Fehlschlag
wäre unsichtbar, bei rund 1300 Energie je Claimer-Versuch.

Zu bauen: vor dem Spawnen eines Claimers `Game.gcl.level` gegen die Zahl der
eigenen Räume prüfen, und den Rückgabewert von `claimController` protokollieren.
Klein, risikolos, und sinnvoll auch ohne den Rest dieses Plans.

Hier schließt sich der Kreis zu **Plan 04**: die GCL-Prüfung sagt nur, ob wir
dürfen. Dass wir dürfen, erzeugt Plan 04.

## Baustein 4: Remote-Rentabilität

Formel aus dessen Plan 13, im Code umgesetzt:

```
brutto        = Quellenzahl × (reserviert ? 10 : 5)      Energie/Tick
minerKosten   = Bodykosten / 1500 × Quellenzahl
haulerKosten  = Bodykosten / 1500 × Quellenzahl
reserverKosten= reserviert ? Bodykosten / 600 : 0
containerVerfall = reserviert ? 0,1 × Quellenzahl : 0,5 × Quellenzahl
strassenVerfall  = Routendistanz × 10 × 0,001
netto = brutto − alle Kosten,   Aufnahme ab netto > 3 Energie/Tick
```

Der Reservierungseffekt ist der interessante Teil: eine Reservierung senkt den
Container-Verfall deutlich, weil der Zerfallstakt sich streckt. Das ist der
sachliche Grund, Reservieren vor Abbauen zu stellen.

Bei uns ist Remote-Betrieb ein reines Ja/Nein über `sendMiner` und `sendDebitor`
in `config.ts`. Eine laufende Netto-Rechnung würde unrentable Remotes erkennen
und abschalten — insbesondere solche, die durch Invader regelmäßig Creeps
verlieren.

Die Routendistanz brauchen wir dafür nicht zu schätzen: `roles/debitor.ts` misst
sie bereits (siehe Plan 03) und ist damit genauer als die Schätzung im
Vergleichsbot.

## Baustein 5: Gefahren-Policy für Fremdräume

Vorlage: `PassivePolicy` mit `isRoomSafeToMine`, `shouldFleeRemote` und
`markRemoteDanger` (Gefahrenmarkierung mit 500 Ticks Nachlauf); der
Remote-Hauler prüft das jeden Tick und flieht heim statt zu kämpfen.

Bei uns prüft `controller/defence.ts` **nur eigene Räume**. Ein Miner oder
Debitor im Fremdraum arbeitet weiter, bis er stirbt oder von Hand abgeschaltet
wird. Für einen passiv spielenden Bot mit vielen Remotes ist das der teuerste
laufende Verlust.

Klein bis mittel im Aufwand, gering im Risiko, rein defensiv.

## Reihenfolge

1. GCL-Prüfung und Protokollierung im Claimer. Klein, sofort sinnvoll.
2. Gefahren-Policy für Fremdräume. Spart laufend Creeps.
3. Aufklärung und Intel-Memory. Rein additiv, aber Grundlage für alles Weitere.
4. Bewertung mit **Empfehlung ins Log**, noch ohne Automatik. Damit lässt sich
   die Bewertung gegen die eigene Einschätzung prüfen, bevor sie handeln darf.
5. Remote-Rentabilität, zunächst nur berichtend, dann abschaltend.
6. Automatisches Claimen hinter einem Schalter, höchstens eine Expansion
   gleichzeitig, mit Rückfall auf manuelles Vorgehen.

Schritt 4 vor 6 ist der Kern: erst wenn die Bewertung mehrfach dasselbe
vorschlägt, was ein Mensch auch gewählt hätte, darf sie selbst handeln. Ein
falsch bewerteter Claim bindet einen GCL-Platz dauerhaft.

## Abnahmekriterien

- Ein Claimer wird nicht mehr gespawnt, wenn GCL nicht reicht; der Grund steht
  im Log.
- Ein Remote-Raum mit Bedrohung wird markiert, Hauler kehren heim, keine neuen
  Creeps werden dorthin geschickt.
- `Memory.intel` bleibt unter einer festgelegten Größe, gemessen.
- Die Bewertung nennt über mehrere Messfenster stabil dieselben Kandidaten.
- Ein automatisch geclaimter Raum erreicht ohne Handeingriff einen Spawn und
  eigene Förderung — das prüft gleichzeitig Plan 02.

## Offene Fragen an den Betreiber

1. Reservieren oder claimen als Regelfall für Nachbarräume? Reservieren ist
   billiger und liefert doppelte Quellenausbeute ohne GCL-Platz; claimen bringt
   einen eigenen Spawn und Ausbaupotenzial.
2. Soll die Automatik höchstens eine Expansion gleichzeitig verfolgen? Vorschlag:
   ja, alles andere überfordert die Wirtschaft des Mutterraums.
3. Wie weit darf der Bot suchen — Tiefe 6 wie im Vergleichsbot, oder weniger?
   Größere Tiefe bedeutet mehr Scouts, mehr Intel-Memory und mehr CPU.
