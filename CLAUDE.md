# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ziel und Aufteilung

Der Bot ist ein **Screeps-Bot in TypeScript**. Die Migration vom alten JavaScript-Bot ist abgeschlossen und der TS-Bot läuft im Spiel; ab jetzt wird er **schrittweise verbessert**.

- `tsBot/` — der Bot: `src/` plus Build (esbuild), Upload (Screeps-API) und lokaler Server. Hier findet die Arbeit statt.
- `tsProd/main.js` — Buildergebnis: der komplette Bot als ein einzelnes Modul. Das ist die `main`, die im Spiel läuft. Generiert, aber **absichtlich eingecheckt**, weil das Spiel über GitHub synct — nie manuell editieren, immer per `pnpm build` erzeugen und mitcommitten.
- `prod/` — der alte JavaScript-Bot. **Nur noch Historie**: nichts muss damit übereinstimmen. Zum Nachschauen, wie etwas ursprünglich gedacht war.
- `docs/` — deutsche Wissensdatenbank zum Verhalten des Bots. Schnellster Einstieg in die Spiellogik; vor dem Reverse-Engineering einer Rolle oder eines Controllers zuerst dort lesen. `docs/aenderungen.md` ist das Änderungsprotokoll, `docs/knowledge/` die Screeps-Wissensbasis (siehe unten).
- `.sync` gehört zum GitHub-Sync des Spiels und muss im Repo bleiben, obwohl kein Code im Repo sie liest. Nicht löschen, nicht in `.gitignore` aufnehmen. Gleiches gilt für `tsProd/main.js` — das ist die Datei, die das Spiel zieht.

Sprachkonvention: Kommentare, Logausgaben, Doku und viele Identifier bzw. Memory-Schlüssel sind deutsch (`notfall`, `aktivPrioSpawn`, `wally`, `debitor`, `reparier`). Neuen Code und neue Doku ebenfalls deutsch halten.

## Arbeitsweise: Aufteilen auf Subagenten

Verbindlich für jede nicht triviale Aufgabe in diesem Repository:

- **Opus plant und prüft ab.** Der Hauptagent (Opus) zerlegt die Aufgabe, definiert für jeden Teil ein hartes, maschinell prüfbares Abnahmekriterium, und macht am Ende den abschließenden Check der Ergebnisse — er glaubt den Meldungen der Subagenten nicht, sondern verifiziert selbst (Typecheck, Build, Vergleichsskripte, Diff).
- **Subagenten führen aus.** Aufgeteilt wird auf beliebig viele parallele Subagenten, jeder mit genau einem klar abgegrenzten Arbeitspaket (in der Regel: genau eine Datei).
- **Modellwahl nach Aufwand:** `haiku` für mechanische Kleinarbeit (Umbenennen, Formatierung, stumpfes Übertragen kleiner Dateien), `sonnet` für alles, was Verständnis der Spiellogik braucht (Modulmigration, Rollenlogik, Controller). Opus wird nicht an Subagenten vergeben.
- **Konfliktfreiheit erzwingen:** Jedem Subagenten explizit verbieten, gemeinsam genutzte Dateien anzufassen (`main.ts`, `globals.ts`, `config.ts`, `roles/index.ts`, `types/screeps.d.ts`, `git`, `pnpm build`). Verdrahtung, Löschungen und Commits macht ausschließlich der Hauptagent.
- **Subagenten auf die Wissensbasis verweisen:** Wer eine Rolle, Bewegung, Spawn-Profile oder Marktlogik anfasst, bekommt im Auftrag die passende Datei aus `docs/knowledge/` genannt (Index: `docs/knowledge/README.md`) — sonst wird geraten statt nachgelesen.
- Parallele Läufe von `pnpm exec tsc --noEmit` zeigen auch Fehler aus den Dateien anderer Subagenten. Jeder Subagent bekommt die Anweisung, nur Fehler mit seinem eigenen Dateipfad zu beachten.
- Für die Durchführung ist der Skill **`superpowers:subagent-driven-development`** zu benutzen (Aufgaben aus dem Plan einzeln an Subagenten geben, Ergebnis jeweils prüfen, bevor der nächste Schritt startet). Plan und Spezifikation entstehen davor mit `superpowers:brainstorming` bzw. `superpowers:writing-plans`; die Abnahme läuft über `superpowers:verification-before-completion`.

