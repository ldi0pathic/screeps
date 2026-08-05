# Rollen

Alle Rollen exportieren `doJob(creep)` und meist `spawn(spawn, workroom)`. Die Spawnmethoden prüfen vorhandene Creeps, Raumflags und Energie, bevor sie `creep.base.spawn()` verwenden.

**Rumpfprofile stehen nicht mehr in den Rollen**, sondern zusammen in `tsBot/src/creep/bodies.ts`; die Arithmetik (Sätze bilden, Rückfall, Obergrenzen) steckt in der Klasse `BodyProfile` in `tsBot/src/creep/body.ts`. Die Rolle entscheidet nur noch, **welches** Profil gilt — beim Upgrader hängt das am RCL, beim Debitor daran, ob Arbeits- und Heimatraum derselbe sind. Die unten je Rolle genannten Zahlen sind unverändert; wer sie vergleichen will, liest jetzt eine Datei statt elf.

## Rohstoff- und Transportrollen

### `miner`

Ein Miner wird pro Quellen-ID erzeugt. Er sucht oder baut zuerst einen Container direkt neben der Quelle und stellt sich darauf. Bei Energiequellen baut/nutzt er ab RCL 4 zusätzlich einen Link; bei Mineralen nutzt er einen benachbarten Terminal, sofern vorhanden, und berücksichtigt den Extractor-Cooldown. **Der Miner füllt seinen Link nur noch**; wohin dieser weitersendet, entscheidet `controller/links.ts` einmal je Raum und Tick (siehe `controller-und-automatik.md`). Die frühere Weiterleitung im Miner wählte ihr Ziel zufällig und sendete ohne Mengenangabe. Das Standardprofil besteht aus Gruppen von `3 WORK, 1 CARRY, 2 MOVE`, maximal acht Gruppen.

Die Spawnlogik plant beim Ausfall lokal früher nach (TTL-Grenze 150 statt 300). Fehlende Miner setzen `aktivPrioSpawn`; nach mehr als 25 fehlgeschlagenen Prioritätsversuchen versucht sie einen Notfallminer `[WORK,CARRY,MOVE]`. Unterhalb einer Raum-Energiekapazität von 450 (RCL1 oder ein Raum, der nach einem Angriff darunterfällt) fällt das reguläre Profil auf `[WORK,WORK,CARRY,MOVE]` für 300 Energie zurück, statt ein leeres Body-Array zu liefern, mit dem `spawnCreep` grundsätzlich fehlschlägt.

Der Notfallminer zählt nicht als regulärer Miner für seine Quelle und blockiert deshalb nicht den Nachzug eines regulär dimensionierten Miners. Sobald für dieselbe Quelle ein fertiger regulärer Miner existiert, beendet sich der Notfallminer selbst (`suicide()`) — ohne das würde er bis zu 1500 Ticks lang zusammen mit dem Notfallzustand in `controller/spawn.ts` das Spawnen in allen Nachbarräumen desselben Spawns blockieren.

### `debitor`

Der Debitor ist der Haule­r. Containergebundene Debitoren bedienen die Quellencontainer; optionale Freelancer haben `memory.container === ''`. Auf fremden Räumen misst er Umlaufdistanzen und leitet nach ausreichenden Messungen die benötigte Carry-Größe und Anzahl ab (`needDebitorSize`, `needDebitors`).

Im normalen Betrieb sammelt er zunächst wertvolle Reste, Links und Container/Storage ein. Nichtenergie kann aus dem Storage in einen freien Terminal umgelagert werden; danach wird bevorzugt Terminal bzw. Storage beliefert. Energie wird nach Lage an Spawn/Extensions, Türme, Terminal, Storage und Labs geliefert. Im Invasions- und Notfallmodus priorisiert die Rolle Versorgung von Spawn und Türmen.

### `linkkeeper`

Der Linkkeeper steht dauerhaft auf dem einen Feld, das an den Spawn-Link (`spawnLink`) **und** an das Storage angrenzt, nimmt die Energie aus dem Link und gibt sie ins Storage. Die Rolle existiert, weil ein voller empfangender Link nichts mehr annehmen kann und dadurch den Durchsatz **aller** Quell-Links blockiert, die auf ihn senden — den Empfänger zu leeren ist Voraussetzung für den Durchsatz der ganzen Strecke, nicht Aufräumen.

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

Der lokale Upgrader erntet bevorzugt vom Controller-Link, dann aus Storage, Containern und Resten. Bei RCL über 5 läuft er nach erfolgreichem Upgrade im Sparmodus nur noch in einem von `controller.level` abhängigen Tick. Er wird nur im eigenen Raum erzeugt und berücksichtigt bei RCL 8 Energie- und Downgrade-Reserven.

`extupgrader` ist die Fernraumvariante: Sie wird nur außerhalb des Spawnraums erzeugt, nutzt Link/Storage/Container/Quelle und upgradet ohne Invasions- oder Prioritäts-Spawn-Prüfung.

## Verteidigung

### `defender`

Defender reagieren auf `needDefence`, `invaderCore` oder konfigurierte IDs unter `destroy`. Gegner werden nach Körperkosten absteigend priorisiert. Die Rolle nutzt Nah- und Fernangriff, merkt das Ziel als `attackId` und entfernt Verteidigungsflags, sobald keine Ziele verbleiben. Gegen Invader Cores können bis zu vier, gegen Feinde bis zu zwei Defender erzeugt werden. Ohne aktive Angriffs-Körperteile suizidiert sich der Creep.

## Wartungshinweis

Die Prioritätstabellen `global.prio.build`, `global.prio.repair` und `global.prio.hits` stammen aus `config.js`; Änderungen daran wirken zugleich auf Builder, Repairer und Tower.
