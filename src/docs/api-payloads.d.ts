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
 * handler: deleteAdminUser — controller/admin.js:521
 * ruta: routes/admin.js:103
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
 * handler: showAllUsers — controller/admin.js:636
 * ruta: routes/admin.js:91
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
 * handler: getStaffActivityLogs — controller/staffActivityLog.js:188
 * ruta: routes/admin.js:50
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "read")
 * generado por factory: createGetStaffActivityLogs
 * status: 403, 404, 500
 */
export interface GetAdminActivityLogsQuery {
  action: string;
  end_date: string;
  limit?: string;
  page?: string;
  staff_member_id: string;
  start_date: string;
  target_model: string;
}

/**
 * `POST /api/admin/activity-logs`
 * handler: registerStaffActivity — controller/staffActivityLog.js:235
 * ruta: routes/admin.js:49
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
 * handler: editOtherAdminUser — controller/admin.js:479
 * ruta: routes/admin.js:100
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
 * handler: checkStatus — controller/admin.js:730
 * ruta: routes/admin.js:115
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetAdminCheckOnlineStatusByEmailParams {
  email: string;
}

/**
 * `POST /api/admin/invalidate-all-sessions`
 * handler: invalidateAllSessions — controller/admin.js:884
 * ruta: routes/admin.js:42
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/admin/login`
 * handler: loginUser — controller/admin.js:86
 * ruta: routes/admin.js:68
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
 * handler: logoutUser — controller/admin.js:345
 * ruta: routes/admin.js:82
 * auth: sin middleware de auth en la ruta
 * headers: x-token
 * status: 201, 401, 500
 */
export interface PostAdminLogoutBody {
  uid?: string;
}

/**
 * `POST /api/admin/manually_logout`
 * handler: manuallyLogoutUser — controller/admin.js:396
 * ruta: routes/admin.js:85
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 201, 500
 */
export interface PostAdminManuallyLogoutBody {
  uid?: string;
}

/**
 * `POST /api/admin/mfa/disable`
 * handler: disableMfa — controller/admin.js:816
 * ruta: routes/admin.js:120
 * auth: validateJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 500
 */

/**
 * `POST /api/admin/mfa/generate`
 * handler: generateMfaSecret — controller/admin.js:763
 * ruta: routes/admin.js:118
 * auth: validateJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */

/**
 * `POST /api/admin/mfa/verify`
 * handler: verifyMfaSetup — controller/admin.js:790
 * ruta: routes/admin.js:119
 * auth: validateJWT
 * status: 400, 404, 500
 */
export interface PostAdminMfaVerifyBody {
  token?: string;
}

/**
 * `POST /api/admin/new_admin_user`
 * handler: createAdminUser — controller/admin.js:17
 * ruta: routes/admin.js:53
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
 * handler: editAdminUser — controller/admin.js:424
 * ruta: routes/admin.js:97
 * auth: validateJWT
 * headers: user-agent
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchAdminProfileByIdParams {
  id: string;
}

/**
 * `POST /api/admin/receiver-assignation`
 * handler: addReceiverToTransaction — controller/receiver.js:24
 * ruta: routes/admin.js:109
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
 * ruta: routes/admin.js:112
 * auth: sin middleware de auth en la ruta
 * status: 201, 501
 */
export interface GetAdminReceiverAssignedBody {
  paymentIntent?: string;
}

/**
 * `PATCH /api/admin/update-password`
 * handler: updatePassword — controller/admin.js:587
 * ruta: routes/admin.js:106
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 500
 */
export interface PatchAdminUpdatePasswordBody {
  email?: string;
  password?: string;
}

/**
 * `POST /api/admin/users`
 * handler: showAllUsers — controller/admin.js:636
 * ruta: routes/admin.js:94
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
 * handler: getUser — controller/auth.js:68
 * ruta: routes/auth.js:53
 * auth: optionalJWT
 * status: 404, 500
 */
export interface GetAuthByIdParams {
  id: string;
}

/**
 * `PATCH /api/auth/:id`
 * handler: editUser — controller/auth.js:168
 * ruta: routes/auth.js:50
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface PatchAuthByIdParams {
  id: string;
}

/**
 * `GET /api/auth/all-consumers-based-on-all-events-per-company/:companyID`
 * handler: getAllConsumersBasedOnAllEventsPerCompany — controller/auth.js:282
 * ruta: routes/auth.js:59
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface GetAuthAllConsumersBasedOnAllEventsPerCompanyByCompanyIDParams {
  companyID: string;
}

/**
 * `POST /api/auth/new`
 * handler: newUser — controller/auth.js:120
 * ruta: routes/auth.js:36
 * auth: check("lastName", "Last name is mandatory").not().isEmpty(), check("email", "Email is mandatory").isEmail(), validateFields
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
  phoneNumber?: number;
  privacyPolicy?: boolean;
  profile_picture?: string;
  provider?: unknown[];
}

/**
 * `GET /api/auth/user-query`
 * handler: getListOfUsers — controller/auth.js:27
 * ruta: routes/auth.js:33
 * auth: sin middleware de auth en la ruta
 * NOTA: lee el QUERY STRING crudo (`request._parsedUrl.query`) y lo parte por `&`: el orden y el formato de los parámetros importan, revisar el handler
 * status: 200, 500
 */
export interface GetAuthUserQueryBody {
  /** cuerpo dinámico: cada par clave/valor se traduce a filtro/columna SQL */
  [key: string]: unknown;
}

/**
 * `POST /api/auth/user-query`
 * handler: showAllUsers — controller/auth.js:11
 * ruta: routes/auth.js:27
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `User.find()`: cualquier subconjunto de los campos de `models/User.js` (`{}` trae todo)
 * status: 200, 500
 */
export interface PostAuthUserQueryBody {
  category?: string;
  company_providers?: unknown[];
  email?: string;
  eventSelected?: unknown[];
  event_providers?: unknown[];
  groupName?: unknown[];
  lastName?: string;
  name?: string;
  notes?: unknown[];
  phoneNumber?: number;
  privacyPolicy?: boolean;
  profile_picture?: string;
  provider?: unknown[];
}

/**
 * `GET /api/auth/users`
 * handler: showAllUsers — controller/auth.js:11
 * ruta: routes/auth.js:24
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `User.find()`: cualquier subconjunto de los campos de `models/User.js` (`{}` trae todo)
 * status: 200, 500
 */
export interface GetAuthUsersBody {
  category?: string;
  company_providers?: unknown[];
  email?: string;
  eventSelected?: unknown[];
  event_providers?: unknown[];
  groupName?: unknown[];
  lastName?: string;
  name?: string;
  notes?: unknown[];
  phoneNumber?: number;
  privacyPolicy?: boolean;
  profile_picture?: string;
  provider?: unknown[];
}

/**
 * `POST /api/auth/users`
 * handler: showAllUsers — controller/auth.js:11
 * ruta: routes/auth.js:30
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `User.find()`: cualquier subconjunto de los campos de `models/User.js` (`{}` trae todo)
 * status: 200, 500
 */
export interface PostAuthUsersBody {
  category?: string;
  company_providers?: unknown[];
  email?: string;
  eventSelected?: unknown[];
  event_providers?: unknown[];
  groupName?: unknown[];
  lastName?: string;
  name?: string;
  notes?: unknown[];
  phoneNumber?: number;
  privacyPolicy?: boolean;
  profile_picture?: string;
  provider?: unknown[];
}

/**
 * `POST /api/auth`
 * handler: checkUser — controller/auth.js:91
 * ruta: routes/auth.js:56
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
 * `POST /api/company/assign-location`
 * handler: assignLocationToUser — controller/company.js:242
 * ruta: routes/company.js:81
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
 * handler: getCompanyList — controller/company.js:219
 * ruta: routes/company.js:79
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */

/**
 * `POST /api/company/consulting-signatures`
 * handler: consultingSignaturesStaffMember — controller/document.js:471
 * ruta: routes/company.js:109
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
 * handler: getConsumerSignatures — controller/document.js:596
 * ruta: routes/company.js:112
 * auth: sin middleware de auth en la ruta
 * status: 500
 */
export interface PostCompanyConsumerSignaturesBody {
  company_id?: string;
  consumer_id?: string;
  event_id?: string;
}

/**
 * `POST /api/company/event-consumer-signatures`
 * handler: stampEventConsumerSignatures — controller/document.js:537
 * ruta: routes/company.js:115
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
 * ruta: routes/company.js:85
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
 * handler: createCompany — controller/company.js:11
 * ruta: routes/company.js:69
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
 * ruta: routes/company.js:98
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface GetCompanyProviderCompaniesQuery {
  creator: string;
}

/**
 * `POST /api/company/provider-company/:id`
 * handler: getSpecificProviderCompany — controller/providerCompany.js:137
 * ruta: routes/company.js:121
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
 * ruta: routes/company.js:91
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
 * handler: searchingGetCompanyInfo — controller/company.js:173
 * ruta: routes/company.js:77
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
 * handler: searchingCompany — controller/company.js:150
 * ruta: routes/company.js:75
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `Company.find()`: cualquier subconjunto de los campos de `models/Company.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostCompanySearchCompanyBody {
  address?: Record<string, unknown>;
  company_logo?: string;
  company_name?: string;
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
 * handler: collectingSignaturesForConsumerMember — controller/document.js:397
 * ruta: routes/company.js:104
 * auth: sin middleware de auth en la ruta
 * headers: accept-language, cf-ipcountry, timezone, user-agent, x-client-ip, x-forwarded-for, x-location, x-real-ip, x-timezone
 * status: 200, 500
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
 * handler: collectingSignatures — controller/document.js:324
 * ruta: routes/company.js:101
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
 * ruta: routes/company.js:88
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
 * handler: updatingCompany — controller/company.js:114
 * ruta: routes/company.js:71
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
 * handler: updatingCompany — controller/company.js:114
 * ruta: routes/company.js:73
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
 * handler: updateStampEventConsumerSignatures — controller/document.js:572
 * ruta: routes/company.js:118
 * auth: sin middleware de auth en la ruta
 * status: 200, 404, 500
 */
export interface PatchCompanyUpdateSignaturesBody {
  signatureID?: string;
  transactionID?: string;
}

/**
 * `POST /api/consumer/stripe/create-customer`
 * handler: stripeCustomer — controller/stripe.js:17
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
 * handler: listAllCustomers — controller/stripe.js:718
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
 * `GET /api/consumer/users`
 * handler: showAllUsers — controller/auth.js:11
 * ruta: routes/consumer.js:32
 * auth: optionalJWT
 * NOTA: el body se usa como FILTRO Mongo en `User.find()`: cualquier subconjunto de los campos de `models/User.js` (`{}` trae todo)
 * status: 200, 500
 */
