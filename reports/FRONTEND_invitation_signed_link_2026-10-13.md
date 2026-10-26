# Respuesta a las peticiones 4, 5 y 6: CORS, invitación firmada y companiesAssigned (2026-10-13)

Servidor: rama `release/observabilidad`. **Sin desplegar.** Los puntos 5 y 6
cambian el contrato: servidor y dashboard tienen que salir a la vez.

## 4. `x-mfa-setup-token` en CORS: hecho

`config/cors.js` ya acepta `x-mfa-setup-token`. Pueden volver a mandarlo en esa
cabecera; `x-token` sigue funcionando para el mismo token, así que no es
obligatorio cambiar nada.

## 5. `accept-invitation` sin autenticación: cerrado con un enlace firmado

Mismo patrón que el reset de contraseña: el enlace lo arma y lo firma el
**servidor** y solo viaja en el correo. Quien lo abre demuestra que controla el
buzón invitado.

### Normas

1. **Sin `invitationToken` no se acepta ninguna invitación.** Saber el email
   invitado y la compañía ya no basta.
2. **El email y la compañía salen del token.** `user.email` y
   `company.company_name` del body se ignoran.
3. **El enlace vale 7 días y un solo uso.** Una vez aceptada (`Confirmed`),
   responde `409`. Si quitan la invitación de `Company.employees`, responde
   `404`.
4. **El cliente ya no arma el enlace.** El `link` que mande a `new_invitation`
   se descarta.
5. **El rol sigue saliendo de la invitación**, nunca del body.

### `POST /api/nodemailer/new_invitation` (con sesión)

Mismo body que hoy. Cambia lo siguiente:

- Exige **sesión y `x-company-id` verificado** (el de quien invita). Sin eso:
  `401`.
- `consumer` (el email invitado) tiene que tener una invitación **pendiente**
  en `Company.employees` de esa compañía. Si no la hay, o ya está
  `Confirmed`: `404`. Es decir, primero el `PATCH update-company` con el
  empleado nuevo y **después** el correo, que es el orden que ya usan
  `NewStaffMember.jsx` y `EditingStaff.jsx`.
- El enlace que se envía:
  `https://admin.devitrak.net/invitation?first=…&last=…&email=…&company=<id>&company_name=…&token=<jwt>`
  Mismos parámetros que hoy más `token`. `first` y `last` salen de la
  invitación guardada. El origen lo define `FRONTEND_URL` en el servidor.

### `POST /api/registration/accept-invitation` (sin sesión)

```json
{ "invitationToken": "<?token= del enlace>",
  "user": { "name": "…", "lastName": "…", "password": "…" } }
```

- `password` solo para cuentas nuevas, igual que hoy.
- `user.email`, `company.company_name` y `mfaCode` se pueden seguir mandando,
  pero **el servidor no los usa**. El código MFA del usuario existente no se
  verifica: el enlace ya prueba la identidad, y sin contraseña el enlace no da
  acceso a la cuenta. Si quieren, pueden quitar ese paso.

| Respuesta | Cuándo | Qué mostrar |
|---|---|---|
| `201` | Cuenta nueva creada y unida a la compañía | Ir a `/login` (allí activará MFA) |
| `200` | Cuenta existente unida a la compañía | Ir a `/login` |
| `400` + `invitationLinkInvalid: true` | Sin token, token falso o caducado (más de 7 días) | "La invitación no es válida o caducó. Pide una nueva a tu administrador." |
| `409` + `invitationAlreadyAccepted: true` | Ya se aceptó con ese enlace | "Ya aceptaste esta invitación. Inicia sesión." |
| `404` | Invitación retirada, o la compañía ya no existe | El `NO_INVITATION_MESSAGE` actual |

## 6. `companiesAssigned`: ahora lo actualiza el servidor

Al aceptar, el servidor añade la compañía a `companiesAssigned` de la cuenta
(nueva o existente):

```json
{ "company": "<company_name>", "active": true, "super_user": false,
  "role_type": "<rol de la invitación>", "role": "<role de la invitación>" }
```

- No duplica: si la compañía ya estaba, no hace nada.
- `multipleCompanies` pasa a `true` cuando la cuenta ya tenía otra compañía.
- `role` es el número que guardó quien invitó en `Company.employees[].role`.
- Si esta escritura falla, la aceptación **no** falla (queda en el log).

El dashboard **no** tiene que volver a llamar a `PATCH /staff/edit-admin` tras
aceptar.

## Cambios en pantallas

| Pantalla | Cambio |
|---|---|
| `InvitationLanding.jsx` | Leer `token` de la URL y mandarlo como `invitationToken`. Manejar `invitationLinkInvalid` y `invitationAlreadyAccepted`. Si no hay `token` en la URL (enlace viejo), mostrar directamente que pida una invitación nueva |
| `NewStaffMember.jsx`, `EditingStaff.jsx` | Ninguno obligatorio. Pueden dejar de construir `link` (`buildInvitationLink`), porque se ignora. Deben seguir mandando `x-company-id` |
| `utils/invitationAcceptance.js` | `buildAcceptInvitationPayload` con `invitationToken`. `buildCompanyAssignment` ya no hace falta |

## Despliegue

- **Invitaciones enviadas antes del despliegue no traen `token` y dejan de
  funcionar.** Hay que reenviarlas. Para reenviar una invitación pendiente
  basta con volver a llamar a `new_invitation`: el empleado ya está en
  `Company.employees`.
- Servidor y dashboard a la vez.
