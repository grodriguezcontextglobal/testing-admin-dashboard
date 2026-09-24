# El contrato de estado se puede implementar tal cual — tres avisos de nuestro lado

> Del dashboard al servidor, **2026-09-24**.
> Respuesta a `FRONTEND_status_page_integration.md`.
> **Actualizado el mismo día: ya está construido.** Ver §5.
> **Veredicto: nada bloquea.** No pedimos cambios al contrato. Lo que sigue son
> cosas de nuestra base de código que decidirán si la pantalla dice la verdad, y
> dos preguntas que el documento no cubre.

---

## 1. Lo que comprobamos, y salió bien

**El service worker no va a tocar vuestra respuesta.** Era la primera duda, y la
peor de las posibles: un estado cacheado es exactamente el «verde cuando no» que
vuestro §5 prohíbe, y lo habría causado nuestra propia infraestructura sin que
nadie lo escribiera.

No pasa. El `runtimeCaching` de `vite.config.js` se registra **solo** contra
`apiOriginPattern`, que son nuestros dos orígenes de API:

```js
runtimeCaching: apiOriginPattern ? [ { urlPattern: apiOriginPattern, ... } ] : []
```

Un GET a `devitrak-status.cacaminero.workers.dev` no casa con ningún patrón y
sale a la red sin pasar por Workbox. El `navigateFallback: "/index.html"` solo
afecta a navegaciones, no a `fetch`. Vuestro `cache-control` de 30 s es el único
cacheo que habrá, que es lo que queríais.

**Tampoco hay CSP en el cliente** que bloquee el origen: no declaramos ninguna en
`index.html`. Pero el dashboard se sirve desde IIS, y si ahí hay una cabecera
`Content-Security-Policy` con `connect-src`, habrá que añadir vuestro origen.
**No lo hemos verificado** — no tenemos ese host delante. Quien administre el
despliegue tiene que mirarlo antes de dar la integración por hecha.

---

## 2. Tres trampas de nuestro lado

### 2.1. No se puede llamar con nuestro cliente de API, y nuestras propias reglas empujan a hacerlo

`CLAUDE.md` dice, con razón y en mayúsculas de facto: *importa los clientes de
`src/api/devitrakApi.jsx`, nunca crees instancias de Axios ad hoc*. Aplicada aquí,
esa regla filtra credenciales.

`devitrakApi.jsx:77` monta un interceptor de petición que añade, a **toda**
petición que pase por el cliente:

```js
config.headers["x-token"]     = localStorage.getItem("admin-token");
config.headers["s-token-lq"]  = localStorage.getItem("s-token-lq");
```

Apuntar ese cliente a `cacaminero.workers.dev` le entrega los dos tokens de
sesión a un origen de terceros. No es hipotético: es lo que hace el interceptor,
sin condición de origen.

La llamada tiene que ser un `fetch` pelado, sin cabeceras propias y sin
`credentials`. **Queda anotado como la excepción explícita a esa regla**, porque
la siguiente persona que abra el fichero va a intentar «arreglarlo» usando
`devitrakApi`.

### 2.2. Los defaults de react-query rompen vuestra regla de una vez por minuto

`main.jsx:36` construye el cliente sin opciones:

```js
const queryClient = new QueryClient();
```

En react-query 4 eso significa `staleTime: 0` y `refetchOnWindowFocus: true`. Un
`useQuery` escrito de la forma natural sondearía **en cada montaje y cada vez que
la pestaña recupera el foco** — en un dashboard que la gente deja abierto y
alterna con el correo, eso son muchas más de una por minuto.

No es culpa de vuestro diseño, pero vuestra petición del §5 no se cumple sola.
Hay que pedirlo a mano:

```js
staleTime: 60_000,
refetchInterval: 60_000,
refetchOnWindowFocus: false,
```

### 2.3. `message` se pinta como texto, y eso ya lo hace React

Pedís escaparlo. En JSX, `{incident.message}` se escapa solo; el riesgo sería
`dangerouslySetInnerHTML`, que aquí no se va a usar. Lo decimos para que conste
que la regla está atendida y no por descuido: en esta base hay un sitio que sí
pinta HTML —`DisplayArticle.jsx`, que sanea con DOMPurify antes— y conviene que
nadie copie ese patrón para esto.

---

## 3. Lo que el contrato no cubre: ya tenemos otras dos fuentes de verdad

Esto es lo que más nos interesa resolver con vosotros, porque no es un campo del
JSON: es qué pasa cuando la pantalla y la aplicación no dicen lo mismo.

### 3.1. El cliente ya hace failover entre dos orígenes

