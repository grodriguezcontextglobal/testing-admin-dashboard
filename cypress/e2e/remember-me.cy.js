describe('remember me', () => {
  const login = (check) => {
    cy.intercept('POST', '**/admin/login').as('login')
    cy.visit('/login')
    cy.get('input').first().type('marcus.reyes@summitavrentals.com')
    cy.contains('button', /continue/i).click()
    cy.get('input[type="password"]', { timeout: 15000 }).type('DemoPass123!', { log: false })
    if (check) cy.contains('label', /remember me for 30 days/i).find('input[type="checkbox"]').check({ force: true })
    cy.contains('button', /sign in/i).click()
    return cy.wait('@login')
  }
  it('unchecked → rememberMe false', () => {
    login(false).then((i) => expect(i.request.body.rememberMe).to.eq(false))
  })
  it('checked → rememberMe true', () => {
    login(true).then((i) => expect(i.request.body.rememberMe).to.eq(true))
  })
})
