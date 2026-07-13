import { Table } from "antd";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { Chip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";

const InvoiceTables = () => {
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const [listOfInvoices, setListOfInvoices] = useState([]);
  const generateInvoicesHistoryPerSubscription = useCallback(async () => {
    try {
      if (companyAccountStripe?.subscriptionHistory?.length > 0) {
        const respInvoicesList = await devitrakApi.get("/stripe/invoices", {
          params: {
            subscriptionID:
              companyAccountStripe.subscriptionHistory.at(-1)?.subscription,
          },
        });
        if (respInvoicesList?.data?.ok) {
          setListOfInvoices(respInvoicesList.data.invoices?.data ?? []);
        }
      }
    } catch (error) {
      setListOfInvoices([]);
    }
  }, []);

  useEffect(() => {
    generateInvoicesHistoryPerSubscription();
  }, [generateInvoicesHistoryPerSubscription]);

  const structuringDataToDisplayIntable = useMemo(() => {
    const resultPerIteration = new Set();
    if (listOfInvoices.length > 0) {
      for (let data of listOfInvoices) {
        if (
          data.subscription ===
          companyAccountStripe?.subscriptionHistory?.at(-1)?.subscription
        ) {
          resultPerIteration.add({
            key: data.charge,
            action: { download: data.invoice_pdf },
            amount: data.total,
            billingDate: data.period_start,
            status: data.status,
            receiptNumber: data.number,
            plan: "Basic",
          });
        }
      }
      return Array.from(resultPerIteration);
    } else {
      return listOfInvoices;
    }
  }, [listOfInvoices]);

  const columns = [
    {
      title: "Invoice",
      dataIndex: "receiptNumber",
      render: (receiptNumber) => (
        <Typography
          textTransform={"capitalize"}
          color={"var(--gray-600, #5d615a)"}
          fontFamily={"Inter"}
          fontWeight={400}
          fontSize={"14px"}
          lineHeight={"20px"}
        >
          {receiptNumber}
        </Typography>
      ),
    },
    {
      title: "Billing date",
      dataIndex: "billingDate",
      render: (billingDate) => (
        <Typography
          textTransform={"capitalize"}
          color={"var(--gray-600, #5d615a)"}
          fontFamily={"Inter"}
          fontWeight={400}
          fontSize={"14px"}
          lineHeight={"20px"}
        >
          {new Date(billingDate).toLocaleString().split(",").at(0)}
        </Typography>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Chip
          label={
            <Typography
              textTransform={"capitalize"}
              color={"var(--success-700, #027a48)"}
              fontFamily={"Inter"}
              fontWeight={500}
              fontSize={"12px"}
              lineHeight={"18px"}
            >
              {status}
            </Typography>
          }
          style={{
            background: "var(--success-50, #ecfdf3)",
          }}
          icon={
            <Icon icon="uit:check" width={20} color="var(--success-500, #12b76a)" />
          }
        />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount) => (
        <Typography
          textTransform={"capitalize"}
          color={"var(--gray-600, #5d615a)"}
          fontFamily={"Inter"}
          fontWeight={400}
          fontSize={"14px"}
          lineHeight={"20px"}
        >
          ${String(amount ?? 0).slice(0, -2) || "0"}
        </Typography>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
    },
    {
      title: "",
      dataIndex: "action",
      width: "fit-content",
      render: (action) => (
        <Typography
          textTransform={"capitalize"}
          color={"var(--action-600, #155eef)"}
          fontFamily={"Inter"}
          fontWeight={600}
          fontSize={"14px"}
          lineHeight={"20px"}
        >
          <a href={action.download} download={action.download} target="_top">
            Download
          </a>
        </Typography>
      ),
    },
  ];
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  return (
    <Table
      style={{
        width: "100%",
        border: "1px solid var(--gray-200, #ddded6)",
        borderRadius: "12px",
      }}
      rowSelection={rowSelection}
      columns={columns}
      dataSource={structuringDataToDisplayIntable}
      locale={{
        emptyText: (
          <EmptyState
            icon="tabler:file-invoice"
            title="No invoices yet"
            description="Invoices for your subscription will appear here once they are issued."
            compact
          />
        ),
      }}
    />
  );
};

export default InvoiceTables;
