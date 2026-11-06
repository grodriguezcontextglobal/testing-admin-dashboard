/**
 * Console methods the production build removes (FedRAMP plan E3 · SI-11, AU-9).
 *
 * vite.config.js passes this list to esbuild as `pure`, so a call whose result
 * is unused is dropped from the bundle. Until 2026-11-06 only the debug methods
 * were dropped and warn/error stayed; some of those print a whole axios error,
 * whose `config.headers` carries the session `x-token`, to any console on the
 * machine. Development builds and tests keep every method.
 *
 * What replaces them in production: errors shown to people go through
 * `src/utils/userFacingError.js`, and render crashes are sent to the server's
 * error log by `ErrorBoundaryComponent`.
 */
export const PRODUCTION_STRIPPED_CONSOLE = [
  "console.log",
  "console.info",
  "console.debug",
  "console.trace",
  "console.warn",
  "console.error",
];
