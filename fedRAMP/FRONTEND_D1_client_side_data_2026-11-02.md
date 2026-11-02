# D1 — Data the admin dashboard keeps in the browser

**System:** admin.devitrak.net (React SPA + service worker) · **Controls:** SC-28, MP-6, AC-12 · **As of:** 2026-11-02, `main` at 290794b0 · **Source:** the code, file by file (paths below)

This lists everything the dashboard writes to the browser: what it is, where, for how long, and what removes it. Anything held only in memory (React state, the react-query cache) is gone when the tab closes or reloads, and is left out.

## Summary

| Where | What | Personal data | Lifetime | Removed by |
|---|---|---|---|---|
| localStorage | Session token and ids | Token, staff and company ids | Until logout or 15 min idle | `clearSessionStorage()` |
| localStorage | `persist:root`: who is signed in, company, permissions | Name, email, phone of the signed-in staff member; company data | Until logout or 15 min idle | `onLogout` resets the store |
| sessionStorage | `persist:root`: records opened in the tab (consumers, members, staff) | Yes, incl. minors' records | Until the tab closes, or logout | Browser on tab close; `onLogout` |
| localStorage | Preferences (theme, inventory grouping, API server) | No | Indefinite | User / browser |
| localStorage | Pending payment amount (`total`, `devitrak.lostFee.total`) | An amount only | Until the payment flow finishes | The payment flow; `clearSessionStorage()` |
| Cache Storage | App shell (`workbox-precache-*`) | No | Until the next deploy | Service worker update |
| Cache Storage | `devitrak-recent-data` (API responses) | Yes | No longer written since 2026-10-29 | Deleted at logout |
| IndexedDB | `workbox-background-sync`: writes queued while offline | Yes, with the session token in the headers | 15 min max | Expiry; cleared at logout |
| Cookies | None set by the dashboard | — | — | — |

## Session teardown

Every way a session ends runs the same two steps:

1. `clearSessionStorage()` (`src/api/sessionHeaders.js`) removes every key in `SESSION_STORAGE_KEYS`. It then clears the offline stores (`src/api/offlineData.js`, see "Service worker").
2. `dispatch(onLogout())` makes `rootReducer` (`src/store/rootReducer.js`) reset every Redux slice to its initial state. Slices added later are covered too. redux-persist then writes the empty state back over `persist:root`.

What ends a session:

- logout;
- an expired session (401, `src/api/sessionExpiry.js`, `src/App.jsx`);
- 15 minutes without activity, after a 2-minute warning (`src/hooks/idleSession.js`). The activity clock lives in localStorage, so all open tabs share it;
- a sign-in that fails or is abandoned.

## localStorage

### Session (`SESSION_STORAGE_KEYS`, `src/api/sessionHeaders.js`)

| Key | Value |
|---|---|
| `admin-token` | The JWT, sent as `x-token` |
| `sqlStaffId`, `s-token-lq` | The staff member's SQL id |
| `x-company-id` | Mongo id of the active company |
| `s-company-lq` | SQL id of the active company |
| `devitrak-last-activity` | Timestamp of the last activity (idle timeout) |

### Redux store (`persist:root`, `src/store/Store.js`, `src/store/splitStorage.js`)

redux-persist splits the store between two storages:

| Storage | Slices | Contents |
|---|---|---|
| localStorage | `admin`, `article`, `backgroundJobs`, `event`, `helper`, `permission`, `subscription` | Who is signed in, the company, role and permissions, the selected event |
| sessionStorage | `customer`, `devicesHandle`, `member`, `searchResult`, `staffActivity`, `staffDetail`, `stripe` (`SESSION_ONLY_SLICES`) | The people opened in this tab |

Passwords never reach either storage: `stripPasswordsTransform` (`src/store/persistTransforms.js`) removes them.

If storage is blocked (private windows, blocked site data), the store falls back to keeping nothing.

### Preferences (no personal data, kept on purpose)

| Key | Value | File |
|---|---|---|
| `devitrak-theme` | `light` / `dark` | `src/config/theme.js` |
| `inventoryGroupBy` | Inventory grouping choice | `src/pages/inventory/table/extras/RenderingFilters.jsx` |
| `activeApiServer` | Which API host (primary or backup) answered last | `src/api/serverManager.js` |

### Payment flow

| Key | Value | File |
|---|---|---|
| `total` | Amount being charged, between the form and the card step | `ChargeAllListDeviceCreditCard.jsx`, `markedLostOption/CreditCard.jsx`, `transaction/AuthorizedDeposit.jsx` |
| `devitrak.lostFee.total` | Same, for the lost-device fee | `src/pages/events/quickGlance/consumer/lostFee/actions/CreditCard.jsx` |

Card data never touches the dashboard: Stripe Elements collects it inside Stripe's iframes (see D2).

## sessionStorage (gone when the tab closes)

| Key | Value | File |
|---|---|---|
| `persist:root` | The session-only slices (above) | `src/store/splitStorage.js` |
| `devitrak-return-path` | The page to return to after signing in again; removed once used | `src/api/sessionExpiry.js` |
| `network-status` | Online flag | `src/App.jsx` |
| `pwa-install-banner-dismissed` | Install banner dismissed | `src/components/installPrompt/InstallAppBanner.jsx` |

## Service worker (Cache Storage and IndexedDB)

The configuration is in `src/config/offlineCaching.js`; the cleanup at teardown is in `src/api/offlineData.js` (FedRAMP A3).

- **`workbox-precache-*`.** The built app: JS, CSS, images, fonts. It holds no user data. Each deploy replaces it.
- **`devitrak-recent-data`.** API GET responses kept for offline use. Builds since 2026-10-29 send API calls to the network only and no longer write it. A browser that ran an older build may still have it; every teardown deletes it.
- **`workbox-background-sync` (IndexedDB).** POST/PUT requests made while offline, replayed when the connection returns. Each is kept whole, headers included, so the `x-token` too, for at most 15 minutes (`MUTATION_QUEUE_RETENTION_MINUTES`). Every teardown empties the queue.

## Cookies

The dashboard sets none. The session travels in the `x-token` header, not in a cookie. Stripe.js, loaded by the dashboard, sets its own fraud-prevention cookies; see D2.

## Known gaps

1. **The JWT is in localStorage**, readable by any script running on the origin.
   - **Mitigations:** the CSP (`script-src 'self'` plus Stripe, no inline, no eval), the 15-minute idle timeout and the cleanup at teardown.
   - **Removing it** means an `HttpOnly` cookie session. That is a backend change, tracked with the session work (B3).
2. ~~**The pending payment amount** (`total`, `devitrak.lostFee.total`) is not in `SESSION_STORAGE_KEYS`, so an abandoned payment leaves it after logout.~~
   - **Closed 2026-11-02:** both keys are now in `SESSION_STORAGE_KEYS`.
   - **Test:** `src/api/sessionHeaders.test.js`.
3. **`searchParameters`** is a key from an older inventory search. Current code only removes it; nothing writes it any more.
