import { useQuery } from "@tanstack/react-query";
import { Popconfirm } from "antd";
import { groupBy } from "lodash";
import { ChevronDown, ChevronRight } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import { ProfileErrorState, ProfileSkeleton, StatusChip } from "../../../../../components/UX/profile";
import ExpandableTable from "../../../../../components/UX/tables/ExpandableTable";
import {
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import ReceiptModal from "../../../../payment/components/ReceiptModal";
import {
  buildReceiptUrl,
  mapTransactionToReceipt,
} from "../../../../payment/utils/receiptUtils";
import "../consumerDetail.css";
import {
  describeTransactionKind,
  describeTransactionState,
  filterTransactions,
  formatTransactionId,
  toTransactionRows,
} from "../utils/transactionTable";
import ModalAddingDeviceFromSearchbar from "./AssigningDevice/components/ModalAddingDeviceFromSearchbar";
import Capturing from "./actions/deposit/Capturing";
import Releasing from "./actions/deposit/Releasing";
import {
  consumerTransactionsKey,
  useSelectedConsumer,
} from "./hooks/useConsumerEventActivity";
import TransactionPanel from "./transaction/TransactionPanel";

/**
 * A consumer's transactions at one event, one expandable row each.
 *
 * The columns answer, left to right: when, which transaction, how big, what
 * state is it in. The money actions used to be laid out in an MUI Grid with
 * hard-coded `md={6}` / `md={4}` / `md={12}` breakpoints per button, so the set
 * re-wrapped into a different shape depending on which buttons a given row
 * happened to qualify for. They are one right-aligned group now.
 *
 * Two behavioural fixes ride along, both covered in utils/transactionTable.js:
 *
 *  - Searching works. The old filter returned [] as soon as the box had any
 *    content, so typing one character emptied the table with no way to tell
 *    that apart from "no results".
 *  - Cash transactions are no longer offered Stripe deposit actions. The old
 *    test was `paymentIntent.length > 16`, and a cash id is long, so "Capture
 *    fund" and "Release deposit" appeared for money that never touched Stripe.
 */
const StripeTransactionTable = ({ searchValue, triggering }) => {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { openModalToAssignDevice } = useSelector((state) => state.devicesHandle);
  const consumer = useSelectedConsumer();
  const dispatch = useDispatch();
  const { notify, contextHolder } = useStatusNotification();

  const [expandedKey, setExpandedKey] = useState(null);
  const [openCapture, setOpenCapture] = useState(false);
  const [openRelease, setOpenRelease] = useState(false);
  const [refundingKey, setRefundingKey] = useState(null);
  const [receiptTransaction, setReceiptTransaction] = useState(null);

  const companyId = user?.companyData?.id;
  const consumerId = consumer?.id ?? consumer?.uid;

  const transactionsQuery = useQuery({
    queryKey: [
      ...consumerTransactionsKey(event?.id, companyId, consumerId),
      triggering,
    ],
    queryFn: () =>
      devitrakApi.get(
        `/transaction/transaction?event_id=${event.id}&company=${companyId}&consumerInfo.id=${consumerId}`
      ),
    enabled: Boolean(event?.id && companyId && consumerId),
  });

  const signaturesQuery = useQuery({
    queryKey: ["consumerSignatures", event?.id, companyId, consumer?.id],
    queryFn: () =>
      devitrakApi.post("/company/consumer-signatures", {
        event_id: event.id,
        company_id: companyId,
        consumer_id: consumer.id,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(event?.id && companyId && consumer?.id),
  });

  const signatureProof = signaturesQuery.data
    ? groupBy(signaturesQuery.data.data.signatures, "transaction_id")
    : {};

  const rows = toTransactionRows(
    filterTransactions(transactionsQuery.data?.data?.list, searchValue)
  );

  const selectTransaction = (record) => {
    dispatch(onAddPaymentIntentSelected(record.paymentIntent));
    dispatch(onAddPaymentIntentDetailSelected({ ...record }));
  };

  const handleRefund = async (record) => {
    setRefundingKey(record.key);
    try {
      await devitrakApi.post("/stripe/refund", {
        paymentIntent: record.paymentIntent,
      });
      await devitrakApi.patch(`/transaction/update-transaction/${record.id}`, {
        id: record.id,
        active: false,
      });
      await devitrakApi.post("/nodemailer/refund-notification", {
        email: consumer.email,
        amount: String(record.device?.[0]?.deviceValue ?? ""),
        date: new Date().toString().slice(4, 15),
        paymentIntent: record.paymentIntent,
        customer: `${consumer.name} ${consumer.lastName}`,
      });
      transactionsQuery.refetch();
      notify("success", "Refund issued and the consumer was emailed.");
    } catch (error) {
      notify("error", "The refund failed. Nothing was charged back.");
    } finally {
      setRefundingKey(null);
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "20%",
      responsive: ["md"],
      render: (date) => (
        <span className="profile-date__exact">
          {date ? new Date(date).toUTCString() : "—"}
        </span>
      ),
    },
    {
      title: "Transaction",
      dataIndex: "paymentIntent",
      key: "paymentIntent",
      render: (paymentIntent, record) => {
        const kind = describeTransactionKind(record);
        return (
          <span
            style={{ display: "flex", flexDirection: "column", gap: "3px" }}
          >
            <span className="profile-serial">
              {formatTransactionId(paymentIntent)}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "var(--gray-500, #777b73)",
              }}
            >
              {kind.label}
            </span>
          </span>
        );
      },
    },
    {
      title: "Devices",
      dataIndex: "device",
      key: "device",
      width: "12%",
      responsive: ["lg"],
      render: (_, record) => {
        const needed = Number(record.device?.[0]?.deviceNeeded) || 0;
        return (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {needed} {needed === 1 ? "device" : "devices"}
          </span>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: "12%",
      render: (_, record) => {
        const state = describeTransactionState(record);
        return <StatusChip tone={state.tone} pip label={state.label} />;
      },
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => {
        const kind = describeTransactionKind(record);
        const isOpen = record.active !== false;

        return (
          <span className="profile-row-actions">
            {kind.canRefund && (
              <DangerButtonComponent
                title={isOpen ? "Refund" : "Refunded"}
                size="sm"
                disabled={!isOpen}
                loadingState={refundingKey === record.key}
                func={() => handleRefund(record)}
              />
            )}
            {kind.canCaptureDeposit && (
              <Popconfirm
                title="Capture this deposit?"
                description="The consumer is charged and this cannot be reversed."
                okText="Capture"
                disabled={!isOpen}
                onConfirm={() => {
                  selectTransaction(record);
                  setOpenCapture(true);
                }}
              >
                <LightBlueButtonComponent
                  title="Capture"
                  size="sm"
                  disabled={!isOpen}
                />
              </Popconfirm>
            )}
            {kind.canReleaseDeposit && (
              <Popconfirm
                title="Release this deposit?"
                description="The hold on the consumer's card is dropped and this cannot be reversed."
                okText="Release"
                disabled={!isOpen}
                onConfirm={() => {
                  selectTransaction(record);
                  setOpenRelease(true);
                }}
              >
                <GrayButtonComponent
                  title="Release"
                  size="sm"
                  disabled={!isOpen}
                />
              </Popconfirm>
            )}
            {/* Offered for closed transactions too — a receipt showing the
                refund or release is exactly what someone comes looking for. */}
            <GrayButtonComponent
              title="Receipt"
              size="sm"
              func={() => setReceiptTransaction(record)}
            />
          </span>
        );
      },
    },
  ];

  if (transactionsQuery.isLoading) return <ProfileSkeleton lines={4} />;

  if (transactionsQuery.isError) {
    return (
      <ProfileErrorState
        title="Couldn't load transactions"
        description="The transaction service didn't respond. Nothing was changed."
        action={
          <GrayButtonComponent
            title="Try again"
            func={() => transactionsQuery.refetch()}
          />
        }
      />
    );
  }

  if (rows.length === 0) {
    // Two different nothings, two different messages. The old table fell
    // through to antd's bare "No data" for both.
    return searchValue ? (
      <EmptyState
        icon="tabler:search-off"
        title="No transaction matches that search"
        description={`Nothing in this consumer's transactions matches "${searchValue}".`}
      />
    ) : (
      <EmptyState
        icon="tabler:receipt-off"
        title="No transactions yet"
        description="Start one from the actions beside the consumer's name."
      />
    );
  }

  return (
    <>
      {contextHolder}
      <ExpandableTable
        columns={columns}
        dataSource={rows}
        enablePagination={rows.length > 10}
        pageSize={10}
        expandable={{
          expandedRowKeys: expandedKey ? [expandedKey] : [],
          onExpand: (expanded, record) =>
            setExpandedKey(expanded ? record.key : null),
          expandRowByClick: false,
          expandIcon: ({ expanded, onExpand, record }) => (
            <GrayButtonComponent
              size="sm"
              ariaLabel={expanded ? "Collapse transaction" : "Expand transaction"}
              func={(e) => onExpand(record, e)}
              title={
                expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              }
            />
          ),
          expandedRowRender: (record) => (
            <TransactionPanel
              key={record.paymentIntent}
              record={record}
              signatureProof={signatureProof}
              refetchTransactions={() => transactionsQuery.refetch()}
              onReleaseDeposit={() => setOpenRelease(true)}
            />
          ),
        }}
      />

      {openCapture && (
        <Capturing
          openCapturingDepositModal={openCapture}
          setOpenCapturingDepositModal={setOpenCapture}
          refetchingTransactionFn={() => transactionsQuery.refetch()}
        />
      )}
      {openRelease && (
        <Releasing
          openCancelingDepositModal={openRelease}
          setOpenCancelingDepositModal={setOpenRelease}
          refetchingTransactionFn={() => transactionsQuery.refetch()}
        />
      )}
      {openModalToAssignDevice && <ModalAddingDeviceFromSearchbar />}
      {receiptTransaction && (
        <ReceiptModal
          openModal={Boolean(receiptTransaction)}
          setOpenModal={() => setReceiptTransaction(null)}
          receipt={mapTransactionToReceipt(receiptTransaction, {
            companyLogo: user?.companyData?.company_logo,
          })}
          qrValue={buildReceiptUrl(
            window.location.origin,
            receiptTransaction?.paymentIntent
          )}
        />
      )}
    </>
  );
};

StripeTransactionTable.propTypes = {
  searchValue: PropTypes.string,
  triggering: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
};

StripeTransactionTable.defaultProps = {
  searchValue: "",
  triggering: 0,
};

export default StripeTransactionTable;
