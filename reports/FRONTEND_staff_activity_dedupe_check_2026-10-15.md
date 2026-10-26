# Registros duplicados en Staff activity — checklist para producción (2026-10-15)

> **Resuelto 2026-10-19 sin la prueba manual** (`37410815`). Con el servidor en producción desde el 16-10, se comprobó en su `constants/auditedRoutes.js` que ninguna de estas rutas está en `READ_ONLY_ROUTES` ni en `LOGGED_ELSEWHERE`, así que el middleware las registra todas. Quitadas 13. Se quedan 4 porque guardan algo que la fila del servidor no tiene: #8 (el nombre del miembro borrado), #13 (el importe y el payment intent si `settle-member-fee` falla), #16 y #17 (proveedor y una fila por equipo antes de borrar el ítem).

Viene de §2e del tracker. El middleware del servidor registra desde el
2026-10-05 cada ruta que cambia datos (`source: "server"`). El cliente además
llama a `registerStaffActivity` en 17 sitios, así que esas acciones salen
**dos veces** en Profile → Staff activity.

**Antes de quitar una llamada hay que ver la fila del servidor.** Perder una
entrada de la bitácora es peor que duplicarla. Por cada fila: hacer la acción
en producción (con datos de prueba), abrir Staff activity y marcar si aparece
la fila del servidor además de la nuestra.

- ✅ = aparece la del servidor → se quita nuestra llamada.
- ❌ = solo aparece la nuestra → se queda, y se pide al backend cubrir la ruta.

| # | Dónde (`src/…`) | Nuestra fila | Ruta del servidor que hace la acción | Cómo provocarla | ¿Fila del servidor? |
|---|---|---|---|---|---|
| 1 | `pages/conditionalPage/components/modals/addNewMember/Single.jsx:214` | CREATE Member | `POST /db_member/new-member` | Members → Add member → uno | |
| 2 | `…/addNewMember/MultipleFromXLSX.jsx:234` | IMPORT Member | `POST /db_member/bulk-members` (201) | Import de un XLSX pequeño | |
| 3 | `…/addNewMember/MultipleFromXLSX.jsx:212` | IMPORT Member (`queued`) | `POST /db_member/bulk-members` (202) | Import que tarde > 4 s | |
| 4 | `…/memberDetailsDashboard/innerComponents/StudentInfoSection.jsx:117` | UPDATE Member | `POST /db_member/update-member-info` | Perfil del miembro → editar datos | |
| 5 | `…/memberDetailsDashboard/innerComponents/GuardianInfoSection.jsx:87` | UPDATE Guardian | `POST /db_member/update-member-info` | Perfil → editar tutor | |
| 6 | `…/modals/AdvanceGrades.jsx:104` | UPDATE Member | `POST /db_member/update-member-info` | Members → Advance grades | |
| 7 | `…/modals/DeleteMember.jsx:80` | DELETE Member | `POST /db_member/delete-member-info` | Members → borrar desde la tabla | |
| 8 | `…/memberDetailsDashboard/Header.jsx:162` | DELETE Member | `POST /db_member/delete-member-info` | Perfil del miembro → Delete | |
| 9 | `…/assignment/AssignmentDevicesToMember.jsx:361` | ASSIGN Lease | `POST /db_member/new-member-assigned-device-lease` | Asignar un equipo a un miembro | |
| 10 | `…/tables/detailTableComponents/acions/EditRowInformation.jsx:53` | UPDATE Lease | `…/update-member-assigned-device-lease` | Editar una fila de equipos del miembro | |
| 11 | `…/acions/return/Return.jsx:141` | UNASSIGN Lease | `…/update-member-assigned-device-lease` | Devolver un equipo del miembro | |
| 12 | `…/tables/OverdueDevicesTable.jsx:159` | UNASSIGN Lease | `POST /db_member/bulk-return` | See overdue items → devolver | |
| 13 | `…/acions/fee/ChargeMemberDeviceFee.jsx:264` | CREATE Fee | `POST /db_member/settle-member-fee` | Cobrar un fee por equipo | |
| 14 | `…/innerComponents/StudentConsentPanel.jsx:159` | CREATE Consent | `POST /school/consent/request` | Pedir consentimiento al tutor | |
| 15 | `…/innerComponents/StudentConsentPanel.jsx:179` | UPDATE Consent | `POST /school/consent/resend` | Reenviar el pedido | |
| 16 | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:137` | una por equipo (`buildReturnAuditEntries`) | `POST /db_item/:item_id` | Devolver un equipo alquilado desde su detalle | |
| 17 | `pages/inventory/details/OwnershipDetail/components/suppliers/ReturnRentedItemModal.jsx:265` | DELETE Item, una por equipo | `POST /db_item/delete-bulk-items-criteria` | Devolver alquilados al proveedor | |

**Ojo con dos casos:**
- **16 y 17 escriben una fila por equipo.** El servidor registra una por
  petición, con los seriales en `context`. Si su fila nombra todos los equipos,
  vale como cobertura aunque sea una sola.
- **14 y 15 también mandan un correo.** El middleware puede registrar el
  envío de correo (`nodemailer/*`) y no la ruta de `/school/*`. Mirar que la
  fila sea de la acción, no solo del correo.

Cuando la tabla esté llena, el cambio en el cliente es mecánico: quitar las
llamadas ✅ y sus imports, y dejar las ❌ con un comentario que apunte al
pedido al backend.
