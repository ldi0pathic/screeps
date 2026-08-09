# Der Storage speist den Controller-Link

Stand: 2026-08-08. Ausgangslage: Das Linknetz sendet seit Plan 09 Teil A zentral
(`controller/links.ts`), die Empfänger sind aus der Lage erhoben
(`controller/link-list.ts`), und der Linkkeeper leert den Storage-Link in einer
Richtung (`roles/linkkeeper.ts`).

Ziel dieser Runde: **der Controller-Link läuft nicht mehr leer, wenn die Quellen
gerade nichts liefern** — und wenn der Storage überzulaufen droht, wird er
gezielt in den Controller abgebaut.

Verifikation: `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm smoke`.
Ein Lauf auf dem lokalen Server oder PTR ist sinnvoll, aber keine Bedingung —
die neue Regel ist reine Arithmetik über Zahlen und ohne Spiel testbar.

## Ausgangslage

Heute ist der Storage-Link (im Memory historisch `spawn`, tatsächlich der Link am
Storage) ausschließlich **Empfänger**:

| Ort | Verhalten |
| --- | --- |
| `controller/links.ts::send` | Quell-Links mit Cooldown 0 und Ladung ≥ `SEND_MIN` senden an Empfänger nach Vorrang: unter RCL8 Controller-Link zuerst, ab RCL8 Storage-Link zuerst. |
| `roles/linkkeeper.ts::doJob` | Steht zwischen Storage-Link und Storage und schiebt Energie **nur** vom Link ins Storage. |
| `creep/base.ts::harvestControllerLink` | Upgrader holt aus dem Controller-Link, solange dort mehr als 100 liegen; sonst setzt er `noLink` und läuft zu Fuß zum Storage. |

Daraus folgen zwei Lücken:

1. **Liefern die Quellen nicht, läuft der Controller-Link leer.** Der Upgrader
   fällt auf den Fußweg zum Storage zurück — er arbeitet weiter, aber mit einem
   Bruchteil des Durchsatzes, obwohl die Energie im Storage liegt.
2. **Ein volllaufender Storage hat keinen Abfluss in den Controller.** Der
   einzige Weg dorthin führt über Creepbeine.

## A — Die gemeinsame Regel

### A1 · `needsStorageFeed(roomName)` in `controller/links.ts`

Eine reine Funktion über Zahlen, ohne Zustand und ohne Seiteneffekt. Sie ist die
**einzige** Stelle, an der entschieden wird, ob der Storage seinen Link speist.

Grundbedingungen (alle nötig):

- `usesLinks(roomName)` — Raum ist meiner und sein RCL lässt Links zu,
- Controller-Link **und** Storage-Link sind erhoben (`LinkList`),
- der Raum hat ein Storage,
- der Controller-Link hat mindestens `SEND_MIN` **freien Platz**.

Die letzte Bedingung kam mit der Abschlussreview dazu und steht **vor** dem
`storageIsFull`-Zweig. Ohne sie fiel der Storage-Link im Vollpumpmodus aus der
Empfängerliste, obwohl niemand mehr senden konnte: `receiversByPriority`
filtert den vollen Controller-Link heraus, die Empfängerliste ist dann leer,
und damit verlieren **alle** Quell-Links ihr Ziel. Gleichzeitig leert der
Keeper den Storage-Link nicht mehr — ein stabiler Stillstand des ganzen
Linknetzes, bis der Upgrader den Controller-Link wieder leer genug getrunken
hat. Im Rückfall ist die Bedingung ohnehin erfüllt (dort liegen unter
`SEND_MIN` im Link, also ist reichlich frei); sie wirkt allein auf das
Vollpumpen.

Danach genügt einer von zwei Fällen:

| Fall | Bedingung |
| --- | --- |
| **Rückfall** | Controller-Link unter `SEND_MIN` **und** kein Quell-Link hält eine Ladung ≥ `SEND_MIN` **und** Storage-Energie über `STORAGE_FEED_RESERVE` |
| **Vollpumpen** | `storageIsFull(roomName)` — unabhängig davon, was die Quell-Links tun |

