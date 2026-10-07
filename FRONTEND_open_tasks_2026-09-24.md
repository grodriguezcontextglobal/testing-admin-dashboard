# Lo que queda abierto — documento único

> **2026-09-24.** Sustituye a cuatro listas que se contradecían entre sí:
> `FRONTEND_pending_tasks_2026-07-27.md` (scoped roles),
> `FRONTEND_pending_tasks_2026-08-25.md` (recorrido por la app),
> `FRONTEND_pending_tasks_2026-08-31.md` (walkthrough de 71 min con Fredrik) y
> `FRONTEND_open_tasks_2026-09-21.md` (sesión del 18-09).
>
> **Método:** cada ítem se comprobó contra el código de hoy, no contra lo que
> decía su documento. Donde el código no puede responder, lo dice.
>
> Las actas de reunión viven aparte y no caducan:
> `FRONTEND_pending_tasks_2026-09-18.md` y `FRONTEND_meeting_2026-09-25.md`.
> Sobre la primera: no es un tracker, es el
> acta con la cita y el minuto de cada petición de Fredrik, y eso no caduca.

---

## 0. Por qué hacía falta esto

Las cuatro listas juntas daban **33 ítems abiertos**. Comprobados uno a uno,
**16 ya estaban cerrados** y nadie lo había anotado. Entre ellos el que su
propio documento marcaba como *«lo más prioritario de la lista»*.

Un tracker desactualizado no es neutral: se trabaja dos veces sobre lo cerrado
y se pasa por alto lo que de verdad queda.

| | |
|---|---|
| **Abierto, total** | **29** |
| — bloquea (§1) | 1 |
| — trabajo de producto (§2) | 5 |
| — reunión del 29-09 (§2b) | 4 (de 2b.4 y 2b.8 solo queda la parte del servidor) |
| — contrato del backend 2026-10-01 (§2c) | 2 (los dos esperan al backend) |
| — plan FedRAMP (§2d) | 8 |
| — surgido esta semana (§3) | 4 |
| — no es código (§4) | 5 |
| Cerrado y tachado en este documento | 29, más la tabla de §5 |

> **Recontado 2026-10-02** con un script, sección por sección: un `###` sin
> tachar es un ítem abierto, y en §4 cada viñeta sin tachar. Ese día se cerraron
> ocho que ya estaban hechos antes de esta lista y nadie había tachado: S1, D3,
> E1, E3, B11, los textos de la plantilla y dos de los tres seguimientos de
> etiquetas de rol.

> Contado 2026-09-28 sección por sección. El encabezado venía diciendo 22
> porque se fue sumando a mano sobre una cifra inicial que ya no cuadraba con
> el cuerpo. Un tracker cuyo total no coincide con su contenido es el problema
> que este documento vino a resolver, así que el número sale de contar.

---

## 1. Abierto — bloquea

### ~~D1 + D2 — los documentos se listan en plano, ignorando el campo que ya existe~~ — hecho 2026-10-01

La biblioteca se agrupa por uso, con las etiquetas del formulario de subida
de cada compañía (lo desconocido va a "Other"), y tiene filtros por uso y
"Expired". Las carpetas se agrupan por su propio vocabulario
(`utils/documentLibrary.js`, commit `424a1d96`). Se respondió la pregunta de
abajo: un documento tiene un solo `trigger_action`, y se mantuvo así.

Texto original:
`src/pages/Profile/Documents/Documents.jsx`

Tanto un documento como una carpeta llevan `trigger_action` (onboarding, event,
consumer, school_consent). El dato está; la vista no lo usa. Hoy
`trigger_action` aparece **una sola vez** en las 283 líneas del fichero, y solo
para pintar el nombre de una carpeta.

No es «añadir un concepto», es dejar de ignorarlo. Los dos van juntos: un
modelo de navegación, no dos.

Al diseñarlo hay que cerrar una pregunta: `trigger_action` es un valor único, o
sea que un documento pertenece a un único camino. Si alguna vez necesita servir
a dos, eso es un cambio de backend y conviene saberlo antes de construir encima
del supuesto.

### El servidor todavía no exige MFA
`FRONTEND_force_logout_token_2026-09-21.md`

El cliente fuerza el enrolamiento y ya no pide contraseña para revocar sesión.
**El servidor sigue emitiendo token a cuentas con MFA apagado**: quien haga POST
directo a `/api/admin/login` se salta la puerta. Hasta que el servidor rechace
esa sesión, ante Fredrik es una puerta fuerte, no una regla.

---

## 2. Abierto — trabajo de producto

### C1 — roles personalizados con matriz de permisos
El más grande de las cuatro listas. Hoy `PERMISSIONS` en `src/config/roles.js`
es un mapa estático; no hay ni matriz ni UI. Nada empezado.

### ~~D3 — rediseño del formulario de subir documento~~ — ya estaba hecho

**Cerrado el 2026-08-26 en `97e8abda`** (*rebuild the document form and the
folder dialog*), un día después de pedirse y antes de esta lista. Se comprobó
el 2026-10-02: `DocumentUpload.jsx` está en `action-form`, por pasos, ya no
usa `new_form_components/` y hace polling del 202 (`pollJobStatus`).

Texto original:
`src/components/documents/DocumentUpload.jsx`

**Su bloqueo desapareció:** la subida de PDF ya maneja el 202 + polling
(`pollJobStatus`, `/jobs/owned/:jobId`). El rediseño se puede hacer cuando se
quiera.

### ~~E1 — crear consumidor desde un evento~~ — ya estaba hecho

**Cerrado el 2026-08-26 en `2bfd77ea`** (*rebuild adding a consumer*). El
formulario compartido `CreateNewUser.jsx` está en `action-form`, y el evento lo
abre desde `ButtonSections.jsx` y `ModalsComponentsEventQuickGlance.jsx`.

Texto original:
`src/pages/consumers/utils/CreateNewUser.jsx`. Solo maquetación; no tocar lo que
envía el formulario.

### ~~E2 — el staff añadido desde quick-glance sale sin nombre~~ — ya estaba hecho

**Cerrado el 2026-08-26 en `6787de1c`**, antes de que se escribiera esta lista.
Se comprobó el 2026-10-01: `StaffTable` resuelve el nombre con `buildStaffRows`,
y los 49 tests de `eventStaffUtils` pasan.

### ~~E3 — notificación por email desde el detalle de consumidor~~ — ya estaba hecho

**Cerrado el 2026-08-26 en `d83fb5f1`** (*rebuild the one-off email to a
consumer*). El email que abre el detalle de consumidor
(`ConsumerActionRail.jsx`) es `SingleEmail.jsx`: está en `action-form`, tiene
tests y el 18-09 se le ajustó la cola (`dbee206f`). Los otros cinco
componentes de `notification/email/` no se abren desde ahí. Si hiciera falta
rediseñarlos, sería una tarea nueva, con su propio alcance.

Texto original:
`src/components/notification/email/`. La carpeta es compartida: un cambio ahí
aterriza en todas las pantallas que mandan correo. Revisar cada llamador.

### ~~E4 — página de confirmación de pago desde quick-glance~~ — hecho 2026-10-02

**Hecho**, sobre los hallazgos de abajo:
- `utils/paymentConfirmation.js` (con tests) decide qué hacer al llegar:
  `declined`, `missing`, `already-processed` o `run`. El borrador se marca con
  el `payment_intent` **antes de la primera escritura**, así que una recarga ya
  no repite nada y muestra "This deposit/payment was already processed". La
  idea es evitar el duplicado, no borrarlo después: las funciones
  `removeDuplicates*` vivían en `components/stripe/payment/ConfirmationPayment.jsx`,
  que no importaba nadie y se borró.
- Las dos páginas se paran ante un `redirect_status` de fallo (`failed`,
  `requires_payment_method`, `canceled`) o un intent sin pago. Solo cuenta un
  fallo explícito, para no rechazar nunca una retención autorizada.
- `Confirmation.jsx`: si la caché no se limpia, ya no se informa "no device
  was assigned". Hay un estado propio para "guardada pero sin asignar", el
  resultado parcial ya no lleva el icono verde, y todos los estados de error
  muestran la referencia.
- `ServicePaymentConfirmation.jsx`: reescrita con el mismo patrón. Un error ya
  no se pinta como éxito. Guarda antes de mandar la factura, y si la factura
  falla es un aviso, no un fallo. Invalida `consumerEventTransactions` y vuelve
  al evento por `/events/event-quickglance`. Los cuerpos de las peticiones no
  cambian.

**Sin verificar:** no se ha probado en el navegador contra Stripe. Y no se sabe
si el servidor rechaza un `paymentIntent` repetido en `save-transaction`.


**Revisado 2026-10-02, sigue abierto, pero falta saber qué se pide.**
`AddingDevicesToPaymentIntent.jsx` se reconstruyó el 2026-08-21 en `29c00b80`
(el flujo del consumidor en el evento, ProfileShell), y se volvió a pedir en el
recorrido del 2026-08-25, cuatro días después. O el recorrido se hizo sobre un
despliegue anterior, o el rediseño no resolvió la queja. Hay que preguntar qué
falla antes de tocar Stripe.

**Revisión del código, 2026-10-02 (sin cambios).** Las páginas de confirmación
del evento son dos, y el rediseño del 21-08 solo tocó una:

- `pages/payment/Confirmation.jsx` (`payment-confirmed`, depósito con tarjeta):
  rehecha el 21-08. Tiene dos huecos:
  1. **Una recarga repite la transacción.** El borrador
     (`deviceSelectionPaidTransaction`) vive en Redux persistido sin
     whitelist, y nadie lo borra tras el éxito. Si se recarga la URL, que aún
     lleva `payment_intent`, `startedRef` vuelve a empezar y se ejecutan otra
     vez `stripe-transaction-admin`, `save-transaction` y las asignaciones.
  2. **No comprueba que Stripe autorizó.** Solo mira `intent.data.ok`, nunca
     `redirect_status` ni el estado del intent. `lostFee/actions/CreditCard.jsx`
     sí exige `redirect_status === "succeeded"`.
  - Menores: si falla algo después de asignar (por ejemplo, `clearCacheMemory`),
    la pantalla dice "no device was assigned" aunque sí se asignaron. El
    resultado parcial se pinta con el icono verde de éxito. Y "Nothing to
    confirm" no muestra la referencia del `payment_intent`, aunque Stripe tenga
    retenidos los fondos.
- `pages/payment/ServicePaymentConfirmation.jsx`
  (`payment-service-confirmation`, cobro de servicios): **no se tocó**, y
  tiene el mismo tipo de fallos que el 21-08 corrigió en la otra:
  - pinta "Successfully transaction!" en verde siempre que no está cargando,
    **también tras un error** (`catch → setLoadingStatus(false)`);
  - la escritura va en un `useEffect` de montaje, así que una recarga repite el
    correo de factura y la transacción;
  - invalida `transactionPerConsumerListQuery` y `transactionsList`, que son
    claves viejas. La lista del consumidor usa `consumerEventTransactions`, así
    que no se refresca;
  - "Return to event main page" navega a `/events/event-attendees`, una ruta
    que no existe;
  - manda el correo de factura antes de guardar la transacción.

