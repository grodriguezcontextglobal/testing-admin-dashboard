# Respuesta a la orden de trabajo del 2026-09-16

> Responde a `FRONTEND_work_order_2026-09-16.md`.
> Auditado contra `main` el 2026-09-16 (HEAD `09d8ac81`).

**Resumen: de la Fase A, tres de los cuatro puntos se cierran con "cero
consumidores". El cuarto —el 409 de pago— es real, nos toca, y antes de tocarlo
necesitamos que confirméis una cosa: las rutas de pago que llamamos no son las
que nombráis.**

---

## 0. Aceptamos la corrección de método

Teníais razón: *"funciona a diario, luego está registrada antes del `/:id`"* no
demuestra nada si el `/:id` apunta al mismo handler. Era una inferencia y la
dimos con más peso del que aguanta.

Esta auditoría es distinta. Buscamos el **fragmento de ruta** en todo `src/`
—`db_identifier`, `db_consumer`, `db_event/`, `db_item/`, `stripe/`—, no el
comportamiento observado. El fragmento aparece igual en una ruta interpolada
(`` `/db_item/${id}` ``) que en una literal, así que una llamada construida en
tiempo de ejecución no se escapa mientras el prefijo esté escrito en el código.
Quedan fuera los ficheros de `src/docs/`, que son documentación generada del
contrato, no llamadas.

Lo que sigue son hechos de nuestro código. Donde hay una deducción, lo decimos.

---

## 1. §2 — las cuatro rutas que hoy dan 401: **cero consumidores, las cuatro**

| Ruta | Consumidores en `src/` |
|---|---|
| `POST /api/db_identifier/register` | **0** |
| `POST /api/db_identifier/register-bulk` | **0** |
| `DELETE /api/db_consumer/:id` | **0** |
| `DELETE /api/db_event/:id` | **0** |

`db_identifier` no aparece **ni una vez** en todo el cliente: ni la ruta, ni el
prefijo. La API de registro de identificadores RFID lleva muerta desde `f159a58`
y nosotros no la hemos llamado nunca — encaja con que nuestro trabajo de RFID
(el lector OR2505) siga esperando la spec del proveedor.

De `db_consumer` usamos solo dos rutas, las dos `POST`: `new_consumer` y
`consulting-consumer`. **Ningún borrado.** De `db_event` usamos veinte rutas,
todas `POST`; ninguna es un `DELETE`.

**Respuesta a vuestras preguntas 2, 3 y 4 del §2:** no procede — no las
llamamos, así que no recibimos esos 401 y no hay pantalla que cambie de rama.

**Y el dato que pedíais por si acaso, porque vale para todo lo demás: un 401 no
desloguea a nadie en este cliente.** El interceptor de respuesta
(`src/api/devitrakApi.jsx:135-186`) solo hace dos cosas: encolar la petición si
el navegador está sin red, y reintentar **una vez** contra el otro servidor si el
error es `Network Error` o `timeout`. **No mira códigos de estado.** El único
manejo de 401 que existe está en `Login.jsx` (credenciales incorrectas y el
camino de MFA) y en `ReceiptPage.jsx` (una página pública que pide iniciar
sesión). La sesión caduca por otra vía: `App.jsx` valida el JWT en cada cambio de
ruta.

Consecuencia práctica para vosotros: **ninguna de las cuatro rutas puede estar
expulsando a un usuario hoy**, ni siquiera si la llamáramos.

---

## 2. §3 y §4 — las cuatro rutas sombreadas: **cero, las cuatro**

| Ruta | Consumidores en `src/` |
|---|---|
| `POST /api/db_item/inventory-pagination` | **0** |
| `POST /api/db_item/consulting-row-item-assigned-event` | **0** |
| `POST /api/db_item/retrieve-item-data` | **0** |

`inventory-pagination` no aparece en el cliente en ninguna forma. Gracias por
nombrarla: es exactamente el gemelo que nuestra respuesta anterior no podía ver,
y confirma que preguntar por el controlador y no por la ruta era lo correcto.

Lo que sí llamamos sobre `/api/db_item`, para que lo tengáis entero y podáis
cruzarlo con vuestro fichero de rutas: `consulting-item` (27), `delete-item`
(20), `item-out-warehouse` (14), `warehouse-items` (7), `inventory-page` (7),
`inventory-facets` (5), `bulk-item-alphanumeric` (4), `edit-item` (3),
`delete-bulk-items-criteria` (3), `new_item` (2), `bulk-item` (1),
`tracking_item` (1), `event-items` (1), `serial-suggest` (1).

`inventory-page`, `inventory-facets` y `serial-suggest` son las tres rutas
nuevas: están detrás de nuestro flag, apagado en todos los entornos desplegados.

**La pregunta del informe anterior sigue en pie, y ahora con vuestro método:** de
esas catorce, ¿cuáles estaban registradas después del `router.post("/:id")`? Ya
no os pedimos que lo deduzcáis del uso — os pedimos que miréis el fichero de
rutas. Importa porque `deleteItem` lee `item_id` del body: una ruta sombreada a
la que llamamos con `item_id` en el cuerpo no era una llamada sin efecto, era un
borrado.

---

## 3. §5 — el orden de `items_information`: no nos afecta

Cero consumidores de `items_information`, como ya os dijimos. El `ORDER BY` no
nos cambia ninguna vista.

---

## 4. §6 — el 409 de pago: **[CONFIRMAR] antes de que toquemos nada**

Aquí sí hay trabajo nuestro, pero vuestro §6 nombra rutas que **no son las que
llamamos**, y no queremos repetir el error del §4 dando por hecho que son la
misma cosa.

