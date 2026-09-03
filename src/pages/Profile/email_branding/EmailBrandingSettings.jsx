import { useMutation, useQuery } from "@tanstack/react-query";
import { Switch, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import SectionHeader from "../../../components/documents/new_form_components/SectionHeader";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import { usePermission } from "../../../hooks/usePermission";
import {
  brandingFallbacks,
  brandingFromCompany,
  buildBrandingPayload,
  FALLBACK_BRAND_COLOR,
  fetchBrandingPreview,
  hasBrandingChanges,
  validateBranding,
} from "./utils/emailBrandingUtils";

const MAX_LOGO_BYTES = 1024 * 1024;

const cardStyle = {
  padding: "16px",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "8px",
};

const rowStyle = {
  ...cardStyle,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--gray-700, #484d47)",
};

const hintStyle = {
  fontSize: "12px",
  color: "var(--gray-500, #777b73)",
  marginTop: "4px",
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

/**
 * Branding for the notification emails Devitrak sends on this company's behalf.
 *
 * Fredrik asked for this on 2026-08-28 after a returned-device receipt reached
 * a Bridges PCS guardian wearing Devitrak's logo: "Returned receipt also needs
 * to be branded with Bridges PCS, just like the other emails."
 *
 * The preview is rendered by the server, through the same templates and the
 * same normalizer a real send uses, so what is shown here is what arrives. A
 * preview drawn in the browser would be a second implementation of forty
 * templates, and it would drift.
 */
const EmailBrandingSettings = () => {
  const { user } = useSelector((state) => state.admin);
  const companyData = user?.companyData;
  const { notify, contextHolder } = useStatusNotification();
  const canEdit = usePermission("profile:company_settings");

  const [form, setForm] = useState(() => brandingFromCompany(companyData));
  const [original, setOriginal] = useState(() => brandingFromCompany(companyData));
  const [template, setTemplate] = useState("device_returned");
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    const next = brandingFromCompany(companyData);
    setForm(next);
    setOriginal(next);
  }, [companyData]);

  const fallbacks = useMemo(() => brandingFallbacks(companyData), [companyData]);
  const errors = validateBranding(form);
  const isDirty = hasBrandingChanges(form, original);

  const setField = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const templatesQuery = useQuery({
    queryKey: ["emailBrandingTemplates"],
    queryFn: async () => {
      const { data } = await devitrakApi.get("/nodemailer/branding-preview/templates");
      return data?.templates ?? [];
    },
  });
  const templateOptions = (templatesQuery.data ?? []).map(({ key, label }) => ({
    id: key,
    label,
  }));
  const selectedTemplate = templateOptions.find((option) => option.id === template) ?? null;

  // Keyed on the whole form so every edit re-renders the sample. The request is
  // cheap (no send, no DB write) and a preview that lags the controls is worse
  // than no preview at all.
  const previewQuery = useQuery({
    queryKey: ["emailBrandingPreview", template, JSON.stringify(form)],
    queryFn: () => fetchBrandingPreview(devitrakApi, { companyData, form, template }),
    enabled: Boolean(companyData),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      devitrakApi.patch(
        `/company/update-company/${companyData?.id}`,
        buildBrandingPayload(form)
      ),
    onSuccess: () => {
      setOriginal(form);
      notify("success", "Email branding updated", 3);
      previewQuery.refetch();
    },
    onError: (error) =>
      message.error(
        error?.response?.data?.msg || "Failed to save email branding. Please try again."
      ),
  });

  /**
   * Uploads to a Cloudinary id of its own rather than reusing the company
   * logo's: a client may well want a wider wordmark in email than the square
   * mark the app header uses, and overwriting one with the other would change
   * the app's own branding as a side effect of editing email settings.
   */
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      message.error("Image is bigger than 1mb. Please resize the image or select a new one.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const uploader = new ImageUploaderFormat(base64, `${companyData?.id}_email_logo`);
      const { data } = await devitrakApi.post(
        "cloudinary/upload-image",
        uploader.company_uploader()
      );
      const url = data?.imageUploaded?.secure_url;
      if (!url) throw new Error("Upload did not return an image URL");
      setField("logo_url")(url);
    } catch (error) {
      message.error(error?.message || "Failed to upload the logo. Please try again.");
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (Object.keys(errors).length > 0) {
      message.error("Fix the highlighted fields before saving.");
      return;
    }
    saveMutation.mutate();
  };

  const preview = previewQuery.data;
  const effectiveLogo = form.logo_url || fallbacks.logo_url;

  return (
    <>
      {contextHolder}
      <div style={{ width: "100%", padding: 0 }}>
        <SectionHeader
          title="Email branding"
          subtitle="Put your organization's name, logo and colour on the notification emails Devitrak sends on your behalf — device receipts, contracts, account links and payment confirmations."
          loading={saveMutation.isPending}
          saveButton={canEdit ? handleSave : undefined}
          cancelButton={canEdit ? () => setForm(original) : undefined}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1fr)",
            gap: "24px",
            padding: "24px 0",
            alignItems: "start",
          }}
        >
          {/* ---------------- settings ---------------- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={rowStyle}>
              <div>
                <div style={labelStyle}>Use our branding on notification emails</div>
                <div style={hintStyle}>
                  Off by default. While this is off, recipients see Devitrak&apos;s logo and
                  sender name exactly as they do today.
                </div>
              </div>
              <Switch
                checked={form.enabled}
                onChange={setField("enabled")}
                disabled={!canEdit}
              />
            </div>

            <div style={{ ...cardStyle, opacity: form.enabled ? 1 : 0.55 }}>
              <div style={{ ...labelStyle, marginBottom: "4px" }}>Sender name</div>
              <div style={{ ...hintStyle, marginTop: 0, marginBottom: "12px" }}>
                Shown as the &ldquo;from&rdquo; name in the inbox. The address stays
                noreply@devitrak.com so mail keeps passing SPF and DKIM.
              </div>
              <Input
                value={form.display_name}
                onChange={(event) => setField("display_name")(event.target.value)}
                placeholder={fallbacks.display_name || "Your organization"}
                disabled={!canEdit || !form.enabled}
              />
            </div>

            <div style={{ ...cardStyle, opacity: form.enabled ? 1 : 0.55 }}>
              <div style={{ ...labelStyle, marginBottom: "4px" }}>Email logo</div>
              <div style={{ ...hintStyle, marginTop: 0, marginBottom: "12px" }}>
                Wordmarks read better than square marks at email sizes. Leave empty to reuse
                your company logo. PNG or JPG, up to 1&nbsp;MB.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "160px",
                    minHeight: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed var(--gray-300, #c8cbc2)",
                    borderRadius: "8px",
                    padding: "8px",
                    backgroundColor: "var(--gray-50, #f7f7f4)",
                  }}
                >
                  {effectiveLogo ? (
                    <img
                      src={effectiveLogo}
                      alt="Email logo"
                      style={{ maxWidth: "100%", maxHeight: "40px", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ ...hintStyle, marginTop: 0 }}>No logo</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={!canEdit || !form.enabled || uploading}
                    style={{ fontSize: "13px" }}
                  />
                  {form.logo_url ? (
                    <GrayButtonComponent
                      title="Use company logo instead"
                      func={() => setField("logo_url")("")}
                      disabled={!canEdit || !form.enabled}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, opacity: form.enabled ? 1 : 0.55 }}>
              <div style={{ ...labelStyle, marginBottom: "4px" }}>Brand colour</div>
              <div style={{ ...hintStyle, marginTop: 0, marginBottom: "12px" }}>
                Used for buttons and links. Button text switches between white and near-black
                automatically, whichever stays readable.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  type="color"
                  value={
                    /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(form.brand_color)
                      ? form.brand_color
                      : FALLBACK_BRAND_COLOR
                  }
                  onChange={(event) => setField("brand_color")(event.target.value)}
                  disabled={!canEdit || !form.enabled}
                  style={{
                    width: "44px",
                    height: "40px",
                    padding: 0,
                    border: "1px solid var(--gray-300, #c8cbc2)",
                    borderRadius: "8px",
                    background: "none",
                  }}
                  aria-label="Brand colour"
                />
                <Input
                  value={form.brand_color}
                  onChange={(event) => setField("brand_color")(event.target.value)}
                  placeholder={FALLBACK_BRAND_COLOR}
                  disabled={!canEdit || !form.enabled}
                  error={Boolean(errors.brand_color)}
                  helperText={errors.brand_color}
                />
              </div>
            </div>

            <div style={{ ...cardStyle, opacity: form.enabled ? 1 : 0.55 }}>
              <div style={{ ...labelStyle, marginBottom: "4px" }}>Reply-to address</div>
              <div style={{ ...hintStyle, marginTop: 0, marginBottom: "12px" }}>
                Where replies land. Without this, a guardian replying to a device receipt
                reaches an unmonitored mailbox.
              </div>
              <Input
                value={form.reply_to}
                onChange={(event) => setField("reply_to")(event.target.value)}
                placeholder={fallbacks.reply_to || "office@yourdomain.org"}
                disabled={!canEdit || !form.enabled}
                error={Boolean(errors.reply_to)}
                helperText={errors.reply_to}
              />
            </div>

            <div style={{ ...cardStyle, opacity: form.enabled ? 1 : 0.55 }}>
              <div style={{ ...labelStyle, marginBottom: "4px" }}>Footer line</div>
              <div style={{ ...hintStyle, marginTop: 0, marginBottom: "12px" }}>
                Your address or contact details, shown at the bottom of every email.
              </div>
              <Input
                value={form.footer_note}
                onChange={(event) => setField("footer_note")(event.target.value)}
                placeholder="Bridges PCS, 1250 Taylor St NE, Washington, DC 20017"
                disabled={!canEdit || !form.enabled}
              />
            </div>

            <div style={{ ...rowStyle, opacity: form.enabled ? 1 : 0.55 }}>
              <div>
                <div style={labelStyle}>Show &ldquo;Powered by Devitrak&rdquo;</div>
                <div style={hintStyle}>
                  A small attribution line in the footer. Turn it off for fully white-labelled
                  email.
                </div>
              </div>
              <Switch
                checked={form.show_powered_by}
                onChange={setField("show_powered_by")}
                disabled={!canEdit || !form.enabled}
              />
            </div>

            {isDirty ? (
              <div style={{ ...hintStyle, marginTop: 0 }}>
                Unsaved changes. The preview already reflects them; recipients do not until you
                save.
              </div>
            ) : null}
          </div>

          {/* ---------------- preview ---------------- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SelectComponent
              label="Preview"
              hint="Rendered by the server, through the same templates a real send uses."
              items={templateOptions}
              value={selectedTemplate}
              onSelect={(option) => setTemplate(option?.id ?? option)}
            />

            <div
              style={{
                border: "1px solid var(--gray-200, #ddded6)",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "var(--base-white, #fff)",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--gray-200, #ddded6)",
                  backgroundColor: "var(--gray-50, #f7f7f4)",
                  fontSize: "12px",
                  color: "var(--gray-600, #5d615a)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <div>
                  <strong>From:</strong> {preview?.from ?? "—"}
                </div>
                <div>
                  <strong>Reply-to:</strong> {preview?.replyTo ?? "—"}
                </div>
                <div>
                  <strong>Subject:</strong> {preview?.subject ?? "—"}
                </div>
              </div>

              {/* sandbox with no allow-scripts: the preview is rendered email,
                  and email never runs script. */}
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={previewQuery.isError ? "" : preview?.html ?? ""}
                style={{ width: "100%", height: "620px", border: 0, display: "block" }}
              />
            </div>

            {previewQuery.isError ? (
              <div style={{ ...hintStyle, marginTop: 0, color: "var(--error-600, #b42318)" }}>
                Could not render the preview. Your settings are unaffected — try again.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailBrandingSettings;
