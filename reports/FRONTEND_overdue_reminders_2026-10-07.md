# Frontend: detener / reanudar recordatorios de vencido (2026-10-07)

Backend en `release/observabilidad` (commit `9d61857`). **No hay nada que el cliente tenga que cambiar para que la nueva cadencia funcione**: eso es del servidor. Lo nuevo para el cliente es poder **detener los recordatorios de un dispositivo concreto** (caso típico: se dio por perdido) y ver cuáles están detenidos.

## 1. Qué cambió en el servidor (para explicarlo en la UI)

Recordatorio automático por email, **por dispositivo vencido** (no por alumno), a las **8:00 am hora del Este**:

| Días de atraso (día del vencimiento = 0) | Envío |
|---|---|
| 0 a 14 | 1 por día |
| 17 | +3 días |
| 22 | +5 días |
| 29 | +7 días |
| 36, 43, 50… | 1 por semana |

Se detiene solo cuando: el dispositivo se devuelve (`returned = 1`, incluido devolver con estado `lost`), **o** el staff lo detiene con el endpoint de abajo.

## 2. Endpoints nuevos

Ambos: `POST`, sesión de staff (JWT), compañía con industria **Education** y permiso **`member:update`**. Mismo body:

```json
{ "company_id": 61, "member_id": 5001, "device_id": 9001 }
```

Los tres campos son obligatorios. `device_id` es el `device_id` de la fila de `/api/db_member/overdue-leases` (el `item_id` del inventario), **no** el número de serie.

### `POST /api/school/reminders/stop`
Detiene los recordatorios de **ese** dispositivo de **ese** alumno. Los demás dispositivos vencidos del mismo alumno siguen recibiendo los suyos.

### `POST /api/school/reminders/resume`
Los reactiva. La cadencia sigue donde va según los días de atraso (no se reinicia: si va por el día 25, el siguiente sale el 29).

### Respuestas

| Status | Body | Cuándo |
|---|---|---|
| 200 | `{ ok: true, reminders_stopped: true }` (stop) / `false` (resume) | Aplicado. Es idempotente: repetirlo da 200 otra vez. |
| 400 | `{ ok: false, msg: "company_id is required" \| "member_id is required" \| "device_id is required" }` | Falta un campo. |
| 404 | `{ ok: false, msg: "No outstanding lease found for this member and device" }` | Ese dispositivo ya fue devuelto o no está asignado a ese alumno. Refrescar la lista. |
| 401 / 403 | (middleware estándar) | Sin sesión, sin `member:update` o compañía no Education → ocultar el botón para ese rol. |
| 500 | `{ ok: false, msg }` | Error del servidor. |

## 3. Leer el estado: campo nuevo en la lista de vencidos

`POST /api/db_member/overdue-leases` (sin cambios en el request) ahora devuelve en cada fila:

```json
{ "member_id": 5001, "device_id": 9001, "days_overdue": 18, "reminders_stopped_at": "2026-10-07T14:03:00.000Z", ... }
```

- `reminders_stopped_at === null` → recordatorios activos.
- con fecha → detenidos desde esa fecha.

## 4. Implementación sugerida

**Servicio** (ajustar al cliente HTTP que ya usen; misma cabecera/token que el resto de `/api/school`):

```js
export const stopLeaseReminders = ({ company_id, member_id, device_id }) =>
  api.post("/api/school/reminders/stop", { company_id, member_id, device_id });

export const resumeLeaseReminders = ({ company_id, member_id, device_id }) =>
  api.post("/api/school/reminders/resume", { company_id, member_id, device_id });
```

**UI en la tabla de vencidos** (una acción por fila = por dispositivo, nunca por alumno):

- Columna "Recordatorios": badge **Activos** / **Detenidos (fecha)** a partir de `reminders_stopped_at`.
- Acción de fila: **Detener recordatorios** si `reminders_stopped_at` es null, **Reanudar** si no.
- Confirmación al detener, nombrando el dispositivo: *"Se dejarán de enviar recordatorios por el dispositivo {categoría} {serial}. Los demás dispositivos vencidos de {alumno} seguirán recibiendo los suyos."*
- Tras 200: actualizar la fila localmente (`reminders_stopped_at = new Date().toISOString()` o `null`) o volver a pedir la lista. Tras 404: refrescar la lista (la fila ya no está vencida).
- Mostrar el botón solo si el usuario tiene `member:update` (igual que otras acciones de escritura de /api/school).

**Opcional: "Próximo recordatorio"**. Si quieren mostrarlo, misma regla que el servidor:

```js
// true si hoy (con este atraso) sale recordatorio
const isReminderDay = (d) =>
  Number.isInteger(d) && d >= 0 &&
  (d <= 14 || d === 17 || d === 22 || (d >= 29 && (d - 29) % 7 === 0));

// días que faltan para el próximo envío (0 = hoy a las 8am ET)
const daysToNextReminder = (daysOverdue) => {
  for (let d = daysOverdue; d < daysOverdue + 8; d++) if (isReminderDay(d)) return d - daysOverdue;
  return null;
};
```

Si `reminders_stopped_at` no es null, mostrar "—" en vez del próximo recordatorio.

## 5. Despliegue / disponibilidad

- La migración `mysql/migrations/add_lease_reminders_stopped.sql` debe aplicarse en prod **antes** de desplegar este backend. Hasta que el backend con `9d61857` esté desplegado, estos endpoints dan **404 de ruta** y la lista no trae `reminders_stopped_at` (tratar `undefined` como "activos").
- Las dos rutas quedan en el audit trail como `UPDATE` sobre `Lease` (vocabulario ya existente).
