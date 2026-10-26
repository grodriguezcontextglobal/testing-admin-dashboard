# Frontend — conteo de cierre de evento por RFID / código de barras

Contrato de los endpoints nuevos del servidor. Repo backend: `server-testing`.
Diseño y razones: `DESIGN_rfid_event_count.md`.

---

## 0. Estado de despliegue — leer primero

| Pieza | Estado |
|---|---|
| Tabla `item_identifier` en producción | ✅ **creada** (2026-09-02) |
| Código del servidor | ⚠️ **escrito y testeado, NO commiteado ni desplegado** |

**Los endpoints de abajo todavía responden 404 en producción.** El contrato está
cerrado y no va a cambiar sin avisar, así que se puede construir contra él desde
ya — pero no se puede integrar contra el servidor real hasta el deploy. Vamos a
avisar cuando esté arriba.

---

## 1. Lo que hay que saber antes de la primera llamada

### 1.1 Headers

```
x-token:       <JWT de sesión>
s-company-lq:  <company_id>
Content-Type:  application/json
```

⚠️ Es **`s-company-lq`**, no `x-company-id`. `x-company-id` es el contrato del
lado Mongo; estas rutas son MySQL y usan el otro. Mezclarlos da 403.

### 1.2 `company_id` va TAMBIÉN en el body, y tiene que coincidir

Todas estas rutas piden `company_id` en el body **además** del header, y el
servidor responde **400** si los dos no coinciden.

No es redundancia caprichosa: el middleware de permisos lee el `company_id` del
body y el resolutor de contexto prefiere el header. Si difieren, el permiso se
valida contra una compañía y los datos se leen de otra. Antes eso daba 403
incomprensibles; ahora da un 400 que lo dice.

**Manda el mismo valor en los dos lugares, siempre.**

### 1.3 Topes por llamada — y uno de ellos NO se trocea

| Campo | Endpoint | Tope | ¿Trocear? |
|---|---|---|---|
| `identifiers` | `/db_identifier/register-bulk` | 500 | sí, es seguro |
| `item_ids` | `/db_identifier/by-items` | 500 | sí, es seguro |
| `scanned` | `/db_event/event-count/*` | **2000** | ⛔ **NO** |

Registrar y leer son operaciones **por valor**: los lotes son independientes y
los resultados se concatenan.

**Reconciliar no lo es.** `missing` se deriva de *esperados menos escaneados*, así
que un lote parcial produce un `missing` parcial: si se mandan 500 de 1200
valores únicos, los otros 700 vuelven marcados como faltantes — sin ningún error.
Un cliente que trocee y concatene reporta equipos perdidos que están en la caja.

Por eso **`scanned` debe ser el barrido COMPLETO**, y por eso el tope es 2000 y
no 500. Trocear no está soportado; por encima de 2000 el servidor responde 400.

### 1.4 Normalización

El servidor normaliza todo identificador a **`trim()` + MAYÚSCULAS** antes de
guardar y antes de comparar. No hace falta normalizar en el cliente, pero sí hay
que saber que **los valores vuelven en mayúsculas**: si la UI compara contra lo
que leyó el lector sin normalizar, no va a matchear.

No se tocan los separadores internos. Si el OR2505 emite el EPC con espacios,
avisar — es una decisión de formato que sigue abierta.

---

## 2. Registro de identificadores

Vincular una etiqueta RFID (o un código de barras) a un item del inventario.
**Sin esto no hay nada que contar**: hay que etiquetar antes de barrer.

Namespace: **`/api/db_identifier`**.

### 2.1 `POST /api/db_identifier/register`

Permiso: `inventory:update`.

```jsonc
// request
{ "company_id": 45, "item_id": 100, "id_type": "epc", "id_value": "3425E16CB4" }
```

`id_type` es `"epc"` o `"barcode"`. Nada más.

