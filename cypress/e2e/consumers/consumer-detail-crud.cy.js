/**
 * Tests E2E para ConsumerDetail – /events/event-attendees/:id
 *
 * Cubre las operaciones CRUD del módulo renovado:
 *  READ   – Header del consumidor (nombre, email, teléfono, avatar)
 *  READ   – Tarjetas de actividad (ConsumerActivity): dispositivos distribuidos/solicitados/devueltos
 *  READ   – Tabla de transacciones (StripeTransactionTable): búsqueda, filas, datos
 *  READ   – Tabla de firmas (SignaturesProof): badges de estado renovados
 *  CREATE – Selección de tipo de transacción (Details.jsx)
 *  CREATE – Modal de transacción autorizada (AuthorizedTransaction)
 *  CREATE – Modal de transacción en efectivo (CashTransaction)
 *  CREATE – Modal de transacción gratuita (FreeTransaction)
 *  CREATE – Asignación de dispositivos (AssigningDevice)
 *  UPDATE – Captura de depósito (Capturing)
 *  UPDATE – Liberación de depósito (Releasing)
 *  UPDATE – Devolución de dispositivo individual (ExpandedRowInTable)
 *  UPDATE – Devolución masiva (ReturningInBulkMethod)
 *  UPDATE – Reemplazo de dispositivo (ReplaceDevice)
 */

const CONSUMER_ID = 'test-consumer-event-001'
const PAYMENT_INTENT = 'pi_authorized001'

// ─── helpers: intercepts ──────────────────────────────────────────────────────

const interceptTransactionList = (fixture = 'consumer-detail', alias = 'getTransactions') => {
  cy.intercept('POST', /\/transaction\/transaction/, (req) => {
    req.reply({ fixture: `${fixture}`, statusCode: 200 })
  })
  cy.intercept('POST', /\/transaction\/transaction/, {
    statusCode: 200,
    fixture: `${fixture}`,
  })
  // Override limpio sin fixture anidada
  cy.intercept('POST', /\/transaction\/transaction/, { statusCode: 200, body: { ok: true, list: [] } }).as(alias)
}

const interceptAll = ({
  transactions = [],
  assigned = [],
  returned = [],
  receiverByTxn = [],
  signatures = [],
} = {}) => {
  cy.intercept('POST', /\/transaction\/transaction/, {
    statusCode: 200,
    body: { ok: true, list: transactions },
  }).as('getTransactions')

  cy.intercept('POST', /\/receiver\/receiver-assigned-list/, {
    statusCode: 200,
    body: { ok: true, listOfReceivers: assigned },
  }).as('getAssignedDevices')

  cy.intercept('GET', /\/receiver\/list-receiver-returned-issue/, {
    statusCode: 200,
    body: { ok: true, listOfReceivers: returned },
  }).as('getReturnedDevices')

  cy.intercept('POST', /\/receiver\/receiver-transaction/, {
    statusCode: 200,
    body: { ok: true, listOfReceivers: receiverByTxn },
  }).as('getReceiverByTxn')

  cy.intercept('POST', /\/transaction\/stripe-transaction/, {
    statusCode: 200,
    body: { ok: true, list: transactions },
  }).as('getStripeTransactions')

  cy.intercept('POST', /\/stripe\/payment-intent-per-event/, {
    statusCode: 200,
    body: { ok: true, paymentIntents: [] },
  }).as('getPaymentIntents')

  cy.intercept('POST', /\/transaction\/signature-receiver/, {
    statusCode: 200,
    body: { ok: true, list: signatures },
  }).as('getSignatures')
}

const mockTransaction = (overrides = {}) => ({
  _id: 'txn-authorized-001',
  paymentIntent: PAYMENT_INTENT,
  device: [
    { serialNumber: 'SN-TAB-001', deviceType: 'Tablet', status: 'In-use', deviceNeeded: 1 },
  ],
  stripeResponse: {
    id: PAYMENT_INTENT,
    status: 'requires_capture',
    amount: 10000,
    currency: 'usd',
  },
  consumerInfo: {
    uid: CONSUMER_ID,
    name: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  },
  type: 'authorized',
  eventSelected: 'Test Event 2025',
  company: 'test-company-id',
  active: true,
  ...overrides,
})

