/**
 * GovRAMP #9 (SC-18, SA-11): the dashboard runs under the enforcing CSP.
 *
 * Serves the production build with the policy an enforcing build sends
 * (npm run build:csp-check, then npm run preview:csp-check), signs in with a
 * mocked session, visits the main screens and fails on any violation the
 * browser enforces. It is the evidence for switching production to enforce
 * (#11, decision D5) that does not depend on a week of production reports.
 *
 * Every call to the API host is answered here, so the check never reaches a
 * real server. The screens may show empty data; what is checked is that
 * nothing they load is blocked. Cypress removes frame-ancestors and Trusted
 * Types from the policy (cypress.csp.config.js), so those two are not covered.
 */

const API_HOSTS = /^https:\/\/(api|consumer)\.csp-check\.invalid\//

// The event the event detail screen opens.
const EVENT = {
  id: 'csp-check-event',
  active: true,
  company: 'Test Company',
  eventInfoDetail: {
    eventName: 'CSP check event',
    eventLocation: 'Test venue',
    address: 'Test venue, Miami, FL',
    dateBegin: '2026-11-01T08:00:00.000Z',
    dateEnd: '2026-11-30T22:00:00.000Z',
  },
  staff: {
    adminUser: [{ email: 'admin@devitrak.com', firstName: 'Test', lastName: 'Admin' }],
    headsetAttendees: [],
  },
  deviceSetup: [],
  contactInfo: {},
}

// The main screens. Stripe.js and its js.stripe.com frames load on every
// one of them; /profile/subscription is where a plan checkout starts. The
// card form itself needs a payment intent from the server, and runs inside
// Stripe's own frame from the same origin, so it is not visited.
const ROUTES = [
  { path: '/' },
  { path: '/events' },
  { path: '/events/event-quickglance', event: EVENT },
  { path: '/inventory' },
  { path: '/consumers' },
  { path: '/consumers/csp-check-consumer' },
  { path: '/staff' },
  { path: '/profile' },
  { path: '/profile/subscription' },
]

// What every API call answers: success, with the list fields screens read
// left empty, so screens render their empty state instead of throwing.
const EMPTY_ANSWER = {
  ok: true,
  list: [],
  data: [],
  result: [],
  results: [],
  items: [],
  rows: [],
  total: 0,
  count: 0,
  // Event detail: the event's inventory.
  receiversInventory: [],
}

// Answers whose shape a screen needs beyond EMPTY_ANSWER.
const SHAPED_ANSWERS = [
  // Home: the companies the signed-in person belongs to.
  { method: 'POST', url: /\/company\/search-company$/, body: { ok: true, company: [] } },
]

// Time for lazy chunks, fonts, Stripe.js and data requests to settle.
const SETTLE_MS = 2500

const describeViolation = (route, event) => ({
  route,
  directive: event.effectiveDirective || event.violatedDirective,
  blocked: event.blockedURI,
  source: event.sourceFile ? `${event.sourceFile}:${event.lineNumber}` : undefined,
  sample: event.sample || undefined,
  disposition: event.disposition,
})

describe('CSP in enforce mode (GovRAMP #9)', () => {
  let violations
  let route

  beforeEach(() => {
    violations = []
    route = null
    cy.on('window:before:load', (win) => {
      win.document.addEventListener('securitypolicyviolation', (event) => {
        violations.push(describeViolation(route, event))
      })
    })
    // Empty data can make a screen throw; that is not what this spec checks.
    // A screen that renders nothing fails the content check below instead.
    cy.on('uncaught:exception', () => false)
    cy.intercept({ url: API_HOSTS }, { statusCode: 200, body: EMPTY_ANSWER }).as('api')
    // Defined later, so they take precedence over the catch-all above.
    SHAPED_ANSWERS.forEach(({ method, url, body }) => cy.intercept(method, url, { statusCode: 200, body }))
    // The service worker would serve later visits from its precache, around
    // the server and its headers, and without Cypress's set-up of the page.
    cy.intercept('GET', '/sw.js', { statusCode: 404, body: '' })
  })

  it('is served with the enforcing policy and no reporting', () => {
    cy.request('/').then(({ headers }) => {
      const policy = headers['content-security-policy']
      expect(policy, 'Content-Security-Policy').to.be.a('string')
      expect(policy).to.include("default-src 'self'")
      expect(policy).to.match(/script-src 'self'[^;]*;/)
      expect(policy.match(/script-src[^;]*/)[0]).not.to.match(/unsafe-inline|unsafe-eval/)
      expect(policy).to.include('https://api.csp-check.invalid')
      expect(policy).not.to.match(/report-uri|report-to/)
      expect(headers['reporting-endpoints']).to.equal(undefined)
    })
  })

  // Without this, a Cypress setting that drops the policy would let every
  // other test pass with nothing enforced.
  it('blocks an inline script inside the test runner', () => {
    route = '/login'
    cy.visit('/login')
    cy.get('#root').should('not.be.empty')
    cy.window().then((win) => {
      const script = win.document.createElement('script')
      script.textContent = 'window.__cspCheckInline = true'
      win.document.body.appendChild(script)
      expect(win.__cspCheckInline, 'inline script ran').to.equal(undefined)
    })
    cy.wrap(null).should(() => {
      const directives = violations.map((violation) => violation.directive)
      expect(directives.some((directive) => directive.startsWith('script-src')), directives.join(', ')).to.equal(true)
    })
  })

  ROUTES.forEach(({ path, event }) => {
    it(`loads ${path} with nothing blocked`, () => {
      route = path
      cy.loginAsAdmin(path, { event })
      // The screen itself, not the sign-in page or the error boundary:
      // otherwise nothing of the screen was loaded and checked.
      cy.location('pathname', { timeout: 30000 }).should('eq', path)
      cy.get('#root', { timeout: 30000 }).should(($root) => {
        expect($root.text().trim().length, `content on ${path}`).to.be.greaterThan(20)
      })
      cy.wait(SETTLE_MS)
      cy.get('#root').should('not.contain.text', 'Something went wrong')
      cy.location('pathname').should('eq', path)
      cy.then(() => {
        const enforced = violations.filter((violation) => violation.disposition === 'enforce')
        expect(enforced, JSON.stringify(enforced, null, 2)).to.deep.equal([])
      })
    })
  })
})
