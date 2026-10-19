# Payloads de la API (generado)

> GENERADO por `node scripts/extract-api-payloads.js` — no editar a mano.
> Regenerar después de tocar rutas o controladores.

Contrapartida tipada: **`docs/api-payloads.d.ts`** (interfaces + mapa `ApiEndpoints`).

## Cómo leer esta tabla

- **Requeridos**: campos que el handler valida explícitamente (responde `400` si faltan).
- **Opcionales / otros**: campos que el handler lee pero no valida, o que tienen default.
  Muchos son obligatorios *de facto* (la columna SQL es `NOT NULL`); la ausencia de
  validación no es permiso para omitirlos.
- **Auth**: middlewares de la ruta. `validateJWT` = header **`x-token`** con el JWT
  (no `Authorization: Bearer`). `checkTokenVersion` invalida tokens de sesiones revocadas.
  `authorizePermission("recurso","acción")` exige ese permiso en el rol del staff.
- **Fuente**: `archivo:línea` del handler. Es la autoridad final; esta tabla es un índice.
- Los tipos NO están en esta tabla a propósito: viven en el `.d.ts`, donde se marca que
  son inferidos.

Cobertura: **457 de 507** endpoints montados tienen payload detectado.
Routers presentes en el repo pero **no montados** en `index.js` (no existen en runtime): `routes/twilio.js`, `mysql/routes/location_manager.js`, `routes/cloudinary.js`.

## `/api/admin`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DELETE | `/api/admin/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("staff", "delete")` | `controller/admin.js:629` |
| GET | `/api/admin/:id` | — | `clientSecret` `company` `device` `eventSelected` `paymentIntent` `provider` `type` `user` ⚠️ el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo) | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("staff", "read")` | `controller/admin.js:821` |
| GET | `/api/admin/activity-logs/vocabulary` | — | — | — | — | `validateJWT` `checkTokenVersion` | `controller/staffActivityLog.js:286` |
| GET | `/api/admin/activity-logs` | — | — | — | `action` `actor_type` `consumer` `end_date` `event_id` `include_automatic` `item_id` `limit` `member_id` `page` `serial_number` `source` `staff_member_id` `start_date` `target_id` `target_model` | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("staff", "read")` | `controller/staffActivityLog.js:228` |
| POST | `/api/admin/activity-logs` | `action` `target_model` | `details` `target_id` | — | — | `validateJWT` `checkTokenVersion` | `controller/staffActivityLog.js:276` |
| PATCH | `/api/admin/admin-user/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("staff", "update")` | `controller/admin.js:587` |
| GET | `/api/admin/check-online-status/:email` | — | — | `email` | — | — | `controller/admin.js:994` |
| POST | `/api/admin/invalidate-all-sessions` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `optionalJWT` | `controller/admin.js:1208` |
| POST | `/api/admin/login` | `mfaCode` | `email` `forceLogin` `password` `rememberMe` | — | — | `validateFields` | `controller/admin.js:101` |
| POST | `/api/admin/logout` | — | `uid` | — | — | — | `controller/admin.js:375` |
| POST | `/api/admin/manually_logout` | — | `uid` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/admin.js:426` |
| POST | `/api/admin/mfa/disable` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `validateJWT` | `controller/admin.js:1092` |
| POST | `/api/admin/mfa/generate` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `validateMfaEnrollment` | `controller/admin.js:1027` |
| POST | `/api/admin/mfa/verify` | — | `token` | — | — | `validateMfaEnrollment` | `controller/admin.js:1061` |
| POST | `/api/admin/new_admin_user` | — | `email` `imageProfile` `lastName` `name` `password` `phone` | — | — | `check("email", "Email must be provided").isEmail()` `validateFields` | `controller/admin.js:31` |
| PATCH | `/api/admin/profile/:id` | — | — ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL | `id` | — | `validateJWT` | `controller/admin.js:488` |
| GET | `/api/admin/protected` | — | — | — | — | `validateJWT` | `middlewares/checkValidateToken.js:4` |
| POST | `/api/admin/receiver-assignation` | — | `active` `adminUser` `company` `device` `eventSelected` `event_id` `paymentIntent` `provider` `timeStamp` `user` ⚠️ el body se pasa completo a `new Receivers()`: los campos son los del esquema `models/Receivers.js` | — | — | — | `controller/receiver.js:24` |
| GET | `/api/admin/receiver-assigned` | — | `paymentIntent` | — | — | `validateJWT` | `controller/receiver.js:47` |
| GET | `/api/admin/renew` | — | — | — | — | `validateJWT` | `controller/admin.js:665` |
| PATCH | `/api/admin/update-password` | `mfaCode` | `email` `password` `resetToken` `uid` | — | — | — | `controller/admin.js:726` |
| POST | `/api/admin/users` | — | `clientSecret` `company` `device` `eventSelected` `paymentIntent` `provider` `type` `user` ⚠️ el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo) | — | — | — | `controller/admin.js:821` |
| POST | `/api/admin/verify-password` | `password` | — | — | — | `validateJWT` `checkTokenVersion` | `controller/admin.js:884` |

## `/api/article`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/article/article-creation` | — | `active` `adminUser` `body` `company` `event` `image` `title` ⚠️ el body se pasa completo a `new Article()`: los campos son los del esquema `models/Article.js` | — | — | `validateJWT` | `controller/article.js:5` |
| DELETE | `/api/article/article-delete/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/article.js:40` |
| PATCH | `/api/article/article-edit/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/article.js:57` |
| GET | `/api/article/articles` | — | `active` `adminUser` `body` `company` `event` `image` `title` ⚠️ el body se usa como FILTRO Mongo en `Article.find()`: cualquier subconjunto de los campos de `models/Article.js` (`{}` trae todo) | — | — | — | `controller/article.js:25` |

## `/api/auth`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/auth/:id` | — | — | `id` | — | `optionalJWT` | `controller/auth.js:108` |
| PATCH | `/api/auth/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `optionalJWT` `requireSessionFromDashboard` | `controller/auth.js:208` |
| GET | `/api/auth/all-consumers-based-on-all-events-per-company/:companyID` | — | — | `companyID` | — | `validateJWT` `checkTokenVersion` | `controller/auth.js:330` |
| POST | `/api/auth/new` | — | `category` `company_providers` `email` `eventSelected` `event_providers` `groupName` `lastName` `name` `notes` `phoneNumber` `privacyPolicy` `profile_picture` `provider` ⚠️ el body se pasa completo a `new User()`: los campos son los del esquema `models/User.js` | — | — | `check("lastName", "Last name is mandatory").not().isEmpty()` `check("email", "Email is mandatory").isEmail()` `validateFields` `optionalJWT` `requireSessionFromDashboard` | `controller/auth.js:160` |
| GET | `/api/auth/user-query` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | `optionalJWT` | `controller/auth.js:58` |
| POST | `/api/auth/user-query` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `optionalJWT` `requireSessionFromDashboard` | `controller/auth.js:55` |
| GET | `/api/auth/users` | — | — | — | — | `optionalJWT` | `controller/auth.js:51` |
| POST | `/api/auth/users` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `optionalJWT` | `controller/auth.js:51` |
| POST | `/api/auth` | — | `userInfoEmailCheck` | — | — | `check("email", "Email is mandatory").isEmail()` | `controller/auth.js:131` |

## `/api/cache_update`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/cache_update/remove-cache` | — | `key` | — | — | — | `middlewares/cacheUpdateDelete.js:4` |

## `/api/cash-report`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/cash-report/cash-report` | — | `admin` `amount` `attendee` `company` `createdAt` `deviceLost` `event` `paymentIntent_charge_transaction` `typeCollection` ⚠️ el body se usa como FILTRO Mongo en `CashReport.find()`: cualquier subconjunto de los campos de `models/CashReport.js` (`{}` trae todo) | — | — | — | `controller/cashReport.js:27` |
| POST | `/api/cash-report/cash-reports` | — | `admin` `amount` `attendee` `company` `createdAt` `deviceLost` `event` `paymentIntent_charge_transaction` `typeCollection` ⚠️ el body se usa como FILTRO Mongo en `CashReport.find()`: cualquier subconjunto de los campos de `models/CashReport.js` (`{}` trae todo) | — | — | — | `controller/cashReport.js:27` |
| POST | `/api/cash-report/create-cash-report` | — | `admin` `amount` `attendee` `company` `createdAt` `deviceLost` `event` `paymentIntent_charge_transaction` `typeCollection` ⚠️ el body se pasa completo a `new CashReport()`: los campos son los del esquema `models/CashReport.js` | — | — | — | `controller/cashReport.js:7` |
| POST | `/api/cash-report/remove-cash-report/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/cashReport.js:56` |
| PATCH | `/api/cash-report/update-cash-report/:id` | — | `id` `template` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/cashReport.js:73` |

## `/api/cloudinary`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/cloudinary/upload-image` | — | `context` `imageFile` `imageID` `tags` ⚠️ montado como middleware directo (`app.use("/api/cloudinary", handler)`): CUALQUIER método y subpath bajo `/api/cloudinary` llega a este handler; `routes/cloudinary.js` no está montado | — | — | — | `cloudinary/connection.js:4` |

## `/api/company`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/company/assign-location` | — | `company_id` `location_name` `user_email` | — | — | — | `controller/company.js:250` |
| POST | `/api/company/companies` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `controller/company.js:227` |
| POST | `/api/company/consulting-signatures` | — | `company_id` `contract_url` `item_ids` `staff_member_id` `verification_id` | — | — | — | `controller/document.js:623` |
| POST | `/api/company/consumer-signatures` | — | `company_id` `consumer_id` `event_id` | — | — | `optionalJWT` | `controller/document.js:748` |
| POST | `/api/company/event-consumer-signatures` | — | `accepted` `company_id` `consumer_id` `contract_url` `date` `event_id` `signature` | — | — | — | `controller/document.js:689` |
| POST | `/api/company/new_provider` | `address` `companyName` `contactInfo` `creator` `industry` `services` | — | — | — | — | `controller/providerCompany.js:3` |
| POST | `/api/company/new` | — | `address` `company_logo` `company_name` `employees` `industry` `location` `main_email` `owner` `phone` `stripe_customer_id` `website` | — | — | — | `controller/company.js:12` |
| GET | `/api/company/provider-companies` | — | — | — | `creator` | — | `controller/providerCompany.js:92` |
| POST | `/api/company/provider-company/:id` | `creator` | `provider_id` | — | — | — | `controller/providerCompany.js:137` |
| POST | `/api/company/provider-upload-document/:id` | — | `company_id` `created_by` `document_type` `title` `uploadedAt` | `id` | — | `upload.single("document")` | `controller/providerCompany.js:321` |
| GET | `/api/company/search-company` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `controller/company.js:181` |
| POST | `/api/company/search-company` | — | `address` `company_logo` `company_name` `email_branding` `employees` `industry` `location` `main_email` `owner` `phone` `roleLabels` `stripe_connected_account` `stripe_customer_id` `structure` `website` ⚠️ el body se usa como FILTRO Mongo en `Company.find()`: cualquier subconjunto de los campos de `models/Company.js` (`{}` trae todo) | — | — | — | `controller/company.js:158` |
| POST | `/api/company/signatures-for-consumer-member` | — | `company_id` `consumer_member_id` `contract_url` `date` `item_ids` `signature` `verification_id` | — | — | `optionalJWT` | `controller/document.js:545` |
| POST | `/api/company/signatures` | — | `company_id` `contract_url` `date` `item_ids` `signature` `staff_member_id` `verification_id` | — | — | — | `controller/document.js:460` |
| PATCH | `/api/company/update_provider/:id` | — | `address` `city` `companyName` `contactInfo` `email` `phone` `postalCode` `services` `state` `status` `street` | `id` | — | — | `controller/providerCompany.js:193` |
| PATCH | `/api/company/update-company/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("company", "update")` | `controller/company.js:115` |
| PATCH | `/api/company/update-company/register-process/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/company.js:115` |
| PATCH | `/api/company/update-signatures` | — | `signatureID` `transactionID` | — | — | — | `controller/document.js:724` |

