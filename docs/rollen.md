# Rollen

Alle Rollen exportieren `doJob(creep)` und meist `spawn(spawn, workroom)`. Die Spawnmethoden prüfen vorhandene Creeps, Raumflags und Energie, bevor sie `creep.base.spawn()` verwenden.

**Rumpfprofile stehen nicht mehr in den Rollen**, sondern zusammen in `tsBot/src/creep/bodies.ts`; die Arithmetik (Sätze bilden, Rückfall, Obergrenzen) steckt in der Klasse `BodyProfile` in `tsBot/src/creep/body.ts`. Die Rolle entscheidet nur noch, **welches** Profil gilt — beim Upgrader hängt das am RCL, beim Debitor daran, ob Arbeits- und Heimatraum derselbe sind. Die unten je Rolle genannten Zahlen sind unverändert; wer sie vergleichen will, liest jetzt eine Datei statt elf.

## Rohstoff- und Transportrollen

### `miner`

Ein Miner wird pro Quellen-ID erzeugt. Er sucht oder baut zuerst einen Container direkt neben der Quelle und stellt sich darauf. Bei Energiequellen baut/nutzt er ab RCL 4 zusätzlich einen Link; bei Mineralen nutzt er einen benachbarten Terminal, sofern vorhanden, und berücksichtigt den Extractor-Cooldown. **Der Miner füllt seinen Link nur noch**; wohin dieser weitersendet, entscheidet `controller/links.ts` einmal je Raum und Tick (siehe `controller-und-automatik.md`). Die frühere Weiterleitung im Miner wählte ihr Ziel zufällig und sendete ohne Mengenangabe. Das Standardprofil besteht aus Gruppen von `3 WORK, 1 CARRY, 2 MOVE`, maximal acht Gruppen.

Die Spawnlogik plant beim Ausfall lokal früher nach (TTL-Grenze 150 statt 300). Fehlende Miner setzen `aktivPrioSpawn`; nach mehr als 25 fehlgeschlagenen Prioritätsversuchen versucht sie einen Notfallminer `[WORK,CARRY,MOVE]`. Unterhalb einer Raum-Energiekapazität von 450 (RCL1 oder ein Raum, der nach einem Angriff darunterfällt) fällt das reguläre Profil auf `[WORK,WORK,CARRY,MOVE]` für 300 Energie zurück, statt ein leeres Body-Array zu liefern, mit dem `spawnCreep` grundsätzlich fehlschlägt.

**Der Standplatz ist Fördermenge, nicht Kosmetik.** Nur auf dem Containerfeld landet der Überschuss einer Ernte automatisch im Container (`docs/knowledge/mechanics/structures-rcl.md`); daneben fällt er auf den Boden und verfällt. Deshalb gilt: kein Ausgang des Standortzweigs verlässt `doJob`, ohne dass entweder `onPosition` gesetzt oder eine Baustelle angelegt wurde — vorher konnte der Miner endlos in der teuren Standortsuche hängen, ohne je zu fördern. Trägt die gemerkte `container`-Id nicht mehr (die **Baustelle** wird gemerkt, und das fertige Bauwerk bekommt eine **neue** Id), sieht der Miner auf dem eigenen Feld nach und übernimmt sie; findet er dort nichts, bestimmt er den Standplatz neu. Die Merkregel dahinter: eine gesetzte Id heißt „hier gehört ein Container hin", **keine** Id heißt „hier wurde nachgesehen, es gibt keinen" — nur im ersten Fall wird nachgezogen, sonst wäre die Endlossuche zurück. Einen periodischen Wiederholungsversuch gibt es bewusst nicht: der Miner wird nicht erneuert, sein Nachfolger startet ohne `onPosition` und durchläuft die Standortsuche ohnehin komplett neu.

Der Notfallminer zählt nicht als regulärer Miner für seine Quelle und blockiert deshalb nicht den Nachzug eines regulär dimensionierten Miners. Sobald für dieselbe Quelle ein fertiger regulärer Miner existiert, beendet sich der Notfallminer selbst (`suicide()`) — ohne das würde er bis zu 1500 Ticks lang zusammen mit dem Notfallzustand in `controller/spawn.ts` das Spawnen in allen Nachbarräumen desselben Spawns blockieren.

