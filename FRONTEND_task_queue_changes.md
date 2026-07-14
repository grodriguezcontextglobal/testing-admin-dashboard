# Reporte de cambios de contrato para el Frontend — Cola de tareas (Fases 1–3)

> **Para:** agente/equipo de frontend.
> **Contexto:** el backend incorporó una **cola de tareas durable** (store-and-forward sobre
> MongoDB): varias operaciones que antes se ejecutaban de forma síncrona ahora se **encolan** y se
> procesan en segundo plano, para no perderse si el servidor o una dependencia externa (SendGrid,
> S3, Go worker, un webhook) se cae. Esto **cambia la forma y el código de estado de varias
> respuestas**. Este documento lista exactamente qué cambió y qué hay que ajustar en el frontend.
>
> Base URL asumida: las rutas Mongo cuelgan de `/api/...` y las MySQL de `/api/db_...`.

---

## 0. Resumen ejecutivo (lo mínimo que hay que saber)

1. **~37 endpoints** que antes respondían **`201`** ahora responden **`202 Accepted`** con el mismo
   `ok: true` y, además, un `jobId`. **Acción global:** tratar `202` como éxito en toda llamada a
   estos endpoints (si el frontend hoy chequea `status === 201` o `=== 200` estricto, romperá).
2. La mayoría son correos y logs → **cambio cosmético** (ajustar texto de "enviado" a "en cola").
3. **Una excepción importante — subida de documentos PDF (`POST /api/document/upload`)**: pasa a un
   **contrato asíncrono real**. El frontend ya no recibe el `document` en la respuesta; debe
   **hacer polling** de `GET /api/jobs/owned/:jobId` para obtenerlo (ver §4). Endpoint listo en el
   backend.
4. **Stripe (pagos): NO cambia nada en el frontend.** Ver §6.

---

## 1. Cambio transversal: `201` → `202`

Todos los endpoints de las tablas siguientes ahora responden **`202`** en el camino feliz (antes
`201`). El cuerpo mantiene `ok: true` y suma `jobId`. Si el frontend valida el status code de forma
estricta, ajustar para aceptar `202`. Lo ideal: tratar cualquier `2xx` con `ok: true` como éxito.

Los códigos de error (`400` de validación, `500`) **no cambian** salvo donde se indique.

---

## 2. Correos — `POST /api/nodemailer/*` (35 rutas) · impacto: BAJO (cosmético)

**Antes:** `201 { ok: true, notification: "Email sent" }`
**Ahora:** `202 { ok: true, notification: "Email queued", jobId: "<id>" }`

- El correo ya no se envía dentro del request: se encola y un worker lo envía (con reintentos).
- **Acción frontend:**
  - Aceptar `202` como éxito.
  - Si la UI muestra "Correo enviado", cambiar el texto a algo como **"Correo en cola / se enviará
    en breve"** (es más honesto: al responder, todavía no se envió).
  - Si algún flujo **bloqueaba** esperando la confirmación de envío real, quitar ese bloqueo.
- **Los headers (`x-token`, `x-company-id`, etc.) se siguen enviando igual** — no cambia nada del
  lado de la request.
- Las rutas que validaban entrada (contratos de responsabilidad, términos y condiciones, etc.)
  **siguen devolviendo los mismos `400`** con el mismo `msg` si faltan campos.

Aplica a **todas** las rutas del namespace `/api/nodemailer/*`. Lista (no exhaustiva por multilínea,
pero el cambio es uniforme en las 35):

