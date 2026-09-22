# `bulk-item-from-spreadsheet` está implementado

> Del servidor al dashboard, 2026-09-22.
> Respuesta a `FRONTEND_inventory_import_endpoint_2026-09-21.md`.
> El endpoint es el que pedisteis, con el nombre que pedisteis. Las tres
> decisiones que nos dejasteis están tomadas y explicadas abajo. **Aún no está
> desplegado** — ver §6.

---

## 1. La petición

```
POST /api/db_item/bulk-item-from-spreadsheet
```

Cabeceras, las mismas que el resto de `/api/db_*`:

| Cabecera | |
|---|---|
| `x-token` | el JWT, como siempre |
| `s-company-lq` | el `company_id`. **De aquí sale la compañía**, no del cuerpo |
| `Idempotency-Key` | opcional pero recomendada — ver §5 |

El `company_id` del cuerpo es opcional; si lo mandáis y **no coincide** con la
cabecera, la respuesta es `400 "Company mismatch between header and body"` con
los dos valores. Es el mismo comportamiento que `inventory-page` y que el
export, y está ahí para que un cambio de compañía a media sesión no escriba
inventario en la compañía anterior.

### Cuerpo

Exactamente el que propusisteis:

```jsonc
{
  "company_id": 7,
  "company": "ABC Interpreting",
  "units": [
    {
      "serial_number": "AUD-2026-000001",   // obligatorio
      "category_name": "Audio",             // obligatorio
      "location": "Miami, FL",              // obligatorio (string o { name })
      "item_group": "Wireless Microphone",
      "brand": "Shure",
      "descript_item": "Wireless handheld microphone",
      "cost": 258.42,
      "ownership": "Permanent",
      "main_warehouse": "Miami, FL",
      "sub_location": ["Section A", "Locker A110"],
      "extra_serial_number": [
        { "keyObject": "Band", "valueObject": "G50" }
      ],
      "image_url": "https://res.cloudinary.com/.../image1.jpg",
      "supplier_info": ""
    }
  ],
  "defaults": { "warehouse": 1, "display_item": 1, "enableAssignFeature": 1 }
}
```

Tres tolerancias que os ahorran limpiar la hoja antes de mandarla:

- **`cost`** acepta `"$1,234.56"`, celdas vacías y texto. Lo que no es un número
  se guarda como `0`, nunca como `NaN`.
- **`sub_location`** acepta array, JSON string de array o un nombre suelto.
- **`location`** acepta la cadena o `{ name }`.
- **`main_warehouse`**, si falta, cae a la locación de la unidad.

`row` es opcional pero **mandadlo**: es de dónde salió la unidad en la hoja, y se
devuelve tal cual en cualquier error. `isItInContainer` se ignora — no es una
columna de `item_inv` (ver §8).

`defaults` es opcional **y tiene respaldo en el servidor**: si no mandáis
`display_item`, vale 1. Un import no puede depender de que el cliente se acuerde
de mandarlo — sin él la unidad se da de alta invisible.

## 2. Las respuestas

**202** — encolado:

```jsonc
{ "ok": true, "msg": "Spreadsheet import queued", "jobId": "…",
  "units": 498, "skipped": 2 }
```

`skipped` son las filas que el propio fichero trae repetidas (§4.1). Van también
en el resultado del job, para que tengáis **una sola lista** que enseñar.

**400** — el fichero no se puede importar. **Nada se escribe**:

```jsonc
{ "ok": false,
  "msg": "2 row(s) cannot be imported. Fix them in the file and upload it again.",
  "errors": [
    { "row": 14, "reason": "serial_number is required" },
    { "row": 87, "serial_number": "AUD-45", "reason": "category_name is required" }
  ],
  "limit": 10000 }
```

**`row` es el vuestro, devuelto tal cual.** Mandad `row` en cada unidad y
aparece igual en `errors[]` y en `failed[]`; el servidor no lo recalcula
(corregido el 22-sep a petición vuestra — ver
`FRONTEND_inventory_import_row_2026-09-22.md`). Si una unidad viene sin `row`,
el respaldo es su posición en el array + 2, que es **la posición en el array y no
la fila del fichero** — con el array comprimido no coinciden.

Se devuelven como mucho **25** errores: más que eso no ayuda a nadie a arreglar
una hoja.

**403** — fuera del scope del rol, y **nombra lo que sobra**:

```
Not allowed to create items in location 'Orlando, FL'
Not allowed to create items in category 'Video'
Location 'Tampa, FL' does not exist yet, and your role cannot create locations.
  Ask an administrator to create it, then import again.
```

### El resultado del job

`GET /api/jobs/owned/:jobId`, el que ya usa `BackgroundJobsTracker`:

```jsonc
{ "state": "done",
  "result": {
    "inserted": 478,
    "total": 498,
    "locationsCreated": 2,
    "failedCount": 20,
    "failed": [
      { "serial_number": "AUD-12", "row": 14, "reason": "serial number already exists in this company" }
    ],
    "failedTruncated": false
  } }
```

`failed` se corta en **500** entradas (`failedCount` lleva el total real y
`failedTruncated` lo dice). El documento del job vive en Mongo y una lista de
10.000 motivos no la lee nadie.

## 3. Vuestra pregunta de diseño: el scope sobre varias locaciones

Implementada la **opción 2**, la que dejaba el fichero en una sola petición.

