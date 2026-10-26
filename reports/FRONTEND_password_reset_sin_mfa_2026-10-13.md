# Reset de contraseña para cuentas sin MFA activa (2026-10-13)

Servidor: commits `5d87d1c` y `6b43863` en `release/observabilidad` (aún sin
desplegar). Complementa a `FRONTEND_password_reset_mfa_2026-10-13.md`.

## Normas del proceso

1. **Ninguna contraseña cambia sin un código MFA válido.** Esto aplica también
   a las cuentas que todavía no tienen MFA: primero la activan y después
   cambian la contraseña.
2. **Una cuenta sin MFA activa recibe siempre `403 mfaSetupRequired`**, mande o
   no `mfaCode`. Es la señal para pedirle que active MFA y vuelva a enviar la
   solicitud. Nunca se le pide el código antes de que la tenga activa.
3. **Sin sesión, solo el enlace del correo permite activar MFA.** Ese enlace lo
   genera y firma el servidor. Quien lo abre demuestra que controla el buzón,
   y solo entonces el servidor entrega el `mfaSetupToken` para activar MFA.
4. **Conocer un email no basta para nada.** Sin el enlace firmado, la respuesta
   no trae `mfaSetupToken`. Así nadie puede registrar su propia app de
   autenticación en una cuenta ajena y luego cambiarle la contraseña.
5. **El enlace vale 1 hora y un solo uso.** Deja de valer en cuanto la
   contraseña cambia. Para un nuevo intento hay que pedir otro correo.
6. **El cliente ya no arma el enlace.** El `linkToResetPassword` que mande el
   dashboard se ignora.
7. **Al cambiar la contraseña se cierran todas las sesiones de esa cuenta**
   (los tokens anteriores dejan de valer). La persona vuelve a entrar por
   `/login` con su contraseña nueva y su código MFA.

## Flujo completo: cuenta sin MFA que olvidó su contraseña

```
ForgotPassword
  POST /api/nodemailer/reset-admin-password  { contactInfo: { email } }
  → 202 (el servidor envía el correo con el enlace firmado)

Correo → /reset-password?token=<jwt>&uid=<id>&email=<email>&stamp-time=<ISO>

ResetPassword (sin sesión)
  1. La persona escribe la contraseña nueva.
  2. PATCH /api/admin/update-password  { resetToken, password }
     → 403 { mfaSetupRequired: true, mfaSetupToken }
  3. Abrir el modal de configuración de MFA con ese token:
       POST /api/admin/mfa/generate     header x-mfa-setup-token: <mfaSetupToken>
       → { secret, qrCode }
       POST /api/admin/mfa/verify       header x-mfa-setup-token  { token: "<código>" }
       → { ok: true, reloginRequired: true }
     ⚠ Aquí NO ir a /login (ignorar reloginRequired en este flujo): la
       contraseña todavía no se cambió.
  4. Pedir un código MFA y reenviar:
     PATCH /api/admin/update-password  { resetToken, password, mfaCode }
     → 201
  5. Ir a /login.
```

Para una cuenta **con** MFA, el paso 2 ya pide el código (`403 mfaRequired`)
y se salta el paso 3.

## Endpoints

### `POST /api/nodemailer/reset-admin-password` (sin token)

| Campo | Uso |
|---|---|
| `contactInfo.email` | **Obligatorio.** El servidor busca la cuenta con este email |
| `linkToResetPassword`, `link` | **Se ignoran.** El servidor arma el enlace |
| `adminUser`, `contactInfo.company` | Se pueden seguir mandando; no afectan |

| Respuesta | Cuándo |
|---|---|
| `202 { ok: true, notification: "Email queued", jobId }` | Cuenta encontrada, correo encolado |
| `202 { ok: true, notification: "Email queued" }` | Email sin cuenta. No se envía nada; la respuesta es igual a propósito |
| `400` | Falta `contactInfo.email` o no es texto |

El enlace del correo lleva `token`, `uid`, `email` y `stamp-time`. El origen
lo define `FRONTEND_URL` en el servidor (por defecto `https://admin.devitrak.net`).

### `PATCH /api/admin/update-password` (sin token)

