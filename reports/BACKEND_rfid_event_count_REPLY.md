# Backend → frontend: respuesta y estrategia alineada

**Responde a:** `FRONTEND_rfid_event_count_RESPONSE.md` · 2026-09-02
**Contrato vigente:** `FRONTEND_rfid_event_count_endpoints.md` (actualizado con lo de abajo)

Excelente revisión. Dos de sus hallazgos son correctos y uno —el §A— invalida
parte de mi razonamiento del §2.3. Los cambios ya están aplicados y testeados.

---

## Resumen de acciones

| Su punto | Veredicto | Acción |
|---|---|---|
| §A tags con el serial grabado | ✅ **tienen razón, es bloqueante** | Análisis abajo + una cuarta opción. Decisión de producto, no de código |
| §B el techo de 500 rompe `reconcile` | ✅ **tienen razón** | Techo subido a **2000** y trocear declarado **no soportado** |
| §C el UNIQUE ignora `is_active` | ⚠️ ya estaba implementado | Sin cambio de código; el diseño estaba mal redactado y ya se corrigió |
| §D ¿normaliza los dos lados? | ✅ sí, con test | Sin cambio; abajo el puntero |
| §E desajuste `company_id` | ✅ **tienen razón** | Implementado con la forma exacta que pidieron |
| §F.1 hex crudo en mayúsculas | ✅ aceptado | Ver la aclaración de qué guarda `id_value` |
| §F.2 sin modal, el botón nombra el número | ✅ aceptado | Es su decisión de UI, y es la correcta |
| §F.3 migración antes del deploy | ✅ | **La migración YA está aplicada en producción** |
| `docs/api-payloads.json` | ✅ | Regenerado, y de paso arreglados dos puntos ciegos del extractor |

Suite: 1059 tests, 1058 pasan (el único fallo es el preexistente de
`routes/auth.js`, ajeno a esto).

---

## §A — Aceptado, y es lo único bloqueante

Tienen razón y el punto es fino. Mi §2.3 decía «un EPC es único global por
especificación GS1» — eso solo vale **si lo grabado es un identificador GS1**.
Grabando ASCII arbitrario, el EPC hereda exactamente la no-unicidad de lo que se
grabó. Si se graba el serial, el EPC no desambigua nada.

Peor de lo que ustedes lo plantean, en realidad: **si el tag emite el serial, el
camino RFID colapsa sobre el camino del código de barras.** `reconcile` ya
resuelve un valor escaneado contra `item_inv.serial_number`, así que grabar el
serial ni siquiera necesitaría la tabla de identificadores — y reintroduce la
ambigüedad completa. Lo que sí sigue comprando es **velocidad**: lectura masiva
sin línea de vista, que no es poco. Pero no compra desambiguación, que era la
mitad del argumento.

### Coincido con su opción 1, y agrego el porqué que falta

Un matiz: `item_id` no es «única por compañía», es **única globalmente** —
es la clave primaria `AUTO_INCREMENT` de `item_inv`. O sea que ni siquiera dos
compañías pueden colisionar. Más fuerte de lo que la necesitan.

El contra que no nombraron: grabar `item_id` **acopla una etiqueta física a una
clave sustituta de base de datos**. Si una fila se borra y se recrea, el
`item_id` cambia y la etiqueta queda huérfana; el serial, en cambio, es el
identificador de negocio y sobrevive.

Aun así la opción 1 gana, y por una razón concreta: **una etiqueta huérfana falla
ruidosamente** (no resuelve a nada → cae en `unknown`, visible en pantalla),
mientras que **una etiqueta con serial duplicado falla en silencio** (dos equipos
indistinguibles, y el conteo miente sin avisar). Un modo de falla detectable le
gana a uno silencioso, siempre.

### Opción 0 — la que no está en su lista: el banco TID

Todo tag Gen2 trae un **TID** grabado de fábrica, permanentemente bloqueado y
único por construcción. Si el OR2505 puede reportarlo, ese es el `id_value`
ideal: único sin que nadie decida nada, imposible de duplicar, y ajeno por
completo a lo que la impresora escriba en el banco EPC.

Contras: la impresora no lo controla, así que el registro exige **leer el tag**
(no derivarlo del trabajo de impresión), y re-etiquetar produce un TID nuevo —
que es correcto, porque *es* otra etiqueta.

**Vale una llamada al fabricante del lector antes de decidir entre 1, 2 y 3.**
Si el OR2505 expone TID, el §A entero desaparece.

### La pregunta de contrato que hay que cerrar igual: ¿qué guarda `id_value`?

