import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

await build({
  entryPoints: {
    content: "src/content/index.ts",
    background: "src/background/index.ts"
  },
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  logLevel: "info"
});

await copyFile(
  "public/manifest.json",
  "dist/manifest.json"
);

console.log("Extension built successfully!");