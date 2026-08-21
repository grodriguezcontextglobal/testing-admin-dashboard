import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
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
import { onAddNewPaymentIntent } from "../../store/slices/stripeSlice";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";
import "../events/quickGlance/consumer/consumerDetail.css";

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

  const draft = deviceSelectionPaidTransaction;
  const deviceType = draft?.deviceType?.group;
  const deviceValue = draft?.deviceType?.value;
  // The modal scans and validates the serials; a single-device transaction is
  // just a one-entry list.
  const serials = Array.isArray(draft?.serialNumbers)
    ? draft.serialNumbers
    : draft?.serialNumber
    ? [draft.serialNumber]
    : [];

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
    if (!paymentIntent || serials.length === 0 || !deviceType) return;
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
      try {
        const intent = await devitrakApi.get(
          `/stripe/payment_intents/${paymentIntent}`
        );
        if (!intent.data?.ok) throw new Error("Stripe did not confirm the intent");
        dispatch(onAddNewPaymentIntent(intent.data));

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

        await Promise.all([
          clearCacheMemory(`eventSelected=${event.id}&company=${user.companyData.id}`),
          clearCacheMemory(
            `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
          ),
        ]);
        queryClient.invalidateQueries({ queryKey: ["consumerEventTransactions"] });
        queryClient.invalidateQueries({ queryKey: ["consumerEventAssignedDevices"] });
        queryClient.invalidateQueries({ queryKey: ["eventDevicePool"] });

        setState({
          status: failed.length === 0 ? "done" : "partial",
          assigned,
          failed,
        });
      } catch (error) {
        setState({ status: "failed", assigned: 0, failed: serials });
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIntent, poolQuery.isLoading, poolQuery.data, serials.length, deviceType]);

  const shell = (children) => (
    <div style={{ padding: "16px 24px 24px", maxWidth: "760px", margin: "0 auto" }}>
      {contextHolder}
      <ProfileSection title="Card deposit" testId="deposit-confirmation">
        <div style={{ padding: "4px 20px 20px" }}>{children}</div>
      </ProfileSection>
    </div>
  );

  // The draft lives in Redux; a hard reload of this URL arrives without it, and
  // the old page silently assigned nothing and reported success.
  if (!paymentIntent || serials.length === 0 || !deviceType) {
    return shell(
      <ProfileErrorState
        title="Nothing to confirm"
        description="This page finishes a card deposit started from a consumer's page. The transaction details are no longer in this session, so nothing was assigned."
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

  return shell(
    <div className="txn">
      <p
        className="scan__feedback scan__feedback--ok"
        style={{ fontSize: "15px", fontWeight: 600 }}
      >
        <CheckCircle2 size={18} style={{ flex: "none" }} />
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