## `/api/consumer`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/consumer/stripe/create-customer` | — | `email` `name` `phoneNumber` | — | — | `optionalJWT` | `controller/stripe.js:30` |
| POST | `/api/consumer/stripe/find-customer` | — | `email` `name` `phone` `stripeid` ⚠️ el body se usa como FILTRO Mongo en `StripeCustomer.find()`: cualquier subconjunto de los campos de `models/StripeCustomer.js` (`{}` trae todo) | — | — | `optionalJWT` | `controller/stripe.js:763` |
| GET | `/api/consumer/users` | — | — | — | — | `optionalJWT` | `controller/auth.js:51` |
| POST | `/api/consumer/users` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `optionalJWT` | `controller/auth.js:51` |

## `/api/db_company`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DELETE | `/api/db_company/:id` | — | `company_id` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("company", "delete")` | `mysql/controllers/company.js:70` |
| DELETE | `/api/db_company/categories/:category_id` | `company_id` | — | `category_id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/categories_groups.js:51` |
| POST | `/api/db_company/categories/upsert` | `category_name` `company_id` | `active` `sub_category_name` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "create")` | `mysql/controllers/categories_groups.js:27` |
| POST | `/api/db_company/categories` | `company_id` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "read")` | `mysql/controllers/categories_groups.js:5` |
| GET | `/api/db_company/check-company-exists` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `mysql/controllers/item.js:1572` |
| POST | `/api/db_company/check-item` | — | `preference` `role` ⚠️ rest-spread `...bodyFilters`: acepta campos extra | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:1313` |
| POST | `/api/db_company/companies_information` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/company.js:83` |
| POST | `/api/db_company/company-inventory-grouped-full` | `company_id` | — | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/categories_groups.js:159` |
| POST | `/api/db_company/company-inventory-pagination` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | `direction` `lastItemId` | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:1978` |
| POST | `/api/db_company/company-inventory-structure` | `company_id` | — | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2498` |
| POST | `/api/db_company/company-inventory-with-current-warehouse-status` | — | `company_id` | — | — | — | `mysql/controllers/item.js:2537` |
| POST | `/api/db_company/consulting-company` | — | — ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL | — | — | — | `mysql/controllers/company.js:48` |
| GET | `/api/db_company/current-inventory/:company_id` | — | — | `company_id` | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:1286` |
| POST | `/api/db_company/delete-bulk-items` | `company_id` `item_ids` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/item.js:3775` |
| POST | `/api/db_company/filter-suppliers-info-items` | — | `company_id` | — | — | — | `mysql/controllers/item.js:3719` |
| POST | `/api/db_company/get-grouped-inventory-by-search-parameter` | `company_id` `searchParameter` | — | — | — | — | `mysql/controllers/item.js:3588` |
| POST | `/api/db_company/get-inventory-company` | — | — ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL | — | — | — | `mysql/controllers/item.js:1896` |
| POST | `/api/db_company/get-location-item-types-hierarchy` | `company_id` | — | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:3445` |
| DELETE | `/api/db_company/groups/:group_id` | `company_id` | — | `group_id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/categories_groups.js:125` |
| POST | `/api/db_company/groups/upsert` | `company_id` `item_group` | `active` `sub_item_group` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "create")` | `mysql/controllers/categories_groups.js:101` |
| POST | `/api/db_company/groups` | `company_id` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "read")` | `mysql/controllers/categories_groups.js:79` |
| POST | `/api/db_company/industry` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/company.js:95` |
| POST | `/api/db_company/insert-new-single-item` | — | `brand` `category_name` `company` `company_id` `container` `containerSpotLimit` `container_id` `cost` `current_location` `descript_item` `display_item` `extra_serial_number` `image_url` `item_group` `location` `location_name` `main_warehouse` `ownership` `return_date` `returnedRentedInfo` `serial_number` `sub_category_name` `sub_item_group` `sub_location` `sub_location_name` `sub_location_parent_id` `supplier_info` `warehouse` | — | — | — | `mysql/controllers/item.js:163` |
| POST | `/api/db_company/inventory-based-on-location-and-sublocation` | — | `company_id` `location` `location_id` ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | `sub_location` | — | `mysql/controllers/item.js:2087` |
| POST | `/api/db_company/inventory-based-on-submitted-parameters` | — | `query` `values` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2451` |
| POST | `/api/db_company/inventory-query` | `queryName` | `params` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2411` |
| POST | `/api/db_company/locations` | `company_id` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "read")` | `mysql/controllers/location.js:620` |
| POST | `/api/db_company/new_company` | — | `city_address` `company_name` `email_company` `industry` `phone_number` `state_address` `street_address` `zip_address` | — | — | — | `mysql/controllers/company.js:11` |
| POST | `/api/db_company/retrieve-company-inventory` | `company_id` `location` | `category_name` `expected` `item_group` `limit` | — | — | — | `mysql/controllers/item.js:4174` |
| POST | `/api/db_company/retrieve-company-items-with-locations` | — | `company_id` | — | — | — | `mysql/controllers/item.js:2537` |
| POST | `/api/db_company/return-event-devices` | `category_name` `event_id` `item_group` | `serial_numbers` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2246` |
| POST | `/api/db_company/returning-leased-equipment` | — | `enableAssignFeature` `item_id` `return_date` `returnedRentedInfo` | — | — | — | `mysql/controllers/item.js:879` |
| GET | `/api/db_company/search-inventory` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `mysql/controllers/item.js:1408` |
| POST | `/api/db_company/search-inventory` | — | `company_id` `searchValue` | — | — | — | `mysql/controllers/item.js:1361` |
| POST | `/api/db_company/update_company` | `company_id` | — ⚠️ rest-spread `...updateFields`: acepta campos extra | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("company", "update")` | `mysql/controllers/company.js:151` |
| POST | `/api/db_company/update-all-items-in-inventory` | — | `brand` `category_name` `company_id` `container` `containerSpotLimit` `cost` `current_location` `descript_item` `display_item` `enableAssignFeature` `extra_serial_number` `image_url` `item_group` `location` `main_warehouse` `originalTemplate` `ownership` `return_date` `returnedRentedInfo` `sub_location` `supplier_info` `update_at` `warehouse` | — | — | — | `mysql/controllers/item.js:2630` |
| POST | `/api/db_company/update-content-in-container` | — | `container_items` `item_id` `ref` | — | — | — | `mysql/controllers/item.js:1665` |
| POST | `/api/db_company/update-group-items` | — | `brand` `category_name` `company` `company_id` `container` `containerSpotLimit` `cost` `current_location` `data` `descript_item` `enableAssignFeature` `extra_serial_number` `image_url` `item_group` `location` `main_warehouse` `ownership` `return_date` `sub_location` `update_at` `warehouse` | — | — | — | `mysql/controllers/company.js:193` |
| POST | `/api/db_company/update-items-based-on-alphanumeric-serial-number` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2836` |
| POST | `/api/db_company/update-items-based-on-serial-number` | — | `brand` `category_name` `container` `containerSpotLimit` `cost` `current_location` `descript_item` `display_item` `enableAssignFeature` `extra_serial_number` `image_url` `item_group` `location` `main_warehouse` `originalTemplate` `ownership` `return_date` `returnedRentedInfo` `sub_location` `supplier_info` `warehouse` | — | — | — | `mysql/controllers/item.js:2718` |

## `/api/db_consumer`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DELETE | `/api/db_consumer/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("consumer", "delete")` | `mysql/controllers/consumer.js:124` |
| POST | `/api/db_consumer/consulting-consumer` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/consumer.js:25` |
| POST | `/api/db_consumer/consumers_information` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/consumer.js:40` |
| POST | `/api/db_consumer/new_consumer` | — | `email` `first_name` `last_name` `phone_number` | — | — | `optionalJWT` `requireSessionFromDashboard` | `mysql/controllers/consumer.js:6` |

## `/api/db_consumer_attending_event_record`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_consumer_attending_event_record/consulting-consumer-event` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/consumerAttendingEvent.js:26` |
| POST | `/api/db_consumer_attending_event_record/consumer-events` | — | `event` | — | — | — | `mysql/controllers/consumerAttendingEvent.js:51` |
| POST | `/api/db_consumer_attending_event_record/new_consumer_event` | — | `consumer_attending_id` `event_attended_id` | — | — | — | `mysql/controllers/consumerAttendingEvent.js:6` |

## `/api/db_event`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DELETE | `/api/db_event/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("event", "delete")` | `mysql/controllers/events.js:251` |
| POST | `/api/db_event/allocate-device-container-event` | `company_id` `data` `event_id` | `company_id_nosql` `eventName` `logistic_status` `warehouse` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/items_events.js:655` |
| POST | `/api/db_event/allocate-device-event` | `data` | `category_name` `company_id` `event_id` `item_group` `logistic_status` `warehouse` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("event", "update")` | `mysql/controllers/items_events.js:558` |
| POST | `/api/db_event/confirm-item-return` | `company_id` `noSqlEventName` `serial_numbers` `user_id` | `location` `noSqlCompanyId` `sub_location` | — | — | — | `mysql/controllers/item.js:3987` |
| POST | `/api/db_event/consulting-event` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/events.js:146` |
| POST | `/api/db_event/device-final-status-refactored` | — | `allInventoryOfEvent` `eventId` `groupingDevicesFromNoSQL` `update_at` | — | — | — | `mysql/controllers/item.js:1226` |
| POST | `/api/db_event/device-final-status` | — | `condition` `event_id` `serial_number` `status` `updated_at` | — | — | — | `mysql/controllers/item.js:1199` |
| POST | `/api/db_event/event_device_directly` | — | `event_id` `item_id` | — | — | — | `mysql/controllers/items_events.js:280` |
| POST | `/api/db_event/event_device` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/items_events.js:46` |
| POST | `/api/db_event/event_staff` | — | `event_id` `role` `staff_id` | — | — | — | `mysql/controllers/events.js:294` |
| POST | `/api/db_event/event-count/close` | — | `company_id` `event_id` `scanned` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/eventCount.js:242` |
| POST | `/api/db_event/event-count/reconcile` | — | `company_id` `event_id` `scanned` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "read")` | `mysql/controllers/eventCount.js:205` |
| GET | `/api/db_event/event-inventory/:id` | — | — | `id` | — | — | `mysql/controllers/events.js:329` |
| POST | `/api/db_event/event-inventory/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `mysql/controllers/items_events.js:413` |
| POST | `/api/db_event/events_company` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/events.js:212` |
| POST | `/api/db_event/events_information` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/events.js:179` |
| POST | `/api/db_event/inserting-items-in-event-from-container` | — | `event_id` `refDatabase` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/items_events.js:498` |
| POST | `/api/db_event/inventory-based-on-submitted-parameters` | — | `query` `values` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2451` |
| POST | `/api/db_event/inventory-query` | `queryName` | `params` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2411` |
| POST | `/api/db_event/lock-items-for-event` | `company_id` `event_id` `items` | — | — | — | — | `mysql/controllers/items_events.js:823` |
| POST | `/api/db_event/new_event` | — | `city_address` `company_assigned_event_id` `email_company` `event_name` `phone_number` `state_address` `street_address` `venue_name` `zip_address` | — | — | — | `mysql/controllers/events.js:33` |
| POST | `/api/db_event/remove-item-inventory-event` | — | `category_name` `event_id` `item_group` `serial_number` | — | — | — | `mysql/controllers/items_events.js:301` |
| POST | `/api/db_event/remove-reserved-items-for-event` | — | `company_id` `event_id` `item_id` | — | — | — | `mysql/controllers/items_events.js:917` |
| POST | `/api/db_event/reserve-items-for-event` | — | `company_id` `items` | — | — | `validateJWT` `authorizePermission("event", "update")` | `mysql/controllers/items_events.js:875` |
| POST | `/api/db_event/retrieve-item-group-location-quantity` | — | — ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL | — | — | `validateJWT` `authorizePermission("event", "read")` | `mysql/controllers/item.js:1896` |
| POST | `/api/db_event/retrieve-item-group-quantity-with-format` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/item.js:2152` |
| POST | `/api/db_event/retrieve-item-location-quantity-full-details` | `company_id` `item_group` `location` `quantity` | `category_name` `enableAssignFeature` `serial_number` `warehouse` | — | — | — | `mysql/controllers/item.js:1825` |
| POST | `/api/db_event/retrieve-item-location-quantity` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/item.js:1751` |
| POST | `/api/db_event/return-event-devices` | `category_name` `event_id` `item_group` | `serial_numbers` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2246` |
| POST | `/api/db_event/returning-item-refactored` | `allInventoryOfEvent` `groupingDevicesFromNoSQL` | `companyId` `update_at` | — | — | — | `mysql/controllers/item.js:1099` |
| POST | `/api/db_event/returning-item` | — | `category_name` `company_id` `item_group` `serial_number` `status` `update_at` | — | — | — | `mysql/controllers/item.js:1052` |
| POST | `/api/db_event/update-event/:event_id` | — | — ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL | `event_id` | — | — | `mysql/controllers/events.js:82` |
| POST | `/api/db_event/update-item-in-table-after-being-added-to-event-from-container` | — | `refDatabase` `warehouse` | — | — | — | `mysql/controllers/item.js:1695` |
| POST | `/api/db_event/update-status-item-based-on-event` | — | `event_id` `status` `update_at` | — | — | — | `mysql/controllers/events.js:364` |

