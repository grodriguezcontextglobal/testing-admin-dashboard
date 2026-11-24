/* eslint-env node */
// The last block reads this file's own source from disk, so it runs with
// Node's globals available even though the test environment is happy-dom.
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  answerSegments,
  askError,
  ASSISTANT_ASK_PATH,
  ASSISTANT_CATALOG_PATH,
  buildAskRequest,
  catalogLabel,
  clockTime,
  describeAnswer,
  isCompanyUnknown,
  isPartial,
  isUnsupported,
  LABEL_MAX_CHARS,
  QUESTION_MAX_CHARS,
  questionError,
  readCatalog,
  readReply,
  requesterFromUser,
  retryAfterSeconds,
  safeSources,
  UNSUPPORTED_QUESTION_ID,
} from "./assistant";

describe("the routes", () => {
  // Its own namespace, NOT under /api/admin. A new route inside an existing
  // router can be shadowed by a parameter registered earlier, which in the
  // server's repository is not theoretical.
  it("is its own namespace rather than a route inside admin", () => {
    expect(ASSISTANT_ASK_PATH).toBe("/assistant/ask");
    expect(ASSISTANT_CATALOG_PATH).toBe("/assistant/catalog");
    expect(ASSISTANT_ASK_PATH.startsWith("/admin")).toBe(false);
  });
});

describe("questionError", () => {
  it("refuses an empty question before it costs a request", () => {
    expect(questionError("")).toBeTruthy();
    expect(questionError("   ")).toBeTruthy();
    expect(questionError(undefined)).toBeTruthy();
  });

  it("refuses a question past the server's cap, and says both numbers", () => {
    const tooLong = "a".repeat(QUESTION_MAX_CHARS + 1);
    const refusal = questionError(tooLong);
    expect(refusal).toContain(String(QUESTION_MAX_CHARS));
    expect(refusal).toContain(String(QUESTION_MAX_CHARS + 1));
  });

  it("accepts a question exactly at the cap", () => {
    expect(questionError("a".repeat(QUESTION_MAX_CHARS))).toBeNull();
  });

  it("measures the trimmed question, the way the server will", () => {
    expect(questionError(`  ${"a".repeat(QUESTION_MAX_CHARS)}  `)).toBeNull();
  });
});

describe("requesterFromUser", () => {
  const user = {
    uid: "mongo-staff",
    companyData: { id: "mongo-company" },
    sqlInfo: { company_id: 42, staff_id: 7 },
  };

  it("reads both id forms for the company and the staff member", () => {
    expect(requesterFromUser(user)).toEqual({
      companyId: "mongo-company",
      companySqlId: 42,
      staffMemberId: "mongo-staff",
      staffMemberSqlId: 7,
    });
  });

  it("falls back to sqlInfo.id, the way created_by already does", () => {
    const withoutStaffId = { ...user, sqlInfo: { company_id: 42, id: 9 } };
    expect(requesterFromUser(withoutStaffId).staffMemberSqlId).toBe(9);
  });

  // An empty string is not an id. Null says "we do not know".
  it("turns blanks into null rather than sending an empty id", () => {
    const blank = requesterFromUser({ uid: "  ", companyData: { id: "" }, sqlInfo: {} });
    expect(blank).toEqual({
      companyId: null,
      companySqlId: null,
      staffMemberId: null,
      staffMemberSqlId: null,
    });
  });

  it("survives no session at all", () => {
    expect(() => requesterFromUser(undefined)).not.toThrow();
  });
});

describe("buildAskRequest", () => {
  it("sends the trimmed question", () => {
    expect(buildAskRequest({ question: "  how many devices?  " }).question).toBe(
      "how many devices?",
    );
  });

  // Kept deliberately although the server never reads them (contract §3). The
  // test states the fact so nobody re-derives a purpose for them.
  it("still carries both id envelopes, with null for what we do not know", () => {
    const body = buildAskRequest({ question: "x", requester: { companyId: "c" } });
    expect(body.company_id).toEqual({ nosql: "c", sql: null });
    expect(body.staff_member_id).toEqual({ nosql: null, sql: null });
  });

  // §9: there is no conversation id on the server. Sending one would describe
  // a feature that does not exist.
  it("never sends a conversation id", () => {
    const body = buildAskRequest({ question: "x", conversationId: "abc" });
    expect(body).not.toHaveProperty("conversation_id");
  });

  it("drops keys it was not asked to send", () => {
    const body = buildAskRequest({ question: "x", role: "admin", sql: "DROP TABLE" });
    expect(Object.keys(body).sort()).toEqual(["company_id", "question", "staff_member_id"]);
  });
});

