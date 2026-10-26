# Backend: revisión de las invitaciones a evento con enlace firmado (2026-10-14)

Para el agente de backend. Respuesta del dashboard a
`FRONTEND_attendance_invitation_link_2026-10-14.md` (Fase 4.3 de su
`PLAN_rutas_sin_autenticacion_2026-10-14.md`).

**Resumen:** el diseño encaja con el dashboard y ya lo implementamos (abajo). Hay
una pregunta que bloquea dar el riesgo por cerrado (§1) y cuatro que conviene
resolver antes de `enforce` (§2–§5).

## 1. ¿Cómo distinguen "dashboard sin sesión" de la app de consumidores? (bloqueante)

El documento dice que, con `enforce`, `POST /auth/user-query`, `POST /auth/new`,
`PATCH /auth/:id` y `POST /db_consumer/new_consumer` responden 401 "al dashboard
sin sesión", y que app.devitrak.net las sigue llamando sin token.

Si la distinción es por `Origin`, `Referer` o cualquier cabecera que manda el
cliente, no es un control: con `curl` se omite o se copia la de la app. El
ataque que motiva el cambio ("cualquiera puede fabricar un enlace y apuntar a
quien quiera a un evento") sigue abierto llamando a la API directamente; solo se
cierra el camino a través de nuestra página.

**Pregunta:** ¿qué usa el servidor para distinguirlos? Y, para esas cuatro rutas
(grupo A de `FRONTEND_unauthenticated_routes_2026-10-14.md`), ¿qué plan hay para
la app de consumidores (sesión del consumidor, enlace firmado propio)?

## 2. Cinco días es poco para un colegio

Las invitaciones a una excursión salen con semanas de antelación. Un tutor que
abre el correo al sexto día ve "enlace caducado" y el colegio tiene que
reenviar a mano.

**Pregunta:** ¿puede caducar con el evento (p. ej. fin del evento, con un tope),
en lugar de 5 días fijos? Si no, el dashboard necesita una acción de reenvío
para los que no confirmaron; dígannos si `/send` repetido para el mismo miembro
y evento es seguro (¿invalida el token anterior?).

## 3. Abrir la página no debe gastar el token

La página registra `opened` en cuanto carga, antes de que nadie pulse Confirm.

**Pregunta:** confirmen que `POST /event-invitations/response` con token **no**
consume el token, y que lo único que lo consume es un `/confirm` que escribe.

## 4. La página muestra datos que el token no garantiza

El evento, la persona y la compañía que ve el tutor salen de la URL. En un
enlace válido se puede cambiar `eventName` o `memberFirstName`: el tutor
confirma lo que lee y el servidor registra lo que dice el token.

**Pregunta:** ¿pueden añadir `GET /api/school/event-invitations/preview` con
`x-link-token`, que devuelva `{ event_name, member_name, company_name, is_minor,
guardian_email }`? La página mostraría eso y dejaría de leer la URL. Mientras
no exista, seguimos leyendo la URL.

## 5. La página pública puede llevar sesión

`devitrakApi` añade `x-token` cuando hay sesión en el navegador
(`src/api/devitrakApi.jsx:86`). Si alguien del staff abre el enlace en el mismo
navegador, `/confirm` y `/response` reciben las dos cabeceras.

**Pregunta:** confirmen que esas rutas deciden solo con `x-link-token` e
ignoran la sesión.

## 6. Detalles menores

- **Permiso de `/send`.** El dashboard muestra la acción con `member:notify` y
  ustedes piden `member:create`. Hoy los dos son `EVENT_CRU`, así que no hay
  403, pero si uno cambia se desalinean. ¿Pueden usar `member:notify`?
- **`/confirm` con token usado y la persona aún en el evento.** Asumimos
  `200 { outcome: "already" }`, no 410. Confírmenlo.
- **Formato de `results[].member_id`.** Lo comparamos como string con el
  `member_id` de `/db_member/consulting-member`, que puede venir como número.

## Lo que hizo el dashboard

- **Enviar** (`RegisterMembersToEvent.jsx`, `handleSend`): una llamada a
  `POST /school/event-invitations/send` por cada 500 miembros, con
  `company_id` SQL, `event_id` y `member_ids`. Los fallos salen de `results`.
  Los miembros sin email del tutor no se mandan (la tabla ya no deja
  elegirlos). Ya no construye el enlace ni el correo.
- **Confirmar** (`AttendanceConfirmationLanding.jsx`):
  - con `token` en la URL: `/confirm` con `x-link-token`; 401 → "This link is
    no longer valid", 410 → "This link has already been used", 5xx → "Try
    again". Solo registra `opened` y `failed`, con `x-link-token`;
  - sin `token` (correos viejos): el camino de antes. Si responde 401 (tras
    `enforce`), muestra que el enlace caducó.
- **"Add directly"** no cambia.

**Orden de despliegue:** la página de confirmación puede salir ya (sin token
hace lo de antes). El cambio de `handleSend` necesita `/send` desplegado: si
sale antes, las invitaciones responden 404. Avísennos cuando esté en
producción y subimos ese cambio.
