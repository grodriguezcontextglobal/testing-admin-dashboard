import { describe, expect, it } from "vitest";
import {
  RECOVERY_NOTICE_KEY,
  readRecoveryCodeUse,
  readRecoveryCodes,
  recoveryCodeUseNotice,
  recoveryCodesFileText,
  stashRecoveryNotice,
  takeRecoveryNotice,
} from "./mfaRecovery";

// FedRAMP A5 (FRONTEND_fedramp_a5_mfa_recovery_2026-10-27, IA-2, IA-5): ten
// one-time recovery codes, shown only when MFA is turned on or regenerated.
const CODES = Array.from({ length: 10 }, (_, i) => `k3vq-7xpa-m2ne-tz${i}c`);

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
};

describe("readRecoveryCodes", () => {
  it("returns the codes a verify or regenerate answer carries", () => {
    expect(readRecoveryCodes({ ok: true, recoveryCodes: CODES })).toEqual(CODES);
  });

  it("is null when there are none, as on a repeated verify", () => {
    expect(readRecoveryCodes({ ok: true })).toBeNull();
    expect(readRecoveryCodes({ recoveryCodes: [] })).toBeNull();
    expect(readRecoveryCodes(undefined)).toBeNull();
  });

  it("drops anything that is not a code", () => {
    expect(readRecoveryCodes({ recoveryCodes: ["a-b", "", null, 3] })).toEqual(["a-b"]);
  });
});

describe("recoveryCodesFileText", () => {
  it("lists every code with the account and says each works once", () => {
    const text = recoveryCodesFileText(CODES, { email: "ana@x.com", date: new Date("2026-10-29T12:00:00Z") });
    CODES.forEach((code) => expect(text).toContain(code));
    expect(text).toContain("ana@x.com");
    expect(text).toContain("2026-10-29");
    expect(text).toMatch(/once/i);
  });
});

describe("readRecoveryCodeUse", () => {
  it("reads how many codes are left after signing in with one", () => {
    expect(readRecoveryCodeUse({ recoveryCodeUsed: true, recoveryCodesRemaining: 7 })).toEqual({ remaining: 7 });
  });

  it("is null for a sign-in with the app code", () => {
    expect(readRecoveryCodeUse({ token: "jwt" })).toBeNull();
    expect(readRecoveryCodeUse(undefined)).toBeNull();
  });
});

describe("recoveryCodeUseNotice", () => {
  it("reminds to set up the new device or make new codes", () => {
    const notice = recoveryCodeUseNotice({ remaining: 7 });
    expect(notice.type).toBe("warning");
    expect(notice.title).toContain("7 recovery codes left");
    expect(notice.description).toMatch(/new device|new codes/i);
  });

  it("insists, and stays on screen, with two codes or fewer", () => {
    const notice = recoveryCodeUseNotice({ remaining: 2 });
    expect(notice.type).toBe("error");
    expect(notice.persistent).toBe(true);
    expect(recoveryCodeUseNotice({ remaining: 1 }).title).toContain("1 recovery code left");
    expect(recoveryCodeUseNotice({ remaining: 0 }).title).toMatch(/no recovery codes left/i);
  });
});

describe("stashRecoveryNotice and takeRecoveryNotice", () => {
  it("hands the notice across the navigation once", () => {
    const storage = memoryStorage();
    stashRecoveryNotice(storage, { remaining: 2 });
    expect(storage.getItem(RECOVERY_NOTICE_KEY)).not.toBeNull();
    expect(takeRecoveryNotice(storage)).toEqual(recoveryCodeUseNotice({ remaining: 2 }));
    expect(takeRecoveryNotice(storage)).toBeNull();
  });

  it("survives storage that throws or holds junk", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} };
    expect(() => stashRecoveryNotice(broken, { remaining: 3 })).not.toThrow();
    expect(takeRecoveryNotice(broken)).toBeNull();
    const junk = memoryStorage();
    junk.setItem(RECOVERY_NOTICE_KEY, "{not json");
    expect(takeRecoveryNotice(junk)).toBeNull();
  });
});
