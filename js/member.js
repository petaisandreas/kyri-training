// Athlete app: athletes sign in to book PT and conditioning sessions with their coach, see their training, and pay.
import { db, update, subscribe, uid, today, iso, addDays, byId, money, classesOn, DAYS, docStatus, isBooked, bookedCount, isFighter, sessionColor, monthlyRanking, prizeFor, thisMonth, monthName, shiftMonth, referralsOf, fullName, openInvoices, amountOwed, paymentReference, revolutLink, claimPaid, client, KEYS, coachShort } from "./store.js";
import { uploadDocument, viewDocument, DOC_LABEL } from "./docs-ui.js";
import { esc, $, $$, badge, fmtDate, fmtTime, toast, empty, athleteAvatar, pickPhoto } from "./ui.js";

const SESSION = KEYS.member;
const TABS = [["home", "Home", "⌂"], ["book", "Book", "▦"], ["rank", "Ranking", "★"], ["me", "Me", "◉"]];
let tab = "home";
let bookFilter = "";

const root = $("#root");
const getSession = () => { try { return localStorage.getItem(SESSION); } catch { return null; } };
const setSession = (id) => { try { id ? localStorage.setItem(SESSION, id) : localStorage.removeItem(SESSION); } catch {} };
const me = () => byId("students", getSession());
const logo = (size) => `<span class="logo-mark" style="width:${size}px;height:${size}px"></span>`;
const demoAthlete = () => db().students.find((s) => s.status === "active" && isFighter(s) && s.waiver) || db().students.find((s) => s.status === "active");

// --- login ----------------------------------------------------------------------
function login() {
  const demo = demoAthlete();
  return `<div class="m-login">
    <div class="m-logo">${logo(64)}<span>${esc(client.appName)}</span></div>
    <h1>Athlete sign in</h1>
    <p class="muted">Book your sessions with ${esc(db().academy.owner.split(" ")[0])}</p>
    <form id="login" class="m-card" novalidate>
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="username" required /></label>
      <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required /></label>
      <button class="btn btn-primary btn-lg full">Sign in</button>
      <p class="m-error" id="login-err" hidden>Email and password don't match an active athlete.</p>
    </form>
    ${demo ? `<p class="m-hint">Demo athlete: <b>${esc(demo.email)}</b><br/><button class="link" data-demo>Fill it in for me</button></p>` : ""}
    <a class="link" href="index.html">← Back to site</a>
  </div>`;
}

function mountLogin() {
  const f = $("#login");
  $("[data-demo]")?.addEventListener("click", () => {
    const demo = demoAthlete();
    f.email.value = demo.email; f.password.value = demo.password;
  });
  f.onsubmit = (e) => {
    e.preventDefault();
    if (!f.checkValidity()) return f.reportValidity();
    const s = db().students.find((x) => x.email.toLowerCase() === f.email.value.trim().toLowerCase() && x.password === f.password.value && x.status !== "cancelled");
    if (!s) { $("#login-err").hidden = false; return; }
    setSession(s.id); tab = "home"; render();
  };
}