**Hipótesis:** la queja del 25-08 es muy probablemente sobre la de
servicios, la única que el rediseño no tocó. Conviene confirmarlo con Fredrik,
pero los dos huecos de la de depósito son bugs por sí solos.

Texto original:
Toca payment intents de Stripe. Leer `useCreateTransaction` antes de mover nada
y conservar la forma de la petición.

### ~~S1 — crear proveedor~~ — ya estaba hecho

**Cerrado el 2026-08-26 en `094dd10e`** (*rebuild the supplier form and its
paperwork*). El "0 usos de `action-form__`" de abajo era un falso negativo:
`NewSupplier.jsx` solo coordina, y el formulario lo pinta
`Profile/providers/components/UpdateProvider.jsx`. Ese sí está en
`action-form`, en tres pasos y con errores por campo.

Texto original:
`src/pages/inventory/actions/utils/suppliers/NewSupplier.jsx`. Verificado: **0
usos de `action-form__`**, así que sigue siendo la pantalla rara de esa carpeta,
donde las hermanas ya se reconstruyeron.

### ~~B10 — staff y estudiantes deberían sentirse el mismo producto~~ — ya estaba hecho

**Cerrado el 2026-09-01**, según `FRONTEND_pending_tasks_2026-08-31.md`: el menú
de staff sale de `staffProfileActionList`, con tests, escrito para leerse junto
al de estudiantes. Esta lista lo dio por abierto por error.

### ~~B9 — una palabra para una persona, no dos~~ — hecho 2026-10-01

**Cerrado:** "Add new" va en singular (*Add new patient*); Export y Delete actúan sobre varios y siguen en plural. El valor por defecto pasa a "members".

`industryProfiles.js` ya resuelve el vocabulario por industria — existe el
concepto de cómo llama cada compañía a la gente de su módulo. Pero queda al
menos una etiqueta a mano: `mainPageUtils.test.js` fija `"Add new member"`. La
fontanería está; falta enchufar ese botón.

**Revisado 2026-10-01:** la ficha ya se hizo el 2026-08-31 (`audienceWords`).
Lo que queda es el menú "Manage" de la lista (`buildManageMembersMenu`), que usa
el plural donde va el singular, por ejemplo *"Add new patients"*. "member" es
solo el valor por defecto cuando la compañía no tiene industria.

### ~~Merchant service ofrecido sin cuenta de Stripe detrás~~ — hecho 2026-10-01 en el alta

**Corrección al texto de abajo:** la señal **no** es `companyAccountStripe`. Ese
es el cliente de facturación de la suscripción de la compañía a Devitrak. La
que importa es la cuenta **conectada**,
`companyData.stripe_connected_account[test|live]`, que se crea en Profile →
Stripe account (`utils/merchantAvailability.js`).

Sin esa cuenta, en el paso 1 del alta el "Yes" queda deshabilitado, con el
motivo y el enlace *Set up the Stripe account*. Si un borrador trae `merchant:
true` de antes, se pasa a `false`.

**Queda abierto:** los eventos que ya existen con `merchant: true` sin cuenta.
La edición del evento solo arrastra el valor y no tiene control propio. El
cobro con tarjeta en el evento sigue dependiendo del flag del evento.

Texto original:

Pedido 2026-09-25. Hoy se puede marcar que un evento **sí** necesita merchant
service aunque la compañía nunca haya creado su cuenta de Stripe. El evento
queda con `merchant: true`, y el cobro solo falla más tarde, cuando alguien
intenta cobrar de verdad.

**Dónde se elige:**

```
newEventProcess/eventDetails/ux/merchant/MainMerchantSection.jsx   el Sí/No
  └ ux/buttons/Yes.jsx · No.jsx
newEventProcess/inventory/components/MerchantService.jsx           la rama del alta
  └ NoMerchantService.jsx · MainBody.jsx
quickGlance/updateEvent/UpdateEventInfo.jsx:88                     al editar, lo arrastra
```

**Dónde se consume al asignar dispositivos:**

```
quickGlance/consumer/ConsumerDetail/ConsumerActionRail.jsx:36
quickGlance/consumer/ConsumerDetail/AssigningDevice/AddingDevicesToPaymentIntent.jsx
```

**La señal ya existe y ya se consulta.** `POST /stripe/company-account-stripe`
con `{ company }` devuelve `companyAccountStripeFound`, y
`events/MainPage.jsx:45` ya lo pide (lo usa en `:166` y `:202`). No hace falta
endpoint nuevo ni nada del backend.

**Y el patrón de UI también existe.** `quickGlance/consumer/lostFee/Choice.jsx:82`
ya resuelve el caso hermano —evento sin merchant— deshabilitando la opción y
diciendo por qué en vez de esconderla:

> *"Unavailable — no merchant account on this event."*

Conviene copiar esa forma: deshabilitado **con motivo**, no oculto. Una opción
que desaparece se lee como un fallo; una deshabilitada que explica que falta la
cuenta de Stripe lleva a la acción, y hay página para ello
(`RegisterStripeConnectedAccount`).

Quedan dos cosas por decidir al hacerlo: qué pasa con los eventos que ya están
en `merchant: true` sin cuenta detrás, y si el aviso enlaza al alta de Stripe o
solo la nombra.

### ~~Textos de la plantilla de import — cuatro de la reunión del 25-09~~ — hecho

**Cerrado:** los tres textos van en `f848f0e8` (2026-10-01) y la columna de
imagen en `b037a10b` (2026-09-29). Se comprobó en
`inventoryImportTemplate.js`: *"Must be unique for this unit and this row."*,
*"One of: Permanent, Rent, Resale."* y *"Where the unit is physically."*.

Texto original:

Todo en `src/pages/inventory/utils/inventoryImportTemplate.js`. Van juntos: un
fichero, un test que fija guía, plantilla y cabeceras del parser entre sí, y una
pasada.

- **`serial_number:156`** — "One row per physical device" confunde, porque en
  una hoja de cálculo "row" ya significa otra cosa (`3:26`–`5:18`). Su
  redacción: *"unique for this unit and this row"*.
- **`ownership:192-194`** — fuera la frase de los sinónimos, que se queda en el
  código pero no hace falta contarla (`5:40`). **Y de paso**: esa nota dice
  `Sale` y el valor canónico pasó a ser `Resale` en `fda62fdd`. Los dos se
  aceptan, así que nadie lo ha notado, pero la plantilla enseña a escribir el
  valor que dejamos de usar.
- **`location:224`** — *"Where the unit is physically."* Pulido de lo que ya
  dice (`6:27`).
- **La columna de imagen** (`:52` y `:314`) sigue llamándose **`image_url`**
  aunque desde el 18-09 no acepta enlaces: la imagen se pega en la celda
  (`7:26`–`8:05`). **Esto no es solo copy** — renombrar la cabecera toca
  plantilla, parser y guía a la vez, y rompe las hojas que la gente ya tenga
  guardadas. Hay que decidir si se renombra la columna o solo su descripción.
  **Hecho 2026-09-29 en `b037a10b`:** se renombró la columna a `image`, en
  plantilla, parser y tests. El payload al API sigue enviando `image_url`.

### ~~Eventos a medio crear — etiqueta Draft y volver a terminarlos~~ — hecho 2026-09-30

**Hecho.** La señal es `configuration: "in-progress"`, dato confirmado por
backend. `utils/eventDraft.js` la lee, y un evento sin `configuration` (los
anteriores al campo) **no** es borrador.

- Los borradores salen de Live, Upcoming y Past, donde aparecían como
  "Closed", y tienen su propia sección **Drafts** arriba, con filtro. El chip de
  estado y la tarjeta dicen "Draft" en vez de "Ended".
- **Continue setup** (`event:create`): busca el id de SQL, rehidrata Redux y
  abre el paso 1 con los datos rellenados. Con los dos ids en Redux, Next
  actualiza el evento en vez de crear otro. Si no encuentra el id de SQL, no
  abre el wizard, porque el paso 1 crearía un duplicado.
- **Delete** (`event:delete`), con confirmación: borra la fila de SQL, si la
  hay, y el evento de Mongo.

**Pendiente:**
- Probar en el navegador que retomar llega hasta el final sin duplicar.
  **Encontrado así el 2026-10-06:** el paso 1 reventaba con "Cannot read
  properties of undefined (reading 'length')". Un borrador abandonado en el
  paso 1 nunca pasó por el de staff, así que su documento trae `staff: {}`, y
  `draftResumeState` solo cubría que `staff` faltara del todo. Cinco sitios
  del asistente leían `staff.adminUser.length` sin guarda. Arreglado con
  `normalizeEventStaff` en el slice, con tests. Falta repetir la prueba.
- **Ver 2c.5:** hoy el Delete falla entero, porque el servidor lee el id de
  `body.email`. Cuando se arregle, confirmar que `DELETE /db_event/:id` no deja filas huérfanas en tablas
  relacionadas.
- ~~El matiz de Fredrik: un borrador que llega a su fecha de fin pasa a
  *inactive*~~ — hecho 2026-10-01 (`draftStatusLabel`). Sigue en Drafts, con
  sus dos acciones, pero etiquetado "Inactive".

---

Texto original:

Pedido en reunión, anotado 2026-09-29. Si alguien empieza a crear un evento y
sale de la página a mitad, en la sección de eventos ese evento debería
aparecer con una etiqueta **Draft**, y desde ahí se debería poder retomar el
proceso donde quedó.

Reunión 2026-09-29 `38:42`–`40:16`: hoy ese evento aparece como
**closed/ended**, y Fredrik dijo que eso está mal porque *"it was never done"*.
Si un borrador llega a su fecha de fin sin terminarse, pasa a **inactive**, no
a ended.

**El evento ya existe en el servidor desde el paso 1.** Lo que queda sin
terminar es la configuración:

```
newEventProcess/eventDetails/Form.jsx:101          POST /event/create-event, active: false
newEventProcess/review/ReviewAndSubmitPage.jsx:141 PATCH active: true, configuration: "completed"
  └ :136                                           POST /db_event/update-event → configuration: "completed"
```

**La señal de Draft ya se escribe, pero nadie la lee.** `configuration:
"completed"` se guarda en Mongo y en SQL al terminar, y ningún otro sitio del
código lo consulta. Ojo: `active: false` no sirve como señal, porque un evento
terminado y luego cerrado también queda así.

**Retomar tiene que partir del servidor, no de Redux.** Todo el store va
persistido (`Store.js:33`, sin whitelist), así que en el mismo navegador el
borrador puede seguir ahí. Pero no llega a otro dispositivo, y hay que
confirmar si `clearSessionStorage` lo borra al cerrar sesión. Hace falta
rehidratar el proceso a partir del evento guardado y saber en qué paso quedó.

Queda por confirmar con backend qué valor tiene `configuration` antes de
completar el alta, y si los eventos viejos lo tienen puesto. Si no lo tienen,
cualquier evento anterior a este campo se leería como Draft.

### Notificaciones — lo que salió de la queja de Fredrik del 03-04/10