## Befehle (alle in `tsBot/`)

```bash
pnpm install                    # nach dem Klonen einmal; node_modules ist nicht versioniert
pnpm build                      # build.ts: esbuild src/main.ts -> ../tsProd/main.js (cjs, target node10)
pnpm upload [local|main|ptr]    # lädt jede .js aus ../tsProd zu einem Server aus .screeps.json
pnpm push / push:local / push:ptr
pnpm watch / watch:local / watch:ptr   # Rebuild + Auto-Upload bei Änderungen
pnpm exec tsc --noEmit          # Typecheck (tsconfig hat kein noEmit/outDir; immer --noEmit übergeben)
cd server && docker-compose up -d      # lokaler Privatserver (braucht server/.env)
```

Es gibt keine Tests und keinen Linter. Verifikation = `pnpm exec tsc --noEmit` plus `pnpm build`, endgültig ein Lauf auf dem lokalen Docker-Server oder PTR (`push:local` / `push:ptr`). Der Typecheck ist fehlerfrei und deckt den gesamten `src/`-Baum ab; es gibt kein `@ts-nocheck` mehr.

Da das Spiel per GitHub synct, gehört zu jeder Codeänderung ein `pnpm build`, damit `tsProd/main.js` zum Stand von `src/` passt. Der Upload per `pnpm push` ist der alternative Weg (Screeps-API) und für den lokalen Server bzw. PTR gedacht.

Die erste Zeile von `tsProd/main.js` ist ein Build-Stempel (`// Build: JJJJ-MM-TT HH:MM:SS ±HH:MM`, lokale Zeit), geschrieben von `build-common.ts::stampBuild()` nach jedem Build — auch bei jedem Rebuild im Watch-Modus, und dort vor dem Upload. Damit ist im Spiel erkennbar, welcher Stand läuft. Nebenwirkung: **jeder** Build erzeugt einen Diff in `tsProd/main.js`, auch wenn sich am Code nichts geändert hat. Die gemeinsamen esbuild-Optionen stehen in `build-common.ts`; wer Buildparameter ändert, ändert sie dort und nicht in `build.ts`/`builder.ts`.

Die Serverziele stehen in `.screeps.json` (`local` / `main` / `ptr`, `defaultServer` ist `local`); Zugangsdaten sind `${VAR}`-Platzhalter aus `.env` (`SCREEPS_TOKEN`, `SCREEPS_PTR_TOKEN`, `SCREEPS_LOCAL_USERNAME/PASSWORD`). Achtung: `pnpm upload` ohne Argument nimmt `main` (die echte MMO-Welt), nicht `defaultServer` — Ziel immer explizit angeben.

## Aufbau von `tsBot/src/` (zuerst verstehen)

Die Migration ist abgeschlossen: kein `src/legacy/`, kein `@ts-nocheck`, kein `require` mehr. Jedes Modul hat sein Gegenstück in `prod/`:

| TypeScript | prod |
| --- | --- |
| `main.ts` | `main.js` |
| `config.ts` (Seiteneffekt, füllt `global.*`) | `config.js` |
| `globals.ts` (typisierter `bot`-Handle, neu) | – |
| `controller/{memory,timing,spawn,rebuild,defence}.ts` | `controller.*.js` |
| `creep/{base,goto,transport}.ts` | `creep.base*.js` |
| `roles/{miner,debitor,…}.ts` + `roles/index.ts` | `creep.<rolle>.js` + `creep.jobs.js` |
| `prototypes/{creep-checks,terminal-market}.ts` | `prototype.*.js` |

`prod/profiler.js` und `prod/prototype.creep.override.js` wurden nicht übernommen — beide sind schon in `prod/` inaktiv.