## `/api/db_identifier`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_identifier/by-items` | `item_ids` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "read")` | `mysql/controllers/identifier.js:311` |
| POST | `/api/db_identifier/register-bulk` | `identifiers` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/identifier.js:181` |
| POST | `/api/db_identifier/register` | — | `id_type` `id_value` `item_id` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/identifier.js:76` |

## `/api/db_inventory`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_inventory/check-item` | — | `preference` `role` ⚠️ rest-spread `...bodyFilters`: acepta campos extra | — | — | `validateJWT` | `mysql/controllers/item.js:1313` |
| POST | `/api/db_inventory/check-large-data` | `company_id` `item_ids` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "read")` | `mysql/controllers/item.js:3157` |
| GET | `/api/db_inventory/container-items/:container_item_id` | — | — | `container_item_id` | — | — | `mysql/controllers/item.js:2915` |
| POST | `/api/db_inventory/container-items` | `child_ids` `container_item_id` | — | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2848` |
| DELETE | `/api/db_inventory/container/:container_item_id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `container_item_id` | — | — | `mysql/controllers/item.js:3028` |
| PUT | `/api/db_inventory/container/:container_item_id` | `child_ids` | — | `container_item_id` | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:3084` |
| POST | `/api/db_inventory/update-large-data` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/item.js:3246` |
| POST | `/api/db_inventory/update-location-sub-location` | `currentIndex` `newName` `path` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/item.js:3443` |

## `/api/db_item`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_item/:id(\\d+)` | `company_id` `item_id` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/item.js:610` |
| POST | `/api/db_item/bulk-item-alphanumeric` | `company_id` | `category_name` `location` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "create")` | `mysql/controllers/item.js:518` |
| POST | `/api/db_item/bulk-item-from-spreadsheet` | — | `company` `company_id` `defaults` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/inventoryImport.js:48` |
| POST | `/api/db_item/bulk-item` | `company_id` `max_serial_number` `min_serial_number` | `category_name` `location` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "create")` | `mysql/controllers/item.js:433` |
| GET | `/api/db_item/check-company-has-inventory` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `mysql/controllers/item.js:1728` |
| GET | `/api/db_item/check-inventory/:company_id` | — | — | `company_id` | — | `validateJWT` | `mysql/controllers/items_events.js:357` |
| POST | `/api/db_item/check-item` | — | `preference` `role` ⚠️ rest-spread `...bodyFilters`: acepta campos extra | — | — | `validateJWT` | `mysql/controllers/item.js:1313` |
| POST | `/api/db_item/consulting-item` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/item.js:584` |
| POST | `/api/db_item/consulting-row-item-assigned-event` | — | `company_assigned_event_id` `item_id` | — | — | — | `mysql/controllers/items_events.js:438` |
| POST | `/api/db_item/current-inventory` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/items_events.js:330` |
| POST | `/api/db_item/delete-bulk-items-criteria` | `category_name` `company_id` | `item_group` `serial_number` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/item.js:4086` |
| POST | `/api/db_item/delete-bulk-items` | `company_id` `item_ids` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/item.js:3775` |
| POST | `/api/db_item/delete-item` | `company_id` `item_id` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/item.js:610` |
| POST | `/api/db_item/edit-item` | — | `brand` `category_name` `company` `company_id` `container` `containerSpotLimit` `container_id` `container_items` `cost` `current_location` `descript_item` `display_item` `enableAssignFeature` `extra_serial_number` `image_url` `isItInContainer` `item_group` `item_id` `location` `location_id` `logistic_status` `main_warehouse` `ownership` `return_date` `returnedRentedInfo` `serial_number` `status` `sub_category_name` `sub_item_group` `sub_location` `supplier_info` `update_at` `warehouse` ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL · identificadores (al menos uno): `company_id` `item_id` `serial_number` · campos actualizables por lista blanca (el resto se ignora) | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/item.js:752` |
| PUT | `/api/db_item/event-items/bulk-update` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/items_events.js:67` |
| POST | `/api/db_item/event-items/search` | `company_id` | — ⚠️ rest-spread `...filters`: acepta campos extra | — | — | — | `mysql/controllers/items_events.js:136` |
| DELETE | `/api/db_item/event-items` | `event_id` `items` | — | — | — | — | `mysql/controllers/items_events.js:83` |
| PUT | `/api/db_item/event-items` | `company_id` `event_id` `items` `updates` | — | — | — | — | `mysql/controllers/items_events.js:205` |
| GET | `/api/db_item/fragment-data` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `mysql/controllers/item.js:1455` |
| POST | `/api/db_item/get-inventory-company` | — | — ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL | — | — | — | `mysql/controllers/item.js:1896` |
| POST | `/api/db_item/inventory_event/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `mysql/controllers/items_events.js:413` |
| POST | `/api/db_item/inventory-based-on-location-and-sublocation` | — | `company_id` `location` `location_id` ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | `sub_location` | — | `mysql/controllers/item.js:2087` |
| POST | `/api/db_item/inventory-based-on-submitted-parameters` | — | `query` `values` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2451` |
| POST | `/api/db_item/inventory-export` | — | `company_id` `filters` `search` `sortBy` `sortDir` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/inventoryExport.js:36` |
| POST | `/api/db_item/inventory-facets` | — | `company_id` `facets` `filters` `search` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/inventoryPage.js:132` |
| POST | `/api/db_item/inventory-page` | — | `company_id` `cursor` `filters` `pageSize` `search` `sortBy` `sortDir` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/inventoryPage.js:96` |
| POST | `/api/db_item/inventory-pagination` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | `direction` `lastItemId` | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:1978` |
| POST | `/api/db_item/inventory-query` | `queryName` | `params` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2411` |
| POST | `/api/db_item/item-out-warehouse` | `category_name` `company_id` `data` `item_group` `logistic_status` | `warehouse` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/item.js:937` |
| POST | `/api/db_item/items_information` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:669` |
| GET | `/api/db_item/location-count` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `mysql/controllers/item.js:1520` |
| POST | `/api/db_item/new_item` | — | `brand` `category_name` `company` `company_id` `container` `containerSpotLimit` `container_id` `cost` `current_location` `descript_item` `display_item` `extra_serial_number` `image_url` `item_group` `location` `location_name` `main_warehouse` `ownership` `return_date` `returnedRentedInfo` `serial_number` `sub_category_name` `sub_item_group` `sub_location` `sub_location_name` `sub_location_parent_id` `supplier_info` `warehouse` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "create")` | `mysql/controllers/item.js:163` |
| POST | `/api/db_item/retrieve-item-data` | `company_id` | — | — | — | `validateJWT` | `mysql/controllers/item.js:2498` |
| POST | `/api/db_item/retrieve-item-location-quantity` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/item.js:1751` |
| POST | `/api/db_item/return-event-devices` | `category_name` `event_id` `item_group` | `serial_numbers` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/item.js:2246` |
| POST | `/api/db_item/returning-item-refactored` | `allInventoryOfEvent` `groupingDevicesFromNoSQL` | `companyId` `update_at` | — | — | — | `mysql/controllers/item.js:1099` |
| GET | `/api/db_item/search-inventory` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `mysql/controllers/item.js:1408` |
| POST | `/api/db_item/search-inventory` | — | `company_id` `searchValue` | — | — | — | `mysql/controllers/item.js:1361` |
| GET | `/api/db_item/serial-suggest` | — | — | — | `company_id` `limit` `q` | `validateJWT` `checkTokenVersion` | `mysql/controllers/inventoryPage.js:176` |
| POST | `/api/db_item/tracking_item/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `mysql/controllers/item.js:1259` |
| POST | `/api/db_item/warehouse-items` | — | `preference` `role` ⚠️ rest-spread `...filters`: acepta campos extra | — | — | `validateJWT` | `mysql/controllers/item.js:720` |

## `/api/db_lease`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_lease/consulting-consumer-lease` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/lease.js:197` |
| POST | `/api/db_lease/consulting-lease` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/lease.js:179` |
| POST | `/api/db_lease/delete-consumer-lease-info` | — | `company_id` `consumer_member_id` `device_id` | — | — | — | `mysql/controllers/lease.js:396` |
| POST | `/api/db_lease/delete-lease-info` | — | `company_id` `device_id` `staff_member_id` | — | — | — | `mysql/controllers/lease.js:376` |
| POST | `/api/db_lease/new-consumer-lease` | — | `subscription_expected_return_data` `subscription_initial_date` | — | — | — | `mysql/controllers/lease.js:95` |
| POST | `/api/db_lease/new-lease` | — | `company_id` `device_id` `location` `staff_admin_id` `staff_member_id` `subscription_expected_return_data` `verification_id` | — | — | — | `mysql/controllers/lease.js:6` |
| POST | `/api/db_lease/status` | `company_id` | `lessee_type` `only_overdue` | — | — | `canReadInventory` | `mysql/controllers/lease.js:444` |
| POST | `/api/db_lease/update-consumer-lease-info` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/lease.js:296` |
| POST | `/api/db_lease/update-lease-info` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/lease.js:215` |

