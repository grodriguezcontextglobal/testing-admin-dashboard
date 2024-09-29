import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Popconfirm, Table, Tooltip, Button } from "antd";
import pkg from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import "../../../../../styles/global/ant-table.css";
const { PropTypes } = pkg;
import ModalAddingDeviceFromSearchbar from "./AssigningDevice/components/ModalAddingDeviceFromSearchbar";
import ExpandedRowInTable from "./ExpandedRowInTable";
import ReturningInBulkMethod from "./actions/ReturningInBulkMethod";
import Capturing from "./actions/deposit/Capturing";
import Releasing from "./actions/deposit/Releasing";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { DangerButton } from "../../../../../styles/global/DangerButton";

const StripeTransactionTable = ({ searchValue, triggering }) => {
  const [openCapturingDepositModal, setOpenCapturingDepositModal] =
    useState(false);
  const [openCancelingDepositModal, setOpenCancelingDepositModal] =
    useState(false);
  const [openReturnDeviceInBulkModal, setOpenReturnDeviceInBulkModal] =
    useState(false);
  const recordRef = useRef(null);
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { openModalToAssignDevice } = useSelector(
    (state) => state.devicesHandle
  );
  const dispatch = useDispatch();
  // const queryClient = useQueryClient();
  const transactionsQuery = useQuery({
    queryKey: ["transactionPerConsumerListQuery"],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        "consumerInfo.id": customer.id,
      }),
    refetchOnMount: false,
  });
  const stripeTransactionsSavedQuery = transactionsQuery?.data?.data?.list;
  const deviceAssignedListQuery = useQuery({
    queryKey: ["assginedDeviceList"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        user: customer.email,
        company: user.companyData.id,
        eventSelected: event.eventInfoDetail.eventName,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    transactionsQuery.refetch();
    deviceAssignedListQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [triggering]);

  const refetchingFn = () => {
    return deviceAssignedListQuery.refetch();
  };
  const refetchingTransactionFn = () => {
    return transactionsQuery.refetch();
  };

  const filterDataBasedOnUserAndEvent = () => {
    if (stripeTransactionsSavedQuery) {
      if (searchValue?.length < 1) {
        return stripeTransactionsSavedQuery.filter((element) =>
          JSON.stringify(element).includes(searchValue)
        );
      } else {
        return [];
      }
    }
    return [];
  };

  const searchingTransaction = (props) => {
    if (Array.isArray(props)) {
      const transactionFound = props.filter((element) =>
        JSON.stringify(element)
          .toLowerCase()
          .includes(String(searchValue).toLowerCase())
      );
      // console.log(transactionFound);
      return transactionFound;
    }
  };

  const sourceData = () => {
    const result = new Set();
    if (filterDataBasedOnUserAndEvent()?.length > 0) {
      for (let data of filterDataBasedOnUserAndEvent()) {
        result.add({
          key: data.id,
          ...data,
        });
      }
      const transactions = Array.from(result);
      if (String(searchValue)?.length > 0) {
        return searchingTransaction(transactions);
      }
      return transactions;
    }
    return [];
  };
  const handleRecord = (record) => {
    dispatch(onAddPaymentIntentSelected(record.paymentIntent));
    dispatch(onAddPaymentIntentDetailSelected({ ...record }));
  };
  const handleReturnDeviceInBulk = (record) => {
    setOpenReturnDeviceInBulkModal(true);
    return (recordRef.current = record);
  };
  //*nested table starts here
  //!nested table ends
  const cellStyle = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  };

  const columns = [
    {
      title: `Date and time`,
      dataIndex: "paymentIntent",
      key: "paymentIntent",
      responsive: ["md", "lg"],
      render: (_, record) => (
        <span style={Subtitle}>{new Date(`${record.date}`).toUTCString()}</span>
      ),
    },
    {
      title: "Transaction ID",
      dataIndex: "paymentIntent",
      key: "paymentIntent",
      render: (paymentIntent) => {
        const checkPaymentIntent = String(paymentIntent).split("_");
        // console.log(checkPaymentIntent)
        return (
          <span style={{ ...Subtitle, textOverflow: "ellipsis" }}>
            {checkPaymentIntent[1] === "cash"
              ? `${checkPaymentIntent[1]}_${checkPaymentIntent[2]}_${String(
                  checkPaymentIntent[4].split("**")[1]
                )}`
              : paymentIntent}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "device",
      key: "device",
      responsive: ["lg"],
      render: (_, record) => (
        <span style={Subtitle}>
          {" "}
          <Typography style={Subtitle}>
            {record.device[0].deviceNeeded}{" "}
            {record.device[0].deviceNeeded > 1 ? "devices" : "device"}
          </Typography>
        </span>
      ),
    },
    {
      title: "",
      dataIndex: "action",
      key: "action",
      width: "fit-content",
      align: "right",
      fixed: "right",
      render: (_, record) => (
        <Grid container spacing={1}>
          <Grid
            item
            xs={12}
            sm={12}
            md={record.device[0].deviceNeeded < 1 ? 12 : 4}
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
          >
            {record.paymentIntent?.length > 16 &&
              record.device[0].deviceNeeded < 1 && (
                <span
                  style={{
                    ...cellStyle,
                    borderRadius: "16px",
                    justifyContent: "center",
                    display: "flex",
                    padding: "2px 8px",
                    alignItems: "center",
                    background: `${"var(--success-50, #ECFDF3)"}`,
                    width: "fit-content",
                  }}
                >
                  <Typography
                    style={{
                      ...Subtitle,
                      color: "var(--success-700, #027A48)",
                    }}
                    textTransform={"capitalize"}
                  >
                    {String(record.device[0].deviceType)
                      .split(" ")
                      .toLocaleString()
                      .replaceAll(",", " ")}
                  </Typography>
                </span>
              )}
            {record.paymentIntent?.length > 16 &&
              record.device[0].deviceNeeded > 0 && (
                <Popconfirm
                  title="Releasing deposit? This action can not be reversed."
                  onConfirm={() => {
                    setOpenCancelingDepositModal(true);
                    handleRecord(record);
                  }}
                >
                  <Button
                    disabled={!record.active}
                    style={{
                      ...CenteringGrid,
                      ...DangerButton,
                      width: "100%",
                      border: `${
                        !record.active
                          ? "1px solid var(--disabled-danger-button)"
                          : DangerButton.border
                      }`,
                      background: `${
                        !record.active
                          ? "var(--disabled-danger-button)"
                          : DangerButton.background
                      }`,
                    }}
                  >
                    <Typography
                      textTransform={"none"}
                      style={{
                        ...BlueButtonText,
                      }}
                    >
                      Release
                    </Typography>
                  </Button>
                </Popconfirm>
              )}
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            display={"flex"}
            alignItems={"center"}
          >
            {record.paymentIntent?.length > 16 &&
              record.device[0].deviceNeeded > 0 && (
                <Popconfirm
                  title="Capturing deposit? This action can not be reversed."
                  onConfirm={() => {
                    setOpenCapturingDepositModal(true);
                    handleRecord(record);
                  }}
                >
                  <Button
                    disabled={!record.active}
                    style={{
                      ...CenteringGrid,
                      ...BlueButton,
                      width: "100%",
                      background: `${
                        !record.active
                          ? "var(--disabled-blue-button)"
                          : BlueButton.background
                      }`,
                    }}
                  >
                    <Typography textTransform={"none"} style={BlueButtonText}>
                      Capture
                    </Typography>
                  </Button>
                </Popconfirm>
              )}
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            display={"flex"}
            alignItems={"center"}
          >
            {record.device[0].deviceNeeded > 4 && (
              <Tooltip title="This option is to return bulk of devices">
                <Button
                  onClick={() => handleReturnDeviceInBulk(record)}
                  style={{
                    ...CenteringGrid,
                    ...DangerButton,
                    width: "100%",
                    border: `${
                      !record.active
                        ? "1px solid var(--disabled-danger-button)"
                        : DangerButton.border
                    }`,
                    background: `${
                      !record.active
                        ? "var(--disabled-danger-button)"
                        : DangerButton.background
                    }`,
                  }}
              >
                  <Typography
                    textTransform={"none"}
                    style={{
                      ...BlueButtonText,
                      cursor: "pointer",
                      color: "#fff",
                    }}
                  >
                    Bulk
                  </Typography>
                </Button>
              </Tooltip>
            )}
          </Grid>
        </Grid>
      ),
    },
  ];
  return (
    <>
      <Table
        columns={columns}
        dataSource={sourceData()}
        className="table-ant-customized"
        pagination={{
          position: ["bottomCenter"],
        }}
        style={{ cursor: "pointer" }}
        expandable={{
          expandIcon: (record) => {
            if (record.expanded) {
              return (
                <Icon
                  icon="mdi:arrow-collapse"
                  width={20}
                  color="var(--gray300)"
                />
              );
            } else {
              return (
                <Icon
                  icon="mdi:arrow-expand"
                  width={20}
                  color="var(--gray300)"
                />
              );
            }
          },
          expandRowByClick: true,
          expandedRowRender: (record) => (
            <ExpandedRowInTable rowRecord={record} />
          ),
          // renderDataPerRow(record),
        }}
      />
      {openCapturingDepositModal && (
        <Capturing
          openCapturingDepositModal={openCapturingDepositModal}
          setOpenCapturingDepositModal={setOpenCapturingDepositModal}
          refetchingTransactionFn={refetchingTransactionFn}
        />
      )}
      {openCancelingDepositModal && (
        <Releasing
          openCancelingDepositModal={openCancelingDepositModal}
          setOpenCancelingDepositModal={setOpenCancelingDepositModal}
          refetchingTransactionFn={refetchingTransactionFn}
        />
      )}
      {openReturnDeviceInBulkModal && (
        <ReturningInBulkMethod
          openReturnDeviceBulkModal={openReturnDeviceInBulkModal}
          setOpenReturnDeviceInBulkModal={setOpenReturnDeviceInBulkModal}
          record={recordRef.current}
          refetching={refetchingFn}
        />
      )}
      {openModalToAssignDevice && <ModalAddingDeviceFromSearchbar />}
    </>
  );
};
export default StripeTransactionTable;
StripeTransactionTable.propTypes = {
  searchValue: PropTypes.string,
};

// borderRadius: "8px",
// boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
// padding: "5px",
// border: `${
//   !record.active
//     ? "1px solid #ffbbb6"
//     : "1px solid #B42318"
// }`,
// background: `${!record.active ? "#ffbbb6" : "#B42318"}`,