```
/assignig-device-notification            /confirm-returned-device-notification
/deposit-return-notification             /deposit-collected-notification
/early-remind-notification               /event-staff-notification
/lost-device-fee-notification            /confirmation-account
/login-existing-consumer                 /reset-admin-password
/edit-device-admin                       /customized-notification
/single-email-notification               /new_invitation
/internal-single-email-notification      /events-begin-reminder
/staff_internal_notification             /leased-equip-staff-notification
/invoice-notification                    /refund-notification
/send-consumer-app-instructions          /massive-event-customer-notification
/device-report-per-transaction           /feedback-email-notification
/liability-contract-email-notification   /liability-contract-consumer-email-notification
/liability-contract-member-email-notification
/returned-items-to-renter-notification   /terms-and-conditions-acceptance
/consumer-lease-return-device-notification  /member-lease-return-device-notification
/completed-task-notification             /failed-task-notification
/forcing-revoking-active-session         /member-email-notification
```

> Nota: `massive-event-customer-notification` y `feedback-email-notification` pueden responder
> `200 { ok: true, notification: "No email sent to any consumers" }` (sin `jobId`) cuando no hay
> destinatarios — es un caso de éxito, no un error.

---

## 3. Logs — impacto: MEDIO (cambia el cuerpo de la respuesta)

| Endpoint | Antes | Ahora |
|---|---|---|
| `POST /api/event-log/feed-event-log` | `201 { ok: true, feedEvent: <documento guardado> }` | `202 { ok: true, jobId }` |
| `POST /api/notificationlog/notification-feed-log` | `201 { ok: true, feedNotification: <documento guardado> }` | `202 { ok: true, jobId }` |

- **Cambio importante:** el documento guardado **ya no viene en la respuesta** (se persiste en el
  worker). Si algún componente del frontend usaba `response.feedEvent` / `response.feedNotification`
  (por ejemplo para tomar el `_id` recién creado o para pintar el registro), **hay que dejar de
  depender de eso**. Estos endpoints son "fire-and-forget" (registrar y seguir).
- **Acción frontend:** aceptar `202`; eliminar cualquier uso del documento devuelto.

> `POST /api/notificationlog/...` — atención al path: el namespace queda en minúsculas
> (`notificationlog`, sin guion ni camelCase).

### `POST /api/error_log/error_log` — SIN cambio de contrato

- Sigue respondiendo **`200 { ok: true, errorId, msg }`** con el **mismo `errorId`** de siempre
  (el id es real y estable; se puede seguir "guardando para referencia futura").
- Único cambio: ahora valida entrada → devuelve **`400 { ok: false, msg }`** si faltan
  `componentStack` o `error` (antes ese caso terminaba en `500`). Opcional: manejar el `400`.

---

## 4. ⚠️ Subida de documentos PDF — `POST /api/document/upload` · impacto: ALTO (contrato async)

**Antes:** `201 { ok: true, document: <documento completo con su URL de S3> }`
**Ahora:** `202 { ok: true, msg: "Document queued for upload", jobId: "<id>" }`

La subida a S3 y la creación del documento ahora ocurren en el worker. El frontend **ya no recibe
el `document` en la respuesta** — debe obtenerlo por **polling** del estado del job:

**Flujo esperado:**
1. `POST /api/document/upload` (multipart, igual que hoy) → recibe `{ jobId }`.
   - **Importante:** seguir enviando `created_by` en el body con el **uid Mongo del usuario logueado**
     (el mismo que viene en el JWT). Ese valor queda como "dueño" del job y es lo que habilita el
     polling del paso 2. (El frontend ya envía `created_by` hoy; solo hay que asegurarse de que sea
     el uid del usuario autenticado.)
   - **Enviar un header `Idempotency-Key`** (un UUID por acción de subida) — ver §4.1 "Idempotencia".
2. Hacer polling de **`GET /api/jobs/owned/:jobId`** cada ~1–2 s (mandando el token de sesión
   habitual — `x-token`). **Usar este endpoint, NO `/api/jobs/:jobId`** (ver nota de seguridad).
3. Cuando el job llegue a `status: "done"`, el documento está en **`result.document`**.
4. Si llega a `status: "dead"` (agotó reintentos), mostrar error y ofrecer reintentar la subida.
   Ver `lastError` para el detalle.

