/**
 * api-payloads.d.ts — GENERADO por `node scripts/extract-api-payloads.js`. No editar a mano.
 *
 * Payload esperado por cada endpoint del servidor, extraído del código de los
 * controladores. Para tipar un fetch, usa el mapa `ApiEndpoints` al final:
 *
 *   type Body<K extends keyof ApiEndpoints> = ApiEndpoints[K]["body"];
 *   const body: Body<"POST /api/db_item/delete-item"> = { item_id: 1, company_id: 2 };
 *
 * ADVERTENCIAS
 * - Los TIPOS son inferidos por nombre de campo (id/cost -> number, *_info -> objeto,
 *   etc.). El nombre del campo sí viene del código; el tipo hay que confirmarlo.
 * - Un campo marcado `?` es opcional porque el handler le da default o porque no hay
 *   validación explícita. Los NO opcionales son los que el handler valida con 400.
 * - Los endpoints con cuerpo dinámico (`Object.keys(req.body)` -> columnas SQL) se
 *   tipan con `[key: string]: unknown` y llevan nota.
 */

/**
 * `DELETE /api/admin/:id`
 * handler: deleteAdminUser — controller/admin.js:629
 * ruta: routes/admin.js:115
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "delete")
 * headers: user-agent
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 500
 */
export interface DeleteAdminByIdParams {
  id: string;
}

/**
 * `GET /api/admin/:id`
 * handler: showAllUsers — controller/admin.js:821
 * ruta: routes/admin.js:103
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "read")
 * NOTA: el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetAdminByIdBody {
  clientSecret?: string;
  company?: string;
  device?: number;
  eventSelected?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  user?: string;
}

/**
 * `GET /api/admin/activity-logs`
 * handler: getStaffActivityLogs — controller/staffActivityLog.js:228
 * ruta: routes/admin.js:52
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "read")
 * generado por factory: createGetStaffActivityLogs
 * status: 403, 404, 500
 */
export interface GetAdminActivityLogsQuery {
  action: string;
  actor_type: string;
  consumer: Record<string, unknown>;
  end_date: string;
  event_id: string;
  include_automatic: boolean;
  item_id: string;
  limit?: string;
  member_id: string;
  page?: string;
  serial_number: string;
  source: string;
  staff_member_id: string;
  start_date: string;
  target_id: string;
  target_model: string;
}

/**
 * `POST /api/admin/activity-logs`
 * handler: registerStaffActivity — controller/staffActivityLog.js:276
 * ruta: routes/admin.js:51
 * auth: validateJWT, checkTokenVersion
 * headers: user-agent
 * generado por factory: createRegisterStaffActivity
 * status: 202, 400, 404, 500
 */
export interface PostAdminActivityLogsBody {
  action: string;
  details?: string;
  target_id?: string;
  target_model: string;
}

/**
 * `PATCH /api/admin/admin-user/:id`
 * handler: editOtherAdminUser — controller/admin.js:587
 * ruta: routes/admin.js:112
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "update")
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 500
 */
export interface PatchAdminAdminUserByIdParams {
  id: string;
}

/**
 * `GET /api/admin/check-online-status/:email`
 * handler: checkStatus — controller/admin.js:994
 * ruta: routes/admin.js:132
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetAdminCheckOnlineStatusByEmailParams {
  email: string;
}

/**
 * `POST /api/admin/invalidate-all-sessions`
 * handler: invalidateAllSessions — controller/admin.js:1208
 * ruta: routes/admin.js:44
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/admin/login`
 * handler: loginUser — controller/admin.js:101
 * ruta: routes/admin.js:70
 * auth: validateFields
 * headers: accept-language, cf-ipcountry, timezone, user-agent, x-client-ip, x-forwarded-for, x-location, x-real-ip, x-request-id, x-request-timestamp, x-timezone
 * status: 200, 400, 403, 409, 500
 */
export interface PostAdminLoginBody {
  email?: string;
  forceLogin?: boolean;
  mfaCode: string;
  password?: string;
  rememberMe?: string;
}

/**
 * `POST /api/admin/logout`
 * handler: logoutUser — controller/admin.js:375
 * ruta: routes/admin.js:84
 * auth: sin middleware de auth en la ruta
 * headers: x-token
 * status: 201, 401, 500
 */
export interface PostAdminLogoutBody {
  uid?: string;
}

/**
 * `POST /api/admin/manually_logout`
 * handler: manuallyLogoutUser — controller/admin.js:426
 * ruta: routes/admin.js:87
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PostAdminManuallyLogoutBody {
  uid?: string;
}

/**
 * `POST /api/admin/mfa/disable`
 * handler: disableMfa — controller/admin.js:1092
 * ruta: routes/admin.js:139
 * auth: validateJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 403, 500
 */

/**
 * `POST /api/admin/mfa/generate`
 * handler: generateMfaSecret — controller/admin.js:1027
 * ruta: routes/admin.js:137
 * auth: validateMfaEnrollment
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 409, 500
 */

/**
 * `POST /api/admin/mfa/verify`
 * handler: verifyMfaSetup — controller/admin.js:1061
 * ruta: routes/admin.js:138
 * auth: validateMfaEnrollment
 * status: 400, 404, 500
 */
export interface PostAdminMfaVerifyBody {
  token?: string;
}

/**
 * `POST /api/admin/new_admin_user`
 * handler: createAdminUser — controller/admin.js:31
 * ruta: routes/admin.js:55
 * auth: check("email", "Email must be provided").isEmail(), validateFields
 * status: 201, 400, 500
 */
export interface PostAdminNewAdminUserBody {
  email?: string;
  imageProfile?: string;
  lastName?: string;
  name?: string;
  password?: string;
  phone?: string;
}

/**
 * `PATCH /api/admin/profile/:id`
 * handler: editAdminUser — controller/admin.js:488
 * ruta: routes/admin.js:109
 * auth: validateJWT
 * headers: user-agent
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * status: 403, 404, 500
 */
export interface PatchAdminProfileByIdBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}
export interface PatchAdminProfileByIdParams {
  id: string;
}

/**
 * `POST /api/admin/receiver-assignation`
 * handler: addReceiverToTransaction — controller/receiver.js:24
 * ruta: routes/admin.js:126
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Receivers()`: los campos son los del esquema `models/Receivers.js`
 * status: 201, 500
 */
export interface PostAdminReceiverAssignationBody {
  active?: boolean;
  adminUser?: string;
  company?: string;
  device?: Record<string, unknown>;
  eventSelected?: unknown[];
  event_id?: string;
  paymentIntent?: string;
  provider?: unknown[];
  timeStamp?: string;
  user?: string;
}

/**
 * `GET /api/admin/receiver-assigned`
 * handler: checkingReceiversAssigned — controller/receiver.js:47
 * ruta: routes/admin.js:101
 * auth: validateJWT
 * status: 201, 501
 */
export interface GetAdminReceiverAssignedBody {
  paymentIntent?: string;
}

/**
 * `PATCH /api/admin/update-password`
 * handler: updatePassword — controller/admin.js:726
 * ruta: routes/admin.js:119
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 403, 500
 */
export interface PatchAdminUpdatePasswordBody {
  email?: string;
  mfaCode: string;
  password?: string;
  resetToken?: string;
  uid?: string;
}

/**
 * `POST /api/admin/users`
 * handler: showAllUsers — controller/admin.js:821
 * ruta: routes/admin.js:106
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostAdminUsersBody {
  clientSecret?: string;
  company?: string;
  device?: number;
  eventSelected?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  user?: string;
}

/**
 * `POST /api/admin/verify-password`
 * handler: verifyPassword — controller/admin.js:884
 * ruta: routes/admin.js:123
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostAdminVerifyPasswordBody {
  password: string;
}

/**
 * `POST /api/article/article-creation`
 * handler: articleSetup — controller/article.js:5
 * ruta: routes/article.js:15
 * auth: validateJWT
 * NOTA: el body se pasa completo a `new Article()`: los campos son los del esquema `models/Article.js`
 * status: 201, 500
 */
export interface PostArticleArticleCreationBody {
  active?: boolean;
  adminUser?: string;
  body?: string;
  company?: string;
  event?: string;
  image?: string;
  title?: string;
}

/**
 * `DELETE /api/article/article-delete/:id`
 * handler: deleteArticle — controller/article.js:40
 * ruta: routes/article.js:21
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteArticleArticleDeleteByIdParams {
  id: string;
}

/**
 * `PATCH /api/article/article-edit/:id`
 * handler: editArticle — controller/article.js:57
 * ruta: routes/article.js:24
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchArticleArticleEditByIdParams {
  id: string;
}

/**
 * `GET /api/article/articles`
 * handler: displayArticles — controller/article.js:25
 * ruta: routes/article.js:18
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Article.find()`: cualquier subconjunto de los campos de `models/Article.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetArticleArticlesBody {
  active?: boolean;
  adminUser?: string;
  body?: string;
  company?: string;
  event?: string;
  image?: string;
  title?: string;
}

/**
 * `GET /api/auth/:id`
 * handler: getUser — controller/auth.js:108
 * ruta: routes/auth.js:65
 * auth: optionalJWT
 * status: 404, 500
 */
export interface GetAuthByIdParams {
  id: string;
}

/**
 * `PATCH /api/auth/:id`
 * handler: editUser — controller/auth.js:208
 * ruta: routes/auth.js:60
 * auth: optionalJWT, requireSessionFromDashboard
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchAuthByIdParams {
  id: string;
}

/**
 * `GET /api/auth/all-consumers-based-on-all-events-per-company/:companyID`
 * handler: getAllConsumersBasedOnAllEventsPerCompany — controller/auth.js:330
 * ruta: routes/auth.js:79
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface GetAuthAllConsumersBasedOnAllEventsPerCompanyByCompanyIDParams {
  companyID: string;
}

/**
 * `POST /api/auth/new`
 * handler: newUser — controller/auth.js:160
 * ruta: routes/auth.js:43
 * auth: check("lastName", "Last name is mandatory").not().isEmpty(), check("email", "Email is mandatory").isEmail(), validateFields, optionalJWT, requireSessionFromDashboard
 * NOTA: el body se pasa completo a `new User()`: los campos son los del esquema `models/User.js`
 * status: 201, 400, 500
 */
export interface PostAuthNewBody {
  category?: string;
  company_providers?: unknown[];
  email?: string;
  eventSelected?: unknown[];
  event_providers?: unknown[];
  groupName?: unknown[];
  lastName?: string;
  name?: string;
  notes?: unknown[];
  phoneNumber?: string;
  privacyPolicy?: boolean;
  profile_picture?: string;
  provider?: unknown[];
}

/**
 * `GET /api/auth/user-query`
 * handler: getListOfUsers — controller/auth.js:58
 * ruta: routes/auth.js:40
 * auth: optionalJWT
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 200, 500
 */
export interface GetAuthUserQueryBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/auth/user-query`
 * handler: lookupUsers — controller/auth.js:55
 * ruta: routes/auth.js:34
 * auth: optionalJWT, requireSessionFromDashboard
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 */

/**
 * `POST /api/auth/users`
 * handler: showAllUsers — controller/auth.js:51
 * ruta: routes/auth.js:37
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 */

/**
 * `POST /api/auth`
 * handler: checkUser — controller/auth.js:131
 * ruta: routes/auth.js:76
 * auth: check("email", "Email is mandatory").isEmail()
 * status: 201, 500
 */
export interface PostAuthBody {
  userInfoEmailCheck?: string;
}

/**
 * `POST /api/cache_update/remove-cache`
 * handler: updateCache — middlewares/cacheUpdateDelete.js:4
 * ruta: routes/cache_route.js:10
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostCacheUpdateRemoveCacheBody {
  key?: string;
}

/**
 * `GET /api/cash-report/cash-report`
 * handler: cashReport — controller/cashReport.js:27
 * ruta: routes/cashReport.js:14
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `CashReport.find()`: cualquier subconjunto de los campos de `models/CashReport.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetCashReportCashReportBody {
  admin?: string;
  amount?: string;
  attendee?: string;
  company?: string;
  createdAt?: string;
  deviceLost?: unknown[];
  event?: string;
  paymentIntent_charge_transaction?: string;
  typeCollection?: string;
}

/**
 * `POST /api/cash-report/cash-reports`
 * handler: cashReport — controller/cashReport.js:27
 * ruta: routes/cashReport.js:17
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `CashReport.find()`: cualquier subconjunto de los campos de `models/CashReport.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostCashReportCashReportsBody {
  admin?: string;
  amount?: string;
  attendee?: string;
  company?: string;
  createdAt?: string;
  deviceLost?: unknown[];
  event?: string;
  paymentIntent_charge_transaction?: string;
  typeCollection?: string;
}

/**
 * `POST /api/cash-report/create-cash-report`
 * handler: createReport — controller/cashReport.js:7
 * ruta: routes/cashReport.js:11
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new CashReport()`: los campos son los del esquema `models/CashReport.js`
 * status: 201, 500
 */
export interface PostCashReportCreateCashReportBody {
  admin?: string;
  amount?: string;
  attendee?: string;
  company?: string;
  createdAt?: string;
  deviceLost?: unknown[];
  event?: string;
  paymentIntent_charge_transaction?: string;
  typeCollection?: string;
}

/**
 * `POST /api/cash-report/remove-cash-report/:id`
 * handler: removeCashReportAfterRefund — controller/cashReport.js:56
 * ruta: routes/cashReport.js:20
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PostCashReportRemoveCashReportByIdParams {
  id: string;
}

/**
 * `PATCH /api/cash-report/update-cash-report/:id`
 * handler: updateCashReport — controller/cashReport.js:73
 * ruta: routes/cashReport.js:23
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchCashReportUpdateCashReportByIdBody {
  id?: string;
  template?: Record<string, unknown>;
}

/**
 * `POST /api/cloudinary/upload-image`
 * handler: cloudinaryUploader — cloudinary/connection.js:4
 * ruta: index.js:209
 * auth: sin middleware de auth en la ruta
 * NOTA: montado como middleware directo (`app.use("/api/cloudinary", handler)`): CUALQUIER método y subpath bajo `/api/cloudinary` llega a este handler; `routes/cloudinary.js` no está montado
 * status: 201, 500
 */
export interface PostCloudinaryUploadImageBody {
  context?: string;
  imageFile?: string;
  imageID?: string;
  tags?: string;
}

/**
 * `POST /api/company/assign-location`
 * handler: assignLocationToUser — controller/company.js:250
 * ruta: routes/company.js:91
 * auth: sin middleware de auth en la ruta
 * status: 200, 404, 500
 */
export interface PostCompanyAssignLocationBody {
  company_id?: string;
  location_name?: string;
  user_email?: string;
}

/**
 * `POST /api/company/companies`
 * handler: getCompanyList — controller/company.js:227
 * ruta: routes/company.js:89
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */

/**
 * `POST /api/company/consulting-signatures`
 * handler: consultingSignaturesStaffMember — controller/document.js:623
 * ruta: routes/company.js:130
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostCompanyConsultingSignaturesBody {
  company_id?: string;
  contract_url?: string;
  item_ids?: string;
  staff_member_id?: string;
  verification_id?: string;
}

/**
 * `POST /api/company/consumer-signatures`
 * handler: getConsumerSignatures — controller/document.js:748
 * ruta: routes/company.js:133
 * auth: optionalJWT
 * status: 500
 */
export interface PostCompanyConsumerSignaturesBody {
  company_id?: string;
  consumer_id?: string;
  event_id?: string;
}

/**
 * `POST /api/company/event-consumer-signatures`
 * handler: stampEventConsumerSignatures — controller/document.js:689
 * ruta: routes/company.js:147
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostCompanyEventConsumerSignaturesBody {
  accepted?: string;
  company_id?: string;
  consumer_id?: string;
  contract_url?: string;
  date?: string;
  event_id?: string;
  signature?: Record<string, unknown>;
}

/**
 * `POST /api/company/new_provider`
 * handler: createProviderCompany — controller/providerCompany.js:3
 * ruta: routes/company.js:95
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 500
 */
export interface PostCompanyNewProviderBody {
  address: Record<string, unknown>;
  companyName: string;
  contactInfo: string;
  creator: string;
  industry: string;
  services: string;
}

/**
 * `POST /api/company/new`
 * handler: createCompany — controller/company.js:12
 * ruta: routes/company.js:79
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostCompanyNewBody {
  address?: Record<string, unknown>;
  company_logo?: string;
  company_name?: string;
  employees?: string;
  industry?: string;
  location?: Record<string, unknown>;
  main_email?: string;
  owner?: string;
  phone?: string;
  stripe_customer_id?: string;
  website?: string;
}

/**
 * `GET /api/company/provider-companies`
 * handler: getProviderCompanies — controller/providerCompany.js:92
 * ruta: routes/company.js:108
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface GetCompanyProviderCompaniesQuery {
  creator: string;
}

/**
 * `POST /api/company/provider-company/:id`
 * handler: getSpecificProviderCompany — controller/providerCompany.js:137
 * ruta: routes/company.js:153
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostCompanyProviderCompanyByIdBody {
  creator: string;
  provider_id?: string;
}

/**
 * `POST /api/company/provider-upload-document/:id`
 * handler: uploadProviderDocument — controller/providerCompany.js:321
 * ruta: routes/company.js:101
 * auth: upload.single("document")
 * status: 200, 400, 404, 500
 */
export interface PostCompanyProviderUploadDocumentByIdBody {
  company_id?: string;
  created_by?: string;
  document_type?: string;
  title?: string;
  uploadedAt?: string;
}
export interface PostCompanyProviderUploadDocumentByIdParams {
  id: string;
}

/**
 * `GET /api/company/search-company`
 * handler: searchingGetCompanyInfo — controller/company.js:181
 * ruta: routes/company.js:87
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetCompanySearchCompanyBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/company/search-company`
 * handler: searchingCompany — controller/company.js:158
 * ruta: routes/company.js:85
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Company.find()`: cualquier subconjunto de los campos de `models/Company.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostCompanySearchCompanyBody {
  address?: Record<string, unknown>;
  company_logo?: string;
  company_name?: string;
  email_branding?: boolean;
  employees?: unknown[];
  industry?: string;
  location?: unknown[];
  main_email?: string;
  owner?: string;
  phone?: string;
  roleLabels?: Record<string, unknown>;
  stripe_connected_account?: Record<string, unknown>;
  stripe_customer_id?: string;
  structure?: Record<string, unknown>;
  website?: string;
}

/**
 * `POST /api/company/signatures-for-consumer-member`
 * handler: collectingSignaturesForConsumerMember — controller/document.js:545
 * ruta: routes/company.js:116
 * auth: optionalJWT
 * headers: accept-language, cf-ipcountry, timezone, user-agent, x-client-ip, x-forwarded-for, x-location, x-real-ip, x-timezone
 * status: 200, 409, 500
 */
export interface PostCompanySignaturesForConsumerMemberBody {
  company_id?: string;
  consumer_member_id?: string;
  contract_url?: string;
  date?: string;
  item_ids?: string;
  signature?: Record<string, unknown>;
  verification_id?: string;
}

/**
 * `POST /api/company/signatures`
 * handler: collectingSignatures — controller/document.js:460
 * ruta: routes/company.js:111
 * auth: sin middleware de auth en la ruta
 * headers: accept-language, cf-ipcountry, timezone, user-agent, x-client-ip, x-forwarded-for, x-location, x-real-ip, x-timezone
 * status: 200, 500
 */
export interface PostCompanySignaturesBody {
  company_id?: string;
  contract_url?: string;
  date?: string;
  item_ids?: string;
  signature?: Record<string, unknown>;
  staff_member_id?: string;
  verification_id?: string;
}

/**
 * `PATCH /api/company/update_provider/:id`
 * handler: updateProviderCompany — controller/providerCompany.js:193
 * ruta: routes/company.js:98
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface PatchCompanyUpdateProviderByIdBody {
  address?: Record<string, unknown>;
  city?: string;
  companyName?: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  services?: string;
  state?: string;
  status?: string;
  street?: string;
}
export interface PatchCompanyUpdateProviderByIdParams {
  id: string;
}

/**
 * `PATCH /api/company/update-company/:id`
 * handler: updatingCompany — controller/company.js:115
 * ruta: routes/company.js:81
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("company", "update")
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchCompanyUpdateCompanyByIdParams {
  id: string;
}

/**
 * `PATCH /api/company/update-company/register-process/:id`
 * handler: updatingCompany — controller/company.js:115
 * ruta: routes/company.js:83
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchCompanyUpdateCompanyRegisterProcessByIdParams {
  id: string;
}

/**
 * `PATCH /api/company/update-signatures`
 * handler: updateStampEventConsumerSignatures — controller/document.js:724
 * ruta: routes/company.js:150
 * auth: sin middleware de auth en la ruta
 * status: 200, 404, 500
 */
export interface PatchCompanyUpdateSignaturesBody {
  signatureID?: string;
  transactionID?: string;
}

/**
 * `POST /api/consumer/stripe/create-customer`
 * handler: stripeCustomer — controller/stripe.js:30
 * ruta: routes/consumer.js:29
 * auth: optionalJWT
 * status: 201, 400
 */
export interface PostConsumerStripeCreateCustomerBody {
  email?: string;
  name?: string;
  phoneNumber?: string;
}

/**
 * `POST /api/consumer/stripe/find-customer`
 * handler: listAllCustomers — controller/stripe.js:763
 * ruta: routes/consumer.js:25
 * auth: optionalJWT
 * NOTA: el body se usa como FILTRO Mongo en `StripeCustomer.find()`: cualquier subconjunto de los campos de `models/StripeCustomer.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostConsumerStripeFindCustomerBody {
  email?: string;
  name?: string;
  phone?: string;
  stripeid?: string;
}

/**
 * `POST /api/consumer/users`
 * handler: showAllUsers — controller/auth.js:51
 * ruta: routes/consumer.js:33
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 */

/**
 * `DELETE /api/db_company/:id`
 * handler: deleteCompany — mysql/controllers/company.js:70
 * ruta: mysql/routes/company.js:77
 * auth: validateJWT, checkTokenVersion, authorizePermission("company", "delete")
 * status: 200, 500
 */
export interface DeleteDbCompanyByIdBody {
  company_id?: number;
}

/**
 * `DELETE /api/db_company/categories/:category_id`
 * handler: deleteCategory — mysql/controllers/categories_groups.js:51
 * ruta: mysql/routes/company.js:216
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 200, 400, 404, 500
 */
export interface DeleteDbCompanyCategoriesByCategoryIdBody {
  company_id: number;
}
export interface DeleteDbCompanyCategoriesByCategoryIdParams {
  category_id: number;
}

/**
 * `POST /api/db_company/categories/upsert`
 * handler: upsertCategory — mysql/controllers/categories_groups.js:27
 * ruta: mysql/routes/company.js:215
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "create")
 * status: 200, 400, 500
 */
export interface PostDbCompanyCategoriesUpsertBody {
  active?: boolean;
  category_name: string;
  company_id: number;
  sub_category_name?: string;
}

/**
 * `POST /api/db_company/categories`
 * handler: listCompanyCategories — mysql/controllers/categories_groups.js:5
 * ruta: mysql/routes/company.js:213
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 400, 500
 */
export interface PostDbCompanyCategoriesBody {
  company_id: number;
}

/**
 * `GET /api/db_company/check-company-exists`
 * handler: checkInventoryCompanyExists — mysql/controllers/item.js:1572
 * ruta: mysql/routes/company.js:98
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 500
 */
export interface GetDbCompanyCheckCompanyExistsBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_company/check-item`
 * handler: checkingItem — mysql/controllers/item.js:1313
 * ruta: mysql/routes/company.js:207
 * auth: validateJWT, checkTokenVersion
 * NOTA: rest-spread `...bodyFilters`: acepta campos extra
 * status: 201, 400, 403, 500
 */
export interface PostDbCompanyCheckItemBody {
  preference?: string;
  role?: string;
}

/**
 * `POST /api/db_company/companies_information`
 * handler: consultingCompanyTable — mysql/controllers/company.js:83
 * ruta: mysql/routes/company.js:62
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/db_company/company-inventory-grouped-full`
 * handler: getInventoryGroupedFull — mysql/controllers/categories_groups.js:159
 * ruta: mysql/routes/company.js:224
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostDbCompanyCompanyInventoryGroupedFullBody {
  company_id: number;
}

/**
 * `POST /api/db_company/company-inventory-pagination`
 * handler: consultingCompanyInventoryWithPagination — mysql/controllers/item.js:1978
 * ruta: mysql/routes/company.js:107
 * auth: validateJWT, checkTokenVersion
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 500
 */
export interface PostDbCompanyCompanyInventoryPaginationQuery {
  direction?: string;
  lastItemId: string;
}

/**
 * `POST /api/db_company/company-inventory-structure`
 * handler: retrieveItemData — mysql/controllers/item.js:2498
 * ruta: mysql/routes/company.js:121
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 403, 500
 */
export interface PostDbCompanyCompanyInventoryStructureBody {
  company_id: number;
}

/**
 * `POST /api/db_company/company-inventory-with-current-warehouse-status`
 * handler: retrieveCompanyInventory — mysql/controllers/item.js:2537
 * ruta: mysql/routes/company.js:124
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbCompanyCompanyInventoryWithCurrentWarehouseStatusBody {
  company_id?: number;
}

/**
 * `POST /api/db_company/consulting-company`
 * handler: consultingCompany — mysql/controllers/company.js:48
 * ruta: mysql/routes/company.js:59
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * status: 200, 500
 */
export interface PostDbCompanyConsultingCompanyBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `GET /api/db_company/current-inventory/:company_id`
 * handler: checkingInventoryCurrentState — mysql/controllers/item.js:1286
 * ruta: mysql/routes/company.js:133
 * auth: validateJWT, checkTokenVersion
 * status: 201, 403, 500
 */
export interface GetDbCompanyCurrentInventoryByCompanyIdParams {
  company_id: number;
}

/**
 * `POST /api/db_company/delete-bulk-items`
 * handler: deleteBulkItems — mysql/controllers/item.js:3775
 * ruta: mysql/routes/company.js:204
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * headers: Idempotency-Key, idempotency-key
 * status: 200, 202, 400, 403, 500
 */
export interface PostDbCompanyDeleteBulkItemsBody {
  company_id: number;
  item_ids: number;
}

/**
 * `POST /api/db_company/filter-suppliers-info-items`
 * handler: filterSuppliersInfoItems — mysql/controllers/item.js:3719
 * ruta: mysql/routes/company.js:195
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbCompanyFilterSuppliersInfoItemsBody {
  company_id?: number;
}

/**
 * `POST /api/db_company/get-grouped-inventory-by-search-parameter`
 * handler: getGroupedInventoryBySearchParameter — mysql/controllers/item.js:3588
 * ruta: mysql/routes/company.js:192
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbCompanyGetGroupedInventoryBySearchParameterBody {
  company_id: number;
  searchParameter: string;
}

/**
 * `POST /api/db_company/get-inventory-company`
 * handler: getGroupedItemInventory — mysql/controllers/item.js:1896
 * ruta: mysql/routes/company.js:136
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * status: 200, 500
 */
export interface PostDbCompanyGetInventoryCompanyBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_company/get-location-item-types-hierarchy`
 * handler: getInventoryHierarchyWithTypes — mysql/controllers/item.js:3445
 * ruta: mysql/routes/company.js:184
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 403, 500
 */
export interface PostDbCompanyGetLocationItemTypesHierarchyBody {
  company_id: number;
}

/**
 * `DELETE /api/db_company/groups/:group_id`
 * handler: deleteGroup — mysql/controllers/categories_groups.js:125
 * ruta: mysql/routes/company.js:221
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 200, 400, 404, 500
 */
export interface DeleteDbCompanyGroupsByGroupIdBody {
  company_id: number;
}
export interface DeleteDbCompanyGroupsByGroupIdParams {
  group_id: number;
}

/**
 * `POST /api/db_company/groups/upsert`
 * handler: upsertGroup — mysql/controllers/categories_groups.js:101
 * ruta: mysql/routes/company.js:220
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "create")
 * status: 200, 400, 500
 */
export interface PostDbCompanyGroupsUpsertBody {
  active?: boolean;
  company_id: number;
  item_group: string;
  sub_item_group?: string;
}

/**
 * `POST /api/db_company/groups`
 * handler: listCompanyGroups — mysql/controllers/categories_groups.js:79
 * ruta: mysql/routes/company.js:219
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 400, 500
 */
export interface PostDbCompanyGroupsBody {
  company_id: number;
}

/**
 * `POST /api/db_company/industry`
 * handler: consultingIndustryCompanyTable — mysql/controllers/company.js:95
 * ruta: mysql/routes/company.js:65
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/db_company/insert-new-single-item`
 * handler: insertingItem — mysql/controllers/item.js:163
 * ruta: mysql/routes/company.js:130
 * auth: sin middleware de auth en la ruta
 * status: 201, 403
 */
