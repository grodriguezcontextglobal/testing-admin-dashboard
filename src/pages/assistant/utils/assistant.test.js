import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  ASSISTANT_ASK_PATH,
  QUESTION_MAX_CHARS,
  LABEL_MAX_CHARS,
  questionError,
  buildAskRequest,
  readAskJobId,
  readAnswer,
  assistantJob,
  askStartError,
  safeSources,
  requesterFromUser,
} from "./assistant";

describe("questionError", () => {
  it("refuses an empty question before it costs a request", () => {
    expect(questionError("")).toBeTruthy();
    expect(questionError("   \n  ")).toBeTruthy();
    expect(questionError(undefined)).toBeTruthy();
  });

  it("refuses one over the cap, and says the cap", () => {
    const tooLong = "a".repeat(QUESTION_MAX_CHARS + 1);
    const message = questionError(tooLong);
    expect(message).toContain(String(QUESTION_MAX_CHARS));
  });

  it("accepts a question exactly at the cap", () => {
    expect(questionError("a".repeat(QUESTION_MAX_CHARS))).toBeNull();
  });

  it("accepts an ordinary question", () => {
    expect(questionError("Which devices are overdue this week?")).toBeNull();
  });
});

describe("buildAskRequest", () => {
  it("sends the trimmed question", () => {
    expect(buildAskRequest({ question: "  hello  " }).question).toBe("hello");
  });

  it("carries a conversation id only when there is one", () => {
    expect(buildAskRequest({ question: "x", conversationId: "c1" }).conversation_id).toBe("c1");
    expect(buildAskRequest({ question: "x", conversationId: "" })).not.toHaveProperty(
      "conversation_id",
    );
    expect(buildAskRequest({ question: "x", conversationId: null })).not.toHaveProperty(
      "conversation_id",
    );
  });

  // The agent answers better when it knows which company and which staff
  // member is asking, and this product runs on two databases, so each id has
  // a Mongo and a SQL form. Both go, because the agent reaching either store
  // with only the other one's id would have to look it up to start.
  it("carries both forms of both ids", () => {
    const body = buildAskRequest({
      question: "x",
      requester: {
        companyId: "65f0c0ffee",
        companySqlId: 12,
        staffMemberId: "65f0beef",
        staffMemberSqlId: 34,
      },
    });
    expect(body.company_id).toEqual({ nosql: "65f0c0ffee", sql: 12 });
    expect(body.staff_member_id).toEqual({ nosql: "65f0beef", sql: 34 });
  });

  // A predictable shape beats a minimal one: the agent should never have to
  // branch on whether a key exists. A null says "we do not have this", which
  // is information; a missing key is silence, which reads the same as a bug.
  it("sends null rather than dropping an id it does not have", () => {
    const body = buildAskRequest({ question: "x", requester: { companyId: "only-this" } });
    expect(body.company_id).toEqual({ nosql: "only-this", sql: null });
    expect(body.staff_member_id).toEqual({ nosql: null, sql: null });
  });

  it("still sends both envelopes when it knows nothing", () => {
    const body = buildAskRequest({ question: "x" });
    expect(body.company_id).toEqual({ nosql: null, sql: null });
    expect(body.staff_member_id).toEqual({ nosql: null, sql: null });
  });

  // The body stays a shape the backend can validate. Anything else handed to
  // this function is dropped rather than forwarded, so a caller cannot grow
  // the contract by accident.
  it("sends nothing beyond the agreed fields", () => {
    const body = buildAskRequest({
      question: "x",
      conversationId: "c1",
      requester: { companyId: "a", role: "admin", token: "secret" },
      role: "admin",
      extra: "no",
    });
    expect(Object.keys(body).sort()).toEqual([
      "company_id",
      "conversation_id",
      "question",
      "staff_member_id",
    ]);
    expect(JSON.stringify(body)).not.toContain("secret");
  });
});