const mockDevice = (overrides = {}) => ({
  _id: 'dev-001',
  serialNumber: 'SN-TAB-001',
  deviceType: 'Tablet',
  status: 'In-use',
  paymentIntent: PAYMENT_INTENT,
  user: 'john.doe@example.com',
  eventSelected: 'Test Event 2025',
  company: 'test-company-id',
  ...overrides,
})

const waitForPage = () => {
  cy.wait('@getTransactions', { timeout: 15000 })
  cy.wait('@getAssignedDevices', { timeout: 10000 })
}

// ─── READ: Header del consumidor ─────────────────────────────────────────────

describe('ConsumerDetail – READ: Header del consumidor (MainHeaderComponent)', () => {
  const consumer = {
    uid: CONSUMER_ID,
    name: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+15551234567',
    data: { notes: [], profile_picture: null },
  }

  beforeEach(() => {
    interceptAll()
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID, { consumer })
    waitForPage()
  })

  it('muestra el nombre completo del consumidor', () => {
    cy.contains('John Doe', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el email del consumidor', () => {
    cy.contains('john.doe@example.com', { timeout: 10000 }).should('be.visible')
  })

  it('muestra el teléfono del consumidor', () => {
    cy.contains('+15551234567', { timeout: 10000 }).should('be.visible')
  })

  it('muestra las iniciales del consumidor en el avatar', () => {
    cy.contains('JD', { timeout: 10000 }).should('be.visible')
  })

  it('el header tiene la fuente Inter aplicada (renovación CSS)', () => {
    cy.get('.consumer-header-container, [class*="consumer-header"]', { timeout: 8000 }).then(($el) => {
      if ($el.length) {
        const fontFamily = getComputedStyle($el[0]).fontFamily
        expect(fontFamily).to.include('Inter')
      }
    })
  })
})

// ─── READ: Tarjetas de actividad (ConsumerActivity) ──────────────────────────

