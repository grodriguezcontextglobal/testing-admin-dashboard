# Frontend — plan de migración de `/inventory` a paginación en servidor

> **Audiencia:** el agente de frontend.
> **Esto es el plan de ejecución.** El contrato de los endpoints está en
> [`FRONTEND_inventory_page_endpoints.md`](FRONTEND_inventory_page_endpoints.md),
> escrito por el backend el 2026-09-14. Este documento responde a él y dice en
> qué orden se toca el cliente.
>
> El mapa de datos del que salió todo esto —cada endpoint, cada campo, y en qué
> lado ocurre hoy cada cosa— está en el *Manifiesto de datos de /inventory*
> (2026-09-14).
>
> **Revisado el 2026-09-15** contra la §8 del contrato, que responde a las cuatro
> preguntas de preflight. Cambia §1 entero, y con él las fases 2, 5 y una fase
> nueva (6b, el export).

---

## 0. Estado — leer primero

| Fase | Estado |
|---|---|
| **Fase 1 — borrar el camino legacy** | ✅ **hecho** (2026-09-15) · 3680 tests en verde |
| Preflight §1.1 / §1.3 / §1.4 | ✅ cerrados por la §8 del backend (2026-09-15) |
| Preflight §1.2 | ✅ **resuelto** (2026-09-15): `usage` no existe en la fila → **filtro Staff member eliminado de la UI** |
| Preflight §1.5 | ⬜ **diagnosticado y aparcado** — no bloquea la Fase 4; dos funciones hermanas con dos ideas erróneas de «hay filtro activo» |
| Preflight §1.7 | ✅ **resuelto** (2026-09-15): el servidor resuelve `image_url`; `/image/images` sale de la ruta crítica |
| Preflight §1.8 | ✅ **cerrado** (2026-09-17): las opciones se piden **sin filtros**, así que elegir uno no acota los demás. Verificado en navegador con el flag encendido |
| §1.9 — mensaje de tabla vacía | ✅ **hecho** (2026-09-15), independiente del flag |
| **Fases 2, 3 y 5** | ✅ **hechas** (2026-09-15) · 3753 tests en verde, flag OFF |
| **Fase 4 — filtros y búsqueda al servidor** | ✅ **hecha** (2026-09-17) · 894 tests del árbol de inventario en verde, flag OFF |
| Fases 6 y 6b | ⬜ pendientes, bloqueadas por el deploy |
| Fase 7 — limpieza post-deploy | ⬜ pendiente |
| `inventory-page`, `inventory-facets`, `serial-suggest`, `inventory-export` | ⚠️ **404 en producción hasta el deploy del backend** |

La Fase 1 **no depende del deploy**: se apoya solo en `warehouse-items`, que ya
está en producción y no cambia. Por eso va primero y ya está entregada.

Las fases 3 en adelante van detrás de un feature flag, porque hasta el deploy
los tres endpoints nuevos responden 404.

---

## 1. Preflight — estado tras la §8 del backend (2026-09-15)

Las cuatro preguntas están **respondidas** en `FRONTEND_inventory_page_endpoints.md` §8,
y §1.2 quedó cerrada con una respuesta real del servidor. Abiertas: §1.5 (nuestra,
un vistazo en navegador) y §1.7 (nueva, pregunta al backend).

### 1.1 `s-company-lq` — lo valida. **Decisión: no mandamos `company_id` en el body** ✅

Respuesta del backend (§8.1): cambiaron el código, no el aviso. Los tres
endpoints resuelven la compañía con `resolveCompanyContext` —header primero,
body/query como fallback— y si se mandan los dos y **difieren**, **400**.
`company_id` en el body pasa a ser **opcional**.

Nuestra decisión, y es la que evita la clase entera de fallo: **omitir
`company_id` del body**. Razón:

- el header sale de `localStorage` (`devitrakApi.jsx:103`), y está garantizado
  para cualquier sesión autenticada: lo escribe `persistCompanyHeaders` en el
  login y en el switch de compañía, y `App.jsx:125` llama a
  `ensureCompanyHeaders(user)` en el arranque para rellenarlo si falta;
- el body saldría de Redux (`user.sqlInfo.company_id`);
- **esos dos pueden divergir de verdad** justo después de un cambio de compañía,
  que es el escenario que el backend describe. Mandar solo el header no tiene
  ese modo de fallo.

Se fija con un test en la Fase 2: los constructores de body no emiten
`company_id`.

