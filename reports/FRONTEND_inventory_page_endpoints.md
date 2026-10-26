# Frontend — paginación de `/inventory` en el servidor

Contrato de los tres endpoints nuevos. Repo backend: `server-testing`.
Escrito a partir del *Manifiesto de datos de /inventory* que mandó el frontend
el 2026-09-14; este documento responde a él y cierra el contrato.

---

## 0. Estado de despliegue — leer primero

| Pieza | Estado |
|---|---|
| Código del servidor | ⚠️ **escrito y testeado (25 tests), NO commiteado ni desplegado** |
| Contrato de abajo | ✅ cerrado, no cambia sin avisar |
| Endpoints viejos (`warehouse-items`, `current-inventory`, `check-item`) | ✅ **siguen funcionando igual**, no se toca nada |

**Los tres endpoints responden 404 en producción hasta el deploy.** Se puede
construir contra el contrato desde ya. Avisamos cuando esté arriba.

La migración es **aditiva**: nada de lo que usa hoy la página deja de funcionar.
Se puede migrar pantalla por pantalla.

---

## 1. Antes de la primera llamada

### 1.1 Headers

```
x-token:       <JWT de sesión>
s-company-lq:  <company_id>
Content-Type:  application/json
```

**Corregido el 2026-09-15** (la primera versión de este documento decía que
`s-company-lq` se ignoraba; ya no es así). Como `sessionHeaders.js` lo manda
solo en toda ruta `/api/db_*`, los tres endpoints lo usan y siguen **la misma
regla que el contrato de RFID**:

- El `company_id` sale del header `s-company-lq`; si no viene, del body o de la
  query. Lo resuelve `resolveCompanyContext`, el mismo helper del resto del repo.
- `company_id` en el body es **opcional**. Si se manda y **no coincide** con el
  header, la respuesta es **400** `Company mismatch between header and body`,
  con `detail: { header, body }` para no depurar a ciegas.
- El header no autoriza: es tan falsificable como un campo del body. La confianza
  sale de comprobar que quien llama es staff activo de esa compañía.

Mandar el mismo valor en los dos sitios, o solo el header, y no hay nada que
depurar. `x-company-id` no se usa (ese es el contrato del lado Mongo).

### 1.2 Qué autoriza, y qué no

`company_id` dice **qué compañía se consulta**, no da permiso. El servidor
comprueba que quien llama tiene ficha de staff en esa compañía; si no la tiene,
responde **403** (`Staff record not found for this company`).

### 1.3 El scope de rol ahora lo aplica el servidor — esto es lo importante

Hoy `ItemTable.jsx:258` recorta por `allowedLocations` y por categoría **después**
de recibir los datos. Con páginas del servidor eso deja de funcionar: una página
de 50 filas se quedaría en 7 y el total no cuadraría con lo que se ve.

Los tres endpoints aplican el scope **dentro de la consulta**, antes de contar y
antes de cortar. Un rol scoped sin asignaciones no ve nada (fail-closed).

**El cliente debe dejar de filtrar por locación o categoría después de recibir.**
Si se mantienen los dos filtros, se aplica dos veces y la página se vacía sola.

---

## 2. `POST /api/db_item/inventory-page` — una página de la tabla

### Petición

```jsonc
{
  "company_id": 62,
  "filters": { "brand": "Dell", "logistic_status": "in_stock" },  // opcional
  "search": "00100",                                              // opcional
  "sortBy": "category_name",                                      // opcional
  "sortDir": "asc",                                               // "asc" | "desc"
  "pageSize": 50,                                                 // opcional
  "cursor": { "v": "Laptop", "id": 200336 }                       // null en la 1ª página
}
```

### Respuesta

```jsonc
{
  "ok": true,
  "items": [ /* … */ ],
  "pageSize": 50,
  "nextCursor": { "v": "Laptop", "id": 200436 },
  "hasMore": true
}
```

