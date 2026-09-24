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
> Se conserva `FRONTEND_pending_tasks_2026-09-18.md`: no es un tracker, es el
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
| Abierto | **17** |
| Cerrado desde que se escribió su lista | 16 |
| De lo abierto, que bloquea a alguien hoy | 2 |

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

### Paso 4 de dependencias — en standby por decisión
7 advisories: `vite` 5→8, `sharp`, `esbuild`, PWA. Antes hay que decidir qué
pasa con **`million`**, que corre sobre todos los componentes y lleva parado
desde 2024-06 mientras Vite 8 cambia de Rollup/esbuild a Rolldown/Oxc.

### `quill` 2.0.3
Advisory low sin parche publicado. Camino no alcanzable: no usamos
`getSemanticHTML` ni el clipboard, y la vista sanea con DOMPurify.

### 193 `console.*` en el bundle de producción
`vite.config.js` pone `terserOptions.compress.drop_console` pero no
`minify: "terser"`, y el minificador por defecto de Vite ignora `terserOptions`.
Una línea, y no depende de ninguna major.

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

1. **D1 + D2**, que es lo único que bloquea trabajo de producto y es un solo
   diseño para los dos.
2. **E2**, que es un bug con una pista concreta y se cierra en una tarde.
3. **Las tres de una línea**: `drop_console`, tests de `/status`, CSP de IIS.
4. **S1 y D3**, que son pantallas sueltas y ya no dependen de nada.
5. **R3 e Issue #1** cuando haya respuesta del backend: los dos están esperando
   un dato, no esfuerzo nuestro.
6. **C1** cuando se decida que toca. Es el único que no cabe en una semana.

`million` y el paso 4 de dependencias van cuando tú digas: hoy no molestan a
nadie, y el día que se toquen conviene que no haya otra cosa abierta.