**Origen, aclarado el 2026-10-05.** Fredrik figura como tutor de un menor en una
cuenta de pruebas, y ese menor tiene un equipo vencido. El servidor manda el
recordatorio de vencido **todos los días a las 8:00 (EST), a partir del día
siguiente a la fecha de devolución, nunca antes**, y le llega a él. **Ese
comportamiento es el correcto:** es el aviso al tutor que él mismo pidió el
29-09 (2b.4). Lo que le molesta es que su email real está en datos de prueba.
Se arregla cambiando ese email por una dirección de pruebas.

**Queda por decidir, sin cambiar la regla:**
- **La frecuencia no tiene fin:** mientras el equipo no vuelva, el tutor recibe
  un correo cada día. Se podría espaciar (por ejemplo, días 1, 3 y 7 y luego
  semanal) o poner un tope. Es decisión de producto, y el cambio es del
  servidor.
- **El envío manual se suma al automático:** "Send reminder" y "Send all
  reminders" (`OverdueDevicesTable.jsx`) y "Send reminder" del perfil del
  member mandan el mismo aviso aunque esa mañana ya saliera el automático.
  Mostrar cuándo salió el último, o avisar de que el envío diario existe,
  evitaría el doble correo.

**Lo que dejó la revisión, y sigue abierto aunque el origen era otro:**

**Lo que hay hoy:** Profile → Notifications (`pages/Profile/notifications/`)
guarda seis preferencias en el administrador (`PATCH /admin/admin-user/:uid`):
*News and updates*, *Tips and tutorials* y *User research* (casillas), y
*Daily summaries*, *Event reminders* y *Subscription renewals* (radio).
**Ninguna corresponde a un correo que la app envíe**, y **nada en el cliente
las consulta** antes de enviar. No se sabe si el servidor las respeta, porque
no se ve desde aquí.

**Opción por opción (2026-10-05):** *News and updates*, *Tips and tutorials*,
*User research*, *Daily summaries* y *Subscription renewals* **no corresponden a
ningún correo** de los 38 del servidor. Además, la opción de *Subscription
renewals* dice "Notify me for all other activity". *Event reminders* tenía un
endpoint (`/nodemailer/events-begin-reminder`), pero **nunca se enviaba**: ver
abajo. O sea que **ninguna de las seis opciones controla hoy un correo real.**

**Corrección 2026-10-05 al recordatorio de inicio de evento.** El texto
anterior de este punto (commit `828f7dd3`) decía que se reenviaba en cada
visita a la lista de eventos. **Era falso.** El envío estaba en un `useEffect`
de `CardEventDisplay.jsx` con dependencias vacías: se ejecutaba una sola vez al
montar, cuando el contador de días de `<WeekdayDifference>` todavía era `null`,
así que nunca llamaba al envío. Era así desde que se escribió (`9834d622`,
2024). **Se quitó como código muerto el 2026-10-05.** Si se quiere ese
recordatorio, debe enviarlo el servidor una vez al día, como el de vencidos, y
respetando la preferencia `eventReminder`.

**Las notificaciones reales:** 38 endpoints `/api/nodemailer/*`. El cliente
llama a 28, y los otros 10 los dispara el servidor (tareas en cola terminadas o
fallidas, staff asignado a un evento, recordatorio temprano, confirmación de
cuenta…). Por destinatario:
- **al usuario del dashboard (staff/admin):** invitación, restablecer
  contraseña, sesión revocada, aviso interno a staff, staff asignado a un
  evento, equipo prestado a staff, tarea en cola terminada o fallida, edición
  de un dispositivo (el recordatorio de inicio de evento existía en el cliente
  pero nunca se enviaba, y se quitó);
- **a consumidores, members o tutores:** asignación de equipos, devolución,
  depósitos (cobrado o devuelto), lost fee, refund, factura, contratos de
  responsabilidad, incidentes y recibos de members, instrucciones de la app,
  feedback, mensajes sueltos y masivos, términos y condiciones.

**Antes de diseñar hay que cerrar dos cosas:**
1. **¿Quién es "el usuario"?** Puede ser el staff que decide qué le llega a
   él, o la compañía que decide qué correos manda a sus consumidores/members.
   Son dos pantallas distintas, y la segunda es configuración de compañía, no
   de perfil. Hay que preguntarlo a Fredrik.
2. **El servidor tiene que respetar la preferencia.** Si el filtro solo está en
   el cliente, no sirve para los 10 correos que dispara el servidor. Hace falta
   un contrato con backend: dónde se guarda cada preferencia (por usuario o por
   compañía), con qué claves, y que cada `nodemailer/*` la consulte antes de
   enviar.

**De paso, un bug en la página actual:** al guardar despacha `onLogin`, cuando
guardar un campo del perfil debe despachar `onUpdateProfile`
(`store/slices/adminSlice.js:98`). Además lee `msg` en el error.

### Registrar toda acción de un usuario o staff — el servidor ya lo hace; falta leerlo bien

**El backend desplegó el middleware el 2026-10-05**, el mismo día que se pidió.
Cada fila trae ahora `source: "server"`, la ruta, el estado HTTP, el cuerpo
del pedido, la IP, el navegador y un `context` ya resuelto (evento, seriales,
destinatarios). Audita acciones que antes no se registraban: dispositivos,
correos, Stripe, caché, compañía, staff, préstamos.

**Hecho en el cliente el 2026-10-05** (`staffActivityLogUtils.js`, con tests):
- Cada fila dice en palabras qué pasó ("Updated a device"), con etiquetas de
  lo que la identifica (evento, seriales, destinatario), y detrás de
  **Details** la evidencia: objeto, ruta y estado, IP y cuerpo del pedido.
- La hora se muestra en la zona del lector; antes salía en UTC.
- **El filtro por usuario no devolvía nada.** La lista de empleados trae dos
  ids: `_id`, el de su fila dentro de la compañía, y `userId`, el de su
  cuenta. El log identifica al autor por la cuenta, y se mandaba el primero.
  Los fixtures de los tests solo tenían `_id`, por eso no saltó. De paso,
  "uno siempre se ve a sí mismo" tampoco se cumplía.
- **La mitad del registro era inalcanzable:** la pantalla pedía siempre
  `page: 1` con `limit: 50`, y el endpoint ya respondía `total` y
  `totalPages`. Ahora la paginación va contra el servidor.

**Decidido 2026-10-05 (Gustavo): la bitácora la lee gente sin formación
técnica.** Así que:
- Los borrados de caché **no se listan**. Se filtran en el cliente, así que
  una página puede venir con menos filas que su tamaño; se pidió al backend
  excluirlos de origen (pregunta 5).
- **Details no enseña nada del servidor:** ni ruta, ni estado HTTP, ni cuerpo
  del pedido. En su lugar, una frase: `activity: false` en
  `receivers-pool-update` se lee "Returned a device" y "The device went back
  into the event's inventory.". Las reglas por ruta viven en
  `staffActivityLogUtils.js`; una ruta sin regla cae a la frase genérica, que
  es vaga pero nunca técnica ni falsa.

**Sigue abierto:** el audit trail por dispositivo (2b.7) necesita que el
endpoint acepte filtros por evento y por dispositivo, que es la pregunta 4 de
`FRONTEND_activity_log_backend_ask_2026-10-05.md`.

Texto original:

Pedido por Fredrik el 2026-10-05: registrar **cualquier** acción que un usuario
o staff haga en la app, por ejemplo crear un evento, asignar inventario al
evento o asignar un dispositivo a un consumidor. **Une a 2b.7** (audit trail con
autor, empezando por el dispositivo), que pide lo mismo para un caso.

**Lo que hay** (contrato `FRONTEND_staff_activity_log.md`, 05-08): el servidor
registra solo LOGIN, FORCE_LOGOUT y los CRUD de `controller/admin.js`,
`event.js` e `inventory.js`. El cliente registra a mano members, préstamos,
consentimientos y tutores (15 ficheros). De las tres acciones del ejemplo, solo
crear evento se registra. **Asignar inventario al evento**
(`mysql/controllers/items_events.js`) y **asignar un dispositivo a un
consumidor** (`controller/receiver.js`) **no**. Tampoco el inventario en SQL,
las transacciones ni Stripe: de 404 rutas que escriben, el servidor cubre 30.

**Decisión: lo escribe el servidor**, con un middleware sobre las rutas que
cambian datos y el autor sacado del JWT. Registrarlo desde el cliente se puede
saltar, se duplica y depende de que cada pantalla se acuerde. La petición, con
el detalle por controlador y cinco preguntas, está en
`FRONTEND_activity_log_backend_ask_2026-10-05.md`.

**La parte del frontend, cuando el servidor responda:** mostrar las acciones
nuevas en lenguaje legible en la actividad de staff, los filtros por evento y
dispositivo, el autor en el audit trail del dispositivo, y retirar las
llamadas a `registerStaffActivity` que pasen a estar cubiertas.

### Dashboard de gestión de Devitrak

Pedido el 2026-09-25 `20:25`: alta de compañías, datos de Stripe, suscripciones,
uso por cuenta. **Es un producto aparte**, no una pantalla de este dashboard.

Sin alcance ni fecha, y él mismo lo puso por detrás de FedRAMP en la frase
siguiente. Queda como intención registrada, no como tarea lista para coger.

### R3 — la reconciliación de alcance por ubicación — a medias: falta el backfill

**Revisado 2026-10-05: el lado de lectura se arregló el 2026-09-17, antes de
esta lista, en `c995425f`.** `resolveScopedLocationNames` lee primero el
alcance de SQL y, si no hay, el array heredado de Mongo. Así, un rol con alcance
asignado desde la pantalla nueva ya no ve todo el inventario de la compañía.
Está documentado como puerta del flag en
`FRONTEND_inventory_pagination_migration_plan.md` (`adcf1c24`).

**Lo que queda es del backend:** el backfill Mongo → SQL. Una persona con
alcance asignado solo en Mongo no tiene filas en SQL, así que el servidor no
puede aplicarle ese alcance. El texto de abajo describe la situación de antes
del arreglo.

Texto original:
`saveScopedRole` escribe el alcance en SQL pero no toca el `preference.managerLocation`
de Mongo, que es lo que lee el filtro de inventario del servidor.
`useCompanyScopeLocations.js:14` lo dice en un comentario: *«R3 reconciliation is
a separate task»*.

**Decisión pendiente con backend:** ¿reconcilia el servidor (preferible, nos
saca del doble escritura) o escribimos los dos sitios?

### ~~Seguimientos de etiquetas de rol~~ — cerrado 2026-10-02

Revisado 2026-10-02. Eran tres ítems en cola desde el 2026-07-17:
- ~~Asignar members existentes a eventos desde Members~~: hecho el 2026-07-17
  en `c6a08110` (`RegisterMembersToEvent.jsx`).
- ~~Proteger el enlace "Staff" del footer~~: hecho el 2026-07-17 en
  `d6def1f2`. El enlace se esconde sin `nav:staff`, y la ruta `/staff` está
  tras `PermissionGuard action="nav:staff"`.
