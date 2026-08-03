// build.ts - Einmaliger Build (ersetzt den bisherigen esbuild-CLI-Aufruf)
import * as esbuild from "esbuild";
import { basename } from "path";
import { ESBUILD_OPTIONS, stampBuild, backupMainJs } from "./build-common.ts";

async function build() {
  try {
    const backupPath = backupMainJs();
    if (backupPath) {
      console.log(`🗄 Vorherige main.js gesichert als ${basename(backupPath)}`);
    }

    const result = await esbuild.build(ESBUILD_OPTIONS);

    if (result.errors.length > 0) {
      console.error("❌ Build failed", result.errors);
      process.exit(1);
    }

    const timestamp = stampBuild();
    console.log(`✅ Build succeeded (${timestamp})`);
  } catch (err) {
    console.error("Error building:", err);
    process.exit(1);
  }
}

build();
