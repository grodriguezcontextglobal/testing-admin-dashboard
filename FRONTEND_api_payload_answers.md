# Respuestas del cliente a `FRONTEND_api_payload_findings.md`

> **De:** frontend. **Para:** backend. **Fecha:** 2026-08-25.
> Responde a las cuatro preguntas abiertas (§C1, §C2, §C3, §A2) y agrega tres
> cosas que encontramos de este lado. Cada afirmación lleva `archivo:línea`.

---

## Resumen

| # | Pregunta del backend | Respuesta |
| --- | --- | --- |
| §A2 | ¿Qué esperaba hacer el `POST /api/stripe/subscriptions/:id`? | **Cancelar al fin del periodo.** Es tu ruta `POST /api/stripe/cancel/subscriptions/:id`, mismo body. No hace falta ruta nueva |
| §C2 (A3/D1) | ¿Qué campos edita el cliente de un documento? | `title`, `description`, `document_type`, `trigger_action`. **No** `folder_id` ni `expiration_date` |
| §C1 (A4/D2) | ¿La tarea cubre las dos, o solo la primera? | **Solo la segunda** (el path). Y tu firma propuesta no nos sirve: no tenemos `path_id` |
| §C3 (B3) | ¿El "summary" es otro contenido? | Sí: es el *fallback* cuando el XLSX pasa de 20 MB. Mismos destinatarios, sin adjunto, +3 campos |
| §B1 | ¿Push en el roadmap? | Decisión de producto, pero ojo: **ya hay un botón vivo** que llama esa ruta |

---

## §A2 · El `POST /api/stripe/subscriptions/:id` es tu `cancel/subscriptions`

No hace falta que adivines ni que crees nada. El único call site es
`src/pages/Profile/billing/components/component/ModalCancelOptions.jsx:79`, en el
flujo de cancelación de la suscripción de la company, y manda exactamente:

```js
await devitrakApi.post(`/stripe/subscriptions/${subscriptionExposedId}`, {
  cancelAtPeriodEnd: true,
  cancellationComment: feedbackCancellation,
});
```

Ese body es idéntico al que documentás para
**`POST /api/stripe/cancel/subscriptions/:id`** (§A2, `routes/stripe.js:168`). Es un
path equivocado del lado del cliente, no una ruta faltante: nos falta el segmento
`/cancel`.

**Corrección nuestra:** en la ronda anterior te dijimos que esto estaba "en discusión,
no implementado". Nos equivocamos — el código está vivo y es la única cancelación que
tiene la UI. Lo arreglamos de nuestro lado; no requiere trabajo tuyo.

Un detalle que sí necesitamos confirmar: acto seguido el cliente hace
`PATCH /api/stripe/updating-subscription/{companyAccountStripe.id}` leyendo
`respUpdateCancelSubscription.data.companyCustomer` de la respuesta del cancel
(`ModalCancelOptions.jsx:88-95`). ¿`POST /api/stripe/cancel/subscriptions/:id`
devuelve `companyCustomer`? Si no, ese encadenamiento escribe `undefined`.

---

## §C2 (A3/D1) · Campos a editar de un documento

El formulario es `src/pages/Profile/Documents/EditDocument.jsx`. Carga con
`form.setFieldsValue(response.data.document)` (línea 22) y manda **todo el objeto del
formulario** (línea 42). Los `Form.Item` declarados son exactamente cuatro:

| Campo | Línea |
| --- | --- |
| `title` | 103 |
| `description` | 112 |
| `document_type` | 121 |
| `trigger_action` | 136 |

**Lista blanca pedida: esos cuatro.**

Dos diferencias con tu propuesta de §D1:

- Vos proponés `document_name`; **nosotros usamos `title`**. Si en la tabla el campo se
  llama distinto, decinos cuál gana y ajustamos el formulario — preferimos alinearnos
  al nombre real de la columna antes que pedirte un alias.
- **No tocamos `folder_id` ni `expiration_date`.** Si querés incluirlos en la lista
  blanca para uso futuro no nos molesta, pero hoy la UI no los edita.

De acuerdo con dejar el reemplazo del binario fuera del `PATCH`: hoy no existe esa
intención en la UI.

