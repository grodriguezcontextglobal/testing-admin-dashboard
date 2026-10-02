import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import DeviceAssigned from "../../classes/deviceAssigned";
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
  draftSerials,
  isDeclinedIntent,
  markProcessed,
} from "./utils/paymentConfirmation";

/**
 * Where a card deposit lands after Stripe redirects back.
 *
 * This page finishes the deposit transaction: it confirms the intent, saves the
 * transaction, and assigns the devices. It was rewritten because every one of
 * those steps could fail while the page reported success.
 *
 * What it used to do:
 *
 *  - `if (triggerStatus) confirmPaymentIntent();` in the render body — a fetch
 *    and a cascade of writes fired from render, guarded only by a state flag,
 *    which React 18's double-invoked renders can run twice.
 *  - For a multi-device deposit it re-derived the devices by index:
 *    `usedDevices.findIndex(el => el.device === startingNumber)` then
 *    `slice(i, i + qty)` over the *whole* pool — not filtered to the requested
 *    device type — and wrote `deviceType: copiedData[0].type`, the type of
 *    whatever device happened to be first in the pool. A tablet request could be
 *    saved as a headset.
 *  - That block was wrapped in `if (deviceFound > -1)` with no `else`, and the
 *    success notification sat *outside* it. A starting serial that was not found
 *    assigned nothing, and the page said "Device assigned. All device assigned
 *    into account."
 *  - `catch (error) { return setLoadingStatus(false); }` — a failure rendered
 *    the same green success panel as a success.
 *
 * What it does now: the serials were scanned and validated in the transaction
 * modal, so they arrive as an explicit list. This page assigns exactly those,
 * counts what actually succeeded, and says so.
 *
 * And it runs once per intent (2026-10-02). The draft is persisted and was
 * never cleared, so reloading this URL, which still carries `payment_intent`,
 * wrote the Stripe record, the transaction and the assignments again. The
 * draft is now stamped before the first write (`markProcessed`). It also stops
 * on a declined `redirect_status` or a declined intent, where it used to check
 * only that the lookup answered `ok`.
 */