## `/api/db_location`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/db_location/companies/:company_id/location-paths-tree` | — | — | `company_id` `id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("location", "read")` | `mysql/controllers/sub_location_paths.js:58` |
| GET | `/api/db_location/companies/:company_id/locations/tree` | — | — | `company_id` `id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("location", "read")` | `mysql/controllers/location.js:357` |
| GET | `/api/db_location/companies/:id/locations` | — | — | `id` | — | `validateJWT` | `mysql/controllers/location.js:175` |
| POST | `/api/db_location/companies/:id/locations` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` | `mysql/controllers/location.js:175` |
| PUT | `/api/db_location/locations/:id/inventory` | `item_ids` | `company_id` | `id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` `check("company_id", "Company ID is required").not().isEmpty()` `validateFields` | `mysql/controllers/location.js:101` |
| POST | `/api/db_location/locations/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` `resolveLocationCompanyId` `authorizePermission("location", "delete")` | `mysql/controllers/location.js:563` |
| POST | `/api/db_location/locations` | `company_id` `location_name` | `address_details` `manager_id` `status` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("location", "create")` `check("location_name", "Location name is required").not().isEmpty()` `validateFields` | `mysql/controllers/location.js:66` |
| POST | `/api/db_location/sub-location-path/delete` | `company_id` `location_id` `sub_location_path` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("location", "delete")` `check("location_id", "location_id is required").not().isEmpty()` `check("sub_location_path", "sub_location_path must be a non-empty array").isArray({ min: 1 })` `validateFields` | `mysql/controllers/sub_location_paths.js:216` |
| POST | `/api/db_location/sub-location-path` | `company_id` `location_id` `sub_location_path` | `created_by` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("location", "create")` `check("location_id", "location_id is required").not().isEmpty()` `check("sub_location_path", "sub_location_path must be a non-empty array").isArray({ min: 1 })` `validateFields` | `mysql/controllers/sub_location_paths.js:4` |

## `/api/db_member`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_member/bulk-members` | — | `data` `image_url` `list` `members` `rows` | — | — | `canCreate` | `mysql/controllers/members.js:204` |
| POST | `/api/db_member/bulk-return` | `company_id` | `condition_note` `grade` `logistic_status` `member_ids` `return_status` `warehouse` | — | — | `canUpdate` | `mysql/controllers/members.js:1943` |
| POST | `/api/db_member/consulting-member` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `canRead` | `mysql/controllers/members.js:736` |
| POST | `/api/db_member/delete-member-assigned-device-lease` | — | `where` | — | — | `canDelete` | `mysql/controllers/members.js:1726` |
| POST | `/api/db_member/delete-member-info` | — | `ids` `member_id` `member_ids` | — | — | `canDelete` | `mysql/controllers/members.js:694` |
| POST | `/api/db_member/member-fees` | `company_id` | `companyId` `member_id` `status` | — | — | `canRead` | `mysql/controllers/members.js:1654` |
| POST | `/api/db_member/my-devices` | `email` `external_id` | — | — | — | — | `mysql/controllers/members.js:2023` |
| POST | `/api/db_member/new-member-assigned-device-lease` | — | `data` `items` `list` `rows` | — | — | `canCreate` | `mysql/controllers/members.js:786` |
| POST | `/api/db_member/new-member` | — | `address` `address_city` `address_state` `address_street` `address_zip` `company_id` `dateOfBirth` `date_of_birth` `dob` `email` `external_id` `first_name` `grade` `homeroom` `image_url` `last_name` `minor` `name` `parent_guardian_email` `parent_guardian_first_name` `parent_guardian_last_name` `parent_guardian_phone_number` `phone` `phoneNumber` `phone_number` | — | — | `canCreate` | `mysql/controllers/members.js:30` |
| POST | `/api/db_member/overdue-leases` | `company_id` | `grade` | — | — | `canRead` | `mysql/controllers/members.js:1883` |
| POST | `/api/db_member/remove-row-lease-member` | — | `companyId` `company_id` `deviceId` `device_id` `memberId` `member_id` | — | — | `canDelete` | `mysql/controllers/members.js:1824` |
| POST | `/api/db_member/retrieve-members-assigned-devices` | — | `where` | — | — | `canRead` | `mysql/controllers/members.js:491` |
| POST | `/api/db_member/settle-member-fee` | `company_id` `fee_id` `payment_intent` | `companyId` `device_id` `fee_amount` `fee_reason` `member_id` `paid_amount` `paid_at` `payment_method` `return_status` `status` | — | — | `canUpdate` | `mysql/controllers/members.js:1477` |
| POST | `/api/db_member/update-member-assigned-device-lease` | — | `update` `where` | — | — | `canUpdate` | `mysql/controllers/members.js:1254` |
| PATCH | `/api/db_member/update-member-info` | `member_id` | `dateOfBirth` `date_of_birth` `dob` `id` `memberId` `phone` `phoneNumber` | — | — | `canUpdate` | `mysql/controllers/members.js:611` |

## `/api/db_record`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_record/checking-lease-information` | — | — ⚠️ cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL | — | — | — | `mysql/controllers/items_events.js:507` |
| POST | `/api/db_record/checking` | — | `company_assigned_event_id` `item_id` | — | — | — | `mysql/controllers/items_events.js:438` |
| POST | `/api/db_record/inserting-record-refactored` | — | `dataToStoreAsRecord` `event` `groupingInventoryByGroupName` | — | — | — | `mysql/controllers/recordEvent.js:59` |
| POST | `/api/db_record/inserting-record` | — | `activity` `category_name` `email` `event` `item_group` `payment_id` `serial_number` `status` | — | — | — | `mysql/controllers/recordEvent.js:6` |
| POST | `/api/db_record/removing-row-item-event-record` | — | `event_id` `item_id` | — | — | — | `mysql/controllers/items_events.js:457` |

## `/api/db_shipment`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DELETE | `/api/db_shipment/:shipment_id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `shipment_id` | — | — | `mysql/controllers/shipment.js:90` |
| PUT | `/api/db_shipment/:shipment_id` | — | — ⚠️ rest-spread `...updates`: acepta campos extra · el handler IGNORA el body (mandar `{}`) | `shipment_id` | — | — | `mysql/controllers/shipment.js:52` |
| POST | `/api/db_shipment/package-list` | `package_list` | — | — | — | — | `mysql/controllers/shipment.js:151` |
| POST | `/api/db_shipment/search` | `company_id` | — ⚠️ rest-spread `...filters`: acepta campos extra | — | — | — | `mysql/controllers/shipment.js:111` |
| POST | `/api/db_shipment` | `authorizer_name` `company_id` `courier` `destination` `event_id` `package_list` `recipient_name` `tracking_number` | — | — | — | — | `mysql/controllers/shipment.js:5` |

## `/api/db_staff`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/db_staff/companies` | — | — | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/staff.js:338` |
| POST | `/api/db_staff/company-staff/permissions` | — | `company_id` `staff_id` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/staff.js:215` |
| PATCH | `/api/db_staff/company-staff/role` | — | `company_id` `role_type` `staff_id` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/staff.js:184` |
| PUT | `/api/db_staff/company-staff/scope` | `categories` `company_id` `locations` `staff_id` | — | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("staff", "update")` | `mysql/controllers/staff.js:420` |
| PATCH | `/api/db_staff/company-staff` | `company_id` `staff_id` | `is_active` `role_type` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/staff.js:278` |
| POST | `/api/db_staff/company-staff` | — | `assigned_by` `company_id` `company_name` `role_type` `staff_id` | — | — | `validateJWT` `checkTokenVersion` | `mysql/controllers/staff.js:157` |
| POST | `/api/db_staff/consulting-member` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/staff.js:90` |
| POST | `/api/db_staff/new_member` | — | `email` `first_name` `last_name` `phone_number` | — | — | — | `mysql/controllers/staff.js:31` |

## `/api/db_stripe`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/db_stripe/consulting-stripe` | — | — ⚠️ cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`) · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `mysql/controllers/stripe.js:29` |
| POST | `/api/db_stripe/new_stripe` | — | `company_id` `stripe_id` | — | — | — | `mysql/controllers/stripe.js:6` |

## `/api/db_sub_location`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/db_sub_location/locations/:location_id/sub-locations` | — | — | `location_id` | — | — | `mysql/controllers/sub_location.js:204` |
| DELETE | `/api/db_sub_location/sub-locations/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "delete")` | `mysql/controllers/sub_location.js:320` |
| PUT | `/api/db_sub_location/sub-locations/:id` | — | `active` `name` `parent_id` | `id` | — | `validateJWT` `checkTokenVersion` `authorizePermission("inventory", "update")` | `mysql/controllers/sub_location.js:262` |
| POST | `/api/db_sub_location/sub-locations/check` | — | `location_id` `name` `parent_id` | — | — | — | `mysql/controllers/sub_location.js:370` |
| POST | `/api/db_sub_location/sub-locations` | `company_id` `location_id` `name` | `parent_id` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | `check("name", "Name is required").not().isEmpty()` `validateFields` | `mysql/controllers/sub_location.js:160` |

## `/api/devitrak`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PATCH | `/api/devitrak/:id` | — | `email` `staff_id` | `id` | — | — | `controller/devitrakApp.js:32` |
| POST | `/api/devitrak/new_acceptance` | — | `date` `documentsAndPolicies` `email` `signature` `staff_id` ⚠️ el body se pasa completo a `new DevitrakApp()`: los campos son los del esquema `models/DevitrakApp.js` | — | — | — | `controller/devitrakApp.js:4` |

