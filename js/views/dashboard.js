import { db, today, iso, addDays, money, fullName, byId, classesOn, DAYS, docStatus, paymentStatus, DISCIPLINES, DISCIPLINE_NAMES, isFighter, recordText } from "../store.js";
import { esc, barChart, fmtTime, avatar, badge, progress } from "../ui.js";

export default {
  title: "Dashboard",
  render() {
    const d = db();
    const t = today();
    const active = d.students.filter((s) => s.status === "active");
    const monthStart = t.slice(0, 7);
    const collected = d.invoices.filter((i) => i.date.startsWith(monthStart) && i.status === "paid").reduce((a, i) => a + i.amount, 0);
    const outstanding = d.invoices.filter((i) => i.status !== "paid");
    const weekAgo = iso(addDays(new Date(), -7));
    const weekSessions = d.attendance.filter((a) => a.date >= weekAgo).length;
    const nextWeek = iso(addDays(new Date(), 7));
    const upcomingBookings = d.bookings.filter((b) => b.date >= t && b.date <= nextWeek);
    const openLeads = d.leads.filter((l) => !["Won", "Lost"].includes(l.stage));

    // last 14 days attendance
    const days = Array.from({ length: 14 }, (_, i) => iso(addDays(new Date(), i - 13)));
    const att = days.map((day) => ({ label: DAYS[new Date(day + "T12:00").getDay()][0], value: d.attendance.filter((a) => a.date === day).length }));

    const todays = classesOn(t);
    const fighters = active.filter(isFighter).sort((a, b) => (b.record.w - b.record.l) - (a.record.w - a.record.l)).slice(0, 6);
    const mix = DISCIPLINE_NAMES.map((n) => ({ n, c: active.filter((s) => s.disciplines.includes(n)).length })).filter((x) => x.c).sort((a, b) => b.c - a.c);
    const maxMix = Math.max(1, ...mix.map((x) => x.c));
    const upcoming = d.events.filter((e) => e.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    const recentBookings = [...d.bookings].filter((b) => b.date >= t).slice(-12).reverse();

    return `
    <div class="page-head">
      <div><p class="eyebrow">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p><h1>Let's work, ${esc(d.academy.owner.split(" ")[0])}.</h1></div>
      <div class="actions"><a class="btn btn-ghost" href="member.html" target="_blank">Athlete app ↗</a><a class="btn btn-ghost" href="#/schedule">Schedule</a><a class="btn btn-primary" href="#/students/new">+ New athlete</a></div>
    </div>

    <section class="kpis">
      <div class="kpi"><span>Active athletes</span><strong>${active.length}</strong><small>${active.filter(isFighter).length} competing fighters</small></div>
      <div class="kpi"><span>Collected this month</span><strong>${money(collected)}</strong><small>${money(outstanding.reduce((a, i) => a + i.amount, 0))} outstanding</small></div>
      <div class="kpi"><span>Sessions trained (7 days)</span><strong>${weekSessions}</strong><small>${(weekSessions / Math.max(1, active.length)).toFixed(1)} per athlete</small></div>
      <div class="kpi"><span>Bookings next 7 days</span><strong>${upcomingBookings.length}</strong><small>${openLeads.length} open leads</small></div>
    </section>

    <div class="grid grid-2-1">
      <section class="card">
        <header class="card-head"><h2>Training load — last 14 days</h2><a href="#/reports" class="link">Reports →</a></header>
        ${barChart(att, { height: 200 })}
      </section>
      <section class="card">
        <header class="card-head"><h2>Today</h2><a href="#/schedule" class="link">Schedule →</a></header>
        ${todays.length ? `<ul class="list">${todays.map((c) => {
          const booked = d.bookings.filter((b) => b.classId === c.id && b.date === t);
          const who = c.capacity === 1 ? (booked[0] ? esc(fullName(byId("students", booked[0].studentId))) : "Open slot") : `${booked.length}/${c.capacity} booked`;
          return `<li><a href="#/schedule/class/${c.id}/${t}" class="row-link"><span class="time">${fmtTime(c.start)}</span><span class="grow"><b>${esc(c.name)}</b><small>${esc(c.discipline || c.level)} · ${c.duration} min</small></span><span class="count">${who}</span></a></li>`;
        }).join("")}</ul>` : `<p class="muted">Rest day — nothing scheduled.</p>`}
      </section>
    </div>

    <section class="card">
      <header class="card-head"><h2>${new Date().toLocaleString("en-US", { month: "long" })} payments</h2><a href="#/students" class="link">Athletes →</a></header>
      ${(() => {
        const st = active.map((s) => paymentStatus(s));
        const n = (k) => st.filter((x) => x === k).length;
        const pct = (k) => (active.length ? (n(k) / active.length) * 100 : 0);
        return `<div class="paybar"><span class="ok" style="width:${pct("paid")}%"></span><span class="warn" style="width:${pct("due")}%"></span><span class="danger" style="width:${pct("overdue")}%"></span></div>
        <div class="paylegend"><span><i class="ok"></i>${n("paid")} paid</span><span><i class="warn"></i>${n("due")} due soon</span><span><i class="danger"></i>${n("overdue")} overdue</span></div>
        <div class="group-grid">${d.groups.map((g) => {
          const ms = active.filter((s) => (s.groupIds || []).includes(g.id));
          const paid = ms.filter((s) => paymentStatus(s) === "paid").length, late = ms.filter((s) => paymentStatus(s) === "overdue").length;
          return `<div class="group-mini" style="--g:${g.color}"><b>${esc(g.name)}</b><small>${paid}/${ms.length} paid${late ? ` · <em>${late} overdue</em>` : ""}</small>${progress(ms.length ? paid / ms.length : 0, "ok")}</div>`;
        }).join("")}</div>`;
      })()}
    </section>

    <div class="grid grid-3">
      <section class="card">
        <header class="card-head"><h2>Martial arts</h2><small class="muted">Active athletes</small></header>
        <div class="disc-bars">${mix.map(({ n, c }) => `<div class="disc-bar" style="--dc:${DISCIPLINES[n]}"><span>${esc(n)}</span><span class="track"><span style="width:${(c / maxMix) * 100}%"></span></span><b>${c}</b></div>`).join("")}</div>
      </section>
      <section class="card">
        <header class="card-head"><h2>Fight team</h2><a href="#/students" class="link">All →</a></header>
        ${fighters.length ? `<ul class="list">${fighters.map((s) => `<li class="row"><a href="#/students/${s.id}" class="grow">${esc(fullName(s))}<small>${esc(s.weightClass)} · ${esc(s.disciplines.join(" / "))}</small></a><span class="record">${recordText(s)}</span></li>`).join("")}</ul>` : `<p class="muted">No competing fighters yet.</p>`}
      </section>
      <section class="card">
        <header class="card-head"><h2>Needs attention</h2></header>
        <ul class="list">
          <li class="row"><a class="grow" href="#/billing">Unpaid / failed invoices</a>${badge(outstanding.length, outstanding.length ? "warn" : "ok")}</li>
          <li class="row"><a class="grow" href="#/documents">Medical clearances to renew</a>${(() => { const n = active.filter((s) => docStatus(s.id).status !== "valid").length; return badge(n, n ? "danger" : "ok"); })()}</li>
          <li class="row"><a class="grow" href="#/documents">Fight licenses expiring</a>${(() => { const n = active.filter(isFighter).filter((s) => docStatus(s.id, "Fight license").status !== "valid").length; return badge(n, n ? "warn" : "ok"); })()}</li>
          <li class="row"><span class="grow">Missing waivers</span>${badge(active.filter((s) => !s.waiver).length, "warn")}</li>
          <li class="row"><a class="grow" href="#/leads">New leads to contact</a>${badge(d.leads.filter((l) => l.stage === "New").length, "info")}</li>
        </ul>
      </section>
    </div>

    <div class="grid grid-2">
      <section class="card">
        <header class="card-head"><h2>Coming up</h2><a href="#/events" class="link">Fights & events →</a></header>
        ${upcoming.length ? `<ul class="list">${upcoming.map((e) => `<li class="row"><span class="date-tile"><b>${new Date(e.date + "T12:00").getDate()}</b>${new Date(e.date + "T12:00").toLocaleString("en-US", { month: "short" })}</span><span class="grow"><b>${esc(e.title)}</b><small>${esc(e.type)} · ${e.registrations.length}/${e.capacity}</small>${progress(e.registrations.length / e.capacity)}</span></li>`).join("")}</ul>` : `<p class="muted">No upcoming events.</p>`}
      </section>
      <section class="card">
        <header class="card-head"><h2>Upcoming bookings</h2></header>
        <div class="chips">${recentBookings.map((b) => {
          const s = byId("students", b.studentId), c = byId("classes", b.classId);
          return s && c ? `<a class="chip" href="#/students/${s.id}">${avatar(fullName(s))}<span>${esc(s.first)}<small>${esc(c.name)} · ${DAYS[new Date(b.date + "T12:00").getDay()]} ${fmtTime(c.start)}</small></span></a>` : "";
        }).join("") || `<p class="muted">No bookings yet.</p>`}</div>
      </section>
    </div>`;
  },
};
