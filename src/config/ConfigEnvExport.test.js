import { describe, expect, it } from "vitest";
import { ConfigEnvExport } from "./ConfigEnvExport";
import source from "./ConfigEnvExport.jsx?raw";
import apiSource from "../api/devitrakApi.jsx?raw";

// FedRAMP F0.1 / F0.2 (fedRAMP/FRONTEND_action_plan_2026-09-28.md).
describe("ConfigEnvExport", () => {
  it("exports only the values the client actually reads", () => {
    expect(Object.keys(ConfigEnvExport)).toEqual(["stripe_public_key"]);
  });

  it("never ships the dead Twilio token or the encryption key", () => {
    expect(ConfigEnvExport).not.toHaveProperty("twilio_auth_token");
    expect(ConfigEnvExport).not.toHaveProperty("secrete_key_encrypt");
    expect(source).not.toMatch(/TWILIO|SECRETE_KEY_ENCRYPT/);
  });

  // The shared AWS `auth-token` was the same for every user, so anyone could
  // read it out of the public bundle. Its only client had no callers.
  it("never ships the shared AWS auth-token", () => {
    expect(ConfigEnvExport).not.toHaveProperty("header_auth_token");
    expect(source).not.toMatch(/HEADER_AUTH_TOKEN/);
    expect(apiSource).not.toMatch(/auth-token|devitrakAWSApi/);
  });

  // Destructuring `import.meta.env` makes Vite inline the WHOLE env object
  // (`__vite_import_meta_env__`), so every VITE_* var present at build time
  // lands in the public bundle — used or not. Static property access inlines
  // only the variable named.
  it("reads each variable by static property access", () => {
    expect(source).not.toMatch(/}\s*=\s*import\.meta\.env\b/);
    expect(source).not.toMatch(/import\.meta\.env(?!\.VITE_APP_)/);
  });
});