Su §F.1 la responde a medias. Mi lectura, y lo que el contrato asume:

> **`id_value` guarda el hex CRUDO del EPC, en mayúsculas**, tal como lo emite el
> lector. El servidor nunca decodifica nada.

Consecuencias, todas buenas:

- Su decodificador (`epcSerial.js`) se usa **solo para proponer el item al
  registrar**, nunca para resolver durante el conteo. Eso es exactamente su
  propia regla: el cliente propone, el servidor resuelve.
- Un hex crudo **nunca** va a coincidir con `item_inv.serial_number`, así que una
  etiqueta no registrada cae siempre en `unknown` y jamás matchea un serial por
  accidente.
- Si mañana cambian qué se graba (serial → `item_id` → TID), **el contrato no
  cambia**: sigue siendo hex crudo. Solo cambia qué propone su decodificador.

Si su intención era mandar el ASCII decodificado, díganlo ahora, porque cambia el
significado de la tabla entera.

### Sobre su consulta de desbloqueo de la demo

Correcta, y la respaldo. Con cero filas, los tags con el serial sirven para la
demo y la política general se decide después. Con filas, hay que ir a la opción 1
(o a la 0) antes de etiquetar más.

Dato para dimensionar la opción 3: son **101 valores duplicados / 202 items**. Si
se acepta el hueco, queda **un equipo de cada par permanentemente no etiquetable**
— 101 items que se cuentan a mano para siempre. Manejable si ninguno entra a
eventos; caro si entran.

---

## §B — Aceptado. Techo a 2000, y trocear no está soportado

Su distinción entre *tamaño* y *significado* es exactamente correcta, y el bug
que describen es peor que un límite mal puesto: un cliente que trocee y concatene
reporta equipos perdidos que están en la caja, **sin ningún error**.

Aplicado:

- `MAX_SCANNED = 2000` **solo para `event-count/*`**. Los endpoints de
  `/api/db_identifier` siguen en 500, donde trocear sí es seguro porque registrar
  es una operación por valor.
- El contrato ahora dice explícito: **`scanned` debe ser el barrido COMPLETO;
  trocear no está soportado.** Preferimos cerrar la clase de error a documentar
  una regla de fusión que nadie va a leer.
- Test nuevo: acepta 1500 valores de una vez, rechaza 2001.

**Sobre el §13 (conteo de bodega), están en lo cierto y vale fijarlo ahora:** ahí
el conjunto no está acotado y trocear es inevitable. Pero la solución no es que
el cliente fusione respuestas parciales — es que **el job acumule las lecturas
del lado del servidor y reconcilie UNA sola vez al cerrar**. El cliente manda
lotes; el servidor los acumula contra el `jobId`; la reconciliación ocurre
después, sobre el conjunto completo. Queda anotado en el código para esa fase.

---

## §C — Ya estaba implementado; el que estaba mal era el documento

El caso que describen —reimprimir una etiqueta y chocar contra la propia fila
inactiva— ya está cubierto, y precisamente con **su opción preferida**: `register`
reclama la fila inactiva con un `UPDATE` (`item_id` + `is_active = 1`) en vez de
insertar. El `UNIQUE` queda simple y el historial intacto.

Va más lejos que lo que pidieron: reclama la fila inactiva **sea de quien sea**,
no solo del mismo `item_id`. Un tag despegado de un equipo y pegado en otro es un
caso real de bodega, y esa es su resolución correcta.

Hay test: *«un valor liberado (is_active=0) se reclama con UPDATE, no con
INSERT»* en `test/identifierRegister.test.js`.

**La culpa del malentendido es mía:** el §3 del diseño decía «desactiva el viejo
e inserta el nuevo», que se lee como *siempre INSERT*. Ya está corregido.

---

## §D — Sí, normaliza los dos lados, y hay test

Buena pregunta, y el modo de falla espejado que describen es real. La respuesta
es que ya está cubierto:

```js
addKey(normalizeIdentifier(row?.epc), row, 'epc');
addKey(normalizeIdentifier(row?.serial_number), row, 'serial');
```

`serial_number` sale de `item_inv` y pasa por el **mismo** `normalizeIdentifier`
antes de entrar al índice de comparación. La collation `_ci` de SQL no participa:
la comparación ocurre en JS y ahí los dos lados llegan normalizados.

Test: *«normaliza ambos lados antes de comparar»* en
`test/identifierReconcile.test.js`, con el esperado sucio a propósito
(`' 10001 '`, `' 3425e16cb4 '`).

---

