// Read each variable by name. Destructuring the env object makes Vite inline
// the whole env object, so every VITE_* var set at build time would ship in
// the public bundle, used or not.
export const ConfigEnvExport = {
  stripe_public_key: import.meta.env.VITE_APP_PUBLIC_STRIPE_KEY,
};