| Código | Cuerpo | Significa |
|---|---|---|
| 201 | `{ ok:true, identifier:{ item_id, id_type, id_value } }` | Vinculado |
| 200 | `{ ok:true, msg:"Identifier already registered for this item" }` | Ya estaba, mismo item. **No es error** — reenviar es idempotente |
| 409 | `{ ok:false, msg:"Identifier already assigned", conflict:{ id_value, id_type, item_id } }` | Ese valor ya lo tiene **otro** item |
| 404 | `{ ok:false, msg:"Item not found for this company, or outside your assigned scope" }` | El item no es de la compañía, o el usuario tiene scope por ubicación/categoría y el item queda fuera |
| 400 | `{ ok:false, msg:"..." }` | `item_id`, `id_type` o `id_value` inválidos |

**El 409 es la alerta que hay que mostrar bien.** `conflict.item_id` es el item
que ya tiene ese valor. Mensaje sugerido: *«Esa etiqueta ya está asignada al
item #555»*, con enlace a ese item. Un "error al guardar" genérico desperdicia
la única información útil de la respuesta.

Va a pasar de verdad: en la base hay **101 valores de código de barras que
corresponden a 2 equipos distintos** cada uno. El segundo registro de esos
valores como `barcode` se rechaza, y es correcto — un código escaneable que
apunta a dos equipos no sirve. Para esos items, el EPC es el único identificador
escaneable viable.

**Re-etiquetado:** registrar un `epc` nuevo en un item que ya tenía uno desactiva
el anterior automáticamente. No hay que borrar nada primero.

**Reimprimir la misma etiqueta funciona.** Si el valor ya existe pero su fila está
inactiva, `register` la **reclama** (`UPDATE`, no `INSERT`) y devuelve 201 — sea
del mismo item o de otro. Un tag despegado de un equipo y pegado en otro es un
caso normal de bodega, no un 409.

### 2.2 `POST /api/db_identifier/register-bulk`

Permiso: `inventory:update`. Es el que conviene usar para etiquetar los equipos
de un evento.

```jsonc
// request
{
  "company_id": 45,
  "identifiers": [
    { "item_id": 100, "id_type": "epc", "id_value": "3425E16CB4" },
    { "item_id": 101, "id_type": "epc", "id_value": "3425E16CB5" }
  ]
}
```

```jsonc
// 200 — SIEMPRE 200 si el lote fue procesable, incluso con conflictos
{
  "ok": true,
  "registered": 2,
  "conflicts": [
    {
      "item_id": 101,            // ← el que MANDASTE
      "id_type": "epc",
      "id_value": "3425E16CB5",
      "reason": "already assigned",
      "conflict_item_id": 555    // ← quién lo tiene (ausente en el caso de scope)
    }
  ],
  "rejected": [ { "...": "entrada original", "reason": "invalid entry" } ]
}
```

Tres puntos que importan:

- **`item_id` es siempre el que mandaste**, para poder emparejar el conflicto con
  tu propia fila. El dueño actual del valor va en `conflict_item_id`, aparte.
- **El lote no se aborta por un conflicto.** Se aplica todo lo que se puede y se
  reporta el resto. `registered + conflicts + rejected` cubre lo enviado.
- `reason` puede ser `"already assigned"`, `"duplicated within the batch"` (dos
  filas del mismo lote con el mismo valor: gana la primera) o `"item not found in
  this company or outside your scope"` (este último **sin** `conflict_item_id`).

`rejected` es distinto de `conflicts`: son entradas malformadas (sin `item_id`,
`id_type` inválido, `id_value` vacío), no colisiones.

### 2.3 `POST /api/db_identifier/by-items`

Permiso: `inventory:read`. Para pintar qué etiqueta tiene cada equipo.

```jsonc
// request
{ "company_id": 45, "item_ids": [100, 101, 102] }

// 200
{ "ok": true, "identifiers": [
  { "item_id": 100, "id_type": "epc", "id_value": "3425E16CB4", "is_active": 1, "update_at": "..." }
] }
```

Solo devuelve los **activos**. Un item sin fila es un item sin etiquetar — que es
un estado normal y esperado, no un error.