> **Pendiente menor de confirmar:** `serial-suggest` es un `GET` y el contrato lo
> documenta como `?company_id=62&q=001`. Por §8.1 la query es fallback, así que
> debería aceptar solo-header igual que el body. Confirmarlo antes de la Fase 4.

### 1.2 `usage` — **resuelto: no existe** ✅ (2026-09-15, respuesta real capturada)

Se miró una respuesta real de `POST /db_item/warehouse-items`. La fila trae 36
campos, y **`usage` no es uno de ellos**. Tampoco `condition`.

Se confirma la segunda rama de §8.2, y con ella lo que ya se sospechaba leyendo
el código: `refactoredDataset` hace `usage: data.usage` → `undefined`, luego
`assignedToStaffMember` es `null` en **todas** las filas, y el filtro hace
`item?.assignedToStaffMember?.includes(valor)` sobre `null` → falsy.

**El filtro "Staff member" no encuentra nada hoy.** Ya está roto en producción;
no es algo que rompa esta migración. Quitarlo de la UI no es una regresión, es
hacer visible lo que ya pasa.

**Decisión tomada (2026-09-15): el filtro se quitó de la UI.** No es parte de la
paginación, es corregir una pantalla que ofrecía una pregunta que no sabe
responder. Un control siempre vacío se lee como «no hay ningún equipo asignado»,
que es peor que no ofrecerlo.

Qué se tocó, y qué no:

| Cambio | Dónde |
|---|---|
| Fuera la entrada 6 del diccionario | `utils/dicSelectedOptions.jsx` |
| Los selects se generan del diccionario, no de `new Array(8)` | `utils/FilterOptionsUX.jsx` |
| Fuera la lista de opciones (la única que salía de `companyData.employees`) | `table/ItemTable.jsx` |
| Fuera el caso especial `filter.category === 6` del predicado | `table/ItemTable.jsx` |
| Fuera el `display:none` que escondía las tarjetas al elegir un staff | `table/ItemTable.jsx` |
| «ocho filtros» → «siete», y la lista de nombres | `pages/help/content/inventory.js` |

**El índice 6 queda vacante a propósito.** Renumerar Status de 7 a 6 habría sido
más limpio y estaría mal: el índice es el formato de un filtro elegido
(`{category, value}`), y lo leen `toServerFilters` y la rama en memoria. Moverlo
apuntaría a la columna equivocada. `dicSelectedOptions.test.js` lo fija.

`toServerFilters` **sigue** reportando la categoría 6 como `unsupported` en vez
de ignorarla: un filtro elegido puede sobrevivir al control que lo produjo, y la
categoría vuelve cuando el backend decida su fuente.

Sigue pendiente, del lado del backend (su §6.1): ¿de dónde debe salir «asignado
a staff», de las cesiones (`member_assigned_device_lease`) o de los eventos? La
sección de tarjetas «Staff Members» de `RenderingFilters` **no se tocó** — es
otra pieza, y también está vacía, pero por el bug de §1.5.

**De paso, la misma respuesta confirma dos cosas más:**

- `warehouse: 1` — entero, como decía §8.3.
- `status: "Operational"` existe y `condition` **no está en la fila**. Es la
  prueba del bug viejo: el select de Condition construía sus opciones desde
  `status` y comparaba contra `condition`, un campo que nunca llega. Mapearlo a
  `status` (Fase 2) es el arreglo.

### 1.3 `warehouse` es numérico — `1` / `0` ✅

Respuesta (§8.3): flag entero, `1` = en almacén. Confirmado en el SQL del
servidor.

Dos consecuencias para nosotros:

- El export lo lee bien (`item.warehouse === 1`) y **la tabla no**: el
  `sorter: localeCompare` de la columna "Status" está ordenando enteros como
  texto. Es un segundo bug pre-existente que desaparece al quitar los sorters.
- El desfase «ordena por `warehouse`, pinta `logistic_status`» se cierra en el
  contrato: **`logistic_status` es ahora un `sortBy` válido**. La columna pasa a
  ordenar por lo que enseña. Va en la Fase 5.

### 1.4 El export — aceptado, y **sí entra en esta tanda** ✅

Respuesta (§8.4): confirmado que es otra consulta, no la misma con más filas.
`cost`, `descript_item`, `extra_serial_number` y `return_date` son columnas de
`item_inv`; `event_name` sale del mismo `JOIN` que `usage`.

Ofrecen `POST /api/db_item/inventory-export` → `202 { jobId }` → el worker deja
el fichero en S3. **Respuesta: sí, lo queremos en esta tanda** (Fase 6b).

