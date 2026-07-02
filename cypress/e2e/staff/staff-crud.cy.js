/**
 * Tests CRUD para la sección /staff
 *
 * Cubre:
 *  READ   – página carga con título, botones y campo de búsqueda
 *  READ   – tabla de staff muestra empleados de la compañía
 *  CREATE – "Add new staff" abre el modal "New staff"
 *  CREATE – el modal muestra campos de formulario y botones correctos
 *  CREATE – verificación de email: muestra campos extra cuando el email no existe
 *  DELETE – "Delete staff members" abre el modal "Deleting staff members"
 *  DELETE – el modal de borrado muestra la tabla con columnas y botones de acción
 *  UPDATE – navegar al detalle de un staff member para editar su perfil
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Intercepts que necesita la página /staff (MainAdminSettingPage)
const setupStaffPageInterceptors = () => {
  // Búsqueda de compañía (tabla de staff)
  cy.intercept('POST', /company\/search-company/, {
    statusCode: 200,
    fixture: 'staff.json',
  }).as('getCompany')

  // Datos individuales de cada empleado
  cy.intercept('POST', /staff\/admin-users/, {
    statusCode: 200,
    body: {
      ok: true,
      adminUsers: [
        {
          id: 'staff001',
          name: 'Alice',
          lastName: 'Johnson',
          email: 'alice@test.com',
          phone: '555-0001',
          imageProfile: null,
        },
      ],
    },
  }).as('getStaffMember')

  // Eventos activos (usados por MainAdminSettingPage y DeleteStaffMember)
  cy.intercept('POST', /event\/event-list/, {
    statusCode: 200,
    body: { ok: true, list: [] },
  }).as('getActiveEvents')

  // Lista global de staff (usada por NewStaffMember al abrirse)
  cy.intercept('GET', /staff\/admin-users/, {
    statusCode: 200,
    body: { ok: true, adminUsers: [] },
  }).as('getAllStaff')
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Staff – READ: estructura de la página', () => {
  beforeEach(() => {
    setupStaffPageInterceptors()
    cy.loginAsAdmin('/staff')
    cy.wait('@getCompany', { timeout: 15000 })
  })

  it('muestra el título "Staff"', () => {
    cy.contains('Staff', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el botón "Add new staff" para el rol administrador', () => {
    cy.contains('Add new staff', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el botón "Delete staff members" para el rol administrador', () => {
    cy.contains('Delete staff members', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el campo de búsqueda con placeholder "Search"', () => {
    cy.get('input[placeholder="Search"]', { timeout: 10000 }).should('exist')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Staff – READ: tabla de empleados con datos', () => {
  beforeEach(() => {
    setupStaffPageInterceptors()
    cy.loginAsAdmin('/staff')
    cy.wait('@getCompany', { timeout: 15000 })
    // Esperamos a que la tabla cargue (requiere que employees() resuelva)
    cy.contains('Name', { timeout: 12000 }).should('be.visible')
  })

  it('muestra la columna "Name" en la tabla de staff', () => {
    cy.contains('Name').should('be.visible')
  })

  it('muestra la columna "Role" en la tabla de staff', () => {
    cy.contains('Role').should('be.visible')
  })

  it('muestra la columna "Status" en la tabla de staff', () => {
    cy.contains('Status').should('be.visible')
  })

  it('muestra la columna "Email address" en la tabla de staff', () => {
    cy.contains('Email address').should('be.visible')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Staff – CREATE: modal "New staff"', () => {
  beforeEach(() => {
    setupStaffPageInterceptors()
    cy.loginAsAdmin('/staff')
    cy.wait('@getCompany', { timeout: 15000 })
    cy.contains('Add new staff', { timeout: 10000 }).should('be.visible')
    cy.contains('Add new staff').click()
    // El modal solo se renderiza cuando allStaffSavedQuery.data está disponible
    cy.wait('@getAllStaff', { timeout: 10000 })
    cy.contains('New staff', { timeout: 8000 }).should('be.visible')
  })

  it('el modal "New staff" se abre al hacer clic en "Add new staff"', () => {
    cy.contains('New staff').should('be.visible')
  })

  it('el modal muestra el campo de email con placeholder correcto', () => {
    cy.get('input[placeholder="Enter staff email"]').should('exist')
  })

  it('el modal muestra el selector de rol', () => {
    cy.contains('Role').should('be.visible')
  })

  it('el modal muestra el botón "Verify Email" en el estado inicial', () => {
    cy.contains('Verify Email').should('be.visible')
  })

  it('el botón "Cancel" cierra el modal', () => {
    cy.contains('Cancel').click()
    cy.contains('New staff').should('not.exist')
  })

  it('permite ingresar un email en el campo correspondiente', () => {
    cy.get('input[placeholder="Enter staff email"]').type('newstaff@test.com')
    cy.get('input[placeholder="Enter staff email"]').should('have.value', 'newstaff@test.com')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Staff – CREATE: verificación de email (email no registrado)', () => {
  beforeEach(() => {
    setupStaffPageInterceptors()

    // Sobrescribe el intercept de staff/admin-users (POST) para simular email no encontrado
    cy.intercept('POST', /staff\/admin-users/, (req) => {
      // Si la petición incluye un email específico de verificación, devuelve lista vacía
      if (req.body && req.body.email) {
        req.reply({ statusCode: 200, body: { ok: true, adminUsers: [] } })
      } else {
        req.reply({ statusCode: 200, body: { ok: true, adminUsers: [] } })
      }
    }).as('verifyEmail')

    cy.loginAsAdmin('/staff')
    cy.wait('@getCompany', { timeout: 15000 })
    cy.contains('Add new staff', { timeout: 10000 }).click()
    cy.wait('@getAllStaff', { timeout: 10000 })
    cy.contains('New staff', { timeout: 8000 }).should('be.visible')
  })

  it('muestra campos de nombre, apellido y teléfono tras verificar un email inexistente', () => {
    cy.get('input[placeholder="Enter staff email"]').type('nuevo@test.com')

    // Seleccionar un rol antes de verificar (requerido por la validación)
    cy.get('[role="combobox"]').first().click({ force: true })
    cy.get('[role="option"]').first().click({ force: true })

    cy.contains('Verify Email').click()
    cy.wait('@verifyEmail', { timeout: 8000 })

    // Cuando el email no existe, aparecen los campos adicionales
    cy.get('input[placeholder="Enter name"]', { timeout: 8000 }).should('exist')
    cy.get('input[placeholder="Enter last name"]').should('exist')
    cy.get('input[placeholder="Enter phone number"]').should('exist')
  })

  it('muestra el botón "Save" tras confirmar que el email es nuevo', () => {
    cy.get('input[placeholder="Enter staff email"]').type('nuevo@test.com')
    cy.get('[role="combobox"]').first().click({ force: true })
    cy.get('[role="option"]').first().click({ force: true })

    cy.contains('Verify Email').click()
    cy.wait('@verifyEmail', { timeout: 8000 })

    cy.contains('Save', { timeout: 5000 }).should('be.visible')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Staff – DELETE: modal "Deleting staff members"', () => {
  beforeEach(() => {
    setupStaffPageInterceptors()
    cy.loginAsAdmin('/staff')
    cy.wait('@getCompany', { timeout: 15000 })
    cy.contains('Delete staff members', { timeout: 10000 }).should('be.visible')
    cy.contains('Delete staff members').click()
    // El modal solo se renderiza cuando companiesEmployees.data está disponible.
    // El queryKey compartido ('employeesPerCompanyList') usa la caché de la carga de página.
    cy.contains('Deleting staff members', { timeout: 10000 }).should('be.visible')
  })

  it('el modal "Deleting staff members" se abre al hacer clic en "Delete staff members"', () => {
    cy.contains('Deleting staff members').should('be.visible')
  })

  it('el modal muestra el botón "Refresh" para recargar la lista', () => {
    cy.contains('Refresh', { timeout: 8000 }).should('be.visible')
  })

  it('el modal muestra el botón de acción "Delete staff members"', () => {
    cy.contains('button', 'Delete staff members', { timeout: 8000 }).should('exist')
  })

  it('el modal se cierra con el botón X (onCancel)', () => {
    cy.get('[aria-label="Close"]').first().click()
    cy.contains('Deleting staff members').should('not.exist')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Staff – DELETE: tabla de empleados en modal de borrado', () => {
  beforeEach(() => {
    setupStaffPageInterceptors()
    cy.loginAsAdmin('/staff')
    cy.wait('@getCompany', { timeout: 15000 })
    cy.contains('Delete staff members', { timeout: 10000 }).click()
    cy.contains('Deleting staff members', { timeout: 10000 }).should('be.visible')
    // Esperar a que employees() complete y la tabla sea visible
    cy.contains('Name', { timeout: 12000 }).should('be.visible')
  })

  it('la tabla del modal muestra la columna "Name"', () => {
    cy.contains('Name').should('be.visible')
  })

  it('la tabla del modal muestra la columna "Role"', () => {
    cy.contains('Role').should('be.visible')
  })

  it('la tabla del modal muestra la columna "Status"', () => {
    cy.contains('Status').should('be.visible')
  })

  it('la tabla del modal muestra la columna "Email address"', () => {
    cy.contains('Email address').should('be.visible')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Staff – UPDATE: navegar al detalle de un empleado', () => {
  beforeEach(() => {
    setupStaffPageInterceptors()
    cy.loginAsAdmin('/staff')
    cy.wait('@getCompany', { timeout: 15000 })
    cy.contains('Name', { timeout: 12000 }).should('be.visible')
  })

  it('la tabla tiene filas con datos de empleados clicables', () => {
    // Verifica que la tabla muestra el email de un empleado del fixture
    cy.get('body', { timeout: 10000 }).should('contain.text', 'alice@test.com')
  })

  it('navegar directamente a la ruta de detalle de staff no redirige a login', () => {
    cy.intercept('GET', /admin\/admin-user/, {
      statusCode: 200,
      body: { ok: true, adminUser: { id: 'staff001', name: 'Alice', lastName: 'Johnson' } },
    })
    cy.loginAsAdmin('/staff/staff001/main')
    cy.url({ timeout: 8000 }).should('include', '/staff/staff001/main')
  })
})