**Nota:** hasta que exista el `PATCH`, `EditDocument.jsx` está roto — hace
`PUT /document/:id`, que no existe. Es una pantalla alcanzable desde
`/profile/documents`. La vamos a deshabilitar mientras tanto.

---

## §C1 (A4/D2) · Solo la segunda, y `:path_id` no nos sirve

### Qué borra el cliente hoy

`src/pages/inventory/utils/TreeNode.jsx:164`:

```js
await devitrakApi.post("/db_location/sub-location-path/delete", {
  company_id: user.sqlInfo.company_id,
  location_id: effectiveRootId,
  sub_location_path: path.slice(1),
});
```

Es **el path ordenado** (tu opción 2 de §D2) — la misma tripleta que exige la creación
`POST /api/db_location/sub-location-path`. Nunca la sub-locación por id.

### Por qué `DELETE /api/db_location/sub-location-path/:path_id` no nos sirve

**El cliente nunca tiene un `path_id`.** `path_id` y `path_key` no aparecen ni una vez
en `src/` — el árbol se arma desde `locationPathsTree` / `structuredCompanyInventory` y
lo que el nodo conoce es su ruta, no el id de la fila.

**Lo que pedimos:** borrado por la misma tripleta con la que se crea.

```jsonc
// DELETE /api/db_location/sub-location-path   (o POST .../delete si DELETE con body molesta)
{ "company_id": 2, "location_id": 41, "sub_location_path": ["Piso 2", "Rack B"] }
```

Si preferís `:path_id` por diseño, entonces necesitamos que `locationPathsTree`
devuelva el `path_id` de cada nodo y lo persistimos — pero eso es trabajo en los dos
lados y una ruta más frágil.

### La opción 1 no nos afecta

`DELETE /api/db_sub_location/sub-locations/:id` **el cliente no lo llama**. Lo único que
usamos de ese módulo es la creación, en `CreateSubLocationModal.jsx:38`.

Así que el hardening que describís (agregar `validateJWT` + `checkTokenVersion` +
`authorizePermission` + scope de company) **no es un cambio de contrato para nosotros**:
podés cerrarla sin coordinar nada. Hoy es una ruta anónima que borra filas de cualquier
company; nos parece que debería ir primero, antes que la funcionalidad nueva.

### Un tercero que conviene que mires

`TreeNode.jsx:162` borra una locación de primer nivel con
`POST /db_location/locations/${nodeId}` — sin body. Está en el contrato, así que
asumimos que es correcto, pero confirmanos que ese `POST` es efectivamente el borrado y
que el `:id` **no** se ignora como en `POST /api/db_item/:id`. Si se ignorara, estaría
pasando lo mismo que en §A5.

---

## §C3 (B3) · El summary es otro contenido: es el fallback sin adjunto

`src/components/notification/email/EmailReturnRentalItems.jsx` tiene **dos ramas**:

```js
const xlsxAttachment = generateOptimizedXLSXFile({ itemsDataResult });
if (xlsxAttachment.size > 20) {            // MB — generateOptimizedXLSXFile.jsx:47,60
  → POST /nodemailer/returned-items-summary-notification     // línea 55
} else {
  → POST /nodemailer/returned-items-to-renter-notification   // línea 111
}
```

O sea: cuando el XLSX de ítems devueltos pasa de **20 MB** no lo adjuntamos (el tope del
server es 50 MB y el base64 cuenta, `API_CLIENT_GUIDELINES.md` §3) y mandamos un resumen.

**Qué lista el resumen y a quién va** (`EmailReturnRentalItems.jsx:42-53`):

```jsonc
{ "subject":     "Returned items to renter - Summary",
  "staffEmails": ["..."],          // employees de la company con role < 2 (root_admin + admin)
  "supplierInfo": [ ... ],         // providerCompanies, igual que el mail con adjunto
  "itemCount":    128,             // cuántos ítems se devolvieron
  "returnDate":   "2026-08-25",    // YYYY-MM-DD
  "message":      "Due to the large number of items (128), detailed information has been omitted..." }
```

