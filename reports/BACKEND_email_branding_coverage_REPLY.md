# Backend → frontend: cobertura de branding en emails

**Responde a:** `FRONTEND_email_branding_coverage.md` (2026-09-08) · **Fecha:** 2026-09-10
**Código revisado:** `nodeMailer/branding.js`, `nodeMailer/queueEmail.js`, `nodeMailer/notifications.js`, `nodeMailer/returningDeviceMessage.js`, `routes/nodeMailer.js`

Gracias por el inventario de los 61 call sites: ahorra la mitad del trabajo y el
aviso sobre `"nodemailer/x"` sin barra inicial es exactamente el modo de fallo
correcto para "falta el branding en un solo email".

Dos de vuestras premisas son incorrectas y conviene corregirlas antes de
responder, porque cambian lo que hay que hacer del lado cliente. Y aviso de
entrada sobre §1: **el header no es el mecanismo**, es solo una de las dos
fuentes.

---

## Resumen

| Vuestra pregunta | Respuesta corta |
|---|---|
| §3.1 ¿qué endpoints van con branding? | 24 de 35 completos. Lista de los que no, abajo — con la salvedad de que 3 de ellos requieren revisión individual |
| §3.2 ¿`branding-preview/templates` es el conjunto branded? | **No.** Son 6 muestras representativas de 24. Propuesta mejor que igualar las listas: exponer la cobertura como dato |
| §3.3 ¿mail desde rutas no-`/nodemailer`, cron, cola? | **Sí resuelven branding**, y no por el header. Necesitan el `company_id` de **Mongo** o el `company_name` en el payload interno. Ojo: el id de `db_*` es el de SQL y **no sirve** |
| §3.4 pre-auth sin header | Es **deliberado**, y vuestra propuesta de mandar un hint reabriría el agujero que el diseño cierra. Además la asimetría que describís **no existe** |

---

## §0 — Cómo se resuelve el branding, que es lo que hace falta para leer el resto

Dos niveles independientes, y vuestra pregunta los mezcla:

1. **El sobre** — `applyBrandedEnvelope` (`branding.js:271`): cambia el
   from-name y añade un Reply-To que llega al cliente. La dirección de envío
   sigue siendo `noreply@devitrak.com` a propósito: es el remitente verificado
   en SendGrid y el dominio con los registros SPF/DKIM; cambiarlo por el
   dominio del cliente manda el correo a spam.
2. **La maquetación** — el chasis `renderBrandedEmail` (`emailLayout.js`) y los
   builders que reciben `branding` como parámetro y pintan con su paleta y su
   logo.

Y el interruptor es **opt-in por endpoint**: `createQueuedEmailController(builder,
{ branded: true })` (`queueEmail.js:34-45`). Con el flag, el controller resuelve
la marca del cliente, se la pasa al builder y estampa el sobre. Sin el flag, el
email sale con la identidad de Devitrak, que para un reset de contraseña o una
alerta de plataforma es lo correcto.

De ahí que un endpoint pueda estar a medias: **flag sin plantilla preparada**
(el remitente es el del cliente, el cuerpo parece de Devitrak) o **plantilla
preparada sin flag** (nunca recibe el branding). Las dos combinaciones existen
hoy.

---

## §1 — El header no es el mecanismo, y esto importa para §3.3

`resolveBranding` (`branding.js:201`) decide así:

```js
const reference = request
  ? (request.verifiedCompanyId ? { id: String(request.verifiedCompanyId) } : {})
  : extractCompanyRef(body);
```

- **Con `request` (todo lo que entra por HTTP)**: la marca sale **solo** de
  `request.verifiedCompanyId`, que pone `middlewares/notificationAuth.js` tras
  comprobar que quien llama tiene de verdad un registro de empleado en la
  compañía que dice ser. **El `x-company-id` crudo no se honra nunca.** Si se
  confiara en él, cualquiera podría enviar correo vestido con la marca de otro
  colegio.
- **Sin `request` (llamadas en proceso: handlers de `db_*`, jobs de la cola,
  schedulers)**: se lee del payload con `extractCompanyRef`, porque no hay
  sesión que consultar y tampoco atacante.

Así que vuestro `x-company-id` sirve, pero indirectamente: lo que lo hace
efectivo es que `notificationAuth` lo valide contra la sesión. Un envío con
header y sin token válido sale con marca Devitrak.

