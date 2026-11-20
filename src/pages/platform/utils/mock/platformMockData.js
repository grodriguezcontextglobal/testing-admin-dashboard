// Sample data for the Admin Console demo (VITE_APP_PLATFORM_CONSOLE_MOCK, dev
// server only). Every company, person and address here is invented; emails use
// the reserved .example domain. Deterministic: the same clock gives the same
// data, so a demo looks the same every time it is opened.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Small seeded PRNG (mulberry32): same seed, same sequence. */
const makeRandom = (seed) => {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
  };
};

const COMPANY_NAMES = [
  "Harbor Point Events", "Lakeside Academy", "Summit Arena Group", "Bluewater Conferences",
  "Northfield School District", "Cedar Ridge Stadium", "Metro Expo Center", "Riverbend University",
  "Coastal Music Festival", "Pinecrest Charter School", "Grand Hall Venues", "Silverline Tours",
  "Oakmont Medical Congress", "Brightway Museums", "Redwood Sports Club", "Union Square Theater",
  "Westgate Convention Center", "Maple Grove Schools", "Skyline Productions", "Horizon Trade Shows",
  "Granite Peak Resort", "Bayside Community Church", "Evergreen College", "Crescent City Marathon",
  "Ironwood Esports", "Lighthouse Tours", "Meridian Health Summit", "Old Town Walking Tours",
  "Prairie State Fair", "Quarry Lane Stadium", "Starlight Amphitheater", "Timberline Camp",
  "Fox Hollow Academy", "Willow Creek Events", "Northstar Galleries", "Seaside Film Festival",
];

const FIRST = ["Ana", "Luis", "Maya", "Noah", "Sofia", "Ethan", "Lucia", "Omar", "Grace", "Diego", "Emma", "Liam", "Chloe", "Mateo", "Zoe", "Isaac", "Nora", "Leo", "Valeria", "Owen"];
const LAST = ["Ortiz", "Bennett", "Navarro", "Kim", "Reyes", "Parker", "Silva", "Hughes", "Moreno", "Carter", "Lopez", "Foster", "Ramos", "Ward", "Castillo", "Hayes", "Vega", "Brooks", "Rojas", "Price"];
const DEVICES = [
  { name: "Tour-guide receiver", category: "Receivers", prefix: "RX" },
  { name: "Tour-guide transmitter", category: "Transmitters", prefix: "TX" },
  { name: "Assistive listening kit", category: "Receivers", prefix: "AL" },
  { name: "Tablet 10\"", category: "Tablets", prefix: "TB" },
  { name: "Radio, two-way", category: "Radios", prefix: "RD" },
  { name: "Badge scanner", category: "Scanners", prefix: "SC" },
];
const LOCATIONS = ["Main warehouse", "North dock", "Room 114", "Box office", "Van 2", "Storage B"];
const EVENT_WORDS = ["Spring Gala", "Open House", "Annual Summit", "Field Trip", "Expo Day", "Championship", "Career Fair", "Night Tour", "Graduation", "Workshop Series"];
const OPERATORS = [1, 2, 3, 4].map((n) => ({
  name: `Operator ${n}`,
  email: `operator${n}@devitrak.com`,
}));

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const pad = (n, width) => String(n).padStart(width, "0");
const iso = (ms) => new Date(ms).toISOString();
const hex = (rand, length) =>
  Array.from({ length }, () => "0123456789abcdef"[rand.int(0, 15)]).join("");
const personName = (rand) => `${rand.pick(FIRST)} ${rand.pick(LAST)}`;

const statusFor = (index) => {
  if ([3, 11, 19, 27].includes(index)) return "at_risk";
  if ([5, 22, 31].includes(index)) return "trial";
  if ([14, 33].includes(index)) return "paused";
  return "active";
};

const planFor = (status, rand) => {
  if (status === "trial") return "Pro (trial)";
  return rand.pick(["Free", "Pro", "Pro", "Enterprise"]);
};

