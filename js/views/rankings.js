import { db, update, uid, today, fullName, byId, thisMonth, monthlyRanking, prizeFor, monthLabel, monthName, shiftMonth } from "../store.js";
import { esc, $, $$, athleteAvatar, badge, fmtDate, modal, field, toast, empty } from "../ui.js";

let month = thisMonth();

/** Kyri awards an achievement (from the catalog in Settings, or a custom one) to an athlete. */
export function awardAchievement(s) {
  const d = db();
  const types = d.academy.achievementTypes;
  const people = s ? null : d.students.filter((x) => x.status === "active").sort((a, b) => a.first.localeCompare(b.first));
  modal({
    title: s ? `Award ${s.first} an achievement` : "Award an achievement",
    submit: "Award",
    body: `<div class="form-grid">
      ${people ? field("Athlete", "studentId", people[0]?.id, { options: people.map((x) => [x.id, fullName(x)]), span: 2 }) : ""}
      ${field("Achievement", "type", types[0]?.title, { options: [...types.map((t) => [t.title, `${t.title} (+${t.points} pts)`]), ["__custom", "Custom…"]], span: 2 })}
      ${field("Custom name", "title", "", { placeholder: "Only for Custom…" })}
      ${field("Custom points", "points", "", { type: "number", min: 1, placeholder: "Only for Custom…" })}
      ${field("Date", "date", today(), { type: "date" })}
      ${field("Note", "note", "", { placeholder: "e.g. 140kg deadlift, -6kg" })}
    </div>`,
    onSubmit(v) {
      const t = types.find((x) => x.title === v.type);
      const title = v.type === "__custom" ? v.title : t?.title, points = v.type === "__custom" ? v.points : t?.points;
      if (!title || !points) { toast("Give the custom achievement a name and points", "warn"); return false; }
      const sid = s?.id || v.studentId;
      update((d) => d.achievements.push({ id: uid("ac"), studentId: sid, date: v.date || today(), title, points, note: v.note }));
      toast(`🏅 ${title} · +${points} pts for ${byId("students", sid).first}`);
    },
  });
}

const rules = () => db().academy.ranking;
export const pointsHelp = () => { const R = rules(); return `1-on-1 PT session <b>+${R.pt}</b> · group session <b>+${R.group}</b> · friend who signs up <b>+${R.referral}</b> · achievements <b>+their points</b>`; };

function podium(rows) {
  const top = [rows[1], rows[0], rows[2]];
  return `<div class="podium">${top.map((r, i) => r ? `<a class="pod pod-${r.rank}" href="#/students/${r.s.id}">
      ${athleteAvatar(r.s)}<span class="pod-rank">${r.rank}</span><b>${esc(fullName(r.s))}</b><small>${r.points} pts</small><span class="pod-step"></span></a>` : `<div class="pod pod-empty"><span class="pod-step"></span></div>`).join("")}</div>`;
}

