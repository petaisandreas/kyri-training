// Data layer: a single JSON document in localStorage, seeded with a demo roster of fighters and fitness clients.
const KEY = "kyri:v3";

/** Martial arts a fighter competes in (trained elsewhere — Kyri does their conditioning). Colors are used for chips. */
export const DISCIPLINES = {
  "Muay Thai": "#d64545", Boxing: "#c9a227", Kickboxing: "#e07b2e", MMA: "#8a8f98",
  BJJ: "#3d6fd6", Wrestling: "#3c9a6b", Judo: "#6b4fc4", Karate: "#b8b8b8", Taekwondo: "#2aa5b8",
};
export const DISCIPLINE_NAMES = Object.keys(DISCIPLINES);
export const LEVELS = ["Fitness client", "Recreational martial artist", "Amateur fighter", "Pro fighter"];
export const WEIGHT_CLASSES = ["—", "Flyweight", "Bantamweight", "Featherweight", "Lightweight", "Welterweight", "Middleweight", "Light heavyweight", "Heavyweight"];
/** Session types on the timetable — all strength, conditioning and cardio work. */
export const SESSION_TYPES = ["1-on-1 PT", "Fighter conditioning", "Cardio / HIIT", "Strength", "Mobility & recovery", "Fight camp"];
export const FIGHTER_GOALS = ["Fight conditioning", "Making weight", "Fight camp", "Explosive power"];
export const FITNESS_GOALS = ["Weight loss", "Cardio & endurance", "Strength", "General fitness", "Mobility"];
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
    { id: "pl_1", name: "Fighter Conditioning Unlimited", price: 120, interval: "month" },
    { id: "pl_2", name: "Group Classes 2x / week", price: 70, interval: "month" },
    { id: "pl_3", name: "1-on-1 PT — 10 sessions", price: 400, interval: "pack" },
    { id: "pl_4", name: "1-on-1 PT — Monthly (8)", price: 320, interval: "month" },
    { id: "pl_5", name: "Fight Camp S&C (8 weeks)", price: 480, interval: "pack" },
  ];

  const classes = [];
  const addClass = (name, days, start, dur, type, capacity) =>
    days.forEach((day) => classes.push({ id: uid("cl"), name, day, start, duration: dur, instructorId: "st_1", level: type, capacity, location: "Main Gym" }));
  addClass("Morning HIIT", [1, 3, 5], "06:30", 45, "Cardio / HIIT", 12);
  addClass("1-on-1 PT", [1, 2, 3, 4, 5], "07:30", 60, "1-on-1 PT", 1);
  addClass("1-on-1 PT", [1, 2, 3, 4, 5], "08:30", 60, "1-on-1 PT", 1);
  addClass("1-on-1 PT", [2, 4], "12:00", 60, "1-on-1 PT", 1);
  addClass("1-on-1 PT", [1, 2, 3, 4], "16:00", 60, "1-on-1 PT", 1);
  addClass("1-on-1 PT", [1, 2, 3, 4, 5], "17:00", 60, "1-on-1 PT", 1);
  addClass("Fighter Conditioning", [1, 3], "18:15", 60, "Fighter conditioning", 10);
  addClass("Strength & Power", [2, 4], "18:15", 60, "Strength", 10);
  addClass("Cardio Blast", [1, 2, 3, 4], "19:30", 45, "Cardio / HIIT", 14);
  addClass("Fight Camp S&C", [5], "18:00", 75, "Fight camp", 8);
  addClass("Mobility & Recovery", [6], "10:00", 60, "Mobility & recovery", 12);
  addClass("Saturday Bootcamp", [6], "11:15", 60, "Cardio / HIIT", 16);

  const first = ["Andreas", "Maria", "Nikos", "Elena", "Christos", "Sofia", "Giorgos", "Katerina", "Marios", "Eleni", "Panayiotis", "Despina", "Stelios", "Anna", "Michalis", "Christina", "Loizos", "Ioanna", "Savvas", "Georgia", "Antonis", "Rafaela", "Kostas", "Natalia", "Pavlos", "Myria", "Demetris", "Chloe", "Alex", "Lena", "Omar", "Ivan"];
  const last = ["Georgiou", "Christodoulou", "Ioannou", "Constantinou", "Charalambous", "Michael", "Nicolaou", "Panayiotou", "Demetriou", "Kyriacou", "Savva", "Antoniou", "Hadjigeorgiou", "Petrou", "Stylianou", "Andreou"];
  const combos = [["Muay Thai"], ["Boxing"], ["MMA", "BJJ", "Wrestling"], ["Muay Thai", "Boxing"], ["Kickboxing"], ["MMA", "Muay Thai"], ["BJJ"], ["Boxing"], ["Judo", "MMA"], ["Muay Thai"], ["Kickboxing", "Boxing"], ["Wrestling"], ["Karate"], ["Taekwondo", "Kickboxing"]];
  // Demo portraits (randomuser.me placeholders) for most athletes; the rest show initials until a photo is uploaded.
  const female = new Set(["Maria", "Elena", "Sofia", "Katerina", "Eleni", "Despina", "Anna", "Christina", "Ioanna", "Georgia", "Rafaela", "Natalia", "Myria", "Chloe", "Lena"]);
  const portrait = (fn, i) => (i % 5 === 4 ? "" : `https://randomuser.me/api/portraits/${female.has(fn) ? "women" : "men"}/${(i * 7 + 3) % 90}.jpg`);
  const students = [];
  for (let i = 0; i < 34; i++) {
    const joined = addDays(now, -Math.floor(20 + r() * 1100));
    const status = r() < 0.86 ? "active" : r() < 0.5 ? "frozen" : "cancelled";
    const fn = first[i % first.length], ln = pick(last);
    const level = LEVELS[Math.min(3, Math.floor(r() * r() * 4.6))];
    const fighter = level.includes("fighter");
    const martial = level !== "Fitness client";
    const w = fighter ? Math.floor(r() * (level === "Pro fighter" ? 18 : 9)) : 0;
    students.push({
      id: "s_" + (i + 1),
      first: fn, last: ln,
      email: `${fn}.${ln}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
      phone: "+357 99 " + String(100000 + Math.floor(r() * 899999)),
      disciplines: martial ? combos[i % combos.length] : [],
      level,
      weightClass: fighter ? pick(WEIGHT_CLASSES.slice(1)) : "—",
      record: { w, l: fighter ? Math.floor(r() * (w / 2 + 2)) : 0, d: fighter && r() < 0.3 ? 1 : 0 },
      goal: pick(martial ? FIGHTER_GOALS : FITNESS_GOALS),
      joined: iso(joined),
      status,
      planId: fighter ? pick(["pl_1", "pl_1", "pl_5"]) : pick(["pl_2", "pl_2", "pl_3", "pl_4"]),
      waiver: r() < 0.9,
      password: DEMO_PASSWORD,
      photo: portrait(fn, i),
      notes: "",
      location: "Main Gym",
    });
  }

  // Referrals: some recent athletes were brought in by existing ones (counts toward the monthly ranking).
  // [referred athlete index, referrer index, months ago, day of month]
  for (const [i, by, ago, day] of [[33, 1, 0, 4], [32, 1, 0, 11], [31, 4, 0, 15], [30, 9, 1, 6], [29, 1, 1, 19], [28, 4, 1, 23], [27, 2, 2, 12]]) {
    const st = students[i];
    const date = new Date(now.getFullYear(), now.getMonth() - ago, ago === 0 ? Math.min(day, now.getDate()) : day);
    Object.assign(st, { referredBy: students[by].id, joined: iso(date), status: "active" });
  }

  // Fighter conditioning and fight camp are for martial artists; everything else is open to everyone.
  const fits = (c, s) => !["Fighter conditioning", "Fight camp"].includes(c.level) || s.disciplines.length > 0;
  const trainingOn = (s, date) => s.joined <= iso(date);

  // Attendance for the last 120 days (1-on-1 slots get one athlete each)
  const attendance = [];
  const bookings = [];
  for (let d = 120; d >= 1; d--) {
    const date = addDays(now, -d);
    for (const c of classes.filter((c) => c.day === date.getDay())) {
      const pool = students.filter((s) => s.status === "active" && fits(c, s) && trainingOn(s, date));
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
      const pool = students.filter((s) => s.status === "active" && fits(c, s));
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
    interest: pick(["Fight conditioning", "Weight loss", "Cardio & HIIT", "Strength", "1-on-1 PT", "Fight camp"]),
    created: iso(addDays(now, -Math.floor(r() * 60))),
    trialDate: "",
    notes: "",
  }));

  const automations = [
    { id: uid("au"), name: "New enquiry welcome", trigger: "Lead created", enabled: true, steps: [
      { delay: 0, channel: "Email", text: "Thanks for reaching out! Here's how to book your free trial PT session with Kyri." },
      { delay: 2, channel: "SMS", text: "Ready to train? Reply with a day that works and I'll hold a spot for you." },
      { delay: 7, channel: "Email", text: "What to bring to your first session: trainers, a towel and plenty of water." } ] },
    { id: uid("au"), name: "Trial follow-up", trigger: "Trial class attended", enabled: true, steps: [
      { delay: 0, channel: "Email", text: "Great work today! Here's your intro offer for the first month." },
      { delay: 3, channel: "SMS", text: "Your intro offer ends soon. Want me to lock in your training slots?" } ] },
    { id: uid("au"), name: "Fight week check-in", trigger: "7 days before a fight", enabled: true, steps: [
      { delay: 0, channel: "SMS", text: "Fight week. We taper the conditioning now: stick to the weight plan, sleep, and stay sharp." } ] },
    { id: uid("au"), name: "Monthly winner", trigger: "Monthly ranking winner", enabled: true, steps: [
      { delay: 0, channel: "SMS", text: "You finished #1 in this month's KYRI ranking! Your prize is waiting at the gym." } ] },
    { id: uid("au"), name: "We miss you", trigger: "No session for 14 days", enabled: true, steps: [
      { delay: 0, channel: "Email", text: "Haven't seen you in a while. Here's this week's timetable, so book a session." } ] },
  ];

  const events = [
    { id: uid("ev"), title: "Fight night: Cyprus Muay Thai Open", type: "Athlete fight", date: iso(addDays(now, 18)), time: "16:00", price: 0, capacity: 8, registrations: students.filter((s) => s.level.includes("fighter")).slice(0, 4).map((s) => s.id) },
    { id: uid("ev"), title: "Saturday Beach Bootcamp", type: "Bootcamp", date: iso(addDays(now, 9)), time: "09:00", price: 10, capacity: 24, registrations: students.slice(2, 12).map((s) => s.id) },
    { id: uid("ev"), title: "Conditioning Test Day", type: "Fitness test", date: iso(addDays(now, 30)), time: "10:00", price: 0, capacity: 20, registrations: students.slice(10, 17).map((s) => s.id) },
  ];

  // A friend-of-an-athlete lead still in the pipeline (not counted until they sign up).
  Object.assign(leads[0], { source: "Referral", referredBy: students[1].id, stage: "Trial booked", trialDate: iso(addDays(now, 2)) });
  Object.assign(leads[1], { source: "Referral", referredBy: students[4].id, stage: "New" });

  // Achievements Kyri has awarded over the last three months.
  const achievementTypes = defaultAchievementTypes();
  const fighterOnly = new Set(["Won a fight", "Finished fight camp", "Made weight"]);
  const achievements = [];
  for (let m = 2; m >= 0; m--) {
    for (let k = 0; k < (m === 0 ? 11 : 15); k++) {
      const st = pick(students.filter((x) => x.status === "active"));
      let t = pick(achievementTypes);
      if (fighterOnly.has(t.title) && !st.disciplines.length) t = achievementTypes[0];
      const day = 1 + Math.floor(r() * (m === 0 ? Math.max(1, now.getDate() - 1) : 27));
      achievements.push({ id: uid("ac"), studentId: st.id, date: iso(new Date(now.getFullYear(), now.getMonth() - m, day)), title: t.title, points: t.points, note: "" });
    }
  }

  return {
    academy: { name: "KYRI Training", owner: "Kyriakos Nicolaou", currency: "EUR", locations: ["Main Gym"], email: "kyri@trainwithkyri.com", instagram: "trainwithkyri", graceDay: 7,
      ranking: defaultRanking(), achievementTypes },
    achievements, prizes: {}, winners: {},
    staff, plans, classes, students, attendance, bookings, invoices, expenses, leads, automations, events, messages: [],
    groups: defaultGroups(),
    documents: sampleDocuments(students),
  };
}

// --- monthly ranking ------------------------------------------------------------
// Every month athletes collect points; #1 wins Kyri's prize. Points per 1-on-1 PT session,
// per group session, per friend who signs up, plus whatever each achievement is worth.
function defaultRanking() {
  return { pt: 15, group: 3, referral: 50, prize: "Free 1-on-1 PT session + KYRI t-shirt" };
}
function defaultAchievementTypes() {
  return [
    { title: "Personal record", points: 20 },
    { title: "Perfect week (4+ sessions)", points: 15 },
    { title: "Hit weight / body-fat target", points: 30 },
    { title: "Transformation milestone", points: 30 },
    { title: "Made weight", points: 25 },
    { title: "Finished fight camp", points: 40 },
    { title: "Won a fight", points: 50 },
  ];
}

// --- programs & monthly payment status -----------------------------------------
// Athletes belong to one or more programs (each with its own monthly price). Every month an
// athlete is "paid" once a paid invoice exists for that month; before the grace day they're
// "due", after it "overdue".
function defaultGroups() {
  return [
    { id: "gr_fight", name: "Fighter Conditioning", price: 120, color: "#b3261e" },
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

export const DOC_TYPES = ["Medical clearance", "Health questionnaire (PAR-Q)", "Liability waiver", "Blood work", "Body measurements", "Insurance", "Other"];
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
  s.academy.ranking = { ...defaultRanking(), ...(s.academy.ranking || {}) };
  s.academy.achievementTypes ||= defaultAchievementTypes();
  s.achievements ||= [];
  s.prizes ||= {};
  s.winners ||= {};
  for (const st of s.students) {
    st.disciplines ||= [];
    st.record ||= { w: 0, l: 0, d: 0 };
    st.level ||= "Fitness client";
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

export const monthLabel = (m) => new Date(m + "-15T12:00").toLocaleString("en-US", { month: "long", year: "numeric" });
export const monthName = (m) => new Date(m + "-15T12:00").toLocaleString("en-US", { month: "long" });
export const shiftMonth = (m, n) => { const [y, mo] = m.split("-").map(Number); return iso(new Date(y, mo - 1 + n, 1)).slice(0, 7); };
export const prizeFor = (month) => state.prizes[month] || state.academy.ranking.prize;
export const referralsOf = (studentId) => state.students.filter((s) => s.referredBy === studentId);

/** The month's leaderboard: points from PT sessions, group sessions, achievements and friends who signed up. */
export function monthlyRanking(month = thisMonth()) {
  const R = state.academy.ranking;
  const solo = new Set(state.classes.filter((c) => c.capacity === 1).map((c) => c.id));
  const rows = new Map();
  const row = (id) => { if (!rows.has(id)) rows.set(id, { id, pt: 0, group: 0, ach: [], achPts: 0, refs: [] }); return rows.get(id); };
  for (const a of state.attendance) if (a.date.startsWith(month)) solo.has(a.classId) ? row(a.studentId).pt++ : row(a.studentId).group++;
  for (const a of state.achievements) if (a.date.startsWith(month)) { const r = row(a.studentId); r.ach.push(a); r.achPts += Number(a.points) || 0; }
  for (const s of state.students) if (s.referredBy && s.joined?.startsWith(month) && s.status !== "cancelled") row(s.referredBy).refs.push(s);
  return [...rows.values()]
    .map((r) => ({ ...r, s: state.students.find((x) => x.id === r.id) }))
    .filter((r) => r.s && r.s.status !== "cancelled")
    .map((r) => ({ ...r, points: r.pt * R.pt + r.group * R.group + r.achPts + r.refs.length * R.referral }))
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points || b.refs.length - a.refs.length || b.pt - a.pt || a.s.first.localeCompare(b.s.first))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export const bookedCount = (classId, date) => state.bookings.filter((b) => b.classId === classId && b.date === date).length;
export const isBooked = (studentId, classId, date) => state.bookings.some((b) => b.studentId === studentId && b.classId === classId && b.date === date);

/** Color for a session block, by session type. */
const TYPE_TONE = { "1-on-1 PT": "#a7adb6", "Fighter conditioning": "#d64545", "Cardio / HIIT": "#e07b2e", Strength: "#c9a227", "Mobility & recovery": "#3c9a6b", "Fight camp": "#8a2be2" };
export const sessionColor = (c) => TYPE_TONE[c.level] || "#888";
export { TYPE_TONE };
