import { db, update, uid, today, iso, addDays, fullName, byId, money, classesOn, docStatus, groupsOf, monthlyFee, paymentStatus, markPaid, DISCIPLINE_NAMES, LEVELS, WEIGHT_CLASSES, isFighter, recordText, bookedCount, isBooked, DEMO_PASSWORD, monthlyRanking, monthName, referralsOf } from "../store.js";
import { awardAchievement, pointsHelp } from "./rankings.js";
import { uploadDocument, viewDocument, DOC_TONE, DOC_LABEL } from "../docs-ui.js";
import { fmtSize } from "../files.js";
import { esc, athleteAvatar, pickPhoto, $, $$, discChips, badge, fmtDate, fmtTime, avatar, modal, field, toast, empty } from "../ui.js";

let filter = { q: "", status: "active", pay: "", group: "all", disc: "" };
const STATUS_TONE = { active: "ok", frozen: "info", cancelled: "neutral" };
export const PAY_TONE = { paid: "ok", pending: "info", due: "warn", overdue: "danger", inactive: "neutral" };
export const PAY_LABEL = { paid: "Paid", pending: "Awaiting confirmation", due: "Due soon", overdue: "Overdue", inactive: "—" };
const ordinal = (n) => n + (n % 10 > 3 || n % 10 === 0 || Math.floor(n / 10) === 1 ? "th" : ["th", "st", "nd", "rd"][n % 10]);

/** One-tap payment; members in several groups pick which group(s) this payment covers. */
export function payFlow(s) {
  const gs = groupsOf(s);
  if (gs.length <= 1) { markPaid(s.id); toast(`${s.first} marked paid for ${new Date().toLocaleString("en-US", { month: "long" })}`); return; }
  modal({
    title: `Payment — ${fullName(s)}`,
    submit: "Mark paid",
    body: `<p class="muted" style="margin-top:0">${esc(s.first)} is in ${gs.length} programs. Which does this payment cover?</p>
      ${gs.map((g) => `<label class="check pay-pick"><input type="checkbox" data-multi="1" name="groups" value="${g.id}" checked/> <span class="grow">${esc(g.name)}</span><b>${money(g.price)}</b></label>`).join("")}`,
    onSubmit({ groups = [] }) {
      if (!groups.length) { toast("Pick at least one program", "warn"); return false; }
      markPaid(s.id, groups); toast("Payment recorded");
    },
  });
}

function studentForm(s = {}) {
  const d = db();
  const mine = s.disciplines || [];
  return `<div class="form-grid">
    ${field("First name", "first", s.first, { required: true })}
    ${field("Last name", "last", s.last, { required: true })}
    ${field("Email (app login)", "email", s.email, { type: "email" })}
    ${field("Phone", "phone", s.phone)}
    <div class="field span-2"><span>Martial arts they compete in (fighters only — leave empty for fitness clients)</span><div class="group-picks">${DISCIPLINE_NAMES.map((n) => `<label class="check"><input type="checkbox" data-multi="1" name="disciplines" value="${esc(n)}" ${mine.includes(n) ? "checked" : ""}/> ${esc(n)}</label>`).join("")}</div></div>
    ${field("Client type", "level", s.level || "Fitness client", { options: LEVELS })}
    ${field("Weight class", "weightClass", s.weightClass || "—", { options: WEIGHT_CLASSES })}
    ${field("Fight record — wins", "w", s.record?.w ?? 0, { type: "number", min: 0 })}
    ${field("Losses", "l", s.record?.l ?? 0, { type: "number", min: 0 })}
    ${field("Draws", "dr", s.record?.d ?? 0, { type: "number", min: 0 })}
    ${field("Main goal", "goal", s.goal || "", { placeholder: "Weight loss, fight conditioning, cardio…" })}
    ${field("Plan", "planId", s.planId, { options: d.plans.map((p) => [p.id, `${p.name} — ${money(p.price)}/${p.interval}`]) })}
    ${field("Status", "status", s.status || "active", { options: ["active", "frozen", "cancelled"] })}
    ${field("App password", "password", s.password || DEMO_PASSWORD, { required: true })}
    ${field("Joined", "joined", s.joined || today(), { type: "date" })}
    ${field("Brought in by (referral)", "referredBy", s.referredBy || "", { options: [["", "Nobody"], ...d.students.filter((x) => x.id !== s.id).sort((a, b) => a.first.localeCompare(b.first)).map((x) => [x.id, fullName(x)])], span: 2 })}
    <div class="field span-2"><span>Programs (monthly billing)</span><div class="group-picks">${d.groups.map((g) => `<label class="check"><input type="checkbox" data-multi="1" name="groupIds" value="${g.id}" ${(s.groupIds || []).includes(g.id) ? "checked" : ""}/> ${esc(g.name)} <small class="muted">${money(g.price)}/mo</small></label>`).join("")}</div></div>
    ${field("Coach notes", "notes", s.notes, { type: "textarea", span: 2 })}
    ${field("Liability waiver signed", "waiver", s.waiver, { type: "checkbox" })}
  </div>`;
}

