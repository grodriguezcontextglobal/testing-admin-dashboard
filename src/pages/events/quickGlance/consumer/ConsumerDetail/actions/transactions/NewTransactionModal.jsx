import { InputAdornment, OutlinedInput } from "@mui/material";
import PropTypes from "prop-types";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../../../components/UX/modal/ModalUX";
import {
  ProfileErrorState,
  ProfileSkeleton,
} from "../../../../../../../components/UX/profile";
import { StripeCheckoutElement } from "../../../../../../../components/stripe/elements/StripeCheckoutElement";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import { formatCurrency } from "../../../utils/lostFee";
import "../../../consumerDetail.css";
import DeviceTypePicker from "./components/DeviceTypePicker";
import SerialScanner from "./components/SerialScanner";
import { resolveMode } from "./modes";
import useCreateTransaction from "./useCreateTransaction";

/**
 * Start a transaction — no charge, cash, or card deposit.
 *
 * One modal replaces four (AuthorizedTransaction, CashTransaction,
 * FreeTransaction, ChargedTransaction) plus their eight Single/Multiple option
 * components. Those had a Single-vs-Multiple toggle built from two buttons with
 * `textDecoration: underline` faking a tab bar, and the two branches were
 * separate 250–390 line components that differed mainly in whether they read
 * `quantity` — so the same screen existed twice with two different range
 * calculations, one of which produced `RRRRRNaN`.
 *
 * There is no Single/Multiple switch now: quantity is a number, and one device
 * is just quantity 1. The steps are numbered because they genuinely depend on
 * each other — you cannot scan a serial before choosing what kind of device you
 * are looking for, and the old screens let you try.
 */
const Step = ({ index, title, note, done, blocked, children }) => (
  <section
    className={`txn__step${done ? " txn__step--done" : ""}${
      blocked ? " txn__step--blocked" : ""
    }`}
    aria-disabled={blocked || undefined}
  >
    <div className="txn__step-head">
      <span className="txn__step-index">{index}</span>
      <h3 className="txn__step-title">{title}</h3>
      {note && <p className="txn__step-note">{note}</p>}
    </div>
    {children}
  </section>
);

Step.propTypes = {
  index: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  note: PropTypes.node,
  done: PropTypes.bool,
  blocked: PropTypes.bool,
  children: PropTypes.node,
};

