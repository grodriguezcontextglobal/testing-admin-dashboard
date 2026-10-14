# Backend: rutas del servidor sin autenticación (2026-10-14)

Para el agente de backend. Viene de la revisión FedRAMP (AC-3, IA-2).

## 0. De dónde sale y cuánto vale

- **Fuente:** `src/docs/api-payloads.json`, el contrato que genera su
  `scripts/extract-api-payloads.js`. **La copia que tenemos es del
  2026-08-24** (`ca30e171`). Desde entonces cerraron rutas: las 7 que nos
  avisaron están marcadas ✅ en el anexo, pero puede haber más.
- **Criterio:** una ruta cuenta como "sin autenticación" si su lista de
  middlewares **a nivel de ruta** no tiene `validateJWT` ni `requireSuperUser`.
  **Si algún router monta `validateJWT` con `router.use`, el extractor puede no
  verlo**, y esas rutas saldrían aquí por error. Es lo primero que hay que
  descartar.
- **Uso en el dashboard:** se cruzó cada ruta con las llamadas de
  `devitrakApi`/`publicApi` en `src/`. "Página pública" = el fichero se alcanza
  desde las rutas sin sesión de `NoAuthRoutes.jsx` (login, registro, reset,
  invitación, consentimiento, `/my-devices`, `/display-contracts`,
  `/attendance-confirmation`, `/receipt`, `/status`). El emparejamiento de rutas
  con parámetros es aproximado: el llamador de cada fila hay que mirarlo antes
  de cambiar nada.
- **No sabemos qué llaman otros clientes** (app de consumidores, lectores
  RFID). Que el dashboard no use una ruta no prueba que nadie la use.

**Pedido:** regenerar `api-payloads.json` contra el código de hoy, confirmar el
punto del `router.use`, y responder por grupo (§4).

**Ya en marcha:** backend tiene su propio `PLAN_rutas_sin_autenticacion_2026-10-14.md`.
Su Fase 4.3 (invitaciones a evento, `FRONTEND_attendance_invitation_link_2026-10-14.md`)
añade tres rutas que este cruce no ve porque son posteriores al contrato:
`POST /api/school/event-invitations/send` (con sesión), `/confirm` y `/response`
(sin sesión, con `x-link-token`). La revisión del dashboard está en
`FRONTEND_attendance_invitation_link_review_2026-10-14.md`; su §1 afecta a las
cuatro rutas de consumidor del grupo A (`auth/user-query`, `auth/new`,
`PATCH auth/:id`, `db_consumer/new_consumer`).

## 1. Resumen

De **484** rutas montadas, **384** no llevan `validateJWT` en la ruta.

| Grupo | Rutas | Qué son | Qué proponemos |
|---|---|---|---|
| **A** | 44 | Las llama una página pública del dashboard (24 también se llaman con sesión) | Revisar una por una: casi ninguna necesita ser anónima del todo (§3) |
| **B** | 154 | El dashboard **solo** las llama con sesión, y ya manda `x-token` | Poner `validateJWT` + `checkTokenVersion`. **No rompe nada nuestro** |
| **C** | 36 | Tienen `canRead`/`canCreate`/`canManage`… pero no `validateJWT` | Confirmar que esos middlewares exigen token. Según `FRONTEND_overdue_reminders_2026-10-07.md` responden 401, pero no lo vemos |
| **D** | 35 | `optionalJWT`: aceptan sin token. 33 son de Stripe | Decidir cuáles deben ser públicas de verdad |
| **E** | 4 | Refund, refund parcial, capture y cancel de Stripe, solo con rate limit | Ya anunciaron que exigirán sesión y `transaction:update`. Confirmar despliegue |
| **F** | 111 | El dashboard no las llama | Cerrar o retirar, después de comprobar otros clientes |

## 2. Lo más grave, por dominio

Sin ningún middleware de autenticación, en el contrato del 24-08:

- **Correo (`/api/nodemailer/*`, 34 rutas en B y F).** Envían correo a la
  dirección que llegue en el body, con la marca de la compañía. Sin sesión,
  cualquiera puede usarlas para mandar correo desde nuestro dominio. Ejemplos:
  `single-email-notification`, `customize-message-notification`,
  `massive-event-customer-notification`, `send-consumer-app-instructions`.
- **Asignación y devolución de equipos (`/api/receiver/*`, 29 rutas).**
  Asignar, devolver, borrar del pool y editar transacciones de dispositivos:
  `receiver-assignation`, `delete-bulk-devices-pool`,
  `remove-transaction/:id`, `transaction-all-items-returned-at-once`.
- **Inventario y eventos SQL (`/api/db_item`, `/api/db_event`,
  `/api/db_company`, `/api/db_lease`, 72 rutas).** Lecturas de inventario
  completo y escrituras: `new_event`, `update-event/:event_id`,
  `lock-items-for-event`, `insert-new-single-item`,
  `update-all-items-in-inventory`, `delete-bulk-items`, `new-lease`,
  `delete-lease-info`.
- **Pagos (`/api/transaction/*`, `/api/stripe/save-transaction`,
  `/api/cash-report/*`).** `update-transaction/:id`, `save-transaction`,
  `remove-duplicate-transaction/:id`, `check-and-release-deposit-transactions`.
- **Datos de personas.** `GET /api/admin/check-online-status/:email`,
  `POST /api/auth/users`, `GET /api/auth/users`, `/api/search/*` (7 GET de
  búsqueda de consumidores, staff y eventos), `POST /api/db_consumer/consulting-consumer`.
- **Cuentas.** `POST /api/admin/new_admin_user` (ya señalado en
  `FRONTEND_admin_user_schema_cleanup.md`: no escala privilegios, pero crea
  cuentas), `POST /api/admin/manually_logout`, `POST /api/admin/logout`.
- **Operación.** `POST /api/cache_update/remove-cache`,
  `POST /api/heavy-task/process`, `POST /api/error_log/error_log`.

De las rutas de colegio (`/api/school/*`, `/api/db_member/*`), 29 están en el
grupo C: tienen permiso, pero no `validateJWT` en la ruta. Las otras 3 son las
públicas del grupo A (consentimiento y `my-devices`). Ahí hay datos de menores,
así que confirmar el punto C es prioritario.

## 3. Grupo A: las que el dashboard usa sin sesión

No proponemos dejarlas anónimas tal cual. Cada una debería tener otra prueba de
identidad, como ya hicieron con el reset y la invitación:

| Flujo | Rutas | Protección que ya tiene, o que proponemos |
|---|---|---|
| Login y logout | `admin/login`, `admin/logout`, `nodemailer/forcing-revoking-active-session`, `staff/force-logout` | Login: credenciales + MFA. Logout y force-logout: exigir el token que se cierra, o el enlace firmado |
| Reset e invitación | `admin/update-password`, `nodemailer/reset-admin-password`, `registration/accept-invitation`, `staff/__staff-search` | Enlace firmado, ya en `release/observabilidad` |
| Alta de compañía | `registration/new`, `registration/add-company`, `company/companies`, `company/update-company/register-process/:id`, `stripe/new-company-account`, `db_company/industry` | Rate limit y captcha. `update-company/register-process/:id` deja escribir en cualquier compañía con su id: atarla a la cuenta recién creada |
| Firma de contratos (`/display-contracts`) | `document/verification/*`, `company/signatures*`, `company/consumer-signatures`, `document/download/documentUrl`, `auth/user-query`, `auth/users` | Enlace firmado por documento y persona, como el consentimiento. Hoy basta con conocer los ids |
| Confirmación de asistencia (`/attendance-confirmation`) | `auth/user-query`, `auth/new`, `PATCH auth/:id`, `db_consumer/new_consumer`, `school/event-invitations/response` | **En curso (su Fase 4.3):** enlace firmado y `/confirm`. Falta cerrar las cuatro rutas genéricas para quien llame sin pasar por la página (revisión §1) |
| Consentimiento del tutor | `school/consent/public/retrieve`, `school/consent/public/respond` | Ya va por token del enlace. Confirmar que no acepta ids sueltos |
| Portal de familia | `db_member/my-devices` | Confirmar qué pide para responder. Si basta un email, es una búsqueda de datos de menores |
| Términos de Devitrak | `devitrak/new_acceptance`, `devitrak/:id` | Atarlas a la cuenta que acepta |

`GET /api/document/:id` ya está en sus decisiones pendientes (es público para
cualquier documento, no solo los de consentimiento).

## 4. Qué devolver

1. Si algún router monta `validateJWT` con `router.use`, y cuáles.
2. El `api-payloads.json` regenerado, para rehacer este cruce sobre el
   servidor de hoy.
3. Para B: un sí. Del lado del dashboard no hay nada que cambiar, porque ya
   mandamos `x-token` en todas.
4. Para C: si `canRead`, `canCreate`, `canUpdate`, `canDelete`, `canManage` y
   `canReadInventory` verifican el token o asumen que ya se verificó.
5. Para D y F: la lista de las que deben seguir públicas, y por qué.