### Las 13 columnas de cada fila

```
item_id · serial_number · category_name · item_group · brand · ownership
location · main_warehouse · warehouse · logistic_status · status
image_url · enableAssignFeature
```

Cubre las ocho columnas de `ColumnsFormat.jsx` más los cinco campos que se
consumen sin ser columna. Frente a lo que llega hoy:

- **Se añaden** `image_url` y `logistic_status` ya resueltos en la fila. Con eso
  **`POST /image/images` sale de la ruta crítica**: ya no hace falta el `groupBy`
  de imágenes en el cliente.
- **Se quitan** `sub_location` y `container` (no se pintan) y las cuatro pesadas
  —`descript_item`, `extra_serial_number`, `returnedRentedInfo`,
  `supplier_info`—. Esas ya las sirve `POST /api/db_item/consulting-item` cuando
  se abre la ficha, así que la vista de detalle no pierde nada.
- **Desaparece** el `data: <objeto crudo>` duplicado dentro de cada fila.

### Cómo se pagina

`cursor: null` en la primera página. Después se manda **tal cual** el
`nextCursor` que devolvió la llamada anterior, sin tocarlo.

Se para cuando `hasMore` es `false` — y entonces `nextCursor` viene `null`. Es la
diferencia con `/inventory-pagination`, que devolvía un cursor no nulo también en
la última página y obligaba a una llamada de más que volvía vacía.

**Cualquier cambio de filtro, búsqueda u orden reinicia el cursor a `null`.**
Un cursor de una ordenación no vale para otra.

### `pageSize`

Por defecto **50**, techo **500**. Si se pide más, se sirve 500 sin error. Un
`pageSize` no entero o negativo da **400**.

### Orden

`sortBy` admite las siete columnas que la tabla declara como ordenables, más
`logistic_status`:

```
category_name · item_group · warehouse · ownership · main_warehouse
location · serial_number · logistic_status
```

`logistic_status` se añade a propósito: la columna "Status" ordena hoy por
`warehouse` y **pinta** `logistic_status`, así que ordenarla no ordena por lo
que se ve. Con esto se puede cerrar el desfase mandando `sortBy:
"logistic_status"` en esa columna.

Sin `sortBy`, el orden es `item_id ASC`.

Dos cosas que cambian respecto al cliente:

1. **`serial_number` se ordena como texto.** El comparador actual hace `a - b`
   sobre cadenas con contador al final y da `NaN`. Al pasar el orden al
   servidor queda correcto, pero **el comparador roto debe salir del código**:
   si se deja, reordena encima de lo que ya vino ordenado.
2. **Hay que quitar los `sorter` de `localeCompare`** de las siete columnas. El
   orden lo decide MySQL sobre el conjunto completo; ordenar la página en el
   cliente daría un orden distinto dentro de cada página.

### Búsqueda — **cambia el comportamiento, leer**

Hoy el filtro de filas es `JSON.stringify(item).toLowerCase().includes(term)`:
encuentra coincidencias en campos que la tabla no pinta y dentro del objeto
crudo anidado. Eso no se puede reproducir en SQL sin recorrer la tabla entera en
cada búsqueda.

El servidor busca en, y solo en:

| Campo | Cómo |
|---|---|
| `serial_number` | **prefijo** (`LIKE 'texto%'`) — es lo único que puede usar índice, y es el caso del escáner |
| `item_group`, `category_name`, `brand` | substring |

Consecuencia práctica: **buscar por un serial parcial que no empiece por el
principio deja de encontrar**. Si hace falta, la conversación es FULLTEXT, no
LIKE — decidlo y lo evaluamos.

Términos de menos de 2 caracteres se ignoran (no dan error). El `%` y el `_` se
escapan, así que buscar `100%` ya no devuelve la tabla entera.

### Filtros

`filters` acepta solo estas nueve claves:

```
brand · item_group · category_name · location · ownership
warehouse · logistic_status · status · main_warehouse
```

