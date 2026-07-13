/**
 * Demo smoke test — runs against the REAL local backend (no API mocks).
 * One continuous session, exactly like a live demo: real login, then walk
 * through each main section and assert it renders without an error dialog.
 */
const EMAIL = Cypress.env('DEMO_EMAIL') || 'marcus.reyes@summitavrentals.com'
const PASSWORD = Cypress.env('DEMO_PASSWORD') || 'DemoPass123!'

const assertNoErrorSurface = () => {
  cy.get('body').should(($b) => {
    const text = $b.text()
    expect(text).not.to.include("doesn't exist")
    expect(text).not.to.include('An error occurred')
    expect(text).not.to.include('Internal Server Error')
    expect(text).not.to.include('Something went wrong')
  })
}

describe('Demo smoke (real backend, continuous session)', () => {
  it('logs in and walks every main section without errors', () => {
    cy.visit('/login')
    // Step 1: email
    cy.get('input').first().should('be.visible').type(EMAIL)
    cy.contains('button', /continue/i).click()
    // Step 2: password
    cy.get('input[type="password"]', { timeout: 15000 })
      .should('be.visible')
      .type(PASSWORD, { log: false })
    cy.get('button[type="submit"], button')
      .filter(':visible')
      .contains(/sign in|log in|continue/i)
      .click()
    cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login')
    assertNoErrorSurface()

    // Walk the main sections in the same session
    const sections = ['/inventory', '/events', '/consumers', '/staff', '/']
    sections.forEach((path) => {
      cy.visit(path)
      cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login')
      // App shell mounted with actual content
      cy.get('#root', { timeout: 30000 }).should(($r) => {
        expect($r.text().trim().length, `content on ${path}`).to.be.greaterThan(20)
      })
      // Give data queries a beat, then check for error surfaces
      cy.wait(1500)
      assertNoErrorSurface()
    })
  })
})