El endpoint viejo resuelve una locación y llama a `canWriteInScope` una vez. Aquí
se usa su primo por lotes, `getWritableScope`, que resuelve **en una sola
consulta** todo el scope escribible del rol y se compara contra el fichero
entero: todo o nada, y el 403 nombra el primer par que sobra.

Con una excepción que conviene que conozcáis, porque cambia lo que enseñáis:

> **Un rol acotado por locación no crea locaciones nuevas de rebote.** Si el
> fichero trae una locación que no existe, para ese rol es un 403 que la nombra,
> no una creación silenciosa. Crear la locación y luego escribir en ella sería
> ampliarse el propio permiso: una locación que no existe no puede estar en el
> scope de nadie.

Un rol con acceso completo sí las crea, y el job dice cuántas en
`locationsCreated`. **Podéis quitar vuestro bucle de `verifyAndCreateLocation`.**

## 4. Las tres decisiones que nos dejasteis

### 4.1 Seriales duplicados → se inserta lo nuevo y se reporta el resto

Lo que preferíais. Dos casos, y los dos acaban en la misma lista:

- **Repetido dentro del fichero**: gana la primera fila, las demás salen en
  `skipped` con `"duplicate serial number within the import"`. No es un 400: un
  serial repetido no debe tumbar un import de 500 unidades.
- **Ya existe en la compañía**: no se inserta y sale con `"serial number already
  exists in this company"`.

Un aviso sobre lo segundo: **`item_inv` no tiene UNIQUE sobre `serial_number`**
y en producción hay duplicados por diseño. Esto no es una restricción de la base
de datos, es la política del import — preferimos avisar a duplicar una unidad que
alguien dio de alta a mano. Si algún cliente necesita lo contrario, decidlo y lo
hacemos opcional; es un `if`.

### 4.2 Fallo parcial → una transacción por LOTE de 500, no por import

Con una sola transacción por import, una fila mala tira el fichero entero y la
lista `failed` que pedís no sirve de nada. Con lote:

1. Se insertan 500 de golpe.
2. Si el lote revienta, MySQL no dice **qué** fila lo rompió, así que **ese lote
   —y solo ese— se reintenta fila a fila**. Cuesta N sentencias, pero únicamente
   cuando algo va mal, y es lo que convierte un error de MySQL en un motivo por
   serial.

O sea: "se importaron 478 y estas 20 no, por esto" es exactamente lo que sale.

### 4.3 El techo → 10.000 unidades

`INVENTORY_IMPORT_MAX_UNITS`, configurable sin desplegar. Una unidad de esta
forma ocupa ~0,5 KB, así que 10.000 son ~5 MB contra el límite de 50 MB del
cuerpo. Pasarse da 400 **con el número en el mensaje**, para que la UI lo pueda
enseñar; el `limit` viene también en el cuerpo del 400 por si preferís leerlo de
ahí en vez de escribirlo en el cliente.

## 5. Idempotencia

`Idempotency-Key` se respeta, namespaced por tipo de job
(`inventory:bulk-insert-from-spreadsheet:<vuestra clave>`), igual que en el
export y en los pagos. Un doble clic en «Import» no encola dos veces.

Ojo con una consecuencia que ya os afecta en Stripe: **la reserva es `SET NX`**,
así que un reintento con la misma clave mientras el primero sigue en vuelo
responde **409**, no 202. Reintentad con clave nueva solo si el primero falló de
verdad.

## 6. Lo que falta para poder usarlo

**No está desplegado.** Está commiteado y probado (34 pruebas propias, 1382/1383
en la suite completa; el único fallo es un gap conocido y ajeno). Para que
funcione en producción hacen falta dos cosas, y las dos son nuestras:

1. Desplegar la rama.
2. Que el worker dedicado sirva el tipo nuevo. El job va al grupo `heavy`, igual
   que el export: se generan hasta 10.000 filas y nadie espera la respuesta, así
   que no puede correr dentro de los procesos que atienden login y pagos.

Os avisamos cuando esté vivo. Mientras tanto, **no cambiéis el cliente a una
sola petición**: hoy responde 404.

## 7. Lo que NO cambia por vuestro lado

- Las imágenes las seguís subiendo vosotros a Cloudinary y mandando la URL. El
  servidor no descarga nada.
- El preview antes de enviar es vuestro y está bien donde está: nosotros
  validamos otra vez, pero después de que la persona ya decidió.
- `IMPORT_MODES.COMPATIBLE` y el troceo en 499 peticiones se pueden borrar **en
  cuanto os confirmemos el despliegue**, no antes.

## 8. `isItInContainer` no se guarda en ningún sitio

Está en vuestra lista de `defaults`, pero **no es una columna de `item_inv`**: la
tabla tiene `container`, `containerSpotLimit` y `container_id`, y el bulk viejo
tampoco lo escribe. Se ignora sin error. Si esperabais que se guardara, hay que
decidir dónde antes, porque hoy no hay dónde. `containerId` sí se guarda, en
`container_id`.

## 9. Un detalle que veréis en los datos

Cada unidad se da de alta con `current_location` = su locación. Deja de
reflejarla en cuanto la unidad se asigna a un evento, y de eso ya se encarga esa
ruta. La cadena de sub-locaciones se crea de verdad (una vez por ruta distinta,
no una por unidad) y se persiste el `sub_location_id` de la hoja, así que la
vista de árbol ve el inventario importado sin nada más por vuestra parte.
