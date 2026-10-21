// Brand assets for one client: logo.svg, favicon.svg and the PNG app icons (sharp renders SVG -> PNG).
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { sanitizeLogo, logoSvg, tileSvg } from "./svg.mjs";

export const ICON_FILES = ["icon-192.png", "icon-512.png", "icon-apple.png", "coach-icon-192.png", "coach-icon-512.png", "coach-icon-apple.png"];
const SIZES = { "192": 192, "512": 512, apple: 180 };
const MASKABLE_PAD = 0.18; // keeps the mark inside the maskable safe zone

export function loadLogo(client) {
  return sanitizeLogo(readFileSync(join(client.dir, "logo.svg"), "utf8"), `clients/${client.id}/logo.svg`);
}

/** Writes assets/logo.svg + assets/favicon.svg (text only, no sharp needed). */
export function writeSvgAssets(client, assetsDir) {
  mkdirSync(assetsDir, { recursive: true });
  const logo = loadLogo(client);
  writeFileSync(join(assetsDir, "logo.svg"), logoSvg(logo));
  writeFileSync(join(assetsDir, "favicon.svg"), tileSvg(logo, client.theme.background, client.theme.dark.accent, { pad: 0.12, radius: 18 }).replace(/ width="100" height="100"/, "") + "\n");
}

/** Writes the six PNG icons. clients/<id>/icons/<name>.png overrides win over generated ones. */
export async function writePngIcons(client, assetsDir) {
  mkdirSync(assetsDir, { recursive: true });
  const logo = loadLogo(client);
  let sharp;
  const needsRender = ICON_FILES.some((f) => !existsSync(join(client.dir, "icons", f)));
  if (needsRender) {
    try { sharp = (await import("sharp")).default; }
    catch { throw new Error("The 'sharp' package is not installed. Run `npm install` first."); }
  }
  const made = { generated: [], overridden: [] };
  for (const kind of ["athlete", "coach"]) {
    const { bg, fg } = client.theme.icons[kind];
    const prefix = kind === "coach" ? "coach-" : "";
    for (const [key, px] of Object.entries(SIZES)) {
      const name = `${prefix}icon-${key}.png`;
      const override = join(client.dir, "icons", name);
      if (existsSync(override)) { copyFileSync(override, join(assetsDir, name)); made.overridden.push(name); continue; }
      const svg = tileSvg(logo, bg, fg, { pad: MASKABLE_PAD, size: px });
      await sharp(Buffer.from(svg), { density: 300 }).resize(px, px).png().toFile(join(assetsDir, name));
      made.generated.push(name);
    }
  }
  return made;
}
