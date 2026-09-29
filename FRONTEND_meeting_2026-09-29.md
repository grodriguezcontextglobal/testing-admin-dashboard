# Beta testing — recorrido completo: estudiantes, inventario, eventos

> **Grabación:** `meeting_tasks/Devitrak beta test - 09-29-2026.docx`, 1h 19m,
> martes 2026-09-29. Fredrik Starmark, Cesar A. Caminero (diseño) y Gustavo
> Rodriguez. Compañía de prueba: Beaver Bridges Public School.
>
> **Esto es el acta, no el tracker.** La cita y el minuto de lo que se pidió.
> Lo que quede abierto vive en `FRONTEND_open_tasks_2026-09-24.md`.
>
> **Sin comprobar contra el código**, salvo donde se indica. Los nombres de
> fichero son el punto de partida probable, no una verificación.

---

## 0. Resumen

Recorrido de punta a punta con el vertical de colegios: importar estudiantes,
correo de recordatorio de vencidos, alta de inventario, crear un evento con
documentos, invitar estudiantes, asignar y el historial de un dispositivo.
**24 peticiones.** La mayoría son de texto o estilo. Las más grandes son el
**import de estudiantes**, que es por donde un colegio va a entrar, y el
**audit trail**, que Fredrik pidió empezar por el dispositivo.

| # | Qué | Dónde | Tamaño |
|---|---|---|---|
| **Estudiantes — import** ||||
| 1 | La fecha de nacimiento se rompe con el formato de celda de Excel | `5:03`–`11:36` | grande |
| 2 | Email opcional para menores; usar el del tutor | `12:43`–`14:33` | medio |
| 3 | Más instrucciones en la plantilla, como en la de inventario | `14:33`–`14:52` | chico |
| 4 | Imagen pegada en la celda, sin enlaces — reusar el módulo de inventario | `14:56`–`15:20` | medio |
| 5 | Validar el código postal | `6:01` | chico |
| **Correo de recordatorio de vencidos** ||||
| 6 | Nombre del dispositivo, pie "Powered by Devitrak", logo del colegio | `15:54`–`17:54` | chico |
| 7 | Sobre fondo oscuro, la versión blanca del logo | `17:19` | chico |
| **Inventario — alta** ||||
| 8 | Sublocación escrita y no añadida: no dejar continuar | `20:26`–`20:57` | chico |
| 9 | Botones: "Add additional identifier" secundario, "Queue…" primario y a la derecha | `21:03`–`25:48` | chico |
| 10 | Quitar el "built for you" de la revisión | `26:29`–`27:15` | chico |
| 11 | Texto del serial duplicado | `27:15`–`27:50` | chico |
| **Eventos — alta** ||||
| 12 | La zona de arrastre de documentos parece aceptar archivos del escritorio | `33:01`–`34:58` | chico |
| 13 | El documento arrastrado se dibuja detrás del panel | `40:43`–`42:18` | chico |
| 14 | Documentos vencidos: etiqueta Expired, no asignables, editables en admin | `35:04`–`38:33` | medio |
| 15 | Evento a medio crear aparece como cerrado → Draft | `38:42`–`40:16` | medio — ya en tracker |
| **Eventos — estudiantes y asignación** ||||
| 16 | Registrar estudiantes sin pedir consentimiento | `45:47`–`46:45` | medio |
| 17 | Si se pide consentimiento, dejar registro de cada respuesta | `46:54`–`49:25` | medio |
| 18 | "Health" → "Condition" | `54:19`–`54:52` | chico, pero ver nota |
| 19 | Tiles de inventario del evento: 3 por fila | `1:02:38`–`1:03:46` | chico |
| **Historial del dispositivo y audit trail** ||||
| 20 | El historial sale en desorden; añadir hora, no solo fecha | `1:05:18`–`1:06:28` | chico |
| 21 | Devolver un dispositivo encontrado desde Edit | `1:06:35`–`1:08:22` | medio |
| 22 | Audit trail con usuario, empezando por el dispositivo, con un formato común | `1:08:32`–`1:15:25` | grande |
| 23 | Un `FFF` suelto en el historial | `1:14:18`–`1:14:43` | chico |
| **Sin código** ||||
| 24 | Etiquetas físicas para inventario: de dónde salen | `1:18:10` | Fredrik investiga |

