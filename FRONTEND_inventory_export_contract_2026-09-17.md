# Lo implementado sobre vuestro informe, y lo que necesita `inventory-export`

> Del dashboard al servidor, 2026-09-17.
> La primera mitad es el acuse: qué hicimos con cada punto de vuestros dos
> informes. La segunda es lo que os hace falta para empezar la fase del export
> de inventario en cola — sobre todo **las dieciséis columnas del fichero**, que
> es el dato que no está en vuestro repositorio.

---

## 1. Lo que hemos implementado sobre vuestros informes

| Vuestro punto | Nuestro commit | Qué hace |
|---|---|---|
| §2.3 · `company_id` en el cuerpo de las rutas de locación | `2b1cbe93` → **`6dadc128`** | Primero lo quitamos; luego, al confirmarnos que el servidor desplegado lo valida, lo devolvimos **leyéndolo de `s-company-lq`**, la misma fuente de la cabecera. Los dos servidores lo aceptan y **el orden de despliegue dejó de importar** |
| §6 · el 409 de idempotencia | **`21896b77`** | Seis pantallas de pago tratan el 409 como «tu petición anterior sigue en marcha»: sin reintento, sin decir que no se cobró, y consultando el estado del `payment_intent`. De paso, tres de esas pantallas no tenían **ningún** manejo de error |
| §6 · vuestra propuesta del `Idempotency-Key` | **`47cb253f`** | Captura, liberación y reembolso completo viajan con `<operación>:<paymentIntent>`. El **reembolso parcial va sin clave a propósito**: dos dispositivos perdidos de una misma transacción son dos reembolsos legítimos y pueden ser del mismo importe |
| §2 · las cuatro rutas que hoy dan 401 | — | Cero consumidores las cuatro, verificado por fragmento de ruta. `db_identifier` no aparece **ni una vez** en el cliente |
| §3 y §4 · rutas sombreadas y `inventory-pagination` | — | Cero consumidores. Y aceptada vuestra corrección de método: el uso no prueba el orden de registro |
| §7.2 · `checkTokenVersion` | — | De acuerdo. El matiz es nuestro: sin manejo global del 401, una pestaña con token revocado ve una tabla que falla en vez de «tu sesión terminó». Va en nuestro backlog |
| El scope de locación | **`c995425f`** | `/inventory` lee ahora el scope **SQL primero**, con el registro antiguo de respaldo. Faltaba esto para que lo que escribe la pantalla nueva llegara a filtrar |

Y una que no es vuestra pero cambia lo que os pedimos: **`13dff7b6`**, abajo.

---

## 2. Dónde está hoy el export, y por qué es un parche

Con nuestro flag encendido la tabla tiene **diez filas**, y el export leía la
tabla: producía una hoja de diez filas o el aviso de que no había nada que
exportar.

El parche de hoy (`13dff7b6`): al pulsar el botón, **un `POST /db_item/warehouse-items`**
y la hoja se construye en el navegador, como siempre.

Funciona, y no queremos quedarnos ahí:

- Trae el inventario **entero al navegador** para escribir un fichero. Con
  catálogos grandes eso es memoria del cliente y un hilo bloqueado mientras
  `exceljs` escribe.
- **Ignora los filtros activos.** Exporta todo, no lo que el usuario está
  mirando, porque replicar vuestros filtros en el cliente sería tener dos
  definiciones de «lo mismo».
- Sigue dependiendo de `warehouse-items`, que es justo la ruta de la que
  estamos saliendo.

---

## 3. Lo que necesitamos de `inventory-export`

### 3.1 La petición: el mismo cuerpo que `inventory-page`

```jsonc
POST /api/db_item/inventory-export
{
  "filters": { "brand": "Dell", "logistic_status": "in-stock" },   // opcional
  "search": "00100",                                               // opcional
  "sortBy": "category_name",                                       // opcional
  "sortDir": "asc"
}
```

Sin `pageSize` ni `cursor`: es el conjunto entero. **Mismo vocabulario de
filtros que `inventory-page`**, para que «lo que exporto» y «lo que veo» no
puedan divergir — es la razón por la que no lo resolvemos en el cliente.

`company_id` va en la cabecera, como en todo `/api/db_*`.

### 3.2 La respuesta: 202 y un `jobId`

```jsonc
{ "ok": true, "jobId": "..." }
```

Ya sabemos vivir con eso: `BackgroundJobsTracker` hace polling de
`GET /jobs/owned/:jobId` cada 3 s hasta `done|failed|dead`, avisa e invalida
caché. **Lo que todavía no sabe es descargar un fichero**, y esa es la pieza que
añadiremos.

### 3.3 Lo que necesitamos en el payload terminal

