# Estado del servicio en el dashboard — contrato

> Del servidor al dashboard, **2026-09-24**.
> Endpoint ya desplegado y estable. No necesita token ni cabeceras.

---

## Lo que hay

```
GET https://devitrak-status.cacaminero.workers.dev/api/status.json
```

Sin autenticación, `access-control-allow-origin: *`, y con `cache-control` de 30
segundos. **Se llama desde el navegador**, no desde nuestro backend — el porqué
está en §5 y es la decisión más importante de todo el documento.

Hay también una versión en iframe (`/embed`) si en algún momento hace falta algo
inmediato, pero si vais a pintarlo con vuestros componentes, ignoradla.

---

## 1. La respuesta

```json
{
  "overall": "operational",
  "components": [
    {
      "key": "application",
      "name": "Application",
      "description": "The service responds over the public internet",
      "status": "operational",
      "since": "2026-09-24T13:06:45.516Z",
      "uptime90d": 100
    },
    {
      "key": "core_services",
      "name": "Core services",
      "description": "Database and supporting services",
      "status": "operational",
      "since": "2026-09-24T13:06:45.516Z",
      "uptime90d": 99.87
    },
    {
      "key": "background_jobs",
      "name": "Background jobs",
      "description": "Emails, exports and bulk operations",
      "status": "operational",
      "since": "2026-09-24T14:02:11.004Z",
      "uptime90d": null
    }
  ],
  "incident": null,
  "generatedAt": "2026-09-24T14:05:00.000Z"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `overall` | `"operational" \| "degraded" \| "down" \| "unknown"` | El titular |
| `components[].key` | string | **Estable.** Es por lo que hay que identificar, no por el nombre |
| `components[].name` / `description` | string | Texto listo para pintar, en inglés |
| `components[].status` | los mismos cuatro valores | |
| `components[].since` | ISO 8601 o `null` | Desde cuándo está en ese estado |
| `components[].uptime90d` | number o **`null`** | Ver §3 |
| `incident` | objeto o `null` | Ver §4 |
| `generatedAt` | ISO 8601 | Cuándo se compuso esta respuesta |

**La lista de componentes va a crecer.** Recorredla, no la codifiquéis: hoy son
tres y la idea es publicar más a medida que el servidor sepa contarlos. Un
componente nuevo no debe romper la pantalla ni requerir un despliegue vuestro.

---

## 2. Los cuatro estados, y el que importa

| Estado | Qué significa | Cómo pintarlo |
|---|---|---|
| `operational` | Funciona | Verde |
| `degraded` | Funciona con limitaciones. El trabajo **no se pierde, se retrasa** | Ámbar |
| `down` | No funciona | Rojo |
| `unknown` | **No tenemos datos recientes** | Gris, y **nunca verde** |

`unknown` es el que suele pintarse mal. No significa «probablemente bien»:
significa que el dato caducó o que nunca llegó. Si se pinta en verde, la
pantalla miente exactamente en el momento en que más cara sale la mentira.

Por la misma razón, `overall` puede ser `unknown` aunque haya componentes en
verde: no tener datos de uno de ellos no es estar bien.

---

## 3. `uptime90d` puede ser `null`, y no es un error

Los componentes que **se sondean** cada minuto tienen porcentaje. Los que se
alimentan de eventos internos —hoy `background_jobs`— **no**: su historial son
cambios de estado, no medidas de tiempo, y calcular un porcentaje con eso sería
inventarse una medición que nadie tomó.

Cuando llegue `null`, **no pintéis «0%» ni «100%»**: omitid la línea.

---

## 4. Incidentes

`incident` es `null` casi siempre. Cuando no lo es:

```json
{
  "incident": {
    "id": 4,
    "title": "Delayed emails and exports",
    "state": "monitoring",
    "started_at": "2026-09-24T14:10:00.000Z",
    "updates": [
      { "at": "2026-09-24T14:40:00.000Z", "state": "monitoring",
        "message": "A fix has been applied and we're monitoring the results." },
      { "at": "2026-09-24T14:12:00.000Z", "state": "investigating",
        "message": "We're investigating an issue affecting background jobs." }
    ]
  }
}
```

- `state` ∈ `investigating | identified | monitoring | resolved` — el vocabulario
  estándar de las páginas de estado, para que nadie tenga que aprenderlo.
- `updates` viene **de más reciente a más antiguo**. La primera es la actual.
- `message` es **texto plano escrito a mano**. Escapadlo antes de pintarlo; no lo
  tratéis como HTML ni como Markdown.
- Un incidente resuelto desaparece de aquí (hoy no se publica el historial).

Cuando hay incidente, el mensaje vale más que los puntos de colores: es lo que
la persona quiere leer. Dadle sitio.

---

## 5. Lo que NO hay que hacer

**No lo llaméis desde nuestro backend.** Ni desde Node, ni como proxy en una
ruta de `db.devitrak.net`. Toda la razón de que esto viva fuera de nuestra
infraestructura es que **siga respondiendo el día que la nuestra no responda**.
Un proxy lo vuelve a atar a lo que vigila y anula el diseño entero. La llamada
sale del navegador.

**No pintéis verde cuando la petición falle.** Si el `fetch` da error o agota el
tiempo, el estado es *desconocido*, no *operativo*. Es el mismo principio que la
regla de `unknown`, y es el error que convierte una pantalla de estado en algo
peor que no tener ninguna.

**No consultéis más de una vez por minuto.** El Worker actualiza los datos una
vez por minuto y la respuesta se cachea 30 segundos, así que sondear cada 5
segundos no da información más fresca: solo gasta cuota. Una petición al cargar
la pantalla y otra cada 60 s es suficiente.

---

## 6. Sugerencia de presentación (no es requisito)

La mayor parte del tiempo todo estará en verde, y una franja verde permanente se
vuelve invisible en una semana.

- **Discreto cuando todo va bien**: un punto y «All systems operational» en una
  esquina, o nada.
- **Visible cuando no**: si `overall` no es `operational`, que suba de jerarquía
  —franja arriba— con el mensaje del incidente si lo hay.
- **Enlace a la página completa** (`https://devitrak-status.cacaminero.workers.dev`)
  para quien quiera el detalle o el historial.

Este panel es para `admin.devitrak.net`, o sea para **staff**. Que
`background_jobs` esté degradado es información operativa útil aquí; en una
pantalla de cliente final habría que medir más las palabras.

---

## 7. Preguntas abiertas para vosotros

1. ¿Lo queréis también en la app de asistentes, o solo en el dashboard?
2. ¿Hace falta un aviso activo (toast / banner persistente) cuando `overall`
   cambia mientras la pestaña está abierta, o basta con que se vea al mirar?
3. Si os sirve, podemos exponer el historial de incidentes resueltos — hoy se
   guardan pero no se publican.