Zwei Entscheidungen im Rückfall-Fall, die absichtlich so und nicht anders sind:

- **Gemessen wird der Inhalt der Quell-Links, nicht ihr Cooldown.** Ein
  Quell-Link mit Ladung liefert ab, sobald sein Cooldown fällt; der Bedarf
  verschwindet dann von selbst. Zählte der Cooldown mit, feuerte der Rückfall in
  jedem Cooldown-Tick, und der Storage bezahlte, was die Quellen ohnehin liefern.
- **Die Schwelle am Controller-Link ist `SEND_MIN` (200), nicht die 100 aus
  `harvestControllerLink`.** So wird nachgeschoben, *bevor* der Upgrader den
  Link leer antrifft und auf den Fußweg zum Storage ausweicht. Wäre die
  Schwelle 100, käme der Nachschub regelmäßig einen Schritt zu spät.

### A2 · `storageIsFull(roomName)` in `controller/storage-pressure.ts`

Eigenes, kleines Modul mit genau einer exportierten Funktion:

```
Belegung > STORAGE_FULL_RATIO  und  Energie > STORAGE_FULL_MIN_ENERGY
```

Gemessen wird der **gesamte** Belegungsgrad (`store.getUsedCapacity() /
store.getCapacity()`), nicht nur die Energie — „der Storage geht voll" ist eine
Frage des Platzes. Der Energieboden verhindert die Kehrseite: ein Storage, der
mit Mineralien vollsteht und wenig Energie hält, löst sonst eine ungedrosselte
Upgraderei auf einem dünnen Energiebestand aus.

Ohne Sicht auf den Raum oder ohne Storage liefert die Funktion `false` — nicht
etwa einen Fehler. Sie wird aus dem Spawncontroller heraus auch für Räume
gefragt, die gerade nicht sichtbar sind.

Warum ein eigenes Modul und nicht `controller/links.ts`: die Funktion wird von
zwei Seiten gebraucht (Linknetz und Upgrader-Spawn). Läge sie im Linkmodul,
hinge `roles/upgrader.ts` wegen einer **Storage**-Frage am **Link**-Modul.
`controller/room-inventory.ts` ist ebenfalls kein Zuhause: dort stehen
unveränderliche Vorkommen, hier ein Wert, der sich jeden Tick ändert.

### A3 · Schwellen

Alle Konstanten exportiert, damit die Tests gegen die Namen und nicht gegen
Zahlen prüfen.

| Konstante | Wert | Ort | Wofür |
| --- | --- | --- | --- |
| `SEND_MIN` | `LINK_CAPACITY / 4` = 200 | `links.ts` (vorhanden) | Mindestmenge je Sendevorgang; zugleich Schwelle am Controller-Link |
| `STORAGE_FEED_RESERVE` | 20 000 | `links.ts` | Untergrenze im Storage für den Rückfall — der Rest bleibt für Spawn, Extensions und Türme |
| `STORAGE_FULL_RATIO` | 0,9 | `storage-pressure.ts` | Belegungsgrad, ab dem der Vollpumpmodus greift |
| `STORAGE_FULL_MIN_ENERGY` | 100 000 | `storage-pressure.ts` | Energieboden im Vollpumpmodus |

`STORAGE_FULL_MIN_ENERGY` trägt dieselbe Zahl wie `RCL8_WORK_RESERVE` in
`roles/upgrader.ts`, bleibt aber bewusst eine eigene Konstante: die eine
beantwortet „darf der RCL8-Upgrader arbeiten", die andere „darf der Storage
seinen Link speisen". Sie zusammenzulegen wäre eine Kopplung, die nur solange
trägt, wie die Zahlen zufällig gleich sind.

## B — Sendeseite (`controller/links.ts::send`)

Zwei Eingriffe, beide in `send()`:

```
senders   = readySenders()                              // unverändert
feed      = needsStorageFeed ? spawnLink : null         // nur mit cooldown 0 und Ladung >= SEND_MIN
if (feed) senders.push(feed)
if (senders.length === 0) return                        // der billige Normalfall bleibt billig
receivers = receiversByPriority(room, /* ohne spawnLink, wenn feed */)
```

Der Storage-Link wird im Bedarfsfall vom Empfänger zum **Sender** und fällt
dabei aus der Empfängerliste. Das ist keine Kosmetik: `receivers.shift()` würde
ihm sonst im schlechtesten Fall sich selbst zuteilen. Der Nebeneffekt ist
erwünscht — solange nachgeschoben wird, gehen auch die Quell-Ladungen direkt an
den Controller statt über den Storage-Link, das spart einen Sprung und damit die
3 % Übertragungsverlust.

Die frühe Rückkehr bei `senders.length === 0` bleibt vor der Empfängersuche
stehen; sie ist der Grund, warum das Netz im Normalfall fast nichts kostet.

**Der Storage-Link wird hinten angehängt, nicht vorn.** Damit bedienen zuerst
die Quell-Links den Controller, und der Storage kommt nur zum Zug, wenn danach
noch ein Empfängerplatz frei ist. Im Rückfall-Fall ist das ohne Wirkung — dort
ist `readySenders()` per Definition leer, weil kein Quell-Link `SEND_MIN` hält.
Im Vollpumpmodus dagegen ist es genau die gewollte Ordnung: geschenkte
Quellenergie vor einer Abbuchung aus dem Vorrat. Bedient ein Quell-Link den
Controller in diesem Tick, ist er ohnehin voll und der Storage wird nicht
gebraucht.

**Der Vorrang aus `receiversByPriority` wird währenddessen überstimmt.** Ab RCL8
steht dort heute der Storage-Link zuerst, weil Upgraden nur noch auf GCL
einzahlt. Solange `needsStorageFeed` gilt, fällt er aus der Liste, und übrig
bleibt der Controller-Link — auch auf RCL8. Das ist beabsichtigt: ein
überlaufender Storage soll nicht noch weiter befüllt werden.

## C — Linkkeeper (`roles/linkkeeper.ts`)

Heute kennt er eine Richtung, künftig zwei — ausgewählt über dieselbe Funktion:

```
if (needsStorageFeed(workroom)) {
    carrying > 0 ? creep.transfer(link, ENERGY)     // Ladung in den Link
                 : creep.withdraw(storage, ENERGY)  // volle Ladung aus dem Storage
    return
}
// sonst wie heute
if (carrying === 0 && inLink === 0) return
if (carrying > 0) creep.transfer(storage, ENERGY)
if (inLink > 0)   creep.withdraw(link, ENERGY)
```

**Warum eine gemeinsame Funktion und keine Flagge im Memory:** `main.ts` fährt
erst alle Creeps, danach `controller.timing.controll()`. Der Keeper handelt also
**vor** dem Sendenetz. Eine im Vortick gesetzte Flagge käme einen Tick zu spät —
und ohne Abgleich zöge er den Link genau in dem Tick leer, in dem das Netz ihn
senden wollte. Beide müssen im selben Tick zur selben Antwort kommen.

Sein Rumpf passt unverändert: 16 CARRY = `LINK_CAPACITY / CARRY_CAPACITY`, ein
Zug ist genau eine Linkladung. Bleibt beim Umschalten ein Rest in der Ladung,
räumt ihn der Leerungszweig im nächsten Tick weg — dafür braucht es keinen
Sonderfall.

## D — Upgrader (`roles/upgrader.ts`)

### D1 · `_mayWork` bleibt unangetastet, die `noLink`-Flagge fällt weg

Im Vollpumpmodus liegt die Storage-Energie zwangsläufig über 100 000, und genau
das ist ab RCL8 schon heute die Bedingung; unter RCL8 wird gar nicht gedrosselt.
Eine zusätzliche 90-%-Ausnahme wäre eine Regel, die nie etwas ändert — also
toter Code. Was den Upgrader bei vollem Storage tatsächlich bremst, ist die
**Zufuhr**, und die regeln B und C.