export function openStudentForm(s) {
  const isNew = !s;
  modal({
    title: isNew ? "New athlete" : `Edit ${fullName(s)}`,
    body: studentForm(s),
    wide: true,
    submit: isNew ? "Add athlete" : "Save changes",
    danger: isNew ? null : { label: "Delete athlete", confirm: "Delete this athlete and their history?", action: () => {
      update((d) => { d.students = d.students.filter((x) => x.id !== s.id); d.attendance = d.attendance.filter((a) => a.studentId !== s.id); d.bookings = d.bookings.filter((b) => b.studentId !== s.id); });
      location.hash = "#/students"; toast("Athlete deleted");
    } },
    onSubmit(v) {
      v.groupIds ||= [];
      v.disciplines ||= [];
      if (!v.groupIds.length) { toast("Pick at least one program", "warn"); return false; }
      v.record = { w: v.w || 0, l: v.l || 0, d: v.dr || 0 };
      delete v.w; delete v.l; delete v.dr;
      update((d) => {
        if (isNew) {
          const id = uid("s");
          d.students.push({ id, location: d.academy.locations[0], ...v });
          setTimeout(() => (location.hash = `#/students/${id}`));
        } else Object.assign(d.students.find((x) => x.id === s.id), v);
      });
      toast(isNew ? "Athlete added" : "Saved");
    },
  });
}