- ~~Rediseñar las tarjetas de información del evento~~: **cerrado**. Las
  tarjetas de la lista de eventos (`CardEventDisplay.jsx`) muestran desde el
  2026-06-17 una fila con Devices, Groups, Staff y el estado logístico. El
  detalle tiene las barras Status/Condition y el conteo de staff en su sección.
  "Participantes esperados" no puede mostrarse porque el evento no guarda ese
  dato. Si se quiere, es una tarea nueva: añadir el campo al alta del evento.

---

## 2b. Abierto — reunión del 29-09, en orden de trabajo

> Acta con las citas y los minutos: `FRONTEND_meeting_2026-09-29.md`. Los
> números entre corchetes remiten a su tabla. El orden es el de trabajo: lo que
> el colegio va a tocar primero va arriba, y lo que depende de backend o de una
> decisión va al final. Los ficheros se localizaron por el texto visible y no
> se han abierto todavía.

### ~~2b.1 — Import de estudiantes [1–5]~~ — hecho 2026-09-30
`pages/conditionalPage/utils/xlsxImportUtils.js` (+ su test)

Va primero porque es por donde entra un colegio, y Fredrik manda el correo al
colegio esta semana: *"this needs to work… They're not going to sit and do it
manually."*

**Hecho 2026-09-30:** en `c3a23249`, y la imagen en el commit siguiente, `fix(members)`.

- ~~Fecha de nacimiento~~: la celda de fecha de Excel ya se leía. Ahora
  también se aceptan `.` y espacio como separador, el año de dos cifras, los
  dígitos sin separador y el número en que Excel convierte `06152010`.
- ~~Contacto~~: el email y el teléfono propios pasan a opcionales **solo para
  menores**. Al tutor se le sigue exigiendo todo (nombre, email y teléfono),
  porque se lo busca y se lo vincula por email y el consentimiento le llega
  por email. El email del tutor **no** se copia al estudiante, porque el
  consumidor del evento se busca por email y dos hermanos se fusionarían. La
  regla vive en `memberContactRules.js` y la usan el import y el alta
  individual.
- ~~Instrucciones~~: la plantilla descargada lleva una hoja *Instructions*,
  construida desde `MEMBER_IMPORT_COLUMNS`.
- ~~Código postal~~: se comprueba solo con un estado de EE. UU., y avisa sin
  bloquear. El cero inicial que Excel quita se repone.
- ~~Imagen pegada en la celda~~: se lee con `readWorkbookCellImages`, el
  mismo lector de inventario, y la columna pasa a llamarse `image` (el nombre
  `image_url` se sigue leyendo). Un enlace escrito ya no se guarda: se avisa.
  La subida es propia (`memberImportImages.js`). Pensada para hojas de 2000+
  filas con una foto cada una:
  - una subida por foto **distinta por contenido**, aunque Excel guarde la
    misma foto como dos archivos;
  - el id en Cloudinary es el hash de la foto (`member_<empresa>_<hash>`):
    reimportar sobrescribe en vez de duplicar, y dos fotos distintas nunca
    comparten id;
  - cada foto se reduce a 512 px en el navegador antes de subirla;
  - se muestra el progreso de la subida.

  Cloudinary no limita por hora la Upload API, solo la Admin API, así que el
  techo real es el tiempo y el almacenamiento. Si una foto falla, ese miembro
  entra sin ella y el import sigue.

**Sin verificar: si el backend acepta `email: ""`** en `/db_member/bulk-members`
y en `/db_member/new-member`. Si la columna es NOT NULL o única, el primer menor
sin email pasa y el segundo choca. Hay que probarlo en el navegador con dos
menores sin email. Y un menor sin email todavía no se puede registrar a un
evento: el consumidor sale de `member.email`. Eso es de backend.

### ~~2b.2 — Alta de inventario: cuatro retoques [8–11]~~ — hecho 2026-09-30

- ~~Sublocación escrita y no añadida~~: aviso con *Add sub-location* y
  *Clear*, y Continue deshabilitado mientras haya texto. **Corrección
  2026-09-30:** el texto no se perdía. `buildSubLocationPath` lo agrega al
  guardar. Lo que fallaba es que la revisión solo mostraba los chips, y
  parecía perdido. En la reunión se dijo que "no la toma", y `56523b5c` lo
  repitió sin comprobarlo. El bloqueo se queda porque es lo que pidió Fredrik
  (añadir o borrar antes de seguir)
  (`PendingSubLocationNotice.jsx`, `utils/pendingSubLocation.js`). "Remove all
  sub location" ahora también limpia el campo, para que no quede un pendiente
  oculto.
- ~~Botones~~: "Add additional identifier" pasa a secundario, con `+`; "Queue
  this item for creation" pasa a primario, a la derecha. El formulario es
  compartido, así que el cambio también llega a `BulkItemForm` y a
  `BulkRentedItems` (eventos).
- ~~"Built for you"~~, quitado.
- ~~Texto del duplicado~~, con su redacción.

**Wizard de edición de grupo — comprobado y arreglado el 2026-10-01.** Tenía
el mismo hueco, y uno peor:
- guardaba solo los chips (`JSON.stringify(subLocationsSubmitted)`), así que
  lo escrito sin añadir **sí se perdía**. Ahora usa `buildSubLocationPath`,
  como el alta, que además descarta los "null";
- **no cargaba la sublocación actual del grupo**: el relleno del formulario
  se la saltaba. Los chips arrancaban vacíos y el guardado mandaba `"[]"`, lo
  que probablemente borraba la sublocación del grupo al editar cualquier otro
  campo. Ahora se carga con `parseSubLocationPath`;
- el paso de campos muestra el mismo aviso y "Review changes" espera.

### ~~2b.3 — Documentos en el alta de evento: el arrastre [12, 13]~~ — hecho 2026-09-30

`DocumentAssignmentBoard.jsx` + `utils/documentAssignment.js`, usados desde
`documents/Form.jsx`.

- ~~La zona parecía aceptar archivos del escritorio~~: ahora dice "Drag a
  document here from the list on the left, or use Assign" y manda los
  archivos a "Upload a new document" (antes "Add new Document"). Si alguien
  suelta un archivo del sistema, se muestra un aviso en vez de que el
  navegador lo abra y saque del alta.
- ~~Se dibujaba detrás del panel~~: el documento arrastrado va en un
  `DragOverlay`, por encima de todo. Además los componentes arrastrables ya no
  se redefinen dentro del formulario en cada render.
- **Nuevo**: botón **Assign** en cada documento, porque Fredrik dijo *"here I
  can drag it, but I cannot click it"*. El arrastre empieza a los 5 px, así
  que el clic funciona como clic.

### 2b.4 — Correo de recordatorio de vencidos [6, 7] — mitad frontend hecha 2026-10-01

**Frontend, hecho:** el recordatorio de "See overdue items" se armaba aparte de
las plantillas. Ahora sale de `buildOverdueRowReminder`, con tests:
- nombra el equipo y su serial, por ejemplo "the Chromebook (5CD1234)";
- dice cuántos días va de atraso y a quién escribir;
- firma con quien envía y la compañía, cada uno en su línea;
- copia al tutor aunque `minor` llegue como texto.

**Servidor, pendiente:** el logo de la compañía arriba, "Powered by Devitrak"
al pie y el logo blanco sobre fondo oscuro van en el envoltorio de nodemailer.
El pedido está en `FRONTEND_email_wrapper_ask.md`.

Texto original:
`pages/conditionalPage/tables/OverdueDevicesTable.jsx`,
`memberDetailsDashboard/innerComponents/Reminders.jsx`

- El nombre del dispositivo ("Chromebook"), en lugar de lo que sale ahora.
- Quitar el nombre del colegio del cuerpo, o bajarlo al pie.
- "Powered by Devitrak" al pie, y arriba solo el logo del colegio.
- Sobre fondo oscuro, la versión blanca del logo.

Antes de tocar nada, ver qué cubre ya el módulo de plantillas de correo por
compañía. El branding se resuelve en el servidor desde `x-company-id`, así que
parte de esto puede ser del backend.

### ~~2b.5 — Tiles del inventario del evento: 3 por fila [19]~~ — hecho 2026-10-01

3 por fila desde `lg`, 2 en pantallas medianas y 1 en el teléfono (`quickGlance/utils/eventInventoryTiles.js`). Columnas fijas en vez de `auto-fit`, así que una sola tarjeta ya no ocupa todo el ancho.

`pages/events/quickGlance/components/AllInventoryEventForCustomerOnly.jsx`

### ~~2b.6 — Historial del dispositivo: orden, hora y un `FFF` [20, 23]~~ — hecho 2026-10-01

**Causa del desorden:** `assigned_date` y `returned_date` son columnas `DATE`
(se leen como medianoche), y `create_at` lleva hora. El mismo día, "Added to
inventory" a las 10:00 quedaba por encima de la asignación y la devolución, y
el empate entre esas dos se resolvía por el orden de inserción. Se leía
*added → returned → assigned*.

- **Orden:** primero por día; dentro del día, por hora solo si las dos
  entradas la tienen; si no, por etapa (alta, asignación, devolución).
  `newestCustodyFirst` en `deviceProfileModel.js`, con tests.
- **Hora:** se muestra hora, minutos y segundos cuando el dato la tiene
  (`formatTimelineMoment`). Una columna `DATE` no tiene hora, y no se inventa.
- **`FFF`:** era la ubicación escrita al asignar en una prueba, no un fallo.
  Ahora se muestra como "Location: FFF".

**Para backend (va con 2b.7):** que la asignación y la devolución tengan hora
requiere que `assigned_date` y `returned_date` pasen a `DATETIME`, o que haya
un `created_at` por evento de custodia.

Texto original:

- Sale *added → returned → assigned* cuando lo que pasó fue *assigned → returned*.
  Todo tiene la misma fecha y no hay hora, así que no se ve el orden.
- Lo más nuevo arriba, con hora, minutos y segundos.
- Una línea muestra un `FFF` que parece ser la dirección con la que se asignó.

Es el primer paso de 2b.7 y se puede hacer antes: ordenar por timestamp y
enseñarlo no necesita backend nuevo, siempre que el timestamp exista.

### ~~2b.7 — Audit trail con usuario, empezando por el dispositivo [22]~~ — unida a "Registrar toda acción" (§2)

Se sigue allí desde el 2026-10-05: pide lo mismo para un caso, y la pregunta a
backend de abajo está hecha en `FRONTEND_activity_log_backend_ask_2026-10-05.md`.


Quién hizo qué y cuándo, en cada acción, con un formato común para todos los
audit trails de la app. La referencia es el audit history de QuickBooks.
Fredrik lo separó de los roles personalizados (C1): *"They just need to be
logged."*

**Probablemente necesita backend:** que cada evento del historial guarde su
autor. Preguntarlo antes de diseñar. Relacionado con el log de actividad de
staff (B2) y con el registro de consentimientos (2b.9).

### 2b.8 — Documentos vencidos [14] — frontend hecho 2026-10-01

- **Etiqueta "Expired":** ya estaba en la tarjeta. Ahora también en la lista
  de cada carpeta, con su filtro y su conteo por sección.