## `/api/document`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DELETE | `/api/document/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `canManage` | `controller/document.js:414` |
| GET | `/api/document/:id` | — | — | `id` | — | `publicViewer` | `controller/document.js:155` |
| PATCH | `/api/document/:id` | — | `company_id` ⚠️ rest-spread `...body`: acepta campos extra | — | — | `canManage` | `controller/document.js:364` |
| PUT | `/api/document/:id` | — | `company_id` ⚠️ rest-spread `...body`: acepta campos extra | — | — | `canManage` | `controller/document.js:364` |
| GET | `/api/document/download/:documentId/:userId` | — | — | `documentId` `userId` | — | `publicViewer` | `controller/document.js:208` |
| POST | `/api/document/download/documentUrl` | — | `documentUrl` | — | — | `publicViewer` | `controller/document.js:444` |
| DELETE | `/api/document/folder/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `canManage` | `controller/document.js:904` |
| GET | `/api/document/folder/:id` | — | — | — | — | `canManage` | `controller/document.js:856` |
| PUT | `/api/document/folder/:id` | `documents` `folder_description` `folder_name` `trigger_action` | — | — | — | `canManage` | `controller/document.js:872` |
| POST | `/api/document/folders` | — | `company_id` | — | — | `canManage` | `controller/document.js:812` |
| POST | `/api/document/new_folder` | `company_id` `documents` `folder_description` `folder_name` `trigger_action` | — | — | — | `canManage` | `controller/document.js:769` |
| GET | `/api/document/triggers` | — | — | — | `company_id` | `canManage` | `controller/document.js:188` |
| GET | `/api/document/types` | — | — | — | `company_id` | `canManage` | `controller/document.js:172` |
| POST | `/api/document/upload/xlsx` | `company_id` | `company` `contact_staff_id` | — | — | `canManage` `uploadXLSX.single("document")` | `controller/document.js:1767` |
| POST | `/api/document/upload` | — | `company_id` `created_by` | — | — | `canManage` `upload.single("document")` | `controller/document.js:73` |
| POST | `/api/document/verification/consumer_member/check_signed_document` | — | `company_id` `consumer_member_id` `contract_url` `date_reference` `verificationID` | — | — | `publicViewer` | `controller/document.js:1188` |
| POST | `/api/document/verification/consumer_member/signed_document` | — | `assigner_staff_member_id` `company_id` `consumer_member_id` `contract_list` `date` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | `publicViewer` | `controller/document.js:963` |
| PATCH | `/api/document/verification/consumer_member/signing_document` | — | `contract_url` `verification_id` | — | — | `publicViewer` | `controller/document.js:1566` |
| POST | `/api/document/verification/member/check_signed_document` | — | `company_id` `contract_url` `date_reference` `member_id` `verificationID` | — | — | `publicViewer` | `controller/document.js:1329` |
| POST | `/api/document/verification/member/signed_document` | — | `assigner_staff_member_id` `company_id` `contract_list` `date` `member_id` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | `publicViewer` | `controller/document.js:1006` |
| PATCH | `/api/document/verification/member/signing_document` | — | `contract_url` `verification_id` | — | — | `publicViewer` | `controller/document.js:1673` |
| POST | `/api/document/verification/staff_member/check_signed_document` | — | `company_id` `contract_url` `date_reference` `staff_member_id` `verificationID` | — | — | `publicViewer` | `controller/document.js:1050` |
| POST | `/api/document/verification/staff_member/signed_document` | — | `assigner_staff_member_id` `company_id` `contract_list` `date` `staff_member_id` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | `publicViewer` | `controller/document.js:921` |
| PATCH | `/api/document/verification/staff_member/signing_document` | — | `contract_url` `verification_id` | — | — | `publicViewer` | `controller/document.js:1470` |
| GET | `/api/document` | — | — | — | `company_id` `document_type` `status` `trigger_action` | `canManage` | `controller/document.js:133` |

## `/api/error_log`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/error_log/error_log` | — | `componentStack` `error` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/errorLog.js:39` |

## `/api/event`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/event/all-users-and-transactions-per-event` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | `validateJWT` | `controller/auth.js:259` |
| POST | `/api/event/create-event` | — | `active` `company` `company_id` `configuration` `contactInfo` `contract_for` `deviceSetup` `eventInfoDetail` `extraServices` `extraServicesNeeded` `legal_contract` `legal_documents_list` `logistic_inventory_status` `qrCodeLink` `show` `staff` `subscription` `type` `user` ⚠️ el body se pasa completo a `new Event()`: los campos son los del esquema `models/Event.js` | — | — | `validateJWT` | `controller/event.js:11` |
| DELETE | `/api/event/delete-event/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` | `controller/event.js:142` |
| PATCH | `/api/event/edit-event/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` | `controller/event.js:97` |
| PUT | `/api/event/edit-event/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` | `controller/event.js:97` |
| PATCH | `/api/event/edit-staff-event/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` | `controller/event.js:42` |
| GET | `/api/event/event-inventory-based-on-period` | — | — | — | `company_id` `company_sql_id` `date2` | — | `controller/event.js:438` |
| GET | `/api/event/event-list-per-company` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `controller/event.js:194` |
| GET | `/api/event/event-list` | — | `active` `company` `company_id` `configuration` `contactInfo` `contract_for` `deviceSetup` `eventInfoDetail` `extraServices` `extraServicesNeeded` `legal_contract` `legal_documents_list` `logistic_inventory_status` `qrCodeLink` `show` `staff` `subscription` `type` `user` ⚠️ el body se usa como FILTRO Mongo en `Event.find()`: cualquier subconjunto de los campos de `models/Event.js` (`{}` trae todo) | — | — | — | `controller/event.js:178` |
| POST | `/api/event/event-list` | — | `active` `company` `company_id` `configuration` `contactInfo` `contract_for` `deviceSetup` `eventInfoDetail` `extraServices` `extraServicesNeeded` `legal_contract` `legal_documents_list` `logistic_inventory_status` `qrCodeLink` `show` `staff` `subscription` `type` `user` ⚠️ el body se usa como FILTRO Mongo en `Event.find()`: cualquier subconjunto de los campos de `models/Event.js` (`{}` trae todo) | — | — | — | `controller/event.js:178` |
| GET | `/api/event/event-staff-detail/:id` | — | — | `id` | — | — | `controller/event.js:249` |
| POST | `/api/event/staff-all-events` | — | `email` | — | — | — | `controller/event.js:232` |
| POST | `/api/event/update-event-inventory-freshest-data` | `event_id` | `updatedBy` | — | — | — | `controller/event.js:615` |
| PATCH | `/api/event/update-events` | `ids` `newValues` | — | — | — | — | `controller/event.js:484` |
| POST | `/api/event/update-global-state` | — | `event_id` | — | — | — | `controller/event.js:549` |

## `/api/event-log`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/event-log/activity` | — | — | — | — | — | `controller/eventLog.js:11` |
| POST | `/api/event-log/feed-event-log` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `controller/eventLog.js:9` |

## `/api/feedback`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/feedback/new-feedback` | — | `age` `aiComment` `aiInterpretation` `audioQuality` `audioStreamingInterest` `easeGettingReceiver` `easeReturningReceiver` `email` `eventId` `eventName` `expectationsComment` `gender` `improvementSuggestion` `interpretationQuality` `metExpectations` `name` `receivedService` `videoStreamingInterest` `wifiToCellularUse` | — | — | — | `controller/feedback.js:3` |

## `/api/health`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | — | — | — | — | — | — |

## `/api/heavy-task`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/heavy-task/process` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `controller/heavyTask.js:7` |

## `/api/image`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/image/images` | — | `category` `company` `item_group` `source` `time` ⚠️ el body se usa como FILTRO Mongo en `Image.find()`: cualquier subconjunto de los campos de `models/Image.js` (`{}` trae todo) | — | — | — | `controller/image.js:23` |
| POST | `/api/image/new_image` | — | `category` `company` `item_group` `source` `time` ⚠️ el body se pasa completo a `new Image()`: los campos son los del esquema `models/Image.js` | — | — | — | `controller/image.js:5` |

## `/api/inventory`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/inventory/create-inventory` | — | `batch` `company` `event` `items` `saveDefaultFormat` ⚠️ el body se pasa completo a `new Inventory()`: los campos son los del esquema `models/Inventory.js` | — | — | `validateJWT` | `controller/inventory.js:6` |
| DELETE | `/api/inventory/delete-inventory/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` | `controller/inventory.js:81` |
| PATCH | `/api/inventory/edit-inventory/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` | `controller/inventory.js:35` |
| GET | `/api/inventory/list-inventories` | — | — | — | — | `validateJWT` | `controller/inventory.js:117` |

## `/api/item`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/item/create-item` | — | `category` `company` `consumerUses` `createdBy` `dateCreated` `description` `group` `key` `ownership` `quantity` `resume` `value` ⚠️ el body se pasa completo a `new Item()`: los campos son los del esquema `models/Item.js` | — | — | — | `controller/item.js:5` |
| DELETE | `/api/item/delete-item/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` | `controller/item.js:56` |
| PATCH | `/api/item/edit-item/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/item.js:22` |
| GET | `/api/item/list-items` | — | `category` `company` `consumerUses` `createdBy` `dateCreated` `description` `group` `key` `ownership` `quantity` `resume` `value` ⚠️ el body se usa como FILTRO Mongo en `Item.find()`: cualquier subconjunto de los campos de `models/Item.js` (`{}` trae todo) | — | — | — | `controller/item.js:80` |
| POST | `/api/item/list-items` | — | `category` `company` `consumerUses` `createdBy` `dateCreated` `description` `group` `key` `ownership` `quantity` `resume` `value` ⚠️ el body se usa como FILTRO Mongo en `Item.find()`: cualquier subconjunto de los campos de `models/Item.js` (`{}` trae todo) | — | — | — | `controller/item.js:80` |

## `/api/jobs`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/jobs/:jobId` | — | — | `jobId` | — | `validateJWT` `requirePlatformRead` | `controller/jobs.js:53` |
| GET | `/api/jobs/owned/:jobId` | — | — | `jobId` | — | `validateJWT` | `controller/jobs.js:120` |
| GET | `/api/jobs/stats` | — | — | — | — | `validateJWT` `requirePlatformRead` | `controller/jobs.js:80` |

## `/api/lease`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/lease/create-lease` | — | `active` `admin_user` `company` `date_assignment` `device` `staff_member` `subscription` ⚠️ el body se pasa completo a `new Lease()`: los campos son los del esquema `models/Lease.js` | — | — | — | `controller/lease.js:5` |
| DELETE | `/api/lease/delete-lease/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/lease.js:56` |
| PATCH | `/api/lease/edit-lease/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/lease.js:22` |
| GET | `/api/lease/lease-list` | — | `active` `admin_user` `company` `date_assignment` `device` `staff_member` `subscription` ⚠️ el body se usa como FILTRO Mongo en `Lease.find()`: cualquier subconjunto de los campos de `models/Lease.js` (`{}` trae todo) | — | — | — | `controller/lease.js:80` |
| POST | `/api/lease/lease-list` | — | `active` `admin_user` `company` `date_assignment` `device` `staff_member` `subscription` ⚠️ el body se usa como FILTRO Mongo en `Lease.find()`: cualquier subconjunto de los campos de `models/Lease.js` (`{}` trae todo) | — | — | — | `controller/lease.js:80` |

