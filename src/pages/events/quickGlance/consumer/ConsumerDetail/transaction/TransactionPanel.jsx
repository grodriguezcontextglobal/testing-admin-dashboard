import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import BlueButtonConfirmationComponent from "../../../../../../components/UX/buttons/BlueButtonConfirmation";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../../components/UX/buttons/LigthBlueButton";
import ReturnDevicesModal from "../../../../../../components/UX/deviceReturn/ReturnDevicesModal";
import { ProfileSkeleton } from "../../../../../../components/UX/profile";
import {
  onReceiverObjectToReplace,
  onTriggerModalToReplaceReceiver,
} from "../../../../../../store/slices/helperSlice";
import {
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../../store/slices/stripeSlice";
import "../../consumerDetail.css";
import {
  devicesForTransaction,
  summarizeAssignment,
} from "../../utils/transactionAssignment";
import { describeTransactionKind } from "../../utils/transactionTable";
import Choice from "../../lostFee/Choice";
import AddingDevicesToPaymentIntent from "../AssigningDevice/AddingDevicesToPaymentIntent";
import SignaturesProof from "../SignaturesProof";
import { ReplaceDevice } from "../actions/ReplaceDevice";
import AssignmentProgress from "./AssignmentProgress";
import TransactionDeviceTable from "./TransactionDeviceTable";
import useTransactionDeviceActions from "./useTransactionDeviceActions";
import { consumerAssignedDevicesKey } from "../hooks/useConsumerEventActivity";

/**
 * One expanded transaction, read top to bottom in the order the work happens:
 *
 *   1. Assign   — how much is still to hand over, and the scanner input
 *   2. Devices  — what is out, with a per-row action
 *   3. Bulk     — take everything back, or check in by scanning
 *   4. Documents— what the consumer signed for
 *
 * Replaces ExpandedRowInTable.jsx, which put four identically-weighted blue
 * buttons above the table ("Return all items of this transaction", "Express
 * check-in devices", "Send device report", and a fourth that appeared only once
 * a checkbox was ticked), so the irreversible one looked exactly like the one
 * that sends an email. Here the destructive bulk action sits below the table it
 * acts on, behind a confirmation, and the reversible ones sit beside it as
 * secondary buttons.
 *
 * The assignment form is only rendered while something is still unassigned. It
 * used to be hidden with `display: none` on a wrapper whose condition was
 * `checkDevicesInTransaction().length >= deviceNeeded && "none"` — which
 * evaluates to the string "false" when the transaction is incomplete, and
 * `display: "false"` is not a rule, so the form stayed mounted and focused,
 * stealing the keyboard from the table below it.
 */
const TransactionPanel = ({
  record,
  signatureProof,
  refetchTransactions,
  onReleaseDeposit,
}) => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const { customer: stripeCustomer } = useSelector((state) => state.stripe);
  const { triggerModal } = useSelector((state) => state.helper);
  const dispatch = useDispatch();

  const [selectedRows, setSelectedRows] = useState([]);
  // One modal takes devices back. `null` while it is closed, otherwise how it
  // was opened: "review" from the table selection, "scan" from express check-in.
  const [returnMode, setReturnMode] = useState(null);
  const [openLostFeeChoice, setOpenLostFeeChoice] = useState(false);

  const consumer = customer ?? stripeCustomer;
  const isEventActive = Boolean(event?.active);
  const canWriteOff = Boolean(
    event?.staff?.adminUser?.some((member) => member.email === user?.email)
  );

  // Scoped to this payment intent under its own key. Every one of these fetches
  // used to share the key ["assginedDeviceList"] with the page-wide list while
  // posting a narrower body, so expanding a row overwrote the consumer's full
  // device list in the cache with one transaction's worth.
  const devicesQuery = useQuery({
    queryKey: [
      ...consumerAssignedDevicesKey(
        event?.eventInfoDetail?.eventName,
        user?.companyData?.id,
        consumer?.email
      ),
      record.paymentIntent,
    ],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        user: consumer.email,
        company: user.companyData.id,
        eventSelected: event.eventInfoDetail.eventName,
        paymentIntent: record.paymentIntent,
      }),
    enabled: Boolean(
      consumer?.email && user?.companyData?.id && event?.eventInfoDetail?.eventName
    ),
  });

  const rows = devicesForTransaction(
    devicesQuery.data?.data?.listOfReceivers,
    record.paymentIntent
  );
  const assignment = summarizeAssignment(record, rows);
  const stillOut = rows.filter((row) => row.status === true);
  const documents = signatureProof?.[record.paymentIntent] ?? [];

  const refetch = () => {
    devicesQuery.refetch();
    refetchTransactions?.();
  };

  const selectTransaction = (target) => {
    dispatch(onAddPaymentIntentSelected(target.paymentIntent ?? record.paymentIntent));
    dispatch(onAddPaymentIntentDetailSelected({ ...record }));
  };

  const actions = useTransactionDeviceActions({
    event,
    user,
    consumer,
    record,
    rows,
    refetch,
    onTransactionEmptied: () => {
      selectTransaction(record);
      refetchTransactions?.();
    },
  });

  // An emptied deposit transaction is the moment to release the hold. The old
  // page opened the release modal by itself — from a `useEffect` watching the
  // expanded row, so merely expanding a settled transaction threw an
  // irreversible "Releasing deposit?" dialog in your face. Now it is an offer
  // you can read first.
  const kind = describeTransactionKind(record);
  const awaitingRelease =
    kind.canReleaseDeposit &&
    record.active !== false &&
    rows.length > 0 &&
    stillOut.length === 0;

  const handleReplace = (row) => {
    dispatch(onTriggerModalToReplaceReceiver(true));
    dispatch(onReceiverObjectToReplace(row));
    selectTransaction(row);
  };

  const handleReportLost = (row) => {
    dispatch(onReceiverObjectToReplace(row));
    dispatch(onAddDevicesAssignedInPaymentIntent([row]));
    selectTransaction(row);
    setOpenLostFeeChoice(true);
  };

  if (devicesQuery.isLoading) {
    return (
      <div className="transaction-panel">
        <ProfileSkeleton lines={3} />
      </div>
    );
  }

  return (
    <div className="transaction-panel" key={record.paymentIntent}>
      {actions.contextHolder}

      {/* 1 — What is still to hand over */}
      {!assignment.isComplete && (
        <section className="transaction-panel__block">
          <div className="transaction-panel__heading">
            <h3 className="transaction-panel__title">Assign devices</h3>
          </div>
          <AssignmentProgress summary={assignment} />
          {isEventActive ? (
            <AddingDevicesToPaymentIntent
              record={record}
              refetchingFn={refetch}
            />
          ) : (
            <p className="transaction-panel__hint">
              This event is closed, so no more devices can be assigned.
            </p>
          )}
        </section>
      )}

      {/* 2 — What is out */}
      <section className="transaction-panel__block">
        <div className="transaction-panel__heading">
          <h3 className="transaction-panel__title">
            Devices on this transaction
          </h3>
          {rows.length > 0 && (
            <p className="transaction-panel__hint">
              {stillOut.length} of {rows.length} still out
            </p>
          )}
        </div>
        <TransactionDeviceTable
          rows={rows}
          isEventActive={isEventActive}
          canWriteOff={canWriteOff}
          busyKey={actions.busyKey}
          onReturn={actions.handleReturn}
          onAssign={actions.handleAssign}
          onReplace={handleReplace}
          onReportLost={handleReportLost}
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: selectedRows.map((row) => row.key),
            onChange: (_, rows_) => setSelectedRows(rows_),
            getCheckboxProps: (row) => ({
              // Only a device that is actually out can be returned.
              disabled: row.status !== true,
            }),
          }}
        />
      </section>

      {/* 3a — The deposit still on the consumer's card, once the gear is back */}
      {awaitingRelease && (
        <div className="assignment" data-testid="deposit-release-prompt">
          <div className="assignment__summary">
            <span className="assignment__count">
              Everything is back. <em>The card deposit is still held.</em>
            </span>
            <LightBlueButtonComponent
              title="Release deposit"
              size="sm"
              func={() => {
                selectTransaction(record);
                onReleaseDeposit?.(record);
              }}
            />
          </div>
        </div>
      )}

      {/* 3 — Bulk actions, below the table they act on */}
      {rows.length > 0 && (
        <div className="transaction-panel__actions">
          {selectedRows.length > 0 ? (
            <LightBlueButtonComponent
              title={`Return ${selectedRows.length} selected`}
              disabled={!isEventActive}
              func={() => setReturnMode("review")}
            />
          ) : (
            <BlueButtonConfirmationComponent
              title="Return everything"
              disabled={!isEventActive || stillOut.length === 0}
              loadingState={actions.isBulkRunning}
              confirmationTitle={`Return all ${stillOut.length} device${
                stillOut.length === 1 ? "" : "s"
              } still out?`}
              confirmationDescription="The consumer is emailed a return receipt and the card deposit is released."
              okText="Return everything"
              func={actions.handleReturnAll}
            />
          )}
          <div className="transaction-panel__actions--secondary">
            <GrayButtonComponent
              title="Express check-in"
              disabled={!isEventActive}
              func={() => setReturnMode("scan")}
            />
            <GrayButtonComponent
              title="Email device report"
              loadingState={actions.isReportSending}
              func={actions.sendDeviceReport}
            />
          </div>
        </div>
      )}

      {/* 4 — What they signed. Absent rather than an empty panel: most
          transactions have no documents, and an empty state on every expanded
          row is noise, not information. The Documents tab lists them all. */}
      {documents.length > 0 && (
        <section className="transaction-panel__block">
          <div className="transaction-panel__heading">
            <h3 className="transaction-panel__title">Signed documents</h3>
          </div>
          <SignaturesProof data={documents} />
        </section>
      )}

      {openLostFeeChoice && (
        <Choice openModal={openLostFeeChoice} setOpenModal={setOpenLostFeeChoice} />
      )}
      {triggerModal && <ReplaceDevice refetching={refetch} />}
      {returnMode && (
        <ReturnDevicesModal
          open={Boolean(returnMode)}
          mode={returnMode}
          onClose={() => setReturnMode(null)}
          // Every device on the transaction, so a scan can tell "already back"
          // apart from "not on this transaction". The modal decides for itself
          // which of them may still be returned.
          devices={rows}
          initialSelection={returnMode === "review" ? selectedRows : []}
          eventSelected={record.eventSelected}
          transactionLabel={record.paymentIntent}
          onRefetch={refetch}
          onReturned={actions.settleTransactionIfEmpty}
          onClearSelection={() => setSelectedRows([])}
        />
      )}
    </div>
  );
};

TransactionPanel.propTypes = {
  record: PropTypes.shape({
    paymentIntent: PropTypes.string,
    device: PropTypes.array,
  }).isRequired,
  signatureProof: PropTypes.object,
  refetchTransactions: PropTypes.func,
  onReleaseDeposit: PropTypes.func,
};

TransactionPanel.defaultProps = {
  signatureProof: {},
  refetchTransactions: undefined,
  onReleaseDeposit: undefined,
};

export default TransactionPanel;
