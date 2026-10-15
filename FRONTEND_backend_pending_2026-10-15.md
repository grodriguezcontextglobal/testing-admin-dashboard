# Backend: todo lo que el dashboard espera del servidor (2026-10-15)

Para el agente de backend. **Un solo documento con todo lo pendiente**, en
orden de prioridad. Cada punto remite al documento donde está el detalle, que
sigue siendo la fuente; aquí solo va lo necesario para empezar y saber cuándo
está terminado.

**Prioridad general (Fredrik, 2026-09-25):** FedRAMP por delante de todo.

**Cómo leerlo.** "Surgió" es la fecha en que se pidió. "Hecho cuando" es la
condición que el dashboard comprueba para cerrarlo de su lado. Al terminar un
punto, respondan en un `BACKEND_*_REPLY` con el número de punto, la rama y si
está desplegado: varios cambios del cliente se activan solo cuando lo está.

---

## P0 — Roto en producción o a punto de romperse

### 1. Desplegar `release/observabilidad` — y avisar el día exacto
**Surgió:** 2026-10-13 · `FRONTEND_invitation_signed_link_2026-10-13.md`,
`FRONTEND_password_reset_mfa_2026-10-13.md`

El dashboard **ya está en `main`** con el contrato nuevo:
- aceptar invitación con `invitationToken` firmado (`8054a452`);
- reset de contraseña con enlace firmado y MFA (`a9e3c00a`);
- cambio de contraseña con `POST /api/admin/verify-password`, sin hash en el
  cliente (`c1a4a454`);
- `companiesAssigned` lo escribe el servidor (`1a86f327`);
- `x-mfa-setup-token` en CORS.

**Tienen que salir a la vez.** Retenemos el release de IIS hasta que
desplieguen. Necesitamos **la fecha** para publicar el dashboard el mismo día,
y que las invitaciones pendientes se reenvíen (las viejas no traen token).

**Hecho cuando:** la rama está en producción y nos dan la hora del despliegue.
Además, la copia del contrato (`src/docs/api-payloads.json`) con
`verify-password`, para quitarla de nuestras excepciones del audit.

### 2. Refunds: ninguno funciona desde el 2026-03-18
**Surgió:** 2026-10-02 · confirmado en `BACKEND_answers_to_dashboard_2026-10-06.md`

El validador acepta `payment_intent` y los controladores leen `paymentIntent`.
El arreglo ya está escrito (acepta los tres nombres); **falta desplegarlo**.
Afecta a `POST /stripe/refund` y `POST /stripe/partial-refund`.

**Hecho cuando:** desplegado. Confirmen también los códigos que darán cuando
estas rutas exijan sesión y `transaction:update`: **403** sin permiso y **404**
si el pago es de otra compañía, con `message` legible.

### 3. El login sigue dando token a cuentas con MFA apagado
**Surgió:** 2026-09-21 · `FRONTEND_force_logout_token_2026-09-21.md`

El cliente obliga a enrolarse, pero un `POST /api/admin/login` directo se salta
la puerta. Para FedRAMP (IA-2) la regla tiene que estar en el servidor.

**Hecho cuando:** el login de una cuenta sin MFA no devuelve un token de sesión
completo, solo el de enrolamiento. Díganos qué forma tiene esa respuesta.

De paso, el mismo documento pide un **token de un solo uso en el enlace de
force-logout** (§"What we are asking for", puntos 1 y 2). El punto 3 se hizo el
2026-09-23; confirmen si 1 y 2 están hechos.

### 4. Invitaciones a evento con enlace firmado — una pregunta bloqueante
**Surgió:** 2026-10-14 · `FRONTEND_attendance_invitation_link_2026-10-14.md`
(su diseño) y `FRONTEND_attendance_invitation_link_review_2026-10-14.md`
(nuestra revisión)

El cliente está hecho: la landing ya usa `x-link-token` (`a5959069`, en
`main`), y el envío por `POST /school/event-invitations/send` está listo pero
**sin commitear**, porque sin la ruta desplegada no saldría ninguna invitación.

**Bloqueante (§1 de la revisión):** con `enforce`, ¿cómo distinguen al
dashboard sin sesión de la app de consumidores en `POST /auth/user-query`,
`POST /auth/new`, `PATCH /auth/:id` y `POST /db_consumer/new_consumer`? Si es
por `Origin` u otra cabecera del cliente, no es un control.