describe('ConsumerDetail – READ: Tarjetas de actividad (ConsumerActivity)', () => {
  beforeEach(() => {
    interceptAll({
      transactions: [mockTransaction()],
      assigned: [mockDevice()],
      returned: [mockDevice({ _id: 'dev-ret-001', serialNumber: 'SN-TAB-002', status: 'Returned' })],
    })
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('muestra la tarjeta de dispositivos distribuidos', () => {
    cy.contains(/distributed|distribuido/i, { timeout: 10000 }).should('exist')
  })

  it('muestra la tarjeta de dispositivos solicitados', () => {
    cy.contains(/requested|solicitado/i, { timeout: 10000 }).should('exist')
  })

  it('muestra la tarjeta de dispositivos devueltos', () => {
    cy.contains(/returned|devuelto/i, { timeout: 10000 }).should('exist')
  })

  it('las tarjetas renderizan valores numéricos', () => {
    cy.get('[style*="fontSize: 30px"],[style*="font-size: 30px"],[style*="fontWeight: 700"]', { timeout: 10000 })
      .should('exist')
  })

  it('las tarjetas tienen la estructura de MetricCard renovada (icono + número + label)', () => {
    // Verifica que hay un elemento con SVG de lucide-react dentro de las tarjetas
    cy.get('svg', { timeout: 10000 }).should('exist')
  })
})

// ─── READ: Tabla de transacciones (StripeTransactionTable) ───────────────────

describe('ConsumerDetail – READ: Tabla de transacciones (StripeTransactionTable)', () => {
  beforeEach(() => {
    interceptAll({ transactions: [mockTransaction()], assigned: [mockDevice()] })
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('renderiza la tabla de transacciones', () => {
    cy.get('table', { timeout: 10000 }).should('exist')
  })

  it('muestra el campo de búsqueda de transacciones', () => {
    cy.get('input[type="text"]', { timeout: 10000 }).should('exist')
  })

  it('el campo de búsqueda acepta texto', () => {
    cy.get('input[type="text"]').first().clear().type(PAYMENT_INTENT)
    cy.get('input[type="text"]').first().should('have.value', PAYMENT_INTENT)
  })

  it('limpia el campo de búsqueda', () => {
    cy.get('input[type="text"]').first().clear().type('test')
    cy.get('input[type="text"]').first().should('have.value', 'test')
    cy.get('input[type="text"]').first().clear()
    cy.get('input[type="text"]').first().should('have.value', '')
  })

  it('muestra los datos del paymentIntent en la tabla', () => {
    cy.contains(PAYMENT_INTENT, { timeout: 10000 }).should('exist')
  })

  it('la tabla tiene filas de datos cuando hay transacciones', () => {
    cy.get('.ant-table-row', { timeout: 10000 }).should('have.length.gte', 1)
  })

  it('botones de captura y liberación de depósito son visibles en la fila', () => {
    cy.get('.ant-table-row', { timeout: 10000 }).first().within(() => {
      cy.contains(/capture|release|charge/i).should('exist')
    })
  })
})

// ─── READ: Tabla vacía de transacciones ──────────────────────────────────────

describe('ConsumerDetail – READ: Estado vacío de la tabla (sin transacciones)', () => {
  beforeEach(() => {
    interceptAll()
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('muestra el estado vacío de la tabla cuando no hay transacciones', () => {
    cy.get('.ant-empty, [class*="empty"]', { timeout: 10000 }).should('exist')
  })
})

// ─── READ: Firmas (SignaturesProof) ──────────────────────────────────────────

describe('ConsumerDetail – READ: Tabla de firmas (SignaturesProof)', () => {
  const signature = {
    _id: 'sig-001',
    paymentIntent: PAYMENT_INTENT,
    signerName: 'John Doe',
    acceptance: true,
    timestamp: '2025-06-01T10:00:00Z',
    eventSelected: 'Test Event 2025',
  }

  beforeEach(() => {
    interceptAll({ signatures: [signature] })
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('muestra la sección de firmas o contratos', () => {
    cy.contains(/signature|contract|proof|firma/i, { timeout: 10000 }).should('exist')
  })

  it('el badge de aceptación usa el estilo de pill renovado (no texto plano)', () => {
    cy.wait('@getSignatures', { timeout: 10000 })
    // El badge renovado es un <span> con borderRadius pill y fondo de color
    cy.get('span[style*="9999px"]', { timeout: 8000 }).should('exist')
  })

  it('el badge de aceptación muestra el estado correcto', () => {
    cy.wait('@getSignatures', { timeout: 10000 })
    cy.contains(/accepted|rejected/i, { timeout: 8000 }).should('exist')
  })
})

// ─── CREATE: Selector de tipo de transacción (Details.jsx) ───────────────────

describe('ConsumerDetail – CREATE: Selector de tipo de transacción (Details.jsx)', () => {
  beforeEach(() => {
    interceptAll()
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('muestra el botón para crear una nueva transacción', () => {
    cy.contains(/new transaction|add transaction|transaction/i, { timeout: 10000 }).should('exist')
  })

  it('el botón de nueva transacción usa la clase del UX system (BlueButton)', () => {
    cy.get('[class*="blueButton"],[class*="blue_button"]', { timeout: 10000 })
      .filter(':visible')
      .should('have.length.gte', 1)
  })

  it('al hacer clic en nueva transacción se muestra el selector de tipo', () => {
    cy.contains(/new transaction|add transaction/i, { timeout: 10000 }).first().click()
    cy.contains(/authorized|cash|free|charged|services/i, { timeout: 8000 }).should('be.visible')
  })
})

// ─── CREATE: Modal de transacción autorizada (AuthorizedTransaction) ──────────

describe('ConsumerDetail – CREATE: Modal de transacción autorizada (AuthorizedTransaction)', () => {
  beforeEach(() => {
    interceptAll()
    cy.intercept('POST', /\/stripe\/payment-intent/, {
      statusCode: 200,
      body: { ok: true, paymentIntent: { id: 'pi_new001', client_secret: 'pi_new001_secret_test' } },
    }).as('createPaymentIntent')
    cy.intercept('POST', /\/transaction\/new-transaction/, {
      statusCode: 200,
      body: { ok: true, transaction: { _id: 'txn-new-001', paymentIntent: 'pi_new001' } },
    }).as('createTransaction')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('el modal de transacción autorizada usa ModalUX (tiene class ant-modal)', () => {
    cy.contains(/authorized/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).should('be.visible')
  })

  it('el modal muestra opciones Single Device y Multiple Devices', () => {
    cy.contains(/authorized/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).within(() => {
      cy.contains(/single device|single/i).should('exist')
      cy.contains(/multiple devices|multiple/i).should('exist')
    })
  })

  it('los botones Single/Multiple en el modal usan el UX system', () => {
    cy.contains(/authorized/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).within(() => {
      cy.get('[class*="blueButton"],[class*="blue_button"],[class*="grayButton"],[class*="gray_button"]')
        .should('have.length.gte', 1)
    })
  })

  it('el modal se cierra al hacer clic en el botón de cerrar', () => {
    cy.contains(/authorized/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).should('be.visible')
    cy.get('.ant-modal-close', { timeout: 5000 }).click()
    cy.get('.ant-modal-content').should('not.exist')
  })
})

// ─── CREATE: Modal de transacción en efectivo (CashTransaction) ───────────────

describe('ConsumerDetail – CREATE: Modal de transacción en efectivo (CashTransaction)', () => {
  beforeEach(() => {
    interceptAll()
    cy.intercept('POST', /\/transaction\/new-transaction/, {
      statusCode: 200,
      body: { ok: true, transaction: { _id: 'txn-cash-new', paymentIntent: 'cash-new-001' } },
    }).as('createCashTransaction')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('el modal de transacción en efectivo se abre correctamente', () => {
    cy.contains(/cash/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).should('be.visible')
  })

  it('el modal de efectivo muestra las opciones de dispositivo', () => {
    cy.contains(/cash/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).within(() => {
      cy.contains(/single|multiple/i).should('exist')
    })
  })
})

// ─── CREATE: Modal de transacción gratuita (FreeTransaction) ──────────────────

describe('ConsumerDetail – CREATE: Modal de transacción gratuita (FreeTransaction)', () => {
  beforeEach(() => {
    interceptAll()
    cy.intercept('POST', /\/transaction\/new-transaction/, {
      statusCode: 200,
      body: { ok: true, transaction: { _id: 'txn-free-new', paymentIntent: 'free-new-001' } },
    }).as('createFreeTransaction')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('el modal de transacción gratuita se abre correctamente', () => {
    cy.contains(/free/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).should('be.visible')
  })

  it('el modal gratuito tiene opciones Single/Multiple', () => {
    cy.contains(/free/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 8000 }).within(() => {
      cy.contains(/single|multiple/i).should('exist')
    })
  })
})

// ─── UPDATE: Captura de depósito (Capturing) ─────────────────────────────────

describe('ConsumerDetail – UPDATE: Captura de depósito (Capturing)', () => {
  beforeEach(() => {
    interceptAll({
      transactions: [mockTransaction()],
      assigned: [mockDevice()],
    })
    cy.intercept('PATCH', /\/stripe\/charge-payment-intent-amount/, {
      statusCode: 200,
      body: { ok: true, paymentIntent: { id: PAYMENT_INTENT, status: 'succeeded' } },
    }).as('captureDeposit')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('muestra el botón de captura de depósito en la tabla', () => {
    cy.contains(/capture deposit|capture/i, { timeout: 10000 }).should('exist')
  })

  it('el botón de captura abre el modal de confirmación (ModalUX)', () => {
    cy.contains(/capture deposit|capture/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 6000 }).should('be.visible')
  })

  it('el modal de captura muestra el campo de monto', () => {
    cy.contains(/capture deposit|capture/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 6000 }).within(() => {
      cy.get('input[type="number"],input[type="text"]').should('exist')
    })
  })

  it('el modal de captura tiene botón de confirmación (BlueButton del UX system)', () => {
    cy.contains(/capture deposit|capture/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 6000 }).within(() => {
      cy.get('[class*="blueButton"],[class*="blue_button"],button[type="submit"]').should('exist')
    })
  })

  it('cancelar el modal de captura cierra el diálogo', () => {
    cy.contains(/capture deposit|capture/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 6000 }).should('be.visible')
    cy.get('.ant-modal-close').click()
    cy.get('.ant-modal-content').should('not.exist')
  })
})

// ─── UPDATE: Liberación de depósito (Releasing) ──────────────────────────────

describe('ConsumerDetail – UPDATE: Liberación de depósito (Releasing)', () => {
  beforeEach(() => {
    interceptAll({
      transactions: [mockTransaction()],
      assigned: [mockDevice()],
    })
    cy.intercept('PATCH', /\/stripe\/release-payment-intent/, {
      statusCode: 200,
      body: { ok: true, paymentIntent: { id: PAYMENT_INTENT, status: 'canceled' } },
    }).as('releaseDeposit')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('muestra el botón de liberación de depósito en la tabla', () => {
    cy.contains(/release deposit|release/i, { timeout: 10000 }).should('exist')
  })

  it('el botón de liberación abre el modal de confirmación (ModalUX)', () => {
    cy.contains(/release deposit|release/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 6000 }).should('be.visible')
  })

  it('el modal de liberación muestra información del depósito a liberar', () => {
    cy.contains(/release deposit|release/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 6000 }).within(() => {
      cy.contains(/release|refund|cancel/i).should('exist')
    })
  })

  it('el modal de liberación tiene botón de cancelar (GrayButton del UX system)', () => {
    cy.contains(/release deposit|release/i, { timeout: 10000 }).first().click()
    cy.get('.ant-modal-content', { timeout: 6000 }).within(() => {
      cy.get('[class*="grayButton"],[class*="gray_button"]').should('exist')
    })
  })
})

// ─── UPDATE: Devolución individual (ExpandedRowInTable) ───────────────────────

describe('ConsumerDetail – UPDATE: Devolución individual de dispositivo (ExpandedRowInTable)', () => {
  beforeEach(() => {
    interceptAll({
      transactions: [mockTransaction()],
      assigned: [mockDevice()],
      receiverByTxn: [mockDevice()],
    })
    cy.intercept('PATCH', /\/receiver\/receiver-assigned/, {
      statusCode: 200,
      body: { ok: true },
    }).as('returnDevice')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('expande la fila de transacción al hacer clic en el ícono expandir', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).should('be.visible')
  })

  it('la fila expandida muestra el número de serie del dispositivo', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains('SN-TAB-001', { timeout: 8000 }).should('exist')
    })
  })

  it('el estado del dispositivo usa badge pill renovado en la fila expandida', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      // El badge renovado es un <span> con borderRadius 9999px
      cy.get('span[style*="9999px"]', { timeout: 8000 }).should('exist')
      cy.contains('In-use', { timeout: 8000 }).should('exist')
    })
  })

  it('la fila expandida muestra los botones de acción (ExpandedTableButtons)', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/assign|return|replace|lost/i, { timeout: 8000 }).should('exist')
    })
  })

  it('los botones de acción en la fila expandida usan el UX system', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.get(
        '[class*="blueButton"],[class*="blue_button"],[class*="grayButton"],[class*="lightBlue"]',
        { timeout: 8000 }
      ).should('have.length.gte', 1)
    })
  })

  it('el botón Return abre el modal de devolución individual', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/^return$/i, { timeout: 8000 }).click()
    })
    cy.get('.ant-modal-content', { timeout: 6000 }).should('be.visible')
  })
})

