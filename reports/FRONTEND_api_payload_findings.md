# Respuestas a los hallazgos del cliente sobre `docs/api-payloads.*`

> **De:** backend. **Para:** el agente/equipo del frontend. **Fecha:** 2026-08-25.
> Base: `docs/api-payloads.md` y `docs/api-payloads.d.ts` regenerados hoy
> (485 endpoints montados, 450 con payload detectado).
>
> Backend **no cambió ninguna ruta**. Estado tras las respuestas del cliente
> (2026-08-25): A1 y A5 cerrados, A2 en discusión, **A3 y A4 agendadas** como trabajo
> de backend. El resumen está en **§C** y el detalle de lo agendado en **§D**.

---

## A. Los cinco desajustes reales (arreglo en el cliente)

### A1 · `GET /api/stripe-transactions-saved-list` → falta el segmento `/stripe`

Ruta real, y existe con **los dos métodos**:

| Método | Ruta | Definida en | Handler |
| --- | --- | --- | --- |
| GET | `/api/stripe/stripe-transactions-saved-list` | `routes/stripe.js:145` | `controller/stripe.js:965` |
| POST | `/api/stripe/stripe-transactions-saved-list` | `routes/stripe.js:152` | `controller/stripe.js:965` |

Auth: `optionalJWT` — acepta la llamada sin token (queda en el *lane* público). Éxito: **201** `{ ok, list }`.

El detalle que importa: el handler hace `StripeTransaction.find(request.body)`, o sea
**el body es un filtro Mongo**. En `GET` no puedes mandar body → el filtro llega vacío
y devuelve **todas** las transacciones. Si el listado necesita filtrar, usa el `POST`
con un subconjunto de los campos de `models/StripeTransaction.js`:

```jsonc
// POST /api/stripe/stripe-transactions-saved-list
{ "user": "<id>", "company": "<nombre>", "eventSelected": "<id>",
  "paymentIntent": "pi_...", "provider": "...", "type": "...",
  "device": 0, "clientSecret": "..." }   // todos opcionales; {} = todo
```

### A2 · `POST /api/stripe/subscriptions/:id` no existe

Sobre ese path solo hay lectura y borrado. Elegí según la intención:

| Intención | Endpoint real | Body | Definida en |
| --- | --- | --- | --- |
| Consultar la suscripción | `GET /api/stripe/subscriptions/:id` | — | `routes/stripe.js:273` |
| Cancelar ya | `DELETE /api/stripe/subscriptions/:id` | — | `routes/stripe.js:279` |
| Cancelar al fin del periodo | `POST /api/stripe/cancel/subscriptions/:id` | `{ cancelAtPeriodEnd, cancellationComment }` | `routes/stripe.js:168` |
| Cambiar método de pago por defecto | `POST /api/stripe/payment-method/subscriptions/:id` | — (usa `:id`) | `routes/stripe.js:106` |
| Actualizar la suscripción en la cuenta de la company | `PATCH /api/stripe/updating-subscription/:id` | — (usa `:id`) | `routes/stripe.js:276` |

Si el `POST` que llamabas no encaja en ninguna de esas cinco, decime qué esperaba
hacer y lo resolvemos como ask (no adiviné para no crear una ruta duplicada).

### A3 · `PUT /api/document/:id` no existe — y no hay update de documento

Lo que hay sobre documentos por id:

- `GET /api/document/:id` — `routes/document.js:117`
- `DELETE /api/document/:id` — `routes/document.js:120`, con `canManage`

El único `PUT` del módulo es **de carpetas**: `PUT /api/document/folder/:id`
(`routes/document.js:140`, body `{ folder_name, folder_description, documents, trigger_action }`).
Para documentos no existe update: hoy el flujo es `POST /api/document/upload` +
`DELETE /api/document/:id`.

**Necesito tu respuesta (§C2):** si el cliente necesita editar metadatos de un
documento sin re-subirlo, dime **qué campos** (¿`document_name`, `document_type`,
`trigger_action`, `folder_id`?) y agrego un `PATCH /api/document/:id` con lista
blanca y `canManage`.

### A4 · `POST /api/db_location/sub-location-path/delete` → 404, y "sin `/delete`" es peor

Cuidado con este: la ruta sin `/delete` **no es la de borrado, es la de creación**.

- `POST /api/db_location/sub-location-path` (`mysql/routes/location.js:44` →
  `mysql/controllers/sub_location_paths.js:4`) **crea** un path ordenado.
  Requeridos: `company_id`, `location_id`, `sub_location_path` (array de strings no
  vacío). Respuestas: 201 `{ ok, path_id, path_key }`, 400 validación,
  404 location ajena a la company, **409 si el path ya existe**.