### Wer die Logistik eines Raums macht

Die Zuständigkeit hängt am **Ausbaustand**, und zwar an den Bauwerken, nicht am RCL als Zahl — ein Raum kann RCL 4 erreicht haben, ohne das Storage gebaut zu haben.

| Ausbaustand | Wer holt | Wer füllt |
| --- | --- | --- |
| kein Storage (bis RCL 3) | `debitor` als Allrounder: Quelle/Container → Spawn, Extensions | derselbe Creep |
| Storage vorhanden (ab RCL 4) | `hauler`: Quellcontainer → Storage | `filler`: Storage → Spawn, Extensions, Turm |
| Quell-Link sendet (ab RCL 5) | Linknetz ersetzt den `hauler` für diese Quelle | `filler`, gespeist vom `linkkeeper` |
| alle Quellen mit Link (RCL 8) | kein Heim-`hauler` mehr | `filler` allein |
| Storage **und** Terminal (ab RCL 6) | `collector`: Tombstones, Drops, Ruinen, Extractor-Container, verkaufbare Ressourcen und Terminalenergie aus dem Storage | derselbe Creep: Terminal, mit Storage als Rückfall |

Die ersten drei Zeilen betreffen den **Energieumlauf** und schließen sich gegenseitig aus: `filler` und `hauler` verlangen `spawn.room.storage`, `Debitor.spawn` steigt für den Heimatraum mit Storage aus. Kein Raum wird von beiden bedient und keiner von keinem. Fremde Arbeitsräume bleiben in jedem Fall Sache des `debitor`.

Der `collector` steht **nicht** in dieser Ausschließlichkeit: er kommt in Räumen mit Storage und Terminal zu `filler` und `hauler` hinzu, statt einen von beiden abzulösen. Er rührt den Energieumlauf nicht an — er holt Energie nur für das Terminal und nur, solange der Raum sie entbehren kann (siehe `collector`).

### `filler`

Storage → Spawn, Extensions, Türme, ausschließlich im eigenen Raum. Ersetzt den früheren Freelancer-Debitor (`memory.container === ''`). Ist das Storage leer, fällt er auf die Quellcontainer zurück, damit der Spawn in der Lücke nicht verhungert; ist nichts zu füllen, bleibt er **beladen stehen**, statt die Ladung zurückzugeben — er ist damit sofort bereit, wenn die nächste Extension leerläuft.

Er trägt weder Fernziel noch Ausweichjob: kein `goToWorkroom`, keine Distanzmessung, kein Tombstone-/Drop-/Ruinen-Scan, kein Mineralienverkauf, kein Terminal, kein Lab. Genau das ist der Zweck der Rolle — sie ist der Nachfolger des teuersten Postens im Bot und soll wenig tun und immer dasselbe.

Einer je Raum genügt nach Durchsatz (zwei Quellen liefern 20 Energie je Tick, ein Umlauf Storage→Extension→Storage dauert rund zehn Ticks, das sind vier `CARRY` nach der Formel in `docs/knowledge/efficiency/energy-economy.md`); `debitorAsFreelancer` bleibt als Obergrenze erhalten. Rumpf ist unverändert `BODIES.debitorWithoutContainer`.

**In `roles/index.ts` steht der Filler ganz vorn.** Sind Spawn und Extensions leer, spawnt der Raum überhaupt nichts mehr, auch keinen Ersatzfiller — wer den Spawn füttert, muss vor allen stehen, die daraus bezahlt werden. Aus demselben Grund gibt es einen Notfallspawn mit einem Minimalrumpf aus der *verfügbaren* Energie. Dessen Creep trägt bewusst `notfall: false`: `controller/spawn.ts` überspringt für einen Spawn, unter dessen Heimatcreeps ein `notfall` steht, das Spawnen **aller anderen** Arbeitsräume — ein Notfallfiller würde die Remote-Räume sonst bis zu 1500 Ticks blockieren.

