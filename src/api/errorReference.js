/**
 * The reference the API attaches to a failure.
 *
 * Since 2026-11-26 (server `c100545`) a 500 no longer carries the error's own
 * message. What arrives instead is the same shape everywhere:
 *   { ok: false, msg: "The server could not complete the request",
 *     ref: "a3f91c2b4e07" }
 * plus an `X-Error-Ref` header. The message is now generic by design, so the
 * reference is the only thing that connects what a person saw to what the
 * server logged — and it is worth nothing unless it reaches that person in a
 * form they can repeat.
 *
 * This module is the reader. It is pure: no axios, no React, no I/O. The
 * interceptor in devitrakApi.jsx attaches the result to the error every caller
 * already receives, the way planLimit.js attaches `isPlanLimit`, so no screen
 * has to parse a body to show it.
 *
 * On the header: a cross-origin response header the server does not name in
 * `Access-Control-Expose-Headers` does not exist as far as JavaScript is
 * concerned — it reads `undefined`, with no error and no warning. The API and
 * the dashboard are different origins, so until the backend confirms that
 * header is exposed (asked 2026-11-26), the body's `ref` is what will actually
 * arrive and the header path below is a fallback that may never fire.
 */

const HEADER = "x-error-ref";

/** A reference is a non-empty string and nothing else. */
const cleaned = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const fromHeaders = (headers) => {
  if (!headers) return null;
  // Axios v1 hands over an AxiosHeaders, whose getter is case-insensitive.
  if (typeof headers.get === "function") return cleaned(headers.get(HEADER));
  const name = Object.keys(headers).find((key) => key.toLowerCase() === HEADER);
  return name ? cleaned(headers[name]) : null;
};

/** The reference this failure carries, body first, or null. */
export const readErrorReference = (error) => {
  const response = error?.response;
  if (!response) return null;
  return cleaned(response.data?.ref) ?? fromHeaders(response.headers);
};

/**
 * Sets `errorRef` on the error when there is one, and returns the same error.
 *
 * The property stays absent when there is none, rather than being set to null:
 * an error with no reference should answer "no" to a screen that asks, and a
 * network failure that never reached the API has nothing to report.
 */
export const attachErrorReference = (error) => {
  const ref = readErrorReference(error);
  if (ref) error.errorRef = ref;
  return error;
};

/**
 * One line for the console, beside the request that failed.
 *
 * This is the part that earns its keep before any UI exists: a developer
 * reading the console gets the reference and the URL together, which is the
 * whole bug report.
 */
export const errorReferenceLog = ({ ref, method, url } = {}) => {
  const request = [typeof method === "string" ? method.toUpperCase() : null, url]
    .filter(Boolean)
    .join(" ");
  return request ? `Devitrak API error ref ${ref} — ${request}` : `Devitrak API error ref ${ref}`;
};
