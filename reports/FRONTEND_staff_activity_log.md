# Frontend Action Plan — Staff Activity Log endpoints (2026-08-05)

> **Audience:** the frontend agent. Two new endpoints under `/api/admin`:
> one to **register** a staff activity event, one to **report**/list them.
> Both require the normal `x-token` header (same JWT as every other
> `/api/admin` call).

## TL;DR

| | Method | Path | Who can call it |
|---|---|---|---|
| Register activity | `POST` | `/api/admin/activity-logs` | any authenticated staff member (logs their own activity) |
| Report activity | `GET` | `/api/admin/activity-logs` | staff with `staff:read` permission (same gate as `GET /api/admin/:id`) |

Most staff actions (LOGIN, FORCE_LOGOUT, and the CREATE/UPDATE/DELETE flows
already wired server-side in `admin.js`/`event.js`/`inventory.js`) are logged
**automatically by the server** — you don't need to call the register
endpoint for those, they already show up in the report. Only call register
for an action that has no server-side call site yet (see "When to call
register" below).

---

## 1. Register an activity — `POST /api/admin/activity-logs`

### Headers
```
x-token: <the staff member's JWT, same as any other /api/admin call>
Content-Type: application/json
```

### Body
```jsonc
{
  "action": "EXPORT",           // required — free text, but reuse an existing value when it fits: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ASSIGN, UNASSIGN, IMPORT, EXPORT
  "target_model": "Inventory",  // required — the model/entity affected, e.g. "Inventory", "Event", "User"
  "target_id": "665f...",       // optional — id of the affected record
  "details": { "note": "exported 42 rows" } // optional — any small JSON object, shown as-is in the report
}
```

`staff_member_id` and `company_id` are **resolved server-side from your
`x-token`** — do not send them, they're ignored even if present in the body
(this is intentional: it stops a client from logging activity under someone
else's identity or company).

### Responses
| Status | Body | Meaning |
|---|---|---|
| `202` | `{ "ok": true, "msg": "Activity registered" }` | Accepted. The write is queued (fire-and-forget), so a `202` does not 100% guarantee the row is already in Mongo — it will be within seconds under normal load. |
| `400` | `{ "ok": false, "msg": "action and target_model are required" }` | Missing one of the two required fields. |
| `401` | (from `validateJWT`/`checkTokenVersion`) | Missing/invalid/expired token, or the session was remotely terminated. |
| `404` | `{ "ok": false, "msg": "Staff member not found" }` | The JWT's uid doesn't resolve to a real, existing AdminUser (should not happen for a valid session). |
| `500` | `{ "ok": false, "msg": "Error registering activity" }` | Unexpected server error — safe to retry. |

### Example
```js
async function registerActivity({ action, target_model, target_id, details }) {
  const res = await fetch('/api/admin/activity-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-token': getToken() },
    body: JSON.stringify({ action, target_model, target_id, details }),
  });
  return res.json();
}

// e.g. after a client-only export action with no server round trip:
await registerActivity({
  action: 'EXPORT',
  target_model: 'Inventory',
  details: { format: 'csv', rows: 42 },
});
```

### When to call register
Call it for actions your UI performs that **don't already hit a server
endpoint that logs them** — e.g. a client-side export/print, a dashboard
filter saved as a "view", or any action you want audited that doesn't map to
an existing CRUD call. Do **not** call it for actions that already go through
`admin.js`/`event.js`/`inventory.js` server flows (login, edit/delete admin
user, item CRUD, etc.) — those are already logged, and calling register again
would create a duplicate entry.

---

## 2. Report activity — `GET /api/admin/activity-logs`

### Headers
```
x-token: <JWT>
```
For non-super-users, the authorization check also needs a company context —
send `x-company-id` header, or `company_id` in the query string (see below);
without one of those you'll get a `403` from the permission middleware
**before** it even reaches the report logic.

### Query params (all optional except noted)
| Param | Type | Notes |
|---|---|---|
| `company_id` | string | Scopes the report to one company. Root/super users may omit it or pass any company; regular users are restricted to companies they belong to (403 if they ask for one they don't have) — see permission notes below. |
| `staff_member_id` | string | Filter to one staff member's activity. |
| `action` | string | Exact match, e.g. `LOGIN`, `CREATE`. |
| `target_model` | string | Exact match, e.g. `Inventory`. |
| `start_date` / `end_date` | ISO date string | Inclusive range filter on `timestamp`. |
| `limit` | number | Default `50`. |
| `page` | number | Default `1`, 1-indexed. |

### Response — `200`
```jsonc
{
  "ok": true,
  "logs": [
    {
      "id": "665f...",
      "staff_member_id": { "_id": "...", "name": "...", "lastName": "...", "email": "...", "role": "..." }, // populated
      "company_id": "...",
      "action": "LOGIN",
      "target_model": "AdminUser",
      "target_id": "...",
      "details": { "email": "..." },
      "ip_address": "...",
      "device_info": "...",
      "timestamp": "2026-08-05T12:04:41.000Z"
    }
  ],
  "total": 137,
  "page": 1,
  "totalPages": 3
}
```

### Error responses
| Status | Body | Meaning |
|---|---|---|
| `401` | — | Missing/invalid token, or session terminated (`checkTokenVersion`). |
| `403` | `{ "ok": false, "msg": "Forbidden" }` / `"Forbidden: insufficient permissions"` | Caller's role lacks `staff:read` in the given company (or no company context resolvable) — this comes from the route-level `authorizeMongoPermission` gate, same one already protecting `GET /api/admin/:id`. |
| `403` | `{ "ok": false, "msg": "Unauthorized access to this company's logs" }` | Caller passed a `company_id` they aren't assigned to (this one comes from inside the controller, after the route-level gate passed). |
| `403` | `{ "ok": false, "msg": "No company assigned to user" }` | Caller has no company at all. |
| `404` | `{ "ok": false, "msg": "User not found" }` | JWT uid doesn't resolve to a real AdminUser. |
| `500` | `{ "ok": false, "msg": "Error fetching logs" }` | Unexpected server error. |

### Example
```js
async function fetchActivityLog({ companyId, staffMemberId, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (staffMemberId) params.set('staff_member_id', staffMemberId);
  if (companyId) params.set('company_id', companyId);

  const res = await fetch(`/api/admin/activity-logs?${params}`, {
    headers: { 'x-token': getToken(), 'x-company-id': companyId ?? '' },
  });
  return res.json(); // { ok, logs, total, page, totalPages }
}
```

## Not included in this round (flag if you need them)
- **No "current session only" filter.** The report is a plain date/action/
  target filter over all history — there's no built-in "just this login
  session" view. If a dashboard needs that, the practical approach today is
  filtering client-side by `timestamp >= <the staff member's most recent
  LOGIN entry>` (their most recent `action:"LOGIN"` row from this same
  endpoint).
- **`LOGOUT` is not logged.** Normal logout (`POST /api/admin/logout` and
  `/manually_logout`) doesn't create an activity row today (only
  `forceEndSession` logs `FORCE_LOGOUT`). A session's end time can't be read
  from this log yet.

Both are known gaps, not implemented server-side yet — ask backend if either
becomes a blocker.
