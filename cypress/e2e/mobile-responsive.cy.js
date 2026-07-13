/**
 * Small-viewport regression checks (real backend):
 * - navbar search field is visible on every breakpoint
 * - home page action buttons stack instead of bleeding off-screen
 * - no horizontal overflow on the home page
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

const VIEWPORTS = [
  { w: 280, h: 847, name: 'Galaxy Fold cover (narrowest real device)' },
  { w: 282, h: 847, name: 'very small phone' },
  { w: 307, h: 847, name: 'tiny phone' },
  { w: 375, h: 812, name: 'iPhone' },
  { w: 768, h: 1024, name: 'tablet' },
  { w: 1280, h: 800, name: 'desktop' },
]

describe('Mobile responsiveness', () => {
  VIEWPORTS.forEach(({ w, h, name }) => {
    it(`${name} (${w}px): search visible, buttons contained, no x-overflow`, () => {
      cy.viewport(w, h)
      login()
      cy.visit('/')

      // 1. search bar visible on all breakpoints
      cy.get('input[name="searchValue"]').should('be.visible')

      // 2. home action buttons fully inside the viewport
      cy.contains('Add to inventory', { timeout: 20000 }).should('be.visible').then(($el) => {
        const r = $el[0].getBoundingClientRect()
        expect(r.right, 'Add to inventory right edge').to.be.at.most(w + 1)
        expect(r.left, 'Add to inventory left edge').to.be.at.least(-1)
      })
      cy.contains('Create new event').should('be.visible').then(($el) => {
        const r = $el[0].getBoundingClientRect()
        expect(r.right, 'Create new event right edge').to.be.at.most(w + 1)
        expect(r.left, 'Create new event left edge').to.be.at.least(-1)
      })

      // 3. page has no horizontal scroll
      cy.document().then((doc) => {
        expect(
          doc.documentElement.scrollWidth,
          'document scrollWidth vs viewport'
        ).to.be.at.most(doc.documentElement.clientWidth + 1)
      })

      // 4. command palette opens fully inside the viewport
      cy.get('input[name="searchValue"]').click()
      cy.get('.cmdk-panel', { timeout: 10000 }).should('be.visible').then(($el) => {
        const r = $el[0].getBoundingClientRect()
        expect(r.right, 'palette right edge').to.be.at.most(w + 1)
        expect(r.left, 'palette left edge').to.be.at.least(-1)
      })
      cy.document().then((doc) => {
        expect(
          doc.documentElement.scrollWidth,
          'scrollWidth with palette open'
        ).to.be.at.most(doc.documentElement.clientWidth + 1)
      })
      cy.get('body').type('{esc}')
    })
  })
})
