# Conteo de cierre de evento por identificador (RFID OR2505)

Plan de implementación. Backend, repo `server-testing`.

**Estado — 2026-09-02**

| Fase | Estado |
|---|---|
| 0.1 · ¿los duplicados de la compañía 136 son diseño o re-importación? | **abierto** |
| 0.2 · limpiar los duplicados reales de serial | ✅ hecho — la consulta de reparto devuelve 0 filas en la clase "error real" |
| 1 · migración `item_identifier` | escrita, **sin aplicar** |
| 2 · núcleo puro `normalizeIdentifier` + `reconcile` | ✅ implementado — 21 tests |
| 3 · registro de identificadores (`/api/db_identifier`) | ✅ implementado — 15 tests |
| 4 · conteo de cierre (`/api/db_event/event-count/*`) | ✅ implementado — 15 tests |

Suite: 1058 tests, 1057 pasan. El único fallo es el preexistente de
`routeSecurityHardening.test.js:43` (`routes/auth.js` `GET /:id` sin
`validateJWT`), diferido desde julio y ajeno a este trabajo.

Nada commiteado. La migración es lo único que toca producción, y no se ha
aplicado.

Dato que quedó cuantificado en el camino: **101 valores de serial de la base
resuelven a 2 items cada uno** (202 filas), siempre entre categorías distintas.
Ese es el argumento del proyecto en una línea — hoy hay 101 códigos de barras
que no identifican un equipo, y solo el EPC los desambigua.

---

## 1. Alcance

**Dentro:** el conteo de cierre de un evento. El cliente termina el evento y necesita cerrar el conteo total de dispositivos antes de devolverlos al almacén. El operador barre las cajas con el lector RFID (y escanea con pistola los que no tienen tag), y la pantalla reconcilia contra lo que el evento tiene asignado.

**Fuera:** el conteo de inventario general de bodega, todo el lado Mongo (`receiverspool`, `receivers`), asignación a consumidor, quickGlance.

**Fundamentos reutilizables:** las piezas de §6 (normalización y reconciliación) son puras y no saben nada de eventos. Extrapolar a inventario = mismas piezas + otra fuente de "esperados" + envolver en la cola. Ver §13.

---

## 2. Decisiones tomadas, y por qué

### 2.1 Tabla nueva `item_identifier`, NO una columna en `item_inv`

Trabajamos contra la base de producción. Un `CREATE TABLE` es puramente aditivo: nada lo lee hasta que código nuevo lo lea, y el rollback es `DROP TABLE`. Un `ALTER TABLE item_inv` es un online schema change sobre la tabla que casi todo el sistema toca, y su rollback es otro schema change.

Se verificó que el Go worker **no** se rompería con una columna nueva: `go-worker/controllers.go:715` hace `SELECT * FROM item_inv` pero escanea con `scanRowsToMap` (`:859-876`), que arma los punteros desde `rows.Columns()`. La columna no era peligrosa — la tabla es simplemente inocua, y eso decide.

### 2.2 Tabla de IDENTIFICADORES, no de EPCs

Es la decisión que más valor aporta. No todos los dispositivos van a estar etiquetados el día uno: el estado mixto (unos con tag RFID, otros solo con código de barras) es el estado real y va a durar meses.

Con una tabla de identificadores tipada, la resolución es **una sola consulta y un solo `reconcile()`** sin importar cómo se capturó cada identificador. El operador barre con RFID, escanea el resto con la pistola, y una sola pantalla reconcilia todo.

### 2.3 La unicidad va en la capa escaneable, no en `item_inv`

Verificado en producción (2026-09-02): `item_inv` tiene seriales duplicados y **son mayormente por diseño**. `queue/handlers/bulkInsertItemRange.js:26-35` acuña seriales secuenciales y aplica una plantilla de categoría/grupo a todo el rango; rangos que se solapan entre categorías son consecuencia esperada. La compañía 136 tiene 48+ seriales consecutivos duplicados, en dos bloques enteros.

Por eso `returnEventDevicesToWarehouse` exige `item_group` **y** `category_name`: sin ellos un serial no identifica un item.

Consecuencias:

- **NO** poner `UNIQUE (company_id, serial_number)`. Rompería `insertBulkItem`.
- `UNIQUE (company_id, category_name, item_group, serial_number)` sí sería aplicable tras limpiar 2 filas (§4.2), pero **queda fuera de alcance**: no mueve la demo e introduce un modo de falla nuevo al reclasificar items (`category_name` e `item_group` son editables en `updateItemInTable`).
- La unicidad que el conteo necesita es `UNIQUE (company_id, id_type, id_value)` en la tabla nueva. Un serial duplicado en `item_inv` es legítimo; un identificador **escaneable** duplicado no lo es nunca.

### 2.4 Síncrono, no por cola

El conjunto está acotado (un evento son cientos de dispositivos, no decenas de miles), el endpoint que ya existe es una transacción atómica, y el valor de la feature **es la inmediatez**. Además los jobs de la cola no corren en paralelo: el conteo quedaría detrás de lo que hubiera encolado.

La cola sigue siendo la respuesta para la extrapolación a inventario (§13), que sí es no acotada.

### 2.5 Reconciliar y cerrar son dos operaciones distintas

Reconciliar es **solo lectura y repetible**: el operador barre, ve "48 de 50, faltan X e Y", va a buscarlos, y barre otra vez. Si se fusionara con el cierre, el segundo barrido intentaría devolver equipos ya devueltos.

### 2.6 `epc` NO entra a `ITEM_INV_COLUMNS`

`ITEM_INV_COLUMNS` (`mysql/controllers/item.js:37-68`) se usa en exactamente tres lugares (`:584`, `:1710`, `:2004`), los tres como allowlist de entrada de endpoints "filtrame items por columna=valor" — **los tres anónimos**. No construye ningún INSERT ni lista de SELECT.

Como el identificador vive en otra tabla, esos tres endpoints nunca se vuelven un lector público de EPC→item. Es política deliberada: *el identificador de la etiqueta no es una clave de filtro pública.*

---

## 3. Modelo de datos

`mysql/migrations/create_item_identifier_table.sql` — molde: `create_locations_table.sql`.

```sql
CREATE TABLE IF NOT EXISTS item_identifier (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  item_id    INT NOT NULL,
  id_type    VARCHAR(16) NOT NULL,                             -- 'epc' | 'barcode'
  id_value   VARCHAR(64) COLLATE utf8mb4_general_ci NOT NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  create_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_item_identifier_value (company_id, id_type, id_value),
  INDEX idx_item_identifier_item (company_id, item_id)
);
```

Cada línea, deliberada:

- `UNIQUE (company_id, id_type, id_value)` — un EPC no puede quedar en dos items. Por tipo, así un EPC y un código de barras con el mismo string no chocan entre sí.
- **NO** `UNIQUE (company_id, item_id)` — un item DEBE poder tener EPC *y* código de barras a la vez. Es el punto central. También permite dos tags en un pelican grande, práctica real por confiabilidad de lectura.
- `is_active` en vez de borrar — el re-etiquetado (tag arrancado, dañado) desactiva el viejo e inserta el nuevo. Historial gratis.
- `VARCHAR(16)` y no `ENUM` — agregar un valor a un ENUM es otro schema change.
- Collation `_ci` explícita — para que `abc` y `ABC` colisionen en el UNIQUE, que es lo que se quiere si además se normaliza a mayúsculas al escribir. Si alguien la declara `_bin`, dos casings del mismo tag conviven y el conteo miente.
- Sin FK — consistente con el repo, que no tiene ninguna (PlanetScale).

**No se migran los seriales a esta tabla.** `serial_number` es editable, así que duplicarlo sería un problema de sincronización permanente. La tabla guarda solo lo que no existe en otro lado; la unificación ocurre en la consulta (§8.1).

---

## 4. Fase 0 — Verificación previa en producción

Bloqueante. Nada de código hasta cerrar esto.

### 4.1 ¿Los duplicados de la compañía 136 son diseño o re-importación?

```sql
SELECT item_id, serial_number, category_name, item_group, create_at
FROM item_inv
WHERE company_id = 136 AND serial_number IN ('10001','10002')
ORDER BY serial_number, item_id;
```

Si los nombres de categoría difieren trivialmente ("Receiver" vs "Receivers"), son 48+ dispositivos fantasma que inflarían cualquier conteo y hay que limpiarlos antes de la demo. Si son líneas de producto distintas, es diseño y seguimos.

