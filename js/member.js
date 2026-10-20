// Athlete app: athletes sign in to book PT and conditioning sessions with Kyri, see their training, and pay.
import { db, update, subscribe, uid, today, iso, addDays, byId, money, classesOn, DAYS, docStatus, isBooked, bookedCount, recordText, isFighter, sessionColor } from "./store.js";
import { uploadDocument, viewDocument, DOC_LABEL } from "./docs-ui.js";
import { esc, $, $$, discChips, badge, fmtDate, fmtTime, toast, empty, athleteAvatar, pickPhoto } from "./ui.js";

const SESSION = "kyri:member";
const TABS = [["home", "Home", "⌂"], ["book", "Book", "▦"], ["training", "Training", "◉"], ["pay", "Billing", "€"]];
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
    <div class="m-logo">${logo(64)}<span>KYRI</span></div>
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
  <button class="btn btn-sm btn-ghost" data-cancel="${b.id}">Cancel</button></div>`;

// --- tabs -----------------------------------------------------------------------
function home(s) {
  const d = db();
  const mine = myBookings(s);
  const month = today().slice(0, 7);
  const thisMonth = d.attendance.filter((a) => a.studentId === s.id && a.date.startsWith(month)).length;
  const owed = d.invoices.filter((i) => i.studentId === s.id && i.status !== "paid");
  const evs = d.events.filter((ev) => ev.date >= today()).sort((a, b) => a.date.localeCompare(b.date));
  const h = docStatus(s.id);
  return `
  <section class="m-hero">
    <div class="m-hero-top"><div><p class="eyebrow">Let's work,</p><h1>${esc(s.first)}</h1></div>
      <button class="photo-edit m-photo" data-photo title="Change photo">${athleteAvatar(s)}<span>${s.photo ? "Change" : "+ Photo"}</span></button></div>
    ${s.disciplines.length ? `<div class="m-discs">${discChips(s.disciplines, { max: 9 })}</div>` : `<p class="m-goal">${esc(s.goal || "")}</p>`}
    <div class="m-profile">
      <div><small>Type</small><b>${esc(s.level)}</b></div>
      ${isFighter(s) || s.record?.w || s.record?.l ? `<div><small>Record</small><b class="record">${recordText(s)}</b></div>` : ""}
      ${s.weightClass && s.weightClass !== "—" ? `<div><small>Weight</small><b>${esc(s.weightClass)}</b></div>` : `<div><small>Goal</small><b>${esc(s.goal || "—")}</b></div>`}
    </div>
  </section>
  ${owed.length ? `<button class="m-alert" data-go="pay"><b>${owed.length} unpaid invoice${owed.length > 1 ? "s" : ""}</b><span>${money(owed.reduce((a, i) => a + i.amount, 0))} · Tap to pay</span></button>` : ""}
  ${h.status === "valid" ? "" : `<button class="m-alert ${h.status === "expiring" ? "warn" : ""}" data-upload-hc><b>Medical clearance ${DOC_LABEL[h.status].toLowerCase()}</b><span>${h.doc?.expires ? (h.status === "expired" ? "Expired " : "Expires ") + fmtDate(h.doc.expires) + " · " : ""}Tap to upload a new one</span></button>`}
  ${s.waiver ? "" : `<div class="m-alert warn"><b>Waiver needed</b><span>Please sign it before your next session.</span></div>`}
  <div class="m-stats">
    <div><strong>${thisMonth}</strong><span>sessions this month</span></div>
    <div><strong>${streakWeeks(s.id)}</strong><span>week streak</span></div>
    <div><strong>${mine.length}</strong><span>booked ahead</span></div>
  </div>
  <div class="m-title-row"><h2 class="m-title">Your bookings</h2><button class="link" data-go="book">+ Book</button></div>
  ${mine.length ? mine.slice(0, 4).map(bookingRow).join("") : `<button class="m-card m-empty" data-go="book">Nothing booked — <b>book a session →</b></button>`}
  ${evs.length ? `<h2 class="m-title">Fights & events</h2>${evs.map((ev) => {
    const reg = ev.registrations.includes(s.id), full = ev.registrations.length >= ev.capacity;
    return `<div class="m-card m-class"><div class="date-tile"><b>${new Date(ev.date + "T12:00").getDate()}</b>${new Date(ev.date + "T12:00").toLocaleString("en-US", { month: "short" })}</div>
      <div class="grow"><b>${esc(ev.title)}</b><small>${esc(ev.type)} · ${ev.price ? money(ev.price) : "Free"} · ${ev.capacity - ev.registrations.length} spots left</small></div>
      ${reg ? `<button class="btn btn-sm btn-ghost" data-unreg="${ev.id}">Going ✓</button>` : `<button class="btn btn-sm btn-primary" data-reg="${ev.id}" ${full ? "disabled" : ""}>${full ? "Full" : "Join"}</button>`}</div>`;
  }).join("")}` : ""}`;
}

function book(s) {
  const all = upcoming(7);
  const list = all.filter(({ c }) => !bookFilter || (bookFilter === "1-on-1" ? c.capacity === 1 : c.capacity > 1));
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
        ${booked ? `<button class="btn btn-sm m-booked" data-unbook="${c.id}|${date}">Booked ✓</button>` : `<button class="btn btn-sm btn-primary" data-book="${c.id}|${date}" ${full ? "disabled" : ""}>${full ? (c.capacity === 1 ? "Taken" : "Full") : "Book"}</button>`}</div>`;
    }).join("")}`).join("") : empty("No sessions match in the next 7 days.")}`;
}

