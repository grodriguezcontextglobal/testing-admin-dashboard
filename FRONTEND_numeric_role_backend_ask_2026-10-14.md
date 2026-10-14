# Backend: retirar el rol numérico (`role` 0–5 / `role_level`) — preguntas (2026-10-14)

Para el agente de backend. Viene de F1.1 del plan FedRAMP.

**Lo que el dashboard ya hizo (fase 1, solo cliente):** ninguna pantalla decide
nada leyendo el número. Destinatarios de correos de admin, protección del root
admin, colores y orden de la tabla de staff y la etiqueta del perfil salen de
`roleType`, todo por `src/config/roles.js`. Un test lo prohíbe fuera de ese
fichero. De paso se corrigió que un `role: ""` sin `roleType` se leyera como
`root_admin` (`Number("") === 0`).

**Lo que no podemos quitar solos:** el número sigue en los datos y en lo que
el servidor lee. Antes de dejar de escribirlo y de mandarlo necesitamos estas
respuestas.

## 1. ¿El servidor decide el alcance con el `role` del body?

Estas llamadas mandan `role` en el cuerpo:

| Endpoint | Llamador | Qué mandamos |
|---|---|---|
| `POST /db_item/warehouse-items` | `inventory/table/ItemTable.jsx:193` | `user.role` |
| El mismo, para el export | `ItemTable.jsx:400` → `inventoryExport.js` | `user.role` |
| `POST /db_company/company-inventory-structure` | `home/.../TableCategories.jsx:19` | `"0"` si es admin, si no el `role` del empleado |
| `POST /db_location/companies/:id/locations` | `home/.../TableLocations.jsx:22` y `verifyLocationBeforeCreateNewInventory.js:20,106` | `"0"` si es admin, o `0` fijo |
| `POST /db_*/check-item` | según `api-payloads.json` lee `role` | — |

**El problema:** si el handler confía en ese `role`, cualquier usuario
autenticado puede mandar `role: "0"` y ver todo el inventario de su compañía.
Nosotros mismos mandamos `0` fijo en `verifyLocationBeforeCreateNewInventory`.

**Pregunta:** ¿pueden sacar el rol del JWT (o de `company_staff` con el
usuario del token) e ignorar el del body? Si es así, avísennos y dejamos de
mandarlo.

## 2. ¿Qué lee `authorizeMongoPermission`?

¿Decide con `roleType` / `role_type`, o todavía con el `role` numérico de
`Company.employees[]`? Si usa el número, ¿pueden pasarlo a `roleType`?

## 3. ¿Hay registros sin `roleType`?

El cliente cae al número solo cuando falta `roleType` (`resolveRoleType`,
`deriveRoleType`). Para quitar ese respaldo necesitamos saber:

- cuántos `Company.employees[]` no tienen `roleType`, o lo tienen inválido;
- cuántos `AdminUser.companiesAssigned[]` no tienen `role_type`;
- cuántas filas de `company_staff` tienen `role_type` nulo.

Si hay alguno, ¿pueden hacer un backfill desde el número
(`0 root_admin, 1 admin, 2 sale_manager, 3 event_manager, 4 inventory_manager,
5 assistant`)?

## 4. R1: el choque de niveles

Su plan da a los cuatro roles con alcance los niveles 6–9, y
`event_assistant` ya es 6. El cliente no les asigna nivel por eso
(`roles.js`, comentario `TODO(R1)`). Si el número se retira, el choque
desaparece. ¿Lo dejamos así (solo strings) o necesitan el número para algo en
SQL (`role_level`)?

## 5. Lo que escribe el servidor

`accept-invitation` añade a `companiesAssigned` `{ role_type, role }`, con
`role` = el número de la invitación (`FRONTEND_invitation_signed_link_2026-10-13.md`
§6). ¿Puede seguir aceptando invitaciones si el cliente deja de guardar `role`
en `Company.employees[]` y solo guarda `roleType`?

## Lo que haremos cuando respondan

Con 1–3 resueltos, el dashboard:

1. deja de mandar `role` en los endpoints de la tabla 1;
2. deja de escribir el número en `Company.employees[].role`
   (`newStaffMemberUtils.js:88`, `UpdateRoleInCompany.jsx`,
   `useRoleReassignment.js`, `Registration.jsx`, `createCompany.jsx`,
   `EditingStaff.jsx`) y en `role_level`;
3. retira `LEGACY_ROLE_MAP` y el respaldo numérico de `resolveRoleType`.

Para cada paso necesitamos que el servidor **tolere que el campo no venga**
antes de que lo quitemos, como en los cambios de contrato anteriores.

## Qué devolver

Una respuesta por punto (1–5) y, para el 3, los conteos.
