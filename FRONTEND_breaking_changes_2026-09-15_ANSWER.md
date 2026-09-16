# Respuesta al informe de rupturas del 2026-09-15 — podéis desplegar

> Responde a `FRONTEND_breaking_changes_2026-09-15.md`.
> Auditado contra el código del dashboard el 2026-09-15; la única acción que
> nos tocaba está pusheada a `main` el 2026-09-16 (`2b1cbe93`).

**Resumen: de vuestros siete puntos de ruptura, cinco no nos tocan, uno ya
estaba cubierto y uno lo hemos arreglado hoy. Adelante con el deploy.**

---

## Checklist §6, punto por punto

| # | Punto | Estado |
|---|---|---|
| 1 | `x-token` en las seis rutas | ✅ **ya estaba** |
| 2 | Consumos de `GET /admin/receiver-assigned` | ✅ **cero** |
| 3 | `company_id` fuera del body en las rutas de locación | ✅ **pusheado hoy** — `2b1cbe93` |
| 4 | Roles con `inventory:update` / `inventory:delete` | ✅ **por construcción** |
| 5 | Filtros de `company-inventory-pagination` | ✅ **N/A**, cero consumidores |
| 6 | Leer `truncated` en `items_information` | ✅ **N/A**, cero consumidores |
| 7 | Dejar de filtrar por locación/categoría en el cliente | ✅ **no aplica hoy** — ver abajo |

**1 · `x-token`.** No requirió trabajo: el interceptor de petición lo adjunta
globalmente a todas las instancias de Axios (`src/api/devitrakApi.jsx:90`),
junto con `s-token-lq` y el `s-company-lq` por ruta en todo `/api/db_*`.

**2 · `receiver-assigned`.** Cero consumos de `GET /admin/receiver-assigned` en
todo `src/`. Lo que usamos —nueve veces— es
`POST /receiver/receiver-assigned-list` y
`POST /receiver/receiver-assigned-users-list`: otro namespace, otras rutas.
Vuestro §2.6 no nos alcanza.

**3 · `company_id` en el body.** `TreeNode.jsx` era el **único** consumidor de
`POST /db_inventory/update-location-sub-location` en todo `src/`, y mandaba
`company_id` leído de Redux mientras el header `s-company-lq` sale de
localStorage. Divergen justo después de cambiar de compañía, que es el 400 que
anunciáis. Ya no va en el body; el constructor es puro y un test fija que el
body tiene exactamente tres claves, para que el campo no vuelva en el próximo
merge.

**4 · Roles.** `inventory:read` e `inventory:update` comparten la misma lista de
roles (`src/config/roles.js:236-237`) y `/inventory` vive tras
`<PermissionGuard action="inventory:read" />`. Quien llega a la pantalla del
árbol de locaciones ya tiene el permiso de escritura, así que vuestro 403 no
puede alcanzar a nadie que hoy renombre. El borrado no os toca tampoco: va por
`/db_location/locations/:id` y `/db_location/sub-location-path/delete`, no por
`db_sub_location`.

**5 y 6.** Cero consumidores de `company-inventory-pagination` y de
`items_information` en `src/`. Ni la allowlist de filtros ni el techo de 5.000
filas nos afectan.

**7 · El filtro de cliente.** Vuestro §3 aplica el scope de rol dentro de
`items_information` y de la paginación — las dos rutas del punto anterior, de
las que no consumimos ninguna. Nuestra tabla de inventario lee
`POST /db_item/warehouse-items`, que vuestro §4 declara intacto. Así que el
doble filtrado que avisáis **no ocurre hoy**: empieza a importar cuando
encendamos nuestro flag y consumamos `inventory-page`, y el filtro de cliente se
quita en ese mismo cambio. Es calendario nuestro y no condiciona el vuestro.

---

## Orden de deploy que proponemos

1. **`395bba6` métricas, solo.** Sin coordinar nada. Además responde con datos
   la pregunta de abajo.
2. **`94d7076` las tres rutas nuevas**, cuando queráis: nuestro flag está
   apagado y nadie las llama todavía en producción.
3. **`2ff47d1`, `6ff962c`, `ca3611e`**, los tres de ruptura. Por nosotros,
   cuando queráis.

---

## Una pregunta de vuelta — §2.7, las catorce rutas des-sombreadas

No bloquea el deploy, pero corre más prisa de lo que parece.

`deleteItem` lee el `item_id` **del body**. Si alguna ruta de un segmento estaba
registrada *después* de `router.post("/:id")`, hoy esa llamada nuestra no es una
llamada sin efecto: llega a `deleteItem` con un `item_id` en el body y **borra**.

Estas son las rutas de un segmento a las que hacemos `POST` sobre
`/api/db_item`, por frecuencia de uso en el cliente:

| Ruta | Llamadas | Lectura |
|---|---|---|
| `consulting-item` 27 · `delete-item` 20 · `item-out-warehouse` 14 · `warehouse-items` 7 | muchas | funcionan a diario → registradas antes del `/:id`, demostrado por uso |
| `bulk-item-alphanumeric` 4 · `edit-item` 3 · `delete-bulk-items-criteria` 3 · `new_item` 2 · `bulk-item` 1 · `tracking_item` 1 · `event-items` 1 | pocas | **son estas siete las que preguntamos** |

**¿Cuáles de esas siete estaban registradas después del `router.post("/:id")`?**
Si alguna lo estaba, lo que cambia con vuestro deploy no es un error nuevo: es
que deja de borrar y empieza a hacer lo que dice su nombre. Querríamos saberlo
para mirar los datos, no solo el código.

**Lo que sí hemos comprobado del §2.7:** la única llamada nuestra a
`POST /db_item/:id` interpola un `item_id` numérico
(`ReturningLeasedEquipModal.jsx:144`), así que sigue casando con el parámetro
acotado a dígitos y no rompe. La migraremos a `/delete-item` sin urgencia.
