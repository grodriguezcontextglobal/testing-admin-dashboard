# Backend: logo y nombre de Devitrak rotos en las plantillas de correo (2026-10-07)

Para el agente de backend. **El dashboard no tiene nada que cambiar**: el
preview de Email branding pinta, tal cual y en un iframe, el HTML que devuelve
`POST /api/nodemailer/branding-preview`, que pasa por las mismas plantillas que
un envío real. Las URLs de estas dos imágenes viven en esas plantillas
(`nodeMailer`), y el dashboard no las ve ni las elige.

## 1. Qué se ve

Profile → Email branding → Preview, en cualquier plantilla de la lista
(`GET /api/nodemailer/branding-preview/templates`): **el logo de Devitrak y el
nombre de Devitrak salen como imagen rota.**

Si en el preview están rotos, lo esperable es que también lo estén en los
correos reales que llevan la marca de Devitrak, que son todos los de una
compañía con el branding apagado (el valor por defecto) y el correo de
cuenta/plataforma, que no se personaliza. **Conviene confirmarlo con un envío
real**, porque hay otra explicación posible: si la plantilla incrusta la imagen
como adjunto (`cid:`), un cliente de correo la resuelve y un navegador no. En
ese caso el envío real estaría bien y solo el preview estaría roto, y la
solución es la misma de abajo.

## 2. URLs nuevas

Comprobadas el 2026-10-07: las dos responden **200 `image/svg+xml`**.

| Imagen | URL |
|---|---|
| Nombre (wordmark) | `https://res.cloudinary.com/dpdzkhh07/image/upload/v1791386367/devitrak_name_wls6qd.svg` |
| Logo (isotipo) | `https://res.cloudinary.com/dpdzkhh07/image/upload/v1791386367/devitrak_login_jeki3x.svg` |

Ojo con los enlaces `https://asset.cloudinary.com/dpdzkhh07/…`: son la página
del asset en la consola de Cloudinary (`text/html`), no la imagen, y en un
`<img>` también salen rotos. Las de arriba son las de entrega directa.

## 3. Son blancas: el fondo tiene que contrastar

- **Nombre:** todo `fill="white"`.
- **Logo:** `#fff` con dos trazos en gris `#8A9DAD`.

Sobre el fondo blanco de un correo **desaparecen**. La fila o celda que las
contiene (normalmente la cabecera) necesita un fondo oscuro. Propuesta: el
azul de marca del dashboard, **`#021833`** (`--brand-600`, "Deep Blue").

Notas para que aguante en clientes de correo:

- Poner el color **en la celda de la tabla** (`<td bgcolor="#021833"
  style="background-color:#021833">`), no solo en un `div` ni con
  `background-image`: Outlook ignora fondos en `div` y en imágenes de fondo.
- **SVG en correo:** Gmail y Outlook de escritorio no muestran SVG en `<img>`.
  Si el correo real tiene que verse ahí, hace falta una versión **PNG** de las
  dos. Cloudinary la sirve cambiando la extensión, comprobado el 2026-10-07
  (200 `image/png` en las dos):
  `…/v1791386367/devitrak_name_wls6qd.png` y
  `…/v1791386367/devitrak_login_jeki3x.png`. **Recomendado usar el PNG en la
  plantilla**, que se ve en todos los clientes y también en el preview.
- `width`/`height` explícitos en el `<img>` y un `alt` ("Devitrak"), para que
  un cliente que bloquea imágenes deje un hueco del tamaño correcto y un texto.

## 4. Qué devolver

Un sí cuando esté desplegado. Desde el dashboard se comprueba abriendo el
preview, sin tocar código.
