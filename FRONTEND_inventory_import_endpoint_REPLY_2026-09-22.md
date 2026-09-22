# Cliente listo para `bulk-item-from-spreadsheet` — y una cosa que no cuadra

> Del dashboard al servidor, 2026-09-22.
> Respuesta a `FRONTEND_inventory_import_endpoint_RESPONSE_2026-09-22.md`.

---

## 1. Está implementado y no espera al despliegue

Nos pedisteis no cambiar el cliente a una sola petición hasta que confirmarais.
No lo hemos cambiado: **lo hemos añadido delante**.

Cada import intenta primero `POST /db_item/bulk-item-from-spreadsheet`. Si
contesta **404**, cae al camino viejo de una petición por grupo, que es el que
funciona hoy. El día que despleguéis, el primer intento deja de fallar y el
cliente usa el endpoint nuevo **sin release nuestro**.

Es el mismo patrón que ya usamos para el 400 de los campos `_by_serial`: el
cliente negocia con el servidor que tenga delante, en vez de llevar una
constante que alguien tiene que acordarse de cambiar.

Qué manejamos de vuestras respuestas:

| | |
|---|---|
| `202` | encolamos el `jobId` en `BackgroundJobsTracker` y avisamos de `skipped` |
| `400` | mostramos la primera fila y su motivo, más cuántas más hay |
| `403` | mostramos **vuestro** `msg` tal cual — nombra la locación o la categoría, y eso es accionable |
| `409` | "este import ya está corriendo", sin reintentar con la misma clave |
| `404` | camino viejo, en silencio |

El techo de 10.000 se comprueba **antes** de subir nada, con el número en el
mensaje. Cuando llegue un 400 leeremos `limit` del cuerpo en vez de nuestra
constante.

## 2. Lo que no cuadra: `row` no apunta a la fila que la persona ve

Decís, y es la decisión correcta:

> **`row` es el número de fila de Excel**, contando la cabecera — no el índice
> del array.

El problema es que esas dos cosas sólo coinciden si el array que os mandamos
tiene todas las filas del fichero, y no las tiene. **Nosotros descartamos filas
antes de enviar**: las que no traen alguna columna obligatoria se quedan fuera y
se le reportan a la persona en el preview. Así que el array va comprimido.

Un ejemplo con números:

```
fila 2  AUD-1   ✓ enviada  -> units[0]
fila 3  (sin serial_number) descartada, nunca llega
fila 4  AUD-2   ✓ enviada  -> units[1]
```

Si `AUD-2` os falla, calculáis `row = 1 + 2 = 3` y le decimos a la persona que
arregle la fila 3 — que es una fila que ni siquiera mandamos, y que no tiene
nada que ver con el problema.

**Lo hemos tapado por nuestro lado**: guardamos de qué fila salió cada unidad y
traducimos vuestro `row` de vuelta antes de enseñarlo
(`spreadsheetRowFor`, con prueba). Funciona, pero depende de que vuestra
derivación siga siendo exactamente `índice + 2`. Es un acoplamiento que no se ve
desde vuestro lado y que se rompe en silencio.

**Lo que pedimos**: aceptad un `row` opcional por unidad y devolvedlo tal cual en
`errors[]` y en `failed[]`. Nosotros ya lo tenemos; vosotros no tenéis que
calcular nada y deja de haber una convención implícita entre los dos.

```jsonc
{ "row": 4, "serial_number": "AUD-2", "category_name": "Audio", ... }
```

Si preferís no tocarlo, decidlo y quitamos la traducción — pero entonces los
números de fila de vuestros mensajes son los del array, y conviene que el texto
no diga "Excel".

## 3. Lo del rol acotado nos cambió una frase

> Un rol acotado por locación no crea locaciones nuevas de rebote.

Estamos de acuerdo con el razonamiento, y nos hizo ver que el preview prometía
algo que no podemos cumplir. Decía *"5 location(s) will be checked and created if
missing"*. Ahora dice que se crean **si el rol puede crearlas**, para que vuestro
403 se lea como lo que es y no como un fallo.

## 4. Las tres decisiones, confirmadas

- **Duplicados**: insertar lo nuevo y reportar el resto es lo que queríamos. Nos
  vale que el repetido dentro del fichero salga en `skipped` y el que ya existe
  en `failed` — son dos causas distintas y el texto lo dirá así.
- **Transacción por lote de 500 con reintento fila a fila**: no se nos había
  ocurrido que MySQL no dice qué fila rompe el lote. Es mejor que lo que
  pedimos.
- **10.000**: bien. Lo aplicamos antes de subir.

Y gracias por el respaldo de `defaults` en el servidor. Los mandamos igual, pero
teníais razón: un import no puede depender de que nos acordemos de
`display_item`.

## 5. Cerrado tras vuestro `FRONTEND_inventory_import_row_2026-09-22.md`

- **`row`**: ya va en cada unidad. Gracias por aceptarlo en vez de defender la
  derivación.
- **`isItInContainer`**: no lo esperábamos guardado, y lo hemos quitado del
  cuerpo. Un import nunca mete una unidad dentro de un contenedor, así que el
  valor que mandábamos era siempre "no". No hay nada que decidir.
- **Un `202` sin worker**: entendido. No lo detectamos desde el cliente, como
  decís. Si vemos un job encolado que no avanza en unos minutos os lo decimos en
  vez de esperar.

`spreadsheetRowFor` se queda hasta el despliegue, porque hoy sigue contestando
404 el endpoint y el 400 que llega es el de la versión vieja. Entra en la lista
de abajo.

## 6. Hecho — desplegasteis y lo borramos el mismo día

Los cinco, en el orden que dijimos:

1. El fallback de una petición por grupo en `DocumentInventoryXLSXUpload`.
2. `IMPORT_MODES.COMPATIBLE` y el troceo, en `inventoryImportPlan.js`.
3. Nuestro bucle de `verifyAndCreateLocation` — ya sólo vive en ese fallback.
4. `inventoryImportPayload.js` entero, que es el constructor del payload viejo.
5. `spreadsheetRowFor` — **este se queda**, y es el único. Reconoce las dos
   formas: si el número ya es una de las filas que mandamos, lo deja en paz.
   Cuesta cinco líneas y cubre cualquier entorno que todavía no tenga vuestro
   cambio. Lo quitamos cuando no quede ninguno.

928 líneas fuera, 93 dentro.

Dos cosas que vuestro despliegue volvió innecesarias, y que no estaban en la
lista porque no las habíamos visto:

- **El aviso de conflictos del preview.** Decía que un modelo tenía más de una
  marca en el fichero y que se usaría la más común. Eso sólo tenía sentido
  mientras la marca fuera un valor de grupo y hubiera que elegir una. Ahora cada
  unidad lleva la suya, así que dos marcas distintas en el mismo modelo no son
  un conflicto: son lo que el fichero dice.
- **La subida de imágenes ya no habla de grupos.** Necesita saber categoría y
  modelo para nombrar la imagen en Cloudinary; lo sacaba del plan y ahora lo
  saca de la primera unidad que lleva esa foto. Misma información, sin
  intermediario.

Y un cambio de comportamiento que conviene que sepáis: **un 404 ya no cae a
ningún sitio**. Antes significaba "todavía no está desplegado"; ahora significa
"este entorno no está actualizado" y lo dice con esas palabras. Si alguien de
soporte ve ese mensaje, es el entorno, no el import.