describe("requesterFromUser", () => {
  const user = {
    uid: "65f0beef",
    companyData: { id: "65f0c0ffee" },
    sqlInfo: { company_id: 12, staff_id: 34 },
  };

  it("reads the four ids from the session", () => {
    expect(requesterFromUser(user)).toEqual({
      companyId: "65f0c0ffee",
      companySqlId: 12,
      staffMemberId: "65f0beef",
      staffMemberSqlId: 34,
    });
  });

  // The fallback the rest of the dashboard already uses when writing
  // created_by (CreateLocationModal, CreateSubLocationPathModal). Copied
  // rather than invented so the assistant names the same staff member the
  // rest of the app does.
  it("falls back to sqlInfo.id when there is no staff_id", () => {
    const legacy = { ...user, sqlInfo: { company_id: 12, id: 99 } };
    expect(requesterFromUser(legacy).staffMemberSqlId).toBe(99);
  });

  it("prefers uid over id for the Mongo staff id", () => {
    expect(requesterFromUser({ ...user, id: "other" }).staffMemberId).toBe("65f0beef");
    expect(requesterFromUser({ id: "other" }).staffMemberId).toBe("other");
  });

  it("is all nulls rather than a throw when there is no session", () => {
    expect(requesterFromUser(undefined)).toEqual({
      companyId: null,
      companySqlId: null,
      staffMemberId: null,
      staffMemberSqlId: null,
    });
  });

  // An empty string is not an id. Sending "" would have the agent look up a
  // company that cannot exist and answer about nothing, instead of the server
  // noticing that we do not know who is asking.
  it("turns blanks into nulls", () => {
    const blank = { uid: "  ", companyData: { id: "" }, sqlInfo: { company_id: "" } };
    expect(requesterFromUser(blank)).toEqual({
      companyId: null,
      companySqlId: null,
      staffMemberId: null,
      staffMemberSqlId: null,
    });
  });
});

describe("readAskJobId", () => {
  it("reads the id from either envelope", () => {
    expect(readAskJobId({ jobId: "j1" })).toBe("j1");
    expect(readAskJobId({ data: { jobId: "j2" } })).toBe("j2");
  });

  // A job tracked without an id polls nothing for the rest of the session and
  // never tells the user anything. Same reason as the exports.
  it("is null when there is no usable id", () => {
    expect(readAskJobId({})).toBeNull();
    expect(readAskJobId(undefined)).toBeNull();
    expect(readAskJobId({ jobId: "" })).toBeNull();
    expect(readAskJobId({ jobId: 7 })).toBeNull();
  });
});

describe("readAnswer", () => {
  it("passes the markdown through", () => {
    expect(readAnswer({ answer: "# hi" })).toBe("# hi");
    expect(readAnswer({ data: { answer: "# hi" } })).toBe("# hi");
  });

  it("is an empty string when the server sent no text", () => {
    expect(readAnswer({})).toBe("");
    expect(readAnswer({ answer: { not: "text" } })).toBe("");
    expect(readAnswer(null)).toBe("");
  });
});

describe("assistantJob", () => {
  it("is a job the tracker can follow", () => {
    const job = assistantJob({ jobId: "j1" });
    expect(job.jobId).toBe("j1");
    expect(job.type).toBe("assistant-ask");
    expect(job.successMessage).toBeTruthy();
    expect(job.failureMessage).toBeTruthy();
  });

  // No file to collect, so no button. A download descriptor here would put a
  // "Download" button on an answer that is text on the screen already.
  it("has nothing to download", () => {
    expect(assistantJob({ jobId: "j1" }).download).toBeUndefined();
  });

  it("invalidates nothing", () => {
    expect(assistantJob({ jobId: "j1" }).invalidateKeys).toEqual([]);
  });
});

describe("askStartError", () => {
  it("names the route when the server does not have it yet", () => {
    const notice = askStartError({ response: { status: 404 } });
    expect(notice.description).toContain(ASSISTANT_ASK_PATH);
  });

  it("tells the user to sign in again on a refusal", () => {
    for (const status of [401, 403]) {
      expect(askStartError({ response: { status } }).title).toBeTruthy();
      expect(askStartError({ response: { status } }).description).toMatch(/sign in/i);
    }
  });

  it("says to wait when rate limited", () => {
    expect(askStartError({ response: { status: 429 } }).description).toMatch(/wait/i);
  });

  it("still says something when there is no status at all", () => {
    expect(askStartError(undefined).title).toBeTruthy();
    expect(askStartError(undefined).description).toBeTruthy();
  });
});

