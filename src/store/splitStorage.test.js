import { describe, expect, it } from "vitest";
import { SESSION_ONLY_SLICES, createSplitStorage } from "./splitStorage";

/** A Web Storage stand-in: the same getItem / setItem / removeItem surface. */
const memoryStorage = () => {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    has: (key) => items.has(key),
    raw: (key) => items.get(key),
  };
};

// What redux-persist writes: each slice serialized on its own, then the whole.
const persisted = (slices) =>
  JSON.stringify(
    Object.fromEntries(Object.entries(slices).map(([key, value]) => [key, JSON.stringify(value)]))
  );

const KEY = "persist:root";

const setup = () => {
  const persistent = memoryStorage();
  const session = memoryStorage();
  return { persistent, session, storage: createSplitStorage({ persistent, session }) };
};

describe("createSplitStorage", () => {
  // FedRAMP F1.4 §3.2: people's records left on disk after the tab closes.
  it("keeps people's records out of the persistent store", async () => {
    const { persistent, session, storage } = setup();
    await storage.setItem(
      KEY,
      persisted({
        admin: { user: { email: "staff@x.co" } },
        member: { memberInfo: { first_name: "Ana" } },
        customer: { customer: { email: "guest@x.co" } },
        _persist: { version: 1, rehydrated: true },
      })
    );

    const onDisk = JSON.parse(persistent.raw(KEY));
    expect(Object.keys(onDisk).sort()).toEqual(["_persist", "admin"]);
    const inTab = JSON.parse(session.raw(KEY));
    expect(Object.keys(inTab).sort()).toEqual(["customer", "member"]);
  });

  it("reads both halves back as the one state redux-persist wrote", async () => {
    const { storage } = setup();
    const written = persisted({
      admin: { user: { email: "staff@x.co" } },
      stripe: { customer: { uid: "c1" } },
      _persist: { version: 1, rehydrated: true },
    });
    await storage.setItem(KEY, written);
    expect(JSON.parse(await storage.getItem(KEY))).toEqual(JSON.parse(written));
  });

  // A browser that already holds the old, single copy rehydrates from it as
  // before; the next write splits it.
  it("still reads a store written before the split", async () => {
    const { persistent, storage } = setup();
    const legacy = persisted({ admin: { user: {} }, member: { memberInfo: { id: 1 } } });
    persistent.setItem(KEY, legacy);

    expect(JSON.parse(await storage.getItem(KEY))).toEqual(JSON.parse(legacy));

    await storage.setItem(KEY, legacy);
    expect(Object.keys(JSON.parse(persistent.raw(KEY)))).toEqual(["admin"]);
  });

  it("answers null when nothing was ever written", async () => {
    const { storage } = setup();
    expect(await storage.getItem(KEY)).toBeNull();
  });

  // Purging on logout removes both halves.
  it("removes both halves", async () => {
    const { persistent, session, storage } = setup();
    await storage.setItem(KEY, persisted({ admin: {}, member: {} }));
    await storage.removeItem(KEY);
    expect(persistent.has(KEY)).toBe(false);
    expect(session.has(KEY)).toBe(false);
  });

  it("passes a value it cannot parse straight to the persistent store", async () => {
    const { persistent, storage } = setup();
    await storage.setItem("other", "not json");
    expect(persistent.raw("other")).toBe("not json");
  });

  it("lists the slices that hold people's records", () => {
    expect([...SESSION_ONLY_SLICES].sort()).toEqual([
      "customer",
      "devicesHandle",
      "member",
      "searchResult",
      "staffActivity",
      "staffDetail",
      "stripe",
    ]);
  });
});

describe("SESSION_ONLY_SLICES", () => {
  // A renamed slice would silently go back to the persistent store.
  it("names slices the store actually has", async () => {
    const { appReducer } = await import("./rootReducer");
    const slices = Object.keys(appReducer(undefined, { type: "@@init" }));
    SESSION_ONLY_SLICES.forEach((slice) => expect(slices).toContain(slice));
  });
});