const NewTransactionModal = ({ modeKey, open, setOpen }) => {
  const mode = resolveMode(modeKey);
  const close = () => setOpen(false);
  const txn = useCreateTransaction({ mode, onDone: close });

  const quantityNumber = Number(txn.quantity);
  const hasGroup = Boolean(txn.group);
  const scannedAll =
    Number.isFinite(quantityNumber) &&
    quantityNumber > 0 &&
    txn.serials.length === quantityNumber;

  const body = () => {
    if (txn.isLoadingPool) return <ProfileSkeleton lines={4} />;

    if (txn.isPoolError) {
      return (
        <ProfileErrorState
          title="Couldn't load this event's inventory"
          description="Without the device pool a transaction cannot be checked against what is actually free. Nothing was created."
          action={<GrayButtonComponent title="Try again" func={txn.retryPool} />}
        />
      );
    }

    if (txn.options.length === 0) {
      return (
        <ProfileErrorState
          title="No consumer devices on this event"
          description="No device group on this event is marked as available to consumers, so there is nothing to hand over."
        />
      );
    }

    // Card deposit, second half: Stripe owns the screen from here.
    if (txn.clientSecret) {
      return (
        <div className="txn">
          <p className="txn__intro">
            {formatCurrency(txn.amount)} will be held on the consumer&apos;s card
            for {txn.serials.length} {txn.group}
            {txn.serials.length === 1 ? "" : "s"}. The devices are assigned once
            the card clears.
          </p>
          <StripeCheckoutElement
            clientSecret={txn.clientSecret}
            total={txn.amount}
          />
          <div className="txn__footer">
            <GrayButtonComponent title="Cancel" func={close} />
          </div>
        </div>
      );
    }

    return (
      <div className="txn">
        <p className="txn__intro">{mode.intro}</p>

        <Step
          index={1}
          title="What is the consumer taking?"
          done={hasGroup}
          note={
            hasGroup ? `${txn.availableSerials.length} free` : undefined
          }
        >
          <div className="txn__row">
            <DeviceTypePicker
              options={txn.options}
              value={txn.group}
              onChange={txn.chooseGroup}
              availableSerials={txn.availableSerials}
            />
            <div className="txn__col txn__col--narrow">
              <label className="txn__label" htmlFor="txn-quantity">
                How many
              </label>
              <OutlinedInput
                id="txn-quantity"
                type="number"
                size="small"
                inputProps={{ min: 1, max: txn.availableSerials.length || 1 }}
                value={txn.quantity}
                onChange={(event) => txn.changeQuantity(event.target.value)}
                style={OutlinedInputStyle}
              />
            </div>
          </div>
        </Step>

        <Step
          index={2}
          title="Scan the devices"
          blocked={!hasGroup}
          done={scannedAll}
          note={
            hasGroup
              ? `${txn.serials.length} of ${
                  Number.isFinite(quantityNumber) && quantityNumber > 0
                    ? quantityNumber
                    : "?"
                } scanned`
              : "Choose a device type first"
          }
        >
          <SerialScanner
            pool={txn.pool}
            group={txn.group}
            quantity={txn.quantity}
            picked={txn.serials}
            onChange={txn.setSerials}
            disabled={!hasGroup}
          />
        </Step>

        {mode.requiresAmount && (
          <Step index={3} title={mode.amountLabel} done={Number(txn.amount) > 0}>
            <div className="txn__row">
              <div className="txn__col txn__col--narrow">
                <OutlinedInput
                  id="txn-amount"
                  size="small"
                  inputMode="decimal"
                  placeholder="e.g. 150"
                  value={txn.amount}
                  onChange={(event) => txn.setAmount(event.target.value)}
                  style={OutlinedInputStyle}
                  startAdornment={
                    <InputAdornment position="start">$</InputAdornment>
                  }
                />
              </div>
              {mode.amountHint && (
                <p className="transaction-panel__hint" style={{ flex: "1 1 220px" }}>
                  {mode.amountHint}
                </p>
              )}
            </div>
          </Step>
        )}

        {/* What is about to be written, before the button that writes it. */}
        {hasGroup && txn.serials.length > 0 && (
          <dl className="txn__summary">
            <div>
              <dt>Device</dt>
              <dd style={{ textTransform: "capitalize" }}>{txn.group}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{txn.serials.length}</dd>
            </div>
            <div>
              <dt>Serials</dt>
              <dd className="profile-serial">{txn.serials.join(", ")}</dd>
            </div>
            {mode.requiresAmount && (
              <div>
                <dt>{mode.key === "cash" ? "Cash" : "Deposit"}</dt>
                <dd>{formatCurrency(txn.amount)}</dd>
              </div>
            )}
          </dl>
        )}

        {txn.problems.length > 0 && (
          <ul className="txn__problems" role="alert">
            {txn.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}

        <div className="txn__footer">
          <GrayButtonComponent title="Cancel" func={close} />
          <BlueButtonComponent
            title={mode.submitLabel}
            loadingState={txn.isSaving}
            func={txn.submit}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {txn.contextHolder}
      <ModalUX
        title={mode.title}
        openDialog={open}
        closeModal={close}
        width={760}
        footer={[]}
        modalStyles={{ top: "4dvh", zIndex: 30 }}
        body={body()}
      />
    </>
  );
};

NewTransactionModal.propTypes = {
  modeKey: PropTypes.oneOf(["free", "cash", "deposit"]).isRequired,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default NewTransactionModal;
