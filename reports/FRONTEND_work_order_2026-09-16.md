# Orden de trabajo: todo lo que hay que ajustar antes del deploy del servidor

> **Para:** el agente que lleva el dashboard.
> **Reemplaza** a `FRONTEND_breaking_changes_2026-09-15.md` como documento de
> referencia. Aquel informe estaba **incompleto**: cubría siete rupturas y hay
> seis cambios más que también alteran el comportamiento del cliente.
> **Vuestra respuesta (`..._ANSWER.md`) sigue siendo válida** para lo que cubría;
> nada de lo que ya cerrasteis hay que rehacerlo.
>
> Commits afectados: `94d7076`, `2ff47d1`, `6ff962c`, `ca3611e`, `54dffdb`,
> `56bf876`.
> Ninguno está desplegado. `395bba6` (métricas) sí, y no rompe nada.

---

## 0. Cómo leer esto

Cada punto lleva una etiqueta:

| Etiqueta | Significado |
|---|---|
| **[VOSOTROS]** | requiere un cambio en el dashboard antes del deploy |
| **[NOSOTROS]** | lo arreglamos en el servidor, no toquéis nada |
| **[CONFIRMAR]** | necesitamos un dato vuestro para decidir |

Y una confianza:

- **Verificado**: leído en el código del servidor, es un hecho.
- **Deducido**: depende de qué manda vuestro cliente, y no podemos verlo. Lo
  marcamos para que lo comprobéis vosotros, no para que lo deis por bueno.

---

## 1. Lo que ya cerrasteis — no hay que volver

De la checklist original, esto queda cerrado con vuestra respuesta y no vuelve a
aparecer en este documento:

- `x-token` global en las seis rutas (ya lo hacía el interceptor de Axios).
- Cero consumos de `GET /api/admin/receiver-assigned`.
- `company_id` fuera del body de `update-location-sub-location` (`2b1cbe93`).
- Roles: quien llega al árbol de locaciones ya tiene `inventory:update`.
- Cero consumidores de `company-inventory-pagination` y de `items_information`.

Y tenéis razón en el punto 7: el doble filtrado por locación/categoría no ocurre
hoy y empieza a importar cuando encendáis vuestro flag. Queda en vuestro
calendario, no en el nuestro.

---

## 2. CRÍTICO · Cuatro rutas que hoy devuelven 401 y van a empezar a funcionar

**[CONFIRMAR] + [NOSOTROS]. Confianza: deducido — y es lo primero que hay que
resolver.**

Este es el hallazgo que no estaba en el informe anterior, y es el único que puede
cambiar el comportamiento del dashboard **sin que nadie toque el frontend**.

### Qué pasa

`middlewares/authorizePermission` leía el `company_id` **solo** de params, body o
query — nunca del header. Hay handlers que no reciben `company_id` por ninguna de
esas tres vías, porque resuelven la compañía desde el header `s-company-lq`.

En esas rutas el middleware sale por `401 "Unauthorized: missing staff identity or
company_id"` **en todas las peticiones, incluso con un token perfectamente
válido**. El arreglo de `6ff962c` añade el header como último recurso — y al
hacerlo, **las revive**.

### Las cuatro

| Ruta | Hoy | Tras el deploy |
|---|---|---|
| `POST /api/db_identifier/register` | 401 siempre | funciona |
| `POST /api/db_identifier/register-bulk` | 401 siempre | funciona |
| `DELETE /api/db_consumer/:id` | 401 siempre | **borra de verdad** |
| `DELETE /api/db_event/:id` | 401 siempre | ejecuta |

Las dos primeras son **toda la API de registro de identificadores RFID**, muerta
desde el commit que la introdujo (`f159a58`).

### Lo que necesitamos de vosotros — [CONFIRMAR]

Para cada una de las cuatro:

1. **¿La llamáis?** Si no, no hay nada que hacer.
2. **Si la llamáis, ¿mandáis `company_id` en la query string?** Si lo mandáis, no
   estáis en 401 y nada de esto os afecta. Si no, hoy estáis recibiendo 401.
3. **Si recibís 401: ¿qué hace vuestra UI con él?** Esto es lo que de verdad
   importa. Si vuestro interceptor trata un 401 como *sesión caducada* y fuerza
   logout o redirige a login, hay un flujo que hoy expulsa al usuario y que tras
   el deploy dejará de hacerlo — y ejecutará la acción. Decidnos en qué pantallas.
4. **Para `DELETE /api/db_consumer/:id` en particular**: ¿hay un botón de borrar
   cliente que hoy "no hace nada" o da error? Porque tras el deploy borra.

### Lo que ya hemos hecho nosotros — [NOSOTROS] ✅

`deleteCustomer` ejecutaba `DELETE FROM consumer_info WHERE consumer_id = ?`,
**sin ningún filtro de compañía**. No íbamos a dejar que una ruta así despierte:
**ya tiene scope de compañía** (commit `56bf876`, detalle en §7.1). No tenéis que
hacer nada, pero os lo decimos porque cambia su respuesta: un `consumer_id` de
otra compañía devuelve **404** en vez de borrar.

### Cómo se verifica sin depender de nadie