**Lo que necesitamos de su lado, y no está en el contrato todavía:** el payload
terminal del job tiene que traer una **URL de descarga prefirmada**.
`BackgroundJobsTracker.jsx` hoy hace polling a `GET /jobs/owned/{jobId}` cada 3 s,
notifica al llegar a estado terminal e invalida `invalidateKeys` — pero **no sabe
descargar un fichero**. Esa pieza la ponemos nosotros; el campo lo ponen ellos.

Ganancia colateral que conviene decir en voz alta: hoy el export manda a Excel
**lo que la tabla tiene en memoria**, que ya es un sesgo silencioso. Con el job
pasa a exportar lo que coincide con los filtros, entero.

### 1.5 El bug de `filteredList` — diagnosticado, aparcado ⬜

`RenderingFilters.jsx:338` abre con:

```js
let base = typeof dataToDisplay === "function" ? dataToDisplay : [];
```

…pero `ItemTable` pasa `dataToDisplay` como **array**. El ternario nunca
acierta, así que `filteredList` es `[]` siempre, y con él `byCategory`,
`byGroup`, `byBrand`, `byOwnership` y `byAssignedStaff` (`:433–455`), que son lo
que `getDataForSection` devuelve cuando hay un filtro activo (`:727–781`).

**Y hay una segunda función, rota de otra forma, que explica por qué esto es
difícil de ver.** `getTotalUnitsForSection` (`:752`) calcula el «Total N units»
de cada cabecera y pregunta:

```js
if (chosen?.value != null && chosen?.category != null) {   // `chosen` es un ARRAY
```

Sobre un array, `chosen.value` y `chosen.category` son `undefined`: **esa
condición nunca entra**. Los totales caen siempre al caso por defecto y se leen
de `structuredCompanyInventory`, el agregado del servidor sin filtrar.

Las dos hermanas tienen ideas distintas de «hay un filtro activo», y las dos
están mal. El resultado observable al poner un filtro:

| Capa | Qué se ve |
|---|---|
| Cabecera de la sección | «Categories · Total 12 units» — intacta, parece normal |
| Contenido, al desplegar | vacío |

Por eso una inspección rápida dice «no se vacían» y el código dice lo contrario:
son dos capas de la misma sección.

**Aparcado, y no bloquea nada.** No afecta a los filtros ni a la paginación. Si
se confirma que el contenido está vacío, las tarjetas ya no dependen del array
completo y la Fase 4 no tiene que alimentarlas con facetas — un bloqueador menos.
**No se arregla en esta tanda**: arreglarlo antes de migrar nos obligaría a
alimentarlas con `inventory-facets`, como avisa el contrato §6.3.

### 1.6 Lo que queda del vistazo en navegador

**Vistazo hecho el 2026-09-17 con el flag encendido.** Resultado: todos los
desplegables traen opciones salvo Serial Number, que está vacío **por diseño**
—es un autocompletado, y la Fase 4 lo cableó—, y elegir un filtro **no** acota
las opciones de los demás, que cierra §1.8.

Destapó además un bug que no era del flag: el desplegable de Status leía un
diccionario propio de siete estados escrito dentro de `FilterOptionsUX`,
mientras `logisticStatusConfig` tiene veinte, así que cualquier estado fuera de
esos siete salía como una opción **sin texto**. Era raro mientras las opciones
se agrupaban del dataset en memoria y dejó de serlo cuando las facetas
empezaron a devolver todos los estados de la compañía. Arreglado en `2d6aa61f`
y `5c2774e3`: un solo diccionario, y el vocabulario del evento
(`logistic_inventory_status`: `received`, `in-idle`, `completed`) separado del
vocabulario del ítem (`item_inv.logistic_status`), que es donde no tenía que
haber estado nunca.

Queda el paso 3, que **ya no bloquea nada** — cierra §1.5, que está aparcado:

1. ~~Abrir `/inventory` con el devtools en la pestaña de red.~~ hecho
2. ~~En la respuesta de `POST /db_item/warehouse-items`, mirar si las filas traen
   `usage`.~~ hecho — no la traen (§1.2)
3. Aplicar un filtro cualquiera del selector (por ejemplo Brand) y mirar si las
   tarjetas de Categories / Groups / Brands se quedan vacías → cierra §1.5.

### 1.7 `image_url` — **resuelto: el servidor sí lo resuelve** ✅ (2026-09-15, respuesta real)

La fila real trae `image_url: ""`. No es un caso raro: el cliente tiene una
cadena de respaldo justo para esto (`ItemTable.jsx`, dentro de
`refactoredDataset`):

