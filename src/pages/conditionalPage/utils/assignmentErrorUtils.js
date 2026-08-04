/**
 * Assignment error classification utilities for device-lease assignment.
 *
 * The server now returns 422 with machine-readable `code` for two known
 * failure modes: CONSENT_REQUIRED and GUARDIAN_REQUIRED. These utilities
 * extract and classify those errors so the UI can branch on them.
 *
 * @see FRONTEND_server_updates_2026-07.md §1
 */

const KNOWN_422_CODES = ["CONSENT_REQUIRED", "UNDER_13_CONSENT_REQUIRED", "GUARDIAN_REQUIRED"];

const PERIOD_RE = /[.!?]\s*$/;

/** Ensure a sentence ends with a period before appending more text. */
function ensurePeriod(str) {
  if (!str) return "";
  return PERIOD_RE.test(str) ? str : `${str}.`;
}

/**
 * Classify an error from POST /db_member/new-member-assigned-device-lease.
 *
 * @param {Object|null|undefined} error - Axios error object (or any error)
 * @returns {{ type: string, message: string, members: number[] }}
 */
export function classifyAssignmentError(error) {
  if (!error || typeof error !== "object") {
    return { type: "GENERIC", message: "An unexpected error occurred.", members: [] };
  }

  const { response, code: errorCode, message: errorMessage } = error;

  // Network / timeout — no response object
  if (!response) {
    if (errorCode === "ECONNABORTED" || errorMessage?.includes("timeout")) {
      return { type: "NETWORK", message: errorMessage || "Request timed out.", members: [] };
    }
    return { type: "NETWORK", message: errorMessage || "Network Error", members: [] };
  }

  const { status, data } = response;

  // Only 422 carries the machine-readable code branch
  if (status === 422) {
    const code = data?.code;
    if (KNOWN_422_CODES.includes(code)) {
      return {
        type: code,
        message: data?.msg || "",
        members: Array.isArray(data?.members) ? data.members : [],
      };
    }
    return {
      type: "GENERIC_422",
      message: data?.msg || "Request could not be completed.",
      members: [],
    };
  }

  // Everything else (400, 401, 403, 404, 500, …)
  const msg =
    data && typeof data === "object"
      ? data.msg || "An unexpected error occurred."
      : "An unexpected error occurred.";

  return { type: "GENERIC", message: msg, members: [] };
}

/**
 * Build a user-facing error message from a classified assignment error.
 *
 * @param {{ type: string, message: string, members: number[] }} classification
 * @returns {string}
 */
export function getAssignmentErrorMessage(classification) {
  const { type, message } = classification;

  switch (type) {
    case "CONSENT_REQUIRED":
      return message
        ? `${ensurePeriod(message)} Please record consent for the member before retrying.`
        : "Consent is required before assigning a device. Please record consent for the member before retrying.";

    case "UNDER_13_CONSENT_REQUIRED":
      return message
        ? `${ensurePeriod(message)} COPPA regulations require guardian consent for students under 13. Please record consent before retrying.`
        : "This student is under 13. COPPA regulations require guardian consent before device assignment. Please record consent before retrying.";

    case "GUARDIAN_REQUIRED":
      return message
        ? `${ensurePeriod(message)} Please add guardian information before retrying.`
        : "A guardian must be on file for this minor. Please add guardian information before retrying.";

    case "NETWORK":
      return "Unable to connect to the server. Please check your connection and try again.";

    case "GENERIC_422":
    case "GENERIC":
    default:
      return message || "An unexpected error occurred.";
  }
}
