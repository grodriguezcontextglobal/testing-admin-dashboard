/**
 * School track (Members/Students) — real backend, no mocks.
 * Covers Phase 1 hardening: Students nav visibility (Education industry),
 * members list, and deep-linked member detail tabs (previously crashed).
 */
const EMAIL = Cypress.env('DEMO_EMAIL') || 'principal@summitunified.edu'
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
    cy.viewport(1440, 900)
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
      body: { company_id: '3' },
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

  it('the members search filters the table', () => {
    cy.visit('/members')
    cy.contains('td', 'Maya Okafor', { timeout: 20000 }).should('be.visible')
    cy.get('input[name="searchMember"]').type('hann')
    cy.contains('td', 'Hannah Kim', { timeout: 10000 }).should('be.visible')
    cy.contains('td', 'Maya Okafor').should('not.exist')
    cy.get('input[name="searchMember"]').clear()
    cy.contains('td', 'Maya Okafor', { timeout: 10000 }).should('be.visible')
  })

  it('Overdue devices tab lists overdue leases with days-overdue tags', () => {
    cy.visit('/members')
    cy.contains('button', 'Overdue devices', { timeout: 20000 }).click()
    cy.contains('Maya Okafor', { timeout: 20000 }).should('be.visible')
    cy.get('.ant-tag').contains(/\d+ days?/).should('be.visible')
    cy.contains('button', /send all reminders/i).should('be.visible')
    cy.contains('button', /mark all returned/i).should('be.visible')
  })

  it('bulk-return API closes scoped leases and preserves history', () => {
    // self-contained: create an overdue lease against a fake device id,
    // bulk-return it by member scope, then clean up the closed row.
    cy.request('POST', 'http://localhost:34001/api/admin/login', {
      email: EMAIL,
      password: PASSWORD,
    }).then((login) => {
      const headers = { 'x-token': login.body.token }
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/new-member-assigned-device-lease',
        headers,
        body: {
          member_id: 7, staff_member_id: 1, device_id: 999901, company_id: '3',
          assigned_date: '2026-01-10', expected_return_date: '2026-02-01',
        },
      }).then((r) => expect(r.body.ok).to.eq(true))
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/bulk-return',
        headers,
        body: { company_id: '3', member_ids: [7], return_status: 'returned', condition_note: 'e2e bulk return' },
      }).then((r) => {
        expect(r.body.ok).to.eq(true)
        expect(r.body.returned).to.eq(1)
      })
      // history preserved: the closed lease is still retrievable
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/retrieve-members-assigned-devices',
        headers,
        body: { member_id: 7, company_id: '3', returned: 1 },
      }).then((r) => {
        expect(r.body.rows.some((row) => row.return_status === 'returned')).to.eq(true)
      })
      // cleanup the e2e row
      cy.request({
        method: 'POST',
        url: 'http://localhost:34001/api/db_member/remove-row-lease-member',
        headers,
        body: { company_id: '3', member_id: 7, device_id: 999901 },
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
          member_id: 10, staff_member_id: 1, device_id: 999902, company_id: '3',
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

describe('Industry gating (AV rental company has no Students)', () => {
  const AV_EMAIL = 'marcus.reyes@summitavrentals.com'

  const loginAV = () => {
    cy.visit('/login')
    cy.get('input').first().should('be.visible').type(AV_EMAIL)
    cy.contains('button', /continue/i).click()
    cy.get('input[type="password"]', { timeout: 15000 }).should('be.visible').type(PASSWORD, { log: false })
    cy.get('button').filter(':visible').contains(/sign in|log in|continue/i).click()
    cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login')
  }

  it('AV rental navbar has no Students tab', () => {
    cy.viewport(1440, 900)
    loginAV()
    cy.contains('a', /home/i, { timeout: 20000 }).should('be.visible')
    cy.contains('nav a, a', /^students$/i).should('not.exist')
  })

  it('deep-linking /members as an AV company redirects home', () => {
    loginAV()
    cy.visit('/members')
    cy.location('pathname', { timeout: 20000 }).should('eq', '/')
  })

  it('school district still sees the Students tab', () => {
    cy.viewport(1440, 900)
    login() // principal
    cy.contains('a', /^students$/i, { timeout: 20000 }).should('be.visible')
  })

  it('school district has no Consumers tab (students are the consumers)', () => {
    cy.viewport(1440, 900)
    login() // principal
    cy.contains('a', /home/i, { timeout: 20000 }).should('be.visible')
    cy.contains('nav a, a', /^consumers$/i).should('not.exist')
    // command palette also omits it
    cy.get('input[name="searchValue"]').click({ force: true })
    cy.get('input[placeholder="Search commands, pages, actions..."]', { timeout: 10000 }).should('be.visible')
    cy.get('.cmdk-panel').within(() => {
      cy.contains(/^Consumers$/).should('not.exist')
      cy.contains(/add new consumer/i).should('not.exist')
    })
    cy.get('body').type('{esc}')
    // deep link bounces home
    cy.visit('/consumers')
    cy.location('pathname', { timeout: 20000 }).should('eq', '/')
  })

  it('AV rental company still has its Consumers tab', () => {
    cy.viewport(1440, 900)
    loginAV()
    cy.contains('a', /^consumers$/i, { timeout: 20000 }).should('be.visible')
  })

  it('school palette has Students nav + Add new student action, and it works', () => {
    cy.viewport(1440, 900)
    login() // principal
    cy.get('input[name="searchValue"]', { timeout: 20000 }).click({ force: true })
    cy.get('.cmdk-panel', { timeout: 10000 }).within(() => {
      cy.contains(/^Students$/).scrollIntoView().should('be.visible')
      cy.contains(/add new student/i).scrollIntoView().should('be.visible').click()
    })
    // lands on /members with the add-member modal open
    cy.location('pathname', { timeout: 20000 }).should('eq', '/members')
    cy.contains(/single|xlsx|import/i, { timeout: 20000 }).should('be.visible')
  })

  it('AV palette keeps consumer entries and has no student entries', () => {
    cy.viewport(1440, 900)
    loginAV()
    cy.get('input[name="searchValue"]', { timeout: 20000 }).click({ force: true })
    cy.get('.cmdk-panel', { timeout: 10000 }).within(() => {
      cy.contains(/^Consumers$/).scrollIntoView().should('be.visible')
      cy.contains(/add new consumer/i).scrollIntoView().should('be.visible')
      cy.contains(/^Students$/).should('not.exist')
      cy.contains(/add new student/i).should('not.exist')
    })
  })
})

describe('My Devices family portal (public)', () => {
  it('guardian of a minor sees the student devices with status', () => {
    cy.visit('/my-devices')
    cy.get('#portal-student-id').type('STU-1001')
    cy.get('#portal-email').type('ngozi.okafor@example.com')
    cy.contains('button', /view my devices/i).click()
    cy.contains(/maya okafor/i, { timeout: 20000 }).should('be.visible')
    cy.contains(/responsible party: ngozi okafor/i).should('be.visible')
    cy.contains(/CHR-3001/).should('be.visible')
    cy.contains(/overdue — please return/i).should('be.visible')
  })

  it('a minor cannot use their own email — guardian email required', () => {
    cy.visit('/my-devices')
    cy.get('#portal-student-id').type('STU-1001')
    cy.get('#portal-email').type('maya.okafor@summit-district.edu')
    cy.contains('button', /view my devices/i).click()
    cy.contains(/parent\/guardian email on file/i, { timeout: 20000 }).should('be.visible')
  })

  it('home dashboard shows Students KPI instead of Consumers for the district', () => {
    cy.viewport(1440, 900)
    login()
    cy.visit('/')
    cy.contains(/^Students$/, { timeout: 30000 }).should('exist')
    cy.get('#root').should(($r) => {
      expect($r.text()).not.to.include('Consumers')
    })
  })
})

describe('Inventory geography (schools → sub-locations → shelves)', () => {
  beforeEach(login)

  it('inventory tree expands schools into sub-locations with nesting', () => {
    cy.viewport(1440, 900)
    cy.visit('/inventory')
    cy.contains('.tree-node', /lincoln middle school/i, { timeout: 30000 })
      .find('[aria-label="Expand sub-locations"]')
      .first()
      .click()
    cy.contains(/av storage/i, { timeout: 15000 }).should('be.visible')
    cy.contains(/room 101 — rivera/i).should('be.visible')
    // nested shelf under AV Storage
    cy.contains('.tree-node', /av storage/i)
      .find('[aria-label="Expand sub-locations"]')
      .first()
      .click()
    cy.contains(/shelf 1/i, { timeout: 15000 }).should('be.visible')
  })

  it('location page shows sub-location chips and they filter the table', () => {
    cy.viewport(1440, 900)
    cy.visit('/inventory/location?District%20Office&search=')
    cy.contains(/sub-locations in district office/i, { timeout: 30000 }).should('be.visible')
    cy.contains('a', /warehouse › rack a/i).should('be.visible').click()
    // table now filtered to the PA systems on Rack A
    cy.contains('td', /SUSD-PA-\d+/, { timeout: 20000 }).should('be.visible')
    cy.contains('td', /HSP-\d+|SUSD-HSP-\d+/).should('not.exist')
  })
})
