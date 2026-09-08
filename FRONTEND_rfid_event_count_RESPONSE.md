# Respuesta del cliente — conteo de cierre de evento por identificador

**Responde a:** `DESIGN_rfid_event_count.md` (repo `server-testing`, 2026-09-02)
**De:** frontend · **Fecha:** 2026-09-02

El diseño es sólido y en el punto central es **mejor que el que el cliente había
asumido**: nosotros íbamos a decodificar el serial desde el tag y reconciliar
localmente, y sus §2.2/§2.3 muestran por qué eso no alcanza. Con 101 valores de
serial que resuelven a 2 items, decodificar un EPC a `10001` no identifica a
ninguno de los dos. Adoptamos la tabla de identificadores.

Dicho eso, hay **un conflicto de premisas que invalida el argumento del §2.3
tal como está escrito**, y hay que resolverlo antes de aplicar la migración. Es
el §A y es lo único bloqueante de este documento.

---

## La estrategia única

Quién es dueño de qué, para que no haya dos implementaciones de lo mismo:

| Pieza | Dueño | Nota |
|---|---|---|
| Ingesta de las lecturas (pegado, puente, WebSerial) | **cliente** | `parsePastedScanDump`, ya construido |
| Deduplicar el barrido antes de enviar | **cliente** | el lector reemite el mismo tag decenas de veces |
| Distinguir EPC de serial en la entrada | **ambos** | el cliente lo etiqueta por prefijo/forma; el servidor **no** confía en eso y resuelve por tabla |
| Resolver identificador → item | **servidor** | `item_identifier`, única fuente de verdad |
| Reconciliar esperados vs leídos | **servidor** | `POST /db_event/event-count/reconcile` |
| Acumulación en vivo mientras el operador barre | **cliente** | sin llamar al servidor por lectura |
| Decidir qué se graba en el tag | **producto** | ver §A |
| Precargar el registro de tags (Fase 3) | **cliente** | decodifica el tag para proponer el item; el servidor valida |
| Cerrar el evento | **servidor** | `POST /db_event/event-count/close`, transaccional |

Regla que ordena todo lo demás: **el cliente nunca decide a qué item pertenece
un identificador.** Propone, el servidor resuelve. Cualquier atajo en esa
dirección reintroduce la ambigüedad que este proyecto existe para eliminar.

---

## Veredictos

| Su decisión | Veredicto |
|---|---|
| §2.1 tabla nueva en vez de columna en `item_inv` | ✅ de acuerdo |
| §2.2 tabla de identificadores tipada, no de EPCs | ✅ de acuerdo, y es la mejor decisión del documento |
| §2.3 unicidad en la capa escaneable | ✅ de acuerdo — pero ver **§A** |
| §2.4 síncrono, no por cola | ✅ de acuerdo, y refuerza el §B |
| §2.5 reconciliar y cerrar separados | ✅ de acuerdo, es lo que la UI necesita |
| §2.6 `epc` fuera de `ITEM_INV_COLUMNS` | ✅ de acuerdo |
| §3 modelo de datos | ⚠️ el UNIQUE necesita un ajuste — **§C** |
| §6.2 `reconcile` y sus buckets | ✅ de acuerdo; `ambiguous` era necesario. Una pregunta en **§D** |
| §8.1 techo de 500 identificadores | ⛔ **rompe la semántica de `reconcile`** — **§B** |
| §8.1 `company_id` en body + header | ⚠️ va a fallar, con evidencia del cliente — **§E** |
| §8.2 cierre parcial | ✅ de acuerdo; respuesta de UI en **§F** |
| §14 preguntas abiertas | dos cerradas en **§F** |

---

## §A — ⛔ Bloqueante: los tags llevan el serial grabado

Dato que el diseño no tiene, confirmado por Gustavo el 2026-09-02:

> Las etiquetas se **imprimieron y grabaron**. La impresora configura la
> etiqueta a nivel EPC y tinta, con el serial que se desee.

Es decir: el banco EPC de esos tags contiene **el número de serie**, en ASCII.
Un tag del equipo con serial `RRRRR001` responde
`525252525230303100000000`, que es `RRRRR001` carácter por carácter.

Eso choca de frente con el §2.3 y con el §190:

- Los dos items de la compañía 136 que comparten el serial `10001` tendrían
  tags que codifican **el mismo valor**. Mismo `id_value`.
- `uq_item_identifier_value (company_id, id_type, id_value)` **rechaza el
  segundo**. El primer equipo etiquetado se registra; el segundo devuelve 409.
