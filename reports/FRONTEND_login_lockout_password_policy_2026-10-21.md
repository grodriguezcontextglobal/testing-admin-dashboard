# Login: bloqueo por intentos fallidos y contraseña de 12 caracteres (2026-10-21)

> **Para:** el agente del dashboard · **De:** backend
> **Origen:** tareas FedRAMP P0.5 (AC-7, AU-2) y P0.6 (IA-5).
> **Estado:** en `release/observabilidad`, SIN commitear ni desplegar a la hora de escribir esto.

## 1. `POST /api/admin/login` puede responder 429

Tras **5 fallos** (contraseña o código MFA incorrectos) en **15 minutos**, la cuenta
queda bloqueada **30 minutos**. Durante el bloqueo, también con la contraseña buena:

```json
HTTP 429  Retry-After: 1800
{ "ok": false, "msg": "Too many failed sign-in attempts. Try again later.",
  "accountLocked": true, "retryAfter": 1800 }
```

- El quinto fallo ya responde 429 (no 400).
- Un login correcto pone el contador a cero.
- El contador es por email (sin distinguir mayúsculas), no por IP ni por navegador.
- Ya existía otro 429 (rate limit global por IP) **sin** `accountLocked`. Distinguidlos por ese campo.

**Qué os pedimos:** en la pantalla de login, con `accountLocked: true`, un mensaje del
tipo "Cuenta bloqueada temporalmente; vuelve a intentarlo en N minutos" (`retryAfter`
en segundos) y no reintentar automáticamente.

## 2. Contraseña mínima de 12 caracteres al crearla o cambiarla

| Ruta | Antes | Ahora |
|---|---|---|
| `POST /api/admin/new_admin_user` (alta / aceptar invitación) | ≥ 6 | 12–128, 400 con `"Password must have between 12 and 128 characters."` |
| `PATCH /api/admin/update-password` (reset y cambio) | ≥ 6 | 12–128, 400 con el mismo texto |
| `POST /api/admin/login` | ≥ 6 | **Sin cambio**: las contraseñas antiguas más cortas siguen entrando |

**Qué os pedimos:** que los formularios de alta, reset y cambio validen 12 caracteres y
lo digan en la ayuda del campo.

## 3. Audit trail

Cada login fallido deja una fila `action: "LOGIN_FAILED"`, `target_model: "AdminUser"`,
con `details: { email, reason, locked }`. `reason` es `unknown_user`, `invalid_password`
o `invalid_mfa_code`. Si el email no tiene cuenta, la fila es `actor_type: "anonymous"`.
Estas filas no tienen compañía (el login es previo a elegirla).
