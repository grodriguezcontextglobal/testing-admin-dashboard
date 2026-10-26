# Dashboard: enviar las invitaciones a evento desde el servidor (2026-10-15)

> **Para:** el agente del dashboard (`testing-admin-dashboard`).
> **De:** backend · **Fecha:** 2026-10-15
> **Tarea del cliente:** *"Si se pide consentimiento, registrar cada respuesta del tutor."*
> **Verificado contra:** servidor `release/observabilidad` (commit `23c0aa0`) y
> dashboard `origin/main` (`87cfa27a0`).

---

## 1. Dónde está la tarea

| Parte | Estado | Dónde |
|---|---|---|
| Página que recibe el enlace (`/attendance-confirmation`) | ✅ **Hecha** | `src/pages/authentication/utils/attendanceConfirmation.js:110-194`: lee `?token=`, lo manda en `x-link-token`, confirma con `/school/event-invitations/confirm` y registra con `/school/event-invitations/response` |
| Rutas del servidor que guardan las respuestas | ✅ **Hechas, sin desplegar** | `POST /api/school/event-invitations/confirm` y `/response` (`controller/eventInvitation.js`). En prod dan 404 hasta el próximo despliegue |
| **Envío de la invitación con enlace firmado** | ❌ **Falta (dashboard)** | `src/pages/conditionalPage/components/modals/RegisterMembersToEvent.jsx` § `handleSend` |

**El problema:** `handleSend` sigue armando el enlace y el correo en el navegador
(`buildConfirmationLink` + `buildAttendanceEmail`) y lo manda por
`/nodemailer/customize-message-notification`. Ese enlace **no lleva `token`**. Así
que todas las invitaciones de hoy llegan sin token, la página cae al flujo antiguo,
y las respuestas se guardan con `verified: false`. Eso no prueba quién respondió:
cualquiera podría escribirlas sin tener el enlace.

**Lo que hay que hacer:** que `handleSend` llame a
`POST /api/school/event-invitations/send`. El servidor saca miembro, tutor y evento
de la BD, firma el enlace (5 días, un solo uso) y envía el correo con la marca de
la compañía.

## 2. Contrato de `POST /api/school/event-invitations/send`

- **Con sesión** (`x-token`, como cualquier llamada del dashboard).
- **Permiso:** `member:create` en la compañía del `company_id` (el mismo que hoy
  permite añadir miembros). No exige compañía de tipo Education.

**Body:**

```json
{
  "company_id": 147,
  "event_id": "6ad10b36d28040ba6cc0528d",
  "member_ids": [10, 12, 15]
}
```

| Campo | Qué es | De dónde sale en el modal |
|---|---|---|
| `company_id` | **Id SQL** de la compañía. Va **en el body**: `/api/school/*` no recibe la cabecera `s-company-lq` | `user?.sqlInfo?.company_id`: el mismo que ya usa la consulta de miembros del modal (`RegisterMembersToEvent.jsx:101`) |
| `event_id` | Id de Mongo del evento | `selectedEvent.id ?? selectedEvent._id` |
| `member_ids` | De 1 a 500 ids de `members_info` | `selectedRows.map((m) => m.member_id)` |

**No se manda** email, nombre, si es menor, enlace ni texto del correo. El servidor
los saca de `members_info`: al miembro adulto le escribe a su `email`, y al menor, a
`parent_guardian_email`.

**Respuestas:**

| Código | Cuerpo | Qué significa |
|---|---|---|
| `200` | `{ ok: true, sent, failed, results: [{ member_id, ok, error? }] }` | Resultado **por miembro**. `ok: true` = el correo quedó en cola |
| `400` | `{ ok: false, msg }` | Falta `event_id` o `member_ids` está vacío o pasa de 500 |
| `401` | | Sin sesión o sesión caducada. **También si falta `company_id` en el body**: el control de permisos no sabe contra qué compañía comprobar |
| `403` | | Sin permiso `member:create` en esa compañía |
| `404` | `{ ok: false, msg: "Event not found" }` | El evento no existe o no es de una compañía de quien envía. **También es lo que responde prod mientras el servidor no esté desplegado** (ver §4) |
| `500` | `{ ok: false, msg: "Could not send the invitations." }` | Error general; no se envió nada |

Errores posibles en `results[].error`:
- `"Member not found in this company."`: el `member_id` no es de ese `company_id`.
  Si sale para **todos**, casi seguro se mandó un `company_id` equivocado (el de
  Mongo en vez del SQL, o `undefined`).
- `"Missing guardian email for this minor member."`
- `"Member has no email address."`
- `"The email could not be queued."`

## 3. Cambios en el dashboard

### 3.1 `RegisterMembersToEvent.jsx` § `handleSend`

Sustituir el bucle de `Promise.allSettled` por **una sola** llamada:

