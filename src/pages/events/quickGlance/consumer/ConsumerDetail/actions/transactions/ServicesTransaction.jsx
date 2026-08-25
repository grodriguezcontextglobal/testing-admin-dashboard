import { InputAdornment, OutlinedInput } from "@mui/material";
import { Select } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import Chip from "../../../../../../../components/UX/Chip/Chip";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../../../components/UX/buttons/LigthBlueButton";
import ModalUX from "../../../../../../../components/UX/modal/ModalUX";
import { ProfileErrorState } from "../../../../../../../components/UX/profile";
import StripeElementServicesTransaction from "../../../../../../../components/stripe/elements/StripeElementServicesTransaction";
import { AntSelectorStyle } from "../../../../../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import { onAddDevicesSelectionPaidTransactions } from "../../../../../../../store/slices/devicesHandleSlice";
import "../../../consumerDetail.css";
import { formatCurrency } from "../../../utils/lostFee";
import {
  addServiceLine,
  cartTotal,
  removeServiceLine,
  validateServiceLine,
} from "../../../utils/servicesCart";

/**
 * Charge a consumer for extra services (rigging, delivery, and whatever else the
 * event sells that is not a device).
 *
 * This keeps its own shape — a cart of service lines rather than a scan of
 * serial numbers — so it is deliberately not folded into NewTransactionModal.
 * What changed is the arithmetic and the failure handling, which had the same
 * defects as the device screens:
 *
 *  - The total was `price * quantity` on raw strings, so a typo rendered
 *    "Total to be charged: $NaN", and because the guard was `total > 0` (and
 *    `NaN > 0` is false) the charge button silently vanished instead.
 *  - `catch (error) { return null; }` around the Stripe call: a refused payment
 *    intent left the modal exactly as it was, with no indication of why.
 *  - `clientSecret` started as `null` and was compared against both `null` and
 *    `""` in different places, so the first divider was permanently hidden
 *    (`null !== ""`) and `<StripeElementServicesTransaction>` was mounted from
 *    the first render with a null secret, surviving only on its own internal
 *    guard. One sentinel now: the empty string.
 *  - Nothing validated the quantity, so "2 units" and "two units" were equally
 *    acceptable inputs.
 */