**Repetidas o ya hechas:**
- El aviso de "Update available" **sigue sin cerrarse** (`0:03`). Ya está en
  el tracker §1, y es la segunda reunión seguida en que es lo primero que le
  pasa.
- El serial escrito sin Enter (`55:07`–`56:01`) se arregló hoy mismo en
  `18d7da99`, y así se lo dijiste.

**Decidido, sin tarea:**
- El creador del evento queda asignado como staff (`32:18`–`32:37`).
- El documento "solo para este evento" lo puede añadir cualquier rol que pueda
  crear el evento (`42:47`–`43:23`).
- Shipping: que el número de seguimiento sea obligatorio está bien (`51:49`).
- La vista de checked out / recibos en efectivo del evento está bien (`56:04`).

---

## 1. Estudiantes — import

### 1. La fecha de nacimiento y el formato de celda — `5:03`–`11:36`

Escribió la fecha sin guiones y la fila quedó *blocked*. Primero pensaron que
era el código postal. Era la fecha: Excel había convertido la celda a su
propio formato.

> *"Because, you know, somebody's going to enter here a whole bunch of them, or
> maybe they have an existing spreadsheet and they copy and paste in"* — `10:47`
>
> *"But this needs to work because that's how they're going to install the
> students. They're not going to sit and do it manually."* — `11:27`

Propuso bajar la plantilla como **CSV sin formato** (`10:31`). Hay otras dos
salidas: fijar la columna como texto en la plantilla, o que el parser acepte
también el número de serie de fecha de Excel y las formas más habituales. La
tercera es la que aguanta el copy-paste que él describe.

### 2. Email opcional para menores — `12:43`–`14:33`

El import pedía email y un menor no tiene.

> *"some kids don't have an e-mail address. And what do you do then?"* — `12:43`

Tú propusiste que los campos de contacto pasen a opcionales, y usar el email
del tutor cuando lo haya (`13:53`). Cesar añadió que siempre haya **alguna**
forma de contacto: si no hay email, que se pueda poner dirección o teléfono.
Y que, si el estudiante es menor, se pida explícitamente el contacto del
representante (`14:17`).

Hay que concretar la regla: "al menos un medio de contacto, del estudiante o
del tutor", y para menores, "del tutor".

### 3. Instrucciones en la plantilla — `14:33`–`14:52`

> *"I see that I need to add more instruction because... It's confusing a
> little bit."* — Gustavo, `14:33`

La misma guía que tiene ya la plantilla de inventario
(`inventoryImportTemplate.js`: notas por columna, valores por defecto,
ejemplos).

### 4. Imagen en la celda — `14:56`–`15:20`

> *"You can copy an image, but absolutely no hyperlinks"* — `14:56`

Reusar `inventoryImportImages.js`, que ya lee la imagen pegada en la celda
desde el rich data del libro, y el aviso de URL escrita a mano de
`inventoryImportRows.js`.

### 5. Código postal — `5:57`–`6:26`

Acepta cualquier texto. Él pidió *"some type of check"*, pero la misma
conversación trajo la pega: el formato depende del país. Validar solo cuando
el país sea US, o no validar.

---

## 2. Correo de recordatorio de vencidos — `15:54`–`17:54`

Mandó un recordatorio desde "See overdue items" y lo miró en el correo.

- Poner **el nombre del dispositivo** ("Chromebook") en lugar de lo que sale
  ahora (`15:54`).
- El nombre del colegio en el cuerpo sobra, o baja con un salto de línea al
  pie (`16:43`).
- Pie: **"Powered by Devitrak"**. Si hay logo arriba, que sea **el del
  colegio** (`17:34`).
- Cesar: en banners o fondos oscuros, **la versión blanca del logo**, la de
  la barra de navegación (`17:19`).

Tú dijiste que ya existe un módulo para que la compañía personalice la
plantilla del correo (`17:54`). Conviene ver qué cubre antes de tocarlo. El
branding se resuelve en el servidor a partir de `x-company-id`.

---

## 3. Inventario — alta

### 8. Sublocación escrita pero no añadida — `20:26`–`20:57`

