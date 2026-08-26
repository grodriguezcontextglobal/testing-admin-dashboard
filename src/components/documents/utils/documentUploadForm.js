import industries from "../../navbar/component/industriesList.json";

/**
 * Creating a company document: its rules, its options and the body it posts.
 *
 * All of it was inline in DocumentUpload.jsx, where the values came out of an
 * antd `Form` and were appended to the FormData by looping over `Object.keys`
 * with a special case per key — including six keys (`applicable_locations`,
 * `applicable_items`, `applicable_events`, `tags`, `metadata`,
 * `document_config`) that no control on the form has ever set.
 */

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
];

/** The value that decides whether the document is served publicly. */
export const SCHOOL_CONSENT = "school_consent";

const FIXED_USES = [
  { id: "onboarding", label: "Staff", note: "Shown when a staff member is onboarded" },
  { id: "event", label: "Event", note: "Attached to an event" },
  { id: "consumer", label: "Consumer", note: "Shown to a consumer" },
];

const text = (value) => String(value ?? "").trim();

/* `String(undefined)` is the string "undefined", which is how a company with no
   industry ended up with an option literally labelled "undefined". */
const PLACEHOLDER_INDUSTRIES = new Set(["", "undefined", "null"]);

/**
 * What a document can be used for.
 *
 * The list was built inline as `industries[String(industry)]?.[0] ?? industry`,
 * so a company with no industry on record got an option reading "undefined",
 * and a company whose representative label collided with one of the fixed
 * values got two options sharing a key.
 */
export const buildUsesForOptions = (industry) => {
  const name = text(industry);
  const options = [...FIXED_USES];

  if (name === "Education") {
    options.push({
      id: SCHOOL_CONSENT,
      label: "School consent",
      note: "The only kind served to guardians without a login",
    });
  }

  if (!PLACEHOLDER_INDUSTRIES.has(name.toLowerCase())) {
    const representative = text(industries[name]?.[0]) || name;
    if (
      representative &&
      !PLACEHOLDER_INDUSTRIES.has(representative.toLowerCase()) &&
      !options.some((option) => option.id === representative)
    ) {
      options.push({
        id: representative,
        label: representative,
        note: `Specific to ${name}`,
      });
    }
  }

  return options;
};

/**
 * One message per field.
 *
 * `trigger_action` had no rule at all, yet it decides whether the document is
 * public and it is the field the documents list is grouped by — a document
 * saved without one belongs to no path.
 */
export const documentFieldErrors = ({ file, title, usesFor, expirationDate, now } = {}) => {
  const errors = {};
  if (!file) errors.file = "Choose the PDF to upload.";
  if (!text(title)) errors.title = "Give the document a title.";
  if (!usesFor) errors.usesFor = "Say where this document is used.";

  if (expirationDate) {
    const expires = new Date(expirationDate);
    if (Number.isNaN(expires.getTime())) {
      errors.expirationDate = "That is not a date.";
    } else {
      const today = new Date(now ?? Date.now());
      today.setHours(0, 0, 0, 0);
      if (expires.getTime() < today.getTime()) {
        // Nothing stopped a date in the past, which files a document that is
        // expired the moment it is created.
        errors.expirationDate = "The expiration date is in the past.";
      }
    }
  }

  return errors;
};

/**
 * The multipart body POST /api/document/upload already accepts. `document` is
 * the multer field name and is not negotiable.
 */
export const buildDocumentUploadForm = ({ file, values, user, timestamp }) => {
  const form = new FormData();
  form.append("document", file);
  form.append("company_id", user?.companyData?.id);
  form.append("created_by", user?.uid);
  form.append("at_", timestamp);
  form.append("requires_signature", false);
  form.append("document_type", "document");
  /* Only a document explicitly tagged for the school consent flow may be served
     through the unauthenticated guardian-facing public endpoint — every other
     trigger_action must stay private by default. */
  form.append("public_document", values?.trigger_action === SCHOOL_CONSENT);

  form.append("title", text(values?.title));
  form.append("trigger_action", values?.trigger_action);
  form.append("language", values?.language || "en");
  if (text(values?.description)) {
    form.append("description", text(values.description));
  }
  if (values?.expiration_date) {
    form.append("expiration_date", new Date(values.expiration_date).toISOString());
  }
  return form;
};

/**
 * What came back from the upload.
 *
 * The endpoint returns 202 `{ jobId }` since the durable job-queue migration,
 * and a deployment that still resolves inline returns `{ ok }`. Both are
 * handled; anything else is a failure with whatever the server said.
 */
export const readUploadResponse = (data) => {
  if (data?.jobId) return { kind: "job", jobId: data.jobId };
  if (data?.ok) return { kind: "done" };
  return {
    kind: "error",
    message: text(data?.msg) || "The document was not uploaded. Try again.",
  };
};

/** What a finished, failed or still-running job means for the form. */
export const readJobStatus = (data) => {
  if (data?.status === "done") return { kind: "done", document: data.result?.document };
  if (data?.status === "dead" || data?.status === "failed") {
    return {
      kind: "error",
      message: text(data?.lastError) || "The document could not be processed.",
    };
  }
  return { kind: "pending" };
};