`395bba6` ya está en producción y cuenta `s4xx` **por ruta**
(`helpers/metrics.js:141`). En 24-48 h, `GET /api/metrics` dice exactamente
cuántos 401 acumula cada una de las cuatro. Si el contador es cero, nadie las
llama y este apartado se cierra solo.

---

## 3. `POST /api/db_item/inventory-pagination` — el gemelo que no os nombramos

**[VOSOTROS]. Confianza: verificado.**

En el informe anterior hablamos de `POST /api/db_company/company-inventory-pagination`
y contestasteis, con razón, que no tenéis consumidores. Pero **el mismo controlador
está montado también** en `POST /api/db_item/inventory-pagination`, y nunca os
preguntamos por esa ruta.

Recibe exactamente los mismos dos cambios:

- exige `x-token`;
- **solo acepta nueve claves de filtro** — `brand`, `item_group`, `category_name`,
  `location`, `ownership`, `warehouse`, `logistic_status`, `status`,
  `main_warehouse`. Cualquier otra devuelve **400** con la lista en
  `detail.allowed`.

Además está entre las catorce rutas que estaban sombreadas (§4), así que **hoy no
pagina nada**: lo que responde es `deleteItem`.

**Qué hacer**: buscad `db_item/inventory-pagination` en `src/`. Si aparece,
migradlo a `POST /api/db_item/inventory-page`, su sustituto con `hasMore`,
columnas explícitas y techo de página. Si no aparece, contestad "cero" y lo
cerramos.

---

## 4. Tres rutas pasan de muertas a vivas

**[VOSOTROS]. Confianza: verificado.**

De las catorce rutas que `router.post("/:id")` tenía sombreadas, once las
alcanzabais por su gemelo en `/api/db_company` o `/api/db_event`, y por eso nada
parecía roto. **Tres no tienen gemelo:**

```
POST /api/db_item/consulting-row-item-assigned-event
POST /api/db_item/inventory-pagination
POST /api/db_item/retrieve-item-data
```

Hoy, una llamada a cualquiera de las tres **no hace lo que su nombre dice**: cae
en `deleteItem`, que exige `item_id` y `company_id` en el body y responde `400` si
no los encuentra. Tras el deploy devuelven datos de verdad.

**Qué hacer**: si alguna pantalla las llama y tiene manejo de error para el 400
que recibe hoy —un estado vacío, un *retry*, un mensaje—, ese camino cambia de
rama. Revisadlo.

> **Advertencia sobre el método con el que auditasteis esto la vez anterior.** En
> vuestra respuesta disteis por buenas cuatro rutas porque *"funcionan a diario →
> registradas antes del `/:id`"*. Esa inferencia no es válida: `delete-item`
> estaba **tres líneas por debajo** del `/:id` y funcionaba igual, porque `/:id`
> apuntaba al **mismo handler**. El uso solo prueba que *algo* atendió la
> petición. Para esta auditoría, mirad el fichero de rutas, no el comportamiento
> observado.

---

## 5. `items_information` cambia el ORDEN de las filas

**[VOSOTROS]. Confianza: verificado.**

La consulta pasó de:

```sql
SELECT * FROM item_inv WHERE company = ?
```

a llevar `ORDER BY item_id ASC`. Antes el orden era el que devolviera MySQL, que
no está garantizado.

**No da error: la tabla simplemente sale en otro orden.** Es el mismo tipo de
cambio que el §3 del informe anterior —el que más fácil se confunde con un bug de
datos— y no lo listamos. Si alguna vista ordena en cliente, no os afecta; si
pintaba en el orden recibido, cambia.

---

## 6. El 409 nuevo en las rutas de pago

**[VOSOTROS]. Confianza: verificado. Es posterior a vuestra respuesta.**

Commit `54dffdb`. La caché de idempotencia guardaba las respuestas en memoria del
proceso, y producción son cuatro procesos: dos peticiones iguales que cayeran en
workers distintos pasaban las dos. Y peor: solo guardaba **al terminar** el
handler, así que ni dentro de un mismo proceso protegía contra dos peticiones
simultáneas — solo contra un reintento posterior.

Ahora la clave se reserva en Redis **antes** de ejecutar. En estas ocho rutas:

```
/api/db_stripe/payment-intents/:id/capture     /api/db_stripe/refund
/api/db_stripe/payment-intents/:id/cancel      /api/db_stripe/partial-refund
        …y sus cuatro gemelas bajo /internal/
```

- **Duplicado que llega mientras la primera aún corre → `409`**
  `{ ok: false, msg: "A request with this idempotency key is already in progress" }`
- Duplicado que llega cuando la primera ya terminó → la respuesta original, como
  hasta ahora.

**Qué hacer**: tratad el 409 como *"tu petición anterior sigue en marcha"*, **no
como un error**.

- No lo pintéis como fallo de pago.
- **No reintentéis automáticamente**: cada reintento recibe otro 409 mientras dure
  la primera. Un *retry* en bucle sobre un 409 convierte la protección en un
  bucle.