## `/api/nodemailer`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/nodemailer/assignig-device-notification` | — | `consumer` `devices` `link` | — | — | — | `nodeMailer/notifications.js:119` |
| GET | `/api/nodemailer/branding-preview/templates` | — | — | — | — | `validateJWT` `checkTokenVersion` | `nodeMailer/brandingPreview.js:176` |
| POST | `/api/nodemailer/branding-preview` | — | `branding` `template` | — | — | `validateJWT` `checkTokenVersion` | `nodeMailer/brandingPreview.js:130` |
| POST | `/api/nodemailer/completed-task-notification` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `nodeMailer/notifications.js:894` |
| POST | `/api/nodemailer/confirm-returned-device-notification` | — | `consumer` `devices` `link` | — | — | — | `nodeMailer/notifications.js:127` |
| POST | `/api/nodemailer/confirmation-account` | — | `company` `consumer` `event` `link` | — | — | — | `nodeMailer/notifications.js:286` |
| POST | `/api/nodemailer/consumer-lease-return-device-notification` | `consumer` `devices` `returnDate` | — | — | — | — | `nodeMailer/notifications.js:883` |
| POST | `/api/nodemailer/customize-message-notification` | — | `company` `message` `staff` `subject` | — | — | — | `nodeMailer/notifications.js:926` |
| POST | `/api/nodemailer/customized-notification` | — | `company` `consumersList` `eventSelected` `message` `subject` | — | — | — | `nodeMailer/notifications.js:314` |
| POST | `/api/nodemailer/deposit-collected-notification` | — | `amount` `company` `consumer` `date` `event` `time` `transaction` | — | — | — | `nodeMailer/notifications.js:228` |
| POST | `/api/nodemailer/deposit-return-notification` | — | `amount` `company` `consumer` `date` `event` `time` `transaction` | — | — | — | `nodeMailer/notifications.js:220` |
| POST | `/api/nodemailer/device-report-per-transaction` | — | `consumer` `devices` `link` | — | — | — | `nodeMailer/notifications.js:212` |
| POST | `/api/nodemailer/early-remind-notification` | — | `consumer` | — | — | — | `nodeMailer/notifications.js:242` |
| POST | `/api/nodemailer/edit-device-admin` | — | `contactAdminEmail` | — | — | — | `nodeMailer/notifications.js:258` |
| POST | `/api/nodemailer/event-staff-notification` | — | `company` `message` `staff` | — | — | — | `nodeMailer/notifications.js:250` |
| POST | `/api/nodemailer/events-begin-reminder` | — | `daysToEvent` `event` `message` `staff` `subject` | — | — | — | `nodeMailer/notifications.js:346` |
| POST | `/api/nodemailer/failed-task-notification` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `nodeMailer/notifications.js:902` |
| POST | `/api/nodemailer/feedback-email-notification` | — | `eventID` | — | — | — | `nodeMailer/notifications.js:444` |
| POST | `/api/nodemailer/forcing-revoking-active-session` | — | `email` | — | — | — | `nodeMailer/notifications.js:910` |
| POST | `/api/nodemailer/internal-single-email-notification` | — | `company` `message` `staff` `subject` | — | — | — | `nodeMailer/notifications.js:338` |
| POST | `/api/nodemailer/invoice-notification` | — | `amount` `customer` `date` `email` `paymentIntent` `service` | — | — | — | `nodeMailer/notifications.js:378` |
| POST | `/api/nodemailer/leased-equip-staff-notification` | — | `company` `contactInfo` `message` `staff` `subject` | — | — | — | `nodeMailer/notifications.js:362` |
| POST | `/api/nodemailer/liability-contract-consumer-email-notification` | `contract_list` `items` | `company_id` `company_name` `consumer` `contract_link_tokens` `date_reference` `email` `email_admin` `name` `subject` `verification_id` | — | — | `attachContractLinkTokens` | `nodeMailer/notifications.js:583` |
| POST | `/api/nodemailer/liability-contract-email-notification` | `contract_list` `items` | `company_id` `company_name` `date_reference` `email` `email_admin` `name` `staff` `subject` `verification_id` | — | — | — | `nodeMailer/notifications.js:596` |
| POST | `/api/nodemailer/liability-contract-member-email-notification` | `contract_list` `items` | `company_id` `company_name` `date_reference` `email` `email_admin` `member` `name` `subject` `verification_id` | — | — | — | `nodeMailer/notifications.js:570` |
| POST | `/api/nodemailer/login-existing-consumer` | — | `company` `consumer` `event` `link` | — | — | — | `nodeMailer/notifications.js:294` |
| POST | `/api/nodemailer/lost-device-fee-notification` | — | `amount` `client` `company` `companyName` `confirmationLink` `consumer` `consumerEmail` `consumerInfo` `consumerName` `date` `device` `deviceInfo` `email` `event` `eventName` `eventSelected` `item` `link` `paymentIntent` `payment_intent` `time` `total` `transaction` `transactionData` `url` `value` | — | — | — | `nodeMailer/notifications.js:276` |
| POST | `/api/nodemailer/massive-event-customer-notification` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `nodeMailer/notifications.js:418` |
| POST | `/api/nodemailer/member-device-fee-receipt-notification` | — | `billedGuardian` `company` `date` `lines` `member` `paymentIntent` `total` | — | — | `validateJWT` | `nodeMailer/notifications.js:195` |
| POST | `/api/nodemailer/member-device-incident-notification` | — | `conditionNote` `devices` `feeAmount` `member` `outcome` `outcomeLabel` | — | — | `validateJWT` | `nodeMailer/notifications.js:177` |
| POST | `/api/nodemailer/member-email-notification` | — | `consumer` `message` `subject` | — | — | — | `nodeMailer/notifications.js:918` |
| POST | `/api/nodemailer/member-lease-return-device-notification` | — | `devices` `member` | — | — | — | `nodeMailer/notifications.js:135` |
| POST | `/api/nodemailer/new_invitation` | — | `consumer` `link` `subject` | — | — | `attachInvitationLink` | `nodeMailer/notifications.js:330` |
| POST | `/api/nodemailer/refund-notification` | — | `amount` `company` `customer` `date` `email` `event` `message` `paymentIntent` | — | — | — | `nodeMailer/notifications.js:386` |
| POST | `/api/nodemailer/reset-admin-password` | — | `contactInfo` `link` `linkToResetPassword` | — | — | `attachPasswordResetLink` | `nodeMailer/notifications.js:306` |
| POST | `/api/nodemailer/returned-items-to-renter-notification` | `staffEmails` `subject` | `attachments` | — | — | — | `nodeMailer/notifications.js:684` |
| POST | `/api/nodemailer/send-consumer-app-instructions` | — | `buttonLink` `contactInfo` `eventName` `list` | — | — | — | `nodeMailer/notifications.js:370` |
| POST | `/api/nodemailer/single-email-notification` | — | `company` `consumer` `eventSelected` `message` `subject` | — | — | — | `nodeMailer/notifications.js:322` |
| POST | `/api/nodemailer/staff_internal_notification` | — | `company` `contactInfo` `eventInfo` `staff` `staffMember` `subject` | — | — | — | `nodeMailer/notifications.js:354` |
| POST | `/api/nodemailer/terms-and-conditions-acceptance` | `consumer` | `company` `event` `signature` | — | — | — | `nodeMailer/notifications.js:724` |

## `/api/notificationlog`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/notificationlog/notification-feed-log` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `controller/notificationLog.js:10` |
| GET | `/api/notificationlog/notification-log-list` | — | — | — | — | — | `controller/notificationLog.js:12` |

## `/api/post`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/post/new-post` | — | `company_id` `created_at` `description` `displayed_in` `media` `published` `published_at` `subtitle` `title` `updated_at` ⚠️ el body se pasa completo a `new Post()`: los campos son los del esquema `models/Post.js` | — | — | — | `controller/post.js:4` |
| DELETE | `/api/post/post-delete/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/post.js:52` |
| PATCH | `/api/post/post-update/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/post.js:71` |
| GET | `/api/post/posts` | — | `company_id` `created_at` `description` `displayed_in` `media` `published` `published_at` `subtitle` `title` `updated_at` ⚠️ el body se usa como FILTRO Mongo en `Post.find()`: cualquier subconjunto de los campos de `models/Post.js` (`{}` trae todo) | — | — | — | `controller/post.js:21` |
| POST | `/api/post/posts` | — | `company_id` `created_at` `description` `displayed_in` `media` `published` `published_at` `subtitle` `title` `updated_at` ⚠️ el body se usa como FILTRO Mongo en `Post.find()`: cualquier subconjunto de los campos de `models/Post.js` (`{}` trae todo) | — | — | — | `controller/post.js:21` |

## `/api/receiver`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/receiver/all-transaction-by-event-and-consumer` | — | `company` `paymentIntentList` | — | — | — | `controller/receiver.js:463` |
| POST | `/api/receiver/create-bulk-item-transaction-in-user` | — | `company` `deviceType` `eventSelected` `event_id` `paymentIntent` `provider` `serialNumbers` `status` `timestamp` `user` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:429` |
| POST | `/api/receiver/delete-bulk-devices-pool` | — | `ids` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:278` |
| DELETE | `/api/receiver/delete-device-pool/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/receiver.js:262` |
| GET | `/api/receiver/list-receiver-returned-issue` | — | `activity` `admin` `comment` `device` `eventSelected` `provider` `status` `timeStamp` `user` ⚠️ el body se usa como FILTRO Mongo en `ReceiverReturnedStatus.find()`: cualquier subconjunto de los campos de `models/ReceiverReturnedStatus.js` (`{}` trae todo) | — | — | — | `controller/receiver.js:353` |
| POST | `/api/receiver/list-receiver-returned-issue` | — | `activity` `admin` `comment` `device` `eventSelected` `provider` `status` `timeStamp` `user` ⚠️ el body se usa como FILTRO Mongo en `ReceiverReturnedStatus.find()`: cualquier subconjunto de los campos de `models/ReceiverReturnedStatus.js` (`{}` trae todo) | — | — | — | `controller/receiver.js:353` |
| POST | `/api/receiver/receiver-assignation` | — | `active` `adminUser` `company` `device` `eventSelected` `event_id` `paymentIntent` `provider` `timeStamp` `user` ⚠️ el body se pasa completo a `new Receivers()`: los campos son los del esquema `models/Receivers.js` | — | — | — | `controller/receiver.js:24` |
| POST | `/api/receiver/receiver-assigned-list` | — | `active` `company` `device` `eventSelected` `event_id` `paymentIntent` `provider` `timeStamp` `user` ⚠️ el body se usa como FILTRO Mongo en `Receivers.find()`: cualquier subconjunto de los campos de `models/Receivers.js` (`{}` trae todo) | — | — | — | `controller/receiver.js:294` |
| POST | `/api/receiver/receiver-assigned-users-list` | — | `active` `company` `device` `eventSelected` `event_id` `paymentIntent` `provider` `timeStamp` `user` ⚠️ el body se usa como FILTRO Mongo en `Receivers.find()`: cualquier subconjunto de los campos de `models/Receivers.js` (`{}` trae todo) | — | — | — | `controller/receiver.js:309` |
| POST | `/api/receiver/receiver-assigned` | — | `paymentIntent` | — | — | — | `controller/receiver.js:47` |
| DELETE | `/api/receiver/receiver-pool-device/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/receiver.js:262` |
| GET | `/api/receiver/receiver-pool-list` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `controller/receiver.js:177` |
| POST | `/api/receiver/receiver-pool-list` | — | `activity` `comment` `company` `contract_type` `device` `eventSelected` `provider` `status` `type` ⚠️ el body se usa como FILTRO Mongo en `ReceiversPool.find()`: cualquier subconjunto de los campos de `models/ReceiversPool.js` (`{}` trae todo) | — | — | — | `controller/receiver.js:245` |
| PATCH | `/api/receiver/receiver-returned-issue/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/receiver.js:368` |
| PATCH | `/api/receiver/receiver-returned-issue/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/receiver.js:368` |
| POST | `/api/receiver/receiver-returned-issue` | — | `activity` `admin` `comment` `device` `eventSelected` `provider` `status` `timeStamp` `user` ⚠️ el body se pasa completo a `new ReceiverReturnedStatus()`: los campos son los del esquema `models/ReceiverReturnedStatus.js` | — | — | — | `controller/receiver.js:337` |
| PATCH | `/api/receiver/receiver-update/:id` | — | `device` `id` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:99` |
| PATCH | `/api/receiver/receiver-update/:id` | — | `device` `id` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:99` |
| PUT | `/api/receiver/receiver-update/:id` | — | `device` `id` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:99` |
| PUT | `/api/receiver/receiver-update/:id` | — | `device` `id` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:99` |
| POST | `/api/receiver/receivers-pool-bulk` | — | `activity` `comment` `company` `deviceList` `eventSelected` `provider` `status` `type` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:162` |
| PATCH | `/api/receiver/receivers-pool-update-bulk` | — | `activity` `comment` `deviceData` `qty` `startingSerialNumber` `status` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:384` |
| PATCH | `/api/receiver/receivers-pool-update/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/receiver.js:229` |
| POST | `/api/receiver/receivers-pool` | — | `activity` `comment` `company` `contract_type` `device` `eventSelected` `provider` `status` `type` ⚠️ el body se pasa completo a `new ReceiversPool()`: los campos son los del esquema `models/ReceiversPool.js` | — | — | — | `controller/receiver.js:145` |
| DELETE | `/api/receiver/remove-transaction/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/receiver.js:446` |
| PATCH | `/api/receiver/transaction-all-items-returned-at-once` | — | `device` `timeStamp` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:415` |
| PATCH | `/api/receiver/transaction-return-all-items-in-pool` | — | `activity` `company` `device` `eventSelected` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:401` |
| PATCH | `/api/receiver/update-bulk-items-in-pool` | — | `activity` `company` `device` `eventSelected` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:131` |
| PATCH | `/api/receiver/update-bulk-items-in-transaction` | — | `device` `timeStamp` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/receiver.js:117` |

