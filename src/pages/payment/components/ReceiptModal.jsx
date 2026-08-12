import PropTypes from "prop-types";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import ReceiptDocument from "./ReceiptDocument";

/**
 * Shows a transaction's receipt with a QR on it and hands it to the printer.
 *
 * The QR encodes the receipt page for this same transaction, so a paper copy
 * stays useful after it leaves the desk: scanning it shows the current status,
 * which is how a void applied later becomes visible to whoever is holding the
 * printout.
 *
 * Printing is plain window.print() against the print rules in receipt.css
 * rather than a PDF library — the document is a handful of rows, and every
 * browser already has a print-to-PDF path.
 */
const ReceiptModal = ({ openModal, setOpenModal, transaction }) => {
  const closeModal = () => setOpenModal(false);

  const body = (
    <div style={{ backgroundColor: "#ffffff", padding: "8px" }}>
      <ReceiptDocument transaction={transaction} />
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
      title={"Receipt"}
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
  transaction: PropTypes.object,
};

export default ReceiptModal;
