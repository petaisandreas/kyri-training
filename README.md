# KYRI Training

Booking and athlete management for **KYRI**: personal training with Kyriakos Nicolaou ([@trainwithkyri](https://www.instagram.com/trainwithkyri/)). Strength, conditioning and cardio for fighters of any martial art, and for non-fighters who just want to get fit.
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

## Athlete app
Athletes sign in with their email and password and can:
- **book** 1-on-1 PT slots (one athlete per slot) or spots in group classes, up to 7 days ahead, and cancel them
- add or change their profile photo, which Kyri also sees
- see their goal, training streak and session history (fighters also see their martial art and record)
- join fights & events, upload documents, pay invoices

Demo login: press **"Fill it in for me"** on the sign-in screen (every seeded athlete's password is `train123`).

## Data
Everything is stored in the browser's `localStorage` (`kyri:v2`) and seeded with a demo roster. The coach and athlete apps sync across tabs.
You can reset it from **Settings → Reset demo data**. Demo profile photos are placeholder portraits loaded from randomuser.me. Uploaded photos are cropped to a 320px square and stored with the athlete.

## Code map
- `js/store.js`: data model, seed data, disciplines, bookings and payment logic
- `js/ui.js`: escaping, modal and form helpers, charts, discipline chips
- `js/app.js`: coach shell and hash router; `js/views/*.js` has one file per module
- `js/member.js`: athlete app
- `css/tokens.css` (black & white theme, dark default with a light alternate), `css/app.css`, `css/member.css`, `css/site.css`

## Before going live
This is a demo. Passwords are stored in plain text in the browser. A real deployment needs a backend with proper auth (e.g. Postgres + an API, or Supabase), a payment provider, and SMS/email for reminders.