const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.stripe);
  const { deviceSelection, deviceSelectionPaidTransaction } = useSelector(
    (state) => state.devicesHandle
  );

  const [state, setState] = useState({ status: "working", assigned: 0, failed: [] });
  const startedRef = useRef(false);

  const paymentIntent = searchParams.get("payment_intent");
  const clientSecret = searchParams.get("payment_intent_client_secret");
  const redirectStatus = searchParams.get("redirect_status");

  const draft = deviceSelectionPaidTransaction;
  const deviceType = draft?.deviceType?.group;
  const deviceValue = draft?.deviceType?.value;
  // The modal scans and validates the serials; a single-device transaction is
  // just a one-entry list.
  const serials = draftSerials(draft);

  // Decided once, on arrival: stamping the draft re-renders the page, and the
  // stamp must not turn the run in progress into "already processed".
  const [arrival] = useState(() =>
    confirmationStep({ paymentIntent, redirectStatus, draft })
  );

  const poolQuery = useQuery({
    queryKey: ["eventDevicePool", event?.eventInfoDetail?.eventName, user?.companyData?.id],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        activity: false,
      }),
    enabled: Boolean(event?.eventInfoDetail?.eventName && user?.companyData?.id),
  });

  const backToConsumer = () =>
    navigate(`/events/event-attendees/${customer?.uid}/transactions-details`);

  useEffect(() => {
    if (startedRef.current) return;
    if (arrival !== "run") return;
    if (poolQuery.isLoading || !poolQuery.data) return;

    startedRef.current = true;
    const pool = poolQuery.data.data?.receiversInventory ?? [];

    const assignOne = async (serial) => {
      const assignment = new DeviceAssigned(
        paymentIntent,
        { serialNumber: serial, deviceType, status: true },
        customer.email,
        true,
        event.eventInfoDetail.eventName,
        event.company,
        new Date().getTime(),
        user.companyData.id,
        event.id
      );
      const response = await devitrakApi.post(
        "/receiver/receiver-assignation",
        assignment.render()
      );
      if (!response.data?.ok) throw new Error(`Assignment refused for ${serial}`);

      const inPool = pool.find(
        (entry) => String(entry?.device).toLowerCase() === String(serial).toLowerCase()
      );
      if (inPool?.id) {
        await devitrakApi.patch(`/receiver/receivers-pool-update/${inPool.id}`, {
          activity: true,
          status: "Operational",
        });
      }
    };

    const run = async () => {
      let saved = false;
      try {
        const intent = await devitrakApi.get(
          `/stripe/payment_intents/${paymentIntent}`
        );
        if (!intent.data?.ok) throw new Error("Stripe did not confirm the intent");
        if (isDeclinedIntent(intent.data?.paymentIntent)) {
          setState({ status: "declined", assigned: 0, failed: serials });
          return;
        }
        dispatch(onAddNewPaymentIntent(intent.data));
        // Before the first write: from here on, a reload must not run again.
        dispatch(onAddDevicesSelectionPaidTransactions(markProcessed(draft, paymentIntent)));

        await devitrakApi.post("/stripe/stripe-transaction-admin", {
          paymentIntent,
          clientSecret,
          device: deviceSelection,
          provider: event.company,
          eventSelected: event.eventInfoDetail.eventName,
          user: customer?.uid,
          company: user.companyData.id,
        });

        await devitrakApi.post("/transaction/save-transaction", {
          paymentIntent,
          clientSecret,
          device: [
            {
              deviceNeeded: serials.length,
              deviceType,
              deviceValue,
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
        });
        saved = true;

        // Assigned one at a time so a single refusal is reported as one
        // refusal, not as a failed transaction.
        const failed = [];
        let assigned = 0;
        for (const serial of serials) {
          try {
            await assignOne(serial);
            assigned += 1;
          } catch (error) {
            failed.push(serial);
          }
        }

        if (assigned > 0) {
          try {
            await devitrakApi.post("/nodemailer/assignig-device-notification", {
              consumer: {
                email: customer.email,
                firstName: customer.name,
                lastName: customer.lastName,
              },
              devices: serials
                .filter((serial) => !failed.includes(serial))
                .map((serial) => ({ serialNumber: serial, deviceType, paymentIntent })),
              event: event.eventInfoDetail.eventName,
              transaction: paymentIntent,
              company: user.companyData.id,
              link: `https://app.devitrak.net/?event=${event.id}&company=${user.companyData.id}`,
              admin: user.email,
            });
          } catch (error) {
            notify("warning", "Devices assigned, but the email did not send.");
          }
        }

        // A cache that did not clear is not a failed deposit: the writes are
        // done, and the old catch reported them as "no device was assigned".
        try {
          await Promise.all([
            clearCacheMemory(`eventSelected=${event.id}&company=${user.companyData.id}`),
            clearCacheMemory(
              `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
            ),
          ]);
        } catch {
          // The invalidations below still refresh this session's lists.
        }
        queryClient.invalidateQueries({ queryKey: ["consumerEventTransactions"] });
        queryClient.invalidateQueries({ queryKey: ["consumerEventAssignedDevices"] });
        queryClient.invalidateQueries({ queryKey: ["eventDevicePool"] });

        setState({
          status: failed.length === 0 ? "done" : "partial",
          assigned,
          failed,
        });
      } catch (error) {
        setState({ status: saved ? "unassigned" : "failed", assigned: 0, failed: serials });
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival, paymentIntent, poolQuery.isLoading, poolQuery.data]);

  const shell = (children) => (
    <div style={{ padding: "16px 24px 24px", maxWidth: "760px", margin: "0 auto" }}>
      {contextHolder}
      <ProfileSection title="Card deposit" testId="deposit-confirmation">
        <div style={{ padding: "4px 20px 20px" }}>{children}</div>
      </ProfileSection>
    </div>
  );

  const reference = paymentIntent ? ` Stripe reference: ${paymentIntent}.` : "";

  if (arrival === "declined" || state.status === "declined") {
    return shell(
      <ProfileErrorState
        title="The card was not authorized"
        description={`Stripe did not authorize this deposit, so nothing was saved and no device was assigned.${reference} Start the transaction again from the consumer's page.`}
        action={<GrayButtonComponent title="Back to the consumer" func={backToConsumer} />}
      />
    );
  }

  // A reload of this URL after the deposit ran. The old page ran it again.
  if (arrival === "already-processed") {
    return shell(
      <ProfileErrorState
        title="This deposit was already processed"
        description={`It was not saved a second time.${reference} Its transaction and devices are on the consumer's page.`}
        action={<BlueButtonComponent title="Back to the consumer" func={backToConsumer} />}
      />
    );
  }

  // The draft lives in Redux; arriving without one, the old page silently
  // assigned nothing and reported success.
  if (arrival === "missing") {
    return shell(
      <ProfileErrorState
        title="Nothing to confirm"
        description={`This page finishes a card deposit started from a consumer's page. The transaction details are no longer in this session, so nothing was assigned.${reference}`}
        action={<GrayButtonComponent title="Back to the consumer" func={backToConsumer} />}
      />
    );
  }

  if (state.status === "working") {
    return shell(
      <>
        <p className="txn__intro">
          Confirming the deposit and assigning {serials.length} {deviceType}
          {serials.length === 1 ? "" : "s"}. Do not close this page.
        </p>
        <ProfileSkeleton lines={3} />
      </>
    );
  }

  if (state.status === "failed") {
    return shell(
      <ProfileErrorState
        title="The deposit was authorized but the transaction was not saved"
        description={`Stripe is holding the funds for ${paymentIntent}, and no device was assigned. Report this reference before retrying, so the hold is not duplicated.`}
        action={<GrayButtonComponent title="Back to the consumer" func={backToConsumer} />}
      />
    );
  }

  if (state.status === "unassigned") {
    return shell(
      <ProfileErrorState
        title="The transaction was saved, but the devices were not assigned"
        description={`The deposit ${paymentIntent} is on the consumer's page. Assign ${serials.join(", ")} from that transaction.`}
        action={<GrayButtonComponent title="Back to the consumer" func={backToConsumer} />}
      />
    );
  }

  return shell(
    <div className="txn">
      <p
        className={`scan__feedback scan__feedback--${
          state.status === "partial" ? "error" : "ok"
        }`}
        style={{ fontSize: "15px", fontWeight: 600 }}
      >
        {state.status === "partial" ? (
          <AlertTriangle size={18} style={{ flex: "none" }} />
        ) : (
          <CheckCircle2 size={18} style={{ flex: "none" }} />
        )}
        {state.status === "partial"
          ? `${state.assigned} of ${serials.length} devices assigned`
          : "Deposit authorized and devices assigned"}
      </p>

      <dl className="txn__summary">
        <div>
          <dt>Transaction</dt>
          <dd className="profile-serial">{paymentIntent}</dd>
        </div>
        <div>
          <dt>Device</dt>
          <dd style={{ textTransform: "capitalize" }}>{deviceType}</dd>
        </div>
        <div>
          <dt>Assigned</dt>
          <dd>{state.assigned}</dd>
        </div>
      </dl>

      {/* A partial result is a partial result. The old page reported this case
          as a complete success. */}
      {state.status === "partial" && (
        <ul className="txn__problems" role="alert">
          <li>
            These devices were not assigned and are still free:{" "}
            {state.failed.join(", ")}. Assign them from the transaction, or hand
            over different units.
          </li>
        </ul>
      )}

      <div className="txn__footer">
        <GrayButtonComponent
          title="Back to the event"
          func={() => navigate("/events/event-quickglance")}
        />
        <BlueButtonComponent title="Back to the consumer" func={backToConsumer} />
      </div>
    </div>
  );
};

export default Confirmation;