### 4.2 Limpiar los 2 duplicados reales

| company_id | serial_number | category_name | item_group | items |
|---|---|---|---|---|
| 134 | `123456789A` | Laptops | Chromebooks | 201162, 200586 |
| 143 | `00170` | Laptop | HP 14 Laptop, Intel Celeron N4020 | 200072, 200062 |

No borrar a ciegas. Primero, solo lectura:

```sql
SELECT ii.item_id, ii.company_id, ii.serial_number, ii.category_name, ii.item_group,
       ii.warehouse, ii.create_at, ii.update_at,
       (SELECT COUNT(*) FROM item_inv_assigned_event a WHERE a.item_id = ii.item_id) AS asignaciones
FROM item_inv ii
WHERE ii.item_id IN (201162, 200586, 200072, 200062)
ORDER BY ii.company_id, ii.serial_number, ii.item_id;
```

Si una fila nunca se asignó y nunca se actualizó, es fantasma → borrar. Si ambas tienen historia, son equipos reales → re-serializar la segunda.

### 4.3 Verificar el estado real del esquema

Hay precedente de migraciones aplicadas a medias en producción (ver el comentario en `add_sub_location_id_to_item_inv.sql:5-7`). Confirmar en DBeaver antes de asumir nada.

---

## 5. Fase 1 — Migración

Aplicar `create_item_identifier_table.sql` en DBeaver. Aditivo puro: se puede aplicar con el código actual corriendo y sin coordinación de deploy.

**Ventaja operativa:** permite etiquetar los dispositivos del evento y validar los datos con scripts de solo lectura **antes** de desplegar una línea de código.

---

## 6. Fase 2 — Núcleo puro (TDD, va primero)

`mysql/helpers/identifier.js`. Sin DB, sin HTTP, sin Express. Mismo patrón que `queue/core.js` y `resolveUpdatePlan`.

### 6.1 `normalizeIdentifier(value)`

`trim()` + mayúsculas; `null` si queda vacío. **Un solo helper**, consumido por el registro y por la resolución. Si la escritura normaliza y la lectura no, una lectura en minúsculas no matchea y el item aparece como faltante sin error visible.

### 6.2 `reconcile({ expected, scanned })`

```js
// expected: [{ item_id, serial_number, category_name, item_group, epc|null }]
// scanned:  ['3425E16CB4...', '10001', ...]   (crudos; se normalizan y deduplican dentro)
// →
{
  matched:         [ /* esperados que sí aparecieron (+ matchedBy, matchedVia) */ ],
  missingTagged:   [ /* esperados CON tag que no respondieron  → alarma real */ ],
  missingUntagged: [ /* esperados SIN tag                      → verificar a mano */ ],
  unmatched:       [ /* valores escaneados que no son de este evento */ ],
  ambiguous:       [ /* { value, item_ids } — resuelve a más de un esperado */ ],
}
```

La partición de `missing` en dos es obligatoria. Un dispositivo sin etiqueta que sí está en la caja se ve idéntico a uno perdido; sin separarlos, la pantalla muestra falsas alarmas y el operador aprende a ignorarlas.

**`ambiguous` — bucket agregado durante la implementación.** Producción tiene seriales duplicados por diseño (§2.3), así que dos items del **mismo evento** pueden compartir serial. Escanear ese código de barras no identifica a ninguno de los dos: marcarlos ambos como presentes sería mentir. Quedan como faltantes y el valor se reporta aparte. Es, literalmente, la ambigüedad que el EPC existe para resolver — y cuando ambos tienen tag, el EPC la desambigua y el bucket queda vacío.

`matched` lleva además `matchedBy` (el valor que lo resolvió) y `matchedVia` (`'epc'` | `'serial'`), para que la pantalla pueda distinguir lo que entró por RFID de lo que entró por pistola.

Función pura, determinista, sin `Date.now()`, y no muta sus entradas. La deduplicación de escaneos vive acá dentro: un lector RFID re-emite el mismo tag muchas veces por barrido. Es la pieza que se reusa completa en el conteo de inventario.

---

## 7. Fase 3 — Registro de identificadores