Konventionen, die beim Weiterarbeiten gelten:

- **Der TypeScript-Bot ist die Wahrheit, `prod/` ist Historie.** Der Code muss nicht mehr mit dem alten JavaScript-Bot übereinstimmen; `prod/` dient nur noch zum Nachschauen, wie etwas ursprünglich gedacht war. Der Bot wird ab jetzt schrittweise verbessert.
- **Jede Verhaltensänderung gehört nach `docs/aenderungen.md`** — eine Zeile: was, warum, erwartete Wirkung. Betrifft die Änderung eine Rolle oder einen Controller, ist zusätzlich die passende Seite in `docs/` (`rollen.md`, `controller-und-automatik.md`, `creep-grundbausteine.md`, `konfiguration-und-memory.md`) mitzupflegen.
- **Kleine Schritte.** Der Bot läuft live und synct über GitHub — eine Änderung pro Commit, damit sich ein Rückschritt eindeutig zuordnen lässt.
- **`bot` statt `global`**: `import { bot } from "../globals"` liefert einen typisierten Handle auf dasselbe Objekt wie `global`. Nötig, weil `global.const` nicht als globale Variable deklarierbar ist (reserviertes Wort). Die Config-Typen (`RoomConfig`, `PrioConfig`, …) stehen dort.
- `src/types/screeps.d.ts` enthält die Ambient-Deklarationen: Prototyp-Erweiterungen (`Creep.checkHarvest`, `StructureTerminal.sell/buy/buyPixel`), `Memory.init`/`Memory.terminals`, Index-Signaturen auf `CreepMemory`/`RoomMemory` (deshalb kompilieren untypisierte Memory-Schlüssel) und `const _: any` für das im Screeps-Runtime globale lodash.
- tsconfig ist `strict` **plus `noUncheckedIndexedAccess`**: Index-Zugriffe sind `T | undefined`. Das wird mit `!` bzw. `as` bedient, **nicht** mit zusätzlichen `if`-Abfragen — esbuild entfernt `!`/`as`, ein neuer Guard würde dagegen das Verhalten ändern.
- Für `find`-Filter- und `sort`-Callbacks ist `(x: any)` bewusst erlaubt; sie greifen strukturübergreifend auf `store` zu.
- Der Code trägt noch die Handschrift des alten Bots: `var`, `==`, lange verschachtelte Bedingungen, gelegentlich toter Code. Beim Aufräumen einer Stelle, an der man ohnehin arbeitet, gern mitmodernisieren — aber nicht in derselben Änderung wie einen Verhaltensfix, sonst ist im Zweifelsfall nicht mehr trennbar, was den Unterschied verursacht hat.

## Wissensbasis `docs/knowledge/`

Zusammenfassungen der offiziellen Screeps-Doku und von Community-Wissen (CPU, Pathfinding, Energiewirtschaft, RCL-Tabellen, Kampf, Markt, Boosts, Spielphasen). **Vor jeder inhaltlichen Änderung an Rollen, Bewegung, Spawn-Profilen, Reparatur- oder Marktlogik die passende Datei lesen** — der Index dazu ist `docs/knowledge/README.md`, er nennt pro Fragestellung genau eine Datei. Nicht den ganzen Ordner lesen.

Besonders nützlich:

- `docs/knowledge/project-usage.md` — Checklisten, was man vor Änderungen an Rollen, Bewegung, Reparaturen und Ressourcenaufnahme prüfen sollte, bezogen auf dieses Repository.
- `docs/knowledge/quick-reference/constants.md` — exakte Werte und Formeln statt geschätzter Zahlen.
- `docs/knowledge/efficiency/energy-economy.md` — Körperprofile und Anzahl von Minern/Haulern/Upgradern belastbar dimensionieren.
- `docs/knowledge/efficiency/cpu-pathfinding.md` — bevor am Pfad-Caching in `creep/goto.ts` gedreht wird.

Zahlenwerte im Code (Schwellen, Profile, Intervalle) gegen diese Dateien abgleichen, statt sie zu raten. Widerspricht die Wissensbasis dem Code, gilt die offizielle API-Doku — Links stehen im Index.

