// node scripts/new-client.mjs <id> "Business Name" [--coach "Full Name"]
// Scaffolds clients/<id>/ from clients/_template. Rejects invalid, reserved and existing ids.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { CLIENTS_DIR, ClientError, checkId, validateClient } from "./lib/client.mjs";

function fail(msg) { console.error(`new-client failed: ${msg}`); process.exit(1); }

const args = process.argv.slice(2);
let coachArg = null;
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--coach") { coachArg = args[++i]; if (!coachArg) fail("--coach needs a name."); }
  else if (args[i].startsWith("--")) fail(`unknown option ${args[i]}`);
  else pos.push(args[i]);
}
if (pos.length !== 2) fail('usage: node scripts/new-client.mjs <id> "Business Name" [--coach "Full Name"]');
const [id, business] = pos;

try {
  checkId(id);
  const dir = resolve(CLIENTS_DIR, id);
  if (!dir.startsWith(CLIENTS_DIR + sep) || resolve(dir, "..") !== CLIENTS_DIR) throw new ClientError("refusing to write outside clients/.");
  if (existsSync(dir)) throw new ClientError(`clients/${id} already exists.`);

  const tpl = JSON.parse(readFileSync(join(CLIENTS_DIR, "_template", "client.json"), "utf8"));
  const biz = business.trim();
  const brand = (biz.match(/[A-Za-z0-9]+/)?.[0] || id.replace(/-/g, "")).toUpperCase().slice(0, 24);
  const coachName = (coachArg ?? "Coach Name").trim();
  const words = coachName.split(/\s+/);
  const short = words[0];
  const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
  const c = structuredClone(tpl);
  Object.assign(c, { id, appName: brand, businessName: biz, storagePrefix: id, paymentRefPrefix: brand.replace(/[^A-Z0-9]/g, "").slice(0, 8) || "PAY" });
  c.coach = { name: coachName, short, initials };
  c.contact.instagram = id.replace(/-/g, ".").slice(0, 30);
  c.site.title = `${biz} — Personal training & conditioning`;
  c.site.description = `Personal training with ${coachName}: strength, conditioning and cardio for athletes and for everyone who wants to get fit. Book your sessions online.`;
  c.site.athleteManifestDescription = `Book your sessions with ${short}.`;
  c.site.coachManifestDescription = `${short}'s coach dashboard: athletes, bookings and billing.`;
  c.site.heroLead = `1-on-1 personal training and small-group sessions with ${coachName}. Same coach, same standard, a plan built around your goal.`;
  validateClient(c, id); // never write a config that the build would reject

  mkdirSync(dir); // fails if it appeared meanwhile
  try {
    writeFileSync(join(dir, "client.json"), JSON.stringify(c, null, 2) + "\n");
    copyFileSync(join(CLIENTS_DIR, "_template", "logo.svg"), join(dir, "logo.svg"));
  } catch (e) { rmSync(dir, { recursive: true, force: true }); throw e; }

  console.log(`Created clients/${id}/ (client.json, logo.svg). Next:
  1. Edit clients/${id}/client.json: coach, email, instagram, currency, prize, accent colours, site text.
  2. Replace clients/${id}/logo.svg with the client's single-colour logo (square viewBox).
  3. npm run build, then npm run preview and open /${id}/`);
} catch (e) {
  if (e instanceof ClientError) fail(e.message);
  throw e;
}