- Y el 409 sería correcto: dos tags que emiten la misma cadena no son dos
  identificadores, son el mismo identificador puesto dos veces.

**El EPC solo desambigua si lo grabado es único por item, y el serial no lo
es.** El argumento del proyecto se sostiene, pero exige una decisión de
etiquetado que hoy no está tomada.

### Opciones, en orden de preferencia del cliente

1. **Grabar `item_id`.** Es la clave primaria real: única por compañía por
   construcción, corta (`201162` son 6 caracteres, y el banco de 96 bits
   sostiene 12), y conocida al momento de etiquetar porque el item ya existe en
   `item_inv`. La etiqueta sigue **imprimiendo el serial en tinta** para el
   humano; la máquina lee el `item_id`. Es la separación de siempre entre lo que
   lee una persona y lo que lee un lector, y convierte la resolución en una
   búsqueda exacta sin ninguna ambigüedad posible.
2. **Grabar el serial y re-serializar los duplicados.** Su §4.2 ya contempla
   limpiar 2 filas; esto extiende esa limpieza a los 101 valores. Es trabajo de
   datos sobre producción y toca equipos que ya están etiquetados con tinta.
3. **Grabar el serial y aceptar el hueco.** Para los 101 valores duplicados,
   solo un equipo de cada par queda etiquetable. Los otros 101 se cuentan a mano
   para siempre. No lo recomendamos, pero es viable si la demo no los toca.

**Para la demo hay una salida inmediata:** los 100 receptores que Fredrik ya
etiquetó son de una línea de producto, así que probablemente no tienen seriales
duplicados entre sí. Una consulta lo confirma y desbloquea la demo sin decidir
la política general:

```sql
SELECT serial_number, COUNT(*) AS items
FROM item_inv
WHERE company_id = ? AND item_id IN (/* los del evento de la demo */)
GROUP BY serial_number HAVING COUNT(*) > 1;
```

Cero filas ⇒ los tags con el serial sirven para la demo y la decisión general se
toma después. Con filas ⇒ hay que ir a la opción 1 antes de etiquetar más.

**Nota de implementación del cliente:** nuestro decodificador
(`epcSerial.js`) lee ASCII, así que funciona igual si lo grabado es un
`item_id`; lo único que cambia es qué significa el valor devuelto. Si se va por
la opción 1, renombramos `decodeSerialFromEpc` → `decodeAsciiFromEpc` y el
registro propone el item por id en vez de por serial. Es un cambio de nombre,
no de lógica.

---

## §B — El techo de 500 rompe `reconcile`, no solo su tamaño

Trocear era seguro en el `resolve-epcs` del plan anterior, porque resolver es
una operación **por valor**: los lotes son independientes y los resultados se
concatenan.

**Reconciliar no lo es.** `missing` se deriva de *esperados menos escaneados*,
así que un lote parcial produce un `missing` parcial: si el cliente manda 500 de
1200 valores únicos, los otros 700 vuelven marcados como faltantes. Un cliente
que concatene respuestas va a reportar 700 equipos perdidos que están en la
caja, y el 400 del §277 no lo protege de eso — lo protege del tamaño, no del
significado.

Se puede fusionar del lado cliente (unir `matched`, **intersectar**
`missing_tagged` y `missing_untagged` entre lotes, unir `foreign`, `unknown` y
`ambiguous`), pero eso no está en el contrato y nadie lo va a deducir leyéndolo.

**Lo que pedimos:** subir el techo de *este* endpoint a **2000**. Es coherente
con su propio §2.4 — el conjunto está acotado, un evento son cientos de
dispositivos — y elimina la clase de error entera. Si por alguna razón el techo
tiene que quedarse en 500, entonces la regla de fusión hay que escribirla en el
contrato y nosotros la implementamos con tests.

**En la extrapolación del §13 esto deja de ser latente.** El conteo de bodega no
está acotado: ahí el troceo es obligatorio y la fusión es parte del diseño, no
una nota al pie. Vale resolverlo ahora que el caso chico lo hace evidente.

---

## §C — El UNIQUE ignora `is_active`, y la reimpresión lo choca

`uq_item_identifier_value (company_id, id_type, id_value)` ocupa el valor
**también en las filas inactivas**. El §3 dice que el re-etiquetado desactiva la
vieja e inserta la nueva, y eso funciona cuando el tag nuevo emite otro valor.

Con lo del §A, el tag nuevo emite **el mismo valor**: si se graba el serial (o el
`item_id`), reimprimir la etiqueta de un equipo produce exactamente el
`id_value` que ya está en la tabla. Y reimprimir es precisamente lo que se hace
cuando un tag se arranca o se daña — el caso que el `is_active` existe para
cubrir.

