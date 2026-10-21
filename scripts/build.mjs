// Builds every client into dist/ (default client at the root, the others in dist/<id>/).
//   node scripts/build.mjs                       all clients
//   node scripts/build.mjs --only <id>           one client, into dist/<id>/
//   node scripts/build.mjs --only <id> --as-root one client as the whole site (for its own domain)
import { cpSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { ROOT, loadAllClients, loadClient, ClientError, checkId } from "./lib/client.mjs";
import { renderTemplate } from "./lib/brand.mjs";
import { generateClientFiles } from "./lib/generate.mjs";
import { writePngIcons, ICON_FILES } from "./lib/icons.mjs";

const DIST = join(ROOT, "dist");

function parseArgs(argv) {
  const o = { only: null, asRoot: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--only") o.only = argv[++i];
    else if (argv[i] === "--as-root") o.asRoot = true;
    else throw new ClientError(`Unknown option "${argv[i]}". Usage: node scripts/build.mjs [--only <id> [--as-root]]`);
  }
  if (o.only === undefined || o.only === null) { if (argv.includes("--only")) throw new ClientError("--only needs a client id."); }
  if (o.asRoot && !o.only) throw new ClientError("--as-root needs --only <id>.");
  return o;
}

// Source files copied into every client tree. Generated or per-client files are excluded.
const SKIP_ASSETS = new Set(["logo.svg", "favicon.svg", "kyri-logo-original.png", ...ICON_FILES]);
const copyFilter = (src) => !(basename(join(src, "..")) === "assets" && SKIP_ASSETS.has(basename(src)));

async function buildClient(client, dest, { skip }) {
  mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(ROOT).filter((n) => n.endsWith(".html"))) {
    writeFileSync(join(dest, f), renderTemplate(readFileSync(join(ROOT, f), "utf8"), client, `${f} (client ${client.id})`));
  }
  cpSync(join(ROOT, "css"), join(dest, "css"), { recursive: true });
  cpSync(join(ROOT, "js"), join(dest, "js"), { recursive: true });
  cpSync(join(ROOT, "assets"), join(dest, "assets"), { recursive: true, filter: copyFilter });
  cpSync(join(ROOT, "sw.js"), join(dest, "sw.js"));
  generateClientFiles(client, dest, { skip });
  const icons = await writePngIcons(client, join(dest, "assets"));
  return icons;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let plan; // [{ client, dest, skip }]
  if (opts.only) {
    checkId(opts.only);
    const client = loadClient(opts.only);
    plan = [{ client, dest: opts.asRoot ? DIST : join(DIST, client.id), skip: [] }];
  } else {
    const clients = loadAllClients();
    const def = clients.find((c) => c.isDefault);
    plan = clients.map((client) => client === def
      ? { client, dest: DIST, skip: clients.filter((c) => c !== def).map((c) => c.id) }
      : { client, dest: join(DIST, client.id), skip: [] });
    // the root tree is copied first so nothing in a client folder gets overwritten
    plan.sort((a, b) => (a.dest === DIST ? -1 : b.dest === DIST ? 1 : 0));
  }
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, ".nojekyll"), "");
  for (const { client, dest, skip } of plan) {
    const icons = await buildClient(client, dest, { skip });
    const where = dest === DIST ? "dist/" : `dist/${client.id}/`;
    console.log(`built ${client.id.padEnd(14)} -> ${where}  (icons: ${icons.generated.length} generated, ${icons.overridden.length} from clients/${client.id}/icons)`);
  }
  for (const { dest } of plan) if (!existsSync(join(dest, "index.html"))) throw new ClientError(`${dest}/index.html was not produced.`);
  console.log("Build complete. Preview with: npm run preview");
}

main().catch((e) => {
  if (e instanceof ClientError) console.error(`Build failed: ${e.message}`);
  else console.error(`Build failed: ${e.message}`);
  process.exit(1);
});