export interface PostDbCompanyInsertNewSingleItemBody {
  brand?: string;
  category_name?: string;
  company?: Record<string, unknown>;
  company_id?: number;
  container?: Record<string, unknown>;
  containerSpotLimit?: string;
  container_id?: number;
  cost?: number;
  current_location?: string;
  descript_item?: string;
  display_item?: boolean;
  extra_serial_number?: number;
  image_url?: string;
  item_group?: string;
  location?: Record<string, unknown>;
  location_name?: string;
  main_warehouse?: string;
  ownership?: string;
  return_date?: string;
  returnedRentedInfo?: string;
  serial_number?: number;
  sub_category_name?: string;
  sub_item_group?: string;
  sub_location?: Record<string, unknown>;
  sub_location_name?: string;
  sub_location_parent_id?: number;
  supplier_info?: Record<string, unknown>;
  warehouse?: string;
}

/**
 * `POST /api/db_company/inventory-based-on-location-and-sublocation`
 * handler: consultingCompanyInventoryBasedOnLocationAndSubLocation — mysql/controllers/item.js:2087
 * ruta: mysql/routes/company.js:115
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 400, 500
 */
export interface PostDbCompanyInventoryBasedOnLocationAndSublocationBody {
  company_id?: number;
  location?: Record<string, unknown>;
  location_id?: number;
  [key: string]: unknown;
}
export interface PostDbCompanyInventoryBasedOnLocationAndSublocationQuery {
  sub_location: Record<string, unknown>;
}

/**
 * `POST /api/db_company/inventory-based-on-submitted-parameters`
 * handler: consultingCompanyInventoryBasedOnSubmittedParameters — mysql/controllers/item.js:2451
 * ruta: mysql/routes/company.js:139
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface PostDbCompanyInventoryBasedOnSubmittedParametersBody {
  query?: string;
  values?: string;
}

/**
 * `POST /api/db_company/inventory-query`
 * handler: runNamedInventoryQuery — mysql/controllers/item.js:2411
 * ruta: mysql/routes/company.js:149
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostDbCompanyInventoryQueryBody {
  params?: string;
  queryName: string;
}

/**
 * `POST /api/db_company/locations`
 * handler: listCompanyLocations — mysql/controllers/location.js:620
 * ruta: mysql/routes/company.js:214
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 400, 500
 */
export interface PostDbCompanyLocationsBody {
  company_id: number;
}

/**
 * `POST /api/db_company/new_company`
 * handler: insertingCompany — mysql/controllers/company.js:11
 * ruta: mysql/routes/company.js:68
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbCompanyNewCompanyBody {
  city_address?: string;
  company_name?: string;
  email_company?: string;
  industry?: string;
  phone_number?: number;
  state_address?: string;
  street_address?: string;
  zip_address?: string;
}

/**
 * `POST /api/db_company/retrieve-company-inventory`
 * handler: retrieveCompanyInventoryBasedOnParams — mysql/controllers/item.js:4174
 * ruta: mysql/routes/company.js:74
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbCompanyRetrieveCompanyInventoryBody {
  category_name?: string;
  company_id: number;
  expected?: string;
  item_group?: string;
  limit?: number;
  location: Record<string, unknown>;
}

/**
 * `POST /api/db_company/retrieve-company-items-with-locations`
 * handler: retrieveCompanyInventory — mysql/controllers/item.js:2537
 * ruta: mysql/routes/company.js:210
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbCompanyRetrieveCompanyItemsWithLocationsBody {
  company_id?: number;
}

/**
 * `POST /api/db_company/return-event-devices`
 * handler: returnEventDevicesToWarehouse — mysql/controllers/item.js:2246
 * ruta: mysql/routes/company.js:159
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 404, 500
 */
export interface PostDbCompanyReturnEventDevicesBody {
  category_name: string;
  event_id: number;
  item_group: string;
  serial_numbers?: unknown[];
}

/**
 * `POST /api/db_company/returning-leased-equipment`
 * handler: returningLeasedEquipmentToCompany — mysql/controllers/item.js:879
 * ruta: mysql/routes/company.js:87
 * auth: sin middleware de auth en la ruta
 * status: 200, 201, 401, 500
 */
export interface PostDbCompanyReturningLeasedEquipmentBody {
  enableAssignFeature?: boolean;
  item_id?: number;
  return_date?: string;
  returnedRentedInfo?: string;
}

/**
 * `GET /api/db_company/search-inventory`
 * handler: searchingGetInventoryTracking — mysql/controllers/item.js:1408
 * ruta: mysql/routes/company.js:95
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetDbCompanySearchInventoryBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_company/search-inventory`
 * handler: searchingInventoryTracking — mysql/controllers/item.js:1361
 * ruta: mysql/routes/company.js:92
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbCompanySearchInventoryBody {
  company_id?: number;
  searchValue?: string;
}

/**
 * `POST /api/db_company/update_company`
 * handler: updateCompanyData — mysql/controllers/company.js:151
 * ruta: mysql/routes/company.js:71
 * auth: validateJWT, checkTokenVersion, authorizePermission("company", "update")
 * NOTA: rest-spread `...updateFields`: acepta campos extra
 * status: 200, 400, 404, 500
 */
export interface PostDbCompanyUpdateCompanyBody {
  company_id: number;
}

/**
 * `POST /api/db_company/update-all-items-in-inventory`
 * handler: updateAllItemsInInventory — mysql/controllers/item.js:2630
 * ruta: mysql/routes/company.js:167
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbCompanyUpdateAllItemsInInventoryBody {
  brand?: string;
  category_name?: string;
  company_id?: number;
  container?: Record<string, unknown>;
  containerSpotLimit?: string;
  cost?: number;
  current_location?: string;
  descript_item?: string;
  display_item?: boolean;
  enableAssignFeature?: boolean;
  extra_serial_number?: number;
  image_url?: string;
  item_group?: string;
  location?: Record<string, unknown>;
  main_warehouse?: string;
  originalTemplate?: string;
  ownership?: string;
  return_date?: string;
  returnedRentedInfo?: string;
  sub_location?: Record<string, unknown>;
  supplier_info?: Record<string, unknown>;
  update_at?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_company/update-content-in-container`
 * handler: updateContentInContainerItem — mysql/controllers/item.js:1665
 * ruta: mysql/routes/company.js:101
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbCompanyUpdateContentInContainerBody {
  container_items?: string;
  item_id?: number;
  ref?: string;
}

/**
 * `POST /api/db_company/update-group-items`
 * handler: updateGroupItems — mysql/controllers/company.js:193
 * ruta: mysql/routes/company.js:89
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbCompanyUpdateGroupItemsBody {
  brand?: string;
  category_name?: string;
  company?: Record<string, unknown>;
  company_id?: number;
  container?: Record<string, unknown>;
  containerSpotLimit?: string;
  cost?: number;
  current_location?: string;
  data?: Record<string, unknown>;
  descript_item?: string;
  enableAssignFeature?: boolean;
  extra_serial_number?: number;
  image_url?: string;
  item_group?: string;
  location?: Record<string, unknown>;
  main_warehouse?: string;
  ownership?: string;
  return_date?: string;
  sub_location?: Record<string, unknown>;
  update_at?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_company/update-items-based-on-alphanumeric-serial-number`
 * handler: updateItemsBasedOnAlphanumericSerialNumber — mysql/controllers/item.js:2836
 * ruta: mysql/routes/company.js:170
 * auth: validateJWT, checkTokenVersion
 * generado por factory: createQueuedJobController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 202, 500
 */

/**
 * `POST /api/db_company/update-items-based-on-serial-number`
 * handler: updateItemsBasedOnSerialNumber — mysql/controllers/item.js:2718
 * ruta: mysql/routes/company.js:178
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbCompanyUpdateItemsBasedOnSerialNumberBody {
  brand?: string;
  category_name?: string;
  container?: Record<string, unknown>;
  containerSpotLimit?: string;
  cost?: number;
  current_location?: string;
  descript_item?: string;
  display_item?: boolean;
  enableAssignFeature?: boolean;
  extra_serial_number?: number;
  image_url?: string;
  item_group?: string;
  location?: Record<string, unknown>;
  main_warehouse?: string;
  originalTemplate?: string;
  ownership?: string;
  return_date?: string;
  returnedRentedInfo?: string;
  sub_location?: Record<string, unknown>;
  supplier_info?: Record<string, unknown>;
  warehouse?: string;
}

/**
 * `POST /api/db_consumer_attending_event_record/consulting-consumer-event`
 * handler: consultingCustomerAttendingEventsInfo — mysql/controllers/consumerAttendingEvent.js:26
 * ruta: mysql/routes/consumerAttendingEvent.js:11
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/db_consumer_attending_event_record/consumer-events`
 * handler: renderAllCustomerByEvent — mysql/controllers/consumerAttendingEvent.js:51
 * ruta: mysql/routes/consumerAttendingEvent.js:14
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbConsumerAttendingEventRecordConsumerEventsBody {
  event?: Record<string, unknown>;
}

/**
 * `POST /api/db_consumer_attending_event_record/new_consumer_event`
 * handler: insertingConsumerAttendingEvent — mysql/controllers/consumerAttendingEvent.js:6
 * ruta: mysql/routes/consumerAttendingEvent.js:17
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbConsumerAttendingEventRecordNewConsumerEventBody {
  consumer_attending_id?: number;
  event_attended_id?: number;
}

/**
 * `DELETE /api/db_consumer/:id`
 * handler: deleteCustomer — mysql/controllers/consumer.js:124
 * ruta: mysql/routes/consumers.js:28
 * auth: validateJWT, checkTokenVersion, authorizePermission("consumer", "delete")
 * generado por factory: createDeleteCustomer
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 500
 */

/**
 * `POST /api/db_consumer/consulting-consumer`
 * handler: consultingConsumerInfo — mysql/controllers/consumer.js:25
 * ruta: mysql/routes/consumers.js:17
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 500
 */
export interface PostDbConsumerConsultingConsumerBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_consumer/consumers_information`
 * handler: consultingConsumerTable — mysql/controllers/consumer.js:40
 * ruta: mysql/routes/consumers.js:20
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/db_consumer/new_consumer`
 * handler: insertingCustomer — mysql/controllers/consumer.js:6
 * ruta: mysql/routes/consumers.js:25
 * auth: optionalJWT, requireSessionFromDashboard
 * status: 201, 500
 */
export interface PostDbConsumerNewConsumerBody {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: number;
}

/**
 * `DELETE /api/db_event/:id`
 * handler: deleteEvent — mysql/controllers/events.js:251
 * ruta: mysql/routes/events.js:98
 * auth: validateJWT, checkTokenVersion, authorizePermission("event", "delete")
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 409, 500
 */
export interface DeleteDbEventByIdParams {
  id: number;
}

/**
 * `POST /api/db_event/allocate-device-container-event`
 * handler: allocateDeviceMarkedAsContainerInEvent — mysql/controllers/items_events.js:655
 * ruta: mysql/routes/events.js:198
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 404, 500
 */
