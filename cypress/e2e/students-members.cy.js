/**
 * School track (Members/Students) — real backend, no mocks.
 * Covers Phase 1 hardening: Students nav visibility (Education industry),
 * members list, and deep-linked member detail tabs (previously crashed).
 */
const EMAIL = Cypress.env('DEMO_EMAIL') || 'marcus.reyes@summitavrentals.com'
const PASSWORD = Cypress.env('DEMO_PASSWORD') || 'DemoPass123!'

const login = () => {
  cy.visit('/login')
  cy.get('input').first().should('be.visible').type(EMAIL)
  cy.contains('button', /continue/i).click()
  cy.get('input[type="password"]', { timeout: 15000 }).should('be.visible').type(PASSWORD, { log: false })
  cy.get('button').filter(':visible').contains(/sign in|log in|continue/i).click()
  cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login')
}

describe('Students (member) section', () => {
  beforeEach(login)

  it('shows the Students nav item for an Education company and lists students', () => {
    cy.contains('a,button', /^students$/i, { timeout: 20000 }).should('be.visible').click()
    cy.location('pathname').should('eq', '/members')
    // seeded students appear
    cy.contains('Maya Okafor', { timeout: 20000 }).should('be.visible')
    cy.contains('Ethan Zhou').should('be.visible')
  })

  it('deep link to member detail works without visiting the list first', () => {
    cy.visit('/member/1/main')
    // header renders the member (Redux hydrated from URL param, not list click)
    cy.get('#root', { timeout: 20000 }).should(($r) => {
      expect($r.text()).to.include('Maya')
      expect($r.text()).not.to.include('Something went wrong')
    })
  })

  it('deep link to the assignment tab does not crash', () => {
    cy.visit('/member/1/assignment')
    cy.location('pathname', { timeout: 30000 }).should('include', '/member/1')
    cy.get('#root', { timeout: 30000 }).should(($r) => {
      expect($r.text().trim().length).to.be.greaterThan(20)
      expect($r.text()).not.to.include('Something went wrong')
    })
  })

  it('member API rejects unauthenticated access', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:34001/api/db_member/consulting-member',
      body: { company_id: '2' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })
})
