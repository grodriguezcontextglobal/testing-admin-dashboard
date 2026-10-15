// ─── Environment validation ───────────────────────────────────────────────────
// Runs from vite.config.js at startup (FedRAMP F0.4). A build stops on any
// error, naming the variable; the dev server only prints the report. Plain
// Node-safe JS: vite.config.js imports it before any Vite transform exists.

const REQUIRED = ["VITE_APP_DEVITRACK_API", "VITE_APP_PUBLIC_STRIPE_KEY"];

const OPTIONAL = [
  "VITE_APP_DEVITRACK_API_BACKUP",
  "VITE_APP_FEATURE_SCOPED_ROLES",
  "VITE_APP_FEATURE_MEMBER_FEES",
  "VITE_APP_FEATURE_THEME_SWITCH",
  "VITE_APP_FEATURE_INVENTORY_SERVER_PAGINATION",
];

export const KNOWN_ENV = [...REQUIRED, ...OPTIONAL];

const PREFIX = "VITE_APP_";

const isBlank = (value) => !String(value ?? "").trim();

const isHttpUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
};

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

/** An http:// URL whose host is not this machine. Assumes isHttpUrl. */
const isPlainHttpOffMachine = (value) => {
  const url = new URL(value.trim());
  return url.protocol === "http:" && !LOCAL_HOSTS.includes(url.hostname);
};

/**
 * @param {Record<string, string | undefined>} env the VITE_APP_* variables
 * @returns {{ errors: string[], warnings: string[] }}
 */
export const checkEnv = (env) => {
  const errors = [];
  const warnings = [];

  for (const name of REQUIRED) {
    if (isBlank(env[name])) errors.push(`${name} is missing.`);
  }

  for (const name of ["VITE_APP_DEVITRACK_API", "VITE_APP_DEVITRACK_API_BACKUP"]) {
    if (isBlank(env[name])) continue;
    if (!isHttpUrl(env[name])) {
      errors.push(`${name} must be an http(s) URL.`);
    } else if (isPlainHttpOffMachine(env[name])) {
      // The session token travels on every request (crypto inventory §4).
      errors.push(`${name} must use https unless the server runs on this machine.`);
    }
  }

  // Every VITE_* value ships in the public bundle.
  const stripeKey = String(env.VITE_APP_PUBLIC_STRIPE_KEY ?? "").trim();
  if (/^(sk|rk)_/.test(stripeKey)) {
    errors.push(
      "VITE_APP_PUBLIC_STRIPE_KEY must be the publishable key (pk_…): it ships in the public bundle."
    );
  }

  for (const name of Object.keys(env).sort()) {
    if (name.startsWith(PREFIX) && !KNOWN_ENV.includes(name)) {
      warnings.push(`${name} is set but nothing reads it — remove it.`);
    }
  }

  return { errors, warnings };
};

const section = (title, lines) =>
  lines.length ? [`${title}:`, ...lines.map((line) => `  - ${line}`)] : [];

export const formatEnvReport = ({ errors, warnings }) =>
  [
    ...section("Environment errors", errors),
    ...section("Environment warnings", warnings),
  ].join("\n");
