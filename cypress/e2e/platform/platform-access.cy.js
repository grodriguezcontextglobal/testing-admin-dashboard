// Devitrak Admin Console: who may enter, and what the browser sends
// (reports/FRONTEND_admin_console_plan_2026-11-11.md, F9; risk §7 "wrong
// access check").
//
// Needs the dev server from .env.platform-e2e, where the console is on and
// the sample data is OFF:
//   npm run dev:platform-e2e   (port 5523)
//   npm run test:platform
//
// This spec is the client half of the check. The server re-checks every
// /api/platform request on its side (plan B1); hiding the screens is not a
// security control on its own, and this file does not pretend otherwise.

const API_HOSTS = /platform-e2e\.invalid/

// PlatformLayout's own side navigation: present on every console screen and
// on no other screen, so it answers "did the console render?" on its own.
const CONSOLE_SHELL = 'nav[aria-label="Admin console"]'

const COMPANIES = {
  ok: true,
  data: [
    {
      id: 'cmp_001',
      name: 'Harbor Point Events',
      ownerEmail: 'ana.ortiz@harbor-point.example',
      status: 'active',
      staffCount: 12,
      deviceCount: 430,
      devicesOut: 96,
      devicesOverdue: 0,
      revenue30dCents: 1284000,
      currency: 'USD',
      lastActivityAt: new Date().toISOString(),
    },
  ],
  page: 1,
  limit: 25,
  total: 1,
}