Der Downgrade-Schutz bleibt davon unberührt: `ticksToDowngrade < 100000` liefert
weiterhin `true`, unabhängig vom Vorrat. Der Abstand ist groß — auf RCL8 steht
der Timer bei 200 000 Ticks, die Drossel gibt also spätestens bei halb
abgelaufenem Timer auf.

**Nachtrag aus der Abschlussreview:** `doJob` entscheidet nicht mehr an
`creep.memory.noLink`, ob der Controller-Link genutzt wird, sondern am
**Inhalt** des Links (mehr als 100 — dieselbe Schwelle, die
`harvestControllerLink` ohnehin prüft). Die Flagge wurde nirgends
zurückgesetzt: ein Upgrader, der den Link einmal leer antraf, ignorierte ihn
für seine restlichen rund 1500 Ticks — und damit genau den Nachschub, den
diese Runde einführt (er braucht drei Ticks: Keeper holt aus dem Storage,
Keeper füllt den Link, Netz sendet). Die Flagge ist aus `creep/base.ts` und
aus dem Spawn-Memory entfernt; lebende Creeps tragen sie weiter, sie wird nur
nie wieder gelesen — bewusst ohne Migrationsschritt, wie schon bei
`sparmodus`. Die `if`/`else`-Struktur bleibt unverändert: bei leerem Link
fällt der Creep in die Ersatzkette, statt untätig zu warten.

### D2 · `spawn()`: mindestens einer, wenn der Storage überläuft

```
const forced = storageIsFull(workroom);
if (!forced && (!uppis || uppis < 1))                        return false;
if (!forced && level > 7 && ticksToDowngrade > 100000
            && storage.energy < 250000)                      return false;
const target = forced ? Math.max(1, uppis ?? 0) : uppis;
if (target <= count)                                         return false;
```

`forced` hebelt zwei bestehende Sperren aus:

- die konfigurierte Null (`bot.room[workroom].upgrader < 1`),
- das RCL8-Gate mit der 250 000er Vorratsschwelle. Das ist kein theoretischer
  Fall: bei 90 % Belegung mit viel Mineral und 150 000 Energie greift es heute
  und verhindert den Upgrader genau dann, wenn man ihn braucht.

Eine gewollte Null bleibt Null, solange der Storage Luft hat. Läuft er über,
steht trotzdem einer da.

`Math.max(1, …)` hebt dabei eine **Untergrenze** auf eins an — es ist keine
Deckelung: eine höhere konfigurierte Zahl bleibt bestehen, erzwungen wird nur
das Minimum von einem.

**Warum die Untergrenze eins ist und nicht höher:** ab RCL8 nimmt der
Controller nur noch `CONTROLLER_MAX_UPGRADE_PER_TICK` = 15 Energie je Tick an,
und zwar für den ganzen Raum. `BODIES.upgraderRcl8` (15 WORK) schöpft das
allein aus — ein zweiter erzwungener Upgrader brächte dort nichts.

## Abnahme

Testbar ohne Spiel; die Basis steht mit `tests/controller-links.test.ts` und
`tests/roles-upgrader.test.ts`, für den Keeper kommt
`tests/roles-linkkeeper.test.ts` dazu.

1. Kein Sendeversuch unter `SEND_MIN` — für den Storage-Link wie für Quell-Links.
2. Hält ein Quell-Link eine Ladung ≥ `SEND_MIN`, sendet der Storage-Link **nicht**
   — außer im Vollpumpmodus.
3. Storage-Energie unter `STORAGE_FEED_RESERVE`: kein Nachschub, auf jeder Stufe.
4. Ist `needsStorageFeed` wahr, taucht der Storage-Link **nicht** in der
   Empfängerliste auf.
5. Der Linkkeeper füllt genau dann, wenn `needsStorageFeed` wahr ist, und leert
   sonst — dieselbe Funktion, kein zweiter Pfad.
