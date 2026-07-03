# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Entorno de desarrollo — Docker (obligatorio)

**Todo el equipo trabaja dentro de la misma imagen Docker.** No se instala Node localmente. El entorno de desarrollo está definido en `Dockerfile.dev` y orquestado por `docker-compose.yml`.

La imagen está publicada en GitHub Container Registry:
`ghcr.io/grodriguezcontextglobal/devitrak-client-dev:latest`

### Primera vez (onboarding)

**Requisito único:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

```bash
# 1. Clonar el repositorio
git clone https://github.com/grodriguezcontextglobal/testing-admin-dashboard
cd testing-admin-dashboard

# 2. Crear el archivo de variables de entorno
cp .env.dev.example .env.dev
# Abrir .env.dev y completar los valores (pedir al equipo las URLs y claves de dev)

# 3. Levantar el contenedor
docker compose up
```

La app queda disponible en `http://localhost:5522`. El hot-reload funciona igual que fuera de Docker: edita archivos en tu editor y el browser recarga automáticamente.

### Flujo diario

```bash
docker compose up          # levantar
docker compose down        # apagar
```

### Cuando alguien agrega o actualiza dependencias

Si un `git pull` trae cambios en `package.json` o `package-lock.json`, reconstruir la imagen local:

```bash
docker compose up --build
```

Alternativamente, descargar la imagen actualizada que GitHub Actions publica automáticamente en GHCR:

```bash
docker compose pull
docker compose up
```

### Correr comandos dentro del contenedor

```bash
# Shell interactivo
docker compose exec devitrak-client sh

# Correr un comando puntual
docker compose exec devitrak-client npm run test:unit
docker compose exec devitrak-client npm run lint
```

### Para Claude: contexto del entorno

- El servidor de desarrollo corre en el **puerto 5522** dentro del contenedor, mapeado al mismo puerto del host.
- `node_modules` vive en un volumen anónimo dentro del contenedor — no es visible desde el explorador de archivos del host. No sugerir instalar paquetes con `npm install` directamente; el workflow correcto es editar `package.json` y reconstruir la imagen.
- Las variables de entorno provienen de `.env.dev` (no commiteado). La plantilla es `.env.dev.example`.
- No hay Node.js instalado en el host. Todos los comandos de Node/npm se ejecutan dentro del contenedor.

---

## Commands

```bash
# Development
npm run dev              # start dev server at http://localhost:5522

# Build
npm run build            # production build (single bundle, no chunk splitting)

# Lint
npm run lint             # ESLint — max-warnings 0 (zero warnings allowed)

# Unit tests (Vitest + happy-dom)
npm run test:unit        # run all unit tests once
npm run test:unit:watch  # watch mode
npm run test:unit:coverage

# E2E tests (Cypress — requires dev server on port 5523)
npm run test:e2e                  # all specs
npm run test:inventory            # inventory CRUD only
npm run test:consumers            # consumers CRUD only
npm run test:events               # events CRUD only
npm run test:staff                # staff CRUD only
npm run test:consumer-detail      # consumer detail CRUD
npm run test:consumer-all         # all consumer specs

# Run a single unit test file
npx vitest run src/config/roles.test.js
```

**E2E note:** Cypress base URL is `http://localhost:5523`, not 5522. Run a separate dev server on that port before executing Cypress.

---

## Development Methodology

**test → code → refactor** (loop — never skip the order).

1. Write the failing test first (Vitest for unit/integration, Cypress for E2E).
2. Implement only what's needed to make the test pass.
3. Refactor without breaking tests.
4. Repeat.

Unit test coverage scope is intentionally narrow: `src/config/**`, `src/hooks/**`, `src/store/**`, `src/pages/**/utils/**`. Keep new tests within these boundaries unless there is a strong reason to expand.

---

## Architecture

### Entry Point & App Shell

`src/main.jsx` bootstraps Redux (`Provider`), persistence (`PersistGate`), routing (`BrowserRouter`), and React Query (`QueryClientProvider`), then calls `configureApi()` before rendering `<App />`. This async init selects the healthy API server before the first render.