Respuesta de `GET /api/jobs/owned/:jobId` (SLIM, solo lo necesario para el polling):
```json
{ "ok": true, "id": "<jobId>", "type": "document:upload-pdf",
  "status": "pending|processing|done|failed|dead", "attempts": 1,
  "lastError": null, "result": { "document": { /* el documento creado */ } } }
```
Códigos: `401` si no hay token válido · `400` si el `jobId` es inválido · `404` si el job no existe
**o no es tuyo** (por privacidad no se distingue) · `200` en éxito.

Formas de validación de entrada del upload que **no cambian**: `400` si no hay archivo, `404` si la
compañía no existe (se validan antes de encolar, siguen siendo síncronas).

### 4.1 Idempotencia — evitar subidas duplicadas (StrictMode / doble-click / reintento)

El backend deduplica la subida **si el frontend envía un header `Idempotency-Key`** (recomendado:
un UUID v4). Ante dos requests con la misma clave, el backend devuelve **el mismo `jobId`** y sube
el documento **una sola vez** (maneja incluso dos requests casi simultáneas).

```
POST /api/document/upload
Idempotency-Key: 3f9a2c7e-...   (UUID por acción de subida)
```

> El backend ya tiene `Idempotency-Key` en su allowlist de CORS. Si al agregar el header ves el
> request como **"canceled" / 0 B / sin status** en la Network tab, es un preflight CORS bloqueado —
> avisá al backend (pero ya está contemplado; solo requiere que el server esté con el código nuevo).

⚠️ **Clave estable ante React StrictMode:** en desarrollo, StrictMode invoca los efectos **dos
veces**, disparando la subida dos veces. Para que la deduplicación funcione, **la misma clave debe
llegar en ambas invocaciones**. Por eso el UUID **NO debe generarse dentro del `useEffect`** que
hace la subida (ahí cada invocación generaría uno distinto y el backend vería dos operaciones
diferentes). Generarlo de forma estable: en un `useRef`/`useMemo`, en el handler del evento de
usuario, o derivado de datos estables del formulario. Así el duplicado de StrictMode colapsa en un
solo documento.

- Sin el header, no hay deduplicación (el backend sube lo que reciba) — pero se recomienda enviarlo
  siempre: también protege producción de doble-clicks y reintentos de red.
- Ante un duplicado deduplicado, la respuesta es igual (`202 { jobId }`, el mismo id) → el polling
  del paso 2 funciona idéntico.

### 🔒 Nota de seguridad (por qué `/owned/:jobId` y no `/:jobId`)

Existen DOS endpoints de estado de job, con distinto control de acceso — **usar el correcto**:
- **`GET /api/jobs/owned/:jobId`** → cualquier usuario autenticado, pero **solo su propio job**
  (el backend valida que `context.uid` del job coincida con el uid del token). **Este es el que
  debe usar el flujo de subida de documentos.**
- `GET /api/jobs/:jobId` y `GET /api/jobs/stats` → **solo `super_user`** (panel de
  administración/observabilidad, §7). Un usuario normal recibe `403` acá.

> El bloqueante que existía en una versión previa de este documento (el polling estaba solo en el
> endpoint super_user) **ya está resuelto en el backend** con `/api/jobs/owned/:jobId`. El flujo de
> §4 es completable.

---

## 5. ⚠️ Carga masiva de inventario alfanumérico — `POST /api/db_item/bulk-item-alphanumeric` · impacto: ALTO (auth nueva + contrato async)

**Antes:** `201 { ok: true, msg: "Alpha bulk items inserted successfully" }` — insertaba hasta 15,000
seriales (`list`) de forma síncrona dentro del mismo request/response, sin transacción real (cada
lote de 1000 se autocommiteaba independiente) ni idempotencia.
**Ahora:** `202 { ok: true, msg: "Bulk items queued for insertion", jobId: "<id>" }` — el INSERT
corre en el worker, dentro de una única transacción (rollback completo si falla a mitad).

### 5.1 Cambio de autenticación — AHORA requiere `x-token`