Sin una vía para vincular tags a items no hay nada que contar. **Esto desbloquea todo lo demás**, y en este alcance es chico: solo los dispositivos de un evento, decenas o cientos.

**Router nuevo:** `mysql/routes/identifier.js` → `/api/db_identifier` (agregar la entrada al objeto `mysqlRoutes` de `index.js`, que monta con prefijo `db_`).

Router nuevo a propósito: `mysql/routes/item.js:101` tiene `router.post("/:id", ...)` que **tapa toda ruta POST de un segmento registrada después** (hoy ya oculta ~14, incluida `/inventory-query`). Un namespace nuevo evita la trampa en vez de esquivarla.

```
POST   /api/db_identifier/register        registrar/reemplazar un identificador
POST   /api/db_identifier/register-bulk   lote (etiquetado masivo del evento)
POST   /api/db_identifier/by-items        leer los identificadores de N items
```

Middleware: `validateJWT, checkTokenVersion, authorizePermission("inventory","update")` (lectura: `"read"`). Ambos pares existen y están en uso — verificado en `seed_roles_permissions.sql:15` y en 5 rutas de producción.

Además `resolveCompanyContext(request)` para el company scope, y `buildInventoryScopeFilter(userAccess)` para que un rol con scope por ubicación/categoría no etiquete fuera de su alcance.

### Conflicto de identificador — aquí aterriza la alerta

Si el `id_value` ya está tomado en esa compañía, responder **409** nombrando el `item_id` que ya lo tiene:

```json
{ "ok": false, "msg": "Identifier already assigned",
  "conflict": { "id_value": "10001", "id_type": "barcode", "item_id": 100546 } }
```

Consecuencia conocida y aceptada: los dos `10001` de la compañía 136 **no pueden registrarse ambos como `barcode`**. Es correcto — un identificador escaneable que resuelve a dos dispositivos no sirve para nada. Para esos items el EPC pasa a ser el único identificador escaneable viable, que es justamente el punto del proyecto.

**En `register-bulk`, pre-flight obligatorio:** un `SELECT ... WHERE id_value IN (...)` antes de insertar, y devolver la lista de conflictos. Sin eso, el UNIQUE aborta el lote entero y no se sabe cuál falló.

---

## 8. Fase 4 — Conteo de cierre de evento

Montar en `mysql/routes/events.js` (montado como `/api/db_event`, singular) — **no** en `db_item`, donde la ruta gemela quedaría tapada por el comodín.

### 8.1 `POST /api/db_event/event-count/reconcile` — solo lectura, repetible

Middleware: `validateJWT, checkTokenVersion, authorizePermission("inventory","read")`.

Conjunto esperado — **el JOIN a `item_inv` es obligatorio**: `item_inv_assigned_event` NO tiene `company_id` (columnas: `event_id`, `item_id`, `created_at`); el scope multi-tenant sale del JOIN. Sin él, es cross-tenant. Está documentado en el catálogo (`eventAssignments.deleteByEventAndItems`, `scopingAdded: true`).

```sql
SELECT ii.item_id, ii.serial_number, ii.category_name, ii.item_group,
       idn.id_value AS epc
FROM item_inv_assigned_event iiae
JOIN item_inv ii ON ii.item_id = iiae.item_id
LEFT JOIN item_identifier idn
       ON idn.item_id = ii.item_id AND idn.company_id = ii.company_id
      AND idn.id_type = 'epc' AND idn.is_active = 1
WHERE iiae.event_id = ? AND ii.company_id = ?
```

El conjunto es acotado, así que `reconcile()` corre en memoria contra él. Los `unmatched` se clasifican con una segunda consulta contra `item_identifier` scopeada a la compañía:

- **`foreign`** — es un equipo de esta compañía, pero no de este evento ("escaneaste un equipo de otro evento"). Muy útil en bodega.
- **`unknown`** — no pertenece a la compañía.

Contrato:

```
POST /api/db_event/event-count/reconcile
headers: x-token, s-company-lq
body:    { "event_id": 123, "company_id": 45, "scanned": ["3425E16CB4...", "10001"] }

200 → {
  ok: true,
  summary: { expected: 50, matched: 48, missing: 2, foreign: 1, unknown: 0, ambiguous: 0 },
  matched:          [ { item_id, serial_number, category_name, item_group, epc,
                        matchedBy, matchedVia } ],
  missing_tagged:   [ { item_id, serial_number, epc } ],
  missing_untagged: [ { item_id, serial_number } ],
  foreign:          [ { id_value, item_id } ],
  unknown:          [ "3425E1..." ],
  ambiguous:        [ { value: "10001", item_ids: [100546, 199910] } ]
}
```

Límite de identificadores por llamada: **500**, alineado al chunk que ya usa el frontend. 400 si se excede.

**Nota de contrato:** `company_id` debe ir en el body — `authorizePermission` lo lee de params/body/query, **no** del header (`middlewares/authorizePermission.js:15`), mientras que `resolveCompanyContext` prefiere el header `s-company-lq`. El controlador debe exigir que coincidan, o un desajuste produce 403 incomprensibles.

### 8.2 `POST /api/db_event/event-count/close` — escribe, transaccional

Middleware: `validateJWT, checkTokenVersion, authorizePermission("inventory","update")` (los roles de evento, sale_manager L2 y event_manager L3, ya lo tienen).

Misma transacción que `returnEventDevicesToWarehouse` (`mysql/controllers/item.js:2154`), pero resolviendo por identificador: `SELECT ... FOR UPDATE` → `UPDATE item_inv SET warehouse = 1` → `DELETE FROM item_inv_assigned_event`. **Sin necesidad de `item_group` ni `category_name`**, porque el identificador ya es inequívoco. Eso habilita el caso que hoy no se puede atender: un pelican mixto barrido de una pasada (hoy requiere N llamadas, una por combinación grupo/categoría).

**Cierre parcial:** con 2 faltantes de 50, se cierran los 48 y los 2 quedan asignados, reportados. Es lo que la transacción actual ya hace naturalmente (solo toca los `item_id` que resolvió) — solo hay que hacer que lo *diga*.

**No se toca `returnEventDevicesToWarehouse`.** Está en producción en tres routers. La duplicación de la transacción es deuda aceptada y anotada; converger después, no ahora.

---

## 9. Fase 5 — Tests

Runner: `node:test` nativo. No hay jest, mocha ni supertest. `package.json:9` → `"test": "node --test test/*.test.js"`.

> En PowerShell/cmd ese glob **no expande**. Usar Git Bash, o un archivo puntual: `node --test test/identifierReconcile.test.js`.

Estilo de la casa: sin DB y sin HTTP — se reemplaza el módulo del pool en `require.cache` con un pool falso y se afirma sobre **el SQL y los params que el controlador produce**. Modelo a copiar: `test/subLocationItemIntegration.test.js` (`loadItemController`, `makeTxPool`, `mockRes`).

> El pool falso debe incluir el stub de `company_staff` que devuelve `role_level: 1`. Sin eso los gates de scope devuelven 403 y el test falla por la razón equivocada.

| Test | Qué afirma |
|---|---|
| `identifierNormalize.test.js` | trim + mayúsculas; vacío → `null` |
| `identifierReconcile.test.js` | los 4 buckets; `missing` partido en tagged/untagged |
| `identifierReconcile.test.js` | esperado sin tag nunca cae en `missingTagged` |
| `identifierRegister.test.js` | valor duplicado → 409 nombrando el `item_id` en conflicto |
| `identifierRegister.test.js` | bulk: el pre-flight reporta conflictos sin abortar el lote |
| `eventCountReconcile.test.js` | el SQL incluye el JOIN a `item_inv` (scope multi-tenant) |
| `eventCountReconcile.test.js` | `companyId` sale del contexto, no del body |
| `eventCountReconcile.test.js` | rol con scope y sin asignaciones ⇒ no resuelve nada (fail-closed) |
| `eventCountClose.test.js` | cierre parcial: solo toca los `item_id` resueltos |

Cada test se escribe **antes** de su fase.

---

## 10. Orden de trabajo

1. **Fase 0** — verificación y limpieza en producción. Bloqueante.
2. **Fase 1** — migración (aditiva, sin deploy).
3. **Fase 2** — núcleo puro `normalizeIdentifier` + `reconcile`, con sus tests.
4. **Fase 3** — registro de identificadores. Desbloquea el etiquetado.
5. *Etiquetar los dispositivos del evento de la demo.*
6. **Fase 4** — `reconcile` y luego `close`. **Avisar al frontend cuando el contrato esté desplegado.**
7. **Fase 5** — tests transversales (cada uno escrito antes de su fase).
8. `graphify update .`

