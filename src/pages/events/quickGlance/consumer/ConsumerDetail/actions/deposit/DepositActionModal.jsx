import { InputAdornment, OutlinedInput } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../../../components/UX/modal/ModalUX";
import {
  ProfileErrorState,
  ProfileSkeleton,
  StatusChip,
} from "../../../../../../../components/UX/profile";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import "../../../consumerDetail.css";
import {
  centsToAmount,
  clampCaptureAmount,
  describeDepositState,
  formatCents,
} from "../../../utils/depositAmount";

/**
 * Capture or release a card deposit.
 *
 * Capturing.jsx and Releasing.jsx were 295 and 308 lines that differed in three
 * places: the endpoint, the button label, and whether the amount was editable.
 * Everything else — the query pair, the status handling, the transaction and
 * receiver deactivation, the notification email — was duplicated, and both
 * copies carried the same defects:
 *
 *  - `String(maxAmount).slice(0, -2)` to turn cents into dollars. Correct only
 *    for amounts of $1 or more: $0.50 displayed as "$0", and an unread amount
 *    displayed as "undefin".
 *  - Both queries keyed on the bare strings ["oneStripeTransaction"] and
 *    ["transaction"] with no payment intent in the key, so opening the modal on
 *    a second transaction served the first one's cached amount and status. You
 *    could capture deposit B while reading deposit A's figure.
 *  - Status checked inline against two literals, with `alert()` called from
 *    inside an effect. Any other Stripe status left the submit button live.
 *  - `list.forEach(async (r) => { await patch(...) })` — the receiver updates
 *    were never awaited, so the success notification fired before they ran and
 *    a failure was invisible.
 *  - Capturing put its whole render inside `if (query.data)`, returning
 *    `undefined` while loading (no modal at all), and called `setValue` during
 *    render on every pass.
 *  - Releasing had no error branch: `if (resp.data.ok)` with no `else`, so a
 *    refused release did nothing and said nothing.
 */
const ACTIONS = {
  capture: {
    verb: "Capture",
    title: "Capture deposit",
    endpoint: (id) => `/stripe/payment-intents/${id}/capture`,
    email: "/nodemailer/deposit-collected-notification",
    editableAmount: true,
    consequence:
      "The consumer's card is charged the amount below and this cannot be reversed. Capture only what the event is owed.",
    success: "Deposit captured.",
    failure: "The deposit was not captured. Nothing was charged.",
  },
  release: {
    verb: "Release",
    title: "Release deposit",
    endpoint: (id) => `/stripe/payment-intents/${id}/cancel`,
    email: "/nodemailer/deposit-return-notification",
    editableAmount: false,
    consequence:
      "The hold is dropped in full and this cannot be reversed. The consumer may take 7–10 business days to see it leave their statement.",
    success: "Deposit released.",
    failure: "The deposit was not released. The hold is still in place.",
  },
};