> *"So what would happen if I put supply room here and I didn't click add
> sublocation?"* — `20:25`

Tú: no la toma. Él: *"if anybody typed anything in that field… it needs to be
added and then you can continue"*. Acordado: deshabilitar Continue con un
mensaje mientras haya texto sin añadir.

**Es el mismo fallo que se arregló hoy en `SerialScanner`** (`18d7da99`): un
campo que solo se confirma con un botón o con Enter, y un texto escrito que se
pierde en silencio. Conviene resolverlo igual, con aviso visible y botón al
lado, y buscar otros campos con ese patrón.

### 9. Los dos botones del alta — `21:03`–`25:48`

> *"why is this blue and the other one is white? Is there any reason for
> that?"* — `21:03`

- **"Add new identifier" → "Add additional identifier"**, con el `+`
  (`22:31`, `25:03`). "New" se confunde con crear otra unidad.
- Cesar: cambiar los estilos. "Add additional identifier" pasa a
  **secundario** (outlined), y **"Queue this item for creation" a primario**
  (azul), porque es la acción que hay que hacer para seguir (`24:00`–`24:32`).
- Posición: centrado o **a la derecha**, junto con los botones de Remove, para
  que todas las acciones queden a la derecha (`25:07`–`25:48`). Cesar comentó
  además que la etiqueta es larga.

### 10. "Built for you" en la revisión — `26:29`–`27:15`

En el paso de revisión aparece algo como *"built for you"*, que según tú toma
el valor de las columnas seleccionadas. Ni Fredrik ni Cesar supieron qué era:

> *"I think we don't know what that is. So... I think you can remove that."*
> — `27:06`

Localizarlo en la pantalla de revisión del alta antes de quitarlo.

### 11. Texto del serial duplicado — `27:15`–`27:50`

El texto actual dice algo como *"serial number already exists in your
inventory is rejected by the server, not silently merged. You get told which
one."* Lo leyó dos veces y no lo entendió. Su redacción:

> *"If a serial number already exists, it will be rejected, and you will be
> notified."*

---

## 4. Eventos — alta

### 12 y 13. Documentos: arrastrar — `33:01`–`34:58`, `40:43`–`42:18`

Quiso arrastrar un PDF del escritorio a la zona de documentos. Esa zona es
para mover documentos **ya subidos**, de "available" a "assigned".

> *"So you kind of need to say that somewhere… people would think that they
> can drag and drop something to that"* — `34:41`

Y al arrastrar uno existente, **el elemento se dibuja detrás del panel**, no
por encima (`42:16`). Es un z-index o un portal del drag overlay.

### 14. Documentos vencidos — `35:04`–`38:33`

Subió un documento con vencimiento y preguntó qué pasa al vencer. Hoy no pasa
nada (`36:35`).

Lo acordado (`37:36`–`38:18`):
- Etiqueta **Expired** en todas las vistas donde aparezca.
- **No se puede asignar ni usar** en ningún sitio, incluido el alta de
  eventos.
- **Sigue en la sección de documentos del admin**, donde se puede editar,
  cambiar la fecha de vencimiento, reactivar o borrar.

Puede hacerse en el cliente comparando la fecha, pero la regla de "no
asignable" debería aplicarla también el servidor.

### 15. Evento a medio crear — `38:42`–`40:16`

Salió a crear un documento a mitad del alta y al volver el evento aparecía
como **cerrado/ended**.

> *"We should not do that because it's not ended… It was never done"* —
> `39:16`
>
> *"Or you add a new one that is called draft. Everybody knows what that
> means."* — `39:50`

Y un matiz nuevo: si un borrador llega a la fecha de fin sin terminarse, pasa
a **inactive**, no a ended (`40:00`). **Ya anotado en el tracker §2**, con el
dato de que `configuration: "completed"` ya se escribe y nadie lo lee. Hay que
añadir el matiz del inactive. Lo cerraste tú mismo como prioridad al final
(`1:16:23`).

---

## 5. Eventos — estudiantes y asignación

### 16 y 17. Registrar sin consentimiento, o con registro — `45:47`–`49:25`

El botón de estudiantes manda una invitación al tutor para que dé
consentimiento.

