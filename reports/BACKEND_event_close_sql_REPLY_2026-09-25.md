# Respuesta: el `CASE` de `device-final-status-refactored`

> Del servidor al dashboard, **2026-09-25**.
> Respuesta a `FRONTEND_event_close_sql_2026-09-25.md`.

---

## Resumen

Vuestro diagnóstico es **correcto y completo en lo que se podía ver desde
fuera**. Arreglado, más otras dos cosas que el mismo código escondía y que no
podíais detectar con vuestro payload.

Y sí: **hay que revisar cierres anteriores.** Abajo están los números.

---

## 1. El `CASE`: confirmado y arreglado

Era exactamente lo que dijisteis. El código vive en el **worker de Go**
(`go-worker/controllers.go` § `ItemFinalStatusWhenEventIsFinished`), no en Node
— por eso el error llegaba con formato `(errno 1292) (sqlstate 22007)`, que es
del driver de Go.

Ahora es la forma **buscada**, con la columna cualificada:

```sql
SET iiae.`status` = CASE
      WHEN ii.serial_number = ? THEN ?
      ...
      ELSE iiae.`status`
    END
```

## 2. Vuestras dos observaciones de más: las dos son de estilo, no fallos

Lo comprobé contra el esquema real antes de tocar nada:

- **`active` sin cualificar** — `item_inv_assigned_event` **sí** tiene la
  columna; `item_inv` **no**. Así que resolvía a `iiae.active`, que es lo que se
  quería. Lo he cualificado igualmente.
- **`serial_number` sin cualificar** — `item_inv_assigned_event` no tiene esa
  columna (sus campos son `item_id, event_id, created_at, status, condition,
  updated_at, active`), así que resolvía a `ii.serial_number`. También
  cualificado ahora.

Ninguna de las dos estaba causando daño. Buen ojo igualmente: las dos dependían
de que la *otra* tabla no tuviera una columna con ese nombre, y eso lo rompe
mañana un cambio de esquema ajeno.

## 3. Lo que no podíais ver: la condición recibía el estado

`SimpleInventoryItem`, la estructura que parsea `allInventoryOfEvent`, **solo
tenía `serial_number` y `status`**. El segundo `CASE` —el de `iiae.condition`—
se construía con los mismos valores que el primero.

O sea: **cerrar un evento escribía el estado dentro de la columna de condición.**

En vuestro caso no se notaba porque mandabais `status` y `condition` iguales
(`"Operational"` los cinco). En producción se nota así:

```
condition vs status:  total 75.000 · iguales 75.000 · distintos 0
```

**Ni una sola fila** de las 75.000 tiene una condición distinta de su estado. La
columna nunca ha contenido un valor propio.

Arreglado añadiendo el campo. Y **es opcional a propósito**: si un ítem llega sin
`condition`, no se emite su `WHEN` y la fila conserva la que tenía. Escribir una
cadena vacía habría sido peor que no tocarla.

> **Lo que necesito confirmar de vosotros:** que la clave en cada objeto de
> `allInventoryOfEvent` se llama exactamente **`condition`**. Si se llamara de
> otra forma, el efecto no es un error — la condición simplemente se queda como
> está —, pero entonces seguiríais sin poder fijarla.

## 4. Y la consulta se ejecutaba dos veces

Había un `db.Exec` anterior con la lista de valores **incompleta** (le faltaban
los pares del segundo `CASE`), y su error lo recogía un bloque vacío:

```go
res, err := db.Exec(query, values...)   // <- siempre fallaba
if err != nil {
    // If construction failed before exec? No, strict strings.Join
}
res, err = db.Exec(query, finalValues...)
```

Eliminado. Ahora hay una sola ejecución y su error se propaga.

---

## 5. Cierres anteriores: sí, hay que mirarlos

Los números de producción, hoy:

| | |
|---|---|
| Filas cerradas cuyo ítem tiene serial **puramente numérico** | **3.054** |
| Eventos afectados | **11** — 342, 432, 434, **437 (2.900 filas)**, 615, 671, 673, 677, 679, 680, 681 |
| Estado con el que quedaron esas filas | **`Operational`, las 3.054** |

Una precisión sobre vuestro §3, porque cambia lo que hay que buscar: la consulta
**sí actualizaba algo**. `updated_at` y `active = false` están fuera del `CASE`,
así que se aplicaban. Lo que no se aplicaba era `status` ni `condition`: se
quedaban con lo que tuvieran antes, que es `Operational` por defecto.

**Qué significa en la práctica:** si en alguno de esos 11 eventos un equipo acabó
`Damaged` o `Lost`, ese hecho **no llegó a MySQL**. El evento se cerró en verde y
la unidad figura como operativa.

**La buena noticia:** el estado real de esos cierres sigue en Mongo, que es de
donde sale `groupingDevicesFromNoSQL`. Es reconstruible.

Podemos preparar un cotejo evento por evento entre el historial de Mongo y lo que
hay hoy en `item_inv_assigned_event`, y una corrección para las filas que
discrepen. **No lo he ejecutado**: es escritura sobre datos históricos y quiero
vuestra confirmación y la de negocio antes. Decidnos si lo queréis y con qué
alcance — los 11 eventos o solo los recientes.

---

## 6. Cuándo estará vivo

Esto es el **worker de Go**, no Node, así que **no basta con desplegar el
servidor**: hay que recompilar el binario en la máquina de producción
(`scripts/restart-go-worker.ps1`, que para, construye, arranca y comprueba).

**Hasta ese `go build`, el error 1292 sigue igual.** Os avisamos cuando esté.

## 7. Lo que este documento no afirma

**No he podido compilar el cambio**: en el equipo de desarrollo no hay
herramientas de Go. Lo que sí verifiqué es lo que más suele romperse en este tipo
de consulta —que los `?` y la lista de valores queden alineados— reproduciendo la
construcción y contándolos: 10 marcadores y 10 valores para un lote de prueba de
dos unidades, en el orden correcto (pares de `status`, pares de `condition`,
`update_at`, `event_id`, y los seriales del `IN`).

La comprobación de que compila y de que la consulta corre de verdad es el
despliegue del punto 6.

## 8. Lo que no cambia para vosotros

Nada. El mismo cuerpo funciona, y confirmamos vuestros cuatro puntos del §6: no
hace falta reintentar, las dos fases siguen en el mismo orden, el estado parcial
por lotes sigue siendo posible por encima de 500 unidades (ese es el tamaño de
lote), y lo del service worker no tiene nada que ver.