- **No asignables en ninguna pantalla:**
  - alta de evento: se ve en la lista, sin Assign ni arrastre, y
    `assignDocument` lo rechaza;
  - quick-glance del evento: deshabilitado en el selector;
  - entrega de equipo a estudiante (`ContractDocumentsPicker`) y a staff
    (`LegalDocumentModal`): no se envía, y se dice cuál quedó fuera.

  Las dos entregas comparten ahora `handoverDocumentSource.js`.
- **De paso:** quick-glance comparaba `_id` en entradas que usan `id`, así que
  si el evento ya tenía un documento, agregarle otro no hacía nada. Corregido.

**Edit document, hecho 2026-10-05 (la mitad del cliente).** Tenía título,
descripción, tipo y uso, pero **ni la fecha de vencimiento ni el estado**: el
único campo que decide si un documento se puede entregar era el único que no
se podía cambiar.
- Chip **Active** / **Expired** junto al título, y campo **Expires on**. Vacío
  = no vence nunca; una fecha por delante de hoy lo reactiva. El texto de
  ayuda lo dice, y cambia cuando el documento está vencido.
- La lista "When displayed" se escribía a mano con seis valores y le faltaban
  School consent y el uso propio de la compañía, así que editar un documento
  solo podía moverlo a uno de esos seis. Ahora ofrece los mismos usos que el
  alta, y conserva el valor actual si ya no se ofrece (`on_login`).
- `public_document` sigue al uso: un documento editado a School consent pasa a
  servirse al tutor sin login, y uno que sale de ese uso deja de ser público.
- La fecha vence **al final del día elegido, en hora local**. Guardarla como
  medianoche UTC la adelantaba un día al oeste de UTC. Y al releerla ya no se
  corta la cadena ISO, que es la fecha UTC: eso adelantaba la fecha un día en
  cada guardado. Las dos reglas están fijadas con tests, ida y vuelta incluida.
- Un guardado fallido dice qué pasó: con 404, que este servidor todavía no
  puede editar documentos.

Todo en `utils/documentEditForm.js`, con 17 tests.

**Backend, pendiente** (`FRONTEND_documents_backend_ask.md`):
- **sigue sin confirmarse la ruta `PUT /api/document/:id`**, así que reactivar
  un documento vencido no funciona hasta que exista. No se probó con un PUT
  real contra producción, porque eso escribe;
- el servidor no rechaza todavía asignar un vencido.

Texto original:
`components/documents/DocumentUpload.jsx`, `pages/Profile/Documents/Documents.jsx`

- Etiqueta **Expired** en todas las vistas donde aparezca.
- No se pueden asignar ni usar en ningún sitio, incluido el alta de eventos.
- En la sección de documentos del admin se pueden editar, cambiar la fecha,
  reactivar o borrar.

Va junto a D1 + D2 (§1), porque es el mismo fichero y la misma pasada por la
navegación. El "no asignable" lo tiene que aplicar también el servidor.

### 2b.9 — Registrar estudiantes sin consentimiento, o con registro [16, 17]
`pages/conditionalPage/components/modals/RegisterMembersToEvent.jsx`,
`innerComponents/StudentConsentPanel.jsx`

Dos opciones: **añadir directamente**, para quien ya firmó un waiver a
principio de semestre, o **pedir consentimiento**. Si se pide, hay que
registrar cada respuesta del tutor con su hora. Eso usa el mismo audit trail
de 2b.7.

### ~~2b.10 — Devolver un dispositivo encontrado desde Edit [21]~~ — hecho 2026-10-06

Repetido el 2026-10-06 con el caso de Fredrik: alguien encuentra un equipo en
el pasillo que figura asignado a otra persona y necesita devolverlo al
almacén desde la ficha del equipo.

**La mitad ya existía:** la ficha ofrecía "Return device" **solo cuando quien
lo tenía era un member**. Un equipo en manos de un staff no ofrecía nada, y
el campo de estado de Edit es de solo lectura a propósito.

Ahora el mismo botón aparece también para un equipo de staff, y abre
`ModalReturnDeviceFromStaff`, que hace la cadena entera: cierra el préstamo,
borra su fila y saca el equipo del evento si lo había. Es la condición de
este punto: ir por la devolución de verdad, no cambiar un campo suelto.
`staffReturnFromDevice.js` arma lo que ese modal espera, con tests.

**La pregunta de "quién puede hacerlo" se resolvió sola:** el mismo permiso
que ya gobierna la entrega y la devolución de member en esta ficha
(`inventory:update`). Tratarlo distinto habría dejado a alguien que sí puede
entregar un equipo sin poder recogerlo.

**Queda fuera:** un equipo que está en un evento, con un consumidor. Eso no
son préstamos sino el pool del evento, y se devuelve desde el evento. **Sin
ver en el navegador.**

Texto original:

El estado de Edit está fijo en "out with someone in event". Hay que poder
pasarlo al almacén. Tiene que ir por la lógica de devolución de verdad, no
cambiando un campo suelto, o el evento lo seguiría contando como fuera.
**Pendiente de decidir quién puede hacerlo.**

### ~~2b.11 — "Device health" → "Condition" [18]~~ — hecho 2026-10-01
`pages/events/quickGlance/components/DeviceHealthBar.jsx:57`

**Corrección al texto de abajo: no chocaba con §3.** La barra cuenta la
condición del inventario **del evento**: `status` del `receiversPool` de
Mongo (`/receiver/receiver-pool-list`, `/receiver/list-receiver-returned-issue`),
o sea lo que se marcó perdido o con defecto al devolver. No lee la columna
`condition` de SQL que el backend va a separar.

"Condition" solo describía la mitad de la barra, que mezclaba dónde está el
equipo con en qué estado volvió. Así que la tarjeta pasa a tener **dos
barras** (`utils/eventDeviceSummary.js`, con tests):
- **Status:** Checked out · On site. Un perdido llega como `{ status: "Lost",
  activity: false }`, igual que uno devuelto, así que se deja fuera de esta
  barra y se avisa: *"N lost devices not counted here — see Condition."*
- **Condition:** Operational · Needs repair · Lost. Needs repair y Lost abren
  la lista de afectados, como antes.

Textos de ayuda actualizados (`help/content/events.js`, `tours.js`).

Texto original:

**No hacerlo suelto.** Choca con la tarea de `condition`/`status` (§3). Hoy
Condition y status son el mismo valor, y el backend los va a separar. Hay que
ver qué campo cuenta esta barra y renombrarlo en la misma pasada que los otros
seis sitios que dicen "Condition".

---

## 2c. Abierto — cambios de contrato del backend, 2026-10-01 (sin desplegar)

> Fuente: `FRONTEND_AGENT_contract_changes_2026-10-01.md`. Llegan en dos ramas
> del servidor, **sin desplegar**: `feat/member-contact-minors` y
> `fix/event-handlers-408`. Regla del documento: el cliente tiene que funcionar
> con los dos contratos hasta que backend confirme el despliegue, y no se quita
> código viejo antes. Los llamadores se buscaron por ruta y se comprobaron el
> 2026-10-01.

### ~~2c.1 — Formulario de edición de member: misma regla que el alta (alta prioridad)~~ — hecho 2026-10-02

**Hecho, pero con la regla del servidor, no con la del alta.** La regla del
alta exige siempre el tutor completo. Aplicada en la edición, bloquearía el
flujo que ya existe: un alumno que pasa a ser menor guarda primero su sección
(*"Save this section, then set up guardian information below"*), y solo
después aparece la del tutor.

- `memberContactMissing`, `memberRowAfterUpdate` y `memberEditContactErrors`,
  en `utils/memberContactRules.js` y con tests, aplican la regla del servidor
  a cómo queda la fila completa. Una actualización que no envía ningún campo de
  contacto no se valida, igual que en el servidor.
- `StudentInfoSection`: valida antes de cada guardado, también al subir y al
  quitar la foto, porque esos guardados envían email y teléfono. Si un adulto
  vacía su email o teléfono, el error aparece en vivo bajo el campo. Si un
  menor queda sin contacto propio y no hay email de tutor, aparece el aviso en
  vivo.
- `GuardianInfoSection`: no deja vaciar el email del tutor de un menor sin
  contacto propio.

Sin verificar: si el servidor compara `minor === 1`. La edición manda `minor`
como booleano (`true`/`false`) cuando hay fecha de nacimiento. Si el servidor
compara estrictamente con 1, trataría a un menor como adulto. Hay que
preguntarlo a backend.

Texto original:

**La regla del servidor:** un adulto necesita `email` y `phone_number`. Un
menor sin email **o** sin teléfono propio necesita `parent_guardian_email`.

**El alta ya cumple, y es más estricta.** `memberContactErrors`
(`utils/memberContactRules.js`) la aplican `Single.jsx` y el import: a un menor
le exige siempre el tutor completo, tenga o no contacto propio. Todo lo que el
cliente acepta, el servidor también. No hace falta tocarla.

**La edición no la usa.** `UpdateMemberInformation.jsx` no llama a
`memberContactErrors`. Hay que aplicársela, sobre todo en los tres casos que el
servidor rechazará:
- vaciar el email o el teléfono de un adulto;
- desmarcar `minor` en un alumno sin contacto propio;
- vaciar el email del tutor de un menor sin contacto propio.

El servidor valida cómo queda la fila completa, no solo lo que se envía. Las
ediciones sueltas de `StudentInfoSection.jsx` y `GuardianInfoSection.jsx`
también hacen `PATCH /db_member/update-member-info`, así que hay que revisarlas.
`AdvanceGrades.jsx` solo cambia el curso y no le afecta.

### ~~2c.2 — Marcar el campo concreto con `missing` en el 400~~ — hecho 2026-10-02

**Hecho.** `memberServerFieldErrors` traduce `missing` a los campos del
formulario (`phone_number` → `phone`) con los mismos mensajes que la
validación del cliente. Fuera de un 400, o sin `missing` (servidor viejo),
devuelve `{}`. `memberServerErrorMessage` lee `message` y, si no está, `msg`.
Las dos están en `memberContactRules.js`, con tests.
- `Single.jsx`: marca el campo que el servidor nombra, y la marca se quita al
  editarlo. El `catch` ya no lee solo `msg`.
- `StudentInfoSection`: marca el campo bajo el input. El `onError` y el
  `catch` escribían el error dos veces, y el segundo pisaba al primero. Ahora
  pasan por una sola función.
- `GuardianInfoSection`: muestra el motivo en lugar de "Request failed…".
- `school/compliance/loadDemoData.js` no se tocó: es el sembrador del demo y
  no tiene formulario.

Texto original:

`POST /db_member/new-member` (`Single.jsx:191`, y `school/compliance/loadDemoData.js:126`)
y `PATCH /db_member/update-member-info` (los tres sitios de 2c.1) devuelven
`400 { ok: false, message, missing: ["email" | "phone_number" | "parent_guardian_email"] }`.
Hoy ningún llamador lee `missing`.

- Hay que traducir los nombres del servidor a los del formulario
  (`phone_number` → `phone`) y marcar ese campo.
