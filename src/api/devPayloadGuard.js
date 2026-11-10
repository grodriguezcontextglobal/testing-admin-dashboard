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

/* ── Company context (GovRAMP #6, AC-4) ──────────────────────────────────────
   The server's authorizePermission checks the permission against the
   company_id it finds in the path, the body or the query, in that order, and
   controllers act on the s-company-lq header. When they differ, the server
   logs it (COMPANY_CONTEXT_MODE=warn) or answers 403 (enforce). This warns
   about the same mismatch here, first. */

const SQL_ROUTE = /^\/api\/db_/;

const headerValue = (headers, name) => {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name) ?? undefined;
  return headers[name];
};

const plainObject = (value) =>
  value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

/** company_id from a path segment, for the routes the contract declares it in. */
function pathCompanyId(requestUrl, source) {
  for (const entry of Array.isArray(source) ? source : []) {
    const endpoint = String(entry?.endpoint ?? "");
    if (!endpoint.includes(":company_id")) continue;
    const names = [];
    const pattern = endpoint.replace(/:([A-Za-z_]+)/g, (_, name) => {
      names.push(name);
      return "([^/]+)";
    });
    const match = new RegExp(`^${pattern}$`).exec(requestUrl);
    if (match) return match[names.indexOf("company_id") + 1];
  }
  return undefined;
}

/** The company a request names, read the way the server reads it; or null. */
export function requestCompanyId(config, contractOverride) {
  const fromPath = pathCompanyId(requestPath(config), contractOverride ?? contract);
  const method = String(config?.method ?? "get").toUpperCase();
  const body = method === "GET" ? undefined : config?.data;
  const fromBody = plainObject(body) ? body.company_id : undefined;
  const fromQuery = plainObject(config?.params) ? config.params.company_id : undefined;
  const value = fromPath || fromBody || fromQuery;
  return value === undefined || value === null || value === "" ? null : String(value);
}

/** A request to a SQL route whose company differs from s-company-lq, or null. */
export function inspectCompanyContext(config, contractOverride) {
  const url = requestPath(config);
  if (!SQL_ROUTE.test(url)) return null;
  const header = headerValue(config?.headers, "s-company-lq");
  const sent = requestCompanyId(config, contractOverride);
  if (!header || !sent || String(header) === sent) return null;

  const endpoint = `${String(config?.method ?? "get").toUpperCase()} ${url}`;
  const key = `company-context ${endpoint}`;
  if (reported.has(key)) return null;
  reported.add(key);
  return { endpoint, sent, header: String(header) };
}

/** Wire into an axios request interceptor. Returns the config unchanged. */
export function guardRequest(config) {
  if (!import.meta.env?.DEV) return config;

  ensureContract();
  const mismatch = inspectCompanyContext(config);
  if (mismatch) {
    console.warn(
      `[company-context] ${mismatch.endpoint} sends company_id ${mismatch.sent}, ` +
        `but s-company-lq is ${mismatch.header}.\n` +
        `  The server checks the permission on one and acts on the other; with\n` +
        `  COMPANY_CONTEXT_MODE=enforce it answers 403. Send user.sqlInfo.company_id.`
    );
  }
  const problem = inspectRequest(config);
  if (problem) {
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
