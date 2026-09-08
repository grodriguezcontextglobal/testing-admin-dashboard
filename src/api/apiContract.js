/**
 * The server's payload contract, made usable from JavaScript.
 *
 * `src/docs/api-payloads.json` is generated from the backend controllers and
 * lists, for all 484 mounted endpoints, which body fields each handler reads
 * and which ones it rejects the request without (`required`). Its typed
 * counterpart, `src/docs/api-payloads.d.ts`, already declares an interface per
 * endpoint plus the `ApiEndpoints` map — but this is a JavaScript project with
 * no `tsconfig`, so nothing ever checked a call against it. The documentation
 * existed; the enforcement did not.
 *
 * Regeneration happens on the BACKEND repo, not here: the generator walks its
 * `routes/` and `controller/` trees and writes to `<repo>/docs/`. Run from this
 * repo it would find neither, and write an empty contract to `./docs/` — a
 * different folder from the `src/docs/` these live in, so the good copy would
 * survive while the output looked like a successful regeneration. Copy the
 * files over instead.
 *
 * This module is the enforcement half. It answers one question — "does this
 * request carry every field the handler requires?" — and two things ask it:
 *
 *   - `apiContractAudit.test.js`, which sweeps every literal `devitrakApi.*`
 *     call in the codebase and fails when a payload is missing a field;
 *   - a development-only axios interceptor, for the payloads that are built at
 *     runtime and cannot be read statically.
 *
 * Everything here is pure and takes the contract as an argument, so the tests
 * do not need the 320 KB document.
 *
 * WHAT THIS CAN AND CANNOT CATCH
 *
 * `required` means the handler answers 400/403 when the field is absent, and
 * that is the only threshold worth failing a build on. It is a lower bound, not
 * a guarantee: API_CLIENT_GUIDELINES.md §7 warns that a field being optional in
 * the type does not mean the SQL column accepts null, and this document carries
 * no column nullability, so that class of failure cannot be derived from it.
 *
 * Checking the optional fields instead was measured and rejected. Excluding the
 * endpoints whose body is a Mongo filter (`Model.find()` takes any subset by
 * design) still leaves 32 endpoints where a call omits a documented field, and
 * most of those omissions are correct: the handler accepts several spellings of
 * one input — `dateOfBirth` / `date_of_birth` / `dob`, `data` / `items` /
 * `list` / `rows` — so sending one and omitting the rest is the intended use.
 * A check that fails on those teaches people to edit the allowlist.
 */

const METHODS_WITHOUT_BODY = new Set(["GET", "DELETE", "HEAD"]);

const segments = (path) => String(path ?? "").split("/").filter(Boolean);

/** Strip the query string and collapse `//`. */
export function normalizePath(path) {
  return `/${segments(String(path ?? "").split("?")[0]).join("/")}`;
}

/**
 * The documented endpoint for one request.
 *
 * Endpoints carry Express parameters (`/api/db_item/:id`), and requests carry
 * real values, so matching is per segment with literals scoring higher than
 * parameters — otherwise `/api/db_item/delete-item` matches `/api/db_item/:id`
 * just as well as its own exact entry.
 */
export function findEndpoint(contract, method, path, { pattern = false } = {}) {
  const wanted = String(method ?? "").toUpperCase();
  const parts = segments(normalizePath(path));
  let best = null;

  for (const entry of contract ?? []) {
    if (String(entry.method).toUpperCase() !== wanted) continue;

    const candidate = segments(entry.endpoint);
    if (candidate.length !== parts.length) continue;

    let score = 0;
    let matches = true;
    for (let i = 0; i < candidate.length; i += 1) {
      const isParam = candidate[i].startsWith(":");

      // `pattern` is for paths read out of source, where `${id}` was collapsed
      // to a placeholder: it stands for a value nobody knows yet, so it matches
      // any segment. A parameter route is the better answer for it than a
      // literal one, hence the score.
      if (pattern && parts[i].startsWith(":")) {
        if (isParam) score += 1;
        continue;
      }
      if (isParam) continue;
      if (candidate[i] === parts[i]) score += 1;
      else {
        matches = false;
        break;
      }
    }
    if (matches && (best === null || score > best.score)) {
      best = { score, entry };
    }
  }

  return best?.entry ?? null;
}

/**
 * Required fields the caller still has to supply in the body.
 *
 * A field named in the endpoint's `params` is satisfied by the URL, so it is
 * not the body's problem — the generator lists both in `required`.
 */
export function requiredBodyFields(entry) {
  if (!entry) return [];
  const inUrl = new Set(entry.params ?? []);
  return (entry.required ?? []).filter((field) => !inUrl.has(field));
}

/**
 * What a request is missing, or `null` when there is nothing to say.
 *
 * Returns `null` rather than an empty result for the cases where silence is the
 * honest answer: an endpoint that is not in the contract, one whose body is
 * dynamic (`Object.keys(req.body)` becomes SQL columns), and one that requires
 * nothing.
 */
export function checkPayload(contract, { method, url, body }) {
  const entry = findEndpoint(contract, method, url);
  if (!entry) return null;
  if (entry.dynamic?.length) return null;

  const required = requiredBodyFields(entry);
  if (required.length === 0) return null;

  const present =
    body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const missing = required.filter(
    (field) => present[field] === undefined || present[field] === null
  );

  if (missing.length === 0) return null;

  return {
    endpoint: `${entry.method} ${entry.endpoint}`,
    missing,
    required,
    sent: Object.keys(present),
    source: entry.source,
  };
}

/**
 * The object an axios call actually sends as the body.
 *
 * `get`/`delete` take a config, not a body: the fields travel in `params` (the
 * query string) or, for delete, in `data`.
 */
export function bodyFromAxiosArgs(method, second) {
  if (!METHODS_WITHOUT_BODY.has(String(method ?? "").toUpperCase())) {
    return second;
  }
  if (!second || typeof second !== "object") return undefined;
  return second.data ?? second.params;
}

export default { findEndpoint, requiredBodyFields, checkPayload, normalizePath, bodyFromAxiosArgs };
