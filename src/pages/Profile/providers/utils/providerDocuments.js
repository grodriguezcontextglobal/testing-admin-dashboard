/**
 * A supplier's paperwork: receipts, invoices, contracts.
 *
 * A supplier relationship runs for years, so this list grows — several invoices
 * a year, each on its own date. The history modal was rendering an unfiltered
 * `<List>` of title, date and size, and the date came out "Unknown" on every
 * row: the upload sends `uploadedAt` and the list read `uploadDate`. The type,
 * which is the whole reason a receipt and an invoice are told apart, was never
 * displayed at all.
 */

/** The four values POST /company/provider-upload-document/:id already stores. */
export const DOCUMENT_TYPES = [
  { id: "receipt", label: "Receipt" },
  { id: "invoice", label: "Invoice" },
  { id: "contract", label: "Contract" },
  { id: "other", label: "Other" },
];

const text = (value) => String(value ?? "").trim();

const BARE_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A bare `YYYY-MM-DD` parses as UTC midnight and renders as the previous day
 * for anybody west of UTC, so it is shown as stored. A full timestamp is
 * localised.
 */
const formatUploadedAt = (value) => {
  const raw = text(value);
  if (!raw) return "Date unknown";
  if (BARE_DATE.test(raw)) return raw;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "Date unknown" : parsed.toLocaleString();
};

const formatSize = (size) => {
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) return null;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * There is no download endpoint for a provider document — the contract carries
 * an upload and nothing else — so whether one can be opened depends on the
 * server having stored a URL. Anything that is not an absolute http(s) URL is
 * refused rather than turned into a broken link.
 */
const resolveUrl = (doc) => {
  const candidate = [
    doc?.url,
    doc?.secure_url,
    doc?.document_url,
    doc?.downloadUrl,
    doc?.file_url,
  ].find((value) => /^https?:\/\//i.test(text(value)));
  return candidate ? text(candidate) : null;
};

/** The multipart body the endpoint accepts. `document` is the multer field. */
export const buildProviderDocumentForm = ({
  file,
  title,
  documentType,
  user,
  timestamp,
}) => {
  const form = new FormData();
  form.append("document", file);
  form.append("document_type", documentType);
  form.append("title", text(title));
  form.append("company_id", user?.companyData?.id);
  form.append("created_by", user?.uid);
  form.append("uploadedAt", timestamp);
  return form;
};

/** One row of the document list, from whatever shape the server returned. */
export const normalizeProviderDocument = (doc, index = 0) => {
  const type = text(doc?.document_type ?? doc?.type);
  const known = DOCUMENT_TYPES.find((entry) => entry.id === type);
  const uploadedAt = text(
    doc?.uploadedAt ?? doc?.uploadDate ?? doc?.createdAt ?? doc?.uploaded_at
  );

  return {
    key: doc?.id ?? doc?._id ?? `document-${index}`,
    title: text(doc?.title) || text(doc?.name) || "Untitled document",
    type,
    typeLabel: known?.label ?? (type || "Unspecified"),
    uploadedAt: uploadedAt || null,
    uploadedAtLabel: formatUploadedAt(uploadedAt),
    uploadedBy: text(doc?.created_by ?? doc?.uploadedBy) || null,
    size: typeof doc?.size === "number" ? doc.size : null,
    sizeLabel: formatSize(doc?.size),
    url: resolveUrl(doc),
  };
};

export const filterProviderDocuments = (docs, { type, term } = {}) => {
  const wanted = text(term).toLowerCase();
  return (Array.isArray(docs) ? docs : []).filter((doc) => {
    if (type && doc.type !== type) return false;
    if (!wanted) return true;
    return [doc.title, doc.typeLabel].some((field) =>
      String(field ?? "").toLowerCase().includes(wanted)
    );
  });
};

/**
 * Newest first by default. An undated row stays at the bottom in both
 * directions — sorted as epoch zero it used to climb to the top of the
 * ascending order and read as the oldest document on file.
 */
export const sortProviderDocuments = (docs, order = "desc") => {
  const withTime = (doc) => {
    const parsed = doc.uploadedAt ? new Date(doc.uploadedAt).getTime() : NaN;
    return Number.isNaN(parsed) ? null : parsed;
  };
  return [...(Array.isArray(docs) ? docs : [])].sort((a, b) => {
    const left = withTime(a);
    const right = withTime(b);
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return order === "asc" ? left - right : right - left;
  });
};

/** The filter chips: only types this supplier actually has something under. */
export const documentTypeCounts = (docs) => {
  const counts = new Map();
  (Array.isArray(docs) ? docs : []).forEach((doc) => {
    const current = counts.get(doc.type);
    counts.set(doc.type, {
      id: doc.type,
      label: doc.typeLabel,
      count: (current?.count ?? 0) + 1,
    });
  });

  const order = DOCUMENT_TYPES.map((entry) => entry.id);
  return Array.from(counts.values()).sort((a, b) => {
    const left = order.indexOf(a.id);
    const right = order.indexOf(b.id);
    // Unrecognised types keep their own order, after the known ones.
    return (left < 0 ? order.length : left) - (right < 0 ? order.length : right);
  });
};
