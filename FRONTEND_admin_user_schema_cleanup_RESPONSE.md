# FRONTEND → BACKEND — Respuesta a la limpieza del schema de AdminUser

**Fecha:** 2026-08-17
**Responde a:** `FRONTEND_admin_user_schema_cleanup.md`
**Repo:** `testing-admin-dashboard`
**Suite:** 1722/1722 tests pasan · `npm run build` OK

---

## 1. Checklist de §8

| # | Ítem | Estado |
|---|---|---|
| 1 | El link de invitación ya no incluye `question`, `answer`, `role`, `roleType`, `company` | ✅ hecho (con una desviación en `company` — ver §3) |
| 2 | `accept-invitation` se llama sin `roleType` y maneja el 404 | ✅ hecho |
| 3 | `new_admin_user` se llama solo con los 6 campos permitidos | ✅ **no se llama en absoluto** — ver §4 |
| 4 | Nada lee `company` de la respuesta de login ni de `PATCH /profile/:id` | ✅ verificado, ya era así |
| 5 | `x-company-id` se envía en todo request posterior a la selección de compañía | ✅ verificado, ya era así |
| 6 | `GET /api/admin/activity-logs` devuelve datos (no 403) para un usuario no-superuser | ⏳ pendiente de QA manual |
| 7 | Confirmado de dónde toma el frontend el rol a mostrar | ✅ respondido en §5 |
| 8 | Enviada la lista de campos que el frontend manda a `PATCH /api/admin/profile/:id` | ✅ respondido en §6 |

---

## 2. Qué cambió en el frontend

**Link de invitación** — `src/pages/staff/action/utils/newStaffMemberUtils.js::buildInvitationLink`.
Antes:

```
/invitation?first=…&last=…&email=…&question=company%20name&answer=<empresa>&role=1&roleType=admin&company=<ObjectId>
```

Ahora:

```
/invitation?first=…&last=…&email=…&company=<ObjectId>&company_name=<empresa>
```

Había **dos** constructores del link. El segundo estaba inline en
`src/pages/events/quickGlance/staff/components/EditingStaff.jsx` y tenía dos
defectos propios que se arreglaron al unificarlo con el primero:

- pasaba el **nombre** de la empresa en el parámetro `company`, que la landing
  page busca como `_id` — o sea, esa invitación nunca se podía completar;
- escribía la entrada en `Company.employees` a mano, **sin `roleType`**. Con el
  rol saliendo ahora de la invitación, ese invitado habría llegado sin rol.

**Aceptación** — `src/pages/authentication/InvitationLanding.jsx` + módulo puro nuevo
`src/pages/authentication/utils/invitationAcceptance.js` (9 tests).

- El body de `accept-invitation` ya no lleva `roleType`.
- El 404 se traduce a *"This invitation is no longer valid. Ask your
  administrator to send you a new one."* en vez de repetir el mensaje del
  servidor.
- Para un usuario que ya tenía cuenta, la aceptación y el alta en
  `companiesAssigned` eran **`Promise.all`**: se escribía la membresía aunque la
  aceptación fallara. Ahora es secuencial, y el `roleType` que se guarda es el
  que devuelve `accept-invitation` (`company.roleType`), no el que venía en la URL.
- `companiesAssigned[]` pasa a guardar `roleType`. El `role` numérico se escribe
  solo cuando el roleType tiene nivel: los cuatro roles scoped no tienen, y un 0
  inventado los haría pasar por `root_admin` ante cualquier comparación numérica.

---

## 3. Desviación: `company` sigue en el link

El documento propone dejar solo `company_name`. **Mantuvimos `company` con el
ObjectId y agregamos `company_name`.**

Razón: la landing page resuelve la empresa con
`POST /company/search-company { _id: company }` antes de poder mostrar nada, y
el ObjectId es único y estable mientras que el nombre no. El ObjectId ya viajaba
en el link, así que no expone nada nuevo, y el backend ya no confía en ningún
parámetro del link. `company_name` va igual para poder nombrar la empresa
mientras la búsqueda responde, y como fallback si no resuelve.

Si preferís que el link no lleve el ObjectId, necesitamos un
`search-company` por `company_name` con garantía de unicidad.

---

## 4. `POST /api/admin/new_admin_user` — **retirala**

No hay ningún llamador vivo en el frontend. El único que quedaba,
`src/pages/authentication/actions/userRegistrationProcess.jsx`, era código muerto
(cero imports) y mandaba exactamente lo que la lista blanca ahora descarta:
`company`, `question`, `answer`, `role: "0"`, **`super_user: true`**,
`companiesAssigned`. Lo borramos, junto con otros dos módulos muertos del mismo
flujo:

| Archivo borrado | Qué hacía |
|---|---|
| `pages/authentication/actions/userRegistrationProcess.jsx` | único llamador de `new_admin_user`; mandaba `super_user: true` |
| `pages/authentication/actions/updateExistingUserAssignedCompany.jsx` | `PATCH /admin/admin-user/:id` con `company` (campo ya eliminado) |
| `pages/staff/FormatSettingProps.jsx` | **el único sitio que escribía `AdminUser.role`**; `PATCH /admin/admin-user/:id` con un spread completo del objeto |

Con eso, el alta de staff pasa solo por `accept-invitation`. Podés retirar la ruta.

---

## 5. Ítem 7 — de dónde sale el rol que muestra el frontend

**Ni `AdminUser.role` ni `AdminUser.role_type` se leen en ninguna parte.
Podés eliminarlos.**

Evidencia:

- `Login.jsx` resuelve compañía y rol con
  `POST /company/search-company { "employees.user": <email> }` y toma
  `activeCompanies[0].role` / `.roleType` — o sea, **`Company.employees[]`**, la
  misma fuente que aplica `authorizeMongoPermission`. La respuesta de login solo
  aporta identidad y token.
- `resolveRoleType(user)` (`src/config/roles.js`) opera sobre ese objeto de
  Redux, no sobre el documento de AdminUser.
- La tabla de staff (`MainAdminSettingPage.jsx`) pinta `data.role` de
  `company.employees[]`; de `adminUserInfo` solo usa el teléfono.
- `entire` sí se guarda entero en `admin.user.data`, así que `entire.role` queda
  almacenado — pero no hay ningún lector.
- Los `role_type` que quedan en el código son del payload SQL de
  `company_staff` (`UpdateRoleInCompany.jsx`, `useRoleReassignment.js`), no de
  AdminUser.

Follow-up que mencionás en §6: `nodeMailer/notifications.js:806` usa
`adminUser.role` para mostrar el rol en un email. Ese sí necesita recibir el rol
de la membresía; desde el frontend no lo podemos alimentar.

---

## 6. Ítem 8 — campos que el frontend manda a los PATCH de admin

### `PATCH /api/admin/profile/:id`

**Solo `{ online: true }`.** Dos call sites, ambos inmediatamente después del
login:

| Archivo | Body |
|---|---|
| `pages/authentication/Login.jsx:179` | `{ online: true }` |
| `pages/authentication/multipleCompanies/Modal.jsx:77` | `{ online: true }` |

La lista blanca puede ser literalmente `{ online }`. Nada más pasa por ahí.

### ⚠️ Ojo: el mass assignment que sí usamos es otro

`PATCH /api/admin/admin-user/:id` es el que el frontend usa de verdad para el
perfil, y tiene el mismo problema que describís en §7.1. Campos que le mandamos,
ya sin los tres módulos muertos borrados:

| Archivo | Body |
|---|---|
| `pages/Profile/my_details/components/Body.jsx` | `name`, `lastName`, `email`, `phone`, `imageProfile` |
| `pages/Profile/my_details/components/Body.jsx` (quitar foto) | `imageProfile: null` |
| `pages/staff/detail/.../updateContactComponents/components/Body.jsx` | `name`, `lastName`, `email`, `phone`, `imageProfile?` |

Lista blanca sugerida: `name`, `lastName`, `email`, `phone`, `imageProfile`.

Y un tercero, para `companiesAssigned`:

| Archivo | Endpoint | Body |
|---|---|---|
| `pages/authentication/InvitationLanding.jsx` | `PATCH /api/staff/edit-admin/:id` | `multipleCompanies: true`, `companiesAssigned: [...]` |

---

## 7. Lo que queda del lado del frontend

- **Ítem 6 (QA manual):** falta abrir `GET /api/admin/activity-logs` con un
  usuario no-`super_user` con membresía y confirmar que ya no da 403.
- Ninguno de estos cambios toca el envío de `x-company-id`: `buildRouteScopedHeaders`
  (`src/api/sessionHeaders.js`) ya lo agrega a todo `/api/(staff|admin|company|stripe)`,
  y `/api/admin/activity-logs` cae ahí. Sin cambios.
- De paso se quitaron dos `console.log` en `persistCompanyHeaders` que imprimían
  el `companyId` y el `company_id` SQL en la consola en cada login.