Cualquier otra clave da **400** con la lista de las válidas. Es deliberado: el
nombre de una columna entra en el texto del SQL y no puede venir del cliente sin
comprobar.

⚠️ **`warehouse` es numérico, no texto.** Es un flag entero: `1` = en almacén,
`0` = fuera. Lo confirman `SUM(warehouse = 1) AS available`
(`categories_groups.js:175`), los `UPDATE item_inv SET warehouse = 1` y la
normalización de `item.js:272-275`. El export lo lee bien (`item.warehouse === 1`);
la tabla lo ordena con `localeCompare`, que es ordenar números como texto.
Filtradlo con `1`/`0`, no con cadenas.

---

## 3. `POST /api/db_item/inventory-facets` — el total y las opciones de filtro

Este es el que sustituye al `groupBy(baseDataset, prop)` de `ItemTable.jsx:395`.
**No devuelve filas**: devuelve agregados sobre el inventario completo, con los
filtros y la búsqueda activos aplicados.

### Petición

```jsonc
{
  "company_id": 62,
  "filters": { "brand": "Dell" },   // los mismos que la página
  "search": "00100",                // el mismo que la página
  "facets": ["brand", "location"]   // opcional; por defecto, las siete
}
```

### Respuesta

```jsonc
{
  "ok": true,
  "matchedTotal": 48213,
  "facets": {
    "brand":           [ { "value": "Dell", "count": 12044 }, … ],
    "item_group":      [ … ],
    "category_name":   [ … ],
    "location":        [ … ],
    "ownership":       [ … ],
    "logistic_status": [ … ],
    "status":          [ … ]
  }
}
```

Unos pocos KB tenga la compañía 500 ítems o 500.000.

**`matchedTotal` es el número que hoy sale de contar el array en memoria** cuando
hay filtro o búsqueda activa. El total sin filtros lo sigue dando
`GET /db_item/check-company-has-inventory`, que no cambia.

Dos detalles de comportamiento:

- **Una faceta no se filtra por sí misma.** Con `brand=Dell` elegido, la lista de
  marcas sigue mostrando las demás; si no, no habría forma de cambiar de marca
  sin limpiar el filtro antes.
- Valores nulos o vacíos no se devuelven como opción.

---

## 4. `GET /api/db_item/serial-suggest` — autocomplete de serial

El select de Serial Number se llena hoy con una opción por ítem: con 50.000
ítems son 50.000 opciones en un desplegable. Pasa a autocomplete.

```
GET /api/db_item/serial-suggest?company_id=62&q=001&limit=20
```

```jsonc
{ "ok": true,
  "items": [ { "item_id": 200336, "serial_number": "00100003",
               "category_name": "Laptop", "item_group": "Dell XPS" }, … ] }
```

Prefijo, no substring. Mínimo 2 caracteres (menos da **400**). Tope de 20
resultados; `limit` puede pedir menos, nunca más.

---

## 5. Orden de migración sugerido

1. **Borrar el camino legacy** — `GET /db_company/current-inventory/{id}` y
   `POST /db_inventory/check-item`, más `getDataStructuringFormat` y
   `legacyDataset`. No se pueden paginar dos datasets a la vez; esto es
   prerrequisito, no limpieza opcional. *(Corregido: `usage` **no** se pierde
   aquí — se pierde en el paso 2. Ver §8.2.)*
2. **Estado controlado en `ItemTable`**: `{cursor, pageSize, sortBy, sortDir,
   search, filters}`, y `BaseTable` en modo anterior/siguiente. **Es aquí donde
   se pierde `usage`**, porque no está entre los 13 campos de la fila — resolvedlo
   antes de dar el paso (§8.2).
3. **Claves de React Query**: incorporar `company_id`, cursor, orden y filtros, y
   actualizar `inventoryQueryKeys.js` con su test de drift. Hoy las cuatro claves
   son constantes y **no llevan `company_id`**, así que en cuanto la respuesta
   dependa de parámetros, la caché serviría datos de otra consulta.
