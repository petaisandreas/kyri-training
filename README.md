# KYRI Training

Booking and athlete management for **KYRI**: personal training with Kyriakos Nicolaou ([@trainwithkyri](https://www.instagram.com/trainwithkyri/)). Strength, conditioning and cardio for fighters of any martial art, and for non-fighters who just want to get fit.
Has a public site, a coach web app and a phone-first athlete app. Vanilla JS modules and a tiny Node static server; the only dependency is `sharp` (dev-only, used by the build to render app icons).
The code base is **white-label**: each trainer is a folder under `clients/` (see [Adding a new client](#adding-a-new-client)). KYRI is the default client and is served from the site root.

```bash
npm install                 # once (sharp, for the build)
node server.js              # → http://localhost:5173 (default client, unbuilt)
npm run build               # all clients → dist/
npm run preview             # serve dist/ at http://localhost:5173 (same as node server.js --dir dist)
```

**Dev note:** the source `*.html` files contain `{{tokens}}` (brand name, colours…). Open them through `node server.js` (it fills the tokens for the default client) or build first. Opening the files straight from disk or another static server shows raw `{{tokens}}`.

| Page | Path |
|---|---|
| Public site + free-trial form | `/` |
| Coach app | `/app.html` |
| Athlete app (phone) | `/member.html` |

## Coach app
Dashboard · **Athletes** (photo, client type and goal; for fighters, the martial art they compete in (Muay Thai, Boxing, Kickboxing, MMA, BJJ, Wrestling, Judo, Karate, Taekwondo), weight class and fight record; programs with monthly price and paid / due / overdue status; CSV export) ·
**Schedule & bookings** (weekly grid of 1-on-1 PT slots and group conditioning, HIIT, strength and mobility sessions; book athletes in, mark who trained) · Fights & events (your fighters' fight nights, bootcamps, fitness tests) · Documents (medical clearances, PAR-Q, waivers with expiry tracking) ·
Billing (plans, packs, invoices, expenses) · Leads & follow-ups · Reports · Settings.

## Monthly ranking
Every month athletes collect points, and the #1 athlete wins Kyri's prize. That gives people a reason to train more, hit goals and bring friends, so the roster grows by itself.
- **1-on-1 PT session:** +15 · **group session:** +3 · **friend who signs up:** +50 · **achievements:** their own points (personal record +20, won a fight +50, hit weight target +30…)
- Kyri awards achievements from an athlete's profile or the ranking page, edits the points, prize and achievement list in **Settings**, and marks the prize as given once a month ends.
- Each athlete has a personal **invite link** in the app (Ranking tab). Friends who sign up through it are tagged as their referral in Leads; when Kyri converts the lead, the athlete gets the points.

## Athlete app
Athletes sign in with their email and password and can:
- **book** 1-on-1 PT slots (one athlete per slot) or spots in group classes, up to 7 days ahead, and cancel them
- add or change their profile photo, which Kyri also sees
- see their monthly ranking, points, the prize and the leaderboard, and share their invite link
- see their goal, training streak and session history (fighters also see their martial art and record)
- join fights & events and upload documents
- **pay Kyri with Revolut**: Home shows what they owe with a payment reference (e.g. `KYRI Andreas G Oct`). **Pay with Revolut** opens Kyri's revolut.me link with the amount and reference filled in, then **I have paid** marks the invoices as *pending*. Kyri sees them under **Payments to confirm** (Dashboard and Billing) and taps **Confirm** (paid) or **Reject** (back to due, with a note the athlete sees). Without a Revolut username in Settings, athletes just see the amount and "Pay Kyri in person".

Demo login: press **"Fill it in for me"** on the sign-in screen (every seeded athlete's password is `train123`).

## Install on a phone
Both apps can be installed as home-screen apps. They open full screen, have their own icon, and still open offline.
- **iPhone (Safari):** open the page → Share → **Add to Home Screen**
- **Android (Chrome):** open the page → ⋮ menu → **Install app** / **Add to Home screen**

Install `/member.html` for athletes (black KYRI icon) and `/app.html` for Kyri (white **KYRI Coach** icon).

## Data
Everything is stored in the browser's `localStorage` (`<storagePrefix>:v3`, so `kyri:v3` for KYRI; theme and athlete session use `<prefix>:theme` and `<prefix>:member`, uploaded files live in the IndexedDB `<prefix>-files`) and seeded with a demo roster. The coach and athlete apps sync across tabs.
You can reset it from **Settings → Reset demo data**. Demo profile photos are placeholder portraits loaded from randomuser.me. Uploaded photos are cropped to a 320px square and stored with the athlete.

## Code map
- `clients/<id>/client.json` + `logo.svg`: everything that differs per trainer; `scripts/`: build, scaffolding and validation
- `js/client.js`, `css/client.css`: generated from the default client (`npm run sync-default`); the build writes its own per client
- `js/store.js`: data model, seed data, disciplines, bookings and payment logic
- `js/ui.js`: escaping, modal and form helpers, charts, discipline chips
- `js/app.js`: coach shell and hash router; `js/views/*.js` has one file per module
- `js/member.js`: athlete app
- `css/tokens.css` (black & white theme, dark default with a light alternate), `css/app.css`, `css/member.css`, `css/site.css`

## Before going live
This is a demo. Passwords are stored in plain text in the browser. A real deployment needs a backend with proper auth (e.g. Postgres + an API, or Supabase), and SMS/email for reminders.

**Payments**
- Set Kyri's username in **Settings → Revolut** (`@kyri` or `https://revolut.me/kyri`).
- A personal Revolut account has no API or webhooks, so Kyri has to confirm each payment by hand (checking the Revolut app for the reference). The "I have paid" button is only the athlete's claim, never proof.
- The revolut.me link's `amount`, `currency` and `note` parameters are undocumented. The amount is assumed to be in cents (`revolutAmount()` in `js/store.js`). Do one real test payment and change that one function if it is wrong.
- Fully automatic confirmation needs **Revolut Business** (an API-enabled plan plus a merchant account; card payments cost about 1% + €0.20 per EEA card payment, check current pricing), a small HTTPS backend to receive the webhooks, and a real database instead of `localStorage`.

## Adding a new client
About 20 minutes, no code changes.
1. `node scripts/new-client.mjs acme-fit "Acme Fitness" --coach "Sam Lee"` creates `clients/acme-fit/` (id: lower-case letters, digits, hyphens; reserved or existing ids are rejected). The id is also the URL folder and the storage prefix.
2. Edit `clients/acme-fit/client.json`: names, contact email and Instagram handle, `locale` (currency + number format), `paymentRefPrefix` (ASCII, up to 8 chars), ranking prize, site text, and `theme` (dark and light accent colours, as #rrggbb; check text contrast). The build rejects unknown or missing fields and tells you which one.
3. Replace `clients/acme-fit/logo.svg` with a single-colour mark on a square `viewBox`. Only `path`, `rect`, `circle`, `polygon` and `g` are kept; fills, scripts, event handlers and links are stripped, and the app colours the logo itself. The build turns it into the favicon and the app icons.
4. Optional: put your own `icon-192.png`, `icon-512.png`, `icon-apple.png` and `coach-icon-192/512/apple.png` into `clients/acme-fit/icons/` to use them instead of generated icons (KYRI does this to keep its installed icons unchanged).
5. `npm run build`, `npm run preview`, open `/acme-fit/`, check both themes and the coach and athlete apps.
6. Commit and push to `main`: GitHub Actions builds everything and deploys `dist/` to Pages. The client lives at `https://<user>.github.io/<repo>/acme-fit/`.

**Important: the github.io sub-folders (`/<id>/`) are for demos and previews only.** Clients on the same origin are separated only by naming (storage prefixes, cache names, service-worker scopes), not by a browser security boundary: any page on that origin could read another client's `localStorage`. Real, paying clients must get their own domain or subdomain (see "Custom domain" below, `node scripts/build.mjs --only <id> --as-root`). Storage prefixes used by other apps on the same origin (currently `bjjgym`) are reserved and rejected by the build.

Each client is isolated by naming: its own storage keys, IndexedDB, service worker cache and PWA scope, so several apps can share one origin without seeing each other's data. The coach can still rename the business and set the coach name and short name in **Settings**; those override `client.json` at runtime.

## Deploy
`.github/workflows/pages.yml` runs on every push to `main` (and manually): `npm ci`, `npm run build`, then deploys `dist/` with the official Pages actions. In the repository settings, **Pages -> Source** must be set to **GitHub Actions** once. The KYRI client keeps the existing URL (the site root); other clients are sub-folders.

## Custom domain for one client
Every `dist/<id>/` folder is a complete, self-contained site, so a client can move to its own domain:
1. Create a separate static host (a second Pages repo, Netlify, Cloudflare Pages...) with build command `node scripts/build.mjs --only <id> --as-root` (after `npm ci`) and output directory `dist`.
2. Point the domain at it and set `deploy.customDomain` in `client.json` (documentation only).
3. Moving to a new origin means browsers start with empty data (localStorage and IndexedDB are per origin and the installed apps are tied to the old URL). Have the coach use **Settings -> export backup** on the old URL and **import** on the new one, and reinstall the home-screen apps.
