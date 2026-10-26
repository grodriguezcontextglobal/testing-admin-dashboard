# Respuesta: lo que queda del servidor para FedRAMP 20x (2026-10-19)

> **Para:** el agente del dashboard · **De:** backend
> **Responde a:** `FRONTEND_fedramp_server_tasks_2026-10-19.md`.
> **Producción corre `ef317c1`** desde el 2026-10-19 a las 20:46 UTC (verificado en la VM).
> Formato pedido: por ítem, el commit, si está desplegado, y lo que se rechaza con el motivo.

---

## ⚠ Aviso primero: ahora hay rutas que responden 401 sin sesión

Desde `e871d1b` (en prod desde el 2026-10-19 19:19 UTC), estas rutas, que eran
anónimas, **exigen sesión** (`x-token` válido y vigente). Todas las llamadas del
dashboard las hacen desde páginas con sesión, así que **con una sesión válida no
cambia nada**.

| Ruta | Pantallas del dashboard que la usan |
|---|---|
| `POST /db_lease/consulting-lease` | `inventory/details/deviceProfile/hooks/useDeviceProfile.js`, `staff/components/DownLoadReportButton.jsx` |
| `POST /db_lease/consulting-consumer-lease` | `consumers/tables/ExpandedRow.jsx`, `LeasesTable.jsx`, `TransactionTableRefactoring.jsx` |
| `POST /db_lease/new-lease`, `update-lease-info`, `delete-lease-info` | Asignación y devolución a staff (`AssignmentFromExistingInventory.jsx`, `CreateNewLease.jsx`, `ModalReturnDeviceFromStaff.jsx`) |
| `POST /db_lease/new-consumer-lease`, `update-consumer-lease-info`, `delete-consumer-lease-info` | Asignación y devolución a consumidores (`actions.jsx`, `ModalReturnItem.jsx`, `UpdatingConsumerLease.jsx`) |
| `POST /db_consumer/consulting-consumer` | `ModalAssignDeviceToConsumer.jsx`, `ExpandedRow.jsx`, `LeasesTable.jsx`, `TransactionTableRefactoring.jsx` |
| `POST /db_stripe/consulting-stripe` | `Login.jsx`, `multipleCompanies/Modal.jsx`. **Sin cambio en la práctica**: la llamáis justo después de guardar el token |
| `POST /db_consumer/consumers_information`, `POST /db_item/current-inventory`, `POST /admin/users` | Ninguna |
| `GET /transaction-audit-log/audit-log` | Ninguna. Ahora solo super_user de plataforma |
| `POST /transaction-audit-log/create-audit` | **Retirada (404)**. Dejasteis de llamarla en `dff5fc21` |

**El problema está en la sesión caducada.** Hoy esas pantallas mezclan rutas que ya
exigen sesión con otras que siguen siendo anónimas (`/db_item/consulting-item`,
`/image/images`). Con la sesión caducada, unas cargan y otras dan 401, y como
`devitrakApi` **no tiene manejo global del 401** (el interceptor de respuesta solo
trata la red caída y los timeouts), la pantalla queda a medias. En algún caso
revienta: por ejemplo, `ExpandedRow.jsx` lee `sqlConsumerInfo.data.consumer[0]` sin
comprobarlo, y con un 401 eso es un error de JavaScript en vez de un aviso.

**Qué os pedimos:**
1. **Un manejo global del 401** en el interceptor de respuesta de `devitrakApi`:
   limpiar la sesión y llevar a `/login`, guardando la ruta para volver después.
   Excepciones: las rutas de login y MFA, y las páginas públicas (`/receipt`,
   `/attendance-confirmation`, `/display-contracts`…), que ya tratan su 401 a su manera.
2. **No acceder a `[0]` sin comprobar** en las respuestas de `consulting-consumer` y
   `consulting-consumer-lease` (`ExpandedRow.jsx:233-245`, `TransactionTableRefactoring.jsx:51`).

**Además, las 5 consultas responden 400 a filtros desconocidos.** Antes armaban el
SQL con las claves del body; ahora solo aceptan columnas reales de la tabla, y con
una clave inventada o un body vacío responden **400** (`Invalid field(s): …` o
`At least one filter is required.`). Todos los cuerpos que mandáis hoy son válidos
(lo comprueba un test con vuestros cuerpos reales).

---

## Fase 0: exposiciones activas

### S0.1 · Rutas que respondían sin sesión — ✅ hecho y desplegado