```js
let imageSource = data.image_url;
if (!imageSource || imageSource === "") {
  const groupImages = groupingByDeviceType[data.item_group];
  if (groupImages && groupImages.length > 0) imageSource = groupImages[0].source;
}
```

Es decir: cuando la columna viene vacía, el avatar sale de
`POST /image/images`, agrupado por `item_group`.

El contrato (§2) dice que `inventory-page` devuelve `image_url` «ya resuelta» y
que con eso `/image/images` sale de la ruta crítica. **Si lo que devuelve es la
columna tal cual, devolverá `""`**, y como habremos quitado esa query, la tabla
se queda sin imágenes en todas las filas cuyo ítem no tenga imagen propia — que
por lo visto son muchas.

**Respondido por el propio endpoint.** Una respuesta real de `inventory-page`
trae, en las filas de un grupo con imagen, la URL del **grupo** ya resuelta —
`…/<companyMongoId>_Laptop_Group%20Test%201.png`, idéntica en las 20 filas de ese
grupo—, y `""` en las de un grupo que no tiene imagen. Es decir: el servidor
aplica el respaldo, y el vacío solo aparece cuando no hay ninguna imagen que
poner, que es exactamente lo que pasaría hoy con `/image/images`.

**`POST /image/images` sale de la ruta crítica de la tabla**, como decía el
contrato. Sigue viva para otras pantallas.

Otras dos cosas que confirma la misma respuesta:

- Las **13 columnas exactas** del contrato, ni una más.
- El cursor viene como **`{ id }`** —sin `v`— cuando no hay `sortBy`, porque el
  orden por defecto es `item_id ASC`. Nuestro cliente lo devuelve tal cual, así
  que encaja sin cambios.

### 1.8 Nuevo — las opciones de filtro **no** deben estrecharse entre sí ⚠️

Requisito de producto, confirmado el 2026-09-15: **elegir un filtro no acota las
opciones de los demás.** Seleccionar Brand deja la lista de Group intacta, para
que el usuario pueda combinar libremente — dentro de una marca hay varios grupos,
y quiere poder llegar a ellos.

**Así funciona hoy**, y no por accidente. `ItemTable.jsx:267`:

```js
const filterOptionsBasedOnProps = (props) => {
  const sortingByProps = groupBy(baseDataset, props);   // baseDataset, no dataToDisplayMemo
  return Object.keys(sortingByProps);
};
```

Agrupa sobre `baseDataset` —el inventario de la compañía después del scope de
rol y nada más—, **no** sobre `dataToDisplayMemo`, que es el resultado de aplicar
`chosenOption`. Por eso las listas no se mueven al elegir un filtro.

**El contrato de `inventory-facets` (§3) hace lo contrario.** Dice que los
agregados se calculan «con los filtros y la búsqueda activos aplicados», y la
única excepción es que *una faceta no se filtra por sí misma*. Es decir: con
`brand=Dell` elegido, la lista de marcas se mantiene entera —bien— pero la de
grupos pasaría a mostrar **solo los grupos que existen dentro de Dell**. Eso es
exactamente el estrechamiento que no queremos.

Si cableamos la Fase 4 tal como está escrito el contrato, cambiamos en silencio
un comportamiento que es deliberado.

**Los ocho filtros** (2026-09-15): Brand, Group, Serial Number, Location,
Ownership, Condition, Status y **Category**, este último añadido en el índice
**8** —no en el 6 que dejó libre Staff member—, porque el índice es el formato de
un filtro elegido y reutilizarlo haría que un filtro viejo guardado en estado
reapareciera como Category llevando el nombre de una persona. Efecto: el select
de Category se pinta el último. Moverlo junto a Group exige separar el orden de
pintado del índice, que hoy son lo mismo.

Serial Number es el único que no acaba en `filters`: el servidor no lo admite
como clave y lo cubre por prefijo dentro de `search`. Sigue combinando con AND
— **conviene que el backend lo confirme**: `filters` y `search` se aplican
juntos, no como alternativas.

**Cómo combinan, para que no haya duda al implementar la Fase 4:** los filtros
son **AND**, un valor por filtro. `Brand = Dell` enseña todo el inventario Dell;
añadir `Group = Laptop` deja solo lo que cumple las dos. Y como las listas no se
acotan entre sí, el usuario **puede** llegar a una combinación sin resultados
—`Brand = Dell` con un grupo que Dell no fabrica—. Eso no es un fallo: es la
consecuencia buscada de dejarle combinar. Lo que la tabla tiene que hacer es
**decirlo**, no quedarse en blanco (ver §1.9).

