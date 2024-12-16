import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, message, Popconfirm, Table } from "antd";
import pkg from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import "../../../../../styles/global/ant-table.css";
import ModalAddingDeviceFromSearchbar from "./AssigningDevice/components/ModalAddingDeviceFromSearchbar";
import ExpandedRowInTable from "./ExpandedRowInTable";
// import ReturningInBulkMethod from "./actions/ReturningInBulkMethod";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import Capturing from "./actions/deposit/Capturing";
import Releasing from "./actions/deposit/Releasing";
const { PropTypes } = pkg;

const StripeTransactionTable = ({ searchValue, triggering }) => {
  const [openCapturingDepositModal, setOpenCapturingDepositModal] =
    useState(false);
  const [openCancelingDepositModal, setOpenCancelingDepositModal] =
    useState(false);
  // const [openReturnDeviceInBulkModal, setOpenReturnDeviceInBulkModal] =
  //   useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const recordRef = useRef(null);
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { openModalToAssignDevice } = useSelector(
    (state) => state.devicesHandle
  );
  const dispatch = useDispatch();
  // const queryClient = useQueryClient();
  const transactionsQuery = useQuery({
    queryKey: ["transactionPerConsumerListQuery", customer.uid],
    queryFn: () =>
      devitrakApi.get(
        `/transaction/transaction?event_id=${event.id}&company=${
          user.companyData.id
        }&consumerInfo.id=${customer.id ?? customer.uid}`
      ),
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
      return transactionFound;
    }
  };

  const sourceData = () => {
    const result = new Set();
    if (filterDataBasedOnUserAndEvent()?.length > 0) {
      for (let data of filterDataBasedOnUserAndEvent()) {
        result.add({
          key: data.paymentIntent,
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
  // const handleReturnDeviceInBulk = (record) => {
  //   setOpenReturnDeviceInBulkModal(true);
  //   return (recordRef.current = record);
  // };

  const cellStyle = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  };

  const handleRefund = async (record) => {
    try {
      setIsLoading(true);
      await devitrakApi.post(`/stripe/refund`, {
        paymentIntent: record.paymentIntent,
      });
      await devitrakApi.patch(`/transaction/update-transaction/${record.id}`, {
        id:record.id,
        active: false,
      });
      const emailTemplate = {
        email: customer.email,
        amount: String(record.device[0].deviceValue),
        date: new Date().toString().slice(4, 15),
        paymentIntent: record.paymentIntent,
        customer: `${customer.name} ${customer.lastName}`,
      };
      await devitrakApi.post("/nodemailer/refund-notification", emailTemplate);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      message.error(`There was an error. ${error}`);
    }
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
                    // justifyContent: "center",
                    display: "flex",
                    padding: "2px 8px",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: `${"var(--success-50, #ECFDF3)"}`,
                    width: "100%",
                  }}
                >
                  <p
                    style={{
                      ...Subtitle,
                      color: "var(--success-700, #027A48)",
                      textTransform: "capitalize",
                    }}
                  >
                    {String(record.device[0].deviceType)
                      .split(" ")
                      .toLocaleString()
                      .replaceAll(",", " ")}
                  </p>
                  <div style={{ padding: "2px 8px" }}>
                    <Button
                      loading={isLoading}
                      disabled={!record.active}
                      style={{
                        ...CenteringGrid,
                        ...DangerButton,
                        background: `${
                          !record.active
                            ? GrayButton.background
                            : DangerButton.backgroundColor
                        }`,
                        border: `${
                          !record.active
                            ? GrayButton.border
                            : DangerButton.border
                        }`,
                      }}
                      onClick={() => handleRefund(record)}
                    >
                      {record.active ? (
                        <p style={DangerButtonText}>Refund</p>
                      ) : (
                        <p style={GrayButtonText}>Refunded</p>
                      )}
                    </Button>
                  </div>
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
                      Release deposit
                    </Typography>
                  </Button>
                </Popconfirm>
              )}
          </Grid>
          {record.paymentIntent?.length > 16 &&
            record.device[0].deviceNeeded > 0 && (
              <Grid
                item
                xs={12}
                sm={12}
                md={4}
                display={"flex"}
                alignItems={"center"}
              >
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
                      Capture fund
                    </Typography>
                  </Button>
                </Popconfirm>
              </Grid>
            )}
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
            <ExpandedRowInTable rowRecord={record} refetching={refetchingFn} />
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
      {/* {openReturnDeviceInBulkModal && (
        <ReturningInBulkMethod
          openReturnDeviceBulkModal={openReturnDeviceInBulkModal}
          setOpenReturnDeviceInBulkModal={setOpenReturnDeviceInBulkModal}
          record={recordRef.current}
          refetching={refetchingFn}
        />
      )} */}
      {openModalToAssignDevice && <ModalAddingDeviceFromSearchbar />}
    </>
  );
};
export default StripeTransactionTable;
StripeTransactionTable.propTypes = {
  searchValue: PropTypes.string,
};