**Antes de `enforce`** (§2–§6 de la revisión):
- caducidad ligada al evento en vez de 5 días fijos;
- que `opened` no gaste el token;
- `GET /school/event-invitations/preview` para no leer datos de la URL;
- que `/confirm` y `/response` decidan solo con `x-link-token`, aunque llegue
  también `x-token`;
- `member:notify` en vez de `member:create` en `/send`;
- token usado con la persona aún en el evento → `200 { outcome: "already" }`.

**Nuevo, 2026-10-15:** ¿es **idempotente** `/send` para el mismo miembro y
evento? Si un lote de 500 corta por timeout después de enviar parte, el
cliente marca el lote entero como fallido y un reintento manda el correo dos
veces. Necesitamos saber si repetir es seguro, o un id de idempotencia.

**Hecho cuando:** `/send` y `/confirm` desplegados y la pregunta bloqueante
respondida. Ese día commiteamos el envío.

---

## P1 — FedRAMP

### 5. Las 384 rutas sin `validateJWT`
**Surgió:** 2026-10-14 · `FRONTEND_unauthenticated_routes_2026-10-14.md`

De 484 rutas, 384 no llevan `validateJWT` en la ruta (contrato del 24-08).
**Primero descarten** que algún router lo monte con `router.use`, porque el
extractor no lo vería. Después, por grupos:

| Grupo | Rutas | Acción |
|---|---|---|
| **B** | 154 | El dashboard solo las llama con sesión. `validateJWT` + `checkTokenVersion`: **no nos rompe nada**. Es el mayor avance por menos riesgo |
| **C** | 36 | Tienen `canRead`/`canManage`… sin `validateJWT`. Confirmar que exigen token. **29 son de colegio, con datos de menores: prioritario** |
| **E** | 4 | Refund, refund parcial, capture y cancel. Ya anunciado; confirmar despliegue (punto 2) |
| **A** | 44 | Las usa una página pública. Revisar una a una (§3 del documento) |
| **D** | 35 | `optionalJWT`, 33 de Stripe. Decidir cuáles son públicas de verdad |
| **F** | 111 | El dashboard no las llama. Cerrar o retirar tras mirar otros clientes |

Lo más grave por dominio está en §2: `nodemailer/*` permite mandar correo con
nuestra marca a cualquier dirección, y `receiver/*`, `db_item`, `db_event`,
`transaction/*` escriben sin sesión.

**Hecho cuando:** nos mandan el contrato regenerado y la lista de rutas que
pasaron a exigir sesión.

### 6. Retirar el rol numérico (F1.1, fase 2)
**Surgió:** 2026-10-14 · `FRONTEND_numeric_role_backend_ask_2026-10-14.md`

El dashboard ya no decide nada con el número (fase 1, `4c8ffa5c`). Para dejar
de escribirlo y mandarlo, cinco preguntas:
1. ¿Decide el servidor el alcance con el `role` del body?
2. ¿Qué lee `authorizeMongoPermission`?
3. ¿Hay registros sin `roleType`? (Un `role: ""` sin `roleType` se leía como
   root admin en el cliente: ¿pasa lo mismo en el servidor?)
4. R1: el choque de niveles entre los roles con alcance y `event_assistant`.
5. Qué escribe el servidor hoy en `role` y `role_level`.

**Hecho cuando:** respondan las cinco.

### 7. Qué cabecera de tenant lee el servidor (F1.2)
**Surgió:** 2026-09-28 · `fedRAMP/FRONTEND_action_plan_2026-09-28.md`

Mandamos `x-company-id` (rutas Mongo) y `s-company-lq` (rutas SQL), desde
`buildRouteScopedHeaders`. El informe de readiness dice que el servidor no las
usa para aislar compañías. ¿Cuál lee cada ruta, y la contrasta con la del JWT?

**Hecho cuando:** respondan. Puede no requerir código.

---

## P2 — Contratos ya pedidos, esperando despliegue o respuesta

### 8. Edición de documentos y no asignar vencidos (2b.8)
**Surgió:** 2026-10-01 · `FRONTEND_documents_backend_ask.md`

`PUT /api/document/:id` existe en una rama y está ajustada a lo que manda
`EditDocument.jsx` (`BACKEND_answers_to_dashboard_2026-10-06.md`). Falta:
- **desplegarla**;
- que el servidor **rechace asignar un documento vencido** (§2): hoy solo lo
  impide el cliente.

### 9. Borrar un evento Draft no borra nada en SQL
**Surgió:** 2026-10-02