**Y la regla de la que todo esto cuelga: los filtros preguntan por el inventario
entero, nunca por la página.** Ni las listas de opciones ni el filtrado mismo
pueden calcularse sobre las 500 filas que ya están cargadas. Filtrar la página
responde «cuáles de estas cincuenta cumplen» en vez de «cuáles del inventario
cumplen» — otra pregunta, y una que parece correcta hasta que la fila buscada
está en la página cuatro.

Está cableado así y fijado por
`table/ItemTable.serverPagination.test.jsx`: los filtros viajan en el cuerpo de
`inventory-page`, la página que vuelve se pinta tal cual sin un segundo filtro
en cliente, y con el flag encendido **`warehouse-items` deja de llamarse**
(`enabled: !FEATURE_INVENTORY_SERVER_PAGINATION && …`). Dejarlo vivo habría
significado pagar todas las filas *y además* paginar.

> **Estado conocido de la rama con flag:** al apagar `warehouse-items`, los
> desplegables de filtro se quedan sin opciones hasta que la Fase 4 los conecte
> a `inventory-facets`. Es exactamente el hueco que la Fase 4 llena, y el flag
> está apagado en producción.

**Lo que pedimos al backend:**

| Campo | Debe reflejar los filtros activos |
|---|---|
| `matchedTotal` | **sí** — es el conteo del conjunto que se está viendo |
| Las **listas** de valores de cada faceta | **no** — sobre el inventario en scope, entero |
| Los **counts** de cada valor | **sí**, y es deseable |

Los counts filtrados son lo que hace que esto no sea peor que estrechar: un valor
que no llevaría a ninguna parte puede seguir en la lista mostrando `0`, así que
el usuario ve el callejón sin salida en vez de chocarse con él, y aun así puede
elegirlo si quiere cambiar de rama. Con el contrato actual ese valor simplemente
no vendría.

Sin esto, la alternativa es pedir las facetas siempre sin filtros —una llamada
con `filters: {}`— y sacar `matchedTotal` de otra, que es una llamada de más por
interacción.

### 1.9 La tabla vacía tiene que decir cuál de los dos vacíos es ✅ *hecho*

Dos tablas vacías idénticas que significan lo contrario:

- la compañía no tiene inventario;
- tu combinación no casa con ninguna fila.

Hasta ahora las dos caían en el placeholder global de `main.jsx` —«Nothing here
yet · Once there is data to show, it will appear here»—, que para el segundo caso
dice justo lo que no es: suena a «esta compañía está vacía» cuando lo cierto es
«tu pregunta no tiene respuesta».

Ahora, **solo cuando hay algún filtro o búsqueda activos**, la tabla muestra un
`EmptyState` que nombra los criterios y ofrece la salida:

```
No inventory matches those filters
Brand: Netgear · Group: HP Laptop
[ Clear filters ]
```

Sin filtros ni búsqueda no se toca nada: sigue el placeholder de siempre.

`utils/activeFilterSummary.js` arma el texto y es donde está la lógica que vale
la pena fijar: usa las etiquetas de los selects (no los nombres de columna),
traduce `in-transit` a «In transit» porque es lo que el usuario vio, y **salta
las categorías que ya no tienen select** —un filtro elegido puede sobrevivir al
control que lo produjo, y nombrar algo invisible es peor que decir menos.

Funciona igual en las dos ramas del flag: con paginación en servidor el mensaje
sale cuando `matchedTotal` es 0, sin cambiar nada de esto.

---

## 2. Las fases

### Fase 1 — Borrar el camino legacy ✅ *hecha, independiente del deploy*

Prerrequisito, no limpieza opcional: no se pueden paginar dos datasets a la vez.

**Qué se quitó de `src/pages/inventory/table/ItemTable.jsx`:**

| Pieza | Qué era |
|---|---|
| `listItemsQuery` | `GET /db_company/current-inventory/{id}` — inventario completo |
| `itemsInInventoryQuery` | `POST /db_inventory/check-item` — inventario completo |
| `getDataStructuringFormat` | el join en memoria por `serial_number` entre los dos |
| `legacyDataset` | el resultado de ese join |
| `filterDataByDate` y la rama `chosenConditionState === 3` | código muerto: `date` llega siempre `null` desde `MainPage` |
| `useStaffRoleAndLocations`, `orderBy`, `useCallback` | quedaron sin uso al caer lo anterior |

`baseDataset` pasa a ser `refactoredDataset` a secas.