export interface GetConsumerUsersBody {
  category?: string;
  company_providers?: unknown[];
  email?: string;
  eventSelected?: unknown[];
  event_providers?: unknown[];
  groupName?: unknown[];
  lastName?: string;
  name?: string;
  notes?: unknown[];
  phoneNumber?: number;
  privacyPolicy?: boolean;
  profile_picture?: string;
  provider?: unknown[];
}

/**
 * `POST /api/consumer/users`
 * handler: showAllUsers — controller/auth.js:11
 * ruta: routes/consumer.js:33
 * auth: optionalJWT
 * NOTA: el body se usa como FILTRO Mongo en `User.find()`: cualquier subconjunto de los campos de `models/User.js` (`{}` trae todo)
 * status: 200, 500
 */
export interface PostConsumerUsersBody {
  category?: string;
  company_providers?: unknown[];
  email?: string;
  eventSelected?: unknown[];
  event_providers?: unknown[];
  groupName?: unknown[];
  lastName?: string;
  name?: string;
  notes?: unknown[];
  phoneNumber?: number;
  privacyPolicy?: boolean;
  profile_picture?: string;
  provider?: unknown[];
}

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
 * ruta: mysql/routes/company.js:205
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
 * ruta: mysql/routes/company.js:204
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
 * ruta: mysql/routes/company.js:202
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 400, 500
 */
export interface PostDbCompanyCategoriesBody {
  company_id: number;
}

/**
 * `GET /api/db_company/check-company-exists`
 * handler: checkInventoryCompanyExists — mysql/controllers/item.js:1525
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
 * handler: checkingItem — mysql/controllers/item.js:1266
 * ruta: mysql/routes/company.js:196
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
 * ruta: mysql/routes/company.js:213
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostDbCompanyCompanyInventoryGroupedFullBody {
  company_id: number;
}

/**
 * `POST /api/db_company/company-inventory-pagination`
 * handler: consultingCompanyInventoryWithPagination — mysql/controllers/item.js:1917
 * ruta: mysql/routes/company.js:104
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */
export interface PostDbCompanyCompanyInventoryPaginationQuery {
  direction?: string;
  lastItemId: string;
}

/**
 * `POST /api/db_company/company-inventory-structure`
 * handler: retrieveItemData — mysql/controllers/item.js:2405
 * ruta: mysql/routes/company.js:116
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 403, 500
 */
export interface PostDbCompanyCompanyInventoryStructureBody {
  company_id: number;
}

/**
 * `POST /api/db_company/company-inventory-with-current-warehouse-status`
 * handler: retrieveCompanyInventory — mysql/controllers/item.js:2444
 * ruta: mysql/routes/company.js:119
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
 * handler: checkingInventoryCurrentState — mysql/controllers/item.js:1239
 * ruta: mysql/routes/company.js:128
 * auth: validateJWT, checkTokenVersion
 * status: 201, 403, 500
 */
export interface GetDbCompanyCurrentInventoryByCompanyIdParams {
  company_id: number;
}

/**
 * `POST /api/db_company/delete-bulk-items`
 * handler: deleteBulkItems — mysql/controllers/item.js:3645
 * ruta: mysql/routes/company.js:193
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 403, 500
 */
export interface PostDbCompanyDeleteBulkItemsBody {
  company_id: number;
  item_ids?: number;
}

/**
 * `POST /api/db_company/filter-suppliers-info-items`
 * handler: filterSuppliersInfoItems — mysql/controllers/item.js:3607
 * ruta: mysql/routes/company.js:190
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbCompanyFilterSuppliersInfoItemsBody {
  company_id?: number;
}

/**
 * `POST /api/db_company/get-grouped-inventory-by-search-parameter`
 * handler: getGroupedInventoryBySearchParameter — mysql/controllers/item.js:3476
 * ruta: mysql/routes/company.js:187
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbCompanyGetGroupedInventoryBySearchParameterBody {
  company_id: number;
  searchParameter: string;
}

/**
 * `POST /api/db_company/get-inventory-company`
 * handler: getGroupedItemInventory — mysql/controllers/item.js:1849
 * ruta: mysql/routes/company.js:131
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
 * handler: getInventoryHierarchyWithTypes — mysql/controllers/item.js:3333
 * ruta: mysql/routes/company.js:179
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 403, 500
 */
export interface PostDbCompanyGetLocationItemTypesHierarchyBody {
  company_id: number;
}

/**
 * `DELETE /api/db_company/groups/:group_id`
 * handler: deleteGroup — mysql/controllers/categories_groups.js:125
 * ruta: mysql/routes/company.js:210
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
 * ruta: mysql/routes/company.js:209
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
 * ruta: mysql/routes/company.js:208
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
 * handler: insertingItem — mysql/controllers/item.js:159
 * ruta: mysql/routes/company.js:125
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
 * handler: consultingCompanyInventoryBasedOnLocationAndSubLocation — mysql/controllers/item.js:1994
 * ruta: mysql/routes/company.js:110
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
 * handler: consultingCompanyInventoryBasedOnSubmittedParameters — mysql/controllers/item.js:2358
 * ruta: mysql/routes/company.js:134
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface PostDbCompanyInventoryBasedOnSubmittedParametersBody {
  query?: string;
  values?: string;
}

/**
 * `POST /api/db_company/inventory-query`
 * handler: runNamedInventoryQuery — mysql/controllers/item.js:2318
 * ruta: mysql/routes/company.js:144
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostDbCompanyInventoryQueryBody {
  params?: string;
  queryName: string;
}

/**
 * `POST /api/db_company/locations`
 * handler: listCompanyLocations — mysql/controllers/location.js:559
 * ruta: mysql/routes/company.js:203
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
 * handler: retrieveCompanyInventoryBasedOnParams — mysql/controllers/item.js:4011
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
 * handler: retrieveCompanyInventory — mysql/controllers/item.js:2444
 * ruta: mysql/routes/company.js:199
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostDbCompanyRetrieveCompanyItemsWithLocationsBody {
  company_id?: number;
}

/**
 * `POST /api/db_company/return-event-devices`
 * handler: returnEventDevicesToWarehouse — mysql/controllers/item.js:2153
 * ruta: mysql/routes/company.js:154
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
 * handler: returningLeasedEquipmentToCompany — mysql/controllers/item.js:832
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
 * handler: searchingGetInventoryTracking — mysql/controllers/item.js:1361
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
 * handler: searchingInventoryTracking — mysql/controllers/item.js:1314
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
 * handler: updateAllItemsInInventory — mysql/controllers/item.js:2537
 * ruta: mysql/routes/company.js:162
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
 * handler: updateContentInContainerItem — mysql/controllers/item.js:1618
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
 * handler: updateItemsBasedOnAlphanumericSerialNumber — mysql/controllers/item.js:2743
 * ruta: mysql/routes/company.js:165
 * auth: validateJWT, checkTokenVersion
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostDbCompanyUpdateItemsBasedOnAlphanumericSerialNumberBody {
  id?: number;
}

/**
 * `POST /api/db_company/update-items-based-on-serial-number`
 * handler: updateItemsBasedOnSerialNumber — mysql/controllers/item.js:2625
 * ruta: mysql/routes/company.js:173
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
 * handler: deleteCustomer — mysql/controllers/consumer.js:50
 * ruta: mysql/routes/consumers.js:24
 * auth: validateJWT, checkTokenVersion, authorizePermission("consumer", "delete")
 * status: 200, 500
 */
export interface DeleteDbConsumerByIdBody {
  consumer_id?: number;
}

/**
 * `POST /api/db_consumer/consulting-consumer`
 * handler: consultingConsumerInfo — mysql/controllers/consumer.js:24
 * ruta: mysql/routes/consumers.js:15
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
 * handler: consultingConsumerTable — mysql/controllers/consumer.js:39
 * ruta: mysql/routes/consumers.js:18
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/db_consumer/new_consumer`
 * handler: insertingCustomer — mysql/controllers/consumer.js:5
 * ruta: mysql/routes/consumers.js:21
 * auth: sin middleware de auth en la ruta
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
 * handler: deleteEvent — mysql/controllers/events.js:239
 * ruta: mysql/routes/events.js:97
 * auth: validateJWT, checkTokenVersion, authorizePermission("event", "delete")
 * status: 201
 */
export interface DeleteDbEventByIdBody {
  email?: string;
}

/**
 * `POST /api/db_event/allocate-device-container-event`
 * handler: allocateDeviceMarkedAsContainerInEvent — mysql/controllers/items_events.js:655
 * ruta: mysql/routes/events.js:197
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 404, 500
 */
