/**
 * The text to show a person when something fails (FedRAMP SI-11: error
 * messages say what is needed without revealing how the system works).
 *
 * - A request the server answered: its `msg` (or `message`), which the
 *   server writes for people. Never axios' own text ("Request failed with
 *   status code 500").
 * - A request that got no answer: a "could not reach the server" message.
 * - An Error the app threw on purpose, or a plain string: its text.
 * - Anything else: the fallback.
 *
 * It never stringifies the error: an axios error carries the request config,
 * headers included, so `JSON.stringify(error)` put the session token on screen.
 */
export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

const MAX_LENGTH = 300;

const usableText = (value) =>
  typeof value === "string" && value.trim() !== ""
    ? value.trim().slice(0, MAX_LENGTH)
    : null;

export const userFacingError = (error, fallback = DEFAULT_ERROR_MESSAGE) => {
  if (typeof error === "string") return usableText(error) ?? fallback;
  if (!error || typeof error !== "object") return fallback;

  if (error.isAxiosError || error.response || error.config) {
    if (!error.response) return NETWORK_ERROR_MESSAGE;
    const data = error.response.data;
    return usableText(data?.msg) ?? usableText(data?.message) ?? fallback;
  }

  if (error instanceof Error) return usableText(error.message) ?? fallback;
  return fallback;
};
