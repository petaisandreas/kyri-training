// HTML template rendering: {{token}} placeholders -> HTML-escaped client values.
// Used by the build and by server.js when serving source HTML in development.

export const escHtml = (v) => String(v).replace(/[&<>"'`]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" })[c]);

/** The exact list of tokens HTML files may use. */
export const TOKENS = {
  appName: (c) => c.appName,
  coachAppName: (c) => c.coachAppName,
  businessName: (c) => c.businessName,
  coachName: (c) => c.coach.name,
  coachShort: (c) => c.coach.short,
  coachInitials: (c) => c.coach.initials,
  email: (c) => c.contact.email,
  instagram: (c) => c.contact.instagram,
  storagePrefix: (c) => c.storagePrefix,
  themeColor: (c) => c.theme.themeColor,
  siteTitle: (c) => c.site.title,
  siteDescription: (c) => c.site.description,
  heroLead: (c) => c.site.heroLead,
  coachBio: (c) => c.site.coachBio,
};

/** Replaces every {{token}}; throws on an unknown token so typos fail loudly. */
export function renderTemplate(str, client, label = "template") {
  return String(str).replace(/\{\{\s*([^{}]*?)\s*\}\}/g, (_, name) => {
    if (!Object.hasOwn(TOKENS, name)) throw new Error(`${label}: unknown token {{${name}}}. Allowed: ${Object.keys(TOKENS).join(", ")}`);
    return escHtml(TOKENS[name](client));
  });
}