Vosotros nombráis, bajo `/api/db_stripe/`:

```
payment-intents/:id/capture · payment-intents/:id/cancel · refund · partial-refund
```

Nosotros llamamos a esas cuatro operaciones, pero bajo **`/api/stripe/`**:

| Nuestra llamada | Dónde |
|---|---|
| `POST /stripe/payment-intents/:id/capture` | `deposit/Capturing.jsx:108`, `DepositActionModal.jsx:57` |
| `POST /stripe/payment-intents/:id/cancel` | `deposit/Releasing.jsx:96`, `DepositActionModal.jsx:68`, `search/ReleaseDeposit.jsx:104` |
| `POST /stripe/refund` | `StripeTransactionTable.jsx:117`, `ExpandedLostButtons.jsx:119` |
| `POST /stripe/partial-refund` | `ExpandedLostButtons.jsx:74` |

De `/api/db_stripe/` solo usamos `consulting-stripe` y `new_stripe`, en el login.

**La pregunta:** ¿`/api/stripe/*` y `/api/db_stripe/*` son el mismo controlador
montado dos veces —como `company-inventory-pagination` e `inventory-pagination`—
o son handlers distintos? Es decir: **¿la reserva en Redis de `54dffdb` cubre
también las rutas `/api/stripe/*`, o esas cuatro llamadas nuestras siguen sin
protección de idempotencia?**

Las dos respuestas nos dan trabajo, pero trabajo distinto:

- **Si son el mismo handler:** el 409 nos llega y hay que tratarlo (abajo).
- **Si son handlers distintos:** entonces las ocho rutas que habéis protegido no
  son las que usa el dashboard, y la doble captura que queríais cerrar sigue
  abierta por nuestro lado. Eso es más grave que el 409.

### Lo que ya podemos deciros sin esperar

**No hay reintento automático en ningún caso.** El interceptor solo reintenta con
`Network Error` o `timeout`, nunca por código de estado, y estas cuatro llamadas
son mutaciones dentro de manejadores (`await` directo o `mutationFn`), donde
React Query no reintenta por defecto. Un 409 no entra en bucle. Confirmado.

**No mandamos cabecera `Idempotency-Key` en ninguna de las cuatro.** Solo la
mandan las subidas de documentos. Así que vuestra clave derivada —método, ruta y
cuerpo— es la que manda. Un detalle que conviene que sepáis: en la captura, el
importe es **editable** por el operador, así que dos capturas del mismo depósito
con importes distintos son, para esa clave, **dos peticiones distintas**.

**Y el problema real, si el 409 nos llega hoy:** el modal de depósitos pinta un
texto fijo en cualquier error —*"The deposit was not captured. Nothing was
charged."* (`DepositActionModal.jsx`)—. Ante un 409 eso es **falso y peligroso**:
la primera petición sigue viva y probablemente sí cobre. Un operador que lea eso
vuelve a intentarlo por su cuenta, que es justo lo que la protección busca
evitar.

**Lo que haremos en cuanto confirméis:** tratar el 409 como *"tu petición
anterior sigue en marcha"*, sin reintento, y consultar el estado del
`payment_intent` en vez de afirmar nada sobre el cobro. Son cuatro pantallas más
el modal compartido.

---

## 5. §7.1 — consumidores sin evento: **no borramos consumidores**

Cero llamadas a `DELETE /api/db_consumer/:id`. No existe en el dashboard un botón
de borrar cliente, ni para uno con eventos ni para uno recién creado. Vuestra
limitación conocida —el consumidor que no asiste a ningún evento devuelve 404— no
nos afecta hoy.

Si algún día añadimos ese borrado, os lo preguntamos antes.

---

## 6. §7.2 — `checkTokenVersion`: de acuerdo, con un matiz nuestro

Nos parece correcto y no nos rompe: el token se lee de localStorage en cada
petición y el que sobrevive a un force-logout vuelve a pasar por `Login.jsx`,
que limpia y reescribe el almacenamiento de sesión (`clearSessionStorage` +
`persistCompanyHeaders`).

El matiz es de UX y es nuestro: como **no hay manejo global del 401**, una
pestaña que quede con un token revocado y siga abierta no verá "tu sesión ha
terminado" — verá una tabla de inventario que falla. Hoy pasa lo mismo con
cualquier otra ruta endurecida, así que no es una regresión que introduzcáis
vosotros. Lo anotamos como trabajo nuestro.

---

## 7. Fase A, estado

```
A1. §3  db_item/inventory-pagination en src/        ✅ CERO
A2. §4  las tres rutas sin gemelo en src/           ✅ CERO
A3. §6  manejo del 409 en las rutas de pago         ⏸ BLOQUEADO — ¿stripe o db_stripe?
A4. §5  vistas que dependan del orden recibido      ✅ N/A, cero consumidores
```

**Por nosotros podéis desplegar `94d7076` hoy** y, en lo que a la Fase A
respecta, también los de ruptura: ninguna de las rutas que cambian tiene
consumidores en el dashboard, salvo el asunto de pagos, que depende de vuestra
respuesta y **no cambia por desplegar** — si `/api/stripe/*` no es el mismo
handler, hoy ya estamos sin protección y el deploy no lo empeora.

---

## 8. Lo que os pedimos de vuelta

1. **§6 — la importante**: ¿`/api/stripe/*` es el mismo controlador que
   `/api/db_stripe/*`? De ahí sale si el 409 nos llega o si vuestras ocho rutas
   protegidas no son las que usamos.
2. **§4 — pendiente desde el informe anterior**: de las catorce rutas, cuáles
   estaban registradas después del `router.post("/:id")`. Mirando el fichero de
   rutas, no el uso.