### `hauler`

Quellcontainer → Storage, ausschließlich im eigenen Raum, einer je Container. Übernimmt den containergebundenen Debitor für den Fall `home == workroom`. Steht neben dem Container ein Link **und** liefert das Linknetz wirklich ab (`linksDeliver`: der Raum nutzt Links und in der erhobenen Liste steht ein Storage-Link), entfällt der Hauler für diese Quelle — nur dann, denn zwischen „Raum darf Links bauen" und „am Storage steht ein Empfänger" liegen mehrere Tage Bauzeit, und in dieser Lücke bliebe die Energie im Quell-Link liegen.

Notventil: hängt der Raum am Prioritätsspawn (`aktivPrioSpawn`), geht die Ladung direkt an Spawn und Extensions statt den Umweg über das Storage. Einen eigenen Notfallspawn hat die Rolle bewusst nicht — den Spawn füttert der Filler, die Notfallkette der Förderung hängt am Miner. Rumpf ist unverändert `BODIES.debitor`.

### `debitor`

Der Debitor ist der **Remote-Hauler** und der Allrounder für Räume ohne Storage. Containergebundene Debitoren bedienen die Quellencontainer fremder Räume. Auf fremden Räumen misst er Umlaufdistanzen und leitet nach ausreichenden Messungen die benötigte Carry-Größe und Anzahl ab (`needDebitorSize`, `needDebitors`).

`doJob` trägt noch die vollständige alte Kaskade inklusive der Zweige, die inzwischen `filler` und `hauler` erledigen. Das ist Absicht: Rollennamen stehen im Creep-Memory, und die zum Umstellungszeitpunkt lebenden Debitoren müssen ihre bis zu 1500 Ticks zu Ende arbeiten können. Die toten Zweige fallen in einem späteren Commit weg, wenn keiner mehr lebt.

Im normalen Betrieb sammelt er zunächst wertvolle Reste, Links und Container/Storage ein. Nichtenergie kann aus dem Storage in einen freien Terminal umgelagert werden; danach wird bevorzugt Terminal bzw. Storage beliefert. Energie wird nach Lage an Spawn/Extensions, Türme, Terminal, Storage und Labs geliefert. Im Invasions- und Notfallmodus priorisiert die Rolle Versorgung von Spawn und Türmen.

Im Heimatraum mit Storage ist dieser Umlagerungs-Zweig seit Plan 10 toter Code: `Debitor.spawn` steigt dort aus, der Zweig läuft also nur noch in den letzten lebenden Debitoren aus der Zeit davor. Die Aufgabe selbst — Mineralien und Reste aus dem Heimatraum ins Terminal bringen — übernimmt jetzt `collector`.

### `linkkeeper`

Der Linkkeeper steht dauerhaft auf dem einen Feld, das an den Spawn-Link (`spawnLink`) **und** an das Storage angrenzt, nimmt die Energie aus dem Link und gibt sie ins Storage. Die Rolle existiert, weil ein voller empfangender Link nichts mehr annehmen kann und dadurch den Durchsatz **aller** Quell-Links blockiert, die auf ihn senden — den Empfänger zu leeren ist Voraussetzung für den Durchsatz der ganzen Strecke, nicht Aufräumen.

Seit der Storage-Link auch senden kann, pendelt der Keeper in **beide**
Richtungen: Entscheidet `needsStorageFeed` (`controller/links.ts`) auf
Nachschub, kehrt sich die Richtung um — der Keeper holt dann aus dem Storage
und füllt den Link, statt ihn zu leeren, und steigt danach aus, ohne den Link
zu leeren. Gefragt wird dieselbe Funktion wie vom Sendenetz: der Keeper handelt
im selben Tick **vor** `controller.timing.controll()`, eine Flagge aus dem
Vortick käme zu spät.

