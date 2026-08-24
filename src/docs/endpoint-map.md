# Endpoint Map - Core Domains

## Scope
Core endpoints for project kickoff across Mongo (`/api/*`) and MySQL (`/api/db_*`) surfaces.

---

## Auth

- **[POST] `/api/auth/new`**
- Controller: `controller/auth.js -> newUser`
- Auth: No (validation middleware only)
- Data impact: user/admin records (Mongo)
- Risk: **High** (account creation)

- **[POST] `/api/auth`**
- Controller: `controller/auth.js -> checkUser`
- Auth: No
- Data impact: user lookup/auth flow (Mongo)
- Risk: **High** (login/auth gate)

- **[GET] `/api/auth/:id`**
- Controller: `controller/auth.js -> getUser`
- Auth: No route-level JWT middleware detected
- Data impact: user profile retrieval (Mongo)
- Risk: **High** (PII exposure if not protected in controller)

- **[PATCH] `/api/auth/:id`**
- Controller: `controller/auth.js -> editUser`
- Auth: No route-level JWT middleware detected
- Data impact: user profile updates (Mongo)
- Risk: **High**

- **[GET|POST] `/api/auth/users` and `/api/auth/user-query`**
- Controller: `controller/auth.js -> showAllUsers / getListOfUsers`
- Auth: No route-level JWT middleware detected
- Data impact: user listings (Mongo)
- Risk: **High**

- **[GET] `/api/auth/all-consumers-based-on-all-events-per-company/:companyID`**
- Controller: `controller/auth.js -> getAllConsumersBasedOnAllEventsPerCompany`
- Auth: No route-level JWT middleware detected
- Data impact: user + event-linked consumer data (Mongo)
- Risk: **High**

---

## Inventory

### Mongo inventory surface

- **[POST] `/api/inventory/create-inventory`**
- Controller: `controller/inventory.js -> createInventory`
- Auth: **Yes** (`validateJWT`)
- Data impact: inventory records (Mongo)
- Risk: **High**

- **[PATCH] `/api/inventory/edit-inventory/:id`**
- Controller: `controller/inventory.js -> editInventory`
- Auth: **Yes** (`validateJWT`)
- Data impact: inventory records (Mongo)
- Risk: **High**

- **[DELETE] `/api/inventory/delete-inventory/:id`**
- Controller: `controller/inventory.js -> deleteInventory`
- Auth: **Yes** (`validateJWT`)
- Data impact: inventory records (Mongo)
- Risk: **High**

- **[GET] `/api/inventory/list-inventories`**
- Controller: `controller/inventory.js -> listOfInventories`
- Auth: **Yes** (`validateJWT`)
- Data impact: inventory listings (Mongo)
- Risk: **Medium**

### MySQL inventory surface

- **[POST] `/api/db_inventory/container-items`**
- Controller: `mysql/controllers/item.js -> insertContainerItems`
- Auth: No route-level JWT middleware detected
- Data impact: container/item tables (MySQL)
- Risk: **High**

- **[POST] `/api/db_inventory/check-item`**
- Controller: `mysql/controllers/item.js -> checkingItem`
- Auth: No route-level JWT middleware detected
- Data impact: item validation/read path (MySQL)
- Risk: **Medium**

- **[GET] `/api/db_inventory/container-items/:container_item_id`**
- Controller: `mysql/controllers/item.js -> getContainerItems`
- Auth: No route-level JWT middleware detected
- Data impact: item retrieval (MySQL)
- Risk: **Medium**

- **[PUT] `/api/db_inventory/container/:container_item_id`**
- Controller: `mysql/controllers/item.js -> updateContainerItems`
- Auth: No route-level JWT middleware detected
- Data impact: item updates (MySQL)
- Risk: **High**

- **[DELETE] `/api/db_inventory/container/:container_item_id`**
- Controller: `mysql/controllers/item.js -> deleteContainerItem`
- Auth: No route-level JWT middleware detected
- Data impact: item deletion (MySQL)
- Risk: **High**

- **[POST] `/api/db_inventory/update-location-sub-location`**
- Controller: `mysql/controllers/item.js -> updateSubLocation`
- Auth: No route-level JWT middleware detected
- Data impact: location/sub-location mappings (MySQL)
- Risk: **High**

- **[POST] `/api/db_inventory/update-large-data`**
- Controller: `mysql/controllers/item.js -> updateLargeData` (duplicate declaration exists)
- Auth: No route-level JWT middleware detected
- Data impact: bulk inventory updates (MySQL)
- Risk: **High**

---

## Events

### Mongo event surface

- **[POST] `/api/event/create-event`**
- Controller: `controller/event.js -> createEvent`
- Auth: **Yes** (`validateJWT`)
- Data impact: event records (Mongo)
- Risk: **High**

- **[PUT|PATCH] `/api/event/edit-event/:id`**
- Controller: `controller/event.js -> editSubscriptionEvent`
- Auth: **Yes** (`validateJWT`)
- Data impact: event updates (Mongo)
- Risk: **High**

