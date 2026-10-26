# FRONTEND — Limpieza del schema de AdminUser y del flujo de invitación de staff

**Fecha:** 2026-08-17
**Backend:** `server-testing`, cambios en working tree (sin commitear todavía)
**Suite:** 911/912 tests pasan (el único fallo, `routes/auth.js: GET /:id tiene validateJWT`, es un gap preexistente y no tiene relación con estos cambios)

---

## 1. Qué cambió y por qué

`AdminUser` guardaba `company`, `role`, `role_type`, `question` y `answer`. Ninguno de esos campos era fuente de verdad:

- **La compañía no puede vivir en el AdminUser**: un mismo usuario pertenece a N compañías con roles distintos. El contexto lo elige el usuario al loguearse y viaja **por request**.
- **El rol tampoco**: la autorización lo resuelve por-compañía desde `Company.employees[].roleType` (`middlewares/authorizeMongoPermission.js`). `AdminUser.role_type` nunca participó.
- **`question`/`answer`** no las leía ningún flujo (no hay recuperación de contraseña por pregunta secreta) y eran `required: true`, así que solo obligaban al alta a enviar datos inertes.

Se eliminaron `company`, `question` y `answer` del schema. `role` y `role_type` **siguen en el schema pero ya son legacy / solo presentación**: ningún path del backend los escribe. Su eliminación definitiva depende de esta migración de frontend (ver §6).

---

## 2. Breaking changes — resumen

| # | Endpoint | Qué cambió | Acción de frontend |
|---|---|---|---|
| B1 | `POST /api/registration/accept-invitation` | Ya **no** acepta `roleType` en el body; el rol sale de la invitación. Nuevo **404** si no hay invitación pendiente | Dejar de enviar `roleType`; manejar el 404 |
| B2 | `POST /api/admin/new_admin_user` | Lista blanca: solo `name`, `lastName`, `email`, `password`, `phone`, `imageProfile`. Todo lo demás se descarta en silencio | Dejar de enviar `role`, `roleType`, `company`, `question`, `answer`, `super_user`, `companiesAssigned` |
| B3 | `POST /api/admin/login` | La respuesta ya no incluye `company` | Tomar la compañía del selector (ver §4), no de la respuesta |
| B4 | `PATCH /api/admin/profile/:id` | La respuesta ya no incluye `company` | Igual que B3 |
| B5 | Link de invitación por email | `question`, `answer`, `role`, `roleType`, `company` en el query string ya no sirven para nada | Simplificar el link (ver §3) |
| B6 | `GET /api/admin/activity-logs` | El alcance ahora sale de `Company.employees`, no de `AdminUser.companiesAssigned`/`company`. **Esto arregla un 403 generalizado** | Enviar `x-company-id`; ver §5 |

---

## 3. B1 + B5 — Aceptación de invitación

### El link del email se simplifica

Hoy el frontend construye:

```
https://admin.devitrak.net/invitation
  ?first=Adolfo&last=Santeliz&email=gar.santeliz%40outlook.com
  &question=company%20name&answer=Test%20Company%208%2F13%2F2023
  &role=1&roleType=admin&company=6a7d9ef28f33f83745aa54e2
```

`question`, `answer`, `role`, `roleType` y `company` ya no cumplen ninguna función: el backend no los persiste y el rol lo lee de la invitación que ya existe en `Company.employees`. El link puede quedar en:

```
https://admin.devitrak.net/invitation
  ?first=Adolfo&last=Santeliz&email=gar.santeliz%40outlook.com&company_name=Test%20Company%208%2F13%2F2023
```

`company_name` sigue siendo necesario porque es lo que el endpoint usa para localizar la empresa. (Migrar a un token de invitación opaco es la mejora pendiente — ver §7.)

### Request

**Antes:**
```json
{
  "user": { "name": "Maria", "lastName": "Lopez", "email": "maria@test.com", "password": "..." },
  "company": { "company_name": "Acme Corp" },
  "roleType": "admin"
}
```

**Ahora** (`roleType` se ignora si se envía; mejor no mandarlo):
```json
{
  "user": { "name": "Maria", "lastName": "Lopez", "email": "maria@test.com", "password": "..." },
  "company": { "company_name": "Acme Corp" }
}
```

### Response

La respuesta ahora incluye el rol efectivo resuelto, para que el cliente no tenga que adivinarlo:

```json
{
  "ok": true,
  "user": { "uid": "...", "name": "Maria", "lastName": "Lopez", "email": "maria@test.com", "isNewUser": true, "sqlStaffId": 42 },
  "company": { "_id": "...", "company_name": "Acme Corp", "sql_id": 77, "roleType": "assistant" }
}
```

