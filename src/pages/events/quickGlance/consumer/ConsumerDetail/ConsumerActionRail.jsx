import { useState } from "react";
import { useSelector } from "react-redux";
import SingleEmailNotification from "../../../../../components/notification/email/SingleEmail";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Dropdown from "../../../../../components/UX/dropdown/DropDownComponent";
import "../consumerDetail.css";
import NewTransactionModal from "./actions/transactions/NewTransactionModal";
import ServicesTransaction from "./actions/transactions/ServicesTransaction";

/**
 * The identity card's action rail: everything you can start from this page.
 *
 * Grouped by what the action does to money, because that is the distinction
 * that matters when you are standing at a counter with a queue behind you —
 * first the two ways to hand out gear, then the ways to talk to the consumer.
 * The old header offered four identical blue buttons in a column, so "take a
 * card payment" and "send an email" carried exactly the same weight.
 *
 * All three ways of starting a transaction open the same modal with a different
 * mode; they used to be three separate 130-line components wrapping three
 * separate pairs of Single/Multiple forms.
 */
const PAID_METHODS = [
  { label: "Card deposit", value: "deposit" },
  { label: "Cash", value: "cash" },
];

const ConsumerActionRail = () => {
  const { event } = useSelector((state) => state.event);
  const [transactionMode, setTransactionMode] = useState(null);
  const [openServices, setOpenServices] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);

  const isEventActive = Boolean(event?.active);
  const hasMerchant = Boolean(event?.eventInfoDetail?.merchant);
  const offersServices = Boolean(event?.extraServicesNeeded);

  return (
    <>
      <div className="consumer-rail" data-testid="consumer-actions">
        <div className="consumer-rail__group">
          <BlueButtonComponent
            title="New transaction · no charge"
            size="lg"
            disabled={!isEventActive}
            styles={{ width: "100%" }}
            func={() => setTransactionMode("free")}
          />
          {hasMerchant && (
            <Dropdown
              options={PAID_METHODS}
              onSelect={(option) => setTransactionMode(option.value)}
              placement="bottom-center"
              variant="primary"
              style={{ width: "100%" }}
              renderTrigger={({ onClick, ref }) => (
                <div ref={ref} style={{ display: "block", width: "100%" }}>
                  <GrayButtonComponent
                    title="New transaction · take payment"
                    size="lg"
                    disabled={!isEventActive}
                    styles={{ width: "100%" }}
                    func={onClick}
                  />
                </div>
              )}
            />
          )}
          {offersServices && (
            <GrayButtonComponent
              title="Add a service"
              size="lg"
              disabled={!isEventActive}
              styles={{ width: "100%" }}
              func={() => setOpenServices(true)}
            />
          )}
        </div>

        <div className="consumer-rail__group">
          <GrayButtonComponent
            title="Email this consumer"
            size="lg"
            styles={{ width: "100%" }}
            func={() => setOpenEmail(true)}
          />
          {/* Says why the buttons above are dead, instead of leaving someone
              clicking a greyed-out control looking for the reason. */}
          {!isEventActive && (
            <p className="consumer-rail__note">
              This event is closed. Transactions are read-only.
            </p>
          )}
        </div>
      </div>

      {transactionMode && (
        <NewTransactionModal
          modeKey={transactionMode}
          open={Boolean(transactionMode)}
          setOpen={() => setTransactionMode(null)}
        />
      )}
      {openServices && (
        <ServicesTransaction
          extraServiceNeeded={openServices}
          setExtraServiceNeeded={setOpenServices}
        />
      )}
      {openEmail && (
        <SingleEmailNotification
          customizedEmailNotificationModal={openEmail}
          setCustomizedEmailNotificationModal={setOpenEmail}
        />
      )}
    </>
  );
};

export default ConsumerActionRail;
