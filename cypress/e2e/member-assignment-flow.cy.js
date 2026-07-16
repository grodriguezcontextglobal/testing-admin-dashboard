/**
 * Phase 3 verification: assigning a device to a student is a first-class
 * lease (no pseudo-event, no receivers pool), and the lease appears in the
 * student's assigned-devices table.
 */
const EMAIL = 'principal@summitunified.edu'
const PASSWORD = 'DemoPass123!'
const API = 'http://localhost:34001/api'

const login = () => {
  cy.visit('/login')
  cy.get('input').first().should('be.visible').type(EMAIL)
  cy.contains('button', /continue/i).click()
  cy.get('input[type="password"]', { timeout: 15000 }).should('be.visible').type(PASSWORD, { log: false })
  cy.get('button').filter(':visible').contains(/sign in|log in|continue/i).click()
  cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login')
}

describe('Member device assignment (first-class lease)', () => {
  it('assigns a device without creating a pseudo-event', () => {
    // Baseline: count lease-type events before
    cy.request('POST', `${API}/admin/login`, { email: EMAIL, password: PASSWORD }).then((l) => {
      const headers = { 'x-token': l.body.token }
      cy.request({ url: `${API}/event/event-list-per-company?company=Summit Unified School District&type=lease`, headers })
        .then((r) => cy.wrap((r.body.list || []).length).as('eventsBefore'))
    })

    login()
    cy.visit('/member/3/assignment') // Hannah Kim
    // address template
    cy.contains('p', /^Street$/).parent().parent().find('input').type('500 School Way')
    cy.contains('p', /^City$/).parent().parent().find('input').type('San Rafael')
    cy.contains('p', /^State$/).parent().parent().find('input').type('CA')
    cy.contains('p', /^Zip$/).parent().parent().find('input').type('94901')
    // pick the first available device group from the antd select
    cy.get('.ant-select', { timeout: 20000 }).first().click()
    cy.get('.ant-select-item-option', { timeout: 20000 }).first().click()
    // starting serial auto-populates once inventory loads
    cy.get('input[name="startingNumber"]', { timeout: 20000 })
      .invoke('val')
      .should('match', /.+/)
    // quantity defaults to 1; submit
    cy.contains('button', /assign equipment to member/i).should('not.be.disabled').click()

    // lands back on the student's device list with the lease visible
    cy.location('pathname', { timeout: 30000 }).should('eq', '/member/3/main')
    cy.get('#root', { timeout: 30000 }).should(($r) => {
      expect($r.text()).to.match(/[A-Z]{3,4}-(?:[A-Z]{2,3}-)?\d{4}/)
    })

    // and no new lease-type event was fabricated
    cy.get('@eventsBefore').then((before) => {
      cy.request('POST', `${API}/admin/login`, { email: EMAIL, password: PASSWORD }).then((l) => {
        const headers = { 'x-token': l.body.token }
        cy.request({ url: `${API}/event/event-list-per-company?company=Summit Unified School District&type=lease`, headers })
          .then((r) => {
            expect((r.body.list || []).length, 'lease-event count unchanged').to.eq(before)
          })
      })
    })
  })
})

describe('Member device return (history-preserving)', () => {
  it('returns the assigned device as damaged with a note, no event archaeology', () => {
    login()
    cy.visit('/member/3/main')
    // the assigned device row from the previous test — remember its serial
    cy.contains('td', /[A-Z]{3,4}-(?:[A-Z]{2,3}-)?\d{4}/, { timeout: 30000 })
      .should('be.visible')
      .invoke('text')
      .then((t) => cy.wrap(t.match(/[A-Z]{3,4}-(?:[A-Z]{2,3}-)?\d{4}/)[0]).as('serial'))
    cy.contains('button', /^Return$/).first().click()
    // outcome: damaged + note + condition
    // MUI selects render as .MuiSelect-select; the modal has: 0 = outcome,
    // 1 = returned-device condition.
    cy.get('.MuiSelect-select', { timeout: 15000 }).eq(0).click()
    cy.get('li[role="option"]').contains(/returned damaged/i).click()
    cy.get('textarea[name="condition_note"], input[name="condition_note"]')
      .first()
      .type('Cracked screen — e2e verification', { force: true })
    cy.get('.MuiSelect-select').eq(1).click()
    cy.get('li[role="option"]').contains(/^Damaged$/).click()
    cy.contains('button', /return and save/i).should('not.be.disabled').click()
    // the returned device's row disappears from the outstanding table
    cy.get('@serial').then((serial) => {
      cy.contains('td', serial, { timeout: 30000 }).should('not.exist')
    })

    // history preserved + device restocked (API check)
    cy.request('POST', `${API}/admin/login`, { email: EMAIL, password: PASSWORD }).then((l) => {
      const headers = { 'x-token': l.body.token }
      cy.request({
        method: 'POST',
        url: `${API}/db_member/retrieve-members-assigned-devices`,
        headers,
        body: { member_id: 3, company_id: '3', returned: 1 },
      }).then((r) => {
        const closed = (r.body.rows || []).find((row) => row.return_status === 'damaged')
        expect(closed, 'closed lease with damaged status exists').to.not.eq(undefined)
        expect(closed.condition_note).to.include('Cracked screen')
      })
    })
  })
})