## Laufzeitstruktur (gilt für beide Bots)

Pro Tick in `loop()`: Raum-Visuals zeichnen bzw. Raum-Memory bei Bedarf neu initialisieren → `Memory.creeps` bereinigen (Creeps ohne Rolle suizidieren) → jeden fertigen Creep an `jobs[creep.memory.role].doJob(creep)` geben → `controller.timing.controll()`. Fehler werden mit Rollennamen geloggt und weitergeworfen; eine defekte Rolle bricht den Tick ab.

`controller/timing.ts` ist der Scheduler: Towersteuerung und ein Terminal im Round-Robin jeden Tick, dann `% 3` Pixelgenerierung, `% 5` Spawncontroller, `% 7` Verteidigungsscan, `% 11` Statuslog und eine Tagessequenz (28 800 Ticks), die Memory-Cleanup, Wall-/Container-/Tower-/Terminal-Suche und Straßenwiederaufbau auf aufeinanderfolgende Ticks verteilt.

Zwei Konfigurationsebenen, die leicht verwechselt werden:

- **Statische Konfiguration = `global.*`**, gesetzt von `prod/config.js` (JS-Bot) und `tsBot/src/config.ts` (TS-Bot). `global.room` ist die maßgebliche Liste der verwalteten Räume und steuert Spawning, Rollenverteilung und Limits (`spawnRoom`, `sendMiner`/`sendDebitor`/…, Quellen- und Link-IDs, `maxbuilder`, `maxwallRepairer`, `claim`, `saveRoads`). Dazu `global.prio.build/repair/hits` (kleinerer Wert = höhere Priorität; gemeinsam genutzt von Builder, Repairer und Towern), `global.minSalePrice`, `global.maxOrderPrice`, `global.transfer` sowie die Helfer `global.log`/`global.logWorkroom`. Räume oder Limits für den TS-Bot ändern heißt: `src/config.ts` editieren. Das Modul wirkt nur über Seiteneffekte und wird deshalb als **erster** Import in `main.ts` geladen — diese Reihenfolge nicht verändern.
- **Dynamischer Zustand = `Memory`**, pro Raum von `controller/memory.ts::init()` angelegt und über `Memory.init` gegen Mehrfachinitialisierung geschützt. Die gecachten ID-Listen (`wally`, `container`, `tower`, `roads`, `Memory.terminals`) füllen nur die Tagesjobs — nach frischem Memory bleiben diese Funktionen untätig, bis der Tagestick läuft.

Rollen sind in `roles/index.ts` registriert (`debitor`, `transfer`, `miner`, `claimer`, `builder`, `repairer`, `upgrader`, `extupgrader`, `defender`, `wally`); jede exportiert `doJob(creep)` und `spawn(spawn, workroom)`. Die Property-Reihenfolge dieser Tabelle *ist* die Spawn-Priorität, die `controller/spawn.ts` verwendet — nicht umsortieren, und die Schlüssel nicht umbenennen (sie stehen im laufenden Spiel im Creep-Memory). Gemeinsames Creep-Verhalten liegt in `creep/base.ts` (+ `goto.ts`, `transport.ts`): das Flag `memory.harvest` ist der Zustandsautomat Beschaffen/Abliefern, umgeschaltet von `checkHarvest()`; `memory.fromId` verhindert das Zurückliefern in die eben genutzte Quelle; `moveByMemory` cacht einen serialisierten Pfad in `memory.path`/`memory.pathTarget` — deshalb löscht Rollencode diese Schlüssel bei jedem Zielwechsel.

Details zu einzelnen Rollen und Controllern (Spawnbedingungen, Körperprofile, Prioritäten, Marktregeln) stehen in `docs/rollen.md`, `docs/controller-und-automatik.md`, `docs/creep-grundbausteine.md` und `docs/konfiguration-und-memory.md` — dort nachlesen statt neu herleiten, und bei Verhaltensänderungen mitpflegen.