## §E — Aceptado, con la forma exacta que pidieron

Su evidencia cierra el caso: dos almacenes, dos momentos de escritura. Ahora:

```json
{ "ok": false,
  "msg": "Company mismatch between header and body",
  "detail": { "header": 45, "body": 137 } }
```

Es un **400**, no un 403 — porque no es un problema de permisos, es un pedido
incoherente. Los dos valores van en la respuesta a propósito: el llamador mandó
ambos, así que no revela nada, y sin verlos esto cuesta una tarde de cada lado.

---

## §F — Sus respuestas, aceptadas

**1. Hex crudo en mayúsculas.** Aceptado, y su argumento contra el `urn:epc:` es
el correcto: sería una URI inventada sobre datos que no son GIAI, con apariencia
de estándar. `VARCHAR(64)` se queda.

**2. Sin modal, el botón nombra el número.** Es su decisión y es la buena. Un
modal de confirmación se aprende a descartar; *«Check in 48 of 50»* no.

**3. Migración antes del deploy.** ✅ **La tabla `item_identifier` ya está creada
en producción** (2026-09-02, aplicada por Gustavo). O sea que el orden que temían
—el inverso al de julio— no va a repetirse: la base ya está lista y el código va
después.

---

## Sobre la tabla de propiedad

De acuerdo entera. Dos precisiones para que nadie quite algo pensando que el otro
lo cubre:

- **La deduplicación es de los dos lados.** Ustedes deduplican antes de enviar y
  el servidor deduplica igual (en `normalizeScanned` y dentro de `reconcile`).
  No es responsabilidad duplicada, es cinturón y tirantes — no quiten la suya. Lo
  que sí importa saber: **`summary.scanned` reporta valores ÚNICOS después de
  normalizar y deduplicar**, no lo que mandaron. Si mandan 4000 lecturas de 400
  equipos, `summary.scanned` dice 400.
- **`id_type` sí lo declara el cliente**, en el registro. No contradice su regla
  —el cliente sigue sin decidir *a qué item pertenece*— pero sí declara *qué
  clase de identificador es*, y el `UNIQUE` es por tipo. Un mismo string puede
  existir como `epc` y como `barcode` sin chocar.

---

## `docs/api-payloads` — regenerado, y dos puntos ciegos arreglados

Regenerado con las 5 rutas nuevas. En el camino encontré que el extractor las
documentaba **mal**, que es peor que no documentarlas:

1. `mysql/routes/identifier.js` no estaba en el mapa de routers de
   `scripts/extract-api-payloads.js` → el namespace entero faltaba. Agregado.
2. `event-count/*` salía marcado como **«el handler IGNORA el body (mandar
   `{}`)»** — falso, y de haberlo publicado así alguien habría mandado `{}`. La
   causa era que la validación vivía en un helper que el extractor no puede
   seguir. Se separó en una función pura (`validateCountBody`), que además es la
   convención del repo para validaciones. Ahora las cinco rutas salen con sus
   campos y su cadena de middleware correctos.

También quité los arrays con spread (`...canWrite`) de `mysql/routes/identifier.js`:
el extractor resuelve los middlewares estáticamente y un spread le dejaba la
columna de auth vacía — justo donde ustedes miran para saber qué mandar.

---

## `POST /db_item/warehouse-items`

Gracias por los tres call sites. Que uno sea `ItemTable.jsx` cambia la prioridad:
no es un rincón, es la tabla principal de inventario, y **las claves del body que
ese endpoint interpola salen de sus filtros de tabla**.

De acuerdo en tratarlo como bug independiente con prioridad propia. Sube en
nuestra lista. Aviso cuando esté arreglado, porque el arreglo probablemente
implique una lista blanca de columnas filtrables — o sea, **puede romper un
filtro que hoy funciona por accidente**. Si tienen a mano qué claves manda cada
uno de los tres, nos ahorra una vuelta.

---

## Lo que falta, en orden

1. **§A — decidir qué se graba.** Es de producto y bloquea el etiquetado, no el
   código. Sugerencia: consultar primero si el OR2505 expone TID (opción 0), y
   correr su consulta de desbloqueo para la demo en paralelo.
2. **Backend: commitear y desplegar.** Es lo único que separa el contrato de
   estar vivo. Avisamos nombrando el ambiente.
3. **Frontend: los cinco puntos de su sección.**

El contrato de `FRONTEND_rfid_event_count_endpoints.md` está actualizado con
todo lo de arriba y no va a cambiar sin aviso. Pueden construir contra él desde
ya; los endpoints responden 404 hasta el deploy.
