import { checkPayload, normalizePath } from "./apiContract";

/**
 * Warns, in development only, when an outgoing request is missing a field the
 * handler rejects it without.
 *
 * `apiContractAudit.test.js` covers the payloads written as object literals in
 * the source. This covers the rest — the ones assembled at runtime, spread from
 * a template, or built inside a helper — which is where a forgotten field
 * actually tends to hide.
 *
 * It never blocks a request and never throws. A stale contract must not be able
 * to stop a working app: the worst it does is print.
 *
 * The 320 KB contract is loaded through a dynamic import inside an
 * `import.meta.env.DEV` branch, so the production bundle never contains it, and
 * requests made before it resolves are simply not checked.
 */

let contract = null;
let loading = null;
const reported = new Set();

/** Loads the contract once. Failure is silent by design — see above. */
function ensureContract() {
  // The DEV check is repeated here, not only in `guardRequest`, so the bundler
  // sees an unreachable `import()` in a production build and drops the 320 KB
  // document instead of inlining it — this project builds a single chunk.
  if (!import.meta.env?.DEV) return null;
  if (contract || loading) return loading;
  loading = import("../docs/api-payloads.json")
    .then((module) => {
      contract = module.default ?? module;
    })
    .catch(() => {
      contract = [];
    });
  return loading;
}

/**
 * The path an axios config will actually request, without the origin.
 *
 * `baseURL` carries the scheme and host in production and a bare path in the
 * dev proxy, so it is parsed defensively rather than assumed to be a URL.
 */
export function requestPath(config) {
  const base = config?.baseURL ?? "";
  let basePath = base;
  try {
    basePath = new URL(base).pathname;
  } catch {
    basePath = base;
  }
  return normalizePath(`${basePath}${config?.url ?? ""}`);
}

/**
 * The body of a request, whichever way axios was called.
 *
 * `get` has no body: its fields travel in `params`. `delete` may use either.
 */
export function requestBody(config) {
  const method = String(config?.method ?? "").toUpperCase();
  if (method === "GET") return config?.params;
  if (method === "DELETE") return config?.data ?? config?.params;
  return config?.data;
}

/**
 * Checks one axios config. Returns the problem for testing; the caller prints.
 *
 * Each endpoint is reported once per session: a request inside a loop would
 * otherwise bury the console under the same line.
 */
export function inspectRequest(config, contractOverride) {
  const source = contractOverride ?? contract;
  if (!source) return null;

  const method = String(config?.method ?? "get").toUpperCase();
  const problem = checkPayload(source, {
    method,
    url: requestPath(config),
    body: requestBody(config),
  });
  if (!problem) return null;

  if (reported.has(problem.endpoint)) return null;
  reported.add(problem.endpoint);
  return problem;
}

/** Wire into an axios request interceptor. Returns the config unchanged. */
export function guardRequest(config) {
  if (!import.meta.env?.DEV) return config;

  ensureContract();
  const problem = inspectRequest(config);
  if (problem) {
    // eslint-disable-next-line no-console
    console.warn(
      `[api-contract] ${problem.endpoint} is missing ${problem.missing.join(", ")}.\n` +
        `  sent:     ${problem.sent.join(", ") || "(nothing)"}\n` +
        `  required: ${problem.required.join(", ")}\n` +
        `  handler:  ${problem.source}\n` +
        `  The handler answers 400/403 without these. See src/docs/api-payloads.md.`
    );
  }
  return config;
}

/** Test seam: forget what has already been reported. */
export function resetGuard() {
  reported.clear();
}

export default guardRequest;