6. `storageIsFull` und kein Upgrader im Raum → `spawn()` liefert `true`, auch bei
   `upgrader: 0` und Downgrade-Timer über 100 000.
7. `storageIsFull` ist falsch, sobald die Energie unter `STORAGE_FULL_MIN_ENERGY`
   liegt — auch bei 99 % Belegung mit Mineralien.
8. Im Vollpumpmodus mit einem bereiten Quell-Link bekommt der Controller-Link die
   Quellenergie, nicht die aus dem Storage — der Storage-Link steht in der
   Senderliste hinten.
9. Hat der Controller-Link weniger als `SEND_MIN` frei, ist `needsStorageFeed`
   falsch — und die Quell-Links behalten den Storage-Link als Empfänger.
10. Ein Upgrader mit `noLink: true` im Memory holt trotzdem aus dem
    Controller-Link, sobald dort mehr als 100 liegen.
11. `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm smoke` fehlerfrei.

## Risiko

**Mittel.** Der schlimmste Fall ist ein Storage, der sich in den Controller
entleert. Dagegen stehen zwei unabhängige Böden: `STORAGE_FEED_RESERVE` im
Rückfall, `STORAGE_FULL_MIN_ENERGY` im Vollpumpmodus. Fällt das Linknetz ganz
aus, greifen die vorhandenen Rückfallketten des Upgraders (Storage, Container,
Drops, Tombstones, Ruinen, Quelle) unverändert — es geht Durchsatz verloren,
nichts bricht.

Bewusst ohne Gegenmaßnahme: pendelt der Belegungsgrad um 90 %, schaltet der
Vollpumpmodus hin und her. Das ist folgenlos, weil der Rückfall die schwächere
Form derselben Regel ist. Eine Hysterese wäre Zustand, den niemand braucht.

Nicht abgedeckt und bewusst offen: im Vollpumpmodus kann bei RCL8 eine Ladung im
Controller-Link parken, wenn der Upgrader gerade nicht abnimmt. Der Link läuft
dann einmal voll und steht still — kein Schaden, nur 800 Energie, die bis zum
nächsten Arbeitsfenster im Link liegen.

## Reihenfolge der Umsetzung

Jeder Schritt ist ein eigener Commit; `tsProd/main.js` wird pro Commit
mitgebaut, weil das Spiel über GitHub synct.

1. `controller/storage-pressure.ts` mit `storageIsFull` plus Test — noch ohne
   Aufrufer, reine Arithmetik.
2. `needsStorageFeed` in `controller/links.ts` plus Test — noch ohne Aufrufer.
3. Sendeseite: `send()` und `receiversByPriority` (Abschnitt B), Tests erweitern.
4. Linkkeeper (Abschnitt C) plus neuer Test.
5. Upgrader-Spawn (Abschnitt D2), Test erweitern.
6. `docs/aenderungen.md`, `docs/rollen.md` und
   `docs/controller-und-automatik.md` nachziehen.

## Nicht Teil dieser Spec

**Mineralien aus dem Storage.** Bei der Erkundung fiel auf, dass die Kette dafür
bereits vollständig existiert — `roles/debitor.ts:106-122` holt aus dem Storage,
`creep/transport.ts::TransportToHomeTerminal` liefert ins Terminal,
`prototypes/terminal-market.ts::sell` verkauft. Dass sie im Spiel offenbar nicht
greift, hat eine eigene Ursache und gehört in eine eigene Spec. Der Verdacht,
noch nicht verifiziert: `sell()` verkauft nie unter 70 % des
Historiendurchschnitts; findet sich keine solche Kauforder, füllt sich das
Terminal, und sobald dort weniger als 50 000 frei sind, hört der Debitor auf,
aus dem Storage nachzuliefern. Zwei Bedingungen blockieren sich gegenseitig,
ohne dass ein Fehler sichtbar wird. Nebenbefund: `NEVER_SELL` steht doppelt im
Code (`debitor.ts:25` und `terminal-market.ts:44`).

Diagnose zuerst, dann eigene Spec.