Si el cliente reapunta ahí su llamada de borrado, en el mejor caso recibe 400/409 y
en el peor **inserta un path nuevo**. No existe endpoint de borrado de paths.

**Necesito tu respuesta (§C1):** si el flujo requiere borrar un path, lo agrego
(`DELETE /api/db_location/sub-location-path/:path_id`, validando que el path
pertenezca a la company del token). Confirmame que hace falta.

### A5 · `ReturningLeasedEquipModal.jsx:113` → `POST /db_item/:id` es la ruta de **borrado**

Esto es lo más delicado de la lista. `POST /api/db_item/:id`
(`mysql/routes/item.js:101`) apunta al **mismo handler que `/delete-item`**:
`deleteItem` (`mysql/controllers/item.js:606`), que ejecuta
`DELETE FROM item_inv WHERE item_id = ? AND company_id = ?`.

Dos cosas:

1. El segmento `:id` **se ignora**: el handler lee `item_id` y `company_id` del body.
   Sin body responde 400 — o sea que hasta ahora esa llamada no borró nada por suerte,
   no por diseño.
2. Borra la fila del inventario. **Actualización 2026-08-25: eso es exactamente lo
   buscado** — el ítem devuelto al vendor/renter sale del registro de la company. El
   contrato confirmado, con el orden de operaciones y el detalle de huérfanos, está en
   **§D3**. Las alternativas de abajo aplican solo a los flujos en los que el ítem
   **sí** se queda en la company (devolución de evento, cierre de lease sin baja):

| Objetivo | Endpoint | Requeridos |
| --- | --- | --- |
| Marcar el equipo como devuelto / cambiar estado y ubicación | `POST /api/db_item/edit-item` | al menos un identificador (`item_id` o `serial_number` + `company_id`); campos por lista blanca: `status`, `logistic_status`, `current_location`, `warehouse`, `return_date`, `returnedRentedInfo`, … |
| Cerrar el lease del dispositivo | `POST /api/db_lease/delete-lease-info` | `company_id`, `device_id`, `staff_member_id` |
| Cerrar el lease de un consumer | `POST /api/db_lease/delete-consumer-lease-info` | `company_id`, `consumer_member_id`, `device_id` |
| Devolución masiva (school) | `POST /api/db_member/bulk-return` | `company_id` (+ `member_ids`, `logistic_status`, `warehouse`, `grade`) |

Para el caso confirmado (baja del inventario) usá `POST /api/db_item/delete-item` con
`{ item_id, company_id }`, o el bulk si son varios ítems — ver §D3.

---

## B. Los tres que esperaban respuesta del backend

### B1 · `push` / `broadcast` — **no existe nada**

No hay ninguna ruta con `push` ni `broadcast` en el servidor, y tampoco
infraestructura para ello: `package.json` no tiene ningún cliente de push
(ni `expo-server-sdk`, ni `firebase-admin`/FCM, ni `web-push`, ni `socket.io`).

Lo más cercano que sí existe:

- **Email encolado**: `POST /api/nodemailer/*` (38 endpoints, todos responden 202 con
  `jobId`).
- **Registro de notificaciones**: `POST /api/notificationlog/notification-feed-log`
  (`routes/notificationLog.js:14`) — solo **registra** en Mongo, no envía nada.

Push real es trabajo nuevo de backend (proveedor + tabla de tokens de dispositivo +
handler de cola + permisos). Si lo quieren en el roadmap, decime plataforma
(web/PWA vs app móvil) y lo dimensiono.

### B2 · `cloudinary/upload-image` — **sí funciona**

```jsonc
// POST /api/cloudinary/upload-image      (sin auth, anónimo)
{ "imageFile": "data:image/png;base64,...",  // o una URL remota
  "imageID":   "public-id-opcional",
  "tags":      ["tag1", "tag2"],
  "context":   "key=value|key2=value2" }
// 201 { ok: true, imageUploaded: {...}, imageOptimized: "<url>" }
```

Handler: `cloudinary/connection.js:4`. No aparecía en la primera versión del contrato
por una rareza del montaje que conviene que sepas: `index.js:209` monta el **handler
pelado** (`app.use("/api/cloudinary", cloudinaryUploader)`) en vez del router
`routes/cloudinary.js` — ese archivo está **muerto**. Consecuencia: cualquier método y
cualquier subpath bajo `/api/cloudinary` cae en el mismo handler
(`/api/cloudinary`, `/api/cloudinary/upload-image`, `/api/cloudinary/lo-que-sea`).
Ya quedó documentado en `docs/api-payloads.md` como ruta declarada a mano.

