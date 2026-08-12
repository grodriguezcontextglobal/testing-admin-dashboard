import PropTypes from "prop-types";
import { QRCode } from "../../../components/shared-assets/qr-code";
import {
  RECEIPT_STATUS,
  buildReceiptUrl,
  formatReceiptAmount,
  formatReceiptDate,
  mapTransactionToReceipt,
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
};

/**
 * The receipt itself: rendered in a modal for printing, and by ReceiptPage when
 * someone scans the QR.
 *
 * Both surfaces render this same component on purpose. If the printed copy and
 * the scanned page were built separately they would drift, and the point of the
 * QR is that the scan shows the CURRENT state of the same transaction the paper
 * describes — including a void applied after printing.
 *
 * @param {object} transaction raw transaction document
 * @param {boolean} [showQr] hide it on the scanned page, where it is redundant
 * @param {string} [origin] overrides window.location.origin (tests, SSR)
 */
const ReceiptDocument = ({ transaction, showQr = true, origin }) => {
  const receipt = mapTransactionToReceipt(transaction);
  const band = BAND[receipt.status] ?? BAND[RECEIPT_STATUS.UNKNOWN];
  const isVoid = receipt.status === RECEIPT_STATUS.VOID;

  const resolvedOrigin =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const qrValue = buildReceiptUrl(resolvedOrigin, receipt.paymentIntent);

  return (
    <div className="receipt" data-testid="receipt-document">
      {isVoid && (
        <div className="receipt__watermark" aria-hidden="true">
          Void
        </div>
      )}

      <div className="receipt__head">
        <div>
          <p className="receipt__company">{receipt.company || "Receipt"}</p>
          <p className="receipt__title">Transaction receipt</p>
        </div>
      </div>

      {/* Status is text, not just colour — this is the line a screen reader and
          a black-and-white printout both have to carry. */}
      <div className={`receipt__band ${band.className}`} role="status">
        {band.label}
      </div>

      <dl className="receipt__meta">
        <dt>Date</dt>
        <dd>{formatReceiptDate(receipt.date)}</dd>
        <dt>Reference</dt>
        <dd>{receipt.reference || "—"}</dd>
        <dt>Billed to</dt>
        <dd>{receipt.payer.name || "—"}</dd>
        {receipt.payer.email && (
          <>
            <dt>Email</dt>
            <dd>{receipt.payer.email}</dd>
          </>
        )}
        <dt>Transaction ID</dt>
        <dd>{receipt.paymentIntent || "—"}</dd>
      </dl>

      <table className="receipt__lines">
        <thead>
          <tr>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.length > 0 ? (
            receipt.lines.map((line, index) => (
              <tr key={`${line.label}-${index}`}>
                <td>{line.label}</td>
                <td>{formatReceiptAmount(line.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No items on this transaction.</td>
            </tr>
          )}
          <tr className="receipt__total">
            <td>Total</td>
            <td>{formatReceiptAmount(receipt.total)}</td>
          </tr>
        </tbody>
      </table>

      {/* No QR when there is no identifier to encode — it would scan into a
          page that cannot look anything up. */}
      {showQr && qrValue && (
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
  transaction: PropTypes.shape({
    paymentIntent: PropTypes.string,
    active: PropTypes.bool,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    provider: PropTypes.string,
    eventSelected: PropTypes.string,
    consumerInfo: PropTypes.object,
    device: PropTypes.array,
  }),
  showQr: PropTypes.bool,
  origin: PropTypes.string,
};

export default ReceiptDocument;