**Un hueco que había que tapar.** El dataset legacy hacía de red mientras
`warehouse-items` estaba en vuelo: la tabla pintaba las filas de los otros dos
fetches. Sin él, una carga sin marcar se lee como «esta compañía no tiene
inventario». Por eso la tabla ahora recibe
`loading={refactoredListInventoryCompany.isLoading}`.

**Las claves de caché: dos listas, y no son la misma.** Esto es lo único de la
Fase 1 que no era obvio. `listOfItemsInStock` e `ItemsInInventoryCheckingQuery`
**no están muertas en el repo**: otras nueve pantallas montan queries con esos
mismos nombres —la tabla de locaciones de `/home`, los flujos de alta/edición/
bulk, el drawer de asignación a consumidor—. Leen el mismo inventario que una
escritura desde `/inventory` acaba de cambiar.

Así que `inventoryQueryKeys.js` ahora distingue:

- `INVENTORY_PAGE_QUERY_NAMES` — **lo que la página monta**. Alimenta el test de
  drift, que scrapea los componentes. Las dos legacy salen de aquí.
- `inventoryPageQueryKeys` — **lo que una escritura desde aquí debe invalidar**.
  Es la lista más ancha de las dos. Las dos legacy **se quedan**, o alguien crea
  un ítem en `/inventory` y se encuentra el conteo viejo en `/home`.

**Ganancia inmediata, sin esperar al deploy:** dos descargas del inventario
completo menos por carga de página.

**Tests:** `src/pages/inventory/utils/inventoryQueryKeys.test.js`, dos casos
nuevos que fijan justo esa distinción. Suite completa: 177 ficheros, 3680 tests,
verde.

---

### Fase 2 — Contrato puro y claves de caché ✅ *hecha*

Nuevo `src/pages/inventory/utils/inventoryPageContract.js`:

- constructores de body para los tres endpoints, **sin `company_id`** (§1.1) —
  con test que lo fija, porque el día que alguien lo añada «por simetría» se
  empieza a comer 400 en cuanto un usuario multi-compañía cambie de compañía;
- whitelist de las **9 claves de filtro** y las **8 columnas ordenables** — las 7
  de la tabla más `logistic_status`, que el backend añadió en §8.3. El servidor
  devuelve 400 ante cualquier otra, así que el cliente no debe llegar a mandarla;
- mapeo de `chosenOption` → `filters`. Ojo con `warehouse`: es entero `1`/`0`
  (§1.3), no cadena. Hoy no lo exponemos como filtro, pero la whitelist lo
  admite y el mapeo tiene que coercionarlo;
- la regla del contrato: **cualquier cambio de filtro, búsqueda u orden resetea
  el cursor a `null`**. Un cursor de una ordenación no vale para otra.

Módulo puro: cae dentro del scope de tests (`src/pages/**/utils/**`) y se testea
antes de escribirlo.

`inventoryQueryKeys.js`: claves nuevas con `company_id`, cursor, orden y
filtros. **Hoy las claves no llevan `company_id`**; en cuanto la respuesta
dependa de parámetros, la caché serviría el resultado de otra consulta.

### Fase 3 — El camino nuevo detrás de un flag ✅ *hecha*

`FEATURE_INVENTORY_SERVER_PAGINATION` en `src/config/featureFlags.js`, default
OFF, documentado en `.env.dev.example`. Es la única forma de mergear antes del
deploy sin romper producción, y sigue el patrón de `FEATURE_SCOPED_ROLES`. Pesa
más aquí porque en este repo se empuja directo a `main`.

`useInventoryPage` mantiene el rastro de cursores recorridos —el keyset no da
números de página— y expone `nextPage` / `previousPage` / `pageNumber`. Cada
cursor tiene su propia clave de caché, así que retroceder es un acierto de caché
y no una petición. `useInventoryFacets` deliberadamente **no** recibe el cursor.

`CursorPager` vive en `table/extras/ux/`, no en `BaseTable`: veinte pantallas
renderizan `BaseTable` y ninguna otra pagina así. Si aparece una segunda, ese
será el momento de subirlo al componente compartido.

Las dos ramas conviven en `ItemTable`, y `ItemTable.test.jsx` fija lo único que
importa de verdad: **con el flag OFF no se llama a ninguno de los tres endpoints
que hoy dan 404**, y la tabla pinta lo mismo que pintaba.