const ServicesTransaction = ({ extraServiceNeeded, setExtraServiceNeeded }) => {
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const { notify, contextHolder } = useStatusNotification();

  const [service, setService] = useState(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cart, setCart] = useState([]);
  const [problems, setProblems] = useState([]);
  const [clientSecret, setClientSecret] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);

  const close = () => setExtraServiceNeeded(false);
  const total = cartTotal(cart);

  const services = Array.isArray(event?.extraServices) ? event.extraServices : [];

  // Only staff on the event, or company employees, may override a listed price.
  const canEditPrice = Boolean(
    event?.staff?.adminUser?.some((member) => member.email === user?.email) ||
      user?.companyData?.employees?.some((member) => member.email === user?.email)
  );

  const chooseService = (name) => {
    setService(name);
    const listed = services.find((entry) => entry.service === name);
    setPrice(listed?.deposit != null ? String(listed.deposit) : "");
    setProblems([]);
  };

  const addLine = () => {
    const validation = validateServiceLine({ service, price, quantity });
    setProblems(validation.problems);
    if (!validation.ok) return;

    setCart((current) => addServiceLine(current, { service, price, quantity }));
    setQuantity("");
  };

  const takePayment = async () => {
    setProblems([]);
    setIsPreparing(true);
    try {
      const response = await devitrakApi.post(
        "/stripe/create-payment-intent-subscription",
        { customerEmail: customer?.email, total: Math.round(total * 100) }
      );
      const secret = response.data?.paymentSubscription?.client_secret;
      if (!secret) throw new Error("Stripe returned no client secret");

      dispatch(
        onAddDevicesSelectionPaidTransactions({
          deviceType: {
            group: cart.map((line) => line.service).join(" | "),
            value: total,
          },
        })
      );
      setClientSecret(secret);
    } catch (error) {
      // Was a silent `return null`.
      setProblems([
        "Stripe did not accept this charge. Nothing was charged — check the amount and try again.",
      ]);
      notify("error", "The charge could not be prepared.");
    } finally {
      setIsPreparing(false);
    }
  };

  const body = () => {
    if (services.length === 0) {
      return (
        <ProfileErrorState
          title="No services on this event"
          description="This event has no extra services configured, so there is nothing to charge for."
        />
      );
    }

    if (clientSecret) {
      return (
        <div className="txn">
          <p className="txn__intro">
            {formatCurrency(total)} for {cart.length} service
            {cart.length === 1 ? "" : "s"}. Enter the card details below.
          </p>
          <StripeElementServicesTransaction
            clientSecret={clientSecret}
            total={total}
          />
          <div className="txn__footer">
            <GrayButtonComponent title="Cancel" func={close} />
          </div>
        </div>
      );
    }

    return (
      <div className="txn">
        <p className="txn__intro">
          Add each service being charged, then take the payment in one go.
        </p>

        <div className="txn__row">
          <div className="txn__col">
            <label className="txn__label" htmlFor="service-name">
              Service
            </label>
            <Select
              id="service-name"
              showSearch
              value={service ?? undefined}
              onChange={chooseService}
              placeholder="Choose a service"
              style={{ ...AntSelectorStyle, width: "100%" }}
              options={services.map((entry) => ({
                label: entry.service,
                value: entry.service,
              }))}
            />
          </div>
          <div className="txn__col txn__col--narrow">
            <label className="txn__label" htmlFor="service-price">
              Price each
            </label>
            <OutlinedInput
              id="service-price"
              size="small"
              inputMode="decimal"
              value={price}
              readOnly={!canEditPrice}
              onChange={(changeEvent) => setPrice(changeEvent.target.value)}
              style={OutlinedInputStyle}
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
            />
            {!canEditPrice && (
              <p className="transaction-panel__hint">Set by the event.</p>
            )}
          </div>
          <div className="txn__col txn__col--narrow">
            <label className="txn__label" htmlFor="service-quantity">
              Quantity
            </label>
            <OutlinedInput
              id="service-quantity"
              type="number"
              size="small"
              inputProps={{ min: 1 }}
              value={quantity}
              onChange={(changeEvent) => setQuantity(changeEvent.target.value)}
              style={OutlinedInputStyle}
            />
          </div>
          <LightBlueButtonComponent title="Add service" func={addLine} />
        </div>

        {cart.length > 0 && (
          <>
            <div className="scan__picked">
              {cart.map((line) => (
                <Chip
                  key={line.key}
                  label={`${line.service} · ${line.quantity} × ${formatCurrency(
                    line.price
                  )} = ${formatCurrency(line.total)}`}
                  variant="filled"
                  color="primary"
                  onDelete={() => setCart(removeServiceLine(cart, line.key))}
                />
              ))}
            </div>
            <dl className="txn__summary">
              <div>
                <dt>Services</dt>
                <dd>{cart.length}</dd>
              </div>
              <div>
                <dt>Total to charge</dt>
                <dd>{formatCurrency(total)}</dd>
              </div>
            </dl>
          </>
        )}

        {problems.length > 0 && (
          <ul className="txn__problems" role="alert">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}

        <div className="txn__footer">
          <GrayButtonComponent title="Cancel" func={close} />
          <BlueButtonComponent
            title={
              total > 0
                ? `Take payment · ${formatCurrency(total)}`
                : "Take payment"
            }
            disabled={total <= 0}
            loadingState={isPreparing}
            func={takePayment}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        title="Charge extra services"
        openDialog={extraServiceNeeded}
        closeModal={close}
        width={760}
        footer={[]}
        modalStyles={{ top: "6dvh", zIndex: 30 }}
        body={body()}
      />
    </>
  );
};

ServicesTransaction.propTypes = {
  extraServiceNeeded: PropTypes.bool.isRequired,
  setExtraServiceNeeded: PropTypes.func.isRequired,
};

export default ServicesTransaction;
