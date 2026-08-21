import { Banknote, CreditCard } from "lucide-react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import "../consumerDetail.css";
import { formatCurrency, resolveLostDeviceFee } from "../utils/lostFee";

/**
 * How the lost-device fee gets collected.
 *
 * Was three buttons in the modal's footer — "Credit Card" and "Cash" both at
 * `width: 60%` plus a "Go back", which adds up to more than the footer and
 * overflowed on every screen. It also passed `onClose` to ModalUX, which reads
 * `closeModal`, so the dialog's own X did nothing.
 *
 * The two methods are comparable choices, so they are comparable cards, and the
 * fee being collected is stated before the choice is made — previously you
 * picked a payment method without being told the amount.
 */
const Choice = ({ openModal, setOpenModal }) => {
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.stripe);
  const { receiverToReplaceObject } = useSelector((state) => state.helper);
  const navigate = useNavigate();

  const hasMerchant = Boolean(event?.eventInfoDetail?.merchant);
  const { amount } = resolveLostDeviceFee(
    event,
    receiverToReplaceObject?.deviceType
  );

  const close = () => setOpenModal(false);
  const go = (method) =>
    navigate(`/events/event-attendees/${customer?.uid}/collect-lost-fee/${method}`);

  return (
    <ModalUX
      title="Collect the lost device fee"
      openDialog={openModal}
      closeModal={close}
      width={560}
      body={
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: "var(--gray-600, #5d615a)",
              textAlign: "left",
            }}
          >
            {receiverToReplaceObject?.serialNumber ? (
              <>
                <strong>{receiverToReplaceObject.serialNumber}</strong> is being
                written off at {formatCurrency(amount)}. Pick how the consumer is
                paying.
              </>
            ) : (
              "Pick how the consumer is paying."
            )}
          </p>

          <div className="method-choice">
            <button
              type="button"
              className="method-card"
              onClick={() => go("cash-method")}
            >
              <span className="method-card__icon">
                <Banknote size={18} />
              </span>
              <span className="method-card__name">Cash</span>
              <span className="method-card__hint">
                Record money taken at the counter.
              </span>
            </button>

            <button
              type="button"
              className="method-card"
              disabled={!hasMerchant}
              onClick={() => go("credit-card-method")}
              title={
                hasMerchant
                  ? undefined
                  : "This event has no merchant account, so cards cannot be charged."
              }
            >
              <span className="method-card__icon">
                <CreditCard size={18} />
              </span>
              <span className="method-card__name">Credit card</span>
              <span className="method-card__hint">
                {hasMerchant
                  ? "Charge the card through Stripe."
                  : "Unavailable — no merchant account on this event."}
              </span>
            </button>
          </div>
        </div>
      }
      footer={[<GrayButtonComponent key="cancel" title="Cancel" func={close} />]}
    />
  );
};

Choice.propTypes = {
  openModal: PropTypes.bool.isRequired,
  setOpenModal: PropTypes.func.isRequired,
};

export default Choice;
