// builder.ts - Updated to support server selection
import * as esbuild from "esbuild";
import { spawn } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// `tsBot` und der Output-Ordner liegen beide direkt im Repository-Root.
// Der absolute Pfad macht den Watcher unabhängig vom aktuellen Arbeitsordner.
const TSPROD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "tsProd");

async function startWatch() {
  const serverName = process.argv[2] || "main"; // default to main server

  const ctx = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outdir: TSPROD_DIR,
    format: "cjs",
    platform: "node",
    sourcemap: false,
    target: "node10",
    plugins: [
      {
        name: "rebuild-notifier",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length > 0) {
              console.error("❌ Build failed", result.errors);
            } else {
              console.log("✅ Build succeeded, uploading...");
              runUpload(serverName);
            }
          });
        },
      },
    ],
  });

  await ctx.watch();
  console.log(
    `👀 Watching for changes in tsBot/src... (writing to '${TSPROD_DIR}', uploading to '${serverName}')`
  );
}

function runUpload(serverName: string) {
  const child = spawn("npm", ["run", "upload", serverName], {
    stdio: "inherit",
    shell: true,
  });
  child.on("close", (code: number) => {
    if (code !== 0) {
      console.error("⚠ Upload failed with code", code);
    }
  });
}

startWatch().catch((e) => {
  console.error(e);
  process.exit(1);
});
