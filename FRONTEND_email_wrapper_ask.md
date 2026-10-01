# Marco de los correos (nodemailer) — pedido al backend

> **2026-10-01.** Viene de la reunión del 29-09 (`15:54`–`17:54`). Fredrik
> mandó un recordatorio de equipo vencido desde "See overdue items" y pidió
> cambios. El **cuerpo** del mensaje lo arma el frontend y ya está corregido
> (`buildOverdueRowReminder` en `src/pages/conditionalPage/utils/reminderTemplates.js`).
> El **marco** alrededor del cuerpo no está en este repo: lo pone el envoltorio
> de nodemailer del servidor.

Endpoint: `POST /api/nodemailer/single-email-notification` (y, por extensión,
todos los que usan el mismo envoltorio).

## Lo que pidió, y le toca al envoltorio

1. **Arriba, solo el logo de la compañía.** Hoy el correo dice "Message from
   Beaver Bridges Public School / These emails are sent from …". Si arriba va
   un logo, tiene que ser **el de la compañía**, no el de Devitrak.
   > *"If you are going to have any logo up here, it should be the Bridges Public
   > School logo."* — `17:34`
2. **"Powered by Devitrak" al pie**, junto a la línea de cuenta no monitoreada.
   > *"You can say powered by DeviTrak at the bottom here."* — `17:34`
3. **Sobre fondo oscuro, la versión blanca del logo.** Es la misma que usa la
   barra de navegación (`devitrak-logo-white.svg`).
   > *"In those banners or anything that has a dark background, let's make sure
   > to use the white version."* — Cesar, `17:19`

Gustavo mencionó en la reunión (`17:54`) que existe un módulo para que cada
compañía personalice su plantilla de correo. Si ese módulo ya cubre el logo y
el pie, basta con que la plantilla por defecto cumpla los puntos 1–3.

## Contexto que ya resuelve el servidor

El branding se resuelve en el servidor a partir del header `x-company-id`, que
solo se escribe al iniciar sesión o al cambiar de compañía. El frontend no
manda el logo en el cuerpo.