---

## 3. Conteo de cierre de evento

Namespace: **`/api/db_event`** — en **singular**. (Si en algún borrador previo
apareció `db_events`, estaba mal.)

### 3.1 El flujo

```
1. El operador abre el cierre del evento.
2. Barre las cajas con el lector RFID y escanea con pistola lo que no tiene tag.
3. → POST /event-count/reconcile   (solo lectura, se puede repetir todas las
                                    veces que haga falta)
4. La pantalla muestra "48 de 50" y qué falta.
5. El operador va a buscar lo que falta y vuelve al paso 2.
6. Cuando está conforme → POST /event-count/close
```

**`reconcile` no escribe nada.** Llamarlo diez veces es seguro y es el uso
esperado — barrer, ver, buscar, barrer otra vez. Solo `close` modifica el
inventario.

### 3.2 `POST /api/db_event/event-count/reconcile`

Permiso: `inventory:read`.

```jsonc
// request — `scanned` mezcla EPCs y códigos de barras sin distinguir
{
  "event_id": 123,
  "company_id": 45,
  "scanned": ["3425E16CB4", "3425E16CB5", "10003"]
}
```

```jsonc
// 200
{
  "ok": true,
  "summary": {
    "expected": 50,    // lo que el evento tiene asignado
    "scanned": 48,     // valores únicos recibidos (ya deduplicados)
    "matched": 48,
    "missing": 2,      // = missing_tagged.length + missing_untagged.length
    "foreign": 1,
    "unknown": 0,
    "ambiguous": 0
  },
  "matched": [
    { "item_id": 1, "serial_number": "10001", "category_name": "Receivers",
      "item_group": "RX-100", "epc": "3425E16CB4",
      "matchedBy": "3425E16CB4", "matchedVia": "epc" }
  ],
  "missing_tagged":   [ { "item_id": 3, "serial_number": "10003", "epc": "3425E16CB6", "...": "" } ],
  "missing_untagged": [ { "item_id": 4, "serial_number": "10004", "epc": null, "...": "" } ],
  "foreign":  [ { "id_value": "CCDD", "item_id": 77 } ],
  "unknown":  [ "ZZZZ" ],
  "ambiguous": [ { "value": "10001", "item_ids": [100546, 199910] } ]
}
```

No hace falta mandar el lector y la pistola por separado: `scanned` es una sola
lista y el servidor resuelve cada valor contra el EPC o contra el número de serie
del equipo, lo que corresponda. El campo **`matchedVia`** (`"epc"` o `"serial"`)
dice por cuál vía entró cada uno, por si la UI quiere distinguirlo.

El servidor deduplica los escaneos: el lector RFID re-emite el mismo tag muchas
veces por barrido y eso ya está contemplado.

### 3.3 `POST /api/db_event/event-count/close`

Permiso: `inventory:update`. Mismo request que `reconcile`.

```jsonc
// 200 — el mismo reporte, más lo que efectivamente se escribió
{
  "ok": true,
  "returned_items": 48,        // items devueltos a bodega (warehouse = 1)
  "removed_assignments": 48,   // asignaciones al evento eliminadas
  "summary": { "...": "igual que reconcile" },
  "...": "matched / missing_tagged / missing_untagged / foreign / unknown / ambiguous"
}
```

**El cierre es parcial a propósito.** Con 2 faltantes de 50 se devuelven los 48 y
los 2 **quedan asignados al evento**, reportados en `missing_*`. No bloquea el
cierre por equipos que no aparecieron: eso obligaría al operador a elegir entre
mentir y no cerrar.

Todo ocurre en una transacción: o se aplican los 48 completos, o ninguno.

---

## 4. Reglas de UI que no son opcionales

Tres cosas que, si se pintan mal, hacen que la pantalla mienta.

### 4.1 `missing_tagged` y `missing_untagged` NO son lo mismo

- **`missing_tagged`** — el equipo tiene etiqueta y **no respondió**. Es una
  alarma real: o no está en la caja, o el tag falló.
