# D2 — Third parties the admin dashboard's browser talks to

**System:** admin.devitrak.net · **Controls:** CA-3, SA-9, SC-7 · **As of:** 2026-11-02 (`main` at 290794b0, plus open PRs #44 and #47) · **Feeds:** backend S2.2 (external services inventory)

## How this list is enforced

The browser can only reach what the Content-Security-Policy allows. The policy is generated at build time from `src/config/securityHeaders.js`, and its test is `securityHeaders.test.js`. Anything not in it is blocked once the CSP is enforced. A new third party therefore needs a change to that file, a reviewed PR and green CI (CM-3).

Not listed here: the dashboard's own origins.
- `admin.devitrak.net` (`'self'`).
- The Devitrak API (`db.devitrak.net` and the backup API host, from `VITE_APP_DEVITRACK_API*`). It receives the session token and all business data, and is covered by the backend's documentation.

## Summary

| Third party | Why | Loaded / called | What it sees |
|---|---|---|---|
| Stripe | Card payments, subscriptions, Connect | Script, iframes, API calls | Card data (in its iframes), amounts, browser and device signals |
| Amazon S3 (documents bucket) | Viewing contracts and consent PDFs | iframe | The signed URL of one document, browser metadata |
| Google Fonts | Inter typeface | Stylesheet and font files | IP address, user agent, referrer origin |
| cdnjs (Cloudflare) | A CSS reset stylesheet | Stylesheet | IP address, user agent, referrer origin |
| Cloudinary | Images (logos, items, staff photos) | `<img>` | IP address, user agent, referrer origin, which image |
| Devitrak status page (Cloudflare Workers) | Service status banner and `/status` | `fetch`, no credentials | IP address, user agent, origin |
| Carrier sites (UPS, FedEx, DHL, USPS) | Tracking links | Only when a user clicks one | What any visited site sees |

Removed by open PR #47: **Iconify** (`api.iconify.design`, `api.simplesvg.com`, `api.unisvg.com`). The icons now ship with the app.

**Not used:** analytics or tracking (no Google Analytics, Sentry, Hotjar or similar), and Cloudflare Turnstile (it is not in the dashboard).

## Details

### Stripe

- **Hosts:**
  - scripts: `js.stripe.com`, `*.js.stripe.com`, `connect-js.stripe.com`;
  - frames: the script hosts plus `hooks.stripe.com` and `connect.stripe.com`;
  - API: `api.stripe.com`, `merchant-ui-api.stripe.com`.
- **Code:**
  - `@stripe/stripe-js` (`loadStripe`) in `src/components/stripe/elements/*`;
  - `@stripe/connect-js` in `src/components/stripe/connected_account/dashboard.jsx`.
- **What it sees:**
  - Card numbers are typed into Stripe Elements, inside Stripe's iframes. They never touch the dashboard's DOM, its storage or the Devitrak API, which keeps the dashboard at PCI SAQ A scope.
  - Stripe also receives the amount and the client secret the API created, and the publishable key.
  - Stripe.js collects browser and device signals for fraud detection, and sets its own cookies for it (`__stripe_mid`, `__stripe_sid`, per Stripe's documentation).
  - The Connect embedded dashboard shows the company's connected account to its admins, after the API creates an account session.
- **Note:** `loadStripe` runs when its module is imported, and routes are not lazy-loaded. So Stripe.js loads on every signed-in page, not only on payment pages.
  - **Optional improvement:** import from `@stripe/stripe-js/pure` and call `loadStripe` only when a payment form opens.

### Amazon S3: documents bucket (`frame-src`, open PR #44)

- **Hosts:** `https://s3.us-east-2.amazonaws.com/devitrak.documents.admin.dashboard/` (path-style, how the AWS SDK signs a bucket name with dots) and `https://devitrak.documents.admin.dashboard.s3.us-east-2.amazonaws.com`. Only that bucket, never all of S3.
- **What it sees:** a presigned URL for one document (five-minute expiry, issued by the API), and the viewer's IP address and user agent.

### Google Fonts

- **Hosts:** `fonts.googleapis.com` (stylesheet), `fonts.gstatic.com` (font files).
- **Code:** `index.html`, `src/index.css`.
- **What it sees:** standard request metadata. No Devitrak data.
- **Option:** self-host the Inter font files to remove this third party.

### cdnjs (Cloudflare)

- **Host:** `cdnjs.cloudflare.com`.
- **Code:** `src/components/navbar/style/style.css` imports `meyer-reset 2.0`.
- **What it sees:** standard request metadata.
- **Option:** copy the reset into the repository (a few lines of CSS) and remove the host from `style-src`.

### Cloudinary

- **Host:** `res.cloudinary.com`.
- **What it sees:** standard request metadata and which image is requested.
- **Note:** uploads go through the Devitrak API (`POST /api/cloudinary/upload-image`), not from the browser.
- **CSP note:** `img-src` currently allows any `https:` source, because images come from several hosts (Cloudinary, S3, Stripe). Narrowing it to named hosts is possible once the image hosts are confirmed.

### Devitrak status page

- **Host:** `devitrak-status.cacaminero.workers.dev`.
- **Code:** `src/hooks/useServiceStatus.js`.
- **What it sees:** a plain `fetch` of `/api/status.json` with `credentials: "omit"` and no Devitrak headers, so no token, cookie or company id; plus the standard request metadata.
- **Note:** the host is on a personal-looking Workers subdomain. Moving it to a Devitrak domain would make ownership clear to an auditor.

## Open items

1. Merge PR #47 (Iconify bundled) and PR #44 (documents bucket frames) before the CSP is enforced again.
2. Optional, to shrink the list:
   - self-host Inter;
   - inline the CSS reset;
   - load Stripe.js only on payment pages;
   - narrow `img-src`;
   - move the status page to a Devitrak domain.