// --- helpers --------------------------------------------------------------------
function upcoming(days = 7) {
  const out = [];
  const now = new Date().toTimeString().slice(0, 5);
  for (let i = 0; i < days; i++) {
    const date = iso(addDays(new Date(), i));
    for (const c of classesOn(date)) {
      if (i === 0 && c.start <= now) continue;
      out.push({ c, date });
    }
  }
  return out;
}
function myBookings(s) {
  return db().bookings.filter((b) => b.studentId === s.id && b.date >= today())
    .map((b) => ({ b, c: byId("classes", b.classId) })).filter((x) => x.c)
    .sort((x, y) => (x.b.date + x.c.start).localeCompare(y.b.date + y.c.start));
}
function streakWeeks(sid) {
  const dates = new Set(db().attendance.filter((a) => a.studentId === sid).map((a) => a.date));
  let n = 0;
  for (let w = 0; w < 52; w++) {
    let hit = false;
    for (let d = 0; d < 7; d++) if (dates.has(iso(addDays(new Date(), -(w * 7 + d))))) { hit = true; break; }
    if (!hit) { if (w === 0) continue; break; }
    n++;
  }
  return n;
}
const dayLabel = (date) => (date === today() ? "Today" : date === iso(addDays(new Date(), 1)) ? "Tomorrow" : fmtDate(date, { weekday: "long", month: "short", day: "numeric" }));
const bookingRow = ({ b, c }) => `<div class="m-card m-class" style="--lv:${sessionColor(c)}"><div class="date-tile"><b>${new Date(b.date + "T12:00").getDate()}</b>${DAYS[new Date(b.date + "T12:00").getDay()]}</div>
  <div class="grow"><b>${esc(c.name)}</b><small>${fmtTime(c.start)} · ${c.duration} min · ${esc(c.level)}</small></div>
  <button class="btn btn-sm btn-ghost" data-cancel="${esc(b.id)}">Cancel</button></div>`;