- No hay que analizar el texto de `message`.
- Con el servidor viejo `missing` no viene, así que se trata como opcional.
- Ojo con la clave del mensaje de error: los endpoints de members usan
  `message`, los de eventos `msg`.

### ~~2c.3 — Import de estudiantes: mostrar las filas saltadas~~ — hecho 2026-10-02, salvo dos puntos

**Hecho.** `summarizeBulkMembersResult` (`memberImportPresentation.js`, con
tests) lee `inserted`, `skipped` y `contact_skipped`.
- Cada fila saltada se muestra con el mismo `#` de la tabla de vista previa
  (`row + 1`), el nombre y el motivo. Las saltadas por no tener nombre salen
  como un conteo aparte.
- Con filas saltadas, el diálogo no se cierra. El aviso dice "N of M members
  imported", y el botón Import queda deshabilitado hasta cargar otro fichero,
  para no crear dos veces las que sí entraron.
- El 400 de "ninguna fila cumple" también lista las filas, y el mensaje sale
  de `message`.
- Con el servidor viejo, que no manda `contact_skipped` ni conteos, se lee
  como que entraron todas, igual que antes.

**Sin hacer, a propósito:**
- **Dejar de mandar `email: ""`.** El servidor nuevo trata igual omitirlo,
  pero no sabemos si el viejo acepta la fila sin ese campo. Se hace después del
  despliegue.
- **El 202.** Sigue sin saberse cuándo responde 202 `bulk-members` ni dónde
  viene entonces `contact_skipped`. Es la pregunta para backend de abajo.

Texto original:

`POST /db_member/bulk-members` (`MultipleFromXLSX.jsx:156`) devuelve
`contact_skipped: [{ row, missing, msg }]` en las respuestas 201, 202 y 400.

- `row` es el índice desde 0 en la lista enviada, **no** la fila del Excel.
  Para mostrarla hay que traducirla con el `__rowNum__` de cada fila, que
  nuestro parser ya guarda. No sirve sumar 2, porque `sheet_to_json` se salta
  las filas vacías.
- `skipped` también cuenta las filas sin nombre, que no salen en
  `contact_skipped`.
- Hoy ningún sitio lee `skipped` ni `contact_skipped`: un import que salta
  filas parece completo. Hay que mostrar cada fila saltada con su motivo.
- **El aviso de éxito cuenta mal:** dice `${parsed.rows.length} members
  imported` (`MultipleFromXLSX.jsx`), no `inserted`. Con filas saltadas, el
  número es falso.
- **El `catch` lee la clave equivocada:** usa `error.response.data.msg`, pero
  los endpoints de members responden `message`. El 400 de "ninguna fila
  cumple" mostraría el texto genérico en vez del motivo.
- Con el servidor viejo no viene: `?? []`.
- **Comprobar el 202:** el documento dice que `contact_skipped` viene en el
  202, pero este componente no maneja ningún `jobId`: trata cualquier
  `ok: true` como terminado. Hay que preguntar a backend cuándo responde 202
  este endpoint, y si en ese caso `contact_skipped` viene en la respuesta o en
  el `result` del job (`/jobs/owned/:jobId`).
- La validación previa en el cliente ya existe (`memberContactErrors`), y es
  más estricta que el servidor.
- `xlsxImportUtils.js:519` y `:543` mandan `email: ""` y
  `parent_guardian_email: ""` cuando faltan. El servidor lo acepta igual que
  omitirlos, pero pide omitirlos. Es un cambio menor.
- **Responde lo pendiente de 2b.1:** el servidor nuevo trata `email: ""` igual
  que sin email.

### 2c.4 — `event_staff`: el 408 deja de significar "ya estaba"

`POST /db_event/event_staff`. El único llamador es `eventStaffSync.js:62`.

`isAlreadyLinked` (`eventStaffSync.js:34`) trata **408 y 409** como "ya
vinculado". Se hizo así el 2026-09-30, porque el servidor viejo respondía 408
ante el duplicado. Con el nuevo, el duplicado es 409 y cualquier otro fallo es
500 inmediato.

- **Mientras convivan los dos contratos, el 408 se queda.** Quitarlo antes
  rompería "terminar un borrador" contra el servidor viejo.
- **Después del despliegue hay que quitar el 408.** Si se deja, un timeout real
  se contaría como staff vinculado sin estarlo.
- No hay reintentos específicos en este endpoint: el bucle de `syncEventStaff`
  no reintenta, y no hay `retry` de react-query.

### 2c.5 — `DELETE /db_event/:id`: informe para backend, sin tocar el cliente

**Respuesta a lo que preguntan:** el cliente manda el id en la URL **y**
`{ email: user.email }` en el body (`hook/useDraftEventActions.jsx:78`, el
Delete de un Draft). El servidor lee el id del evento de `body.email`, así que
recibe el **email del administrador** como id. **El borrado en SQL de un Draft
nunca ha borrado nada.** Respondía 408, y con la rama nueva responderá 500.

Consecuencias en el cliente, comprobadas en `remove()`:
- **Hoy el Delete de un Draft falla entero** siempre que encuentra el id de SQL.
  El borrado de SQL va primero y con `await`. El 408 llega a los 30 s, salta al
  `catch` y el borrado de Mongo no llega a ejecutarse. El usuario espera 30 s y
  ve "The draft could not be deleted.". Solo funciona en un borrador sin fila en
  SQL.
- Con la rama nueva pasa lo mismo, pero con un 500 inmediato.
- Por indicación del documento, el cliente no se toca. El arreglo es del
  servidor: leer el `:id` de la URL. Cuando lo arreglen, el Delete de un Draft
  empezará a funcionar. Es el borrado que se quería, pero hay que probarlo en el
  navegador, junto con la duda de §2 sobre filas huérfanas.

Hay que mandárselo al equipo de backend.

---

## 2d. Abierto — plan de acción FedRAMP del dashboard (sin trackear hasta ahora)

> Fuente: `fedRAMP/FRONTEND_action_plan_2026-09-28.md`. Nunca había entrado en
> este tracker. Cada punto se comprobó contra el código el 2026-10-05: **ninguno
> está hecho.** El plan cuenta como ya aportado el MFA en el cliente, las
> alertas de dependencias (125 → 7) y quitar los `console.*` del bundle
> (`62f623fb`).

### F0.1 — Borrar dos secretos muertos del bundle, y rotarlos
`src/config/ConfigEnvExport.jsx:22,26`: `twilio_auth_token` y
`secrete_key_encrypt` se exportan y no los usa nadie. Borrarlos son minutos.
**Hay que rotarlos igual**, porque ya se publicaron en bundles anteriores. La
rotación es de quien tenga las cuentas.

### F0.2 — `auth-token` es una credencial compartida en JavaScript público
`src/api/devitrakApi.jsx:195`. Es la misma para todos los usuarios. Necesita que
el servicio AWS acepte el JWT de sesión. Mientras tanto: rotar y dejar escrita
la exposición.

### F0.3 — Dejar de comparar contraseñas contra el hash en el navegador
`compareSync` contra el hash bcrypt del administrador, en
`signatureVerificationDocuments/StaffMember.jsx:183` y en
`Profile/my_password/components/Body.jsx:53`. **Es un cambio coordinado:**
cuando el backend deje de servir el hash, las dos pantallas fallan, así que el
endpoint que verifique la contraseña en el servidor tiene que llegar a la vez.

### F0.4 — Validar el entorno al arrancar
No existe ninguna validación. `VITE_APP_HEADER_AUTH_TOKEN`,
`VITE_APP_SECRETE_KEY_ENCRYPT` y `VITE_APP_TWILIO_AUTH_TOKEN` se usan y no
están en `.env.dev.example`. Medio día, con su test. No depende de nadie.

### F1.1 — Dejar de leer el rol numérico heredado
Quedan 12 lecturas de `user.role` que no pasan por `resolveRoleType`.
Algunas solo lo reenvían al servidor (`ItemTable.jsx:193,400`), y otras viven
en el código muerto `roleCapabilities.js`. Es un barrido, más un test que
prohíba el patrón.

### F1.2 — Qué cabecera de tenant lee el servidor
Nosotros mandamos `x-company-id` y `s-company-lq` (`buildRouteScopedHeaders`).
El informe dice que no. Es una pregunta para backend, no un cambio nuestro
hasta saber la respuesta.

### F1.3 — CI con puerta
El único workflow (`.github/workflows/dev-image.yml`) publica la imagen de
desarrollo. No ejecuta tests, ni lint, ni build antes de desplegar.

### F1.4 — Inventario de módulos criptográficos
Listar qué cifra o firma el cliente y con qué librería. Sin empezar.

---

## 2e. El backend respondió — 2026-10-06

> `BACKEND_answers_to_dashboard_2026-10-06.md`. **Casi todo está escrito pero
> sin desplegar**, así que el servidor se comporta como hoy hasta que mergeen.
> Solo están vivos: los filtros del registro de actividad (desde el 05-10) y el
> comportamiento de `minor`.

### Hecho ya, porque no espera a ningún despliegue

- **`minor`: alineadas las lecturas.** Confirmado que el servidor compara
  `Number(minor) === 1` en todas, y que la edición **no normaliza**, así que hay
  que escribir `true`/`false` (ya lo hacíamos). Cuatro sitios comparaban
  `minor === 1` en estricto: el aviso de "guardian CC'd" de los vencidos, la
  columna de la tabla, la cabecera del perfil y el portal público. El campo
  llega como número casi siempre, pero no siempre, y ya hubo un incidente por
  esto (ver `Reminders.jsx`). `isMinorMember` pasa a ser compartido en
  `ageCalculationUtils.js`, con tests.
- **Borrar un Draft: decidido lo que el backend preguntó.** `sqlDeleteOutcome`
  (con tests): un **404** significa que no hay fila SQL, que es lo normal en un
  borrador que nunca la tuvo, así que se sigue y se borra el documento de
  Mongo; un **409** significa que el evento todavía tiene inventario o staff, y
  ahí se para y se dice por qué, porque borrar Mongo dejaría la fila huérfana.
  Se quitó el `{ email }` del body, que el servidor ignora. Confirmado además
  que hoy **no borra nada** y responde `201 ok`.

### Esperando su despliegue, sin trabajo nuestro

- **Refund:** teníamos razón, y es peor de lo que creíamos: **ningún refund
  funciona desde el 2026-03-18**. El validador aceptaba `payment_intent` y los
  controladores leen `paymentIntent`. El arreglo acepta los tres nombres y
  **nuestro payload no cambia**. Después, esas rutas exigirán sesión y
  `transaction:update`: hay que contemplar **404** (el pago es de otra
  compañía) y **403** (rol sin permiso).
- **`PUT /api/document/:id` existe** en una rama, y la ajustaron a lo que manda
  `EditDocument.jsx`: aceptan `PUT`, ya no exigen `x-company-id` y
  `public_document` se acepta pero **no se guarda**, vuelve en
  `ignored_fields`. Reactivar un vencido con fecha futura o `null` funciona
  tal como lo construimos.
- **`bulk-members`:** el `202` llega cuando el job pasa de 4 s, y **trae
  `jobId` y `contact_skipped` a la vez**. Falta implementar el seguimiento del
  job; hoy damos por terminado cualquier `ok: true`.

