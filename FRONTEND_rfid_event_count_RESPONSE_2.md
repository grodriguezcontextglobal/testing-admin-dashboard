# Respuesta del cliente — cierre de las preguntas abiertas

**Responde a:** `BACKEND_rfid_event_count_REPLY.md` · 2026-09-02
**De:** frontend · **Fecha:** 2026-09-02

Cerrado de nuestro lado. Su pregunta del §A queda respondida abajo, entregamos
las claves que pidieron para `warehouse-items`, y quedan **tres cosas** nuevas:
una trampa de vocabulario en `id_type`, un detalle de UI que sale de su
`summary.scanned`, y un documento que no llegó a este repo.

---

## 1. `id_value` guarda hex crudo en mayúsculas. Confirmado

Su lectura es la correcta y es mejor que la nuestra. **El cliente nunca va a
mandar ASCII decodificado.**

Los tres argumentos que dan lo sellan, y el tercero es el que más nos importa:
si mañana cambia qué se graba —serial, `item_id`, TID— el contrato no se mueve.
Eso es exactamente lo que queremos, porque la decisión del §A es de producto y
no queremos que arrastre un cambio de esquema detrás.

Consecuencias de nuestro lado, para que queden por escrito:

- **`serialsFromCodes()` queda muerto para este flujo.** Lo escribimos cuando
  asumíamos resolución en cliente. No lo vamos a llamar desde el conteo. Se
  queda en el repo solo como vía offline si algún día hace falta, y con un
  comentario que dice por qué no se usa acá.
- **`decodeSerialFromEpc()` se usa en un solo lugar:** proponer el item al
  registrar un tag. Nunca durante el conteo.
- Lo que enviamos en `scanned` es literalmente lo que el lector emitió,
  normalizado a mayúsculas y deduplicado. Nada interpretado.

---

## 2. Las claves de `POST /db_item/warehouse-items` — los tres call sites

Lo que pidieron. Verificado en el código, no de memoria:

| Call site | Body |
|---|---|
| `inventory/table/ItemTable.jsx:138` | `company_id`, `role`, `preference` |
| `details/detailComponent/components/ContainerContent.jsx:74` | `company_id`, `warehouse`, `enableAssignFeature` |
| `details/deviceProfile/hooks/useDeviceProfile.js:188` | `company_id`, `item_group`, `category_name` |

**La unión son 7 claves**, y las tres llamadas las escriben como literales — no
hay ninguna clave dinámica en el cliente. Así que una lista blanca con esas 7
no nos rompe nada, y de paso confirma que **ninguno de nuestros call sites es el
vector**: el problema es que cualquier usuario autenticado puede armar su propia
petición, no que nosotros mandemos claves raras.

**El aviso que pidieron, y es concreto:** `role` y `preference` **no son
columnas de `item_inv`**. `role` es el rol numérico legacy y `preference` es un
**arreglo de nombres de ubicación** (con `user.preference` como respaldo). Son
entradas de alcance que el handler interpreta, no filtros por columna. Si la
lista blanca se construye a partir de las columnas de `item_inv`, **`ItemTable`
se rompe** — la tabla principal de inventario, que era justo el riesgo que
plantearon. Los dos casos hay que tratarlos aparte del resto.

Dos detalles más que pueden importar en la implementación:

- `preference` llega como **arreglo**, no escalar. Si el saneamiento asume
  valores escalares, esa clave necesita su propio camino.
- `warehouse` y `enableAssignFeature` llegan como `1` numérico, no `"1"`.

---

## 3. ⚠️ Trampa de vocabulario: `id_type` `'serial'` vs `'barcode'`

Nueva, y silenciosa si no se cierra ahora.

Nuestro parser clasifica cada lectura con `CODE_KIND = { EPC: 'epc', SERIAL:
'serial' }`. Su tabla usa `id_type` `'epc' | 'barcode'`. **`'serial'` no existe
en su vocabulario.**

Como `id_type` es `VARCHAR(16)` sin `ENUM` (§2.1 del diseño: agregar un valor a
un ENUM es otro schema change, y estamos de acuerdo) y el `UNIQUE` es **por
tipo**, un registro que mande `id_type: 'serial'` no falla: crea un tercer tipo
que nada lee. El identificador queda guardado, invisible para `reconcile`, y el equipo
aparece como faltante sin ningún error. Es exactamente la clase de fallo
silencioso que estuvimos evitando todo el documento anterior.

Cerramos así de nuestro lado: **el cliente mapea `SERIAL → 'barcode'` al
registrar**, y lo dejamos con un test que fija la traducción.

**Lo que pedimos:** una lista blanca de `id_type` en el servidor que responda
**400** ante un tipo desconocido. `VARCHAR(16)` sin validación acepta cualquier
cosa, y un typo nuestro se vuelve data corrupta en vez de un error. Es la misma
lógica de su §E: mejor un pedido incoherente rechazado que un 403 —o un éxito—
incomprensible.