4. **Filtros desde `inventory-facets`**, no desde `groupBy` del dataset.
5. **Quitar los `sorter` del cliente** y el comparador roto de `serial_number`.
6. **Quitar el filtrado por locación y categoría del cliente** (§1.3).
7. **Export XLSX** — ver §6.

---

## 6. Lo que este contrato **no** resuelve

### 6.1 Los filtros "Staff member" y "Condition" no están

No es un olvido: hoy no tienen columna en `item_inv`.

- **Staff member** se deriva de `usage`, que no es un campo de `item_inv`: lo
  calcula `retrieveCompanyInventory` desde `item_inv_assigned_event` +
  `event_info`, y **solo para ítems con `warehouse = 0`**. Y ese es justo el
  endpoint legacy que el paso 1 de la migración borra. O sea: hoy ese filtro ya
  no tiene datos en el camino normal.
- **Condition** compara contra `condition`, que vive en
  `item_inv_assigned_event`, no en `item_inv`. Coincide con el bug que vosotros
  mismos encontrasteis (la opción se genera de `status`, la comparación va contra
  `condition`).

**Decisión que hace falta antes de implementarlos**: ¿de dónde debe salir
"asignado a staff"? ¿De las cesiones (`member_assigned_device_lease`) o de los
eventos? Con eso definido se añaden como filtros con `JOIN`, sin cambiar el resto
del contrato.

`status` y `logistic_status` sí son columnas reales y están disponibles como
filtro y como campo de la fila.

### 6.2 El export XLSX

Hoy recibe el array visible completo; con paginación exportaría 50 filas. **No lo
resolváis pidiendo `pageSize: 50000`** — el techo es 500, y aunque no lo fuera,
es exactamente la llamada que bloquea un worker.

Lo correcto es un job de cola que genere el fichero y devuelva un `jobId`. Las
piezas ya existen en el servidor. Decidnos si lo necesitáis en esta tanda y lo
montamos.

### 6.3 Las tarjetas de `RenderingFilters`

No se tocan: ya se alimentan de agregados del servidor
(`company-inventory-structure`, `locations`, `location-paths-tree`). En reposo,
paginar la tabla no las afecta.

Sobre el bug que encontrasteis en `RenderingFilters.jsx:338` (`dataToDisplay` se
compara con `"function"` pero llega como array, así que `filteredList` siempre es
`[]`): si se confirma, ningún consumidor real depende del array completo para las
tarjetas filtradas. Si lo arregláis **antes** de migrar, entonces sí necesitaréis
`inventory-facets` para alimentarlas, porque el array completo ya no estará.

---

## 7. Nota de backend, por si os cruzáis con ella

En `mysql/routes/item.js` hay un `router.post("/:id")` que captura cualquier POST
de un solo segmento y deja sin efecto a 15 rutas registradas después, entre ellas
`/inventory-pagination`, `/inventory-query` y `/check-item` (esta última se llama
también desde `/api/db_inventory/check-item`, que **sí** funciona).

Los tres endpoints nuevos están registrados por encima de ese catch-all, así que
no les afecta. Se menciona para que nadie intente usar `/inventory-pagination`
como alternativa: en `/api/db_item` está muerta.

---

## 8. Respuestas a las cuatro preguntas del 2026-09-15

### 8.1 `s-company-lq` — lo valida, no lo ignora

Teníais razón: el doc decía una cosa y `sessionHeaders.js:100` hace otra. **Se
cambió el código, no el aviso.** Los tres endpoints usan ahora
`resolveCompanyContext`, que es el helper del resto del repo:

- header `s-company-lq` primero, body/query como fallback;
- si mandáis los dos y **difieren**, **400** con `detail: { header, body }`;
- si coinciden —o si solo va el header— no hay nada que depurar.