describe("readReply", () => {
  const answered = {
    ok: true,
    question_id: "company_devices_out",
    answer: "Tienes **4** equipos fuera.",
    data: { devicesOut: 4 },
    scope: { scoped: false, roleType: "admin" },
    params: {},
  };

  it("normalises an answered question", () => {
    const reply = readReply(answered);
    expect(reply.questionId).toBe("company_devices_out");
    expect(reply.data).toEqual({ devicesOut: 4 });
    expect(isUnsupported(reply)).toBe(false);
  });

  // The difference the backend asked us not to lose: unknown is not zero.
  it("keeps data null rather than turning it into an empty object", () => {
    const reply = readReply({ ...answered, data: null });
    expect(reply.data).toBeNull();
    expect(isCompanyUnknown(reply)).toBe(true);
  });

  it("does not call a miss an unknown company", () => {
    const reply = readReply({ question_id: UNSUPPORTED_QUESTION_ID, data: null });
    expect(isUnsupported(reply)).toBe(true);
    expect(isCompanyUnknown(reply)).toBe(false);
  });

  it("treats a reply with no question id as a miss", () => {
    expect(isUnsupported(readReply({}))).toBe(true);
  });

  it("reads the inlined catalogue of a miss, so no second call is needed", () => {
    const reply = readReply({
      question_id: UNSUPPORTED_QUESTION_ID,
      catalog: [{ id: "company_devices_out", label: "Equipos fuera" }],
    });
    expect(reply.catalog).toEqual([
      { id: "company_devices_out", label: "Equipos fuera" },
    ]);
  });

  it("reports a scoped answer as partial", () => {
    expect(isPartial(readReply({ ...answered, scope: { scoped: true } }))).toBe(true);
    expect(isPartial(readReply(answered))).toBe(false);
    expect(isPartial(readReply({}))).toBe(false);
  });

  it("survives a body that is not a reply at all", () => {
    expect(() => readReply(undefined)).not.toThrow();
    expect(readReply("nonsense").catalog).toEqual([]);
  });
});

describe("readCatalog", () => {
  it("reads the catalogue endpoint's own shape", () => {
    expect(readCatalog({ ok: true, catalog: [{ id: "a", label: "A" }] })).toEqual([
      { id: "a", label: "A" },
    ]);
  });

  it("reads a bare array", () => {
    expect(readCatalog([{ id: "a", label: "A" }])).toEqual([{ id: "a", label: "A" }]);
  });

  it("drops an entry with no id, which could not be asked anyway", () => {
    expect(readCatalog({ catalog: [{ label: "no id" }, { id: "a", label: "A" }] })).toEqual([
      { id: "a", label: "A" },
    ]);
  });

  it("caps a label that arrived as prose", () => {
    const [entry] = readCatalog({ catalog: [{ id: "a", label: "x".repeat(500) }] });
    expect(entry.label.length).toBe(LABEL_MAX_CHARS);
  });

  it("is an empty list for anything else", () => {
    expect(readCatalog(null)).toEqual([]);
    expect(readCatalog({ data: { devicesOut: 4 } })).toEqual([]);
  });
});

describe("catalogLabel", () => {
  it("uses our English label for a question we know", () => {
    expect(catalogLabel({ id: "company_devices_out", label: "Equipos fuera" })).toBe(
      "Devices out of the warehouse",
    );
  });

  // A catalogue entry we have never seen should still be offerable.
  it("falls back to the server's label for a question we do not know", () => {
    expect(catalogLabel({ id: "company_new_thing", label: "Algo nuevo" })).toBe("Algo nuevo");
  });

  it("is a string even for nonsense", () => {
    expect(catalogLabel(undefined)).toBe("");
  });
});

describe("answerSegments", () => {
  it("splits the server's bold markers into runs", () => {
    expect(answerSegments("Tienes **4** equipos.")).toEqual([
      { text: "Tienes ", bold: false },
      { text: "4", bold: true },
      { text: " equipos.", bold: false },
    ]);
  });

  it("leaves plain text alone", () => {
    expect(answerSegments("sin formato")).toEqual([{ text: "sin formato", bold: false }]);
  });

  // A stray marker should look like a typo, not make the rest of the sentence
  // bold and change how it reads.
  it("keeps an unclosed marker as text", () => {
    expect(answerSegments("Tienes **4 equipos")).toEqual([
      { text: "Tienes **4 equipos", bold: false },
    ]);
  });

  it("never returns an empty run", () => {
    for (const segment of answerSegments("**4** **5**")) {
      expect(segment.text.length).toBeGreaterThan(0);
    }
  });

  // Not one empty run: nothing at all, so a bubble with no text renders as an
  // empty bubble rather than as a stray node.
  it("has no runs for a missing answer", () => {
    expect(answerSegments(undefined)).toEqual([]);
    expect(answerSegments("")).toEqual([]);
  });
});

