# Registrar cada respuesta del tutor a una invitación de evento

> Del dashboard al servidor, **2026-10-08**.
> Sigue a la reunión del 29-09 (`FRONTEND_meeting_2026-09-29.md`, ítem 17) y
> a vuestras respuestas sobre el registro de actividad
> (`BACKEND_answers_to_dashboard_2026-10-06.md` §5).

---

## 1. Qué se pide

Fredrik, 29-09 `48:52`, sobre la invitación que confirma la asistencia de un
estudiante a un evento:

> *"you need to log everything, like when the parent clicked and all that kind
> of stuff… So that audit trail is available for that."*

El staff manda la invitación desde Members → "Register to event". El tutor (o
el propio miembro, si es adulto) abre el enlace y confirma en
`/attendance-confirmation`, una página **pública, sin sesión**.

## 2. Qué cubre ya vuestro middleware, y qué no

| Paso | ¿Queda registrado hoy? |
|---|---|
| El staff manda la invitación | **Sí.** `SEND Email` sobre `customize-message-notification`, con autor |
| El tutor confirma (`/auth/user-query` → `POST /auth/new` + `POST /db_consumer/new_consumer`, o `PATCH /auth/:id`) | **A medias.** Las escrituras salen como `actor_type: anonymous`, pero nada dice **quién** respondió: el body lleva el email del alumno, no el del tutor |
| El tutor **abre** el enlace | **No.** No escribe nada |
| El tutor pulsa y **ya estaba confirmado** | **No.** No escribe nada |
| El tutor pulsa y **falla** | **No.** La escritura no termina bien |

## 3. Lo que pedimos: una ruta pública para la respuesta

```
POST /api/school/event-invitations/response      (sin x-token)
```

Body, tal cual lo manda ya el dashboard (commit de hoy):

```json
{
  "company_id": "6a7d…",              // Mongo id de la compañía, del enlace
  "event_id": "6a80…",
  "event_name": "Science Fair",
  "member_id": "42",                   // null en enlaces enviados antes de hoy
  "member_email": "timmy@school.org",
  "responder_email": "mum@x.com",      // el tutor si es menor; el miembro si es adulto
  "responder_role": "guardian",        // "guardian" | "member"
  "response": "confirmed",             // "opened" | "confirmed" | "already_confirmed" | "failed"
  "reason": "Email already in use.",   // solo con "failed"
  "client_time": "2026-10-08T14:00:00.000Z"  // informativo; la hora buena es la vuestra
}
```

Respuesta esperada: `201 { "ok": true }`. Cualquier otra cosa el cliente la
ignora: **nunca** bloquea la confirmación. Hasta que exista, la ruta da 404 y
no pasa nada.

### Que escriba en el almacén de `activity-logs`

Para que salga en Profile → Staff activity sin cambios en la lectura:

| Campo | Valor |
|---|---|
| `action` | `CREATE` |
| `target_model` | `EventInvitation` |
| `actor_type` | `anonymous` |
| `timestamp` | **la hora del servidor** al recibirla |
| `ip_address`, `device_info` | los de la petición, como en el resto |
| `details.route` | `POST /api/school/event-invitations/response` |
| `details.request` | el body de arriba |
| filtros | `event_id` y `member_id` rellenos, para que `?member_id=42` dé el historial del alumno |

El dashboard ya pinta estas filas (`staffActivityLogUtils.js`): "Parent /
guardian · mum@x.com — Confirmed their child's attendance · Science Fair".

### Validaciones que pedimos

- `company_id`, `event_id`, `member_email`, `responder_role` y `response`
  obligatorios; `response` en la lista cerrada → si no, 400.
- Que el evento exista y sea de esa compañía → si no, 404 y **no se escribe**.
- **Rate limit** por IP, como el resto de rutas públicas: es una escritura sin
  autenticación.
- No devolver nada del alumno en la respuesta.

## 4. Ojo, seguridad: el enlace no va firmado

Hoy el enlace lleva los datos en claro (`memberEmail`, `eventId`,
`companyId`…), construidos en el navegador del staff. Cualquiera que conozca
el formato puede fabricar uno y "confirmar" a otra persona, y también
fabricar respuestas en esta ruta. Es el mismo riesgo que ya tiene la
confirmación, no uno nuevo, pero un registro de auditoría con valor legal
(FERPA/COPPA) debería apoyarse en algo que no se pueda inventar.

**Propuesta para una segunda fase:** que el servidor emita el enlace con un
token firmado (igual que el código del consentimiento escolar), y que tanto
la confirmación como esta ruta lo exijan. Si os encaja, lo hacemos juntos;
el cliente solo tendría que pasar el token que reciba.
