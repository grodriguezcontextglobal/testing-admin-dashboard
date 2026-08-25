import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import EmptyState from "../../../../../../../components/UX/emptyState/EmptyState";
import ModalUX from "../../../../../../../components/UX/modal/ModalUX";
import {
  ProfileErrorState,
  ProfileSkeleton,
  StatusChip,
} from "../../../../../../../components/UX/profile";
import BaseTable from "../../../../../../../components/UX/tables/BaseTable";
import { onOpenDeviceAssignmentModalFromSearchPage } from "../../../../../../../store/slices/devicesHandleSlice";
import "../../../consumerDetail.css";
import { describeDeviceState } from "../../../utils/consumerActivity";
import { formatTransactionId } from "../../../utils/transactionTable";
import {
  summarizeAssignment,
  toDeviceRows,
} from "../../../utils/transactionAssignment";
import { consumerTransactionsKey } from "../../hooks/useConsumerEventActivity";
import AssignmentProgress from "../../transaction/AssignmentProgress";
// Was AddingDeviceToPaymentIntentFromSearchBar, a 494-line verbatim copy of
// AddingDevicesToPaymentIntent (491 lines). They differed only in their layout
// markup; every handler, validation and endpoint was identical, so a fix to one
// silently did not apply to the other.
import AddingDevicesToPaymentIntent from "../AddingDevicesToPaymentIntent";
import { useDeviceStatus } from "../hooks/useDeviceStatus";

/**
 * Assign devices to a transaction, reached from the global search bar.
 *
 * Rebuilt because the layout said nothing about the order of the work: the
 * progress meter and the scan field came first, then two buttons, then the table
 * those buttons referred to. Reading it top to bottom you were asked to finish
 * before you could see what you had done.
 *
 * The two buttons were the visible half of a real bug. "Assigned and Save" and
 * "Continue later" both call `closeModal()` — the same action, twice — and the
 * first was meant to be hidden until the transaction was complete via
 * `style={{ display: ... }}`. But BlueButtonComponent takes `styles`, not
 * `style`: `style` lands in `...rest`, and the component then applies its own
 * `style={{ ...styles }}` *after* spreading rest, so the caller's value is
 * overwritten. Both buttons were always visible, always doing the same thing.
 *
 * The condition behind it could not have worked either:
 * `assigned.length === paymentIntentDetailSelected?.device` compares a number to
 * the transaction's `device` **array**, which is never equal. So "complete" was
 * never detected — not for the buttons, and not for hiding the scan field.
 *
 * Also fixed here:
 *  - The component returned `undefined` until the assigned-device query
 *    resolved, so opening the modal showed an empty frame with no title.
 *  - `["assignedDeviceInPaymentIntent"]` was keyed without the payment intent,
 *    so opening the modal on a second transaction served the first one's
 *    devices out of cache.
 *  - The effect that resolves which transaction this is watched the *assigned
 *    devices* query while reading the *transactions* query. When transactions
 *    resolved second — the common case, it has no `refetchOnMount: false` — the
 *    transaction stayed `null` and both the progress meter and the scan field
 *    silently never appeared.
 *  - `AddingDevicesToPaymentIntent` was rendered even with a null record, so
 *    submitting a scan threw on `record.paymentIntent`.
 *  - Removing a device was a red button labelled "X" with no confirmation.
 */
