import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

await build({
  entryPoints: {
    content: "src/content/index.ts",
    background: "src/background/index.ts",
    options: "src/options/index.ts"
  },
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  logLevel: "info"
});

await Promise.all([
  copyFile("public/manifest.json", "dist/manifest.json"),
  copyFile("public/options.html", "dist/options.html")
]);

console.log("Extension built successfully!");
