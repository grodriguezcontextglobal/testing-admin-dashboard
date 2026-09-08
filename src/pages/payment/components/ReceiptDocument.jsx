import PropTypes from "prop-types";
import { QRCode } from "../../../components/shared-assets/qr-code";
import {
  RECEIPT_STATUS,
  formatReceiptAmount,
  formatReceiptDate,
  receiptSignatures,
} from "../utils/receiptUtils";
import "./receipt.css";

const BAND = {
  [RECEIPT_STATUS.PAID]: { className: "receipt__band--paid", label: "Paid" },
  [RECEIPT_STATUS.VOID]: {
    className: "receipt__band--void",
    label: "Voided — this transaction was refunded",
  },
  [RECEIPT_STATUS.UNKNOWN]: {
    className: "receipt__band--unknown",
    label: "Status unavailable — verify before relying on this receipt",
  },
  [RECEIPT_STATUS.OPEN]: {
    className: "receipt__band--open",
    label: "Checked out — device is the holder's responsibility until returned",
  },
  [RECEIPT_STATUS.RETURNED]: {
    className: "receipt__band--paid",
    label: "Returned",
  },
  [RECEIPT_STATUS.DECLARED_LOST]: {
    className: "receipt__band--void",
    label: "Declared lost — device was not recovered",
  },
};

/**
 * Renders a receipt from the normalized view model produced by
 * mapTransactionToReceipt (a payment) or mapAssignmentToReceipt (a device
 * handover).
 *
 * Takes the mapped model rather than a raw document precisely so a second
 * receipt type did not require a second copy of this markup — two documents
 * that must look alike but are maintained separately drift apart.
 *
 * The same component serves the printed copy and the scanned page, so a scan
 * always shows the same layout the paper does, with the status re-read.
 *
 * @param {object} receipt mapped receipt view model
 * @param {string} [qrValue] URL to encode; omit to leave the QR off
 */
const ReceiptDocument = ({ receipt, qrValue }) => {
  const band = BAND[receipt?.status] ?? BAND[RECEIPT_STATUS.UNKNOWN];
  const isVoid = receipt?.status === RECEIPT_STATUS.VOID;
  const lines = Array.isArray(receipt?.lines) ? receipt.lines : [];
  // null total means this document carries no money at all (a handover slip),
  // so the amount column is dropped rather than filled with $0.00.
  const showAmounts = receipt?.total !== null && receipt?.total !== undefined;
  const signatures = receiptSignatures(receipt);

  return (
    <div className="receipt" data-testid="receipt-document">
      {isVoid && (
        <div className="receipt__watermark" aria-hidden="true">
          Void
        </div>
      )}

      <div className="receipt__head">
        {/* The company's own logo when it has one. `onError` drops it rather
            than leaving a broken-image icon on a printed document. */}
        {receipt?.logoUrl && (
          <img
            className="receipt__logo"
            src={receipt.logoUrl}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
        <div>
          <p className="receipt__company">{receipt?.company || "Receipt"}</p>
          <p className="receipt__title">{receipt?.title || "Receipt"}</p>
        </div>
      </div>

      {/* Status is text, not just colour — this is the line a screen reader and
          a black-and-white printout both have to carry. */}
      <div className={`receipt__band ${band.className}`} role="status">
        {band.label}
      </div>

      <dl className="receipt__meta">
        <dt>Date</dt>
        <dd>{formatReceiptDate(receipt?.date)}</dd>
        {receipt?.reference && (
          <>
            <dt>Reference</dt>
            <dd>{receipt.reference}</dd>
          </>
        )}
        <dt>{receipt?.partyLabel || "Billed to"}</dt>
        <dd>{receipt?.payer?.name || "—"}</dd>
        {receipt?.payer?.email && (
          <>
            <dt>Email</dt>
            <dd>{receipt.payer.email}</dd>
          </>
        )}
        <dt>{receipt?.idLabel || "Reference ID"}</dt>
        <dd>{receipt?.id || "—"}</dd>
      </dl>

      <table className="receipt__lines">
        <thead>
          <tr>
            <th>Item</th>
            {showAmounts && <th>Amount</th>}
          </tr>
        </thead>
        <tbody>
          {lines.length > 0 ? (
            lines.map((line, index) => (
              <tr key={`${line.label}-${index}`}>
                <td>{line.label}</td>
                {showAmounts && <td>{formatReceiptAmount(line.amount)}</td>}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showAmounts ? 2 : 1}>Nothing on this receipt.</td>
            </tr>
          )}
          {showAmounts && (
            <tr className="receipt__total">
              <td>Total</td>
              <td>{formatReceiptAmount(receipt.total)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* A handover is signed on both sides: unsigned, this document asserts a
          transfer nobody agreed to. Payment receipts get none — the card
          transaction is the proof. */}
      {signatures.length > 0 && (
        <div className="receipt__signatures">
          {signatures.map((signature) => (
            <div className="receipt__signature" key={signature.caption}>
              <span className="receipt__signature-line" aria-hidden="true" />
              <p className="receipt__signature-caption">{signature.caption}</p>
              {signature.name && (
                <p className="receipt__signature-name">{signature.name}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No QR unless the caller supplied a target — one that scans into a page
          which cannot look anything up is worse than none. */}
      {qrValue && (
        <div className="receipt__qr">
          <QRCode size="sm" value={qrValue} />
          <p className="receipt__qr-hint">
            Scan to view this receipt and its current status
            {isVoid ? ", including this void" : ""}.
          </p>
        </div>
      )}
    </div>
  );
};

ReceiptDocument.propTypes = {
  receipt: PropTypes.shape({
    kind: PropTypes.string,
    title: PropTypes.string,
    company: PropTypes.string,
    status: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    reference: PropTypes.string,
    partyLabel: PropTypes.string,
    payer: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
    }),
    idLabel: PropTypes.string,
    id: PropTypes.string,
    logoUrl: PropTypes.string,
    lines: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        amount: PropTypes.number,
      })
    ),
    total: PropTypes.number,
  }),
  qrValue: PropTypes.string,
};

export default ReceiptDocument;
