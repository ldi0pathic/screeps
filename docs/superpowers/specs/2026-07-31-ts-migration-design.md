# Design: Migration von `src/legacy/` nach TypeScript

Datum: 2026-07-31
Status: umgesetzt

## Ergebnis

`tsBot/src/legacy/` ist gelöscht, `src/` enthält 24 TypeScript-Module ohne
`@ts-nocheck` und ohne `require`. Typecheck (`pnpm exec tsc --noEmit`)
fehlerfrei, Build läuft, `tsProd/main.js` neu erzeugt (97 KB statt 118 KB, weil
die CommonJS-Wrapper und der tote Code entfallen).

Belegt: **105 Funktionen in 16 Modulen** stimmen nach Normalisierung
zeichengenau mit ihrem `prod/`-Original überein (Config, Terminal-Markt,
Creep-Checks, `creep/{base,goto,transport}`, zehn Rollen, `controller/defence`).
Zusätzlich geprüft: die statische Konfiguration erzeugt in der Sandbox exakt
denselben Objektbaum wie vorher, die Rollentabelle hat dieselben zehn Schlüssel
in derselben Reihenfolge wie `prod/creep.jobs.js`, und alle Prototypen sind
installiert.

Bewusst akzeptierte Abweichungen:

1. Der Terminal-Markt wird jetzt tatsächlich installiert (`installTerminalMarket()`
   in `main.ts`). Vorher requirete `main.ts` die Factory ohne Aufruf, wodurch
   `controller/timing.ts` auf nicht vorhandene Methoden zugegriffen hätte,
   sobald `Memory.terminals` gefüllt ist. Damit verhält sich der TS-Bot wie
   `prod/`.
2. `controller/rebuild.ts` überspringt Räume ohne Controller, wo
   `prod/controller.rebuild.js` eine Ausnahme wirft. Bleibt so — den Crash
   absichtlich wiederherzustellen wäre unsinnig.
3. `controller/{memory,timing,spawn,rebuild}.ts` bleiben idiomatisch statt
   wortgleich (Stand der früheren Migrationsstufe). Sie wurden per Review gegen
   `prod/` geprüft: verhaltensgleich. Zwei latente Abweichungen in `memory.ts`
   (`maxwallRepairer`-Fallback, fehlendes `rooms`-Guard in `findAndSaveRoads`)
   wurden angeglichen.
4. `prod/profiler.js` und `prod/prototype.creep.override.js` wurden nicht
   übernommen (in `prod/` ebenfalls inaktiv).

## Ziel

`tsBot/src/legacy/` verschwindet vollständig. Der Bot besteht danach nur noch aus
echten TypeScript-Modulen ohne `@ts-nocheck`. Das Laufzeitverhalten bleibt
gleich; Referenz ist der JavaScript-Bot in `prod/`.

## Nicht-Ziele

Umbenennen von Memory-Schlüsseln oder deutschen Bezeichnern, Zusammenfassen
doppelter Rollenlogik, neue Features, Testinfrastruktur. Alles davon ist erst
nach abgeschlossener Migration sinnvoll.

## Zielstruktur (`tsBot/src/`)

```
main.ts                     Einstieg: Config laden, Prototypen installieren, loop()
config.ts                   ehem. legacy/config.cts – setzt global.* (Seiteneffekt)
types/screeps.d.ts          Ambient-Deklarationen + Config- und Memory-Typen
controller/                 memory · timing · spawn · rebuild · defence
creep/                      base · goto · transport
roles/                      index (Rollentabelle) · miner · debitor · transfer · claimer
                            builder · repairer · upgrader · extupgrader · defender · wally
prototypes/                 creep-checks · terminal-market
```

Die Rollenschlüssel (`debitor`, `transfer`, `miner`, `claimer`, `builder`,
`repairer`, `upgrader`, `extupgrader`, `defender`, `wally`) bleiben unverändert –
sie stehen als `creep.memory.role` im laufenden Spiel. Nur Dateinamen werden
aufgeräumt (`creep.reparier.cts` → `roles/repairer.ts`,
`creep.wallbuilder.cts` → `roles/wally.ts`).

## Konversionsrezept pro Modul

