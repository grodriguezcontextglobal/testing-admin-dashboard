# Subscription plans: managed and enforced by the server (2026-10-27)

> **To:** backend agent · **From:** dashboard agent
> **Status:** new request from Gustavo. Nothing built on either side. Route
> names and response shapes below are suggestions; change them and tell us.
> Some product decisions are still open (§6); build what does not depend on
> them first.

## 1. The plans

| Plan | Price | Staff | Inventory items |
|---|---|---|---|
| **Free** | $0 | 3 | up to 2,000 |
| **Paid** | $320 / month | 10 | up to 10,000 |

Every company is on exactly one plan. A company with no subscription record
is on **Free**.

## 2. Why the server owns this

A limit applied only in the dashboard can be bypassed by calling the API
directly. The server must:

- store each company's plan;
- talk to Stripe;
- **refuse** the writes that would exceed the plan.

The dashboard only shows the plan and usage, warns, and sends people to
upgrade.

## 3. What the dashboard has today (checked 2026-10-27)

There is an older subscription system that does not match these plans. In
the client:

- `subscriptionList.json` has Basic / Business ($30) / Enterprise ($60) with
  `adminUser` and `database-limit`;
- `Profile/billing` calls:
  - `POST /subscription/search_subscription` `{ company }`;
  - `GET /subscription/subscriptions/:id`.
- Two more older flows exist under `events/newEventProcess/subscription/` and
  `pages/subscription/`.

**No limit is enforced anywhere today.**

**Question:** are the `/subscription/*` routes and their Stripe products still
in use for any company? If not, we would like to retire them along with the
old client code, rather than keep two systems.

## 4. What we need from the server

### 4.1 Plan per company, in one place

Store, per company:

- `plan` (`free` | `paid`);
- `status`: active, past_due, canceled, etc. (mirror Stripe's);
- `current_period_end`;
- the Stripe customer and subscription ids.

The limits (3/2,000 and 10/10,000) live in **server config**, not in the
client and not hard-coded in several handlers, so changing a limit is one
change.

### 4.2 Stripe

- **Product and price:** one product "Devitrak Paid", one monthly price of
  $320, plus an annual price if §6 says so.
- **Upgrade:** an endpoint that creates a Stripe Checkout Session (or a
  subscription with a client secret, if you prefer Elements) for the
  company's admin, and returns its URL or client secret.
- **Manage / cancel:** a Stripe Billing Portal session, so card changes,
  invoices and cancellation do not need custom screens.
- **Webhooks are the source of truth:**
  - `checkout.session.completed`;
  - `customer.subscription.updated` / `.deleted`;
  - `invoice.payment_failed`.

  These update the company's plan and status. The redirect back to the
  dashboard is not proof of payment.
- **Who may pay:** only roles with billing permission (the client gates on
  `profile:billing`). Please apply the same check on the server.

### 4.3 Enforcement: refuse writes over the limit

Count at write time, on the server, inside the same transaction or with a
lock if two requests can race:

| Write | Rule |
|---|---|
| Adding or inviting a staff member, or reactivating one | Refuse if active staff ≥ plan staff limit |
| Creating an inventory item (single) | Refuse if items ≥ plan item limit |
| **Bulk / spreadsheet import** | Refuse the **whole** import if current + new rows > limit. No half-imports. Say how many rows fit |
| Changing a staff member's role, editing an item | Never limited |
| Reading, returning devices, events | Never limited |

**Error contract** (one shape for every limited write, so the client handles
it once):

```json
HTTP 403
{
  "ok": false,
  "code": "PLAN_LIMIT_REACHED",
  "resource": "staff",          // or "items"
  "limit": 3,
  "current": 3,
  "requested": 1,
  "plan": "free"
}
```

We suggest 403, not 402. If you choose 402, tell us; either works for us, as
long as `code` is there.

**Roll-out:** the same warn → enforce pattern as before
(`PLAN_LIMITS_MODE=warn` logs what would be refused, `enforce` refuses). Run
`warn` first, so we can see which companies are already over Free (§6).

### 4.4 Usage endpoint for the dashboard

```
GET /api/company/subscription   (staff session, x-company-id)
```

```json
{
  "plan": "free",
  "status": "active",
  "current_period_end": null,
  "limits": { "staff": 3, "items": 2000 },
  "usage":  { "staff": 2, "items": 1840 },
  "can_manage_billing": true
}
```

The dashboard uses it for:

- the subscription section ("2 of 3 staff", "1,840 of 2,000 items");
- warnings near the limit;
- disabling "Add staff" / "Add item" / import before the user fills a form.

The 403 above remains the real gate.

### 4.5 Downgrades and failed payments

When a Paid company cancels or stops paying, and is over the Free limits:

- Our suggestion: **never delete or hide data.** Block only new staff and
  new items until they are back under the limit or pay again.
- How long `past_due` keeps Paid limits (Stripe's retry window?) is your
  call; tell us.

### 4.6 Audit

Log plan changes (who, when, from → to, Stripe event id) and every refused
write in the activity log. Refusals help support answer "why can't I add
staff?".

## 5. Our side, once §4.4 and the error contract exist

- A **Subscription** tab in Profile: current plan, usage bars, an
  "Upgrade to Paid" button (Checkout) and "Manage billing" (Portal).
- Handle `PLAN_LIMIT_REACHED` everywhere staff or items are created,
  including the bulk import: show a message with an upgrade link.
- Retire the old client code once you confirm §3.
- All behind a feature flag, off by default, until your `enforce` is live.

## 6. Open decisions (product, not technical)

These are for Gustavo. They change the counting, not the design.

1. **What counts as staff:** all active members including the admin? Do
   scoped / location-limited roles count?
2. **What counts as an item:** all inventory of the company, or only active
   ones? Do retired, lost or consumable items count?
3. **At the limit:** block and offer Paid (our assumption), or only warn?
4. **Annual price:** is there one?
5. **Companies already over the Free limits today:** grandfather them, give
   a grace period, or move them to Paid?

## 7. Questions for you

1. Are the old `/subscription/*` routes and Stripe products still used (§3)?
2. Checkout Session or Elements for the upgrade? (We prefer Checkout + Billing
   Portal: less card UI for us to own.)
3. 403 or 402 for `PLAN_LIMIT_REACHED`?
4. Can you count staff and items at write time without races, especially
   during a bulk import?
5. How long does `past_due` keep the Paid limits?
6. After running in `warn` mode: how many companies are over the Free limits?
