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
| **Abierto, total** | **37** |
| — bloquea (§1) | 2 |
| — trabajo de producto (§2) | 12 |
| — reunión del 29-09 (§2b) | 8 |
| — surgido esta semana (§3) | 8 |
| — no es código (§4) | 7 |
| Cerrado desde que se escribió su lista | 23 |

> Contado 2026-09-28 sección por sección. El encabezado venía diciendo 22
> porque se fue sumando a mano sobre una cifra inicial que ya no cuadraba con
> el cuerpo. Un tracker cuyo total no coincide con su contenido es el problema
> que este documento vino a resolver, así que el número sale de contar.

---

## 1. Abierto — bloquea

### D1 + D2 — los documentos se listan en plano, ignorando el campo que ya existe
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

### D3 — rediseño del formulario de subir documento
`src/components/documents/DocumentUpload.jsx`

**Su bloqueo desapareció:** la subida de PDF ya maneja el 202 + polling
(`pollJobStatus`, `/jobs/owned/:jobId`). El rediseño se puede hacer cuando se
quiera.

### E1 — crear consumidor desde un evento
`src/pages/consumers/utils/CreateNewUser.jsx`. Solo maquetación; no tocar lo que
envía el formulario.

### ~~E2 — el staff añadido desde quick-glance sale sin nombre~~ — ya estaba hecho

**Cerrado el 2026-08-26 en `6787de1c`**, antes de que se escribiera esta lista.
Se comprobó el 2026-10-01: `StaffTable` resuelve el nombre con `buildStaffRows`,
y los 49 tests de `eventStaffUtils` pasan.

### E3 — notificación por email desde el detalle de consumidor
`src/components/notification/email/`. La carpeta es compartida: un cambio ahí
aterriza en todas las pantallas que mandan correo. Revisar cada llamador.

### E4 — página de confirmación de pago desde quick-glance
Toca payment intents de Stripe. Leer `useCreateTransaction` antes de mover nada
y conservar la forma de la petición.

### S1 — crear proveedor
`src/pages/inventory/actions/utils/suppliers/NewSupplier.jsx`. Verificado: **0
usos de `action-form__`**, así que sigue siendo la pantalla rara de esa carpeta,
donde las hermanas ya se reconstruyeron.

### ~~B10 — staff y estudiantes deberían sentirse el mismo producto~~ — ya estaba hecho

**Cerrado el 2026-09-01**, según `FRONTEND_pending_tasks_2026-08-31.md`: el menú
de staff sale de `staffProfileActionList`, con tests, escrito para leerse junto
al de estudiantes. Esta lista lo dio por abierto por error.

### B9 — una palabra para una persona, no dos
`industryProfiles.js` ya resuelve el vocabulario por industria — existe el
concepto de cómo llama cada compañía a la gente de su módulo. Pero queda al
menos una etiqueta a mano: `mainPageUtils.test.js` fija `"Add new member"`. La
fontanería está; falta enchufar ese botón.

**Revisado 2026-10-01:** la ficha ya se hizo el 2026-08-31 (`audienceWords`).
Lo que queda es el menú "Manage" de la lista (`buildManageMembersMenu`), que usa
el plural donde va el singular, por ejemplo *"Add new patients"*. "member" es
solo el valor por defecto cuando la compañía no tiene industria.

### Merchant service ofrecido sin cuenta de Stripe detrás

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

### Textos de la plantilla de import — cuatro de la reunión del 25-09

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
- Confirmar que `DELETE /db_event/:id` no deja filas huérfanas en tablas
  relacionadas.
- El matiz de Fredrik: un borrador que llega a su fecha de fin pasa a
  *inactive*. Hoy sigue diciendo Draft.

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

### Dashboard de gestión de Devitrak

Pedido el 2026-09-25 `20:25`: alta de compañías, datos de Stripe, suscripciones,
uso por cuenta. **Es un producto aparte**, no una pantalla de este dashboard.

Sin alcance ni fecha, y él mismo lo puso por detrás de FedRAMP en la frase
siguiente. Queda como intención registrada, no como tarea lista para coger.

### R3 — la reconciliación de alcance por ubicación
`saveScopedRole` escribe el alcance en SQL pero no toca el `preference.managerLocation`
de Mongo, que es lo que lee el filtro de inventario del servidor.
`useCompanyScopeLocations.js:14` lo dice en un comentario: *«R3 reconciliation is
a separate task»*.

**Decisión pendiente con backend:** ¿reconcilia el servidor (preferible, nos
saca del doble escritura) o escribimos los dos sitios?

### Seguimientos de etiquetas de rol
`useRoleLabel` existe y se consume. Quedan los ítems de UI en cola de la función
de renombrado por compañía. Sin fecha.

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

