import { db, update, uid, resetDemo, migrateData, money, revolutUsername, setRevolutUsername, revolutLink } from "../store.js";
import { esc, $, $$, field, readForm, toast } from "../ui.js";

export default {
  title: "Settings",
  render() {
    const a = db().academy;
    return `
    <div class="page-head"><div><p class="eyebrow">System</p><h1>Settings</h1></div></div>
    <div class="grid grid-2">
      <form class="card" data-academy>
        <header class="card-head"><h2>Business profile</h2></header>
        <div class="form-grid">
          ${field("Business name", "name", a.name, { required: true, span: 2 })}
          ${field("Coach", "owner", a.owner)}
          ${field("Contact email", "email", a.email, { type: "email" })}
          ${field("Currency", "currency", a.currency, { options: ["EUR", "USD", "GBP"] })}
          ${field("Instagram", "instagram", a.instagram || "")}
        </div>
        <button class="btn btn-primary mt">Save profile</button>
      </form>
      <form class="card" data-pay-rules>
        <header class="card-head"><h2>Monthly payments</h2></header>
        <p class="muted">Athletes show as <b>due soon</b> until this day of the month, then <b>overdue</b>.</p>
        <div class="form-grid">${field("Grace period ends on day", "graceDay", a.graceDay || 10, { type: "number", min: 1, step: 1 })}</div>
        <button class="btn btn-primary mt">Save</button>
      </form>
      <form class="card" data-revolut>
        <header class="card-head"><h2>Revolut payments</h2></header>
        <p class="muted">Athletes pay you through your Revolut.me link, then tap "I've paid". You confirm each payment on the Dashboard. Leave empty to ask for payment in person.</p>
        <label class="field"><span>Revolut username</span><input name="username" value="${esc(revolutUsername())}" placeholder="@kyri or https://revolut.me/kyri" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="rev-preview rev-err" /></label>
        <p class="small mt" id="rev-preview"></p>
        <p class="m-error small" id="rev-err" role="alert" hidden></p>
        <div class="row gap mt"><button class="btn btn-primary">Save</button><button type="button" class="btn btn-ghost" data-test-link>Test link</button></div>
      </form>
      <form class="card" data-ranking>
        <header class="card-head"><h2>Monthly ranking</h2><a class="link" href="#/rankings">Leaderboard →</a></header>
        <p class="muted">Points athletes earn each month. The #1 athlete wins the prize.</p>
        <div class="form-grid">
          ${field("Points per 1-on-1 PT session", "pt", a.ranking.pt, { type: "number", min: 0 })}
          ${field("Points per group session", "group", a.ranking.group, { type: "number", min: 0 })}
          ${field("Points per friend who signs up", "referral", a.ranking.referral, { type: "number", min: 0 })}
          ${field("Default monthly prize", "prize", a.ranking.prize, { required: true, span: 2 })}
        </div>
        <button class="btn btn-primary mt">Save ranking rules</button>
      </form>
      <section class="card">
        <header class="card-head"><h2>Achievements</h2><button class="btn btn-sm btn-ghost" data-add-ach>+ Add achievement</button></header>
        <ul class="list">${a.achievementTypes.map((t, i) => `<li class="row"><span class="grow">🏅 ${esc(t.title)}</span><b>+${t.points}</b><button class="icon-btn" data-rm-ach="${i}" title="Remove">✕</button></li>`).join("")}</ul>
        <p class="muted small">You award these from an athlete's profile or the ranking page.</p>
      </section>
      <section class="card">
        <header class="card-head"><h2>Programs</h2><button class="btn btn-sm btn-ghost" data-add-group>+ Add program</button></header>
        <ul class="list">${db().groups.map((g) => `<li class="row"><span class="dot" style="background:${esc(g.color)}"></span><span class="grow">${esc(g.name)}</span><span class="muted">${money(g.price)}/mo · ${db().students.filter((s) => s.status === "active" && (s.groupIds || []).includes(g.id)).length} athletes</span>${db().students.some((s) => (s.groupIds || []).includes(g.id)) ? "" : `<button class="icon-btn" data-rm-group="${g.id}" title="Remove">✕</button>`}</li>`).join("")}</ul>
        <p class="muted small">Edit a program's name or price from its tab on the Athletes page.</p>
      </section>
      <section class="card">
        <header class="card-head"><h2>Locations</h2></header>
        <ul class="list">${a.locations.map((l, i) => `<li class="row"><span class="grow">${esc(l)}</span>${a.locations.length > 1 ? `<button class="icon-btn" data-rm-loc="${i}">✕</button>` : ""}</li>`).join("")}</ul>
        <form class="row gap mt" data-loc><input class="input grow" name="loc" placeholder="New location name" required/><button class="btn">Add</button></form>
      </section>
      <section class="card">
        <header class="card-head"><h2>Athlete app</h2></header>
        <p class="muted">Share this link with your athletes. They sign in with their email and the password set on their profile, then book sessions and pay.</p>
        <a class="btn btn-ghost" href="member.html" target="_blank">Open athlete app ↗</a>
      </section>
      <section class="card">
        <header class="card-head"><h2>Data</h2></header>
        <p class="muted">All data is stored in this browser. Export a backup or reset to the demo data.</p>
        <div class="row gap"><button class="btn btn-ghost" data-backup>Download backup</button><label class="btn btn-ghost">Restore<input type="file" accept="application/json" data-restore hidden/></label><button class="btn btn-danger-ghost" data-reset>Reset demo data</button></div>
      </section>
    </div>`;
  },
  mount(el) {
    $("[data-academy]", el).onsubmit = (e) => { e.preventDefault(); const v = readForm(e.target); update((d) => Object.assign(d.academy, v)); toast("Profile saved"); };
    $("[data-pay-rules]", el).onsubmit = (e) => { e.preventDefault(); const v = readForm(e.target); update((d) => (d.academy.graceDay = Math.min(28, Math.max(1, v.graceDay || 10)))); toast("Saved"); };
    const rf = $("[data-revolut]", el), rp = $("#rev-preview", el), re = $("#rev-err", el);
    const norm = (s) => s.trim().replace(/^https?:\/\/(www\.)?revolut\.me\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
    const preview = () => { const u = norm(rf.username.value); rp.innerHTML = u ? `Athletes will open <b>https://revolut.me/${esc(u)}</b>` : "No username set: athletes will see \"Pay Kyri in person\"."; };
    preview();
    rf.username.oninput = () => { re.hidden = true; preview(); };
    rf.onsubmit = (e) => {
      e.preventDefault();
      const r = setRevolutUsername(rf.username.value);
      if (!r.ok) { re.textContent = r.error || "That username doesn't look right."; re.hidden = false; return; }
      toast(r.username ? "Revolut username saved" : "Revolut payments turned off");
    };
    $("[data-test-link]", el).onclick = () => {
      if (norm(rf.username.value) !== revolutUsername()) return toast("Save the username first", "warn");
      const url = revolutLink(1, "KYRI test");
      if (!url) return toast("Add a Revolut username first", "warn");
      window.open(url, "_blank", "noopener,noreferrer");
    };
    $("[data-ranking]", el).onsubmit = (e) => { e.preventDefault(); const v = readForm(e.target); update((d) => Object.assign(d.academy.ranking, { pt: v.pt || 0, group: v.group || 0, referral: v.referral || 0, prize: v.prize })); toast("Ranking rules saved"); };
    $("[data-add-ach]", el).onclick = () => {
      const title = prompt("Achievement name (e.g. First 5k run)");
      if (!title) return;
      const points = Number(prompt("Points it's worth", "20")) || 0;
      if (points > 0) update((d) => d.academy.achievementTypes.push({ title: title.trim(), points }));
    };
    $$("[data-rm-ach]", el).forEach((b) => (b.onclick = () => update((d) => d.academy.achievementTypes.splice(Number(b.dataset.rmAch), 1))));
    $("[data-add-group]", el).onclick = () => {
      const name = prompt("Program name (e.g. Kids kickboxing)");
      if (!name) return;
      const price = Number(prompt("Monthly price", "60")) || 0;
      update((d) => d.groups.push({ id: uid("gr"), name: name.trim(), price, color: "#5c6470" }));
    };
    $$("[data-rm-group]", el).forEach((b) => (b.onclick = () => update((d) => (d.groups = d.groups.filter((g) => g.id !== b.dataset.rmGroup)))));
    $("[data-loc]", el).onsubmit = (e) => { e.preventDefault(); const v = readForm(e.target); update((d) => d.academy.locations.push(v.loc)); };
    $$("[data-rm-loc]", el).forEach((b) => (b.onclick = () => update((d) => d.academy.locations.splice(Number(b.dataset.rmLoc), 1))));
    $("[data-reset]", el).onclick = () => { if (confirm("Replace all data with the demo roster?")) { resetDemo(); toast("Demo data restored"); } };
    $("[data-backup]", el).onclick = () => {
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([JSON.stringify(db(), null, 2)], { type: "application/json" })), download: "kyri-backup.json" });
      a.click(); URL.revokeObjectURL(a.href);
    };
    $("[data-restore]", el).onchange = async (e) => {
      try {
        const data = JSON.parse(await e.target.files[0].text());
        if (!data.students || !data.academy) throw new Error();
        const clean = migrateData(data); // throws on a malformed file, leaving current data untouched
        update((d) => { Object.keys(d).forEach((k) => delete d[k]); Object.assign(d, clean); });
        toast("Backup restored");
      } catch { toast("That file isn't a KYRI backup", "warn"); }
    };
  },
};