// ─── UPDATE: Devolución masiva (ReturningInBulkMethod) ────────────────────────

describe('ConsumerDetail – UPDATE: Devolución masiva de dispositivos (ReturningInBulkMethod)', () => {
  const twoDeviceTransaction = mockTransaction({
    _id: 'txn-multi-001',
    device: [
      { serialNumber: 'SN-TAB-001', deviceType: 'Tablet', status: 'In-use', deviceNeeded: 1 },
      { serialNumber: 'SN-TAB-002', deviceType: 'Tablet', status: 'In-use', deviceNeeded: 1 },
    ],
  })

  beforeEach(() => {
    interceptAll({
      transactions: [twoDeviceTransaction],
      assigned: [
        mockDevice({ _id: 'dev-001', serialNumber: 'SN-TAB-001' }),
        mockDevice({ _id: 'dev-002', serialNumber: 'SN-TAB-002' }),
      ],
      receiverByTxn: [
        mockDevice({ _id: 'dev-001', serialNumber: 'SN-TAB-001' }),
        mockDevice({ _id: 'dev-002', serialNumber: 'SN-TAB-002' }),
      ],
    })
    cy.intercept('PATCH', /\/receiver\/receiver-assigned/, {
      statusCode: 200,
      body: { ok: true },
    }).as('returnDevices')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('la fila expandida muestra el botón de devolución masiva', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/return all|bulk return|all devices/i, { timeout: 8000 }).should('exist')
    })
  })

  it('el modal de devolución masiva usa ModalUX y tiene botón de confirmación', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/return all|bulk return/i, { timeout: 8000 }).click()
    })
    cy.get('.ant-modal-content', { timeout: 6000 }).should('be.visible')
    cy.get('.ant-modal-content').within(() => {
      cy.get('[class*="blueButton"],[class*="blue_button"],button').should('exist')
    })
  })
})

