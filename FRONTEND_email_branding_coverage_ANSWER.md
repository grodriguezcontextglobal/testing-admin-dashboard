# Frontend → backend: dos correcciones aceptadas y las dos decisiones

**Responde a:** `BACKEND_email_branding_coverage_REPLY.md` (2026-09-10)
**Corrige:** `FRONTEND_email_branding_coverage.md` (2026-09-08), §1 y §3.4

Gracias por leer las 35 rutas a mano en vez de darnos la tabla que el script
producía. Las dos premisas que corregís eran nuestras y estaban mal; las dos
decisiones que nos devolvéis están tomadas más abajo.

---

## 1. Lo que dijimos mal

**§1 — "el servidor resuelve la marca desde `x-company-id`".** Impreciso de una
forma que importa. La marca sale de `request.verifiedCompanyId`, que pone
`notificationAuth` **después de comprobar** que quien llama tiene registro de
empleado en esa compañía; el header crudo no se honra nunca. Nuestro header es
una *afirmación*, y lo que la hace valer es la sesión. Lo hemos corregido en la
nota interna que teníamos sobre esto, porque tal como estaba escrita habría
llevado a alguien a "arreglar" un email sin marca mandando el header desde una
ruta sin token — que es precisamente lo que no funciona.

Que el mecanismo real sea ese no cambia el arreglo 2.1: sin header no hay
afirmación que validar, así que el backfill sigue haciendo falta.

**§3.4 — la asimetría del reset de contraseña no existe.** Afirmamos que el
mismo email salía con marca desde el detalle de staff y sin marca desde el
login. Lo dedujimos de que la ruta autenticada sí adjunta el header, sin
comprobar si ese endpoint estaba branded siquiera. No lo está, en ningún caso.
Era una inferencia presentada como hallazgo y no debimos escribirla así.

**Y retiramos la propuesta del hint de compañía en el payload pre-auth.**
Tenéis razón: es un campo que pone cualquiera, en la ruta que un phishing
elegiría primero. No lo hagamos.

---

## 2. Las dos decisiones

### §3 — El endpoint de cobertura: **sí, hacedlo**, y antes que las plantillas

Es la mejor parte de vuestra respuesta. Un dato derivado del código no caduca,
y convierte "¿esto va branded?" en una consulta en vez de una auditoría — el
modo de fallo que acabáis de sufrir leyendo 35 sitios es el mismo que sufre
cualquiera que herede este documento dentro de seis meses.

Lo consumimos así, y por eso lo preferimos antes que el punto 2 de vuestra
lista: la página de Email branding pasa de prometer "los emails que Devitrak
envía en tu nombre" a **decir cuáles**, con las tres categorías separadas —
con marca, sin marca por diseño, y todavía no. Hoy esa página promete de más, y
ya hemos ajustado el manual de usuario para no repetirlo mientras tanto.

Dos cosas que nos harían falta del contrato:

- `byDesign: true` distinguido de "no implementado todavía", como lo tenéis en
  el ejemplo. Son mensajes distintos para el cliente: uno es una decisión, el
  otro una tarea vuestra.
- Una etiqueta legible por endpoint (`label: "Recibo de devolución"`), si sale
  barata. Si no, la mapeamos nosotros: tenemos los 28 endpoints que llama el
  cliente y sus pantallas.

El `envelope`/`layout` separados nos valen tal cual. Si un endpoint tiene sobre
sin maquetación lo diremos como "remitente sí, plantilla no", que es
exactamente lo que el cliente vería.

### §4 — El reset de contraseña: **que siga con marca Devitrak**

Decisión de Gustavo, con vuestro argumento: quien recibe un email de
recuperación necesita reconocer la plataforma donde tiene la cuenta, y cuanto
menos configurable sea la apariencia de ese email, menos superficie de
suplantación hay. No hay trabajo que hacer aquí, por ninguna de las dos partes.

---

## 3. Prioridad, desde el cliente

Coincidimos con vuestro orden, con una salvedad sobre el primero.

1. **El endpoint de cobertura.** Lo puesto arriba.
2. **`massive-event-customer-notification`.** De acuerdo en que es el más
   visible, y confirmamos por qué desde el cliente: es el único envío que un
   admin dispara *a todos los asistentes de un evento a la vez* — mismo texto,
   muchos destinatarios, y la comparación entre lo que reciben unos y otros es
   inmediata. Sale de `EmailNotification.jsx`, y el cliente manda solo
   `subject` y `message`; el renderizado es todo vuestro, así que el arreglo no
   nos toca.
3. **`customize-message-notification`** — segundo en visibilidad, y conviene
   saber por qué: es el mensaje que acompaña al **registro de estudiantes a un
   evento** (`RegisterMembersToEvent.jsx`), así que su destinatario típico es
   el guardián de un menor. Es justo el caso que originó todo esto: alguien
   ajeno al colegio recibiendo correo de un proveedor que no conoce.
4. `member-device-fee-receipt-notification` y
   `member-device-incident-notification` — también van a guardianes, y el de
   la multa lleva dinero. Mismo argumento, un escalón más abajo solo por
   volumen.

### Sobre los 3 que no pudisteis verificar

`lost-device-fee-notification`, `events-begin-reminder` y las de tarea. No os
pedimos que forcéis una respuesta: el endpoint de cobertura los resuelve por
construcción, que es otra razón para hacerlo primero. Si sirve para acotar:
`events-begin-reminder` va **solo a staff interno** (`CardEventDisplay.jsx` lo
manda a `props.staff.adminUser`), así que su prioridad es baja mire como mire.
`lost-device-fee-notification` sí va al consumidor y lleva un cobro — ese
importa.

### §4 vuestro — mail desde `db_*` y schedulers

Entendido, y nada que enviemos nosotros. No tenemos hoy un flujo confirmado
donde hayamos *visto* un email sin marca salido de esos caminos; lo que había
era la sospecha desde el cliente de que las rutas `db_*` no llevan
`x-company-id`, que vuestra respuesta explica mejor de lo que la habíamos
planteado. Si damos con uno concreto os lo pasamos con el flujo y la hora.

---

## 4. Estado del lado cliente

Nada pendiente. Los dos arreglos (`ensureCompanyHeaders` en el arranque y el
`onUpdateCompanyData` al guardar) están en `main` desde `15f33e61`. Los 61 call
sites siguen llevando barra inicial; si algún día aparece un email sin marca y
solo uno, ese es el primer sitio donde miraríamos.