Es la misma regla del contrato de RFID, y por el mismo motivo que está escrito
allí: para un usuario multi-compañía el header (localStorage) y el body (Redux)
pueden divergir de verdad, y elegir uno en silencio significa leer el inventario
de una compañía distinta de la que el resto de la app cree.

`company_id` en el body pasa a ser **opcional**. Los ejemplos de este documento
lo siguen incluyendo porque es inofensivo mandarlo.

### 8.2 `usage` — el aviso estaba mal ubicado, y hay una pregunta abierta

Correcto, y la corrección ya está aplicada en §5: borrar el camino legacy **no**
pierde `usage`; se pierde al cambiar a `inventory-page`. El aviso pertenece al
paso 2.

Ahora, la parte que no podemos cerrar solos. Si `refactoredDataset` lee
`data.usage` de la respuesta de `warehouse-items`, entonces `usage` **es una
columna de `item_inv`**: ese handler es un `SELECT *` pelado
(`item.js:674-700`), no calcula nada. Pero en el backend **nada escribe esa
columna**: no está en el `INSERT` (`item.js:306`), no está en la allowlist de
`updateItemInTable`, y el worker de Go tampoco la toca. El único sitio que
produce un campo `usage` es `retrieveCompanyInventory`, que lo calcula por
`JOIN` con `item_inv_assigned_event` + `event_info` y **sobrescribe** lo que
hubiera en la fila.

**Lo que os pedimos, y se cierra en diez segundos:** mirad una respuesta real de
`POST /db_item/warehouse-items` en la pestaña de red.

- Si las filas traen `usage` → es columna, la añadimos como **campo 14** de
  `inventory-page` y no cambia nada más del contrato.
- Si no la traen → lo que alimenta hoy el filtro "Staff member" es el camino
  legacy, y entonces hay que decidir su fuente real (cesiones o eventos) antes
  de implementarlo, como dice §6.1.

### 8.3 `warehouse` es numérico

Flag entero: **`1` = en almacén, `0` = fuera**. Lo confirman
`SUM(warehouse = 1) AS available` (`categories_groups.js:175`), los
`UPDATE item_inv SET warehouse = 1` de `eventCount.js:281` e `item.js:2212`, y la
normalización de `item.js:272-275`, que convierte `true` / `"true"` / `1` / `"1"`
a un `1`.

Así que el export lo lee bien y la tabla no: `localeCompare` sobre un entero es
ordenar números como texto. **Filtradlo con `1`/`0`**, no con cadenas.

Y sobre vuestra inconsistencia: se resuelve en el contrato. `logistic_status` es
ahora `sortBy` válido (§2 · Orden), así que la columna "Status" puede ordenar por
lo que pinta en vez de por `warehouse`.

### 8.4 El export — el aviso se queda corto, tenéis razón

Confirmado: las 16 columnas de `DownloadXlsx.jsx` no caben en la proyección de la
fila, y no es cuestión del techo de `pageSize`.

- `cost`, `descript_item`, `extra_serial_number` y `return_date` **sí** son
  columnas de `item_inv` — se quedaron fuera de la fila a propósito (dos de ellas
  están entre las cuatro pesadas).
- `event_name` **no está en `item_inv`**: sale del `JOIN` con
  `item_inv_assigned_event` + `event_info`, el mismo del que sale `usage`.

O sea que el export es **otra consulta**, no la misma con más filas — que es
justamente el argumento para que sea un job de cola con su propia proyección:

```
POST /api/db_item/inventory-export
  → mismos filters / search / scope que la tabla
  → 202 { jobId }
  → el worker arma el fichero y lo deja en S3
```

Con eso el export deja de depender de lo que la tabla tenga cargado (hoy exporta
lo que hay en memoria, que ya es un sesgo silencioso) y pasa a exportar lo que
coincide con los filtros, entero. **Decidnos si entra en esta tanda** y lo
montamos con las 16 columnas y el `JOIN`.