const buildCompany = (name, index, now) => {
  const rand = makeRandom(1000 + index);
  const status = statusFor(index);
  const deviceCount = rand.int(80, 1400);
  const devicesOut = Math.floor(deviceCount * (status === "paused" ? 0.02 : rand.int(8, 45) / 100));
  const devicesOverdue = status === "at_risk" ? rand.int(6, 40) : rand.chance(0.3) ? rand.int(1, 4) : 0;
  const domain = `${slug(name)}.example`;
  const ownerName = personName(rand);
  const alerts = [];
  if (status === "at_risk") {
    alerts.push({ kind: "overdue", message: `${devicesOverdue} devices are more than 7 days overdue.` });
    if (rand.chance(0.6)) alerts.push({ kind: "failed", message: "2 payments failed in the last 7 days." });
  }
  if (status === "trial") alerts.push({ kind: "pending", message: `Trial ends in ${rand.int(2, 7)} days.` });
  if (status === "paused") alerts.push({ kind: "paused", message: "No admin has signed in for 21 days." });

  return {
    id: `cmp_${pad(index + 1, 3)}`,
    name,
    status,
    plan: planFor(status, rand),
    ownerName,
    ownerEmail: `${slug(ownerName).replace("-", ".")}@${domain}`,
    phone: `+1 555 01${pad(rand.int(0, 99), 2)}`,
    createdAt: iso(now - rand.int(60, 1400) * DAY),
    mongoId: hex(rand, 24),
    sqlId: 100 + index,
    staffCount: rand.int(3, 48),
    deviceCount,
    devicesOut,
    devicesOverdue,
    // Long-tailed on purpose. Drawn uniformly, the top six clients of
    // thirty-six all land within 10% of each other and the "Revenue by
    // client" chart shows six bars of the same length, which is a chart
    // that says nothing. Real rental revenue concentrates in a few
    // accounts, and the screen exists to show that.
    revenue30dCents:
      status === "paused" ? 0 : Math.round((800 + 47200 * Math.pow(rand.next(), 3)) * 100),
    currency: "USD",
    lastActivityAt: iso(now - (status === "paused" ? rand.int(15, 30) * DAY : rand.int(2, 60 * 30) * MINUTE)),
    eventsActive: status === "paused" ? 0 : rand.int(0, 6),
    membersCount: rand.int(0, 900),
    consumersCount: rand.int(40, 4000),
    alerts,
  };
};

