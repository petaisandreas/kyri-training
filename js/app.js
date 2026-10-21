// App shell: sidebar navigation + hash router. Each view exports { title, render(params), mount?(el, params) }.
import { db, subscribe, client, KEYS } from "./store.js";
import { esc, $ } from "./ui.js";
import dashboard from "./views/dashboard.js";
import students from "./views/students.js";
import schedule from "./views/schedule.js";
import billing from "./views/billing.js";
import leads from "./views/leads.js";
import reports from "./views/reports.js";
import events from "./views/events.js";
import settings from "./views/settings.js";
import documents from "./views/documents.js";
import rankings from "./views/rankings.js";

const NAV = [
  ["Overview", [["dashboard", "Dashboard", "◧"]]],
  ["Training", [["students", "Athletes", "◉"], ["schedule", "Schedule & bookings", "▦"], ["rankings", "Monthly ranking", "★"], ["events", "Fights & events", "✦"], ["documents", "Documents", "▤"]]],
  ["Business", [["billing", "Billing", "€"], ["leads", "Leads & follow-ups", "➚"], ["reports", "Reports", "◔"]]],
  ["System", [["settings", "Settings", "⚙"]]],
];
const VIEWS = { dashboard, students, schedule, billing, leads, reports, events, settings, documents, rankings };

const main = $("#view");
let current = { name: "", params: [] };

function parseHash() {
  const [name = "dashboard", ...params] = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { name: VIEWS[name] ? name : "dashboard", params: params.map(decodeURIComponent) };
}

function renderNav() {
  $("#nav").innerHTML = NAV.map(([group, items]) => `
    <div class="nav-group"><div class="nav-title">${group}</div>
      ${items.map(([id, label, icon]) => `<a href="#/${id}" class="nav-link ${current.name === id ? "active" : ""}"><span class="nav-ico">${icon}</span>${label}</a>`).join("")}
    </div>`).join("");
  $("#academy-name").textContent = db().academy.name;
  const initials = String(db().academy.owner || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || client.coach.initials;
  $("#me-avatar").textContent = initials;
}

function render() {
  const view = VIEWS[current.name];
  const scroll = main.scrollTop;
  main.innerHTML = view.render(current.params);
  view.mount?.(main, current.params);
  main.scrollTop = scroll;
  document.title = `${view.title} · ${client.coachAppName}`;
  renderNav();
}

function route() {
  const next = parseHash();
  const changed = next.name !== current.name || next.params.join("/") !== current.params.join("/");
  current = next;
  render();
  if (changed) main.scrollTop = 0;
  document.body.classList.remove("nav-open");
}

window.addEventListener("hashchange", route);
subscribe(() => render());
$("#menu-btn").addEventListener("click", () => document.body.classList.toggle("nav-open"));
$("#scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));

// Global search across athletes and leads.
const search = $("#global-search");
const results = $("#search-results");
search.addEventListener("input", () => {
  const q = search.value.trim().toLowerCase();
  if (!q) { results.hidden = true; return; }
  const d = db();
  const hits = [
    ...d.students.filter((s) => `${s.first} ${s.last} ${s.email}`.toLowerCase().includes(q)).slice(0, 6).map((s) => [`#/students/${s.id}`, `${s.first} ${s.last}`, s.disciplines.join(" · ") || "Athlete"]),
    ...d.leads.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 4).map((l) => [`#/leads`, l.name, "Lead"]),
  ];
  results.innerHTML = hits.length ? hits.map(([h, t, k]) => `<a href="${esc(h)}"><span>${esc(t)}</span><small>${esc(k)}</small></a>`).join("") : `<div class="muted pad">No matches</div>`;
  results.hidden = false;
});
results.addEventListener("click", () => { results.hidden = true; search.value = ""; });
document.addEventListener("click", (e) => { if (!e.target.closest(".search")) results.hidden = true; });
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
});

// Theme toggle (persisted per viewer).
const themeBtn = $("#theme-btn");
themeBtn.addEventListener("click", () => {
  const cur = document.documentElement.dataset.theme || "dark";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEYS.theme, next); } catch {}
});

route();
export const rerender = render;

// Installable web app: register the offline-capable service worker.
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