### Nuevo 404

```json
{ "ok": false, "msg": "No hay una invitación pendiente para maria@test.com en \"Acme Corp\"." }
```

Se devuelve cuando el email no está en `Company.employees`. Antes ese caso respondía **201/200 igual** y le daba acceso SQL al usuario: bastaba conocer el nombre de una empresa. Mostrar un mensaje del tipo _"esta invitación ya no es válida — pedile al administrador que te reinvite"_.

**Por qué se quitó `roleType` del body:** la ruta no lleva autenticación, así que el propio invitado podía enviar `roleType: "root_admin"` y quedaba con ese rol en `company_staff`, que es la fuente de verdad del lado SQL.

---

## 4. B2 + B3 + B4 — Alta de usuario y login

### `POST /api/admin/new_admin_user`

Antes hacía `new AdminUser(request.body)` en una ruta **anónima**: cualquiera podía enviar `super_user: true` y saltarse la autorización por completo. Ahora solo se aceptan:

```json
{ "name": "...", "lastName": "...", "email": "...", "password": "...", "phone": "", "imageProfile": "" }
```

Si el frontend usaba este endpoint para asignar rol o compañía, tiene que dejar de hacerlo: la membresía se crea en `Company.employees` (al invitar) y se confirma vía `accept-invitation`.

### Respuesta de login — de dónde sacar compañía y rol

`POST /api/admin/login` ya no devuelve `company`. Sigue devolviendo `role` (legacy) y `entire` con el documento completo.

**Cuidado con `entire`:** Mongoose no borra del documento los campos que ya no están en el schema, así que `entire.company`, `entire.question` y `entire.answer` **todavía aparecen en usuarios viejos** (los 46 existentes los tienen guardados) y **no aparecen en usuarios nuevos**. No son confiables — no leerlos.

Fuente correcta para el selector de compañía, en orden de preferencia:

1. `entire.companiesAssigned[]` — es lo que ya mantiene el frontend vía `PATCH /api/admin/profile/:id`; 44 de 46 usuarios lo tienen poblado. Sirve como lista para el selector.
2. Las membresías reales viven en `Company.employees` (match por `userId` o por `user` = email), y ahí está el `roleType` que **efectivamente** aplica la autorización.

Si `companiesAssigned` y `Company.employees` divergen, gana `Company.employees`: es lo que consultan `authorizeMongoPermission` y el nuevo scoping de activity-logs. Vale la pena que el frontend deje de tratar `companiesAssigned[].role/role_type` como el rol real y lo tome de la membresía.

---

## 5. B6 — `x-company-id` en cada request autenticado

El backend ya exigía `x-company-id` para autorizar (`authorizeMongoPermission` lo lee de `x-company-id`, o de `params`/`body`/`query` por compatibilidad). Ahora **ese mismo valor se usa para atribuir los registros de auditoría**, así que se volvió más importante enviarlo siempre después de que el usuario elige compañía.

```
x-company-id: <Mongo ObjectId de la Company>
```

Notas:

- **`POST /api/admin/activity-logs`** toma la compañía **solo del header** (no del body). Si no viene el header, el log se guarda con `company_id: null` en vez de rechazarse — un audit trail no puede descartar eventos. Un `company_id` en el body se ignora.
- **`GET /api/admin/activity-logs`** dejó de devolver 403 a los usuarios normales. El scoping salía de `AdminUser.companiesAssigned` + `AdminUser.company`; con `company` fuera del schema, todo usuario no-`super_user` sin `multipleCompanies` caía en `403 "No company assigned to user"`. Ahora el alcance se calcula desde `Company.employees`.
- El filtro `?company_id=` acepta tanto el **ObjectId** como el **nombre** de la compañía, porque los registros históricos guardaron el nombre en `company_id` (venía del viejo `AdminUser.company`). Los registros nuevos guardan el ObjectId.
- **LOGIN sin compañía:** el login ocurre antes de elegir compañía, así que su registro de auditoría queda con `company_id: null`. Es intencional. Si querés que la actividad de login quede atribuida, el frontend puede registrar un evento propio vía `POST /api/admin/activity-logs` **después** de que el usuario selecciona la compañía, ya con el header puesto.

---

## 6. Qué falta para eliminar `role` / `role_type` del todo

No los quité todavía porque el frontend los sigue mostrando. Para cerrarlo hace falta que el agente de frontend confirme:

1. ¿Dónde se lee `role` o `role_type` del AdminUser (respuesta de login, `entire`, perfil)?
2. ¿Se puede reemplazar por el `roleType` de la membresía de la compañía seleccionada?

Con eso confirmado, la eliminación en backend es trivial. Notar que por el comportamiento de Mongoose descrito en §4, los usuarios existentes seguirían exponiendo `role` en `entire` incluso después de quitarlo del schema; los nuevos no. O sea: **no se puede depender de `entire.role` para usuarios nuevos ya hoy**.

Un consumidor de backend queda pendiente: la plantilla de email en `nodeMailer/notifications.js:806` usa `adminUser.role` para mostrar el rol. Debería recibir el rol de la membresía; queda anotado como follow-up.

---

## 7. Riesgos abiertos (no resueltos en este cambio)

Los dejo listados porque afectan decisiones de frontend:

1. **`PATCH /api/admin/profile/:id` sigue siendo mass assignment y sin chequeo de propiedad.** Lleva `validateJWT` pero no verifica que `request.uid === :id`, y hace `findByIdAndUpdate(id, {...request.body})`. Cualquier usuario autenticado puede modificar el perfil de otro, incluido `super_user: true`. Es también el endpoint por el que el frontend mantiene `companiesAssigned`, así que ponerle lista blanca requiere saber exactamente qué campos manda el frontend. **Necesito esa lista para cerrarlo.**
2. **`POST /api/admin/new_admin_user` sigue siendo anónima.** Ya no permite escalar privilegios, pero cualquiera puede crear cuentas. Lo correcto es que el registro de staff pase solo por `accept-invitation`; si el frontend ya no la necesita, se puede retirar la ruta.
3. **`accept-invitation` no valida un token de invitación**, solo que el email esté en `Company.employees` de esa empresa. Es mucho mejor que antes, pero un token firmado (o el mismo esquema OTC hasheado que ya usa el módulo de consent) sería lo correcto.
4. **Atribución de auditoría no verificada:** `POST /api/admin/activity-logs` acepta el `x-company-id` que le manden sin comprobar membresía. El read path sí está scopeado, así que un valor falso solo contamina una compañía que el emisor no puede leer.

---

## 8. Checklist de verificación

- [ ] El link de invitación ya no incluye `question`, `answer`, `role`, `roleType`, `company`
- [ ] `accept-invitation` se llama sin `roleType` y maneja el 404 de invitación inexistente
- [ ] `new_admin_user` se llama solo con los 6 campos permitidos
- [ ] Nada lee `company` de la respuesta de login ni de `PATCH /profile/:id`
- [ ] `x-company-id` se envía en todo request posterior a la selección de compañía
- [ ] `GET /api/admin/activity-logs` devuelve datos (no 403) para un usuario no-superuser con membresía
- [ ] Confirmado de dónde toma el frontend el rol a mostrar, para poder eliminar `role`/`role_type`
- [ ] Enviada la lista de campos que el frontend manda a `PATCH /api/admin/profile/:id`

---

## 9. Archivos tocados en backend

| Archivo | Cambio |
|---|---|
| `models/AdminUser.js` | Eliminados `question`, `answer`, `company`; `role`/`role_type`/`companiesAssigned` marcados legacy |
| `models/StaffActivityLog.js` | `company_id` pasa a opcional (`null` para eventos sin compañía, como LOGIN) |
| `helpers/companyContext.js` | **Nuevo.** `resolveCompanyContext(req, { headerOnly })` |
| `middlewares/authorizeMongoPermission.js` | Usa el helper en vez de resolver el contexto inline |
| `controller/admin.js` | Lista blanca en `createAdminUser`; los 5 call-sites de auditoría toman la compañía del contexto; `company` fuera de las respuestas; `target_model` agregado en `forceEndSession` |
| `controller/registration.js` | `acceptInvitation`: rol desde la invitación, 404 si no existe, `roleType` en la respuesta |
| `controller/staffActivityLog.js` | Scoping desde `Company.employees` (`findMemberships`); write path con `headerOnly` |
| `middlewares/authorizeAdminRoles.js` | **Eliminado** (código muerto, cero rutas lo montaban) |
| `test/adminUserMassAssignment.test.js` | **Nuevo**, 4 casos |
| `test/activityLogCompanyScope.test.js` | **Nuevo**, 12 casos |
| `test/invitationAcceptance.test.js` | Actualizado + 2 casos nuevos |
| `test/registerStaffActivityEndpoint.test.js` | Actualizado + 1 caso nuevo |
