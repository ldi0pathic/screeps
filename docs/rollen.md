# Rollen

Alle Rollen exportieren `doJob(creep)` und meist `spawn(spawn, workroom)`. Die Spawnmethoden prüfen vorhandene Creeps, Raumflags und Energie, bevor sie `creep.base.spawn()` verwenden.

## Rohstoff- und Transportrollen

### `miner`

Ein Miner wird pro Quellen-ID erzeugt. Er sucht oder baut zuerst einen Container direkt neben der Quelle und stellt sich darauf. Bei Energiequellen baut/nutzt er ab RCL 4 zusätzlich einen Link; bei Mineralen nutzt er einen benachbarten Terminal, sofern vorhanden, und berücksichtigt den Extractor-Cooldown. Volle Links werden an den Controller-Link oder zufällig an einen konfigurierten Ziel-Link weitergeleitet. Das Standardprofil besteht aus Gruppen von `3 WORK, 1 CARRY, 2 MOVE`, maximal acht Gruppen.

Die Spawnlogik plant beim Ausfall lokal früher nach (TTL-Grenze 150 statt 300). Fehlende Miner setzen `aktivPrioSpawn`; nach mehr als 25 fehlgeschlagenen Prioritätsversuchen versucht sie einen Notfallminer `[WORK,CARRY,MOVE]`.

### `debitor`

Der Debitor ist der Haule­r. Containergebundene Debitoren bedienen die Quellencontainer; optionale Freelancer haben `memory.container === ''`. Auf fremden Räumen misst er Umlaufdistanzen und leitet nach ausreichenden Messungen die benötigte Carry-Größe und Anzahl ab (`needDebitorSize`, `needDebitors`).

Im normalen Betrieb sammelt er zunächst wertvolle Reste, Links und Container/Storage ein. Nichtenergie kann aus dem Storage in einen freien Terminal umgelagert werden; danach wird bevorzugt Terminal bzw. Storage beliefert. Energie wird nach Lage an Spawn/Extensions, Türme, Terminal, Storage und Labs geliefert. Im Invasions- und Notfallmodus priorisiert die Rolle Versorgung von Spawn und Türmen.

### `transfer`

Transfer-Creeps transportieren Energie zwischen eigenen Räumen, wenn `transferEnergie` aktiviert und der Zielraum als `claimed` markiert ist. Der Heimat-Storage muss mindestens 10.000 Energie enthalten. Pro Spawn/Zielraum wird höchstens einer erhalten. Im Zielraum räumt die Rolle zunächst Ruinen, Drops und Tombstones; sonst nimmt sie Energie im Heimatraum auf und liefert im Zielraum an Türme, Terminal, Labs, Storage, Container oder Builder.

### `claimer`

Der Claimer bewegt sich in den Arbeitsraum und reserviert oder claimt dessen Controller (`global.room[workroom].claim`). Bei einem blockierenden fremden Controller greift er diesen an. Der Erfolg wird als `Memory.rooms[workroom].claimed` gespeichert; außerdem signiert er mit `⚔`. Profil: `2 CLAIM, 2 MOVE`.

## Ausbau- und Wartungsrollen

### `builder`

Builder beschaffen Energie mit `base.harvest()`, pausieren bei Invasion und versorgen bei Prioritäts-Spawn zuerst Spawn/Extensions. Anschließend bauen sie die Baufläche mit der kleinsten `global.prio.build[structureType]`; bei gleicher Priorität wird die weiter fortgeschrittene Baustelle bevorzugt. Ohne Baustelle upgraden sie den Controller. Die gewünschte Zahl ist `maxbuilder`; Spawn erfolgt nur bei sichtbaren Baustellen.

### `repairer`

Repairer arbeiten analog, nutzen aber `global.prio.repair` für die Auswahl und `global.prio.hits` als Mindest-Hitquote (Standard 50 %). Explizite `prioBuildings` werden bis 90 % zuerst behandelt. Nach `global.const.maxRepairs` Arbeitszyklen wird das Ziel neu gewählt. Ohne Reparaturziel wird geupgradet.

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