const buildCompanyDetail = (company, index, now) => {
  const rand = makeRandom(5000 + index);
  const ref = { companyId: company.id, companyName: company.name };

  const staff = Array.from({ length: company.staffCount }, (_, i) => {
    const name = personName(rand);
    return {
      id: `${company.id}_stf_${i}`,
      name,
      email: `${slug(name).replace("-", ".")}${i}@${slug(company.name)}.example`,
      role: i === 0 ? "administrator" : rand.pick(["manager", "manager", "assistant", "assistant", "assistant"]),
      scope: i === 0 ? "All locations" : rand.pick(["All locations", "Main warehouse", "North dock", "Events only"]),
      twoStepEnabled: rand.chance(0.7),
      lastLoginAt: iso(now - rand.int(5, 60 * 24 * 20) * MINUTE),
      actions30d: rand.int(0, 600),
    };
  });

  const events = Array.from({ length: rand.int(6, 14) }, (_, i) => {
    const start = now + rand.int(-120, 45) * DAY;
    const end = start + rand.int(0, 3) * DAY + 8 * HOUR;
    const state = end < now ? "closed" : start > now ? "upcoming" : "live";
    const assigned = state === "upcoming" ? 0 : rand.int(20, 400);
    return {
      id: `${company.id}_evt_${i}`,
      ...ref,
      name: `${company.name.split(" ")[0]} ${rand.pick(EVENT_WORDS)} ${new Date(start).getUTCFullYear()}`,
      status: state,
      startsAt: iso(start),
      endsAt: iso(end),
      devicesAssigned: assigned,
      devicesNotReturned: state === "closed" ? rand.int(0, company.status === "at_risk" ? 25 : 3) : rand.int(0, assigned),
      consumersCount: assigned ? rand.int(Math.floor(assigned / 2), assigned) : 0,
      revenueCents: assigned * rand.int(300, 2500),
      currency: "USD",
      leadName: rand.pick(staff).name,
    };
  });

  const consumers = Array.from({ length: Math.min(company.consumersCount, 140) }, (_, i) => {
    const name = personName(rand);
    return {
      id: `${company.id}_con_${i}`,
      ...ref,
      kind: "consumer",
      name,
      email: `${slug(name).replace("-", ".")}${i}@mail.example`,
      status: rand.chance(0.85) ? "active" : rand.pick(["overdue", "lost"]),
      devicesOut: rand.int(0, 3),
      transactionsCount: rand.int(1, 12),
      lastSeenAt: iso(now - rand.int(30, 60 * 24 * 90) * MINUTE),
    };
  });

  const members = Array.from({ length: Math.min(company.membersCount, 80) }, (_, i) => {
    const name = personName(rand);
    return {
      id: `${company.id}_mem_${i}`,
      ...ref,
      kind: "member",
      name,
      memberId: `M-${pad(rand.int(1, 99999), 5)}`,
      email: `${slug(name).replace("-", ".")}${i}@family.example`,
      status: rand.chance(0.9) ? "active" : "invited",
      devicesOut: rand.int(0, 2),
      joinedAt: iso(now - rand.int(10, 700) * DAY),
      lastSeenAt: iso(now - rand.int(60, 60 * 24 * 60) * MINUTE),
    };
  });

  const transactions = Array.from({ length: company.status === "paused" ? 6 : rand.int(40, 90) }, (_, i) => {
    const type = rand.pick(["deposit", "deposit", "rental", "sale", "refund"]);
    const consumer = consumers.length ? rand.pick(consumers) : null;
    return {
      id: `${company.id}_trx_${i}`,
      ...ref,
      createdAt: iso(now - rand.int(10, 60 * 24 * 95) * MINUTE),
      type,
      // Both, because the two scopes show different ones: the cross-client
      // list shows the name, the client's own profile shows the address.
      consumerName: consumer?.name ?? null,
      consumerEmail: consumer?.email ?? null,
      eventName: events.length ? rand.pick(events).name : null,
      amountCents: rand.int(5, 250) * 100 * (type === "refund" ? -1 : 1),
      currency: "USD",
      status: rand.chance(0.9) ? (type === "refund" ? "refunded" : "succeeded") : rand.pick(["failed", "pending"]),
    };
  });

  const inventoryGroups = DEVICES.filter(() => rand.chance(0.7)).map((device, i) => {
    const total = rand.int(20, Math.max(25, Math.floor(company.deviceCount / 3)));
    const first = rand.int(1, 500);
    const lost = company.status === "at_risk" ? rand.int(2, 12) : rand.int(0, 2);
    const out = Math.min(total - lost, rand.int(0, Math.floor(total * 0.4)));
    return {
      id: `${company.id}_grp_${i}`,
      groupName: device.name,
      category: device.category,
      serialRange: `${device.prefix}-${pad(first, 6)} – ${device.prefix}-${pad(first + total - 1, 6)}`,
      prefix: device.prefix,
      first,
      total,
      available: total - out - lost,
      out,
      lost,
      location: rand.pick(LOCATIONS),
    };
  });

  const categories = ["transaction", "event", "inventory", "member", "staff"];
  const activity = Array.from({ length: company.status === "paused" ? 8 : 70 }, (_, i) => {
    const category = categories[i % categories.length];
    const actor = rand.pick(staff);
    const summaries = {
      transaction: `Charged a deposit of $${rand.int(20, 200)}.00`,
      event: `Updated ${events.length ? rand.pick(events).name : "an event"}`,
      inventory: `Moved ${rand.int(2, 40)} devices to ${rand.pick(LOCATIONS)}`,
      member: `Invited ${rand.int(1, 30)} members`,
      staff: `Changed the role of ${rand.pick(staff).name}`,
    };
    return {
      id: `${company.id}_act_${i}`,
      ...ref,
      at: iso(now - (i * rand.int(20, 400) + rand.int(1, 30)) * MINUTE),
      category,
      actorName: category === "transaction" && rand.chance(0.4) ? "Consumer app" : actor.name,
      summary: summaries[category],
      source: rand.pick(["dashboard", "dashboard", "consumer_app", "automatic"]),
    };
  }).sort((a, b) => b.at.localeCompare(a.at));

  const merchant = {
    accountId: `acct_${hex(rand, 16)}`,
    chargesEnabled: company.status !== "paused",
    payoutsEnabled: company.status === "active" || company.status === "trial",
    payoutSchedule: rand.pick(["Daily", "Weekly (Monday)", "Monthly (1st)"]),
    requirementsDue: company.status === "at_risk" ? ["Bank account verification"] : [],
    balanceCents: rand.int(0, 9000) * 100,
    disputesOpen: company.status === "at_risk" ? rand.int(1, 3) : 0,
    fees30dCents: Math.floor(company.revenue30dCents * 0.029),
    lastPayoutAt: iso(now - rand.int(1, 9) * DAY),
    currency: "USD",
  };

  const prices = { Free: 0, Pro: 32000, "Pro (trial)": 32000, Enterprise: 120000 };
  const subscription = {
    plan: company.plan,
    status: company.status === "trial" ? "trialing" : company.status === "at_risk" ? "past_due" : company.status === "paused" ? "paused" : "active",
    startedAt: company.createdAt,
    renewsAt: iso(now + rand.int(3, 30) * DAY),
    priceCents: prices[company.plan] ?? 0,
    paymentMethodLast4: company.plan.startsWith("Free") ? null : `Visa •••• ${pad(rand.int(0, 9999), 4)}`,
    seatsUsed: company.staffCount,
    seatsLimit: company.plan === "Free" ? 5 : company.plan === "Enterprise" ? null : 50,
    currency: "USD",
  };

  return { staff, events, consumers, members, transactions, inventoryGroups, activity, merchant, subscription };
};

