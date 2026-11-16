import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5523',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    // Both of these need a dev server built from their own .env, so they are
    // run through their own config files, never from here:
    //   csp      → npm run test:csp       (the enforcing preview build)
    //   platform → npm run test:platform  (console on, sample data off)
    excludeSpecPattern: ['cypress/e2e/csp/**', 'cypress/e2e/platform/**'],
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    experimentalMemoryManagement: true,
  },
})