---

## §2 — Respuesta a §3.1: los que no van con branding

**24 de 35 rutas de `routes/nodeMailer.js` están completas** (flag + plantilla
que recibe `branding`). De las 11 restantes, verificadas **leyendo el código una
por una**:

### No llevan branding, y arreglarlo es trabajo real

| Endpoint | Por qué | Tamaño del arreglo |
|---|---|---|
| `massive-event-customer-notification` | No usa `createQueuedEmailController`: llama directo a `createQueuedJobController("send-email-multiple", …)` (`notifications.js:418`), así que se salta el envoltorio que resuelve la marca | Hace falta la variante branded del camino multi-destinatario |
| `customize-message-notification` | Sin flag, y `customizeMessageHtml(props)` no recibe `branding` | Flag + plantilla |
| `member-device-fee-receipt-notification` | Sin flag (`notifications.js:195`), y `memberDeviceFeeReceiptMessageHtml(props)` no recibe `branding` | Flag + plantilla |
| `member-device-incident-notification` | Sin flag (`notifications.js:177`), plantilla tampoco | Flag + plantilla |
| `early-remind-notification`, `edit-device-admin` | Sin flag ni plantilla preparada. No están en vuestro inventario de evento | Flag + plantilla |

**El primero es el que más se ve**: es el mensaje a todos los asistentes de un
evento. Si vuestro requisito es "todo email de evento lleva la plantilla del
cliente", ese es el que hay que priorizar.

### No llevan branding a propósito

`reset-admin-password`, `forcing-revoking-active-session`,
`feedback-email-notification` (es Devitrak pidiendo opinión **sobre Devitrak**:
*"Share Your Feedback – Help Us Improve Your Experience"*), y las de tarea
completada/fallida, que son internas.

### Y donde no llego: 3 endpoints que necesitan revisión individual

`lost-device-fee-notification`, `events-begin-reminder` y las notificaciones de
tarea. Mi análisis estático los marca como "plantilla sin branding", **pero no
me fío**: encontré tres falsos negativos al verificar a mano
(`returned-items-to-renter-notification`, `consumer-lease-return-device-notification`
y `device-report-per-transaction` **sí** están completos, aunque el script decía
que no). `notifications.js` mezcla patrones y una detección por expresión
regular se cruza con el builder vecino.

No os doy una tabla que no puedo sostener. Lo cual lleva directo a §3.2.

---

## §3 — Respuesta a §3.2: la lista de preview no es la de cobertura, y hay algo mejor

`branding-preview/templates` expone **6** muestras: recibo de devolución, recibo
de asignación, confirmación de cuenta, contrato de responsabilidad, asignación
de staff a evento y multa por dispositivo perdido. Son un **subconjunto
representativo** de las 24 con branding, elegidas para que se vea el efecto en
la página de ajustes; no son ni pretenden ser el conjunto branded.

Igualar las dos listas requiere un payload de muestra por endpoint: 24
fixtures, y encima habría que decidir qué hacer con los 6 que no llevan marca
por diseño.

**Contrapropuesta, y creo que es mejor para las dos partes:** que la cobertura
sea un **dato derivado del código**, no una lista mantenida a mano. El flag
`branded` ya está en el código y la firma del builder también, así que se puede
generar el inventario en tiempo de arranque y exponerlo:

```jsonc
// GET /api/nodemailer/branding-coverage
{ "ok": true, "result": [
  { "endpoint": "assignig-device-notification", "envelope": true, "layout": true },
  { "endpoint": "massive-event-customer-notification", "envelope": false, "layout": false },
  { "endpoint": "reset-admin-password", "envelope": false, "layout": false, "byDesign": true }
]}
```

Con eso la página de ajustes dice la verdad sin depender de que nadie audite
nada, y el preview se queda en lo que es: una muestra visual. Además nos
protege del modo de fallo que acabo de sufrir yo — que la respuesta a "¿esto va
branded?" dependa de leer bien 35 sitios.

Si os sirve, lo implemento. Es un endpoint pequeño más un test que falla si un
endpoint nuevo aparece sin declarar su cobertura.

---

## §4 — Respuesta a §3.3: cron, cola y rutas `db_*`

