/**
 * Summit Unified demo roster — the believable data behind the staged sales demo.
 *
 * 12 students spanning the full compliance matrix (adult / minor / under-13 ×
 * consent valid / missing / outdated / no-guardian). Emails use the reserved
 * `.test` TLD so nothing can accidentally reach a real inbox.
 *
 * DOBs are fixed dates chosen to yield the target age as of ~2026; the server
 * derives minor / under-13 from the date at runtime. The seeder
 * (loadDemoData.js) creates these as members with their date_of_birth and links
 * a guardian for each minor.
 *
 * `consent` records the INTENDED demo state, for reference only — the seeder
 * does not (and cannot) create it. Guardian consent is an OTC email flow: the
 * guardian agrees on the public consent page, so these states have to be
 * produced by driving the real flow before the demo.
 *   "valid" (agreed) | "outdated" (stale policy) | "missing" | "none" (adult)
 */
export const DEMO_ROSTER = [
  {
    slug: "maya-thompson",
    first_name: "Maya",
    last_name: "Thompson",
    email: "maya.thompson@summitdemo.test",
    phone: "555-0101",
    school: "Lincoln Elementary",
    grade: "5",
    homeroom: "Rivera 5A",
    date_of_birth: "2015-03-15", // ~11
    minor: true,
    guardian: {
      first_name: "Sarah",
      last_name: "Thompson",
      email: "sarah.thompson@summitdemo.test",
      phone: "555-0102",
    },
    consent: "missing", // ⭐ centerpiece: under-13, guardian on file, no consent
  },
  {
    slug: "diego-ramirez",
    first_name: "Diego",
    last_name: "Ramirez",
    email: "diego.ramirez@summitdemo.test",
    phone: "555-0103",
    school: "Lincoln Elementary",
    grade: "3",
    homeroom: "Okafor 3B",
    date_of_birth: "2018-06-10", // ~8
    minor: true,
    guardian: {
      first_name: "Elena",
      last_name: "Ramirez",
      email: "elena.ramirez@summitdemo.test",
      phone: "555-0104",
    },
    consent: "valid", // compliant under-13 (contrast case)
  },
  {
    slug: "aisha-khan",
    first_name: "Aisha",
    last_name: "Khan",
    email: "aisha.khan@summitdemo.test",
    phone: "555-0105",
    school: "Summit Middle",
    grade: "6",
    homeroom: "Bell 6C",
    date_of_birth: "2015-09-01", // ~11
    minor: false, // created without guardian; staged DOB makes them under-13
    guardian: null,
    consent: "missing", // → NO_GUARDIAN edge case
  },
  {
    slug: "ethan-brooks",
    first_name: "Ethan",
    last_name: "Brooks",
    email: "ethan.brooks@summitdemo.test",
    phone: "555-0106",
    school: "Roosevelt High School",
    grade: "9",
    homeroom: "Nguyen 9A",
    date_of_birth: "2012-02-20", // ~14
    minor: true,
    guardian: {
      first_name: "Marcus",
      last_name: "Brooks",
      email: "marcus.brooks@summitdemo.test",
      phone: "555-0107",
    },
    consent: "missing", // general minor gate (not under-13)
  },
  {
    slug: "sophia-nguyen",
    first_name: "Sophia",
    last_name: "Nguyen",
    email: "sophia.nguyen@summitdemo.test",
    phone: "555-0108",
    school: "Roosevelt High School",
    grade: "11",
    homeroom: "Patel 11B",
    date_of_birth: "2010-11-05", // ~16
    minor: true,
    guardian: {
      first_name: "Linh",
      last_name: "Nguyen",
      email: "linh.nguyen@summitdemo.test",
      phone: "555-0109",
    },
    consent: "outdated", // consent on file but policy v0 (required is v1)
  },
  {
    slug: "liam-carter",
    first_name: "Liam",
    last_name: "Carter",
    email: "liam.carter@summitdemo.test",
    phone: "555-0110",
    school: "Summit Middle",
    grade: "8",
    homeroom: "Diaz 8A",
    date_of_birth: "2013-04-12", // ~13
    minor: true,
    guardian: {
      first_name: "Grace",
      last_name: "Carter",
      email: "grace.carter@summitdemo.test",
      phone: "555-0111",
    },
    consent: "valid",
  },
  {
    slug: "jordan-alvarez",
    first_name: "Jordan",
    last_name: "Alvarez",
    email: "jordan.alvarez@summitdemo.test",
    phone: "555-0112",
    school: "Roosevelt High School",
    grade: "12",
    homeroom: "Reed 12A",
    date_of_birth: "2008-01-30", // ~18 — adult
    minor: false,
    guardian: null,
    consent: "none",
  },
  {
    slug: "olivia-martinez",
    first_name: "Olivia",
    last_name: "Martinez",
    email: "olivia.martinez@summitdemo.test",
    phone: "555-0113",
    school: "Roosevelt High School",
    grade: "10",
    homeroom: "Kim 10B",
    date_of_birth: "2011-07-01", // ~15
    minor: true,
    guardian: {
      first_name: "Rosa",
      last_name: "Martinez",
      email: "rosa.martinez@summitdemo.test",
      phone: "555-0114",
    },
    consent: "valid",
  },
  {
    slug: "noah-kim",
    first_name: "Noah",
    last_name: "Kim",
    email: "noah.kim@summitdemo.test",
    phone: "555-0115",
    school: "Lincoln Elementary",
    grade: "4",
    homeroom: "Rivera 4A",
    date_of_birth: "2016-05-22", // ~10
    minor: true,
    guardian: {
      first_name: "Jenny",
      last_name: "Kim",
      email: "jenny.kim@summitdemo.test",
      phone: "555-0116",
    },
    consent: "valid",
  },
  {
    slug: "emma-davis",
    first_name: "Emma",
    last_name: "Davis",
    email: "emma.davis@summitdemo.test",
    phone: "555-0117",
    school: "Summit Middle",
    grade: "7",
    homeroom: "Bell 7A",
    date_of_birth: "2014-08-19", // ~12 — compliant under-13
    minor: true,
    guardian: {
      first_name: "Paul",
      last_name: "Davis",
      email: "paul.davis@summitdemo.test",
      phone: "555-0118",
    },
    consent: "valid",
  },
  {
    slug: "lucas-wright",
    first_name: "Lucas",
    last_name: "Wright",
    email: "lucas.wright@summitdemo.test",
    phone: "555-0119",
    school: "Roosevelt High School",
    grade: "11",
    homeroom: "Patel 11A",
    date_of_birth: "2009-10-03", // ~17
    minor: true,
    guardian: {
      first_name: "Karen",
      last_name: "Wright",
      email: "karen.wright@summitdemo.test",
      phone: "555-0120",
    },
    consent: "valid",
  },
  {
    slug: "ava-robinson",
    first_name: "Ava",
    last_name: "Robinson",
    email: "ava.robinson@summitdemo.test",
    phone: "555-0121",
    school: "Lincoln Elementary",
    grade: "3",
    homeroom: "Okafor 3A",
    date_of_birth: "2017-12-11", // ~9
    minor: true,
    guardian: {
      first_name: "Tom",
      last_name: "Robinson",
      email: "tom.robinson@summitdemo.test",
      phone: "555-0122",
    },
    consent: "missing", // 2nd under-13 pending (import auto-flag demo)
  },
];
