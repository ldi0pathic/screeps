# Änderungen am TypeScript-Bot

Der TypeScript-Bot in `tsBot/src/` wurde zunächst wortgleich aus dem alten
JavaScript-Bot in `prod/` übertragen — inklusive der dortigen Fehler. Direkt
danach wurden die hier aufgelisteten Fehler behoben.

`prod/` ist ab jetzt **nur noch Historie**: nichts muss mehr damit
übereinstimmen, und Verbesserungen am TypeScript-Bot brauchen keine
Rechtfertigung gegenüber dem alten Stand. Der Ordner bleibt liegen, um bei
Fragen nachschauen zu können, wie etwas ursprünglich gedacht war.

Diese Datei ist das Änderungsprotokoll: Jede Änderung, die das Spielverhalten
betrifft, gehört hier mit einer Zeile hinein — was, warum, und welche Wirkung
erwartet wird. Das ersetzt die Detektivarbeit, wenn sich der Bot nach einem
Deployment anders verhält als gedacht.

## Nach der Migration behobene Fehler

| Modul / Funktion | prod-Stelle | Was war falsch | Änderung |
| --- | --- | --- | --- |
| `creep/base.ts` · `upgradeController` | `creep.base.js:401` | `if (!controller && !controller.my)` — bei einem Raum **ohne** Controller ist der linke Teil wahr, der rechte greift dann auf `undefined.my` zu und wirft einen `TypeError`. Der Guard schützte also genau den Fall nicht, für den er gedacht war. | `&&` → `||` |
| `roles/debitor.ts` · `doJob` | `creep.debitor.js:122` | `creep.memory.mineral = resource[0]` speicherte nur das **erste Zeichen** des Ressourcennamens (`"X"` statt `"XKH2O"`). Der nachfolgende Transport nutzte dagegen den vollen Namen. | `resource[0]` → `resource` |
| `roles/claimer.ts` · `spawn` | `creep.claimer.js:66` | Operator-Vorrang: bei einem Controller ohne Signatur wurde `room.controller.sign.username` trotzdem ausgewertet → `TypeError`. Zusätzlich verglich `spawn.owner != ''` ein Objekt mit einem String und war immer wahr. | `sign` einmal vorab geprüft, toter Vergleich entfernt |
| `roles/claimer.ts` · `doJob` | `creep.claimer.js:29` | Der Claim-Zweig schrieb `Memory.rooms[creep.room.name].claimed`, der Reservierungs-Zweig `Memory.rooms[workroom].claimed` — zwei Schlüssel für denselben Sachverhalt. | einheitlich `workroom` |
| `roles/repairer.ts` · `spawn` | `creep.reparier.js:150` | `Game.rooms[workroom].find(...)` ohne Sichtprüfung. Ohne Sicht im Arbeitsraum wirft das eine Exception im Spawncontroller und bricht den **kompletten** Spawn-Durchlauf des Ticks ab. | Guard: ohne Sicht `return false` |
| `roles/upgrader.ts` · `spawn` | `creep.upgrader.js:85` | `spawn.room.storage.store` ohne Existenzprüfung. | Storage-Prüfung vorangestellt |
| `roles/defender.ts` · `_defend` | `creep.defender.js:113-120` | Die Auswahl des Abriss-Raums prüfte `destroyDone` des **aktuellen** Workrooms statt des Kandidatenraums und hatte kein `break` — dadurch gewann immer der letzte konfigurierte `destroy`-Raum. Mit zwei solchen Räumen (E58N4, E58N5) wurde E58N4 nie abgearbeitet. | Kandidatenraum prüfen, erster offener Raum gewinnt, `break` |
| `roles/builder.ts` · `doJob` | `creep.builder.js:29` | `harvestSpawnLink(creep, creep.memory.mineral)` war wirkungslos: Builder erhalten beim Spawnen kein `mineral` im Memory, `store[undefined]` ist immer `undefined`. | `RESOURCE_ENERGY` — Builder nutzen den Spawn-Link jetzt tatsächlich |

## Entfernter toter Code

| Modul | prod-Stelle | Begründung |
| --- | --- | --- |
| `prototypes/creep-checks.ts` · `checkSource` | `prototype.creep.checks.js:129` | Leerer Rumpf, wird nirgends aufgerufen. |
| `prototypes/creep-checks.ts` · `checkSavedAction` | `prototype.creep.checks.js:134` | Greift auf `this.creep` zu, das an einem `Creep` nicht existiert — der Aufruf würde werfen. Wird nirgends aufgerufen. |

Die zugehörigen Deklarationen in `src/types/screeps.d.ts` sind ebenfalls
entfallen.

## Irreführend, aber verhaltensneutral bereinigt

`creepBase.harvest()` hat keinen Rückgabewert. In `builder`, `repairer` und
`wally` stand der Aufruf trotzdem in einer `if`-Bedingung
(`if(creepBase.harvest(creep)) return;`), die deshalb nie zutraf. Der Aufruf
steht jetzt für sich; das Laufzeitverhalten ist unverändert.

Wichtig für den Builder: weil die Bedingung nie zutraf, läuft der Code **nach**
dem Aufruf immer — der Umschalter auf „arbeiten“ bei mehr als halb gefülltem
Inventar und der Spawn-Link-Zugriff. Das bleibt so.

## Offen, weil bewusst zurückgestellt

- `roles/upgrader.ts` · `_getProfil`: bei RCL > 7 und sehr kleinem
  `energyCapacityAvailable` entstünden 0 `WORK`-Teile. Praktisch unerreichbar,
  weil RCL 8 eine hohe Energiekapazität voraussetzt.
- `roles/miner.ts`: `targetLinks[[Math.floor(...)]]` indiziert mit einem Array
  statt einer Zahl. Funktioniert wegen der String-Umwandlung des Schlüssels
  korrekt.
- `controller/memory.ts` · `init`: `Memory.init = true` wird innerhalb der
  Schleife über `global.room` gesetzt. Bei leerer Raumkonfiguration würde die
  Initialisierung jeden Tick erneut laufen — `global.room` ist nie leer.
- Konfigurationsfelder `walls` und `debitorProSource` werden von keinem Modul
  gelesen. Sie bleiben als Dokumentation der Absicht stehen.