function list() {
  const d = db();
  const q = filter.q.toLowerCase();
  const group = d.groups.find((g) => g.id === filter.group);
  const inGroup = (st) => (filter.group === "all" || (st.groupIds || []).includes(filter.group)) && (!filter.disc || (filter.disc === "none" ? !st.disciplines.length : filter.disc === "fighters" ? st.disciplines.length > 0 : st.disciplines.includes(filter.disc)));
  const base = d.students.filter((st) => inGroup(st) && (!filter.status || st.status === filter.status));
  const withPay = base.map((st) => ({ st, pay: paymentStatus(st) }));
  const rows = withPay.filter(({ st, pay }) => (!filter.pay || pay === filter.pay) && (!q || `${st.first} ${st.last} ${st.email} ${st.phone}`.toLowerCase().includes(q)))
    .sort((a, b) => ["overdue", "pending", "due", "paid", "inactive"].indexOf(a.pay) - ["overdue", "pending", "due", "paid", "inactive"].indexOf(b.pay) || a.st.last.localeCompare(b.st.last));
  const payCount = (k) => withPay.filter((x) => x.pay === k).length;
  const groupStats = (gid) => {
    const ms = d.students.filter((st) => st.status === "active" && (gid === "all" || (st.groupIds || []).includes(gid)));
    return { n: ms.length, late: ms.filter((st) => paymentStatus(st) === "overdue").length, due: ms.filter((st) => paymentStatus(st) === "due").length };
  };
  const all = groupStats("all");
  const tab = (id, name, sub, st, color) => `<button class="gtab ${filter.group === id ? "on" : ""}" data-group="${id}" style="--g:${color}">
      <span class="gtab-name">${esc(name)}</span><span class="gtab-sub">${sub}</span>
      ${st.late ? `<span class="gtab-badge late" title="Overdue">${st.late}</span>` : st.due ? `<span class="gtab-badge" title="Due soon">${st.due}</span>` : ""}</button>`;
  const month = new Date().toLocaleString("en-US", { month: "long" });
  const late = payCount("overdue");
  const grace = ordinal(d.academy.graceDay || 10);

  return `
  <div class="page-head">
    <div><p class="eyebrow">Training</p><h1>Athletes</h1></div>
    <div class="actions"><button class="btn btn-ghost" data-export>Export CSV</button><button class="btn btn-primary" data-new>+ New athlete</button></div>
  </div>
  <nav class="gtabs">
    ${tab("all", "All athletes", `${all.n} active`, all, "var(--ink)")}
    ${d.groups.map((g) => { const st = groupStats(g.id); return tab(g.id, g.name, `${st.n} · ${money(g.price)}/mo`, st, g.color); }).join("")}
  </nav>
  ${group ? `<section class="card group-head" style="--g:${group.color}">
    <span class="group-mark">${esc(group.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2))}</span>
    <div class="grow"><h2>${esc(group.name)}</h2><p class="muted">${groupStats(group.id).n} active athletes · ${money(group.price)} per month</p></div>
    <button class="btn btn-sm btn-ghost" data-edit-price>Edit price</button>
  </section>` : ""}
  ${late ? `<div class="banner banner-danger"><b>${late} athlete${late === 1 ? "" : "s"} overdue</b> for ${month}${group ? ` in ${esc(group.name)}` : ""} — payment was due by the ${grace}.</div>`
    : payCount("due") ? `<div class="banner banner-warn"><b>${payCount("due")} still to pay</b> for ${month} — grace period runs until the ${grace}.</div>`
    : base.length ? `<div class="banner banner-ok"><b>Everyone is paid up</b> for ${month}. 🎉</div>` : ""}
  <div class="toolbar">
    <input class="input" type="search" placeholder="Search name or phone…" value="${esc(filter.q)}" data-q />
    <div class="seg">${[["", "All"], ["paid", "Paid"], ["pending", "Awaiting"], ["due", "Due soon"], ["overdue", "Overdue"]].map(([k, l]) => `<button data-pay="${k}" class="${filter.pay === k ? "on" : ""}">${l}${k ? ` <small>${payCount(k)}</small>` : ""}</button>`).join("")}</div>
    <select class="input" data-disc><option value="">Everyone</option><option value="fighters" ${filter.disc === "fighters" ? "selected" : ""}>Martial artists</option><option value="none" ${filter.disc === "none" ? "selected" : ""}>Fitness clients</option>${DISCIPLINE_NAMES.map((n) => `<option ${filter.disc === n ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
    <select class="input" data-status>${[["active", "Active"], ["frozen", "Frozen"], ["cancelled", "Cancelled"], ["", "Any status"]].map(([k, l]) => `<option value="${k}" ${filter.status === k ? "selected" : ""}>${l}</option>`).join("")}</select>
  </div>
  <div class="card flush">
    ${rows.length ? `<table class="table">
      <thead><tr><th>Athlete</th><th class="hide-sm">Martial art</th><th class="hide-sm">Type / goal</th><th>${esc(month)}</th><th></th></tr></thead>
      <tbody>${rows.map(({ st, pay }) => `<tr data-href="#/students/${st.id}">
          <td><span class="who">${athleteAvatar(st)}<span><b>${esc(fullName(st))}</b><small>${esc(st.phone || st.email)}</small></span></span></td>
          <td class="hide-sm">${discChips(st.disciplines)}</td>
          <td class="hide-sm"><b class="small">${esc(st.level)}</b>${isFighter(st) ? `<small><span class="record">${recordText(st)}</span> · ${esc(st.goal || "")}</small>` : `<small>${esc(st.goal || "")}</small>`}</td>
          <td>${st.status === "active" ? badge(PAY_LABEL[pay], PAY_TONE[pay]) : badge(st.status, STATUS_TONE[st.status])}</td>
          <td class="right">${st.status === "active" && pay !== "paid" ? `<button class="btn btn-sm btn-primary" data-paid="${st.id}">Mark paid · ${money(monthlyFee(st))}</button>` : ""}</td></tr>`).join("")}</tbody></table>` : empty("No athletes match these filters.")}
  </div>`;
}

function editPrice(group) {
  modal({
    title: `Program — ${group.name}`,
    body: `<div class="form-grid">${field("Program name", "name", group.name, { required: true, span: 2 })}${field("Monthly price", "price", group.price, { type: "number", min: 0, step: "0.01" })}${field("Color", "color", group.color, { type: "color" })}</div>`,
    onSubmit(v) { update((d) => Object.assign(d.groups.find((g) => g.id === group.id), v)); toast("Program updated"); },
  });
}

function upcomingFor(s, days = 14) {
  const d = db();
  return d.bookings.filter((b) => b.studentId === s.id && b.date >= today() && b.date <= iso(addDays(new Date(), days)))
    .map((b) => ({ b, c: byId("classes", b.classId) })).filter((x) => x.c)
    .sort((x, y) => (x.b.date + x.c.start).localeCompare(y.b.date + y.c.start));
}

function detail(id) {
  const d = db();
  const s = byId("students", id);
  if (!s) return empty("Athlete not found.");
  const plan = byId("plans", s.planId);
  const hist = d.attendance.filter((a) => a.studentId === id).sort((a, b) => b.date.localeCompare(a.date));
  const inv = d.invoices.filter((i) => i.studentId === id).sort((a, b) => b.date.localeCompare(a.date));
  const evs = d.events.filter((ev) => ev.registrations.includes(id));
  const docs = d.documents.filter((x) => x.studentId === id).sort((a, b) => b.uploaded.localeCompare(a.uploaded));
  const up = upcomingFor(s);
  // 12-week heat strip
  const weeks = Array.from({ length: 12 }, (_, w) => {
    const end = new Date(); end.setDate(end.getDate() - w * 7);
    const start = new Date(end); start.setDate(start.getDate() - 7);
    return hist.filter((a) => a.date > iso(start) && a.date <= iso(end)).length;
  }).reverse();
  const pay = paymentStatus(s);
  const unpaid = s.status === "active" && pay !== "paid";

  return `
  <a href="#/students" class="back">← Athletes</a>
  <div class="profile-head card">
    <button class="photo-edit" data-photo title="Change photo">${athleteAvatar(s)}<span>${s.photo ? "Change" : "+ Photo"}</span></button>
    <div class="grow">
      <h1>${esc(fullName(s))}</h1>
      <p class="muted">${groupsOf(s).map((g) => esc(g.name)).join(" + ")} · Training since ${fmtDate(s.joined)}</p>
      <div class="row gap">${discChips(s.disciplines, { max: 9, none: "" })} ${badge(s.status, STATUS_TONE[s.status])} ${s.status === "active" ? badge(new Date().toLocaleString("en-US", { month: "long" }) + ": " + PAY_LABEL[pay], PAY_TONE[pay]) : ""} ${s.waiver ? badge("Waiver on file", "ok") : badge("Waiver missing", "warn")} ${(() => { const h = docStatus(s.id); return badge("Medical: " + DOC_LABEL[h.status].toLowerCase(), DOC_TONE[h.status]); })()}</div>
    </div>
    <div class="actions col">
      ${unpaid ? `<button class="btn btn-primary" data-paid="${s.id}">Mark paid · ${money(monthlyFee(s))}</button>` : ""}
      <button class="btn ${unpaid ? "btn-ghost" : "btn-primary"}" data-book>Book a session</button>
      <button class="btn btn-ghost" data-edit>Edit</button>
    </div>
  </div>

  <div class="grid grid-3">
    <section class="card">
      <header class="card-head"><h2>${s.disciplines.length ? "Fighter profile" : "Client profile"}</h2></header>
      <p class="big">${esc(s.goal || s.level)}</p>
      <dl class="dl"><dt>Type</dt><dd>${esc(s.level)}</dd>${s.disciplines.length ? `<dt>Martial arts</dt><dd>${esc(s.disciplines.join(", "))}</dd><dt>Weight class</dt><dd>${esc(s.weightClass || "—")}</dd>
        <dt>Record</dt><dd>${s.record?.w || s.record?.l || s.record?.d ? `<span class="record"><b>${s.record.w}W</b> · <i>${s.record.l}L</i>${s.record.d ? ` · ${s.record.d}D` : ""}</span>` : "No fights yet"}</dd>` : ""}</dl>
    </section>
    <section class="card">
      <header class="card-head"><h2>Plan</h2></header>
      <p class="big">${esc(plan?.name || "No plan")}</p>
      <p class="muted">${plan ? `${money(plan.price)} / ${plan.interval}` : ""}</p>
      <dl class="dl"><dt>Email</dt><dd>${esc(s.email || "—")}</dd><dt>Phone</dt><dd>${esc(s.phone || "—")}</dd></dl>
    </section>
    <section class="card">
      <header class="card-head"><h2>Training consistency</h2></header>
      <p class="big">${hist.length} <small class="muted">sessions</small></p>
      <div class="heat">${weeks.map((n) => `<span title="${n} sessions" style="--l:${Math.min(1, n / 4)}"></span>`).join("")}</div>
      <p class="muted small">Last 12 weeks · last session ${fmtDate(hist[0]?.date)}</p>
    </section>
  </div>

  ${(() => {
    const rows = monthlyRanking(), me = rows.find((r) => r.s.id === s.id);
    const achs = d.achievements.filter((a) => a.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
    const refs = referralsOf(s.id);
    return `<section class="card">
      <header class="card-head"><h2>${esc(monthName(today().slice(0, 7)))} ranking</h2><div class="row gap"><a class="link" href="#/rankings">Leaderboard →</a><button class="btn btn-sm btn-primary" data-award>🏅 Award achievement</button></div></header>
      <div class="kpis kpis-4-sm">
        <div class="kpi"><span>Position</span><strong>${me ? "#" + me.rank : "—"}</strong><small>of ${rows.length}</small></div>
        <div class="kpi"><span>Points</span><strong>${me?.points || 0}</strong><small>${me ? `${me.pt} PT · ${me.group} group` : "no sessions yet"}</small></div>
        <div class="kpi"><span>Achievements</span><strong>${me?.ach.length || 0}</strong><small>${me?.achPts || 0} pts this month</small></div>
        <div class="kpi"><span>Friends brought</span><strong>${refs.length}</strong><small>${me?.refs.length || 0} this month</small></div>
      </div>
      ${achs.length || refs.length ? `<div class="grid grid-2"><ul class="list">${achs.slice(0, 6).map((a) => `<li class="row"><span class="grow">🏅 ${esc(a.title)}<small>${fmtDate(a.date)}${a.note ? " · " + esc(a.note) : ""}</small></span>${badge("+" + a.points, "ok")}</li>`).join("") || `<li class="row muted">No achievements yet</li>`}</ul>
        <ul class="list">${refs.map((f) => `<li class="row">${athleteAvatar(f)}<a class="grow" href="#/students/${f.id}">${esc(fullName(f))}<small>joined ${fmtDate(f.joined)}</small></a></li>`).join("") || `<li class="row muted">Hasn't brought a friend yet</li>`}</ul></div>` : ""}
      <p class="muted small">${pointsHelp()}</p>
    </section>`;
  })()}

  <div class="grid grid-2">
    <section class="card flush">
      <header class="card-head pad"><h2>Upcoming bookings</h2><a class="link" href="#/schedule">Schedule →</a></header>
      ${up.length ? `<table class="table"><tbody>${up.map(({ b, c }) => `<tr><td>${fmtDate(b.date, { weekday: "short", month: "short", day: "numeric" })}</td><td><b>${esc(c.name)}</b><small>${fmtTime(c.start)} · ${c.duration} min</small></td><td class="right"><button class="btn btn-sm btn-ghost" data-unbook="${b.id}">Cancel</button></td></tr>`).join("")}</tbody></table>` : empty("Nothing booked in the next 2 weeks.")}
    </section>
    <section class="card flush">
      <header class="card-head pad"><h2>Session history</h2></header>
      ${hist.length ? `<table class="table"><tbody>${hist.slice(0, 12).map((a) => `<tr><td>${fmtDate(a.date)}</td><td>${esc(byId("classes", a.classId)?.name || "Session")}</td><td class="right"><button class="icon-btn" data-del-att="${a.id}" title="Remove">✕</button></td></tr>`).join("")}</tbody></table>` : empty("No sessions yet.")}
    </section>
  </div>
  <div class="grid grid-2">
    <section class="card flush">
      <header class="card-head pad"><h2>Invoices</h2><a class="link" href="#/billing">Billing →</a></header>
      ${inv.length ? `<table class="table"><tbody>${inv.slice(0, 10).map((i) => `<tr><td>${fmtDate(i.date)}</td><td>${esc(i.description)}</td><td>${money(i.amount)}</td><td>${badge(i.status === "pending" ? "awaiting confirmation" : i.status, i.status === "paid" ? "ok" : i.status === "pending" ? "info" : "warn")}</td></tr>`).join("")}</tbody></table>` : empty("No invoices.")}
    </section>
    <section class="card flush">
      <header class="card-head pad"><h2>Documents</h2><button class="btn btn-sm btn-primary" data-doc-upload>+ Upload</button></header>
      ${docs.length ? `<table class="table"><tbody>${docs.map((x) => {
        const exp = x.expires && x.expires < today() ? badge("expired", "danger") : x.expires ? `<small>valid until ${fmtDate(x.expires)}</small>` : "<small>no expiry</small>";
        return `<tr class="clickable" data-doc="${x.id}"><td><b>${esc(x.type)}</b><small>${esc(x.name)} · ${fmtSize(x.size)}</small></td><td class="right">${exp}</td></tr>`;
      }).join("")}</tbody></table>` : empty("No documents yet — upload a medical clearance or waiver.")}
    </section>
  </div>
  ${evs.length ? `<section class="card"><header class="card-head"><h2>Fights & events</h2></header><ul class="list">${evs.map((ev) => `<li class="row"><span class="grow">${esc(ev.title)}<small>${esc(ev.type)}</small></span>${fmtDate(ev.date)}</li>`).join("")}</ul></section>` : ""}
  ${s.notes ? `<section class="card"><header class="card-head"><h2>Coach notes</h2></header><p>${esc(s.notes)}</p></section>` : ""}`;
}

/** Coach books a session for an athlete: any session in the next 7 days with a free spot. */
function bookFor(s) {
  const opts = [];
  const now = new Date().toTimeString().slice(0, 5);
  for (let i = 0; i < 7; i++) {
    const date = iso(addDays(new Date(), i));
    for (const c of classesOn(date)) {
      if (i === 0 && c.start <= now) continue;
      if (isBooked(s.id, c.id, date) || bookedCount(c.id, date) >= c.capacity) continue;
      opts.push([`${c.id}|${date}`, `${fmtDate(date, { weekday: "short", month: "short", day: "numeric" })} · ${fmtTime(c.start)} — ${c.name}`]);
    }
  }
  if (!opts.length) return toast("No open sessions in the next 7 days", "warn");
  modal({
    title: `Book ${s.first}`, submit: "Book",
    body: field("Session", "slot", opts[0][0], { options: opts }),
    onSubmit({ slot }) {
      const [classId, date] = slot.split("|");
      update((d) => d.bookings.push({ id: uid("bk"), studentId: s.id, classId, date }));
      toast("Session booked");
    },
  });
}

function downloadCSV() {
  const d = db();
  const head = ["First", "Last", "Email", "Phone", "Martial arts", "Level", "Weight class", "Record", "Status", "Plan", "Joined"];
  const rows = d.students.map((s) => [s.first, s.last, s.email, s.phone, s.disciplines.join(" / "), s.level, s.weightClass, recordText(s), s.status, byId("plans", s.planId)?.name || "", s.joined]);
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "athletes.csv" });
  a.click(); URL.revokeObjectURL(a.href);
}

export default {
  title: "Athletes",
  render([id]) {
    if (id === "new") { setTimeout(() => { history.replaceState(null, "", "#/students"); openStudentForm(); }); return list(); }
    return id ? detail(id) : list();
  },
  mount(el, [id]) {
    if (id && id !== "new") {
      const s = byId("students", id);
      if (!s) return;
      $("[data-edit]", el).onclick = () => openStudentForm(s);
      $("[data-paid]", el) && ($("[data-paid]", el).onclick = () => payFlow(s));
      $("[data-doc-upload]", el).onclick = () => uploadDocument({ studentId: id });
      $$("[data-doc]", el).forEach((tr) => (tr.onclick = () => viewDocument(db().documents.find((x) => x.id === tr.dataset.doc))));
      $("[data-book]", el).onclick = () => bookFor(s);
      $("[data-award]", el).onclick = () => awardAchievement(s);
      $("[data-photo]", el).onclick = async () => {
        if (s.photo && !confirm(`Replace ${s.first}'s photo?\n\n(Cancel to keep it.)`)) return;
        const photo = await pickPhoto();
        if (photo) { update((d) => (d.students.find((x) => x.id === s.id).photo = photo)); toast("Photo updated"); }
      };
      $$("[data-unbook]", el).forEach((b) => (b.onclick = () => { update((d) => (d.bookings = d.bookings.filter((x) => x.id !== b.dataset.unbook))); toast("Booking cancelled", "warn"); }));
      $$("[data-del-att]", el).forEach((b) => (b.onclick = () => update((d) => (d.attendance = d.attendance.filter((a) => a.id !== b.dataset.delAtt)))));
      return;
    }
    $("[data-new]", el).onclick = () => openStudentForm();
    $("[data-export]", el).onclick = downloadCSV;
    $("[data-status]", el).onchange = (e) => { filter.status = e.target.value; this.refresh(el); };
    $("[data-disc]", el).onchange = (e) => { filter.disc = e.target.value; this.refresh(el); };
    $$("[data-pay]", el).forEach((b) => (b.onclick = () => { filter.pay = b.dataset.pay; this.refresh(el); }));
    $$("[data-group]", el).forEach((b) => (b.onclick = () => { filter.group = b.dataset.group; this.refresh(el); }));
    $("[data-edit-price]", el) && ($("[data-edit-price]", el).onclick = () => editPrice(db().groups.find((g) => g.id === filter.group)));
    const q = $("[data-q]", el);
    q.oninput = () => { filter.q = q.value; this.refresh(el, true); };
    $$("[data-paid]", el).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); payFlow(byId("students", b.dataset.paid)); }));
    $$("tr[data-href]", el).forEach((tr) => (tr.onclick = () => (location.hash = tr.dataset.href)));
  },
  refresh(el, keepFocus) {
    el.innerHTML = list();
    this.mount(el, []);
    if (keepFocus) { const q = $("[data-q]", el); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  },
};