Solo el wizard de **alta**. **El de edición de grupo tiene el mismo campo**
(`edit/useLogic.jsx:346`, `edit/ux/wizard/EditFieldsStep.jsx`) y
probablemente el mismo hueco. Sin comprobar ni tocar: se reusan
`PendingSubLocationNotice` y `pendingSubLocation` si hace falta.

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

### 2b.4 — Correo de recordatorio de vencidos [6, 7]
`pages/conditionalPage/tables/OverdueDevicesTable.jsx`,
`memberDetailsDashboard/innerComponents/Reminders.jsx`

- El nombre del dispositivo ("Chromebook"), en lugar de lo que sale ahora.
- Quitar el nombre del colegio del cuerpo, o bajarlo al pie.
- "Powered by Devitrak" al pie, y arriba solo el logo del colegio.
- Sobre fondo oscuro, la versión blanca del logo.

Antes de tocar nada, ver qué cubre ya el módulo de plantillas de correo por
compañía. El branding se resuelve en el servidor desde `x-company-id`, así que
parte de esto puede ser del backend.

### 2b.5 — Tiles del inventario del evento: 3 por fila [19]
`pages/events/quickGlance/components/AllInventoryEventForCustomerOnly.jsx`

### 2b.6 — Historial del dispositivo: orden, hora y un `FFF` [20, 23]

- Sale *added → returned → assigned* cuando lo que pasó fue *assigned → returned*.
  Todo tiene la misma fecha y no hay hora, así que no se ve el orden.
- Lo más nuevo arriba, con hora, minutos y segundos.
- Una línea muestra un `FFF` que parece ser la dirección con la que se asignó.

Es el primer paso de 2b.7 y se puede hacer antes: ordenar por timestamp y
enseñarlo no necesita backend nuevo, siempre que el timestamp exista.

### 2b.7 — Audit trail con usuario, empezando por el dispositivo [22]

Quién hizo qué y cuándo, en cada acción, con un formato común para todos los
audit trails de la app. La referencia es el audit history de QuickBooks.
Fredrik lo separó de los roles personalizados (C1): *"They just need to be
logged."*

**Probablemente necesita backend:** que cada evento del historial guarde su
autor. Preguntarlo antes de diseñar. Relacionado con el log de actividad de
staff (B2) y con el registro de consentimientos (2b.9).

### 2b.8 — Documentos vencidos [14]
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

### 2b.10 — Devolver un dispositivo encontrado desde Edit [21]

El estado de Edit está fijo en "out with someone in event". Hay que poder
pasarlo al almacén. Tiene que ir por la lógica de devolución de verdad, no
cambiando un campo suelto, o el evento lo seguiría contando como fuera.
**Pendiente de decidir quién puede hacerlo.**

### 2b.11 — "Device health" → "Condition" [18]
`pages/events/quickGlance/components/DeviceHealthBar.jsx:57`

**No hacerlo suelto.** Choca con la tarea de `condition`/`status` (§3). Hoy
Condition y status son el mismo valor, y el backend los va a separar. Hay que
ver qué campo cuenta esta barra y renombrarlo en la misma pasada que los otros
seis sitios que dicen "Condition".

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

### 192 `console.*` en el bundle de producción
`vite.config.js` pone `terserOptions.compress.drop_console` pero no
`minify: "terser"`, y el minificador por defecto de Vite ignora `terserOptions`.
Una línea, y no depende de ninguna major.

### `condition` deja de ser un duplicado de `status`, y tenemos respaldos que lo dan por hecho

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

### `Input.jsx:91` — el label se dibuja sobre el borde
`label={label}` comentado en el `OutlinedInput`. Ocho llamadores lo pasan;
descomentarlo cambia el aspecto de todos a la vez, así que pide navegador.

### `/status` sin tests propios
La página es pública y de cara a clientes. Las tres reglas que importan están
fijadas en el hook, no donde se ven: que `uptime90d: null` omita la línea, que
`unknown` nunca sea verde, que el mensaje del incidente vaya escapado.

### CSP de IIS, sin verificar
Si el host sirve `Content-Security-Policy` con `connect-src`, hay que añadir
`devitrak-status.cacaminero.workers.dev` o la página no podrá consultar nada.

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
- **C3 — FedRAMP.** Fredrik pidió un día de estudio de las especificaciones para
  tenerlas en cuenta al construir, no una certificación.
- **B11 — el asterisco de campo obligatorio.** No se pudo confirmar por grep si
  la inconsistencia sigue. Pide mirar un formulario.
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
10. **`condition` antes de que el backend despliegue**, no después, y con él "Device health" (2b.11).
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
