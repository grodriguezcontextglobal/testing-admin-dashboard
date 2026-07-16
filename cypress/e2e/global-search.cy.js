/**
 * Verifies unified global-search UX: the navbar search input opens the ⌘K
 * command palette (same as the magnifier button) instead of accepting text.
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

describe('Unified global search', () => {
  beforeEach(login)

  it('navbar search field is read-only (no text entry)', () => {
    cy.get('input[name="searchValue"]').should('have.attr', 'readonly')
  })

  it('clicking the navbar search field opens the command palette', () => {
    // palette closed initially
    cy.contains('Search commands, pages, actions').should('not.exist')
    cy.get('input[name="searchValue"]').click()
    // the palette's own input appears
    cy.get('input[placeholder="Search commands, pages, actions..."]', { timeout: 10000 })
      .should('be.visible')
    // and it should be focused so the user can type immediately
    cy.focused().should('have.attr', 'placeholder', 'Search commands, pages, actions...')
  })

  it('typing is impossible in the navbar field itself', () => {
    cy.get('input[name="searchValue"]').type('hello', { force: true })
    cy.get('input[name="searchValue"]').should('have.value', '')
  })

  it('magnifier button opens the palette WITHOUT navigating to search results', () => {
    cy.location('pathname').then((start) => {
      cy.get('button[data-open-cmdk]').click()
      cy.get('input[placeholder="Search commands, pages, actions..."]', { timeout: 10000 })
        .should('be.visible')
      // must NOT have navigated to the empty search results page
      cy.location('pathname').should('eq', start)
      cy.location('pathname').should('not.include', 'search-result-page')
    })
  })
})