---

## 4. `summary.scanned` cuenta únicos: la pantalla tiene que decir las dos cosas

Gracias por precisarlo, porque cambia la UI. Si el operador barre 400 equipos y
el lector los oye 4000 veces:

- nuestro parser reporta `totalReads: 4000` y `uniqueCount: 400`
- su `summary.scanned` reporta **400**

Si la pantalla muestra solo el número del servidor, el operador que sabe que
pasó el lector diez veces sobre la tarima va a leer "400" y pensar que el lector
falló. Vamos a mostrar **ambos**, con las palabras separadas: *"4.000 lecturas ·
400 equipos"*. El primero es del cliente, el segundo es la verdad del servidor.
Ninguno de los dos solo cuenta la historia.

---

## 5. Opción 0 (TID): nos parece la mejor, y ya la soportamos

Su opción 0 es más fuerte que nuestra opción 1 y el argumento de la falla
ruidosa vs silenciosa nos convence. Un TID no se decide, no se duplica y no
depende de qué escriba la impresora.

**Consecuencia de flujo que hay que ver antes de elegirla:** un TID no se puede
derivar del trabajo de impresión ni decodificar a nada, así que el registro deja
de ser "leer el tag y proponer el item" y pasa a ser **emparejar dos lecturas**
— el tag y el código de barras del mismo equipo, de a pares.

Eso **no nos cuesta nada**: `parsePastedScanDump` ya lee esa forma y está
probado. Un volcado emparejado es exactamente su modo de dos columnas:

```
SN-001    E28011700000020D7A1B2C3D
SN-002    E28011700000020D7A1B2C4E
```

`parsePastedScanDump(dump, { column: 1 })` devuelve los TID, y la primera
columna da el serial con el que proponemos el `item_id`. Hay un test que cubre
el caso de la fila que perdió su tag: se reporta con número de línea en vez de
registrarse a medias.

Así que por nosotros: **opción 0 si el OR2505 expone TID, opción 1 si no.**
Ninguna de las dos nos agrega trabajo respecto de la otra.

---

## 6. ⛔ `FRONTEND_rfid_event_count_endpoints.md` no llegó a este repo

Su §4 lo declara el contrato vigente y su cierre dice que podemos construir
contra él desde ya. **No existe en `testing-admin-dashboard`** — asumimos que
quedó en `server-testing`.

Todos los documentos cruzados anteriores viven en este repo
(`FRONTEND_event_allocation_changes.md`, `FRONTEND_task_queue_changes.md`,
`FRONTEND_staff_activity_log.md`, y ahora `DESIGN_rfid_event_count.md`), así que
la convención es dejarlo acá. Sin él estamos construyendo contra el contrato
del §8 del diseño original, que ya sabemos que cambió en al menos tres puntos
—techo de 2000, el 400 de company mismatch, y `summary.scanned` en únicos.

Es lo único que nos bloquea para empezar los cinco puntos de UI.

---

## Estado, y quién tiene la pelota

| # | Qué | Quién |
|---|---|---|
| 1 | **§A: decidir qué se graba en el tag** | producto (Gustavo) — bloquea el etiquetado |
| 2 | Preguntar al fabricante si el OR2505 expone **TID** | Gustavo — decide entre opción 0 y 1 |
| 3 | Correr la consulta de desbloqueo de la demo | Gustavo / backend |
| 4 | Copiar `FRONTEND_rfid_event_count_endpoints.md` a este repo | backend — nos bloquea |
| 5 | Lista blanca de `id_type` con 400 | backend |
| 6 | Commitear y desplegar, avisando el ambiente | backend |
| 7 | Los cinco puntos de UI + el mapeo `SERIAL → 'barcode'` | frontend, tras el 4 |

Nada de lo nuestro espera al 1: el parser, el decodificador y la acumulación
local ya están y no cambian con ninguna de las cuatro opciones de etiquetado.
Lo que espera es la pantalla, y espera por el 4.

---

## Una pregunta para el fabricante, no dos

Se acumularon dos consultas de hardware y conviene mandarlas juntas, porque las
dos deciden trabajo grande:

1. **¿El OR2505 expone el banco TID en sus lecturas?** Decide el §A. Si sí, el
   problema de unicidad desaparece sin que nadie tenga que reetiquetar.
2. **¿Tiene modo de salida conmutable (HID / puerto COM / solo SDK)?** Decide si
   el puente en C# hace falta. En modo HID, las lecturas entran por el teclado y
   el puente entero desaparece.

Las dos son de una línea y ninguna necesita que nadie escriba código para
contestarse.

---

# Anexo — 2026-09-03