describe("describeAnswer", () => {
  const describe_ = (questionId, data) => describeAnswer({ questionId, data });

  it("counts devices out, with the verb agreeing", () => {
    expect(describe_("company_devices_out", { devicesOut: 4 })).toBe(
      "4 devices are out of the warehouse right now.",
    );
    expect(describe_("company_devices_out", { devicesOut: 1 })).toContain("1 device is");
  });

  it("does not render zero as nothing: zero is an answer", () => {
    expect(describe_("company_devices_out", { devicesOut: 0 })).toContain("0 devices");
  });

  it("splits the inventory summary into its three numbers", () => {
    expect(describe_("company_inventory_summary", { deviceCount: 128, devicesOut: 4, inWarehouse: 124 })).toBe(
      "128 devices in total: 4 out and 124 in the warehouse.",
    );
  });

  it("lists the events under their count", () => {
    const text = describe_("company_events_active", { activeEvents: 2, events: ["A", "B"] });
    expect(text).toContain("2 active events.");
    expect(text).toContain("• A");
    expect(text).toContain("• B");
  });

  it("prints a staff member with no role without a dangling dash", () => {
    const text = describe_("company_staff_list", {
      staffCount: 2,
      staff: [{ name: "Ana", role: null }, { name: "Beto", role: "admin" }],
    });
    expect(text).toContain("• Ana\n");
    expect(text).toContain("• Beto — admin");
    expect(text).not.toContain("null");
  });

  it("drops an activity row with no summary rather than printing null", () => {
    const text = describe_("company_activity_recent", {
      range: "30d",
      count: 2,
      activity: [{ summary: "Device assigned", actor: "Ana" }, { summary: null, actor: "system" }],
    });
    expect(text).toContain("2 entries in the last 30 days.");
    expect(text).toContain("• Device assigned — Ana");
    expect(text).not.toContain("null");
  });

  it("names the range it was given", () => {
    expect(describe_("company_activity_recent", { range: "7d", count: 0 })).toContain("7 days");
    expect(describe_("company_activity_recent", { range: "nonsense", count: 0 })).toContain(
      "the selected period",
    );
  });

  it("reads the subscription status the console's pill already understands", () => {
    expect(
      describe_("company_subscription_status", {
        plan: "Pro",
        subscriptionStatus: "active",
        status: "at_risk",
      }),
    ).toBe("Plan Pro, status at_risk.");
  });

  // The fallback that keeps a wrong number off the screen. A shape we do not
  // recognise is handed back to the server's own sentence, which is always
  // truthful even when it is not in our language.
  it("returns null for a question id we do not know", () => {
    expect(describe_("company_money_owed", { total: 900 })).toBeNull();
  });

  it("returns null when a field the sentence needs is missing", () => {
    expect(describe_("company_inventory_summary", { deviceCount: 10 })).toBeNull();
    expect(describe_("company_devices_out", { devicesOut: "four" })).toBeNull();
  });

  it("returns null for an unknown company rather than inventing a zero", () => {
    expect(describeAnswer({ questionId: "company_devices_out", data: null })).toBeNull();
  });
});

describe("clockTime", () => {
  const at = "2026-11-24T16:05:00Z";

  it("prints the hour and minute of a message", () => {
    expect(clockTime(at, { locale: "en-GB", timeZone: "UTC" })).toBe("16:05");
  });

  // The reader's own locale and zone by default: a fixed format would show a
  // staff member a time written the way nobody around them writes it.
  it("formats in the reader's locale by default", () => {
    expect(clockTime(at)).toBeTruthy();
  });

  // Empty rather than "Invalid Date": a line of metadata that cannot be
  // trusted should disappear, not shout.
  it("is empty for a timestamp it cannot read", () => {
    expect(clockTime("not a date")).toBe("");
    expect(clockTime(undefined)).toBe("");
    expect(clockTime(null)).toBe("");
    expect(clockTime({})).toBe("");
  });
});