**Sí resuelven branding, y no necesitáis mandar nada.** Esos caminos llaman a
las funciones de notificación en proceso, sin `request`, así que
`resolveBranding` cae en `extractCompanyRef(body)` y lee del payload interno,
por este orden:

```
company_id · companyId · company_mongo_id · companyData.id · companyData._id · company._id
   → SOLO si casa /^[0-9a-f]{24}$/  (ObjectId de Mongo)
company (string) · company_name · companyName · companyData.company_name
   → y se ignora si vale exactamente "Devitrak"
```

**La trampa está justo ahí, y es la respuesta útil a vuestra pregunta:** un
handler de `db_*` tiene a mano el **id de SQL**, que no pasa el test de 24
hexadecimales. No falla con error: se cae silenciosamente al emparejamiento por
nombre, y si el payload tampoco lleva `company_name`, el email sale con marca
Devitrak sin que nada lo señale.

Así que para el mail disparado desde `db_*` o desde un scheduler, quien tiene
que arreglarlo es el backend, incluyendo en el payload interno el
`company_name` o el `_id` de Mongo. No hay nada que enviéis desde el cliente.
Si nos decís desde qué flujos habéis visto emails sin marca, revisamos esos
payloads.

---

## §5 — Respuesta a §3.4: pre-auth, y la asimetría que no existe

**Vuestra premisa es incorrecta.** Decís que el mismo `reset-admin-password`
enviado desde el detalle de staff (autenticado) sí lleva la marca, y que por
eso un cliente puede recibirlo branded o unbranded según dónde se dispare.

`notifications.js:306` es:

```js
const linkToResetPassword = createQueuedEmailController(buildLinkToResetPasswordMessage);
```

**Sin `branded`.** El servidor ignora el header en los dos casos, así que ese
email sale con la identidad de Devitrak siempre, autenticado o no. No hay
inconsistencia que arreglar: hay una decisión, y para un email de recuperación
de cuenta es la correcta — quien lo recibe necesita reconocer a la plataforma,
no a su colegio.

**Y sobre la propuesta de "mandar un hint de compañía en el payload para el
caso pre-auth": no lo hagamos.** Es exactamente lo que el diseño cierra a
propósito. Un hint en el payload de una ruta sin sesión es un campo que
cualquiera puede poner, y el resultado es que cualquiera puede mandar un email
vestido con la marca de cualquier cliente — con la agravante de que el reset de
contraseña es el mejor sitio posible para un phishing.

Si en algún momento se quiere que estos lleven marca, el camino es que **el
servidor la deduzca de la cuenta afectada**: el payload ya trae el email, del
email sale el usuario y del usuario su compañía. Nunca del cliente. Decidid
vosotros si lo queréis; si sí, lo hacemos así.

---

## §6 — Vuestros dos arreglos de cliente

Los dos son correctos y los dos describen bugs reales.

El **2.1** (sesiones persistidas que nunca reejecutaron el login y no mandaban
header) explica un patrón que del lado servidor se ve como "esta compañía tiene
branding configurado y sus emails salen Devitrak", sin ningún error en ninguna
parte. El backfill en el arranque es la solución correcta, y que escriba solo
las claves ausentes para no pisar el modal de cambio de compañía es el detalle
que lo hace seguro.

El **2.2** es el más peligroso de los dos y me alegra que lo hayáis cazado:
un formulario servido desde `companyData` obsoleto que al guardar reescribe los
valores viejos **apaga el branding después de haberlo encendido**. Desde el
servidor eso es un PATCH perfectamente válido; no hay forma de distinguirlo de
un cambio deliberado.

---

## Lo que falta, en orden

1. **Backend**: el branded del camino multi-destinatario, que desbloquea
   `massive-event-customer-notification`, el más visible de los que faltan.
2. **Backend**: flag + plantilla para `customize-message-notification`,
   `member-device-fee-receipt-notification` y
   `member-device-incident-notification`.
3. **Decisión vuestra**: si queréis el endpoint de cobertura de §3. Si sí, lo
   hago antes que el punto 2, porque convierte esta conversación en un dato
   consultable en vez de un documento que caduca.
4. **Decisión vuestra**: si el reset de contraseña debe llevar marca. Si sí, se
   deduce en el servidor desde la cuenta, no desde el payload.
