// Data layer: a single JSON document in localStorage, seeded with a demo roster of fighters.
const KEY = "kyri:v1";

/** Martial arts an athlete can train. Colors are used for discipline chips and schedule blocks. */
export const DISCIPLINES = {
  "Muay Thai": "#d64545", Boxing: "#c9a227", Kickboxing: "#e07b2e", MMA: "#8a8f98",
  BJJ: "#3d6fd6", Wrestling: "#3c9a6b", Judo: "#6b4fc4", Karate: "#b8b8b8", Taekwondo: "#2aa5b8",
};
export const DISCIPLINE_NAMES = Object.keys(DISCIPLINES);
export const LEVELS = ["Beginner", "Intermediate", "Amateur fighter", "Pro fighter"];
export const WEIGHT_CLASSES = ["—", "Flyweight", "Bantamweight", "Featherweight", "Lightweight", "Welterweight", "Middleweight", "Light heavyweight", "Heavyweight"];
/** Session types on the timetable. */
export const SESSION_TYPES = ["Striking", "Grappling", "MMA", "Conditioning", "Sparring", "1-on-1", "Open gym"];
export const LEAD_STAGES = ["New", "Contacted", "Trial booked", "Trial done", "Won", "Lost"];
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9);
export const iso = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const today = () => iso(new Date());
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// --- seed -------------------------------------------------------------------
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export const DEMO_PASSWORD = "train123";