- **[PATCH] `/api/event/edit-staff-event/:id`**
- Controller: `controller/event.js -> editEvent`
- Auth: **Yes** (`validateJWT`)
- Data impact: event staffing data (Mongo)
- Risk: **High**

- **[GET|POST] `/api/event/event-list`**
- Controller: `controller/event.js -> eventList`
- Auth: No route-level JWT middleware detected
- Data impact: event listing (Mongo)
- Risk: **Medium/High**

- **[DELETE] `/api/event/delete-event/:id`**
- Controller: `controller/event.js -> deleteEvent`
- Auth: **Yes** (`validateJWT`)
- Data impact: event deletion (Mongo)
- Risk: **High**

- **[PATCH] `/api/event/update-events`**
- Controller: `controller/event.js -> updateLargeNumberOfEventsAtOnce`
- Auth: No route-level JWT middleware detected
- Data impact: bulk event updates (Mongo)
- Risk: **High**

- **[POST] `/api/event/update-global-state`**
- Controller: `controller/event.js -> updateGlobalStateOfEvent`
- Auth: No route-level JWT middleware detected
- Data impact: global event flags (Mongo)
- Risk: **High**

### MySQL event surface

- **[POST] `/api/db_event/new_event`**
- Controller: `mysql/controllers/events.js -> insertingEvent`
- Auth: No route-level JWT middleware detected
- Data impact: events tables (MySQL)
- Risk: **High**

- **[POST] `/api/db_event/event_device`**
- Controller: `mysql/controllers/items_events.js -> insertingItemInEvent`
- Auth: No route-level JWT middleware detected
- Data impact: event_items allocations (MySQL)
- Risk: **High**

- **[POST] `/api/db_event/event_device_directly`**
- Controller: `mysql/controllers/items_events.js -> insertingDeviceInEventDirectly`
- Auth: No route-level JWT middleware detected
- Data impact: inventory + event assignment tables (MySQL)
- Risk: **High**

- **[POST] `/api/db_event/returning-item-refactored`**
- Controller: `mysql/controllers/item.js -> returningItemToStockWhenEventIsFinishedRefactored`
- Auth: No route-level JWT middleware detected
- Data impact: item status transitions + stock restoration (MySQL)
- Risk: **High**

- **[POST] `/api/db_event/device-final-status-refactored`**
- Controller: `mysql/controllers/item.js -> itemFinalStatusWhenEventIsFinishedRefactored`
- Auth: No route-level JWT middleware detected
- Data impact: final device status writes (MySQL)
- Risk: **High**

- **[DELETE] `/api/db_event/:id`**
- Controller: `mysql/controllers/events.js -> deleteEvent`
- Auth: No route-level JWT middleware detected
- Data impact: event deletion and linked allocations (MySQL)
- Risk: **High**

---

## Payments (Stripe)

### Mongo stripe surface

- **[POST] `/api/stripe/create-payment-intent`**
- Controller: `controller/stripe.js -> stripePaymentIntent`
- Auth: No route-level JWT middleware detected
- Data impact: Stripe intent creation + transaction tracking (Stripe + Mongo)
- Risk: **Critical**

- **[POST] `/api/stripe/payment-intents/:id/capture`**
- Controller: `controller/stripe.js -> captureStripePaymentIntent`
- Auth: No route-level JWT middleware detected
- Data impact: payment capture state (Stripe + Mongo)
- Risk: **Critical**

- **[POST] `/api/stripe/payment-intents/:id/cancel`**
- Controller: `controller/stripe.js -> cancelStripePaymentIntent`
- Auth: No route-level JWT middleware detected
- Data impact: payment cancellation state
- Risk: **Critical**

- **[POST] `/api/stripe/refund` and `/api/stripe/partial-refund`**
- Controller: `controller/stripe.js -> refundStripePaymentIntent / partialRefundStripePaymentIntent`
- Auth: No route-level JWT middleware detected
- Data impact: refunds and financial reconciliation
- Risk: **Critical**

- **[POST] `/api/stripe/create-subscriptions`**
- Controller: `controller/stripe.js -> creatingSubscription`
- Auth: No route-level JWT middleware detected
- Data impact: subscription lifecycle + billing records
- Risk: **Critical**

- **[DELETE] `/api/stripe/subscriptions/:id`**
- Controller: `controller/stripe.js -> cancelSubscriptionCompany`
- Auth: No route-level JWT middleware detected
- Data impact: subscription cancellation
- Risk: **Critical**

### MySQL stripe surface

- **[POST] `/api/db_stripe/consulting-stripe`**
- Controller: `mysql/controllers/stripe.js -> consultingStripeCustomer`
- Auth: No route-level JWT middleware detected
- Data impact: customer lookups (MySQL + Stripe references)
- Risk: **High**

- **[POST] `/api/db_stripe/new_stripe`**
- Controller: `mysql/controllers/stripe.js -> insertingStripeCustomer`
- Auth: No route-level JWT middleware detected
- Data impact: Stripe customer persistence (MySQL)
- Risk: **High**

---

## Notes / Immediate Risks