`FRONTEND_rfid_event_count_endpoints.md` llegó al repo. Gracias. Ya construimos
contra él, y abajo van sus tres preguntas del §7.

## Una corrección que absorbimos del contrato

Su **§4.2** corrigió nuestro modelo: los `ambiguous` aparecen **también** en
`missing_*`, y `matched + missing = expected` se cumple siempre. Nuestro
`countSummary` local sumaba por su cuenta y habría contado de más. Ahora el
resumen del servidor es la autoridad, y hay un test que verifica esa invariante y
marca `balanced: false` si alguna vez no se cumple — para que la pantalla no
declare un conteo terminado sobre números que se contradicen.

## §7.1 — Formato del EPC: no tienen que hacer nada

Sigue abierto con el fabricante, **pero el cliente lo resuelve antes de enviar**:
lo que va en `scanned` es siempre hex compacto en mayúsculas, sin separadores.

Al releer su §1.4 encontramos un hueco propio y lo cerramos: si el lector espacia
los bytes (`34 25 E1 6C …`), el parser lo tomaba como valores separados o lo
clasificaba como serial, y en los dos casos el fallo era **silencioso** — el
valor sale tal cual, el servidor no lo matchea nunca, y todos los equipos
reportan como faltantes sin un error en ninguna parte. Ahora un valor cuyas
piezas son **todas** bytes hex de dos caracteres se vuelve a unir. Esa condición
es la seguridad de la regla: un serial real mide más de dos caracteres, así que
una lista de códigos distintos nunca se pega. 6 tests.

**Lo que pedimos:** que el servidor **no** agregue limpieza de separadores. Si
normalizamos en dos lugares con reglas distintas terminamos con dos verdades. El
cliente entrega compacto; `id_value` guarda compacto.

## §7.2 — Cierre parcial: sin confirmación, con el número en el botón

Confirmado, y es la misma respuesta del §F.2. El botón dice **«Check in 48 of
50»** y los faltantes ya están a la vista en la tabla, ordenados primero. Un
modal de «faltan 2, ¿cerrar igual?» se aprende a descartar en la tercera vez; un
número en el botón no.

## §7.3 — Etiquetado masivo, con `register-bulk`

**Masivo como camino principal.** La demo son 100 receptores y el histórico son
miles: de a uno no es viable. `register` individual queda para la excepción
—reemplazar una etiqueta dañada— que es una acción sobre un equipo que ya está
abierto en pantalla.

La forma que va a tomar, y encaja con lo que ya está probado:

```
SN-001    3425E16CB4A10000000004D2      ← volcado emparejado, dos columnas
SN-002    3425E16CB4A10000000004D3
```

El operador lee el código de barras y el tag de cada equipo, pega el volcado, y
la pantalla muestra la tabla de revisión antes de guardar. `parsePastedScanDump`
ya lee esa forma (`{ column: 1 }`) y reporta con número de línea la fila que
perdió su tag, en vez de registrarla a medias. La primera columna resuelve el
`item_id`; la segunda es el `id_value`.

Después, un `register-bulk` por cada 500 entradas — ahí trocear **sí** es seguro,
como dice su §1.3.

Tres cosas de su contrato que la UI va a respetar, y vale que sepan que las
leímos:

- **El 409 del `register` individual muestra `conflict.item_id` con enlace al
  item**, no un «error al guardar». Es la única información útil de esa
  respuesta.
- **El 200 de «already registered for this item» se trata como éxito.** Reenviar
  es idempotente, y contarlo como error haría que un reintento pareciera falla.
- **`register-bulk` responde 200 con `ok: true` aunque todo haya chocado.**
  Escribimos `readBulkRegisterOutcome` (6 tests) que distingue lote limpio,
  parcial y `allFailed`, precisamente para no reportar un etiquetado terminado
  que no etiquetó nada. Es la clase de bug que este repo ya pagó dos veces.

## Lo construido contra el contrato

`src/pages/inventory/utils/eventCountContract.js` — 25 tests. Capa pura, cero UI:

| Función | Qué fija del contrato |
|---|---|
| `buildCountRequest` | `company_id` en body **y** header; normaliza y deduplica como el servidor, así que el conteo que valida contra 2000 es el que ustedes van a ver; **rechaza** por encima del tope en vez de trocear |
| `readCountResponse` | los seis buckets; `ambiguous` como anotación y nunca como suma; `balanced` verifica `matched + missing = expected` |
| `countRows` | una fila por equipo con los **cinco** estados, faltantes-con-tag primero; `ambiguous` anota la fila con sus hermanos en vez de crear un sexto estado |
| `readBulkRegisterOutcome` | el 200-con-conflictos del §2.2 |

248 tests verdes en `src/pages/inventory/utils`, lint limpio.

**Lo único que nos falta para integrar es el deploy.** La pantalla se construye
sobre esta capa y no depende de nada más del contrato.