## `/api/registration`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/registration/accept-invitation` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `controller/registration.js:517` |
| POST | `/api/registration/add-company` | `company` | `user` | — | — | `check("company.company_name", "company.company_name es requerido").not().isEmpty()` `check("company.website", "company.website es requerido").not().isEmpty()` `validateFields` | `controller/registration.js:302` |
| POST | `/api/registration/new` | `company` `user` | `terms` | — | — | `check("user.lastName", "user.lastName es requerido").not().isEmpty()` `check("user.email", "user.email debe ser un email válido").isEmail()` `check("user.password", "user.password debe tener al menos 6 caracteres").isLength({ min: 6 })` `check("company.company_name", "company.company_name es requerido").not().isEmpty()` `check("company.website", "company.website es requerido").not().isEmpty()` `validateFields` | `controller/registration.js:147` |

## `/api/school`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/school/consent/list` | `company_id` | `page` `page_size` `status` | — | — | `canRead` | `mysql/controllers/school.js:1254` |
| POST | `/api/school/consent/public/respond` | `signer_name` | `decision` `otc` | — | — | — | `mysql/controllers/school.js:1149` |
| POST | `/api/school/consent/public/retrieve` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `mysql/controllers/school.js:984` |
| POST | `/api/school/consent/record` | `company_id` `member_id` `signer_name` | `guardian_id` `method` `policy_type` `policy_version` `signer_email` | — | — | `canCreate` | `mysql/controllers/school.js:703` |
| POST | `/api/school/consent/request` | `company_id` `member_id` | `guardian_id` `policy_type` `policy_version` | — | — | `canCreate` | `mysql/controllers/school.js:748` |
| POST | `/api/school/consent/resend` | — | `company_id` `member_id` `policy_type` `policy_version` | — | — | `canCreate` | `mysql/controllers/school.js:885` |
| POST | `/api/school/consent/status` | `company_id` | `policy_type` `policy_version` | — | — | `canRead` | `mysql/controllers/school.js:1334` |
| POST | `/api/school/consent` | `company_id` `member_id` | — | — | — | `canRead` | `mysql/controllers/school.js:1206` |
| POST | `/api/school/dashboard` | `company_id` | — | — | — | `canRead` | `mysql/controllers/school.js:76` |
| POST | `/api/school/event-invitations/confirm` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | `publicInvitationRateLimit` | `controller/eventInvitation.js:276` |
| POST | `/api/school/event-invitations/response` | — | `company_id` `event_id` `member_email` `member_id` `reason` `responder_email` `responder_role` `response` | — | — | `publicInvitationRateLimit` | `controller/eventInvitation.js:372` |
| POST | `/api/school/event-invitations/send` | — | `company_id` `event_id` `member_ids` | — | — | `validateJWT` `checkTokenVersion` `authorizePermission("member", "create")` | `controller/eventInvitation.js:163` |
| POST | `/api/school/guardians/add` | `company_id` `email` `first_name` `guardian_id` `last_name` `member_id` | `is_primary` `phone_number` `relationship` | — | — | `canCreate` | `mysql/controllers/school.js:498` |
| POST | `/api/school/guardians/search` | `company_id` `email` `guardian_id` `member_id` | — | — | — | `canRead` | `mysql/controllers/school.js:603` |
| POST | `/api/school/guardians` | `company_id` `member_id` | — | — | — | `canRead` | `mysql/controllers/school.js:465` |
| POST | `/api/school/reminders/resume` | `device_id` | `company_id` `member_id` | — | — | `canUpdate` | `mysql/controllers/school.js:1513` |
| POST | `/api/school/reminders/stop` | `device_id` | `company_id` `member_id` | — | — | `canUpdate` | `mysql/controllers/school.js:1512` |
| POST | `/api/school/roster` | `company_id` | `grade` `homeroom` | — | — | `canRead` | `mysql/controllers/school.js:107` |
| POST | `/api/school/settings/consent-enforcement` | `company_id` | `consent_document_id` `enforce` `enforce_under_13` `required_consent_policy_version` | — | — | `canUpdate` | `mysql/controllers/school.js:1423` |
| POST | `/api/school/settings` | `company_id` | — | — | — | `canRead` | `mysql/controllers/school.js:1381` |
| POST | `/api/school/student/access-log` | — | `company_id` `member_id` `type` | — | — | `canRead` | `mysql/controllers/school.js:430` |
| POST | `/api/school/student/erase` | — | `company_id` `member_id` | — | — | `canUpdate` | `mysql/controllers/school.js:370` |
| POST | `/api/school/student/export` | — | `company_id` `member_id` | — | — | `canRead` | `mysql/controllers/school.js:191` |

## `/api/search`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/search/advance_searching_query` | — | — | — | `brand` `category` `company_id` `company_sql_id` `date_end` `date_start` `group` `location` | — | `controller/search.js:2858` |
| GET | `/api/search/searching_consumer` | — | — | — | `company` `lastId` `variable` | — | `controller/search.js:979` |
| GET | `/api/search/searching_device_transaction` | — | — | — | `company` `lastId` `variable` | — | `controller/search.js:1085` |
| GET | `/api/search/searching_events` | — | — | — | `company` `lastId` `variable` | — | `controller/search.js:1036` |
| GET | `/api/search/searching_` | — | — | — | `category` `company` `company_sql_id` `variable` | — | `controller/search.js:837` |
| GET | `/api/search/searching_previous_consumer` | — | — | — | `company` `lastId` `variable` | — | `controller/search.js:1000` |
| GET | `/api/search/searching_staff` | — | — | — | `employees` `lastId` `variable` | — | `controller/search.js:1061` |

## `/api/staff`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/staff/__staff-search` | — | — | — | — | — | `controller/admin.js:863` |
| POST | `/api/staff/__staff-search` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | — | — | — | `controller/admin.js:863` |
| GET | `/api/staff/admin-users` | — | `active` `agreedPlatformConditions` `companiesAssigned` `dailySummaries` `email` `emailNotifications` `eventReminder` `imageProfile` `lastName` `mfaEnabled` `mfaSecret` `multipleCompanies` `name` `online` `password` `phone` `platform_observer` `role` `role_type` `subscriptionRenewals` `super_user` `tokenVersion` ⚠️ el body se usa como FILTRO Mongo en `AdminUser.find()`: cualquier subconjunto de los campos de `models/AdminUser.js` (`{}` trae todo) | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("staff", "read")` | `controller/admin.js:935` |
| POST | `/api/staff/admin-users` | — | `active` `agreedPlatformConditions` `companiesAssigned` `dailySummaries` `email` `emailNotifications` `eventReminder` `imageProfile` `lastName` `mfaEnabled` `mfaSecret` `multipleCompanies` `name` `online` `password` `phone` `platform_observer` `role` `role_type` `subscriptionRenewals` `super_user` `tokenVersion` ⚠️ el body se usa como FILTRO Mongo en `AdminUser.find()`: cualquier subconjunto de los campos de `models/AdminUser.js` (`{}` trae todo) | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("staff", "read")` | `controller/admin.js:935` |
| GET | `/api/staff/consumers/search` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `controller/stripe.js:1072` |
| PATCH | `/api/staff/edit-admin/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `validateJWT` `checkTokenVersion` `selfOrStaffUpdate` | `controller/admin.js:587` |
| POST | `/api/staff/force-logout` | `email` | — | — | — | `tokenIfPresent` | `controller/admin.js:1119` |

## `/api/staff-activity-log`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/staff-activity-log` | — | — | — | `action` `actor_type` `consumer` `end_date` `event_id` `include_automatic` `item_id` `limit` `member_id` `page` `serial_number` `source` `staff_member_id` `start_date` `target_id` `target_model` | `validateJWT` | `controller/staffActivityLog.js:228` |

## `/api/status`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/status` | — | — | — | — | — | — |

