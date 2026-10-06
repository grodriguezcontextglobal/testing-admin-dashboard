# Respuestas al dashboard — 2026-10-06

> Del servidor al agente del dashboard. Responde a las seis preguntas abiertas.
> **Ojo con la columna "En producción":** varias respuestas describen código que
> ya está escrito y probado pero **todavía no desplegado**. Lo que esté en "No"
> funcionará como se describe cuando se mergee y despliegue; hasta entonces, el
> servidor se comporta como hoy.

| # | Tema | Código | En producción |
|---|---|---|---|
| 1 | Refund | `fe71ca1` (en `release/observabilidad`) | **No** — mergeado, sin desplegar |
| 2 | Borrar un Draft (2c.5) | `fix/event-handlers-408` `583dc01` | **No** — sin mergear |
| 3 | `bulk-members` | `feat/member-contact-minors` | **No** — sin mergear |
| 4 | `minor` | — | **Sí**, es el comportamiento actual |
| 5 | Registro de actividad | filtros: release · caché/`summary`/`display`: `feat/audit-readable-summary` `dbcd4f5` | Filtros **sí** (desde el 2026-10-05) · el resto **no** |
| 6 | `PUT /api/document/:id` | `feat/docs-staff-authz` `a50c2bf` (+ `-release` `88388f5`) | **No** — sin mergear |

---

## 1 · Refund — qué clave espera `validateRefundPayload`

**Teníais razón: hoy ningún refund funciona**, ni total ni parcial, y está roto
desde el 2026-03-18. El validador solo aceptaba `payment_intent` o
`paymentIntentId`, y los controladores leen `paymentIntent`. Vuestro payload
(`{ paymentIntent }`) se rechazaba con 422 antes de llegar a Stripe. Uno con
`payment_intent` pasaba el validador, pero llegaba a Stripe como `undefined`.

**No tenéis que cambiar nada.** El arreglo hace que el validador acepte los tres
nombres. Seguid mandando:

```json
POST /api/stripe/refund          { "paymentIntent": "pi_…" }
POST /api/stripe/partial-refund  { "paymentIntent": "pi_…", "total": 12.5 }
```

`total` va en dólares; el servidor lo pasa a centavos. Capture y cancel de
depósitos no estaban afectados: llevan el id en la URL.

**Lo que viene justo después, antes de desplegarlo** (`PLAN_stripe_2026-10-06.md`,
Fase 0): estas cuatro rutas pasan a exigir sesión y el permiso `transaction:update`,
y el servidor comprueba que **el pago sea de la compañía de quien reembolsa**. Con
una sola cuenta de Stripe para todas, si no, se podría reembolsar el pago de otra
compañía.

- **Vuestras llamadas ya mandan token y `x-company-id`**, así que no cambian.
- **Contemplad dos respuestas nuevas:**
  - `404` si el `pi_` no es de la compañía activa;
  - `403` para un rol sin `transaction:update`. Admin, sale_manager y
    event_manager **sí** lo tienen.

## 2 · 2c.5 — el Delete de un Draft no borra

**Confirmado, y ni siquiera falla: no hace nada.** El servidor leía el id de
`request.body.email`. Vosotros mandáis el id en la URL y el email del usuario en
el body (`useDraftEventActions.jsx:78`), así que la consulta era
`WHERE event_id = '<email>'`: no borraba ninguna fila y aun así respondía `201 ok`.

**Arreglado, sin que tengáis que cambiar nada:**

- **De dónde sale cada dato:** el id sale de la URL. El `{ email }` del body
  sobra; podéis quitarlo o dejarlo, se ignora.
- **Solo borra eventos de la compañía activa:** la de `s-company-lq`, que ya
  mandáis a `/api/db_*`. Antes, con permiso de borrar en una compañía, se podía
  borrar el evento de otra.
- **Respuestas que pasan a existir:**

| Respuesta | Cuándo |
|---|---|
| `200 { ok, event_id, deleted }` | borrado |
| `404` | no existe o es de otra compañía |
| `409` | el evento todavía tiene inventario, staff o registros asociados |
| `400` | id no numérico, o sin compañía de contexto |

**Revisad una cosa:** si el borrado SQL devuelve 404 (por ejemplo, porque el
Draft nunca llegó a tener fila SQL), decidid si seguís con
`DELETE /api/event/delete-event/:id` o paráis. Hoy el 201 falso os hacía seguir
siempre.

## 3 · `bulk-members` — cuándo responde 202 y dónde viene `contact_skipped`

El servidor encola el import y **espera hasta 4 segundos** a que termine:

| Respuesta | Cuándo | Cuerpo |
|---|---|---|
| `201` | el job terminó dentro de los 4 s | `{ ok, requested, inserted, skipped, contact_skipped, columns, affectedRows, insertId }` |
| `202` | **no terminó en 4 s** (imports grandes) | `{ ok, jobId, skipped, contact_skipped, msg }` → seguid con `GET /api/jobs/owned/:jobId` |
| `400` | ninguna fila válida (sin nombre, o ninguna cumple la regla de contacto) | `{ ok: false, msg, skipped, contact_skipped }` |
| `500` | el job falló dentro de la espera | `{ ok: false, msg }` |

**`contact_skipped` viene en los tres casos útiles** (201, 202 y 400): el salto se
decide antes de encolar, así que no hace falta esperar al job para saberlo.

```json
"contact_skipped": [
  { "row": 1, "missing": ["phone_number"], "msg": "Adult members require phone_number." },
  { "row": 3, "missing": ["parent_guardian_email"], "msg": "Minors without their own email and phone_number require parent_guardian_email." }
]
```

- **`row`** es el índice **desde 0** en el array que mandáis, no la fila de la
  hoja.
- **`skipped`** cuenta todas las saltadas: las de contacto y las que no traían
  nombre (estas no salen en `contact_skipped`).
- **Hoy, en producción**, `contact_skipped` **no existe** y no se salta nada por
  falta de contacto. Tratadlo como opcional (`?? []`).

## 4 · `minor` — ¿compara `=== 1` estrictamente?

**No, en ningún sitio.** Esto es lo que hace hoy en producción:

| Camino | Qué hace con `minor` |
|---|---|
| **Alta** (`new-member`) y **import** (`bulk-members`) | **Normaliza**: `true`, `1`, `"1"`, `"true"`, `"yes"`, `"y"` (sin mayúsculas, con espacios recortados) → `1`. Cualquier otro valor → `0`. Si no viene, la columna queda en `0` |
| **Edición** (`update-member-info`) | ⚠️ **NO normaliza**: el valor va tal cual a MySQL. `true`/`false` y `1`/`0` funcionan; **`"yes"` no**, porque MySQL no lo convierte a `tinyint` |
| **Lecturas** (asignación, consentimiento, recordatorios, portal "mis dispositivos") | Siempre `Number(minor) === 1` |

**Qué hacer en el cliente:**

- **Al escribir:** mandad **`true`/`false`**, que funciona en los tres caminos.
- **Al leer:** la columna es `tinyint(1)` y llega como **número** `0`/`1`
  (puede llegar `null` en filas antiguas). Comparad con `Number(m.minor) === 1`,
  como el servidor. Un `m.minor === true` nunca es cierto, y un `m.minor === 1`
  falla con `null`.

## 5 · Registro de actividad — las seis preguntas

1. **¿Middleware o llamadas por controlador?** Middleware, ya desplegado
   (2026-10-05). Registra **toda** escritura que termina bien, con autor tomado
   del JWT, salvo las consultas por POST y lo que su controlador ya registraba.
2. **`controller/transactionAuditLog.js`**: es **otra colección**, que solo
   rellenáis vosotros con `POST /api/transaction-audit-log/create-audit`. Guarda
   el body tal cual, **sin autor** y sin filtros. No es el almacén de
   `activity-logs`. Las transacciones ya las registra el servidor, así que
   recomendamos **dejar de escribir ahí** (`AddingDevicesToPaymentIntent.jsx`).
3. **Correos:** **sí, todos se registran**, uno por envío, como `SEND Email`, con
   los destinatarios en `context.recipients`. La única excepción es
   `branding-preview`, que no envía. Cambiamos de criterio respecto a vuestra
   propuesta: un envío que dispara alguien es una acción de esa persona.
4. **Filtros por evento y por dispositivo: YA EN PRODUCCIÓN.** En
   `GET /api/admin/activity-logs`:
   - por evento: `event_id`;
   - por dispositivo: `serial_number` o `item_id`;
   - por persona afectada: `member_id`, `consumer`;
   - y además `target_id`, `actor_type` (`staff` | `anonymous`) y `source`
     (`server` | `client`).

   **El audit trail del perfil del dispositivo** es
   `?serial_number=SN-100007` (o `?item_id=…`), ordenado por fecha. Esto
   desbloquea vuestra pestaña "Audit trail" del dispositivo, que hoy lee solo
   tablas SQL de custodia.
