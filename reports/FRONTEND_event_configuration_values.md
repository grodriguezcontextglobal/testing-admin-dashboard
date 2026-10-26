# `configuration` de un evento: vocabulario nuevo — pedido al backend

> **2026-09-30.** Frontend ya escribe y lee los valores nuevos. Hace falta que
> el backend los acepte. Mientras tanto nada se rompe: el frontend los escribe
> de forma tolerante y sigue leyendo los viejos.

## Qué cambia

| Etapa | Antes | Ahora | Cuándo se escribe |
|---|---|---|---|
| Evento a medio crear | `in-progress` (default del servidor) | **`draft`** | Paso 1 del alta, justo después de crear el evento |
| Alta terminada | `completed` | **`created`** | Paso de revisión, al activar el evento |
| Evento cerrado | *(nada; solo `active: false`)* | **`closed`** | "Close event" en quick-glance |

Se escribe en los **dos** registros del evento:

- Mongo: `PATCH /api/event/edit-event/:id` con `{ configuration }`
- SQL: `POST /api/db_event/update-event/:event_id` con `{ configuration }`

## Qué necesitamos del backend

1. **Que `configuration` acepte `draft`, `created` y `closed`**, en el esquema
   de Mongo (`models/Event.js`) y en la columna de SQL. Si alguno tiene un
   `enum` con solo `in-progress`/`completed`, hay que ampliarlo.
2. **Que el default al crear pase a `draft`**, o que no haya default. Hoy
   frontend escribe `draft` en un pedido aparte justo después de crear.
3. **Opcional: migrar lo guardado.** `in-progress` → `draft`, `completed` +
   `active: true` → `created`, y `completed` + `active: false` → `closed`. No
   es obligatorio, porque frontend lee las dos formas, pero deja un solo
   vocabulario.

## Cómo lo lee el frontend (`src/pages/events/utils/eventLifecycle.js`)

- `active: true` → **created**, diga lo que diga `configuration`.
- Si no, `draft` o `in-progress` → **draft**.
- Todo lo demás, incluido un evento sin `configuration`, → **closed**.

`active` decide primero a propósito: si la escritura de `created` fuera
rechazada, un evento ya activado seguiría diciendo `in-progress`, y no por eso
es un borrador.

## Por qué tolerante

Cada escritura va aparte y nunca lanza (`writeEventConfiguration`). Si el
backend rechaza la palabra, se registra un `console.warn`, y crear o cerrar el
evento sigue adelante. Cuando el backend confirme el punto 1, se puede volver a
escribir `configuration` dentro del mismo pedido que cambia `active`.