`src/App.jsx` reads `state.admin.status` from Redux to decide between `<AuthRoutes />` and `<NoAuthRoutes />`. It also validates the JWT on every route change and expires sessions automatically.

### Routing

All authenticated routes live in `src/routes/authorized/AuthRoutes.jsx`. Routes that require elevated permissions are wrapped in `<PermissionGuard action="domain:action" />`, which reads the current user from Redux and calls `hasPermission` + `resolveRoleType` from `src/config/roles.js`. Unauthorized users are redirected to `/`.

Every page is lazy-loaded (`React.lazy`) with a `<Suspense>` Lottie fallback. Max content width: `1400px`, centered, `minHeight: 100dvh`.

### Permission System

**The single source of truth is `src/config/roles.js`.** Do not add role logic anywhere else.

Key exports:
- `PERMISSIONS` — permission matrix, keyed `"domain:action"`, value is an array of allowed `roleType` strings.
- `hasPermission(action, roleType)` — pure function; use in tests, guards, and utils.
- `resolveRoleType(user)` — extracts the effective roleType from a Redux user object; falls back to `LEGACY_ROLE_MAP` if `roleType` is absent (handles legacy DB records with numeric `role`).
- `ROLE_TYPES` — canonical role string constants.

**roleType strings (canonical):** `root_admin`, `admin`, `sale_manager`, `event_manager`, `inventory_manager`, `assistant`. Legacy aliases exist for backward compat — always resolve through `resolveRoleType`.

The `permission` Redux slice (`src/store/slices/permissions.js`) mirrors the active user's role/roleType for convenience but is not the authority for access decisions.

### State Management (Redux)

Store is at `src/store/Store.js`. All state is persisted to `localStorage` via `redux-persist`.

| Slice key      | Slice file              | Purpose                                      |
|---------------|-------------------------|----------------------------------------------|
| `admin`        | `adminSlice.js`         | Auth status, user profile, JWT, MFA          |
| `permission`   | `permissions.js`        | Active role/roleType + company locations      |
| `event`        | `eventSlice.js`         | Selected event context                       |
| `devicesHandle`| `devicesHandleSlice.js` | Device selection and quick-glance state      |
| `article`      | `articleSlide.js`       | Inventory item (article) editing context     |
| `customer`     | `customerSlice.js`      | Selected consumer                            |
| `staffDetail`  | `staffDetailSlide.js`   | Selected staff member                        |
| `member`       | `memberSlice.js`        | Member (conditional page) context            |
| `helper`       | `helperSlice.js`        | Shared UI state / misc helpers               |
| `searchResult` | `searchBarResultSlice.js`| Global search results                       |
| `staffActivity`| `staffActivitySlice.js` | Staff activity log                           |
| `stripe`       | `stripeSlice.js`        | Stripe account info                          |
| `subscription` | `subscriptionSlice.js`  | Subscription plan state                      |

On logout, every slice is individually reset — see `App.jsx::dispatchActionBasedOnTokenValidation`.

### API Layer

`src/api/devitrakApi.jsx` exports three pre-configured Axios instances:

| Instance            | Path suffix | Usage                      |
|--------------------|-------------|----------------------------|
| `devitrakApi`       | (none)      | General endpoints          |
| `devitrakApiAdmin`  | `/admin`    | Admin-only endpoints       |
| `devitrakApiArticle`| `/article`  | Inventory item endpoints   |
| `devitrakAWSApi`    | AWS base    | AWS-specific endpoints     |

All three share a request interceptor that attaches `x-token` and `s-token-lq` (staff SQL id) from `localStorage`, plus locale/timezone headers, plus the route-scoped company headers (see below). On `Network Error` or timeout they auto-retry on the next healthy server via `src/api/serverManager.js`.