## `/api/stripe`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/stripe/account_link` | — | `connectedAccountId` `origin` | — | — | — | `controller/stripe.js:124` |
| POST | `/api/stripe/account_sessions` | — | `connectedAccountId` | — | — | — | `controller/stripe.js:149` |
| POST | `/api/stripe/accounts` | — | `country` `email` | — | — | — | `controller/stripe.js:65` |
| POST | `/api/stripe/cancel/subscriptions/:id` | — | `cancelAtPeriodEnd` `cancellationComment` | `id` | — | — | `controller/stripe.js:605` |
| POST | `/api/stripe/company-account-stripe/update` | — | `connectedAccountId` ⚠️ rest-spread `...updateData`: acepta campos extra · pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/stripe.js:273` |
| POST | `/api/stripe/company-account-stripe` | — | `company` | — | — | — | `controller/stripe.js:1037` |
| POST | `/api/stripe/create-payment-intent-customized` | — | `receipt_email` `total` | — | — | — | `controller/stripe.js:369` |
| POST | `/api/stripe/create-payment-intent-subscription` | — | `customerEmail` `total` | — | — | — | `controller/stripe.js:395` |
| POST | `/api/stripe/create-payment-intent` | — | `customerEmail` `customerId` `device` | — | — | `validatePublicPaymentPayload` `attachServerIdempotencyKey` | `controller/stripe.js:304` |
| POST | `/api/stripe/create-subscriptions_no_trial` | — | `items` `period` `stripeCustomerID` | — | — | — | `controller/stripe.js:478` |
| POST | `/api/stripe/create-subscriptions` | — | `items` `period` `stripeCustomerID` | — | — | — | `controller/stripe.js:420` |
| POST | `/api/stripe/customer` | — | `email` `name` `phoneNumber` | — | — | — | `controller/stripe.js:30` |
| GET | `/api/stripe/customers/search` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "read")` | `controller/stripe.js:779` |
| GET | `/api/stripe/customers` | — | `email` `name` `phone` `stripeid` ⚠️ el body se usa como FILTRO Mongo en `StripeCustomer.find()`: cualquier subconjunto de los campos de `models/StripeCustomer.js` (`{}` trae todo) | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "read")` | `controller/stripe.js:763` |
| POST | `/api/stripe/customers` | — | `email` `name` `phone` `stripeid` ⚠️ el body se usa como FILTRO Mongo en `StripeCustomer.find()`: cualquier subconjunto de los campos de `models/StripeCustomer.js` (`{}` trae todo) | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "read")` | `controller/stripe.js:763` |
| POST | `/api/stripe/internal/partial-refund` | — | `paymentIntent` `total` | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "update")` `validateRefundPayload` | `controller/stripe.js:903` |
| POST | `/api/stripe/internal/payment-intents/:id/cancel` | — | `id` | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "update")` `validatePaymentIntentIdParam` | `controller/stripe.js:858` |
| POST | `/api/stripe/internal/payment-intents/:id/capture` | — | `amount_to_capture` `id` | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "update")` `validatePaymentIntentIdParam` | `controller/stripe.js:833` |
| POST | `/api/stripe/internal/refund` | — | `paymentIntent` | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "update")` `validateRefundPayload` | `controller/stripe.js:882` |
| GET | `/api/stripe/invoices` | — | `subscriptionID` | — | — | — | `controller/stripe.js:648` |
| POST | `/api/stripe/invoices` | — | `subscriptionID` | — | — | — | `controller/stripe.js:648` |
| POST | `/api/stripe/new-company-account` | — | `companyName` `ownerEmail` `ownerFirstName` `ownerLastName` | — | — | — | `controller/stripe.js:190` |
| POST | `/api/stripe/partial-refund` | — | `paymentIntent` `total` | — | — | `canMoveCollectedMoney` `validateRefundPayload` | `controller/stripe.js:903` |
| POST | `/api/stripe/payment_intents/:id/update-payment-method` | — | `newPaymentMethodID` `paymentIntentId` | — | — | — | `controller/stripe.js:668` |
| GET | `/api/stripe/payment_intents/:id` | — | — | `id` | — | — | `controller/stripe.js:967` |
| POST | `/api/stripe/payment_methods/:id/attach` | — | `customerID` | `id` | — | — | `controller/stripe.js:709` |
| POST | `/api/stripe/payment-intents/:id/cancel` | — | `id` | — | — | `canMoveCollectedMoney` `validatePaymentIntentIdParam` | `controller/stripe.js:858` |
| POST | `/api/stripe/payment-intents/:id/capture` | — | `amount_to_capture` `id` | — | — | `canMoveCollectedMoney` `validatePaymentIntentIdParam` | `controller/stripe.js:833` |
| GET | `/api/stripe/payment-intents/search` | — | — | — | — | — | `controller/stripe.js:729` |
| POST | `/api/stripe/payment-method/subscriptions/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/stripe.js:689` |
| POST | `/api/stripe/refund` | — | `paymentIntent` | — | — | `canMoveCollectedMoney` `validateRefundPayload` | `controller/stripe.js:882` |
| DELETE | `/api/stripe/remove-duplicate/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/stripe.js:945` |
| DELETE | `/api/stripe/removing/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/transaction.js:237` |
| POST | `/api/stripe/save-transaction-admin-dashboard` | — | `active` `clientSecret` `company` `consumerInfo` `created_at` `date` `device` `eventSelected` `event_id` `paymentIntent` `provider` `type` ⚠️ el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js` | — | — | — | `controller/transaction.js:79` |
| POST | `/api/stripe/save-transaction-template-no-regular-user` | — | `active` `clientSecret` `company` `consumerInfo` `created_at` `date` `device` `eventSelected` `event_id` `paymentIntent` `provider` `type` ⚠️ el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js` | — | — | — | `controller/transaction.js:103` |
| POST | `/api/stripe/save-transaction` | — | `company` `consumerInfo` `event_id` `paymentIntent` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | — | `controller/transaction.js:32` |
| POST | `/api/stripe/setup-search` | — | `setupId` | — | — | — | `controller/stripe.js:523` |
| POST | `/api/stripe/stripe-transaction-admin` | — | `clientSecret` `company` `device` `eventSelected` `paymentIntent` `provider` `type` `user` ⚠️ el body se pasa completo a `new StripeTransaction()`: los campos son los del esquema `models/StripeTransaction.js` | — | — | `validateJWT` `checkTokenVersion` `authorizeMongoPermission("billing", "update")` | `controller/stripe.js:815` |
| POST | `/api/stripe/stripe-transaction-no-regular-user` | — | `clientSecret` `company` `device` `eventSelected` `paymentIntent` `provider` `type` `user` ⚠️ el body se pasa completo a `new StripeTransaction()`: los campos son los del esquema `models/StripeTransaction.js` | — | — | — | `controller/stripe.js:924` |
| POST | `/api/stripe/stripe-transaction` | — | `clientSecret` `company` `device` `eventSelected` `paymentIntent` `provider` `type` `user` ⚠️ el body se pasa completo a `new StripeTransaction()`: los campos son los del esquema `models/StripeTransaction.js` | — | — | — | `controller/stripe.js:797` |
| GET | `/api/stripe/stripe-transactions-saved-list` | — | `clientSecret` `company` `device` `eventSelected` `paymentIntent` `provider` `type` `user` ⚠️ el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo) | — | — | — | `controller/stripe.js:1020` |
| POST | `/api/stripe/stripe-transactions-saved-list` | — | `clientSecret` `company` `device` `eventSelected` `paymentIntent` `provider` `type` `user` ⚠️ el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo) | — | — | — | `controller/stripe.js:1020` |
| DELETE | `/api/stripe/subscriptions/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/stripe.js:629` |
| GET | `/api/stripe/subscriptions/:id` | — | — | `id` | — | — | `controller/stripe.js:569` |
| GET | `/api/stripe/transaction` | — | `active` `clientSecret` `company` `consumerInfo` `created_at` `date` `device` `eventSelected` `event_id` `paymentIntent` `provider` `type` ⚠️ el body se usa como FILTRO Mongo en `Transaction.find()`: cualquier subconjunto de los campos de `models/Transaction.js` (`{}` trae todo) | — | — | — | `controller/transaction.js:159` |
| PATCH | `/api/stripe/updating-subscription/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | — | `controller/stripe.js:585` |

## `/api/subscription`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/subscription/company-subscription` | — | `companyName` | — | — | — | `controller/subscription.js:74` |
| POST | `/api/subscription/new_subscription_no_trial` | — | `items` `period` `stripeCustomerID` | — | — | — | `controller/stripe.js:478` |
| POST | `/api/subscription/new_subscription` | — | `company` `record` `stripeCompanyID` ⚠️ el body se pasa completo a `new Subscription()`: los campos son los del esquema `models/Subscription.js` | — | — | — | `controller/subscription.js:6` |
| GET | `/api/subscription/search_subscription` | — | `company` `record` `stripeCompanyID` ⚠️ el body se usa como FILTRO Mongo en `Subscription.findOne()`: cualquier subconjunto de los campos de `models/Subscription.js` (`{}` trae todo) | — | — | — | `controller/subscription.js:51` |
| POST | `/api/subscription/search_subscription` | — | `company` `record` `stripeCompanyID` ⚠️ el body se usa como FILTRO Mongo en `Subscription.findOne()`: cualquier subconjunto de los campos de `models/Subscription.js` (`{}` trae todo) | — | — | — | `controller/subscription.js:51` |
| GET | `/api/subscription/searching-subscription/subscriptions/:id` | — | — | `id` | — | — | `controller/stripe.js:993` |
| GET | `/api/subscription/subscriptions/:id` | — | — | `id` | — | — | `controller/stripe.js:1056` |
| PATCH | `/api/subscription/update-subscription/:id` | — | `newSubscriptionData` | `id` | — | — | `controller/subscription.js:22` |

## `/api/transaction`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/transaction/check-and-release-deposit-transactions` | — | `company` `eventSelected` | — | — | `staffOnly` | `controller/transaction.js:282` |
| DELETE | `/api/transaction/remove-duplicate-transaction/:id` | — | — ⚠️ el handler IGNORA el body (mandar `{}`) | `id` | — | `optionalJWT` | `controller/transaction.js:237` |
| POST | `/api/transaction/save-transaction-admin-dashboard` | — | `active` `clientSecret` `company` `consumerInfo` `created_at` `date` `device` `eventSelected` `event_id` `paymentIntent` `provider` `type` ⚠️ el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js` | — | — | `staffOnly` | `controller/transaction.js:79` |
| POST | `/api/transaction/save-transaction-template-no-regular-user` | — | `active` `clientSecret` `company` `consumerInfo` `created_at` `date` `device` `eventSelected` `event_id` `paymentIntent` `provider` `type` ⚠️ el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js` | — | — | `staffOnly` | `controller/transaction.js:103` |
| POST | `/api/transaction/save-transaction` | — | `company` `consumerInfo` `event_id` `paymentIntent` ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) | — | — | `optionalJWT` | `controller/transaction.js:32` |
| GET | `/api/transaction/subscriptions/:id` | — | — | `id` | — | `staffOnly` | `controller/stripe.js:993` |
| GET | `/api/transaction/transaction` | — | — ⚠️ lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler | — | — | — | `controller/transaction.js:183` |
| POST | `/api/transaction/transaction` | — | `active` `clientSecret` `company` `consumerInfo` `created_at` `date` `device` `eventSelected` `event_id` `paymentIntent` `provider` `type` ⚠️ el body se usa como FILTRO Mongo en `Transaction.find()`: cualquier subconjunto de los campos de `models/Transaction.js` (`{}` trae todo) | — | — | `optionalJWT` | `controller/transaction.js:159` |
| POST | `/api/transaction/update-multiple-documents` | — | `active` `clientSecret` `company` `consumerInfo` `created_at` `date` `device` `eventSelected` `event_id` `find` `paymentIntent` `provider` `type` `update` ⚠️ el body se usa como FILTRO Mongo en `Transaction.find()`: cualquier subconjunto de los campos de `models/Transaction.js` (`{}` trae todo) | — | — | `staffOnly` | `controller/transaction.js:219` |
| PATCH | `/api/transaction/update-transaction/:id` | — | — ⚠️ pasa `req.body` completo a otra capa (revisar el controlador para el detalle) · el handler IGNORA el body (mandar `{}`) | `id` | — | `staffOnly` | `controller/transaction.js:126` |

## `/api/transaction-audit-log`

| Método | Ruta | Requeridos (400 si faltan) | Opcionales / otros | Params | Query | Auth | Fuente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/transaction-audit-log/audit-log` | — | — | — | — | — | `controller/transactionAuditLog.js:25` |
| POST | `/api/transaction-audit-log/create-audit` | — | `actionTaken` `time` `transaction` `user` ⚠️ el body se pasa completo a `new TransactionAuditLog()`: los campos son los del esquema `models/TransactionAuditLog.js` | — | — | — | `controller/transactionAuditLog.js:6` |