const DepositActionModal = ({ action, open, setOpen, onSettled }) => {
  const config = ACTIONS[action];
  const { paymentIntentDetailSelected, customer } = useSelector(
    (state) => state.stripe
  );
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const paymentIntent = paymentIntentDetailSelected?.paymentIntent;
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [problem, setProblem] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const close = () => setOpen(false);

  // Keyed on the payment intent, so each deposit gets its own cache entry.
  const intentQuery = useQuery({
    queryKey: ["stripePaymentIntent", paymentIntent],
    queryFn: () => devitrakApi.get(`/stripe/payment_intents/${paymentIntent}`),
    enabled: Boolean(paymentIntent),
  });

  const transactionQuery = useQuery({
    queryKey: ["transactionByIntent", paymentIntent],
    queryFn: () =>
      devitrakApi.get(
        `/transaction/transaction?paymentIntent=${paymentIntent}&active=true`
      ),
    enabled: Boolean(paymentIntent),
  });

  const intent = intentQuery.data?.data?.paymentIntent;
  const heldCents = intent?.amount;
  const deposit = describeDepositState(intent?.status);
  const permitted = action === "capture" ? deposit.canCapture : deposit.canRelease;

  // The field starts at the full hold and stays wherever the operator puts it.
  // The old screen wrote the default in with a `setValue` called during render.
  const effectiveAmount = amountTouched
    ? amount
    : heldCents === undefined
    ? ""
    : String(centsToAmount(heldCents));

  const deactivateTransactionAndReceivers = async () => {
    const transaction = transactionQuery.data?.data?.list?.at(-1);
    if (transaction?.id) {
      await devitrakApi.patch(`/transaction/update-transaction/${transaction.id}`, {
        active: false,
        id: transaction.id,
      });
    }

    const response = await devitrakApi.post("/receiver/receiver-assigned-list", {
      paymentIntent,
    });
    // Read both shapes: this endpoint is consumed as `listOfReceivers`
    // everywhere else in the app, while these two screens read `list`.
    const receivers =
      response.data?.listOfReceivers ?? response.data?.list ?? [];

    // Awaited, unlike the original forEach(async …), so a failure here is a
    // failure of the whole action rather than a silent one.
    await Promise.all(
      receivers
        .filter((receiver) => receiver?.id)
        .map((receiver) =>
          devitrakApi.patch(`/receiver/receiver-update/${receiver.id}`, {
            active: false,
          })
        )
    );
  };

  const run = async () => {
    setProblem(null);

    let payload = { id: paymentIntent };
    let emailAmount = formatCents(heldCents);

    if (config.editableAmount) {
      const check = clampCaptureAmount(effectiveAmount, heldCents);
      if (!check.ok) return setProblem(check.message);
      payload = { ...payload, amount_to_capture: check.amount };
      emailAmount = check.amount;
    }

    setIsRunning(true);
    try {
      const response = await devitrakApi.post(config.endpoint(paymentIntent), payload);
      if (!response.data?.ok) throw new Error("Stripe refused the request");

      await deactivateTransactionAndReceivers();

      const stamp = new Date().toString().split(" ");
      await devitrakApi.post(config.email, {
        consumer: {
          name: `${customer?.name}, ${customer?.lastName}`,
          email: customer?.email,
        },
        message: { paymentIntent, amount: emailAmount },
        amount: emailAmount,
        event: event?.eventInfoDetail?.eventName,
        transaction: paymentIntent,
        date: String(stamp.slice(0, 4)).replaceAll(",", " "),
        time: stamp[4],
        company: event?.company,
        link: `https://app.devitrak.net/authentication/${event?.id}/${user?.companyData?.id}/${customer?.uid}`,
      });

      queryClient.invalidateQueries({ queryKey: ["stripePaymentIntent", paymentIntent] });
      queryClient.invalidateQueries({ queryKey: ["consumerEventTransactions"] });
      onSettled?.();
      notify("success", config.success);
      close();
    } catch (error) {
      setProblem(config.failure);
      notify("error", config.failure);
    } finally {
      setIsRunning(false);
    }
  };

  const body = () => {
    if (!paymentIntent) {
      return (
        <ProfileErrorState
          title="No transaction selected"
          description="Open this from a transaction row so the deposit can be identified."
        />
      );
    }

    if (intentQuery.isLoading) return <ProfileSkeleton lines={3} />;

    if (intentQuery.isError) {
      return (
        <ProfileErrorState
          title="Couldn't read this deposit"
          description="Stripe did not respond, so the deposit's state is unknown. Nothing was changed."
          action={
            <GrayButtonComponent title="Try again" func={() => intentQuery.refetch()} />
          }
        />
      );
    }

    return (
      <div className="deposit">
        <dl className="deposit__facts">
          <div>
            <dt>Transaction</dt>
            <dd className="profile-serial">{paymentIntent}</dd>
          </div>
          <div>
            <dt>Amount held</dt>
            <dd className="deposit__amount">{formatCents(heldCents)}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>
              <StatusChip tone={deposit.tone} pip label={deposit.label} />
            </dd>
          </div>
        </dl>

        {/* Nothing to do, and the reason why — instead of an alert() fired from
            an effect and a button left enabled. */}
        {!permitted ? (
          <p className="deposit__blocked">{deposit.reason}</p>
        ) : (
          <>
            {config.editableAmount && (
              <div className="deposit__field">
                <label className="txn__label" htmlFor="deposit-amount">
                  Amount to capture
                </label>
                <OutlinedInput
                  id="deposit-amount"
                  size="small"
                  inputMode="decimal"
                  value={effectiveAmount}
                  onChange={(changeEvent) => {
                    setAmountTouched(true);
                    setAmount(changeEvent.target.value);
                    setProblem(null);
                  }}
                  style={OutlinedInputStyle}
                  startAdornment={<InputAdornment position="start">$</InputAdornment>}
                />
                <p className="transaction-panel__hint">
                  Up to {formatCents(heldCents)}. Enter less to capture part of
                  the hold and release the rest.
                </p>
              </div>
            )}
            <p className="deposit__consequence">{config.consequence}</p>
          </>
        )}

        {problem && (
          <ul className="txn__problems" role="alert">
            <li>{problem}</li>
          </ul>
        )}

        <div className="txn__footer">
          <GrayButtonComponent title="Close" func={close} />
          {permitted &&
            (action === "capture" ? (
              <BlueButtonComponent
                title={`Capture ${
                  config.editableAmount && effectiveAmount
                    ? `$${effectiveAmount}`
                    : ""
                }`.trim()}
                loadingState={isRunning}
                func={run}
              />
            ) : (
              <DangerButtonComponent
                title="Release deposit"
                loadingState={isRunning}
                func={run}
              />
            ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        title={config.title}
        openDialog={open}
        closeModal={close}
        width={560}
        footer={[]}
        modalStyles={{ zIndex: 30 }}
        body={body()}
      />
    </>
  );
};

DepositActionModal.propTypes = {
  action: PropTypes.oneOf(["capture", "release"]).isRequired,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  onSettled: PropTypes.func,
};

DepositActionModal.defaultProps = {
  onSettled: undefined,
};

export default DepositActionModal;
