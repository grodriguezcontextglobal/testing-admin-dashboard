# Deploying the Bridges demo frontend to Netlify

The demo needs its own build, because the API origin is a **build-time** Vite
variable baked into the bundle — not something that can be switched at runtime.

Backend side of this environment: `docs/BRIDGES_DEMO_ENV.md` in the server repo.

---

## Read this first: the failover hazard

`src/api/serverManager.js` builds a prioritised list:

```js
const SERVERS = [PRIMARY_API, BACKUP_API].filter(Boolean);
```

and `findHealthyServer()` walks it, health-checking `/health`. If the primary
fails a check — a cold start, a deploy, a brief network blip — it **silently
switches to the backup** and persists that choice in
`localStorage.activeApiServer`. `switchServer()` rotates on request failures too.

Today both variables point at the same production host:

```
VITE_APP_DEVITRACK_API        = https://db.devitrak.net
VITE_APP_DEVITRACK_API_BACKUP = https://db.devitrak.net
```

So if the demo site is configured by copying production's variables and only
changing the primary, **the demo will fail over to production** the first time
the demo API hiccups. Mid-pitch that means real customer data on screen, and
demo actions writing into production.

**Leave `VITE_APP_DEVITRACK_API_BACKUP` empty on the demo site.** `.filter(Boolean)`
drops it, `SERVERS` has exactly one entry, and there is nothing to fail over to.
A demo that shows an error is recoverable; a demo that quietly shows production
is not.

(One thing already works in our favour: a stored `activeApiServer` is only
trusted when it is in the currently-configured `SERVERS`, so a cached
production URL from another environment is ignored rather than reused.)

---

## Site settings

Create a **new Netlify site** from this repo rather than adding a branch deploy
to the production site. A separate site keeps the two sets of environment
variables from ever being confused, which is the whole point of a separate demo
environment.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | `20.19.5` (from `package.json` → `engines`) |
| Branch to deploy | see below |

Set Node explicitly (`NODE_VERSION=20.19.5` as an environment variable, or a
`.nvmrc`). Netlify's default image may not match `engines`, and the build is not
pinned anywhere in the repo today.

SPA routing already works — `public/_redirects` contains `/* /index.html 200`
and Vite copies it into `dist/`. Verified present in a demo build. No extra
configuration needed.

### Which branch

The demo needs `feat/unified-profile-shell` (or `main` once it is merged).
On anything older, `Advance grades` does not understand PK3/PK4 and 120 of the
369 Bridges students land in the "needs manual review" bucket.

---

## Environment variables

Netlify is the only source of these — `.env` is gitignored and never reaches the
build — so whatever is set on the site is exactly what the bundle gets.

**Must differ from production:**

| Variable | Demo value |
|---|---|
| `VITE_APP_DEVITRACK_API` | the demo API origin, e.g. `https://bridges-api.devitrak.net` |
| `VITE_APP_DEVITRACK_API_BACKUP` | **leave empty** — see the hazard above |
| `VITE_APP_PUBLIC_STRIPE_KEY` | a Stripe **test** publishable key, not the live one |

**Must match the demo backend** (they are two halves of one scheme — a mismatch
breaks any encrypted payload):

- `VITE_APP_ALGORITHM`
- `VITE_APP_SECRETE_KEY_ENCRYPT`

**Copy from production unless you have a reason not to:**

- `VITE_APP_DEVITRAK_CONSUMER_API`
- `VITE_APP_HEADER_AUTH_TOKEN`, `VITE_APP_AWS_API`, `VITE_APP_AWS_AUTHORIZER_TOKEN`
- `VITE_APP_RECAPTCHA_SITEKEY` (must cover the demo domain, or captcha fails)
- `VITE_APP_TWILIO_ACCOUNT_SID`, `VITE_APP_TWILIO_AUTH_TOKEN`

`PORT` / `PORT_SSR` are local-dev only and are not needed on Netlify.

> reCAPTCHA site keys are domain-bound. If the demo gets a new hostname, either
> add it to the existing key's allowed domains or issue a key for it — otherwise
> the login page fails in a way that looks like a broken app.

---

## Verifying a demo build

The important check is that no production origin is in the shipped bundle:

```bash
grep -r "db\.devitrak\.net" dist/ && echo "PRODUCTION URL LEAKED" || echo "clean"
```

Confirmed clean on a build made with only `VITE_APP_DEVITRACK_API` set to a demo
origin: the demo host appears in `dist/assets/index-*.js`, and no production
origin appears anywhere in `dist/`.

After the site is live, in the browser console on the demo domain:

```js
localStorage.getItem('activeApiServer')   // must be the demo origin
```

Then confirm the tenant is the demo one — the header should read *Bridges Public
Charter School*, Students should show **369**, and the Readiness tab **Under 13:
369** with coverage **83%**.

---

## A note on `netlify.toml`

There is no `netlify.toml` in this repo; the production site is configured
through the Netlify UI. Adding one would apply to **every** site building from
this repo, including production, so it should not be introduced as a side effect
of setting up the demo. If we do want build settings in version control, it is
worth doing deliberately once production's current settings are confirmed to
match — otherwise the first demo deploy silently changes how production builds.