**Bug encontrado al escribir ese test:** `groupingByDeviceType` se calculaba
inline con `groupBy`, que devuelve un objeto nuevo en cada llamada. Alimentaba el
array de dependencias de `refactoredDataset` → `baseDataset`, y el efecto de
búsqueda hace `setSearchResult(baseDataset)`. Cada render producía una identidad
nueva, así que el efecto volvía a dispararse: **bucle de render sin salida**. El
test de montaje se colgaba indefinidamente; memoizado, tarda 1,1 s. Lo cubre
`ItemTable.test.jsx › settles instead of re-rendering forever`.

### Fase 4 — Filtros y búsqueda al servidor ✅ *hecha, detrás del flag*

Lo entregado, punto por punto de lo que pedía esta fase:

- **Opciones desde `inventory-facets`**, con **dos llamadas y no una**: una sin
  filtros para las listas de los desplegables y otra con los filtros activos
  para `matchedTotal`. La separación es el §1.8: si las opciones viajaran con
  los filtros puestos, elegir Brand acotaría la lista de Group y cambiaríamos
  en silencio un comportamiento deliberado.
- **`facetsToFilterOptions`** traduce el bloque `facets` a las claves que leen
  los selects. El índice 2 queda vacío a propósito.
- **Serial Number es ahora un autocompletado** contra `serial-suggest`, en
  `useSerialSuggest`: mínimo dos caracteres —el endpoint responde 400 por
  debajo— y debounce de 250 ms, porque un serial escaneado llega como ocho
  pulsaciones en unos milisegundos y sin eso son ocho peticiones para una
  respuesta que solo la última necesita.
- **`matchedTotal` alimenta `filteredDataCount`** por un callback propio
  (`reportMatchedTotal`), separado del que acarrea el payload del export. Con el
  servidor paginando no hay array que medir: la tabla tiene una página.
- **La búsqueda va al servidor** y hay que decirlo en el equipo: deja de mirar
  dentro del objeto crudo, y buscar un trozo de serial que no empiece por el
  principio deja de encontrar. Si hace falta, la conversación es FULLTEXT, no
  LIKE.

Pendiente menor heredado del §1.1: `serial-suggest` es un `GET` y el contrato lo
enseña con `company_id` en la query. Mandamos solo cabecera, como el resto, y el
backend dice que `resolveCompanyContext` lee la cabecera primero. Se verá en el
primer vistazo con el endpoint desplegado.

<details>
<summary>Lo que pedía la fase, tal como se escribió</summary>

- `FilterOptionsUX`: opciones desde `inventory-facets`. **Ojo con §1.8**: las
  listas no pueden venir acotadas por los otros filtros activos, o cambiamos un
  comportamiento deliberado. Es lo primero que hay que verificar contra el
  endpoint real.
- El select de Serial Number pasa a autocomplete contra `serial-suggest`, con
  debounce y mínimo de 2 caracteres (lo que pide el contrato). Hoy genera una
  opción por ítem: con 50.000 ítems, 50.000 opciones en un desplegable.
- `matchedTotal` alimenta `filteredDataCount` en `MainPage`. El total sin
  filtros lo sigue dando `check-company-has-inventory`.
- **La búsqueda cambia de comportamiento** y hay que decirlo en el equipo: deja
  de mirar dentro del objeto crudo, y buscar un trozo de serial que no empiece
  por el principio deja de encontrar. Si hace falta, la conversación es
  FULLTEXT, no LIKE.

</details>

### Fase 5 — Columnas ✅ *hecha, detrás del flag*

`ColumnsFormat` acepta ahora `serverSorted`, `sortBy` y `sortDir`, y un helper
`sortFor(key, compare)` decide el modo por columna:

- **flag OFF**: `sorter: { compare }`, exactamente lo de hoy. La rama en memoria
  tiene el dataset entero, así que ordenar en cliente es correcto;
- **flag ON**: `sorter: true` — el «esta columna ordena, pero no la ordeno yo»
  de antd: dibuja las flechas y dispara `onChange` sin tocar el orden de las
  filas. Un comparador aquí reordenaría las 50 filas de la página encima del
  orden que MySQL ya aplicó al conjunto completo: cada página quedaría ordenada
  por dentro y mal respecto a la anterior. Va con `sortOrder` explícito, porque
  antd olvida qué columna está ordenada en cuanto se sustituyen las filas.

La columna "Status" pasa a `logistic_status` —campo, clave y `sortBy`— solo en
modo servidor. El backend añadió ese `sortBy` en §8.3 justo para esto: ordenaba
por `warehouse` y pintaba `logistic_status`, o sea que pulsar la cabecera
reordenaba por algo invisible. Y `warehouse` es un entero (§1.3), así que su
`localeCompare` ordenaba números como texto.

