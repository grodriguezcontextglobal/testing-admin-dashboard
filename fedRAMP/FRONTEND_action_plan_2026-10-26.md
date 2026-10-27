# Plan de acción del dashboard hacia SOC 2 / GovRAMP / FedRAMP (2026-10-26)

> Sustituye la parte pendiente de `FRONTEND_action_plan_2026-09-28.md`.
> **Alcance:** solo lo que le toca a este repositorio. Lo que depende del
> backend está pedido en
> `server-testing/reports/FRONTEND_fedramp_dashboard_status_2026-10-26.md`.
> Todo lo de abajo se comprobó hoy contra el código, `npm audit` y las
> cabeceras que sirve `admin.devitrak.net`.

---

## 0. Hacia dónde apunta esto

La puerta de entrada a FedRAMP 20x Class A es **SOC 2 Type II o GovRAMP**, y
las dos necesitan lo mismo de nosotros:

- **controles que funcionen**: acceso, sesión, cifrado en tránsito,
  vulnerabilidades;
- **un proceso que deje evidencia**: revisión de cambios, puertas de CI,
  inventarios.

El primer paso externo, el **GovRAMP Single Security Snapshot** ($1.500, 40
controles, confidencial), puntúa justo eso. Este plan está ordenado para
llegar a ese Snapshot con la parte del dashboard limpia.

### Ya hecho, y sirve de evidencia

| Hecho | Control |
|---|---|
| Sin secretos en el bundle, con un test que lo impide | IA-5, SC-12 |
| La contraseña se verifica en el servidor; el navegador no recibe hashes | IA-5 |
| Variables de entorno validadas al construir; se exige `https` | CM-6, SC-8 |
| MFA obligatorio con enrolamiento forzado | IA-2(1) |
| Contraseña de 12 a 128 caracteres, bloqueo de cuenta y aviso de intentos restantes | IA-5, AC-7 |
| Manejo global del 401, sesión de 12 h, sin "Recordarme" | AC-12 |
| Los datos de personas del store se guardan solo en la pestaña, y el logout vacía todo | SC-28 |
| Un solo sistema de roles en el cliente (`roles.js`), con test de guarda | AC-2, AC-6 |
| CI en cada push (lint con línea base, 4.797 tests, build) y release reproducible | CM-3, SA-11 |
| Inventario criptográfico | SC-13 |

---

## Estado al 2026-10-27

- **A1–A4, B1, B2:** en `main` y con release, pero **sin desplegar**:
  `admin.devitrak.net` sigue sirviendo el build del 23-10 (sin cabeceras).
  Falta pasar `Update-AdminSite.ps1` en la VM; la semana de CSP Report-Only
  empieza ese día.
- **A1:** quedan 4 excepciones (vite, sharp) hasta el 31-12, que se cierran con
  Vite 6.4.4+ y `vite-plugin-pwa`/`assets-generator` 2.0. Dependencias de test
  parcheadas el 27-10 (vitest 4.1.12, happy-dom 21.0.4).
- **A3:** pendiente de decisión: quitar o no la caché GET y la cola offline.
- **B2:** texto pendiente de legal. **B3–B7:** sin respuesta del backend al
  reporte del 26-10.
- **C3, C7, C8:** hechos el 27-10. **C1:** `main` sigue sin protección
  (decisión). **C2:** 280 avisos. **C4–C6, D1–D5:** sin empezar.

---

## Fase A — Exposiciones activas · esta semana · no dependen de nadie

### A1. Vulnerabilidades en dependencias de producción · RA-5, SI-2 · SOC 2 CC7.1

`npm audit --omit=dev` encuentra **11 vulnerabilidades: 1 crítica, 5 altas,
2 moderadas y 3 bajas.**

- `dompurify` ≤3.4.16: **crítica**. Es la librería que sanea HTML, así que
  su fallo es precisamente un XSS.
- Altas: `follow-redirects`, `sharp` (libvips) y `serialize-javascript`.
- También aparecen `quill`, `esbuild` y `fast-uri`.

- **Hacer:** actualizar por paquete, sin `npm audit fix --force`. Editar
  `package-lock.json` a mano si no hay Docker. Comprobar con tests y `vite build`.
