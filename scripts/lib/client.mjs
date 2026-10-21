// Loads and validates clients/<id>/client.json. Dependency-free; every problem is reported with its path.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CLIENTS_DIR = join(ROOT, "clients");
export const ID_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;
export const RESERVED_IDS = new Set(["css", "js", "assets", "clients", "scripts", "dist", "node_modules", "views", "icons", "template", "github"]);

// Storage prefixes used by other apps on the same github.io origin; a client must never share them.
export const RESERVED_PREFIXES = new Set(["bjjgym"]);

export class ClientError extends Error {}

/** Throws ClientError when `id` is not usable as a client id (shape, reserved word). */
export function checkId(id) {
  if (typeof id !== "string" || !ID_RE.test(id)) throw new ClientError(`Invalid client id "${id}": use 2-31 characters, lower-case letters, digits and hyphens, starting with a letter or digit.`);
  if (RESERVED_IDS.has(id)) throw new ClientError(`Client id "${id}" is reserved (it would clash with a folder of the app). Reserved: ${[...RESERVED_IDS].join(", ")}.`);
}

const noCtl = /^[^\u0000-\u001f\u007f]*$/;
const str = (max) => (v) => typeof v !== "string" ? "must be a string" : v.length < 1 ? "must not be empty" : v.length > max ? `must be at most ${max} characters` : !noCtl.test(v) ? "must not contain control characters" : v !== v.trim() ? "must not start or end with spaces" : null;
const re = (rx, hint) => (v) => (typeof v === "string" && rx.test(v) ? null : `must ${hint}`);
const hex = re(/^#[0-9a-f]{6}$/i, "be a colour like #1a2b3c (6 hex digits)");
const bool = (v) => (typeof v === "boolean" ? null : "must be true or false");
const optional = (check) => Object.assign((v) => check(v), { optional: true });
const OPT = { __optional: true }; // marks an optional group of fields

const SPEC = {
  id: re(ID_RE, "match ^[a-z0-9][a-z0-9-]{1,30}$"),
  isDefault: bool,
  appName: str(24),
  coachAppName: optional(str(32)),
  businessName: str(60),
  coach: {
    name: str(60),
    short: str(30),
    initials: re(/^\p{L}{1,3}$/u, "be 1-3 letters"),
  },
  contact: {
    email: re(/^[^\s@<>"'`]{1,64}@[^\s@<>"'`]{1,190}\.[^\s@<>"'`.]{2,}$/, "be an email address"),
    instagram: re(/^[A-Za-z0-9._]{1,30}$/, "be an Instagram handle without @ (letters, digits, . and _, up to 30)"),
  },
  locale: {
    currency: re(/^[A-Z]{3}$/, "be an ISO 4217 code such as EUR or GBP"),
    numberLocale: (v) => {
      try { return typeof v === "string" && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(v) && Intl.getCanonicalLocales(v).length ? null : "must be a locale such as en-GB"; }
      catch { return "must be a locale such as en-GB"; }
    },
  },
  storagePrefix: re(/^[a-z0-9-]{1,31}$/, "match ^[a-z0-9-]+$ (up to 31 characters)"),
  paymentRefPrefix: re(/^[A-Za-z0-9]{1,8}$/, "be 1-8 ASCII letters or digits"),
  ranking: { prize: str(80) },
  seed: { location: str(40) },
  site: {
    title: str(100),
    description: str(320),
    athleteManifestDescription: str(200),
    coachManifestDescription: str(200),
    heroLead: str(600),
    coachBio: str(800),
  },
  theme: {
    themeColor: hex, background: hex, heroBg: hex, heroInk: hex,
    dark: { accent: hex, accentInk: hex, accent2: hex },
    light: { accent: hex, accentInk: hex, accent2: hex },
    icons: { athlete: { bg: hex, fg: hex }, coach: { bg: hex, fg: hex } },
  },
  // Only for clients that have older saved data to migrate (Kyri).
  legacy: { ...OPT, renameFrom: str(60), renameTo: str(60), prizeFrom: str(80), prizeTo: str(80) },
  deploy: { ...OPT, customDomain: (v) => (v === "" || (typeof v === "string" && /^(?=.{4,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/.test(v)) ? null : "must be empty or a host name like train.example.com") },
};

function walk(value, spec, path, errors) {
  if (typeof spec === "function") {
    const msg = spec(value);
    if (msg) errors.push(`${path} ${msg}`);
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) { errors.push(`${path} must be an object`); return; }
  for (const key of Object.keys(value)) if (key === "__optional" || !Object.hasOwn(spec, key)) errors.push(`${path}.${key} is not a known field`);
  for (const [key, sub] of Object.entries(spec)) {
    if (key === "__optional") continue;
    const here = `${path}.${key}`;
    if (!Object.hasOwn(value, key)) {
      if (!(typeof sub === "function" && sub.optional) && !(typeof sub === "object" && sub.__optional)) errors.push(`${here} is missing`);
      continue;
    }
    walk(value[key], sub, here, errors);
  }
}

/** Validates a parsed client.json and returns it with defaults filled in. Throws ClientError listing every problem. */
export function validateClient(raw, folderId) {
  const errors = [];
  if (folderId !== undefined) { try { checkId(folderId); } catch (e) { errors.push(e.message); } }
  walk(raw, SPEC, "client", errors);
  if (!errors.length) {
    try { checkId(raw.id); } catch (e) { errors.push(e.message); }
    if (folderId !== undefined && raw.id !== folderId) errors.push(`client.id "${raw.id}" must equal its folder name "${folderId}"`);
  }
  if (!errors.length && RESERVED_PREFIXES.has(raw.storagePrefix)) errors.push(`client.storagePrefix "${raw.storagePrefix}" is reserved by another app on the same origin`);
  if (errors.length) throw new ClientError(`clients/${folderId ?? raw?.id}/client.json is invalid:\n  - ${errors.join("\n  - ")}`);
  return { ...raw, coachAppName: raw.coachAppName ?? `${raw.appName} Coach`, deploy: raw.deploy ?? { customDomain: "" } };
}

export function loadClient(id) {
  checkId(id);
  const dir = join(CLIENTS_DIR, id);
  const file = join(dir, "client.json");
  if (!existsSync(file)) throw new ClientError(`Unknown client "${id}": clients/${id}/client.json not found.`);
  let raw;
  try { raw = JSON.parse(readFileSync(file, "utf8")); } catch (e) { throw new ClientError(`clients/${id}/client.json is not valid JSON: ${e.message}`); }
  const client = validateClient(raw, id);
  if (!existsSync(join(dir, "logo.svg"))) throw new ClientError(`clients/${id}/logo.svg is missing.`);
  return { ...client, dir };
}

/** Every real client (folders starting with "_" are templates). Checks cross-client rules. */
export function loadAllClients() {
  const ids = readdirSync(CLIENTS_DIR).filter((n) => !n.startsWith("_") && statSync(join(CLIENTS_DIR, n)).isDirectory()).sort();
  if (!ids.length) throw new ClientError("No clients found in clients/.");
  const clients = ids.map(loadClient);
  const defaults = clients.filter((c) => c.isDefault);
  if (defaults.length !== 1) throw new ClientError(`Exactly one client must have "isDefault": true (found ${defaults.length}${defaults.length ? ": " + defaults.map((c) => c.id).join(", ") : ""}).`);
  const seen = new Map();
  for (const c of clients) {
    if (seen.has(c.storagePrefix)) throw new ClientError(`storagePrefix "${c.storagePrefix}" is used by both "${seen.get(c.storagePrefix)}" and "${c.id}"; each client needs its own.`);
    seen.set(c.storagePrefix, c.id);
  }
  return clients;
}

export const loadDefaultClient = () => loadAllClients().find((c) => c.isDefault);

// ---- generated files ---------------------------------------------------------

const GEN = (id) => `GENERATED from clients/${id}/client.json by scripts/sync-default.mjs / scripts/build.mjs. Do not edit by hand.`;

/** JSON that is safe to embed in JS even if the file is ever inlined into a <script>. */
const safeJson = (o) => JSON.stringify(o, null, 2).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16));

/** js/client.js: frozen runtime config (interface 5a, plus seed.location and the optional legacy block). */
export function clientJs(c) {
  const cfg = {
    id: c.id, appName: c.appName, coachAppName: c.coachAppName, businessName: c.businessName,
    coach: { ...c.coach }, contact: { ...c.contact }, locale: { ...c.locale },
    storagePrefix: c.storagePrefix, paymentRefPrefix: c.paymentRefPrefix,
    ranking: { ...c.ranking }, seed: { ...c.seed },
    site: { title: c.site.title, description: c.site.description, heroLead: c.site.heroLead, coachBio: c.site.coachBio },
  };
  if (c.legacy) cfg.legacy = { ...c.legacy };
  return `// ${GEN(c.id)}\nconst deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === "object" && deepFreeze(v)); return Object.freeze(o); };\nexport default deepFreeze(${safeJson(cfg)});\n`;
}

const rgba = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)}, ${a})`;

/** css/client.css: overrides of the brand variables in tokens.css (interface 5c). */
export function clientCss(c) {
  const t = c.theme;
  return `/* ${GEN(c.id)} */
:root {
  --accent: ${t.dark.accent};
  --accent-ink: ${t.dark.accentInk};
  --accent-soft: ${rgba(t.dark.accent, 0.1)};
  --accent-2: ${t.dark.accent2};
  --brand-hero: ${t.heroBg};
  --brand-hero-ink: ${t.heroInk};
}

:root[data-theme="light"] {
  --accent: ${t.light.accent};
  --accent-ink: ${t.light.accentInk};
  --accent-soft: ${rgba(t.light.accent, 0.07)};
  --accent-2: ${t.light.accent2};
}
`;
}

/** The only line of sw.js the build rewrites. */
export function swConfigLine(c, skip) {
  const cache = `${c.storagePrefix}-v3`;
  const offline = `You're offline. Connect to the internet and open ${c.appName} again.`;
  return `const CFG = { cache: ${JSON.stringify(cache)}, skip: ${JSON.stringify(skip)}, offline: ${JSON.stringify(offline)} }; // build:sw-config`;
}

export function manifests(c) {
  const icons = (p) => [192, 512].map((s) => ({ src: `assets/${p}icon-${s}.png`, sizes: `${s}x${s}`, type: "image/png", purpose: "any maskable" }));
  const base = { display: "standalone", background_color: c.theme.background, theme_color: c.theme.themeColor };
  return {
    athlete: { id: "./member.html", name: `${c.appName} — Athlete`, short_name: c.appName, description: c.site.athleteManifestDescription, start_url: "./member.html", scope: "./member.html", ...base, icons: icons("") },
    coach: { id: "./app.html", name: c.coachAppName, short_name: c.coachAppName, description: c.site.coachManifestDescription, start_url: "./app.html", scope: "./app.html", ...base, icons: icons("coach-") },
  };
}
