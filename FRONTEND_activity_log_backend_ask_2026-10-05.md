# Registro de actividad: que lo escriba el servidor, para toda acción

> Del dashboard al servidor, **2026-10-05**.
> Sigue a `FRONTEND_staff_activity_log.md` (2026-08-05), el contrato del
> registro de actividad de staff (B2).

---

## 1. Qué se pide

Fredrik pidió el 2026-10-05: **registrar cualquier acción que un usuario o
staff haga en la aplicación**, por ejemplo crear un evento, asignar inventario
al evento o asignar un dispositivo a un consumidor dentro del evento. En la
reunión del 29-09 (`FRONTEND_meeting_2026-09-29.md`, ítem 22) ya había pedido
lo mismo para el dispositivo: un audit trail con el autor de cada acción
(`1:08:32`–`1:15:25`). Enseñó como referencia el historial de auditoría de una
factura de QuickBooks: quién, qué y cuándo. Y lo separó de los roles
personalizados: *"They just need to be logged."*

## 2. Lo que hay hoy, según vuestro contrato del 05-08

- El servidor registra solo `LOGIN`, `FORCE_LOGOUT` y los create, update y
  delete de **`controller/admin.js`, `controller/event.js` y
  `controller/inventory.js`**.
- El resto lo tiene que registrar el cliente con `POST /api/admin/activity-logs`.
  Hoy lo hace solo en members, préstamos, consentimientos y tutores (15
  ficheros).

### Las tres acciones del ejemplo

| Acción | Endpoint | Controlador | ¿Se registra? |
|---|---|---|---|
| Crear evento | `POST /api/event/create-event` | `controller/event.js:11` | Sí, según el contrato |
| ↳ su fila SQL | `POST /api/db_event/new_event` | `mysql/controllers/events.js:32` | No (basta con una entrada por evento) |
| Asignar inventario al evento | `POST /api/db_event/event_device`, `event_device_directly`, `reserve-items-for-event` | `mysql/controllers/items_events.js` | **No** |
| Asignar un dispositivo a un consumidor | `POST /api/receiver/receiver-assignation` | `controller/receiver.js:24` | **No** |

### Lo que queda fuera, contado

Según `src/docs/api-payloads.md`, de **404 rutas POST/PUT/PATCH/DELETE**, los
tres controladores que registráis suman **30**. Los que más pesan y no
registran:

| Controlador | Rutas | Qué hace |
|---|---|---|
| `mysql/controllers/item.js` | 66 | inventario en SQL: altas, ediciones, salidas del almacén |
| `controller/stripe.js` | 37 | cobros, depósitos, captura y liberación, refunds |
| `controller/receiver.js` | 28 | asignación a consumidores, devoluciones, pool del evento |
| `controller/document.js` | 23 | documentos y carpetas |
| `mysql/controllers/items_events.js` | 20 | inventario del evento |
| `mysql/controllers/school.js`, `members.js`, `lease.js` | 41 | members, préstamos, colegio |
| `controller/transaction.js` | 12 | transacciones de consumidores |

**Ojo:** muchas de esas rutas POST son **consultas** (`inventory-query`,
`consulting-*`, `retrieve-*`). El método HTTP no basta para decidir qué se
registra.

## 3. Por qué en el servidor y no en el cliente

1. **El cliente se puede saltar.** Quien llame a la API sin el dashboard no
   deja rastro. Para un registro de auditoría (FERPA/COPPA con menores,
   AU-2/AU-3 en el plan FedRAMP), eso lo invalida.
2. **Duplicados.** Vuestro contrato lo advierte: si el cliente registra algo
   que el servidor ya registra, sale dos veces. Con dos fuentes, cada endpoint
   nuevo es una ocasión de equivocarse.
3. **El autor ya lo tenéis.** El JWT identifica al staff en cada petición.
   El cliente solo puede decir quién cree que es.

## 4. Lo que proponemos

Un middleware de auditoría en las rutas que **cambian datos**, con una lista
explícita (las de consulta, fuera), que escriba en el mismo almacén que lee
`GET /api/admin/activity-logs`:

| Campo | De dónde sale |
|---|---|
| quién | el JWT: staff id, email y rol |
| compañía | la cabecera de tenant |
| acción | `CREATE` / `UPDATE` / `DELETE`, o un verbo de negocio: `ASSIGN`, `RETURN`, `CHARGE`, `REFUND`… |
| sobre qué | `target_model` + `target_id`, por ejemplo `Event 123`, `Item 4567`, `Transaction pi_…` |
| contexto | evento, consumidor o member cuando aplique, para poder filtrar por evento o por dispositivo |
| cuándo | la hora del servidor |
| resultado | registrar solo lo que terminó bien, o el estado de la respuesta |

## 5. Preguntas

1. ¿Os parece bien el middleware, o preferís llamadas explícitas por
   controlador?
2. ¿Qué es `controller/transactionAuditLog.js`? ¿Ya registra las
   transacciones? ¿Escribe en el mismo sitio que `activity-logs`?
3. ¿Los envíos de correo (`nodeMailer/notifications.js`, 38 rutas) cuentan
   como acción del usuario? Proponemos registrar solo los que dispara una
   persona.
4. ¿Podéis añadir a `GET /api/admin/activity-logs` filtros por evento y por
   dispositivo? Es lo que permite el *"audit trail por dispositivo"* de la
   reunión.
5. **¿Podéis dejar fuera del registro los borrados de caché**
   (`POST /api/cache_update/remove-cache`)? Son ocho de cada cuarenta y cinco
   filas, las escribe la máquina sola y no las entiende nadie. Hoy las
   escondemos en el cliente, pero entonces una página de 50 llega con menos
   filas y el contador no cuadra. Mejor un parámetro para excluirlas, o no
   registrarlas.
6. Cuando cubráis un controlador, avisadnos: el cliente quitará sus llamadas a
   `register` para esas rutas, y así no hay duplicados.

## 6. Lo que hará el dashboard

- Pintar las acciones nuevas en lenguaje legible en la pantalla de actividad
  de staff, por ejemplo "asignó 5 equipos al evento X".
- Los filtros, en cuanto el endpoint los acepte.
- El audit trail del perfil del dispositivo, leyendo el autor de cada evento
  de custodia.
- Retirar las llamadas a `registerStaffActivity` que pasen a estar cubiertas.
