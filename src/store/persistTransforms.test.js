import { describe, expect, it } from "vitest";

import { stripPasswordsTransform } from "./persistTransforms";

/* redux-persist writes the whole store to localStorage. The company sign-up
   keeps the typed password in admin.user between its two steps, so an
   abandoned sign-up left it there in plain text, indefinitely; and
   admin.user.data is the server's admin record, which can carry the bcrypt
   hash until the backend stops sending it. */
const toStorage = (admin) => stripPasswordsTransform.in(admin, "admin", {});
const fromStorage = (admin) => stripPasswordsTransform.out(admin, "admin", {});

describe("stripPasswordsTransform", () => {
  it("never writes the typed password to storage", () => {
    const stored = toStorage({
      status: "authenticated",
      user: { name: "Ana", email: "ana@x.org", password: "hunter2" },
    });
    expect(stored.user).toEqual({ name: "Ana", email: "ana@x.org" });
  });

  it("never writes a password hash that came inside the server record", () => {
    const stored = toStorage({ user: { email: "a@x.org", data: { email: "a@x.org", password: "$2a$10$abc" } } });
    expect(stored.user.data).toEqual({ email: "a@x.org" });
  });

  it("keeps everything else, and the session in memory, untouched", () => {
    const admin = {
      status: "authenticated",
      mfaEnabled: true,
      user: { token: "jwt", password: "hunter2", data: { mfaEnabled: true, password: "h" } },
    };
    const stored = toStorage(admin);
    expect(stored).toEqual({
      status: "authenticated",
      mfaEnabled: true,
      user: { token: "jwt", data: { mfaEnabled: true } },
    });
    // The in-memory store is not mutated: the sign-up still has its password.
    expect(admin.user.password).toBe("hunter2");
    expect(admin.user.data.password).toBe("h");
  });

  it("copes with the shapes onChecking and onLogout leave", () => {
    expect(toStorage({ user: [] }).user).toEqual([]);
    expect(toStorage({ user: undefined }).user).toBeUndefined();
    expect(toStorage(undefined)).toBeUndefined();
  });

  it("reads back what it wrote", () => {
    const stored = { user: { email: "a@x.org" } };
    expect(fromStorage(stored)).toBe(stored);
  });
});