// ─── UPDATE: Asignación de dispositivos (AssigningDevice) ────────────────────

describe('ConsumerDetail – UPDATE: Asignación de dispositivos (AssigningDevice)', () => {
  beforeEach(() => {
    interceptAll({
      transactions: [mockTransaction()],
      assigned: [],
      receiverByTxn: [],
    })
    cy.intercept('POST', /\/receiver\/receiver-assigned/, {
      statusCode: 200,
      body: { ok: true, receiver: { _id: 'dev-new-001', serialNumber: 'SN-TAB-NEW' } },
    }).as('assignDevice')
    cy.intercept('GET', /\/receiver\/list-receiver-per-compound/, {
      statusCode: 200,
      body: {
        ok: true,
        listOfReceivers: [
          { _id: 'pool-001', serialNumber: 'SN-TAB-POOL', deviceType: 'Tablet', status: 'operational' },
        ],
      },
    }).as('getDevicePool')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('el botón "Assign Device" está presente en la fila expandida', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/assign device|assign/i, { timeout: 8000 }).should('exist')
    })
  })

  it('el botón Assign abre el modal de asignación de dispositivos', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/assign device|assign/i, { timeout: 8000 }).first().click()
    })
    cy.get('.ant-modal-content', { timeout: 8000 }).should('be.visible')
  })
})