Resultado hoy: 409 contra su propia fila inactiva, nombrando el `item_id` que ya
no tiene ese tag. El operador ve "identificador ya asignado" sobre un equipo que
es el dueño legítimo del identificador.

**Dos salidas, cualquiera sirve:**

- `UNIQUE (company_id, id_type, id_value, is_active)` — deja convivir una activa
  con una inactiva.
- Que `register` **reactive** la fila cuando el conflicto es contra una inactiva
  **del mismo `item_id`**, y solo devuelva 409 cuando el valor está tomado por
  otro item. Nos parece la mejor: mantiene el UNIQUE simple y el historial
  intacto.

---

## §D — ¿`reconcile()` normaliza los dos lados del serial?

Su §6.1 tiene la regla correcta y la razón bien escrita: si la escritura
normaliza y la lectura no, una lectura en minúsculas no matchea y el item
aparece como faltante **sin error visible**.

La pregunta es por el otro lado del camino del serial. Los esperados salen de
`item_inv.serial_number` en crudo (§242). Si `reconcile` normaliza `scanned` a
mayúsculas y compara contra el serial tal como salió de la base, un serial
guardado en minúsculas nunca matchea — el mismo modo de falla del §6.1,
espejado. La collation `_ci` cubre la comparación en SQL, no la comparación en
JS.

Si ya normaliza ambos lados, ignorar esto y anotarlo en un test. Si no,
`normalizeIdentifier` tiene que aplicarse también a `expected[].serial_number`
antes de comparar.

---

## §E — El desajuste `company_id` cuerpo/header va a pasar

Su nota del §279 es correcta, y desde el cliente podemos decir **por qué** va a
ocurrir y no solo que podría:

- El header `s-company-lq` se lee de **localStorage**
  (`src/api/devitrakApi.jsx:103`), escrito por `persistCompanyHeaders` en el
  login y en el cambio de compañía.
- Un `company_id` en el body saldría de **Redux**
  (`admin.user.sqlInfo.company_id`).

Son dos almacenes distintos con dos momentos de escritura distintos. Para un
usuario de una sola compañía siempre coinciden; para uno multi-compañía pueden
divergir, y cuando lo hagan el 403 va a parecer un bug de permisos y nadie lo va
a encontrar.

**Lo que pedimos:** que el controlador derive la compañía **del header**, valide
que el body coincide, y cuando no coincidan devuelva un mensaje que lo diga:

```json
{ "ok": false, "msg": "Company mismatch between header and body",
  "detail": { "header": 45, "body": 137 } }
```

Un 403 genérico ahí cuesta una tarde de depuración de cada lado.

---

## §F — Sus preguntas abiertas del §14

**1. Formato canónico del EPC → hex crudo en mayúsculas.** Sin dudas:

- Es lo que devuelve el lector.
- Es lo que el cliente ya normaliza (`parsePastedScanDump`, `epcSerial`).
- Las etiquetas se grabaron con **caracteres en ASCII**, no con un esquema GS1
  (§A). Un `urn:epc:id:giai:…` sería una URI que nosotros inventamos sobre datos
  que no son GIAI — daría la apariencia de un identificador estándar sin serlo.

`VARCHAR(64)` sobra: 24 caracteres hex para un banco de 96 bits, 32 para uno de
128. Y su collation `_ci` es la correcta dado que se normaliza a mayúsculas al
escribir.

**2. Cierre parcial → sin diálogo extra, pero el botón nombra el número.**
"Check in 48 of 50" en el botón hace imposible cerrar un parcial sin darse
cuenta, que es el objetivo real; un modal de confirmación se aprende a
descartar. Es el precedente que la pantalla ya tiene con `checkInBlockers`.
Los faltantes se reportan y quedan asignados al evento, como su §287 describe.

**3. Quién aplica la migración y cuándo** — no es nuestra decisión. Sí pedimos
que sea **antes** de que el backend despliegue las rutas, y que nos avisen
cuando `reconcile` esté vivo en el ambiente que apunta `origin/main`. El
precedente de julio (scoped roles) fue exactamente el inverso y costó una
semana de bloqueo.

---

## Lo que el cliente ya tiene construido

En `src/pages/inventory/utils/`, todo función pura y probado, escrito el
2026-09-01/02 **antes** de conocer este diseño. Nada de esto cambia por lo que
ustedes decidan:

| Módulo | Qué hace | Tests |
|---|---|---|
| `parsePastedScanDump.js` | vuelve data un volcado de lecturas: uno por línea, con columnas de RSSI/timestamp, pares serial↔tag, o todo en una línea. Deduplica y separa `totalReads` de `uniqueCount` | 30 |
| `epcSerial.js` | `decodeSerialFromEpc` / `encodeSerialToEpc`. Reconoce el relleno (`0x00` o `0x20`, izquierda o derecha, o sin relleno) en vez de que se lo dicten. Devuelve `null` para un tag de fábrica, uno en blanco, o un byte de relleno en medio | 17 |
| `checkInFromEvent.js` | ya existía la reconciliación de cierre; le agregamos `addScannedSerials` (un barrido completo de una vez, con `Set`) y `countSummary` | 13 nuevos |

Dos cosas de ahí que les importan:

- **`MAX_DUMP_LINES = 5000`** en el parser, contra el techo de 500 del §8.1.
  No hay conflicto — las 5000 son *lecturas crudas* y las 500 son *valores
  únicos*, y un barrido de 400 equipos oídos 10 veces cada uno son 4000 lecturas
  que colapsan a 400 valores. Lo decimos explícito porque los números se
  parecen y no miden lo mismo.
- **El cliente envía valores únicos, nunca lecturas crudas.** Si alguna vez
  reciben un `scanned` con repeticiones, es un bug nuestro.

---

## Lo que construiremos cuando el contrato esté desplegado

Su respuesta trae **seis** categorías; `CheckInDevicesFromEventsModal` maneja hoy
tres (`missing` / `scanned` / `extra`). El trabajo de cliente que eso implica:

1. **Extender el modelo de estados a seis** — `matched`, `missing_tagged`,
   `missing_untagged`, `foreign`, `unknown`, `ambiguous` — en la tabla, en el
   filtro y en los tiles.
2. **Partir `missing` en la UI, no solo en el contrato.** Su §188 tiene razón y
   es la clase de detalle que decide si la pantalla se usa: un equipo sin
   etiqueta que sí está en la caja se ve idéntico a uno perdido, y si no se
   separan el operador aprende a ignorar la alarma.
3. **`ambiguous` necesita una acción, no solo una fila.** Si `10001` resuelve a
   dos items, el operador tiene que poder decir cuál tiene en la mano. Sin esa
   affordance esos equipos quedan faltantes para siempre y el conteo nunca
   cierra. Si el §A se resuelve por la opción 1, este bucket queda vacío en la
   práctica y la acción es un camino de excepción — pero hay que construirla
   igual, porque los equipos sin tag siguen entrando por código de barras.
4. **Mostrar `matchedVia`.** Es la evidencia del ahorro que justifica el lector:
   cuántos entraron por barrido y cuántos a mano.
5. **Panel de pegado** (`PasteScansPanel`) dentro del modal, como vía manual
   permanente: sirve con la pistola, con un export de Excel, y con el volcado
   del OR2505 mientras no exista el puente.

---

## Coordinación de release

Orden, de acuerdo con su §330:

1. **Resolver el §A.** Es una decisión de etiquetado, no de código, y si se
   decide mal después hay que reetiquetar hardware. Bloqueante.
2. Migración (aditiva, sin deploy).
3. Backend: núcleo puro → registro → `reconcile` → `close`.
4. **Avisar al frontend cuando `reconcile` esté desplegado**, nombrando el
   ambiente. Trabajamos contra respuestas simuladas del contrato de arriba
   mientras tanto.
5. Frontend: los cinco puntos de la sección anterior.

Un detalle operativo: cuando agreguemos las rutas nuevas, el test
`src/api/apiContractAudit.test.js` va a reprobar hasta que ustedes regeneren
`src/docs/api-payloads.json`. El patrón establecido es agregar una línea a
`KNOWN_UNMATCHED` con la razón, como con `POST /api/school/consent/list`. No
requiere nada de su parte más allá de regenerar el artefacto cuando puedan.

Y gracias por el §12: la inyección de `POST /db_item/warehouse-items` nos toca
directo. Verificado: tres call sites vivos en el cliente —
`inventory/table/ItemTable.jsx:138`,
`details/detailComponent/components/ContainerContent.jsx:74` y
`details/deviceProfile/hooks/useDeviceProfile.js:188`. El primero es la tabla
principal de inventario, así que es la ruta más transitada del módulo y no un
rincón. Lo tratamos como bug independiente y de prioridad propia, no como deuda
de este proyecto, pero conviene que suba en su lista: las claves del body que
ese endpoint interpola salen de nuestros filtros de tabla.