Esta ruta **no tenía `validateJWT`** antes (era una de las pocas rutas públicas de `mysql/routes/item.js`).
Ahora sí lo requiere, porque el `uid` del token es lo que queda como dueño del job (necesario para el
polling del paso siguiente).

- **Acción obligatoria:** agregar el header **`x-token`** (JWT de sesión habitual) a la request de
  `alphaNumericInsertItemMutation`. Si el cliente HTTP que usa esta mutation hoy es uno "público" sin
  interceptor de auth, hay que moverla al cliente autenticado — sin esto la request devuelve `401`.
- Si `sqlStaffId` se resuelve por header en vez de venir en el JWT, incluir también `s-token-lq`
  (mismo criterio que el resto de rutas autenticadas).
- El `template` que arma el frontend (`list`, `extra_serial_number`, y el resto de campos) **no
  cambia** — no hace falta agregar ningún campo de identidad en el body, el `uid` sale del JWT.

### 5.2 Flujo esperado

1. `POST /api/db_item/bulk-item-alphanumeric` con `x-token` (nuevo) + header `Idempotency-Key`
   (recomendado, UUID por submit — ver §4.1, mismo mecanismo) → recibe `{ jobId }`.
   - `400`/`404` (falta `location`/`company_id`, o la ubicación no existe) **no cambian**: siguen
     siendo síncronos, se manejan igual que hoy.
2. Mostrar **de inmediato** un toast informativo de "encolado", NO de éxito: *"Tu carga de N items
   fue registrada y se está procesando en segundo plano. Te avisaremos cuando esté lista."* Limpiar
   el formulario/`scannedSerialNumbers` ya es seguro acá (el job quedó registrado). **No navegar
   todavía** a `/inventory`.
3. Hacer polling de **`GET /api/jobs/owned/:jobId`** (mismo `x-token`, mismo endpoint que documentos
   — NO `/api/jobs/:jobId`, ese es solo `super_user`) cada ~3 s hasta `status` terminal.
   - **Importante:** este polling debe vivir en un lugar que sobreviva la navegación (hook de React
     Query con `queryKey: ['job', jobId]` + `refetchInterval`, o un `JobToastProvider` global en el
     layout raíz) — no en un `setInterval` local del formulario. Si el usuario navega apenas ve el
     toast de "encolado" (paso 2), un polling local moriría con el unmount y el resultado final nunca
     le llegaría.
