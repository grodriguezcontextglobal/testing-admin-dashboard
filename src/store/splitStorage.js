/**
 * Where the persisted store lives (FedRAMP F1.4 §3.2).
 *
 * redux-persist wrote the whole store to localStorage, unencrypted, where it
 * stays on disk until logout: the last student opened (often a minor), the
 * consumer at the counter, the staff profile, the Stripe customer. On a shared
 * machine that outlives the tab.
 *
 * This storage engine keeps redux-persist's single `persist:root` record but
 * writes it in two halves: the session itself (who is signed in, their
 * permissions, the event they are working on) to localStorage, and the slices
 * that hold people's records to sessionStorage. Those survive a reload of the
 * same tab — including the Stripe redirect, which comes back to the same tab —
 * and are gone when the tab closes. A new tab starts without them, as if no
 * record had been opened yet.
 *
 * redux-persist serializes each slice on its own and then the whole object,
 * so a stored value is a JSON object whose values are strings: it can be split
 * by key without touching any slice's contents.
 */

export const SESSION_ONLY_SLICES = Object.freeze([
  "customer",
  "devicesHandle",
  "member",
  "searchResult",
  "staffActivity",
  "staffDetail",
  "stripe",
]);

const parse = (value) => {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * @param {object} args
 * @param {Storage} args.persistent where the session half goes (localStorage)
 * @param {Storage} args.session where people's records go (sessionStorage)
 * @param {readonly string[]} [args.sessionSlices]
 */
export function createSplitStorage({ persistent, session, sessionSlices = SESSION_ONLY_SLICES }) {
  const inSession = new Set(sessionSlices);

  return {
    getItem: async (key) => {
      const kept = persistent.getItem(key);
      const tab = session.getItem(key);
      if (kept === null && tab === null) return null;
      // A record written before the split holds every slice; it rehydrates as
      // it is, and the next write splits it.
      return JSON.stringify({ ...(parse(kept) ?? {}), ...(parse(tab) ?? {}) });
    },

    setItem: async (key, value) => {
      const state = parse(value);
      if (!state) {
        persistent.setItem(key, value);
        return;
      }
      const kept = {};
      const tab = {};
      Object.entries(state).forEach(([slice, serialized]) => {
        (inSession.has(slice) ? tab : kept)[slice] = serialized;
      });
      persistent.setItem(key, JSON.stringify(kept));
      session.setItem(key, JSON.stringify(tab));
    },

    removeItem: async (key) => {
      persistent.removeItem(key);
      session.removeItem(key);
    },
  };
}
