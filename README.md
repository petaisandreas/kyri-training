# KYRI Training

Booking and athlete management for **KYRI**: personal training and fight preparation with Kyriakos Nicolaou ([@trainwithkyri](https://www.instagram.com/trainwithkyri/)).
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
Dashboard · **Athletes** (each athlete's martial arts — Muay Thai, Boxing, Kickboxing, MMA, BJJ, Wrestling, Judo, Karate, Taekwondo — plus level, weight class, fight record and goal; programs with monthly price and paid / due / overdue status; CSV export) ·
**Schedule & bookings** (weekly grid of 1-on-1 slots and group sessions; book athletes in, mark who trained) · Fights & events · Documents (medical clearances, fight licenses, waivers with expiry tracking) ·
Billing (plans, packs, invoices, expenses) · Leads & follow-ups · Reports · Settings.

## Athlete app
Athletes sign in with their email and password and can:
- **book** 1-on-1 PT slots (one athlete per slot) or spots in group classes, up to 7 days ahead, and cancel them
- see their martial arts, level, fight record, training streak and session history
- join fights & events, upload documents, pay invoices

Demo login: press **"Fill it in for me"** on the sign-in screen (every seeded athlete's password is `train123`).

## Data
Everything is stored in the browser's `localStorage` (`kyri:v1`) and seeded with a demo roster. The coach and athlete apps sync across tabs.
You can reset it from **Settings → Reset demo data**.

## Code map
- `js/store.js`: data model, seed data, disciplines, bookings and payment logic
- `js/ui.js`: escaping, modal and form helpers, charts, discipline chips
- `js/app.js`: coach shell and hash router; `js/views/*.js` has one file per module
- `js/member.js`: athlete app
- `css/tokens.css` (black & white theme, dark default with a light alternate), `css/app.css`, `css/member.css`, `css/site.css`

## Before going live
This is a demo. Passwords are stored in plain text in the browser. A real deployment needs a backend with proper auth (e.g. Postgres + an API, or Supabase), a payment provider, and SMS/email for reminders.