1. `module.exports = { a: function (x) {…} }` → `export function a(x) {…}`.
   Interne Aufrufe über `this._foo(…)` werden zu direkten Aufrufen `_foo(…)`.
   Das ist der einzige strukturelle Eingriff und nötig, weil die Module heute
   über `this` auf ihre Geschwistermethoden zugreifen.
2. `require('./x.cts')` → `import`; `@ts-nocheck` entfällt; die inline
   ersetzten lodash-Helfer (`isString`, `isFunction`) bleiben.
3. Typen ergänzen: Funktionssignaturen, Config-Interfaces, bekannte
   Memory-Felder. `CreepMemory`/`RoomMemory` behalten ihre Index-Signatur, damit
   untypisierte Memory-Zugriffe keinen Umbau erzwingen.
4. Steuerfluss, Reihenfolge der Bedingungen, Vergleichsoperatoren (`==` bleibt
   `==`), Say-Emojis und Memory-Schlüssel bleiben Zeile für Zeile identisch.
   `noUncheckedIndexedAccess` wird mit `!` oder lokalen Konstanten bedient,
   nicht mit zusätzlichen Guards, die einen Pfad überspringen könnten.

## Reihenfolge

Jeder Schritt endet mit fehlerfreiem `pnpm exec tsc --noEmit` und `pnpm build`.

1. **Toten Code löschen**: `legacy/main.cts`, die vier bereits migrierten
   Doppel `controller.memory/timing/spawn/rebuild.cts`, `prototype.cts`,
   `prototype.creep.checks.cts`, `prototype.creep.override.cts`,
   `profiler.cts`; dazu der leere Ordner `default/`. Erwarteter Bundle-Diff:
   leer. `.sync` bleibt im Repo.
2. **`config.ts`** samt Config-Typen; explizit als erster Import in `main.ts`.
3. **`prototypes/terminal-market.ts`** und `installTerminalMarket()` in
   `main.ts`.
4. **`creep/goto.ts`** → **`creep/transport.ts`** → **`creep/base.ts`**
   (Blätter zuerst).
5. **Die zehn Rollen** einzeln, klein nach groß: `claimer`, `extupgrader`,
   `upgrader`, `transfer`, `builder`, `repairer`, `wally`, `defender`,
   `debitor`, `miner`.
6. **`roles/index.ts`** als Rollentabelle. Die Property-Reihenfolge bleibt
   exakt erhalten, sie ist die Spawn-Priorität in `controller/spawn.ts`.
7. **`controller/defence.ts`**; danach die letzten `require("../legacy/…")` in
   `timing.ts`, `spawn.ts` und `main.ts` durch Imports ersetzen.
8. **Abschluss**: `docs/README.md` und `CLAUDE.md` aktualisieren, `pnpm build`,
   `tsProd/main.js` mitcommitten (das Spiel synct diese Datei über GitHub).

## Bewusste Abweichungen vom heutigen TS-Bot

Beide bringen den TS-Bot näher an `prod/`:

- Der Terminal-Markt wird installiert. Heute requiret `main.ts` die Factory
  ohne Aufruf, wodurch `terminal.sell()`/`buyPixel()` in
  `controller/timing.ts` auf nicht vorhandene Methoden zugreifen würden,
  sobald `Memory.terminals` gefüllt ist.
- `config.ts` wird explizit importiert statt als Seiteneffekt der
  Rollen-`require`s geladen.

## Verifikation

- Vor Beginn das aktuelle Bundle als Baseline nach `scratchpad/` sichern.
- Nach jedem Modul `pnpm build` und `diff` gegen den Vorherstand. Jeder Hunk
  muss sich als reine Umformung erklären lassen: ESM-Inlining statt
  `__commonJS`-Wrapper, `this.x()` → `x()`, geänderte Modulnamen in Kommentaren.
- Zusätzlich pro Modul ein Zeilenvergleich der neuen `.ts` gegen die Referenz
  in `prod/*.js`.
- `pnpm exec tsc --noEmit` bleibt durchgehend fehlerfrei.
- Kein Nachweis über einen Spiellauf: Es gibt keine Tests, und ein PTR-Lauf ist
  Sache des Betreibers.