Límite de body: 50MB (el base64 cuenta), ver `API_CLIENT_GUIDELINES.md` §3.

### B3 · `returned-items-summary-notification` — no existe con ese nombre

El que existe es `POST /api/nodemailer/returned-items-to-renter-notification`
(`routes/nodeMailer.js:145` → `nodeMailer/notifications.js:677`):

```jsonc
{ "subject":     "...",                         // REQUERIDO
  "staffEmails": ["a@x.com", "b@x.com"],        // REQUERIDO: array no vacío, valida formato
  "supplierInfo": { ... },                      // opcional, alimenta el HTML
  "attachments": [                              // opcional
    { "filename": "reporte.pdf", "content": "<base64>", "type": "application/pdf" }
  ] }
// 202 { ok, notification, recipients, attachmentsCount, jobId }
```

Va por la cola `send-email-multiple-with-attachments` (los adjuntos se suben a S3 y el
worker envía), así que el 202 significa "encolado", no "entregado"; el estado se
consulta con `GET /api/jobs/owned/:jobId` (solo `validateJWT`); `GET /api/jobs/:jobId`
existe pero exige `requireSuperUser`.

**Necesito tu respuesta (§C3):** si el "summary" es otro contenido (un resumen
agregado de los ítems devueltos, no el mail al renter), es un endpoint nuevo. Mandame
qué datos debe listar el resumen y a quién va, y lo agrego reusando la misma cola.

---

## C. Estado de las respuestas (cerrado 2026-08-25)

| # | Respuesta del cliente | Consecuencia |
| --- | --- | --- |
| A1 | Arreglado en el cliente (`/api/stripe/...`) | Cerrado. Recordá que solo el **POST** filtra: el GET devuelve todo |
| A2 | En discusión, sin trabajo en esa rama | Backend no toca nada. Cuando se decida, la tabla de §A2 tiene las 5 rutas reales |
| A3 | Tarea **a agendar**: modificar documentos si el cliente lo requiere | Ver §D1 con el diseño listo para implementar |
| A4 | Tarea **agendada**: eliminar sub-locación de una company específica | Ver §D2 — **ya existe un DELETE, pero sin auth ni scope de company** |
| A5 | Confirmado: los ítems devueltos al vendor/renter **se borran** del inventario | Cerrado, el endpoint de borrado es el correcto. Contrato exacto en §D3 |

---

## D. Detalle de lo que queda por hacer y del contrato confirmado

### D1 · (A3, agendada) `PATCH /api/document/:id` — editar documento

Hoy no existe. Cuando se agende, esto es lo que hace falta definir/implementar:

- Ruta nueva en `routes/document.js` con `canManage` (el mismo middleware que ya usan
  `POST /upload` y `DELETE /:id`).
- **Lista blanca de campos** — necesito que el cliente confirme cuáles: candidatos
  `document_name`, `document_type`, `trigger_action`, `folder_id`, `expiration_date`.
  Sin lista blanca esto se convierte en un update abierto sobre el documento.
- Decidir si editar el archivo en sí (re-subida) queda fuera: lo natural es que el
  PATCH solo toque metadatos y el reemplazo del binario siga siendo
  `POST /api/document/upload` + `DELETE /api/document/:id`.

### D2 · (A4, agendada) borrar sub-locación de una company

Ojo, aquí hay dos cosas distintas y una de ellas ya existe **con un agujero**:

1. **Sub-locación** (tabla `sub_locations`) — **ya existe**:
   `DELETE /api/db_sub_location/sub-locations/:id`
   (`mysql/routes/sub_location.js:30` → `mysql/controllers/sub_location.js:288`).
   Comportamiento actual: 409 si tiene hijos activos, 404 si no existe, 200 si borra.
   **Dos problemas para el caso "de una company específica":**
   - **No tiene ningún middleware de auth** (ni `validateJWT`): hoy es una ruta
     anónima que borra filas.
   - **No valida la company**: el `DELETE` es `WHERE sub_location_id = ?` a secas, así
     que un id de otra company se borra igual. Es exactamente el tipo de ruta que se
     cerró en el hardening de endpoints raw-SQL.
   - Nota de esquema: `create_sub_locations_table.sql` define
     `FOREIGN KEY (parent_id) ... ON DELETE CASCADE`, así que los hijos **inactivos**
     se borran en cascada aunque el handler solo bloquee por hijos activos.

   Trabajo propuesto: agregar `validateJWT` + `checkTokenVersion` +
   `authorizePermission("location"|"inventory", "delete")` y exigir `company_id`
   (body o query) para acotar el `DELETE ... AND company_id = ?`. Es un **cambio de
   contrato** para el cliente (hoy se llama sin token).