describe('Admin Console access (console plan F9)', () => {
  let platformRequests

  /**
   * The gate's own question (src/hooks/platform/usePlatformMe.js), asked
   * before any screen asks for data.
   *
   * It is recorded like every other platform request, because the header
   * assertions below have to cover it too: it is a cross-client call and must
   * carry no company header. It is deliberately NOT part of the `@platform`
   * alias — a test that waits for "the console's first data request" means
   * /companies, and /me would otherwise arrive first and answer for it.
   *
   * A refused case needs no stub. The guard only asks when the sign-in
   * response AND the address already say yes, so anything refused on those
   * two is refused without a request at all. The catch-all covers the rest,
   * and it answers /me with a company list — which is not a body that says
   * yes, so a case that forgets this stub is refused rather than wrongly let
   * in. That is the right way round for this file.
   */
  const stubMe = ({ platformAccess, email = 'owner@devitrak.com' }) =>
    cy.intercept('GET', '**/api/platform/me', (req) => {
      platformRequests.push({ url: req.url, headers: req.headers })
      req.reply({
        statusCode: 200,
        body: {
          ok: true,
          data: {
            uid: 'usr_console_1',
            email,
            platformAccess,
            domain: email.split('@')[1],
            platformObserver: platformAccess,
            mfaEnabled: true,
            checkedAt: new Date().toISOString(),
          },
        },
      })
    })

  beforeEach(() => {
    platformRequests = []

    // An empty answer can make an unrelated screen throw; that is not what
    // this spec checks. Every assertion below is about routing and headers.
    cy.on('uncaught:exception', () => false)

    // Catch-all first, so nothing escapes to the network; the shaped answers
    // defined after it take precedence.
    cy.intercept({ url: API_HOSTS }, { statusCode: 200, body: { ok: true, data: [] } })

    cy.intercept('GET', '**/api/platform/**', (req) => {
      platformRequests.push({ url: req.url, headers: req.headers })
      req.reply({ statusCode: 200, body: COMPANIES })
    }).as('platform')

    // The service worker would serve later visits from its precache, around
    // Cypress's set-up of the page.
    cy.intercept('GET', '/sw.js', { statusCode: 404, body: '' })
  })

  describe('a client company user, super_user in their own company', () => {
    // Asserted on the console's own shell rather than on the destination:
    // where the guard sends them is a product choice that may change, but the
    // console must never render for them.
    it('never reaches the console, even with a @devitrak.com address', () => {
      cy.loginAsConsoleUser('/platform/clients')

      cy.location('pathname', { timeout: 15000 }).should('not.match', /^\/platform/)
      cy.get(CONSOLE_SHELL).should('not.exist')
    })

    it('never reaches a deep console link either', () => {
      cy.loginAsConsoleUser('/platform/clients/cmp_001')

      cy.location('pathname', { timeout: 15000 }).should('not.match', /^\/platform/)
      cy.get(CONSOLE_SHELL).should('not.exist')
    })

    it('never asks /api/platform for anything', () => {
      cy.loginAsConsoleUser('/platform/clients')

      cy.location('pathname', { timeout: 15000 }).should('not.match', /^\/platform/)
      cy.then(() => {
        expect(platformRequests, 'requests to /api/platform').to.have.length(0)
      })
    })
  })

  describe('an address outside devitrak.com', () => {
    // Two locks: the server's platformAccess AND the sign-in domain. The
    // server is the authority and re-checks every request; the domain here
    // can only refuse, never grant. It is what stops a server that wrongly
    // marked an outside address from also putting every client's data on
    // that person's screen.
    it('is refused even when the server marked platformAccess: true', () => {
      cy.loginAsConsoleUser('/platform/clients', {
        platformAccess: true,
        email: 'contractor@partner.example',
      })

      cy.location('pathname', { timeout: 15000 }).should('not.match', /^\/platform/)
      cy.get(CONSOLE_SHELL).should('not.exist')
      cy.then(() => {
        expect(platformRequests, 'requests to /api/platform').to.have.length(0)
      })
    })

    it('is refused for a look-alike domain', () => {
      cy.loginAsConsoleUser('/platform/clients', {
        platformAccess: true,
        email: 'someone@devitrak.com.attacker.test',
      })

      cy.location('pathname', { timeout: 15000 }).should('not.match', /^\/platform/)
      cy.get(CONSOLE_SHELL).should('not.exist')
    })
  })

  describe('a user the server marked platformAccess: true', () => {
    it('sees the client list', () => {
      stubMe({ platformAccess: true })
      cy.loginAsConsoleUser('/platform/clients', { platformAccess: true })

      cy.location('pathname', { timeout: 15000 }).should('eq', '/platform/clients')
      cy.contains('Clients').should('be.visible')
      cy.contains('Harbor Point Events', { timeout: 15000 }).should('be.visible')
    })

    it('lands on Overview when opening /platform', () => {
      stubMe({ platformAccess: true })
      cy.loginAsConsoleUser('/platform', { platformAccess: true })

      cy.location('pathname', { timeout: 15000 }).should('eq', '/platform/overview')
      cy.get(CONSOLE_SHELL).should('exist')
    })
  })

  describe('a user whose access the server has since revoked', () => {
    // The reason the guard asks at all. The sign-in response is a copy taken
    // once, and redux-persist writes it to localStorage, so it outlives the
    // tab: before the gate asked /me, a revoked operator kept the console on
    // screen until they signed out, not until they reloaded. Nothing leaked —
    // the server refuses every /api/platform request — but what they met was
    // an error rather than a refusal that explains itself.
    it('is refused, although the sign-in copy still says yes', () => {
      stubMe({ platformAccess: false })
      cy.loginAsConsoleUser('/platform/clients', { platformAccess: true })

      cy.location('pathname', { timeout: 15000 }).should('not.match', /^\/platform/)
      cy.get(CONSOLE_SHELL).should('not.exist')
    })

    // A 401 is the server saying no. Anything else is the server failing to
    // answer, and "we could not ask" is not "no": the console is read-only,
    // the server gates every request behind the screen, and a blip must not
    // lock an operator out of it (src/pages/platform/utils/platformGate.js).
    it('is refused on a 401 from /me', () => {
      cy.intercept('GET', '**/api/platform/me', { statusCode: 401, body: { ok: false } })
      cy.loginAsConsoleUser('/platform/clients', { platformAccess: true })

      cy.location('pathname', { timeout: 15000 }).should('not.match', /^\/platform/)
      cy.get(CONSOLE_SHELL).should('not.exist')
    })

    it('still opens when /me itself breaks', () => {
      cy.intercept('GET', '**/api/platform/me', { statusCode: 500, body: { ok: false } })
      cy.loginAsConsoleUser('/platform/clients', { platformAccess: true })

      cy.location('pathname', { timeout: 15000 }).should('eq', '/platform/clients')
      cy.get(CONSOLE_SHELL).should('exist')
    })
  })

  // The console entry in the main navigation bar is NOT checked here. It
  // lives on the ordinary app shell, and under this spec's blanket stubbing
  // the home route ends up on /login, so both the positive and the negative
  // assertion would report the wrong thing — the negative one passing only
  // because /login has no navigation bar at all.
  //
  // It was checked by hand instead, on this same dev server, with the same
  // seeded session: with platformAccess true the entry is in the DOM
  // ([aria-label="Devitrak Admin Console"] → /platform); the gate itself,
  // hasPlatformAccess(), has its own unit tests in src/config/roles.test.js.

  describe('what the browser sends to /api/platform', () => {
    // The console is cross-client: the company goes in the path, never in a
    // header. A company header here would scope the answer to one client and
    // quietly empty every screen (sessionHeaders.js, plan F3).
    it('sends no x-company-id and no s-company-lq', () => {
      stubMe({ platformAccess: true })
      cy.loginAsConsoleUser('/platform/clients', { platformAccess: true })

      cy.wait('@platform')
      cy.contains('Harbor Point Events', { timeout: 15000 }).should('be.visible')

      cy.then(() => {
        expect(platformRequests.length, 'requests to /api/platform').to.be.greaterThan(0)
        // /me is in here too: the gate's own call is cross-client like the rest.
        expect(
          platformRequests.some(({ url }) => /\/api\/platform\/me(\?|$)/.test(url)),
          'the gate asked /api/platform/me',
        ).to.equal(true)
        platformRequests.forEach(({ url, headers }) => {
          expect(headers, `x-company-id on ${url}`).not.to.have.property('x-company-id')
          expect(headers, `s-company-lq on ${url}`).not.to.have.property('s-company-lq')
          // Retired in #56; a guard test covers the source, this covers the wire.
          expect(headers, `s-token-lq on ${url}`).not.to.have.property('s-token-lq')
        })
      })
    })

    it('asks for /api/platform/companies, not a company-scoped route', () => {
      stubMe({ platformAccess: true })
      cy.loginAsConsoleUser('/platform/clients', { platformAccess: true })

      // `@platform` is the catch-all, and /me has its own intercept, so the
      // first request this waits on is the screen's own — which is the thing
      // being asserted.
      cy.wait('@platform').its('request.url').should('match', /\/api\/platform\/companies(\?|$)/)
    })
  })
})