`record?.data?.logistic_status` → `record.logistic_status`. **Sin flag**: el
campo de primer nivel existe en las dos ramas, así que es idéntico en
comportamiento hoy, y es el único consumidor del `data` crudo que el contrato
elimina.

El orden vive en `ItemTable` (`serverSort`) y no dentro de antd, porque en modo
servidor la tabla solo tiene una página. `handleTableChange` traduce lo que
devuelve antd; `order` llega `undefined` al tercer clic, que es como el usuario
limpia el orden.

**Lo que NO se arregló, a propósito:** el comparador roto de `serial_number`
(`a - b` sobre texto → `NaN`) sigue vivo **con el flag apagado**. Arreglarlo
habría cambiado producción, y el encargo era dejar la fase detrás del flag. En
modo servidor ya está bien: `localeCompare`, que es como ordena MySQL.

Tests: `ColumnsFormat.test.jsx` (8 casos) fija los dos modos, y que ninguna clave
de columna ordenable caiga fuera de la whitelist del servidor — de ahí saldría
un 400.

### Fase 6 — Quitar el scope del cliente ⬜

Sacar el filtro por `allowedLocations` y por categoría, hoy en
`ItemTable.jsx:258`. Ahora lo aplica el servidor dentro de la consulta, antes de
contar y antes de cortar.

**Solo dentro de la rama nueva.** En la rama vieja tienen que seguir, o con el
flag OFF la página se abre sin scope.

Este es el punto donde un error se ve como «la tabla se vació sola» —el filtro
aplicado dos veces—, así que va con test.

### Fase 6b — El export XLSX como job de cola ⬜

Aceptado en §1.4. `DownloadXlsx` deja de recibir un array y pasa a:

```
POST /api/db_item/inventory-export  (mismos filters / search / scope)
  → 202 { jobId }
  → onAddBackgroundJob({ jobId, ... })
  → el tracker hace polling y avisa al terminar
```

Del lado del cliente hay **una** pieza nueva:
`src/components/backgroundJobs/BackgroundJobsTracker.jsx` sabe hacer polling,
notificar e invalidar `invalidateKeys`, pero **no sabe descargar un fichero**.
Hay que añadir el manejo de la URL de descarga al llegar a `done` — `file-saver`
ya está en el proyecto, lo usa el `DownloadXlsx` actual.

Depende de que el payload terminal del job traiga la URL prefirmada; está pedido
al backend.

### Fase 7 — Limpieza post-deploy ⬜

Quitar el flag y la rama vieja. `graphify update .`

---

## 3. Decisiones tomadas

| Decisión | Por qué |
|---|---|
| **No se manda `company_id` en el body** de los tres endpoints | El header es autoritativo y está garantizado; el body saldría de Redux y los dos divergen tras un cambio de compañía → 400 (§1.1) |
| El export entra en esta tanda, como job de cola | La proyección es más ancha que la de la fila: no es «lo mismo con más filas» (§1.4) |
| `pageSize: 50`, el default del contrato | Con prev/next, páginas de 10 son demasiados clics |
| **No se toca `BaseTable`** | Lo usan 20+ pantallas. Se le pasa `pagination={false}` y los controles de cursor se renderizan en `ItemTable`. Si el patrón se repite, entonces se extrae |
| Pager a anterior/siguiente | El keyset no da números de página. Poco coste: antd ya va con `showQuickJumper: false`, nadie salta a la página N |
| Feature flag obligatorio | 404 hasta el deploy, y aquí se empuja directo a `main` |
| El filtro **Staff member** se quitó de la UI (2026-09-15) | §1.2 probó que no encuentra nada: `usage` no existe en la fila. Un control siempre vacío miente; no se emula en cliente |

---

## 4. Fuera de alcance

- Las tarjetas de `RenderingFilters` — ya se alimentan de agregados del
  servidor. En reposo, paginar la tabla no las afecta (contrato §6.3).
- El forecast (`AdvanceSearchModal`) — no filtra la tabla, navega a
  `/inventory/advance_search_result`.
- La vista de detalle — `POST /db_item/consulting-item` ya existe y no cambia.
- El bug de `filteredList` — ver §1.5.
- El warning de `react-hooks/exhaustive-deps` que queda en `ItemTable.jsx:319`.
  Es **pre-existente**: el fichero traía 4 en `HEAD` y la Fase 1 lo dejó en 1.
  Arreglarlo implica cambiar las dependencias de un efecto que la Fase 4
  sustituye por completo, así que se arregla allí y no antes.