- **Puerta:** añadir a `ci.yml` `npm audit --omit=dev --audit-level=high`.
- **Hecho cuando:** 0 críticas y 0 altas, y la CI falla si aparece una nueva.

### A2. Cabeceras de seguridad en producción · SC-8, SC-7, SI-10 · CC6.6, CC6.7

`admin.devitrak.net` responde **sin ninguna cabecera de seguridad** y además
anuncia `X-Powered-By: ASP.NET`. Es lo primero que marca cualquier escáner,
cuestionario de distrito o pentest. `public/web.config` hoy solo tiene
rewrite, compresión y tipos MIME.

- **Hacer:** añadir `<httpProtocol><customHeaders>` en `public/web.config`:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`;
  - `X-Content-Type-Options: nosniff`;
  - `X-Frame-Options: DENY`, más `frame-ancestors 'none'`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `Permissions-Policy` limitada a la cámara (escáner QR);
  - `<remove name="X-Powered-By"/>`.
- **CSP en dos pasos:** primero `Content-Security-Policy-Report-Only` con
  las fuentes reales (API, Stripe, Turnstile, fuentes, imágenes de S3). Tras
  una semana sin informes falsos, se pasa a enforce. Es el mismo patrón
  warn→enforce del backend.
- **Ojo:** delante de IIS hay un proxy (`Server: openresty`). Hay que
  comprobar que no quita ni duplica cabeceras.
- **Hecho cuando:** `curl -I` muestra las cabeceras, y un test lee
  `public/web.config` para que no se pierdan.

### A3. El service worker guarda datos y credenciales fuera de la sesión · SC-28, AC-12

Dos reglas de `vite.config.js` (workbox `runtimeCaching`):

1. **Caché de las respuestas GET de la API** (`devitrak-recent-data`,
   `NetworkFirst`): hasta 30 respuestas durante 24 h en Cache Storage, con
   datos de personas (staff, consumidores, alumnos). **El logout no la
   borra**: no hay ningún `caches.delete` en `src/`. Así se deshace en parte
   lo que logró `c630f1a3`.
2. **Cola de escrituras** (`backgroundSync`, POST/PUT): guarda la petición
   completa en IndexedDB hasta 24 h para reintentarla. Workbox guarda también
   las cabeceras, así que **el `x-token` queda en disco**, y una escritura
   encolada podría reenviarse después del logout.

- **Hacer:**
  - en el logout (`clearSessionStorage` y el 401 global), borrar las cachés
    `devitrak-*` y las dos colas;
  - quitar la caché GET de las rutas con datos personales, o de todas. Un
    dashboard de staff no necesita ver datos de ayer sin red;
  - decidir si la cola offline compensa su riesgo. Si se queda, con
    retención corta y vaciada al salir.
- **Hecho cuando:** tests sobre la limpieza, y en DevTools → Application no
  queda nada tras el logout.

### A4. Sacar lo de hoy a producción

Los cambios del 26-10 (rol al cerrar evento, "Recordarme", intentos
restantes, código muerto) están en `main` sin commit ni release. Commit,
push, release IIS y avisar al backend de la fecha.

---

## Fase B — Sesión y acceso · 2–3 semanas

| | Qué | Control | Depende de |
|---|---|---|---|
| **B1** | **Cerrar sesión por inactividad.** `InactivityLogout` está comentado en `App.jsx:164` (2 h, sin tests). La línea base Moderate pide **15 min**. Rehacerlo como hook en `src/hooks/` con tests: aviso a los 13 min, salida a los 15, mismo camino que el 401 global, sincronizado entre pestañas | AC-11, AC-12 | nadie |
| **B2** | **Aviso de uso del sistema en el login** (sistema privado, uso monitorizado, consentimiento). El texto lo aprueba legal o Gustavo | AC-8 | texto |
| **B3** | **Sesión en cookie HttpOnly**, fase 2: `withCredentials`, `X-CSRF-Token`, dejar de escribir `admin-token` | SC-23, AC-12 | backend fase 1 (§4.1 del reporte) |
| **B4** | **Dejar de mandar `s-token-lq`** | AC-3 | deploy del backend (§3.1) |
| **B5** | **Retirar el rol numérico**: dejar de mandarlo, de escribirlo y quitar `LEGACY_ROLE_MAP` | AC-2, AC-6 | respuestas §4.2 |
| **B6** | **Quitar acceso al cerrar un evento desde el servidor**, y dejar de mandar la lista entera de empleados | AC-2 | backend (§3.2) |
| **B7** | **Compañía por id en el login**, no por nombre | AC-4 | backend (§3.3) |

B1 y B2 se pueden hacer ya. El resto se hace en cuanto llegue cada respuesta.

---

## Fase C — Proceso que deje evidencia · Q4 · CM-3, SA-11, SR · SOC 2 CC8.1

Un auditor de SOC 2 pide una muestra de cambios y comprueba que cada uno se
revisó y pasó las puertas. Hoy podemos enseñar las puertas, pero no la
revisión.

| | Qué | Esfuerzo |
|---|---|---|
| **C1** | **Proteger `main`.** Como mínimo, *required status checks* (la CI tiene que pasar para que entre un push). Lo que pide CC8.1 es revisión por una segunda persona vía PR. Con dos personas es viable si los PR son pequeños. **Decisión de Gustavo**: choca con el push directo actual | decisión + 10 min |
| **C2** | **Lint de 281 a 0.** Son 268 `react-hooks/exhaustive-deps` y 13 `react-refresh`. Por tandas, por carpeta, bajando la línea base de `ci.yml` en el mismo commit. Cada arreglo de dependencias de un hook se prueba, porque cambia cuándo se ejecuta | 2–3 semanas repartidas |
| ~~**C3**~~ ✅ 27-10 | **`.github/dependabot.yml`** para npm, github-actions y docker. Hoy no existe; solo llegan las alertas | 30 min |
| **C4** | **SBOM** CycloneDX generado en `release.yml` y adjunto a cada release. Es el S2.3 del backend, del lado nuestro | medio día |
| **C5** | **Escaneo de secretos**: gitleaks en la CI sobre el diff, y push protection de GitHub si el plan lo incluye | medio día |
| **C6** | **Análisis estático** con reglas de seguridad: `eslint-plugin-security` o Semgrep en la CI. CodeQL en repos privados requiere GitHub Advanced Security, que es de pago | 1 día |
| ~~**C7**~~ ✅ 27-10 | **Fijar las actions por SHA** en los tres workflows, contra ataques a la cadena de suministro | 1 h |
| ~~**C8**~~ ✅ 27-10 | **Informe de cobertura** de Vitest como artefacto de CI. Es evidencia de SA-11 | 1 h |

---

## Fase D — Documentos que un auditor pedirá del frontend

Son cortos, y salen de lo que ya está escrito en `reports/`.

| | Documento | Control |
|---|---|---|
| **D1** | **Datos en el cliente**: qué guarda el dashboard (localStorage, sessionStorage, Cache Storage, IndexedDB), cuánto tiempo y cuándo se borra. Depende de A3 | SC-28, MP |
| **D2** | **Terceros en el navegador**: Stripe, Cloudflare Turnstile, fuentes y CDNs, con qué datos ve cada uno. Alimenta S2.2 del backend | CA-3, SA-9 |
| **D3** | **Gestión de cambios del dashboard**: CI, release IIS, rollback, quién aprueba. Depende de C1 | CM-3, CM-4 |
| **D4** | **Mantener el inventario criptográfico** cuando cambie la sesión (B3) | SC-13 |
| **D5** | **Accesibilidad (Sección 508 / VPAT)**. No es FedRAMP, pero cualquier compra federal la pide. Solo si la Fase 5 del informe se activa | — |

---

## Secuencia

| Semana | Trabajo | Resultado |
|---|---|---|
| 1 (26-10) | A1, A2 (CSP en Report-Only), A3, A4 | Sin exposiciones conocidas en el cliente |
| 2 | B1, B2, C3, C7, C8 · CSP a enforce | Sesión conforme a Moderate. CI con dependencias vigiladas |
| 3–4 | C4, C5, C6 · C2 por tandas · D1, D2 | Evidencia de proceso, lista para el Snapshot |
| Según backend | B3–B7 | Un solo sistema de sesión y autorización |
| Decisión | C1 → D3 | Control de cambios auditable |

**Lo que hay que decidir, y no es técnico:** C1 (revisión obligatoria en
`main`), el texto de B2 y si la cola offline de A3 se queda.
