/**
 * Tests E2E para la sección /consumers
 *
 * Cubre:
 *  READ   – página carga y muestra título y botón principal
 *  READ   – sección Quick glance: stat tiles y chart compacto
 *  READ   – búsqueda ahora vive en la fila del TableHeader
 *  READ   – estado vacío muestra banner apropiado
 *  CREATE – modal "Add new consumer", campos y validaciones
 *  CREATE – envío del formulario con intercepción de API
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

const interceptConsumers = (fixtureOrBody = 'consumers.json') => {
  const opts =
    typeof fixtureOrBody === 'string'
      ? { fixture: fixtureOrBody }
      : { statusCode: 200, body: fixtureOrBody }
  cy.intercept('GET', /all-consumers-based-on-all-events-per-company/, {
    statusCode: 200,
    ...opts,
  }).as('getConsumers')
}

const waitForList = (timeout = 15000) => {
  cy.wait('@getConsumers', { timeout })
  // Espera a que el conteo aparezca (indica que el estado se hidratró)
  cy.contains('2 total', { timeout: 10000 }).should('exist')
}

// ─── READ: estructura de la página ───────────────────────────────────────────

describe('Consumidores – READ: estructura de la página', () => {
  beforeEach(() => {
    interceptConsumers()
    cy.loginAsAdmin('/consumers')
    cy.wait('@getConsumers', { timeout: 15000 })
  })

  it('muestra el título "Consumers"', () => {
    cy.contains('Consumers', { timeout: 10000 }).should('exist')
  })

  it('muestra el botón "Add new consumer" en el header', () => {
    cy.contains('Add new consumer', { timeout: 10000 }).should('exist')
  })
})

// ─── READ: Quick glance – stat tiles ─────────────────────────────────────────

describe('Consumidores – READ: sección Quick glance (stat tiles)', () => {
  beforeEach(() => {
    interceptConsumers()
    cy.loginAsAdmin('/consumers')
    waitForList()
  })

  it('muestra el encabezado "Quick glance"', () => {
    cy.contains('Quick glance').should('exist')
  })

  it('muestra el stat tile "Total consumers" con el valor correcto', () => {
    cy.get('[data-testid="stat-total"]', { timeout: 8000 }).should('exist')
    cy.get('[data-testid="stat-total"]').should('contain.text', '2')
    cy.get('[data-testid="stat-total"]').should('contain.text', 'Total consumers')
  })

  it('muestra el stat tile "Active" con el valor correcto', () => {
    cy.get('[data-testid="stat-active"]', { timeout: 8000 }).should('exist')
    cy.get('[data-testid="stat-active"]').should('contain.text', '1')
    cy.get('[data-testid="stat-active"]').should('contain.text', 'Active')
  })

  it('muestra el stat tile "Inactive" con el valor correcto', () => {
    cy.get('[data-testid="stat-inactive"]', { timeout: 8000 }).should('exist')
    cy.get('[data-testid="stat-inactive"]').should('contain.text', '1')
    cy.get('[data-testid="stat-inactive"]').should('contain.text', 'Inactive')
  })

  it('muestra el stat tile "From events"', () => {
    cy.get('[data-testid="stat-from-events"]', { timeout: 8000 }).should('exist')
    cy.get('[data-testid="stat-from-events"]').should('contain.text', 'From events')
  })

  it('la sección de stats no aparece cuando no hay consumidores', () => {
    // Override con respuesta vacía
    cy.intercept('GET', /all-consumers-based-on-all-events-per-company/, {
      statusCode: 200,
      body: { ok: true, result: { totalConsumers: 0 }, consumers: [] },
    }).as('getEmptyConsumers')
    cy.loginAsAdmin('/consumers')
    cy.wait('@getEmptyConsumers', { timeout: 15000 })
    cy.get('[data-testid="consumer-stats-section"]', { timeout: 5000 }).should('not.exist')
  })
})

// ─── READ: búsqueda en TableHeader ───────────────────────────────────────────

describe('Consumidores – READ: campo de búsqueda en la fila del TableHeader', () => {
  beforeEach(() => {
    interceptConsumers()
    cy.loginAsAdmin('/consumers')
    waitForList()
  })

  it('el campo de búsqueda existe con el placeholder correcto', () => {
    cy.get('input[placeholder="Search consumer here"]', { timeout: 8000 }).should('exist')
  })

  it('el campo de búsqueda acepta texto', () => {
    cy.get('input[placeholder="Search consumer here"]').type('John')
    cy.get('input[placeholder="Search consumer here"]').should('have.value', 'John')
  })

  it('el campo de búsqueda vive junto al contador de la tabla (no en el header de página)', () => {
    // El contador "N total" y el input deben estar dentro del mismo TableHeader,
    // no separados en distintos bloques de la página.
    cy.contains('2 total')
      .parents('[class*="MuiGrid"]')
      .find('input[placeholder="Search consumer here"]')
      .should('exist')
  })

  it('muestra el encabezado "Consumers" en el TableHeader con el conteo', () => {
    cy.contains('2 total').should('exist')
  })
})

// ─── CREATE: modal ────────────────────────────────────────────────────────────

describe('Consumidores – CREATE: modal "Add new consumer"', () => {
  beforeEach(() => {
    interceptConsumers()
    cy.loginAsAdmin('/consumers')
    cy.wait('@getConsumers', { timeout: 15000 })
    cy.contains('Add new consumer', { timeout: 10000 }).should('exist')
  })

  it('abre el modal al hacer clic en "Add new consumer"', () => {
    cy.contains('Add new consumer').first().click()
    cy.get('body', { timeout: 8000 }).should('contain.text', 'Add new consumer.')
  })

  it('el modal muestra los campos del formulario requeridos', () => {
    cy.contains('Add new consumer').first().click()
    cy.get('body', { timeout: 8000 }).should('contain.text', 'Add new consumer.')
    cy.get('input[placeholder="First name"]').should('exist')
    cy.get('input[placeholder="Last name"]').should('exist')
    cy.get('input[placeholder="Enter your email"]').should('exist')
    cy.get('#phone_input_check').should('exist')
  })

  it('muestra errores de validación al enviar el formulario vacío', () => {
    cy.contains('Add new consumer').first().click()
    cy.get('body', { timeout: 8000 }).should('contain.text', 'Add new consumer.')
    cy.get('form').find('button[type="submit"]').last().click()
    cy.contains('First name is required', { timeout: 5000 }).should('exist')
  })

  it('permite ingresar datos en el formulario', () => {
    cy.contains('Add new consumer').first().click()
    cy.get('body', { timeout: 8000 }).should('contain.text', 'Add new consumer.')
    cy.get('input[placeholder="First name"]').type('John')
    cy.get('input[placeholder="Last name"]').type('Doe')
    cy.get('input[placeholder="Enter your email"]').type('john.doe@test.com')
    cy.get('input[placeholder="First name"]').should('have.value', 'John')
    cy.get('input[placeholder="Last name"]').should('have.value', 'Doe')
    cy.get('input[placeholder="Enter your email"]').should('have.value', 'john.doe@test.com')
  })

  it('el modal se cierra con el botón X', () => {
    cy.contains('Add new consumer').first().click()
    cy.get('body', { timeout: 8000 }).should('contain.text', 'Add new consumer.')
    cy.get('[aria-label="Close"]').first().click()
    cy.get('body').should('not.contain.text', 'Add new consumer.')
  })
})

// ─── CREATE: envío de formulario con API ─────────────────────────────────────

describe('Consumidores – CREATE: envío del formulario con intercepción de API', () => {
  beforeEach(() => {
    interceptConsumers()
    cy.intercept('POST', /auth\/user-query/, {
      statusCode: 200,
      body: { ok: true, users: [] },
    }).as('checkUser')
    cy.intercept('POST', /auth\/new/, {
      statusCode: 200,
      body: {
        ok: true,
        user: {
          _id: 'new-consumer-id',
          name: 'Test',
          lastName: 'Consumer',
          email: 'test.consumer@test.com',
          id: 'new-consumer-id',
          uid: 'new-consumer-uid',
        },
      },
    }).as('createUser')
    cy.intercept('POST', /db_consumer\/new_consumer/, {
      statusCode: 200,
      body: { ok: true },
    }).as('createConsumerSql')

    cy.loginAsAdmin('/consumers')
    cy.wait('@getConsumers', { timeout: 15000 })
    cy.contains('Add new consumer', { timeout: 10000 }).should('exist')
  })

  it('envía el formulario con datos válidos y llama al endpoint de verificación', () => {
    cy.contains('Add new consumer').first().click()
    cy.get('body', { timeout: 8000 }).should('contain.text', 'Add new consumer.')
    cy.get('input[placeholder="First name"]').type('Test')
    cy.get('input[placeholder="Last name"]').type('Consumer')
    cy.get('input[placeholder="Enter your email"]').type('test.consumer@test.com')
    cy.get('#phone_input_check').type('5551234567')
    cy.get('form').find('button[type="submit"]').last().click()
    cy.wait('@checkUser', { timeout: 8000 })
  })
})

// ─── DETAIL: página de detalle de un consumer ────────────────────────────────

describe('Consumidores – DETAIL: página de detalle', () => {
  const CONSUMER_ID = 'test-consumer-001'

  const mockConsumer = {
    uid: CONSUMER_ID,
    id: CONSUMER_ID,
    name: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+15551234567',
    data: {
      notes: [
        { date: '2025-01-10T10:00:00Z', notes: 'First note', company: 'test-company-id' },
        { date: '2025-02-15T12:00:00Z', notes: 'Second note', company: 'test-company-id' },
      ],
      profile_picture: null,
    },
  }

  const interceptTransactions = (list = []) => {
    cy.intercept('POST', /\/transaction\/transaction/, {
      statusCode: 200,
      body: { ok: true, list },
    }).as('getTransactions')
  }

  beforeEach(() => {
    interceptTransactions()
    cy.loginAsConsumerDetail(CONSUMER_ID, mockConsumer)
    cy.wait('@getTransactions', { timeout: 15000 })
  })

  it('muestra el nombre del consumer como título de la página', () => {
    cy.get('[data-testid="consumer-detail-title"]', { timeout: 10000 })
      .should('contain.text', 'John')
      .and('contain.text', 'Doe')
  })

  it('no muestra el botón "Add new consumer" en el detail page', () => {
    cy.contains('Add new consumer', { timeout: 5000 }).should('not.exist')
  })

  it('muestra el header del consumer con nombre y email', () => {
    cy.get('[data-testid="consumer-header"]', { timeout: 10000 }).should('exist')
    cy.get('[data-testid="consumer-name"]').should('contain.text', 'John Doe')
    cy.contains('john.doe@example.com').should('exist')
  })

  it('muestra el stat tile de Transactions', () => {
    cy.get('[data-testid="stat-transactions"]', { timeout: 10000 }).should('exist')
    cy.get('[data-testid="stat-transactions"]').should('contain.text', 'Transactions')
  })

  it('muestra el stat tile de Events attended', () => {
    cy.get('[data-testid="stat-events"]', { timeout: 10000 }).should('exist')
    cy.get('[data-testid="stat-events"]').should('contain.text', 'Events attended')
  })

  it('muestra la tarjeta de notas con las notas del consumer', () => {
    cy.get('[data-testid="notes-card"]', { timeout: 10000 }).should('exist')
    cy.get('[data-testid="notes-list"]').should('exist')
    cy.get('[data-testid="notes-list"]').should('contain.text', 'First note')
    cy.get('[data-testid="notes-list"]').should('contain.text', 'Second note')
  })

  it('muestra el campo de búsqueda de transacciones', () => {
    cy.get('[data-testid="transaction-search"]', { timeout: 10000 }).should('exist')
    cy.get('[data-testid="transaction-search"]').should(
      'have.attr',
      'placeholder',
      'Search a transaction here'
    )
  })

  it('el campo de búsqueda de transacciones acepta texto', () => {
    cy.get('[data-testid="transaction-search"]', { timeout: 10000 }).type('INV-001')
    cy.get('[data-testid="transaction-search"]').should('have.value', 'INV-001')
  })

  it('muestra los botones de acción del consumer (Send notification + Edit)', () => {
    cy.get('[data-testid="consumer-actions"]', { timeout: 10000 }).should('exist')
    cy.get('[data-testid="consumer-actions"]').contains('Send notification to customer').should('exist')
    cy.get('[data-testid="consumer-actions"]').contains('Edit').should('exist')
  })

  it('muestra el breadcrumb con enlace a "All consumers"', () => {
    cy.contains('All consumers', { timeout: 8000 }).should('exist')
  })

  it('el estado vacío de notas muestra el mensaje correcto cuando no hay notas', () => {
    const consumerWithoutNotes = { ...mockConsumer, data: { notes: [], profile_picture: null } }
    interceptTransactions()
    cy.loginAsConsumerDetail(CONSUMER_ID, consumerWithoutNotes)
    cy.wait('@getTransactions', { timeout: 15000 })
    cy.get('[data-testid="notes-list"]', { timeout: 10000 }).should(
      'contain.text',
      "No notes yet"
    )
  })
})

// ─── READ: estado vacío ───────────────────────────────────────────────────────

describe('Consumidores – READ: estado vacío (sin consumidores)', () => {
  beforeEach(() => {
    cy.intercept('GET', /all-consumers-based-on-all-events-per-company/, {
      statusCode: 200,
      body: { ok: true, result: { totalConsumers: 0 }, consumers: [] },
    }).as('getEmptyConsumers')
    cy.loginAsAdmin('/consumers')
    cy.wait('@getEmptyConsumers', { timeout: 15000 })
  })

  it('muestra el mensaje de estado vacío "Add consumers"', () => {
    cy.contains('Add consumers', { timeout: 10000 }).should('exist')
  })

  it('muestra el botón "Add new consumer" en la vista vacía', () => {
    cy.contains('Add new consumer', { timeout: 10000 }).should('exist')
  })

  it('no muestra la sección de stats cuando no hay consumidores', () => {
    cy.get('[data-testid="consumer-stats-section"]', { timeout: 5000 }).should('not.exist')
  })

  it('no muestra el campo de búsqueda cuando no hay consumidores', () => {
    cy.get('input[placeholder="Search consumer here"]', { timeout: 5000 }).should('not.exist')
  })
})
