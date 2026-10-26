# Tres preguntas al backend — 2026-09-17

> Del dashboard (`testing-admin-dashboard`) al servidor (`server-testing`).
> Las tres están abiertas por nuestro lado: dos vienen de vuestros dos informes
> de este mes y la tercera es anterior a los dos.
> Ninguna bloquea vuestro deploy salvo donde se dice.

---

## 1 · ¿`/api/stripe/*` es el mismo controlador que `/api/db_stripe/*`?

**Contexto:** vuestro §6 de la orden de trabajo (commit `54dffdb`) reserva la
clave de idempotencia en Redis antes de ejecutar, y anuncia un **409** para el
duplicado que llega mientras la primera petición sigue viva. Las ocho rutas que
nombráis son:

```
/api/db_stripe/payment-intents/:id/capture     /api/db_stripe/refund
/api/db_stripe/payment-intents/:id/cancel      /api/db_stripe/partial-refund
        …y sus cuatro gemelas bajo /internal/
```

**El problema:** el dashboard llama a esas cuatro operaciones, pero bajo
`/api/stripe/`, no bajo `/api/db_stripe/`:

| Nuestra llamada | Dónde |
|---|---|
| `POST /stripe/payment-intents/:id/capture` | `deposit/Capturing.jsx:108`, `DepositActionModal.jsx:57` |
| `POST /stripe/payment-intents/:id/cancel` | `deposit/Releasing.jsx:96`, `DepositActionModal.jsx:68`, `search/ReleaseDeposit.jsx:104` |
| `POST /stripe/refund` | `StripeTransactionTable.jsx:117`, `ExpandedLostButtons.jsx:119` |
| `POST /stripe/partial-refund` | `ExpandedLostButtons.jsx:74` |

De `/api/db_stripe/` solo usamos `consulting-stripe` y `new_stripe`, en el login.

**La pregunta:** ¿es el mismo controlador montado dos veces —como
`company-inventory-pagination` e `inventory-pagination`— o son handlers
distintos? Es decir: **¿la reserva en Redis cubre también `/api/stripe/*`?**

Las dos respuestas nos dan trabajo, pero muy distinto:

- **Mismo handler** → el 409 nos llega, y ya estamos listos: `21896b77` trata el
  409 como «tu petición anterior sigue en marcha», sin reintento, en las seis
  pantallas de pago.
- **Handlers distintos** → vuestras ocho rutas protegidas **no son las que usa
  el dashboard**, y la doble captura que queríais cerrar sigue abierta por
  nuestro lado. Eso es más grave que el 409 y nos gustaría saberlo pronto.

Dato que os puede servir: **no mandamos cabecera `Idempotency-Key`** en ninguna
de las cuatro, así que la clave derivada de método + ruta + cuerpo es la que
manda. Y en la captura el importe es **editable** por el operador, o sea que dos
capturas del mismo depósito con importes distintos son, para esa clave, dos
peticiones distintas.

---

## 2 · De las catorce rutas des-sombreadas, ¿cuáles estaban registradas después del `router.post("/:id")`?

**Contexto:** vuestro §2.7. `POST /api/db_item/<algo>` capturaba cualquier ruta
de un solo segmento y la mandaba a `deleteItem`.

**Por qué corre prisa más de lo que parece:** `deleteItem` lee el `item_id` **del
body**. Si una de esas rutas estaba registrada *después* del catch-all, entonces
una llamada nuestra con `item_id` en el cuerpo no era una llamada sin efecto:
**era un borrado**. No es un problema que aparezca con vuestro deploy — sería
uno que lleva tiempo ocurriendo.

Aceptamos vuestra corrección de método: «funciona a diario, luego estaba
registrada antes» no demuestra nada si el `/:id` apuntaba al mismo handler. Por
eso preguntamos en vez de deducir.

Estas son las rutas de un segmento a las que hacemos `POST` sobre
`/api/db_item`, con las veces que aparecen en el cliente:

| Muy usadas | Poco usadas — **son estas siete las que preguntamos** |
|---|---|
| `consulting-item` (27), `delete-item` (20), `item-out-warehouse` (14), `warehouse-items` (7) | `bulk-item-alphanumeric` (4), `edit-item` (3), `delete-bulk-items-criteria` (3), `new_item` (2), `bulk-item` (1), `tracking_item` (1), `event-items` (1) |

(`inventory-page`, `inventory-facets` y `serial-suggest` van aparte: están detrás
de nuestro flag, apagado en todos los entornos desplegados.)

**Lo que pedimos:** mirad el fichero de rutas, no el comportamiento observado, y
decidnos cuáles de esas siete quedaban por debajo. Si alguna lo estaba,
querríamos revisar los datos, no solo el código.

---

## 3 · El scope de locación vive en dos sitios, y solo uno se rellenó

**Esta es la que condiciona el encendido de nuestro flag de inventario.**

Hay dos pantallas que asignan locaciones a un miembro del staff, y escriben en
sitios distintos:

| Pantalla | Escribe en |
|---|---|
| Scope-assignment, la nueva | **SQL**, `PUT /db_staff/company-staff/scope` |
| La antigua, que sigue en la app | **Mongo**, `employee.preference.managerLocation` |

Ninguna escribe en las dos. Del lado del cliente ya lo hemos cerrado
(`c995425f`): `/inventory` lee ahora el scope SQL primero y cae al de Mongo para
los registros viejos. Lo que no podemos arreglar desde aquí es que **una persona
asignada solo con la pantalla antigua no tiene ninguna fila de scope en SQL**.

**Pregunta:** ¿qué hace `inventory-page` con un rol de locación
(`inventory_location_manager` / `inventory_location_assistant`) que **no tiene
ninguna fila de scope** en SQL? Hay dos finales posibles y ninguno bueno:

- no encuentra scope y **no filtra** → esa persona ve inventario que no le toca;
- no encuentra scope y **filtra a cero** → tabla vacía, sin explicación en
  pantalla.

**Petición, si la respuesta es cualquiera de las dos:** un **backfill** de
`preference.managerLocation` → scope SQL para los registros existentes. Creemos
que es vuestro: el origen está en Mongo, el destino es vuestra tabla, y hacerlo
desde el cliente sería reasignar roles uno a uno desde un navegador.

Mientras tanto mantenemos el filtro de locación en el cliente —es la red que
cubre a quien solo exista en Mongo— y **no encenderemos el flag hasta que el
backfill esté hecho**. El plan lo tiene escrito así.

---

## Resumen

| # | Pregunta | Urgencia |
|---|---|---|
| 1 | ¿`/api/stripe/*` = `/api/db_stripe/*`? | alta si la respuesta es «no»: la doble captura seguiría abierta |
| 2 | ¿Cuáles de las siete estaban bajo el `/:id`? | alta si alguna lo estaba: serían borrados, no llamadas sin efecto |
| 3 | Rol de locación sin scope en SQL + backfill | bloquea el encendido de nuestro flag, no vuestro deploy |

Lo demás de vuestros dos informes está cerrado por una parte o por la otra; el
detalle está en `FRONTEND_breaking_changes_2026-09-15_ANSWER.md` y
`FRONTEND_work_order_2026-09-16_ANSWER.md`.
