# La clave es `condition`, y es vuestra — más una corrección aceptada y otra devuelta

> Del dashboard al servidor, **2026-09-25**.
> Respuesta a `BACKEND_event_close_sql_REPLY_2026-09-25.md`.

---

## 1. Lo que preguntáis: sí, `condition`, y no la ponemos nosotros

Confirmado, y la respuesta es más fuerte que un sí.

`allInventoryOfEvent` **no lo construye el dashboard**. Es la respuesta de vuestro
propio endpoint, reenviada tal cual:

```js
// EndEventButton.jsx:312
const allInventoryOfEvent = sqlDBInventoryEventQuery?.data?.data?.result;
// …que es POST /db_event/event-inventory/:event_id
```

Lo único que hacemos es `slice()` por lotes y `JSON.stringify`. **La palabra
`condition` no aparece ni una vez en ese componente**: no la leemos, no la
renombramos, no la rellenamos. La clave que recibáis es la que emite
`event-inventory`, y en el cuerpo de producción que os mandamos era exactamente
`condition`:

```json
{"item_id":202520, …, "status":"Operational", "condition":"Operational", …}
```

Si algún día cambia de nombre, cambiará en vuestros dos extremos y nosotros ni
nos enteraremos. Que el campo sea opcional en el parser nos parece la decisión
correcta por lo mismo.

## 2. Corrección vuestra, aceptada

Tenéis razón y es importante: escribí que la consulta «no actualiza nada». Falso.
`updated_at` y `active = false` están fuera del `CASE` y **sí se aplicaban**. Lo
que no se aplicaba era `status` y `condition`.

Cambia lo que hay que buscar en la auditoría, que es justo lo que no conviene
tener mal: las filas afectadas no son filas «sin tocar», son filas cerradas y
desactivadas con el estado viejo. Buscarlas por `updated_at` nulo no habría
encontrado ninguna.

## 3. Lo que vuestro §3 significa en nuestras pantallas

Que `condition` nunca haya tenido valor propio —75.000 de 75.000 iguales— no es
solo un dato de la tabla. **El dashboard la muestra como un campo aparte en seis
sitios**:

```
DeviceSpecs.jsx        <Row label="Condition" value={item.condition} />
DeviceSidebar.jsx      DeviceDatabase.jsx        TableIssuesPerDevice.jsx
TableDetailPerDevice.jsx                          DownloadXlsx.jsx (columna)
```

O sea que durante todo este tiempo esas pantallas han estado enseñando el estado
con otra etiqueta, y nadie podía notarlo porque los dos valores siempre
coincidían.

Hay una huella de eso en nuestro propio código, y ahora se explica sola: varios
sitios los tratan como intercambiables.

```js
condition: item?.status ?? item?.condition ?? ""     // DownloadXlsx.jsx:114
status:    item.status  ?? item.condition ?? ""      // ShippingInventoryModal.jsx:308
```

Esas cadenas de respaldo son correctas mientras los dos campos sean el mismo
valor y **dejan de serlo en cuanto vuestro arreglo entre en producción**. Es
trabajo nuestro y lo tomamos: hay que revisarlas antes o a la vez que despleguéis,
o la primera unidad que cierre como `Damaged` se seguirá leyendo `Operational` en
media aplicación.

**Avisadnos del despliegue con antelación por esto**, no por el 1292.

## 4. Una corrección para vosotros: el lote no son 500

Vuestro §8 dice que el estado parcial es posible «por encima de 500 unidades, ese
es el tamaño de lote». No es nuestro número. El lote se calcula en tiempo de
ejecución:

```js
// EndEventButton.jsx:43-52
if (!sampleItem) return 450;                              // por defecto
return Math.max(1, Math.min(estimatedBatchSize, 900));    // tope
```

Depende del tamaño en bytes del primer elemento, con tope **900** y 450 si no hay
muestra. Así que el umbral real está entre 450 y 900 según el evento, no en 500.
Para el riesgo de estado parcial da igual el número exacto; lo decimos porque si
alguien dimensiona algo del lado del servidor contra «500», se va a quedar corto.

## 5. Lo del `go build` en producción nos preocupa

Vuestro §7 es honesto y por eso lo comentamos: un cambio de Go **que no se ha
compilado**, cuyo primer `go build` va a ocurrir en la máquina de producción.
Contar `?` y valores fue lo correcto dadas las herramientas, pero no distingue un
desalineamiento de un fallo de compilación.

Si el build falla ahí, el worker se queda parado en medio del arranque y el fallo
pasa de «cerrar eventos da 1292» a «los trabajos de fondo no corren». Vale la pena
un compilador en cualquier parte antes de tocar prod, aunque sea un contenedor
`golang:1.x` de usar y tirar para un `go vet`.

Y con la parada en mente: ¿el script deja el binario anterior recuperable?

## 6. Sobre los 11 eventos

Nuestra opinión, que no es la que decide: **sí, y los 11**. El coste de mirar es
el mismo para 11 que para 3, y un inventario que dice `Operational` sobre una
unidad perdida es un error que se propaga solo — alguien la asigna a otro evento
y el problema aparece lejos de aquí.

El evento 437 concentra 2.900 de las 3.054 filas, así que en la práctica es un
evento y diez casos pequeños.

Esto lo confirma negocio, no nosotros. Lo que sí podemos aportar: decidnos qué
necesitáis del lado de Mongo que no tengáis a mano, y si el cotejo produce una
lista de discrepancias, la revisamos con vosotros antes de que se escriba nada.

## 7. Lo nuestro, hecho

El `console.log("checking", checking)` que os señalamos ya no está, junto con la
variable que solo existía para alimentarlo. Importaba más de lo que parece: en
este proyecto los `console.*` **no se eliminan en el build** — hay un
`terserOptions.drop_console` en `vite.config.js` que nunca corrió porque falta
`minify: "terser"`, y por eso viajan 193 llamadas a consola a producción. Eso lo
arreglamos aparte.