```json
{ "resetToken": "<?token= del enlace>", "password": "nueva", "mfaCode": "123456" }
```

Desde `/reset-password` hay que mandar **`resetToken`**. Si llega, la cuenta
sale del token y `uid` y `email` se ignoran. `password` debe tener al menos 6
caracteres. `mfaCode` se omite en el primer envío si la cuenta no tiene MFA.

| Respuesta | Cuándo | Qué hacer |
|---|---|---|
| `201` | Contraseña cambiada | Ir a `/login` |
| `403` `mfaSetupRequired: true` + `mfaSetupToken` | Cuenta sin MFA y enlace válido | Abrir el modal de MFA con `x-mfa-setup-token`; al terminar, reenviar con `mfaCode` |
| `403` `mfaSetupRequired: true` sin `mfaSetupToken` | Cuenta sin MFA y sin `resetToken` (por ejemplo, un envío por `email`) | Explicar que debe activar MFA y volver a intentarlo desde el enlace del correo. No abrir el modal: fallaría |
| `403` `mfaRequired: true` | La cuenta tiene MFA y falta `mfaCode` | Pedir el código |
| `400` `resetLinkInvalid: true` | Enlace falso, caducado (más de 1 hora) o ya usado | "El enlace no es válido o caducó. Pide uno nuevo." y llevar a ForgotPassword |
| `400` "Invalid email or MFA code" | Código incorrecto | Pedir el código otra vez |
| `400` (otro) | Contraseña de menos de 6 caracteres | Validación del formulario |

### `POST /api/admin/mfa/generate` y `POST /api/admin/mfa/verify`

Sin cambios. Aceptan el `mfaSetupToken` en `x-mfa-setup-token`, igual que tras
el login. El token dura **15 minutos**. Si caduca, basta con reenviar el
`update-password` del paso 2 para recibir uno nuevo (el enlace sigue valiendo
mientras no pase la hora).

`mfa/generate` responde `409` si la cuenta ya tiene MFA activa. Puede pasar si
la persona activó MFA en otra pestaña; en ese caso, pedir el código y seguir
al paso 4.

## Cambios en pantallas

| Pantalla | Cambio |
|---|---|
| `authentication/ForgotPassword.jsx` | Ninguno obligatorio. Puede dejar de construir `linkToResetPassword`, porque se ignora |
| `authentication/ResetPassword.jsx` | Leer `token` de la URL y mandarlo como `resetToken` en todos los `update-password`. Manejar `mfaSetupToken` (abrir el modal, ya implementado) y `resetLinkInvalid`. Tras `mfa/verify`, no navegar a `/login`: reenviar con `mfaCode` |
| `Profile/my_password` | Sin cambios. Con sesión iniciada la cuenta ya tiene MFA (es obligatoria para entrar) |
| `InvitationLanding.jsx` (usuario existente) | Sin cambios. Tras aceptar va a `/login`, y el login con contraseña ya entrega el `mfaSetupToken` a una cuenta sin MFA |

Enlaces enviados **antes** del despliegue no traen `token`. Con ellos, una
cuenta sin MFA recibe el `403` sin `mfaSetupToken`. Hay que mostrar que pida un
correo nuevo.

## Despliegue

- Servidor y dashboard **a la vez**. Si el servidor sale primero,
  `/reset-password` no manda `resetToken` y ninguna cuenta sin MFA puede
  completar el reset.
- Comprobar que `FRONTEND_URL` del servidor apunta al dashboard de producción.

## Preguntas frecuentes

**¿Por qué no se entrega el `mfaSetupToken` con solo el email?**
Porque cualquiera podría escribir el email de otra persona, registrar su propia
app de autenticación y cambiarle la contraseña. El enlace firmado demuestra que
quien pide el cambio recibió el correo.

**¿Puede usarse el mismo código de `mfa/verify` en el paso 4?**
Sí, si no han pasado 30 segundos, pero es más claro pedir un código nuevo.

**¿Qué pasa si la persona no recibe el correo?**
Es el caso de siempre del correo (spam, bloqueos de Outlook). Sin el enlace, la
cuenta sin MFA no puede restablecer la contraseña por su cuenta; necesita a un
administrador.
