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

describe('Students Phase 2 (grades, overdue, bulk return)', () => {
  beforeEach(login)

  it('members list shows the Grade column with seeded grades', () => {
    cy.visit('/members')
    cy.contains('th', 'Grade', { timeout: 20000 }).should('be.visible')
    cy.contains('td', '7').should('exist')
  })

  it('Overdue devices tab lists overdue leases with days-overdue tags', () => {
    cy.visit('/members')
    cy.contains('button', 'Overdue devices', { timeout: 20000 }).click()
    cy.contains('Maya Okafor', { timeout: 20000 }).should('be.visible')
    cy.contains(/14 days?/).should('be.visible')
    cy.contains('button', /send all reminders/i).should('be.visible')
    cy.contains('button', /mark all returned/i).should('be.visible')
  })

  it('bulk-return API closes scoped leases and preserves history', () => {
    // self-contained: create an overdue lease against a fake device id,
    // bulk-return it by member scope, then clean up the closed row.
    cy.request('POST', 'http://localhost:34001/api/admin/login', {
      email: 'marcus.reyes@summitavrentals.com',
      password: 'DemoPass123!',
    }).then((login) => {
      const headers = { 'x-token': login.body.token }
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/new-member-assigned-device-lease',
        headers,
        body: {
          member_id: 7, staff_member_id: 1, device_id: 999901, company_id: '2',
          assigned_date: '2026-01-10', expected_return_date: '2026-02-01',
        },
      }).then((r) => expect(r.body.ok).to.eq(true))
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/bulk-return',
        headers,
        body: { company_id: '2', member_ids: [7], return_status: 'returned', condition_note: 'e2e bulk return' },
      }).then((r) => {
        expect(r.body.ok).to.eq(true)
        expect(r.body.returned).to.eq(1)
      })
      // history preserved: the closed lease is still retrievable
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/retrieve-members-assigned-devices',
        headers,
        body: { member_id: 7, company_id: '2', returned: 1 },
      }).then((r) => {
        expect(r.body.rows.some((row) => row.return_status === 'returned')).to.eq(true)
      })
      // cleanup the e2e row
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/remove-row-lease-member',
        headers,
        body: { company_id: '2', member_id: 7, device_id: 999901 },
      })
    })
  })
})

describe('Representative accountability (minors vs adults)', () => {
  beforeEach(login)

  it('students page shows stat tiles and status badges', () => {
    cy.visit('/members')
    // stat tiles
    cy.contains('p', /total students/i, { timeout: 20000 }).should('be.visible')
    cy.contains('p', /minors/i).should('be.visible')
    cy.contains('p', /missing a representative/i).should('be.visible')
    cy.contains('p', /devices out/i).should('be.visible')
    // status badges
    cy.contains('td', 'Adult').should('exist')
    cy.contains('span', /minor — rep missing/i).should('exist')
    cy.get('td').contains(/Rep:/).should('exist')
  })

  it('blocks device assignment for a minor without a representative', () => {
    cy.visit('/member/10/assignment') // Noah Briggs — minor, no guardian
    cy.contains(/representative required/i, { timeout: 30000 }).should('be.visible')
    cy.contains('button', /assign equipment to member/i).should('be.disabled')
    // and the banner links to the fix
    cy.contains('a', /update member info/i)
      .should('have.attr', 'href')
      .and('include', '/member/10/update-member-information')
  })

  it('shows the representative notice for a minor with a guardian', () => {
    cy.visit('/member/1/assignment') // Maya Okafor — minor with guardian
    cy.contains(/represented by ngozi okafor/i, { timeout: 30000 }).should('be.visible')
    cy.contains(/contract will be sent to the representative/i).should('be.visible')
  })

  it('API rejects lease creation for a minor without a representative', () => {
    cy.request('POST', 'http://localhost:34001/api/admin/login', {
      email: EMAIL, password: PASSWORD,
    }).then((l) => {
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/new-member-assigned-device-lease',
        headers: { 'x-token': l.body.token },
        failOnStatusCode: false,
        body: {
          member_id: 10, staff_member_id: 1, device_id: 999902, company_id: '2',
          assigned_date: '2026-07-14', expected_return_date: '2027-06-15',
        },
      }).then((r) => {
        expect(r.status).to.eq(422)
        expect(r.body.code).to.eq('GUARDIAN_REQUIRED')
        expect(r.body.msg).to.include('Noah Briggs')
      })
    })
  })
})
