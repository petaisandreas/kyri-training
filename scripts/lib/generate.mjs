// Writes the files that depend on a client's config into a directory that already holds the app source
// (the repo root for `sync-default`, or a copy of it under dist/ for the build).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { clientJs, clientCss, manifests, swConfigLine } from "./client.mjs";
import { writeSvgAssets } from "./icons.mjs";

const manifestJson = (m) =>
  JSON.stringify(m, null, 2).replace(/\{\n\s+("src": "[^"]*"),\n\s+("sizes": "[^"]*"),\n\s+("type": "[^"]*"),\n\s+("purpose": "[^"]*")\n\s+\}/g, "{ $1, $2, $3, $4 }") + "\n";

/** Replaces the first line of sw.js (the build:sw-config line) and keeps the rest and the line ending. */
export function patchSwConfig(file, line) {
  const src = readFileSync(file, "utf8");
  const m = /^(.*?)(\r?\n|$)/s.exec(src);
  if (!m[1].startsWith("const CFG = ") || !m[1].endsWith("// build:sw-config")) throw new Error(`${file}: first line must be the "// build:sw-config" line`);
  writeFileSync(file, line + m[2] + src.slice(m[0].length));
}

export function generateClientFiles(client, dir, { skip = [] } = {}) {
  mkdirSync(join(dir, "js"), { recursive: true });
  mkdirSync(join(dir, "css"), { recursive: true });
  writeFileSync(join(dir, "js", "client.js"), clientJs(client));
  writeFileSync(join(dir, "css", "client.css"), clientCss(client));
  const m = manifests(client);
  writeFileSync(join(dir, "manifest.webmanifest"), manifestJson(m.athlete));
  writeFileSync(join(dir, "coach.webmanifest"), manifestJson(m.coach));
  writeSvgAssets(client, join(dir, "assets"));
  if (existsSync(join(dir, "sw.js"))) patchSwConfig(join(dir, "sw.js"), swConfigLine(client, skip));
}
