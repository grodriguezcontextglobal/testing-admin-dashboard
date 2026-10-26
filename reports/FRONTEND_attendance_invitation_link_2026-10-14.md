# Dashboard: invitaciones a evento con enlace firmado (2026-10-14)

Para el agente del dashboard. Es la Fase 4.3 de
`PLAN_rutas_sin_autenticacion_2026-10-14.md` en el backend, y la "Fase 2"
(enlace firmado) que proponía `FRONTEND_event_invitation_responses_2026-10-08.md`.
También deja hecha la ruta de respuestas que pedía ese documento.

## Por qué

Hoy el enlace de `/attendance-confirmation` lo arma el navegador
(`eventRegistrationUtils.buildConfirmationLink`) con todos los datos en claro, y
la página confirma con cuatro rutas genéricas de consumidor. Cualquiera puede
fabricar un enlace y apuntar a quien quiera a un evento, o escribir respuestas
falsas.

Ahora el servidor arma el enlace: saca miembro, tutor y evento de la BD, firma
un token (**5 días, un solo uso**) y manda el correo. La confirmación la hace el
servidor con lo que dice el token.

## Rutas nuevas

### 1. Enviar — `POST /api/school/event-invitations/send` (con sesión)

Sustituye, en `RegisterMembersToEvent.jsx § handleSend`, al bucle de
`buildConfirmationLink` + `buildAttendanceEmail` + `/nodemailer/customize-message-notification`.

```js
await devitrakApi.post("/school/event-invitations/send", {
  company_id: <id SQL de la compañía, el mismo que mandan a /db_member>,
  event_id: selectedEvent.id,          // id de Mongo
  member_ids: selectedRows.map((m) => m.member_id),
});
```

- Permiso: `member:create` (lo tiene quien hoy puede añadir miembros). No exige compañía Education.
- Hasta 500 miembros por llamada.
- **No se manda** ni email, ni nombre, ni si es menor: lo saca el servidor de `members_info`. Al menor le llega a `parent_guardian_email`; si no tiene, sale como fallo en esa fila.
- Respuesta:
  ```json
  { "ok": true, "sent": 2, "failed": 1,
    "results": [ { "member_id": "10", "ok": true },
                 { "member_id": "12", "ok": false, "error": "Missing guardian email for this minor member." } ] }
  ```
  `results` sustituye a la lista de fallos que hoy arma `Promise.allSettled`.
- `404 Event not found` si el evento no es de una compañía a la que pertenece quien envía.

El enlace del correo lleva los mismos parámetros que hoy (para que la página
muestre lo mismo) **más `token`**.

### 2. Confirmar — `POST /api/school/event-invitations/confirm` (sin sesión)

Sustituye, en `AttendanceConfirmationLanding.jsx § handleConfirm`, a
`registerConsumerToEvent` (las cuatro llamadas genéricas).

```js
const token = new URLSearchParams(window.location.search).get("token");
const { data } = await devitrakApi.post(
  "/school/event-invitations/confirm",
  {},
  { headers: { "x-link-token": token } }
);
// data.outcome: "confirmed" | "already"
```

| Respuesta | Qué pasó | Qué mostrar |
|---|---|---|
| `200 { outcome: "confirmed" }` | Consumidor creado o actualizado, evento añadido | Estado `confirmed` |
| `200 { outcome: "already" }` | Ya estaba en el evento; no se escribió nada | Estado `already-confirmed` |
| `401` | Sin token, inválido o caducado | "Este enlace no es válido o caducó. Pide que te lo reenvíen." |
| `410` | El token ya se usó y la persona ya no está en el evento | "Este enlace ya se usó." |
| `500` | Falló la escritura; **el token sigue valiendo** | Botón "Try again" (como hoy) |

**El servidor registra él mismo** `confirmed`, `already_confirmed` y `failed`
(del lado del servidor) en el log de actividad, `verified: true`. La página **ya
no tiene que mandarlos**.

### 3. Respuestas — `POST /api/school/event-invitations/response` (sin sesión)

Es la ruta que ya llama `recordInvitationResponse` (`INVITATION_RESPONSE_PATH`);
**hasta hoy no existía en el servidor** (respondía 404 y la página lo ignoraba).

- **Con token** (`x-link-token`): solo `response: "opened"` o `"failed"` (+ `reason`
  opcional, para fallos del lado del navegador). Los demás datos salen del token;
  el body puede quedarse como está, se ignora. Fila `verified: true`.
- **Sin token** (enlaces enviados antes del cambio): se acepta con el body actual
  de `buildInvitationResponse`, comprobando que el evento es de esa compañía.
  Fila `verified: false`. Deja de aceptarse cuando el backend pase a `enforce`.
- `confirmed` / `already_confirmed` con token → 400: los registra `/confirm`.

## Cambios en el dashboard, resumido

1. `RegisterMembersToEvent.jsx`: `handleSend` llama a `/school/event-invitations/send`. `buildConfirmationLink` y `buildAttendanceEmail` dejan de usarse para este flujo.
2. `AttendanceConfirmationLanding.jsx`:
   - leer `token` de la URL;
   - `handleConfirm` llama a `/school/event-invitations/confirm` con `x-link-token`;
   - `record(...)` manda `x-link-token` y solo `opened` / `failed`.
3. **Transición:** si la URL **no** trae `token` (correo viejo), la página puede seguir usando `registerConsumerToEvent` como hoy hasta que el backend pase a `enforce`. Después, mostrar "Este enlace caducó; pide que te lo reenvíen".
4. "Add directly" (sin invitación, con sesión de staff) **no cambia**: sigue usando `registerConsumerToEvent` con sesión.

La cabecera `x-link-token` ya está permitida en CORS.

## Calendario

- **Despliegue del backend:** `ATTENDANCE_LINK_MODE=warn`. Nada se rechaza. El
  servidor registra cada llamada del dashboard **sin sesión** a las cuatro
  rutas genéricas (`POST /auth/user-query`, `POST /auth/new`, `PATCH /auth/:id`,
  `POST /db_consumer/new_consumer`).
- **Dashboard con los cambios de arriba.**
- **5 días después** (ya no queda vivo ningún enlace viejo): `enforce`. Desde
  entonces, esas cuatro rutas responden 401 al dashboard sin sesión, y
  `/response` exige token. **La app del consumidor (app.devitrak.net) no se ve
  afectada**: sigue llamándolas sin token.

Si en los logs de `warn` aparece otra página pública del dashboard usando esas
cuatro rutas, avisad antes de `enforce`.
