// build-common.ts - Gemeinsame Bausteine für build.ts und builder.ts
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  statSync,
  readdirSync,
  unlinkSync,
  copyFileSync,
} from "fs";
import type { BuildOptions } from "esbuild";

// `tsBot` und der Output-Ordner liegen beide direkt im Repository-Root.
// Der absolute Pfad macht Build/Watch unabhängig vom aktuellen Arbeitsordner.
export const TSPROD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "tsProd");

// Ordner für die Sicherungskopien, Schwesterordner von `tsProd`.
export const TSPROD_BACKUP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "tsProd-backup");

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

// Anzahl der Sicherungen, die im Backup-Ordner aufbewahrt werden; ältere werden gelöscht.
const MAX_BACKUPS = 20;

// Wandelt einen Zeitstempel im Format von formatBuildTimestamp() in einen unter Windows
// gültigen Dateinamen-Bestandteil um: Doppelpunkte werden zu Bindestrichen, das
// Zeitzonen-Offset entfällt.
function toBackupSuffix(timestamp: string): string {
  return timestamp.slice(0, 19).replace(" ", "_").replace(/:/g, "-");
}

// Liest den Build-Stempel aus der ersten Zeile von main.js, falls vorhanden.
function readBuildStampSuffix(mainJsPath: string): string | null {
  try {
    const firstLine = readFileSync(mainJsPath, "utf8").split("\n")[0] ?? "";
    const prefix = "// Build: ";
    if (!firstLine.startsWith(prefix)) {
      return null;
    }
    return toBackupSuffix(firstLine.slice(prefix.length));
  } catch {
    return null;
  }
}

// Findet einen freien Dateinamen im Backup-Ordner; hängt bei einer Kollision
// einen Zähler an, statt eine bestehende Sicherung zu überschreiben.
function uniqueBackupPath(baseName: string): string {
  const dotIndex = baseName.lastIndexOf(".");
  const stem = baseName.slice(0, dotIndex);
  const ext = baseName.slice(dotIndex);

  let candidate = join(TSPROD_BACKUP_DIR, baseName);
  let counter = 1;
  while (existsSync(candidate)) {
    candidate = join(TSPROD_BACKUP_DIR, `${stem}-${counter}${ext}`);
    counter++;
  }
  return candidate;
}

// Behält nur die MAX_BACKUPS neuesten Sicherungen; der Dateiname ist durch das
// Format JJJJ-MM-TT_HH-MM-SS lexikografisch sortierbar = chronologisch.
function cleanupOldBackups(): void {
  const backupNamePattern = /^main-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(-mtime)?(-\d+)?\.js$/;
  const backupFiles = readdirSync(TSPROD_BACKUP_DIR)
    .filter((name) => backupNamePattern.test(name))
    .sort();

  const filesToDelete = backupFiles.slice(0, Math.max(0, backupFiles.length - MAX_BACKUPS));
  for (const name of filesToDelete) {
    unlinkSync(join(TSPROD_BACKUP_DIR, name));
  }
}

/**
 * Sichert die vorhandene `tsProd/main.js`, bevor ein Build sie überschreibt.
 * Liefert den Pfad der Sicherung oder `null`, wenn es nichts zu sichern gab.
 */
export function backupMainJs(): string | null {
  const mainJsPath = join(TSPROD_DIR, "main.js");
  if (!existsSync(mainJsPath)) {
    return null;
  }

  try {
    const stampSuffix = readBuildStampSuffix(mainJsPath);
    const suffix = stampSuffix ?? `${toBackupSuffix(formatBuildTimestamp(statSync(mainJsPath).mtime))}-mtime`;
    const backupName = `main-${suffix}.js`;

    if (!existsSync(TSPROD_BACKUP_DIR)) {
      mkdirSync(TSPROD_BACKUP_DIR, { recursive: true });
    }

    const backupPath = uniqueBackupPath(backupName);
    // Kopieren statt Verschieben: scheitert der Build nach dem Sichern, bliebe bei einem
    // Verschieben main.js verschwunden - der GitHub-Sync sähe dann eine fehlende Datei,
    // genau der Schaden, den das Backup eigentlich verhindern soll.
    copyFileSync(mainJsPath, backupPath);

    cleanupOldBackups();

    return backupPath;
  } catch (err) {
    console.error("⚠ Sicherung von main.js fehlgeschlagen:", err);
    return null;
  }
}
