# Creep-Grundbausteine und Rollenvermittlung

`prod/creep.jobs.js` ist die zentrale Rollentabelle. Zulässige Werte für `creep.memory.role` sind `debitor`, `transfer`, `miner`, `claimer`, `builder`, `repairer`, `upgrader`, `extupgrader`, `defender` und `wally`. Jedes zugeordnete Modul muss `doJob(creep)` exportieren.

Ein Profiler misst optional die CPU je Rolle und, während einer Detailmessung, zusätzlich je einzelnem Creep. Alle zehn Rollen sind Klassen mit `implements CreepRole`, tragen den Dekorator `@profile` und exportieren ihre Instanz als Default; `roles/index.ts` importiert deshalb Defaults statt Namespaces. Die Reihenfolge der Tabelle und ihre Schlüssel bleiben davon unberührt — sie ist die Spawn-Priorität in `controller/spawn.ts` und steht im Creep-Memory laufender Creeps. Zwei Messwege bestehen nebeneinander: `wrapRoles` verbucht weiter die Rolle als Ganzes unter ihrem Namen, `@profile` zusätzlich jede Methode einzeln unter `<Klasse>.<Methode>` in einen eigenen Eimer. Ein Profiler-Aufruf steht in keinem Rollencode, eine Ausnahme aus einer Rolle geht unverändert durch, und ausgeschaltet läuft kein `Game.cpu.getUsed()`. Details und Bedienung (`prof.on()`, `prof.report()`, …) siehe `docs/controller-und-automatik.md`.

## Arbeitszustand und Beschaffung

`creep.base.js` bündelt wiederverwendbare Aktionen. Die Rollen verwenden `memory.harvest` als Zustandsautomat: `true` bedeutet Ressourcen beschaffen, `false` bedeutet arbeiten/abliefern. Die Prototypmethode `checkHarvest()` schaltet bei leerem bzw. vollem Inventar um und löscht dabei zwischengespeicherte Pfade und Ziele.

Die allgemeine Energiepriorität von `base.harvest()` lautet:

1. Ruinen, Storage, gedroppte Ressourcen und Tombstones
2. Container mit ausreichendem Inhalt
3. aktive Energiequelle (nur mit `WORK`-Teil)

Erfolgreiche Entnahmen speichern die Herkunft in `memory.fromId`. Transportfunktionen nutzen diese ID, um nicht in das eben verwendete Objekt zurückzuliefern.

Spezialisierte Entnahmen existieren für den Controller-Link, einen dem Creep zugeordneten Container sowie eine Notfallentnahme aus energiehaltigen Links, Labs, Nukern und Türmen. Den Spawn-Link leert stattdessen die Rolle `linkkeeper` in der Basis und schiebt die Energie ins Storage — wer Energie braucht, holt sie von dort.

## Transportziele

`creep.base.transport.js` liefert an Spawn/Extensions, Türme, Storage, Terminal, Labs oder geeignete Container. Container werden aus `Memory.rooms[room].container` gewählt; fehlt diese Liste, wird sie aus sichtbaren Strukturen aufgebaut. Der Mineralcontainer aus `global.room[room].mineralContainerId` wird beim Standard-Containertransport ausgelassen.

Terminaltransport ist erst ab RCL 6 möglich und merkt sich die Terminal-ID unter `Memory.rooms[workroom].terminalId`. Energie wird nicht mehr in ein Terminal mit über 100.000 Energie eingelagert. Storage-Transport schützt außerdem vor Schleifen zum Quellobjekt und vor dem Leeren eines benötigten Spawn-Links.

## Bewegung

Die Beschaffungsketten (`harvestRoom*`, `harvestControllerLink`, `harvestMyContainer`, `harvestNotfall`) teilen sich zwei Bausteine aus `tsBot/src/creep/target.ts`:

- **`RememberedTarget`** kapselt einen Memory-Schlüssel wie `useRoomDrop`, `useTombstone`, `useRuin`, `useContainer` oder `useRoomSource`. Regel, die dabei zählt: ist ein Ziel gemerkt, das es nicht mehr gibt, wird in diesem Tick **nicht** ersatzweise gesucht — der Creep vergisst es und versucht es im nächsten Tick neu. Das begrenzt die Zahl der Pfadsuchen je Tick.
- **`collectFrom`** und **`withdrawFrom`** werten aus, was eine Aktion am Ziel gemeldet hat: `ERR_NOT_IN_RANGE` heißt hinlaufen (und im nächsten Tick weiter), `OK` heißt erledigt — dabei wird `fromId` gesetzt, damit die Ladung nicht gleich wieder in dieselbe Quelle zurückgeht —, alles andere heißt „daraus wird nichts", und der Aufrufer probiert das nächste Ziel seiner Kette.

Die vier Memory-Schlüssel des Pfad-Caches (`path`, `pathTarget`, `lastPos`, `dontMove`) liegen hinter der Klasse `PathMemory` in `tsBot/src/creep/path-memory.ts`. Sie kennt **zwei** Löschregeln, die man nicht verwechseln darf: `forgetPath()` verwirft nur den Weg (so bei jedem Zustandswechsel in `checkHarvest`, denn der Creep steht ja weiter dort, wo er steht), `clear()` zusätzlich die Stauerkennung (am Ziel, bei ungültigem Pfad und wenn der Miner seinen Standplatz wechselt).

`moveByMemory(creep, target)` serialisiert einen Pfad in `memory.path` und verwendet ihn wieder, solange `memory.pathTarget` unverändert ist. `memory.dontMove` zählt mit, wie oft der Creep in Folge auf derselben Position stehen geblieben ist, und wird bei jeder tatsächlichen Bewegung wieder auf `0` zurückgesetzt. Bei mehr als drei gezählten Stillständen in Folge wird ein neuer Pfad unter Berücksichtigung von Creeps (`ignoreCreeps: false`) gesucht und im selben Tick per `moveByPath` sofort genutzt. Erreicht der Creep das Ziel oder ist der Pfad ungültig, werden Pfad- und Stillstands-Memory gelöscht.

Die Methode zeichnet den verbleibenden Pfad nur, wenn `bot.const.showPaths` in `config.ts` auf `true` steht (Standard `false`) — der Schalter ist ausschließlich für die Fehlersuche gedacht, weil das Zeichnen jeden Tick den gecachten Pfad erneut deserialisiert und durchsucht.

`goToMyHome()`, `goToWorkroom()` und `goToRoomFlag()` sind darauf aufbauende Ortswechsel. Räume werden jeweils über die Mittelpunktposition `(25,25)` angesteuert.

## Spawning und Controller

`base.spawn(spawn, profil, newName, memory)` prüft zuerst per `dryRun`, startet dann den Spawn und loggt die Profilkosten. `calcProfil()` summiert dafür `BODYPART_COST`.

`upgradeController()` upgradet und signiert fremde/fehlende Signaturen mit `⚔`; außer Reichweite wird zum Controller gelaufen.

## Prototypen

`prod/prototype.js` aktiviert beim Laden `prototype.creep.checks.js` und `prototype.terminal.market.js`. Dadurch stehen Creeps u. a. `checkHarvest`, `checkInvasion` und `checkWorkroomPrioSpawn` zur Verfügung. Terminal-Objekte erhalten `sell()` und `buyPixel()`.

Die Marktlogik verkauft keine Energie, Power, Pixel oder X-/T3-Boosts. Für übrige Ressourcen ermittelt sie einen Fallback-Mindestpreis aus der Markthistorie (T1-Boosts und -Zwischenprodukte praktisch kostenlos), berücksichtigt Transaktionsenergie und führt maximal einen Deal aus. `buyPixel()` vergleicht den effektiven Preis mit 110 % des historischen Durchschnitts und kauft höchstens 50 Pixel.