Nachschub ist fällig in genau zwei Lagen, und beide setzen voraus, dass der
Controller-Link mindestens `SEND_MIN` (200) **freien Platz** hat — in einen
vollen Empfänger wird nichts nachgeschoben, sonst verlöre der Storage-Link
seinen Platz in der Empfängerliste und das Linknetz des Raums stünde still:

- **Rückfall** — alle drei Bedingungen zusammen: im Controller-Link liegen
  weniger als `SEND_MIN`, **kein** Quell-Link hält eine Ladung von mindestens
  `SEND_MIN`, und im Storage liegen mehr als `STORAGE_FEED_RESERVE` (20 000)
  Energie. Gemessen wird der **Inhalt** der Quell-Links, nicht ihr Cooldown:
  ein beladener Quell-Link liefert von selbst ab, sobald sein Cooldown fällt.
- **Vollpumpen** — `storageIsFull` (mehr als 90 Prozent belegt bei über
  100 000 Energie), unabhängig davon, was die Quell-Links tun und wie viel
  bereits im Controller-Link liegt.

Der Standplatz wird einmal je Creep berechnet (Nachbarfeld des Links, das auch an das Storage angrenzt, kein Wall-Terrain, keine blockierende Struktur nach `OBSTACLE_OBJECT_TYPES`) und im Creep-Memory unter `post` gespeichert; Straße, Container und Rampart blockieren den Platz nicht. Auf dem Standplatz prüft die Rolle **jeden Tick** den Inhalt von Link und eigenem Inventar und steigt sofort aus, wenn beide leer sind. Eine Schlafdauer wäre hier geraten: der empfangende Link hat keinen eigenen Cooldown — der liegt beim sendenden Link —, es gibt an dieser Stelle also nichts, worauf man warten könnte. `transfer` ins Storage und `withdraw` aus dem Link werden im selben Tick angemeldet; ob Screeps beide auflöst, ist offiziell nicht dokumentiert (siehe `docs/knowledge/mechanics/creeps-actions.md`) — lösen beide aus, dauert ein Umlauf einen Tick, sonst zwei, beides ist korrekt.

Körperprofil: die Zahl der `CARRY`-Teile ergibt sich aus `LINK_CAPACITY / CARRY_CAPACITY` (800/50 = 16 `CARRY`), damit ein Withdraw den vollen Link auf einmal aufnimmt, dazu genau ein `MOVE` — der Creep steht nach der Anreise dauerhaft still, weitere `MOVE`-Teile würden nur den einmaligen Hinweg beschleunigen. Kosten 850 Energie, 17 Körperteile, 51 Ticks Spawnzeit. Ein Rückfallprofil mit weniger `CARRY` greift, falls die Energiekapazität nicht reicht; praktisch nie nötig, weil Links erst ab RCL5 existieren und dort bereits deutlich mehr Kapazität zur Verfügung steht.

Gespawnt wird die Rolle nur, wenn `sendLinkkeeper` gesetzt ist, der Raum Links nutzt (eigener Controller ab RCL5), in seiner erhobenen Linkliste ein Storage-Link steht, der Spawn im Spawnraum selbst steht und ein Storage existiert; es lebt höchstens ein Linkkeeper je Raum. In `roles/index.ts` steht die Rolle direkt hinter `debitor`, also weit vorn in der Spawn-Priorität — ein verstopfter Link kostet sonst den Durchsatz der ganzen Link-Strecke.

### `transfer`

Transfer-Creeps transportieren Energie zwischen eigenen Räumen, wenn `transferEnergie` aktiviert und der Zielraum als `claimed` markiert ist. Der Heimat-Storage muss mindestens 10.000 Energie enthalten. Pro Spawn/Zielraum wird höchstens einer erhalten. Im Zielraum räumt die Rolle zunächst Ruinen, Drops und Tombstones; sonst nimmt sie Energie im Heimatraum auf und liefert im Zielraum an Türme, Terminal, Labs, Storage, Container oder Builder.

### `claimer`

