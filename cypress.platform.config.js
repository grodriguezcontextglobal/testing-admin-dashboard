import { defineConfig } from 'cypress'

// Admin Console access check (console plan F9). Needs the dev server started
// with .env.platform-e2e, which turns the console on and the sample data off:
//
//   npm run dev:platform-e2e      (terminal 1, port 5523)
//   npm run test:platform         (terminal 2)
//
// Its own config file, like the CSP check, so that a run of the ordinary
// suite against an ordinary dev server can never pick these specs up: with
// the demo mode on they would pass without testing anything.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5523',
    specPattern: 'cypress/e2e/platform/**/*.cy.{js,jsx}',
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