Contra el `returned-items-to-renter-notification` que ya existe, la diferencia es:
**sin `attachments`**, y con tres campos extra: `itemCount`, `returnDate`, `message`.
Destinatarios y `supplierInfo` son los mismos.

**Nuestra preferencia:** no un endpoint nuevo. Aceptá esos tres campos como opcionales
en `returned-items-to-renter-notification` y dejá que `attachments` sea opcional — el
HTML decide qué renderizar según venga `attachments` o `itemCount`. Es menos superficie
que mantener dos rutas que mandan casi lo mismo. Si preferís separarlas, también nos
sirve; decinos cuál y apuntamos ahí.

---

## §B1 · Push: hay un botón vivo llamando a una ruta que no existe

La decisión de roadmap es de producto, pero antes de eso: **no es una llamada
huérfana**. `POST /api/admin/push/broadcast` se dispara desde
`src/pages/events/quickGlance/components/notification/PushNotificationModal.jsx:42`, y
ese modal está montado detrás de un botón real en las acciones del quick-glance del
evento (`formatEventDetailInfo/ButtonSections.jsx:134` lo abre, `:292` lo renderiza).

Es decir, hoy un administrador puede abrir "enviar notificación push", escribirla,
enviarla y recibir un 404. Vamos a esconder el botón hasta que exista backend.

Si entra al roadmap: la plataforma es **web/PWA** — no hay app móvil en este cliente.

---

## Cosas nuestras que salen de tus respuestas

### 1. Necesitamos los artefactos regenerados

Nuestra copia en `src/docs/` es la anterior: **484 entradas y sin
`/api/cloudinary/upload-image`**; la tuya dice 485/450 con los cinco defectos del
generador corregidos. Tenemos un chequeo automático que corre contra ese JSON
(`src/api/apiContractAudit.test.js`, barre las 948 llamadas del cliente), así que
mientras la copia esté vieja el chequeo valida contra datos caducos. Pasanos los cuatro
archivos regenerados.

Relacionado: `scripts/extract-api-payloads.js` quedó copiado en nuestro repo, pero **no
lo corremos** — usa `ROOT = resolve(__dirname, "..")` y recorre `routes/`/`controller/`,
que aquí no existen, y escribe a `<repo>/docs/`, no a `src/docs/`. Corrido de este lado
produciría un contrato vacío aparentando éxito.

### 2. A1 quedó a medias de nuestro lado

Arreglamos el segmento (`/api/stripe/stripe-transactions-saved-list`), pero como
advertís, el **GET no filtra**. Y hay algo peor: la llamada es

```js
devitrakApi.get("/stripe/stripe-transactions-saved-list", { paymentIntent: payment_intent })
```

y en axios el segundo argumento de `.get()` es el **config**, no los params — así que
`paymentIntent` no viaja de ninguna forma. Estamos trayendo *todas* las transacciones y
filtrando en el cliente (`ConfirmationPayment.jsx:66`, `groupBy` por `provider`).
Lo vamos a pasar al `POST` con el filtro en el body, como recomendás.

### 3. A5 ya está aplicado, y con el orden que pedís

`ReturningLeasedEquipModal.jsx` ya manda `{ item_id, company_id }`. Pendiente de tu §D3:

- Cambiar a la ruta explícita `POST /api/db_item/delete-item`.
- **Cerrar el lease antes de borrar el ítem** — esto no lo estábamos haciendo y es el
  punto que más nos preocupa de tu respuesta: hoy borramos la fila de `item_inv` y
  dejamos `lease_info` apuntando a un ítem inexistente.
- Mostrar `skipped_count` cuando el rol tenga scope, para no decir "borrado" sobre
  ítems que se omitieron en silencio.
- El modal maneja **un ítem a la vez**, así que no necesitamos el bulk por ahora.

Mientras tanto encontramos que ese flujo **nunca llegaba al paso 3**: el paso 1 armaba
su payload con `user.aqlInfo.company_id` — grafía que no existe en ningún otro lado del
código, el campo es `sqlInfo` — así que lanzaba un TypeError y terminaba en el `catch`.
Por eso el POST sin body llevaba ahí sin que nadie lo notara. Ya está corregido.
