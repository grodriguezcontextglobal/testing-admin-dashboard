/**
 * A v4 UUID for the Idempotency-Key header, from the browser's cryptographic
 * generator.
 *
 * The fallback for browsers without crypto.randomUUID used to be
 * Date.now() + Math.random(), which is not a cryptographic generator
 * (FRONTEND_crypto_inventory_2026-10-15.md §4). getRandomValues exists in
 * every browser this dashboard supports, so it is the fallback now, and with
 * neither there is no key rather than a weak one.
 */
const generateIdempotencyKey = () => {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.randomUUID === "function") return webCrypto.randomUUID();
  if (typeof webCrypto?.getRandomValues !== "function") {
    throw new Error("Web Crypto is not available: cannot make an idempotency key.");
  }

  const bytes = webCrypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export default generateIdempotencyKey;
