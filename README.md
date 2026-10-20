# TrainHub

Booking and athlete management for a personal trainer. The demo is set up for Kyriakos Nicolaou ([@trainwithkyri](https://www.instagram.com/trainwithkyri/)). Strength, conditioning and cardio for fighters of any martial art, and for non-fighters who just want to get fit.
Has a public site, a coach web app and a phone-first athlete app. No dependencies: vanilla JS modules and a tiny Node static server.

```bash
node server.js        # → http://localhost:5173
```

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
Every month athletes collect points, and the #1 athlete wins the coach's prize. That gives people a reason to train more, hit goals and bring friends, so the roster grows by itself.
- **1-on-1 PT session:** +15 · **group session:** +3 · **friend who signs up:** +50 · **achievements:** their own points (personal record +20, won a fight +50, hit weight target +30…)
- Kyri awards achievements from an athlete's profile or the ranking page, edits the points, prize and achievement list in **Settings**, and marks the prize as given once a month ends.
- Each athlete has a personal **invite link** in the app (Ranking tab). Friends who sign up through it are tagged as their referral in Leads; when Kyri converts the lead, the athlete gets the points.

## Athlete app
Athletes sign in with their email and password and can:
- **book** 1-on-1 PT slots (one athlete per slot) or spots in group classes, up to 7 days ahead, and cancel them
- add or change their profile photo, which Kyri also sees
- see their monthly ranking, points, the prize and the leaderboard, and share their invite link
- see their goal, training streak and session history (fighters also see their martial art and record)
- join fights & events, upload documents, pay invoices

Demo login: press **"Fill it in for me"** on the sign-in screen (every seeded athlete's password is `train123`).

## Install on a phone
Both apps can be installed as home-screen apps. They open full screen, have their own icon, and still open offline.
- **iPhone (Safari):** open the page → Share → **Add to Home Screen**
- **Android (Chrome):** open the page → ⋮ menu → **Install app** / **Add to Home screen**

Install `/member.html` for athletes (black KYRI icon) and `/app.html` for Kyri (white **KYRI Coach** icon).

## Data
Everything is stored in the browser's `localStorage` (`kyri:v3`) and seeded with a demo roster. The coach and athlete apps sync across tabs.
You can reset it from **Settings → Reset demo data**. Demo profile photos are placeholder portraits loaded from randomuser.me. Uploaded photos are cropped to a 320px square and stored with the athlete.

## Code map
- `js/store.js`: data model, seed data, disciplines, bookings and payment logic
- `js/ui.js`: escaping, modal and form helpers, charts, discipline chips
- `js/app.js`: coach shell and hash router; `js/views/*.js` has one file per module
- `js/member.js`: athlete app
- Brand: generic **TrainHub** name with a dumbbell mark (`assets/logo.svg`). The coach's name, business name and Instagram come from **Settings → Business profile**
- `css/tokens.css` (black & white theme, dark default with a light alternate), `css/app.css`, `css/member.css`, `css/site.css`

## Before going live
This is a demo. Passwords are stored in plain text in the browser. A real deployment needs a backend with proper auth (e.g. Postgres + an API, or Supabase), a payment provider, and SMS/email for reminders.