export interface PostDbEventAllocateDeviceContainerEventBody {
  company_id: number;
  company_id_nosql?: string;
  data?: Record<string, unknown>;
  eventName?: string;
  event_id: number;
  logistic_status?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_event/allocate-device-event`
 * handler: allocateDeviceToEvent — mysql/controllers/items_events.js:558
 * ruta: mysql/routes/events.js:189
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
 * handler: confirmItemsReturnedToStock — mysql/controllers/item.js:3824
 * ruta: mysql/routes/events.js:86
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PostDbEventConfirmItemReturnBody {
  company_id: number;
  location?: Record<string, unknown>;
  noSqlCompanyId?: string;
  noSqlEventName: string;
  serial_numbers?: unknown[];
  sub_location?: Record<string, unknown>;
  user_id: number;
}

/**
 * `POST /api/db_event/consulting-event`
 * handler: consultingEventInformation — mysql/controllers/events.js:145
 * ruta: mysql/routes/events.js:51
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
 * handler: itemFinalStatusWhenEventIsFinishedRefactored — mysql/controllers/item.js:1179
 * ruta: mysql/routes/events.js:92
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
 * handler: itemFinalStatusWhenEventIsFinished — mysql/controllers/item.js:1152
 * ruta: mysql/routes/events.js:89
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
 * ruta: mysql/routes/events.js:72
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
 * ruta: mysql/routes/events.js:69
 * auth: sin middleware de auth en la ruta
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201
 */

/**
 * `POST /api/db_event/event_staff`
 * handler: insertingStaffInEvent — mysql/controllers/events.js:261
 * ruta: mysql/routes/events.js:66
 * auth: sin middleware de auth en la ruta
 * status: 201
 */
export interface PostDbEventEventStaffBody {
  event_id?: number;
  role?: string;
  staff_id?: number;
}

/**
 * `GET /api/db_event/event-inventory/:id`
 * handler: consultingInventoryEvent — mysql/controllers/events.js:290
 * ruta: mysql/routes/events.js:100
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetDbEventEventInventoryByIdParams {
  id: number;
}

/**
 * `POST /api/db_event/event-inventory/:id`
 * handler: consultingInventoryInEvent — mysql/controllers/items_events.js:413
 * ruta: mysql/routes/events.js:75
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */
export interface PostDbEventEventInventoryByIdParams {
  id: number;
}

/**
 * `POST /api/db_event/events_company`
 * handler: consultingEventsPerCompany — mysql/controllers/events.js:211
 * ruta: mysql/routes/events.js:57
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */

/**
 * `POST /api/db_event/events_information`
 * handler: consultingEventTable — mysql/controllers/events.js:178
 * ruta: mysql/routes/events.js:54
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
 * ruta: mysql/routes/events.js:122
 * auth: validateJWT, checkTokenVersion
 * headers: Idempotency-Key, idempotency-key
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostDbEventInsertingItemsInEventFromContainerBody {
  event_id?: number;
  id?: number;
  refDatabase?: string;
}

/**
 * `POST /api/db_event/inventory-based-on-submitted-parameters`
 * handler: consultingCompanyInventoryBasedOnSubmittedParameters — mysql/controllers/item.js:2358
 * ruta: mysql/routes/events.js:161
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface PostDbEventInventoryBasedOnSubmittedParametersBody {
  query?: string;
  values?: string;
}

/**
 * `POST /api/db_event/inventory-query`
 * handler: runNamedInventoryQuery — mysql/controllers/item.js:2318
 * ruta: mysql/routes/events.js:171
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
 * ruta: mysql/routes/events.js:217
 * auth: sin middleware de auth en la ruta
 * status: 201, 400, 500
 */
export interface PostDbEventLockItemsForEventBody {
  company_id: number;
  event_id: number;
  items?: unknown[];
}

/**
 * `POST /api/db_event/new_event`
 * handler: insertingEvent — mysql/controllers/events.js:32
 * ruta: mysql/routes/events.js:60
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
 * ruta: mysql/routes/events.js:103
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
 * ruta: mysql/routes/events.js:214
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
 * ruta: mysql/routes/events.js:206
 * auth: validateJWT, authorizePermission("event", "update")
 * status: 200, 404, 500
 */
export interface PostDbEventReserveItemsForEventBody {
  company_id?: number;
  items?: unknown[];
}

/**
 * `POST /api/db_event/retrieve-item-group-location-quantity`
 * handler: getGroupedItemInventory — mysql/controllers/item.js:1849
 * ruta: mysql/routes/events.js:143
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
 * handler: getGroupedItemWithFormatInventory — mysql/controllers/item.js:2059
 * ruta: mysql/routes/events.js:151
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */

/**
 * `POST /api/db_event/retrieve-item-location-quantity-full-details`
 * handler: consultItemDataFromSerialNumber — mysql/controllers/item.js:1778
 * ruta: mysql/routes/events.js:136
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
 * handler: retrieveItemLocationQuantityForEvent — mysql/controllers/item.js:1704
 * ruta: mysql/routes/events.js:130
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
 * handler: returnEventDevicesToWarehouse — mysql/controllers/item.js:2153
 * ruta: mysql/routes/events.js:181
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
 * handler: returningItemToStockWhenEventIsFinishedRefactored — mysql/controllers/item.js:1052
 * ruta: mysql/routes/events.js:81
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
 * handler: returningItemToStockWhenEventIsFinished — mysql/controllers/item.js:1005
 * ruta: mysql/routes/events.js:78
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
 * handler: updateEventInfo — mysql/controllers/events.js:81
 * ruta: mysql/routes/events.js:63
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
 * handler: updateItemInTableAfterBeingAddedToEventFromContainer — mysql/controllers/item.js:1648
 * ruta: mysql/routes/events.js:112
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbEventUpdateItemInTableAfterBeingAddedToEventFromContainerBody {
  refDatabase?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_event/update-status-item-based-on-event`
 * handler: updateStatusItemBasedOnEvent — mysql/controllers/events.js:325
 * ruta: mysql/routes/events.js:109
 * auth: sin middleware de auth en la ruta
 * status: 200
 */
export interface PostDbEventUpdateStatusItemBasedOnEventBody {
  event_id?: number;
  status?: string;
  update_at?: string;
}

/**
 * `POST /api/db_inventory/check-item`
 * handler: checkingItem — mysql/controllers/item.js:1266
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
 * handler: checkLargeData — mysql/controllers/item.js:3064
 * ruta: mysql/routes/inventory.js:41
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "read")
 * status: 200, 400, 500
 */
export interface PostDbInventoryCheckLargeDataBody {
  company_id: number;
  item_ids?: number;
}

/**
 * `GET /api/db_inventory/container-items/:container_item_id`
 * handler: getContainerItems — mysql/controllers/item.js:2822
 * ruta: mysql/routes/inventory.js:35
 * auth: sin middleware de auth en la ruta
 * status: 400, 404, 500
 */
export interface GetDbInventoryContainerItemsByContainerItemIdParams {
  container_item_id: number;
}

/**
 * `POST /api/db_inventory/container-items`
 * handler: insertContainerItems — mysql/controllers/item.js:2755
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
 * handler: deleteContainerItem — mysql/controllers/item.js:2935
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
 * handler: updateContainerItems — mysql/controllers/item.js:2991
 * ruta: mysql/routes/inventory.js:39
 * auth: validateJWT, checkTokenVersion
 * status: 400, 404, 500
 */
export interface PutDbInventoryContainerByContainerItemIdBody {
  child_ids?: number;
}
export interface PutDbInventoryContainerByContainerItemIdParams {
  container_item_id: number;
}

/**
 * `POST /api/db_inventory/update-large-data`
 * handler: updateLargeData — mysql/controllers/item.js:3153
 * ruta: mysql/routes/inventory.js:46
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200
 */

/**
 * `POST /api/db_inventory/update-location-sub-location`
 * handler: updateSubLocation — mysql/controllers/item.js:3171
 * ruta: mysql/routes/inventory.js:43
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface PostDbInventoryUpdateLocationSubLocationBody {
  company_id: number;
  currentIndex: string;
  newName: string;
  path?: string;
}

/**
 * `POST /api/db_item/:id`
 * handler: deleteItem — mysql/controllers/item.js:606
 * ruta: mysql/routes/item.js:101
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 201, 400, 403, 404, 500
 */
export interface PostDbItemByIdBody {
  company_id: number;
  item_id: number;
}

/**
 * `POST /api/db_item/bulk-item-alphanumeric`
 * handler: insertBulkItemAlhpanumericFormat — mysql/controllers/item.js:514
 * ruta: mysql/routes/item.js:87
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
 * `POST /api/db_item/bulk-item`
 * handler: insertBulkItem — mysql/controllers/item.js:429
 * ruta: mysql/routes/item.js:84
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
 * handler: checkingIfCompanyHasInventory — mysql/controllers/item.js:1681
 * ruta: mysql/routes/item.js:140
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
 * ruta: mysql/routes/item.js:125
 * auth: validateJWT
 * status: 200, 403, 500
 */
export interface GetDbItemCheckInventoryByCompanyIdParams {
  company_id: number;
}

/**
 * `POST /api/db_item/check-item`
 * handler: checkingItem — mysql/controllers/item.js:1266
 * ruta: mysql/routes/item.js:122
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
 * handler: consultingItem — mysql/controllers/item.js:580
 * ruta: mysql/routes/item.js:63
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
 * ruta: mysql/routes/item.js:110
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
 * ruta: mysql/routes/item.js:72
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
 * handler: deleteBulkItemBasedOnCriteria — mysql/controllers/item.js:3923
 * ruta: mysql/routes/item.js:57
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
 * handler: deleteBulkItems — mysql/controllers/item.js:3645
 * ruta: mysql/routes/item.js:107
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 200, 400, 403, 500
 */
export interface PostDbItemDeleteBulkItemsBody {
  company_id: number;
  item_ids?: number;
}

/**
 * `POST /api/db_item/delete-item`
 * handler: deleteItem — mysql/controllers/item.js:606
 * ruta: mysql/routes/item.js:104
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "delete")
 * status: 201, 400, 403, 404, 500
 */
export interface PostDbItemDeleteItemBody {
  company_id: number;
  item_id: number;
}

/**
 * `POST /api/db_item/edit-item`
 * handler: updateItemInTable — mysql/controllers/item.js:705
 * ruta: mysql/routes/item.js:90
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
 * ruta: mysql/routes/item.js:54
 * auth: validateJWT, checkTokenVersion
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PutDbItemEventItemsBulkUpdateBody {
  id?: number;
}

/**
 * `POST /api/db_item/event-items/search`
 * handler: getEventItemShipping — mysql/controllers/items_events.js:136
 * ruta: mysql/routes/item.js:52
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
 * ruta: mysql/routes/item.js:53
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface DeleteDbItemEventItemsBody {
  event_id: number;
  items?: unknown[];
}

/**
 * `PUT /api/db_item/event-items`
 * handler: updateEventItemShipping — mysql/controllers/items_events.js:205
 * ruta: mysql/routes/item.js:51
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PutDbItemEventItemsBody {
  company_id: number;
  event_id: number;
  items?: unknown[];
  updates: string;
}

/**
 * `GET /api/db_item/fragment-data`
 * handler: fragmentData — mysql/controllers/item.js:1408
 * ruta: mysql/routes/item.js:128
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
 * handler: getGroupedItemInventory — mysql/controllers/item.js:1849
 * ruta: mysql/routes/item.js:190
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
 * ruta: mysql/routes/item.js:75
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */
export interface PostDbItemInventoryEventByIdParams {
  id: number;
}

/**
 * `POST /api/db_item/inventory-based-on-location-and-sublocation`
 * handler: consultingCompanyInventoryBasedOnLocationAndSubLocation — mysql/controllers/item.js:1994
 * ruta: mysql/routes/item.js:152
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
 * handler: consultingCompanyInventoryBasedOnSubmittedParameters — mysql/controllers/item.js:2358
 * ruta: mysql/routes/item.js:162
 * auth: validateJWT, checkTokenVersion
 * status: 200, 500
 */
export interface PostDbItemInventoryBasedOnSubmittedParametersBody {
  query?: string;
  values?: string;
}

/**
 * `POST /api/db_item/inventory-pagination`
 * handler: consultingCompanyInventoryWithPagination — mysql/controllers/item.js:1917
 * ruta: mysql/routes/item.js:149
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 500
 */
export interface PostDbItemInventoryPaginationQuery {
  direction?: string;
  lastItemId: string;
}

/**
 * `POST /api/db_item/inventory-query`
 * handler: runNamedInventoryQuery — mysql/controllers/item.js:2318
 * ruta: mysql/routes/item.js:172
 * auth: validateJWT, checkTokenVersion
 * status: 200, 400, 500
 */
export interface PostDbItemInventoryQueryBody {
  params?: string;
  queryName: string;
}

/**
 * `POST /api/db_item/item-out-warehouse`
 * handler: updateItemInWarehouseAfterBeingAddedToEvent — mysql/controllers/item.js:890
 * ruta: mysql/routes/item.js:97
 * auth: validateJWT, checkTokenVersion, authorizePermission("inventory", "update")
 * status: 201, 400, 403, 404, 500
 */
export interface PostDbItemItemOutWarehouseBody {
  category_name: string;
  company_id: number;
  data?: Record<string, unknown>;
  item_group: string;
  logistic_status?: string;
  warehouse?: string;
}

/**
 * `POST /api/db_item/items_information`
 * handler: consultingItemTable — mysql/controllers/item.js:654
 * ruta: mysql/routes/item.js:69
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbItemItemsInformationBody {
  company?: Record<string, unknown>;
}

/**
 * `GET /api/db_item/location-count`
 * handler: gettingDataFromLocationOption — mysql/controllers/item.js:1473
 * ruta: mysql/routes/item.js:131
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
 * handler: insertingItem — mysql/controllers/item.js:159
 * ruta: mysql/routes/item.js:81
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
 * handler: retrieveItemData — mysql/controllers/item.js:2405
 * ruta: mysql/routes/item.js:192
 * auth: validateJWT
 * status: 200, 400, 403, 500
 */
export interface PostDbItemRetrieveItemDataBody {
  company_id: number;
}

/**
 * `POST /api/db_item/retrieve-item-location-quantity`
 * handler: retrieveItemLocationQuantityForEvent — mysql/controllers/item.js:1704
 * ruta: mysql/routes/item.js:143
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
 * handler: returnEventDevicesToWarehouse — mysql/controllers/item.js:2153
 * ruta: mysql/routes/item.js:182
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
 * handler: returningItemToStockWhenEventIsFinishedRefactored — mysql/controllers/item.js:1052
 * ruta: mysql/routes/item.js:134
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
 * handler: searchingGetInventoryTracking — mysql/controllers/item.js:1361
 * ruta: mysql/routes/item.js:119
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
 * handler: searchingInventoryTracking — mysql/controllers/item.js:1314
 * ruta: mysql/routes/item.js:116
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostDbItemSearchInventoryBody {
  company_id?: number;
  searchValue?: string;
}

/**
 * `POST /api/db_item/tracking_item/:id`
 * handler: consultingInventoryTracking — mysql/controllers/item.js:1212
 * ruta: mysql/routes/item.js:78
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface PostDbItemTrackingItemByIdParams {
  id: number;
}

/**
 * `POST /api/db_item/warehouse-items`
 * handler: consultingItemInWarehouseTable — mysql/controllers/item.js:673
 * ruta: mysql/routes/item.js:66
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
 * `GET /api/db_location/companies/:id/location-paths-tree`
 * handler: getLocationPathsTree — mysql/controllers/sub_location_paths.js:58
 * ruta: mysql/routes/location.js:55
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface GetDbLocationCompaniesByIdLocationPathsTreeParams {
  id: number;
}

/**
 * `GET /api/db_location/companies/:id/locations/tree`
 * handler: getCompanyLocationTree — mysql/controllers/location.js:357
 * ruta: mysql/routes/location.js:42
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface GetDbLocationCompaniesByIdLocationsTreeParams {
  id: number;
}

/**
 * `GET /api/db_location/companies/:id/locations`
 * handler: getCompanyLocations — mysql/controllers/location.js:175
 * ruta: mysql/routes/location.js:38
 * auth: validateJWT
 * status: 200, 400, 403, 500
 */
export interface GetDbLocationCompaniesByIdLocationsParams {
  id: number;
}

/**
 * `POST /api/db_location/companies/:id/locations`
 * handler: getCompanyLocations — mysql/controllers/location.js:175
 * ruta: mysql/routes/location.js:40
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
 * ruta: mysql/routes/location.js:28
 * auth: check("company_id", "Company ID is required").not().isEmpty(), validateFields
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
 * handler: deleteLocation — mysql/controllers/location.js:515
 * ruta: mysql/routes/location.js:26
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 409, 500
 */
export interface PostDbLocationLocationsByIdParams {
  id: number;
}

/**
 * `POST /api/db_location/locations`
 * handler: createLocation — mysql/controllers/location.js:66
 * ruta: mysql/routes/location.js:16
 * auth: check("location_name", "Location name is required").not().isEmpty(), validateFields
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
 * `POST /api/db_location/sub-location-path`
 * handler: createSubLocationPath — mysql/controllers/sub_location_paths.js:4
 * ruta: mysql/routes/location.js:44
 * auth: check("location_id", "location_id is required").not().isEmpty(), check("sub_location_path", "sub_location_path must be a non-empty array").isArray({ min: 1 }), validateFields
 * status: 201, 400, 404, 409, 500
 */
export interface PostDbLocationSubLocationPathBody {
  company_id: number;
  created_by?: string;
  location_id: number;
  sub_location_path?: string;
}

/**
 * `POST /api/db_member/bulk-members`
 * handler: insertBulkMembers — mysql/controllers/members.js:194
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
 * handler: bulkReturnMemberLeases — mysql/controllers/members.js:1890
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
 * handler: retrieveMemberInfo — mysql/controllers/members.js:684
 * ruta: mysql/routes/members.js:41
 * auth: canRead
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 500
 */

/**
 * `POST /api/db_member/delete-member-assigned-device-lease`
 * handler: deleteMemberAssignedDeviceLeaseRows — mysql/controllers/members.js:1674
 * ruta: mysql/routes/members.js:76
 * auth: canDelete
 * status: 200, 400, 500
 */
export interface PostDbMemberDeleteMemberAssignedDeviceLeaseBody {
  where?: string;
}

/**
 * `POST /api/db_member/delete-member-info`
 * handler: deleteMember — mysql/controllers/members.js:642
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
 * handler: retrieveMemberFees — mysql/controllers/members.js:1602
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
 * handler: retrieveMyDevices — mysql/controllers/members.js:1970
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
 * handler: insertNewRowINMemberAssignedDeviceTableForLeaseTracking — mysql/controllers/members.js:734
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
 * handler: insertNewMember — mysql/controllers/members.js:29
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
 * handler: retrieveOverdueLeases — mysql/controllers/members.js:1831
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
 * handler: removeRowAssignedDeviceLeaseMember — mysql/controllers/members.js:1772
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
 * handler: retrieveMembersAssignedDevices — mysql/controllers/members.js:459
 * ruta: mysql/routes/members.js:83
 * auth: canRead
 * status: 200, 500
 */
export interface PostDbMemberRetrieveMembersAssignedDevicesBody {
  where?: string;
}

/**
 * `POST /api/db_member/settle-member-fee`
 * handler: settleMemberFee — mysql/controllers/members.js:1425
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
 * handler: updateMemberAssignedDeviceLeaseRow — mysql/controllers/members.js:1202
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
 * handler: updateMemberInfo — mysql/controllers/members.js:579
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
  package_list?: unknown[];
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
 * handler: getSubLocationsHierarchy — mysql/controllers/sub_location.js:203
 * ruta: mysql/routes/sub_location.js:24
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface GetDbSubLocationLocationsByLocationIdSubLocationsParams {
  location_id: number;
}

/**
 * `DELETE /api/db_sub_location/sub-locations/:id`
 * handler: deleteSubLocation — mysql/controllers/sub_location.js:288
 * ruta: mysql/routes/sub_location.js:30
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 409, 500
 */
export interface DeleteDbSubLocationSubLocationsByIdParams {
  id: number;
}

/**
 * `PUT /api/db_sub_location/sub-locations/:id`
 * handler: updateSubLocation — mysql/controllers/sub_location.js:241
 * ruta: mysql/routes/sub_location.js:26
 * auth: sin middleware de auth en la ruta
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
 * handler: checkSubLocation — mysql/controllers/sub_location.js:325
 * ruta: mysql/routes/sub_location.js:28
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
 * handler: createSubLocation — mysql/controllers/sub_location.js:159
 * ruta: mysql/routes/sub_location.js:14
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
 * handler: deleteDocument — controller/document.js:272
 * ruta: routes/document.js:120
 * auth: canManage
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 404, 500
 */
export interface DeleteDocumentByIdParams {
  id: string;
}

/**
 * `GET /api/document/:id`
 * handler: getCompanyDocumentByID — controller/document.js:152
 * ruta: routes/document.js:117
 * auth: sin middleware de auth en la ruta
 * status: 500
 */
export interface GetDocumentByIdParams {
  id: string;
}

/**
 * `GET /api/document/download/:documentId/:userId`
 * handler: getDocumentDownloadUrl — controller/document.js:205
 * ruta: routes/document.js:118
 * auth: sin middleware de auth en la ruta
 * status: 404, 429, 500
 */
export interface GetDocumentDownloadByDocumentIdByUserIdParams {
  documentId: string;
  userId: string;
}

/**
 * `POST /api/document/download/documentUrl`
 * handler: generateTemporaryDownloadUrl — controller/document.js:308
 * ruta: routes/document.js:119
 * auth: sin middleware de auth en la ruta
 * status: 500
 */
export interface PostDocumentDownloadDocumentUrlBody {
  documentUrl?: string;
}

/**
 * `DELETE /api/document/folder/:id`
 * handler: deleteFolder — controller/document.js:756
 * ruta: routes/document.js:141
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 404, 500
 */
export interface DeleteDocumentFolderByIdParams {
  id: string;
}

/**
 * `GET /api/document/folder/:id`
 * handler: getFolderByID — controller/document.js:702
 * ruta: routes/document.js:139
 * auth: sin middleware de auth en la ruta
 * status: 500
 */
export interface GetDocumentFolderByIdParams {
  id: string;
}

/**
 * `PUT /api/document/folder/:id`
 * handler: updateFolder — controller/document.js:718
 * ruta: routes/document.js:140
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface PutDocumentFolderByIdBody {
  documents: string;
  folder_description: string;
  folder_name: string;
  trigger_action: string;
}
export interface PutDocumentFolderByIdParams {
  id: string;
}

/**
 * `POST /api/document/folders`
 * handler: getFolders — controller/document.js:659
 * ruta: routes/document.js:138
 * auth: sin middleware de auth en la ruta
 * status: 404, 500
 */
export interface PostDocumentFoldersBody {
  company_id?: string;
}

/**
 * `POST /api/document/new_folder`
 * handler: createNewFolder — controller/document.js:617
 * ruta: routes/document.js:137
 * auth: sin middleware de auth en la ruta
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
 * handler: getTriggerActions — controller/document.js:185
 * ruta: routes/document.js:112
 * auth: canManage
 * status: 500
 */
export interface GetDocumentTriggersQuery {
  company_id: string;
}

/**
 * `GET /api/document/types`
 * handler: getDocumentTypes — controller/document.js:169
 * ruta: routes/document.js:111
 * auth: canManage
 * status: 500
 */
export interface GetDocumentTypesQuery {
  company_id: string;
}

/**
 * `POST /api/document/upload/xlsx`
 * handler: uploadExcelToS3 — controller/document.js:1622
 * ruta: routes/document.js:109
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
 * handler: uploadDocument — controller/document.js:70
 * ruta: routes/document.js:108
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
 * handler: consumerMemberVerificationSignedDocumentForAssignmentDevices — controller/document.js:1046
 * ruta: routes/document.js:160
 * auth: sin middleware de auth en la ruta
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
 * handler: createConsumerVerification — controller/document.js:821
 * ruta: routes/document.js:156
 * auth: sin middleware de auth en la ruta
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
 * handler: addSignatureToConsumerDocument — controller/document.js:1424
 * ruta: routes/document.js:164
 * auth: sin middleware de auth en la ruta
 * status: 200, 404, 500
 */
export interface PatchDocumentVerificationConsumerMemberSigningDocumentBody {
  contract_url?: string;
  verification_id?: string;
}

/**
 * `POST /api/document/verification/member/check_signed_document`
 * handler: memberVerificationSignedDocumentForAssignmentDevices — controller/document.js:1187
 * ruta: routes/document.js:171
 * auth: sin middleware de auth en la ruta
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
 * handler: createMemberVerification — controller/document.js:864
 * ruta: routes/document.js:169
 * auth: sin middleware de auth en la ruta
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
 * handler: addSignatureToMemberDocument — controller/document.js:1528
 * ruta: routes/document.js:176
 * auth: sin middleware de auth en la ruta
 * status: 200, 404, 500
 */
export interface PatchDocumentVerificationMemberSigningDocumentBody {
  contract_url?: string;
  verification_id?: string;
}

/**
 * `POST /api/document/verification/staff_member/check_signed_document`
 * handler: staffMemberVerificationSignedDocumentForAssignmentDevices — controller/document.js:908
 * ruta: routes/document.js:146
 * auth: sin middleware de auth en la ruta
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
 * handler: createStaffMemberVerification — controller/document.js:779
 * ruta: routes/document.js:142
 * auth: sin middleware de auth en la ruta
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
 * handler: addSignatureToDocument — controller/document.js:1328
 * ruta: routes/document.js:150
 * auth: sin middleware de auth en la ruta
 * status: 200, 404, 500
 */
export interface PatchDocumentVerificationStaffMemberSigningDocumentBody {
  contract_url?: string;
  verification_id?: string;
}

/**
 * `GET /api/document`
 * handler: getCompanyDocuments — controller/document.js:130
 * ruta: routes/document.js:110
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
 * handler: getListOfUsersAndTransactionsPerEvent — controller/auth.js:219
 * ruta: routes/event.js:49
 * auth: sin middleware de auth en la ruta
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
 * handler: deleteEvent — controller/event.js:138
 * ruta: routes/event.js:61
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
 * handler: editSubscriptionEvent — controller/event.js:93
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
 * handler: editSubscriptionEvent — controller/event.js:93
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
 * handler: inventoryEventBasedOnPeriod — controller/event.js:419
 * ruta: routes/event.js:58
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
 * handler: gettingEventListPerCompany — controller/event.js:190
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
 * handler: eventList — controller/event.js:174
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
 * handler: eventList — controller/event.js:174
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
 * handler: eventStaffDetailInfo — controller/event.js:245
 * ruta: routes/event.js:55
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetEventEventStaffDetailByIdParams {
  id: string;
}

/**
 * `POST /api/event/staff-all-events`
 * handler: searchStaffAllEvents — controller/event.js:228
 * ruta: routes/event.js:46
 * auth: sin middleware de auth en la ruta
 * status: 200, 500
 */
export interface PostEventStaffAllEventsBody {
  email?: string;
}

/**
 * `POST /api/event/update-event-inventory-freshest-data`
 * handler: updateEventInventoryFreshestData — controller/event.js:596
 * ruta: routes/event.js:68
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 404, 500
 */
export interface PostEventUpdateEventInventoryFreshestDataBody {
  event_id: string;
  updatedBy?: string;
}

/**
 * `PATCH /api/event/update-events`
 * handler: updateLargeNumberOfEventsAtOnce — controller/event.js:465
 * ruta: routes/event.js:64
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 500
 */
export interface PatchEventUpdateEventsBody {
  ids: unknown[];
  newValues: string;
}

/**
 * `POST /api/event/update-global-state`
 * handler: updateGlobalStateOfEvent — controller/event.js:530
 * ruta: routes/event.js:66
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
 * ruta: routes/jobs.js:25
 * auth: validateJWT, requireSuperUser
 * status: 200, 400, 404, 500
 */
export interface GetJobsByJobIdParams {
  jobId: string;
}

/**
 * `GET /api/jobs/owned/:jobId`
 * handler: getOwnedJobStatus — controller/jobs.js:120
 * ruta: routes/jobs.js:24
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
 * handler: assingDeviceNotification — nodeMailer/notifications.js:118
 * ruta: routes/nodeMailer.js:46
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerAssignigDeviceNotificationBody {
  consumer?: Record<string, unknown>;
  devices?: unknown[];
  link?: string;
}

/**
 * `POST /api/nodemailer/completed-task-notification`
 * handler: completedTask — nodeMailer/notifications.js:883
 * ruta: routes/nodeMailer.js:173
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 */

/**
 * `POST /api/nodemailer/confirm-returned-device-notification`
 * handler: returningDeviceNotification — nodeMailer/notifications.js:126
 * ruta: routes/nodeMailer.js:49
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
 * handler: confirmationLinkNewConsumerNotification — nodeMailer/notifications.js:284
 * ruta: routes/nodeMailer.js:73
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
 * handler: consumerLeaseEndedDeviceReturnedNotification — nodeMailer/notifications.js:873
 * ruta: routes/nodeMailer.js:151
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerConsumerLeaseReturnDeviceNotificationBody {
  consumer?: Record<string, unknown>;
  devices?: unknown[];
  returnDate?: string;
}

/**
 * `POST /api/nodemailer/customize-message-notification`
 * handler: customizeMessage — nodeMailer/notifications.js:915
 * ruta: routes/nodeMailer.js:193
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
 * handler: customizedEmailNotification — nodeMailer/notifications.js:312
 * ruta: routes/nodeMailer.js:85
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
 * handler: captureDepositNotification — nodeMailer/notifications.js:227
 * ruta: routes/nodeMailer.js:58
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
 * handler: cancelDepositNotification — nodeMailer/notifications.js:219
 * ruta: routes/nodeMailer.js:55
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
 * handler: deviceReportPerTransaction — nodeMailer/notifications.js:211
 * ruta: routes/nodeMailer.js:121
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
 * handler: earlierReturningNotification — nodeMailer/notifications.js:241
 * ruta: routes/nodeMailer.js:61
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerEarlyRemindNotificationBody {
  consumer?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/edit-device-admin`
 * handler: editingDeviceAdminNotification — nodeMailer/notifications.js:257
 * ruta: routes/nodeMailer.js:82
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerEditDeviceAdminBody {
  contactAdminEmail?: string;
}

/**
 * `POST /api/nodemailer/event-staff-notification`
 * handler: eventStaffNotification — nodeMailer/notifications.js:249
 * ruta: routes/nodeMailer.js:64
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
 * handler: eventBeginsReminderNotification — nodeMailer/notifications.js:344
 * ruta: routes/nodeMailer.js:97
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
 * handler: failedTask — nodeMailer/notifications.js:891
 * ruta: routes/nodeMailer.js:176
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 */

/**
 * `POST /api/nodemailer/feedback-email-notification`
 * handler: devitrakFeedbackEmailNotification — nodeMailer/notifications.js:441
 * ruta: routes/nodeMailer.js:124
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostNodemailerFeedbackEmailNotificationBody {
  id?: string;
  payload?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/forcing-revoking-active-session`
 * handler: forcingRevokingActiveSession — nodeMailer/notifications.js:899
 * ruta: routes/nodeMailer.js:179
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerForcingRevokingActiveSessionBody {
  email?: string;
}

/**
 * `POST /api/nodemailer/internal-single-email-notification`
 * handler: internalNotification — nodeMailer/notifications.js:336
 * ruta: routes/nodeMailer.js:94
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
 * handler: chargeInvoice — nodeMailer/notifications.js:376
 * ruta: routes/nodeMailer.js:106
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
 * handler: itemInfoStaffNotification — nodeMailer/notifications.js:360
 * ruta: routes/nodeMailer.js:103
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
 * handler: liabilityContractConsumerNotification — nodeMailer/notifications.js:579
 * ruta: routes/nodeMailer.js:133
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLiabilityContractConsumerEmailNotificationBody {
  company_id?: string;
  company_name?: string;
  consumer?: Record<string, unknown>;
  contract_list?: unknown[];
  date_reference?: string;
  email?: string;
  email_admin?: string;
  items?: unknown[];
  name?: string;
  subject?: string;
  verification_id?: string;
}

/**
 * `POST /api/nodemailer/liability-contract-email-notification`
 * handler: liabilityContractStaffNotification — nodeMailer/notifications.js:591
 * ruta: routes/nodeMailer.js:127
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLiabilityContractEmailNotificationBody {
  company_id?: string;
  company_name?: string;
  contract_list?: unknown[];
  date_reference?: string;
  email?: string;
  email_admin?: string;
  items?: unknown[];
  name?: string;
  staff?: Record<string, unknown>;
  subject?: string;
  verification_id?: string;
}

/**
 * `POST /api/nodemailer/liability-contract-member-email-notification`
 * handler: liabilityContractMemberNotification — nodeMailer/notifications.js:567
 * ruta: routes/nodeMailer.js:139
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerLiabilityContractMemberEmailNotificationBody {
  company_id?: string;
  company_name?: string;
  contract_list?: unknown[];
  date_reference?: string;
  email?: string;
  email_admin?: string;
  items?: unknown[];
  member?: Record<string, unknown>;
  name?: string;
  subject?: string;
  verification_id?: string;
}

/**
 * `POST /api/nodemailer/login-existing-consumer`
 * handler: loginLinkExistingConsumerNotification — nodeMailer/notifications.js:292
 * ruta: routes/nodeMailer.js:76
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
 * handler: lostDeviceFeeCollectedNotification — nodeMailer/notifications.js:275
 * ruta: routes/nodeMailer.js:67
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
 * handler: massiveEventCustomerNotification — nodeMailer/notifications.js:415
 * ruta: routes/nodeMailer.js:115
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostNodemailerMassiveEventCustomerNotificationBody {
  id?: string;
  payload?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/member-device-fee-receipt-notification`
 * handler: memberDeviceFeeReceiptNotification — nodeMailer/notifications.js:194
 * ruta: routes/nodeMailer.js:166
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
 * handler: memberDeviceIncidentNotification — nodeMailer/notifications.js:176
 * ruta: routes/nodeMailer.js:161
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
 * handler: memberEmailNotification — nodeMailer/notifications.js:907
 * ruta: routes/nodeMailer.js:182
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
 * handler: returningDeviceLeaseMemberNotification — nodeMailer/notifications.js:134
 * ruta: routes/nodeMailer.js:154
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerMemberLeaseReturnDeviceNotificationBody {
  devices?: unknown[];
  member?: Record<string, unknown>;
}

/**
 * `POST /api/nodemailer/new_invitation`
 * handler: newUserInvitationNotification — nodeMailer/notifications.js:328
 * ruta: routes/nodeMailer.js:91
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerNewInvitationBody {
  consumer?: Record<string, unknown>;
  link?: string;
  subject?: string;
}

/**
 * `POST /api/nodemailer/refund-notification`
 * handler: refundInvoice — nodeMailer/notifications.js:384
 * ruta: routes/nodeMailer.js:110
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
 * handler: linkToResetPassword — nodeMailer/notifications.js:304
 * ruta: routes/nodeMailer.js:79
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerResetAdminPasswordBody {
  contactInfo?: string;
  linkToResetPassword?: string;
}

/**
 * `POST /api/nodemailer/returned-items-to-renter-notification`
 * handler: returnedItemsToRenterNotification — nodeMailer/notifications.js:677
 * ruta: routes/nodeMailer.js:145
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedJobController
 * status: 200, 202, 500
 */
export interface PostNodemailerReturnedItemsToRenterNotificationBody {
  attachments?: unknown[];
  id?: string;
  payload?: Record<string, unknown>;
  staffEmails?: string;
  subject?: string;
}

/**
 * `POST /api/nodemailer/send-consumer-app-instructions`
 * handler: eventLinkEvent — nodeMailer/notifications.js:368
 * ruta: routes/nodeMailer.js:112
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
 * handler: singleEmailNotification — nodeMailer/notifications.js:320
 * ruta: routes/nodeMailer.js:88
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
 * handler: staffInternalNotification — nodeMailer/notifications.js:352
 * ruta: routes/nodeMailer.js:100
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
 * handler: termsAndConditionsAcceptanceNotification — nodeMailer/notifications.js:717
 * ruta: routes/nodeMailer.js:148
 * auth: sin middleware de auth en la ruta
 * generado por factory: createQueuedEmailController
 */
export interface PostNodemailerTermsAndConditionsAcceptanceBody {
  company?: Record<string, unknown>;
  consumer?: Record<string, unknown>;
  event?: Record<string, unknown>;
  signature?: Record<string, unknown>;
}

/**
 * `POST /api/notificationlog/notification-feed-log`
 * handler: feedNotificationLog — controller/notificationLog.js:9
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
 * handler: acceptInvitation — controller/registration.js:440
 * ruta: routes/registration.js:43
 * auth: check("company.company_name", "company.company_name es requerido").not().isEmpty(), validateFields
 * status: 400, 404, 500
 */
export interface PostRegistrationAcceptInvitationBody {
  company: Record<string, unknown>;
  user: Record<string, unknown>;
}

/**
 * `POST /api/registration/add-company`
 * handler: registerExistingUserNewCompany — controller/registration.js:299
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
 * handler: registerNewUserAndCompany — controller/registration.js:143
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
 * `POST /api/school/consent/public/respond`
 * handler: publicRespondConsent — mysql/controllers/school.js:1149
 * ruta: mysql/routes/school.js:80
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
 * ruta: mysql/routes/school.js:79
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 200, 400, 404, 410, 500
 */

/**
 * `POST /api/school/consent/record`
 * handler: recordConsent — mysql/controllers/school.js:703
 * ruta: mysql/routes/school.js:76
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
 * ruta: mysql/routes/school.js:77
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
 * ruta: mysql/routes/school.js:78
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
 * handler: consentStatus — mysql/controllers/school.js:1229
 * ruta: mysql/routes/school.js:82
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
 * ruta: mysql/routes/school.js:81
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
 * ruta: mysql/routes/school.js:60
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolDashboardBody {
  company_id: number;
}

/**
 * `POST /api/school/guardians/add`
 * handler: addStudentGuardian — mysql/controllers/school.js:498
 * ruta: mysql/routes/school.js:69
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
 * ruta: mysql/routes/school.js:72
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
 * ruta: mysql/routes/school.js:66
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolGuardiansBody {
  company_id: number;
  member_id: number;
}

/**
 * `POST /api/school/roster`
 * handler: schoolRoster — mysql/controllers/school.js:107
 * ruta: mysql/routes/school.js:63
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
 * handler: setConsentEnforcement — mysql/controllers/school.js:1318
 * ruta: mysql/routes/school.js:86
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
 * handler: getSchoolSettings — mysql/controllers/school.js:1276
 * ruta: mysql/routes/school.js:85
 * auth: canRead
 * status: 200, 400, 500
 */
export interface PostSchoolSettingsBody {
  company_id: number;
}

/**
 * `POST /api/school/student/access-log`
 * handler: studentAccessLog — mysql/controllers/school.js:430
 * ruta: mysql/routes/school.js:91
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
 * ruta: mysql/routes/school.js:90
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
 * ruta: mysql/routes/school.js:89
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
 * handler: getStaffActivityLogs — controller/staffActivityLog.js:188
 * ruta: routes/staffActivityLog.js:9
 * auth: validateJWT
 * generado por factory: createGetStaffActivityLogs
 * status: 403, 404, 500
 */
export interface GetStaffActivityLogQuery {
  action: string;
  end_date: string;
  limit?: string;
  page?: string;
  staff_member_id: string;
  start_date: string;
  target_model: string;
}

/**
 * `GET /api/staff/__staff-search`
 * handler: displayAllAdminUser — controller/admin.js:671
 * ruta: routes/staff.js:32
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `AdminUser.find()`: cualquier subconjunto de los campos de `models/AdminUser.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface GetStaffStaffSearchBody {
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
  role?: string;
  role_type?: string;
  subscriptionRenewals?: string;
  super_user?: boolean;
  tokenVersion?: number;
}

/**
 * `POST /api/staff/__staff-search`
 * handler: displayAllAdminUser — controller/admin.js:671
 * ruta: routes/staff.js:29
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se usa como FILTRO Mongo en `AdminUser.find()`: cualquier subconjunto de los campos de `models/AdminUser.js` (`{}` trae todo)
 * status: 201, 500
 */
export interface PostStaffStaffSearchBody {
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
  role?: string;
  role_type?: string;
  subscriptionRenewals?: string;
  super_user?: boolean;
  tokenVersion?: number;
}

/**
 * `GET /api/staff/admin-users`
 * handler: displayAllAdminUser — controller/admin.js:671
 * ruta: routes/staff.js:18
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
  role?: string;
  role_type?: string;
  subscriptionRenewals?: string;
  super_user?: boolean;
  tokenVersion?: number;
}

/**
 * `POST /api/staff/admin-users`
 * handler: displayAllAdminUser — controller/admin.js:671
 * ruta: routes/staff.js:21
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
  role?: string;
  role_type?: string;
  subscriptionRenewals?: string;
  super_user?: boolean;
  tokenVersion?: number;
}

/**
 * `GET /api/staff/consumers/search`
 * handler: searchCustomerByParameters — controller/stripe.js:1017
 * ruta: routes/staff.js:26
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
 * handler: editOtherAdminUser — controller/admin.js:479
 * ruta: routes/staff.js:23
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("staff", "update")
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 500
 */
export interface PatchStaffEditAdminByIdParams {
  id: string;
}

/**
 * `POST /api/staff/force-logout`
 * handler: forceEndSession — controller/admin.js:828
 * ruta: routes/staff.js:35
 * auth: sin middleware de auth en la ruta
 * status: 200, 400, 401, 404, 500
 */
export interface PostStaffForceLogoutBody {
  email: string;
  password: string;
}

/**
 * `POST /api/stripe/account_link`
 * handler: stripeAccountLink — controller/stripe.js:93
 * ruta: routes/stripe.js:71
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeAccountLinkBody {
  connectedAccountId?: string;
  origin?: string;
}

/**
 * `POST /api/stripe/account_sessions`
 * handler: stripeAccountSession — controller/stripe.js:118
 * ruta: routes/stripe.js:74
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeAccountSessionsBody {
  connectedAccountId?: string;
}

/**
 * `POST /api/stripe/accounts`
 * handler: stripeAccountCreate — controller/stripe.js:52
 * ruta: routes/stripe.js:68
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeAccountsBody {
  country?: string;
  email?: string;
}

/**
 * `POST /api/stripe/cancel/subscriptions/:id`
 * handler: updateCancelSubscription — controller/stripe.js:560
 * ruta: routes/stripe.js:168
 * auth: optionalJWT
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
 * handler: stripeCompanyAccountUpdate — controller/stripe.js:242
 * ruta: routes/stripe.js:282
 * auth: optionalJWT
 * NOTA: rest-spread `...updateData`: acepta campos extra
 * NOTA: pasa `req.body` completo a otra capa (revisar el controlador para el detalle)
 * status: 200, 400, 500
 */
export interface PostStripeCompanyAccountStripeUpdateBody {
  connectedAccountId?: string;
}

/**
 * `POST /api/stripe/company-account-stripe`
 * handler: stripeCompanyAccountFound — controller/stripe.js:982
 * ruta: routes/stripe.js:159
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeCompanyAccountStripeBody {
  company?: Record<string, unknown>;
}

/**
 * `POST /api/stripe/create-payment-intent-customized`
 * handler: stripePaymentIntentCustomized — controller/stripe.js:324
 * ruta: routes/stripe.js:87
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeCreatePaymentIntentCustomizedBody {
  receipt_email?: string;
  total?: string;
}

/**
 * `POST /api/stripe/create-payment-intent-subscription`
 * handler: stripePaymentIntentSubscription — controller/stripe.js:350
 * ruta: routes/stripe.js:90
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeCreatePaymentIntentSubscriptionBody {
  customerEmail?: string;
  total?: string;
}

/**
 * `POST /api/stripe/create-payment-intent`
 * handler: stripePaymentIntent — controller/stripe.js:273
 * ruta: routes/stripe.js:77
 * auth: optionalJWT, publicPaymentRateLimit, validatePublicPaymentPayload, attachServerIdempotencyKey
 * status: 201, 500
 */
export interface PostStripeCreatePaymentIntentBody {
  customerEmail?: string;
  customerId?: string;
  device?: Record<string, unknown>;
}

/**
 * `POST /api/stripe/create-subscriptions_no_trial`
 * handler: createSubscriptionNoTrialPeriod — controller/stripe.js:433
 * ruta: routes/stripe.js:103
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeCreateSubscriptionsNoTrialBody {
  items?: unknown[];
  period?: string;
  stripeCustomerID?: string;
}

/**
 * `POST /api/stripe/create-subscriptions`
 * handler: creatingSubscription — controller/stripe.js:375
 * ruta: routes/stripe.js:100
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeCreateSubscriptionsBody {
  items?: unknown[];
  period?: string;
  stripeCustomerID?: string;
}

/**
 * `POST /api/stripe/customer`
 * handler: stripeCustomer — controller/stripe.js:17
 * ruta: routes/stripe.js:65
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
 * handler: searchCustomerId — controller/stripe.js:734
 * ruta: routes/stripe.js:139
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
 * handler: listAllCustomers — controller/stripe.js:718
 * ruta: routes/stripe.js:133
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
 * handler: listAllCustomers — controller/stripe.js:718
 * ruta: routes/stripe.js:136
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
 * handler: partialRefundStripePaymentIntent — controller/stripe.js:858
 * ruta: routes/stripe.js:243
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validateRefundPayload, idempotencyMutationCache
 * status: 201, 500
 */
export interface PostStripeInternalPartialRefundBody {
  paymentIntent?: string;
  total?: string;
}

/**
 * `POST /api/stripe/internal/payment-intents/:id/cancel`
 * handler: cancelStripePaymentIntent — controller/stripe.js:813
 * ruta: routes/stripe.js:203
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validatePaymentIntentIdParam, idempotencyMutationCache
 * status: 201, 500
 */
export interface PostStripeInternalPaymentIntentsByIdCancelBody {
  id?: string;
}

/**
 * `POST /api/stripe/internal/payment-intents/:id/capture`
 * handler: captureStripePaymentIntent — controller/stripe.js:788
 * ruta: routes/stripe.js:195
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validatePaymentIntentIdParam, idempotencyMutationCache
 * status: 201, 404
 */
export interface PostStripeInternalPaymentIntentsByIdCaptureBody {
  amount_to_capture?: string;
  id?: string;
}

/**
 * `POST /api/stripe/internal/refund`
 * handler: refundStripePaymentIntent — controller/stripe.js:837
 * ruta: routes/stripe.js:235
 * auth: validateJWT, checkTokenVersion, authorizeMongoPermission("billing", "update"), validateRefundPayload, idempotencyMutationCache
 * status: 201, 500
 */
export interface PostStripeInternalRefundBody {
  paymentIntent?: string;
}

/**
 * `GET /api/stripe/invoices`
 * handler: displayAllPaidInvoicesPerSubscription — controller/stripe.js:603
 * ruta: routes/stripe.js:162
 * auth: optionalJWT
 * status: 201, 500
 */
export interface GetStripeInvoicesBody {
  subscriptionID?: string;
}

/**
 * `POST /api/stripe/invoices`
 * handler: displayAllPaidInvoicesPerSubscription — controller/stripe.js:603
 * ruta: routes/stripe.js:165
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripeInvoicesBody {
  subscriptionID?: string;
}

/**
 * `POST /api/stripe/new-company-account`
 * handler: companyInformationAccountStripe — controller/stripe.js:159
 * ruta: routes/stripe.js:97
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
 * handler: partialRefundStripePaymentIntent — controller/stripe.js:858
 * ruta: routes/stripe.js:227
 * auth: publicPaymentRateLimit, validateRefundPayload, idempotencyMutationCache
 * status: 201, 500
 */
export interface PostStripePartialRefundBody {
  paymentIntent?: string;
  total?: string;
}

/**
 * `POST /api/stripe/payment_intents/:id/update-payment-method`
 * handler: updatePaymentMethodFromAdminDashboard — controller/stripe.js:623
 * ruta: routes/stripe.js:120
 * auth: optionalJWT
 * status: 201, 500
 */
export interface PostStripePaymentIntentsByIdUpdatePaymentMethodBody {
  newPaymentMethodID?: string;
  paymentIntentId?: string;
}

/**
 * `GET /api/stripe/payment_intents/:id`
 * handler: retrievePaymentIntent — controller/stripe.js:920
 * ruta: routes/stripe.js:142
 * auth: optionalJWT
 * status: 201, 500
 */
export interface GetStripePaymentIntentsByIdParams {
  id: string;
}

/**
 * `POST /api/stripe/payment_methods/:id/attach`
 * handler: updateDefaultPaymentMethodInCustomer — controller/stripe.js:664
 * ruta: routes/stripe.js:113
 * auth: optionalJWT
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
 * handler: cancelStripePaymentIntent — controller/stripe.js:813
 * ruta: routes/stripe.js:186
 * auth: publicPaymentRateLimit, validatePaymentIntentIdParam, idempotencyMutationCache
 * status: 201, 500
 */
export interface PostStripePaymentIntentsByIdCancelBody {
  id?: string;
}

/**
 * `POST /api/stripe/payment-intents/:id/capture`
 * handler: captureStripePaymentIntent — controller/stripe.js:788
 * ruta: routes/stripe.js:177
 * auth: publicPaymentRateLimit, validatePaymentIntentIdParam, idempotencyMutationCache
 * status: 201, 404
 */
export interface PostStripePaymentIntentsByIdCaptureBody {
  amount_to_capture?: string;
  id?: string;
}

/**
 * `POST /api/stripe/payment-method/subscriptions/:id`
 * handler: updateDefaultPaymentMethodInSubscription — controller/stripe.js:644
 * ruta: routes/stripe.js:106
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201
 */
export interface PostStripePaymentMethodSubscriptionsByIdParams {
  id: string;
}

/**
 * `POST /api/stripe/refund`
 * handler: refundStripePaymentIntent — controller/stripe.js:837
 * ruta: routes/stripe.js:218
 * auth: publicPaymentRateLimit, validateRefundPayload, idempotencyMutationCache
 * status: 201, 500
 */
export interface PostStripeRefundBody {
  paymentIntent?: string;
}

/**
 * `DELETE /api/stripe/remove-duplicate/:id`
 * handler: removeDuplicateEntries — controller/stripe.js:900
 * ruta: routes/stripe.js:251
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteStripeRemoveDuplicateByIdParams {
  id: string;
}

/**
 * `DELETE /api/stripe/removing/:id`
 * handler: removeDuplicateEntry — controller/transaction.js:185
 * ruta: routes/stripe.js:270
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteStripeRemovingByIdParams {
  id: string;
}

/**
 * `POST /api/stripe/save-transaction-admin-dashboard`
 * handler: saveTransactionAdmin — controller/transaction.js:35
 * ruta: routes/stripe.js:258
 * auth: optionalJWT
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
 * handler: saveTransactionTemplateForNoRegularUser — controller/transaction.js:59
 * ruta: routes/stripe.js:261
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
 * handler: saveTransaction — controller/transaction.js:11
 * ruta: routes/stripe.js:255
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js`
 * status: 201, 500
 */
export interface PostStripeSaveTransactionBody {
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
 * `POST /api/stripe/setup-search`
 * handler: findSubscriptionIdBySetUpId — controller/stripe.js:478
 * ruta: routes/stripe.js:130
 * auth: optionalJWT
 * status: 201, 404, 500
 */
export interface PostStripeSetupSearchBody {
  setupId?: string;
}

/**
 * `POST /api/stripe/stripe-transaction-admin`
 * handler: saveStripeTransactionAdmin — controller/stripe.js:770
 * ruta: routes/stripe.js:174
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
 * handler: saveStripeTransactionTemplateForNoRegularUser — controller/stripe.js:879
 * ruta: routes/stripe.js:212
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
 * handler: saveStripeTransaction — controller/stripe.js:752
 * ruta: routes/stripe.js:171
 * auth: optionalJWT
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
 * handler: getListOfAllSavedStripeTransaction — controller/stripe.js:965
 * ruta: routes/stripe.js:145
 * auth: optionalJWT
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
 * handler: getListOfAllSavedStripeTransaction — controller/stripe.js:965
 * ruta: routes/stripe.js:152
 * auth: optionalJWT
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
 * handler: cancelSubscriptionCompany — controller/stripe.js:584
 * ruta: routes/stripe.js:279
 * auth: optionalJWT
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteStripeSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/stripe/subscriptions/:id`
 * handler: searchSubscriptions — controller/stripe.js:524
 * ruta: routes/stripe.js:273
 * auth: optionalJWT
 * status: 201, 500
 */
export interface GetStripeSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/stripe/transaction`
 * handler: getListOfAllSavedTransaction — controller/transaction.js:115
 * ruta: routes/stripe.js:267
 * auth: optionalJWT
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
 * handler: updateSubcriptionInCompanyAccount — controller/stripe.js:540
 * ruta: routes/stripe.js:276
 * auth: optionalJWT
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
 * handler: createSubscriptionNoTrialPeriod — controller/stripe.js:433
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
 * handler: retrieveSubscriptionID — controller/stripe.js:938
 * ruta: routes/subscription.js:33
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetSubscriptionSearchingSubscriptionSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/subscription/subscriptions/:id`
 * handler: searchingSubscriptionInStripe — controller/stripe.js:1001
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
 * handler: createAuditLog — controller/transactionAuditLog.js:5
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
 * handler: checkingAndReleasingDepositTransactions — controller/transaction.js:221
 * ruta: routes/transaction.js:52
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface PostTransactionCheckAndReleaseDepositTransactionsBody {
  company?: Record<string, unknown>;
  eventSelected?: string;
}

/**
 * `DELETE /api/transaction/remove-duplicate-transaction/:id`
 * handler: removeDuplicateEntry — controller/transaction.js:185
 * ruta: routes/transaction.js:43
 * auth: sin middleware de auth en la ruta
 * NOTA: el handler NO lee el body: manda `{}` (o nada).
 * status: 201, 500
 */
export interface DeleteTransactionRemoveDuplicateTransactionByIdParams {
  id: string;
}

/**
 * `POST /api/transaction/save-transaction-admin-dashboard`
 * handler: saveTransactionAdmin — controller/transaction.js:35
 * ruta: routes/transaction.js:25
 * auth: sin middleware de auth en la ruta
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
 * handler: saveTransactionTemplateForNoRegularUser — controller/transaction.js:59
 * ruta: routes/transaction.js:28
 * auth: sin middleware de auth en la ruta
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
 * handler: saveTransaction — controller/transaction.js:11
 * ruta: routes/transaction.js:22
 * auth: sin middleware de auth en la ruta
 * NOTA: el body se pasa completo a `new Transaction()`: los campos son los del esquema `models/Transaction.js`
 * status: 201, 500
 */
export interface PostTransactionSaveTransactionBody {
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
 * `GET /api/transaction/subscriptions/:id`
 * handler: retrieveSubscriptionID — controller/stripe.js:938
 * ruta: routes/transaction.js:46
 * auth: sin middleware de auth en la ruta
 * status: 201, 500
 */
export interface GetTransactionSubscriptionsByIdParams {
  id: string;
}

/**
 * `GET /api/transaction/transaction`
 * handler: gettingListOfSavedTransaction — controller/transaction.js:131
 * ruta: routes/transaction.js:37
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
 * handler: getListOfAllSavedTransaction — controller/transaction.js:115
 * ruta: routes/transaction.js:34
 * auth: sin middleware de auth en la ruta
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
 * handler: updateMultipleDocuments — controller/transaction.js:167
 * ruta: routes/transaction.js:49
 * auth: sin middleware de auth en la ruta
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
 * handler: updateTransaction — controller/transaction.js:82
 * ruta: routes/transaction.js:40
 * auth: sin middleware de auth en la ruta
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
  "PATCH /api/admin/profile/:id": { params: PatchAdminProfileByIdParams };
  "POST /api/admin/receiver-assignation": { body: PostAdminReceiverAssignationBody };
  "GET /api/admin/receiver-assigned": { body: GetAdminReceiverAssignedBody };
  "PATCH /api/admin/update-password": { body: PatchAdminUpdatePasswordBody };
  "POST /api/admin/users": { body: PostAdminUsersBody };
  "POST /api/article/article-creation": { body: PostArticleArticleCreationBody };
  "DELETE /api/article/article-delete/:id": { params: DeleteArticleArticleDeleteByIdParams };
  "PATCH /api/article/article-edit/:id": { params: PatchArticleArticleEditByIdParams };
  "GET /api/article/articles": { body: GetArticleArticlesBody };
  "GET /api/auth/:id": { params: GetAuthByIdParams };
  "PATCH /api/auth/:id": { params: PatchAuthByIdParams };
  "GET /api/auth/all-consumers-based-on-all-events-per-company/:companyID": { params: GetAuthAllConsumersBasedOnAllEventsPerCompanyByCompanyIDParams };
  "POST /api/auth/new": { body: PostAuthNewBody };
  "GET /api/auth/user-query": { body: GetAuthUserQueryBody };
  "POST /api/auth/user-query": { body: PostAuthUserQueryBody };
  "GET /api/auth/users": { body: GetAuthUsersBody };
  "POST /api/auth/users": { body: PostAuthUsersBody };
  "POST /api/auth": { body: PostAuthBody };
  "POST /api/cache_update/remove-cache": { body: PostCacheUpdateRemoveCacheBody };
  "GET /api/cash-report/cash-report": { body: GetCashReportCashReportBody };
  "POST /api/cash-report/cash-reports": { body: PostCashReportCashReportsBody };
  "POST /api/cash-report/create-cash-report": { body: PostCashReportCreateCashReportBody };
  "POST /api/cash-report/remove-cash-report/:id": { params: PostCashReportRemoveCashReportByIdParams };
  "PATCH /api/cash-report/update-cash-report/:id": { body: PatchCashReportUpdateCashReportByIdBody };
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
  "GET /api/consumer/users": { body: GetConsumerUsersBody };
  "POST /api/consumer/users": { body: PostConsumerUsersBody };
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
  "POST /api/db_company/update-items-based-on-alphanumeric-serial-number": { body: PostDbCompanyUpdateItemsBasedOnAlphanumericSerialNumberBody };
  "POST /api/db_company/update-items-based-on-serial-number": { body: PostDbCompanyUpdateItemsBasedOnSerialNumberBody };
  "POST /api/db_consumer_attending_event_record/consulting-consumer-event": {  };
  "POST /api/db_consumer_attending_event_record/consumer-events": { body: PostDbConsumerAttendingEventRecordConsumerEventsBody };
  "POST /api/db_consumer_attending_event_record/new_consumer_event": { body: PostDbConsumerAttendingEventRecordNewConsumerEventBody };
  "DELETE /api/db_consumer/:id": { body: DeleteDbConsumerByIdBody };
  "POST /api/db_consumer/consulting-consumer": { body: PostDbConsumerConsultingConsumerBody };
  "POST /api/db_consumer/consumers_information": {  };
  "POST /api/db_consumer/new_consumer": { body: PostDbConsumerNewConsumerBody };
  "DELETE /api/db_event/:id": { body: DeleteDbEventByIdBody };
  "POST /api/db_event/allocate-device-container-event": { body: PostDbEventAllocateDeviceContainerEventBody };
  "POST /api/db_event/allocate-device-event": { body: PostDbEventAllocateDeviceEventBody };
  "POST /api/db_event/confirm-item-return": { body: PostDbEventConfirmItemReturnBody };
  "POST /api/db_event/consulting-event": { body: PostDbEventConsultingEventBody };
  "POST /api/db_event/device-final-status-refactored": { body: PostDbEventDeviceFinalStatusRefactoredBody };
  "POST /api/db_event/device-final-status": { body: PostDbEventDeviceFinalStatusBody };
  "POST /api/db_event/event_device_directly": { body: PostDbEventEventDeviceDirectlyBody };
  "POST /api/db_event/event_device": {  };
  "POST /api/db_event/event_staff": { body: PostDbEventEventStaffBody };
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
  "POST /api/db_inventory/check-item": { body: PostDbInventoryCheckItemBody };
  "POST /api/db_inventory/check-large-data": { body: PostDbInventoryCheckLargeDataBody };
  "GET /api/db_inventory/container-items/:container_item_id": { params: GetDbInventoryContainerItemsByContainerItemIdParams };
  "POST /api/db_inventory/container-items": { body: PostDbInventoryContainerItemsBody };
  "DELETE /api/db_inventory/container/:container_item_id": { params: DeleteDbInventoryContainerByContainerItemIdParams };
  "PUT /api/db_inventory/container/:container_item_id": { body: PutDbInventoryContainerByContainerItemIdBody; params: PutDbInventoryContainerByContainerItemIdParams };
  "POST /api/db_inventory/update-large-data": {  };
  "POST /api/db_inventory/update-location-sub-location": { body: PostDbInventoryUpdateLocationSubLocationBody };
  "POST /api/db_item/:id": { body: PostDbItemByIdBody };
  "POST /api/db_item/bulk-item-alphanumeric": { body: PostDbItemBulkItemAlphanumericBody };
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
  "PUT /api/db_item/event-items/bulk-update": { body: PutDbItemEventItemsBulkUpdateBody };
  "POST /api/db_item/event-items/search": { body: PostDbItemEventItemsSearchBody };
  "DELETE /api/db_item/event-items": { body: DeleteDbItemEventItemsBody };
  "PUT /api/db_item/event-items": { body: PutDbItemEventItemsBody };
  "GET /api/db_item/fragment-data": { body: GetDbItemFragmentDataBody };
  "POST /api/db_item/get-inventory-company": { body: PostDbItemGetInventoryCompanyBody };
  "POST /api/db_item/inventory_event/:id": { params: PostDbItemInventoryEventByIdParams };
  "POST /api/db_item/inventory-based-on-location-and-sublocation": { body: PostDbItemInventoryBasedOnLocationAndSublocationBody; query: PostDbItemInventoryBasedOnLocationAndSublocationQuery };
  "POST /api/db_item/inventory-based-on-submitted-parameters": { body: PostDbItemInventoryBasedOnSubmittedParametersBody };
  "POST /api/db_item/inventory-pagination": { query: PostDbItemInventoryPaginationQuery };
  "POST /api/db_item/inventory-query": { body: PostDbItemInventoryQueryBody };
  "POST /api/db_item/item-out-warehouse": { body: PostDbItemItemOutWarehouseBody };
  "POST /api/db_item/items_information": { body: PostDbItemItemsInformationBody };
  "GET /api/db_item/location-count": { body: GetDbItemLocationCountBody };
  "POST /api/db_item/new_item": { body: PostDbItemNewItemBody };
  "POST /api/db_item/retrieve-item-data": { body: PostDbItemRetrieveItemDataBody };
  "POST /api/db_item/retrieve-item-location-quantity": { body: PostDbItemRetrieveItemLocationQuantityBody };
  "POST /api/db_item/return-event-devices": { body: PostDbItemReturnEventDevicesBody };
  "POST /api/db_item/returning-item-refactored": { body: PostDbItemReturningItemRefactoredBody };
  "GET /api/db_item/search-inventory": { body: GetDbItemSearchInventoryBody };
  "POST /api/db_item/search-inventory": { body: PostDbItemSearchInventoryBody };
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
  "GET /api/db_location/companies/:id/location-paths-tree": { params: GetDbLocationCompaniesByIdLocationPathsTreeParams };
  "GET /api/db_location/companies/:id/locations/tree": { params: GetDbLocationCompaniesByIdLocationsTreeParams };
  "GET /api/db_location/companies/:id/locations": { params: GetDbLocationCompaniesByIdLocationsParams };
  "POST /api/db_location/companies/:id/locations": { params: PostDbLocationCompaniesByIdLocationsParams };
  "PUT /api/db_location/locations/:id/inventory": { body: PutDbLocationLocationsByIdInventoryBody; params: PutDbLocationLocationsByIdInventoryParams };
  "POST /api/db_location/locations/:id": { params: PostDbLocationLocationsByIdParams };
  "POST /api/db_location/locations": { body: PostDbLocationLocationsBody };
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
  "GET /api/document/download/:documentId/:userId": { params: GetDocumentDownloadByDocumentIdByUserIdParams };
  "POST /api/document/download/documentUrl": { body: PostDocumentDownloadDocumentUrlBody };
  "DELETE /api/document/folder/:id": { params: DeleteDocumentFolderByIdParams };
  "GET /api/document/folder/:id": { params: GetDocumentFolderByIdParams };
  "PUT /api/document/folder/:id": { body: PutDocumentFolderByIdBody; params: PutDocumentFolderByIdParams };
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
  "POST /api/nodemailer/massive-event-customer-notification": { body: PostNodemailerMassiveEventCustomerNotificationBody };
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
  "POST /api/registration/accept-invitation": { body: PostRegistrationAcceptInvitationBody };
  "POST /api/registration/add-company": { body: PostRegistrationAddCompanyBody };
  "POST /api/registration/new": { body: PostRegistrationNewBody };
  "POST /api/school/consent/public/respond": { body: PostSchoolConsentPublicRespondBody };
  "POST /api/school/consent/public/retrieve": {  };
  "POST /api/school/consent/record": { body: PostSchoolConsentRecordBody };
  "POST /api/school/consent/request": { body: PostSchoolConsentRequestBody };
  "POST /api/school/consent/resend": { body: PostSchoolConsentResendBody };
  "POST /api/school/consent/status": { body: PostSchoolConsentStatusBody };
  "POST /api/school/consent": { body: PostSchoolConsentBody };
  "POST /api/school/dashboard": { body: PostSchoolDashboardBody };
  "POST /api/school/guardians/add": { body: PostSchoolGuardiansAddBody };
  "POST /api/school/guardians/search": { body: PostSchoolGuardiansSearchBody };
  "POST /api/school/guardians": { body: PostSchoolGuardiansBody };
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
  "GET /api/staff/__staff-search": { body: GetStaffStaffSearchBody };
  "POST /api/staff/__staff-search": { body: PostStaffStaffSearchBody };
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
