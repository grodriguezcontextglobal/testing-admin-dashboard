// ─── buildMockToken ───────────────────────────────────────────────────────────
// Genera un JWT válido que jwt-decode puede parsear con exp en el futuro lejano
const buildMockToken = () => {
  const toB64Url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  const header = toB64Url({ alg: 'HS256', typ: 'JWT' })
  // sqlStaffId: App.jsx signs out a token without it (issued before the
  // backend's sqlStaffId fix).
  const payload = toB64Url({ exp: 9999999999, role: 0, email: 'admin@devitrak.com', sqlStaffId: 1 })
  return `${header}.${payload}.mocksig`
}

// Configura localStorage con auth token y estado Redux Persist antes de visitar la página.
// options.event: el evento abierto en Redux, para pantallas como event-quickglance.
Cypress.Commands.add('loginAsAdmin', (visitPath = '/', options = {}) => {
  const token = buildMockToken()

  const adminUser = {
    email: 'admin@devitrak.com',
    name: 'Test Admin',
    lastName: 'User',
    role: 0,
    company: 'Test Company',
    uid: 'test-uid-123',
    token,
    companyData: {
      id: 'test-company-id',
      company_name: 'Test Company',
      industry: 'Technology',
      employees: [
        {
          user: 'admin@devitrak.com',
          role: '0',
          super_user: true,
          preference: {
            managerLocation: [],
          },
        },
      ],
    },
    sqlInfo: {
      company_id: 'test-sql-company-id',
    },
  }

  const persistRoot = JSON.stringify({
    admin: JSON.stringify({
      status: 'authenticated',
      user: adminUser,
      errorMessage: null,
      mfaEnabled: false,
      companyAccountStripe: null,
      companyInfo: null,
    }),
    permission: JSON.stringify({
      role: '0',
      companyName: 'Test Company',
      locations: [],
    }),
    event: JSON.stringify({
      event: options.event ?? {},
      eventsPerAdmin: { active: [], completed: [] },
      isLoading: false,
    }),
    customer: JSON.stringify({ customer: {} }),
    stripe: JSON.stringify({ stripe: null }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  })

  cy.visit(visitPath, {
    onBeforeLoad(win) {
      win.localStorage.setItem('admin-token', token)
      win.localStorage.setItem('persist:root', persistRoot)
    },
  })
})

/**
 * Admin Console (console plan F9). Entra como un usuario de una empresa
 * cliente y visita `visitPath`.
 *
 * Por defecto es el caso trampa del plan (§2, §7): super_user en su propia
 * empresa Y con correo @devitrak.com, pero sin `platformAccess`. Ese usuario
 * NO puede entrar en la consola. Solo `platformAccess: true`, que únicamente
 * pone el servidor, abre la puerta.
 *
 * @param {string} visitPath
 * @param {object} [options]
 * @param {boolean} [options.platformAccess=false]
 * @param {string}  [options.email='owner@devitrak.com']
 */
Cypress.Commands.add('loginAsConsoleUser', (visitPath = '/platform', options = {}) => {
  const { platformAccess = false, email = 'owner@devitrak.com' } = options
  const token = buildMockToken()

  const user = {
    email,
    name: 'Console',
    lastName: 'Tester',
    role: 0,
    company: 'Test Company',
    uid: 'test-uid-123',
    token,
    // Solo cuando el servidor lo manda. hasPlatformAccess() exige === true,
    // así que `false` y la ausencia de la clave son el mismo caso.
    ...(platformAccess ? { platformAccess: true } : {}),
    companyData: {
      id: 'test-company-id',
      company_name: 'Test Company',
      industry: 'Technology',
      employees: [
        {
          user: email,
          role: '0',
          // La trampa: toda persona que crea una empresa lo tiene.
          super_user: true,
          preference: { managerLocation: [] },
        },
      ],
    },
    sqlInfo: { company_id: 'test-sql-company-id' },
  }

  const persistRoot = JSON.stringify({
    admin: JSON.stringify({
      status: 'authenticated',
      user,
      errorMessage: null,
      mfaEnabled: false,
      companyAccountStripe: null,
      companyInfo: null,
    }),
    permission: JSON.stringify({
      role: '0',
      companyName: 'Test Company',
      locations: [],
    }),
    event: JSON.stringify({
      event: {},
      eventsPerAdmin: { active: [], completed: [] },
      isLoading: false,
    }),
    customer: JSON.stringify({ customer: {} }),
    stripe: JSON.stringify({ stripe: null }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  })

  cy.visit(visitPath, {
    onBeforeLoad(win) {
      win.localStorage.setItem('admin-token', token)
      win.localStorage.setItem('persist:root', persistRoot)
    },
  })
})

/**
 * Visita la página de detalle de un consumer con el estado Redux correctamente
 * hidratado para que DetailPerConsumer pueda renderizar sin navegar desde la lista.
 *
 * @param {string} consumerId  - ID del consumer (usado en la URL)
 * @param {object} consumer    - Datos del consumer a inyectar en Redux
 */
Cypress.Commands.add('loginAsConsumerDetail', (consumerId, consumer = {}) => {
  const token = buildMockToken()

  const defaultConsumer = {
    uid: consumerId,
    id: consumerId,
    name: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+15551234567',
    data: { notes: [], profile_picture: null },
    ...consumer,
  }

  const adminUser = {
    email: 'admin@devitrak.com',
    name: 'Test Admin',
    lastName: 'User',
    role: 0,
    company: 'Test Company',
    uid: 'test-uid-123',
    token,
    companyData: {
      id: 'test-company-id',
      company_name: 'Test Company',
      industry: 'Technology',
      employees: [
        {
          user: 'admin@devitrak.com',
          role: '0',
          super_user: true,
          preference: { managerLocation: [] },
        },
      ],
    },
    sqlInfo: { company_id: 'test-sql-company-id' },
  }

  const persistRoot = JSON.stringify({
    admin: JSON.stringify({
      status: 'authenticated',
      user: adminUser,
      errorMessage: null,
      mfaEnabled: false,
      companyAccountStripe: null,
      companyInfo: null,
    }),
    permission: JSON.stringify({
      role: '0',
      companyName: 'Test Company',
      locations: [],
    }),
    event: JSON.stringify({
      event: {},
      eventsPerAdmin: { active: [], completed: [] },
      isLoading: false,
    }),
    customer: JSON.stringify({ customer: defaultConsumer }),
    stripe: JSON.stringify({ stripe: null }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  })

  cy.visit(`/consumers/${consumerId}`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('admin-token', token)
      win.localStorage.setItem('persist:root', persistRoot)
    },
  })
})

/**
 * Visita la página de detalle de un consumer dentro del contexto de un evento
 * (/events/event-attendees/:id) con Redux hidratado con datos de admin, evento
 * y customer completos — necesario para que ConsumerDetail y sus sub-componentes
 * (ConsumerActivity, StripeTransactionTable, ExpandedRowInTable, etc.) rendericen.
 *
 * @param {string} consumerId   - ID del consumer (uid), usado en la URL
 * @param {object} [options]
 * @param {object} [options.consumer] - Datos del consumer (overrides)
 * @param {object} [options.event]    - Datos del evento (overrides)
 */
Cypress.Commands.add('loginAsConsumerDetailInEvent', (consumerId, options = {}) => {
  const token = buildMockToken()

  const { consumer = {}, event = {} } = options

  const defaultConsumer = {
    uid: consumerId,
    id: consumerId,
    name: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+15551234567',
    data: { notes: [], profile_picture: null },
    ...consumer,
  }

  const defaultEvent = {
    id: 'test-event-001',
    eventInfoDetail: {
      eventName: 'Test Event 2025',
      startTime: '2025-06-01T08:00:00Z',
      endTime: '2025-06-30T22:00:00Z',
      eventLocation: 'Test Convention Center',
      dateBegin: '2025-06-01',
      dateEnd: '2025-06-30',
    },
    company: 'test-company-id',
    active: true,
    ...event,
  }

  const adminUser = {
    email: 'admin@devitrak.com',
    name: 'Test Admin',
    lastName: 'User',
    role: 0,
    company: 'Test Company',
    uid: 'test-uid-123',
    token,
    companyData: {
      id: 'test-company-id',
      company_name: 'Test Company',
      industry: 'Technology',
      employees: [
        {
          user: 'admin@devitrak.com',
          role: '0',
          super_user: true,
          preference: { managerLocation: [] },
        },
      ],
    },
    sqlInfo: { company_id: 'test-sql-company-id' },
  }

  const persistRoot = JSON.stringify({
    admin: JSON.stringify({
      status: 'authenticated',
      user: adminUser,
      errorMessage: null,
      mfaEnabled: false,
      companyAccountStripe: null,
      companyInfo: null,
    }),
    permission: JSON.stringify({
      role: '0',
      companyName: 'Test Company',
      locations: [],
    }),
    event: JSON.stringify({
      event: defaultEvent,
      eventsPerAdmin: { active: [], completed: [] },
      isLoading: false,
    }),
    customer: JSON.stringify({ customer: defaultConsumer }),
    stripe: JSON.stringify({ stripe: null }),
    devicesHandle: JSON.stringify({ devicePool: [], devicesAssigned: [], devicesReturned: [] }),
    helper: JSON.stringify({ searchValue: '' }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  })

  cy.visit(`/events/event-attendees/${consumerId}`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('admin-token', token)
      win.localStorage.setItem('persist:root', persistRoot)
    },
  })
})
