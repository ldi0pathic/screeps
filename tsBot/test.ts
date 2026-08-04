// test.ts - Unittests: jede tests/*.test.ts mit esbuild bündeln, dann `node --test`.
//
// Warum der Umweg über esbuild: der Bot ist TypeScript und läuft gegen globale
// Screeps-Objekte. Gebündelt zu CommonJS braucht der Testlauf keinen Loader und
// keine weitere Abhängigkeit — esbuild liegt für den Build ohnehin schon da.
// Nebeneffekt, der hier erwünscht ist: jede Testdatei bekommt ihre eigene Kopie
// der Botmodule, ein Test kann also keinen Modulzustand in den nächsten tragen.
import * as esbuild from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const TEST_DIR = resolve("tests");
const OUT_DIR = resolve(".test-build");

async function test() {
  const entryPoints = readdirSync(TEST_DIR)
    .filter(name => name.endsWith(".test.ts"))
    .map(name => join(TEST_DIR, name));

  if (entryPoints.length === 0) {
    console.error("❌ Keine Testdateien in tests/ gefunden");
    process.exit(1);
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const result = await esbuild.build({
    entryPoints,
    outdir: OUT_DIR,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    outExtension: { ".js": ".cjs" },
    sourcemap: "inline",
    logLevel: "warning",
  });

  if (result.errors.length > 0) {
    console.error("❌ Tests lassen sich nicht bündeln", result.errors);
    process.exit(1);
  }

  const bundles = readdirSync(OUT_DIR)
    .filter(name => name.endsWith(".cjs"))
    .map(name => join(OUT_DIR, name));

  const run = spawnSync(process.execPath, ["--enable-source-maps", "--test", ...bundles], {
    stdio: "inherit",
  });

  process.exit(run.status ?? 1);
}

test();