Der Claimer bewegt sich in den Arbeitsraum und reserviert oder claimt dessen Controller (`global.room[workroom].claim`). Bei einem blockierenden fremden Controller greift er diesen an. Der Erfolg wird als `Memory.rooms[workroom].claimed` gespeichert; außerdem signiert er mit `⚔`. Profil: `2 CLAIM, 2 MOVE`.

## Ausbau- und Wartungsrollen

### `builder`

Builder beschaffen Energie mit `base.harvest()`, pausieren bei Invasion und versorgen bei Prioritäts-Spawn zuerst Spawn/Extensions. Anschließend bauen sie die Baufläche mit der kleinsten `global.prio.build[structureType]`; bei gleicher Priorität wird die weiter fortgeschrittene Baustelle bevorzugt. Ohne Baustelle upgraden sie den Controller. Die gewünschte Zahl ist `maxbuilder`; Spawn erfolgt nur bei sichtbaren Baustellen.

### `repairer`

Repairer arbeiten analog, nutzen aber `global.prio.repair` für die Auswahl und `global.prio.hits` als Mindest-Hitquote (Standard 50 %). Explizite `prioBuildings` werden bis 90 % zuerst behandelt; ein zwischenzeitlich zerstörter `prioBuildings`-Eintrag wird übersprungen statt die Rolle abstürzen zu lassen. Innerhalb derselben Priorität wird nach absolutem Schaden (`hitsMax - hits`) absteigend sortiert, sodass die am stärksten beschädigte Struktur zuerst drankommt. Nach `global.const.maxRepairs` Arbeitszyklen wird das Ziel neu gewählt. Ohne Reparaturziel wird geupgradet.

### `wally`

Wally repariert die schwächste gespeicherte Wand oder Rampart aus `Memory.rooms[workroom].wally`. Die Liste wird durch den manuellen Memory-Controller-Job gepflegt. Während einer Invasion stellt die Rolle ausschließlich Energie für Türme bereit. Das Spawning ist durch `maxwallRepairer`, beschädigte Walls/Ramparts und mindestens 50.000 Energie im Storage begrenzt.

### `upgrader` und `extupgrader`

Der lokale Upgrader erntet bevorzugt vom Controller-Link, dann aus Storage, Containern und Resten. Er wird nur im eigenen Raum erzeugt.

Ob er den Link nimmt, entscheidet er in **jedem Tick neu am Inhalt** des Links
(mehr als 100 Energie) — nicht mehr an einer Memory-Flagge. Die frühere
`noLink`-Flagge wurde nach dem ersten leeren Antreffen nie zurückgesetzt und
sperrte den Link damit für die restlichen rund 1500 Ticks des Creeps; sie ist
entfallen und wird bei lebenden Creeps nur nicht mehr gelesen. Ist der Link
leer, fällt der Creep in dieselbe Ersatzkette wie bisher (Storage, Container,
Drops, Tombstones, Ruinen, Quelle), statt untätig zu warten.

**Nur noch eine Drossel, und sie greift ausschließlich bei voller Ausbaustufe** (`_mayWork`, Plan 04, Punkt 3 entschieden am 2026-08-06): **unter RCL 8 arbeitet der Upgrader in jedem Tick**, ungedrosselt. Die frühere Tickdrossel (`memory.sparmodus`, gesetzt ab RCL 6, ein Sechstel bis ein Siebtel der Ticks) ist entfallen — sie kostete dort echten RCL-Fortschritt, nicht nur GCL, und war damit teurer als gedacht. `sparmodus` steht bei Creeps aus der Zeit davor noch im Memory, wird aber nirgends mehr gelesen.

