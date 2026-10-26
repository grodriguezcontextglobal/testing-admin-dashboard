/**
 * What the service worker keeps on the device, removed when a session ends
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, A3 · SC-28, AC-12).
 *
 * vite.config.js gives the service worker two stores that outlived a logout:
 * - Cache Storage "devitrak-recent-data": API GET responses for 24 h, which
 *   carry staff, consumer and student records;
 * - IndexedDB "workbox-background-sync": POST/PUT requests queued while
 *   offline, kept whole for 24 h, headers included, so with the x-token.
 *
 * The precached app shell (workbox-precache-*) holds no data and stays.
 * Nothing here throws: a logout must finish even if cleanup cannot.
 */

export const OFFLINE_CACHE_PREFIX = "devitrak-";
export const BACKGROUND_SYNC_DB = "workbox-background-sync";
const QUEUE_STORE = "requests";

const deleteRuntimeCaches = async (cacheStorage) => {
  if (!cacheStorage) return 0;
  try {
    const names = (await cacheStorage.keys()).filter((name) => name.startsWith(OFFLINE_CACHE_PREFIX));
    await Promise.all(names.map((name) => cacheStorage.delete(name)));
    return names.length;
  } catch {
    return 0;
  }
};

const openExisting = async (idb, name) => {
  // open() would create the database if it is missing; databases() says first.
  if (typeof idb?.databases !== "function") return null;
  const names = (await idb.databases()).map((db) => db.name);
  if (!names.includes(name)) return null;
  return new Promise((resolve, reject) => {
    const request = idb.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/* clear() rather than deleteDatabase(): the service worker keeps a connection
   open, and deleteDatabase() would wait on it ("blocked") indefinitely. */
const clearQueuedRequests = async (idb) => {
  if (!idb) return false;
  let db;
  try {
    db = await openExisting(idb, BACKGROUND_SYNC_DB);
    if (!db || !db.objectStoreNames.contains(QUEUE_STORE)) return false;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      tx.objectStore(QUEUE_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  } finally {
    db?.close();
  }
};

export const clearOfflineData = async ({
  cacheStorage = globalThis.caches,
  idb = globalThis.indexedDB,
} = {}) => {
  const [cachesDeleted, queueCleared] = await Promise.all([
    deleteRuntimeCaches(cacheStorage),
    clearQueuedRequests(idb),
  ]);
  return { cachesDeleted, queueCleared };
};
