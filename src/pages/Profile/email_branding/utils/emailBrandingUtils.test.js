import { describe, expect, it, vi } from "vitest";
import {
  brandingFallbacks,
  brandingFromCompany,
  buildBrandingPayload,
  DEFAULT_EMAIL_BRANDING,
  FALLBACK_BRAND_COLOR,
  fetchBrandingPreview,
  hasBrandingChanges,
  isValidHexColor,
  validateBranding,
} from "./emailBrandingUtils";

const COMPANY = {
  id: "68d0000000000000000b0002",
  company_name: "Bridges Public Charter School",
  company_logo: "https://cdn/bridges.png",
  main_email: "office@bridgespcs.org",
  website: "https://bridgespcs.org",
};

describe("brandingFromCompany", () => {
  it("reads a company that has never configured branding as off and empty", () => {
    expect(brandingFromCompany(COMPANY)).toEqual(DEFAULT_EMAIL_BRANDING);
    expect(brandingFromCompany(undefined)).toEqual(DEFAULT_EMAIL_BRANDING);
  });

  it("leaves blank fields blank rather than pre-filling the inherited value", () => {
    // The form has to be able to tell "typed this" from "inherits it"; the
    // inherited value is shown as a placeholder instead.
    const form = brandingFromCompany({
      ...COMPANY,
      email_branding: { enabled: true, brand_color: "#0b6b3a" },
    });
    expect(form.enabled).toBe(true);
    expect(form.display_name).toBe("");
    expect(form.logo_url).toBe("");
    expect(form.brand_color).toBe("#0b6b3a");
  });

  it("treats a missing show_powered_by as on, matching the server default", () => {
    expect(brandingFromCompany({ email_branding: { enabled: true } }).show_powered_by).toBe(true);
    expect(
      brandingFromCompany({ email_branding: { enabled: true, show_powered_by: false } })
        .show_powered_by
    ).toBe(false);
  });
});

describe("brandingFallbacks", () => {
  it("reports what each blank field will inherit", () => {
    expect(brandingFallbacks(COMPANY)).toEqual({
      display_name: "Bridges Public Charter School",
      logo_url: "https://cdn/bridges.png",
      brand_color: FALLBACK_BRAND_COLOR,
      reply_to: "office@bridgespcs.org",
    });
  });
});

describe("buildBrandingPayload", () => {
  it("produces the exact email_branding sub-document the server stores", () => {
    const payload = buildBrandingPayload({
      enabled: true,
      display_name: "  Bridges PCS  ",
      logo_url: "https://cdn/email.png",
      brand_color: "#0b6b3a",
      reply_to: " devices@bridgespcs.org ",
      footer_note: "1250 Taylor St NE",
      show_powered_by: false,
    });
    expect(payload).toEqual({
      email_branding: {
        enabled: true,
        display_name: "Bridges PCS",
        logo_url: "https://cdn/email.png",
        brand_color: "#0b6b3a",
        reply_to: "devices@bridgespcs.org",
        footer_note: "1250 Taylor St NE",
        show_powered_by: false,
      },
    });
  });

  it("drops a colour the renderer would refuse rather than storing it", () => {
    // A stored value the preview silently ignores reads as a bug.
    expect(
      buildBrandingPayload({ enabled: true, brand_color: "green" }).email_branding.brand_color
    ).toBe("");
  });
});

describe("validateBranding", () => {
  it("blocks nothing while branding is off", () => {
    expect(validateBranding({ enabled: false, brand_color: "nonsense", reply_to: "x" })).toEqual({});
  });

  it("blocks only a colour the renderer cannot use and an address that would bounce", () => {
    const errors = validateBranding({
      enabled: true,
      brand_color: "green",
      reply_to: "not-an-email",
    });
    expect(Object.keys(errors).sort()).toEqual(["brand_color", "reply_to"]);
  });

  it("accepts empty fields, which simply inherit", () => {
    expect(validateBranding({ enabled: true, brand_color: "", reply_to: "" })).toEqual({});
  });

  it("accepts both hex forms", () => {
    expect(isValidHexColor("#abc")).toBe(true);
    expect(isValidHexColor("#0b6b3a")).toBe(true);
    expect(isValidHexColor("0b6b3a")).toBe(false);
  });
});

describe("hasBrandingChanges", () => {
  const original = { ...DEFAULT_EMAIL_BRANDING, enabled: true, display_name: "Bridges PCS" };

  it("is false for an untouched form", () => {
    expect(hasBrandingChanges({ ...original }, original)).toBe(false);
  });

  it("ignores whitespace-only edits", () => {
    expect(hasBrandingChanges({ ...original, display_name: " Bridges PCS " }, original)).toBe(false);
  });

  it("catches a flipped switch as well as an edited field", () => {
    expect(hasBrandingChanges({ ...original, show_powered_by: false }, original)).toBe(true);
    expect(hasBrandingChanges({ ...original, footer_note: "x" }, original)).toBe(true);
  });

  it("is false before the original has loaded, so Save is not offered on nothing", () => {
    expect(hasBrandingChanges(original, null)).toBe(false);
  });
});

describe("fetchBrandingPreview", () => {
  it("sends the unsaved draft plus the company fields the fallbacks need", async () => {
    const post = vi.fn().mockResolvedValue({ data: { ok: true, html: "<html></html>" } });
    const result = await fetchBrandingPreview(
      { post },
      {
        companyData: COMPANY,
        form: { ...DEFAULT_EMAIL_BRANDING, enabled: true, display_name: "Bridges PCS" },
        template: "device_returned",
      }
    );

    expect(post).toHaveBeenCalledWith("/nodemailer/branding-preview", {
      template: "device_returned",
      branding: expect.objectContaining({ enabled: true, display_name: "Bridges PCS" }),
      company_id: COMPANY.id,
      company_name: COMPANY.company_name,
      company_logo: COMPANY.company_logo,
      main_email: COMPANY.main_email,
      website: COMPANY.website,
    });
    expect(result.html).toBe("<html></html>");
  });
});