- **Ab RCL 8** drosselt der Vorrat statt der Tickzahl. Der Controller nimmt dort nur noch 15 Energie je Tick an, RCL-Fortschritt gibt es nicht mehr, und der Raum hat typischerweise Überschuss. Gearbeitet wird bei mehr als 100 000 Energie im Storage (`RCL8_WORK_RESERVE`) oder wenn `ticksToDowngrade` unter 100 000 fällt (`DOWNGRADE_ALARM`) — der Timer schlägt den Vorrat, sonst verlöre ein Raum mit leerem Storage seine Stufe.
- **Kehrseite, ausdrücklich gewollt:** unter RCL 8 gibt es dabei **keine** Vorratsschwelle. Der Upgrader zieht dort zuerst am Storage, `RCL8_WORK_RESERVE` schützt nur Stufe 8 — eine Schwelle darunter wäre wieder ein Sparmodus unter voller Ausbaustufe und damit das Gegenteil der Entscheidung. Betroffene Räume sind über `controller.progress` und `storage.store.energy` je 1000 Ticks zu beobachten.

Die **Arbeits**schwelle liegt bewusst unter der **Spawn**schwelle von 250 000: mit derselben Zahl auf beiden Seiten verstummte der Upgrader genau in dem Moment, in dem er anfängt, den Überschuss abzubauen. Gespawnt wird bei klarem Überschuss, gearbeitet, bis der Vorrat aufgebraucht ist.

**Ausnahme von der Spawnschwelle:** Läuft der Storage über (`storageIsFull`,
mehr als 90 Prozent Belegung bei über 100 000 Energie), steht mindestens ein
Upgrader — auch bei `upgrader: 0` in der Config und trotz des RCL8-Gates bei
250 000 Energie. Kein theoretischer Fall: bei hoher Mineralbelegung und nur
150 000 Energie greift das Gate genau dann, wenn der Abfluss gebraucht wird.
`Math.max(1, konfigurierte Zahl)` hebt dabei eine **Untergrenze** auf eins an;
eine höhere konfigurierte Zahl bleibt bestehen. Dass die Untergrenze bei eins
liegt und nicht höher, hat einen Grund: ab RCL8 nimmt der Controller ohnehin
nur `CONTROLLER_MAX_UPGRADE_PER_TICK` (15) Energie je Tick für den ganzen Raum
an, und das RCL8-Profil mit 15 WORK schöpft das allein aus.

Das Rumpfprofil ab RCL 8 (`BODIES.upgraderRcl8`) hat **15 WORK, 5 CARRY, 5 MOVE** und schöpft die erlaubte Rate damit genau aus (`UPGRADE_CONTROLLER_POWER` ist 1 je WORK und Tick). Wenige `CARRY`, weil der Controller-Link in Reichweite 1 steht; wenige `MOVE`, weil der Creep nach der Anreise steht. Vorher standen dort 4 WORK, 18 CARRY und 18 MOVE — zusammen mit der Tickdrossel kam der Raum damit auf 0,5 von 15 erlaubten Energie je Tick. Das ist kein Detail am Rand: GCL wächst ausschließlich aus Controller-Upgrades und ist die Erlaubnis für den nächsten Raum.

`extupgrader` ist die Fernraumvariante: Sie wird nur außerhalb des Spawnraums erzeugt, nutzt Link/Storage/Container/Quelle und upgradet ohne Invasions- oder Prioritäts-Spawn-Prüfung.

## Verteidigung

### `defender`

Defender reagieren auf `needDefence`, `invaderCore` oder konfigurierte IDs unter `destroy`. Gegner werden nach Körperkosten absteigend priorisiert. Die Rolle nutzt Nah- und Fernangriff, merkt das Ziel als `attackId` und entfernt Verteidigungsflags, sobald keine Ziele verbleiben. Gegen Invader Cores können bis zu vier, gegen Feinde bis zu zwei Defender erzeugt werden. Ohne aktive Angriffs-Körperteile suizidiert sich der Creep.

## Wirtschaft

### `collector`

Ein Collector je Raum mit Storage **und** Terminal, abgeleitet aus dem Baubestand statt konfiguriert — anders als `linkkeeper`, der noch einen Schalter (`sendLinkkeeper`) trägt, sind Storage und Terminal Tatsachen über die Welt und keine Absicht.

