/**
 * Tests CRUD para la sección /events
 *
 * Cubre:
 *  READ   – página carga con título, botones, filtros y campo de búsqueda
 *  READ   – con datos, muestra secciones "Live now", "Upcoming" y "Past events"
 *  READ   – estado vacío y filtros activos muestran mensajes apropiados
 *  CREATE – "Add new event" navega al formulario /create-event-page/event-detail
 *  UPDATE – filtros de estado modifican la vista (Live / Upcoming / Past / All)
 */

// Congela la fecha en 2026-06-15 para que live/upcoming/past sean deterministas
// independientemente del día en que se ejecute la suite.
const FROZEN_NOW = new Date('2026-06-15T12:00:00.000Z').getTime()

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const setupPageInterceptors = (list = []) => {
  cy.clock(FROZEN_NOW, ['Date'])
  cy.intercept('GET', /event-list-per-company/, {
    statusCode: 200,
    body: { ok: true, list },
  }).as('getEvents')
  cy.intercept('POST', /stripe\/company-account-stripe/, {
    statusCode: 200,
    body: { ok: true, companyAccountStripeFound: null },
  }).as('getStripe')
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Eventos – READ: estructura de la página', () => {
  beforeEach(() => {
    setupPageInterceptors()
    cy.loginAsAdmin('/events')
    cy.wait('@getEvents', { timeout: 15000 })
  })

  it('muestra el título "Events"', () => {
    cy.contains('Events', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el botón "Add new event"', () => {
    cy.contains('Add new event', { timeout: 10000 }).should('be.visible')
  })

  it('muestra los cuatro filtros de estado: All, Live, Upcoming, Past', () => {
    cy.contains('button', 'All', { timeout: 10000 }).should('be.visible')
    cy.contains('button', 'Live').should('be.visible')
    cy.contains('button', 'Upcoming').should('be.visible')
    cy.contains('button', 'Past').should('be.visible')
  })

  it('muestra el campo de búsqueda con placeholder "Search events"', () => {
    cy.get('input[placeholder="Search events"]', { timeout: 10000 }).should('exist')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Eventos – READ: lista de eventos (Live, Upcoming, Past)', () => {
  beforeEach(() => {
    setupPageInterceptors()
    cy.intercept('GET', /event-list-per-company/, {
      statusCode: 200,
      fixture: 'events.json',
    }).as('getEventsWithData')
    cy.loginAsAdmin('/events')
    cy.wait('@getEventsWithData', { timeout: 15000 })
    cy.contains('Live now', { timeout: 12000 }).should('exist')
  })

  it('muestra la sección "Live now" con el evento activo en curso', () => {
    cy.contains('Live now').should('be.visible')
    cy.contains('Summer Tech Conference').should('be.visible')
  })

  it('muestra la sección "Upcoming" con el evento próximo', () => {
    cy.contains('Upcoming').should('be.visible')
    cy.contains('Fall Product Launch').should('be.visible')
  })

  it('muestra la sección "Past events" con el evento finalizado', () => {
    cy.contains('Past events').should('be.visible')
    cy.contains('Spring Meetup 2026').should('be.visible')
  })

  it('el campo de búsqueda acepta texto para filtrar por nombre', () => {
    cy.get('input[placeholder="Search events"]').type('Summer')
    cy.get('input[placeholder="Search events"]').should('have.value', 'Summer')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Eventos – READ: estado vacío (sin eventos)', () => {
  beforeEach(() => {
    setupPageInterceptors([]) // lista vacía
    cy.loginAsAdmin('/events')
    cy.wait('@getEvents', { timeout: 15000 })
    // El spinner desaparece cuando la query resuelve; esperamos el botón
    cy.contains('Add new event', { timeout: 10000 }).should('be.visible')
  })

  it('no muestra la sección "Live now" cuando no hay eventos en vivo', () => {
    cy.contains('Live now').should('not.exist')
  })

  it('muestra "No events are live right now." al filtrar por Live', () => {
    cy.contains('button', 'Live').click()
    cy.contains('No events are live right now.', { timeout: 5000 }).should('be.visible')
  })

  it('muestra "No past events yet." al filtrar por Past', () => {
    cy.contains('button', 'Past').click()
    cy.contains('No past events yet.', { timeout: 5000 }).should('be.visible')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Eventos – CREATE: navegar al formulario de nuevo evento', () => {
  beforeEach(() => {
    setupPageInterceptors()
    cy.loginAsAdmin('/events')
    cy.wait('@getEvents', { timeout: 15000 })
    cy.wait('@getStripe', { timeout: 10000 })
  })

  it('el botón "Add new event" navega a /create-event-page/event-detail', () => {
    cy.contains('Add new event', { timeout: 10000 }).click()
    cy.url({ timeout: 8000 }).should('include', '/create-event-page/event-detail')
  })

  it('el formulario de creación de evento carga en la ruta correcta', () => {
    cy.intercept('POST', /db_event/, { statusCode: 200, body: { ok: true } })
    cy.intercept('POST', /company\/search-company/, {
      statusCode: 200,
      body: { ok: true, company: [] },
    })
    cy.loginAsAdmin('/create-event-page/event-detail')
    cy.url({ timeout: 8000 }).should('include', '/create-event-page/event-detail')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Eventos – UPDATE: filtros de estado modifican la vista', () => {
  beforeEach(() => {
    setupPageInterceptors()
    cy.intercept('GET', /event-list-per-company/, {
      statusCode: 200,
      fixture: 'events.json',
    }).as('getEventsWithData')
    cy.loginAsAdmin('/events')
    cy.wait('@getEventsWithData', { timeout: 15000 })
    cy.contains('Live now', { timeout: 12000 }).should('exist')
  })

  it('el filtro "Live" oculta las secciones Upcoming y Past events', () => {
    cy.contains('button', 'Live').click()
    cy.contains('Live now').should('be.visible')
    cy.contains('Upcoming').should('not.exist')
    cy.contains('Past events').should('not.exist')
  })

  it('el filtro "Upcoming" oculta la sección Live now', () => {
    cy.contains('button', 'Upcoming').click()
    cy.contains('Upcoming').should('be.visible')
    cy.contains('Live now').should('not.exist')
  })

  it('el filtro "Past" oculta la sección Live now', () => {
    cy.contains('button', 'Past').click()
    cy.contains('Past events').should('be.visible')
    cy.contains('Live now').should('not.exist')
  })

  it('el filtro "All" restaura la vista con Live now y Upcoming visibles', () => {
    cy.contains('button', 'Live').click()
    cy.contains('button', 'All').click()
    cy.contains('Live now').should('be.visible')
    cy.contains('Upcoming').should('be.visible')
  })

  it('el filtro activo tiene estilos destacados (fondo oscuro)', () => {
    cy.contains('button', 'Live').click()
    // El botón activo recibe background #344054 y color blanco via pillActiveStyle
    cy.contains('button', 'Live')
      .should('have.css', 'background-color')
      .and('not.equal', 'transparent')
  })
})
