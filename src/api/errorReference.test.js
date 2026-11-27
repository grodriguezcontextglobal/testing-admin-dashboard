import { describe, it, expect } from "vitest";
import { attachErrorReference, errorReferenceLog, readErrorReference } from "./errorReference";

const REF = "a3f91c2b4e07";

/** A failed response the way axios hands it to an interceptor. */
const failure = ({ data, headers, status = 500 } = {}) => ({ response: { status, data, headers } });

describe("readErrorReference", () => {
  it("reads the reference the server put in the body", () => {
    const error = failure({
      data: { ok: false, msg: "The server could not complete the request", ref: REF },
    });
    expect(readErrorReference(error)).toBe(REF);
  });

  it("prefers the body over the header when both are there", () => {
    const error = failure({ data: { ref: REF }, headers: { "x-error-ref": "0000deadbeef" } });
    expect(readErrorReference(error)).toBe(REF);
  });

  it("falls back to the header when the body carries none", () => {
    expect(readErrorReference(failure({ data: { ok: false }, headers: { "x-error-ref": REF } }))).toBe(
      REF,
    );
  });

  it("reads the header whatever case it arrives in", () => {
    // Axios lowercases response header names, but a mock, a test double or a
    // different client may not, and the name is case-insensitive on the wire.
    expect(readErrorReference(failure({ headers: { "X-Error-Ref": REF } }))).toBe(REF);
  });

  it("reads an AxiosHeaders object through its own getter", () => {
    const headers = { get: (name) => (name.toLowerCase() === "x-error-ref" ? REF : undefined) };
    expect(readErrorReference(failure({ headers }))).toBe(REF);
  });

  it("trims what it finds", () => {
    expect(readErrorReference(failure({ data: { ref: `  ${REF}\n` } }))).toBe(REF);
  });

  it("is null for an empty or blank reference", () => {
    expect(readErrorReference(failure({ data: { ref: "" } }))).toBeNull();
    expect(readErrorReference(failure({ data: { ref: "   " } }))).toBeNull();
    expect(readErrorReference(failure({ headers: { "x-error-ref": "" } }))).toBeNull();
  });

  it("is null for anything that is not a string", () => {
    expect(readErrorReference(failure({ data: { ref: 123 } }))).toBeNull();
    expect(readErrorReference(failure({ data: { ref: { id: REF } } }))).toBeNull();
    expect(readErrorReference(failure({ data: { ref: null } }))).toBeNull();
  });

  it("is null when the response carries neither", () => {
    expect(readErrorReference(failure({ data: { ok: false, msg: "no" }, headers: {} }))).toBeNull();
    expect(readErrorReference(failure())).toBeNull();
  });

  it("is null when a body arrives as a string rather than an object", () => {
    expect(readErrorReference(failure({ data: "Internal Server Error" }))).toBeNull();
  });

  it("invents nothing for an error with no response at all", () => {
    // A network failure, a timeout, a switched server: nothing reached the
    // API, so there is no reference and a made-up one would be worse than none.
    expect(readErrorReference({ message: "Network Error" })).toBeNull();
    expect(readErrorReference(undefined)).toBeNull();
    expect(readErrorReference(null)).toBeNull();
  });
});

describe("attachErrorReference", () => {
  it("puts the reference on the error every caller already receives", () => {
    const error = failure({ data: { ref: REF } });
    attachErrorReference(error);
    expect(error.errorRef).toBe(REF);
  });

  it("returns the same error object, not a copy", () => {
    const error = failure({ data: { ref: REF } });
    expect(attachErrorReference(error)).toBe(error);
  });

  it("leaves the property absent when there is no reference", () => {
    // Not `errorRef: null`: a screen asking "is there a reference?" should get
    // a straight no, and nothing downstream should render the word for an
    // error that never carried one.
    const error = failure({ data: { ok: false } });
    attachErrorReference(error);
    expect("errorRef" in error).toBe(false);
  });

  it("is safe on an error with no response", () => {
    const error = { message: "Network Error" };
    expect(() => attachErrorReference(error)).not.toThrow();
    expect("errorRef" in error).toBe(false);
  });
});

describe("errorReferenceLog", () => {
  it("names the reference beside the request that failed", () => {
    expect(errorReferenceLog({ ref: REF, method: "post", url: "https://api.devitrak.net/api/db_item" })).toBe(
      `Devitrak API error ref ${REF} — POST https://api.devitrak.net/api/db_item`,
    );
  });

  it("says what it knows when the method is missing", () => {
    expect(errorReferenceLog({ ref: REF, url: "/api/platform/companies/42" })).toBe(
      `Devitrak API error ref ${REF} — /api/platform/companies/42`,
    );
  });

  it("is still a usable line with the reference alone", () => {
    expect(errorReferenceLog({ ref: REF })).toBe(`Devitrak API error ref ${REF}`);
  });
});
