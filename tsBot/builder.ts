// builder.ts - Updated to support server selection
import * as esbuild from "esbuild";
import { spawn } from "child_process";
import { ESBUILD_OPTIONS, TSPROD_DIR, stampBuild } from "./build-common.ts";

async function startWatch() {
  const serverName = process.argv[2] || "main"; // default to main server

  const ctx = await esbuild.context({
    ...ESBUILD_OPTIONS,
    plugins: [
      {
        name: "rebuild-notifier",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length > 0) {
              console.error("❌ Build failed", result.errors);
            } else {
              // Zuerst den Zeitstempel schreiben, danach erst hochladen -
              // der Upload liest main.js von der Platte.
              const timestamp = stampBuild();
              console.log(`✅ Build succeeded (${timestamp}), uploading...`);
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
