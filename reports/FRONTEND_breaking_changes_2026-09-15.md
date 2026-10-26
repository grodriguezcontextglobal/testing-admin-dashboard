# Frontend — cambios del servidor que rompen si no os ajustáis

Repo backend: `server-testing`. Commiteado el 2026-09-15, **sin pushear ni
desplegar**. Este documento existe para que el ajuste vaya antes del deploy y no
después.

---

## 0. Lo que se puede desplegar sin tocar nada vuestro

Dos de los cinco commits **no rompen nada** y se pueden desplegar por separado:

| Commit | Qué hace | Riesgo |
|---|---|---|
| `395bba6` métricas | `/api/metrics` gana bytes por endpoint | ninguno, solo añade campos |
| `94d7076` inventario | tres rutas **nuevas** (`inventory-page`, `inventory-facets`, `serial-suggest`) | ninguno, nadie las llama todavía |

Los otros tres —`2ff47d1`, `6ff962c`, `ca3611e`— son los de este documento.

---

## 1. Resumen: siete cambios que rompen

| # | Ruta | Si no ajustáis nada | Ajuste |
|---|---|---|---|
| 1 | `POST /db_item/items_information` | **401** sin token; máximo 5.000 filas | mandar `x-token`; leer `truncated` |
| 2 | `POST /db_company/company-inventory-pagination` | **401** sin token; **400** si el filtro no está en la allowlist | `x-token`; filtros de la lista |
| 3 | `POST /db_inventory/update-location-sub-location` | **401** sin token, **403** sin `inventory:update` | `x-token`; revisar rol |
| 4 | `PUT /db_sub_location/sub-locations/:id` | **401**/**403**; **404** si es de otra compañía | `x-token`; revisar rol |
| 5 | `DELETE /db_sub_location/sub-locations/:id` | **401**/**403**; **404** si es de otra compañía | `x-token`; revisar rol |
| 6 | `GET /admin/receiver-assigned` | **401** sin token, y **devuelve otra cosa** | ver §2.6 |
| 7 | `POST /db_item/<id-no-numérico>` | **404** | usar el `item_id` numérico |

Más un cambio que no da error pero **muestra menos datos**: §3.

---

## 2. Detalle, uno por uno

### 2.1 · `POST /api/db_item/items_information`

Iba **sin token** y filtraba por `company` —el **nombre** de la compañía, tal
como venía en el body—, así que bastaba saber cómo se llama un cliente para
llevarse su inventario.

Ahora:

- Exige `x-token`.
- El `company_id` sale del contexto verificado (header `s-company-lq`, que ya
  mandáis en toda ruta `/api/db_*`). **El campo `company` del body se ignora.**
- Aplica el scope del rol (ver §3).
- Devuelve **como máximo 5.000 filas**, y lo dice:

```jsonc
{ "ok": true, "items": [ … ], "truncated": true, "limit": 5000 }
```

**Qué hacer**: mandar el token, y si `truncated` viene `true`, migrar esa
pantalla a `POST /api/db_item/inventory-page`. El techo es configurable en el
servidor (`ITEMS_INFORMATION_MAX_ROWS`) si necesitáis aire mientras migráis —
pedidlo y lo subimos, pero es una tirita, no una solución.

### 2.2 · `POST /api/db_company/company-inventory-pagination`

Iba sin token y **sin filtro de compañía**: con el body vacío paginaba
`item_inv` de todas las compañías.

Ahora exige `x-token`, impone el `company_id` verificado, y **solo acepta estas
nueve claves de filtro**:

```
brand · item_group · category_name · location · ownership
warehouse · logistic_status · status · main_warehouse
```

Cualquier otra da **400** con la lista de las válidas en `detail.allowed`.

No es un capricho: los nombres de columna se concatenaban al SQL desde
`Object.keys(body)`, y eso no lo cierra scopear por compañía — una clave como
`"item_id = 1 OR 1"` produce `company_id = ? AND item_id = 1 OR 1 = ?`, y como
`AND` liga más fuerte que `OR`, devuelve la tabla entera.

**Qué hacer**: esta ruta está **obsoleta**. Migrad a `inventory-page`, que hace
lo mismo con `hasMore`, columnas explícitas y techo de página.

### 2.3 · `POST /api/db_inventory/update-location-sub-location`

Renombrar una locación o sub-locación **iba sin token**. Ahora pide `x-token`,
`inventory:update`, y el `company_id` del contexto verificado.

Si mandáis `company_id` en el body y **no coincide** con el header, la respuesta
es **400** `Company mismatch between header and body`, con los dos valores en
`detail`. Podéis dejar de mandarlo: es opcional.

### 2.4 y 2.5 · `PUT` y `DELETE /api/db_sub_location/sub-locations/:id`