```js
const handleSend = async () => {
  if (!selectedEvent || selectedRows.length === 0) return;
  setSending(true);

  // Las filas sin destinatario no se mandan (el servidor también las rechazaría).
  const sendable = selectedRows.filter((m) => !m._recipient.error);
  const skipped = selectedRows.filter((m) => m._recipient.error);

  let results = [];
  try {
    const { data } = await devitrakApi.post("/school/event-invitations/send", {
      company_id: user?.sqlInfo?.company_id,
      event_id: selectedEvent.id ?? selectedEvent._id,
      member_ids: sendable.map((m) => m.member_id),
    });
    results = data.results ?? [];
  } catch (error) {
    setSending(false);
    notify("error", "Invitations not sent", error?.response?.data?.msg ?? "Send failed.");
    return; // nada cambió: dejar la selección como estaba
  }

  const byId = new Map(sendable.map((m) => [String(m.member_id), m]));
  const failures = [
    ...results.filter((r) => !r.ok).map((r) => ({ member: byId.get(String(r.member_id)), error: r.error })),
    ...skipped.map((m) => ({ member: m, error: m._recipient.error })),
  ].filter(({ member }) => member);
  const sent = results.filter((r) => r.ok).length;

  setSending(false);
  // …misma notificación de hoy, con `sent` y `failures` (error → mensaje por fila)…
  // …y el mismo comportamiento: si hay fallos, dejar seleccionados solo esos.
};
```

Qué se mantiene igual:
- La notificación, el texto `"N invitations sent"` / `"X of N invitations sent"` y
  dejar seleccionadas solo las filas que fallaron (para que reintentar no le escriba
  dos veces a nadie).
- La columna "Invitation goes to" y el chip "Minor — guardian", calculados con
  `getConfirmationRecipient`. Siguen sirviendo para que el staff vea a quién le va a
  llegar. El destinatario real lo decide el servidor con la misma regla.

Qué se deja de usar **en este flujo**: `buildConfirmationLink`, `buildAttendanceEmail`
y la llamada a `/nodemailer/customize-message-notification`. No borrar las
funciones de `eventRegistrationUtils.js` si algo más las importa; solo dejar de
llamarlas aquí.

### 3.2 "Add directly" **no cambia**

El modo `direct` (`handleAddDirectly`, que llama a `registerConsumerToEvent` con la
sesión del staff) se queda como está: no envía correo ni necesita enlace.

### 3.3 La página `/attendance-confirmation` **no cambia**

Ya está terminada. Solo comprobar que, con un enlace de `/send`:
- se ve el nombre del miembro y del evento (el servidor manda los mismos parámetros
  que antes, más `token`);
- "Confirm" llama a `/school/event-invitations/confirm` con `x-link-token`;
- **no** se manda `confirmed` ni `already_confirmed` a `/response` (si llevan token,
  el servidor responde 400; esos los registra `/confirm` él solo).

## 4. Orden de despliegue

`/send` **no existe en prod** hasta que se despliegue el backend
(`release/observabilidad`). Si el dashboard sale antes, cada envío daría 404.

Hay dos opciones:
- **A (recomendada):** esperar a que el backend confirme el despliegue y publicar
  después.
- **B:** publicar ya con un fallback: si `/send` responde **404 con
  `msg: "Event not found"` para un evento que el staff acaba de elegir de su propia
  lista**, volver al flujo actual (`buildConfirmationLink` + `customize-message-notification`).
  Quitar el fallback cuando el backend esté desplegado. Es más código y más ambiguo
  (un 404 legítimo también cae al fallback), por eso no es la recomendada.

Después de publicar: el backend pasa `ATTENDANCE_LINK_MODE` a `enforce` **5 días
después** (la vida máxima de un enlace). Desde entonces, `/response` sin token y las
cuatro rutas genéricas llamadas desde el dashboard sin sesión responden 401. Los
correos viejos sin token dejan de funcionar; la página debe mostrar *"Este enlace
caducó; pide que te lo reenvíen"*, que ya es su estado de error.

## 5. Tests a añadir o ajustar

- `handleSend` llama **una vez** a `/school/event-invitations/send` con
  `{ company_id: <sqlInfo.company_id>, event_id, member_ids }`, y **nunca** a
  `/nodemailer/customize-message-notification`.
- Las filas con `_recipient.error` no van en `member_ids` y salen como fallo en la
  notificación.
- Con `results` mixtos (`ok: true` y `ok: false`): la notificación dice
  `"X of N invitations sent"`, lista los errores por nombre y deja seleccionadas
  solo las filas fallidas.
- Con error de la petición (401, 403, 404, 500): no cierra el modal, no cambia la
  selección y muestra `msg`.
- El modo `direct` sigue llamando a `registerConsumerToEvent` y no a `/send`.

## 6. Cómo comprobarlo de punta a punta (con el backend desplegado o en local)

1. En Members → "Register to event", modo **"Ask for guardian consent"**, elegir un
   evento y un menor con `parent_guardian_email`.
2. Enviar: la respuesta es `200` con `results[0].ok: true`.
3. El correo llega al tutor con el botón "Confirm attendance", y el enlace incluye
   `&token=`.
4. Abrir el enlace: en el log de actividad aparece **`OPEN`** con
   `details.verified: true`.
5. Confirmar: aparece **`RESPOND`** con `details.response: "confirmed"`,
   `details.verified: true` y `details.responder_role: "guardian"`, y el email del
   tutor en `actor.email` (`target_model: "EventInvitation"`).
6. Abrir el mismo enlace otra vez y confirmar: `outcome: "already"` (sin escribir
   nada) o `410` si la persona ya no está en el evento.

Con esto la tarea del cliente queda cerrada: cada respuesta del tutor (abrir,
confirmar, ya confirmado, fallo) queda registrada en el servidor, atada a un enlace
que solo pudo recibir ese tutor.