describe("safeSources", () => {
  const knowsInventory = (p) => p === "/inventory";

  // The source of the rule: the answer and its links come from a model, and a
  // model can be steered by the text of the question. A link rendered as given
  // is a destination chosen by whoever wrote the question, inside our
  // interface, with the staff session open.
  it("fails closed: with no route matcher, nothing is clickable", () => {
    const out = safeSources([{ label: "Device ABC-001", path: "/inventory" }]);
    expect(out).toEqual([{ label: "Device ABC-001", path: null }]);
  });

  it("keeps a path the route table recognises", () => {
    const out = safeSources([{ label: "Inventory", path: "/inventory" }], {
      isKnownRoute: knowsInventory,
    });
    expect(out).toEqual([{ label: "Inventory", path: "/inventory" }]);
  });

  it("refuses a path the route table does not recognise", () => {
    const out = safeSources([{ label: "Nope", path: "/not-a-route" }], {
      isKnownRoute: knowsInventory,
    });
    expect(out).toEqual([{ label: "Nope", path: null }]);
  });

  // Every one of these is a real way to leave the application while looking
  // like an in-app link. They are refused before the route matcher is even
  // consulted, so a permissive matcher cannot let them through.
  it.each([
    ["an absolute url", "https://evil.example/steal"],
    ["an http url", "http://evil.example"],
    ["a javascript scheme", "javascript:alert(1)"],
    ["a spaced javascript scheme", "  javascript:alert(1)"],
    ["a cased javascript scheme", "JavaScript:alert(1)"],
    ["a data url", "data:text/html,<script>1</script>"],
    ["a protocol-relative url", "//evil.example/steal"],
    ["a backslash protocol-relative url", "/\\evil.example"],
    ["a mixed slash url", "/\\/evil.example"],
    ["a bare word", "inventory"],
    ["an empty path", ""],
    ["a non-string", 7],
  ])("refuses %s even when the matcher is permissive", (_name, bad) => {
    const out = safeSources([{ label: "x", path: bad }], { isKnownRoute: () => true });
    expect(out).toEqual([{ label: "x", path: null }]);
  });

  // Refusing the link is not refusing the source. The staff member should
  // still see what the answer was leaning on, as text they can read and judge.
  it("keeps the label when it refuses the path", () => {
    const out = safeSources([{ label: "Device ABC-001", path: "https://evil.example" }], {
      isKnownRoute: () => true,
    });
    expect(out[0].label).toBe("Device ABC-001");
  });

  // A label is a few words naming a thing. A paragraph in that slot is a
  // message written by the model into our chrome, where it reads as ours.
  it("caps a label that is trying to be a paragraph", () => {
    const out = safeSources([{ label: "a".repeat(LABEL_MAX_CHARS + 50), path: "/x" }]);
    expect(out[0].label).toHaveLength(LABEL_MAX_CHARS);
  });

  it("drops a source with no usable label", () => {
    expect(safeSources([{ path: "/inventory" }, { label: "   ", path: "/x" }])).toEqual([]);
  });

  it("is an empty list when the server sent no sources", () => {
    expect(safeSources(undefined)).toEqual([]);
    expect(safeSources(null)).toEqual([]);
    expect(safeSources("sources")).toEqual([]);
    expect(safeSources([null, 7])).toEqual([]);
  });
});

describe("the module itself", () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(path.join(here, "assistant.js"), "utf8");

  // Pure means pure: no api client, no store, no React. The guard is here
  // because this file is the one place where the rules about untrusted model
  // output live, and it has to stay testable without mocking anything.
  it("imports nothing", () => {
    expect(source).not.toMatch(/^\s*import\s/m);
  });
});