// --- tabs -----------------------------------------------------------------------
const sum = (list) => list.reduce((a, i) => a + i.amount, 0);
function payCard(s) {
  const open = openInvoices(s.id), due = open.filter((i) => i.status === "due"), pend = open.filter((i) => i.status === "pending");
  const owed = amountOwed(s.id), rejected = due.find((i) => i.rejectedAt);
  const pendCard = pend.length ? `<div class="m-card m-pay pending"><b>Waiting for ${esc(coachShort())} to confirm ${money(sum(pend))}</b><small>You said you paid${pend[0].reference ? ` · ref ${esc(pend[0].reference)}` : ""}. ${esc(coachShort())} will confirm it soon.</small></div>` : "";
  if (!due.length) return pendCard;
  const ref = paymentReference(s.id, due), link = revolutLink(owed, ref);
  return pendCard + `<div class="m-card m-pay">
    ${rejected ? `<p class="m-pay-reject"><b>${esc(coachShort())} couldn't find your payment${rejected.rejectNote ? `: ${esc(rejected.rejectNote)}` : "."}</b></p>` : ""}
    <span class="eyebrow">Payment due</span><div class="m-pay-amt">You owe ${money(owed)}</div>
    <ul class="m-pay-lines">${due.map((i) => `<li><span>${esc(i.description)}<small>Due ${fmtDate(i.due)}</small></span><b>${money(i.amount)}</b></li>`).join("")}</ul>
    ${link ? `<div class="m-pay-ref"><small>Payment reference</small><div><code>${esc(ref)}</code><button class="btn btn-sm btn-ghost" data-copy="${esc(ref)}">Copy</button></div></div>
      <a class="btn btn-primary btn-lg full" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Pay with Revolut</a>
      <button class="btn btn-ghost full mt" data-claim>I've paid</button>` : `<p class="m-pay-offline"><b>Pay ${esc(coachShort())} in person</b><small>Cash or bank transfer at your next session.</small></p>`}
  </div>`;
}

function home(s) {
  const mine = myBookings(s);
  const h = docStatus(s.id);
  return `
  <section class="m-hero">
    <div class="m-hero-top"><div><p class="eyebrow">Let's work,</p><h1>${esc(s.first)}</h1></div>
      <button class="photo-edit m-photo" data-photo title="Change photo">${athleteAvatar(s)}<span>${s.photo ? "Change" : "+ Photo"}</span></button></div>
  </section>
  ${payCard(s)}
  <div class="m-title-row"><h2 class="m-title">Your bookings</h2><button class="link" data-go="book">+ Book</button></div>
  ${mine.length ? mine.slice(0, 3).map(bookingRow).join("") : `<button class="m-card m-empty" data-go="book">Nothing booked — <b>book a session →</b></button>`}
  ${(() => { const rows = monthlyRanking(), me = rows.find((r) => r.s.id === s.id); return `<button class="m-card m-rank-teaser" data-go="rank"><span class="m-rank-big">${me ? "#" + me.rank : "—"}</span>
    <span class="grow"><b>${me ? `${me.points} pts this month` : "Start earning points"}</b><small>🎁 #1 wins: ${esc(prizeFor(today().slice(0, 7)))}</small></span><span class="muted">›</span></button>`; })()}
  ${h.status === "valid" ? "" : `<button class="m-alert ${h.status === "expiring" ? "warn" : ""}" data-upload-hc><b>Medical clearance ${DOC_LABEL[h.status].toLowerCase()}</b><span>${h.doc?.expires ? (h.status === "expired" ? "Expired " : "Expires ") + fmtDate(h.doc.expires) + " · " : ""}Tap to upload a new one</span></button>`}
  ${s.waiver ? "" : `<div class="m-alert warn"><b>Waiver needed</b><span>Please sign it before your next session.</span></div>`}`;
}

function book(s) {
  const all = upcoming(7);
  const list = all.filter(({ c }) => !bookFilter || (bookFilter === "1-on-1" ? c.capacity === 1 : c.capacity > 1));
  const evs = db().events.filter((ev) => ev.date >= today()).sort((a, b) => a.date.localeCompare(b.date));
  const byDate = {};
  list.forEach((x) => (byDate[x.date] ||= []).push(x));
  return `<h1 class="m-h1">Book a session</h1><p class="muted">Next 7 days · 1-on-1 slots are just you and the coach</p>
  <div class="m-chips">${[["", "All"], ["1-on-1", "1-on-1 PT"], ["group", "Group sessions"]].map(([k, l]) => `<button data-bf="${k}" class="${bookFilter === k ? "on" : ""}">${l}</button>`).join("")}</div>
  ${Object.keys(byDate).length ? Object.entries(byDate).map(([date, items]) => `
    <h2 class="m-title">${dayLabel(date)}</h2>
    ${items.map(({ c, date }) => {
      const booked = isBooked(s.id, c.id, date), n = bookedCount(c.id, date), full = n >= c.capacity;
      const spots = c.capacity === 1 ? (booked ? "Your 1-on-1 slot" : full ? "Taken" : "Available") : `${c.capacity - n} of ${c.capacity} spots left`;
      return `<div class="m-card m-class m-slot ${c.capacity === 1 ? "solo" : ""}" style="--lv:${sessionColor(c)}"><span class="time">${fmtTime(c.start)}</span>
        <div class="grow"><b>${esc(c.name)}</b><small>${esc(c.level)} · ${c.duration} min</small><small>${spots}</small></div>
        ${booked ? `<button class="btn btn-sm m-booked" data-unbook="${esc(c.id)}|${esc(date)}">Booked ✓</button>` : `<button class="btn btn-sm btn-primary" data-book="${esc(c.id)}|${esc(date)}" ${full ? "disabled" : ""}>${full ? (c.capacity === 1 ? "Taken" : "Full") : "Book"}</button>`}</div>`;
    }).join("")}`).join("") : empty("No sessions match in the next 7 days.")}
  ${evs.length ? `<h2 class="m-title">Fights & events</h2>${evs.map((ev) => {
    const reg = ev.registrations.includes(s.id), full = ev.registrations.length >= ev.capacity;
    return `<div class="m-card m-class"><div class="date-tile"><b>${new Date(ev.date + "T12:00").getDate()}</b>${new Date(ev.date + "T12:00").toLocaleString("en-US", { month: "short" })}</div>
      <div class="grow"><b>${esc(ev.title)}</b><small>${esc(ev.type)} · ${ev.price ? money(ev.price) : "Free"} · ${ev.capacity - ev.registrations.length} spots left</small></div>
      ${reg ? `<button class="btn btn-sm btn-ghost" data-unreg="${esc(ev.id)}">Going ✓</button>` : `<button class="btn btn-sm btn-primary" data-reg="${esc(ev.id)}" ${full ? "disabled" : ""}>${full ? "Full" : "Join"}</button>`}</div>`;
  }).join("")}` : ""}`;
}

function rank(s) {
  const d = db();
  const month = today().slice(0, 7);
  const rows = monthlyRanking(month);
  const me = rows.find((r) => r.s.id === s.id);
  const R = d.academy.ranking;
  const ahead = me && me.rank > 1 ? rows[me.rank - 2] : null;
  const last = monthlyRanking(shiftMonth(month, -1))[0];
  const link = inviteLink(s);
  const friends = referralsOf(s.id);
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  return `<h1 class="m-h1">${esc(monthName(month))} ranking</h1><p class="muted">Ends ${esc(monthName(month))} ${lastDay} · #1 wins ${esc(coachShort())}'s prize</p>
  <div class="m-card m-me-rank">
    <div class="m-rank-big">${me ? "#" + me.rank : "—"}</div>
    <div class="grow"><b>${me ? `${me.points} points` : "No points yet"}</b><small>${me ? (me.rank === 1 ? "You're in first place. Keep it up!" : `${ahead.points - me.points + 1} pts to pass ${esc(ahead.s.first)}`) : "Book a session to get on the board"}</small></div>
  </div>
  <div class="m-card m-prize"><span>🎁</span><div><small>This month's prize</small><b>${esc(prizeFor(month))}</b></div></div>
  <h2 class="m-title">Bring a friend · +${R.referral} pts</h2>
  <div class="m-card m-invite">
    <p>Share your link. When a friend signs up with ${esc(coachShort())}, you get <b>+${R.referral} points</b>.</p>
    <input readonly value="${esc(link)}" data-link aria-label="Your invite link" />
    <button class="btn btn-primary full" data-share>Share my invite link</button>
    ${friends.length ? `<small class="muted">Friends you've brought: ${friends.map((f) => esc(f.first)).join(", ")}</small>` : ""}
  </div>
  <h2 class="m-title">Leaderboard</h2>
  <div class="m-card flush"><ul class="list m-list m-board">${rows.slice(0, 10).map((r) => `<li class="row ${r.s.id === s.id ? "me" : ""}"><span class="rank-no r${r.rank}">${r.rank}</span>${athleteAvatar(r.s)}<span class="grow">${esc(r.s.id === s.id ? "You" : `${r.s.first} ${r.s.last[0] || ""}.`)}<small>${r.pt} PT · ${r.ach.length} 🏅 · ${r.refs.length} 👥</small></span><b>${r.points}</b></li>`).join("") || `<li class="row muted">Nobody has points yet. Be the first!</li>`}
    ${me && me.rank > 10 ? `<li class="row me"><span class="rank-no">${me.rank}</span>${athleteAvatar(s)}<span class="grow">You</span><b>${me.points}</b></li>` : ""}</ul></div>
  <details class="m-card m-how"><summary>How points work</summary>
    ${me ? `<div class="m-breakdown">
      <div><strong>${me.pt}</strong><span>1-on-1 PT<br/>+${me.pt * R.pt}</span></div>
      <div><strong>${me.group}</strong><span>group<br/>+${me.group * R.group}</span></div>
      <div><strong>${me.ach.length}</strong><span>achievements<br/>+${me.achPts}</span></div>
      <div><strong>${me.refs.length}</strong><span>friends<br/>+${me.refs.length * R.referral}</span></div>
    </div>` : ""}
    <ul class="list m-list">
      <li class="row"><span class="grow">1-on-1 PT session</span><b>+${R.pt}</b></li>
      <li class="row"><span class="grow">Group session</span><b>+${R.group}</b></li>
      <li class="row"><span class="grow">Friend who signs up</span><b>+${R.referral}</b></li>
      ${d.academy.achievementTypes.map((t) => `<li class="row"><span class="grow">🏅 ${esc(t.title)}</span><b>+${t.points}</b></li>`).join("")}
    </ul></details>
  ${last ? `<p class="muted small center">Last month's winner: <b>${esc(fullName(last.s))}</b> · ${last.points} pts</p>` : ""}`;
}
const inviteLink = (s) => new URL(`index.html?ref=${encodeURIComponent(s.id)}#trial`, location.href).href;

function meTab(s) {
  const d = db();
  const plan = byId("plans", s.planId);
  const hist = d.attendance.filter((a) => a.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
  const inv = d.invoices.filter((i) => i.studentId === s.id && (i.status === "paid" || i.status === "pending")).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return `<div class="m-me-head"><button class="photo-edit m-photo m-photo-big" data-photo title="Change photo">${athleteAvatar(s)}<span>${s.photo ? "Change" : "+ Photo"}</span></button>
    <h1 class="m-h1">${esc(s.first)} ${esc(s.last)}</h1>
    <p class="muted">${esc(plan ? `${plan.name} · ${money(plan.price)} / ${plan.interval === "pack" ? "pack" : plan.interval}` : "No plan")}</p></div>
  <h2 class="m-title">Payments</h2>
  <div class="m-card flush"><ul class="list m-list">${inv.map((i) => `<li class="row"><span class="grow">${esc(i.description)}<small>${fmtDate(i.date)}</small></span>${i.status === "pending" ? badge(`Awaiting ${coachShort()}`, "info") : ""}<b>${money(i.amount)}</b></li>`).join("") || `<li class="row muted">No payments yet</li>`}</ul></div>
  <h2 class="m-title">My documents</h2>
  <div class="m-card flush"><ul class="list m-list">${d.documents.filter((x) => x.studentId === s.id).map((x) => `<li class="row"><button class="row-link" data-doc="${esc(x.id)}"><span class="grow">${esc(x.type)}<small>${x.expires ? (x.expires < today() ? "Expired " : "Valid until ") + fmtDate(x.expires) : "No expiry"}</small></span><span class="muted">View</span></button></li>`).join("") || `<li class="row muted">No documents on file</li>`}</ul></div>
  <button class="btn btn-ghost full" data-upload-doc>+ Upload a document</button>
  <h2 class="m-title">Recent sessions</h2>
  ${hist.length ? `<div class="m-card flush"><ul class="list m-list">${hist.slice(0, 5).map((a) => `<li class="row"><span class="grow">${esc(byId("classes", a.classId)?.name || "Session")}</span><small class="muted">${fmtDate(a.date, { month: "short", day: "numeric" })}</small></li>`).join("")}</ul></div>` : empty("No sessions yet — book your first one!")}
  <button class="btn btn-ghost full mt" data-signout>Sign out</button>`;
}

// --- shell ----------------------------------------------------------------------
function render() {
  const s = me();
  if (!s) { setSession(null); root.innerHTML = login(); mountLogin(); document.title = `Sign in · ${client.appName}`; return; }
  const body = { home, book, rank, me: meTab }[tab](s);
  const owed = amountOwed(s.id) > 0;
  const scroll = window.scrollY;
  root.innerHTML = `
    <header class="m-top"><div class="brand">${logo(26)}<span>${esc(client.appName)}</span></div>
      <button class="m-me" data-menu aria-label="Me">${athleteAvatar(s)}</button></header>
    <main class="m-main">${body}</main>
    <nav class="m-tabs">${TABS.map(([k, l, i]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}"><span>${i}${k === "home" && owed ? `<i class="m-dot"></i>` : ""}</span>${l}</button>`).join("")}</nav>`;
  document.title = `${TABS.find((t) => t[0] === tab)[1]} · ${client.appName}`;
  window.scrollTo(0, scroll);
  mount(s);
}

function mount(s) {
  const on = (sel, fn) => $$(sel, root).forEach((b) => (b.onclick = () => fn(b)));
  on("[data-tab]", (b) => { tab = b.dataset.tab; render(); window.scrollTo(0, 0); });
  on("[data-go]", (b) => { tab = b.dataset.go; render(); window.scrollTo(0, 0); });
  on("[data-bf]", (b) => { bookFilter = b.dataset.bf; render(); });
  on("[data-menu]", () => { tab = "me"; render(); window.scrollTo(0, 0); });
  on("[data-signout]", () => { setSession(null); tab = "home"; render(); });
  on("[data-book]", (b) => {
    const [classId, date] = b.dataset.book.split("|");
    const c = byId("classes", classId);
    if (bookedCount(classId, date) >= c.capacity) return toast(c.capacity === 1 ? "Someone just took that slot" : "Session is full", "warn");
    update((d) => d.bookings.push({ id: uid("bk"), studentId: s.id, classId, date }));
    toast(`Booked ${c.name} · ${dayLabel(date)} ${fmtTime(c.start)}`);
  });
  on("[data-unbook]", (b) => {
    const [classId, date] = b.dataset.unbook.split("|");
    update((d) => (d.bookings = d.bookings.filter((x) => !(x.studentId === s.id && x.classId === classId && x.date === date))));
    toast("Booking cancelled", "warn");
  });
  on("[data-cancel]", (b) => { update((d) => (d.bookings = d.bookings.filter((x) => x.id !== b.dataset.cancel))); toast("Booking cancelled", "warn"); });
  on("[data-reg]", (b) => update((d) => {
    const ev = d.events.find((x) => x.id === b.dataset.reg);
    if (ev.registrations.length >= ev.capacity || ev.registrations.includes(s.id)) return;
    ev.registrations.push(s.id);
    if (ev.price > 0) d.invoices.push({ id: uid("inv"), studentId: s.id, amount: ev.price, date: today(), due: ev.date, description: ev.title, eventId: ev.id, status: "due" });
    toast(`You're in: ${ev.title}`);
  }));
  on("[data-unreg]", (b) => {
    if (!confirm("Cancel your registration?")) return;
    update((d) => {
      const ev = d.events.find((x) => x.id === b.dataset.unreg);
      ev.registrations = ev.registrations.filter((id) => id !== s.id);
      d.invoices = d.invoices.filter((i) => !(i.studentId === s.id && i.status === "due" && (i.eventId ? i.eventId === ev.id : i.description === ev.title)));
    });
  });
  on("[data-copy]", async (b) => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast("Reference copied"); }
    catch { toast("Copy it by hand: " + b.dataset.copy, "warn"); }
  });
  on("[data-claim]", () => {
    const owed = amountOwed(s.id);
    if (!owed || !confirm(`Confirm you've sent ${money(owed)} to ${coachShort()} on Revolut?\n\n${coachShort()} will check and confirm it.`)) return;
    claimPaid(s.id, "revolut");
    toast(`Thanks! Waiting for ${coachShort()} to confirm`);
  });
  on("[data-share]", async () => {
    const url = inviteLink(s);
    try {
      if (navigator.share) await navigator.share({ title: `Train with ${coachShort()}`, text: `${s.first} invited you to train with ${coachShort()}. Your first session is free:`, url });
      else { await navigator.clipboard.writeText(url); toast("Invite link copied"); }
    } catch (e) { if (e?.name !== "AbortError") { $("[data-link]", root)?.select(); toast("Copy the link above to share it", "warn"); } }
  });
  on("[data-photo]", async () => {
    const photo = await pickPhoto();
    if (photo) { update((d) => (d.students.find((x) => x.id === s.id).photo = photo)); toast("Looking good — photo updated"); }
  });
  on("[data-upload-hc]", () => uploadDocument({ studentId: s.id, by: "member" }));
  on("[data-upload-doc]", () => uploadDocument({ studentId: s.id, by: "member" }));
  on("[data-doc]", (b) => viewDocument(db().documents.find((x) => x.id === b.dataset.doc), { canDelete: false }));
}

subscribe(render);
render();

// Installable web app: register the offline-capable service worker.
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
