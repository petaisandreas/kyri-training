// Regenerates the committed, unbuilt copy of the default client in the repo root so that
// `node server.js` works without a build: js/client.js, css/client.css, manifests, sw.js config line, logo/favicon SVGs.
// The PNG icons in assets/ are not touched (the default client keeps its own).
import { loadAllClients, ROOT, ClientError } from "./lib/client.mjs";
import { generateClientFiles } from "./lib/generate.mjs";

try {
  const clients = loadAllClients();
  const def = clients.find((c) => c.isDefault);
  generateClientFiles(def, ROOT, { skip: clients.filter((c) => c !== def).map((c) => c.id) });
  console.log(`Synced default client "${def.id}": js/client.js, css/client.css, manifests, sw.js config, assets/logo.svg, assets/favicon.svg`);
} catch (e) {
  if (e instanceof ClientError) { console.error(`sync-default failed: ${e.message}`); process.exit(1); }
  throw e;
}