describe("retryAfterSeconds", () => {
  const limited = (headers) => ({ response: { status: 429, headers } });

  it("prefers Retry-After, which answers the question directly", () => {
    expect(retryAfterSeconds(limited({ "retry-after": "30", "ratelimit-reset": "90" }))).toBe(30);
  });

  it("falls back to the standard RateLimit-Reset", () => {
    expect(retryAfterSeconds(limited({ "ratelimit-reset": "45" }))).toBe(45);
  });

  it("rounds a fractional reset up, so the advice is never early", () => {
    expect(retryAfterSeconds(limited({ "ratelimit-reset": "12.2" }))).toBe(13);
  });

  it("is null when the limiter said nothing we can use", () => {
    expect(retryAfterSeconds(limited({}))).toBeNull();
    expect(retryAfterSeconds(limited({ "retry-after": "soon" }))).toBeNull();
    expect(retryAfterSeconds(limited({ "retry-after": "0" }))).toBeNull();
    expect(retryAfterSeconds(undefined)).toBeNull();
  });
});

describe("askError", () => {
  const failure = (status, msg, headers = {}) => ({
    response: { status, headers, data: msg ? { ok: false, msg } : undefined },
  });

  it("tells the user when they may ask again", () => {
    const notice = askError(failure(429, null, { "ratelimit-reset": "45" }));
    expect(notice.description).toContain("45 seconds");
  });

  it("still says something useful when the limiter sent no reset", () => {
    expect(askError(failure(429)).description).toContain("10 questions");
  });

  // The server's own messages are written in English and for a reader.
  // Replacing them with a generic sentence would be losing information.
  it("passes the server's own refusal through", () => {
    expect(
      askError(failure(400, "Company context is required (send the s-company-lq header).")),
    ).toMatchObject({ description: "Company context is required (send the s-company-lq header)." });
    expect(askError(failure(403, "Not an active staff member of this company.")).description).toBe(
      "Not an active staff member of this company.",
    );
  });

  it("names the route when the endpoint is not deployed yet", () => {
    expect(askError(failure(404)).description).toContain("/api/assistant/ask");
  });

  it("has a sentence for a request that never reached the server", () => {
    expect(askError(new Error("Network Error")).title).toBe("Could not reach the assistant");
  });
});

describe("safeSources", () => {
  const label = "Inventory";

  // §9: the server does not send sources yet. The rule stays anyway -- the day
  // a link arrives is not the day to start deciding whether it may be clicked.
  it.each([
    "https://example.invalid/steal",
    "http://example.invalid",
    "//example.invalid/steal",
    "/\\example.invalid",
    "/\\/example.invalid",
    "javascript:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>",
    "inventory",
    "../admin",
    "/",
    "",
    "/inventory\\..\\admin",
  ])("refuses to make %s clickable", (path) => {
    const [source] = safeSources([{ label, path }], { isKnownRoute: () => true });
    expect(source).toEqual({ label, path: null });
  });

  it("keeps a path our own route table recognises", () => {
    const [source] = safeSources([{ label, path: "/inventory" }], {
      isKnownRoute: (candidate) => candidate === "/inventory",
    });
    expect(source.path).toBe("/inventory");
  });

  // Refusing the link is not refusing the source: the staff member should see
  // what the answer leaned on even when they cannot click it.
  it("keeps the label of a refused source", () => {
    const [source] = safeSources([{ label, path: "https://example.invalid" }]);
    expect(source.label).toBe(label);
  });

  it("refuses everything by default, so a wiring mistake is visible", () => {
    const [source] = safeSources([{ label, path: "/inventory" }]);
    expect(source.path).toBeNull();
  });

  it("drops a source with no label, which would render as nothing", () => {
    expect(safeSources([{ path: "/inventory" }, { label: "  " }])).toEqual([]);
  });

  it("caps a label that arrived as prose", () => {
    const [source] = safeSources([{ label: "x".repeat(500), path: "/x" }]);
    expect(source.label.length).toBe(LABEL_MAX_CHARS);
  });

  it("is an empty list for anything that is not a list", () => {
    expect(safeSources(undefined)).toEqual([]);
    expect(safeSources("sources")).toEqual([]);
  });
});

describe("the file itself", () => {
  // The rules about untrusted server text live here, and they have to stay
  // testable without mocking anything. An import is how that stops being true.
  it("imports nothing", () => {
    // Resolved from the repository root rather than from import.meta.url: the
    // test environment is happy-dom, where import.meta.url is an http URL and
    // fileURLToPath refuses it.
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/pages/assistant/utils/assistant.js"),
      "utf8",
    );
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toMatch(/\brequire\s*\(/);
  });
});
