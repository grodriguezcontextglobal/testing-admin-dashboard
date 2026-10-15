# Inventario criptográfico del dashboard (F1.4, 2026-10-15)

Punto F1.4 del plan FedRAMP (`fedRAMP/FRONTEND_action_plan_2026-09-28.md`):
listar qué cifra, firma o hashea el cliente y con qué librería. Comprobado
contra el código de `main` (`bcd74b06`) y `package.json`.

**Resumen:** el dashboard **no cifra, firma ni hashea nada propio**. Toda la
criptografía la hace el navegador (TLS, Web Crypto) o terceros en su propio
iframe/SDK (Stripe, Cloudflare). Lo que importa para FedRAMP está en la
sección 3: secretos y datos que el cliente **guarda** en el navegador.

## 1. Lo que usa el código

| Uso | Dónde | Librería | Qué hace | Valoración |
|---|---|---|---|---|
| Leer el JWT de sesión | `App.jsx:54`, `Login.jsx:216`, `multipleCompanies/Modal.jsx:75` | `jwt-decode` 4 | **Decodifica** el payload (base64), **no verifica** la firma | Correcto: la firma la verifica el servidor en cada petición. El cliente solo lee la caducidad y el id |
| Claves de idempotencia de pagos | `utils/actions/generateIdempotencyKey.js:3` | Web Crypto (`crypto.randomUUID`) | UUID v4 aleatorio | Correcto. CSPRNG del navegador. Ver el respaldo en §4 |
| Transporte | todo `devitrakApi` | TLS del navegador | HTTPS contra `VITE_APP_DEVITRACK_API` | `envValidation.js` exige URL `http(s)`; **no exige `https`** (§4) |
| Base64 de un XLSX | `suppliers/actions/generateOptimizedXLSXFile.jsx:77` | `btoa` | Codificación, no cifrado | Fuera de alcance |

## 2. Lo que hacen terceros, no nosotros

| Proveedor | Librería | Qué cubre | Nota |
|---|---|---|---|
| Stripe | `@stripe/stripe-js`, `react-stripe-js`, `connect-js` | Tarjetas en el iframe de Stripe; el dashboard nunca ve el PAN | Solo la clave pública `pk_`; `envValidation.js` rechaza una `sk_`/`rk_` |
| Cloudflare Turnstile | `react-turnstile` | Captcha; el token lo valida el servidor | — |
| MFA (TOTP) | ninguna en el cliente | El servidor genera el secreto y el QR; el cliente los muestra (`MfaEnrollmentModal.jsx:73-74`) y envía el código | El secreto viaja una vez, por TLS, para el enrolamiento manual. Es lo habitual |

## 3. Datos sensibles guardados en el navegador (lo relevante para FedRAMP)

1. **El JWT de sesión en `localStorage`** (`admin-token`, `Login.jsx:215`).
   Cualquier script que corra en la página puede leerlo; una cookie
   `HttpOnly` no. Cambiarlo es un cambio coordinado con el backend
   (emitir cookie, CSRF). Es la decisión de mayor peso de este inventario.
2. **Todo el store de Redux persistido sin cifrar** (`store/Store.js:33`,
   `redux-persist` con `storage` = `localStorage`, sin `whitelist`). Incluye
   `admin.user` (nombre, email, compañía, empleados) y los slices de
   miembros, clientes y Stripe. En un equipo compartido queda en disco tras
   cerrar la pestaña, hasta el logout. **Propuesta:** `whitelist` con solo lo
   que hace falta para rehidratar la sesión, o `sessionStorage`. Es trabajo
   nuestro; pedirlo como tarea aparte, porque cambia qué sobrevive a una
   recarga.
3. **El logout limpia** `SESSION_STORAGE_KEYS` (`api/sessionHeaders.js:10`)
   mediante `clearSessionStorage`. Lo persistido de Redux lo limpia el
   `onLogout` del slice; no se comprobó aquí que *todos* los slices se vacíen.

## 4. Pequeños, sin dependencia

- **`generateIdempotencyKey`** tiene un respaldo para navegadores sin
  `crypto.randomUUID`: `` `${Date.now()}-${Math.random()…}` ``, que no es un
  CSPRNG. Para una clave de idempotencia basta con que no choque, así que no
  es un riesgo de seguridad, pero un auditor lo marcará. Todos los navegadores
  soportados tienen `randomUUID` (y `crypto.getRandomValues` como respaldo
  correcto).
- **`envValidation.js` acepta `http://`** para la API. En `vite build` debería
  exigir `https://`, salvo `localhost`.
- **Dependencias sin uso:** `bcryptjs` (quitado en este mismo cambio, era del
  `compareSync` que F0.3 eliminó) y **`@azure/msal-browser` /
  `@azure/msal-react`**, que nada importa en el repo. **Quitados el mismo
  día**, con `@azure/msal-common`, que solo traían ellos.

**Hecho el mismo día:** el respaldo de `generateIdempotencyKey` usa
`getRandomValues` (`28f3a826`) y el build exige `https` fuera de esta máquina
(`a69f10be`).

## 5. Qué no hay

Ningún `crypto.subtle` (cifrado, firma, HMAC), ningún hash de contraseñas
(desde `c1a4a454` la contraseña se verifica en el servidor) y ninguna clave o
secreto en el bundle (F0.1/F0.2, `ConfigEnvExport.test.js`).