2. **Path ordenado de sub-locaciones** (tabla `company_sub_location_paths`, lo que
   creaba `POST /api/db_location/sub-location-path`) — **no existe borrado**. Si el
   flujo del cliente necesita quitar un path, esto sí es ruta nueva:
   `DELETE /api/db_location/sub-location-path/:path_id` validando `company_id`.

Decime si la tarea agendada cubre **las dos** o solo la primera.

### D3 · (A5, confirmado) borrar el ítem devuelto al vendor/renter

Confirmado el criterio: si el ítem vuelve al vendor/renter, deja de estar en el
registro de la company y **se borra**. Entonces el endpoint es el correcto; lo único
que hay que corregir en `ReturningLeasedEquipModal.jsx:113` es mandar el body (y
preferir la ruta explícita sobre `/:id`):

```jsonc
// 1 ítem — POST /api/db_item/delete-item        (mysql/routes/item.js:104)
{ "item_id": 200580, "company_id": 2 }
// 201 { ok: true, item_deleted: { affectedRows: 1, ... } }

// N ítems — POST /api/db_item/delete-bulk-items (mysql/routes/item.js:107)
{ "item_ids": [200580, 200581], "company_id": 2 }
// 200 { ok: true, result: { ... }, skipped_count?: n }
```

Ambas exigen `x-token` + `checkTokenVersion` + `authorizePermission("inventory","delete")`.

Cuatro cosas a tener en cuenta en ese flujo:

1. **Usá el bulk si el modal devuelve varios ítems**: una llamada en vez de N. Pasa por
   el **Go worker** (`runGoWorker("delete-bulk-items")`), así que si el worker está
   caído responde 500 aunque la BD esté bien; el single (`/delete-item`) va directo a
   MySQL.
2. **Roles con scope** (location/category-scoped): los ítems fuera de su scope se
   **omiten en silencio** y vienen contados en `skipped_count`. Mostralo como
   "X de Y borrados" o el usuario creerá que borró todo.
3. **`:id` se ignora** en `POST /api/db_item/:id`: si igual dejan esa ruta, el id real
   es el del body.
4. **Cerrá el lease ANTES de borrar el ítem.** El borrado es un `DELETE FROM item_inv`
   pelado (tanto en Node como en `go-worker/controllers.go:1164`): no limpia nada más.
   Las tablas que referencian al ítem (`lease_info`/`lease_customer_info` por
   `device_id`, `item_inv_assigned_event`, `event_item_shipping`, y las multas de
   `member_fees`) **quedan apuntando a un ítem inexistente** salvo que la BD tenga FKs
   con `ON DELETE CASCADE` — en el repo no hay ninguna FK declarada hacia `item_inv`,
   así que asumí que no cascadea hasta que se verifique en prod. Orden recomendado:
   `POST /api/db_lease/delete-lease-info` (o `delete-consumer-lease-info`) y luego el
   borrado del ítem.

---

## Apéndice — correcciones al generador del contrato

Al verificar estos hallazgos aparecieron cinco defectos en
`scripts/extract-api-payloads.js`, ya corregidos y con los artefactos regenerados:

1. **Falsos positivos `id` / `payload`** en los endpoints de email: venían de
   `buildSuccessBody: (job) => ({ ...job.payload })`, que no describe el request.
2. **Builders currificados** (`createBuildX()` que devuelve `async (body) => ...`) no se
   recorrían: faltaban campos como `supplierInfo`.
3. **`/api/cloudinary/upload-image`** no figuraba (montaje sin router, ver §B2).
4. **Requeridos de los controladores encolados**: los validadores devuelven
   `{ status: 400, body }` en vez de llamar `response.status(400)`; no se detectaban.
   Igual `if (!Array.isArray(x) || x.length === 0)`, y ahora un campo con guarda
   `x !== undefined` no se marca requerido.
5. **Campos duplicados** (`company_id` y `company_id?` en la misma interfaz).

Regenerar siempre con `node scripts/extract-api-payloads.js` después de tocar rutas.