```jsonc
{ "state": "done",
  "result": { "url": "https://…", "expiresAt": "2026-09-17T18:40:00Z",
              "rowCount": 12483, "fileName": "…xlsx" } }
```

- **`url` prefirmada** — es el bloqueante de nuestra parte.
- **`expiresAt`**, para decirle al usuario que el enlace caduca en vez de dejarle
  descubrirlo.
- **`rowCount`**, que ya enseñamos hoy al terminar («generated with N records»).

Y en `failed`/`dead`, un motivo legible. Hoy mostramos «el export falló»; con un
motivo podemos decir cuál.

### 3.4 La pregunta de diseño: ¿quién escribe el XLSX?

Hoy lo escribe el navegador, y **no es un volcado de columnas**: hay cinco
transformaciones dentro. Si el fichero pasa a generarse en el servidor, esas
transformaciones se mueven con él o la hoja cambia debajo de los clientes.

Las dos opciones, y nos vale cualquiera:

- **A · Vosotros escribís el XLSX.** La §4 es entonces la especificación de la
  hoja, y nosotros solo descargamos la URL.
- **B · Vosotros devolvéis las filas** (el conjunto completo, sin paginar, en
  JSON o CSV) y seguimos escribiendo el fichero nosotros. Más simple para
  vosotros; conserva el formato exacto; sigue pasando el volumen por el
  navegador.

Nuestra preferencia es **A**, porque es la única que quita el inventario entero
del navegador. Pero la decisión depende de dónde os cueste menos, y lo que no
puede pasar es que se elija A sin la §4 delante.

---

## 4. Las dieciséis columnas de la hoja, y las cinco transformaciones

Esto es lo que el fichero contiene hoy, en este orden. `item` es una fila tal
como la devuelve `warehouse-items`.

| # | Cabecera | Campo | Transformación |
|---|---|---|---|
| 1 | Device ID (database) | `item_id` | — |
| 2 | Serial Number | `serial_number` | — |
| 3 | Warehouse | `warehouse`, `location`, `event_name` | **Sí**: `warehouse === 1` → `"{location} (In-Stock)"`; si no → `"{event_name ?? 'In-Use'} (In-Use)"` |
| 4 | Brand | `brand` | — |
| 5 | Category Name | `category_name` | — |
| 6 | Group Name | `item_group` | — |
| 7 | Ownership | `ownership` | **Sí**: `Permanent→Permanent`, `Rent→Rented`, `Sale→For Resale`, `Resale→For Resale` |
| 8 | Cost of Replacement (USD) | `cost` | — |
| 9 | Condition | `status` ?? `condition` | **Sí**: `status` primero, `condition` de respaldo |
| 10 | Current Location | `location`, `event_name` | **Sí**: en stock → `location`; fuera → `event_name` |
| 11 | Tax Location | `main_warehouse` | — |
| 12 | Assignable | `enableAssignFeature` | **Sí**: `=== 1` → `"Assignable"`, si no → `"No Assignable"` |
| 13 | Rented Equipment Return Date | `return_date` | **Sí**: solo si `ownership === "Rent"`; en otro caso, vacío |
| 14 | Extra Info | `extra_serial_number[]` | **Sí**: una línea por entrada, `"- {keyObject}: {valueObject}"` |
| 15 | Description | `descript_item` | — |
| 16 | Image (URL) | `image_url` | — |

Formato: hoja llamada `Stock - Report`, fila 1 en negrita y congelada, anchos
por columna. Nada de eso es crítico; las transformaciones sí.

### 4.1 Lo que le falta a `inventory-page` para esto

De los dieciocho campos que la hoja necesita, **vuestras trece columnas de
`inventory-page` no traen cinco**:

```
cost · descript_item · extra_serial_number · return_date · event_name
```

Por eso el parche de hoy no recorre `inventory-page`: una hoja construida así
perdería en silencio el **coste de reposición** y la **descripción**.

**Lo que os pedimos aquí:** que `inventory-export` lea la fila completa, no las
trece columnas de la página. Y si alguna vez ampliáis `inventory-page`, estos
cinco son los candidatos — pero para la tabla no hacen falta, así que no os lo
pedimos.

---

## 5. Resumen de lo que hace falta para que empecéis

1. `POST /api/db_item/inventory-export` con el cuerpo de `inventory-page` menos
   la paginación → **202 `{ jobId }`**.
2. Payload terminal con **`url` prefirmada**, `expiresAt` y `rowCount`; motivo
   legible en `failed`/`dead`.
3. Decidir **A o B** de la §3.4. Si es A, la §4 es la especificación.
4. Que el job lea **la fila completa**, no las trece columnas (§4.1).

Lo nuestro, en cuanto eso exista: enseñar a `BackgroundJobsTracker` a descargar
el fichero al llegar a `done`, y retirar el parche de `warehouse-items`.
`file-saver` ya está en el proyecto.
