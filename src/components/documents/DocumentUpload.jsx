import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import generateIdempotencyKey from "../../utils/actions/generateIdempotencyKey";
import "../../styles/global/actionForm.css";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import GrayButtonComponent from "../UX/buttons/GrayButton";
import SelectComponent from "../UX/dropdown/SelectComponent";
import Input from "../UX/inputs/Input";
import Label from "../UX/inputs/Label";
import TextArea from "../UX/inputs/TextArea";
import {
  LANGUAGES,
  SCHOOL_CONSENT,
  buildDocumentUploadForm,
  buildUsesForOptions,
  documentFieldErrors,
  readJobStatus,
  readUploadResponse,
} from "./utils/documentUploadForm";

const JOB_POLL_INTERVAL_MS = 1500;
const JOB_POLL_TIMEOUT_MS = 60000;

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

const describeFile = (file) => {
  if (!file) return null;
  const kb = file.size / 1024;
  const size = kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  return `${file.name} · ${size}`;
};

/** Today, as the value the date input needs to refuse the past. */
const todayValue = () => new Date().toISOString().slice(0, 10);

/**
 * Creating a company document.
 *
 * It was six `Grid` rows of a left-hand `SectionLabel` and a right-hand
 * `Form.Item`, separated by `Divider`s, with the action buttons rendered
 * **twice** — a `SectionHeader` carrying Cancel/Save above the form and a
 * `SectionFooter` carrying Cancel/Save below it. No `Form.Item` had a `label`,
 * so nothing was associated with its input, and the chosen file was reported
 * through `Form.Item`'s `help` prop, which antd does not render (the prop is
 * `extra`) — so after picking a PDF, nothing on screen confirmed which one.
 *
 * Three steps now — the file, what it is, the optional details — with one set
 * of actions and every message on the field it belongs to.
 *
 * Behaviour fixed along the way:
 *
 *  - "Uses for" had no validation rule, yet it decides `public_document` and is
 *    what the documents list is grouped by. A document could be saved belonging
 *    to no path at all.
 *  - A company with no industry on record got an option reading literally
 *    "undefined", from `String(user?.companyData?.industry)`.
 *  - The expiration date accepted a date in the past, filing a document that
 *    was expired the moment it was created.
 *  - Every failure went to the antd `message` corner toast, including the
 *    60-second poll timeout, which claimed the upload had failed when the job
 *    may well still have been running.
 *
 * The 202 + job-polling path is unchanged: the endpoint returns `{ jobId }` and
 * the form polls `/jobs/owned/:jobId` until it resolves.
 */