> *"They may have a waiver on the beginning of the semester that allows them
> to join any events… So you should be able to add them to the event here
> without that invitation thing."* — `46:06`

Después probó el consentimiento y le gustó (`48:52`). La petición queda en dos
opciones: **añadir directamente** o **pedir consentimiento**. Y si se pide:

> *"you need to log everything, like when the parent clicked and all that kind
> of stuff… So that audit trail is available for that."* — `48:52`

Tú: pasar el consentimiento de obligatorio a opcional (`49:25`). El registro
de cada respuesta se relaciona con el audit trail (§6).

### 18. "Health" → "Condition" — `54:19`–`54:52`

> *"can you talk about health in terms of a computer? Device status, maybe?
> Device condition, condition is the way to say it."*

**Ojo, choca con otra tarea del tracker.** §3 de
`FRONTEND_open_tasks_2026-09-24.md`: el backend va a separar `condition` de
`status`, y hay seis sitios que ya pintan "Condition" mostrando el `status`.
Antes de renombrar "Health", hay que saber qué campo muestra, para no añadir
un séptimo sitio que diga Condition y enseñe otra cosa.

### 19. Tiles del inventario del evento — `1:02:38`–`1:03:46`

"Inventory assigned for consumer uses": con dos grupos salen dos tiles. Con 20,
bajan de línea. Acordado: **3 por fila** (`1:03:39`).

---

## 6. Historial del dispositivo y audit trail

### 20. Orden y hora — `1:05:18`–`1:06:28`

El historial de un portátil decía *added → returned → assigned*, cuando lo que
pasó fue *added → assigned → returned*. Todo tenía la misma fecha, así que no
hay forma de ver el orden.

> *"You may want to put a time stamp on it too, and not only the date."* —
> `1:06:05`

Lo más nuevo, arriba (`1:05:54`). La hora, con minutos y segundos
(`1:13:47`). Hay que ver si el desorden viene del orden de la consulta o de
ordenar solo por fecha.

### 21. Devolver un dispositivo encontrado — `1:06:35`–`1:08:22`

Encontró en el pasillo un portátil que aparecía asignado en un evento. No hay
forma de pasarlo al almacén desde la ficha (`1:07:26`). Tú propusiste que el
estado de Edit, hoy fijo en "out with someone in event", pase a ser un
desplegable (`1:07:55`).

Queda abierto quién puede hacerlo (`1:08:09`, *"It's tricky as to how we, who
should be able to do what"*). Y tiene que pasar por la misma lógica de
devolución, no ser un cambio de campo suelto, o el evento seguiría contándolo
como fuera.

### 22. Audit trail — `1:08:32`–`1:15:25`

> *"An audit trail you can do independently of that [los roles
> personalizados]… every transaction was done by somebody. It doesn't really
> matter if they have the authority or not. They just need to be logged"* —
> `1:09:06`

Enseñó el audit history de una factura de QuickBooks como referencia: quién,
qué y cuándo.

- **Empezar por el dispositivo** (`1:13:18`): el historial ya existe, así que
  hay que añadirle la **hora exacta** y **el usuario que hizo la acción**,
  como tercera línea o como columna a la derecha (`1:14:18`).
- **Un formato común** para todos los audit trails de Devitrak, para que la
  gente lo reconozca (`1:14:43`).

Tú: una tercera línea con quien ejecutó la acción (`1:15:01`). Hace falta que
el backend guarde el autor de cada evento del historial. Si hoy no lo guarda,
esto no es solo frontend. Relacionado: el log de actividad de staff (B2) y el
"no audit log" del plan del vertical de colegios.

### 23. Un `FFF` en el historial — `1:14:18`–`1:14:43`

En una línea del historial sale algo como `FFF`. Tú: probablemente la
dirección con la que se asignó. Revisar qué campo es y cómo se pinta.

---

## 7. Sin código

- **Etiquetas físicas** para inventario (`1:18:10`): si el colegio quiere
  etiquetar, hay que tener una solución. Fredrik lo investiga.
- **Próxima reunión:** revisar lo que se haya cambiado desde esta. Cesar
  también presenta sus ítems de la reunión del lunes (`1:17:06`).
- Fredrik manda esta semana el correo al colegio y después habla con el LSP.