Orden de deploy: migración → backend → frontend. La migración puede ir sola y con antelación; el backend no rompe nada mientras nadie llame las rutas nuevas.

---

## 11. Fuera de alcance, explícito

No se toca nada de esto:

- Esquema de `item_inv` (ni columna, ni UNIQUE, ni índice).
- `ITEM_INV_COLUMNS`.
- `returnEventDevicesToWarehouse` ni sus tres montajes.
- Los handlers de alta masiva (`inventoryBulkInsert`, `bulkInsertItemRange`).
- La cola.
- Todo el lado Mongo.

---

## 12. Deuda conocida, no bloqueante

Ninguna de estas bloquea el proyecto, porque el identificador vive fuera de `item_inv` y fuera de `ITEM_INV_COLUMNS`. Se registran para que no se pierdan:

- **`POST /db_item/warehouse-items`** (`consultingItemInWarehouseTable`, `mysql/controllers/item.js:686`) interpola las **claves del body** crudas, sin backticks y sin allowlist → inyección SQL explotable por cualquier usuario autenticado. Bug real e independiente de este proyecto.
- **`POST /db_item/consulting-item`** (`mysql/routes/item.js:63`) no tiene autenticación **ni filtro de compañía**. Escapa y valida contra la allowlist, así que no es inyectable, pero es cross-tenant.
- **El comodín `router.post("/:id")`** (`mysql/routes/item.js:101`) tapa ~14 rutas POST de un segmento. Nunca explotó porque `/:id` y `/delete-item` apuntan al mismo handler, que ignora `req.params.id`. El arreglo es mover el comodín al final del archivo.
- **`UNIQUE (company_id, category_name, item_group, serial_number)`** — viable tras la limpieza de §4.2. Candidato futuro, evaluado y pospuesto (§2.3).

---

## 13. Extrapolación a inventario

Lo que se reusa **sin cambios**: la tabla `item_identifier`, `normalizeIdentifier()`, `reconcile()`, y las rutas de registro (Fase 3).

Lo que cambia:

- **La fuente de "esperados"**: en vez de `item_inv_assigned_event` para un evento, `item_inv WHERE company_id = ? AND location_id = ?` (o sub-locación, o bodega). Son unas líneas de SQL; `reconcile()` ni se entera.
- **El transporte**: el conteo de bodega no está acotado, así que ahí sí va por la cola. El patrón exacto ya existe: `createQueuedJobController(type, (body) => body, { validate })` guarda el body del cliente tal cual como payload (`Schema.Types.Mixed`), responde 202 con `jobId`, y el cliente polea `GET /api/jobs/owned/:jobId`. Idempotencia por `idempotencyKey` (índice `unique + sparse`), auditoría por `context`, backoff y dead-letter, todo gratis.

Dos cosas a tener presentes en esa fase:

- Los jobs `done` se **borran a los 7 días** (`models/Job.js:50`, TTL sobre `doneAt`). El job puede llevar el conteo; el vínculo identificador→item tiene que estar en `item_identifier`, nunca solo en el job.
- Los jobs **no corren en paralelo**. Si un conteo masivo bloquea la cola, la válvula ya existe: `constants/queueTypeGroups.js` con `QUEUE_GROUP` / `QUEUE_EXCLUDE_GROUPS` permite un worker dedicado por grupo de tipos. Ojo: el servicio nssm `DevitrakDeleteWorker` quedó documentado y **nunca se creó en producción** — si se va por worker dedicado, ese paso hay que confirmarlo.

---

## 14. Preguntas abiertas, de producto

- ¿Formato canónico del EPC: hex crudo en mayúsculas, o URI GS1 (`urn:epc:id:giai:...`)? Afecta el tamaño de `id_value` y la normalización. `VARCHAR(64)` cubre ambos.
- ¿Quién aplica la migración en producción y cuándo?
- ¿El cierre parcial requiere alguna confirmación explícita del operador, o basta con reportar los faltantes?