Schließt eine Lücke aus Plan 10: seit `filler` und `hauler` den Heimatraum-Debitor ersetzen, spawnt `debitor` in Räumen mit Storage nicht mehr — und mit ihm verschwand der einzige Umzug Storage → Terminal im ganzen Bot. Mitbetroffen waren auch Tombstones, Drops und Ruinen im Heimatraum sowie die Energieversorgung des Terminals, ohne die `TerminalMarket.sell` unter 1000 Energie gar nicht erst anläuft.

Gesammelt wird in sechs Stufen, sortiert nach Verfallsgeschwindigkeit — was zuerst verschwindet, kommt zuerst dran:

1. Tombstones (nehmen ihren Inhalt beim Zerfall mit)
2. Drops (schrumpfen je Tick)
3. Ruinen (halten am längsten)
4. eine Prüfung, ob im Terminal überhaupt noch Platz ist (mehr als `TERMINAL_FREE_MIN`, 50.000, frei) — die drei verfallenden Quellen stehen bewusst **davor**, sie werden auch bei vollem Terminal eingesammelt, sonst sind sie weg
5. der Container am Extractor, den seit Plan 10 sonst niemand abholt (`hauler` läuft nur über Energiequellen)
6. die erste verkaufbare Ressource aus dem Storage (nicht Energie, nicht auf `NEVER_SELL`, mehr als 100 Einheiten), sonst Energie fürs Terminal, solange dessen Bestand unter `TERMINAL_ENERGY_TARGET` (20.000) liegt

Laufen alle sechs Stufen leer, während der Creep noch etwas trägt, schaltet er selbst auf Abliefern um. `checkHarvest` tut das hier nicht: dessen Regel für Nichtenergie hängt an `memory.mineral`, und das steht bei dieser Rolle fest auf `energy`, damit sie überhaupt auffüllt statt nach jedem einzelnen Griff loszufahren. Ohne die eigene Umschaltung bliebe eine Restmenge bis zum Tod des Creeps liegen — und der Nachfolger höbe sie aus dem Grabstein wieder auf.

Die Energiestufe hat zwei Vorbehalte, weil sie sonst rund 50 Energie je Tick über etwa 400 Ticks aus dem Storage zöge — mehr, als zwei Quellen liefern: hängt der Raum am Prioritätsspawn (`aktivPrioSpawn`), wird gar keine geholt, und das Storage muss über `STORAGE_ENERGY_RESERVE` (50.000) liegen — dieselbe Zahl, mit der `wally` seinen Energiezugriff vorbehält.

Die Id des Extractor-Containers kommt aus der Config (`bot.room[<raum>].mineralContainerId`), sonst aus `memory.container`, und erst danach aus einer Suche neben den Mineralvorkommen. Die Config zuerst, weil `creep/transport.ts` dieselbe Id von dort liest.

`doJob` steigt ganz vorn aus, wenn der Controller unter Stufe 6 liegt oder kein Terminal dasteht: `TransportToHomeTerminal` weist unter RCL 6 alles ab, und in einem heruntergestuften Raum mit noch stehendem Terminal liefe das Mineral sonst endlos Storage → Creep → Storage.

`TERMINAL_ENERGY_TARGET` steuert nur das Holen; abgeliefert wird über `TransportToHomeTerminal`, Rückfall `TransportToHomeStorage`. Vor dem Rückfall wird `memory.fromId` geräumt, sonst bliebe der Creep beladen stehen, weil er nicht dorthin zurückliefert, woher er gerade geholt hat.

Vier Aufgaben in einer Rolle sind hier Absicht, obwohl Plan 10 den Debitor genau wegen seiner Kaskade zerlegt hat: dort waren es verschiedene Zwecke in vielen Creeps, hier ist es ein Zweck in einem Creep je Raum. In der Spawn-Priorität (`roles/index.ts`) steht der Collector hinter `defender` — ein Raum unter Beschuss hat andere Sorgen — und vor `wally`, weil Einsammeln mehr bringt als Mauerreparatur.

## Wartungshinweis

Die Prioritätstabellen `global.prio.build`, `global.prio.repair` und `global.prio.hits` stammen aus `config.js`; Änderungen daran wirken zugleich auf Builder, Repairer und Tower.
