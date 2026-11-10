import { defineConfig } from 'cypress'
import base from './cypress.config.js'

// GovRAMP #9 (SC-18, SA-11): the E2E CSP check. Runs against the build served
// by `npm run preview:csp-check`, which sends the enforcing policy
// (previewSecurityHeaders in src/config/securityHeaders.js).
export default defineConfig({
  ...base,
  e2e: {
    ...base.e2e,
    specPattern: 'cypress/e2e/csp/**/*.cy.js',
    excludeSpecPattern: '*.hot-update.js',
    // By default Cypress removes the page's CSP. `true` would still remove
    // these six; listed, they stay, and Cypress adds a nonce to its own
    // scripts. It always removes frame-ancestors (it runs the page in an
    // iframe) and Trusted Types, so neither is checked here.
    experimentalCspAllowList: [
      'default-src',
      'script-src',
      'script-src-elem',
      'child-src',
      'frame-src',
      'form-action',
    ],
  },
})
