// ─── buildMockToken ───────────────────────────────────────────────────────────
// Genera un JWT válido que jwt-decode puede parsear con exp en el futuro lejano
const buildMockToken = () => {
  const toB64Url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  const header = toB64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = toB64Url({ exp: 9999999999, role: 0, email: 'admin@devitrak.com' })
  return `${header}.${payload}.mocksig`
}

// Configura localStorage con auth token y estado Redux Persist antes de visitar la página
Cypress.Commands.add('loginAsAdmin', (visitPath = '/') => {
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