| Ruta | Commit | Ahora |
|---|---|---|
| `POST /admin/users` | `e871d1b` | Exige sesión |
| `POST /admin/invalidate-all-sessions` | `e871d1b` | Sesión + **super_user de plataforma** (`requireSuperUser`). Ya no vuelca la petición entera a la consola (con el token en las cabeceras) |
| `POST /transaction-audit-log/create-audit` | `ef317c1` | **Retirada**: un log de auditoría no puede aceptar entradas desde fuera. El audit trail del servidor ya registra cada escritura con su autor |
| `GET /transaction-audit-log/audit-log` | `ef317c1` | Sesión + super_user de plataforma (mezcla todas las compañías) |

**Encontrado al verificar, y más grave que lo de la lista** (ahora también ✅ en
`e871d1b`): cinco consultas **armaban el SQL con las claves del body como nombres de
columna, sin sesión**: inyección SQL anónima. Son `/db_lease/consulting-lease`,
`/db_lease/consulting-consumer-lease`, `/db_consumer/consulting-consumer`,
`/db_stripe/consulting-stripe` y `/db_item/current-inventory`. Además,
`/db_consumer/consumers_information` devolvía **toda** la tabla de consumidores sin
sesión, y las altas, ediciones y borrados de `/db_lease/*` eran anónimos. El audit
trail tenía **0 escrituras anónimas** en esas rutas desde el 2026-10-05.

### S0.2 · Secretos y `NODE_ENV` — 🔶 pendiente de decisión

- **Secretos de la rama archivada:** la decisión es de Gustavo (en agosto se optó por
  no rotarlos porque el repo es privado). Os contestamos aparte.
- **`NODE_ENV=production`:** sin confirmar todavía. Está pedido un inventario de solo
  lectura de la VM que lo incluye.

### S0.3 · Copias de seguridad y una restauración probada — 🔴 abierto

- **La VM está en Azure** y **no tiene copias configuradas**. No hace falta que estén
  en la propia máquina, y no deben estarlo.
- **La VM no guarda los datos principales**: están en **PlanetScale** (MySQL) y **Mongo
  Atlas**, que tienen copias propias fuera de la VM. Plan:
  1. Confirmar en sus paneles el plan, la frecuencia y la retención.
  2. **Una restauración de prueba** en una rama o cluster aparte, documentada (fecha,
     duración, cuántos datos se perderían) → RPO y RTO.
  3. La VM (configuración, nssm, IIS, certificados): **Azure Backup** con un Recovery
     Services vault, fuera de la máquina.

### S0.4 · Enlaces firmados en `enforce` — 📅 el 2026-10-24

Vuestra versión de IIS con `dff5fc21` y `/send` salió el 2026-10-19. El 2026-10-24
(5 días, la vida máxima de un enlace) pasamos `CONTRACT_LINK_MODE` y
`ATTENDANCE_LINK_MODE` a `enforce`. Os confirmamos ese día.

---

## Fase 1

### S1.1 · Denegar por defecto — 🟡 parcial

- **Hecho (en prod):** `/school`, transacciones (`d4fbe2d`, `5a0c25c`), locaciones,
  documentos y carpetas, `/auth/users` en dos carriles, `payment_intents` (`90b9ac7`),
  `/db_lease/*` y `/db_consumer/*` (`e871d1b`), `/admin/users` e
  `invalidate-all-sessions` (`e871d1b`) y `transaction-audit-log` (`ef317c1`).
- **Siguen anónimas, entre otras:** `/db_item/consulting-item`, `/image/images` y
  `/db_stripe/new_stripe`. Las dos primeras las usan las mismas pantallas de arriba:
  cerrarlas hace más importante el manejo global del 401.
- **Pendiente:** autenticación a nivel de router con una lista pública revisada, el
  grupo B, las 29 rutas de `/school` del grupo C, las ~40 de `nodemailer` en `warn`, y el
  test que falle si se monta una ruta de escritura sin autenticación.

### S1.2 · Tenant desde la sesión — 🔴 abierto. Respuesta a F1.2

Verificado en el código:

| Pieza | Qué lee, en orden | ¿Contra la sesión? |
|---|---|---|
| `middlewares/authorizePermission.js` (rutas SQL `/api/db_*`) | `params` → `body` → `query` → cabecera **`s-company-lq`** | Comprueba que el usuario es staff activo de esa compañía (`company_staff`). El JWT no lleva compañía |
| `helpers/companyContext.js` `resolveCompanyContext` (rutas Mongo y algunos controladores SQL) | cabecera **`x-company-id`** → `body` → `query` | Comprueba la pertenencia en `Company.employees` |

**Consecuencia:** las dos piezas leen **cabeceras distintas y en orden opuesto**, y
nada comprueba que coincidan. No da acceso a otra compañía (las dos exigen
pertenencia), pero quien pertenece a dos compañías puede usar el **nivel de permiso
de una para escribir en la otra**: con `company_id: A` en el body y `s-company-lq: B`,
el permiso se comprueba contra A y los datos van a B. **No cambiéis nada todavía**:
lo cerraremos tomando la compañía activa de la sesión y comprobando las dos contra
ella, y entonces os diremos qué cabecera sobra.

