# Cerrar un evento falla: el `CASE` de `device-final-status-refactored` está mezclado

> Del dashboard al servidor, **2026-09-25**.
> **Endpoint:** `POST /api/db_event/device-final-status-refactored` → 500
> **Producción.** Evento 698, compañía `68adafbcdb71eb838c6987f9`, 5 unidades.
> El cliente no puede rodearlo: la consulta está mal formada mande lo que mande.

---

## 1. El error

```
Item final status update failed: Error 1292 (22007):
Truncated incorrect DOUBLE value: 'ACC-2026-000106' (errno 1292) (sqlstate 22007)
```

De la consulta que devolvéis en el mensaje:

```sql
update item_inv_assigned_event as iiae
join item_inv as ii on iiae.item_id = ii.item_id
set iiae.`status` = case ii.serial_number
      when serial_number = :v1 then :v2
      when serial_number = :v3 then :v4
      ...
      else iiae.`status`
    end,
```

## 2. La causa

**El `CASE` mezcla sus dos formas.** MySQL tiene dos, y son excluyentes:

```sql
CASE expr WHEN valor     THEN ...   -- simple: compara expr contra cada valor
CASE      WHEN condición THEN ...   -- buscado: evalúa cada condición
```

Esto es la primera con el cuerpo de la segunda. Escrito así:

```sql
CASE ii.serial_number WHEN serial_number = :v1 THEN :v2
```

`serial_number = :v1` **no es un valor a comparar, es una condición**, y MySQL la
evalúa a `0` o `1`. Luego compara `ii.serial_number` —un varchar— contra ese
entero. Para comparar texto con número, MySQL castea el texto a DOUBLE:
`'ACC-2026-000106'` no es un número, y en modo estricto eso es el 1292.

## 3. Por qué esto es peor que una caída

Un serial alfanumérico rompe la petición, y eso se ve. **Uno numérico no.**

Si el serial fuese `'000106'`, el cast funciona: da `106`, se compara contra `0`
o `1`, no coincide con ningún `WHEN`, y el `CASE` cae al `ELSE iiae.status`. La
consulta **termina bien y no actualiza nada**. El evento se cierra, la respuesta
es 200, y los estados finales de las unidades se quedan como estaban.

O sea que hoy hay dos comportamientos según cómo sea el serial de cada compañía:

| Serial | Qué pasa |
|---|---|
| `ACC-2026-000106` | Error 1292, el cierre falla y se ve |
| `000106` | Sin error, el `CASE` cae al `ELSE` y **no se actualiza nada, en silencio** |

El segundo es el que preocupa. Conviene comprobar si algún cierre "correcto"
anterior dejó los estados sin tocar.

## 4. El arreglo

Cualquiera de las dos formas, pero una sola:

```sql
-- buscado: la condición va entera dentro del WHEN
set iiae.`status` = case
      when ii.serial_number = :v1 then :v2
      when ii.serial_number = :v3 then :v4
      else iiae.`status`
    end
```

```sql
-- simple: el WHEN lleva el valor, no la comparación
set iiae.`status` = case ii.serial_number
      when :v1 then :v2
      when :v3 then :v4
      else iiae.`status`
    end
```

Lo mismo en el segundo `CASE`, el de `iiae.condition` (`:v11`…`:v20`).

### Dos cosas más, ya que se toca

- **`serial_number` sin cualificar** dentro del `CASE`. Si las dos tablas del
  join tienen esa columna, hoy resuelve por precedencia y no por intención.
  Poner `ii.` delante quita la duda.
- **`active = false`** en el `SET`, también sin cualificar, en un `UPDATE` sobre
  un join de dos tablas. Merece un `iiae.` explícito si es lo que se quiere.

## 5. Lo que manda el cliente, para descartarlo

El cuerpo de la petición que produjo el error:

```jsonc
{
  "groupingDevicesFromNoSQL": "{\"ACC-2026-000106\":[…], …}",  // string JSON, 5 claves
  "allInventoryOfEvent": "[{…item_id 202520…}, …]",            // string JSON, 5 filas
  "eventId": 698,
  "update_at": "2026-09-25 09:40:16"
}
```

Cinco unidades, todas con `status` y `condition` = `"Operational"`, y los cinco
`serial_number` casan entre los dos bloques. La consulta que se construyó tiene
5 pares `WHEN` para `status` y 5 para `condition`, así que **el mapeo del cuerpo
a la consulta es correcto**: lo que está mal es cómo se arma el `CASE`, no lo
que recibe.

## 6. Qué hace el dashboard mientras tanto

- El 500 **no se reintenta**: `makeRequestWithRetry` solo reintenta el 413 y
  relanza el resto de inmediato. No os llegan peticiones repetidas por esto.
- El cierre va en dos fases, estados primero y devoluciones después. Como la
  primera lanza, **la segunda no llega a ejecutarse**: no queda un evento con
  las devoluciones aplicadas y los estados sin aplicar.
- Con más unidades de las que caben en un lote sí puede quedar estado parcial:
  si falla el lote 3, el 1 y el 2 ya se escribieron. Con las 5 de este caso fue
  un solo lote.
- El `500 (from service worker)` de las herramientas de red es una etiqueta del
  service worker que pasa la petición tal cual. No cachea POSTs ni toca la
  respuesta; no perdáis tiempo por ahí.

## 7. Lo que pedimos

1. Arreglar los dos `CASE`.
2. Decirnos si hay que revisar cierres anteriores de compañías con serial
   numérico, por el silencio del §3.

No hace falta nada de nuestro lado, ni un despliegue: en cuanto la consulta sea
correcta, el mismo cuerpo funciona.
