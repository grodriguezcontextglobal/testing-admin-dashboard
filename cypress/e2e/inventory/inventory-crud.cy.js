/**
 * Tests CRUD para la sección /inventory
 *
 * Cubre:
 *  READ   – página carga y muestra datos de inventario
 *  CREATE – botón "Add inventory" y modal "Import inventory"
 *  UPDATE – acceso al formulario de edición de grupo
 *  DELETE – modal "Delete group" con validación de campos
 */

const API = '**/api/**'
const COMPANY_ID = 'test-sql-company-id'

describe('Inventario – READ', () => {
  beforeEach(() => {
    cy.intercept('GET', /db_item\/check-company-has-inventory/, {
      statusCode: 200,
      body: { ok: true, total: 5 },
    }).as('checkInventory')

    cy.intercept('GET', /db_location\/companies\/.*\/locations/, {
      statusCode: 200,
      body: { ok: true, data: [] },
    }).as('getLocations')

    cy.intercept('POST', /db_item/, { statusCode: 200, body: { ok: true, items: [] } }).as('itemQuery')
    cy.intercept('POST', /db_company/, { statusCode: 200, body: { ok: true } }).as('companyQuery')

    cy.loginAsAdmin('/inventory')
  })

  it('muestra el título "Inventory"', () => {
    cy.contains('Inventory', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el botón "Add inventory" para usuario administrador', () => {
    cy.contains('Add inventory', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el botón "Import inventory (.xlsx)"', () => {
    cy.contains('Import inventory', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el botón de opciones adicionales "More options"', () => {
    cy.contains('More options', { timeout: 10000 }).should('be.visible')
  })
})

describe('Inventario – CREATE: navegar al formulario de nuevo ítem', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/db_item/check-company-has-inventory**', {
      statusCode: 200,
      body: { ok: true, total: 5 },
    })
    cy.intercept('GET', '**/db_location/companies/**/locations**', {
      statusCode: 200,
      body: { ok: true, data: [] },
    })
    cy.intercept('POST', '**/db_item/**', { statusCode: 200, body: { ok: true, items: [] } })
    cy.loginAsAdmin('/inventory')
  })

  it('el botón "Add inventory" lleva a /inventory/new-bulk-items', () => {
    cy.contains('Add inventory', { timeout: 10000 }).click()
    cy.url({ timeout: 8000 }).should('include', '/inventory/new-bulk-items')
  })
})

describe('Inventario – CREATE: modal "Import inventory (.xlsx)"', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/db_item/check-company-has-inventory**', {
      statusCode: 200,
      body: { ok: true, total: 5 },
    })
    cy.intercept('GET', '**/db_location/companies/**/locations**', {
      statusCode: 200,
      body: { ok: true, data: [] },
    })
    cy.loginAsAdmin('/inventory')
  })

  it('abre el modal de importación al hacer clic en "Import inventory (.xlsx)"', () => {
    cy.contains('Import inventory', { timeout: 10000 }).click()
    cy.contains('Add Inventory from file', { timeout: 8000 }).should('be.visible')
  })

  it('el modal de importación se puede cerrar', () => {
    cy.contains('Import inventory', { timeout: 10000 }).click()
    cy.contains('Add Inventory from file', { timeout: 8000 }).should('be.visible')
    // Cerrar con el botón X del modal (aria-label="Close" o botón de cierre)
    cy.get('[aria-label="Close"]').first().click()
    cy.contains('Add Inventory from file').should('not.exist')
  })
})

describe('Inventario – DELETE: modal "Delete group"', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/db_item/check-company-has-inventory**', {
      statusCode: 200,
      body: { ok: true, total: 5 },
    })
    cy.intercept('GET', '**/db_location/companies/**/locations**', {
      statusCode: 200,
      body: { ok: true, data: [] },
    })
    cy.intercept('POST', '**/db_item/consulting-item**', {
      statusCode: 200,
      body: { ok: true, items: [] },
    }).as('consultingItem')

    cy.loginAsAdmin('/inventory')
  })

  it('abre el modal "Delete group" desde el menú "More options"', () => {
    cy.contains('More options', { timeout: 10000 }).click()
    cy.contains('Delete group', { timeout: 5000 }).click()
    cy.contains('Delete Item Groups', { timeout: 8000 }).should('be.visible')
  })

  it('el modal de delete muestra los radio buttons de modo de eliminación', () => {
    cy.contains('More options', { timeout: 10000 }).click()
    cy.contains('Delete group').click()
    cy.contains('Delete Item Groups', { timeout: 8000 }).should('be.visible')
    cy.contains('Delete by selection').should('be.visible')
    cy.contains('Delete by group').should('be.visible')
    cy.contains('Delete by category').should('be.visible')
  })

  it('el botón "Delete" está deshabilitado si no hay ítems seleccionados', () => {
    cy.contains('More options', { timeout: 10000 }).click()
    cy.contains('Delete group').click()
    cy.contains('Delete Item Groups', { timeout: 8000 }).should('be.visible')
    // El botón Delete debe estar deshabilitado al abrir el modal sin seleccionar nada
    cy.contains('button', 'Delete').should('be.disabled')
  })

  it('el botón "Cancel" cierra el modal de delete', () => {
    cy.contains('More options', { timeout: 10000 }).click()
    cy.contains('Delete group').click()
    cy.contains('Delete Item Groups', { timeout: 8000 }).should('be.visible')
    cy.contains('button', 'Cancel').click()
    cy.contains('Delete Item Groups').should('not.exist')
  })
})

describe('Inventario – UPDATE: navegar a edición de grupo', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/db_item/check-company-has-inventory**', {
      statusCode: 200,
      body: { ok: true, total: 5 },
    })
    cy.intercept('GET', '**/db_location/companies/**/locations**', {
      statusCode: 200,
      body: { ok: true, data: [] },
    })
    cy.loginAsAdmin('/inventory')
  })

  it('el menú "More options" muestra "Update inventory"', () => {
    cy.contains('More options', { timeout: 10000 }).click()
    cy.contains('Update inventory', { timeout: 5000 }).should('be.visible')
  })

  it('"Update inventory" navega a /inventory/edit-group', () => {
    cy.contains('More options', { timeout: 10000 }).click()
    cy.contains('Update inventory').click()
    cy.url({ timeout: 8000 }).should('include', '/inventory/edit-group')
  })
})

describe('Inventario – CREATE: formulario /inventory/new-item', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/company/search-company**', {
      statusCode: 200,
      body: { ok: true, company: [] },
    })
    cy.intercept('POST', '**/db_item/consulting-item**', {
      statusCode: 200,
      body: { ok: true, items: [] },
    })
    cy.intercept('GET', '**/db_location/companies/**/locations**', {
      statusCode: 200,
      body: { ok: true, data: [] },
    })
    cy.loginAsAdmin('/inventory/new-item')
  })

  it('carga la página de agregar ítem individual', () => {
    // La página debe cargar sin redirigir a login
    cy.url({ timeout: 8000 }).should('include', '/inventory/new-item')
  })
})
