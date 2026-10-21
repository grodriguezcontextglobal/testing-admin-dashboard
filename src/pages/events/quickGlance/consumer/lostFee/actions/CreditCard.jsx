import { InputAdornment, OutlinedInput } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { LostDeviceStripeElement } from "../../../../../../components/stripe/elements/LostDeviceStripeElement";
import { ProfileSkeleton } from "../../../../../../components/UX/profile";
import { onAddPaymentIntentSelected } from "../../../../../../store/slices/stripeSlice";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import ReceiptModal from "../../../../../payment/components/ReceiptModal";
import "../../consumerDetail.css";
import { LOST_FEE_METHOD, describeSettleFailure } from "../../utils/lostFee";
import { useLostFeeSettlement } from "../useLostFeeSettlement";
import LostFeeScreen from "../components/LostFeeScreen";

/**
 * Collect a lost-device fee on a card.
 *
 * Two steps, and the screen says which one it is on: name the amount, then take
 * the card. Stripe redirects back to this same URL with `redirect_status` in the
 * query, which is why this branch stays a route rather than a modal.
 *
 * The redirect used to be handled by an `if` in the middle of the render body,
 * guarded by a `useRef` counter, which called an async writer and then navigated
 * away in the same pass — a state update during render, racing its own
 * navigation. Under React 18's double-invoked renders that could fire the
 * write-off twice or navigate before it landed. It is an effect now, and the
 * write-off is awaited before leaving.
 *
 * The amount survives the Stripe round trip in localStorage, as before, but
 * under a scoped key and cleared on the way out — the old code wrote a bare
 * `"total"` and left it set on failure, so the next lost device inherited the
 * previous one's price.
 */
const TOTAL_KEY = "devitrak.lostFee.total";

const CreditCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { customer } = useSelector((state) => state.stripe);
  const { notify, contextHolder } = useStatusNotification();

  const [clientSecret, setClientSecret] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const settledRef = useRef(false);
  const [receipt, setReceipt] = useState(null);

  const { event, device, receiver, fee, poolQuery, settle } = useLostFeeSettlement({
    customer,
  });

  const { handleSubmit, register, watch, formState: { errors } } = useForm({
    defaultValues: { total: fee.amount ? String(fee.amount) : "" },
  });

  const goBack = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigate(`/events/event-attendees/${customer?.uid}/transactions-details`);
  };

  /** Step 1: name the amount and ask Stripe for an intent to collect it. */
  const prepareCard = async (data) => {
    setIsPreparing(true);
    try {
      localStorage.setItem(TOTAL_KEY, data.total);
      const response = await devitrakApi.post(
        "/stripe/create-payment-intent-subscription",
        {
          customerEmail: customer?.email,
          total: Math.round(Number(data.total) * 100),
        }
      );
      setClientSecret(response.data.paymentSubscription.client_secret);
    } catch (error) {
      localStorage.removeItem(TOTAL_KEY);
      notify("error", "Stripe did not accept that amount. Nothing was charged.");
    } finally {
      setIsPreparing(false);
    }
  };

  /** Step 2: Stripe came back. Only now is the device written off. */
  useEffect(() => {
    const status = searchParams.get("redirect_status");
    if (status !== "succeeded" || settledRef.current) return;
    if (!receiver?.id || !device?.serialNumber || poolQuery.isLoading) return;

    settledRef.current = true;
    const amount = localStorage.getItem(TOTAL_KEY) ?? "";

    const run = async () => {
      setIsSettling(true);
      try {
        const outcome = await settle({
          method: LOST_FEE_METHOD.CARD,
          amount,
          // Stripe appends the charge's own intent to the return URL.
          feePaymentIntent: searchParams.get("payment_intent") ?? undefined,
        });
        localStorage.removeItem(TOTAL_KEY);
        notify(
          outcome.mailFailed ? "warning" : "success",
          outcome.mailFailed
            ? `Card fee collected for ${device.serialNumber}. The email did not send — print the receipt.`
            : `Card fee collected for ${device.serialNumber}.`
        );
        setReceipt(outcome.receipt);
      } catch (error) {
        // The card was charged; say exactly what is missing, and do not
        // navigate away from the evidence.
        notify("error", describeSettleFailure(error, { charged: true }));
      } finally {
        setIsSettling(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, receiver?.id, device?.serialNumber, poolQuery.isLoading]);

  if (!device?.serialNumber || !receiver?.id) {
    return (
      <LostFeeScreen
        title="Collect lost device fee · card"
        onCancel={goBack}
        error={{
          title: "No device selected",
          description:
            "Report a device as lost from its transaction to collect the fee.",
        }}
      />
    );
  }

  if (isSettling || receipt) {
    return (
      <>
        {contextHolder}
        {receipt && (
          <ReceiptModal
            openModal={Boolean(receipt)}
            setOpenModal={() => setReceipt(null)}
            receipt={receipt}
            title="Fee collected — print the receipt?"
            onClose={goBack}
          />
        )}
      <LostFeeScreen
        title="Collect lost device fee · card"
        description={
          receipt
            ? "Payment received and recorded."
            : "Payment received. Recording the write-off…"
        }
        device={device}
        amount={watch("total")}
        consumerName={`${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim()}
        eventName={event?.eventInfoDetail?.eventName}
        onCancel={goBack}
      >
        {isSettling && <ProfileSkeleton lines={2} />}
      </LostFeeScreen>
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <form onSubmit={handleSubmit(prepareCard)}>
        <LostFeeScreen
          title="Collect lost device fee · card"
          description={
            clientSecret
              ? "Step 2 of 2 — enter the card details below."
              : "Step 1 of 2 — confirm the amount to charge."
          }
          device={device}
          amount={fee.amount}
          consumerName={`${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim()}
          eventName={event?.eventInfoDetail?.eventName}
          onCancel={goBack}
          footer={
            <>
              <GrayButtonComponent
                title="Cancel"
                buttonType="button"
                func={goBack}
              />
              {!clientSecret && (
                <BlueButtonComponent
                  title="Continue to card details"
                  buttonType="submit"
                  loadingState={isPreparing}
                />
              )}
            </>
          }
        >
          <div className="lost-fee__field">
            <label className="serial-capture__label" htmlFor="lost-fee-card-amount">
              Amount to charge
            </label>
            <OutlinedInput
              id="lost-fee-card-amount"
              style={OutlinedInputStyle}
              // Locked once Stripe holds an intent for this amount, so the field
              // can never disagree with what the card is about to be charged.
              disabled={Boolean(clientSecret)}
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
              aria-invalid={errors.total ? "true" : "false"}
              {...register("total", { required: true })}
            />
            {errors?.total && (
              <p className="serial-capture__error">An amount is required.</p>
            )}
            {!fee.found && !clientSecret && (
              <p className="transaction-panel__hint">
                This device type has no replacement value set on the event, so
                enter the amount manually.
              </p>
            )}
          </div>

          {clientSecret && (
            <LostDeviceStripeElement
              clientSecret={clientSecret}
              total={watch("total")}
              customerStripeId={customer?.uid}
              customer={customer}
            />
          )}
        </LostFeeScreen>
      </form>
    </>
  );
};

export default CreditCard;