`src/api/serverManager.js` expone `switchServer()` e `initializeActiveServer()`:
el dashboard alterna entre dos orígenes de API cuando el primero no responde.

Es información de primera mano, y local. Si el cliente ya saltó al respaldo, esta
sesión *sabe* que algo va mal, puede que antes que vuestro sondeo y puede que
cuando vuestro sondeo no lo vea nunca (vosotros miráis desde fuera; el failover lo
dispara lo que le pasa a este navegador).

**Pregunta:** ¿el panel debe reflejar solo vuestro JSON, o también que esta sesión
está corriendo sobre el respaldo? Nuestra propuesta es que sí, pero como una línea
aparte y con otras palabras — «estás conectado al servidor de respaldo» no es lo
mismo que «el servicio está degradado», y mezclarlas hace el panel menos fiable,
no más.

### 3.2. «Todo operativo» mientras al usuario no le funciona nada

Tenemos cola de mutaciones: sin red, los POST y PUT se encolan y se reintentan
(`backgroundSync`, 24 h de retención). En ese momento el usuario ve que no pasa
nada y el panel, si vuestro Worker responde por otra vía o desde caché, diría
«All systems operational».

Técnicamente cierto y prácticamente confuso. Y el caso inverso también importa:
si nuestro `fetch` a vuestro Worker falla, el estado es `unknown` — pero la causa
más probable es **nuestra** red, no la vuestra. Por eso el texto de `unknown` no
debería insinuar que el servicio está caído, sino decir que no se pudo consultar
el estado. Vuestra regla del §5 es correcta; lo que proponemos es afinar la
redacción para que no mienta en la otra dirección.

---

## 4. Vuestras tres preguntas

**1. ¿También en la app de asistentes?** No por ahora. Pero ojo, porque el
destino cambió respecto a lo que suponía vuestro §6: **esto no es un panel
interno para staff**. Es una ruta pública, `/status`, pensada para enseñarle a
clientes y a posibles clientes que el servicio se vigila y que lo decimos en voz
alta cuando no va. Es un argumento de venta además de una pantalla operativa.

Eso tiene una consecuencia que conviene que sepáis: **`background_jobs` en ámbar
lo va a ver un cliente potencial**. Vuestro §6 avisaba precisamente de eso, y la
decisión tomada es asumirlo — la credibilidad viene de no esconderlo. Lo que sí
hicimos fue cuidar la redacción para que un componente degradado se lea como
información, no como una disculpa.

**2. ¿Aviso activo cuando `overall` cambia con la pestaña abierta?** Sigue en pie
lo dicho, y ahora con más motivo de no abusar: en una página pública un banner
permanente es peor que en una interna. La página se refresca sola cada 60 s, que
para este uso basta.

**3. ¿Historial de incidentes resueltos?** No embebido. La página enlaza a la
vuestra completa con el texto "Full status history", que es exactamente para
quien quiera el detalle.

---

## 5. Lo que se construyó

Está hecho, no propuesto.

- **`src/hooks/useServiceStatus.js`** — `fetch` pelado con `credentials: "omit"`,
  `staleTime` y `refetchInterval` de 60 s y `refetchOnWindowFocus: false`. Las
  reglas de §2 están fijadas por **8 pruebas**, no por buena voluntad: que un
  fallo de red sea `unknown` y nunca `operational`, que un 503 también lo sea,
  que un cuerpo que no es vuestro documento también, que un `overall` que no
  conocemos no se pinte en verde, y que un componente nuevo se transporte tal
  cual en vez de filtrarse.
- **`src/pages/status/ServiceStatusPage.jsx`** — titular con el estado general,
  la lista de componentes recorrida (nunca codificada), panel de incidente con
  el mensaje actual destacado y las actualizaciones anteriores debajo, y enlace
  a vuestra página. `uptime90d: null` omite la línea; ni 0 % ni 100 %.
- **Ruta `/status` en los dos árboles.** En `NoAuthRoutes` porque un posible
  cliente llega sin cuenta, y en `AuthRoutes` porque el catch-all del primero
  manda a `/login` y un cliente con sesión abierta quedaría fuera. Es el mismo
  patrón que ya usa `ReceiptPage`.
- `message` se pinta como cadena en JSX, así que React lo escapa. Ningún
  `dangerouslySetInnerHTML`.

Verificado: 52 pruebas verdes en `src/hooks` y `src/routes`, ESLint limpio y
build en pie — la página sale como su propio chunk de 8,21 kB (3,08 gzip).

**Lo único que sigue abierto es §3**, que es lo que cambia lo que se ve en
pantalla y no se puede decidir desde aquí.
