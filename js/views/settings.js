import { db, update, uid, resetDemo, money } from "../store.js";
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
        update((d) => { Object.keys(d).forEach((k) => delete d[k]); Object.assign(d, data); });
        toast("Backup restored");
      } catch { toast("That file isn't a KYRI backup", "warn"); }
    };
  },
};
