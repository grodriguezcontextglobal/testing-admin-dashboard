import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { useStatusNotification } from "../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import {
  ProfileErrorState,
  ProfileSection,
  ProfileSkeleton,
} from "../../components/UX/profile";
import { onAddDevicesSelectionPaidTransactions } from "../../store/slices/devicesHandleSlice";
import { onAddNewPaymentIntent } from "../../store/slices/stripeSlice";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";
import "../events/quickGlance/consumer/consumerDetail.css";
import {
  confirmationStep,
  isDeclinedIntent,
  markProcessed,
} from "./utils/paymentConfirmation";

/**
 * Where a service charge lands after Stripe redirects back.
 *
 * Rebuilt 2026-10-02 on the same pattern as the card-deposit page
 * (`Confirmation.jsx`), which the 2026-08-21 rework reached and this one did
 * not. What it used to do:
 *
 *  - `catch (error) { return setLoadingStatus(false); }`, and the render showed
 *    "Successfully transaction!" whenever it was not loading — so a failure
 *    was announced as a success.
 *  - The writes ran from a mount effect over a persisted draft that nothing
 *    cleared: reloading the URL sent the invoice email and saved the
 *    transaction again.
 *  - It invalidated only the legacy keys, so the consumer's transaction list
 *    (`consumerEventTransactions`) kept showing the old state.
 *  - "Return to event main page" went to `/events/event-attendees`, a route
 *    that does not exist.
 *  - The invoice email went out before the transaction was saved.
 *
 * The request bodies are unchanged.
 */
const ServicePaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const { deviceSelectionPaidTransaction: draft } = useSelector(
    (state) => state.devicesHandle
  );
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.stripe);

  const paymentIntent = searchParams.get("payment_intent");
  const clientSecret = searchParams.get("payment_intent_client_secret");
  const redirectStatus = searchParams.get("redirect_status");
  const service = draft?.deviceType?.group;

  // Decided once, on arrival: stamping the draft re-renders the page.
  const [arrival] = useState(() =>
    confirmationStep({ paymentIntent, redirectStatus, draft, requireSerials: false })
  );
  const [status, setStatus] = useState("working");
  const startedRef = useRef(false);

  const backToConsumer = () =>
    navigate(`/events/event-attendees/${customer?.uid}/transactions-details`);
  const backToEvent = () => navigate("/events/event-quickglance");

  useEffect(() => {
    if (startedRef.current || arrival !== "run") return;
    startedRef.current = true;

    const run = async () => {
      try {
        const intent = await devitrakApi.get(`/stripe/payment_intents/${paymentIntent}`);
        if (!intent.data) throw new Error("Stripe did not answer for the intent");
        if (isDeclinedIntent(intent.data?.paymentIntent)) {
          setStatus("declined");
          return;
        }
        dispatch(onAddNewPaymentIntent(intent.data));
        // Before the first write: from here on, a reload must not run again.
        dispatch(onAddDevicesSelectionPaidTransactions(markProcessed(draft, paymentIntent)));

        await devitrakApi.post("/stripe/stripe-transaction-admin", {
          paymentIntent,
          clientSecret,
          device: 0,
          provider: event.company,
          eventSelected: event.eventInfoDetail.eventName,
          user: customer.uid ?? customer.id,
          company: user.companyData.id,
          type: "event",
        });

        await devitrakApi.post("/transaction/save-transaction", {
          paymentIntent,
          clientSecret,
          device: [
            {
              deviceNeeded: 0,
              deviceType: draft.deviceType.group,
              deviceValue: draft.deviceType.value,
            },
          ],
          consumerInfo: {
            ...customer,
            uid: customer.uid ?? customer.id,
            id: customer.id ?? customer.uid,
          },
          provider: event.company,
          eventSelected: event.eventInfoDetail.eventName,
          event_id: event.id,
          company: user.companyData.id,
          date: new Date(),
          type: "event",
        });

        // The charge is saved; an email that did not go out is a warning, not
        // a failed payment.
        try {
          const paid = intent.data.paymentIntent;
          await devitrakApi.post("/nodemailer/invoice-notification", {
            email: customer.email,
            amount: String(paid?.amount).slice(0, -2),
            date: Date().toString().slice(4, 33),
            paymentIntent: paid?.id,
            customer: `${customer.name} ${customer.lastName}`,
            service,
          });
        } catch {
          notify("warning", "Service saved, but the invoice email did not send.");
        }

        try {
          await Promise.all([
            clearCacheMemory(
              `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
            ),
            clearCacheMemory(`eventSelected=${event.id}&company=${user.companyData.id}`),
          ]);
        } catch {
          // The invalidations below still refresh this session's lists.
        }
        queryClient.invalidateQueries({ queryKey: ["consumerEventTransactions"] });
        queryClient.invalidateQueries({ queryKey: ["transactionPerConsumerListQuery"] });
        queryClient.invalidateQueries({ queryKey: ["transactionsList"] });

        setStatus("done");
      } catch {
        setStatus("failed");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival, paymentIntent]);

  const shell = (children) => (
    <div style={{ padding: "16px 24px 24px", maxWidth: "760px", margin: "0 auto" }}>
      {contextHolder}
      <ProfileSection title="Service payment" testId="service-payment-confirmation">
        <div style={{ padding: "4px 20px 20px" }}>{children}</div>
      </ProfileSection>
    </div>
  );

  const reference = paymentIntent ? ` Stripe reference: ${paymentIntent}.` : "";
  const backAction = (
    <GrayButtonComponent title="Back to the consumer" func={backToConsumer} />
  );

  if (arrival === "declined" || status === "declined") {
    return shell(
      <ProfileErrorState
        title="The card was not charged"
        description={`Stripe did not authorize this payment, so nothing was saved.${reference} Start the service charge again from the consumer's page.`}
        action={backAction}
      />
    );
  }

  if (arrival === "already-processed") {
    return shell(
      <ProfileErrorState
        title="This payment was already processed"
        description={`It was not saved a second time.${reference} The transaction is on the consumer's page.`}
        action={<BlueButtonComponent title="Back to the consumer" func={backToConsumer} />}
      />
    );
  }

  if (arrival === "missing") {
    return shell(
      <ProfileErrorState
        title="Nothing to confirm"
        description={`This page finishes a service charge started from a consumer's page. The details are no longer in this session, so nothing was saved.${reference}`}
        action={backAction}
      />
    );
  }

  if (status === "working") {
    return shell(
      <>
        <p className="txn__intro">
          Confirming the payment for {service}. Do not close this page.
        </p>
        <ProfileSkeleton lines={3} />
      </>
    );
  }

  if (status === "failed") {
    return shell(
      <ProfileErrorState
        title="The payment may have gone through, but it was not saved"
        description={`Check the consumer's transactions before charging again.${reference} Report this reference if the charge does not appear.`}
        action={backAction}
      />
    );
  }

  return shell(
    <div className="txn">
      <p
        className="scan__feedback scan__feedback--ok"
        style={{ fontSize: "15px", fontWeight: 600 }}
      >
        <CheckCircle2 size={18} style={{ flex: "none" }} />
        Payment received and saved
      </p>

      <dl className="txn__summary">
        <div>
          <dt>Transaction</dt>
          <dd className="profile-serial">{paymentIntent}</dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd style={{ textTransform: "capitalize" }}>{service}</dd>
        </div>
      </dl>

      <div className="txn__footer">
        <GrayButtonComponent title="Back to the event" func={backToEvent} />
        <BlueButtonComponent title="Back to the consumer" func={backToConsumer} />
      </div>
    </div>
  );
};

export default ServicePaymentConfirmation;
