# Instrucciones para el agente del frontend: cambios de contrato del 2026-10-01

> Destinatario: el agente que trabaja en el repo del dashboard.
> Origen: dos ramas del servidor (`server-testing`), **todavía sin desplegar**.
> Lo que sigue es el contrato que el servidor tendrá cuando se desplieguen. Cada
> cambio dice qué rama lo trae, para que puedas saber si ya está vivo.

---

## 0 · Reglas de trabajo

1. **No supongas que el cambio ya está en producción.** Antes de quitar código
   viejo, confírmalo con el equipo de backend. Mientras tanto, el frontend tiene
   que funcionar **con los dos contratos**, el viejo y el nuevo. Para cada cambio
   se indica cómo conseguirlo.
2. **No inventes campos.** Si una respuesta no trae lo que aquí se describe,
   para y avisa: es señal de que la rama no está desplegada o de que este
   documento está mal.
3. **Busca los llamadores por la ruta, no por el nombre de la función.** Los
   endpoints afectados están abajo con su ruta completa. Encuentra **todos** los
   sitios que los llaman (servicios de API, hooks, formularios, imports CSV)
   antes de cambiar nada.
4. **Atención a la clave del mensaje de error:** los endpoints de members usan
   `message`; los de eventos usan `msg`. Esto no cambia, y no hay que unificarlo
   en el cliente.
5. Al terminar, deja un informe con: los ficheros tocados, qué cambio cubre cada
   uno y qué no pudiste verificar.

---

## 1 · Members: email y teléfono opcionales solo para menores

**Rama del servidor:** `feat/member-contact-minors` · **Prioridad: alta**, porque
cambia qué datos se aceptan.

### La regla nueva (la aplica el servidor)

| Member | Exige |
|---|---|
| Adulto (`minor` distinto de 1, o sin mandar) | `email` **y** `phone_number` |
| Menor con email y teléfono propios | nada más |
| Menor al que le falta email **o** teléfono | `parent_guardian_email` |

Antes el servidor no exigía nada: la obligatoriedad de email y teléfono la ponía
solo el formulario del frontend. Ahora el servidor también la aplica.

### Qué tienes que hacer

**1.1 Formularios de alta y edición de member**

- Si `minor` **no** está marcado, email y teléfono siguen siendo obligatorios,
  igual que ahora.
- Si `minor` **está** marcado, email y teléfono pasan a ser opcionales. En ese
  caso, si falta cualquiera de los dos, `parent_guardian_email` pasa a ser
  **obligatorio**. Muéstralo en vivo: al vaciar el email de un menor, el campo
  del tutor se vuelve obligatorio.
- Si se **desmarca** `minor` en un member existente, email y teléfono vuelven a
  ser obligatorios antes de guardar.
- **No mandes `""` para "sin email"** en el alta: omite el campo. El servidor
  trata las dos formas igual, pero omitirlo es lo limpio.

**1.2 `POST /api/db_member/new-member`**: respuesta nueva

```json
400 { "ok": false, "message": "Adult members require phone_number.", "missing": ["phone_number"] }
```

`missing` es un array con los nombres de campo del servidor (`email`,
`phone_number`, `parent_guardian_email`). Úsalo para marcar el campo concreto en
el formulario; no hagas parsing de `message`.

**1.3 `PATCH /api/db_member/update-member-info`**: respuesta nueva

El mismo `400` con `missing`. El servidor valida **cómo queda la fila completa**
después del cambio, no solo los campos que mandas. Casos que fallan:

- vaciar el email o el teléfono de un adulto;
- desmarcar `minor` en un alumno sin contacto propio;
- vaciar `parent_guardian_email` a un menor sin contacto propio.

Los cambios que no tocan `email`, `phone_number`, `minor` ni
`parent_guardian_email` siguen igual.

**1.4 `POST /api/db_member/bulk-members`** (import CSV): campo nuevo

Las filas que no cumplen la regla **se saltan** y el resto entra; ya pasaba lo
mismo con las filas sin nombre. El campo nuevo `contact_skipped` dice qué filas
se saltaron y por qué. Viene en las respuestas **201, 202 y 400**:

```json
{
  "ok": true, "requested": 5, "inserted": 2, "skipped": 3,
  "contact_skipped": [
    { "row": 1, "missing": ["phone_number"], "msg": "Adult members require phone_number." },
    { "row": 3, "missing": ["parent_guardian_email"], "msg": "Minors without their own email and phone_number require parent_guardian_email." }
  ]
}
```

- `row` es el **índice (desde 0) en el array que mandaste**, no la fila del
  Excel. Si el CSV tiene cabecera, la fila visible es `row + 2`. Compruébalo con
  vuestro parser.
- `skipped` cuenta **todas** las filas saltadas: las de `contact_skipped` más las
  que no traían nombre. Las segundas no salen en `contact_skipped`.
- **Muestra al usuario las filas saltadas con su motivo.** Hoy un import que
  salta filas puede parecer completo; con la regla nueva habrá más filas
  saltadas y el usuario tiene que verlas.
- Si **ninguna** fila cumple: `400` con `contact_skipped`.
- **Valida en el cliente antes de mandar**, con la misma regla de la tabla. Así
  el usuario corrige el fichero antes de subirlo; `contact_skipped` es la red de
  seguridad, no la vía principal.
- Plantilla de import: si tenéis una plantilla o ayuda, añade que los menores
  sin email o teléfono necesitan `parent_guardian_email`.

**Compatibilidad con el contrato viejo:** trata `contact_skipped` como opcional
(`?? []`). Con el servidor viejo no viene.

---

## 2 · Eventos: fin de los 408 que tapaban errores

**Rama del servidor:** `fix/event-handlers-408` · **Prioridad: media.**

### `POST /api/db_event/event_staff` (añadir staff a un evento)

| Antes | Ahora |
|---|---|
| Ante cualquier error de la base, el servidor tardaba **30 s** y devolvía `408 { "msg": "Request timeout", "ok": false }` | `409` si ese staff **ya está asignado** a ese evento |
| | `500 { "ok": false, "msg": "<error de MySQL>" }` para cualquier otro fallo |

Qué hacer:

- **Trata el `409` como "ya estaba asignado".** Probablemente basta con refrescar
  la lista de staff del evento y no mostrarlo como error.
- **No reintentes ante un `409`.**
- Busca si hay **reintentos automáticos ante 408** en este endpoint (axios
  interceptors, react-query `retry`). Antes cada fallo costaba 30 s más los
  reintentos; ahora fallará rápido. Elimina cualquier lógica específica para el
  408 de este endpoint.
- Mantén el manejo del `408` genérico (timeouts reales) donde esté.

### `DELETE /api/db_event/:id` (borrar evento)

- Antes: `408` a los 30 s cuando fallaba. Ahora: `500 { "ok": false, "msg": ... }`
  inmediato.
- **Comprueba qué manda hoy el cliente en esta petición y anótalo en tu
  informe.** El servidor lee el id del evento de `request.body.email`, no del
  `:id` de la URL. Eso es un bug del servidor que **no se ha tocado**. Necesitamos
  saber:
  - si el cliente manda el id del evento en el body con la clave `email`
    (entonces hoy funciona por casualidad);
  - o si solo lo manda en la URL (entonces hoy **nunca ha borrado nada**:
    respondía 408 y ahora responderá 500).
- **No cambies el cliente para "arreglar" este endpoint.** Solo informa. El
  arreglo se hará en el servidor cuando sepamos qué manda el cliente, porque
  arreglarlo activa un borrado que hoy probablemente no ocurre.

---

## 3 · Checklist de cierre

- [ ] Formulario de member: la obligatoriedad de email y teléfono depende de
      `minor`, y `parent_guardian_email` es obligatorio cuando corresponde
- [ ] Alta y edición marcan el campo concreto a partir de `missing` en el `400`
- [ ] El import valida en el cliente con la misma regla antes de subir
- [ ] El import muestra las filas de `contact_skipped` con su motivo, y
      `contact_skipped` se trata como opcional
- [ ] `event_staff`: el `409` se trata como "ya asignado", sin reintento
- [ ] Revisados los reintentos automáticos ante 408 en `event_staff`
- [ ] Informado qué manda el cliente en `DELETE /api/db_event/:id` (body y URL)
- [ ] Informe con los ficheros tocados y lo que no se pudo verificar

## Referencia

El detalle del contrato de members está, en la rama
`feat/member-contact-minors`, en `FRONTEND_member_contact_minors_2026-10-01.md`.
