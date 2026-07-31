// build-common.ts - Gemeinsame Bausteine für build.ts und builder.ts
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync } from "fs";
import type { BuildOptions } from "esbuild";

// `tsBot` und der Output-Ordner liegen beide direkt im Repository-Root.
// Der absolute Pfad macht Build/Watch unabhängig vom aktuellen Arbeitsordner.
export const TSPROD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "tsProd");

// esbuild-Optionen, identisch für einmaligen Build und Watch-Modus.
export const ESBUILD_OPTIONS: BuildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outdir: TSPROD_DIR,
  format: "cjs",
  platform: "node",
  target: "node10",
  sourcemap: false,
};

// Liefert den aktuellen Zeitpunkt als lokale Zeit im Format
// "YYYY-MM-DD HH:MM:SS ±HH:MM" (kein UTC, keine ISO-Notation).
export function formatBuildTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  // getTimezoneOffset() liefert Minuten, die zu UTC addiert werden müssen (umgekehrtes Vorzeichen).
  const offsetMinutesTotal = -date.getTimezoneOffset();
  const offsetSign = offsetMinutesTotal >= 0 ? "+" : "-";
  const offsetAbs = Math.abs(offsetMinutesTotal);
  const offsetHours = pad(Math.floor(offsetAbs / 60));
  const offsetMinutes = pad(offsetAbs % 60);

  return `${datePart} ${timePart} ${offsetSign}${offsetHours}:${offsetMinutes}`;
}

// Schreibt eine Build-Kommentarzeile als erste Zeile in main.js.
// Eine eventuell vorhandene alte Kommentarzeile wird entfernt, damit sich
// die Stempel bei wiederholten Builds nicht stapeln.
export function stampBuild(): string {
  const mainJsPath = join(TSPROD_DIR, "main.js");
  const content = readFileSync(mainJsPath, "utf8");

  const lines = content.split("\n");
  if (lines[0]?.startsWith("// Build:")) {
    lines.shift();
  }

  const timestamp = formatBuildTimestamp();
  const stamped = [`// Build: ${timestamp}`, ...lines].join("\n");

  writeFileSync(mainJsPath, stamped, "utf8");
  return timestamp;
}