const buildDevices = (company, groups, index) => {
  const rand = makeRandom(9000 + index);
  const devices = [];
  for (const group of groups) {
    const shown = Math.min(group.total, 12);
    for (let i = 0; i < shown; i += 1) {
      const status = i < group.lost ? "lost" : i < group.lost + group.out ? "assigned" : rand.chance(0.05) ? "in_repair" : "available";
      devices.push({
        id: `${group.id}_${i}`,
        serial: `${group.prefix}-${pad(group.first + i, 6)}`,
        deviceName: group.groupName,
        category: group.category,
        companyId: company.id,
        companyName: company.name,
        status,
        location: status === "assigned" ? "With consumer" : group.location,
      });
    }
  }
  return devices;
};

const buildAudit = (companies, now) => {
  const rand = makeRandom(77);
  const resources = ["company.profile", "company.transactions", "company.inventory", "company.members", "company.merchant", "company.subscription", "inventory.search", "company.consumers"];
  return Array.from({ length: 320 }, (_, i) => {
    const actor = rand.pick(OPERATORS);
    const action = rand.pick(["view", "view", "view", "search", "search", "export", "signin", "access_change"]);
    const company = action === "signin" || action === "access_change" ? null : rand.pick(companies);
    return {
      id: `aud_${pad(i + 1, 5)}`,
      at: iso(now - (i * rand.int(8, 60) + rand.int(0, 7)) * MINUTE),
      actorName: actor.name,
      actorEmail: actor.email,
      action,
      companyId: company?.id ?? null,
      companyName: company?.name ?? null,
      resource: action === "signin" ? "console" : action === "access_change" ? "platform.access" : rand.pick(resources),
      result: rand.chance(0.96) ? "allowed" : "denied",
      ip: `203.0.113.${rand.int(2, 254)}`,
      details: action === "export" ? `${rand.int(40, 4000)} rows` : action === "search" ? `"${rand.pick(["RX-000", "overdue", "Lakeside", "refund"])}"` : null,
    };
  });
};

/** Everything the mock API serves, built from one clock. */
export const createPlatformMockData = (now = new Date()) => {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const companies = COMPANY_NAMES.map((name, index) => buildCompany(name, index, nowMs));
  const details = {};
  const inventory = [];
  companies.forEach((company, index) => {
    const detail = buildCompanyDetail(company, index, nowMs);
    details[company.id] = detail;
    inventory.push(...buildDevices(company, detail.inventoryGroups, index));
  });
  const all = (key) => companies.flatMap((c) => details[c.id][key]);
  const byNewest = (field) => (a, b) => String(b[field]).localeCompare(String(a[field]));

  return {
    now: nowMs,
    companies,
    details,
    inventory,
    transactions: all("transactions").sort(byNewest("createdAt")),
    events: all("events").sort(byNewest("startsAt")),
    activity: all("activity").sort(byNewest("at")),
    audit: buildAudit(companies, nowMs),
  };
};
