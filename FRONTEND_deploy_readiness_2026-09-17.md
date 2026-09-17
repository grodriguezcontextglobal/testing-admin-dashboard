# Podéis empezar el despliegue — qué falta, por fases

> Del dashboard al servidor, 2026-09-17.
> Cierra `FRONTEND_breaking_changes_2026-09-15.md` y
> `FRONTEND_work_order_2026-09-16.md`. Las respuestas detalladas están en los dos
> `..._ANSWER.md`; esto es el resumen operativo: **qué queda, de quién es, y en
> qué orden**.

---

## 0. La respuesta corta

**Por nuestra parte no queda nada que bloquee el despliegue.** Los seis commits
se pueden desplegar en tres tandas. Lo único que pedimos antes de la tercera es
**una respuesta, no un cambio de código**.

| Commit | Qué es | ¿Nos bloquea? |
|---|---|---|
| `395bba6` | métricas | ya desplegado |
| `94d7076` | tres rutas nuevas de inventario | no — nadie las llama, nuestro flag está apagado |
| `2ff47d1` · `6ff962c` · `ca3611e` | los tres de ruptura | **no** — cerrado por nuestro lado |
| `56bf876` | scope de compañía en `deleteCustomer` + `checkTokenVersion` | no — no borramos consumidores |
| `54dffdb` | idempotencia en Redis, el 409 | **depende de una respuesta vuestra**, no de código nuestro |

---

## 1. Lo que ya está hecho por nuestra parte

Todo esto está en `main` y desplegable hoy.

| Qué pedía vuestro informe | Estado | Dónde |
|---|---|---|
| `x-token` en las seis rutas | ✅ ya estaba | interceptor global, `devitrakApi.jsx:90` |
| `company_id` fuera del body de las rutas de locación | ✅ **hecho** | `2b1cbe93` — era el único consumidor en todo `src/` |
| Roles con `inventory:update` / `inventory:delete` | ✅ por construcción | `/inventory` va tras el guard de `inventory:read`, y las dos listas de roles son la misma |
| Consumos de `GET /admin/receiver-assigned` | ✅ **cero** | usamos `/receiver/*`, otro namespace |
| Consumos de `items_information` y `company-inventory-pagination` | ✅ **cero** | por eso el techo de 5.000 filas y la allowlist no nos tocan |
| Consumos de `db_item/inventory-pagination` y las tres sombreadas sin gemelo | ✅ **cero** | verificado buscando el fragmento de ruta, no el comportamiento |
| Las cuatro rutas que hoy dan 401 | ✅ **cero consumidores las cuatro** | `db_identifier` no aparece ni una vez en el cliente |
| Orden de filas de `items_information` | ✅ N/A | cero consumidores |
| Tratar el 409 como «petición en curso» | ✅ **hecho, en defensivo** | `21896b77`, seis pantallas de pago |
| Dejar de filtrar por locación/categoría en cliente | ⏸ **a propósito** | es nuestra Fase 6, va al encender nuestro flag; §3 solo afecta a rutas que no consumimos |

Un dato que os sirve para todo lo demás: **un 401 no desloguea a nadie en este
cliente**. El interceptor de respuesta no mira códigos de estado. Así que
ninguna de vuestras rutas endurecidas puede estar expulsando usuarios hoy.

---

## 2. Las tres tandas

### Tanda 1 — ahora mismo, sin coordinar

```
94d7076   las tres rutas nuevas de inventario
```

`395bba6` ya está. Nadie llama a `inventory-page`, `inventory-facets` ni
`serial-suggest` en ningún entorno desplegado: viven detrás de un flag apagado.
Desplegarlas no cambia nada para nadie, y nos deja verificar el contrato cuando
encendamos el flag en local.

**Lo que os pedimos aquí: nada.**

---

### Tanda 2 — los de ruptura, cuando queráis

```
2ff47d1   6ff962c   ca3611e   56bf876
```

Nuestra parte está cerrada. Lo único que haremos es un **smoke test de quince
minutos** justo después, sobre lo que vuestro cambio toca de verdad:

1. Renombrar una locación y una sub-locación en `/inventory` → 200, no 400.
2. Repetir **después de cambiar de compañía** — ese era exactamente el caso que
   producía el 400 nuevo, y es lo que arregla `2b1cbe93`.
3. Borrar un path de sub-locación → sigue yendo por `/db_location/*`, sin cambio
   esperado.
4. Abrir un consumidor y desplegar su fila → los receivers vienen de
   `/receiver/*`, no de la ruta de `/admin` que cambia de contenido.

**Lo que os pedimos aquí: avisarnos cuando esté arriba**, para correrlo el mismo
día y no dentro de una semana.

---

### Tanda 3 — pagos, después de una respuesta

```
54dffdb   idempotencia en Redis (el 409)
```

**Precondición, y es una pregunta:** ¿`/api/stripe/*` es el mismo controlador
que `/api/db_stripe/*`?

Vosotros protegisteis ocho rutas bajo `/api/db_stripe/` y sus gemelas de
`/internal/`. El dashboard llama a esas mismas cuatro operaciones —captura,
cancelación, reembolso y reembolso parcial— pero **bajo `/api/stripe/`**. De
`db_stripe` solo usamos `consulting-stripe` y `new_stripe`, en el login.

- **Si es el mismo handler** → el 409 nos llega y ya estamos listos (`21896b77`):
  lo tratamos como «tu petición anterior sigue en marcha», sin reintento
  automático, y consultamos el estado del `payment_intent` en vez de afirmar
  nada sobre el cobro. Desplegad cuando queráis.
- **Si son handlers distintos** → vuestras ocho rutas protegidas no son las que
  usa el dashboard, y **la doble captura que queríais cerrar sigue abierta por
  nuestro lado**. Eso no lo arregla este despliegue y habría que abrir un
  ticket aparte. Por eso preferimos saberlo antes que después.

En ninguno de los dos casos el despliegue empeora nada: si no estamos cubiertos,
hoy tampoco lo estamos.

---

## 3. Lo que **no** hay que esperar

Para que no quede en el aire: hay dos cosas abiertas por nuestro lado que
**no condicionan vuestro despliegue**.

- **Nuestro flag de inventario** sigue apagado, y seguirá hasta que hagamos las
  fases 6 y 7 por nuestra cuenta. No depende de vosotros más allá de tener
  desplegada la tanda 1.
- **El backfill del scope de locación** (la pregunta 3 de
  `FRONTEND_backend_asks_2026-09-17.md`) bloquea **el encendido de nuestro
  flag**, no vuestro deploy. Lo separamos a propósito para que una cosa no
  retenga a la otra.

---

## 4. Lo que nos gustaría de vuelta, en orden de urgencia

| # | Qué | Cuándo hace falta |
|---|---|---|
| 1 | ¿`/api/stripe/*` = `/api/db_stripe/*`? | antes de la tanda 3 |
| 2 | ¿Cuáles de las siete rutas poco usadas estaban registradas después del `router.post("/:id")`? | cuanto antes: si alguna lo estaba, esas llamadas **eran borrados**, y eso se revisa en los datos |
| 3 | Qué hace `inventory-page` con un rol de locación sin filas de scope, y el backfill de `preference.managerLocation` → scope SQL | antes de que encendamos nuestro flag |
| 4 | Aviso de que la tanda 2 está arriba | el día del despliegue |

Las tres preguntas están desarrolladas en
`FRONTEND_backend_asks_2026-09-17.md`.

---

## 5. Cómo sabremos que salió bien

Vuestro commit de métricas cuenta `s4xx` por ruta. En las 24-48 h siguientes a
cada tanda, un vistazo a `/api/metrics` dice más que cualquier verificación
manual:

- **tanda 2**: `update-location-sub-location` sin 400 nuevos, y las cuatro rutas
  que hoy dan 401 con el contador plano —que es lo que confirma que nadie las
  llamaba, que es lo que os dijimos.
- **tanda 3**: 409 en las rutas de pago **solo** si `/api/stripe/*` está
  cubierto. Si son handlers distintos, el contador se queda a cero y eso mismo
  es la respuesta a la pregunta 1.
