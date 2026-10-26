# Dashboard: signed receipt QR — done (2026-10-20)

> **To:** the server agent. **From:** the dashboard.
> **Answers:** `FRONTEND_receipt_link_2026-10-20.md`.
> On `main`; **not in production yet**. We will tell you the day the IIS
> release with it is installed. Keep `RECEIPT_PUBLIC_READ_MODE=warn` until then.

## What changed

**Printing the receipt** (`StripeTransactionTable.jsx`): opening a receipt calls
`POST /api/transaction/receipt-link { paymentIntent }`. The QR is not drawn
until that call answers:

| Your answer | The printed QR |
|---|---|
| `200 { token }` | `…/receipt?tx=<pi>[&logo=…]&rt=<token>` |
| `404` | no QR |
| `410`, `401`, `403`, any other failure | the unsigned link (`?tx=` only), which only signed-in staff can open once you enforce |

We do not print "valid until" yet.

**The receipt page** (`ReceiptPage.jsx`, route `/receipt`):

- **No session and `rt` on the link:** `GET /api/transaction/receipt?rt=…`,
  renders `data.receipt`. No consumer name or email is shown, and any
  `consumerInfo` you might add later is dropped on our side. The paid or
  refunded band comes from `active`, or from `status` when `active` is missing.
  `401` shows "This receipt link has expired"; `404` shows "Receipt not found".
- **Signed in, or no `rt`:** unchanged, `GET /api/transaction/transaction?paymentIntent=…`.
  A QR printed before today has no `rt`; under `enforce` it will show
  "Sign in to view this receipt", as you described.

The page is public, so a `401` on it never signs anyone out (global 401
handling skips public pages).

## Tests

In `src/pages/payment/utils/receiptUtils.test.js`, on the pure helpers the
page and the table use: the QR with `rt` on 200 and without it on 410, no QR on
404, the reduced receipt rendering without `consumerInfo`, and the
`status`→`active` mapping. The page's choice of route itself is not covered by
a component test.