const ModalAddingDeviceFromSearchbar = () => {
  const { paymentIntentSelected, customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const { openModalToAssignDevice } = useSelector((state) => state.devicesHandle);
  const dispatch = useDispatch();

  const { unassignDevice, isUnassigning, contextHolder } = useDeviceStatus(
    event,
    user
  );

  const companyId = user?.companyData?.id;
  const consumerId = customer?.id ?? customer?.uid;

  const assignedQuery = useQuery({
    queryKey: ["assignedDeviceInPaymentIntent", paymentIntentSelected],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned", {
        paymentIntent: paymentIntentSelected,
      }),
    enabled: Boolean(paymentIntentSelected),
  });

  // Shares the canonical key with the consumer's page, so the two never hold
  // two different answers for the same question.
  const transactionsQuery = useQuery({
    queryKey: consumerTransactionsKey(event?.id, companyId, consumerId),
    queryFn: () =>
      devitrakApi.get(
        `/transaction/transaction?event_id=${event.id}&company=${companyId}&consumerInfo.id=${consumerId}`
      ),
    enabled: Boolean(event?.id && companyId && consumerId),
  });

  // Derived, not stored in state behind an effect keyed on the wrong query.
  const record =
    groupBy(transactionsQuery.data?.data?.list, "paymentIntent")[
      paymentIntentSelected
    ]?.[0] ?? null;

  const rows = toDeviceRows(assignedQuery.data?.data?.receiver);
  const assignment = summarizeAssignment(record, rows);
  const isComplete = Boolean(record) && assignment.isComplete;

  const close = () => dispatch(onOpenDeviceAssignmentModalFromSearchPage(false));

  const removeDevice = async (row) => {
    try {
      await unassignDevice({
        assignmentId: row.receiverId,
        serialNumber: row.serialNumber,
        deviceType: row.deviceType,
      });
      assignedQuery.refetch();
    } catch (error) {
      // The hook raises its own notification.
    }
  };

  const columns = [
    {
      title: "Serial number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      width: "34%",
      sorter: (a, b) => String(a.serialNumber).localeCompare(b.serialNumber),
      render: (serialNumber) => (
        <span className="profile-serial">{serialNumber || "—"}</span>
      ),
    },
    {
      title: "Type",
      dataIndex: "deviceType",
      key: "deviceType",
      responsive: ["md"],
      sorter: (a, b) => String(a.deviceType).localeCompare(b.deviceType),
      render: (deviceType) => (
        <span style={{ textTransform: "capitalize" }}>{deviceType || "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "18%",
      render: (status) => {
        const state = describeDeviceState(status);
        return <StatusChip tone={state.tone} pip label={state.label} />;
      },
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: "16%",
      render: (_, row) => (
        <span className="profile-row-actions">
          <DangerButtonConfirmationComponent
            title="Remove"
            size="sm"
            loadingState={isUnassigning}
            confirmationTitle={`Remove ${row.serialNumber || "this device"}?`}
            confirmationDescription="It comes off this transaction and goes back into the event's pool."
            okText="Remove"
            func={() => removeDevice(row)}
          />
        </span>
      ),
    },
  ];

  const body = () => {
    if (!paymentIntentSelected) {
      return (
        <ProfileErrorState
          title="No transaction selected"
          description="Open this from a transaction so the devices can be assigned to it."
        />
      );
    }

    if (assignedQuery.isLoading || transactionsQuery.isLoading) {
      return <ProfileSkeleton lines={4} />;
    }

    if (assignedQuery.isError || transactionsQuery.isError) {
      return (
        <ProfileErrorState
          title="Couldn't load this transaction"
          description="The service didn't respond, so what is already assigned is unknown. Nothing was changed."
          action={
            <GrayButtonComponent
              title="Try again"
              func={() => {
                assignedQuery.refetch();
                transactionsQuery.refetch();
              }}
            />
          }
        />
      );
    }

    if (!record) {
      return (
        <ProfileErrorState
          title="Transaction not found on this event"
          description={`Nothing on this event matches ${formatTransactionId(
            paymentIntentSelected
          )}. It may belong to another event, or have been voided.`}
          action={<GrayButtonComponent title="Close" func={close} />}
        />
      );
    }

    return (
      <div className="txn">
        {/* Which transaction this is, before anything is done to it. The old
            modal named only the consumer, in a paragraph. */}
        <dl className="txn__summary">
          <div>
            <dt>Consumer</dt>
            <dd style={{ textTransform: "capitalize" }}>
              {customer?.name} {customer?.lastName}
            </dd>
          </div>
          <div>
            <dt>Transaction</dt>
            <dd className="profile-serial">
              {formatTransactionId(paymentIntentSelected)}
            </dd>
          </div>
          <div>
            <dt>Requested</dt>
            <dd>
              {assignment.totals.requested}{" "}
              {assignment.totals.requested === 1 ? "device" : "devices"}
            </dd>
          </div>
        </dl>

        {/* 1 — how much is left, and the scanner, only while there is work */}
        {!isComplete && (
          <section className="txn__step">
            <div className="txn__step-head">
              <span className="txn__step-index">1</span>
              <h3 className="txn__step-title">Scan what you are handing over</h3>
              <p className="txn__step-note">
                {assignment.totals.remaining} to go
              </p>
            </div>
            <AssignmentProgress summary={assignment} />
            <AddingDevicesToPaymentIntent
              key={paymentIntentSelected}
              record={record}
              refetchingFn={() => assignedQuery.refetch()}
            />
          </section>
        )}

        {/* 2 — what is on the transaction, below the field that adds to it */}
        <section className="txn__step">
          <div className="txn__step-head">
            <span
              className={`txn__step-index${isComplete ? " is-done" : ""}`}
            >
              {isComplete ? "✓" : 2}
            </span>
            <h3 className="txn__step-title">
              {isComplete ? "All devices assigned" : "Assigned so far"}
            </h3>
            <p className="txn__step-note">
              {rows.length} of {assignment.totals.requested}
            </p>
          </div>
          {rows.length === 0 ? (
            <EmptyState
              compact
              icon="tabler:device-tablet-off"
              title="Nothing assigned yet"
              description="Scan a serial number above to hand over the first device."
            />
          ) : (
            <BaseTable
              className="profile-table"
              columns={columns}
              dataSource={rows}
              enablePagination={rows.length > 10}
              pageSize={10}
            />
          )}
        </section>

        {/* One action, labelled for the state it is in — not two buttons doing
            the same thing with one of them meant to be hidden. */}
        <div className="txn__footer">
          {isComplete ? (
            <BlueButtonComponent title="Done" func={close} />
          ) : (
            <GrayButtonComponent title="Finish later" func={close} />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        title="Assign devices to transaction"
        openDialog={openModalToAssignDevice}
        closeModal={close}
        width={760}
        footer={[]}
        modalStyles={{ top: "5dvh", zIndex: 30 }}
        body={body()}
      />
    </>
  );
};

export default ModalAddingDeviceFromSearchbar;
