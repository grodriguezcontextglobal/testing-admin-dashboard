import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { DownNarrow, UpNarrowIcon } from "../../../components/icons/Icons";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
import ExpandedRow from "./ExpandedRow";

const TransactionTableRefactoring = () => {
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const customerInfoTemplate = {
    ...customer,
    id: customer.id ?? customer.uid,
  }
  const [responsedData, setResponsedData] = useState([]);
  const [sqlLeasePerConsumer, setSqlLeasePerConsumer] = useState([]);
  const transactionsPerConsumer = useQuery({
    queryKey: ["transactionsPerConsumerInTable", customerInfoTemplate.id],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        company: user.companyData.id,
        "consumerInfo.id": customerInfoTemplate.id,
      }),
    refetchOnMount: false,
  });
  const consumerInfoSqlQuery = useQuery({
    queryKey: ["consumerInfoSql", customerInfoTemplate.email],
    queryFn: () =>
      devitrakApi.post("/db_consumer/consulting-consumer", {
        email: customerInfoTemplate.email,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    transactionsPerConsumer.refetch();
    consumerInfoSqlQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [customerInfoTemplate.id]);

  const leasePerConsumer = async () => {
    const response = await devitrakApi
      .post("/db_lease/consulting-consumer-lease", {
        consumer_member_id:
        consumerInfoSqlQuery.data.data.consumer[0].consumer_id,
        company_id: user.sqlInfo.company_id,
      })
      .then((response) => response.data);
    if (response.ok) return setSqlLeasePerConsumer([...response.lease]);
  };
  useEffect(() => {
    const controller = new AbortController();
    leasePerConsumer();
    return () => {
      controller.abort();
    };
  }, [consumerInfoSqlQuery.data]);

  const retrievedData = useRef();
  const gettingAllDeviceFromTransactionFound = (props) => {
    const result = new Set();
    for (let data of props) {
      result.add(data);
    }
    return (retrievedData.current = Array.from(result));
  };
  const retrieveData = async (props) => {
    const resp = await devitrakApi
      .post(`/receiver/receiver-assigned-list`, {
        paymentIntent: props,
      })
      .then((response) => response.data);
    return await gettingAllDeviceFromTransactionFound(resp.listOfReceivers);
  };
  const formatting = async () => {
    if (transactionsPerConsumer.data) {
      const dataTransactions = transactionsPerConsumer?.data?.data?.list;
      const data = [...dataTransactions, ...sqlLeasePerConsumer]; 
      const result = new Set();
      for (let item of data) {
        retrieveData(item.paymentIntent);
        result.add({
          key: item.paymentIntent,
          date: item.date,
          paymentIntent: item.paymentIntent,
          eventSelected: item.eventSelected,
          device: item.device[0].deviceNeeded,
          data: item,
          transaction: retrievedData.current,
        });
      }
      const gottenData = Array.from(result);
      const addingValue = [...gottenData];
      return setResponsedData(addingValue);
    }
    return [];
  };
  useEffect(() => {
    const controller = new AbortController();
    formatting();
    return () => {
      controller.abort();
    };
  }, [transactionsPerConsumer.data, consumerInfoSqlQuery.data]);

  const columns = [
    {
      title: "Transaction date",
      dataIndex: "date",
      key: "date",
      render: (date) => {
        const dateFormatting = new Date(date).toString().split(" ");
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p style={Subtitle}>
              {dateFormatting.slice(1, 5).toString().replaceAll(",", " ")}
            </p>
          </div>
        );
      },
    },
    {
      title: "Transaction ID",
      dataIndex: "paymentIntent",
      key: "paymentIntent",
      render: (paymentIntent) => {
        const checkPaymentID = String(paymentIntent).split("_");
        return (
          <p style={Subtitle}>
            {checkPaymentID[1] === "cash"
              ? `${checkPaymentID[1]} ${checkPaymentID[2]} ${
                  String(checkPaymentID[4]).split("**")[1]
                }`
              : `${checkPaymentID[0]}_${checkPaymentID[1]}`}
          </p>
        );
      },
    },
    {
      title: "Event",
      dataIndex: "eventSelected",
      key: "eventSelected",
      width: "20%",
      render: (eventSelected) => {
        return <p style={Subtitle}>{eventSelected}</p>;
      },
    },
    {
      title: "Amount of devices",
      dataIndex: "device",
      key: "device",
      responsive: ["lg"],
      width: "15%",
      render: (_, record) => (
        <p style={Subtitle}>
          {record.device} {record.device > 1 ? "devices" : "device"}&nbsp;
        </p>
      ),
    },
    {
      title: "Open/Close details",
      dataIndex: "action",
      key: "action",
      width: "15%",
      responsive: ["md"],
      render: (_, record) => {
        const checkPaymentID = String(record.paymentIntent).split("_");
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              width: "100%",
              gap: "5px",
            }}
          >
            <button
              style={{
                ...DangerButton,
                ...CenteringGrid,
                outline: "none",
                display: `${
                  checkPaymentID[1] === "cash" || checkPaymentID[1].length < 13
                    ? "none"
                    : "flex"
                }`,
              }}
            >
              <p
                style={{
                  ...DangerButtonText,
                  display: `${
                    checkPaymentID[1] === "cash" ||
                    checkPaymentID[1].length < 13
                      ? "none"
                      : "flex"
                  }`,
                  border: "transparent",
                  outline: "none",
                }}
              >
                Capture
              </p>
            </button>

            <button
              style={{
                ...BlueButton,
                ...CenteringGrid,
                outline: "none",
                display: `${
                  checkPaymentID[1] === "cash" || checkPaymentID[1].length < 13
                    ? "none"
                    : "flex"
                }`,
              }}
            >
              <p
                style={{
                  ...BlueButtonText,
                  display: `${
                    checkPaymentID[1] === "cash" ||
                    checkPaymentID[1].length < 13
                      ? "none"
                      : "flex"
                  }`,
                  border: "transparent",
                  outline: "none",
                }}
              >
                Release
              </p>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      expandable={{
        expandIconColumnIndex: 5,
        expandIcon: (record) => {
          return record.expanded ? (
            <div style={{ width: "100%", textAlign: "right" }}>
              <UpNarrowIcon />
            </div>
          ) : (
            <div style={{ width: "100%", textAlign: "right" }}>
              <DownNarrow />
            </div>
          );
        },
        expandRowByClick: true,
        expandedRowRender: (record) => (
          <ExpandedRow rowRecord={record} refetching={null} />
        ),
      }}
      dataSource={responsedData}
      className="table-ant-customized"
      pagination={{
        position: ["bottomCenter"],
      }}
      style={{ cursor: "pointer" }}
    />
  );
};

export default TransactionTableRefactoring;
