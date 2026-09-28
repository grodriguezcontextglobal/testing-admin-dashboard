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
| Abierto | **22** |
| Cerrado desde que se escribió su lista | 16 |
| De lo abierto, que bloquea a alguien hoy | 3 |

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

### El aviso de "Update available" no se cierra al pulsar Refresh
`src/components/serviceWorker/ServiceWorkerUpdateNotifier.jsx:22-33`

Reunión 2026-09-25 `0:15`, y fue lo primero que le pasó a Fredrik: *"I clicked
on refresh, but it didn't disappear or nothing happened."*

Dos defectos en el mismo sitio:

- La notificación va con `duration: 0` y **el botón no la cierra**. Si la
  recarga ocurre desaparece con la página; si no ocurre, se queda.
- `updateServiceWorker(true)` solo recarga si hay un worker **en espera** al que
  mandarle `SKIP_WAITING`. Si no lo hay, no pasa nada y no hay ni error ni
  señal.

Hace falta cerrar la notificación al pulsar, un estado de "aplicando", y un
respaldo con `window.location.reload()` si el controlador no cambia. Sin el
respaldo, el botón sigue sin hacer nada en el caso que él pisó.

Está aquí y no en producto porque es la primera impresión de cada despliegue, y
porque un botón que no responde enseña a no pulsarlo.

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

### E2 — el staff añadido desde quick-glance sale sin nombre
`src/pages/events/quickGlance/staff/`. Bug. Mirar primero la clave de caché: es
la misma familia que el hueco de invalidación que arregló `71c56930`.

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

### B10 — staff y estudiantes deberían sentirse el mismo producto
`StaffDetail.jsx` y el árbol de `memberDetailsDashboard` se construyeron sobre
ProfileShell en momentos distintos y tienen menús diferentes.

### B9 — una palabra para una persona, no dos
`industryProfiles.js` ya resuelve el vocabulario por industria — existe el
concepto de cómo llama cada compañía a la gente de su módulo. Pero queda al
menos una etiqueta a mano: `mainPageUtils.test.js` fija `"Add new member"`. La
fontanería está; falta enchufar ese botón.

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

---

## 5. Cerrado, comprobado hoy — para que nadie lo reabra

| Ítem | Evidencia |
|---|---|
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

Dentro de lo que sí es esta lista:

1. **El aviso de actualización** (§1). Es la primera impresión de cada
   despliegue y ya falló delante de él.
2. **D1 + D2**, lo único que bloquea trabajo de producto, y es un solo diseño
   para los dos.
3. **La tanda de textos de la plantilla**, que es un fichero y una pasada — con
   la decisión del `image_url` resuelta antes de empezar.
4. **E2**, un bug con una pista concreta que se cierra en una tarde.
5. **Las tres de una línea**: `drop_console`, tests de `/status`, CSP de IIS.
6. **`condition` antes de que el backend despliegue**, no después.
7. **S1 y D3**, pantallas sueltas que ya no dependen de nada.
8. **R3 e Issue #1** cuando haya respuesta del backend: esperan un dato, no
   esfuerzo nuestro.
9. **C1** y el **dashboard de gestión** cuando se decida. Ninguno cabe en una
   semana, y el segundo ni siquiera tiene alcance todavía.

`vite-plugin-pwa` y el paso 4 van cuando tú digas: hoy no molestan a nadie, y el
día que se toquen conviene que no haya otra cosa abierta.

**Y una que no está en la lista porque no es nuestra:** Fredrik iba a probar el
flujo de colegios durante el fin de semana del 26-27 y mandar lo que encuentre.
Conviene dejar hueco para eso antes de empezar nada largo.