export interface PostDbEventAllocateDeviceContainerEventBody {
  company_id: number;
  company_id_nosql?: string;
  data: Record<string, unknown>;
  eventName?: string;
  event_id: number;
  logistic_status?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_event/allocate-device-event`
 * handler: allocateDeviceToEvent — mysql/controllers/items_events.js:558
 * ruta: mysql/routes/events.js:190
 * auth: validateJWT, checkTokenVersion, authorizePermission("event", "update")
 * status: 200, 400, 422
 */
export interface PostDbEventAllocateDeviceEventBody {
  category_name?: string;
  company_id?: number;
  data: Record<string, unknown>;
  event_id?: number;
  item_group?: string;
  logistic_status?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_event/confirm-item-return`
 * handler: confirmItemsReturnedToStock — mysql/controllers/item.js:3987
 * ruta: mysql/routes/events.js:87
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbEventConfirmItemReturnBody {
  company_id: number;
  location?: Record<string, unknown>;
  noSqlCompanyId?: string;
  noSqlEventName: string;
  serial_numbers: unknown[];
  sub_location?: Record<string, unknown>;
  user_id: number;
}

/**
 * `POST /api/db_event/consulting-event`
 * handler: consultingEventInformation — mysql/controllers/events.js:146
 * ruta: mysql/routes/events.js:52
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 400, 500
 */
export interface PostDbEventConsultingEventBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_event/device-final-status-refactored`
 * handler: itemFinalStatusWhenEventIsFinishedRefactored — mysql/controllers/item.js:1226
 * ruta: mysql/routes/events.js:93
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbEventDeviceFinalStatusRefactoredBody {
  allInventoryOfEvent?: string;
  eventId?: string;
  groupingDevicesFromNoSQL?: string;
  update_at?: string;
}

/**
 * `POST /api/db_event/device-final-status`
 * handler: itemFinalStatusWhenEventIsFinished — mysql/controllers/item.js:1199
 * ruta: mysql/routes/events.js:90
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbEventDeviceFinalStatusBody {
  condition?: string;
  event_id?: number;
  serial_number?: number;
  status?: string;
  updated_at?: string;
}

/**
 * `POST /api/db_event/event_device_directly`
 * handler: insertingDeviceInEventDirectly — mysql/controllers/items_events.js:280
 * ruta: mysql/routes/events.js:73
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbEventEventDeviceDirectlyBody {
  event_id?: number;
  item_id?: number;
}

/**
 * `POST /api/db_event/event_device`
 * handler: insertingItemInEvent — mysql/controllers/items_events.js:46
 * ruta: mysql/routes/events.js:70
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201
 */

/**
 * `POST /api/db_event/event_staff`
 * handler: insertingStaffInEvent — mysql/controllers/events.js:294
 * ruta: mysql/routes/events.js:67
 * auth: sin middleware de auth en la ruta
 * status: 201
 */
export interface PostDbEventEventStaffBody {
  event_id?: number;
  role?: string;
  staff_id?: number;
}

/**
 * `POST /api/db_event/event-count/close`
 * handler: closeEventCount — mysql/controllers/eventCount.js:242
 * ruta: mysql/routes/events.js:232
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * status: 200, 500
 */
export interface PostDbEventEventCountCloseBody {
  company_id?: number;
  event_id?: number;
  scanned?: string;
}

/**
 * `POST /api/db_event/event-count/reconcile`
 * handler: reconcileEventCount — mysql/controllers/eventCount.js:205
 * ruta: mysql/routes/events.js:224
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 500
 */
export interface PostDbEventEventCountReconcileBody {
  company_id?: number;
  event_id?: number;
  scanned?: string;
}

/**
 * `GET /api/db_event/event-inventory/:id`
 * handler: consultingInventoryEvent — mysql/controllers/events.js:329
 * ruta: mysql/routes/events.js:101
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetDbEventEventInventoryByIdParams {
  id: number;
}

/**
 * `POST /api/db_event/event-inventory/:id`
 * handler: consultingInventoryInEvent — mysql/controllers/items_events.js:413
 * ruta: mysql/routes/events.js:76
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */
export interface PostDbEventEventInventoryByIdParams {
  id: number;
}

/**
 * `POST /api/db_event/events_company`
 * handler: consultingEventsPerCompany — mysql/controllers/events.js:212
 * ruta: mysql/routes/events.js:58
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */

/**
 * `POST /api/db_event/events_information`
 * handler: consultingEventTable — mysql/controllers/events.js:179
 * ruta: mysql/routes/events.js:55
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 400, 500
 */
export interface PostDbEventEventsInformationBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_event/inserting-items-in-event-from-container`
 * handler: insertingDeviceInEventDirectlyFromContainer — mysql/controllers/items_events.js:498
 * ruta: mysql/routes/events.js:123
 * auth: validateJWT, checkTokenVersion
 * headers: Idempotency-Key, idempotency-key
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostDbEventInsertingItemsInEventFromContainerBody {
  event_id?: number;
  refDatabase?: string;
}

/**
 * `POST /api/db_event/inventory-based-on-submitted-parameters`
 * handler: consultingCompanyInventoryBasedOnSubmittedParameters — mysql/controllers/item.js:2451
 * ruta: mysql/routes/events.js:162
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface PostDbEventInventoryBasedOnSubmittedParametersBody {
  query?: string;
  values?: string;
}

/**
 * `POST /api/db_event/inventory-query`
 * handler: runNamedInventoryQuery — mysql/controllers/item.js:2411
 * ruta: mysql/routes/events.js:172
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostDbEventInventoryQueryBody {
  params?: string;
  queryName: string;
}

/**
 * `POST /api/db_event/lock-items-for-event`
 * handler: lockItemsForEvent — mysql/controllers/items_events.js:823
 * ruta: mysql/routes/events.js:218
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 500
 */
export interface PostDbEventLockItemsForEventBody {
  company_id: number;
  event_id: number;
  items: unknown[];
}

/**
 * `POST /api/db_event/new_event`
 * handler: insertingEvent — mysql/controllers/events.js:33
 * ruta: mysql/routes/events.js:61
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbEventNewEventBody {
  city_address?: string;
  company_assigned_event_id?: number;
  email_company?: string;
  event_name?: string;
  phone_number?: number;
  state_address?: string;
  street_address?: string;
  venue_name?: string;
  zip_address?: string;
}

/**
 * `POST /api/db_event/remove-item-inventory-event`
 * handler: deletingItemsInEventAfterDeviceInventoryIsUpdated — mysql/controllers/items_events.js:301
 * ruta: mysql/routes/events.js:104
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbEventRemoveItemInventoryEventBody {
  category_name?: string;
  event_id?: number;
  item_group?: string;
  serial_number?: number;
}

/**
 * `POST /api/db_event/remove-reserved-items-for-event`
 * handler: removeReservedItemsInInventoryForEvent — mysql/controllers/items_events.js:917
 * ruta: mysql/routes/events.js:215
 * auth: sin middleware de auth en la ruta
 * status: 200, 404
 */
export interface PostDbEventRemoveReservedItemsForEventBody {
  company_id?: number;
  event_id?: number;
  item_id?: number;
}

/**
 * `POST /api/db_event/reserve-items-for-event`
 * handler: reserveItemsInInventoryForEvent — mysql/controllers/items_events.js:875
 * ruta: mysql/routes/events.js:207
 * auth: validateJWT, authorizePermission("event", "update")
 * status: 200, 404, 500
 */
export interface PostDbEventReserveItemsForEventBody {
  company_id?: number;
  items?: unknown[];
}

/**
 * `POST /api/db_event/retrieve-item-group-location-quantity`
 * handler: getGroupedItemInventory — mysql/controllers/item.js:1896
 * ruta: mysql/routes/events.js:144
 * auth: validateJWT, authorizePermission("event", "read")
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * status: 200, 500
 */
export interface PostDbEventRetrieveItemGroupLocationQuantityBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_event/retrieve-item-group-quantity-with-format`
 * handler: getGroupedItemWithFormatInventory — mysql/controllers/item.js:2152
 * ruta: mysql/routes/events.js:152
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/db_event/retrieve-item-location-quantity-full-details`
 * handler: consultItemDataFromSerialNumber — mysql/controllers/item.js:1825
 * ruta: mysql/routes/events.js:137
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbEventRetrieveItemLocationQuantityFullDetailsBody {
  category_name?: string;
  company_id: number;
  enableAssignFeature?: boolean;
  item_group: string;
  location: Record<string, unknown>;
  quantity: number;
  serial_number?: number;
  warehouse?: string;
}

/**
 * `POST /api/db_event/retrieve-item-location-quantity`
 * handler: retrieveItemLocationQuantityForEvent — mysql/controllers/item.js:1751
 * ruta: mysql/routes/events.js:131
 * auth: sin middleware de auth en la ruta
 * headers: accept-encoding
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 400, 500
 */
export interface PostDbEventRetrieveItemLocationQuantityBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_event/return-event-devices`
 * handler: returnEventDevicesToWarehouse — mysql/controllers/item.js:2246
 * ruta: mysql/routes/events.js:182
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 404, 500
 */
export interface PostDbEventReturnEventDevicesBody {
  category_name: string;
  event_id: number;
  item_group: string;
  serial_numbers?: unknown[];
}

/**
 * `POST /api/db_event/returning-item-refactored`
 * handler: returningItemToStockWhenEventIsFinishedRefactored — mysql/controllers/item.js:1099
 * ruta: mysql/routes/events.js:82
 * auth: sin middleware de auth en la ruta
 * status: 200, 201, 400, 500
 */
export interface PostDbEventReturningItemRefactoredBody {
  allInventoryOfEvent: string;
  companyId?: string;
  groupingDevicesFromNoSQL: string;
  update_at?: string;
}

/**
 * `POST /api/db_event/returning-item`
 * handler: returningItemToStockWhenEventIsFinished — mysql/controllers/item.js:1052
 * ruta: mysql/routes/events.js:79
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbEventReturningItemBody {
  category_name?: string;
  company_id?: number;
  item_group?: string;
  serial_number?: number;
  status?: string;
  update_at?: string;
}

/**
 * `POST /api/db_event/update-event/:event_id`
 * handler: updateEventInfo — mysql/controllers/events.js:82
 * ruta: mysql/routes/events.js:64
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * status: 200, 400, 404, 500
 */
export interface PostDbEventUpdateEventByEventIdBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}
export interface PostDbEventUpdateEventByEventIdParams {
  event_id: number;
}

/**
 * `POST /api/db_event/update-item-in-table-after-being-added-to-event-from-container`
 * handler: updateItemInTableAfterBeingAddedToEventFromContainer — mysql/controllers/item.js:1695
 * ruta: mysql/routes/events.js:113
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbEventUpdateItemInTableAfterBeingAddedToEventFromContainerBody {
  refDatabase?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_event/update-status-item-based-on-event`
 * handler: updateStatusItemBasedOnEvent — mysql/controllers/events.js:364
 * ruta: mysql/routes/events.js:110
 * auth: sin middleware de auth en la ruta
 * status: 200
 */
export interface PostDbEventUpdateStatusItemBasedOnEventBody {
  event_id?: number;
  status?: string;
  update_at?: string;
}

/**
 * `POST /api/db_identifier/by-items`
 * handler: getIdentifiersByItems — mysql/controllers/identifier.js:311
 * ruta: mysql/routes/identifier.js:39
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 400, 500
 */
export interface PostDbIdentifierByItemsBody {
  item_ids: number;
}

/**
 * `POST /api/db_identifier/register-bulk`
 * handler: registerIdentifiersBulk — mysql/controllers/identifier.js:181
 * ruta: mysql/routes/identifier.js:36
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * status: 200, 400, 500
 */
export interface PostDbIdentifierRegisterBulkBody {
  identifiers: string;
}

/**
 * `POST /api/db_identifier/register`
 * handler: registerIdentifier — mysql/controllers/identifier.js:76
 * ruta: mysql/routes/identifier.js:33
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * status: 200, 201, 400, 404, 409, 500
 */
export interface PostDbIdentifierRegisterBody {
  id_type?: string;
  id_value?: string;
  item_id?: number;
}

/**
 * `POST /api/db_inventory/check-item`
 * handler: checkingItem — mysql/controllers/item.js:1313
 * ruta: mysql/routes/inventory.js:33
 * auth: validateJWT
 * NOTA: rest-spread `...bodyFilters`: acepta campos extra
 * status: 201, 400, 403, 500
 */
export interface PostDbInventoryCheckItemBody {
  preference?: string;
  role?: string;
}

/**
 * `POST /api/db_inventory/check-large-data`
 * handler: checkLargeData — mysql/controllers/item.js:3157
 * ruta: mysql/routes/inventory.js:41
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 400, 500
 */
export interface PostDbInventoryCheckLargeDataBody {
  company_id: number;
  item_ids: number;
}

/**
 * `GET /api/db_inventory/container-items/:container_item_id`
 * handler: getContainerItems — mysql/controllers/item.js:2915
 * ruta: mysql/routes/inventory.js:35
 * auth: sin middleware de auth en la ruta
 * status: 400, 404, 500
 */
export interface GetDbInventoryContainerItemsByContainerItemIdParams {
  container_item_id: number;
}

/**
 * `POST /api/db_inventory/container-items`
 * handler: insertContainerItems — mysql/controllers/item.js:2848
 * ruta: mysql/routes/inventory.js:31
 * auth: validateJWT, checkTokenVersion
 * status: 400, 500
 */
export interface PostDbInventoryContainerItemsBody {
  child_ids: number;
  container_item_id: number;
}

/**
 * `DELETE /api/db_inventory/container/:container_item_id`
 * handler: deleteContainerItem — mysql/controllers/item.js:3028
 * ruta: mysql/routes/inventory.js:37
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 400, 404, 500
 */
export interface DeleteDbInventoryContainerByContainerItemIdParams {
  container_item_id: number;
}

/**
 * `PUT /api/db_inventory/container/:container_item_id`
 * handler: updateContainerItems — mysql/controllers/item.js:3084
 * ruta: mysql/routes/inventory.js:39
 * auth: validateJWT, checkTokenVersion
 * status: 400, 404, 500
 */
export interface PutDbInventoryContainerByContainerItemIdBody {
  child_ids: number;
}
export interface PutDbInventoryContainerByContainerItemIdParams {
  container_item_id: number;
}

/**
 * `POST /api/db_inventory/update-large-data`
 * handler: updateLargeData — mysql/controllers/item.js:3246
 * ruta: mysql/routes/inventory.js:55
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200
 */

/**
 * `POST /api/db_inventory/update-location-sub-location`
 * handler: updateSubLocation — mysql/controllers/item.js:3443
 * ruta: mysql/routes/inventory.js:46
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * generado por factory: createUpdateSubLocation
 * status: 200, 400, 500
 */
export interface PostDbInventoryUpdateLocationSubLocationBody {
  currentIndex: string;
  newName: string;
  path: string;
}

/**
 * `POST /api/db_item/:id(\\d+)`
 * handler: deleteItem — mysql/controllers/item.js:610
 * ruta: mysql/routes/item.js:148
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 201, 400, 403, 404, 500
 */
export interface PostDbItemByIdDBody {
  company_id: number;
  item_id: number;
}

/**
 * `POST /api/db_item/bulk-item-alphanumeric`
 * handler: insertBulkItemAlhpanumericFormat — mysql/controllers/item.js:518
 * ruta: mysql/routes/item.js:120
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "create")
 * headers: Idempotency-Key, idempotency-key
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 202, 400, 403, 404, 500
 */
export interface PostDbItemBulkItemAlphanumericBody {
  category_name?: string;
  company_id: number;
  location?: Record<string, unknown>;
}

/**
 * `POST /api/db_item/bulk-item-from-spreadsheet`
 * handler: postInventoryImport — mysql/controllers/inventoryImport.js:48
 * ruta: mysql/routes/item.js:96
 * auth: validateJWT, checkTokenVersion
 * headers: Idempotency-Key, idempotency-key
 * status: 202, 400, 401, 403, 500
 */
export interface PostDbItemBulkItemFromSpreadsheetBody {
  company?: Record<string, unknown>;
  company_id?: number;
  defaults?: string;
}

/**
 * `POST /api/db_item/bulk-item`
 * handler: insertBulkItem — mysql/controllers/item.js:433
 * ruta: mysql/routes/item.js:117
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "create")
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 202, 400, 403, 404, 500
 */
export interface PostDbItemBulkItemBody {
  category_name?: string;
  company_id: number;
  location?: Record<string, unknown>;
  max_serial_number: number;
  min_serial_number: number;
}

/**
 * `GET /api/db_item/check-company-has-inventory`
 * handler: checkingIfCompanyHasInventory — mysql/controllers/item.js:1728
 * ruta: mysql/routes/item.js:187
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetDbItemCheckCompanyHasInventoryBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `GET /api/db_item/check-inventory/:company_id`
 * handler: checkingInventoryCurrentState — mysql/controllers/items_events.js:357
 * ruta: mysql/routes/item.js:172
 * auth: validateJWT
 * status: 200, 403, 500
 */
export interface GetDbItemCheckInventoryByCompanyIdParams {
  company_id: number;
}

/**
 * `POST /api/db_item/check-item`
 * handler: checkingItem — mysql/controllers/item.js:1313
 * ruta: mysql/routes/item.js:169
 * auth: validateJWT
 * NOTA: rest-spread `...bodyFilters`: acepta campos extra
 * status: 201, 400, 403, 500
 */
export interface PostDbItemCheckItemBody {
  preference?: string;
  role?: string;
}

/**
 * `POST /api/db_item/consulting-item`
 * handler: consultingItem — mysql/controllers/item.js:584
 * ruta: mysql/routes/item.js:70
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 400, 500
 */
export interface PostDbItemConsultingItemBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_item/consulting-row-item-assigned-event`
 * handler: consultingRowInItemInvAssignedEventTable — mysql/controllers/items_events.js:438
 * ruta: mysql/routes/item.js:157
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbItemConsultingRowItemAssignedEventBody {
  company_assigned_event_id?: number;
  item_id?: number;
}

/**
 * `POST /api/db_item/current-inventory`
 * handler: consultingInventoryCurrentState — mysql/controllers/items_events.js:330
 * ruta: mysql/routes/item.js:105
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 500
 */
export interface PostDbItemCurrentInventoryBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_item/delete-bulk-items-criteria`
 * handler: deleteBulkItemBasedOnCriteria — mysql/controllers/item.js:4086
 * ruta: mysql/routes/item.js:64
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 200, 202, 400, 403, 500
 */
export interface PostDbItemDeleteBulkItemsCriteriaBody {
  category_name: string;
  company_id: number;
  item_group?: string;
  serial_number?: number;
}

/**
 * `POST /api/db_item/delete-bulk-items`
 * handler: deleteBulkItems — mysql/controllers/item.js:3775
 * ruta: mysql/routes/item.js:154
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * headers: Idempotency-Key, idempotency-key
 * status: 200, 202, 400, 403, 500
 */
export interface PostDbItemDeleteBulkItemsBody {
  company_id: number;
  item_ids: number;
}

/**
 * `POST /api/db_item/delete-item`
 * handler: deleteItem — mysql/controllers/item.js:610
 * ruta: mysql/routes/item.js:151
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 201, 400, 403, 404, 500
 */
export interface PostDbItemDeleteItemBody {
  company_id: number;
  item_id: number;
}

/**
 * `POST /api/db_item/edit-item`
 * handler: updateItemInTable — mysql/controllers/item.js:752
 * ruta: mysql/routes/item.js:123
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * NOTA: hay que enviar al menos uno de estos identificadores: company_id, item_id, serial_number
 * NOTA: los campos actualizables vienen de una lista blanca en el handler (los demás se ignoran en silencio)
 * status: 201, 400, 403, 404, 500
 */
export interface PostDbItemEditItemBody {
  brand?: string;
  category_name?: string;
  company?: Record<string, unknown>;
  company_id?: number;
  container?: Record<string, unknown>;
  containerSpotLimit?: string;
  container_id?: number;
  container_items?: string;
  cost?: number;
  current_location?: string;
  descript_item?: string;
  display_item?: boolean;
  enableAssignFeature?: boolean;
  extra_serial_number?: number;
  image_url?: string;
  isItInContainer?: boolean;
  item_group?: string;
  item_id?: number;
  location?: Record<string, unknown>;
  location_id?: number;
  logistic_status?: string;
  main_warehouse?: string;
  ownership?: string;
  return_date?: string;
  returnedRentedInfo?: string;
  serial_number?: number;
  status?: string;
  sub_category_name?: string;
  sub_item_group?: string;
  sub_location?: Record<string, unknown>;
  supplier_info?: Record<string, unknown>;
  update_at?: string;
  warehouse?: string;
  [key: string]: unknown;
}

/**
 * `PUT /api/db_item/event-items/bulk-update`
 * handler: bulkUpdateEventItemShipping — mysql/controllers/items_events.js:67
 * ruta: mysql/routes/item.js:61
 * auth: validateJWT, checkTokenVersion
 * generado por factory: createQueuedJobController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 202, 500
 */

/**
 * `POST /api/db_item/event-items/search`
 * handler: getEventItemShipping — mysql/controllers/items_events.js:136
 * ruta: mysql/routes/item.js:59
 * auth: sin middleware de auth en la ruta
 * NOTA: rest-spread `...filters`: acepta campos extra
 * status: 200, 400, 500
 */
export interface PostDbItemEventItemsSearchBody {
  company_id: number;
}

/**
 * `DELETE /api/db_item/event-items`
 * handler: removeEventItemShipping — mysql/controllers/items_events.js:83
 * ruta: mysql/routes/item.js:60
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface DeleteDbItemEventItemsBody {
  event_id: number;
  items: unknown[];
}

/**
 * `PUT /api/db_item/event-items`
 * handler: updateEventItemShipping — mysql/controllers/items_events.js:205
 * ruta: mysql/routes/item.js:58
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PutDbItemEventItemsBody {
  company_id: number;
  event_id: number;
  items: unknown[];
  updates: string;
}

/**
 * `GET /api/db_item/fragment-data`
 * handler: fragmentData — mysql/controllers/item.js:1455
 * ruta: mysql/routes/item.js:175
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201
 */
export interface GetDbItemFragmentDataBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_item/get-inventory-company`
 * handler: getGroupedItemInventory — mysql/controllers/item.js:1896
 * ruta: mysql/routes/item.js:240
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * status: 200, 500
 */
export interface PostDbItemGetInventoryCompanyBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_item/inventory_event/:id`
 * handler: consultingInventoryInEvent — mysql/controllers/items_events.js:413
 * ruta: mysql/routes/item.js:108
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */
export interface PostDbItemInventoryEventByIdParams {
  id: number;
}

/**
 * `POST /api/db_item/inventory-based-on-location-and-sublocation`
 * handler: consultingCompanyInventoryBasedOnLocationAndSubLocation — mysql/controllers/item.js:2087
 * ruta: mysql/routes/item.js:202
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 400, 500
 */
export interface PostDbItemInventoryBasedOnLocationAndSublocationBody {
  company_id?: number;
  location?: Record<string, unknown>;
  location_id?: number;
  [key: string]: unknown;
}
export interface PostDbItemInventoryBasedOnLocationAndSublocationQuery {
  sub_location: Record<string, unknown>;
}

/**
 * `POST /api/db_item/inventory-based-on-submitted-parameters`
 * handler: consultingCompanyInventoryBasedOnSubmittedParameters — mysql/controllers/item.js:2451
 * ruta: mysql/routes/item.js:212
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface PostDbItemInventoryBasedOnSubmittedParametersBody {
  query?: string;
  values?: string;
}

/**
 * `POST /api/db_item/inventory-export`
 * handler: postInventoryExport — mysql/controllers/inventoryExport.js:36
 * ruta: mysql/routes/item.js:90
 * auth: validateJWT, checkTokenVersion
 * headers: Idempotency-Key, idempotency-key
 * status: 202, 400, 401, 500
 */
export interface PostDbItemInventoryExportBody {
  company_id?: number;
  filters?: Record<string, unknown>;
  search?: string;
  sortBy?: string;
  sortDir?: string;
}

/**
 * `POST /api/db_item/inventory-facets`
 * handler: getInventoryFacets — mysql/controllers/inventoryPage.js:132
 * ruta: mysql/routes/item.js:83
 * auth: validateJWT, checkTokenVersion
 * status: 200
 */
export interface PostDbItemInventoryFacetsBody {
  company_id?: number;
  facets?: string;
  filters?: Record<string, unknown>;
  search?: string;
}

/**
 * `POST /api/db_item/inventory-page`
 * handler: getInventoryPage — mysql/controllers/inventoryPage.js:96
 * ruta: mysql/routes/item.js:82
 * auth: validateJWT, checkTokenVersion
 * status: 200
 */
export interface PostDbItemInventoryPageBody {
  company_id?: number;
  cursor?: string;
  filters?: Record<string, unknown>;
  pageSize?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
}

/**
 * `POST /api/db_item/inventory-pagination`
 * handler: consultingCompanyInventoryWithPagination — mysql/controllers/item.js:1978
 * ruta: mysql/routes/item.js:199
 * auth: validateJWT, checkTokenVersion
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 500
 */
export interface PostDbItemInventoryPaginationQuery {
  direction?: string;
  lastItemId: string;
}

/**
 * `POST /api/db_item/inventory-query`
 * handler: runNamedInventoryQuery — mysql/controllers/item.js:2411
 * ruta: mysql/routes/item.js:222
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostDbItemInventoryQueryBody {
  params?: string;
  queryName: string;
}

/**
 * `POST /api/db_item/item-out-warehouse`
 * handler: updateItemInWarehouseAfterBeingAddedToEvent — mysql/controllers/item.js:937
 * ruta: mysql/routes/item.js:130
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * status: 201, 400, 403, 404, 500
 */
export interface PostDbItemItemOutWarehouseBody {
  category_name: string;
  company_id: number;
  data: Record<string, unknown>;
  item_group: string;
  logistic_status?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_item/items_information`
 * handler: consultingItemTable — mysql/controllers/item.js:669
 * ruta: mysql/routes/item.js:102
 * auth: validateJWT, checkTokenVersion
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */

/**
 * `GET /api/db_item/location-count`
 * handler: gettingDataFromLocationOption — mysql/controllers/item.js:1520
 * ruta: mysql/routes/item.js:178
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201
 */
export interface GetDbItemLocationCountBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_item/new_item`
 * handler: insertingItem — mysql/controllers/item.js:163
 * ruta: mysql/routes/item.js:114
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "create")
 * status: 201, 403
 */
export interface PostDbItemNewItemBody {
  brand?: string;
  category_name?: string;
  company?: Record<string, unknown>;
  company_id?: number;
  container?: Record<string, unknown>;
  containerSpotLimit?: string;
  container_id?: number;
  cost?: number;
  current_location?: string;
  descript_item?: string;
  display_item?: boolean;
  extra_serial_number?: number;
  image_url?: string;
  item_group?: string;
  location?: Record<string, unknown>;
  location_name?: string;
  main_warehouse?: string;
  ownership?: string;
  return_date?: string;
  returnedRentedInfo?: string;
  serial_number?: number;
  sub_category_name?: string;
  sub_item_group?: string;
  sub_location?: Record<string, unknown>;
  sub_location_name?: string;
  sub_location_parent_id?: number;
  supplier_info?: Record<string, unknown>;
  warehouse?: string;
}

/**
 * `POST /api/db_item/retrieve-item-data`
 * handler: retrieveItemData — mysql/controllers/item.js:2498
 * ruta: mysql/routes/item.js:242
 * auth: validateJWT
 * status: 200, 400, 403, 500
 */
export interface PostDbItemRetrieveItemDataBody {
  company_id: number;
}

/**
 * `POST /api/db_item/retrieve-item-location-quantity`
 * handler: retrieveItemLocationQuantityForEvent — mysql/controllers/item.js:1751
 * ruta: mysql/routes/item.js:190
 * auth: sin middleware de auth en la ruta
 * headers: accept-encoding
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 400, 500
 */
export interface PostDbItemRetrieveItemLocationQuantityBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_item/return-event-devices`
 * handler: returnEventDevicesToWarehouse — mysql/controllers/item.js:2246
 * ruta: mysql/routes/item.js:232
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 404, 500
 */
export interface PostDbItemReturnEventDevicesBody {
  category_name: string;
  event_id: number;
  item_group: string;
  serial_numbers?: unknown[];
}

/**
 * `POST /api/db_item/returning-item-refactored`
 * handler: returningItemToStockWhenEventIsFinishedRefactored — mysql/controllers/item.js:1099
 * ruta: mysql/routes/item.js:181
 * auth: sin middleware de auth en la ruta
 * status: 200, 201, 400, 500
 */
export interface PostDbItemReturningItemRefactoredBody {
  allInventoryOfEvent: string;
  companyId?: string;
  groupingDevicesFromNoSQL: string;
  update_at?: string;
}

/**
 * `GET /api/db_item/search-inventory`
 * handler: searchingGetInventoryTracking — mysql/controllers/item.js:1408
 * ruta: mysql/routes/item.js:166
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetDbItemSearchInventoryBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_item/search-inventory`
 * handler: searchingInventoryTracking — mysql/controllers/item.js:1361
 * ruta: mysql/routes/item.js:163
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbItemSearchInventoryBody {
  company_id?: number;
  searchValue?: string;
}

/**
 * `GET /api/db_item/serial-suggest`
 * handler: suggestSerials — mysql/controllers/inventoryPage.js:176
 * ruta: mysql/routes/item.js:84
 * auth: validateJWT, checkTokenVersion
 * status: 200
 */
export interface GetDbItemSerialSuggestQuery {
  company_id: number;
  limit: number;
  q: string;
}

/**
 * `POST /api/db_item/tracking_item/:id`
 * handler: consultingInventoryTracking — mysql/controllers/item.js:1259
 * ruta: mysql/routes/item.js:111
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PostDbItemTrackingItemByIdParams {
  id: number;
}

/**
 * `POST /api/db_item/warehouse-items`
 * handler: consultingItemInWarehouseTable — mysql/controllers/item.js:720
 * ruta: mysql/routes/item.js:73
 * auth: validateJWT
 * NOTA: rest-spread `...filters`: acepta campos extra
 * status: 201, 403, 500
 */
export interface PostDbItemWarehouseItemsBody {
  preference?: string;
  role?: string;
}

/**
 * `POST /api/db_lease/consulting-consumer-lease`
 * handler: consultingConsumerLease — mysql/controllers/lease.js:197
 * ruta: mysql/routes/lease.js:25
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 500
 */
export interface PostDbLeaseConsultingConsumerLeaseBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_lease/consulting-lease`
 * handler: consultingLease — mysql/controllers/lease.js:179
 * ruta: mysql/routes/lease.js:22
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 500
 */
export interface PostDbLeaseConsultingLeaseBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_lease/delete-consumer-lease-info`
 * handler: deleteConsumerLeaseInfo — mysql/controllers/lease.js:396
 * ruta: mysql/routes/lease.js:43
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbLeaseDeleteConsumerLeaseInfoBody {
  company_id?: number;
  consumer_member_id?: number;
  device_id?: number;
}

/**
 * `POST /api/db_lease/delete-lease-info`
 * handler: deleteLeaseInfo — mysql/controllers/lease.js:376
 * ruta: mysql/routes/lease.js:40
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbLeaseDeleteLeaseInfoBody {
  company_id?: number;
  device_id?: number;
  staff_member_id?: number;
}

/**
 * `POST /api/db_lease/new-consumer-lease`
 * handler: insertingNewLeaseConsumer — mysql/controllers/lease.js:95
 * ruta: mysql/routes/lease.js:31
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 500
 */
export interface PostDbLeaseNewConsumerLeaseBody {
  subscription_expected_return_data?: Record<string, unknown>;
  subscription_initial_date?: string;
}

/**
 * `POST /api/db_lease/new-lease`
 * handler: insertingNewLease — mysql/controllers/lease.js:6
 * ruta: mysql/routes/lease.js:28
 * auth: sin middleware de auth en la ruta
 * status: 201, 400
 */
export interface PostDbLeaseNewLeaseBody {
  company_id?: number;
  device_id?: number;
  location?: Record<string, unknown>;
  staff_admin_id?: number;
  staff_member_id?: number;
  subscription_expected_return_data?: Record<string, unknown>;
  verification_id?: number;
}

/**
 * `POST /api/db_lease/status`
 * handler: retrieveLeaseStatus — mysql/controllers/lease.js:444
 * ruta: mysql/routes/lease.js:19
 * auth: canReadInventory
 * status: 200, 400, 500
 */
export interface PostDbLeaseStatusBody {
  company_id: number;
  lessee_type?: string;
  only_overdue?: boolean;
}

/**
 * `POST /api/db_lease/update-consumer-lease-info`
 * handler: updateConsumerLeaseInfo — mysql/controllers/lease.js:296
 * ruta: mysql/routes/lease.js:37
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 500
 */

/**
 * `POST /api/db_lease/update-lease-info`
 * handler: updateLeaseInfo — mysql/controllers/lease.js:215
 * ruta: mysql/routes/lease.js:34
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 500
 */

/**
 * `GET /api/db_location/companies/:company_id/location-paths-tree`
 * handler: getLocationPathsTree — mysql/controllers/sub_location_paths.js:58
 * ruta: mysql/routes/location.js:141
 * auth: validateJWT, checkTokenVersion, authorizePermission("location", "read")
 * status: 200, 400, 500
 */
export interface GetDbLocationCompaniesByCompanyIdLocationPathsTreeParams {
  company_id: number;
  id: number;
}

/**
 * `GET /api/db_location/companies/:company_id/locations/tree`
 * handler: getCompanyLocationTree — mysql/controllers/location.js:357
 * ruta: mysql/routes/location.js:87
 * auth: validateJWT, checkTokenVersion, authorizePermission("location", "read")
 * status: 200, 400, 500
 */
export interface GetDbLocationCompaniesByCompanyIdLocationsTreeParams {
  company_id: number;
  id: number;
}

/**
 * `GET /api/db_location/companies/:id/locations`
 * handler: getCompanyLocations — mysql/controllers/location.js:175
 * ruta: mysql/routes/location.js:79
 * auth: validateJWT
 * status: 200, 400, 403, 500
 */
export interface GetDbLocationCompaniesByIdLocationsParams {
  id: number;
}

/**
 * `POST /api/db_location/companies/:id/locations`
 * handler: getCompanyLocations — mysql/controllers/location.js:175
 * ruta: mysql/routes/location.js:81
 * auth: validateJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 403, 500
 */
export interface PostDbLocationCompaniesByIdLocationsParams {
  id: number;
}

/**
 * `PUT /api/db_location/locations/:id/inventory`
 * handler: bulkAssignInventory — mysql/controllers/location.js:101
 * ruta: mysql/routes/location.js:66
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update"), check("company_id", "Company ID is required").not().isEmpty(), validateFields
 * status: 200, 400, 404, 500
 */
export interface PutDbLocationLocationsByIdInventoryBody {
  company_id?: number;
  item_ids: number;
}
export interface PutDbLocationLocationsByIdInventoryParams {
  id: number;
}

/**
 * `POST /api/db_location/locations/:id`
 * handler: deleteLocation — mysql/controllers/location.js:563
 * ruta: mysql/routes/location.js:52
 * auth: validateJWT, checkTokenVersion, resolveLocationCompanyId, authorizePermission("location", "delete")
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 409, 500
 */
export interface PostDbLocationLocationsByIdParams {
  id: number;
}

/**
 * `POST /api/db_location/locations`
 * handler: createLocation — mysql/controllers/location.js:66
 * ruta: mysql/routes/location.js:29
 * auth: validateJWT, checkTokenVersion, authorizePermission("location", "create"), check("location_name", "Location name is required").not().isEmpty(), validateFields
 * status: 201, 400, 500
 */
export interface PostDbLocationLocationsBody {
  address_details?: Record<string, unknown>;
  company_id: number;
  location_name: string;
  manager_id?: number;
  status?: string;
}

/**
 * `POST /api/db_location/sub-location-path/delete`
 * handler: deleteSubLocationPath — mysql/controllers/sub_location_paths.js:216
 * ruta: mysql/routes/location.js:127
 * auth: validateJWT, checkTokenVersion, authorizePermission("location", "delete"), check("location_id", "location_id is required").not().isEmpty(), check("sub_location_path", "sub_location_path must be a non-empty array").isArray({ min: 1 }), validateFields
 * status: 200, 400, 404, 409, 500
 */
export interface PostDbLocationSubLocationPathDeleteBody {
  company_id: number;
  location_id: number;
  sub_location_path: string;
}

/**
 * `POST /api/db_location/sub-location-path`
 * handler: createSubLocationPath — mysql/controllers/sub_location_paths.js:4
 * ruta: mysql/routes/location.js:105
 * auth: validateJWT, checkTokenVersion, authorizePermission("location", "create"), check("location_id", "location_id is required").not().isEmpty(), check("sub_location_path", "sub_location_path must be a non-empty array").isArray({ min: 1 }), validateFields
 * status: 201, 400, 404, 409, 500
 */
export interface PostDbLocationSubLocationPathBody {
  company_id: number;
  created_by?: string;
  location_id: number;
  sub_location_path: string;
}

/**
 * `POST /api/db_member/bulk-members`
 * handler: insertBulkMembers — mysql/controllers/members.js:204
 * ruta: mysql/routes/members.js:47
 * auth: canCreate
 * status: 201, 202, 400, 500
 */
export interface PostDbMemberBulkMembersBody {
  data?: Record<string, unknown>;
  image_url?: string;
  list?: unknown[];
  members?: unknown[];
  rows?: unknown[];
}

/**
 * `POST /api/db_member/bulk-return`
 * handler: bulkReturnMemberLeases — mysql/controllers/members.js:1943
 * ruta: mysql/routes/members.js:96
 * auth: canUpdate
 * status: 200, 202, 400, 500
 */
export interface PostDbMemberBulkReturnBody {
  company_id: number;
  condition_note?: string;
  grade?: string;
  logistic_status?: string;
  member_ids?: number;
  return_status?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_member/consulting-member`
 * handler: retrieveMemberInfo — mysql/controllers/members.js:736
 * ruta: mysql/routes/members.js:41
 * auth: canRead
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 500
 */

/**
 * `POST /api/db_member/delete-member-assigned-device-lease`
 * handler: deleteMemberAssignedDeviceLeaseRows — mysql/controllers/members.js:1726
 * ruta: mysql/routes/members.js:76
 * auth: canDelete
 * status: 200, 400, 500
 */
export interface PostDbMemberDeleteMemberAssignedDeviceLeaseBody {
  where?: string;
}

/**
 * `POST /api/db_member/delete-member-info`
 * handler: deleteMember — mysql/controllers/members.js:694
 * ruta: mysql/routes/members.js:53
 * auth: canDelete
 * status: 200, 400, 500
 */
export interface PostDbMemberDeleteMemberInfoBody {
  ids?: unknown[];
  member_id?: number;
  member_ids?: number;
}

/**
 * `POST /api/db_member/member-fees`
 * handler: retrieveMemberFees — mysql/controllers/members.js:1654
 * ruta: mysql/routes/members.js:70
 * auth: canRead
 * status: 200, 400, 500, 503
 */
export interface PostDbMemberMemberFeesBody {
  companyId?: string;
  company_id: number;
  member_id?: number;
  status?: string;
}

/**
 * `POST /api/db_member/my-devices`
 * handler: retrieveMyDevices — mysql/controllers/members.js:2023
 * ruta: mysql/routes/members.js:100
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface PostDbMemberMyDevicesBody {
  email: string;
  external_id: number;
}

/**
 * `POST /api/db_member/new-member-assigned-device-lease`
 * handler: insertNewRowINMemberAssignedDeviceTableForLeaseTracking — mysql/controllers/members.js:786
 * ruta: mysql/routes/members.js:56
 * auth: canCreate
 * status: 201, 400, 422, 500
 */
export interface PostDbMemberNewMemberAssignedDeviceLeaseBody {
  data?: Record<string, unknown>;
  items?: unknown[];
  list?: unknown[];
  rows?: unknown[];
}

/**
 * `POST /api/db_member/new-member`
 * handler: insertNewMember — mysql/controllers/members.js:30
 * ruta: mysql/routes/members.js:44
 * auth: canCreate
 * status: 201, 400, 500
 */
export interface PostDbMemberNewMemberBody {
  address?: Record<string, unknown>;
  address_city?: string;
  address_state?: string;
  address_street?: string;
  address_zip?: string;
  company_id?: number;
  dateOfBirth?: string;
  date_of_birth?: string;
  dob?: string;
  email?: string;
  external_id?: number;
  first_name?: string;
  grade?: string;
  homeroom?: string;
  image_url?: string;
  last_name?: string;
  minor?: string;
  name?: string;
  parent_guardian_email?: string;
  parent_guardian_first_name?: string;
  parent_guardian_last_name?: string;
  parent_guardian_phone_number?: number;
  phone?: string;
  phoneNumber?: string;
  phone_number?: number;
}

/**
 * `POST /api/db_member/overdue-leases`
 * handler: retrieveOverdueLeases — mysql/controllers/members.js:1883
 * ruta: mysql/routes/members.js:93
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostDbMemberOverdueLeasesBody {
  company_id: number;
  grade?: string;
}

/**
 * `POST /api/db_member/remove-row-lease-member`
 * handler: removeRowAssignedDeviceLeaseMember — mysql/controllers/members.js:1824
 * ruta: mysql/routes/members.js:90
 * auth: canDelete
 * status: 200, 400, 500
 */
export interface PostDbMemberRemoveRowLeaseMemberBody {
  companyId?: string;
  company_id?: number;
  deviceId?: string;
  device_id?: number;
  memberId?: string;
  member_id?: number;
}

/**
 * `POST /api/db_member/retrieve-members-assigned-devices`
 * handler: retrieveMembersAssignedDevices — mysql/controllers/members.js:491
 * ruta: mysql/routes/members.js:83
 * auth: canRead
 * status: 200, 500
 */
export interface PostDbMemberRetrieveMembersAssignedDevicesBody {
  where?: string;
}

/**
 * `POST /api/db_member/settle-member-fee`
 * handler: settleMemberFee — mysql/controllers/members.js:1477
 * ruta: mysql/routes/members.js:73
 * auth: canUpdate
 * status: 200, 400, 404, 500, 503
 */
export interface PostDbMemberSettleMemberFeeBody {
  companyId?: string;
  company_id: number;
  device_id?: number;
  fee_amount?: number;
  fee_id: number;
  fee_reason?: string;
  member_id?: number;
  paid_amount?: boolean;
  paid_at?: boolean;
  payment_intent: string;
  payment_method?: string;
  return_status?: string;
  status?: string;
}

/**
 * `POST /api/db_member/update-member-assigned-device-lease`
 * handler: updateMemberAssignedDeviceLeaseRow — mysql/controllers/members.js:1254
 * ruta: mysql/routes/members.js:63
 * auth: canUpdate
 * status: 200, 400, 500
 */
export interface PostDbMemberUpdateMemberAssignedDeviceLeaseBody {
  update?: string;
  where?: string;
}

/**
 * `PATCH /api/db_member/update-member-info`
 * handler: updateMemberInfo — mysql/controllers/members.js:611
 * ruta: mysql/routes/members.js:50
 * auth: canUpdate
 * status: 200, 400, 500
 */
export interface PatchDbMemberUpdateMemberInfoBody {
  dateOfBirth?: string;
  date_of_birth?: string;
  dob?: string;
  id?: number;
  memberId?: string;
  member_id: number;
  phone?: string;
  phoneNumber?: string;
}

/**
 * `POST /api/db_record/checking-lease-information`
 * handler: consultingLeaseInformationConsumer — mysql/controllers/items_events.js:507
 * ruta: mysql/routes/recordEvent.js:24
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: se itera el body (`Object.entries`) para armar el SQL
 * status: 200, 400, 500
 */
export interface PostDbRecordCheckingLeaseInformationBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_record/checking`
 * handler: consultingRowInItemInvAssignedEventTable — mysql/controllers/items_events.js:438
 * ruta: mysql/routes/recordEvent.js:19
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbRecordCheckingBody {
  company_assigned_event_id?: number;
  item_id?: number;
}

/**
 * `POST /api/db_record/inserting-record-refactored`
 * handler: insertingRecordInEventRefactored — mysql/controllers/recordEvent.js:59
 * ruta: mysql/routes/recordEvent.js:16
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbRecordInsertingRecordRefactoredBody {
  dataToStoreAsRecord?: string;
  event?: Record<string, unknown>;
  groupingInventoryByGroupName?: string;
}

/**
 * `POST /api/db_record/inserting-record`
 * handler: insertingRecordInEvent — mysql/controllers/recordEvent.js:6
 * ruta: mysql/routes/recordEvent.js:13
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbRecordInsertingRecordBody {
  activity?: string;
  category_name?: string;
  email?: string;
  event?: Record<string, unknown>;
  item_group?: string;
  payment_id?: number;
  serial_number?: number;
  status?: string;
}

/**
 * `POST /api/db_record/removing-row-item-event-record`
 * handler: deletingRecordInItemInvAssignedEventRow — mysql/controllers/items_events.js:457
 * ruta: mysql/routes/recordEvent.js:22
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbRecordRemovingRowItemEventRecordBody {
  event_id?: number;
  item_id?: number;
}

/**
 * `DELETE /api/db_shipment/:shipment_id`
 * handler: deleteShipment — mysql/controllers/shipment.js:90
 * ruta: mysql/routes/shipment.js:8
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 404, 500
 */
export interface DeleteDbShipmentByShipmentIdParams {
  shipment_id: number;
}

/**
 * `PUT /api/db_shipment/:shipment_id`
 * handler: updateShipment — mysql/controllers/shipment.js:52
 * ruta: mysql/routes/shipment.js:7
 * auth: sin middleware de auth en la ruta
 * NOTA: rest-spread `...updates`: acepta campos extra
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 500
 */
export interface PutDbShipmentByShipmentIdParams {
  shipment_id: number;
}

/**
 * `POST /api/db_shipment/package-list`
 * handler: retrievePackageList — mysql/controllers/shipment.js:151
 * ruta: mysql/routes/shipment.js:10
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbShipmentPackageListBody {
  package_list: unknown[];
}

/**
 * `POST /api/db_shipment/search`
 * handler: getShipments — mysql/controllers/shipment.js:111
 * ruta: mysql/routes/shipment.js:9
 * auth: sin middleware de auth en la ruta
 * NOTA: rest-spread `...filters`: acepta campos extra
 * status: 200, 400, 500
 */
export interface PostDbShipmentSearchBody {
  company_id: number;
}

/**
 * `POST /api/db_shipment`
 * handler: createShipment — mysql/controllers/shipment.js:5
 * ruta: mysql/routes/shipment.js:6
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 500
 */
export interface PostDbShipmentBody {
  authorizer_name: string;
  company_id: number;
  courier: string;
  destination: string;
  event_id: number;
  package_list: unknown[];
  recipient_name: string;
  tracking_number: number;
}

/**
 * `POST /api/db_staff/company-staff/permissions`
 * handler: getStaffPermissions — mysql/controllers/staff.js:215
 * ruta: mysql/routes/staff.js:31
 * auth: validateJWT, checkTokenVersion
 * status: 200, 404, 500
 */
export interface PostDbStaffCompanyStaffPermissionsBody {
  company_id?: number;
  staff_id?: number;
}

/**
 * `PATCH /api/db_staff/company-staff/role`
 * handler: updateCompanyStaffRole — mysql/controllers/staff.js:184
 * ruta: mysql/routes/staff.js:30
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 404, 500
 */
export interface PatchDbStaffCompanyStaffRoleBody {
  company_id?: number;
  role_type?: string;
  staff_id?: number;
}

/**
 * `PUT /api/db_staff/company-staff/scope`
 * handler: setCompanyStaffScope — mysql/controllers/staff.js:420
 * ruta: mysql/routes/staff.js:35
 * auth: validateJWT, checkTokenVersion, authorizePermission("staff", "update")
 * status: 200, 400, 404, 500
 */
export interface PutDbStaffCompanyStaffScopeBody {
  categories: string;
  company_id: number;
  locations: unknown[];
  staff_id: number;
}

/**
 * `PATCH /api/db_staff/company-staff`
 * handler: updateCompanyStaff — mysql/controllers/staff.js:278
 * ruta: mysql/routes/staff.js:29
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 404, 500
 */
export interface PatchDbStaffCompanyStaffBody {
  company_id: number;
  is_active?: boolean;
  role_type?: string;
  staff_id: number;
}

/**
 * `POST /api/db_staff/company-staff`
 * handler: addCompanyStaff — mysql/controllers/staff.js:157
 * ruta: mysql/routes/staff.js:28
 * auth: validateJWT, checkTokenVersion
 * status: 201, 400, 500
 */
export interface PostDbStaffCompanyStaffBody {
  assigned_by?: string;
  company_id?: number;
  company_name?: string;
  role_type?: string;
  staff_id?: number;
}

/**
 * `POST /api/db_staff/consulting-member`
 * handler: consultingStaffMemberInformation — mysql/controllers/staff.js:90
 * ruta: mysql/routes/staff.js:24
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 400, 500
 */
export interface PostDbStaffConsultingMemberBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_staff/new_member`
 * handler: insertingStaffMember — mysql/controllers/staff.js:31
 * ruta: mysql/routes/staff.js:25
 * auth: sin middleware de auth en la ruta
 * status: 200, 201, 500
 */
export interface PostDbStaffNewMemberBody {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: number;
}

/**
 * `POST /api/db_stripe/consulting-stripe`
 * handler: consultingStripeCustomer — mysql/controllers/stripe.js:29
 * ruta: mysql/routes/stripe.js:12
 * auth: sin middleware de auth en la ruta
 * NOTA: cuerpo DINÁMICO: los pares del body se convierten en columnas/filtros SQL (`Object.keys(req.body)`)
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 400, 500
 */
export interface PostDbStripeConsultingStripeBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/db_stripe/new_stripe`
 * handler: insertingStripeCustomer — mysql/controllers/stripe.js:6
 * ruta: mysql/routes/stripe.js:30
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbStripeNewStripeBody {
  company_id?: number;
  stripe_id?: number;
}

/**
 * `GET /api/db_sub_location/locations/:location_id/sub-locations`
 * handler: getSubLocationsHierarchy — mysql/controllers/sub_location.js:204
 * ruta: mysql/routes/sub_location.js:27
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetDbSubLocationLocationsByLocationIdSubLocationsParams {
  location_id: number;
}

/**
 * `DELETE /api/db_sub_location/sub-locations/:id`
 * handler: deleteSubLocation — mysql/controllers/sub_location.js:320
 * ruta: mysql/routes/sub_location.js:46
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 409, 500
 */
export interface DeleteDbSubLocationSubLocationsByIdParams {
  id: number;
}

/**
 * `PUT /api/db_sub_location/sub-locations/:id`
 * handler: updateSubLocation — mysql/controllers/sub_location.js:262
 * ruta: mysql/routes/sub_location.js:33
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * status: 200, 400, 404, 500
 */
export interface PutDbSubLocationSubLocationsByIdBody {
  active?: boolean;
  name?: string;
  parent_id?: number;
}
export interface PutDbSubLocationSubLocationsByIdParams {
  id: number;
}

/**
 * `POST /api/db_sub_location/sub-locations/check`
 * handler: checkSubLocation — mysql/controllers/sub_location.js:370
 * ruta: mysql/routes/sub_location.js:41
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbSubLocationSubLocationsCheckBody {
  location_id?: number;
  name?: string;
  parent_id?: number;
}

/**
 * `POST /api/db_sub_location/sub-locations`
 * handler: createSubLocation — mysql/controllers/sub_location.js:160
 * ruta: mysql/routes/sub_location.js:17
 * auth: check("name", "Name is required").not().isEmpty(), validateFields
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 400, 500
 */
export interface PostDbSubLocationSubLocationsBody {
  company_id: number;
  location_id: number;
  name: string;
  parent_id?: number;
}

/**
 * `PATCH /api/devitrak/:id`
 * handler: updateAcceptanceByAddingStaffMemberID — controller/devitrakApp.js:32
 * ruta: routes/devitrakApp.js:14
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PatchDevitrakByIdBody {
  email?: string;
  staff_id?: string;
}
export interface PatchDevitrakByIdParams {
  id: string;
}

/**
 * `POST /api/devitrak/new_acceptance`
 * handler: acceptancePoliciesAndTermsApp — controller/devitrakApp.js:4
 * ruta: routes/devitrakApp.js:11
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new DevitrakApp()`: los campos son los del esquema `models/DevitrakApp.js`
 * status: 201, 500
 */
export interface PostDevitrakNewAcceptanceBody {
  date?: string;
  documentsAndPolicies?: unknown[];
  email?: string;
  signature?: string;
  staff_id?: string;
}

/**
 * `DELETE /api/document/:id`
 * handler: deleteDocument — controller/document.js:414
 * ruta: routes/document.js:145
 * auth: canManage
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 500
 */
export interface DeleteDocumentByIdParams {
  id: string;
}

/**
 * `GET /api/document/:id`
 * handler: getCompanyDocumentByID — controller/document.js:155
 * ruta: routes/document.js:127
 * auth: publicViewer
 * status: 500
 */
export interface GetDocumentByIdParams {
  id: string;
}

/**
 * `PATCH /api/document/:id`
 * handler: updateDocument — controller/document.js:364
 * ruta: routes/document.js:143
 * auth: canManage
 * NOTA: rest-spread `...body`: acepta campos extra
 * status: 400
 */
export interface PatchDocumentByIdBody {
  company_id?: string;
}

/**
 * `PUT /api/document/:id`
 * handler: updateDocument — controller/document.js:364
 * ruta: routes/document.js:144
 * auth: canManage
 * NOTA: rest-spread `...body`: acepta campos extra
 * status: 400
 */
export interface PutDocumentByIdBody {
  company_id?: string;
}

/**
 * `GET /api/document/download/:documentId/:userId`
 * handler: getDocumentDownloadUrl — controller/document.js:208
 * ruta: routes/document.js:128
 * auth: publicViewer
 * status: 404, 429, 500
 */
export interface GetDocumentDownloadByDocumentIdByUserIdParams {
  documentId: string;
  userId: string;
}

/**
 * `POST /api/document/download/documentUrl`
 * handler: generateTemporaryDownloadUrl — controller/document.js:444
 * ruta: routes/document.js:129
 * auth: publicViewer
 * status: 500
 */
export interface PostDocumentDownloadDocumentUrlBody {
  documentUrl?: string;
}

/**
 * `DELETE /api/document/folder/:id`
 * handler: deleteFolder — controller/document.js:904
 * ruta: routes/document.js:167
 * auth: canManage
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `PUT /api/document/folder/:id`
 * handler: updateFolder — controller/document.js:872
 * ruta: routes/document.js:166
 * auth: canManage
 * status: 200, 400, 500
 */
export interface PutDocumentFolderByIdBody {
  documents: string;
  folder_description: string;
  folder_name: string;
  trigger_action: string;
}

/**
 * `POST /api/document/folders`
 * handler: getFolders — controller/document.js:812
 * ruta: routes/document.js:164
 * auth: canManage
 * status: 404, 500
 */
export interface PostDocumentFoldersBody {
  company_id?: string;
}

/**
 * `POST /api/document/new_folder`
 * handler: createNewFolder — controller/document.js:769
 * ruta: routes/document.js:163
 * auth: canManage
 * status: 201, 400, 500
 */
export interface PostDocumentNewFolderBody {
  company_id: string;
  documents: string;
  folder_description: string;
  folder_name: string;
  trigger_action: string;
}

/**
 * `GET /api/document/triggers`
 * handler: getTriggerActions — controller/document.js:188
 * ruta: routes/document.js:122
 * auth: canManage
 * status: 500
 */
export interface GetDocumentTriggersQuery {
  company_id: string;
}

/**
 * `GET /api/document/types`
 * handler: getDocumentTypes — controller/document.js:172
 * ruta: routes/document.js:121
 * auth: canManage
 * status: 500
 */
export interface GetDocumentTypesQuery {
  company_id: string;
}

/**
 * `POST /api/document/upload/xlsx`
 * handler: uploadExcelToS3 — controller/document.js:1767
 * ruta: routes/document.js:119
 * auth: canManage, uploadXLSX.single("document")
 * status: 200, 400, 500
 */
export interface PostDocumentUploadXlsxBody {
  company?: Record<string, unknown>;
  company_id: string;
  contact_staff_id?: string;
}

/**
 * `POST /api/document/upload`
 * handler: uploadDocument — controller/document.js:73
 * ruta: routes/document.js:118
 * auth: canManage, upload.single("document")
 * headers: Idempotency-Key, idempotency-key
 * status: 202, 400, 404, 500
 */
export interface PostDocumentUploadBody {
  company_id?: string;
  created_by?: string;
}

/**
 * `POST /api/document/verification/consumer_member/check_signed_document`
 * handler: consumerMemberVerificationSignedDocumentForAssignmentDevices — controller/document.js:1188
 * ruta: routes/document.js:193
 * auth: publicViewer
 * status: 200, 201, 400, 500
 */
export interface PostDocumentVerificationConsumerMemberCheckSignedDocumentBody {
  company_id?: string;
  consumer_member_id?: string;
  contract_url?: string;
  date_reference?: string;
  verificationID?: string;
}

/**
 * `POST /api/document/verification/consumer_member/signed_document`
 * handler: createConsumerVerification — controller/document.js:963
 * ruta: routes/document.js:185
 * auth: publicViewer
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PostDocumentVerificationConsumerMemberSignedDocumentBody {
  assigner_staff_member_id?: string;
  company_id?: string;
  consumer_member_id?: string;
  contract_list?: unknown[];
  date?: string;
}

/**
 * `PATCH /api/document/verification/consumer_member/signing_document`
 * handler: addSignatureToConsumerDocument — controller/document.js:1566
 * ruta: routes/document.js:205
 * auth: publicViewer
 * status: 200, 404, 409, 500
 */
export interface PatchDocumentVerificationConsumerMemberSigningDocumentBody {
  contract_url?: string;
  verification_id?: string;
}

/**
 * `POST /api/document/verification/member/check_signed_document`
 * handler: memberVerificationSignedDocumentForAssignmentDevices — controller/document.js:1329
 * ruta: routes/document.js:220
 * auth: publicViewer
 * status: 200, 201, 400, 500
 */
export interface PostDocumentVerificationMemberCheckSignedDocumentBody {
  company_id?: string;
  contract_url?: string;
  date_reference?: string;
  member_id?: string;
  verificationID?: string;
}

/**
 * `POST /api/document/verification/member/signed_document`
 * handler: createMemberVerification — controller/document.js:1006
 * ruta: routes/document.js:218
 * auth: publicViewer
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PostDocumentVerificationMemberSignedDocumentBody {
  assigner_staff_member_id?: string;
  company_id?: string;
  contract_list?: unknown[];
  date?: string;
  member_id?: string;
}

/**
 * `PATCH /api/document/verification/member/signing_document`
 * handler: addSignatureToMemberDocument — controller/document.js:1673
 * ruta: routes/document.js:226
 * auth: publicViewer
 * status: 200, 404, 500
 */
export interface PatchDocumentVerificationMemberSigningDocumentBody {
  contract_url?: string;
  verification_id?: string;
}

/**
 * `POST /api/document/verification/staff_member/check_signed_document`
 * handler: staffMemberVerificationSignedDocumentForAssignmentDevices — controller/document.js:1050
 * ruta: routes/document.js:173
 * auth: publicViewer
 * status: 200, 201, 400, 500
 */
export interface PostDocumentVerificationStaffMemberCheckSignedDocumentBody {
  company_id?: string;
  contract_url?: string;
  date_reference?: string;
  staff_member_id?: string;
  verificationID?: string;
}

/**
 * `POST /api/document/verification/staff_member/signed_document`
 * handler: createStaffMemberVerification — controller/document.js:921
 * ruta: routes/document.js:168
 * auth: publicViewer
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PostDocumentVerificationStaffMemberSignedDocumentBody {
  assigner_staff_member_id?: string;
  company_id?: string;
  contract_list?: unknown[];
  date?: string;
  staff_member_id?: string;
}

/**
 * `PATCH /api/document/verification/staff_member/signing_document`
 * handler: addSignatureToDocument — controller/document.js:1470
 * ruta: routes/document.js:178
 * auth: publicViewer
 * status: 200, 404, 500
 */
export interface PatchDocumentVerificationStaffMemberSigningDocumentBody {
  contract_url?: string;
  verification_id?: string;
}

/**
 * `GET /api/document`
 * handler: getCompanyDocuments — controller/document.js:133
 * ruta: routes/document.js:120
 * auth: canManage
 * status: 500
 */
export interface GetDocumentQuery {
  company_id: string;
  document_type: string;
  status: string;
  trigger_action: string;
}

/**
 * `POST /api/error_log/error_log`
 * handler: createErrorFeed — controller/errorLog.js:39
 * ruta: routes/errorLog.js:11
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 500
 */
export interface PostErrorLogErrorLogBody {
  componentStack?: string;
  error?: string;
}

/**
 * `POST /api/event-log/feed-event-log`
 * handler: feedEventLog — controller/eventLog.js:9
 * ruta: routes/eventLog.js:15
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 202, 500
 */

/**
 * `GET /api/event/all-users-and-transactions-per-event`
 * handler: getListOfUsersAndTransactionsPerEvent — controller/auth.js:259
 * ruta: routes/event.js:50
 * auth: validateJWT
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 200, 500
 */
export interface GetEventAllUsersAndTransactionsPerEventBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/event/create-event`
 * handler: createEvent — controller/event.js:11
 * ruta: routes/event.js:26
 * auth: validateJWT
 * headers: user-agent
 * NOTA: el body se pasa completo a `new Event()`: los campos son los del esquema `models/Event.js`
 * status: 201, 500
 */
export interface PostEventCreateEventBody {
  active?: boolean;
  company?: string;
  company_id?: string;
  configuration?: string;
  contactInfo?: Record<string, unknown>;
  contract_for?: string;
  deviceSetup?: unknown[];
  eventInfoDetail?: Record<string, unknown>;
  extraServices?: unknown[];
  extraServicesNeeded?: boolean;
  legal_contract?: boolean;
  legal_documents_list?: unknown[];
  logistic_inventory_status?: string;
  qrCodeLink?: string;
  show?: boolean;
  staff?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  type?: string;
  user?: string;
}

/**
 * `DELETE /api/event/delete-event/:id`
 * handler: deleteEvent — controller/event.js:142
 * ruta: routes/event.js:63
 * auth: validateJWT
 * headers: user-agent
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 500
 */
export interface DeleteEventDeleteEventByIdParams {
  id: string;
}

/**
 * `PATCH /api/event/edit-event/:id`
 * handler: editSubscriptionEvent — controller/event.js:97
 * ruta: routes/event.js:32
 * auth: validateJWT
 * headers: user-agent
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchEventEditEventByIdParams {
  id: string;
}

/**
 * `PUT /api/event/edit-event/:id`
 * handler: editSubscriptionEvent — controller/event.js:97
 * ruta: routes/event.js:29
 * auth: validateJWT
 * headers: user-agent
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PutEventEditEventByIdParams {
  id: string;
}

/**
 * `PATCH /api/event/edit-staff-event/:id`
 * handler: editEvent — controller/event.js:42
 * ruta: routes/event.js:35
 * auth: validateJWT
 * headers: user-agent
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchEventEditStaffEventByIdParams {
  id: string;
}

/**
 * `GET /api/event/event-inventory-based-on-period`
 * handler: inventoryEventBasedOnPeriod — controller/event.js:438
 * ruta: routes/event.js:60
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetEventEventInventoryBasedOnPeriodQuery {
  company_id: string;
  company_sql_id: string;
  date2: string;
}

/**
 * `GET /api/event/event-list-per-company`
 * handler: gettingEventListPerCompany — controller/event.js:194
 * ruta: routes/event.js:44
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetEventEventListPerCompanyBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `GET /api/event/event-list`
 * handler: eventList — controller/event.js:178
 * ruta: routes/event.js:38
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Event.find()`: cualquier subconjunto de los campos de `models/Event.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetEventEventListBody {
  active?: boolean;
  company?: string;
  company_id?: string;
  configuration?: string;
  contactInfo?: Record<string, unknown>;
  contract_for?: string;
  deviceSetup?: unknown[];
  eventInfoDetail?: Record<string, unknown>;
  extraServices?: unknown[];
  extraServicesNeeded?: boolean;
  legal_contract?: boolean;
  legal_documents_list?: unknown[];
  logistic_inventory_status?: string;
  qrCodeLink?: string;
  show?: boolean;
  staff?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  type?: string;
  user?: string;
}

/**
 * `POST /api/event/event-list`
 * handler: eventList — controller/event.js:178
 * ruta: routes/event.js:41
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Event.find()`: cualquier subconjunto de los campos de `models/Event.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostEventEventListBody {
  active?: boolean;
  company?: string;
  company_id?: string;
  configuration?: string;
  contactInfo?: Record<string, unknown>;
  contract_for?: string;
  deviceSetup?: unknown[];
  eventInfoDetail?: Record<string, unknown>;
  extraServices?: unknown[];
  extraServicesNeeded?: boolean;
  legal_contract?: boolean;
  legal_documents_list?: unknown[];
  logistic_inventory_status?: string;
  qrCodeLink?: string;
  show?: boolean;
  staff?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  type?: string;
  user?: string;
}

/**
 * `GET /api/event/event-staff-detail/:id`
 * handler: eventStaffDetailInfo — controller/event.js:249
 * ruta: routes/event.js:57
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetEventEventStaffDetailByIdParams {
  id: string;
}

/**
 * `POST /api/event/staff-all-events`
 * handler: searchStaffAllEvents — controller/event.js:232
 * ruta: routes/event.js:46
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostEventStaffAllEventsBody {
  email?: string;
}

/**
 * `POST /api/event/update-event-inventory-freshest-data`
 * handler: updateEventInventoryFreshestData — controller/event.js:615
 * ruta: routes/event.js:70
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface PostEventUpdateEventInventoryFreshestDataBody {
  event_id: string;
  updatedBy?: string;
}

/**
 * `PATCH /api/event/update-events`
 * handler: updateLargeNumberOfEventsAtOnce — controller/event.js:484
 * ruta: routes/event.js:66
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PatchEventUpdateEventsBody {
  ids: unknown[];
  newValues: string;
}

/**
 * `POST /api/event/update-global-state`
 * handler: updateGlobalStateOfEvent — controller/event.js:549
 * ruta: routes/event.js:68
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface PostEventUpdateGlobalStateBody {
  event_id?: string;
}

/**
 * `POST /api/feedback/new-feedback`
 * handler: newFeedback — controller/feedback.js:3
 * ruta: routes/feedback.js:11
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostFeedbackNewFeedbackBody {
  age?: string;
  aiComment?: string;
  aiInterpretation?: string;
  audioQuality?: string;
  audioStreamingInterest?: string;
  easeGettingReceiver?: string;
  easeReturningReceiver?: string;
  email?: string;
  eventId?: string;
  eventName?: string;
  expectationsComment?: string;
  gender?: string;
  improvementSuggestion?: string;
  interpretationQuality?: string;
  metExpectations?: string;
  name?: string;
  receivedService?: string;
  videoStreamingInterest?: string;
  wifiToCellularUse?: string;
}

/**
 * `POST /api/heavy-task/process`
 * handler: handleHeavyTask — controller/heavyTask.js:7
 * ruta: routes/heavyTask.js:9
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 500
 */

/**
 * `POST /api/image/images`
 * handler: retrieveImage — controller/image.js:23
 * ruta: routes/image.js:14
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Image.find()`: cualquier subconjunto de los campos de `models/Image.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostImageImagesBody {
  category?: string;
  company?: string;
  item_group?: string;
  source?: string;
  time?: string;
}

/**
 * `POST /api/image/new_image`
 * handler: storingImage — controller/image.js:5
 * ruta: routes/image.js:11
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Image()`: los campos son los del esquema `models/Image.js`
 * status: 201, 500
 */
export interface PostImageNewImageBody {
  category?: string;
  company?: string;
  item_group?: string;
  source?: string;
  time?: string;
}

/**
 * `POST /api/inventory/create-inventory`
 * handler: createInventory — controller/inventory.js:6
 * ruta: routes/inventory.js:12
 * auth: validateJWT
 * headers: user-agent
 * NOTA: el body se pasa completo a `new Inventory()`: los campos son los del esquema `models/Inventory.js`
 * status: 201, 500
 */
export interface PostInventoryCreateInventoryBody {
  batch?: string;
  company?: string;
  event?: string;
  items?: Record<string, unknown>;
  saveDefaultFormat?: boolean;
}

/**
 * `DELETE /api/inventory/delete-inventory/:id`
 * handler: deleteInventory — controller/inventory.js:81
 * ruta: routes/inventory.js:18
 * auth: validateJWT
 * headers: user-agent
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 500
 */
export interface DeleteInventoryDeleteInventoryByIdParams {
  id: string;
}

/**
 * `PATCH /api/inventory/edit-inventory/:id`
 * handler: editInventory — controller/inventory.js:35
 * ruta: routes/inventory.js:15
 * auth: validateJWT
 * headers: user-agent
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchInventoryEditInventoryByIdParams {
  id: string;
}

/**
 * `POST /api/item/create-item`
 * handler: createItem — controller/item.js:5
 * ruta: routes/item.js:13
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Item()`: los campos son los del esquema `models/Item.js`
 * status: 201, 500
 */
export interface PostItemCreateItemBody {
  category?: string;
  company?: string;
  consumerUses?: boolean;
  createdBy?: string;
  dateCreated?: string;
  description?: string;
  group?: string;
  key?: string;
  ownership?: string;
  quantity?: string;
  resume?: string;
  value?: string;
}

/**
 * `DELETE /api/item/delete-item/:id`
 * handler: deleteItem — controller/item.js:56
 * ruta: routes/item.js:19
 * auth: validateJWT, checkTokenVersion
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 500
 */
export interface DeleteItemDeleteItemByIdParams {
  id: string;
}

/**
 * `PATCH /api/item/edit-item/:id`
 * handler: editItem — controller/item.js:22
 * ruta: routes/item.js:16
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchItemEditItemByIdParams {
  id: string;
}

/**
 * `GET /api/item/list-items`
 * handler: listOfItems — controller/item.js:80
 * ruta: routes/item.js:22
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Item.find()`: cualquier subconjunto de los campos de `models/Item.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetItemListItemsBody {
  category?: string;
  company?: string;
  consumerUses?: boolean;
  createdBy?: string;
  dateCreated?: string;
  description?: string;
  group?: string;
  key?: string;
  ownership?: string;
  quantity?: string;
  resume?: string;
  value?: string;
}

/**
 * `POST /api/item/list-items`
 * handler: listOfItems — controller/item.js:80
 * ruta: routes/item.js:25
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Item.find()`: cualquier subconjunto de los campos de `models/Item.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostItemListItemsBody {
  category?: string;
  company?: string;
  consumerUses?: boolean;
  createdBy?: string;
  dateCreated?: string;
  description?: string;
  group?: string;
  key?: string;
  ownership?: string;
  quantity?: string;
  resume?: string;
  value?: string;
}

/**
 * `GET /api/jobs/:jobId`
 * handler: getJobStatus — controller/jobs.js:53
 * ruta: routes/jobs.js:26
 * auth: validateJWT, requirePlatformRead
 * status: 200, 400, 404, 500
 */
export interface GetJobsByJobIdParams {
  jobId: string;
}

/**
 * `GET /api/jobs/owned/:jobId`
 * handler: getOwnedJobStatus — controller/jobs.js:120
 * ruta: routes/jobs.js:25
 * auth: validateJWT
 * status: 200, 400, 401, 404, 500
 */
export interface GetJobsOwnedByJobIdParams {
  jobId: string;
}

/**
 * `POST /api/lease/create-lease`
 * handler: createLease — controller/lease.js:5
 * ruta: routes/lease.js:12
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Lease()`: los campos son los del esquema `models/Lease.js`
 * status: 201, 500
 */
export interface PostLeaseCreateLeaseBody {
  active?: boolean;
  admin_user?: string;
  company?: string;
  date_assignment?: string;
  device?: string;
  staff_member?: string;
  subscription?: string;
}

/**
 * `DELETE /api/lease/delete-lease/:id`
 * handler: deleteLease — controller/lease.js:56
 * ruta: routes/lease.js:18
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 500
 */
export interface DeleteLeaseDeleteLeaseByIdParams {
  id: string;
}

/**
 * `PATCH /api/lease/edit-lease/:id`
 * handler: editLease — controller/lease.js:22
 * ruta: routes/lease.js:15
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchLeaseEditLeaseByIdParams {
  id: string;
}

/**
 * `GET /api/lease/lease-list`
 * handler: leaseList — controller/lease.js:80
 * ruta: routes/lease.js:21
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Lease.find()`: cualquier subconjunto de los campos de `models/Lease.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetLeaseLeaseListBody {
  active?: boolean;
  admin_user?: string;
  company?: string;
  date_assignment?: string;
  device?: string;
  staff_member?: string;
  subscription?: string;
}

/**
 * `POST /api/lease/lease-list`
 * handler: leaseList — controller/lease.js:80
 * ruta: routes/lease.js:27
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Lease.find()`: cualquier subconjunto de los campos de `models/Lease.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostLeaseLeaseListBody {
  active?: boolean;
  admin_user?: string;
  company?: string;
  date_assignment?: string;
  device?: string;
  staff_member?: string;
  subscription?: string;
}

/**
 * `POST /api/nodemailer/assignig-device-notification`
 * handler: assingDeviceNotification — nodeMailer/notifications.js:119
 * ruta: routes/nodeMailer.js:72
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerAssignigDeviceNotificationBody {
  consumer?: Record<string, unknown>;
  devices?: unknown[];
  link?: string;
}

/**
 * `POST /api/nodemailer/branding-preview`
 * handler: previewBranding — nodeMailer/brandingPreview.js:130
 * ruta: routes/nodeMailer.js:69
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostNodemailerBrandingPreviewBody {
  branding?: string;
  template?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/completed-task-notification`
 * handler: completedTask — nodeMailer/notifications.js:894
 * ruta: routes/nodeMailer.js:204
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 */

/**
 * `POST /api/nodemailer/confirm-returned-device-notification`
 * handler: returningDeviceNotification — nodeMailer/notifications.js:127
 * ruta: routes/nodeMailer.js:75
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerConfirmReturnedDeviceNotificationBody {
  consumer?: Record<string, unknown>;
  devices?: unknown[];
  link?: string;
}

/**
 * `POST /api/nodemailer/confirmation-account`
 * handler: confirmationLinkNewConsumerNotification — nodeMailer/notifications.js:286
 * ruta: routes/nodeMailer.js:99
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerConfirmationAccountBody {
  company?: Record<string, unknown>;
  consumer?: Record<string, unknown>;
  event?: Record<string, unknown>;
  link?: string;
}

/**
 * `POST /api/nodemailer/consumer-lease-return-device-notification`
 * handler: consumerLeaseEndedDeviceReturnedNotification — nodeMailer/notifications.js:883
 * ruta: routes/nodeMailer.js:182
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerConsumerLeaseReturnDeviceNotificationBody {
  consumer: Record<string, unknown>;
  devices: unknown[];
  returnDate: string;
}

/**
 * `POST /api/nodemailer/customize-message-notification`
 * handler: customizeMessage — nodeMailer/notifications.js:926
 * ruta: routes/nodeMailer.js:224
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerCustomizeMessageNotificationBody {
  company?: Record<string, unknown>;
  message?: string;
  staff?: Record<string, unknown>;
  subject?: string;
}

/**
 * `POST /api/nodemailer/customized-notification`
 * handler: customizedEmailNotification — nodeMailer/notifications.js:314
 * ruta: routes/nodeMailer.js:112
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerCustomizedNotificationBody {
  company?: Record<string, unknown>;
  consumersList?: string;
  eventSelected?: string;
  message?: string;
  subject?: string;
}

/**
 * `POST /api/nodemailer/deposit-collected-notification`
 * handler: captureDepositNotification — nodeMailer/notifications.js:228
 * ruta: routes/nodeMailer.js:84
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerDepositCollectedNotificationBody {
  amount?: string;
  company?: Record<string, unknown>;
  consumer?: Record<string, unknown>;
  date?: string;
  event?: Record<string, unknown>;
  time?: string;
  transaction?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/deposit-return-notification`
 * handler: cancelDepositNotification — nodeMailer/notifications.js:220
 * ruta: routes/nodeMailer.js:81
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerDepositReturnNotificationBody {
  amount?: string;
  company?: Record<string, unknown>;
  consumer?: Record<string, unknown>;
  date?: string;
  event?: Record<string, unknown>;
  time?: string;
  transaction?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/device-report-per-transaction`
 * handler: deviceReportPerTransaction — nodeMailer/notifications.js:212
 * ruta: routes/nodeMailer.js:150
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerDeviceReportPerTransactionBody {
  consumer?: Record<string, unknown>;
  devices?: unknown[];
  link?: string;
}

/**
 * `POST /api/nodemailer/early-remind-notification`
 * handler: earlierReturningNotification — nodeMailer/notifications.js:242
 * ruta: routes/nodeMailer.js:87
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerEarlyRemindNotificationBody {
  consumer?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/edit-device-admin`
 * handler: editingDeviceAdminNotification — nodeMailer/notifications.js:258
 * ruta: routes/nodeMailer.js:109
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerEditDeviceAdminBody {
  contactAdminEmail?: string;
}

/**
 * `POST /api/nodemailer/event-staff-notification`
 * handler: eventStaffNotification — nodeMailer/notifications.js:250
 * ruta: routes/nodeMailer.js:90
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerEventStaffNotificationBody {
  company?: Record<string, unknown>;
  message?: string;
  staff?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/events-begin-reminder`
 * handler: eventBeginsReminderNotification — nodeMailer/notifications.js:346
 * ruta: routes/nodeMailer.js:126
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerEventsBeginReminderBody {
  daysToEvent?: string;
  event?: Record<string, unknown>;
  message?: string;
  staff?: Record<string, unknown>;
  subject?: string;
}

/**
 * `POST /api/nodemailer/failed-task-notification`
 * handler: failedTask — nodeMailer/notifications.js:902
 * ruta: routes/nodeMailer.js:207
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 */

/**
 * `POST /api/nodemailer/feedback-email-notification`
 * handler: devitrakFeedbackEmailNotification — nodeMailer/notifications.js:444
 * ruta: routes/nodeMailer.js:153
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostNodemailerFeedbackEmailNotificationBody {
  eventID?: string;
}

/**
 * `POST /api/nodemailer/forcing-revoking-active-session`
 * handler: forcingRevokingActiveSession — nodeMailer/notifications.js:910
 * ruta: routes/nodeMailer.js:210
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerForcingRevokingActiveSessionBody {
  email?: string;
}

/**
 * `POST /api/nodemailer/internal-single-email-notification`
 * handler: internalNotification — nodeMailer/notifications.js:338
 * ruta: routes/nodeMailer.js:123
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerInternalSingleEmailNotificationBody {
  company?: Record<string, unknown>;
  message?: string;
  staff?: Record<string, unknown>;
  subject?: string;
}

/**
 * `POST /api/nodemailer/invoice-notification`
 * handler: chargeInvoice — nodeMailer/notifications.js:378
 * ruta: routes/nodeMailer.js:135
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerInvoiceNotificationBody {
  amount?: string;
  customer?: string;
  date?: string;
  email?: string;
  paymentIntent?: string;
  service?: string;
}

/**
 * `POST /api/nodemailer/leased-equip-staff-notification`
 * handler: itemInfoStaffNotification — nodeMailer/notifications.js:362
 * ruta: routes/nodeMailer.js:132
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLeasedEquipStaffNotificationBody {
  company?: Record<string, unknown>;
  contactInfo?: string;
  message?: string;
  staff?: Record<string, unknown>;
  subject?: string;
}

/**
 * `POST /api/nodemailer/liability-contract-consumer-email-notification`
 * handler: liabilityContractConsumerNotification — nodeMailer/notifications.js:583
 * ruta: routes/nodeMailer.js:163
 * auth: attachContractLinkTokens
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLiabilityContractConsumerEmailNotificationBody {
  company_id?: string;
  company_name?: string;
  consumer?: Record<string, unknown>;
  contract_link_tokens?: string;
  contract_list: unknown[];
  date_reference?: string;
  email?: string;
  email_admin?: string;
  items: unknown[];
  name?: string;
  subject?: string;
  verification_id?: string;
}

/**
 * `POST /api/nodemailer/liability-contract-email-notification`
 * handler: liabilityContractStaffNotification — nodeMailer/notifications.js:596
 * ruta: routes/nodeMailer.js:156
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLiabilityContractEmailNotificationBody {
  company_id?: string;
  company_name?: string;
  contract_list: unknown[];
  date_reference?: string;
  email?: string;
  email_admin?: string;
  items: unknown[];
  name?: string;
  staff?: Record<string, unknown>;
  subject?: string;
  verification_id?: string;
}

/**
 * `POST /api/nodemailer/liability-contract-member-email-notification`
 * handler: liabilityContractMemberNotification — nodeMailer/notifications.js:570
 * ruta: routes/nodeMailer.js:170
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLiabilityContractMemberEmailNotificationBody {
  company_id?: string;
  company_name?: string;
  contract_list: unknown[];
  date_reference?: string;
  email?: string;
  email_admin?: string;
  items: unknown[];
  member?: Record<string, unknown>;
  name?: string;
  subject?: string;
  verification_id?: string;
}

/**
 * `POST /api/nodemailer/login-existing-consumer`
 * handler: loginLinkExistingConsumerNotification — nodeMailer/notifications.js:294
 * ruta: routes/nodeMailer.js:102
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLoginExistingConsumerBody {
  company?: Record<string, unknown>;
  consumer?: Record<string, unknown>;
  event?: Record<string, unknown>;
  link?: string;
}

/**
 * `POST /api/nodemailer/lost-device-fee-notification`
 * handler: lostDeviceFeeCollectedNotification — nodeMailer/notifications.js:276
 * ruta: routes/nodeMailer.js:93
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLostDeviceFeeNotificationBody {
  amount?: string;
  client?: string;
  company?: Record<string, unknown>;
  companyName?: string;
  confirmationLink?: string;
  consumer?: Record<string, unknown>;
  consumerEmail?: string;
  consumerInfo?: string;
  consumerName?: string;
  date?: string;
  device?: Record<string, unknown>;
  deviceInfo?: string;
  email?: string;
  event?: Record<string, unknown>;
  eventName?: string;
  eventSelected?: string;
  item?: Record<string, unknown>;
  link?: string;
  paymentIntent?: string;
  payment_intent?: string;
  time?: string;
  total?: string;
  transaction?: Record<string, unknown>;
  transactionData?: string;
  url?: string;
  value?: string;
}

/**
 * `POST /api/nodemailer/massive-event-customer-notification`
 * handler: massiveEventCustomerNotification — nodeMailer/notifications.js:418
 * ruta: routes/nodeMailer.js:144
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 202, 500
 */

/**
 * `POST /api/nodemailer/member-device-fee-receipt-notification`
 * handler: memberDeviceFeeReceiptNotification — nodeMailer/notifications.js:195
 * ruta: routes/nodeMailer.js:197
 * auth: validateJWT
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerMemberDeviceFeeReceiptNotificationBody {
  billedGuardian?: string;
  company?: Record<string, unknown>;
  date?: string;
  lines?: string;
  member?: Record<string, unknown>;
  paymentIntent?: string;
  total?: string;
}

/**
 * `POST /api/nodemailer/member-device-incident-notification`
 * handler: memberDeviceIncidentNotification — nodeMailer/notifications.js:177
 * ruta: routes/nodeMailer.js:192
 * auth: validateJWT
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerMemberDeviceIncidentNotificationBody {
  conditionNote?: string;
  devices?: unknown[];
  feeAmount?: string;
  member?: Record<string, unknown>;
  outcome?: string;
  outcomeLabel?: string;
}

/**
 * `POST /api/nodemailer/member-email-notification`
 * handler: memberEmailNotification — nodeMailer/notifications.js:918
 * ruta: routes/nodeMailer.js:213
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerMemberEmailNotificationBody {
  consumer?: Record<string, unknown>;
  message?: string;
  subject?: string;
}

/**
 * `POST /api/nodemailer/member-lease-return-device-notification`
 * handler: returningDeviceLeaseMemberNotification — nodeMailer/notifications.js:135
 * ruta: routes/nodeMailer.js:185
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerMemberLeaseReturnDeviceNotificationBody {
  devices?: unknown[];
  member?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/new_invitation`
 * handler: newUserInvitationNotification — nodeMailer/notifications.js:330
 * ruta: routes/nodeMailer.js:120
 * auth: attachInvitationLink
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerNewInvitationBody {
  consumer?: Record<string, unknown>;
  link?: string;
  subject?: string;
}

/**
 * `POST /api/nodemailer/refund-notification`
 * handler: refundInvoice — nodeMailer/notifications.js:386
 * ruta: routes/nodeMailer.js:139
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerRefundNotificationBody {
  amount?: string;
  company?: Record<string, unknown>;
  customer?: string;
  date?: string;
  email?: string;
  event?: Record<string, unknown>;
  message?: string;
  paymentIntent?: string;
}

/**
 * `POST /api/nodemailer/reset-admin-password`
 * handler: linkToResetPassword — nodeMailer/notifications.js:306
 * ruta: routes/nodeMailer.js:106
 * auth: attachPasswordResetLink
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerResetAdminPasswordBody {
  contactInfo?: string;
  link?: string;
  linkToResetPassword?: string;
}

/**
 * `POST /api/nodemailer/returned-items-to-renter-notification`
 * handler: returnedItemsToRenterNotification — nodeMailer/notifications.js:684
 * ruta: routes/nodeMailer.js:176
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostNodemailerReturnedItemsToRenterNotificationBody {
  attachments?: unknown[];
  staffEmails: string;
  subject: string;
}

/**
 * `POST /api/nodemailer/send-consumer-app-instructions`
 * handler: eventLinkEvent — nodeMailer/notifications.js:370
 * ruta: routes/nodeMailer.js:141
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerSendConsumerAppInstructionsBody {
  buttonLink?: string;
  contactInfo?: string;
  eventName?: string;
  list?: unknown[];
}

/**
 * `POST /api/nodemailer/single-email-notification`
 * handler: singleEmailNotification — nodeMailer/notifications.js:322
 * ruta: routes/nodeMailer.js:115
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerSingleEmailNotificationBody {
  company?: Record<string, unknown>;
  consumer?: Record<string, unknown>;
  eventSelected?: string;
  message?: string;
  subject?: string;
}

/**
 * `POST /api/nodemailer/staff_internal_notification`
 * handler: staffInternalNotification — nodeMailer/notifications.js:354
 * ruta: routes/nodeMailer.js:129
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerStaffInternalNotificationBody {
  company?: Record<string, unknown>;
  contactInfo?: string;
  eventInfo?: string;
  staff?: Record<string, unknown>;
  staffMember?: string;
  subject?: string;
}

/**
 * `POST /api/nodemailer/terms-and-conditions-acceptance`
 * handler: termsAndConditionsAcceptanceNotification — nodeMailer/notifications.js:724
 * ruta: routes/nodeMailer.js:179
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerTermsAndConditionsAcceptanceBody {
  company?: Record<string, unknown>;
  consumer: Record<string, unknown>;
  event?: Record<string, unknown>;
  signature?: Record<string, unknown>;
}

/**
 * `POST /api/notificationlog/notification-feed-log`
 * handler: feedNotificationLog — controller/notificationLog.js:10
 * ruta: routes/notificationLog.js:14
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 202, 500
 */

/**
 * `POST /api/post/new-post`
 * handler: createPost — controller/post.js:4
 * ruta: routes/post.js:16
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Post()`: los campos son los del esquema `models/Post.js`
 * status: 201, 500
 */
export interface PostPostNewPostBody {
  company_id?: string;
  created_at?: string;
  description?: string;
  displayed_in?: unknown[];
  media?: string;
  published?: boolean;
  published_at?: string;
  subtitle?: string;
  title?: string;
  updated_at?: string;
}

/**
 * `DELETE /api/post/post-delete/:id`
 * handler: deletePost — controller/post.js:52
 * ruta: routes/post.js:25
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeletePostPostDeleteByIdParams {
  id: string;
}

/**
 * `PATCH /api/post/post-update/:id`
 * handler: updatePost — controller/post.js:71
 * ruta: routes/post.js:28
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchPostPostUpdateByIdParams {
  id: string;
}

/**
 * `GET /api/post/posts`
 * handler: postList — controller/post.js:21
 * ruta: routes/post.js:19
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Post.find()`: cualquier subconjunto de los campos de `models/Post.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetPostPostsBody {
  company_id?: string;
  created_at?: string;
  description?: string;
  displayed_in?: unknown[];
  media?: string;
  published?: boolean;
  published_at?: string;
  subtitle?: string;
  title?: string;
  updated_at?: string;
}

/**
 * `POST /api/post/posts`
 * handler: postList — controller/post.js:21
 * ruta: routes/post.js:22
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Post.find()`: cualquier subconjunto de los campos de `models/Post.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostPostPostsBody {
  company_id?: string;
  created_at?: string;
  description?: string;
  displayed_in?: unknown[];
  media?: string;
  published?: boolean;
  published_at?: string;
  subtitle?: string;
  title?: string;
  updated_at?: string;
}

/**
 * `POST /api/receiver/all-transaction-by-event-and-consumer`
 * handler: getAllTransactionByEventAndConsumer — controller/receiver.js:463
 * ruta: routes/receivers.js:134
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostReceiverAllTransactionByEventAndConsumerBody {
  company?: Record<string, unknown>;
  paymentIntentList?: string;
}

/**
 * `POST /api/receiver/create-bulk-item-transaction-in-user`
 * handler: createBulkItemTransactionInUser — controller/receiver.js:429
 * ruta: routes/receivers.js:114
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PostReceiverCreateBulkItemTransactionInUserBody {
  company?: Record<string, unknown>;
  deviceType?: string;
  eventSelected?: string;
  event_id?: string;
  paymentIntent?: string;
  provider?: string;
  serialNumbers?: string;
  status?: string;
  timestamp?: string;
  user?: Record<string, unknown>;
}

/**
 * `POST /api/receiver/delete-bulk-devices-pool`
 * handler: receiverPoolBulkDelete — controller/receiver.js:278
 * ruta: routes/receivers.js:102
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 500
 */
export interface PostReceiverDeleteBulkDevicesPoolBody {
  ids?: unknown[];
}

/**
 * `DELETE /api/receiver/delete-device-pool/:id`
 * handler: receiverPoolFoundAndDelete — controller/receiver.js:262
 * ruta: routes/receivers.js:99
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteReceiverDeleteDevicePoolByIdParams {
  id: string;
}

/**
 * `GET /api/receiver/list-receiver-returned-issue`
 * handler: getListOfReceiverReturnedByIssue — controller/receiver.js:353
 * ruta: routes/receivers.js:81
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `ReceiverReturnedStatus.find()`: cualquier subconjunto de los campos de `models/ReceiverReturnedStatus.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetReceiverListReceiverReturnedIssueBody {
  activity?: string;
  admin?: string;
  comment?: string;
  device?: Record<string, unknown>;
  eventSelected?: string;
  provider?: string;
  status?: string;
  timeStamp?: string;
  user?: string;
}

/**
 * `POST /api/receiver/list-receiver-returned-issue`
 * handler: getListOfReceiverReturnedByIssue — controller/receiver.js:353
 * ruta: routes/receivers.js:84
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `ReceiverReturnedStatus.find()`: cualquier subconjunto de los campos de `models/ReceiverReturnedStatus.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostReceiverListReceiverReturnedIssueBody {
  activity?: string;
  admin?: string;
  comment?: string;
  device?: Record<string, unknown>;
  eventSelected?: string;
  provider?: string;
  status?: string;
  timeStamp?: string;
  user?: string;
}

/**
 * `POST /api/receiver/receiver-assignation`
 * handler: addReceiverToTransaction — controller/receiver.js:24
 * ruta: routes/receivers.js:36
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Receivers()`: los campos son los del esquema `models/Receivers.js`
 * status: 201, 500
 */
export interface PostReceiverReceiverAssignationBody {
  active?: boolean;
  adminUser?: string;
  company?: string;
  device?: Record<string, unknown>;
  eventSelected?: unknown[];
  event_id?: string;
  paymentIntent?: string;
  provider?: unknown[];
  timeStamp?: string;
  user?: string;
}

/**
 * `POST /api/receiver/receiver-assigned-list`
 * handler: listOfAssignedReceiver — controller/receiver.js:294
 * ruta: routes/receivers.js:72
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Receivers.find()`: cualquier subconjunto de los campos de `models/Receivers.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostReceiverReceiverAssignedListBody {
  active?: boolean;
  company?: string;
  device?: Record<string, unknown>;
  eventSelected?: unknown[];
  event_id?: string;
  paymentIntent?: string;
  provider?: unknown[];
  timeStamp?: string;
  user?: string;
}

/**
 * `POST /api/receiver/receiver-assigned-users-list`
 * handler: listOfAssignedReceiverPlusUserInformation — controller/receiver.js:309
 * ruta: routes/receivers.js:75
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Receivers.find()`: cualquier subconjunto de los campos de `models/Receivers.js` (`{}` trae todo)
 * status: 200, 500
 */
export interface PostReceiverReceiverAssignedUsersListBody {
  active?: boolean;
  company?: string;
  device?: Record<string, unknown>;
  eventSelected?: unknown[];
  event_id?: string;
  paymentIntent?: string;
  provider?: unknown[];
  timeStamp?: string;
  user?: string;
}

/**
 * `POST /api/receiver/receiver-assigned`
 * handler: checkingReceiversAssigned — controller/receiver.js:47
 * ruta: routes/receivers.js:39
 * auth: sin middleware de auth en la ruta
 * status: 201, 501
 */
export interface PostReceiverReceiverAssignedBody {
  paymentIntent?: string;
}

/**
 * `DELETE /api/receiver/receiver-pool-device/:id`
 * handler: receiverPoolFoundAndDelete — controller/receiver.js:262
 * ruta: routes/receivers.js:105
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteReceiverReceiverPoolDeviceByIdParams {
  id: string;
}

/**
 * `GET /api/receiver/receiver-pool-list`
 * handler: getListOfItemsInEventPool — controller/receiver.js:177
 * ruta: routes/receivers.js:69
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 200, 500
 */
export interface GetReceiverReceiverPoolListBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/receiver/receiver-pool-list`
 * handler: receiverPoolList — controller/receiver.js:245
 * ruta: routes/receivers.js:66
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `ReceiversPool.find()`: cualquier subconjunto de los campos de `models/ReceiversPool.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostReceiverReceiverPoolListBody {
  activity?: boolean;
  comment?: string;
  company?: string;
  contract_type?: string;
  device?: Record<string, unknown>;
  eventSelected?: string;
  provider?: string;
  status?: string;
  type?: string;
}

/**
 * `PATCH /api/receiver/receiver-returned-issue/:id`
 * handler: updateIssueDevice — controller/receiver.js:368
 * ruta: routes/receivers.js:63
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchReceiverReceiverReturnedIssueByIdParams {
  id: string;
}

/**
 * `PATCH /api/receiver/receiver-returned-issue/:id`
 * handler: updateIssueDevice — controller/receiver.js:368
 * ruta: routes/receivers.js:96
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchReceiverReceiverReturnedIssueById2Params {
  id: string;
}

/**
 * `POST /api/receiver/receiver-returned-issue`
 * handler: trackReturnedReceiverWithIssue — controller/receiver.js:337
 * ruta: routes/receivers.js:48
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new ReceiverReturnedStatus()`: los campos son los del esquema `models/ReceiverReturnedStatus.js`
 * status: 201, 500
 */
export interface PostReceiverReceiverReturnedIssueBody {
  activity?: string;
  admin?: string;
  comment?: string;
  device?: Record<string, unknown>;
  eventSelected?: string;
  provider?: string;
  status?: string;
  timeStamp?: string;
  user?: string;
}

/**
 * `PATCH /api/receiver/receiver-update/:id`
 * handler: udpateReceiverStatus — controller/receiver.js:99
 * ruta: routes/receivers.js:54
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchReceiverReceiverUpdateByIdBody {
  device?: Record<string, unknown>;
  id?: string;
}

/**
 * `PATCH /api/receiver/receiver-update/:id`
 * handler: udpateReceiverStatus — controller/receiver.js:99
 * ruta: routes/receivers.js:90
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchReceiverReceiverUpdateById2Body {
  device?: Record<string, unknown>;
  id?: string;
}

/**
 * `PUT /api/receiver/receiver-update/:id`
 * handler: udpateReceiverStatus — controller/receiver.js:99
 * ruta: routes/receivers.js:51
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PutReceiverReceiverUpdateByIdBody {
  device?: Record<string, unknown>;
  id?: string;
}

/**
 * `PUT /api/receiver/receiver-update/:id`
 * handler: udpateReceiverStatus — controller/receiver.js:99
 * ruta: routes/receivers.js:87
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PutReceiverReceiverUpdateById2Body {
  device?: Record<string, unknown>;
  id?: string;
}

/**
 * `POST /api/receiver/receivers-pool-bulk`
 * handler: poolReceiversBulk — controller/receiver.js:162
 * ruta: routes/receivers.js:45
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PostReceiverReceiversPoolBulkBody {
  activity?: string;
  comment?: string;
  company?: Record<string, unknown>;
  deviceList?: string;
  eventSelected?: string;
  provider?: string;
  status?: string;
  type?: string;
}

/**
 * `PATCH /api/receiver/receivers-pool-update-bulk`
 * handler: updateBulkItemDataInPool — controller/receiver.js:384
 * ruta: routes/receivers.js:60
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchReceiverReceiversPoolUpdateBulkBody {
  activity?: string;
  comment?: string;
  deviceData?: string;
  qty?: string;
  startingSerialNumber?: string;
  status?: string;
}

/**
 * `PATCH /api/receiver/receivers-pool-update/:id`
 * handler: updatePoolReceivers — controller/receiver.js:229
 * ruta: routes/receivers.js:57
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchReceiverReceiversPoolUpdateByIdParams {
  id: string;
}

/**
 * `POST /api/receiver/receivers-pool`
 * handler: poolReceivers — controller/receiver.js:145
 * ruta: routes/receivers.js:42
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new ReceiversPool()`: los campos son los del esquema `models/ReceiversPool.js`
 * status: 201, 500
 */
export interface PostReceiverReceiversPoolBody {
  activity?: boolean;
  comment?: string;
  company?: string;
  contract_type?: string;
  device?: Record<string, unknown>;
  eventSelected?: string;
  provider?: string;
  status?: string;
  type?: string;
}

/**
 * `DELETE /api/receiver/remove-transaction/:id`
 * handler: removingItemFromTransaction — controller/receiver.js:446
 * ruta: routes/receivers.js:120
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */
export interface DeleteReceiverRemoveTransactionByIdParams {
  id: string;
}

/**
 * `PATCH /api/receiver/transaction-all-items-returned-at-once`
 * handler: updateBulkItemsInTransactionPerUserAtOnce — controller/receiver.js:415
 * ruta: routes/receivers.js:129
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchReceiverTransactionAllItemsReturnedAtOnceBody {
  device?: Record<string, unknown>;
  timeStamp?: string;
}

/**
 * `PATCH /api/receiver/transaction-return-all-items-in-pool`
 * handler: returnAllItemsInTransactionInPool — controller/receiver.js:401
 * ruta: routes/receivers.js:123
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchReceiverTransactionReturnAllItemsInPoolBody {
  activity?: string;
  company?: Record<string, unknown>;
  device?: Record<string, unknown>;
  eventSelected?: string;
}

/**
 * `PATCH /api/receiver/update-bulk-items-in-pool`
 * handler: updateBulkItemsInPool — controller/receiver.js:131
 * ruta: routes/receivers.js:111
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchReceiverUpdateBulkItemsInPoolBody {
  activity?: string;
  company?: Record<string, unknown>;
  device?: Record<string, unknown>;
  eventSelected?: string;
}

/**
 * `PATCH /api/receiver/update-bulk-items-in-transaction`
 * handler: updateBulkItemsInTransaction — controller/receiver.js:117
 * ruta: routes/receivers.js:108
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PatchReceiverUpdateBulkItemsInTransactionBody {
  device?: Record<string, unknown>;
  timeStamp?: string;
}

/**
 * `POST /api/registration/accept-invitation`
 * handler: acceptInvitation — controller/registration.js:517
 * ruta: routes/registration.js:45
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 400, 404, 409, 500
 */

/**
 * `POST /api/registration/add-company`
 * handler: registerExistingUserNewCompany — controller/registration.js:302
 * ruta: routes/registration.js:30
 * auth: check("company.company_name", "company.company_name es requerido").not().isEmpty(), check("company.website", "company.website es requerido").not().isEmpty(), validateFields
 * status: 201, 400, 404, 500
 */
export interface PostRegistrationAddCompanyBody {
  company: Record<string, unknown>;
  user?: Record<string, unknown>;
}

/**
 * `POST /api/registration/new`
 * handler: registerNewUserAndCompany — controller/registration.js:147
 * ruta: routes/registration.js:14
 * auth: check("user.lastName", "user.lastName es requerido").not().isEmpty(), check("user.email", "user.email debe ser un email válido").isEmail(), check("user.password", "user.password debe tener al menos 6 caracteres").isLength({ min: 6 }), check("company.company_name", "company.company_name es requerido").not().isEmpty(), check("company.website", "company.website es requerido").not().isEmpty(), validateFields
 * status: 201, 400, 500
 */
export interface PostRegistrationNewBody {
  company: Record<string, unknown>;
  terms?: string;
  user: Record<string, unknown>;
}

/**
 * `POST /api/school/consent/list`
 * handler: listCompanyConsents — mysql/controllers/school.js:1254
 * ruta: mysql/routes/school.js:106
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolConsentListBody {
  company_id: number;
  page?: number;
  page_size?: number;
  status?: string;
}

/**
 * `POST /api/school/consent/public/respond`
 * handler: publicRespondConsent — mysql/controllers/school.js:1149
 * ruta: mysql/routes/school.js:89
 * auth: sin middleware de auth en la ruta
 * headers: user-agent
 * status: 200, 400, 404, 410, 500
 */
export interface PostSchoolConsentPublicRespondBody {
  decision?: string;
  otc?: string;
  signer_name: string;
}

/**
 * `POST /api/school/consent/public/retrieve`
 * handler: publicRetrieveConsent — mysql/controllers/school.js:984
 * ruta: mysql/routes/school.js:88
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 410, 500
 */

/**
 * `POST /api/school/consent/record`
 * handler: recordConsent — mysql/controllers/school.js:703
 * ruta: mysql/routes/school.js:85
 * auth: canCreate
 * status: 200, 201, 400, 404, 500
 */
export interface PostSchoolConsentRecordBody {
  company_id: number;
  guardian_id?: number;
  member_id: number;
  method?: string;
  policy_type?: string;
  policy_version?: number;
  signer_email?: string;
  signer_name: string;
}

/**
 * `POST /api/school/consent/request`
 * handler: requestConsent — mysql/controllers/school.js:748
 * ruta: mysql/routes/school.js:86
 * auth: canCreate
 * status: 201, 400, 404, 422, 500
 */
export interface PostSchoolConsentRequestBody {
  company_id: number;
  guardian_id?: number;
  member_id: number;
  policy_type?: string;
  policy_version?: number;
}

/**
 * `POST /api/school/consent/resend`
 * handler: resendConsent — mysql/controllers/school.js:885
 * ruta: mysql/routes/school.js:87
 * auth: canCreate
 * status: 200, 400, 404, 409, 422, 500
 */
export interface PostSchoolConsentResendBody {
  company_id?: number;
  member_id?: number;
  policy_type?: string;
  policy_version?: number;
}

/**
 * `POST /api/school/consent/status`
 * handler: consentStatus — mysql/controllers/school.js:1334
 * ruta: mysql/routes/school.js:107
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolConsentStatusBody {
  company_id: number;
  policy_type?: string;
  policy_version?: number;
}

/**
 * `POST /api/school/consent`
 * handler: listMemberConsents — mysql/controllers/school.js:1206
 * ruta: mysql/routes/school.js:104
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolConsentBody {
  company_id: number;
  member_id: number;
}

/**
 * `POST /api/school/dashboard`
 * handler: schoolDashboard — mysql/controllers/school.js:76
 * ruta: mysql/routes/school.js:69
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolDashboardBody {
  company_id: number;
}

/**
 * `POST /api/school/event-invitations/confirm`
 * handler: confirmEventInvitation — controller/eventInvitation.js:276
 * ruta: mysql/routes/school.js:102
 * auth: publicInvitationRateLimit
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 401, 410, 422, 500
 */

/**
 * `POST /api/school/event-invitations/response`
 * handler: recordEventInvitationResponse — controller/eventInvitation.js:372
 * ruta: mysql/routes/school.js:103
 * auth: publicInvitationRateLimit
 * status: 201, 400, 401, 404
 */
export interface PostSchoolEventInvitationsResponseBody {
  company_id?: number;
  event_id?: number;
  member_email?: string;
  member_id?: number;
  reason?: string;
  responder_email?: string;
  responder_role?: string;
  response?: string;
}

/**
 * `POST /api/school/event-invitations/send`
 * handler: sendEventInvitations — controller/eventInvitation.js:163
 * ruta: mysql/routes/school.js:95
 * auth: validateJWT, checkTokenVersion, authorizePermission("member", "create")
 * status: 200, 400, 404, 500
 */
export interface PostSchoolEventInvitationsSendBody {
  company_id?: number;
  event_id?: number;
  member_ids?: number;
}

/**
 * `POST /api/school/guardians/add`
 * handler: addStudentGuardian — mysql/controllers/school.js:498
 * ruta: mysql/routes/school.js:78
 * auth: canCreate
 * status: 200, 201, 400, 404, 500
 */
export interface PostSchoolGuardiansAddBody {
  company_id: number;
  email: string;
  first_name: string;
  guardian_id: number;
  is_primary?: boolean;
  last_name: string;
  member_id: number;
  phone_number?: number;
  relationship?: string;
}

/**
 * `POST /api/school/guardians/search`
 * handler: searchGuardians — mysql/controllers/school.js:603
 * ruta: mysql/routes/school.js:81
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolGuardiansSearchBody {
  company_id: number;
  email: string;
  guardian_id: number;
  member_id: number;
}

/**
 * `POST /api/school/guardians`
 * handler: listStudentGuardians — mysql/controllers/school.js:465
 * ruta: mysql/routes/school.js:75
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolGuardiansBody {
  company_id: number;
  member_id: number;
}

/**
 * `POST /api/school/reminders/resume`
 * handler: resumeLeaseReminders — mysql/controllers/school.js:1513
 * ruta: mysql/routes/school.js:120
 * auth: canUpdate
 * generado por factory: setLeaseReminders
 * status: 200, 400, 404, 500
 */
export interface PostSchoolRemindersResumeBody {
  company_id?: number;
  device_id: number;
  member_id?: number;
}

/**
 * `POST /api/school/reminders/stop`
 * handler: stopLeaseReminders — mysql/controllers/school.js:1512
 * ruta: mysql/routes/school.js:119
 * auth: canUpdate
 * generado por factory: setLeaseReminders
 * status: 200, 400, 404, 500
 */
export interface PostSchoolRemindersStopBody {
  company_id?: number;
  device_id: number;
  member_id?: number;
}

/**
 * `POST /api/school/roster`
 * handler: schoolRoster — mysql/controllers/school.js:107
 * ruta: mysql/routes/school.js:72
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolRosterBody {
  company_id: number;
  grade?: string;
  homeroom?: string;
}

/**
 * `POST /api/school/settings/consent-enforcement`
 * handler: setConsentEnforcement — mysql/controllers/school.js:1423
 * ruta: mysql/routes/school.js:111
 * auth: canUpdate
 * status: 200, 400, 500
 */
export interface PostSchoolSettingsConsentEnforcementBody {
  company_id: number;
  consent_document_id?: number;
  enforce?: string;
  enforce_under_13?: string;
  required_consent_policy_version?: number;
}

/**
 * `POST /api/school/settings`
 * handler: getSchoolSettings — mysql/controllers/school.js:1381
 * ruta: mysql/routes/school.js:110
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolSettingsBody {
  company_id: number;
}

/**
 * `POST /api/school/student/access-log`
 * handler: studentAccessLog — mysql/controllers/school.js:430
 * ruta: mysql/routes/school.js:116
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolStudentAccessLogBody {
  company_id?: number;
  member_id?: number;
  type?: string;
}

/**
 * `POST /api/school/student/erase`
 * handler: studentErase — mysql/controllers/school.js:370
 * ruta: mysql/routes/school.js:115
 * auth: canUpdate
 * status: 200, 400, 404, 500
 */
export interface PostSchoolStudentEraseBody {
  company_id?: number;
  member_id?: number;
}

/**
 * `POST /api/school/student/export`
 * handler: studentExport — mysql/controllers/school.js:191
 * ruta: mysql/routes/school.js:114
 * auth: canRead
 * status: 200, 400, 404, 500
 */
export interface PostSchoolStudentExportBody {
  company_id?: number;
  member_id?: number;
}

/**
 * `GET /api/search/advance_searching_query`
 * handler: advanceSearchingQuery — controller/search.js:2858
 * ruta: routes/search.js:37
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetSearchAdvanceSearchingQueryQuery {
  brand: string;
  category: string;
  company_id: string;
  company_sql_id: string;
  date_end: string;
  date_start: string;
  group: string;
  location: Record<string, unknown>;
}

/**
 * `GET /api/search/searching_consumer`
 * handler: moreConsumer — controller/search.js:979
 * ruta: routes/search.js:22
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetSearchSearchingConsumerQuery {
  company: Record<string, unknown>;
  lastId: string;
  variable: string;
}

/**
 * `GET /api/search/searching_device_transaction`
 * handler: moreDeviceTransaction — controller/search.js:1085
 * ruta: routes/search.js:31
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetSearchSearchingDeviceTransactionQuery {
  company: Record<string, unknown>;
  lastId: string;
  variable: string;
}

/**
 * `GET /api/search/searching_events`
 * handler: moreEvents — controller/search.js:1036
 * ruta: routes/search.js:25
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetSearchSearchingEventsQuery {
  company: Record<string, unknown>;
  lastId: string;
  variable: string;
}

/**
 * `GET /api/search/searching_`
 * handler: searching — controller/search.js:837
 * ruta: routes/search.js:19
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetSearchSearchingQuery {
  category: string;
  company: Record<string, unknown>;
  company_sql_id: string;
  variable: string;
}

/**
 * `GET /api/search/searching_previous_consumer`
 * handler: previousConsumer — controller/search.js:1000
 * ruta: routes/search.js:34
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetSearchSearchingPreviousConsumerQuery {
  company: Record<string, unknown>;
  lastId: string;
  variable: string;
}

/**
 * `GET /api/search/searching_staff`
 * handler: moreStaff — controller/search.js:1061
 * ruta: routes/search.js:28
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetSearchSearchingStaffQuery {
  employees: string;
  lastId: string;
  variable: string;
}

/**
 * `GET /api/staff-activity-log`
 * handler: getStaffActivityLogs — controller/staffActivityLog.js:228
 * ruta: routes/staffActivityLog.js:9
 * auth: validateJWT
 * generado por factory: createGetStaffActivityLogs
 * status: 403, 404, 500
 */
export interface GetStaffActivityLogQuery {
  action: string;
  actor_type: string;
  consumer: Record<string, unknown>;
  end_date: string;
  event_id: string;
  include_automatic: boolean;
  item_id: string;
  limit?: string;
  member_id: string;
  page?: string;
  serial_number: string;
  source: string;
  staff_member_id: string;
  start_date: string;
  target_id: string;
  target_model: string;
}

/**
 * `POST /api/staff/__staff-search`
 * handler: searchStaffByEmail — controller/admin.js:863
 * ruta: routes/staff.js:49
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 400, 500
 */

/**
 * `GET /api/staff/admin-users`
 * handler: displayAllAdminUser — controller/admin.js:935
 * ruta: routes/staff.js:19
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "read")
 * NOTA: el body se usa como FILTRO Mongo en `AdminUser.find()`: cualquier subconjunto de los campos de `models/AdminUser.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetStaffAdminUsersBody {
  active?: boolean;
  agreedPlatformConditions?: boolean;
  companiesAssigned?: unknown[];
  dailySummaries?: string;
  email?: string;
  emailNotifications?: Record<string, unknown>;
  eventReminder?: string;
  imageProfile?: string;
  lastName?: string;
  mfaEnabled?: boolean;
  mfaSecret?: Record<string, unknown>;
  multipleCompanies?: boolean;
  name?: string;
  online?: boolean;
  password?: string;
  phone?: string;
  platform_observer?: boolean;
  role?: string;
  role_type?: string;
  subscriptionRenewals?: string;
  super_user?: boolean;
  tokenVersion?: number;
}

/**
 * `POST /api/staff/admin-users`
 * handler: displayAllAdminUser — controller/admin.js:935
 * ruta: routes/staff.js:22
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "read")
 * NOTA: el body se usa como FILTRO Mongo en `AdminUser.find()`: cualquier subconjunto de los campos de `models/AdminUser.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostStaffAdminUsersBody {
  active?: boolean;
  agreedPlatformConditions?: boolean;
  companiesAssigned?: unknown[];
  dailySummaries?: string;
  email?: string;
  emailNotifications?: Record<string, unknown>;
  eventReminder?: string;
  imageProfile?: string;
  lastName?: string;
  mfaEnabled?: boolean;
  mfaSecret?: Record<string, unknown>;
  multipleCompanies?: boolean;
  name?: string;
  online?: boolean;
  password?: string;
  phone?: string;
  platform_observer?: boolean;
  role?: string;
  role_type?: string;
  subscriptionRenewals?: string;
  super_user?: boolean;
  tokenVersion?: number;
}

/**
 * `GET /api/staff/consumers/search`
 * handler: searchCustomerByParameters — controller/stripe.js:1072
 * ruta: routes/staff.js:44
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetStaffConsumersSearchBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `PATCH /api/staff/edit-admin/:id`
 * handler: editOtherAdminUser — controller/admin.js:587
 * ruta: routes/staff.js:41
 * auth: validateJWT, checkTokenVersion, selfOrStaffUpdate
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 500
 */
export interface PatchStaffEditAdminByIdParams {
  id: string;
}

/**
 * `POST /api/staff/force-logout`
 * handler: forceEndSession — controller/admin.js:1119
 * ruta: routes/staff.js:63
 * auth: tokenIfPresent
 * status: 200, 400, 403, 404, 500
 */
export interface PostStaffForceLogoutBody {
  email: string;
}

/**
 * `POST /api/stripe/account_link`
 * handler: stripeAccountLink — controller/stripe.js:124
 * ruta: routes/stripe.js:116
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeAccountLinkBody {
  connectedAccountId?: string;
  origin?: string;
}

/**
 * `POST /api/stripe/account_sessions`
 * handler: stripeAccountSession — controller/stripe.js:149
 * ruta: routes/stripe.js:119
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeAccountSessionsBody {
  connectedAccountId?: string;
}

/**
 * `POST /api/stripe/accounts`
 * handler: stripeAccountCreate — controller/stripe.js:65
 * ruta: routes/stripe.js:113
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeAccountsBody {
  country?: string;
  email?: string;
}

/**
 * `POST /api/stripe/cancel/subscriptions/:id`
 * handler: updateCancelSubscription — controller/stripe.js:605
 * ruta: routes/stripe.js:205
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeCancelSubscriptionsByIdBody {
  cancelAtPeriodEnd?: string;
  cancellationComment?: string;
}
export interface PostStripeCancelSubscriptionsByIdParams {
  id: string;
}

/**
 * `POST /api/stripe/company-account-stripe/update`
 * handler: stripeCompanyAccountUpdate — controller/stripe.js:273
 * ruta: routes/stripe.js:311
 * auth: sin middleware de auth en la ruta
 * NOTA: rest-spread `...updateData`: acepta campos extra
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 400, 500
 */
export interface PostStripeCompanyAccountStripeUpdateBody {
  connectedAccountId?: string;
}

/**
 * `POST /api/stripe/company-account-stripe`
 * handler: stripeCompanyAccountFound — controller/stripe.js:1037
 * ruta: routes/stripe.js:196
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeCompanyAccountStripeBody {
  company?: Record<string, unknown>;
}

/**
 * `POST /api/stripe/create-payment-intent-customized`
 * handler: stripePaymentIntentCustomized — controller/stripe.js:369
 * ruta: routes/stripe.js:130
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeCreatePaymentIntentCustomizedBody {
  receipt_email?: string;
  total?: string;
}

/**
 * `POST /api/stripe/create-payment-intent-subscription`
 * handler: stripePaymentIntentSubscription — controller/stripe.js:395
 * ruta: routes/stripe.js:133
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeCreatePaymentIntentSubscriptionBody {
  customerEmail?: string;
  total?: string;
}

/**
 * `POST /api/stripe/create-payment-intent`
 * handler: stripePaymentIntent — controller/stripe.js:304
 * ruta: routes/stripe.js:122
 * auth: validatePublicPaymentPayload, attachServerIdempotencyKey
 * status: 201, 500
 */
export interface PostStripeCreatePaymentIntentBody {
  customerEmail?: string;
  customerId?: string;
  device?: Record<string, unknown>;
}

/**
 * `POST /api/stripe/create-subscriptions_no_trial`
 * handler: createSubscriptionNoTrialPeriod — controller/stripe.js:478
 * ruta: routes/stripe.js:145
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeCreateSubscriptionsNoTrialBody {
  items?: unknown[];
  period?: string;
  stripeCustomerID?: string;
}

/**
 * `POST /api/stripe/create-subscriptions`
 * handler: creatingSubscription — controller/stripe.js:420
 * ruta: routes/stripe.js:142
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeCreateSubscriptionsBody {
  items?: unknown[];
  period?: string;
  stripeCustomerID?: string;
}

/**
 * `POST /api/stripe/customer`
 * handler: stripeCustomer — controller/stripe.js:30
 * ruta: routes/stripe.js:110
 * auth: sin middleware de auth en la ruta
 * status: 201, 400
 */
export interface PostStripeCustomerBody {
  email?: string;
  name?: string;
  phoneNumber?: string;
}

/**
 * `GET /api/stripe/customers/search`
 * handler: searchCustomerId — controller/stripe.js:779
 * ruta: routes/stripe.js:178
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "read")
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetStripeCustomersSearchBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `GET /api/stripe/customers`
 * handler: listAllCustomers — controller/stripe.js:763
 * ruta: routes/stripe.js:172
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "read")
 * NOTA: el body se usa como FILTRO Mongo en `StripeCustomer.find()`: cualquier subconjunto de los campos de `models/StripeCustomer.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetStripeCustomersBody {
  email?: string;
  name?: string;
  phone?: string;
  stripeid?: string;
}

/**
 * `POST /api/stripe/customers`
 * handler: listAllCustomers — controller/stripe.js:763
 * ruta: routes/stripe.js:175
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "read")
 * NOTA: el body se usa como FILTRO Mongo en `StripeCustomer.find()`: cualquier subconjunto de los campos de `models/StripeCustomer.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostStripeCustomersBody {
  email?: string;
  name?: string;
  phone?: string;
  stripeid?: string;
}

/**
 * `POST /api/stripe/internal/partial-refund`
 * handler: partialRefundStripePaymentIntent — controller/stripe.js:903
 * ruta: routes/stripe.js:273
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validateRefundPayload
 * status: 201, 500
 */
export interface PostStripeInternalPartialRefundBody {
  paymentIntent?: string;
  total?: string;
}

/**
 * `POST /api/stripe/internal/payment-intents/:id/cancel`
 * handler: cancelStripePaymentIntent — controller/stripe.js:858
 * ruta: routes/stripe.js:237
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validatePaymentIntentIdParam
 * status: 201, 500
 */
export interface PostStripeInternalPaymentIntentsByIdCancelBody {
  id?: string;
}

/**
 * `POST /api/stripe/internal/payment-intents/:id/capture`
 * handler: captureStripePaymentIntent — controller/stripe.js:833
 * ruta: routes/stripe.js:230
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validatePaymentIntentIdParam
 * status: 201, 404
 */
export interface PostStripeInternalPaymentIntentsByIdCaptureBody {
  amount_to_capture?: string;
  id?: string;
}

/**
 * `POST /api/stripe/internal/refund`
 * handler: refundStripePaymentIntent — controller/stripe.js:882
 * ruta: routes/stripe.js:266
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validateRefundPayload
 * status: 201, 500
 */
export interface PostStripeInternalRefundBody {
  paymentIntent?: string;
}

/**
 * `GET /api/stripe/invoices`
 * handler: displayAllPaidInvoicesPerSubscription — controller/stripe.js:648
 * ruta: routes/stripe.js:199
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetStripeInvoicesBody {
  subscriptionID?: string;
}

/**
 * `POST /api/stripe/invoices`
 * handler: displayAllPaidInvoicesPerSubscription — controller/stripe.js:648
 * ruta: routes/stripe.js:202
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeInvoicesBody {
  subscriptionID?: string;
}

/**
 * `POST /api/stripe/new-company-account`
 * handler: companyInformationAccountStripe — controller/stripe.js:190
 * ruta: routes/stripe.js:139
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripeNewCompanyAccountBody {
  companyName?: string;
  ownerEmail?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
}

/**
 * `POST /api/stripe/partial-refund`
 * handler: partialRefundStripePaymentIntent — controller/stripe.js:903
 * ruta: routes/stripe.js:259
 * auth: canMoveCollectedMoney, validateRefundPayload
 * status: 201, 500
 */
export interface PostStripePartialRefundBody {
  paymentIntent?: string;
  total?: string;
}

/**
 * `POST /api/stripe/payment_intents/:id/update-payment-method`
 * handler: updatePaymentMethodFromAdminDashboard — controller/stripe.js:668
 * ruta: routes/stripe.js:160
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostStripePaymentIntentsByIdUpdatePaymentMethodBody {
  newPaymentMethodID?: string;
  paymentIntentId?: string;
}

/**
 * `GET /api/stripe/payment_intents/:id`
 * handler: retrievePaymentIntent — controller/stripe.js:967
 * ruta: routes/stripe.js:181
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 401, 404, 500
 */
export interface GetStripePaymentIntentsByIdParams {
  id: string;
}

/**
 * `POST /api/stripe/payment_methods/:id/attach`
 * handler: updateDefaultPaymentMethodInCustomer — controller/stripe.js:709
 * ruta: routes/stripe.js:154
 * auth: sin middleware de auth en la ruta
 * status: 201
 */
export interface PostStripePaymentMethodsByIdAttachBody {
  customerID?: string;
}
export interface PostStripePaymentMethodsByIdAttachParams {
  id: string;
}

/**
 * `POST /api/stripe/payment-intents/:id/cancel`
 * handler: cancelStripePaymentIntent — controller/stripe.js:858
 * ruta: routes/stripe.js:222
 * auth: canMoveCollectedMoney, validatePaymentIntentIdParam
 * status: 201, 500
 */
export interface PostStripePaymentIntentsByIdCancelBody {
  id?: string;
}

/**
 * `POST /api/stripe/payment-intents/:id/capture`
 * handler: captureStripePaymentIntent — controller/stripe.js:833
 * ruta: routes/stripe.js:214
 * auth: canMoveCollectedMoney, validatePaymentIntentIdParam
 * status: 201, 404
 */
export interface PostStripePaymentIntentsByIdCaptureBody {
  amount_to_capture?: string;
  id?: string;
}

/**
 * `POST /api/stripe/payment-method/subscriptions/:id`
 * handler: updateDefaultPaymentMethodInSubscription — controller/stripe.js:689
 * ruta: routes/stripe.js:148
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201
 */
export interface PostStripePaymentMethodSubscriptionsByIdParams {
  id: string;
}

/**
 * `POST /api/stripe/refund`
 * handler: refundStripePaymentIntent — controller/stripe.js:882
 * ruta: routes/stripe.js:251
 * auth: canMoveCollectedMoney, validateRefundPayload
 * status: 201, 500
 */
export interface PostStripeRefundBody {
  paymentIntent?: string;
}

/**
 * `DELETE /api/stripe/remove-duplicate/:id`
 * handler: removeDuplicateEntries — controller/stripe.js:945
 * ruta: routes/stripe.js:280
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteStripeRemoveDuplicateByIdParams {
  id: string;
}

/**
 * `DELETE /api/stripe/removing/:id`
 * handler: removeDuplicateEntry — controller/transaction.js:237
 * ruta: routes/stripe.js:299
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 409, 500
 */
export interface DeleteStripeRemovingByIdParams {
  id: string;
}

/**
 * `POST /api/stripe/save-transaction-admin-dashboard`
 * handler: saveTransactionAdmin — controller/transaction.js:79
 * ruta: routes/stripe.js:287
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js`
 * status: 201, 500
 */
export interface PostStripeSaveTransactionAdminDashboardBody {
  active?: boolean;
  clientSecret?: string;
  company?: string;
  consumerInfo?: Record<string, unknown>;
  created_at?: number;
  date?: string;
  device?: unknown[];
  eventSelected?: string;
  event_id?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
}

/**
 * `POST /api/stripe/save-transaction-template-no-regular-user`
 * handler: saveTransactionTemplateForNoRegularUser — controller/transaction.js:103
 * ruta: routes/stripe.js:290
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js`
 * status: 201, 500
 */
export interface PostStripeSaveTransactionTemplateNoRegularUserBody {
  active?: boolean;
  clientSecret?: string;
  company?: string;
  consumerInfo?: Record<string, unknown>;
  created_at?: number;
  date?: string;
  device?: unknown[];
  eventSelected?: string;
  event_id?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
}

/**
 * `POST /api/stripe/save-transaction`
 * handler: saveTransaction — controller/transaction.js:32
 * ruta: routes/stripe.js:284
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 201, 500
 */
export interface PostStripeSaveTransactionBody {
  company?: Record<string, unknown>;
  consumerInfo?: string;
  event_id?: string;
  paymentIntent?: string;
}

/**
 * `POST /api/stripe/setup-search`
 * handler: findSubscriptionIdBySetUpId — controller/stripe.js:523
 * ruta: routes/stripe.js:169
 * auth: sin middleware de auth en la ruta
 * status: 201, 404, 500
 */
export interface PostStripeSetupSearchBody {
  setupId?: string;
}

/**
 * `POST /api/stripe/stripe-transaction-admin`
 * handler: saveStripeTransactionAdmin — controller/stripe.js:815
 * ruta: routes/stripe.js:211
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update")
 * NOTA: el body se pasa completo a `new StripeTransaction()`: los campos son los del esquema `models/StripeTransaction.js`
 * status: 201, 500
 */
export interface PostStripeStripeTransactionAdminBody {
  clientSecret?: string;
  company?: string;
  device?: number;
  eventSelected?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  user?: string;
}

/**
 * `POST /api/stripe/stripe-transaction-no-regular-user`
 * handler: saveStripeTransactionTemplateForNoRegularUser — controller/stripe.js:924
 * ruta: routes/stripe.js:245
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new StripeTransaction()`: los campos son los del esquema `models/StripeTransaction.js`
 * status: 201, 500
 */
export interface PostStripeStripeTransactionNoRegularUserBody {
  clientSecret?: string;
  company?: string;
  device?: number;
  eventSelected?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  user?: string;
}

/**
 * `POST /api/stripe/stripe-transaction`
 * handler: saveStripeTransaction — controller/stripe.js:797
 * ruta: routes/stripe.js:208
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new StripeTransaction()`: los campos son los del esquema `models/StripeTransaction.js`
 * status: 201, 500
 */
export interface PostStripeStripeTransactionBody {
  clientSecret?: string;
  company?: string;
  device?: number;
  eventSelected?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  user?: string;
}

/**
 * `GET /api/stripe/stripe-transactions-saved-list`
 * handler: getListOfAllSavedStripeTransaction — controller/stripe.js:1020
 * ruta: routes/stripe.js:184
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetStripeStripeTransactionsSavedListBody {
  clientSecret?: string;
  company?: string;
  device?: number;
  eventSelected?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  user?: string;
}

/**
 * `POST /api/stripe/stripe-transactions-saved-list`
 * handler: getListOfAllSavedStripeTransaction — controller/stripe.js:1020
 * ruta: routes/stripe.js:190
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `StripeTransaction.find()`: cualquier subconjunto de los campos de `models/StripeTransaction.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostStripeStripeTransactionsSavedListBody {
  clientSecret?: string;
  company?: string;
  device?: number;
  eventSelected?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  user?: string;
}

/**
 * `DELETE /api/stripe/subscriptions/:id`
 * handler: cancelSubscriptionCompany — controller/stripe.js:629
 * ruta: routes/stripe.js:308
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteStripeSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/stripe/subscriptions/:id`
 * handler: searchSubscriptions — controller/stripe.js:569
 * ruta: routes/stripe.js:302
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetStripeSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/stripe/transaction`
 * handler: getListOfAllSavedTransaction — controller/transaction.js:159
 * ruta: routes/stripe.js:296
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Transaction.find()`: cualquier subconjunto de los campos de `models/Transaction.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetStripeTransactionBody {
  active?: boolean;
  clientSecret?: string;
  company?: string;
  consumerInfo?: Record<string, unknown>;
  created_at?: number;
  date?: string;
  device?: unknown[];
  eventSelected?: string;
  event_id?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
}

/**
 * `PATCH /api/stripe/updating-subscription/:id`
 * handler: updateSubcriptionInCompanyAccount — controller/stripe.js:585
 * ruta: routes/stripe.js:305
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PatchStripeUpdatingSubscriptionByIdParams {
  id: string;
}

/**
 * `POST /api/subscription/company-subscription`
 * handler: populateSubscriptionCompany — controller/subscription.js:74
 * ruta: routes/subscription.js:30
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostSubscriptionCompanySubscriptionBody {
  companyName?: string;
}

/**
 * `POST /api/subscription/new_subscription_no_trial`
 * handler: createSubscriptionNoTrialPeriod — controller/stripe.js:478
 * ruta: routes/subscription.js:15
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostSubscriptionNewSubscriptionNoTrialBody {
  items?: unknown[];
  period?: string;
  stripeCustomerID?: string;
}

/**
 * `POST /api/subscription/new_subscription`
 * handler: createSubscription — controller/subscription.js:6
 * ruta: routes/subscription.js:12
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Subscription()`: los campos son los del esquema `models/Subscription.js`
 * status: 201, 500
 */
export interface PostSubscriptionNewSubscriptionBody {
  company?: string;
  record?: unknown[];
  stripeCompanyID?: string;
}

/**
 * `GET /api/subscription/search_subscription`
 * handler: searchSubscription — controller/subscription.js:51
 * ruta: routes/subscription.js:21
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Subscription.findOne()`: cualquier subconjunto de los campos de `models/Subscription.js` (`{}` trae todo)
 * status: 200, 404, 500
 */
export interface GetSubscriptionSearchSubscriptionBody {
  company?: string;
  record?: unknown[];
  stripeCompanyID?: string;
}

/**
 * `POST /api/subscription/search_subscription`
 * handler: searchSubscription — controller/subscription.js:51
 * ruta: routes/subscription.js:18
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Subscription.findOne()`: cualquier subconjunto de los campos de `models/Subscription.js` (`{}` trae todo)
 * status: 200, 404, 500
 */
export interface PostSubscriptionSearchSubscriptionBody {
  company?: string;
  record?: unknown[];
  stripeCompanyID?: string;
}

/**
 * `GET /api/subscription/searching-subscription/subscriptions/:id`
 * handler: retrieveSubscriptionID — controller/stripe.js:993
 * ruta: routes/subscription.js:33
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetSubscriptionSearchingSubscriptionSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/subscription/subscriptions/:id`
 * handler: searchingSubscriptionInStripe — controller/stripe.js:1056
 * ruta: routes/subscription.js:27
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetSubscriptionSubscriptionsByIdParams {
  id: string;
}

/**
 * `PATCH /api/subscription/update-subscription/:id`
 * handler: updateSubscription — controller/subscription.js:22
 * ruta: routes/subscription.js:24
 * auth: sin middleware de auth en la ruta
 * status: 200, 404, 500
 */
export interface PatchSubscriptionUpdateSubscriptionByIdBody {
  newSubscriptionData?: string;
}
export interface PatchSubscriptionUpdateSubscriptionByIdParams {
  id: string;
}

/**
 * `POST /api/transaction-audit-log/create-audit`
 * handler: createAuditLog — controller/transactionAuditLog.js:6
 * ruta: routes/transactionAuditLog.js:12
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new TransactionAuditLog()`: los campos son los del esquema `models/TransactionAuditLog.js`
 * status: 201, 500
 */
export interface PostTransactionAuditLogCreateAuditBody {
  actionTaken?: string;
  time?: string;
  transaction?: string;
  user?: string;
}

/**
 * `POST /api/transaction/check-and-release-deposit-transactions`
 * handler: checkingAndReleasingDepositTransactions — controller/transaction.js:282
 * ruta: routes/transaction.js:67
 * auth: staffOnly
 * status: 201, 500
 */
export interface PostTransactionCheckAndReleaseDepositTransactionsBody {
  company?: Record<string, unknown>;
  eventSelected?: string;
}

/**
 * `DELETE /api/transaction/remove-duplicate-transaction/:id`
 * handler: removeDuplicateEntry — controller/transaction.js:237
 * ruta: routes/transaction.js:58
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 409, 500
 */
export interface DeleteTransactionRemoveDuplicateTransactionByIdParams {
  id: string;
}

/**
 * `POST /api/transaction/save-transaction-admin-dashboard`
 * handler: saveTransactionAdmin — controller/transaction.js:79
 * ruta: routes/transaction.js:39
 * auth: staffOnly
 * NOTA: el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js`
 * status: 201, 500
 */
export interface PostTransactionSaveTransactionAdminDashboardBody {
  active?: boolean;
  clientSecret?: string;
  company?: string;
  consumerInfo?: Record<string, unknown>;
  created_at?: number;
  date?: string;
  device?: unknown[];
  eventSelected?: string;
  event_id?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
}

/**
 * `POST /api/transaction/save-transaction-template-no-regular-user`
 * handler: saveTransactionTemplateForNoRegularUser — controller/transaction.js:103
 * ruta: routes/transaction.js:42
 * auth: staffOnly
 * NOTA: el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js`
 * status: 201, 500
 */
export interface PostTransactionSaveTransactionTemplateNoRegularUserBody {
  active?: boolean;
  clientSecret?: string;
  company?: string;
  consumerInfo?: Record<string, unknown>;
  created_at?: number;
  date?: string;
  device?: unknown[];
  eventSelected?: string;
  event_id?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
}

/**
 * `POST /api/transaction/save-transaction`
 * handler: saveTransaction — controller/transaction.js:32
 * ruta: routes/transaction.js:36
 * auth: optionalJWT
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 201, 500
 */
export interface PostTransactionSaveTransactionBody {
  company?: Record<string, unknown>;
  consumerInfo?: string;
  event_id?: string;
  paymentIntent?: string;
}

/**
 * `GET /api/transaction/subscriptions/:id`
 * handler: retrieveSubscriptionID — controller/stripe.js:993
 * ruta: routes/transaction.js:61
 * auth: staffOnly
 * status: 201, 500
 */
export interface GetTransactionSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/transaction/transaction`
 * handler: gettingListOfSavedTransaction — controller/transaction.js:183
 * ruta: routes/transaction.js:52
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 201, 500
 */
export interface GetTransactionTransactionBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/transaction/transaction`
 * handler: getListOfAllSavedTransaction — controller/transaction.js:159
 * ruta: routes/transaction.js:49
 * auth: optionalJWT
 * NOTA: el body se usa como FILTRO Mongo en `Transaction.find()`: cualquier subconjunto de los campos de `models/Transaction.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostTransactionTransactionBody {
  active?: boolean;
  clientSecret?: string;
  company?: string;
  consumerInfo?: Record<string, unknown>;
  created_at?: number;
  date?: string;
  device?: unknown[];
  eventSelected?: string;
  event_id?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
}

/**
 * `POST /api/transaction/update-multiple-documents`
 * handler: updateMultipleDocuments — controller/transaction.js:219
 * ruta: routes/transaction.js:64
 * auth: staffOnly
 * NOTA: el body se usa como FILTRO Mongo en `Transaction.find()`: cualquier subconjunto de los campos de `models/Transaction.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostTransactionUpdateMultipleDocumentsBody {
  active?: boolean;
  clientSecret?: string;
  company?: string;
  consumerInfo?: Record<string, unknown>;
  created_at?: number;
  date?: string;
  device?: unknown[];
  eventSelected?: string;
  event_id?: string;
  find?: string;
  paymentIntent?: string;
  provider?: string;
  type?: string;
  update?: string;
}

/**
 * `PATCH /api/transaction/update-transaction/:id`
 * handler: updateTransaction — controller/transaction.js:126
 * ruta: routes/transaction.js:55
 * auth: staffOnly
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 404, 500
 */
export interface PatchTransactionUpdateTransactionByIdParams {
  id: string;
}

/** Mapa "METHOD /path" -> payload. Útil para un wrapper de fetch tipado. */
export interface ApiEndpoints {
  "DELETE /api/admin/:id": { params: DeleteAdminByIdParams };
  "GET /api/admin/:id": { body: GetAdminByIdBody };
  "GET /api/admin/activity-logs": { query: GetAdminActivityLogsQuery };
  "POST /api/admin/activity-logs": { body: PostAdminActivityLogsBody };
  "PATCH /api/admin/admin-user/:id": { params: PatchAdminAdminUserByIdParams };
  "GET /api/admin/check-online-status/:email": { params: GetAdminCheckOnlineStatusByEmailParams };
  "POST /api/admin/invalidate-all-sessions": {  };
  "POST /api/admin/login": { body: PostAdminLoginBody };
  "POST /api/admin/logout": { body: PostAdminLogoutBody };
  "POST /api/admin/manually_logout": { body: PostAdminManuallyLogoutBody };
  "POST /api/admin/mfa/disable": {  };
  "POST /api/admin/mfa/generate": {  };
  "POST /api/admin/mfa/verify": { body: PostAdminMfaVerifyBody };
  "POST /api/admin/new_admin_user": { body: PostAdminNewAdminUserBody };
  "PATCH /api/admin/profile/:id": { body: PatchAdminProfileByIdBody; params: PatchAdminProfileByIdParams };
  "POST /api/admin/receiver-assignation": { body: PostAdminReceiverAssignationBody };
  "GET /api/admin/receiver-assigned": { body: GetAdminReceiverAssignedBody };
  "PATCH /api/admin/update-password": { body: PatchAdminUpdatePasswordBody };
  "POST /api/admin/users": { body: PostAdminUsersBody };
  "POST /api/admin/verify-password": { body: PostAdminVerifyPasswordBody };
  "POST /api/article/article-creation": { body: PostArticleArticleCreationBody };
  "DELETE /api/article/article-delete/:id": { params: DeleteArticleArticleDeleteByIdParams };
  "PATCH /api/article/article-edit/:id": { params: PatchArticleArticleEditByIdParams };
  "GET /api/article/articles": { body: GetArticleArticlesBody };
  "GET /api/auth/:id": { params: GetAuthByIdParams };
  "PATCH /api/auth/:id": { params: PatchAuthByIdParams };
  "GET /api/auth/all-consumers-based-on-all-events-per-company/:companyID": { params: GetAuthAllConsumersBasedOnAllEventsPerCompanyByCompanyIDParams };
  "POST /api/auth/new": { body: PostAuthNewBody };
  "GET /api/auth/user-query": { body: GetAuthUserQueryBody };
  "POST /api/auth/user-query": {  };
  "POST /api/auth/users": {  };
  "POST /api/auth": { body: PostAuthBody };
  "POST /api/cache_update/remove-cache": { body: PostCacheUpdateRemoveCacheBody };
  "GET /api/cash-report/cash-report": { body: GetCashReportCashReportBody };
  "POST /api/cash-report/cash-reports": { body: PostCashReportCashReportsBody };
  "POST /api/cash-report/create-cash-report": { body: PostCashReportCreateCashReportBody };
  "POST /api/cash-report/remove-cash-report/:id": { params: PostCashReportRemoveCashReportByIdParams };
  "PATCH /api/cash-report/update-cash-report/:id": { body: PatchCashReportUpdateCashReportByIdBody };
  "POST /api/cloudinary/upload-image": { body: PostCloudinaryUploadImageBody };
  "POST /api/company/assign-location": { body: PostCompanyAssignLocationBody };
  "POST /api/company/companies": {  };
  "POST /api/company/consulting-signatures": { body: PostCompanyConsultingSignaturesBody };
  "POST /api/company/consumer-signatures": { body: PostCompanyConsumerSignaturesBody };
  "POST /api/company/event-consumer-signatures": { body: PostCompanyEventConsumerSignaturesBody };
  "POST /api/company/new_provider": { body: PostCompanyNewProviderBody };
  "POST /api/company/new": { body: PostCompanyNewBody };
  "GET /api/company/provider-companies": { query: GetCompanyProviderCompaniesQuery };
  "POST /api/company/provider-company/:id": { body: PostCompanyProviderCompanyByIdBody };
  "POST /api/company/provider-upload-document/:id": { body: PostCompanyProviderUploadDocumentByIdBody; params: PostCompanyProviderUploadDocumentByIdParams };
  "GET /api/company/search-company": { body: GetCompanySearchCompanyBody };
  "POST /api/company/search-company": { body: PostCompanySearchCompanyBody };
  "POST /api/company/signatures-for-consumer-member": { body: PostCompanySignaturesForConsumerMemberBody };
  "POST /api/company/signatures": { body: PostCompanySignaturesBody };
  "PATCH /api/company/update_provider/:id": { body: PatchCompanyUpdateProviderByIdBody; params: PatchCompanyUpdateProviderByIdParams };
  "PATCH /api/company/update-company/:id": { params: PatchCompanyUpdateCompanyByIdParams };
  "PATCH /api/company/update-company/register-process/:id": { params: PatchCompanyUpdateCompanyRegisterProcessByIdParams };
  "PATCH /api/company/update-signatures": { body: PatchCompanyUpdateSignaturesBody };
  "POST /api/consumer/stripe/create-customer": { body: PostConsumerStripeCreateCustomerBody };
  "POST /api/consumer/stripe/find-customer": { body: PostConsumerStripeFindCustomerBody };
  "POST /api/consumer/users": {  };
  "DELETE /api/db_company/:id": { body: DeleteDbCompanyByIdBody };
  "DELETE /api/db_company/categories/:category_id": { body: DeleteDbCompanyCategoriesByCategoryIdBody; params: DeleteDbCompanyCategoriesByCategoryIdParams };
  "POST /api/db_company/categories/upsert": { body: PostDbCompanyCategoriesUpsertBody };
  "POST /api/db_company/categories": { body: PostDbCompanyCategoriesBody };
  "GET /api/db_company/check-company-exists": { body: GetDbCompanyCheckCompanyExistsBody };
  "POST /api/db_company/check-item": { body: PostDbCompanyCheckItemBody };
  "POST /api/db_company/companies_information": {  };
  "POST /api/db_company/company-inventory-grouped-full": { body: PostDbCompanyCompanyInventoryGroupedFullBody };
  "POST /api/db_company/company-inventory-pagination": { query: PostDbCompanyCompanyInventoryPaginationQuery };
  "POST /api/db_company/company-inventory-structure": { body: PostDbCompanyCompanyInventoryStructureBody };
  "POST /api/db_company/company-inventory-with-current-warehouse-status": { body: PostDbCompanyCompanyInventoryWithCurrentWarehouseStatusBody };
  "POST /api/db_company/consulting-company": { body: PostDbCompanyConsultingCompanyBody };
  "GET /api/db_company/current-inventory/:company_id": { params: GetDbCompanyCurrentInventoryByCompanyIdParams };
  "POST /api/db_company/delete-bulk-items": { body: PostDbCompanyDeleteBulkItemsBody };
  "POST /api/db_company/filter-suppliers-info-items": { body: PostDbCompanyFilterSuppliersInfoItemsBody };
  "POST /api/db_company/get-grouped-inventory-by-search-parameter": { body: PostDbCompanyGetGroupedInventoryBySearchParameterBody };
  "POST /api/db_company/get-inventory-company": { body: PostDbCompanyGetInventoryCompanyBody };
  "POST /api/db_company/get-location-item-types-hierarchy": { body: PostDbCompanyGetLocationItemTypesHierarchyBody };
  "DELETE /api/db_company/groups/:group_id": { body: DeleteDbCompanyGroupsByGroupIdBody; params: DeleteDbCompanyGroupsByGroupIdParams };
  "POST /api/db_company/groups/upsert": { body: PostDbCompanyGroupsUpsertBody };
  "POST /api/db_company/groups": { body: PostDbCompanyGroupsBody };
  "POST /api/db_company/industry": {  };
  "POST /api/db_company/insert-new-single-item": { body: PostDbCompanyInsertNewSingleItemBody };
  "POST /api/db_company/inventory-based-on-location-and-sublocation": { body: PostDbCompanyInventoryBasedOnLocationAndSublocationBody; query: PostDbCompanyInventoryBasedOnLocationAndSublocationQuery };
  "POST /api/db_company/inventory-based-on-submitted-parameters": { body: PostDbCompanyInventoryBasedOnSubmittedParametersBody };
  "POST /api/db_company/inventory-query": { body: PostDbCompanyInventoryQueryBody };
  "POST /api/db_company/locations": { body: PostDbCompanyLocationsBody };
  "POST /api/db_company/new_company": { body: PostDbCompanyNewCompanyBody };
  "POST /api/db_company/retrieve-company-inventory": { body: PostDbCompanyRetrieveCompanyInventoryBody };
  "POST /api/db_company/retrieve-company-items-with-locations": { body: PostDbCompanyRetrieveCompanyItemsWithLocationsBody };
  "POST /api/db_company/return-event-devices": { body: PostDbCompanyReturnEventDevicesBody };
  "POST /api/db_company/returning-leased-equipment": { body: PostDbCompanyReturningLeasedEquipmentBody };
  "GET /api/db_company/search-inventory": { body: GetDbCompanySearchInventoryBody };
  "POST /api/db_company/search-inventory": { body: PostDbCompanySearchInventoryBody };
  "POST /api/db_company/update_company": { body: PostDbCompanyUpdateCompanyBody };
  "POST /api/db_company/update-all-items-in-inventory": { body: PostDbCompanyUpdateAllItemsInInventoryBody };
  "POST /api/db_company/update-content-in-container": { body: PostDbCompanyUpdateContentInContainerBody };
  "POST /api/db_company/update-group-items": { body: PostDbCompanyUpdateGroupItemsBody };
  "POST /api/db_company/update-items-based-on-alphanumeric-serial-number": {  };
  "POST /api/db_company/update-items-based-on-serial-number": { body: PostDbCompanyUpdateItemsBasedOnSerialNumberBody };
  "POST /api/db_consumer_attending_event_record/consulting-consumer-event": {  };
  "POST /api/db_consumer_attending_event_record/consumer-events": { body: PostDbConsumerAttendingEventRecordConsumerEventsBody };
  "POST /api/db_consumer_attending_event_record/new_consumer_event": { body: PostDbConsumerAttendingEventRecordNewConsumerEventBody };
  "DELETE /api/db_consumer/:id": {  };
  "POST /api/db_consumer/consulting-consumer": { body: PostDbConsumerConsultingConsumerBody };
  "POST /api/db_consumer/consumers_information": {  };
  "POST /api/db_consumer/new_consumer": { body: PostDbConsumerNewConsumerBody };
  "DELETE /api/db_event/:id": { params: DeleteDbEventByIdParams };
  "POST /api/db_event/allocate-device-container-event": { body: PostDbEventAllocateDeviceContainerEventBody };
  "POST /api/db_event/allocate-device-event": { body: PostDbEventAllocateDeviceEventBody };
  "POST /api/db_event/confirm-item-return": { body: PostDbEventConfirmItemReturnBody };
  "POST /api/db_event/consulting-event": { body: PostDbEventConsultingEventBody };
  "POST /api/db_event/device-final-status-refactored": { body: PostDbEventDeviceFinalStatusRefactoredBody };
  "POST /api/db_event/device-final-status": { body: PostDbEventDeviceFinalStatusBody };
  "POST /api/db_event/event_device_directly": { body: PostDbEventEventDeviceDirectlyBody };
  "POST /api/db_event/event_device": {  };
  "POST /api/db_event/event_staff": { body: PostDbEventEventStaffBody };
  "POST /api/db_event/event-count/close": { body: PostDbEventEventCountCloseBody };
  "POST /api/db_event/event-count/reconcile": { body: PostDbEventEventCountReconcileBody };
  "GET /api/db_event/event-inventory/:id": { params: GetDbEventEventInventoryByIdParams };
  "POST /api/db_event/event-inventory/:id": { params: PostDbEventEventInventoryByIdParams };
  "POST /api/db_event/events_company": {  };
  "POST /api/db_event/events_information": { body: PostDbEventEventsInformationBody };
  "POST /api/db_event/inserting-items-in-event-from-container": { body: PostDbEventInsertingItemsInEventFromContainerBody };
  "POST /api/db_event/inventory-based-on-submitted-parameters": { body: PostDbEventInventoryBasedOnSubmittedParametersBody };
  "POST /api/db_event/inventory-query": { body: PostDbEventInventoryQueryBody };
  "POST /api/db_event/lock-items-for-event": { body: PostDbEventLockItemsForEventBody };
  "POST /api/db_event/new_event": { body: PostDbEventNewEventBody };
  "POST /api/db_event/remove-item-inventory-event": { body: PostDbEventRemoveItemInventoryEventBody };
  "POST /api/db_event/remove-reserved-items-for-event": { body: PostDbEventRemoveReservedItemsForEventBody };
  "POST /api/db_event/reserve-items-for-event": { body: PostDbEventReserveItemsForEventBody };
  "POST /api/db_event/retrieve-item-group-location-quantity": { body: PostDbEventRetrieveItemGroupLocationQuantityBody };
  "POST /api/db_event/retrieve-item-group-quantity-with-format": {  };
  "POST /api/db_event/retrieve-item-location-quantity-full-details": { body: PostDbEventRetrieveItemLocationQuantityFullDetailsBody };
  "POST /api/db_event/retrieve-item-location-quantity": { body: PostDbEventRetrieveItemLocationQuantityBody };
  "POST /api/db_event/return-event-devices": { body: PostDbEventReturnEventDevicesBody };
  "POST /api/db_event/returning-item-refactored": { body: PostDbEventReturningItemRefactoredBody };
  "POST /api/db_event/returning-item": { body: PostDbEventReturningItemBody };
  "POST /api/db_event/update-event/:event_id": { body: PostDbEventUpdateEventByEventIdBody; params: PostDbEventUpdateEventByEventIdParams };
  "POST /api/db_event/update-item-in-table-after-being-added-to-event-from-container": { body: PostDbEventUpdateItemInTableAfterBeingAddedToEventFromContainerBody };
  "POST /api/db_event/update-status-item-based-on-event": { body: PostDbEventUpdateStatusItemBasedOnEventBody };
  "POST /api/db_identifier/by-items": { body: PostDbIdentifierByItemsBody };
  "POST /api/db_identifier/register-bulk": { body: PostDbIdentifierRegisterBulkBody };
  "POST /api/db_identifier/register": { body: PostDbIdentifierRegisterBody };
  "POST /api/db_inventory/check-item": { body: PostDbInventoryCheckItemBody };
  "POST /api/db_inventory/check-large-data": { body: PostDbInventoryCheckLargeDataBody };
  "GET /api/db_inventory/container-items/:container_item_id": { params: GetDbInventoryContainerItemsByContainerItemIdParams };
  "POST /api/db_inventory/container-items": { body: PostDbInventoryContainerItemsBody };
  "DELETE /api/db_inventory/container/:container_item_id": { params: DeleteDbInventoryContainerByContainerItemIdParams };
  "PUT /api/db_inventory/container/:container_item_id": { body: PutDbInventoryContainerByContainerItemIdBody; params: PutDbInventoryContainerByContainerItemIdParams };
  "POST /api/db_inventory/update-large-data": {  };
  "POST /api/db_inventory/update-location-sub-location": { body: PostDbInventoryUpdateLocationSubLocationBody };
  "POST /api/db_item/:id(\\d+)": { body: PostDbItemByIdDBody };
  "POST /api/db_item/bulk-item-alphanumeric": { body: PostDbItemBulkItemAlphanumericBody };
  "POST /api/db_item/bulk-item-from-spreadsheet": { body: PostDbItemBulkItemFromSpreadsheetBody };
  "POST /api/db_item/bulk-item": { body: PostDbItemBulkItemBody };
  "GET /api/db_item/check-company-has-inventory": { body: GetDbItemCheckCompanyHasInventoryBody };
  "GET /api/db_item/check-inventory/:company_id": { params: GetDbItemCheckInventoryByCompanyIdParams };
  "POST /api/db_item/check-item": { body: PostDbItemCheckItemBody };
  "POST /api/db_item/consulting-item": { body: PostDbItemConsultingItemBody };
  "POST /api/db_item/consulting-row-item-assigned-event": { body: PostDbItemConsultingRowItemAssignedEventBody };
  "POST /api/db_item/current-inventory": { body: PostDbItemCurrentInventoryBody };
  "POST /api/db_item/delete-bulk-items-criteria": { body: PostDbItemDeleteBulkItemsCriteriaBody };
  "POST /api/db_item/delete-bulk-items": { body: PostDbItemDeleteBulkItemsBody };
  "POST /api/db_item/delete-item": { body: PostDbItemDeleteItemBody };
  "POST /api/db_item/edit-item": { body: PostDbItemEditItemBody };
  "PUT /api/db_item/event-items/bulk-update": {  };
  "POST /api/db_item/event-items/search": { body: PostDbItemEventItemsSearchBody };
  "DELETE /api/db_item/event-items": { body: DeleteDbItemEventItemsBody };
  "PUT /api/db_item/event-items": { body: PutDbItemEventItemsBody };
  "GET /api/db_item/fragment-data": { body: GetDbItemFragmentDataBody };
  "POST /api/db_item/get-inventory-company": { body: PostDbItemGetInventoryCompanyBody };
  "POST /api/db_item/inventory_event/:id": { params: PostDbItemInventoryEventByIdParams };
  "POST /api/db_item/inventory-based-on-location-and-sublocation": { body: PostDbItemInventoryBasedOnLocationAndSublocationBody; query: PostDbItemInventoryBasedOnLocationAndSublocationQuery };
  "POST /api/db_item/inventory-based-on-submitted-parameters": { body: PostDbItemInventoryBasedOnSubmittedParametersBody };
  "POST /api/db_item/inventory-export": { body: PostDbItemInventoryExportBody };
  "POST /api/db_item/inventory-facets": { body: PostDbItemInventoryFacetsBody };
  "POST /api/db_item/inventory-page": { body: PostDbItemInventoryPageBody };
  "POST /api/db_item/inventory-pagination": { query: PostDbItemInventoryPaginationQuery };
  "POST /api/db_item/inventory-query": { body: PostDbItemInventoryQueryBody };
  "POST /api/db_item/item-out-warehouse": { body: PostDbItemItemOutWarehouseBody };
  "POST /api/db_item/items_information": {  };
  "GET /api/db_item/location-count": { body: GetDbItemLocationCountBody };
  "POST /api/db_item/new_item": { body: PostDbItemNewItemBody };
  "POST /api/db_item/retrieve-item-data": { body: PostDbItemRetrieveItemDataBody };
  "POST /api/db_item/retrieve-item-location-quantity": { body: PostDbItemRetrieveItemLocationQuantityBody };
  "POST /api/db_item/return-event-devices": { body: PostDbItemReturnEventDevicesBody };
  "POST /api/db_item/returning-item-refactored": { body: PostDbItemReturningItemRefactoredBody };
  "GET /api/db_item/search-inventory": { body: GetDbItemSearchInventoryBody };
  "POST /api/db_item/search-inventory": { body: PostDbItemSearchInventoryBody };
  "GET /api/db_item/serial-suggest": { query: GetDbItemSerialSuggestQuery };
  "POST /api/db_item/tracking_item/:id": { params: PostDbItemTrackingItemByIdParams };
  "POST /api/db_item/warehouse-items": { body: PostDbItemWarehouseItemsBody };
  "POST /api/db_lease/consulting-consumer-lease": { body: PostDbLeaseConsultingConsumerLeaseBody };
  "POST /api/db_lease/consulting-lease": { body: PostDbLeaseConsultingLeaseBody };
  "POST /api/db_lease/delete-consumer-lease-info": { body: PostDbLeaseDeleteConsumerLeaseInfoBody };
  "POST /api/db_lease/delete-lease-info": { body: PostDbLeaseDeleteLeaseInfoBody };
  "POST /api/db_lease/new-consumer-lease": { body: PostDbLeaseNewConsumerLeaseBody };
  "POST /api/db_lease/new-lease": { body: PostDbLeaseNewLeaseBody };
  "POST /api/db_lease/status": { body: PostDbLeaseStatusBody };
  "POST /api/db_lease/update-consumer-lease-info": {  };
  "POST /api/db_lease/update-lease-info": {  };
  "GET /api/db_location/companies/:company_id/location-paths-tree": { params: GetDbLocationCompaniesByCompanyIdLocationPathsTreeParams };
  "GET /api/db_location/companies/:company_id/locations/tree": { params: GetDbLocationCompaniesByCompanyIdLocationsTreeParams };
  "GET /api/db_location/companies/:id/locations": { params: GetDbLocationCompaniesByIdLocationsParams };
  "POST /api/db_location/companies/:id/locations": { params: PostDbLocationCompaniesByIdLocationsParams };
  "PUT /api/db_location/locations/:id/inventory": { body: PutDbLocationLocationsByIdInventoryBody; params: PutDbLocationLocationsByIdInventoryParams };
  "POST /api/db_location/locations/:id": { params: PostDbLocationLocationsByIdParams };
  "POST /api/db_location/locations": { body: PostDbLocationLocationsBody };
  "POST /api/db_location/sub-location-path/delete": { body: PostDbLocationSubLocationPathDeleteBody };
  "POST /api/db_location/sub-location-path": { body: PostDbLocationSubLocationPathBody };
  "POST /api/db_member/bulk-members": { body: PostDbMemberBulkMembersBody };
  "POST /api/db_member/bulk-return": { body: PostDbMemberBulkReturnBody };
  "POST /api/db_member/consulting-member": {  };
  "POST /api/db_member/delete-member-assigned-device-lease": { body: PostDbMemberDeleteMemberAssignedDeviceLeaseBody };
  "POST /api/db_member/delete-member-info": { body: PostDbMemberDeleteMemberInfoBody };
  "POST /api/db_member/member-fees": { body: PostDbMemberMemberFeesBody };
  "POST /api/db_member/my-devices": { body: PostDbMemberMyDevicesBody };
  "POST /api/db_member/new-member-assigned-device-lease": { body: PostDbMemberNewMemberAssignedDeviceLeaseBody };
  "POST /api/db_member/new-member": { body: PostDbMemberNewMemberBody };
  "POST /api/db_member/overdue-leases": { body: PostDbMemberOverdueLeasesBody };
  "POST /api/db_member/remove-row-lease-member": { body: PostDbMemberRemoveRowLeaseMemberBody };
  "POST /api/db_member/retrieve-members-assigned-devices": { body: PostDbMemberRetrieveMembersAssignedDevicesBody };
  "POST /api/db_member/settle-member-fee": { body: PostDbMemberSettleMemberFeeBody };
  "POST /api/db_member/update-member-assigned-device-lease": { body: PostDbMemberUpdateMemberAssignedDeviceLeaseBody };
  "PATCH /api/db_member/update-member-info": { body: PatchDbMemberUpdateMemberInfoBody };
  "POST /api/db_record/checking-lease-information": { body: PostDbRecordCheckingLeaseInformationBody };
  "POST /api/db_record/checking": { body: PostDbRecordCheckingBody };
  "POST /api/db_record/inserting-record-refactored": { body: PostDbRecordInsertingRecordRefactoredBody };
  "POST /api/db_record/inserting-record": { body: PostDbRecordInsertingRecordBody };
  "POST /api/db_record/removing-row-item-event-record": { body: PostDbRecordRemovingRowItemEventRecordBody };
  "DELETE /api/db_shipment/:shipment_id": { params: DeleteDbShipmentByShipmentIdParams };
  "PUT /api/db_shipment/:shipment_id": { params: PutDbShipmentByShipmentIdParams };
  "POST /api/db_shipment/package-list": { body: PostDbShipmentPackageListBody };
  "POST /api/db_shipment/search": { body: PostDbShipmentSearchBody };
  "POST /api/db_shipment": { body: PostDbShipmentBody };
  "POST /api/db_staff/company-staff/permissions": { body: PostDbStaffCompanyStaffPermissionsBody };
  "PATCH /api/db_staff/company-staff/role": { body: PatchDbStaffCompanyStaffRoleBody };
  "PUT /api/db_staff/company-staff/scope": { body: PutDbStaffCompanyStaffScopeBody };
  "PATCH /api/db_staff/company-staff": { body: PatchDbStaffCompanyStaffBody };
  "POST /api/db_staff/company-staff": { body: PostDbStaffCompanyStaffBody };
  "POST /api/db_staff/consulting-member": { body: PostDbStaffConsultingMemberBody };
  "POST /api/db_staff/new_member": { body: PostDbStaffNewMemberBody };
  "POST /api/db_stripe/consulting-stripe": { body: PostDbStripeConsultingStripeBody };
  "POST /api/db_stripe/new_stripe": { body: PostDbStripeNewStripeBody };
  "GET /api/db_sub_location/locations/:location_id/sub-locations": { params: GetDbSubLocationLocationsByLocationIdSubLocationsParams };
  "DELETE /api/db_sub_location/sub-locations/:id": { params: DeleteDbSubLocationSubLocationsByIdParams };
  "PUT /api/db_sub_location/sub-locations/:id": { body: PutDbSubLocationSubLocationsByIdBody; params: PutDbSubLocationSubLocationsByIdParams };
  "POST /api/db_sub_location/sub-locations/check": { body: PostDbSubLocationSubLocationsCheckBody };
  "POST /api/db_sub_location/sub-locations": { body: PostDbSubLocationSubLocationsBody };
  "PATCH /api/devitrak/:id": { body: PatchDevitrakByIdBody; params: PatchDevitrakByIdParams };
  "POST /api/devitrak/new_acceptance": { body: PostDevitrakNewAcceptanceBody };
  "DELETE /api/document/:id": { params: DeleteDocumentByIdParams };
  "GET /api/document/:id": { params: GetDocumentByIdParams };
  "PATCH /api/document/:id": { body: PatchDocumentByIdBody };
  "PUT /api/document/:id": { body: PutDocumentByIdBody };
  "GET /api/document/download/:documentId/:userId": { params: GetDocumentDownloadByDocumentIdByUserIdParams };
  "POST /api/document/download/documentUrl": { body: PostDocumentDownloadDocumentUrlBody };
  "DELETE /api/document/folder/:id": {  };
  "PUT /api/document/folder/:id": { body: PutDocumentFolderByIdBody };
  "POST /api/document/folders": { body: PostDocumentFoldersBody };
  "POST /api/document/new_folder": { body: PostDocumentNewFolderBody };
  "GET /api/document/triggers": { query: GetDocumentTriggersQuery };
  "GET /api/document/types": { query: GetDocumentTypesQuery };
  "POST /api/document/upload/xlsx": { body: PostDocumentUploadXlsxBody };
  "POST /api/document/upload": { body: PostDocumentUploadBody };
  "POST /api/document/verification/consumer_member/check_signed_document": { body: PostDocumentVerificationConsumerMemberCheckSignedDocumentBody };
  "POST /api/document/verification/consumer_member/signed_document": { body: PostDocumentVerificationConsumerMemberSignedDocumentBody };
  "PATCH /api/document/verification/consumer_member/signing_document": { body: PatchDocumentVerificationConsumerMemberSigningDocumentBody };
  "POST /api/document/verification/member/check_signed_document": { body: PostDocumentVerificationMemberCheckSignedDocumentBody };
  "POST /api/document/verification/member/signed_document": { body: PostDocumentVerificationMemberSignedDocumentBody };
  "PATCH /api/document/verification/member/signing_document": { body: PatchDocumentVerificationMemberSigningDocumentBody };
  "POST /api/document/verification/staff_member/check_signed_document": { body: PostDocumentVerificationStaffMemberCheckSignedDocumentBody };
  "POST /api/document/verification/staff_member/signed_document": { body: PostDocumentVerificationStaffMemberSignedDocumentBody };
  "PATCH /api/document/verification/staff_member/signing_document": { body: PatchDocumentVerificationStaffMemberSigningDocumentBody };
  "GET /api/document": { query: GetDocumentQuery };
  "POST /api/error_log/error_log": { body: PostErrorLogErrorLogBody };
  "POST /api/event-log/feed-event-log": {  };
  "GET /api/event/all-users-and-transactions-per-event": { body: GetEventAllUsersAndTransactionsPerEventBody };
  "POST /api/event/create-event": { body: PostEventCreateEventBody };
  "DELETE /api/event/delete-event/:id": { params: DeleteEventDeleteEventByIdParams };
  "PATCH /api/event/edit-event/:id": { params: PatchEventEditEventByIdParams };
  "PUT /api/event/edit-event/:id": { params: PutEventEditEventByIdParams };
  "PATCH /api/event/edit-staff-event/:id": { params: PatchEventEditStaffEventByIdParams };
  "GET /api/event/event-inventory-based-on-period": { query: GetEventEventInventoryBasedOnPeriodQuery };
  "GET /api/event/event-list-per-company": { body: GetEventEventListPerCompanyBody };
  "GET /api/event/event-list": { body: GetEventEventListBody };
  "POST /api/event/event-list": { body: PostEventEventListBody };
  "GET /api/event/event-staff-detail/:id": { params: GetEventEventStaffDetailByIdParams };
  "POST /api/event/staff-all-events": { body: PostEventStaffAllEventsBody };
  "POST /api/event/update-event-inventory-freshest-data": { body: PostEventUpdateEventInventoryFreshestDataBody };
  "PATCH /api/event/update-events": { body: PatchEventUpdateEventsBody };
  "POST /api/event/update-global-state": { body: PostEventUpdateGlobalStateBody };
  "POST /api/feedback/new-feedback": { body: PostFeedbackNewFeedbackBody };
  "POST /api/heavy-task/process": {  };
  "POST /api/image/images": { body: PostImageImagesBody };
  "POST /api/image/new_image": { body: PostImageNewImageBody };
  "POST /api/inventory/create-inventory": { body: PostInventoryCreateInventoryBody };
  "DELETE /api/inventory/delete-inventory/:id": { params: DeleteInventoryDeleteInventoryByIdParams };
  "PATCH /api/inventory/edit-inventory/:id": { params: PatchInventoryEditInventoryByIdParams };
  "POST /api/item/create-item": { body: PostItemCreateItemBody };
  "DELETE /api/item/delete-item/:id": { params: DeleteItemDeleteItemByIdParams };
  "PATCH /api/item/edit-item/:id": { params: PatchItemEditItemByIdParams };
  "GET /api/item/list-items": { body: GetItemListItemsBody };
  "POST /api/item/list-items": { body: PostItemListItemsBody };
  "GET /api/jobs/:jobId": { params: GetJobsByJobIdParams };
  "GET /api/jobs/owned/:jobId": { params: GetJobsOwnedByJobIdParams };
  "POST /api/lease/create-lease": { body: PostLeaseCreateLeaseBody };
  "DELETE /api/lease/delete-lease/:id": { params: DeleteLeaseDeleteLeaseByIdParams };
  "PATCH /api/lease/edit-lease/:id": { params: PatchLeaseEditLeaseByIdParams };
  "GET /api/lease/lease-list": { body: GetLeaseLeaseListBody };
  "POST /api/lease/lease-list": { body: PostLeaseLeaseListBody };
  "POST /api/nodemailer/assignig-device-notification": { body: PostNodemailerAssignigDeviceNotificationBody };
  "POST /api/nodemailer/branding-preview": { body: PostNodemailerBrandingPreviewBody };
  "POST /api/nodemailer/completed-task-notification": {  };
  "POST /api/nodemailer/confirm-returned-device-notification": { body: PostNodemailerConfirmReturnedDeviceNotificationBody };
  "POST /api/nodemailer/confirmation-account": { body: PostNodemailerConfirmationAccountBody };
  "POST /api/nodemailer/consumer-lease-return-device-notification": { body: PostNodemailerConsumerLeaseReturnDeviceNotificationBody };
  "POST /api/nodemailer/customize-message-notification": { body: PostNodemailerCustomizeMessageNotificationBody };
  "POST /api/nodemailer/customized-notification": { body: PostNodemailerCustomizedNotificationBody };
  "POST /api/nodemailer/deposit-collected-notification": { body: PostNodemailerDepositCollectedNotificationBody };
  "POST /api/nodemailer/deposit-return-notification": { body: PostNodemailerDepositReturnNotificationBody };
  "POST /api/nodemailer/device-report-per-transaction": { body: PostNodemailerDeviceReportPerTransactionBody };
  "POST /api/nodemailer/early-remind-notification": { body: PostNodemailerEarlyRemindNotificationBody };
  "POST /api/nodemailer/edit-device-admin": { body: PostNodemailerEditDeviceAdminBody };
  "POST /api/nodemailer/event-staff-notification": { body: PostNodemailerEventStaffNotificationBody };
  "POST /api/nodemailer/events-begin-reminder": { body: PostNodemailerEventsBeginReminderBody };
  "POST /api/nodemailer/failed-task-notification": {  };
  "POST /api/nodemailer/feedback-email-notification": { body: PostNodemailerFeedbackEmailNotificationBody };
  "POST /api/nodemailer/forcing-revoking-active-session": { body: PostNodemailerForcingRevokingActiveSessionBody };
  "POST /api/nodemailer/internal-single-email-notification": { body: PostNodemailerInternalSingleEmailNotificationBody };
  "POST /api/nodemailer/invoice-notification": { body: PostNodemailerInvoiceNotificationBody };
  "POST /api/nodemailer/leased-equip-staff-notification": { body: PostNodemailerLeasedEquipStaffNotificationBody };
  "POST /api/nodemailer/liability-contract-consumer-email-notification": { body: PostNodemailerLiabilityContractConsumerEmailNotificationBody };
  "POST /api/nodemailer/liability-contract-email-notification": { body: PostNodemailerLiabilityContractEmailNotificationBody };
  "POST /api/nodemailer/liability-contract-member-email-notification": { body: PostNodemailerLiabilityContractMemberEmailNotificationBody };
  "POST /api/nodemailer/login-existing-consumer": { body: PostNodemailerLoginExistingConsumerBody };
  "POST /api/nodemailer/lost-device-fee-notification": { body: PostNodemailerLostDeviceFeeNotificationBody };
  "POST /api/nodemailer/massive-event-customer-notification": {  };
  "POST /api/nodemailer/member-device-fee-receipt-notification": { body: PostNodemailerMemberDeviceFeeReceiptNotificationBody };
  "POST /api/nodemailer/member-device-incident-notification": { body: PostNodemailerMemberDeviceIncidentNotificationBody };
  "POST /api/nodemailer/member-email-notification": { body: PostNodemailerMemberEmailNotificationBody };
  "POST /api/nodemailer/member-lease-return-device-notification": { body: PostNodemailerMemberLeaseReturnDeviceNotificationBody };
  "POST /api/nodemailer/new_invitation": { body: PostNodemailerNewInvitationBody };
  "POST /api/nodemailer/refund-notification": { body: PostNodemailerRefundNotificationBody };
  "POST /api/nodemailer/reset-admin-password": { body: PostNodemailerResetAdminPasswordBody };
  "POST /api/nodemailer/returned-items-to-renter-notification": { body: PostNodemailerReturnedItemsToRenterNotificationBody };
  "POST /api/nodemailer/send-consumer-app-instructions": { body: PostNodemailerSendConsumerAppInstructionsBody };
  "POST /api/nodemailer/single-email-notification": { body: PostNodemailerSingleEmailNotificationBody };
  "POST /api/nodemailer/staff_internal_notification": { body: PostNodemailerStaffInternalNotificationBody };
  "POST /api/nodemailer/terms-and-conditions-acceptance": { body: PostNodemailerTermsAndConditionsAcceptanceBody };
  "POST /api/notificationlog/notification-feed-log": {  };
  "POST /api/post/new-post": { body: PostPostNewPostBody };
  "DELETE /api/post/post-delete/:id": { params: DeletePostPostDeleteByIdParams };
  "PATCH /api/post/post-update/:id": { params: PatchPostPostUpdateByIdParams };
  "GET /api/post/posts": { body: GetPostPostsBody };
  "POST /api/post/posts": { body: PostPostPostsBody };
  "POST /api/receiver/all-transaction-by-event-and-consumer": { body: PostReceiverAllTransactionByEventAndConsumerBody };
  "POST /api/receiver/create-bulk-item-transaction-in-user": { body: PostReceiverCreateBulkItemTransactionInUserBody };
  "POST /api/receiver/delete-bulk-devices-pool": { body: PostReceiverDeleteBulkDevicesPoolBody };
  "DELETE /api/receiver/delete-device-pool/:id": { params: DeleteReceiverDeleteDevicePoolByIdParams };
  "GET /api/receiver/list-receiver-returned-issue": { body: GetReceiverListReceiverReturnedIssueBody };
  "POST /api/receiver/list-receiver-returned-issue": { body: PostReceiverListReceiverReturnedIssueBody };
  "POST /api/receiver/receiver-assignation": { body: PostReceiverReceiverAssignationBody };
  "POST /api/receiver/receiver-assigned-list": { body: PostReceiverReceiverAssignedListBody };
  "POST /api/receiver/receiver-assigned-users-list": { body: PostReceiverReceiverAssignedUsersListBody };
  "POST /api/receiver/receiver-assigned": { body: PostReceiverReceiverAssignedBody };
  "DELETE /api/receiver/receiver-pool-device/:id": { params: DeleteReceiverReceiverPoolDeviceByIdParams };
  "GET /api/receiver/receiver-pool-list": { body: GetReceiverReceiverPoolListBody };
  "POST /api/receiver/receiver-pool-list": { body: PostReceiverReceiverPoolListBody };
  "PATCH /api/receiver/receiver-returned-issue/:id": { params: PatchReceiverReceiverReturnedIssueByIdParams };
  "POST /api/receiver/receiver-returned-issue": { body: PostReceiverReceiverReturnedIssueBody };
  "PATCH /api/receiver/receiver-update/:id": { body: PatchReceiverReceiverUpdateByIdBody };
  "PUT /api/receiver/receiver-update/:id": { body: PutReceiverReceiverUpdateByIdBody };
  "POST /api/receiver/receivers-pool-bulk": { body: PostReceiverReceiversPoolBulkBody };
  "PATCH /api/receiver/receivers-pool-update-bulk": { body: PatchReceiverReceiversPoolUpdateBulkBody };
  "PATCH /api/receiver/receivers-pool-update/:id": { params: PatchReceiverReceiversPoolUpdateByIdParams };
  "POST /api/receiver/receivers-pool": { body: PostReceiverReceiversPoolBody };
  "DELETE /api/receiver/remove-transaction/:id": { params: DeleteReceiverRemoveTransactionByIdParams };
  "PATCH /api/receiver/transaction-all-items-returned-at-once": { body: PatchReceiverTransactionAllItemsReturnedAtOnceBody };
  "PATCH /api/receiver/transaction-return-all-items-in-pool": { body: PatchReceiverTransactionReturnAllItemsInPoolBody };
  "PATCH /api/receiver/update-bulk-items-in-pool": { body: PatchReceiverUpdateBulkItemsInPoolBody };
  "PATCH /api/receiver/update-bulk-items-in-transaction": { body: PatchReceiverUpdateBulkItemsInTransactionBody };
  "POST /api/registration/accept-invitation": {  };
  "POST /api/registration/add-company": { body: PostRegistrationAddCompanyBody };
  "POST /api/registration/new": { body: PostRegistrationNewBody };
  "POST /api/school/consent/list": { body: PostSchoolConsentListBody };
  "POST /api/school/consent/public/respond": { body: PostSchoolConsentPublicRespondBody };
  "POST /api/school/consent/public/retrieve": {  };
  "POST /api/school/consent/record": { body: PostSchoolConsentRecordBody };
  "POST /api/school/consent/request": { body: PostSchoolConsentRequestBody };
  "POST /api/school/consent/resend": { body: PostSchoolConsentResendBody };
  "POST /api/school/consent/status": { body: PostSchoolConsentStatusBody };
  "POST /api/school/consent": { body: PostSchoolConsentBody };
  "POST /api/school/dashboard": { body: PostSchoolDashboardBody };
  "POST /api/school/event-invitations/confirm": {  };
  "POST /api/school/event-invitations/response": { body: PostSchoolEventInvitationsResponseBody };
  "POST /api/school/event-invitations/send": { body: PostSchoolEventInvitationsSendBody };
  "POST /api/school/guardians/add": { body: PostSchoolGuardiansAddBody };
  "POST /api/school/guardians/search": { body: PostSchoolGuardiansSearchBody };
  "POST /api/school/guardians": { body: PostSchoolGuardiansBody };
  "POST /api/school/reminders/resume": { body: PostSchoolRemindersResumeBody };
  "POST /api/school/reminders/stop": { body: PostSchoolRemindersStopBody };
  "POST /api/school/roster": { body: PostSchoolRosterBody };
  "POST /api/school/settings/consent-enforcement": { body: PostSchoolSettingsConsentEnforcementBody };
  "POST /api/school/settings": { body: PostSchoolSettingsBody };
  "POST /api/school/student/access-log": { body: PostSchoolStudentAccessLogBody };
  "POST /api/school/student/erase": { body: PostSchoolStudentEraseBody };
  "POST /api/school/student/export": { body: PostSchoolStudentExportBody };
  "GET /api/search/advance_searching_query": { query: GetSearchAdvanceSearchingQueryQuery };
  "GET /api/search/searching_consumer": { query: GetSearchSearchingConsumerQuery };
  "GET /api/search/searching_device_transaction": { query: GetSearchSearchingDeviceTransactionQuery };
  "GET /api/search/searching_events": { query: GetSearchSearchingEventsQuery };
  "GET /api/search/searching_": { query: GetSearchSearchingQuery };
  "GET /api/search/searching_previous_consumer": { query: GetSearchSearchingPreviousConsumerQuery };
  "GET /api/search/searching_staff": { query: GetSearchSearchingStaffQuery };
  "GET /api/staff-activity-log": { query: GetStaffActivityLogQuery };
  "POST /api/staff/__staff-search": {  };
  "GET /api/staff/admin-users": { body: GetStaffAdminUsersBody };
  "POST /api/staff/admin-users": { body: PostStaffAdminUsersBody };
  "GET /api/staff/consumers/search": { body: GetStaffConsumersSearchBody };
  "PATCH /api/staff/edit-admin/:id": { params: PatchStaffEditAdminByIdParams };
  "POST /api/staff/force-logout": { body: PostStaffForceLogoutBody };
  "POST /api/stripe/account_link": { body: PostStripeAccountLinkBody };
  "POST /api/stripe/account_sessions": { body: PostStripeAccountSessionsBody };
  "POST /api/stripe/accounts": { body: PostStripeAccountsBody };
  "POST /api/stripe/cancel/subscriptions/:id": { body: PostStripeCancelSubscriptionsByIdBody; params: PostStripeCancelSubscriptionsByIdParams };
  "POST /api/stripe/company-account-stripe/update": { body: PostStripeCompanyAccountStripeUpdateBody };
  "POST /api/stripe/company-account-stripe": { body: PostStripeCompanyAccountStripeBody };
  "POST /api/stripe/create-payment-intent-customized": { body: PostStripeCreatePaymentIntentCustomizedBody };
  "POST /api/stripe/create-payment-intent-subscription": { body: PostStripeCreatePaymentIntentSubscriptionBody };
  "POST /api/stripe/create-payment-intent": { body: PostStripeCreatePaymentIntentBody };
  "POST /api/stripe/create-subscriptions_no_trial": { body: PostStripeCreateSubscriptionsNoTrialBody };
  "POST /api/stripe/create-subscriptions": { body: PostStripeCreateSubscriptionsBody };
  "POST /api/stripe/customer": { body: PostStripeCustomerBody };
  "GET /api/stripe/customers/search": { body: GetStripeCustomersSearchBody };
  "GET /api/stripe/customers": { body: GetStripeCustomersBody };
  "POST /api/stripe/customers": { body: PostStripeCustomersBody };
  "POST /api/stripe/internal/partial-refund": { body: PostStripeInternalPartialRefundBody };
  "POST /api/stripe/internal/payment-intents/:id/cancel": { body: PostStripeInternalPaymentIntentsByIdCancelBody };
  "POST /api/stripe/internal/payment-intents/:id/capture": { body: PostStripeInternalPaymentIntentsByIdCaptureBody };
  "POST /api/stripe/internal/refund": { body: PostStripeInternalRefundBody };
  "GET /api/stripe/invoices": { body: GetStripeInvoicesBody };
  "POST /api/stripe/invoices": { body: PostStripeInvoicesBody };
  "POST /api/stripe/new-company-account": { body: PostStripeNewCompanyAccountBody };
  "POST /api/stripe/partial-refund": { body: PostStripePartialRefundBody };
  "POST /api/stripe/payment_intents/:id/update-payment-method": { body: PostStripePaymentIntentsByIdUpdatePaymentMethodBody };
  "GET /api/stripe/payment_intents/:id": { params: GetStripePaymentIntentsByIdParams };
  "POST /api/stripe/payment_methods/:id/attach": { body: PostStripePaymentMethodsByIdAttachBody; params: PostStripePaymentMethodsByIdAttachParams };
  "POST /api/stripe/payment-intents/:id/cancel": { body: PostStripePaymentIntentsByIdCancelBody };
  "POST /api/stripe/payment-intents/:id/capture": { body: PostStripePaymentIntentsByIdCaptureBody };
  "POST /api/stripe/payment-method/subscriptions/:id": { params: PostStripePaymentMethodSubscriptionsByIdParams };
  "POST /api/stripe/refund": { body: PostStripeRefundBody };
  "DELETE /api/stripe/remove-duplicate/:id": { params: DeleteStripeRemoveDuplicateByIdParams };
  "DELETE /api/stripe/removing/:id": { params: DeleteStripeRemovingByIdParams };
  "POST /api/stripe/save-transaction-admin-dashboard": { body: PostStripeSaveTransactionAdminDashboardBody };
  "POST /api/stripe/save-transaction-template-no-regular-user": { body: PostStripeSaveTransactionTemplateNoRegularUserBody };
  "POST /api/stripe/save-transaction": { body: PostStripeSaveTransactionBody };
  "POST /api/stripe/setup-search": { body: PostStripeSetupSearchBody };
  "POST /api/stripe/stripe-transaction-admin": { body: PostStripeStripeTransactionAdminBody };
  "POST /api/stripe/stripe-transaction-no-regular-user": { body: PostStripeStripeTransactionNoRegularUserBody };
  "POST /api/stripe/stripe-transaction": { body: PostStripeStripeTransactionBody };
  "GET /api/stripe/stripe-transactions-saved-list": { body: GetStripeStripeTransactionsSavedListBody };
  "POST /api/stripe/stripe-transactions-saved-list": { body: PostStripeStripeTransactionsSavedListBody };
  "DELETE /api/stripe/subscriptions/:id": { params: DeleteStripeSubscriptionsByIdParams };
  "GET /api/stripe/subscriptions/:id": { params: GetStripeSubscriptionsByIdParams };
  "GET /api/stripe/transaction": { body: GetStripeTransactionBody };
  "PATCH /api/stripe/updating-subscription/:id": { params: PatchStripeUpdatingSubscriptionByIdParams };
  "POST /api/subscription/company-subscription": { body: PostSubscriptionCompanySubscriptionBody };
  "POST /api/subscription/new_subscription_no_trial": { body: PostSubscriptionNewSubscriptionNoTrialBody };
  "POST /api/subscription/new_subscription": { body: PostSubscriptionNewSubscriptionBody };
  "GET /api/subscription/search_subscription": { body: GetSubscriptionSearchSubscriptionBody };
  "POST /api/subscription/search_subscription": { body: PostSubscriptionSearchSubscriptionBody };
  "GET /api/subscription/searching-subscription/subscriptions/:id": { params: GetSubscriptionSearchingSubscriptionSubscriptionsByIdParams };
  "GET /api/subscription/subscriptions/:id": { params: GetSubscriptionSubscriptionsByIdParams };
  "PATCH /api/subscription/update-subscription/:id": { body: PatchSubscriptionUpdateSubscriptionByIdBody; params: PatchSubscriptionUpdateSubscriptionByIdParams };
  "POST /api/transaction-audit-log/create-audit": { body: PostTransactionAuditLogCreateAuditBody };
  "POST /api/transaction/check-and-release-deposit-transactions": { body: PostTransactionCheckAndReleaseDepositTransactionsBody };
  "DELETE /api/transaction/remove-duplicate-transaction/:id": { params: DeleteTransactionRemoveDuplicateTransactionByIdParams };
  "POST /api/transaction/save-transaction-admin-dashboard": { body: PostTransactionSaveTransactionAdminDashboardBody };
  "POST /api/transaction/save-transaction-template-no-regular-user": { body: PostTransactionSaveTransactionTemplateNoRegularUserBody };
  "POST /api/transaction/save-transaction": { body: PostTransactionSaveTransactionBody };
  "GET /api/transaction/subscriptions/:id": { params: GetTransactionSubscriptionsByIdParams };
  "GET /api/transaction/transaction": { body: GetTransactionTransactionBody };
  "POST /api/transaction/transaction": { body: PostTransactionTransactionBody };
  "POST /api/transaction/update-multiple-documents": { body: PostTransactionUpdateMultipleDocumentsBody };
  "PATCH /api/transaction/update-transaction/:id": { params: PatchTransactionUpdateTransactionByIdParams };
}
