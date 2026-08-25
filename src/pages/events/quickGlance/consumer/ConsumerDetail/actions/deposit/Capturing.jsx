import PropTypes from "prop-types";
import DepositActionModal from "./DepositActionModal";

/**
 * Capturing a deposit. The screen itself is DepositActionModal, which capture
 * and release now share — see the note there for what the two 300-line copies
 * this replaced got wrong.
 *
 * Kept as a named component because the transactions table imports it by name.
 */
const Capturing = ({
  openCapturingDepositModal,
  setOpenCapturingDepositModal,
  refetchingTransactionFn,
}) => (
  <DepositActionModal
    action="capture"
    open={openCapturingDepositModal}
    setOpen={setOpenCapturingDepositModal}
    onSettled={refetchingTransactionFn}
  />
);

Capturing.propTypes = {
  openCapturingDepositModal: PropTypes.bool.isRequired,
  setOpenCapturingDepositModal: PropTypes.func.isRequired,
  refetchingTransactionFn: PropTypes.func,
};

export default Capturing;