const DocumentUpload = ({ activeTab, refetch }) => {
  const { user } = useSelector((state) => state.admin);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [usesFor, setUsesFor] = useState(null);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [failure, setFailure] = useState("");

  const usesForOptions = buildUsesForOptions(user?.companyData?.industry);
  const errors = documentFieldErrors({ file, title, usesFor, expirationDate });
  const errorCount = Object.keys(errors).length;
  const errorFor = (key) => (submitAttempted ? errors[key] : undefined);

  const clear = () => {
    setFile(null);
    setTitle("");
    setUsesFor(null);
    setLanguage(LANGUAGES[0]);
    setDescription("");
    setExpirationDate("");
    setSubmitAttempted(false);
    setFailure("");
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pollJobStatus = (jobId) =>
    new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const poll = async () => {
        try {
          const { data } = await devitrakApi.get(`/jobs/owned/${jobId}`);
          const status = readJobStatus(data);
          if (status.kind === "done") return resolve(status.document);
          if (status.kind === "error") return reject(new Error(status.message));
          if (Date.now() - startedAt > JOB_POLL_TIMEOUT_MS) {
            /* Honest about what a timeout is: the job was accepted and may
               still finish. The old message said the upload had failed. */
            return reject(
              new Error(
                "The document is taking longer than a minute to process. It may still finish — check the documents list in a moment before uploading it again."
              )
            );
          }
          setTimeout(poll, JOB_POLL_INTERVAL_MS);
        } catch (error) {
          reject(error);
        }
      };
      poll();
    });

  const submit = async () => {
    setSubmitAttempted(true);
    setFailure("");
    if (errorCount > 0) return;

    setUploading(true);
    setProgress("Uploading the file…");
    try {
      const response = await devitrakApi.post(
        "/document/upload",
        buildDocumentUploadForm({
          file,
          values: {
            title,
            trigger_action: usesFor.id,
            language: language?.id,
            description,
            expiration_date: expirationDate || null,
          },
          user,
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Idempotency-Key": generateIdempotencyKey() } }
      );

      const outcome = readUploadResponse(response?.data);
      if (outcome.kind === "error") {
        setFailure(outcome.message);
        setUploading(false);
        setProgress("");
        return;
      }
      if (outcome.kind === "job") {
        setProgress("Processing the document…");
        await pollJobStatus(outcome.jobId);
      }

      clear();
      setUploading(false);
      activeTab("1");
      return refetch();
    } catch (error) {
      setFailure(
        error?.response?.data?.msg ||
          error?.message ||
          "The document was not uploaded."
      );
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="action-form" style={{ margin: "1rem 0" }}>
      <div className="action-form__header">
        <h2 className="action-form__title">Add a document</h2>
        <p className="action-form__lead">
          A PDF, what it is for, and where in the app it should appear.
        </p>
      </div>

      <section className={stepClass(Boolean(file))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            The file
          </h3>
          <span className="action-form__step-note">PDF only</span>
        </div>
        <div className="action-form__field">
          <Label htmlFor="document-file">PDF file *</Label>
          <input
            ref={fileInputRef}
            id="document-file"
            type="file"
            accept="application/pdf"
            disabled={uploading}
            onChange={(domEvent) => setFile(domEvent.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="action-form__feedback action-form__feedback--ok">
              {describeFile(file)}
            </p>
          )}
          {errorFor("file") && (
            <p className="action-form__feedback action-form__feedback--error">
              {errorFor("file")}
            </p>
          )}
        </div>
      </section>

      <section className={stepClass(Boolean(title.trim() && usesFor))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">2</span>
            What it is
          </h3>
        </div>
        <div className="action-form__grid">
          <div className="action-form__field action-form__field--wide">
            <Label htmlFor="document-title">Title *</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(domEvent) => setTitle(domEvent.target.value)}
              placeholder="Rental agreement"
              disabled={uploading}
              error={Boolean(errorFor("title"))}
            />
            <p className="action-form__step-note">
              This is what is shown wherever the document appears.
            </p>
            {errorFor("title") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("title")}
              </p>
            )}
          </div>

          <div className="action-form__field">
            <SelectComponent
              label="Uses for"
              isRequired
              placeholder="Where it is used"
              items={usesForOptions.map((option) => ({
                ...option,
                supportingText: option.note,
              }))}
              value={usesFor}
              onSelect={setUsesFor}
            />
            {errorFor("usesFor") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("usesFor")}
              </p>
            )}
          </div>

          <div className="action-form__field">
            <SelectComponent
              label="Language"
              placeholder="Language"
              items={LANGUAGES}
              value={language}
              onSelect={(option) => setLanguage(option ?? LANGUAGES[0])}
            />
          </div>
        </div>

        {usesFor?.id === SCHOOL_CONSENT && (
          <p className="action-form__banner action-form__banner--warning">
            A school-consent document is served to guardians{" "}
            <strong>without a login</strong>. Anything else stays private to the
            company.
          </p>
        )}
      </section>

      <section className="action-form__step">
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">3</span>
            Details
          </h3>
          <span className="action-form__step-note">Both optional</span>
        </div>
        <div className="action-form__grid">
          <div className="action-form__field action-form__field--wide">
            <Label htmlFor="document-description">Description</Label>
            <TextArea
              id="document-description"
              value={description}
              onChange={(domEvent) => setDescription(domEvent.target.value)}
              placeholder="What this document covers, and who signs it."
              disabled={uploading}
              textAreaProps={{ rows: 4, style: { resize: "none" } }}
            />
          </div>

          <div className="action-form__field action-form__field--wide">
            <Label htmlFor="document-expiration">Expires on</Label>
            <Input
              id="document-expiration"
              type="date"
              value={expirationDate}
              onChange={(domEvent) => setExpirationDate(domEvent.target.value)}
              disabled={uploading}
              error={Boolean(errorFor("expirationDate"))}
              inputProps={{ min: todayValue() }}
            />
            {errorFor("expirationDate") ? (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("expirationDate")}
              </p>
            ) : (
              <p className="action-form__step-note">
                Leave it empty and the document never expires.
              </p>
            )}
          </div>
        </div>
      </section>

      {failure && <p className="action-form__notice">{failure}</p>}

      {submitAttempted && errorCount > 0 && (
        <p className="action-form__notice">
          {errorCount} field{errorCount === 1 ? " needs" : "s need"} filling in
          above.
        </p>
      )}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          {progress ||
            "The file is uploaded and processed before it appears in the list."}
        </p>
        <GrayButtonComponent
          title="Clear"
          buttonType="button"
          func={clear}
          isDisabled={uploading}
        />
        <BlueButtonComponent
          title="Add document"
          buttonType="button"
          func={submit}
          isDisabled={uploading}
          isLoading={uploading}
        />
      </div>
    </div>
  );
};

DocumentUpload.propTypes = {
  activeTab: PropTypes.func.isRequired,
  refetch: PropTypes.func.isRequired,
};

export default DocumentUpload;