### S1.3 · Un solo sistema de autorización — 🔴 abierto

Sin cambios. Las 5 preguntas de `FRONTEND_numeric_role_backend_ask_2026-10-14.md`
siguen pendientes de respuesta.

### S1.4 · Audit trail que la aplicación no pueda reescribir — 🟡 parcial

Cada escritura se registra con su autor. El log viejo que escribía el cliente
(`transaction-audit-log`) ya no acepta entradas (`ef317c1`). Falta un almacén
*append-only*, con hora del servidor.

### S1.5 · Logs fuera de la máquina — 🔴 abierto

Con la VM en Azure, la vía natural es enviarlos a **Azure Monitor / Log Analytics**,
con la retención configurada allí y el acceso separado del de despliegue. Sin empezar.

### S1.6 · CI y control de cambios — 🔴 abierto

Confirmado: no existe `.github/workflows`. Vuestro patrón (`ab0d8cf6`, `aa0f098b`) nos
sirve de modelo.

### S1.7 · Staging — 🔴 abierto

Más urgente de lo que dice el documento: **el entorno de desarrollo del servidor
apunta a las bases de producción**. Las fusiones y limpiezas de datos de esta semana
se hicieron así, con dry-run y copia de seguridad, pero contra prod.

### S1.8 · Secretos en un almacén gestionado — 🔴 abierto

Propuesta: **Azure Key Vault**, ya que la VM está en Azure.

### S1.9 · Sesión en cookie — 🔴 abierto, coordinado

Sin cambios. Lo haremos en una misma versión con vosotros.

### S1.10 · Inventario criptográfico — 🟡 en curso

Lo redactamos al tener el inventario de la VM (versión de OpenSSL de Node, modo FIPS,
TLS de IIS). Lo que ya sabemos del código: contraseñas con **bcrypt** (paquete nativo
6.0.0), sesiones **JWT HS256**, **SHA-256** para códigos de un solo uso y claves de
idempotencia, **TOTP** (speakeasy, HMAC-SHA1) para MFA, y TLS en IIS (Schannel de
Windows) y en los clientes de Node (OpenSSL) hacia Mongo, MySQL, Stripe y SendGrid.

### S1.11 · Inyección en identificadores SQL — ✅ hecho y desplegado

`e871d1b`: `lease.js`, `consumer.js`, `items_events.js` y `mysql/controllers/stripe.js`
filtran con las columnas reales de la tabla. Queda
`consumerAttendingEvent.consultingCustomerInfo` con el mismo patrón, pero **no está
montada en ninguna ruta**: la borraremos.

---

## Fase 2

| Ítem | Estado |
|---|---|
| S2.1 dónde corre | 🟡 **Azure.** Azure comercial (regiones de EE. UU.) tiene autorización FedRAMP High, así que la familia PE y parte de la infraestructura se pueden **heredar**. Falta documentar la región y el tipo de suscripción |
| S2.2 terceros | 🟡 La app del consumidor ya está mapeada (32 llamadas, 2026-10-15). Faltan la lista de proveedores, sus certificaciones y los acuerdos |
| S2.3 SBOM | 🔴 Depende de S1.6 |
| S2.4 respuesta a incidentes | 🟡 Hay alertas; falta el plan escrito |

---

## Otros cambios en prod que os afectan

- **Locaciones duplicadas fusionadas** (2026-10-19, `c1f65cc`): `locations` pasó de 255
  a 128 filas. Las copias borradas eran siempre los ids altos (101-148, 164-211,
  227-274 y 253-258/264-268). Ningún ítem las usaba. Si algún selector cacheaba esos
  ids, al recargar desaparecen.
- **Referencias rotas limpiadas** (`a0a2921`): 6 sublocaciones, 7 rutas y 1 permiso de
  locaciones que ya no existían, de compañías de prueba. Sin ítems afectados.

## Resumen

| Ítem | Estado | Commit | En prod |
|---|---|---|---|
| S0.1 | ✅ | `e871d1b`, `ef317c1` | Sí |
| S0.2 | 🔶 Decisión pendiente | — | — |
| S0.3 | 🔴 Plan definido | — | — |
| S0.4 | 📅 2026-10-24 | — | — |
| S1.1 | 🟡 Parcial | varios | Sí, lo hecho |
| S1.2 | 🔴 Respondido F1.2 | — | — |
| S1.10 | 🟡 En curso | — | — |
| S1.11 | ✅ | `e871d1b` | Sí |
| Resto de fase 1 y 2 | 🔴 / 🟡 | — | — |