Para cualquier ruta que pase a pedir sesión, el dashboard la prueba en el
navegador cuando esté desplegada. Si alguna llamada nuestra va sin token y no
la vimos, sale aquí como 401.

---

## Anexo: las 384 rutas

Grupos como en §1. ✅ = nos avisaron de que se cerró después del 24-08.

| Grupo | Método | Ruta | Middlewares | Uso en el dashboard | Primer llamador | Fuente |
|---|---|---|---|---|---|---|
| A | POST | `/api/admin/login` | `validateFields` | solo página pública | `pages/authentication/Login.jsx:346` | `controller/admin.js:86` |
| A | POST | `/api/admin/logout` | — | pública y con sesión | `hooks/useLogout.js:42` | `controller/admin.js:345` |
| A | PATCH | `/api/admin/update-password` | — | pública y con sesión | `pages/authentication/ResetPassword.jsx:142` | `controller/admin.js:587` |
| A | PATCH | `/api/auth/:id` | — | pública y con sesión | `pages/conditionalPage/utils/eventRegistrationUtils.js:240` | `controller/auth.js:168` |
| A | POST | `/api/auth/new` | `check` `validateFields` | pública y con sesión | `pages/conditionalPage/utils/eventRegistrationUtils.js:250` | `controller/auth.js:120` |
| A | GET | `/api/auth/user-query` | — | pública y con sesión | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:81` | `controller/auth.js:27` |
| A | POST | `/api/auth/user-query` | — | pública y con sesión | `pages/conditionalPage/utils/eventRegistrationUtils.js:234` | `controller/auth.js:11` |
| A | GET | `/api/auth/users` | — | pública y con sesión | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:81` | `controller/auth.js:11` |
| A | POST | `/api/company/companies` | — | solo página pública | `pages/authentication/RegisterCompany.jsx:77` | `controller/company.js:219` |
| A | POST | `/api/company/consulting-signatures` | — | pública y con sesión | `pages/authentication/signatureVerificationDocuments/StaffMember.jsx:89` | `controller/document.js:471` |
| A | POST | `/api/company/consumer-signatures` | — | pública y con sesión | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:72` | `controller/document.js:596` |
| A | POST | `/api/company/search-company` | — | pública y con sesión | `pages/authentication/actions/createCompany.jsx:53` | `controller/company.js:150` |
| A | POST | `/api/company/signatures-for-consumer-member` | — | solo página pública | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:160` | `controller/document.js:397` |
| A | POST | `/api/company/signatures` | — | solo página pública | `pages/authentication/signatureVerificationDocuments/StaffMember.jsx:220` | `controller/document.js:324` |
| A | PATCH | `/api/company/update-company/register-process/:id` | — | solo página pública | `pages/authentication/RegisterStripeConnectedAccount.jsx:52` | `controller/company.js:114` |
| A | POST | `/api/db_company/consulting-company` | — | pública y con sesión | `pages/authentication/actions/consultingCompanyInSqDb.jsx:6` | `mysql/controllers/company.js:48` |
| A | POST | `/api/db_company/industry` | — | pública y con sesión | `pages/authentication/RegisterCompany.jsx:66` | `mysql/controllers/company.js:95` |
| A | POST | `/api/db_consumer/new_consumer` | — | pública y con sesión | `pages/conditionalPage/utils/eventRegistrationUtils.js:254` | `mysql/controllers/consumer.js:5` |
| A | POST | `/api/db_event/events_information` | — | pública y con sesión | `pages/authentication/Login.jsx:131` | `mysql/controllers/events.js:178` |
| A | POST | `/api/db_member/my-devices` | — | solo página pública | `pages/authentication/MyDevicesPortal.jsx:81` | `mysql/controllers/members.js:1970` |
| A | POST | `/api/db_staff/consulting-member` | — | pública y con sesión | `pages/authentication/actions/consultingUserMemberInSqlDb.jsx:7` | `mysql/controllers/staff.js:90` |
| A | POST | `/api/db_staff/new_member` | — | pública y con sesión | `pages/authentication/actions/insertingUserMemberInSqlBd.jsx:5` | `mysql/controllers/staff.js:31` |
| A | POST | `/api/db_stripe/consulting-stripe` | — | pública y con sesión | `pages/authentication/actions/insertingStripeAccountInSqlDb.jsx:5` | `mysql/controllers/stripe.js:29` |
| A | PATCH | `/api/devitrak/:id` | — | solo página pública | `pages/authentication/InvitationLanding.jsx:180` | `controller/devitrakApp.js:32` |
| A | POST | `/api/devitrak/new_acceptance` | — | solo página pública | `pages/authentication/actions/DevitrakTermsAndConditions.jsx:189` | `controller/devitrakApp.js:4` |
| A | GET | `/api/document/:id` | — | pública y con sesión | `pages/Profile/Documents/EditDocument.jsx:45` | `controller/document.js:152` |
| A | GET | `/api/document/download/:documentId/:userId` | — | pública y con sesión | `pages/conditionalPage/components/memberDetailsDashboard/innerComponents/assignmentComponents/documents/ContractDocumentsPicker.jsx:109` | `controller/document.js:205` |
| A | POST | `/api/document/download/documentUrl` | — | pública y con sesión | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:44` | `controller/document.js:308` |
| A | POST | `/api/document/verification/consumer_member/check_signed_document` | — | solo página pública | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:63` | `controller/document.js:1046` |
| A | PATCH | `/api/document/verification/consumer_member/signing_document` | — | solo página pública | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:148` | `controller/document.js:1424` |
| A | POST | `/api/document/verification/staff_member/check_signed_document` | — | pública y con sesión | `pages/authentication/signatureVerificationDocuments/StaffMember.jsx:80` | `controller/document.js:908` |
| A | PATCH | `/api/document/verification/staff_member/signing_document` | — | solo página pública | `pages/authentication/signatureVerificationDocuments/StaffMember.jsx:171` | `controller/document.js:1328` |
| A | POST | `/api/event/event-list` | — | pública y con sesión | `pages/authentication/Login.jsx:189` | `controller/event.js:174` |
| A | POST | `/api/nodemailer/forcing-revoking-active-session` | — | solo página pública | `pages/authentication/Login.jsx:648` | `nodeMailer/notifications.js:899` |
| A | POST | `/api/nodemailer/reset-admin-password` | — | pública y con sesión | `pages/authentication/ForgotPassword.jsx:44` | `nodeMailer/notifications.js:304` |
| A | POST | `/api/registration/accept-invitation` | `check` `validateFields` | solo página pública | `pages/authentication/InvitationLanding.jsx:134` | `controller/registration.js:440` |
| A | POST | `/api/registration/add-company` | `check` `validateFields` | solo página pública | `pages/authentication/RegisterCompany.jsx:191` | `controller/registration.js:299` |
| A | POST | `/api/registration/new` | `check` `validateFields` | solo página pública | `pages/authentication/RegisterCompany.jsx:198` | `controller/registration.js:143` |
| A | POST | `/api/school/consent/public/respond` | — | solo página pública | `pages/schoolConsent/guardianConsentPublicApi.js:42` | `mysql/controllers/school.js:1149` |
| A | POST | `/api/school/consent/public/retrieve` | — | solo página pública | `pages/schoolConsent/guardianConsentPublicApi.js:35` | `mysql/controllers/school.js:984` |
| A | POST | `/api/staff/__staff-search` | — | solo página pública | `pages/authentication/InvitationLanding.jsx:70` | `controller/admin.js:671` |
| A | POST | `/api/staff/force-logout` | — | solo página pública | `pages/authentication/ForceLogout.jsx:79` | `controller/admin.js:828` |
| A | POST | `/api/stripe/new-company-account` | — | solo página pública | `pages/authentication/actions/createStripeAccount.jsx:29` | `controller/stripe.js:159` |
| A | GET | `/api/transaction/transaction` | — | pública y con sesión | `pages/consumers/action/deposit/Capturing.jsx:50` | `controller/transaction.js:131` |
| B | GET | `/api/admin/check-online-status/:email` | — | solo con sesión | `pages/events/quickGlance/staff/table/StaffTable.jsx:81` | `controller/admin.js:730` |
| B | POST | `/api/admin/receiver-assignation` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/AssigningDevice/hooks/useDeviceStatus.js:49` | `controller/receiver.js:24` |
| B | POST | `/api/auth/users` | — | solo con sesión | `pages/events/quickGlance/inventory/action/MainPage.jsx:175` | `controller/auth.js:11` |
| B | POST | `/api/cache_update/remove-cache` | — | solo con sesión | `utils/actions/clearCacheMemory.jsx:4` | `middlewares/cacheUpdateDelete.js:4` |
| B | POST | `/api/cash-report/cash-reports` | — | solo con sesión | `pages/consumers/components/UI/ExpandedLostButtons.jsx:45` | `controller/cashReport.js:27` |
| B | POST | `/api/cash-report/create-cash-report` | — | solo con sesión | `pages/consumers/action/chargeAllDevicesFolder/ChargeAllListDeviceCash.jsx:70` | `controller/cashReport.js:7` |
| B | POST | `/api/cash-report/remove-cash-report/:id` | — | solo con sesión | `pages/consumers/components/UI/ExpandedLostButtons.jsx:148` | `controller/cashReport.js:56` |
| B | PATCH | `/api/cash-report/update-cash-report/:id` | — | solo con sesión | `pages/consumers/components/UI/ExpandedLostButtons.jsx:84` | `controller/cashReport.js:73` |
| B | POST | `/api/company/new_provider` | — | solo con sesión | `pages/inventory/actions/utils/suppliers/NewSupplier.jsx:88` | `controller/providerCompany.js:3` |
| B | POST | `/api/company/new` | — | solo con sesión | `pages/authentication/actions/createCompany.jsx:93` | `controller/company.js:11` |
| B | GET | `/api/company/provider-companies` | — | solo con sesión | `pages/consumers/action/assingmentComponents/AssignemntNewDeviceInInventory.jsx:108` | `controller/providerCompany.js:92` |
| B | POST | `/api/company/provider-company/:id` | — | solo con sesión | `components/notification/email/EmailReturnRentalItems.jsx:32` | `controller/providerCompany.js:137` |
| B | POST | `/api/company/provider-upload-document/:id` | `upload.single` | solo con sesión | `pages/Profile/providers/actions/UploadDocument.jsx:90` | `controller/providerCompany.js:321` |
| B | PATCH | `/api/company/update_provider/:id` | — | solo con sesión | `pages/Profile/providers/Main.jsx:134` | `controller/providerCompany.js:193` |
| B | POST | `/api/db_company/filter-suppliers-info-items` | — | solo con sesión | `pages/inventory/details/OwnershipDetail/components/suppliers/SuppliersInfoFiltersComponent.jsx:13` | `mysql/controllers/item.js:3607` |
| B | POST | `/api/db_company/get-grouped-inventory-by-search-parameter` | — | solo con sesión | `pages/inventory/MainPage.jsx:281` | `mysql/controllers/item.js:3476` |
| B | POST | `/api/db_company/insert-new-single-item` | — | solo con sesión | `pages/staff/detail/components/equipment_components/assingmentComponents/components/newDevice/actions/SingleItemInserting.jsx:52` | `mysql/controllers/item.js:159` |
| B | POST | `/api/db_company/new_company` | — | solo con sesión | `pages/authentication/actions/insertingNewCompanyInSqlDb.jsx:28` | `mysql/controllers/company.js:11` |
| B | POST | `/api/db_company/retrieve-company-inventory` | — | solo con sesión | `pages/events/newEventProcess/review/ReviewAndSubmitPage.jsx:42` | `mysql/controllers/item.js:4011` |
| B | GET | `/api/db_company/search-inventory` | — | solo con sesión | `pages/search/components/SearchDevice.jsx:50` | `mysql/controllers/item.js:1361` |
| B | POST | `/api/db_company/update-all-items-in-inventory` | — | solo con sesión | `pages/inventory/actions/edit/useLogic.jsx:126` | `mysql/controllers/item.js:2537` |
| B | POST | `/api/db_consumer/consulting-consumer` | — | solo con sesión | `pages/consumers/action/ModalAssignDeviceToConsumer.jsx:19` | `mysql/controllers/consumer.js:24` |
| B | POST | `/api/db_event/confirm-item-return` | — | solo con sesión | `pages/inventory/utils/CheckInDevicesFromEventsModal.jsx:255` | `mysql/controllers/item.js:3824` |
| B | POST | `/api/db_event/consulting-event` | — | solo con sesión | `pages/events/quickGlance/components/ModalAddAndUpdateDeviceSetup.jsx:169` | `mysql/controllers/events.js:145` |
| B | POST | `/api/db_event/device-final-status-refactored` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx:345` | `mysql/controllers/item.js:1179` |
| B | POST | `/api/db_event/event_device_directly` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:157` | `mysql/controllers/items_events.js:280` |
| B | POST | `/api/db_event/event_device` | — | solo con sesión | `pages/events/quickGlance/components/ModalAddAndUpdateDeviceSetup.jsx:367` | `mysql/controllers/items_events.js:46` |
| B | POST | `/api/db_event/event_staff` | — | solo con sesión | `pages/events/newEventProcess/review/utils/eventStaffSync.js:62` | `mysql/controllers/events.js:261` |
| B | GET | `/api/db_event/event-inventory/:id` | — | solo con sesión | `pages/events/quickGlance/components/SpreadSheet.jsx:23` | `mysql/controllers/events.js:290` |
| B | POST | `/api/db_event/event-inventory/:id` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx:198` | `mysql/controllers/items_events.js:413` |
| B | POST | `/api/db_event/lock-items-for-event` | — | solo con sesión | `pages/events/newEventProcess/review/ReviewAndSubmitPage.jsx:59` | `mysql/controllers/items_events.js:823` |
| B | POST | `/api/db_event/new_event` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:70` | `mysql/controllers/events.js:32` |
| B | POST | `/api/db_event/remove-reserved-items-for-event` | — | solo con sesión | `pages/inventory/actions/ShippingInventoryModal.jsx:231` | `mysql/controllers/items_events.js:917` |
| B | POST | `/api/db_event/retrieve-item-location-quantity-full-details` | — | solo con sesión | `pages/events/quickGlance/components/ModalAddAndUpdateDeviceSetup.jsx:260` | `mysql/controllers/item.js:1778` |
| B | POST | `/api/db_event/retrieve-item-location-quantity` | — | solo con sesión | `pages/events/quickGlance/components/ModalAddAndUpdateDeviceSetup.jsx:140` | `mysql/controllers/item.js:1704` |
| B | POST | `/api/db_event/returning-item-refactored` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx:370` | `mysql/controllers/item.js:1052` |
| B | POST | `/api/db_event/returning-item` | — | solo con sesión | `pages/conditionalPage/tables/detailTableComponents/acions/return/Return.jsx:67` | `mysql/controllers/item.js:1005` |
| B | POST | `/api/db_event/update-event/:event_id` | — | solo con sesión | `pages/events/newEventProcess/eventDetails/utils/eventDetailsStep.js:46` | `mysql/controllers/events.js:81` |
| B | POST | `/api/db_event/update-status-item-based-on-event` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndingEventButton.jsx:226` | `mysql/controllers/events.js:325` |
| B | GET | `/api/db_inventory/container-items/:container_item_id` | — | solo con sesión | `pages/events/quickGlance/components/ModalAddAndUpdateDeviceSetup.jsx:345` | `mysql/controllers/item.js:2822` |
| B | DELETE | `/api/db_inventory/container/:container_item_id` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ExtraInformation.jsx:117` | `mysql/controllers/item.js:2935` |
| B | POST | `/api/db_inventory/update-location-sub-location` ✅ cerrada después | — | solo con sesión | `pages/inventory/utils/TreeNode.jsx:92` | `mysql/controllers/item.js:3171` |
| B | GET | `/api/db_item/check-company-has-inventory` | — | solo con sesión | `pages/inventory/MainPage.jsx:139` | `mysql/controllers/item.js:1681` |
| B | POST | `/api/db_item/consulting-item` | — | solo con sesión | `pages/consumers/action/assingmentComponents/AssignemntNewDeviceInInventory.jsx:120` | `mysql/controllers/item.js:580` |
| B | POST | `/api/db_item/consulting-row-item-assigned-event` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/items_events.js:438` |
| B | POST | `/api/db_item/current-inventory` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/items_events.js:330` |
| B | POST | `/api/db_item/event-items/search` | — | solo con sesión | `pages/inventory/actions/ShippingInventoryModal.jsx:76` | `mysql/controllers/items_events.js:136` |
| B | DELETE | `/api/db_item/event-items` | — | solo con sesión | `pages/inventory/actions/components/ExchangeModal.jsx:36` | `mysql/controllers/items_events.js:83` |
| B | POST | `/api/db_item/get-inventory-company` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/item.js:1849` |
| B | POST | `/api/db_item/inventory_event/:id` | — | solo con sesión | `pages/inventory/details/deep_details_event_selected/MainPage.jsx:22` | `mysql/controllers/items_events.js:413` |
| B | POST | `/api/db_item/inventory-based-on-location-and-sublocation` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/item.js:1994` |
| B | POST | `/api/db_item/inventory-pagination` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/item.js:1917` |
| B | POST | `/api/db_item/items_information` ✅ cerrada después | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/item.js:654` |
| B | POST | `/api/db_item/retrieve-item-location-quantity` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/item.js:1704` |
| B | POST | `/api/db_item/returning-item-refactored` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/item.js:1052` |
| B | POST | `/api/db_item/search-inventory` | — | solo con sesión | `pages/inventory/details/detailComponent/components/ReturningLeasedEquipModal.jsx:144` | `mysql/controllers/item.js:1314` |
| B | POST | `/api/db_item/tracking_item/:id` | — | solo con sesión | `pages/inventory/details/deviceProfile/hooks/useDeviceProfile.js:70` | `mysql/controllers/item.js:1212` |
| B | POST | `/api/db_lease/consulting-consumer-lease` | — | solo con sesión | `pages/consumers/tables/ExpandedRow.jsx:237` | `mysql/controllers/lease.js:197` |
| B | POST | `/api/db_lease/consulting-lease` | — | solo con sesión | `pages/inventory/details/deviceProfile/hooks/useDeviceProfile.js:97` | `mysql/controllers/lease.js:179` |
| B | POST | `/api/db_lease/delete-consumer-lease-info` | — | solo con sesión | `pages/consumers/action/ModalReturnItem.jsx:71` | `mysql/controllers/lease.js:396` |
| B | POST | `/api/db_lease/delete-lease-info` | — | solo con sesión | `pages/staff/detail/components/equipment_components/ModalReturnDeviceFromStaff.jsx:74` | `mysql/controllers/lease.js:376` |
| B | POST | `/api/db_lease/new-consumer-lease` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:39` | `mysql/controllers/lease.js:95` |
| B | POST | `/api/db_lease/new-lease` | — | solo con sesión | `pages/staff/detail/components/equipment_components/assingmentComponents/AssignmentFromExistingInventory.jsx:304` | `mysql/controllers/lease.js:6` |
| B | POST | `/api/db_lease/update-consumer-lease-info` | — | solo con sesión | `pages/consumers/action/ModalReturnItem.jsx:57` | `mysql/controllers/lease.js:296` |
| B | POST | `/api/db_lease/update-lease-info` | — | solo con sesión | `pages/staff/detail/components/equipment_components/ModalReturnDeviceFromStaff.jsx:66` | `mysql/controllers/lease.js:215` |
| B | GET | `/api/db_location/companies/:id/location-paths-tree` | — | solo con sesión | `pages/inventory/actions/add/useBulkActionLogic.jsx:163` | `mysql/controllers/sub_location_paths.js:58` |
| B | POST | `/api/db_location/locations/:id` | — | solo con sesión | `pages/inventory/utils/TreeNode.jsx:165` | `mysql/controllers/location.js:515` |
| B | POST | `/api/db_location/locations` | `check` `validateFields` | solo con sesión | `pages/inventory/actions/utils/verifyLocationBeforeCreateNewInventory.js:67` | `mysql/controllers/location.js:66` |
| B | POST | `/api/db_location/sub-location-path` | `check` `validateFields` | solo con sesión | `pages/inventory/utils/CreateLocationModal.jsx:85` | `mysql/controllers/sub_location_paths.js:4` |
| B | POST | `/api/db_record/checking` | — | solo con sesión | `pages/staff/detail/components/equipment_components/ModalReturnDeviceFromStaff.jsx:78` | `mysql/controllers/items_events.js:438` |
| B | POST | `/api/db_record/inserting-record-refactored` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx:573` | `mysql/controllers/recordEvent.js:59` |
| B | POST | `/api/db_record/inserting-record` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndingEventButton.jsx:368` | `mysql/controllers/recordEvent.js:6` |
| B | POST | `/api/db_record/removing-row-item-event-record` | — | solo con sesión | `pages/staff/detail/components/equipment_components/ModalReturnDeviceFromStaff.jsx:87` | `mysql/controllers/items_events.js:457` |
| B | POST | `/api/db_shipment/package-list` | — | solo con sesión | `pages/inventory/actions/utils/ExpandedShipmentView.jsx:25` | `mysql/controllers/shipment.js:151` |
| B | POST | `/api/db_shipment/search` | — | solo con sesión | `pages/inventory/actions/ShipmentRecord.jsx:53` | `mysql/controllers/shipment.js:111` |
| B | POST | `/api/db_stripe/new_stripe` | — | solo con sesión | `pages/authentication/actions/insertingStripeAccountInSqlDb.jsx:16` | `mysql/controllers/stripe.js:6` |
| B | POST | `/api/db_sub_location/sub-locations` | `check` `validateFields` | solo con sesión | `pages/inventory/utils/CreateSubLocationModal.jsx:38` | `mysql/controllers/sub_location.js:159` |
| B | DELETE | `/api/document/folder/:id` | — | solo con sesión | `pages/Profile/Documents/Documents.jsx:103` | `controller/document.js:756` |
| B | PUT | `/api/document/folder/:id` | — | solo con sesión | `pages/Profile/Documents/FolderDialog.jsx:121` | `controller/document.js:718` |
| B | POST | `/api/document/folders` | — | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/innerComponents/assignmentComponents/documents/ContractDocumentsPicker.jsx:54` | `controller/document.js:659` |
| B | POST | `/api/document/new_folder` | — | solo con sesión | `pages/Profile/Documents/FolderDialog.jsx:126` | `controller/document.js:617` |
| B | POST | `/api/document/verification/consumer_member/signed_document` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:295` | `controller/document.js:821` |
| B | POST | `/api/document/verification/member/signed_document` | — | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/innerComponents/assignmentComponents/assignment/AssignmentDevicesToMember.jsx:316` | `controller/document.js:864` |
| B | POST | `/api/document/verification/staff_member/signed_document` | — | solo con sesión | `pages/consumers/action/assingmentComponents/AssignemntNewDeviceInInventory.jsx:176` | `controller/document.js:779` |
| B | POST | `/api/error_log/error_log` | — | solo con sesión | `components/utils/ErrorBoundaryComponent.jsx:94` | `controller/errorLog.js:39` |
| B | POST | `/api/event-log/feed-event-log` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/actions/ReplaceDevice.jsx:121` | `controller/eventLog.js:9` |
| B | GET | `/api/event/all-users-and-transactions-per-event` | — | solo con sesión | `pages/events/quickGlance/consumer/CustomerInformationSection.jsx:49` | `controller/auth.js:219` |
| B | GET | `/api/event/event-list-per-company` | — | solo con sesión | `pages/home/components/EventsDevicesChart.jsx:35` | `controller/event.js:190` |
| B | GET | `/api/event/event-staff-detail/:id` | — | solo con sesión | `pages/events/quickGlance/staff/table/StaffTable.jsx:37` | `controller/event.js:245` |
| B | POST | `/api/event/staff-all-events` | — | solo con sesión | `pages/consumers/action/ModalAssignDeviceInEvent.jsx:43` | `controller/event.js:228` |
| B | POST | `/api/event/update-event-inventory-freshest-data` | — | solo con sesión | `pages/events/quickGlance/components/addSerialNumberRangeToEvent/ContainerForm.jsx:56` | `controller/event.js:596` |
| B | PATCH | `/api/event/update-events` | — | solo con sesión | `pages/Profile/company_info/components/Body.jsx:228` | `controller/event.js:465` |
| B | POST | `/api/event/update-global-state` | — | solo con sesión | `pages/events/quickGlance/components/addSerialNumberRangeToEvent/addingItemsMethod/Sequential.jsx:26` | `controller/event.js:530` |
| B | POST | `/api/image/images` | — | solo con sesión | `pages/consumers/tables/LeasesTable.jsx:33` | `controller/image.js:23` |
| B | POST | `/api/image/new_image` | — | solo con sesión | `pages/events/newEventProcess/inventory/newItemSetup/components/storeAndGenerateImageUrl.jsx:33` | `controller/image.js:5` |
| B | PATCH | `/api/item/edit-item/:id` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx:647` | `controller/item.js:22` |
| B | GET | `/api/item/list-items` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/ButtonSections.jsx:53` | `controller/item.js:80` |
| B | POST | `/api/item/list-items` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/ButtonSections.jsx:61` | `controller/item.js:80` |
| B | POST | `/api/nodemailer/assignig-device-notification` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/actions/transactions/useCreateTransaction.js:172` | `nodeMailer/notifications.js:118` |
| B | POST | `/api/nodemailer/confirm-returned-device-notification` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/transaction/useTransactionDeviceActions.js:61` | `nodeMailer/notifications.js:126` |
| B | POST | `/api/nodemailer/consumer-lease-return-device-notification` | — | solo con sesión | `pages/consumers/action/notification/LeaseEndedEmailNotification.jsx:19` | `nodeMailer/notifications.js:873` |
| B | POST | `/api/nodemailer/customize-message-notification` | — | solo con sesión | `pages/conditionalPage/components/modals/RegisterMembersToEvent.jsx:215` | `nodeMailer/notifications.js:915` |
| B | POST | `/api/nodemailer/deposit-collected-notification` | — | solo con sesión | `pages/consumers/action/deposit/Capturing.jsx:143` | `nodeMailer/notifications.js:227` |
| B | POST | `/api/nodemailer/deposit-return-notification` | — | solo con sesión | `pages/consumers/action/deposit/Releasing.jsx:127` | `nodeMailer/notifications.js:219` |
| B | POST | `/api/nodemailer/device-report-per-transaction` | — | solo con sesión | `components/notification/email/ItemReportForClient.jsx:12` | `nodeMailer/notifications.js:211` |
| B | POST | `/api/nodemailer/feedback-email-notification` | — | solo con sesión | `components/notification/email/FeedbackEvent.jsx:17` | `nodeMailer/notifications.js:441` |
| B | POST | `/api/nodemailer/internal-single-email-notification` | — | solo con sesión | `pages/inventory/details/detailComponent/components/DeleteItemModal.jsx:185` | `nodeMailer/notifications.js:336` |
| B | POST | `/api/nodemailer/invoice-notification` | — | solo con sesión | `pages/payment/ServicePaymentConfirmation.jsx:130` | `nodeMailer/notifications.js:376` |
| B | POST | `/api/nodemailer/liability-contract-consumer-email-notification` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:323` | `nodeMailer/notifications.js:579` |
| B | POST | `/api/nodemailer/liability-contract-email-notification` | — | solo con sesión | `pages/consumers/action/assingmentComponents/AssignemntNewDeviceInInventory.jsx:191` | `nodeMailer/notifications.js:591` |
| B | POST | `/api/nodemailer/liability-contract-member-email-notification` | — | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/innerComponents/assignmentComponents/assignment/AssignmentDevicesToMember.jsx:422` | `nodeMailer/notifications.js:567` |
| B | POST | `/api/nodemailer/lost-device-fee-notification` | — | solo con sesión | `pages/consumers/action/chargeAllDevicesFolder/ChargeAllListDeviceCash.jsx:95` | `nodeMailer/notifications.js:275` |
| B | POST | `/api/nodemailer/massive-event-customer-notification` | — | solo con sesión | `components/notification/email/EmailNotification.jsx:32` | `nodeMailer/notifications.js:415` |
| B | POST | `/api/nodemailer/new_invitation` ✅ cerrada después | — | solo con sesión | `pages/events/quickGlance/staff/components/EditingStaff.jsx:178` | `nodeMailer/notifications.js:328` |
| B | POST | `/api/nodemailer/refund-notification` | — | solo con sesión | `pages/consumers/utils/sendRefundReceiptEmail.jsx:16` | `nodeMailer/notifications.js:384` |
| B | POST | `/api/nodemailer/returned-items-to-renter-notification` | — | solo con sesión | `components/notification/email/EmailReturnRentalItems.jsx:91` | `nodeMailer/notifications.js:677` |
| B | POST | `/api/nodemailer/send-consumer-app-instructions` | — | solo con sesión | `components/notification/email/EventLinkNotification.jsx:61` | `nodeMailer/notifications.js:368` |
| B | POST | `/api/nodemailer/single-email-notification` | — | solo con sesión | `components/notification/email/SingleEmail.jsx:87` | `nodeMailer/notifications.js:320` |
| B | POST | `/api/nodemailer/staff_internal_notification` | — | solo con sesión | `pages/events/quickGlance/staff/components/EditingStaff.jsx:250` | `nodeMailer/notifications.js:352` |
| B | POST | `/api/post/new-post` | — | solo con sesión | `pages/posts/action/NewPost.jsx:182` | `controller/post.js:4` |
| B | DELETE | `/api/post/post-delete/:id` | — | solo con sesión | `pages/posts/components/Header.jsx:22` | `controller/post.js:52` |
| B | PATCH | `/api/post/post-update/:id` | — | solo con sesión | `pages/posts/action/EditPost.jsx:235` | `controller/post.js:71` |
| B | POST | `/api/post/posts` | — | solo con sesión | `pages/posts/action/EditPost.jsx:121` | `controller/post.js:21` |
| B | POST | `/api/receiver/create-bulk-item-transaction-in-user` | — | solo con sesión | `pages/consumers/action/transaction/AuthorizedDeposit.jsx:245` | `controller/receiver.js:429` |
| B | POST | `/api/receiver/delete-bulk-devices-pool` | — | solo con sesión | `pages/events/quickGlance/inventory/action/EditingForEventInventory.jsx:90` | `controller/receiver.js:278` |
| B | POST | `/api/receiver/list-receiver-returned-issue` | — | solo con sesión | `pages/events/quickGlance/components/FormatToDisplayDetail.jsx:25` | `controller/receiver.js:353` |
| B | POST | `/api/receiver/receiver-assignation` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:431` | `controller/receiver.js:24` |
| B | POST | `/api/receiver/receiver-assigned-list` | — | solo con sesión | `pages/consumers/hooks/useConsumerAssignedDevices.js:54` | `controller/receiver.js:294` |
| B | POST | `/api/receiver/receiver-assigned-users-list` | — | solo con sesión | `pages/consumers/tables/ExpandedRow.jsx:57` | `controller/receiver.js:309` |
| B | POST | `/api/receiver/receiver-assigned` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/AssigningDevice/AddingDevicesToPaymentIntent.jsx:137` | `controller/receiver.js:47` |
| B | GET | `/api/receiver/receiver-pool-list` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx:169` | `controller/receiver.js:177` |
| B | POST | `/api/receiver/receiver-pool-list` | — | solo con sesión | `components/utils/ReturnSingleItemInTransaction.jsx:15` | `controller/receiver.js:245` |
| B | POST | `/api/receiver/receiver-returned-issue` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/actions/ReplaceDevice.jsx:110` | `controller/receiver.js:337` |
| B | PATCH | `/api/receiver/receiver-update/:id` | — | solo con sesión | `components/utils/ReturnSingleItemInTransaction.jsx:28` | `controller/receiver.js:99` |
| B | PATCH | `/api/receiver/receiver-update/:id` | — | solo con sesión | `components/utils/ReturnSingleItemInTransaction.jsx:28` | `controller/receiver.js:99` |
| B | POST | `/api/receiver/receivers-pool-bulk` | — | solo con sesión | `pages/events/quickGlance/components/addSerialNumberRangeToEvent/addingItemsMethod/actions/useInsertDeviceIntoEventTableRecord.jsx:35` | `controller/receiver.js:162` |
| B | PATCH | `/api/receiver/receivers-pool-update/:id` | — | solo con sesión | `components/utils/ReturnSingleItemInTransaction.jsx:49` | `controller/receiver.js:229` |
| B | POST | `/api/receiver/receivers-pool` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:125` | `controller/receiver.js:145` |
| B | DELETE | `/api/receiver/remove-transaction/:id` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/AssigningDevice/hooks/useDeviceStatus.js:88` | `controller/receiver.js:446` |
| B | PATCH | `/api/receiver/transaction-all-items-returned-at-once` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/transaction/useTransactionDeviceActions.js:232` | `controller/receiver.js:415` |
| B | PATCH | `/api/receiver/transaction-return-all-items-in-pool` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/transaction/useTransactionDeviceActions.js:236` | `controller/receiver.js:401` |
| B | PATCH | `/api/receiver/update-bulk-items-in-pool` | — | solo con sesión | `components/utils/ReturnItemsInBulk.jsx:36` | `controller/receiver.js:131` |
| B | PATCH | `/api/receiver/update-bulk-items-in-transaction` | — | solo con sesión | `components/utils/ReturnItemsInBulk.jsx:19` | `controller/receiver.js:117` |
| B | POST | `/api/stripe/save-transaction` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:413` | `controller/transaction.js:11` |
| B | POST | `/api/stripe/stripe-transaction-no-regular-user` | — | solo con sesión | `pages/consumers/action/assingmentComponents/actions.jsx:384` | `controller/stripe.js:879` |
| B | POST | `/api/subscription/new_subscription` | — | solo con sesión | `components/stripe/payment/ConfirmSubscription.jsx:56` | `controller/subscription.js:6` |
| B | POST | `/api/subscription/search_subscription` | — | solo con sesión | `pages/events/newEventProcess/subscription/Main.jsx:36` | `controller/subscription.js:51` |
| B | GET | `/api/subscription/subscriptions/:id` | — | solo con sesión | `pages/events/newEventProcess/subscription/Main.jsx:75` | `controller/stripe.js:1001` |
| B | PATCH | `/api/subscription/update-subscription/:id` | — | solo con sesión | `pages/events/newEventProcess/subscription/Main.jsx:89` | `controller/subscription.js:22` |
| B | POST | `/api/transaction-audit-log/create-audit` | — | solo con sesión | `pages/events/quickGlance/consumer/ConsumerDetail/AssigningDevice/AddingDevicesToPaymentIntent.jsx:236` | `controller/transactionAuditLog.js:5` |
| B | POST | `/api/transaction/save-transaction` | — | solo con sesión | `pages/payment/Confirmation.jsx:173` | `controller/transaction.js:11` |
| B | POST | `/api/transaction/transaction` | — | solo con sesión | `pages/consumers/DetailPerConsumer.jsx:67` | `controller/transaction.js:115` |
| B | POST | `/api/transaction/update-multiple-documents` | — | solo con sesión | `pages/events/quickGlance/components/formatEventDetailInfo/EndEventButton.jsx:628` | `controller/transaction.js:167` |
| B | PATCH | `/api/transaction/update-transaction/:id` | — | solo con sesión | `pages/consumers/action/deposit/Capturing.jsx:139` | `controller/transaction.js:82` |
| C | POST | `/api/db_lease/status` | `canReadInventory` | solo con sesión | `pages/staff/components/StaffAssignedDevicesTable.jsx:30` | `mysql/controllers/lease.js:444` |
| C | POST | `/api/db_member/bulk-members` | `canCreate` | solo con sesión | `pages/conditionalPage/components/modals/addNewMember/MultipleFromXLSX.jsx:170` | `mysql/controllers/members.js:194` |
| C | POST | `/api/db_member/bulk-return` | `canUpdate` | solo con sesión | `pages/conditionalPage/tables/OverdueDevicesTable.jsx:156` | `mysql/controllers/members.js:1890` |
| C | POST | `/api/db_member/consulting-member` | `canRead` | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/innerComponents/UpdateMemberInformation.jsx:33` | `mysql/controllers/members.js:684` |
| C | POST | `/api/db_member/delete-member-assigned-device-lease` | `canDelete` | no la llama | — | `mysql/controllers/members.js:1674` |
| C | POST | `/api/db_member/delete-member-info` | `canDelete` | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/Header.jsx:149` | `mysql/controllers/members.js:642` |
| C | POST | `/api/db_member/member-fees` | `canRead` | no la llama | — | `mysql/controllers/members.js:1602` |
| C | POST | `/api/db_member/new-member-assigned-device-lease` | `canCreate` | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/innerComponents/assignmentComponents/assignment/AssignmentDevicesToMember.jsx:340` | `mysql/controllers/members.js:734` |
| C | POST | `/api/db_member/new-member` | `canCreate` | solo con sesión | `pages/conditionalPage/components/modals/addNewMember/Single.jsx:202` | `mysql/controllers/members.js:29` |
| C | POST | `/api/db_member/overdue-leases` | `canRead` | solo con sesión | `pages/conditionalPage/components/MembersStatsRow.jsx:72` | `mysql/controllers/members.js:1831` |
| C | POST | `/api/db_member/remove-row-lease-member` | `canDelete` | no la llama | — | `mysql/controllers/members.js:1772` |
| C | POST | `/api/db_member/retrieve-members-assigned-devices` | `canRead` | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/Header.jsx:96` | `mysql/controllers/members.js:459` |
| C | POST | `/api/db_member/settle-member-fee` | `canUpdate` | solo con sesión | `pages/conditionalPage/tables/detailTableComponents/acions/fee/ChargeMemberDeviceFee.jsx:201` | `mysql/controllers/members.js:1425` |
| C | POST | `/api/db_member/update-member-assigned-device-lease` | `canUpdate` | solo con sesión | `pages/conditionalPage/tables/detailTableComponents/acions/EditRowInformation.jsx:47` | `mysql/controllers/members.js:1202` |
| C | PATCH | `/api/db_member/update-member-info` | `canUpdate` | solo con sesión | `pages/conditionalPage/components/memberDetailsDashboard/innerComponents/GuardianInfoSection.jsx:59` | `mysql/controllers/members.js:579` |
| C | DELETE | `/api/document/:id` | `canManage` | solo con sesión | `pages/Profile/Documents/ViewDocument.jsx:82` | `controller/document.js:272` |
| C | GET | `/api/document/triggers` | `canManage` | pública y con sesión | `pages/Profile/Documents/EditDocument.jsx:45` | `controller/document.js:185` |
| C | GET | `/api/document/types` | `canManage` | pública y con sesión | `pages/Profile/Documents/EditDocument.jsx:45` | `controller/document.js:169` |
| C | POST | `/api/document/upload/xlsx` | `canManage` `uploadXLSX.single` | no la llama | — | `controller/document.js:1622` |
| C | POST | `/api/document/upload` | `canManage` `upload.single` | solo con sesión | `components/documents/DocumentUpload.jsx:141` | `controller/document.js:70` |
| C | GET | `/api/document` | `canManage` | no la llama | — | `controller/document.js:130` |
| C | POST | `/api/school/consent/record` | `canCreate` | no la llama | — | `mysql/controllers/school.js:703` |
| C | POST | `/api/school/consent/request` | `canCreate` | solo con sesión | `pages/conditionalPage/utils/guardianConsentApi.js:84` | `mysql/controllers/school.js:748` |
| C | POST | `/api/school/consent/resend` | `canCreate` | solo con sesión | `pages/conditionalPage/utils/guardianConsentApi.js:98` | `mysql/controllers/school.js:885` |
| C | POST | `/api/school/consent/status` | `canRead` | solo con sesión | `pages/conditionalPage/utils/guardianConsentApi.js:34` | `mysql/controllers/school.js:1229` |
| C | POST | `/api/school/consent` | `canRead` | solo con sesión | `pages/conditionalPage/utils/guardianConsentApi.js:11` | `mysql/controllers/school.js:1206` |
| C | POST | `/api/school/dashboard` | `canRead` | no la llama | — | `mysql/controllers/school.js:76` |
| C | POST | `/api/school/guardians/add` | `canCreate` | solo con sesión | `pages/conditionalPage/utils/guardianConsentApi.js:73` | `mysql/controllers/school.js:498` |
| C | POST | `/api/school/guardians/search` | `canRead` | solo con sesión | `pages/conditionalPage/utils/guardianConsentApi.js:123` | `mysql/controllers/school.js:603` |
| C | POST | `/api/school/guardians` | `canRead` | solo con sesión | `pages/conditionalPage/utils/guardianConsentApi.js:110` | `mysql/controllers/school.js:465` |
| C | POST | `/api/school/roster` | `canRead` | no la llama | — | `mysql/controllers/school.js:107` |
| C | POST | `/api/school/settings/consent-enforcement` | `canUpdate` | solo con sesión | `pages/Profile/school_compliance/utils/schoolComplianceUtils.js:33` | `mysql/controllers/school.js:1318` |
| C | POST | `/api/school/settings` | `canRead` | solo con sesión | `pages/Profile/school_compliance/utils/schoolComplianceUtils.js:20` | `mysql/controllers/school.js:1276` |
| C | POST | `/api/school/student/access-log` | `canRead` | no la llama | — | `mysql/controllers/school.js:430` |
| C | POST | `/api/school/student/erase` | `canUpdate` | no la llama | — | `mysql/controllers/school.js:370` |
| C | POST | `/api/school/student/export` | `canRead` | no la llama | — | `mysql/controllers/school.js:191` |
| D | POST | `/api/admin/invalidate-all-sessions` | `optionalJWT` | no la llama | — | `controller/admin.js:884` |
| D | GET | `/api/auth/:id` | `optionalJWT` | pública y con sesión | `pages/authentication/signatureVerificationDocuments/Consumer.jsx:81` | `controller/auth.js:68` |
| D | POST | `/api/consumer/stripe/create-customer` | `optionalJWT` | no la llama | — | `controller/stripe.js:17` |
| D | POST | `/api/consumer/stripe/find-customer` | `optionalJWT` | no la llama | — | `controller/stripe.js:718` |
| D | GET | `/api/consumer/users` | `optionalJWT` | no la llama | — | `controller/auth.js:11` |
| D | POST | `/api/consumer/users` | `optionalJWT` | no la llama | — | `controller/auth.js:11` |
| D | POST | `/api/stripe/account_link` | `optionalJWT` | pública y con sesión | `pages/authentication/RegisterStripeConnectedAccount.jsx:60` | `controller/stripe.js:93` |
| D | POST | `/api/stripe/account_sessions` | `optionalJWT` | solo con sesión | `components/stripe/connected_account/dashboard.jsx:26` | `controller/stripe.js:118` |
| D | POST | `/api/stripe/accounts` | `optionalJWT` | pública y con sesión | `pages/authentication/RegisterStripeConnectedAccount.jsx:25` | `controller/stripe.js:52` |
| D | POST | `/api/stripe/cancel/subscriptions/:id` | `optionalJWT` | no la llama | — | `controller/stripe.js:560` |
| D | POST | `/api/stripe/company-account-stripe/update` | `optionalJWT` | no la llama | — | `controller/stripe.js:242` |
| D | POST | `/api/stripe/company-account-stripe` | `optionalJWT` | pública y con sesión | `pages/authentication/actions/createStripeAccount.jsx:11` | `controller/stripe.js:982` |
| D | POST | `/api/stripe/create-payment-intent-customized` | `optionalJWT` | solo con sesión | `pages/consumers/action/ModalAssignDeviceInEvent.jsx:170` | `controller/stripe.js:324` |
| D | POST | `/api/stripe/create-payment-intent-subscription` | `optionalJWT` | solo con sesión | `pages/conditionalPage/tables/detailTableComponents/acions/fee/ChargeMemberDeviceFee.jsx:143` | `controller/stripe.js:350` |
| D | POST | `/api/stripe/create-payment-intent` | `optionalJWT` `publicPaymentRateLimit` `validatePublicPaymentPayload` `attachServerIdempotencyKey` | no la llama | — | `controller/stripe.js:273` |
| D | POST | `/api/stripe/create-subscriptions_no_trial` | `optionalJWT` | solo con sesión | `pages/events/newEventProcess/subscription/Main.jsx:154` | `controller/stripe.js:433` |
| D | POST | `/api/stripe/create-subscriptions` | `optionalJWT` | solo con sesión | `pages/subscription/MainPage.jsx:46` | `controller/stripe.js:375` |
| D | GET | `/api/stripe/invoices` | `optionalJWT` | solo con sesión | `pages/Profile/billing/components/component/InvoiceTables.jsx:15` | `controller/stripe.js:603` |
| D | POST | `/api/stripe/invoices` | `optionalJWT` | no la llama | — | `controller/stripe.js:603` |
| D | POST | `/api/stripe/payment_intents/:id/update-payment-method` | `optionalJWT` | solo con sesión | `components/stripe/checkout/StripeCheckoutUpdatePaymentMethod.jsx:73` | `controller/stripe.js:623` |
| D | GET | `/api/stripe/payment_intents/:id` | `optionalJWT` | solo con sesión | `pages/consumers/action/deposit/Capturing.jsx:44` | `controller/stripe.js:920` |
| D | POST | `/api/stripe/payment_methods/:id/attach` | `optionalJWT` | solo con sesión | `components/stripe/elements/AddNewCreditCard.jsx:61` | `controller/stripe.js:664` |
| D | GET | `/api/stripe/payment-intents/search` | `optionalJWT` | no la llama | — | `controller/stripe.js:684` |
| D | POST | `/api/stripe/payment-method/subscriptions/:id` | `optionalJWT` | no la llama | — | `controller/stripe.js:644` |
| D | DELETE | `/api/stripe/remove-duplicate/:id` | `optionalJWT` | no la llama | — | `controller/stripe.js:900` |
| D | DELETE | `/api/stripe/removing/:id` | `optionalJWT` | no la llama | — | `controller/transaction.js:185` |
| D | POST | `/api/stripe/save-transaction-admin-dashboard` | `optionalJWT` | no la llama | — | `controller/transaction.js:35` |
| D | POST | `/api/stripe/setup-search` | `optionalJWT` | solo con sesión | `components/stripe/payment/ConfirmSubscription.jsx:31` | `controller/stripe.js:478` |
| D | POST | `/api/stripe/stripe-transaction` | `optionalJWT` | no la llama | — | `controller/stripe.js:752` |
| D | GET | `/api/stripe/stripe-transactions-saved-list` | `optionalJWT` | no la llama | — | `controller/stripe.js:965` |
| D | POST | `/api/stripe/stripe-transactions-saved-list` | `optionalJWT` | no la llama | — | `controller/stripe.js:965` |
| D | DELETE | `/api/stripe/subscriptions/:id` | `optionalJWT` | no la llama | — | `controller/stripe.js:584` |
| D | GET | `/api/stripe/subscriptions/:id` | `optionalJWT` | no la llama | — | `controller/stripe.js:524` |
| D | GET | `/api/stripe/transaction` | `optionalJWT` | no la llama | — | `controller/transaction.js:115` |
| D | PATCH | `/api/stripe/updating-subscription/:id` | `optionalJWT` | solo con sesión | `pages/Profile/billing/components/component/ModalCancelOptions.jsx:87` | `controller/stripe.js:540` |
| E | POST | `/api/stripe/partial-refund` | `publicPaymentRateLimit` `validateRefundPayload` `idempotencyMutationCache` | solo con sesión | `pages/consumers/components/UI/ExpandedLostButtons.jsx:78` | `controller/stripe.js:858` |
| E | POST | `/api/stripe/payment-intents/:id/cancel` | `publicPaymentRateLimit` `validatePaymentIntentIdParam` `idempotencyMutationCache` | solo con sesión | `pages/consumers/action/deposit/Releasing.jsx:101` | `controller/stripe.js:813` |
| E | POST | `/api/stripe/payment-intents/:id/capture` | `publicPaymentRateLimit` `validatePaymentIntentIdParam` `idempotencyMutationCache` | solo con sesión | `pages/consumers/action/deposit/Capturing.jsx:114` | `controller/stripe.js:788` |
| E | POST | `/api/stripe/refund` | `publicPaymentRateLimit` `validateRefundPayload` `idempotencyMutationCache` | solo con sesión | `pages/consumers/components/UI/ExpandedLostButtons.jsx:132` | `controller/stripe.js:837` |
| F | POST | `/api/admin/manually_logout` | — | no la llama | — | `controller/admin.js:396` |
| F | POST | `/api/admin/new_admin_user` | `check` `validateFields` | no la llama | — | `controller/admin.js:17` |
| F | GET | `/api/admin/receiver-assigned` ✅ cerrada después | — | no la llama | — | `controller/receiver.js:47` |
| F | POST | `/api/admin/users` | — | no la llama | — | `controller/admin.js:636` |
| F | DELETE | `/api/article/article-delete/:id` | — | no la llama | — | `controller/article.js:40` |
| F | PATCH | `/api/article/article-edit/:id` | — | no la llama | — | `controller/article.js:57` |
| F | GET | `/api/article/articles` | — | no la llama | — | `controller/article.js:25` |
| F | POST | `/api/auth` | `check` | no la llama | — | `controller/auth.js:91` |
| F | GET | `/api/cash-report/cash-report` | — | no la llama | — | `controller/cashReport.js:27` |
| F | POST | `/api/company/assign-location` | — | no la llama | — | `controller/company.js:242` |
| F | POST | `/api/company/event-consumer-signatures` | — | no la llama | — | `controller/document.js:537` |
| F | GET | `/api/company/search-company` | — | no la llama | — | `controller/company.js:173` |
| F | PATCH | `/api/company/update-signatures` | — | no la llama | — | `controller/document.js:572` |
| F | GET | `/api/db_company/check-company-exists` | — | no la llama | — | `mysql/controllers/item.js:1525` |
| F | POST | `/api/db_company/companies_information` | — | no la llama | — | `mysql/controllers/company.js:83` |
| F | POST | `/api/db_company/company-inventory-pagination` ✅ cerrada después | — | no la llama | — | `mysql/controllers/item.js:1917` |
| F | POST | `/api/db_company/company-inventory-with-current-warehouse-status` | — | no la llama | — | `mysql/controllers/item.js:2444` |
| F | POST | `/api/db_company/delete-bulk-items` | — | no la llama | — | `mysql/controllers/item.js:3645` |
| F | POST | `/api/db_company/get-inventory-company` | — | no la llama | — | `mysql/controllers/item.js:1849` |
| F | POST | `/api/db_company/inventory-based-on-location-and-sublocation` | — | no la llama | — | `mysql/controllers/item.js:1994` |
| F | POST | `/api/db_company/retrieve-company-items-with-locations` | — | no la llama | — | `mysql/controllers/item.js:2444` |
| F | POST | `/api/db_company/returning-leased-equipment` | — | no la llama | — | `mysql/controllers/item.js:832` |
| F | POST | `/api/db_company/search-inventory` | — | no la llama | — | `mysql/controllers/item.js:1314` |
| F | POST | `/api/db_company/update-content-in-container` | — | no la llama | — | `mysql/controllers/item.js:1618` |
| F | POST | `/api/db_company/update-group-items` | — | no la llama | — | `mysql/controllers/company.js:193` |
| F | POST | `/api/db_company/update-items-based-on-serial-number` | — | no la llama | — | `mysql/controllers/item.js:2625` |
| F | POST | `/api/db_consumer_attending_event_record/consulting-consumer-event` | — | no la llama | — | `mysql/controllers/consumerAttendingEvent.js:26` |
| F | POST | `/api/db_consumer_attending_event_record/consumer-events` | — | no la llama | — | `mysql/controllers/consumerAttendingEvent.js:51` |
| F | POST | `/api/db_consumer_attending_event_record/new_consumer_event` | — | no la llama | — | `mysql/controllers/consumerAttendingEvent.js:6` |
| F | POST | `/api/db_consumer/consumers_information` | — | no la llama | — | `mysql/controllers/consumer.js:39` |
| F | POST | `/api/db_event/device-final-status` | — | no la llama | — | `mysql/controllers/item.js:1152` |
| F | POST | `/api/db_event/events_company` | — | no la llama | — | `mysql/controllers/events.js:211` |
| F | POST | `/api/db_event/remove-item-inventory-event` | — | no la llama | — | `mysql/controllers/items_events.js:301` |
| F | POST | `/api/db_event/retrieve-item-group-quantity-with-format` | — | no la llama | — | `mysql/controllers/item.js:2059` |
| F | POST | `/api/db_event/update-item-in-table-after-being-added-to-event-from-container` | — | no la llama | — | `mysql/controllers/item.js:1648` |
| F | PUT | `/api/db_item/event-items` | — | no la llama | — | `mysql/controllers/items_events.js:205` |
| F | GET | `/api/db_item/fragment-data` | — | no la llama | — | `mysql/controllers/item.js:1408` |
| F | GET | `/api/db_item/location-count` | — | no la llama | — | `mysql/controllers/item.js:1473` |
| F | GET | `/api/db_item/search-inventory` | — | no la llama | — | `mysql/controllers/item.js:1361` |
| F | GET | `/api/db_location/companies/:id/locations/tree` | — | no la llama | — | `mysql/controllers/location.js:357` |
| F | PUT | `/api/db_location/locations/:id/inventory` | `check` `validateFields` | no la llama | — | `mysql/controllers/location.js:101` |
| F | POST | `/api/db_record/checking-lease-information` | — | no la llama | — | `mysql/controllers/items_events.js:507` |
| F | DELETE | `/api/db_shipment/:shipment_id` | — | no la llama | — | `mysql/controllers/shipment.js:90` |
| F | PUT | `/api/db_shipment/:shipment_id` | — | no la llama | — | `mysql/controllers/shipment.js:52` |
| F | POST | `/api/db_shipment` | — | no la llama | — | `mysql/controllers/shipment.js:5` |
| F | GET | `/api/db_sub_location/locations/:location_id/sub-locations` | — | no la llama | — | `mysql/controllers/sub_location.js:203` |
| F | DELETE | `/api/db_sub_location/sub-locations/:id` ✅ cerrada después | — | no la llama | — | `mysql/controllers/sub_location.js:288` |
| F | PUT | `/api/db_sub_location/sub-locations/:id` ✅ cerrada después | — | no la llama | — | `mysql/controllers/sub_location.js:241` |
| F | POST | `/api/db_sub_location/sub-locations/check` | — | no la llama | — | `mysql/controllers/sub_location.js:325` |
| F | GET | `/api/document/folder/:id` | — | no la llama | — | `controller/document.js:702` |
| F | POST | `/api/document/verification/member/check_signed_document` | — | no la llama | — | `controller/document.js:1187` |
| F | PATCH | `/api/document/verification/member/signing_document` | — | no la llama | — | `controller/document.js:1528` |
| F | GET | `/api/event-log/activity` | — | no la llama | — | `controller/eventLog.js:11` |
| F | GET | `/api/event/event-inventory-based-on-period` | — | no la llama | — | `controller/event.js:419` |
| F | GET | `/api/event/event-list` | — | no la llama | — | `controller/event.js:174` |
| F | POST | `/api/feedback/new-feedback` | — | no la llama | — | `controller/feedback.js:3` |
| F | GET | `/api/health` | — | no la llama | — | `—` |
| F | POST | `/api/heavy-task/process` | — | no la llama | — | `controller/heavyTask.js:7` |
| F | POST | `/api/item/create-item` | — | no la llama | — | `controller/item.js:5` |
| F | POST | `/api/lease/create-lease` | — | no la llama | — | `controller/lease.js:5` |
| F | DELETE | `/api/lease/delete-lease/:id` | — | no la llama | — | `controller/lease.js:56` |
| F | PATCH | `/api/lease/edit-lease/:id` | — | no la llama | — | `controller/lease.js:22` |
| F | GET | `/api/lease/lease-list` | — | no la llama | — | `controller/lease.js:80` |
| F | POST | `/api/lease/lease-list` | — | no la llama | — | `controller/lease.js:80` |
| F | POST | `/api/nodemailer/completed-task-notification` | — | no la llama | — | `nodeMailer/notifications.js:883` |
| F | POST | `/api/nodemailer/confirmation-account` | — | no la llama | — | `nodeMailer/notifications.js:284` |
| F | POST | `/api/nodemailer/customized-notification` | — | no la llama | — | `nodeMailer/notifications.js:312` |
| F | POST | `/api/nodemailer/early-remind-notification` | — | no la llama | — | `nodeMailer/notifications.js:241` |
| F | POST | `/api/nodemailer/edit-device-admin` | — | no la llama | — | `nodeMailer/notifications.js:257` |
| F | POST | `/api/nodemailer/event-staff-notification` | — | no la llama | — | `nodeMailer/notifications.js:249` |
| F | POST | `/api/nodemailer/events-begin-reminder` | — | no la llama | — | `nodeMailer/notifications.js:344` |
| F | POST | `/api/nodemailer/failed-task-notification` | — | no la llama | — | `nodeMailer/notifications.js:891` |
| F | POST | `/api/nodemailer/leased-equip-staff-notification` | — | no la llama | — | `nodeMailer/notifications.js:360` |
| F | POST | `/api/nodemailer/login-existing-consumer` | — | no la llama | — | `nodeMailer/notifications.js:292` |
| F | POST | `/api/nodemailer/member-email-notification` | — | no la llama | — | `nodeMailer/notifications.js:907` |
| F | POST | `/api/nodemailer/member-lease-return-device-notification` | — | no la llama | — | `nodeMailer/notifications.js:134` |
| F | POST | `/api/nodemailer/terms-and-conditions-acceptance` | — | no la llama | — | `nodeMailer/notifications.js:717` |
| F | POST | `/api/notificationlog/notification-feed-log` | — | no la llama | — | `controller/notificationLog.js:9` |
| F | GET | `/api/notificationlog/notification-log-list` | — | no la llama | — | `controller/notificationLog.js:11` |
| F | GET | `/api/post/posts` | — | no la llama | — | `controller/post.js:21` |
| F | POST | `/api/receiver/all-transaction-by-event-and-consumer` | — | no la llama | — | `controller/receiver.js:463` |
| F | DELETE | `/api/receiver/delete-device-pool/:id` | — | no la llama | — | `controller/receiver.js:262` |
| F | GET | `/api/receiver/list-receiver-returned-issue` | — | no la llama | — | `controller/receiver.js:353` |
| F | DELETE | `/api/receiver/receiver-pool-device/:id` | — | no la llama | — | `controller/receiver.js:262` |
| F | PATCH | `/api/receiver/receiver-returned-issue/:id` | — | no la llama | — | `controller/receiver.js:368` |
| F | PATCH | `/api/receiver/receiver-returned-issue/:id` | — | no la llama | — | `controller/receiver.js:368` |
| F | PUT | `/api/receiver/receiver-update/:id` | — | no la llama | — | `controller/receiver.js:99` |
| F | PUT | `/api/receiver/receiver-update/:id` | — | no la llama | — | `controller/receiver.js:99` |
| F | PATCH | `/api/receiver/receivers-pool-update-bulk` | — | no la llama | — | `controller/receiver.js:384` |
| F | GET | `/api/search/advance_searching_query` | — | no la llama | — | `controller/search.js:2858` |
| F | GET | `/api/search/searching_consumer` | — | no la llama | — | `controller/search.js:979` |
| F | GET | `/api/search/searching_device_transaction` | — | no la llama | — | `controller/search.js:1085` |
| F | GET | `/api/search/searching_events` | — | no la llama | — | `controller/search.js:1036` |
| F | GET | `/api/search/searching_` | — | no la llama | — | `controller/search.js:837` |
| F | GET | `/api/search/searching_previous_consumer` | — | no la llama | — | `controller/search.js:1000` |
| F | GET | `/api/search/searching_staff` | — | no la llama | — | `controller/search.js:1061` |
| F | GET | `/api/staff/__staff-search` | — | no la llama | — | `controller/admin.js:671` |
| F | GET | `/api/staff/consumers/search` | — | no la llama | — | `controller/stripe.js:1017` |
| F | GET | `/api/status` | — | no la llama | — | `—` |
| F | POST | `/api/stripe/customer` | — | no la llama | — | `controller/stripe.js:17` |
| F | POST | `/api/stripe/save-transaction-template-no-regular-user` | — | no la llama | — | `controller/transaction.js:59` |
| F | POST | `/api/subscription/company-subscription` | — | no la llama | — | `controller/subscription.js:74` |
| F | POST | `/api/subscription/new_subscription_no_trial` | — | no la llama | — | `controller/stripe.js:433` |
| F | GET | `/api/subscription/search_subscription` | — | no la llama | — | `controller/subscription.js:51` |
| F | GET | `/api/subscription/searching-subscription/subscriptions/:id` | — | no la llama | — | `controller/stripe.js:938` |
| F | GET | `/api/transaction-audit-log/audit-log` | — | no la llama | — | `controller/transactionAuditLog.js:24` |
| F | POST | `/api/transaction/check-and-release-deposit-transactions` | — | no la llama | — | `controller/transaction.js:221` |
| F | DELETE | `/api/transaction/remove-duplicate-transaction/:id` | — | no la llama | — | `controller/transaction.js:185` |
| F | POST | `/api/transaction/save-transaction-admin-dashboard` | — | no la llama | — | `controller/transaction.js:35` |
| F | POST | `/api/transaction/save-transaction-template-no-regular-user` | — | no la llama | — | `controller/transaction.js:59` |
| F | GET | `/api/transaction/subscriptions/:id` | — | no la llama | — | `controller/stripe.js:938` |