4. **`status: "done"`** → recién ahí: toast de éxito (*"Se crearon N items exitosamente en el
   inventario"*), las dos llamadas a `clearCacheMemory(...)` que ya existen hoy, y `navigate("/inventory")`
   solo si el usuario sigue en esa pantalla (si no, el toast global alcanza).
5. **`status: "failed"` o `"dead"`** → mostrar `lastError` de forma legible, ofrecer reintentar
   (mismo `Idempotency-Key` si es el mismo intento, uno nuevo si es un submit distinto).

### 5.3 Checklist de validación de este flujo

- [ ] Carga chica (~5 seriales) end-to-end: encolado → toast inicial → polling → toast final → navegación.
- [ ] Ubicación inexistente → `404` inmediato, sin llegar a encolar.
- [ ] Navegar a otra pantalla apenas llega el `202` → confirmar que el toast final igual llega (valida
      que el polling es global, no local al formulario).
- [ ] Doble-click rápido en submit → ambos requests devuelven el **mismo** `jobId` (idempotencia).
- [ ] Request sin `x-token` → confirmar que ahora es `401` (antes funcionaba sin token).

---

## 6. Otros endpoints con `201 → 202` · impacto: BAJO

| Endpoint | Antes | Ahora | Nota |
|---|---|---|---|
| `POST /api/db_event/inserting-items-in-event-from-container` | `201 { ok: true, msg }` | `202 { ok: true, msg: "Items queued for insertion into event", jobId }` | Solo aceptar `202`; el resto igual. |
| `POST /api/document/upload/xlsx` (importación de inventario) | podía devolver `502` si el webhook de importación estaba caído | `200 { ok: true, msg, data: { s3Location, signedUrl } }` (sin `502`) | **Se puede quitar el manejo especial del `502`**: si el webhook está caído, ahora se reintenta en segundo plano y la respuesta es exitosa igual (el archivo ya quedó en S3). El resultado real de la importación sigue llegando por los callbacks de siempre. |

---

## 7. Stripe (pagos) — SIN cambios en el frontend ✅

Las mutaciones de Stripe (capturar, cancelar, reembolsar) **no se encolaron** (el dinero no se
"buffea"). Se endurecieron del lado del backend (reintentos + circuit breaker), pero el **contrato
es idéntico**: mismos endpoints, mismos códigos, mismos cuerpos. No hay nada que cambiar.

- Único matiz observable: si Stripe estuviera caído, el backend ahora puede responder más rápido
  con un error de "servicio no disponible" (en vez de colgarse esperando reintentos). El manejo de
  error genérico existente del frontend ya lo cubre.

---

## 8. Endpoints NUEVOS disponibles

### 8.1 Polling del propio job — cualquier usuario autenticado

| Endpoint | Auth | Devuelve |
|---|---|---|
| `GET /api/jobs/owned/:jobId` | `validateJWT` (token de sesión, `x-token`) | `{ ok, id, type, status, attempts, lastError, result }` — solo si el job es del usuario (`context.uid === uid del token`); si no, `404`. Respuesta SLIM (sin `payload`/`context`). |

Este es el que usa el flujo de subida de documentos (§4). Sirve para cualquier tarea async futura
donde el usuario que la originó necesite consultar su resultado.

### 7.2 Observabilidad de plataforma — solo `super_user`

Requieren `validateJWT` + ser `super_user`. Para un panel de administración/soporte (opcional):

| Endpoint | Devuelve |
|---|---|
| `GET /api/jobs/stats` | `{ ok, stats: { pending, processing, done, failed, dead, total } }` |
| `GET /api/jobs/:jobId` | `{ ok, id, type, status, payload, context, attempts, lastError, result, ... }` (respuesta completa) — `400` si el `jobId` no es un ObjectId válido, `404` si no existe |

Estados posibles de un job (`status`): `pending` → `processing` → `done` | `failed` | `dead`
(`dead` = agotó los reintentos, requiere intervención).

---

## 8. Checklist accionable para el frontend

- [ ] **Global:** aceptar `202` como éxito en todas las llamadas afectadas (idealmente: `2xx` +
      `ok:true`).
- [ ] **Correos (`/api/nodemailer/*`):** ajustar textos "enviado" → "en cola"; quitar bloqueos que
      esperaban confirmación de envío.
- [ ] **Logs:** dejar de usar `feedEvent` / `feedNotification` de la respuesta.
- [ ] **`error_log`:** (opcional) manejar el nuevo `400`.
- [ ] **`inserting-items-in-event-from-container`:** aceptar `202`.
- [ ] **`upload/xlsx`:** quitar el manejo especial del `502`.
- [ ] **Documentos PDF (`/api/document/upload`):** enviar `created_by` = uid del usuario logueado;
      enviar header `Idempotency-Key` (UUID estable ante StrictMode, ver §4.1); implementar polling
      de **`GET /api/jobs/owned/:jobId`** → `result.document` (ver §4).
- [ ] **Stripe:** nada.
- [ ] (Opcional) Panel de admin usando `GET /api/jobs/stats` y `GET /api/jobs/:jobId` (super_user).

---

## 9. Preguntas abiertas / a coordinar con backend

1. Intervalo de polling recomendado (el worker corre cada ~4 s por defecto; polling de 1–2 s del
   frontend es razonable).
2. Confirmar que `created_by` que envía hoy el frontend en el upload de documento es el **uid Mongo
   del usuario autenticado** (necesario para que `GET /api/jobs/owned/:jobId` reconozca al dueño).