**Session headers (`src/api/sessionHeaders.js`)** is the single source of truth for the localStorage-backed auth/session keys. It exposes `persistCompanyHeaders` (called at login in `Login.jsx` and `multipleCompanies/Modal.jsx`), `clearSessionStorage` (called at every logout/session-teardown site), and the pure helpers `buildRequestPath` + `buildRouteScopedHeaders` used by the interceptor. Route-scoped defaults:

| Header         | Value                          | Source (Redux)                | Routes                              |
|----------------|--------------------------------|-------------------------------|-------------------------------------|
| `x-company-id` | Mongo ObjectId of the company  | `admin.user.companyData.id`   | `/api/staff` `/api/admin` `/api/company` `/api/stripe` |
| `s-company-lq` | SQL `company_id` (integer)     | `admin.user.sqlInfo.company_id` | `/api/db_*`                         |

When adding a new localStorage session key, add it to `SESSION_STORAGE_KEYS` so it is cleared on logout everywhere.

Server selection (`serverManager.js`): on startup, `configureApi()` checks `VITE_APP_DEVITRACK_API` (primary) and `VITE_APP_DEVITRACK_API_BACKUP` via a `/health` endpoint. The active server is cached in `localStorage` under `activeApiServer`.

### Environment Variables

Configured in `src/config/ConfigEnvExport.jsx` (all prefixed `VITE_APP_`). Copy `.env.dev.example` to `.env.dev` (see Docker setup above).

Key variables: `VITE_APP_DEVITRACK_API`, `VITE_APP_DEVITRACK_API_BACKUP`, `VITE_APP_PUBLIC_STRIPE_KEY`, `VITE_APP_RECAPTCHA_SITEKEY`, `VITE_APP_AWS_API`.

### Pages

`src/pages/` contains one folder per domain. Each domain follows the same internal pattern:

```
pages/<domain>/
  MainPage.jsx          # list/landing view
  action/               # create / edit flows
  detail/               # drill-down views
  components/           # domain-specific UI
  utils/                # pure helpers (unit-tested)
```

Domains: `authentication`, `consumers`, `events`, `inventory`, `staff`, `home`, `search`, `payment`, `Profile`, `posts`, `subscription`, `conditionalPage` (members/patients), `error`.

### Component Library

`src/components/UX/` is the internal design-system layer (see `design.md`). All exports are re-exported from `src/components/UX/index.js`.

Primary building blocks:
- **Buttons:** `BlueButton`, `GrayButton`, `DangerButton`, `LightBlueButton` — each has a `*Confirmation` variant with an Ant Design Popconfirm.
- **Tables:** `BaseTable`, `ExpandableTable`, `SelectableTable`, `SelectedRowBaseTable` — all wrap Ant Design `Table` with the `table-ant-customized` CSS class.
- **Modals:** `ModalUX` wraps `antd` Modal with `centered`, `maskClosable: false`, `destroyOnHidden: true`.
- **Badges/Pills:** `BadgeWithDot` (11 color schemes), `PillUIComponent`.
- **Inputs:** `Input`, `Label`, `TextArea` — MUI `OutlinedInput` base.

Always use these components. Do not introduce raw Ant Design or MUI primitives directly in page code.

### Build

Vite 5 with [Million.js](https://million.dev) compiler (`auto: true`) for React performance. Production build outputs a single bundle (chunk splitting disabled) to avoid deployment issues with partial uploads.

---

## Key Conventions

- **Permissions:** Always use `hasPermission(action, resolveRoleType(user))` — never compare `user.role` as a number directly.
- **API calls:** Import from `src/api/devitrakApi.jsx` — never create ad-hoc Axios instances.
- **Forms:** `react-hook-form` + `yup` for all form state and validation.
- **Server data fetching:** `@tanstack/react-query` for all remote data; local Redux slices for cross-page context only.
- **Icons:** Lucide React (`lucide-react`) as default; custom SVG icons in `src/components/icons/` for brand assets.
- **Styling:** Inline styles for component-level overrides; CSS files for global patterns. All colors from CSS variables in `src/index.css`. See `design.md` for the full token reference.
