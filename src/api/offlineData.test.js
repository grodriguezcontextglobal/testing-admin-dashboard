import { describe, expect, it, vi } from "vitest";
import { BACKGROUND_SYNC_DB, clearOfflineData } from "./offlineData";

// fedRAMP/FRONTEND_action_plan_2026-10-26.md, A3: the service worker kept API
// responses (people's records) in Cache Storage for 24 h, and queued writes
// (with their x-token) in IndexedDB, through a logout.

const fakeCaches = (names) => {
  const store = new Set(names);
  return {
    keys: vi.fn(async () => [...store]),
    delete: vi.fn(async (name) => store.delete(name)),
    left: () => [...store],
  };
};

/* The minimum of IndexedDB this module touches: databases(), open() and a
   readwrite clear() on one store, each answering through on* callbacks. */
const fakeIndexedDb = ({ exists = true, stores = ["requests"] } = {}) => {
  const cleared = [];
  const later = (request, result) =>
    setTimeout(() => {
      request.result = result;
      request.onsuccess?.();
    });
  const db = {
    objectStoreNames: { contains: (name) => stores.includes(name) },
    transaction: (name) => {
      const tx = {
        objectStore: () => ({ clear: () => cleared.push(name) }),
      };
      setTimeout(() => tx.oncomplete?.());
      return tx;
    },
    close: vi.fn(),
  };
  return {
    databases: vi.fn(async () => (exists ? [{ name: BACKGROUND_SYNC_DB }] : [])),
    open: vi.fn(() => {
      const request = {};
      later(request, db);
      return request;
    }),
    cleared,
    db,
  };
};

describe("clearOfflineData", () => {
  it("deletes the app's runtime caches and keeps the precached shell", async () => {
    const caches = fakeCaches(["devitrak-recent-data", "workbox-precache-v2-https://x/"]);
    await clearOfflineData({ cacheStorage: caches, idb: undefined });
    expect(caches.left()).toEqual(["workbox-precache-v2-https://x/"]);
  });

  it("empties the queued writes", async () => {
    const idb = fakeIndexedDb();
    const result = await clearOfflineData({ cacheStorage: undefined, idb });
    expect(idb.cleared).toEqual(["requests"]);
    expect(idb.db.close).toHaveBeenCalled();
    expect(result.queueCleared).toBe(true);
  });

  it("does not create the queue database when it does not exist", async () => {
    const idb = fakeIndexedDb({ exists: false });
    const result = await clearOfflineData({ cacheStorage: undefined, idb });
    expect(idb.open).not.toHaveBeenCalled();
    expect(result.queueCleared).toBe(false);
  });

  it("never throws: a logout must not fail on cleanup", async () => {
    const broken = { keys: vi.fn(async () => { throw new Error("denied"); }) };
    const idb = { databases: vi.fn(async () => { throw new Error("denied"); }) };
    await expect(clearOfflineData({ cacheStorage: broken, idb })).resolves.toEqual({
      cachesDeleted: 0,
      queueCleared: false,
    });
  });

  it("is a no-op where neither API exists", async () => {
    await expect(clearOfflineData({ cacheStorage: undefined, idb: undefined })).resolves.toEqual({
      cachesDeleted: 0,
      queueCleared: false,
    });
  });
});
