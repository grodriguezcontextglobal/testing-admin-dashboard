# Documentos — pedido al backend

> **2026-10-01.** Viene de 2b.8, documentos vencidos (reunión 2026-09-29
> `35:04`–`38:33`). El frontend ya marca los vencidos como "Expired" y no deja
> asignarlos en ninguna pantalla. Lo que falta depende del servidor.

## 1. No hay ruta para editar un documento

`src/pages/Profile/Documents/EditDocument.jsx` guarda con
`PUT /api/document/:id`, pero **esa ruta no aparece** en
`src/docs/api-payloads.md`. Las de `/api/document/:id` documentadas son solo
`GET` y `DELETE`. Si no existe, **el botón de guardar de Edit document falla
hoy**.

Fredrik pidió (`37:36`–`38:18`) que un documento vencido siga en la biblioteca
para *"change it or change it back to active"*: editarlo, cambiarle la fecha o
borrarlo. Para eso hace falta:

- **`PUT` (o `PATCH`) `/api/document/:id`** que acepte, como mínimo, `title`,
  `description`, `document_type`, `trigger_action` y **`expiration_date`**
  (ISO o `null`, para quitar el vencimiento).

Cuando exista, el frontend agrega el campo "Expires on" a Edit document.

## 2. Que el servidor también se niegue a asignar un vencido

Hoy la regla vive en el cliente: `isExpiredDocument` en
`src/pages/Profile/Documents/utils/documentLibrary.js`, usada por el alta de
evento, quick-glance del evento y las entregas de equipo a estudiantes y staff.
Un cliente viejo, o un pedido directo, todavía podría asignarlo.

- `PATCH /api/event/edit-event/:id` con `legal_documents_list`, y los envíos de
  contratos de entrega de equipo, deberían rechazar un documento cuyo
  `expiration_date` ya pasó.
