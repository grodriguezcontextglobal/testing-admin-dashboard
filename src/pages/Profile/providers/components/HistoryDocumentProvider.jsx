import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import EmptyState from "../../../../components/UX/emptyState/EmptyState";
import Input from "../../../../components/UX/inputs/Input";
import Label from "../../../../components/UX/inputs/Label";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import "../../../../styles/global/actionForm.css";
import "../providerDocuments.css";
import {
  documentTypeCounts,
  filterProviderDocuments,
  normalizeProviderDocument,
  sortProviderDocuments,
} from "../utils/providerDocuments";

const MODAL_WIDTH = 720;

/**
 * Everything filed against one supplier.
 *
 * The list was an unfiltered `<List>` of every document, and each row showed
 * the title, "Uploaded: {date}" and a size. Three things were wrong with that:
 *
 *  - The date was always "Unknown". The upload sends `uploadedAt`; this read
 *    `doc.uploadDate`.
 *  - The type was never shown, so a receipt and an invoice looked identical —
 *    the one distinction the upload form asks about.
 *  - There was no way to open anything. Documents were write-only.
 *
 * A supplier is kept for years and accumulates an invoice at a time, so the
 * list is filterable by type, searchable, and sorted newest-first. The sort
 * state is owned here now; it used to be lifted into the page for no reason and
 * `sortDocuments` was passed down as a function.
 */
const HistoryDocumentProvider = ({
  openDocumentHistory,
  setOpenDocumentHistory,
  selectedProvider,
  onUploadDocument,
  lead,
}) => {
  const [typeFilter, setTypeFilter] = useState(null);
  const [term, setTerm] = useState("");
  const [order, setOrder] = useState("desc");

  const documents = useMemo(
    () =>
      (Array.isArray(selectedProvider?.documents)
        ? selectedProvider.documents
        : []
      ).map(normalizeProviderDocument),
    [selectedProvider]
  );

  const chips = useMemo(() => documentTypeCounts(documents), [documents]);
  const visible = useMemo(
    () => sortProviderDocuments(filterProviderDocuments(documents, { type: typeFilter, term }), order),
    [documents, typeFilter, term, order]
  );

  const close = () => {
    setTypeFilter(null);
    setTerm("");
    setOpenDocumentHistory(false);
  };

  const noneAtAll = documents.length === 0;
  const narrowed = Boolean(typeFilter) || Boolean(term.trim());

  const titleRender = () => (
    <div className="action-form__header">
      <h2 className="action-form__title">
        {selectedProvider?.companyName ?? "Supplier"} — documents
      </h2>
      <p className="action-form__lead">
        {lead ??
          (noneAtAll
            ? "Nothing filed yet."
            : `${documents.length} document${documents.length === 1 ? "" : "s"} on record.`)}
      </p>
    </div>
  );

  const bodyModal = () => (
    <div className="action-form">
      {noneAtAll ? (
        <EmptyState
          icon="tabler:file-off"
          title="No documents filed yet"
          description="Receipts, invoices and contracts you file against this supplier appear here, newest first."
          compact
        />
      ) : (
        <>
          <div className="provider-docs__controls">
            <div className="provider-docs__chips">
              <button
                type="button"
                className={`provider-docs__chip${!typeFilter ? " is-active" : ""}`}
                onClick={() => setTypeFilter(null)}
              >
                All <span>{documents.length}</span>
              </button>
              {chips.map((chip) => (
                <button
                  key={chip.id || "unspecified"}
                  type="button"
                  className={`provider-docs__chip${typeFilter === chip.id ? " is-active" : ""}`}
                  onClick={() => setTypeFilter(chip.id)}
                >
                  {chip.label} <span>{chip.count}</span>
                </button>
              ))}
            </div>

            <div className="provider-docs__search">
              <Label htmlFor="provider-docs-search">Search</Label>
              <Input
                id="provider-docs-search"
                value={term}
                onChange={(domEvent) => setTerm(domEvent.target.value)}
                placeholder="Title or type"
              />
            </div>

            <GrayButtonComponent
              size="sm"
              title={order === "desc" ? "Newest first" : "Oldest first"}
              buttonType="button"
              func={() => setOrder((current) => (current === "desc" ? "asc" : "desc"))}
            />
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon="tabler:filter-off"
              title="Nothing matches that"
              description="No document on this supplier matches the filter. Clear it to see the rest."
              compact
            />
          ) : (
            <ul className="provider-docs__list action-form__scroll">
              {visible.map((doc) => (
                <li className="provider-docs__row" key={doc.key}>
                  <div className="provider-docs__main">
                    <p className="provider-docs__title">{doc.title}</p>
                    <p className="provider-docs__meta">
                      {doc.uploadedAtLabel}
                      {doc.sizeLabel ? ` · ${doc.sizeLabel}` : ""}
                    </p>
                  </div>
                  <span
                    className={`provider-docs__type provider-docs__type--${doc.type || "unspecified"}`}
                  >
                    {doc.typeLabel}
                  </span>
                  {doc.url ? (
                    <a
                      className="provider-docs__open"
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>
                  ) : (
                    /* No download route exists for a provider document, so this
                       is only possible when the record itself carries a URL. */
                    <span className="provider-docs__unavailable">Stored</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {narrowed && (
            <p className="action-form__step-note">
              Showing {visible.length} of {documents.length}.
            </p>
          )}
        </>
      )}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          Filed documents stay on this supplier&apos;s record.
        </p>
        <GrayButtonComponent title="Close" buttonType="button" func={close} />
        {typeof onUploadDocument === "function" && (
          <BlueButtonComponent
            title={noneAtAll ? "File a document" : "File another"}
            buttonType="button"
            func={() => onUploadDocument(selectedProvider)}
          />
        )}
      </div>
    </div>
  );

  return (
    <ModalUX
      title={titleRender()}
      body={bodyModal()}
      openDialog={openDocumentHistory}
      closeModal={close}
      width={MODAL_WIDTH}
    />
  );
};

HistoryDocumentProvider.propTypes = {
  openDocumentHistory: PropTypes.bool,
  setOpenDocumentHistory: PropTypes.func.isRequired,
  selectedProvider: PropTypes.object,
  onUploadDocument: PropTypes.func,
  lead: PropTypes.string,
};

export default HistoryDocumentProvider;
