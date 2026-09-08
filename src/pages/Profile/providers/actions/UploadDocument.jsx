import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import SelectComponent from "../../../../components/UX/dropdown/SelectComponent";
import Input from "../../../../components/UX/inputs/Input";
import Label from "../../../../components/UX/inputs/Label";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import "../../../../styles/global/actionForm.css";
import {
  DOCUMENT_TYPES,
  buildProviderDocumentForm,
} from "../utils/providerDocuments";

const MODAL_WIDTH = 560;

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

const describeFile = (file) => {
  if (!file) return null;
  const kb = file.size / 1024;
  const size = kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  return `${file.name} · ${size}`;
};

/**
 * Filing one receipt, invoice or contract against a supplier.
 *
 * The form was an antd `Form` inside a raw antd `Modal` — the only modal in the
 * app not going through ModalUX — with a bare `<input type="file">` whose
 * chosen file was reported through `Form.Item`'s `help` prop, which antd does
 * not render (the prop is `extra`). So after picking a file, nothing on screen
 * confirmed which one.
 *
 * Every problem was announced through the static `message` API, in the corner,
 * away from the field it was about: "Please select a file." for the missing
 * file, and one sentence for every kind of upload failure.
 *
 * `onUploaded` lets a caller keep the dialog open and file a second document —
 * a supplier relationship produces invoices for years, not once.
 */
const DocumentUpload = ({
  openDialog,
  setOpenDialog,
  providerId,
  providerName,
  refetch,
  onUploaded,
}) => {
  const { user } = useSelector((state) => state.admin);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [failure, setFailure] = useState("");

  const errors = {};
  if (!file) errors.file = "Choose the file to file against this supplier.";
  if (!title.trim()) errors.title = "Give it a name you will recognise later.";
  if (!documentType) errors.documentType = "Say what kind of document this is.";
  const errorFor = (key) => (submitAttempted ? errors[key] : undefined);

  const clear = () => {
    setFile(null);
    setTitle("");
    setDocumentType(null);
    setSubmitAttempted(false);
    setFailure("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    clear();
    setOpenDialog(false);
  };

  const upload = async () => {
    setSubmitAttempted(true);
    setFailure("");
    if (Object.keys(errors).length > 0) return;

    setUploading(true);
    try {
      const response = await devitrakApi.post(
        `/company/provider-upload-document/${providerId}`,
        buildProviderDocumentForm({
          file,
          title,
          documentType: documentType.id,
          user,
          timestamp: new Date().toISOString(),
        })
      );
      if (!response?.data?.ok) {
        setFailure(
          response?.data?.msg ||
            "The document was not stored. Nothing was uploaded — try again."
        );
        setUploading(false);
        return;
      }
      if (typeof refetch === "function") refetch();
      const filed = { title: title.trim(), type: documentType.id };
      clear();
      setUploading(false);
      if (typeof onUploaded === "function") return onUploaded(filed);
      return setOpenDialog(false);
    } catch (error) {
      setFailure(
        error?.response?.data?.msg ||
          error?.message ||
          "The document was not stored."
      );
      setUploading(false);
    }
  };

  const titleRender = () => (
    <div className="action-form__header">
      <h2 className="action-form__title">File a document</h2>
    </div>
  );

  const bodyModal = () => (
    <div className="action-form">
      <p className="action-form__lead">
        {providerName
          ? `Receipts, invoices and contracts kept against ${providerName}.`
          : "Receipts, invoices and contracts kept against this supplier."}
      </p>

      <section className={stepClass(Boolean(file))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            The file
          </h3>
        </div>
        <div className="action-form__field">
          <Label htmlFor="provider-document-file" required>Document file</Label>
          <input
            ref={fileInputRef}
            id="provider-document-file"
            type="file"
            accept="*/*"
            disabled={uploading}
            onChange={(domEvent) => setFile(domEvent.target.files?.[0] ?? null)}
          />
          {/* antd's `help` prop does not exist, so the chosen file was never
              confirmed on screen. */}
          {file ? (
            <p className="action-form__feedback action-form__feedback--ok">
              {describeFile(file)}
            </p>
          ) : (
            <p className="action-form__step-note">
              A PDF, a photo of the receipt, or a spreadsheet.
            </p>
          )}
          {errorFor("file") && (
            <p className="action-form__feedback action-form__feedback--error">
              {errorFor("file")}
            </p>
          )}
        </div>
      </section>

      <section className={stepClass(Boolean(title.trim() && documentType))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">2</span>
            What it is
          </h3>
          <span className="action-form__step-note">
            How you will find it among the rest
          </span>
        </div>
        <div className="action-form__grid">
          <div className="action-form__field action-form__field--wide">
            <Label htmlFor="provider-document-title" required>Title</Label>
            <Input
              id="provider-document-title"
              value={title}
              onChange={(domEvent) => setTitle(domEvent.target.value)}
              placeholder="Invoice 4410 — July"
              disabled={uploading}
              error={Boolean(errorFor("title"))}
            />
            {errorFor("title") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("title")}
              </p>
            )}
          </div>

          <div className="action-form__field action-form__field--wide">
            <SelectComponent
              label="Document type"
              isRequired
              placeholder="Receipt, invoice, contract…"
              items={DOCUMENT_TYPES}
              value={documentType}
              onSelect={setDocumentType}
            />
            {errorFor("documentType") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("documentType")}
              </p>
            )}
          </div>
        </div>
      </section>

      {failure && <p className="action-form__notice">{failure}</p>}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          The file is stored against this supplier and stays on its record.
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          func={handleClose}
          isDisabled={uploading}
        />
        <BlueButtonComponent
          title="File document"
          buttonType="button"
          func={upload}
          isDisabled={uploading}
          isLoading={uploading}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={titleRender()}
      body={bodyModal()}
      openDialog={openDialog}
      closeModal={handleClose}
      width={MODAL_WIDTH}
    />
  );
};

DocumentUpload.propTypes = {
  openDialog: PropTypes.bool,
  setOpenDialog: PropTypes.func.isRequired,
  providerId: PropTypes.string,
  providerName: PropTypes.string,
  refetch: PropTypes.func,
  onUploaded: PropTypes.func,
};

export default DocumentUpload;
