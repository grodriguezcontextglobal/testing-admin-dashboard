import PropTypes from "prop-types";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import ReceiptDocument from "./ReceiptDocument";

/**
 * Shows a receipt and hands it to the printer.
 *
 * Takes the mapped receipt view model, so the same modal serves a payment
 * receipt (mapTransactionToReceipt) and a device handover slip
 * (mapAssignmentToReceipt).
 *
 * Printing is plain window.print() against the print rules in receipt.css
 * rather than a PDF library — the document is a handful of rows, and every
 * browser already has a print-to-PDF path.
 *
 * @param {object} receipt mapped receipt view model
 * @param {string} [qrValue] URL for the QR; omit to print without one
 * @param {Function} [onClose] extra teardown on close (e.g. navigation)
 */
const ReceiptModal = ({
  openModal,
  setOpenModal,
  receipt,
  qrValue,
  title = "Receipt",
  onClose,
}) => {
  const closeModal = () => {
    setOpenModal(false);
    onClose?.();
  };

  const body = (
    <div style={{ backgroundColor: "#ffffff", padding: "8px" }}>
      <ReceiptDocument receipt={receipt} qrValue={qrValue} />
      <div
        className="receipt__no-print"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "16px",
        }}
      >
        <GrayButtonComponent title={"Close"} func={closeModal} />
        <BlueButtonComponent title={"Print receipt"} func={() => window.print()} />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={title}
      openDialog={openModal}
      closeModal={closeModal}
      body={body}
      width={560}
      footer={[]}
    />
  );
};

ReceiptModal.propTypes = {
  openModal: PropTypes.bool,
  setOpenModal: PropTypes.func.isRequired,
  receipt: PropTypes.object,
  qrValue: PropTypes.string,
  title: PropTypes.string,
  onClose: PropTypes.func,
};

export default ReceiptModal;