function training(s) {
  const d = db();
  const hist = d.attendance.filter((a) => a.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
  const weeks = Array.from({ length: 16 }, (_, w) => {
    const end = addDays(new Date(), -w * 7), start = addDays(end, -7);
    return hist.filter((a) => a.date > iso(start) && a.date <= iso(end)).length;
  }).reverse();
  const byArt = {};
  hist.forEach((a) => { const c = byId("classes", a.classId); const k = c?.level || "Other"; byArt[k] = (byArt[k] || 0) + 1; });
  return `<h1 class="m-h1">My training</h1>
  <div class="m-card">
    <span class="eyebrow">My goal</span>
    <p class="big">${esc(s.goal || "—")}</p>
    ${s.disciplines.length ? `<div class="m-discs">${discChips(s.disciplines, { max: 9 })}</div>` : ""}
    <dl class="dl"><dt>Type</dt><dd>${esc(s.level)}</dd>${s.disciplines.length ? `<dt>Weight class</dt><dd>${esc(s.weightClass || "—")}</dd><dt>Fight record</dt><dd>${s.record?.w || s.record?.l ? `<span class="record"><b>${s.record.w}W</b> · <i>${s.record.l}L</i>${s.record.d ? ` · ${s.record.d}D` : ""}</span>` : "No fights yet"}</dd>` : ""}</dl>
  </div>
  <h2 class="m-title">Last 16 weeks</h2>
  <div class="m-card"><div class="heat m-heat">${weeks.map((n) => `<span title="${n} sessions" style="--l:${Math.min(1, n / 4)}"></span>`).join("")}</div>
    <small class="muted">Each square is a week. Brighter = more sessions.</small></div>
  ${Object.keys(byArt).length ? `<h2 class="m-title">Sessions by type</h2><div class="m-card flush"><ul class="list m-list">${Object.entries(byArt).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<li class="row"><span class="grow">${esc(k)}</span><b>${n}</b></li>`).join("")}</ul></div>` : ""}
  <h2 class="m-title">My documents</h2>
  <div class="m-card flush"><ul class="list m-list">${d.documents.filter((x) => x.studentId === s.id).map((x) => `<li class="row"><button class="row-link" data-doc="${x.id}"><span class="grow">${esc(x.type)}<small>${x.expires ? (x.expires < today() ? "Expired " : "Valid until ") + fmtDate(x.expires) : "No expiry"}</small></span><span class="muted">View</span></button></li>`).join("") || `<li class="row muted">No documents on file</li>`}</ul></div>
  <button class="btn btn-ghost full" data-upload-doc>+ Upload a document</button>
  <button class="btn btn-ghost full mt" data-photo>${s.photo ? "Change my photo" : "+ Add my photo"}</button>
  <h2 class="m-title">Recent sessions</h2>
  ${hist.length ? `<div class="m-card flush"><ul class="list m-list">${hist.slice(0, 12).map((a) => `<li class="row"><span class="grow">${esc(byId("classes", a.classId)?.name || "Session")}</span><small class="muted">${fmtDate(a.date, { month: "short", day: "numeric" })}</small></li>`).join("")}</ul></div>` : empty("No sessions yet — book your first one!")}`;
}

function pay(s) {
  const d = db();
  const plan = byId("plans", s.planId);
  const inv = d.invoices.filter((i) => i.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
  const owed = inv.filter((i) => i.status !== "paid");
  return `<h1 class="m-h1">Billing</h1>
  <div class="m-card m-plan"><span class="eyebrow">Your plan</span><b>${esc(plan?.name || "No plan")}</b>
    <span>${plan ? `${money(plan.price)} / ${plan.interval === "pack" ? "pack" : plan.interval}` : ""}</span>${badge(s.status, s.status === "active" ? "ok" : "info")}</div>
  ${owed.length ? `<h2 class="m-title">Due now</h2>${owed.map((i) => `<div class="m-card m-class"><div class="grow"><b>${esc(i.description)}</b><small>Due ${fmtDate(i.due)}${i.status === "failed" ? " · last payment failed" : ""}</small></div>
    <b>${money(i.amount)}</b><button class="btn btn-sm btn-primary" data-pay="${i.id}">Pay</button></div>`).join("")}` : `<div class="m-card m-ok">✓ You're all paid up</div>`}
  <h2 class="m-title">History</h2>
  <div class="m-card flush"><ul class="list m-list">${inv.filter((i) => i.status === "paid").slice(0, 12).map((i) => `<li class="row"><span class="grow">${esc(i.description)}<small>${fmtDate(i.date)}</small></span><b>${money(i.amount)}</b></li>`).join("") || `<li class="row muted">No payments yet</li>`}</ul></div>`;
}

// --- shell ----------------------------------------------------------------------
function render() {
  const s = me();
  if (!s) { setSession(null); root.innerHTML = login(); mountLogin(); document.title = "Sign in · KYRI"; return; }
  const body = { home, book, training, pay }[tab](s);
  const owed = db().invoices.filter((i) => i.studentId === s.id && i.status !== "paid").length;
  const scroll = window.scrollY;
  root.innerHTML = `
    <header class="m-top"><div class="brand">${logo(26)}<span>KYRI</span></div>
      <button class="m-me" data-menu aria-label="Account">${athleteAvatar(s)}</button></header>
    <main class="m-main">${body}</main>
    <nav class="m-tabs">${TABS.map(([k, l, i]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}"><span>${i}${k === "pay" && owed ? `<i class="m-dot"></i>` : ""}</span>${l}</button>`).join("")}</nav>`;
  document.title = `${TABS.find((t) => t[0] === tab)[1]} · KYRI`;
  window.scrollTo(0, scroll);
  mount(s);
}

function mount(s) {
  const on = (sel, fn) => $$(sel, root).forEach((b) => (b.onclick = () => fn(b)));
  on("[data-tab]", (b) => { tab = b.dataset.tab; render(); window.scrollTo(0, 0); });
  on("[data-go]", (b) => { tab = b.dataset.go; render(); window.scrollTo(0, 0); });
  on("[data-bf]", (b) => { bookFilter = b.dataset.bf; render(); });
  on("[data-menu]", () => { if (confirm(`Signed in as ${s.first} ${s.last}.\n\nSign out?`)) { setSession(null); render(); } });
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
    if (ev.price > 0) d.invoices.push({ id: uid("inv"), studentId: s.id, amount: ev.price, date: today(), due: ev.date, description: ev.title, status: "due" });
    toast(`You're in: ${ev.title}`);
  }));
  on("[data-unreg]", (b) => {
    if (!confirm("Cancel your registration?")) return;
    update((d) => {
      const ev = d.events.find((x) => x.id === b.dataset.unreg);
      ev.registrations = ev.registrations.filter((id) => id !== s.id);
      d.invoices = d.invoices.filter((i) => !(i.studentId === s.id && i.description === ev.title && i.status !== "paid"));
    });
  });
  on("[data-pay]", (b) => {
    const i = db().invoices.find((x) => x.id === b.dataset.pay);
    // Demo only: a production build would hand off to a payment provider here.
    if (!confirm(`Pay ${money(i.amount)} for "${i.description}" with the card on file?\n\n(Demo — no real charge.)`)) return;
    update((d) => (d.invoices.find((x) => x.id === i.id).status = "paid"));
    toast("Payment received — thank you!");
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