`DELETE /db_event/:id` leía el id de `body.email`. El cliente ya dejó de
mandar el body y trata **404** como "no había fila" y **409** como "tiene
inventario o staff". **Hecho cuando:** desplegado leyendo `:id` de la URL.

### 10. `event_staff`: el duplicado como 409
**Surgió:** 2026-10-01

Con el servidor nuevo, el duplicado es 409 y lo demás es 500. Mientras conviva
el viejo, el cliente trata 408 también como "ya vinculado". **Avísennos al
desplegar:** quitamos el 408, porque si no, un timeout real se cuenta como
staff vinculado.

### 11. Detener y reanudar recordatorios de vencidos
**Surgió:** 2026-10-07 · `FRONTEND_overdue_reminders_2026-10-07.md`, backend
`9d61857`

Cliente hecho: el botón Stop se habilita solo cuando la fila trae
`reminders_stopped_at`. **Hecho cuando:** `9d61857` desplegado.

### 12. Registrar las respuestas del tutor (2b.9 [17])
**Surgió:** 2026-10-08 · `FRONTEND_event_invitation_responses_2026-10-08.md`

`POST /api/school/event-invitations/response`. Hasta que exista, el cliente
ignora el 404. Va junto con el punto 4.

### 13. Registro de actividad: lo que falta del middleware
**Surgió:** 2026-10-05 · `FRONTEND_activity_log_backend_ask_2026-10-05.md`

El middleware está desplegado desde el 05-10 (gracias). Falta:
- **Q4:** filtro por **evento** en `GET /api/admin/activity-logs` (el de
  `serial_number` ya lo usamos en el audit trail del dispositivo);
- **Q5:** excluir de origen los borrados de caché. Hoy los quitamos en el
  cliente y las páginas llegan con menos filas que su tamaño;
- desplegar `summary`/`display` (`feat/audit-readable-summary`, `dbcd4f5`);
- **Q6:** avisar qué controladores cubre el middleware. Las 13 llamadas del
  cliente a `registerStaffActivity` hoy **duplican** entradas, y las quitaremos
  en cuanto confirmen la cobertura.

### 14. Backfill del alcance por ubicación, de Mongo a SQL (R3)
**Surgió:** 2026-07 (revisado 2026-10-05)

El cliente ya lee SQL primero y cae a Mongo. Una persona con alcance asignado
solo en Mongo no tiene filas en SQL, así que el servidor no puede aplicarle el
alcance. **Hecho cuando:** el backfill está ejecutado.

### 15. Correos: imágenes rotas y envoltorio
**Surgió:** 2026-10-01 y 2026-10-07 · `FRONTEND_email_wrapper_ask.md`,
`FRONTEND_email_branding_devitrak_assets_2026-10-07.md`

- **El logo y el nombre de Devitrak salen como imagen rota** en el preview de
  branding, que usa las mismas plantillas que un envío real. Seguramente
  también en los correos de verdad.
- El envoltorio (2b.4): logo de la compañía arriba, "Powered by Devitrak" al
  pie y logo blanco sobre fondo oscuro.

El dashboard no tiene nada que cambiar en ninguno de los dos.

---

## P3 — Esperan una decisión antes de ser trabajo

Estas no son para empezar todavía, pero el servidor es quien las ejecutará:

| # | Tema | Surgió | Qué falta decidir |
|---|---|---|---|
| 16 | `GET /api/document/:id` es público para **cualquier** documento | 2026-10-06 | Nosotros les debemos la respuesta. Nuestra propuesta: público solo lo marcado como School consent |
| 17 | Recordatorio de vencidos diario y sin fin | 2026-10-05 | Producto (Fredrik): espaciarlo (días 1, 3, 7 y luego semanal) o ponerle tope |
| 18 | Preferencias de notificación que no controlan ningún correo | 2026-10-05 | Producto: si son del staff o de la compañía. Después, contrato de dónde se guardan y que cada `nodemailer/*` las consulte |

---

## Resumen para empezar

1. **Hoy:** fecha de despliegue de `release/observabilidad` (1) y del arreglo
   de refunds (2).
2. **FedRAMP sin riesgo para nosotros:** `validateJWT` en las 154 rutas del
   grupo B y comprobar las 29 de colegio del grupo C (5).
3. **Respuestas que desbloquean trabajo del cliente:** la pregunta bloqueante y
   la idempotencia de `/send` (4), las cinco del rol numérico (6) y la de la
   cabecera de tenant (7).
4. **El resto:** desplegar lo que ya está escrito (8–13) y avisar cada vez,
   porque varios cambios del cliente se activan con su despliegue.