Las dos iban sin token y **sin comprobar de quién es la sub-locación**: con el
id bastaba para renombrar o borrar la estructura de otra compañía. El borrado,
además, arrastra la rama de hijos por el `CASCADE` de la tabla.

Ahora: `x-token`, `inventory:update` / `inventory:delete`, y **404** si la
sub-locación no es de vuestra compañía. Es 404 y no 403 a propósito: un 403
confirmaría que ese id existe.

> **Nota**: al añadir el permiso descubrimos que `authorizePermission` leía el
> `company_id` solo de params, body o query, nunca del header — y estas dos
> rutas no lo llevan en ninguno de los tres. Habrían dado **401 a todas las
> peticiones**, token válido incluido. Está arreglado en el mismo commit: el
> header es ahora el último recurso. Lo decimos porque si probáis contra una
> versión intermedia, ese es el síntoma.

### 2.6 · `GET /api/admin/receiver-assigned` — el más silencioso

Esta ruta **estaba sombreada** por `GET /api/admin/:id`, que se registra antes.
O sea: lo que devolvía no eran los receivers asignados, sino **la lista de
usuarios** de `showAllUsers`.

Ahora devuelve lo que su nombre dice, y exige `x-token`.

**Qué hacer**: buscad en el cliente cualquier consumo de esa ruta. Si alguna
pantalla estaba pintando usuarios a partir de ella —aunque fuera sin querer—,
deja de funcionar. Y si alguien la usaba **como atajo para listar usuarios**,
hay que apuntarla a la ruta de usuarios de verdad.

### 2.7 · `POST /api/db_item/:id` solo acepta dígitos

`POST /api/db_item/<algo>` capturaba cualquier ruta de un solo segmento y
mandaba todo a `deleteItem` — así tenía **catorce rutas sin efecto**, entre
ellas `/inventory-query` y `/check-item`. Ahora el parámetro está acotado a
dígitos.

Consecuencia para vosotros: si borráis un ítem con un id no numérico en la URL,
ahora es **404**. El handler nunca miró ese parámetro (lee `item_id` del body),
así que lo natural es usar `POST /api/db_item/delete-item`.

**Efecto colateral bueno**: las catorce rutas vuelven a existir. Once de ellas
las estabais alcanzando por su gemelo en `/api/db_company` o `/api/db_event`, y
esas siguen igual.

---

## 3. El cambio que no da error: los roles con scope ven menos

`items_information` y la paginación **no aplicaban el scope de locación o
categoría**. Ahora sí, dentro de la consulta.

Para un `location_manager` o un rol de categoría (niveles 8 y 9), eso significa
**menos filas que ayer** — las correctas, pero menos. Si el cliente vuelve a
filtrar por `allowedLocations` después de recibir, ahora el filtro se aplica dos
veces: inofensivo mientras los criterios coincidan, pero conviene quitarlo.

No hay error, no hay aviso: la lista simplemente es más corta. Es el cambio que
más fácil se confunde con un bug de datos, y por eso está aquí.

---

## 4. Lo que NO cambia

- `warehouse-items`, `current-inventory`, `check-item`, `company-inventory-structure`,
  `locations`, `location-paths-tree` y la búsqueda agrupada: intactos.
- El resto de `/api/db_item/*` y `/api/db_company/*`.
- `/api/metrics` solo gana campos.
- Las tres rutas nuevas de inventario no afectan a nada existente.

---

## 5. Cómo sabemos a quién afecta, antes de romperlo

El commit de métricas (`395bba6`) registra **peticiones por ruta**. Desplegado
solo, en 24-48 h dice exactamente quién llama a cada una de las siete rutas de
arriba y con qué frecuencia. Si el contador de alguna es cero, su cambio es
gratis.

Es la razón de que los commits estén partidos: se puede desplegar el de métricas
hoy sin coordinar nada.

---

## 6. Checklist

1. Comprobar que vuestro cliente manda `x-token` en las seis rutas de §2.1-§2.6.
   Si lo añadís globalmente, ya está.
2. Buscar consumos de `GET /admin/receiver-assigned` (§2.6).
3. Quitar del body el `company_id` de las rutas de locación, o asegurarse de que
   coincide con el header.
4. Revisar que los roles que renombran o borran locaciones tengan
   `inventory:update` / `inventory:delete`.
5. Sustituir filtros fuera de la allowlist en `company-inventory-pagination`, o
   migrar a `inventory-page`.
6. Leer `truncated` en `items_information` mientras dure la migración.
7. Dejar de filtrar por locación/categoría en el cliente (§3).

Cuando esos siete estén, avisadnos y desplegamos los tres commits juntos.