function render() {
  const d = db();
  const cur = thisMonth();
  const live = month === cur;
  const rows = monthlyRanking(month);
  const leader = rows[0];
  const win = d.winners[month];
  const achs = d.achievements.filter((a) => a.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();

  return `
  <div class="page-head">
    <div><p class="eyebrow">Training</p><h1>Monthly ranking</h1><p class="muted">${pointsHelp()}. #1 each month wins your prize.</p></div>
    <div class="actions"><button class="btn btn-ghost" data-settings>Points & prize settings</button><button class="btn btn-primary" data-award>🏅 Award achievement</button></div>
  </div>
  <div class="toolbar">
    <div class="seg"><button data-m="-1">‹</button><button data-m="0" class="${live ? "on" : ""}">${esc(monthLabel(month))}</button><button data-m="1" ${live ? "disabled" : ""}>›</button></div>
    ${live ? badge(`Live · ends ${monthName(month)} ${lastDay}`, "info") : badge("Final", "neutral")}
  </div>

  <section class="card prize-card">
    <span class="prize-ico">🎁</span>
    <div class="grow"><p class="eyebrow">${live ? "This month's prize" : `${esc(monthName(month))} prize`}</p><h2>${esc(prizeFor(month))}</h2>
      ${live ? `<p class="muted">${leader ? `<b>${esc(fullName(leader.s))}</b> is leading with ${leader.points} pts${rows[1] ? `, ${leader.points - rows[1].points} ahead of ${esc(rows[1].s.first)}` : ""}.` : "Nobody has points yet this month."}</p>`
        : leader ? `<p class="muted">Winner: <b>${esc(fullName(leader.s))}</b> with ${leader.points} pts.</p>` : `<p class="muted">No winner — nobody scored.</p>`}
    </div>
    <div class="actions col">
      <button class="btn btn-ghost btn-sm" data-prize>Edit prize</button>
      ${!live && leader ? (win?.given ? `<span class="badge badge-ok">Prize given ${fmtDate(win.date, { month: "short", day: "numeric" })}</span>` : `<button class="btn btn-primary btn-sm" data-given="${leader.s.id}">Mark prize given</button>`) : ""}
    </div>
  </section>

  ${rows.length ? podium(rows) : ""}

  <div class="grid grid-2-1">
    <section class="card flush">
      <header class="card-head pad"><h2>Leaderboard</h2><small class="muted">${rows.length} athletes scored</small></header>
      ${rows.length ? `<table class="table rank-table"><thead><tr><th>#</th><th>Athlete</th><th class="right">1-on-1</th><th class="right hide-sm">Group</th><th class="right hide-sm">Achievements</th><th class="right">Friends</th><th class="right">Points</th></tr></thead><tbody>
        ${rows.map((r) => `<tr data-href="#/students/${r.s.id}" class="${r.rank <= 3 ? "top" : ""}"><td><span class="rank-no r${r.rank}">${r.rank}</span></td>
          <td><span class="who">${athleteAvatar(r.s)}<span><b>${esc(fullName(r.s))}</b><small>${esc(r.s.goal || r.s.level)}</small></span></span></td>
          <td class="right">${r.pt}</td><td class="right hide-sm">${r.group}</td><td class="right hide-sm">${r.ach.length ? `${r.ach.length} · ${r.achPts} pts` : "—"}</td>
          <td class="right">${r.refs.length || "—"}</td><td class="right"><b>${r.points}</b></td></tr>`).join("")}</tbody></table>` : empty("No points yet this month.")}
    </section>
    <div>
      <section class="card flush">
        <header class="card-head pad"><h2>Achievements</h2><button class="link" data-award>+ Award</button></header>
        ${achs.length ? `<ul class="list pad-list">${achs.map((a) => { const s = byId("students", a.studentId); return s ? `<li class="row"><span class="grow"><b>${esc(a.title)}</b><small>${esc(fullName(s))} · ${fmtDate(a.date, { month: "short", day: "numeric" })}${a.note ? " · " + esc(a.note) : ""}</small></span>${badge("+" + a.points, "ok")}<button class="icon-btn" data-del-ach="${a.id}" title="Remove">✕</button></li>` : ""; }).join("")}</ul>` : empty("No achievements awarded this month.")}
      </section>
      <section class="card flush">
        <header class="card-head pad"><h2>Friends brought in</h2></header>
        ${(() => { const refs = rows.flatMap((r) => r.refs.map((f) => ({ by: r.s, f }))); return refs.length ? `<ul class="list pad-list">${refs.map(({ by, f }) => `<li class="row"><span class="grow"><b>${esc(fullName(f))}</b><small>brought by ${esc(fullName(by))} · joined ${fmtDate(f.joined, { month: "short", day: "numeric" })}</small></span>${badge("+" + rules().referral, "ok")}</li>`).join("")}</ul>` : empty("No referrals signed up this month."); })()}
      </section>
    </div>
  </div>`;
}

export default {
  title: "Ranking",
  render,
  mount(el) {
    const re = () => { el.innerHTML = render(); this.mount(el); };
    $$("[data-m]", el).forEach((b) => (b.onclick = () => { const n = Number(b.dataset.m); month = n === 0 ? thisMonth() : shiftMonth(month, n); re(); }));
    $$("[data-award]", el).forEach((b) => (b.onclick = () => awardAchievement()));
    $("[data-settings]", el).onclick = () => (location.hash = "#/settings");
    $("[data-prize]", el).onclick = () => modal({
      title: `Prize — ${monthLabel(month)}`, submit: "Save prize",
      body: field("Prize", "prize", prizeFor(month), { required: true, placeholder: "e.g. Free PT session + KYRI t-shirt" }),
      onSubmit({ prize }) { update((d) => (d.prizes[month] = prize)); toast("Prize saved"); },
    });
    $("[data-given]", el) && ($("[data-given]", el).onclick = (e) => update((d) => (d.winners[month] = { studentId: e.target.dataset.given, given: true, date: today(), prize: prizeFor(month) })));
    $$("[data-del-ach]", el).forEach((b) => (b.onclick = () => { if (confirm("Remove this achievement and its points?")) update((d) => (d.achievements = d.achievements.filter((a) => a.id !== b.dataset.delAch))); }));
    $$("tr[data-href]", el).forEach((tr) => (tr.onclick = () => (location.hash = tr.dataset.href)));
  },
};
