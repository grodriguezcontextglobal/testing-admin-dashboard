import { describe, it, expect } from "vitest";
import { createAssistantStub, STUB_CATALOG } from "./assistantStub";
import {
  catalogLabel,
  describeAnswer,
  isCompanyUnknown,
  isPartial,
  isUnsupported,
  readCatalog,
  readReply,
  retryAfterSeconds,
} from "../assistant";

const stub = () => createAssistantStub();
const ask = (question) => readReply(stub().ask({ question }));

describe("the stub answers synchronously, the way the server does", () => {
  // The whole point of the 2026-11-24 rewrite. There is no job and nothing to
  // poll: a stub that still returned a job id would have us build a spinner
  // for a wait that does not happen.
  it("returns the answer itself, not a job to follow", () => {
    const reply = stub().ask({ question: "cuantos equipos tengo fuera" });
    expect(reply).not.toHaveProperty("jobId");
    expect(reply.question_id).toBe("company_devices_out");
    expect(reply.data).toEqual({ devicesOut: 4 });
  });

  it("matches in Spanish and in English", () => {
    expect(ask("cuantos equipos fuera").questionId).toBe("company_devices_out");
    expect(ask("how many devices are out").questionId).toBe("company_devices_out");
    expect(ask("resumen de inventario").questionId).toBe("company_inventory_summary");
    expect(ask("inventory summary").questionId).toBe("company_inventory_summary");
  });
});

describe("the states the window has to render", () => {
  // The most likely thing a real user will see, because matching is keyword
  // based and the backend says plainly that it will miss.
  it("misses, and a miss is an answer with the catalogue in it", () => {
    const reply = ask("unsupported: what is the meaning of life");
    expect(isUnsupported(reply)).toBe(true);
    expect(reply.catalog.length).toBe(STUB_CATALOG.length);
    expect(reply.data).toBeNull();
  });

  it("misses on a question that matches nothing at all", () => {
    expect(isUnsupported(ask("xyzzy"))).toBe(true);
  });

  // A scoped staff member reads a smaller number than the real one. Without a
  // notice they read their own blind spot as a fact.
  it("can return a scoped answer", () => {
    const reply = ask("scoped: equipos fuera");
    expect(isPartial(reply)).toBe(true);
    expect(isPartial(ask("equipos fuera"))).toBe(false);
  });

  // Unknown and zero are different sentences about the business.
  it("can fail to resolve the company, with data null and not a zero", () => {
    const reply = ask("unknown: equipos fuera");
    expect(isCompanyUnknown(reply)).toBe(true);
    expect(describeAnswer(reply)).toBeNull();
  });

  it("can refuse with the limiter, carrying the headers that say when to return", () => {
    expect(() => stub().ask({ question: "429 please" })).toThrow();
    try {
      stub().ask({ question: "429 please" });
    } catch (failure) {
      expect(failure.response.status).toBe(429);
      expect(retryAfterSeconds(failure)).toBe(45);
    }
  });
});

describe("the stub and our readers agree", () => {
  it("serves a catalogue our reader understands", () => {
    const catalog = readCatalog(stub().catalog());
    expect(catalog.length).toBe(STUB_CATALOG.length);
    for (const entry of catalog) expect(entry.id).toBeTruthy();
  });

  // The stub speaks Spanish because the server does (§4). This is the test
  // that proves the window will not: every catalogue question it can answer
  // has an English label and an English sentence of our own.
  it("has an English label for every question it can answer", () => {
    for (const entry of STUB_CATALOG) {
      expect(catalogLabel(entry)).not.toBe(entry.label);
      expect(catalogLabel(entry).length).toBeGreaterThan(0);
    }
  });

  it("has an English sentence for every question it can answer", () => {
    for (const entry of STUB_CATALOG) {
      const reply = readReply(stub().ask({ question: catalogLabel(entry) }));
      expect(reply.questionId, `"${catalogLabel(entry)}" did not match`).toBe(entry.id);
      expect(describeAnswer(reply), `no English sentence for ${entry.id}`).toBeTruthy();
    }
  });

  // The server's own text stays available as a fallback, so a question id we
  // stop recognising degrades to a truthful Spanish sentence rather than to
  // nothing.
  it("always sends an answer string as well as the data", () => {
    for (const entry of STUB_CATALOG) {
      const reply = readReply(stub().ask({ question: catalogLabel(entry) }));
      expect(reply.answer.length).toBeGreaterThan(0);
    }
  });
});