function seed() {
  const r = rng(42);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const now = new Date();

  const staff = [
    { id: "st_1", name: "Kyriakos Nicolaou", role: "Head Coach", email: "kyri@trainwithkyri.com", rate: 0, color: "#f5f5f5" },
  ];

  const plans = [
    { id: "pl_1", name: "Fight Team Unlimited", price: 120, interval: "month" },
    { id: "pl_2", name: "Group Classes 2x / week", price: 70, interval: "month" },
    { id: "pl_3", name: "1-on-1 PT — 10 sessions", price: 400, interval: "pack" },
    { id: "pl_4", name: "1-on-1 PT — Monthly (8)", price: 320, interval: "month" },
    { id: "pl_5", name: "Fight Camp (8 weeks)", price: 480, interval: "pack" },
  ];

  const classes = [];
  const addClass = (name, days, start, dur, type, capacity, discipline = "") =>
    days.forEach((day) => classes.push({ id: uid("cl"), name, day, start, duration: dur, instructorId: "st_1", level: type, discipline, capacity, location: "Main Gym" }));
  addClass("1-on-1 Session", [1, 2, 3, 4, 5], "07:00", 60, "1-on-1", 1);
  addClass("1-on-1 Session", [1, 2, 3, 4, 5], "08:00", 60, "1-on-1", 1);
  addClass("Fighter S&C", [1, 3, 5], "09:30", 60, "Conditioning", 10);
  addClass("1-on-1 Session", [2, 4], "12:00", 60, "1-on-1", 1);
  addClass("1-on-1 Session", [1, 2, 3, 4], "16:00", 60, "1-on-1", 1);
  addClass("Muay Thai Technique", [1, 3], "18:00", 75, "Striking", 14, "Muay Thai");
  addClass("Boxing Pads & Footwork", [2, 4], "18:00", 60, "Striking", 14, "Boxing");
  addClass("MMA Fight Prep", [1, 3], "19:30", 90, "MMA", 12, "MMA");
  addClass("Wrestling for MMA", [2, 4], "19:15", 60, "Grappling", 12, "Wrestling");
  addClass("Fight Team Sparring", [5], "18:30", 90, "Sparring", 16);
  addClass("Saturday Open Gym", [6], "10:00", 120, "Open gym", 20);

  const first = ["Andreas", "Maria", "Nikos", "Elena", "Christos", "Sofia", "Giorgos", "Katerina", "Marios", "Eleni", "Panayiotis", "Despina", "Stelios", "Anna", "Michalis", "Christina", "Loizos", "Ioanna", "Savvas", "Georgia", "Antonis", "Rafaela", "Kostas", "Natalia", "Pavlos", "Myria", "Demetris", "Chloe", "Alex", "Lena", "Omar", "Ivan"];
  const last = ["Georgiou", "Christodoulou", "Ioannou", "Constantinou", "Charalambous", "Michael", "Nicolaou", "Panayiotou", "Demetriou", "Kyriacou", "Savva", "Antoniou", "Hadjigeorgiou", "Petrou", "Stylianou", "Andreou"];
  const combos = [["Muay Thai"], ["Boxing"], ["MMA", "BJJ", "Wrestling"], ["Muay Thai", "Boxing"], ["Kickboxing"], ["MMA", "Muay Thai"], ["BJJ"], ["Boxing"], ["Judo", "MMA"], ["Muay Thai"], ["Kickboxing", "Boxing"], ["Wrestling"], ["Karate"], ["Taekwondo", "Kickboxing"]];
  const students = [];
  for (let i = 0; i < 34; i++) {
    const joined = addDays(now, -Math.floor(20 + r() * 1100));
    const status = r() < 0.86 ? "active" : r() < 0.5 ? "frozen" : "cancelled";
    const fn = first[i % first.length], ln = pick(last);
    const level = LEVELS[Math.min(3, Math.floor(r() * r() * 4.6))];
    const fighter = level.includes("fighter");
    const w = fighter ? Math.floor(r() * (level === "Pro fighter" ? 18 : 9)) : 0;
    students.push({
      id: "s_" + (i + 1),
      first: fn, last: ln,
      email: `${fn}.${ln}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
      phone: "+357 99 " + String(100000 + Math.floor(r() * 899999)),
      disciplines: combos[i % combos.length],
      level,
      weightClass: fighter ? pick(WEIGHT_CLASSES.slice(1)) : "—",
      record: { w, l: fighter ? Math.floor(r() * (w / 2 + 2)) : 0, d: fighter && r() < 0.3 ? 1 : 0 },
      goal: pick(["Compete", "Fitness & weight loss", "Self-defence", "Fight camp", "Technique", "Strength"]),
      joined: iso(joined),
      status,
      planId: fighter ? pick(["pl_1", "pl_1", "pl_5"]) : pick(["pl_2", "pl_2", "pl_3", "pl_4"]),
      waiver: r() < 0.9,
      password: DEMO_PASSWORD,
      notes: "",
      location: "Main Gym",
    });
  }

  // Attendance for the last 120 days (1-on-1 slots get one athlete each)
  const attendance = [];
  const bookings = [];
  for (let d = 120; d >= 1; d--) {
    const date = addDays(now, -d);
    for (const c of classes.filter((c) => c.day === date.getDay())) {
      const pool = students.filter((s) => s.status === "active" && (!c.discipline || s.disciplines.includes(c.discipline) || c.level === "MMA"));
      if (!pool.length) continue;
      const n = c.capacity === 1 ? (r() < 0.8 ? 1 : 0) : Math.min(c.capacity, Math.floor(pool.length * (0.25 + r() * 0.35)));
      const used = new Set();
      for (let k = 0; k < n * 2 && used.size < n; k++) {
        const s = pick(pool);
        if (used.has(s.id)) continue;
        used.add(s.id);
        attendance.push({ id: uid("at"), studentId: s.id, classId: c.id, date: iso(date) });
      }
    }
  }
  // A few bookings already made for the coming week.
  for (let d = 0; d < 7; d++) {
    const date = addDays(now, d);
    for (const c of classes.filter((c) => c.day === date.getDay())) {
      const pool = students.filter((s) => s.status === "active" && (!c.discipline || s.disciplines.includes(c.discipline) || c.level === "MMA"));
      if (!pool.length) continue;
      const n = c.capacity === 1 ? (r() < 0.55 ? 1 : 0) : Math.floor(c.capacity * (0.2 + r() * 0.4));
      const used = new Set();
      for (let k = 0; k < n * 2 && used.size < n; k++) used.add(pick(pool).id);
      used.forEach((sid) => bookings.push({ id: uid("bk"), studentId: sid, classId: c.id, date: iso(date) }));
    }
  }

  // Invoices for the last 6 months
  const invoices = [];
  for (let m = 5; m >= 0; m--) {
    const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
    for (const s of students) {
      if (s.status === "cancelled" && m < 2) continue;
      if (s.status === "frozen" && m < 1) continue;
      const plan = plans.find((p) => p.id === s.planId);
      if (plan.interval === "pack" && m > 0 && r() < 0.65) continue;
      const roll = r();
      invoices.push({
        id: uid("inv"), studentId: s.id, amount: plan.price, date: iso(date), due: iso(addDays(date, 7)),
        description: plan.name, status: m > 0 ? (roll < 0.97 ? "paid" : "failed") : roll < 0.84 ? "paid" : roll < 0.94 ? "due" : "failed",
      });
    }
  }

  const expenses = [];
  for (let m = 5; m >= 0; m--) {
    const date = iso(new Date(now.getFullYear(), now.getMonth() - m, 2));
    expenses.push({ id: uid("ex"), category: "Rent", amount: 1400, date, note: "Gym space" });
    expenses.push({ id: uid("ex"), category: "Utilities", amount: 160 + Math.round(r() * 60), date, note: "" });
    expenses.push({ id: uid("ex"), category: "Equipment", amount: 80 + Math.round(r() * 220), date, note: "Pads, gloves, wraps" });
    expenses.push({ id: uid("ex"), category: "Marketing", amount: 90 + Math.round(r() * 120), date, note: "Instagram ads" });
  }

  const sources = ["Instagram", "Instagram", "Website form", "Referral", "Walk-in", "Google"];
  const leadNames = ["Marios Kyprianou", "Elena Pavlou", "Chris Evagorou", "Nadia Haddad", "Petros Savvides", "Anastasia Lazarou", "Yiannis Phylactou", "Lucy Morgan", "Andreas Neofytou", "Daria Volkova", "Kevin Doyle", "Stella Mavrou"];
  const leads = leadNames.map((name, i) => ({
    id: uid("ld"), name,
    email: name.toLowerCase().replace(" ", ".") + "@example.com",
    phone: "+357 96 " + String(200000 + i * 1137),
    source: pick(sources),
    stage: LEAD_STAGES[Math.floor(r() * LEAD_STAGES.length)],
    interest: pick(["Muay Thai", "Boxing", "MMA", "1-on-1 PT", "Fight camp", "Kickboxing"]),
    created: iso(addDays(now, -Math.floor(r() * 60))),
    trialDate: "",
    notes: "",
  }));

  const automations = [
    { id: uid("au"), name: "New enquiry welcome", trigger: "Lead created", enabled: true, steps: [
      { delay: 0, channel: "Email", text: "Thanks for reaching out! Here's how to book your free trial session with Kyri." },
      { delay: 2, channel: "SMS", text: "Ready to train? Reply with a day that works and I'll hold a spot for you." },
      { delay: 7, channel: "Email", text: "What to bring to your first session: wraps, gloves (or borrow ours), water." } ] },
    { id: uid("au"), name: "Trial follow-up", trigger: "Trial class attended", enabled: true, steps: [
      { delay: 0, channel: "Email", text: "Great work today! Here's your intro offer for the first month." },
      { delay: 3, channel: "SMS", text: "Your intro offer ends soon. Want me to lock in your training slots?" } ] },
    { id: uid("au"), name: "Fight week check-in", trigger: "7 days before a fight", enabled: true, steps: [
      { delay: 0, channel: "SMS", text: "Fight week. Stick to the weight plan, sleep, and we'll sharpen up in the final sessions." } ] },
    { id: uid("au"), name: "We miss you", trigger: "No session for 14 days", enabled: true, steps: [
      { delay: 0, channel: "Email", text: "Haven't seen you in a while. Here's this week's timetable, so book a session." } ] },
  ];

  const events = [
    { id: uid("ev"), title: "Cyprus Muay Thai Open", type: "Fight", date: iso(addDays(now, 18)), time: "16:00", price: 0, capacity: 8, registrations: students.filter((s) => s.level.includes("fighter")).slice(0, 4).map((s) => s.id) },
    { id: uid("ev"), title: "Inter-gym Sparring Day", type: "Sparring day", date: iso(addDays(now, 9)), time: "11:00", price: 10, capacity: 24, registrations: students.slice(2, 12).map((s) => s.id) },
    { id: uid("ev"), title: "Clinch & Knees Seminar", type: "Seminar", date: iso(addDays(now, 30)), time: "12:00", price: 35, capacity: 20, registrations: students.slice(10, 17).map((s) => s.id) },
  ];

  return {
    academy: { name: "KYRI Training", owner: "Kyriakos Nicolaou", currency: "EUR", locations: ["Main Gym"], email: "kyri@trainwithkyri.com", instagram: "trainwithkyri", graceDay: 7 },
    staff, plans, classes, students, attendance, bookings, invoices, expenses, leads, automations, events, messages: [],
    groups: defaultGroups(),
    documents: sampleDocuments(students),
  };
}

// --- programs & monthly payment status -----------------------------------------
// Athletes belong to one or more programs (each with its own monthly price). Every month an
// athlete is "paid" once a paid invoice exists for that month; before the grace day they're
// "due", after it "overdue".
function defaultGroups() {
  return [
    { id: "gr_fight", name: "Fight Team", price: 120, color: "#b3261e" },
    { id: "gr_group", name: "Group Classes", price: 70, color: "#5c6470" },
    { id: "gr_pt", name: "1-on-1 PT", price: 320, color: "#1c1c1c" },
  ];
}
function assignGroups(d) {
  const r = rng(11);
  for (const s of d.students) {
    if (s.groupIds) continue;
    if (s.level.includes("fighter")) s.groupIds = r() < 0.3 ? ["gr_fight", "gr_pt"] : ["gr_fight"];
    else s.groupIds = r() < 0.4 ? ["gr_pt"] : ["gr_group"];
  }
}

export const DOC_TYPES = ["Medical clearance", "Liability waiver", "Fight license", "Blood work", "ID / Passport", "Insurance", "Other"];
// Document types that must be renewed; athletes without a valid one are flagged.
export const REQUIRED_DOCS = ["Medical clearance"];

/** Demo metadata only — sample docs have no uploaded file and render as a generated placeholder. */
function sampleDocuments(students) {
  const r = rng(7);
  const now = new Date();
  const docs = [];
  for (const s of students) {
    if (s.status === "cancelled") continue;
    if (r() < 0.8) {
      // Issued 2–13 months ago, valid 12 months → some expired, some expiring soon.
      const issued = addDays(now, -Math.floor(60 + r() * 330));
      docs.push({ id: uid("doc"), studentId: s.id, type: "Medical clearance", name: `medical-${s.first.toLowerCase()}.pdf`,
        uploaded: iso(issued), expires: iso(addDays(issued, 365)), size: 180000 + Math.floor(r() * 90000), mime: "application/pdf", sample: true, by: "staff" });
    }
    if (s.waiver) docs.push({ id: uid("doc"), studentId: s.id, type: "Liability waiver", name: `waiver-${s.last.toLowerCase()}.pdf`,
      uploaded: s.joined, expires: "", size: 95000, mime: "application/pdf", sample: true, by: "staff" });
    if (s.level.includes("fighter")) docs.push({ id: uid("doc"), studentId: s.id, type: "Fight license", name: `license-${s.last.toLowerCase()}.pdf`,
      uploaded: iso(addDays(now, -Math.floor(r() * 200))), expires: iso(addDays(now, Math.floor(60 + r() * 300))), size: 120000, mime: "application/pdf", sample: true, by: "staff" });
  }
  return docs;
}

/** valid | expiring (≤30 days) | expired | none — for an athlete's required document of `type`. */
export function docStatus(studentId, type = "Medical clearance") {
  const docs = state.documents.filter((d) => d.studentId === studentId && d.type === type).sort((a, b) => (b.expires || "9999").localeCompare(a.expires || "9999"));
  const doc = docs[0];
  if (!doc) return { status: "none", doc: null };
  if (!doc.expires) return { status: "valid", doc };
  const t = today();
  if (doc.expires < t) return { status: "expired", doc };
  if (doc.expires <= iso(addDays(new Date(), 30))) return { status: "expiring", doc };
  return { status: "valid", doc };
}

// --- store ------------------------------------------------------------------
let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {}
  return migrate(seed());
}
// Bring data saved by older versions up to the current shape.
function migrate(s) {
  s.documents ||= sampleDocuments(s.students);
  s.bookings ||= [];
  s.groups ||= defaultGroups();
  s.academy.graceDay ||= 7;
  for (const st of s.students) {
    st.disciplines ||= [];
    st.record ||= { w: 0, l: 0, d: 0 };
    st.level ||= "Beginner";
    st.password ||= DEMO_PASSWORD;
  }
  assignGroups(s);
  return s;
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export const db = () => state;
export function update(fn) {
  fn(state);
  persist();
  listeners.forEach((l) => l(state));
}
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export function resetDemo() { state = migrate(seed()); persist(); listeners.forEach((l) => l(state)); }
persist();

// Re-sync when another tab (e.g. the member portal) writes.
window.addEventListener("storage", (e) => {
  if (e.key === KEY && e.newValue) { state = JSON.parse(e.newValue); listeners.forEach((l) => l(state)); }
});

// --- derived helpers ----------------------------------------------------------
export const byId = (list, id) => state[list].find((x) => x.id === id);
export const fullName = (s) => (s ? `${s.first} ${s.last}` : "—");
export const money = (n) => new Intl.NumberFormat("en-IE", { style: "currency", currency: state.academy.currency || "EUR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n || 0);
export const isFighter = (s) => /fighter/.test(s.level || "");
export const recordText = (s) => `${s.record?.w || 0}-${s.record?.l || 0}${s.record?.d ? "-" + s.record.d : ""}`;

export function lastSeen(studentId) {
  let max = "";
  for (const a of state.attendance) if (a.studentId === studentId && a.date > max) max = a.date;
  return max;
}

export const groupsOf = (s) => (s.groupIds || []).map((id) => state.groups.find((g) => g.id === id)).filter(Boolean);
export const monthlyFee = (s) => groupsOf(s).reduce((a, g) => a + g.price, 0);
export const thisMonth = () => today().slice(0, 7);

/** paid | due | overdue | inactive — this month's payment state for an athlete. */
export function paymentStatus(s, month = thisMonth()) {
  if (s.status !== "active") return "inactive";
  const inv = state.invoices.filter((i) => i.studentId === s.id && i.date.startsWith(month) && i.monthly);
  if (inv.length && inv.every((i) => i.status === "paid")) return "paid";
  // Invoices created from plans count too (but not event charges).
  if (!inv.length && state.invoices.some((i) => i.studentId === s.id && i.date.startsWith(month) && i.status === "paid" && state.plans.some((p) => p.name === i.description))) return "paid";
  return new Date().getDate() <= (state.academy.graceDay || 7) ? "due" : "overdue";
}

/** Records this month's payment for an athlete's program(s): pays any open monthly invoices, or creates a paid one. */
export function markPaid(studentId, groupIds) {
  update((d) => {
    const s = d.students.find((x) => x.id === studentId);
    const month = thisMonth();
    const open = d.invoices.filter((i) => i.studentId === s.id && i.date.startsWith(month) && i.monthly && i.status !== "paid");
    if (open.length) { open.forEach((i) => (i.status = "paid")); return; }
    for (const gid of groupIds || s.groupIds || []) {
      const g = d.groups.find((x) => x.id === gid);
      if (g) d.invoices.push({ id: uid("inv"), studentId: s.id, amount: g.price, date: today(), due: today(), description: `${g.name} — ${new Date().toLocaleString("en-US", { month: "long" })}`, status: "paid", monthly: true, groupId: g.id });
    }
  });
}

/** Coach marks an athlete present for a session. */
export function markAttended(studentId, classId, date = today()) {
  if (state.attendance.some((a) => a.studentId === studentId && a.classId === classId && a.date === date)) return false;
  update((d) => d.attendance.push({ id: uid("at"), studentId, classId, date }));
  return true;
}

export function classesOn(date) {
  const day = new Date(date + "T12:00").getDay();
  return state.classes.filter((c) => c.day === day).sort((a, b) => a.start.localeCompare(b.start));
}

export const bookedCount = (classId, date) => state.bookings.filter((b) => b.classId === classId && b.date === date).length;
export const isBooked = (studentId, classId, date) => state.bookings.some((b) => b.studentId === studentId && b.classId === classId && b.date === date);

/** Color for a session block: its discipline if set, otherwise by session type. */
const TYPE_TONE = { Striking: "#d64545", Grappling: "#3d6fd6", MMA: "#8a8f98", Conditioning: "#c9a227", Sparring: "#e07b2e", "1-on-1": "#a7adb6", "Open gym": "#5c6470" };
export const sessionColor = (c) => DISCIPLINES[c.discipline] || TYPE_TONE[c.level] || "#888";
export { TYPE_TONE };