- **Detener / reanudar recordatorios de vencido por dispositivo**
  (`FRONTEND_overdue_reminders_2026-10-07.md`, backend `9d61857`): **cliente
  hecho 2026-10-07.** `utils/overdueReminders.js` (con tests) y la tabla de
  Overdue devices: columna Reminders (Active + próximo envío / Stopped + fecha),
  Stop con confirmación y Resume, solo con `member:update`. El botón aparece
  cuando la fila trae `reminders_stopped_at`, así que se enciende solo al
  desplegar. "Send all reminders" ya no incluye los detenidos. **Sin ver en el
  navegador.**

### Lo que queda por hacer cuando desplieguen

- **Quitar nuestras 13 llamadas a `registerStaffActivity`.** El middleware
  lleva desplegado desde el 05-10, así que **ya se está registrando dos veces**
  todo lo que pasa por el servidor. Ninguna de las nuestras registra algo que
  no llegue al servidor, así que se van todas. Conviene comprobar primero un
  caso real, porque perder entradas de una bitácora es peor que duplicarlas.
- **Dejar de escribir en `transaction-audit-log`**
  (`AddingDevicesToPaymentIntent.jsx`): es otra colección, sin autor y sin
  filtros, y el servidor ya registra las transacciones.
- **Quitar nuestro filtro de caché** cuando el reporte deje de devolverlos.
- **Pintar su `summary`/`display`** en vez de nuestro `describeLogAction`,
  dejando el nuestro de respaldo. El servidor distingue cosas que el cliente no
  ve, como una devolución de una asignación, o una lectura de datos de alumnos.

### Decisiones pendientes

1. **`GET /api/document/:id` es público para CUALQUIER documento**, no solo los
   de consentimiento. Si la regla es que solo esos sean públicos, hay que
   añadir el campo en el servidor **y** cerrar el GET para el resto. Nos
   preguntan si lo queremos.
2. ~~**Audit trail del dispositivo (2b.7)**~~ — **hecho 2026-10-06.** La
   pestaña leía solo las tablas SQL de custodia, que dicen a quién se le
   entregó un equipo pero **no quién lo entregó**. Ahora pide también
   `?serial_number=` al registro de actividad y entrelaza las dos fuentes por
   fecha (`deviceActivityTrail.js`, con tests). Las frases salen de
   `staffActivityLogUtils`, el mismo vocabulario que la bitácora de staff,
   que es el "formato común" que pidió Fredrik. Nada se descarta por
   duplicado: "se le entregó a X" y "lo entregó Y" son dos hechos distintos
   del mismo momento. Si la petición falla, la mitad de custodia se sigue
   viendo. **Sin ver en el navegador.**

---

## 3. Abierto — de esta semana, fuera de toda lista

### Paso 4 de dependencias — desbloqueado, en standby por decisión
7 advisories: `vite` 5→8, `sharp`, `esbuild`, PWA.

**`million` ya no es el obstáculo: se quitó el 2026-09-25.** Y al analizarlo
apareció que el riesgo era menor de lo que parecía — `vitest@4` se trajo su
propio `vite@8.3.1` (su rango de peers no acepta la 5), así que **las 4054
pruebas ya corren sobre Rolldown/Oxc**. Lo que queda por validar es la
configuración del build, no el código fuente.

El único bloqueo real es `vite-plugin-pwa@0.20.5`, que declara `vite ^5`. La
1.3.0 acepta `^3 … ^8` y se puede subir sola, antes que Vite.

### Una transacción reembolsada lo dice — hecho 2026-10-06

Pedido el 2026-10-06. Una transacción reembolsada decía **"Closed"**, igual que
un depósito capturado o liberado: los tres caminos guardan exactamente
`{ active: false }` y nada más, así que el registro no sabe por qué se cerró.

**Sin campo nuevo:** capturar y liberar solo existen en un depósito, y
reembolsar solo en un cargo, así que **un cargo cerrado solo puede estar
reembolsado**. `describeTransactionState` lo distingue, con tests. Sobrevive a
recargar la página porque sale de lo que ya está guardado. Un depósito cerrado
se queda en "Closed", porque desde aquí no hay forma de saber si se capturó o
se liberó, y decir otra cosa sería adivinar.

El botón ya decía "Refunded" y quedaba deshabilitado; ahora el chip de estado
dice lo mismo, que es lo que se lee al pasar la vista por la tabla.

**Ojo:** esto no se puede ver hasta que desplieguen el arreglo del refund, que
no funciona desde marzo. **Nada de esto marca un reembolso hecho fuera del
dashboard**, por ejemplo desde Stripe: eso solo lo sabría el servidor.

**Pendiente, de su aviso:** cuando esas rutas pidan permiso, contemplar el
**403** y el **404** con su propio mensaje. Hoy caen en el genérico.

### Refund en la tabla de transacciones: "A valid payment intent id is required"
`pages/events/quickGlance/consumer/ConsumerDetail/StripeTransactionTable.jsx:120`

Reportado 2026-10-02. Al pulsar **Refund** en la tabla de transacciones del
consumidor (detalle del evento), el servidor responde:

```json
[{ "field": "payment_intent", "message": "A valid payment intent id is required" }]
```

**Lo que se comprobó en el cliente:**
- `handleRefund` manda `POST /stripe/refund` con `{ paymentIntent: record.paymentIntent }`,
  en camelCase, más la cabecera de idempotencia. El contrato
  (`src/docs/api-payloads.md`) documenta el cuerpo como `paymentIntent`, y el
  middleware es `validateRefundPayload`.
- El botón solo aparece en las transacciones "Card charge"
  (`describeTransactionKind`): id de más de 16 caracteres, que no empieza por
  `pi_cash` y sin equipos pedidos. O sea que el id que se manda tiene forma
  de `pi_...`. Esos cargos son, sobre todo, los cobros de servicios.
- **El error nombra `payment_intent`, en snake_case**, no el `paymentIntent`
  que enviamos.

**Hipótesis, a confirmar con backend antes de tocar nada:**
1. `validateRefundPayload` lee `payment_intent` y no `paymentIntent`. Entonces
   el campo le llega vacío siempre, y **ningún refund funciona**.
2. O valida el formato del id con una regla que nuestros ids no cumplen.

**Mismo riesgo en el refund parcial:** `consumers/components/UI/ExpandedLostButtons.jsx:78`
manda `POST /stripe/partial-refund` con el mismo `paymentIntent` y pasa por el
mismo validador. Hay que probarlo también.

**Qué preguntar a backend:** qué clave y qué formato espera
`validateRefundPayload`, y si cambió hace poco. Si la clave es
`payment_intent`, el arreglo en el cliente es mandar esa clave en los dos
endpoints, con un test. No hay que mandar las dos claves "por si acaso" sin
saberlo.

### ~~Cada selector de documentos ofrece solo los de su camino~~ — hecho 2026-10-05

Pedido el 2026-10-05: los documentos de evento solo en eventos, y los de staff
en todas las acciones de staff que piden documentos. Antes, los cuatro
selectores cargaban la biblioteca entera.

- `documentsForContext` (`Profile/Documents/utils/documentLibrary.js`, con tests):
  `event` → solo uso Event; `staff` → solo Staff (`onboarding`); `school` → solo
  School consent, el flujo de consentimiento del alumno en Education
  (`StudentConsentPanel`, vía `fetchSchoolConsentDocuments`); `member` → el resto
  (Consumer y el uso propio de la industria, por ejemplo "Students" en
  Education). Los documentos School consent ya no aparecen en las entregas de
  equipo.
- Alta de evento (`newEventProcess/documents/Form.jsx`) y detalle del evento
  (`DisplayDocumentsContainer.jsx`): `event`. Un documento subido desde el alta
  de evento empieza con uso Event (`DocumentUpload` acepta `defaultUse`), porque
  si no, no aparecería en la lista desde la que se subió.
- Entregas de equipo (`handoverDocumentSource`, con tests): la de staff
  (`LegalDocumentModal`) usa `staff`; la de member (`ContractDocumentsPicker`)
  y la de consumidor desde Consumers, que reutiliza `LegalDocumentModal`, usan
  `member`. La carpeta fijada de entrega de equipo se filtra igual, según el
  registro de la biblioteca. Si no tiene nada para esa entrega, se ofrece la
  biblioteca.

**Decisión:** un documento **sin uso asignado** (anterior al campo) sigue
apareciendo en todos los selectores, **salvo en el de consentimiento**: esos
documentos se sirven a tutores sin login, así que ahí solo entra lo marcado
como School consent. No hay ruta para editar un documento
(2b.8), así que ocultarlo obligaría a volver a subirlo. Cuando exista la
edición, se puede pasar a no mostrarlo en ninguno hasta que se le asigne un uso.

**Sin probar en el navegador.**

### El import de inventario asigna las imágenes por posición, no por fila
`src/pages/inventory/utils/inventoryImportRows.js:93`

Encontrado 2026-09-30 al hacer lo mismo para estudiantes.
`rowNumber = index + FIRST_DATA_ROW`, pero `sheet_to_json` **se salta las filas
vacías**. Con una fila en blanco en medio de la hoja, cada imagen de debajo
queda asignada a la unidad de la fila siguiente, y lo mismo pasa con los
números de fila de los errores. El import de estudiantes ya usa `__rowNum__`,
el número real que SheetJS pone en cada fila. Aquí es un cambio de una línea
más un test.

### `quill` 2.0.3
Advisory low sin parche publicado. Camino no alcanzable: no usamos
`getSemanticHTML` ni el clipboard, y la vista sanea con DOMPurify.

### ~~192 `console.*` en el bundle de producción~~ — hecho 2026-10-01

Medido en un build real: había 26 `log`, 45 `warn` y 118 `error`. Ahora
`esbuild.pure` quita, solo en el build, `log`, `info`, `debug` y `trace`. Se
conservan `warn` y `error`, porque para eso sirve la consola en producción. El
`terserOptions` muerto se quitó: Vite minifica con esbuild, y terser no es
dependencia del proyecto. Quedan 2 `console.log` dentro de la librería `xlsx`.

Texto original:
`vite.config.js` pone `terserOptions.compress.drop_console` pero no
`minify: "terser"`, y el minificador por defecto de Vite ignora `terserOptions`.
Una línea, y no depende de ninguna major.

### ~~`condition` deja de ser un duplicado de `status`, y tenemos respaldos que lo dan por hecho~~ — hecho 2026-10-01

**Corrección al texto de abajo, comprobada en el código:**

- **Las dos líneas de respaldo no iban a mentir.** `DownloadXlsx.jsx:114` y
  `ShippingInventoryModal.jsx:308` leen `status` **primero**, y `status` es
  columna real de `item_inv`. `condition` solo entra si falta `status`. Se
  dejaron como estaban.
- **Cuatro de los seis sitios no leen SQL.** `DeviceDatabase`,
  `TableIssuesPerDevice` y `TableDetailPerDevice`, y también la barra de
  2b.11, salen del `receiversPool` de Mongo. Allí "condition" es el `status`
  del pool, y el despliegue no les afecta.
