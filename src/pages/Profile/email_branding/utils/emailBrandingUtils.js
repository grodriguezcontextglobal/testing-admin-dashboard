/**
 * Email branding settings — the pure half.
 *
 * Devitrak sends notifications on a client's behalf, but until now every one of
 * them wore Devitrak's logo and a `noreply@devitrak.com` from-name. A Bridges
 * PCS guardian getting a returned-device receipt for their child heard from a
 * vendor they have never dealt with. This module turns the company record into
 * form state and back, so the settings page holds no logic worth testing
 * through a rendered component.
 *
 * The shape written here is exactly `Company.email_branding` on the server, and
 * the server's normalizeBranding (nodeMailer/branding.js) is the only thing
 * that reads it. Keep the two in step.
 */

/** Every field blank and the feature off — what a company that never configured it has. */
export const DEFAULT_EMAIL_BRANDING = Object.freeze({
  enabled: false,
  display_name: "",
  logo_url: "",
  brand_color: "",
  reply_to: "",
  footer_note: "",
  show_powered_by: true,
});

/** Devitrak's own blue, offered as the starting swatch. */
export const FALLBACK_BRAND_COLOR = "#155eef";

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimmed = (value) => `${value ?? ""}`.trim();

export const isValidHexColor = (value) => HEX_COLOR.test(trimmed(value));

export const isValidEmail = (value) => EMAIL.test(trimmed(value));

/**
 * Company record → form state.
 *
 * Blank fields are shown as blank rather than pre-filled with the fallback, so
 * the form can tell "the client typed their company name" apart from "the
 * client left it alone and inherits it". The placeholders below carry the
 * inherited value instead.
 */
export const brandingFromCompany = (companyData) => {
  const stored = companyData?.email_branding ?? {};
  return {
    enabled: stored.enabled === true,
    display_name: trimmed(stored.display_name),
    logo_url: trimmed(stored.logo_url),
    brand_color: trimmed(stored.brand_color),
    reply_to: trimmed(stored.reply_to),
    footer_note: trimmed(stored.footer_note),
    show_powered_by: stored.show_powered_by !== false,
  };
};

/**
 * What each blank field falls back to when an email is actually sent. The form
 * shows these as placeholders so nobody has to guess what "leave empty" means.
 */
export const brandingFallbacks = (companyData) => ({
  display_name: trimmed(companyData?.company_name),
  logo_url: trimmed(companyData?.company_logo),
  brand_color: FALLBACK_BRAND_COLOR,
  reply_to: trimmed(companyData?.main_email),
});

/** The exact object the server will store, ready to PATCH. */
export const buildBrandingPayload = (form) => ({
  email_branding: {
    enabled: form.enabled === true,
    display_name: trimmed(form.display_name),
    logo_url: trimmed(form.logo_url),
    // An invalid colour is dropped rather than saved: the server would ignore
    // it anyway, and a stored value the preview refuses to honour reads as a bug.
    brand_color: isValidHexColor(form.brand_color) ? trimmed(form.brand_color) : "",
    reply_to: trimmed(form.reply_to),
    footer_note: trimmed(form.footer_note),
    show_powered_by: form.show_powered_by !== false,
  },
});

const FIELDS = Object.keys(DEFAULT_EMAIL_BRANDING);

export const hasBrandingChanges = (current, original) => {
  if (!original) return false;
  return FIELDS.some((field) => {
    const a = typeof current?.[field] === "boolean" ? current[field] : trimmed(current?.[field]);
    const b = typeof original?.[field] === "boolean" ? original[field] : trimmed(original?.[field]);
    return a !== b;
  });
};

/**
 * Problems worth blocking Save over. Only two are real: a colour the renderer
 * cannot use, and a Reply-To that would bounce. Everything else has a sane
 * fallback, so an empty field is a choice rather than an error.
 */
export const validateBranding = (form) => {
  const errors = {};
  if (!form.enabled) return errors;
  if (trimmed(form.brand_color) && !isValidHexColor(form.brand_color)) {
    errors.brand_color = "Use a hex colour such as #0b6b3a.";
  }
  if (trimmed(form.reply_to) && !isValidEmail(form.reply_to)) {
    errors.reply_to = "Enter a valid email address.";
  }
  return errors;
};

/**
 * Ask the server to render a sample email with branding that has not been
 * saved yet. Deliberately server-side: a preview built in the browser would be
 * a second implementation of the templates, free to drift from the mail people
 * actually receive.
 */
export const fetchBrandingPreview = async (api, { companyData, form, template }) => {
  const response = await api.post("/nodemailer/branding-preview", {
    template,
    branding: buildBrandingPayload(form).email_branding,
    company_id: companyData?.id,
    company_name: companyData?.company_name,
    company_logo: companyData?.company_logo,
    main_email: companyData?.main_email,
    website: companyData?.website,
  });
  return response.data;
};
