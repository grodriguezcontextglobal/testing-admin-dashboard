/**
 * HTTP security headers for admin.devitrak.net
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, A2 · SC-8, SC-7, SI-10).
 *
 * IIS serves them from dist/web.config. vite.config.js writes them there at
 * build time, in place of SECURITY_HEADERS_MARKER in public/web.config,
 * because the CSP has to name the API origins of the environment being built.
 *
 * The CSP ships as Report-Only first: violations show in the browser console
 * without blocking anything. Once a week of real use shows no false positives,
 * build with VITE_APP_CSP_ENFORCE=true to enforce it.
 */

export const SECURITY_HEADERS_MARKER = "<!-- SECURITY_HEADERS -->";

const STATUS_ORIGIN = "https://devitrak-status.cacaminero.workers.dev";

// Stripe's documented CSP for Stripe.js and Connect embedded components.
const STRIPE_SCRIPTS = ["https://js.stripe.com", "https://*.js.stripe.com", "https://connect-js.stripe.com"];
const STRIPE_FRAMES = [...STRIPE_SCRIPTS, "https://hooks.stripe.com", "https://connect.stripe.com"];
const STRIPE_CONNECT = ["https://api.stripe.com", "https://connect-js.stripe.com", "https://merchant-ui-api.stripe.com"];

// @iconify/react fetches each icon at runtime from its API, falling back to
// the other two hosts. Without them an enforced CSP blanks every icon the
// browser has not cached yet.
const ICONIFY_API = ["https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"];

// The API env vars carry a path (https://db.devitrak.net/api). A CSP source
// with a path and no trailing slash matches only that exact URL, so keep the
// origin alone, once.
const toOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
};

const cleanOrigins = (origins) => [
  ...new Set(
    (Array.isArray(origins) ? origins : [])
      .map((origin) => String(origin ?? "").trim())
      .filter(Boolean)
      .map(toOrigin)
  ),
];

export const buildContentSecurityPolicy = ({ apiOrigins }) => {
  const directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'", ...STRIPE_SCRIPTS],
    // MUI, emotion and antd inject <style> at runtime.
    ["style-src", "'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
    ["font-src", "'self'", "data:", "https://fonts.gstatic.com"],
    // Item, staff and company images come from several hosts (Cloudinary, S3, Stripe).
    ["img-src", "'self'", "data:", "blob:", "https:"],
    ["connect-src", "'self'", ...cleanOrigins(apiOrigins), ...STRIPE_CONNECT, ...ICONIFY_API, STATUS_ORIGIN],
    ["frame-src", "'self'", "blob:", ...STRIPE_FRAMES],
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ];
  return directives.map((parts) => parts.join(" ")).join("; ");
};

export const buildSecurityHeaders = ({ apiOrigins, enforceCsp = false }) => [
  { name: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { name: "X-Content-Type-Options", value: "nosniff" },
  { name: "X-Frame-Options", value: "DENY" },
  { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { name: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  {
    name: enforceCsp ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value: buildContentSecurityPolicy({ apiOrigins }),
  },
];

const xmlAttribute = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Replaces the marker in a web.config with an IIS <httpProtocol> block. */
export const injectSecurityHeaders = (webConfig, headers) => {
  if (!webConfig.includes(SECURITY_HEADERS_MARKER)) {
    throw new Error(`web.config has no ${SECURITY_HEADERS_MARKER} marker: security headers would be lost`);
  }
  const lines = [
    "<httpProtocol>",
    "      <customHeaders>",
    '        <remove name="X-Powered-By" />',
    ...headers.map(({ name, value }) => `        <add name="${xmlAttribute(name)}" value="${xmlAttribute(value)}" />`),
    "      </customHeaders>",
    "    </httpProtocol>",
  ];
  return webConfig.replace(SECURITY_HEADERS_MARKER, lines.join("\n"));
};
