import PropTypes from "prop-types";
import DepositActionModal from "./DepositActionModal";

/**
 * Releasing a deposit. The screen itself is DepositActionModal, which capture
 * and release now share — see the note there for what the two 300-line copies
 * this replaced got wrong.
 *
 * Kept as a named component because the transactions table imports it by name.
 */
const Releasing = ({
  openCancelingDepositModal,
  setOpenCancelingDepositModal,
  refetchingTransactionFn,
}) => (
  <DepositActionModal
    action="release"
    open={openCancelingDepositModal}
    setOpen={setOpenCancelingDepositModal}
    onSettled={refetchingTransactionFn}
  />
);

Releasing.propTypes = {
  openCancelingDepositModal: PropTypes.bool.isRequired,
  setOpenCancelingDepositModal: PropTypes.func.isRequired,
  refetchingTransactionFn: PropTypes.func,
};

export default Releasing;
