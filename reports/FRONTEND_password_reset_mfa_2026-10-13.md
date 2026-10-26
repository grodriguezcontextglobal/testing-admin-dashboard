# Contraseñas: reset con MFA y fin del hash en el cliente (2026-10-13)

## Por qué

- `GET /api/staff/__staff-search` era anónima y devolvía **todos** los usuarios
  **con el hash de su contraseña**. Cualquiera podía descargarlos.
- `PATCH /api/admin/update-password` cambiaba la contraseña de cualquier cuenta
  sabiendo solo el email.
- El enlace del reset se validaba en el navegador (`stamp-time`), así que se
  podía fabricar.
- "Mi contraseña" y la verificación de firma comparaban la contraseña actual
  contra el hash **en el navegador** (`compareSync`).

**Desplegar el servidor y el dashboard a la vez:** sin los cambios de abajo,
las 5 pantallas afectadas fallan.

## Cambios de contrato

### 1. `PATCH /api/admin/update-password` (sigue sin token)

```json
{ "uid": "<id del enlace>" , "password": "nueva", "mfaCode": "123456" }
{ "email": "a@b.com",        "password": "nueva", "mfaCode": "123456" }
```

Hay que mandar `uid` o `email`, más `password` (mínimo 6 caracteres) y `mfaCode`
(el código de la app autenticadora).

| Respuesta | Cuándo | Qué mostrar |
|---|---|---|
| `201` | Contraseña cambiada | Ir a login. **Las sesiones abiertas de esa cuenta quedan cerradas** (se invalidan los tokens) |
| `403` + `mfaRequired: true` | Falta `mfaCode` | Pedir el código |
| `400` "Invalid email or MFA code" | Código incorrecto **o** cuenta inexistente (misma respuesta a propósito) | "Código o cuenta no válidos" |
| `403` + `mfaSetupRequired: true` | La cuenta no tiene MFA configurada | "Tu cuenta no tiene MFA; contacta a un administrador" |
| `400` | Falta `uid`/`email` o la contraseña tiene menos de 6 caracteres | Validación |

### 2. `GET|POST /api/staff/__staff-search` (sigue sin token)

- **Ahora exige `email`:** en el body para el POST, en `?email=` para el GET.
  Sin email responde `400`; ya **no** devuelve la lista completa.
- La respuesta mantiene la misma forma, `{ ok, adminUsers: [...] }`, pero cada
  usuario trae **solo** estos campos: `id`, `name`, `lastName`, `email`,
  `imageProfile`, `active` y `companiesAssigned`.
- La búsqueda es por email exacto. Se quitan los espacios de los extremos; las
  mayúsculas no se normalizan.

### 3. `POST /api/admin/verify-password` (NUEVA, con token)

```json
{ "password": "contraseña actual" }   →   { "ok": true, "valid": true | false }
```

Comprueba la contraseña **del usuario del token**. Sustituye a todo
`compareSync` del cliente.

### 4. `password` ya no viene en ninguna respuesta

Esto afecta a `/staff/admin-users`, `entire` del login y cualquier `AdminUser`
que devuelva el servidor. Todo código que lea `.password` de un usuario recibe
`undefined`.

## Pantallas a cambiar

| Pantalla | Hoy | Cambio |
|---|---|---|
| `authentication/ForgotPassword.jsx` | `GET /staff/__staff-search` (lista entera) y busca el email en el cliente | `POST /staff/__staff-search` con `{ email }`; usar `adminUsers[0].id` para el enlace |
| `authentication/ResetPassword.jsx` | Baja la lista para sacar el email del `uid`; valida `stamp-time` en el cliente | No pedir la lista. Mandar `{ uid, password, mfaCode }` a `update-password`. `stamp-time` ya no protege nada (puede quedarse como aviso de caducidad, pero no es seguridad) |
| `Profile/my_password/components/Body.jsx` | `POST /staff/admin-users` + `compareSync` contra el hash | Pedir el código MFA y mandar `{ email, password, mfaCode }` a `update-password`. Si además quieren pedir la contraseña actual: `POST /admin/verify-password` |
| `signatureVerificationDocuments/StaffMember.jsx` | `compareSync(current_password, staffMemberInfo.password)` | `POST /admin/verify-password` y usar `valid` |
| `InvitationLanding.jsx`, `Registration.jsx` | `POST /staff/__staff-search` con `{ email }` | **Sin cambios**, siguen funcionando (solo usan campos públicos) |

Cuando el login se pida otra vez después de un `201` en `update-password`, no
habrá conflicto de "sesión activa": el servidor borra la sesión al cambiar la
contraseña.
