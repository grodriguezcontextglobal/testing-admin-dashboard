# Teníais razón con `row`: ahora se devuelve el vuestro

> Del servidor al dashboard, 2026-09-22.
> Respuesta a `FRONTEND_inventory_import_endpoint_REPLY_2026-09-22.md`.

---

## 1. `row` — arreglado, y era un fallo nuestro

Aceptado tal cual lo pedisteis. **Mandad `row` en cada unidad y se devuelve
igual** en `errors[]` y en `failed[]`. El servidor ya no calcula nada.

```jsonc
{ "row": 4, "serial_number": "AUD-2", "category_name": "Audio", "location": "Miami, FL" }
```

El diagnóstico era correcto y el fallo es más feo de lo que lo pintáis: no es que
`índice + 2` fuera frágil, es que **estaba mal** en cuanto descartáis una sola
fila, que es el caso normal. El mensaje mandaba a arreglar una fila que ni
siquiera se envió, y decía "Excel" mientras contaba posiciones de array. Lo
correcto es lo que proponéis: el dato lo tenéis vosotros, viaja con la unidad y
nadie lo deriva.

**Podéis quitar `spreadsheetRowFor` y su traducción de vuelta** en cuanto
despleguemos. Hasta entonces dejadla: hoy el endpoint todavía responde 404 y el
camino viejo no pasa por aquí.

Qué pasa si una unidad llega sin `row`: se cae a su posición en el array + 2. Es
el único número que se puede dar cuando nadie dijo de dónde salió la unidad, y
**ya no se llama "fila de Excel" en ninguna parte** — ni en el documento de
contrato ni en los mensajes. Un `row` que no sea un entero positivo (`"catorce"`,
`-3`, `2.5`) se ignora y usa el respaldo, en vez de propagar una fila inventada.

Hay cuatro pruebas nuevas fijando esto, incluida la que comprueba que el `row`
llega hasta el `failed[]` del resultado del job y no solo hasta el 400.

## 2. El fallback por 404: de acuerdo, con un matiz

Nos parece bien, y es mejor que esperar a nuestra confirmación. El matiz es que
**404 no es la única forma en que puede no estar**: si desplegamos el código pero
el tipo de job todavía no tiene worker, la ruta existe y responde `202` — y el
job no lo coge nadie. No os pasaría nada visible: un `jobId` que se queda en
`pending` para siempre.

No es hipotético, es el orden de pasos de nuestro despliegue, y lo tenemos
documentado precisamente para no equivocarnos. Lo decimos para que, si veis un
job encolado que no avanza en unos minutos, **nos lo digáis en vez de asumir que
tarda**. No hace falta que el cliente lo detecte.

## 3. Lo del preview

Gracias por cambiar la frase. Esa es exactamente la diferencia: *"se crean si el
rol puede crearlas"* hace que nuestro 403 se lea como una regla y no como una
avería.

## 4. Una que apareció al revisar vuestro ejemplo

`isItInContainer` está en vuestra lista de `defaults` pero **no es una columna de
`item_inv`** — la tabla tiene `container`, `containerSpotLimit` y `container_id`,
y el bulk viejo tampoco lo escribe. Se ignora sin error.

Si esperabais que se guardara en algún sitio, decidlo: hay que decidir **dónde**
antes, porque hoy no hay dónde. `containerId` sí se guarda, en `container_id`.

## 5. Estado

Con el cambio de `row`: 39 pruebas propias y 1387/1388 en la suite completa (el
único fallo es un gap conocido y ajeno a esto).

Sigue **sin desplegar**. Os avisamos el mismo día, y entonces borráis los cuatro
puntos de vuestra §5 en el orden que decís.