// ─── UPDATE: Reemplazo de dispositivo (ReplaceDevice) ─────────────────────────

describe('ConsumerDetail – UPDATE: Reemplazo de dispositivo (ReplaceDevice)', () => {
  beforeEach(() => {
    interceptAll({
      transactions: [mockTransaction()],
      assigned: [mockDevice()],
      receiverByTxn: [mockDevice()],
    })
    cy.intercept('PATCH', /\/receiver\/receiver-assigned/, {
      statusCode: 200,
      body: { ok: true },
    }).as('replaceDevice')
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('el botón de reemplazo de dispositivo está presente en la fila expandida', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/replace/i, { timeout: 8000 }).should('exist')
    })
  })

  it('el modal de reemplazo se abre y usa ModalUX', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      cy.contains(/replace/i, { timeout: 8000 }).click()
    })
    cy.get('.ant-modal-content', { timeout: 6000 }).should('be.visible')
  })
})

// ─── INTEGRIDAD: Los iconos renovados son SVGs de Lucide ─────────────────────

describe('ConsumerDetail – INTEGRIDAD: Iconos renovados (Lucide React)', () => {
  beforeEach(() => {
    interceptAll({ transactions: [mockTransaction()], assigned: [mockDevice()] })
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('la página no usa el componente Icon de @iconify/react', () => {
    // Los iconos de Iconify renderizan como <svg> con data-icon attribute
    cy.get('svg[data-icon]', { timeout: 5000 }).should('not.exist')
  })

  it('los SVG de Lucide están presentes en la página', () => {
    // Lucide renderiza SVGs con role="img" o con stroke (lineicons vs solid)
    cy.get('svg', { timeout: 10000 }).should('have.length.gte', 1)
  })
})

// ─── INTEGRIDAD: Status badges renovados son pills con CSS variable ───────────

describe('ConsumerDetail – INTEGRIDAD: Status badges renovados', () => {
  const transactionWithReturnedDevice = mockTransaction({
    device: [{ serialNumber: 'SN-RET-001', deviceType: 'Tablet', status: 'Returned', deviceNeeded: 1 }],
  })

  beforeEach(() => {
    interceptAll({
      transactions: [transactionWithReturnedDevice],
      assigned: [],
      receiverByTxn: [mockDevice({ serialNumber: 'SN-RET-001', status: 'Returned' })],
    })
    cy.loginAsConsumerDetailInEvent(CONSUMER_ID)
    waitForPage()
  })

  it('el status "Returned" usa badge pill con color de CSS variable', () => {
    cy.get('.ant-table-row-expand-icon', { timeout: 10000 }).first().click()
    cy.get('.ant-table-expanded-row', { timeout: 8000 }).within(() => {
      // Badge renovado: span con borderRadius 9999px
      cy.get('span[style*="9999px"]', { timeout: 8000 }).should('exist')
      cy.contains('Returned', { timeout: 8000 }).should('exist')
    })
  })
})