- **El que sí mentía es el perfil del dispositivo**, en tres sitios: el chip
  de la cabecera (`deriveDeviceState`), `DeviceSpecs` y `DeviceSidebar`.
  Leían `item.condition`, pero `item_inv` **no tiene** esa columna
  (`FRONTEND_inventory_page_endpoints.md` §6.1). El valor venía de la fila de
  `tracking_item` que se mezcla con el ítem, o sea de lo que registró una
  asignación a un evento. Tras el despliegue se quedaría congelado mientras
  `status` cambia. Ahora los tres leen `status`, mediante
  `resolveDeviceCondition` en `deviceProfileModel.js`, con tests.

Texto original:

Aparecido 2026-09-25 revisando el arreglo del cierre de eventos. El backend
descubrió que la columna `condition` **nunca ha tenido valor propio**: 75.000 de
75.000 filas la tienen idéntica a `status`, porque un parser incompleto escribía
el estado en las dos. Ya está arreglado de su lado, sin desplegar.

El día que despliegue, estas dos líneas empiezan a mentir:

```js
condition: item?.status ?? item?.condition ?? ""   // DownloadXlsx.jsx:114
status:    item.status  ?? item.condition ?? ""    // ShippingInventoryModal.jsx:308
```

Son correctas mientras los dos campos sean el mismo valor. Después, la primera
unidad que cierre como `Damaged` se seguirá leyendo `Operational`.

Y hay seis sitios que pintan «Condition» como campo propio y llevan todo este
tiempo enseñando el estado con otra etiqueta: `DeviceSpecs`, `DeviceSidebar`,
`DeviceDatabase`, `TableIssuesPerDevice`, `TableDetailPerDevice` y la columna del
XLSX.

**Hay que hacerlo antes o a la vez que su despliegue**, no después. Se les pidió
aviso previo por esto.

### ~~`Input.jsx:91` — el label se dibuja sobre el borde~~ — hecho 2026-10-06

**Corrección: no eran ocho llamadores, es uno.** De los 58 ficheros que usan
el Input de UX, solo `EndEventCountModal.jsx` pasa `label` ("Scan a serial or
a tag"). El "ocho" salió de un grep mío que contaba otra cosa.

`label={label}` activado. El `InputLabel` siempre va con `shrink`, así que
flota sobre el borde; esa prop es la que abre el hueco donde se mete, porque
MUI dimensiona con ella el `<legend>` del contorno.

**Historia:** se comentó, se reactivó cuatro horas después y se volvió a
comentar el 18-02 (`38ac53e8`, `48affbdd`, `4748cd9f`). El único motivo
anotado fue "potential UI rendering issues", sin nombrar ninguno. Ahora hay
`Input.test.jsx` con 5 tests que fijan el hueco, para que no se apague una
cuarta vez a ciegas.

**Sin ver en el navegador:** la pantalla a mirar es el modal de conteo al
cerrar un evento.

### ~~`/status` sin tests propios~~ — hecho 2026-10-05

**Hecho.** `ServiceStatusPage.test.jsx`, 13 tests con el hook simulado. Fijan
las tres promesas de la página: sin `uptime90d` no hay línea de uptime (nunca
0% ni 100%); `unknown`, o un estado desconocido, nunca sale verde, y si no se
pudo llegar al worker dice que no pudo comprobarlo, no que haya caída; y el
mensaje del incidente se pinta escapado. También cubren que la lista recorre
componentes nuevos y que el enlace va al historial. Se comprobó que vigilan:
con la página rota a propósito (un estado desconocido pintado como
operativo), el test falla.

Texto original:
La página es pública y de cara a clientes. Las tres reglas que importan están
fijadas en el hook, no donde se ven: que `uptime90d: null` omita la línea, que
`unknown` nunca sea verde, que el mensaje del incidente vaya escapado.

### ~~CSP de IIS, sin verificar~~ — comprobado 2026-10-02, no hay CSP

**Cerrado.** `GET https://admin.devitrak.net/status` responde 200 sin cabecera
`Content-Security-Policy` (`Server: openresty`, `X-Powered-By: ASP.NET`), e
`index.html` no la declara con `<meta>`. El worker de estado responde 200.
Si algún día se añade una CSP en el IIS o en el proxy, hay que incluir
`devitrak-status.cacaminero.workers.dev` en `connect-src`.

Si el host sirve `Content-Security-Policy` con `connect-src`, hay que añadir
`devitrak-status.cacaminero.workers.dev` o la página no podrá consultar nada.

**Comprobado en el repo:** `public/web.config` no tiene `customHeaders`, así
que la aplicación no manda ninguna CSP. Solo queda la posibilidad de que el IIS
la ponga a nivel de servidor o de sitio. Eso se ve abriendo `/status` en
producción, o en la configuración del IIS, no en este código.

---

## 4. Abierto — pero no es código

- **La #21 de Fredrik**: revisar con él el resultado del import en ABC
  Interpreting. Es su mitad, y es la próxima sesión.
- **Decisión suya sobre `serial_number`**: si se exige cuando el pegado trae
  cabecera. Tres opciones y una recomendación.
- **Issue #1 — desplegable de categorías vacío.** Hipótesis: `POST
  /db_company/categories` devuelve vacío para la compañía de prueba. **Es una
  pregunta de datos, no de código**: hay que ver el cuerpo real de la respuesta
  antes de tocar nada.
- **C2 — lector RFID OR2505.** No es HID; no llega nada a los inputs. El OR2508
  sí funciona y es el del demo. Requiere hardware o SDK, no frontend.
- ~~**C3 — FedRAMP.**~~ **El estudio ya estaba hecho:** informe de readiness
  (`fedRAMP/Devitrak FedRAMP Readiness.html`, 15-16/09), su revisión desde el
  frontend y un plan de acción (`fedRAMP/FRONTEND_readiness_review_2026-09-28.md`,
  `fedRAMP/FRONTEND_action_plan_2026-09-28.md`). La carpeta `fedRAMP/` está
  **sin trackear** en git. El trabajo que sale del plan está en §2d.
- ~~**B11 — el asterisco de campo obligatorio.**~~ **Ya estaba hecho** el
  2026-08-31 en `6827e52c`. `Label` tiene una prop `required`, que pinta
  `.form-label__required` en rojo de peligro, y se barrieron 33 marcas hechas a
  mano en 19 ficheros. Comprobado el 2026-10-02: los asteriscos que quedan
  usan esa clase.
- **Etiquetas físicas para inventario** (reunión 29-09 `1:18:10`): si un
  cliente quiere etiquetar sus equipos, hace falta una solución, y hoy no la
  hay. Fredrik lo investiga.

---

## 5. Cerrado, comprobado hoy — para que nadie lo reabra

| Ítem | Evidencia |
|---|---|
| **El aviso de "Update available" no se cerraba** (§1) | `62cd1a53`. Falta ver en el navegador, tras el próximo despliegue, que Refresh recarga y el aviso no vuelve |
| **A1** — la guarda de escritura fallida no llegaba a la ruta de member | Está en `AssignmentDevicesToMember.jsx:545` **y** en la de staff. Era «lo más prioritario de la lista» |
| **A2** — logo de la compañía en el recibo | Cadena de fallback desde la sesión en `ReceiptPage.jsx:134` |
| **B1** — copia del panel de escaneo | El texto que citaba el documento ya no existe |
| **B6** — dirección opcional | Hecho, con su propia memoria de la demo que rompió |
| **B13** — «Custody history» → «Audit trail» | La cadena no aparece en el código |
| **D4** — rediseño del diálogo de carpeta | Extraído a `FolderDialog.jsx`, con test |
| **F1** — el forecast mostraba cada fecha un día antes | `d9cd82b8` |
| **F2** — modal de forecast | `01576be5` + `fde2e369` |
| **§1 de 07-27** — los 3 commits de scoped roles sin pushear | Los tres están en `origin/main` |
| **Bloqueo de D3** — subida de PDF contra el 202 | `DocumentUpload.jsx` hace polling de `/jobs/owned/:jobId` |
| **Las 28 de Fredrik (18-09)** | Cerradas y verificadas con la suite en verde tras cada tanda |
| **Dependencias: 128 → 7 advisories** | Cuatro tandas, `fd6a95ed` … `d75fdcfd` |

Los ocho ítems del walkthrough que su propio documento ya daba por cerrados
(B2, B3, B4, B5, B7, B8, B12, B15, B16) siguen cerrados y no se repiten aquí.

---

## 6. Orden sugerido

Fredrik fijó la prioridad general el 2026-09-25 `21:10`, y pesa más que esta
lista: **FedRAMP por delante.** Lo dijo justo después de pedir el dashboard de
gestión, y para ponerlo por detrás. Es un cambio respecto al 31-08, donde
FedRAMP era "un día para entender las especificaciones".

Dentro de lo que sí es esta lista (reordenada el 2026-09-29):

1. ~~El aviso de actualización~~, hecho en `62cd1a53`. Queda verlo en el navegador tras el despliegue.
2. **Import de estudiantes** (2b.1). Fredrik manda el correo al colegio esta
   semana, y este import es por donde van a entrar.
3. **Eventos en Draft** (§2). Tú lo dejaste como prioridad al cerrar la
   reunión del 29-09.
4. **La tanda corta de la reunión del 29-09**: 2b.2 a 2b.6, pantalla por
   pantalla. Fredrik pidió revisar lo cambiado en la próxima reunión, y esto es
   lo que más se ve por poco esfuerzo.
5. **D1 + D2 junto con documentos vencidos** (2b.8). Es un solo diseño de la
   navegación de documentos.
6. **La tanda de textos de la plantilla de inventario.** La decisión del
   `image_url` ya está hecha en `b037a10b`.
7. **Audit trail** (2b.7), en cuanto backend confirme si guarda el autor de
   cada acción. Después, los consentimientos (2b.9), que lo usan.
8. **E2**, un bug con una pista concreta que se cierra en una tarde.
9. **Las tres de una línea**: `drop_console`, tests de `/status`, CSP de IIS.
10. ~~**`condition` antes de que el backend despliegue**~~, hecho 2026-10-01: era el perfil del dispositivo, no los respaldos. (2b.11 resultó independiente y también está hecha.)
11. **S1 y D3**, pantallas sueltas que ya no dependen de nada.
12. **R3 e Issue #1** cuando haya respuesta del backend, y **devolver un dispositivo encontrado** (2b.10) cuando se decida quién puede hacerlo: esperan un dato o una decisión, no
   esfuerzo nuestro.
13. **C1** y el **dashboard de gestión** cuando se decida. Ninguno cabe en una
   semana, y el segundo ni siquiera tiene alcance todavía.

`vite-plugin-pwa` y el paso 4 van cuando tú digas: hoy no molestan a nadie, y el
día que se toquen conviene que no haya otra cosa abierta.

**Y una que no está en la lista porque no es nuestra:** Fredrik iba a probar el
flujo de colegios durante el fin de semana del 26-27 y mandar lo que encuentre.
Conviene dejar hueco para eso antes de empezar nada largo.