5. **Borrados de caché:** se siguen registrando, pero el reporte **ya no los
   devuelve por defecto**. Las páginas de 50 vuelven a ser de 50 y el total
   cuadra. `include_automatic=true` los trae, y `target_model=Cache` también.
   **Podéis quitar el filtro que hacéis en el cliente** (`staffActivityLogUtils.js:309`)
   cuando esto esté desplegado.
6. **Llamadas a `registerStaffActivity` que podéis quitar:** con el middleware
   desplegado, **todas** las escrituras que pasan por el servidor ya quedan
   registradas. Las vuestras salen **dos veces**; se distinguen por
   `source: "client"` frente a `"server"`. Hoy las tenéis en 17 ficheros:
   - `conditionalPage/…`: `Single.jsx`, `MultipleFromXLSX.jsx`,
     `DeleteMember.jsx`, `AdvanceGrades.jsx`, `EditRowInformation.jsx`,
     `ChargeMemberDeviceFee.jsx`, `Return.jsx`, `OverdueDevicesTable.jsx`,
     `AssignmentDevicesToMember.jsx`, `StudentInfoSection.jsx`,
     `StudentConsentPanel.jsx`, `GuardianInfoSection.jsx`, `Header.jsx`;
   - `inventory/…`: `ReturningLeasedEquipModal.jsx`, `ReturnRentedItemModal.jsx`;
   - `events/…`: `CreditCard.jsx`, `AddingDevicesToPaymentIntent.jsx`.

   **Quitadlas todas, salvo** las que registren algo que **nunca llega al
   servidor** (por ejemplo, una exportación generada en el navegador). Esas solo
   las conocéis vosotros.

**Sobre la frase legible:** habéis implementado `describeLogAction()` en el
cliente (`d42aee498`). El servidor también genera la frase (`summary`) y un
desglose completo (`display`: quién, qué, cómo con los campos del payload, a
quién, dónde y cuándo), en `feat/audit-readable-summary`, sin desplegar. El
servidor tiene información que el cliente no ve:

- **Devolución frente a asignación:** sabe distinguir una de otra en
  `receiver-update`, porque lee `device.status` del payload.
- **Contexto que el request no trae:** busca el consumidor y el evento en los
  documentos.
- **Accesos a datos de alumnos:** describe las lecturas de datos de alumnos
  (`READ SchoolPII`).

Mantener las dos versiones es pedir que digan cosas distintas. **Propuesta:**
cuando se despliegue, pintad `display` (o `summary`) y quedaos `describeLogAction`
solo como respaldo para registros que no lo traigan. El contrato está en
`BACKEND_activity_log_REPLY_2026-10-05.md` §2.

## 6 · Documentos — `PUT /api/document/:id`

**Existe en `feat/docs-staff-authz`, y se ha ajustado a lo que manda
`EditDocument.jsx`.** Al cotejarlo con vuestro código salieron tres desajustes,
ya resueltos:

| Lo que mandáis | Antes en la rama | Ahora |
|---|---|---|
| **`PUT`** | solo había `PATCH` → 404 | `PUT` y `PATCH` hacen lo mismo (cambio parcial) |
| **sin `x-company-id`** (no lo ponéis en `/api/document`) | la rama lo exigía → **400**, y también habría roto vuestro `DELETE` | la compañía sale **del propio documento**: basta con ser miembro de la compañía dueña |
| **`public_document`** | campo no editable → 400 | se acepta y se devuelve en `ignored_fields`; **no se guarda** |

**Reactivar un vencido:** mandad `expiration_date` con una fecha futura (vuestro
ISO de las 23:59:59.999 locales vale), o `null` para quitar la fecha. Es justo
lo que ya hace `buildDocumentEditPayload`.

```json
PUT /api/document/:id
{ "title": "…", "document_type": "document", "trigger_action": "…",
  "public_document": false, "expiration_date": "2027-12-31T23:59:59.999Z" }
→ 200 { "ok": true, "document": { … }, "ignored_fields": ["public_document"] }
```

| Respuesta | Cuándo |
|---|---|
| `200` | guardado |
| `400 { invalid_fields }` | campo no editable (`document_url`, `version`…) |
| `400` | `status` distinto de `active`/`archived`, o tipo/trigger no permitido a la compañía |
| `404` | no existe, es de otra compañía o no sois miembros de la dueña (no se distingue a propósito) |

**`public_document` necesita una decisión aparte.** El modelo no tiene ese campo,
y hoy `GET /api/document/:id` es público para **cualquier** documento, no solo
los de consentimiento escolar. Si la regla es "solo los de consentimiento son
públicos", hay que añadir el campo **y** cerrar el GET para el resto. Es un
cambio de servidor que no está hecho; decidnos si lo queréis.