- **`missing_untagged`** — el equipo **nunca tuvo etiqueta**. Muy probablemente
  está en la caja; simplemente no hay forma de detectarlo por RFID. Es un paso de
  flujo («verificar a mano»), no una alarma.

Mezclarlas en una sola lista de «faltantes» llena la pantalla de falsas alarmas
durante toda la transición a RFID, y el operador aprende a ignorarlas. Ese es el
peor resultado posible para un conteo.

### 4.2 `ambiguous` hay que mostrarlo, y no se cuenta aparte

Un valor en `ambiguous` resolvió a **más de un equipo** del mismo evento — pasa
con los 101 seriales duplicados. Escanearlo no identifica a ninguno, así que el
servidor **no** los da por presentes.

⚠️ **Esos equipos aparecen TAMBIÉN en `missing_*`.** No los sumes por separado o
vas a contar de más: `matched + missing = expected` siempre se cumple, y
`ambiguous` es una anotación sobre por qué algo quedó sin resolver.

Mensaje sugerido: *«"10001" corresponde a 2 equipos de este evento (#100546,
#199910). Escaneá su etiqueta RFID para distinguirlos.»* Es, literalmente, el
caso que el proyecto existe para resolver.

### 4.3 `foreign` no es `unknown`

- **`foreign`** — es un equipo **de esta compañía**, pero no de este evento
  (típicamente asignado a otro, o en bodega). Trae el `item_id`. Accionable:
  *«escaneaste un equipo de otro evento»*.
- **`unknown`** — no pertenece a la compañía. Nada que hacer más que ignorarlo.

---

## 5. Errores comunes

| Código | Causa probable |
|---|---|
| 400 `Company mismatch between header and body` | El body y `s-company-lq` traen valores distintos. La respuesta trae `detail: { header, body }` con los dos valores |
| 400 `Company context is required...` | Falta el header `s-company-lq` y no hay `company_id` en el body |
| 400 `Too many identifiers in one call (max 500)` | Falta trocear |
| 401 | Falta `x-token`, o expiró |
| 403 `Forbidden: insufficient permissions` | El rol no tiene `inventory:read`/`inventory:update` |
| 403 (contexto) | El usuario no es miembro activo de esa compañía |
| 404 (solo en `register`) | El item no es de la compañía, o queda fuera del scope del usuario |

Los usuarios con rol acotado por ubicación o categoría (niveles 6–9) solo ven y
etiquetan lo que tienen asignado. Si no tienen ninguna asignación, no resuelven
nada — por diseño, falla cerrado. Para ellos `expected` puede venir en 0 aunque
el evento tenga equipos.

---

## 6. Lo que NO cambia

- **`POST /api/db_event/return-event-devices` sigue funcionando igual.** No se
  tocó. El cierre nuevo es aditivo, no un reemplazo. Se puede migrar cuando
  convenga.
- No cambió ningún endpoint de inventario existente.
- No cambió el esquema de `item_inv`. La tabla nueva es aparte, así que ninguna
  respuesta que ya se consume trae campos nuevos.

Ventaja del camino nuevo, por si sirve para decidir la migración:
`return-event-devices` exige `item_group` **y** `category_name` en cada llamada,
porque un número de serie por sí solo no identifica un equipo. El cierre por
identificador no los necesita, así que una caja con equipos de varias categorías
se cierra **en una sola llamada** en vez de una por combinación.

---

## 7. Preguntas abiertas para el frontend

1. ¿En qué formato exacto entrega el OR2505 el EPC — hex crudo, o con
   separadores? Define si hay que limpiar antes de mandarlo.
2. ¿El cierre parcial necesita una confirmación explícita del operador («faltan
   2, ¿cerrar igual?»), o alcanza con reportarlo después?
3. ¿La pantalla de etiquetado va a ser masiva (leer N tags y asignarlos a N items
   de una lista) o de a uno? Cambia si conviene `register-bulk` o `register`.