- Lo correcto es esperar y consultar el estado del `payment_intent`.
- Si mandáis cabecera `Idempotency-Key`, es la que manda. Si no, la clave sale del
  método, la ruta y el cuerpo: dos peticiones con el mismo cuerpo son "la misma".

Es el punto con más riesgo de que un ajuste apresurado empeore las cosas.

---

## 7. Lo que hemos arreglado nosotros — YA HECHO

**[NOSOTROS]. No requiere nada de vuestra parte.** Va aquí para que no os
sorprenda en el diff. Los dos primeros puntos están **implementados y probados**
(commit `56bf876`); el tercero sigue abierto y va en ticket aparte.

1. ✅ **`deleteCustomer` ya tiene scope de compañía.** Antes de que la ruta
   despierte (§2). `consumer_info` **no tiene `company_id`**, así que la
   pertenencia se resuelve por el único vínculo que existe en el esquema:

   ```
   consumer_info.consumer_id
     → consumer_attending_event.consumer_attending_id
     → consumer_attending_event.event_attended_id = event_info.event_id
     → event_info.company_assigned_event_id
   ```

   Un `consumer_id` de otra compañía devuelve ahora **404** (no 403: un 403
   confirmaría que ese id existe). El id se sigue leyendo del **body** primero,
   como hasta ahora, con `:id` de la URL como respaldo — no cambiamos a qué fila
   apunta una llamada existente.

   > **Limitación conocida, y es del esquema, no del arreglo:** un consumidor que
   > no asista a **ningún** evento de la compañía no es atribuible a nadie con los
   > datos que hay, así que esta ruta devuelve 404 para él. Antes tampoco se podía
   > borrar —la ruta daba 401 a todo—, o sea que no quitamos nada que funcionara.
   > **Si tenéis una pantalla que borra consumidores recién creados y aún sin
   > evento, decídnoslo**: ese caso necesita otra solución y preferimos saberlo
   > antes del deploy que después.

2. ✅ **`checkTokenVersion` añadido** a `items_information`,
   `company-inventory-pagination`, `inventory-pagination` y las tres rutas nuevas
   de inventario. Solo llevaban `validateJWT`, a diferencia del resto de rutas
   endurecidas. Efecto que se cierra: un **force-logout no revocaba el acceso** a
   esas lecturas hasta que el token expirase por su cuenta.

   **Para vosotros esto sí tiene una consecuencia práctica**: si vuestro cliente
   guarda un token a través de un force-logout y sigue usándolo para leer
   inventario, esas seis rutas pasan a rechazarlo. Es el comportamiento que ya
   tenían todas las demás.
3. ⏳ **Prioridades opuestas al resolver la compañía** (abierto): `authorizePermission` lee
   `params → body → query → header`, y `resolveCompanyContext` lee
   `header → body → query`. Con `company_id: A` en el body y `s-company-lq: B` en
   el header, el permiso se comprueba contra A y los datos se escriben en B. Las
   dos exigen pertenencia activa, así que no es acceso entre inquilinos, pero sí
   permite usar el nivel de permiso de una compañía para escribir en otra.
   **Es anterior a estos commits**, no lo introducimos ahora; va en ticket aparte.
   Vuestro `2b1cbe93` —quitar `company_id` del body— es exactamente la mitigación
   correcta, y agradecemos que ya esté hecho.

---

## 8. Orden de trabajo propuesto

```
FASE A — sin bloquear a nadie (podéis empezar ya)
  A1. §3  buscar db_item/inventory-pagination en src/            [VOSOTROS]
  A2. §4  buscar las tres rutas sin gemelo en src/               [VOSOTROS]
  A3. §6  manejo del 409 en las ocho rutas de pago               [VOSOTROS]
  A4. §5  revisar si alguna vista depende del orden recibido     [VOSOTROS]

FASE B — nosotros
  B1. §7.1 scope de compañía en deleteCustomer          ✅ HECHO   [NOSOTROS]
  B2. §7.2 checkTokenVersion en las seis rutas          ✅ HECHO   [NOSOTROS]
  B3. leer /api/metrics a las 48 h del deploy de 395bba6         [NOSOTROS]

FASE C — requiere la respuesta de la Fase A y el dato de B3
  C1. §2  decidir sobre las cuatro rutas que hoy dan 401         [CONFIRMAR]
  C2. deploy conjunto de 94d7076, 2ff47d1, 6ff962c, ca3611e, 54dffdb
```

`94d7076` (las tres rutas nuevas de inventario) se puede desplegar **hoy**, por
separado y sin coordinar: vuestro flag está apagado y nadie las llama.

---

## 9. Lo que necesitamos de vuelta

Tres respuestas, y con ellas cerramos el deploy:

1. **§2** — de las cuatro rutas que hoy dan 401: cuáles llamáis, si mandáis
   `company_id` en la query, y qué hace vuestra UI con un 401.
2. **§3 y §4** — cuántos consumidores tienen esas cuatro rutas en `src/`.
3. **§6** — confirmación de que el 409 se trata como "en curso" y sin reintento
   automático.
4. **§7.1** — si borráis consumidores que aún no asisten a ningún evento (ver la
   limitación conocida).

Lo demás ya está resuelto, por vuestro lado o por el nuestro.
