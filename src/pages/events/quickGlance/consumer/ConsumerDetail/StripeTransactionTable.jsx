import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Popconfirm, Table, Tooltip } from "antd";
import _ from "lodash";
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
import Choice from "../lostFee/Choice";
import ModalAddingDeviceFromSearchbar from "./AssigningDevice/components/ModalAddingDeviceFromSearchbar";
import ExpandedRowInTable from "./ExpandedRowInTable";
import { ReplaceDevice } from "./actions/ReplaceDevice";
import ReturningInBulkMethod from "./actions/ReturningInBulkMethod";
import Capturing from "./actions/deposit/Capturing";
import Releasing from "./actions/deposit/Releasing";
const { PropTypes } = pkg;

const StripeTransactionTable = ({ searchValue, refetchingTrigger }) => {
  const [openModal, setOpenModal] = useState(false);
  const [openCapturingDepositModal, setOpenCapturingDepositModal] =
    useState(false);
  const [openCancelingDepositModal, setOpenCancelingDepositModal] =
    useState(false);
  const [openReturnDeviceInBulkModal, setOpenReturnDeviceInBulkModal] =
    useState(false);
  const recordRef = useRef(null);
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.stripe);
  // const { user } = useSelector((state) => state.admin);
  const { triggerModal } = useSelector((state) => state.helper);
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
        provider: event.company,
        "consumerInfo.email": customer.email,
      }),
    enabled: false,
    refetchOnMount: false,
  });
  const stripeTransactionsSavedQuery = transactionsQuery?.data?.data?.list;
  const deviceAssignedListQuery = useQuery({
    queryKey: ["assginedDeviceList"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        user: customer.email,
        provider: event.company,
        eventSelected: event.eventInfoDetail.eventName,
      }),
    enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    transactionsQuery.refetch();
    deviceAssignedListQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [refetchingTrigger]);

  const refetchingFn = () => {
    return deviceAssignedListQuery.refetch();
  };
  const refetchingTransactionFn = () => {
    return transactionsQuery.refetch();
  };

  const filterDataBasedOnUserAndEvent = () => {
    if (stripeTransactionsSavedQuery) {
      const groupByPaymentIntent = _.groupBy(
        stripeTransactionsSavedQuery,
        "consumerInfo.email"
      );
      if (groupByPaymentIntent[customer.email]) {
        if (searchValue?.length < 1) {
          return groupByPaymentIntent[customer.email].filter((element) =>
            String(element.paymentIntent).includes(searchValue)
          );
        }
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
      console.log(transactionFound)
      return transactionFound;
    }
  };

  const sourceData = () => {
    const result = new Set();
    if (filterDataBasedOnUserAndEvent().length > 0) {
      for (let data of filterDataBasedOnUserAndEvent()) {
        result.add({
          key: data.id,
          ...data,
        });
      }
      const transactions = Array.from(result);
      if (String(searchValue).length > 0) {
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
      render: (paymentIntent) => <span style={Subtitle}>{paymentIntent}</span>,
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
            md={4}
            display={"flex"}
            alignItems={"center"}
          >
            {record.paymentIntent?.length > 16 && (
              <Popconfirm
                title="Releasing deposit? This action can not be reversed."
                onConfirm={() => {
                  setOpenCancelingDepositModal(true);
                  handleRecord(record);
                }}
              >
                <Button
                  underline="none"
                  disabled={!record.active}
                  style={{
                    ...CenteringGrid,
                    width: "100%",
                    border: `${
                      !record.active
                        ? "1px solid var(--blue-dark-600, #ffbbb6)"
                        : "1px solid var(--blue-dark-600, #B42318)"
                    }`,
                    borderRadius: "8px",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    padding: "5px",
                    background: `${!record.active ? "#ffbbb6" : "#B42318"}`,
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
            {record.paymentIntent?.length > 16 && (
              <Popconfirm
                title="Capturing deposit? This action can not be reversed."
                onConfirm={() => {
                  setOpenCapturingDepositModal(true);
                  handleRecord(record);
                }}
              >
                <Button
                  underline="none"
                  disabled={!record.active}
                  style={{
                    ...CenteringGrid,
                    width: "100%",
                    border: `${
                      !record.active
                        ? "1px solid var(--blue-dark-600, #ffbbb6)"
                        : "1px solid var(--blue-dark-600, #B42318)"
                    }`,
                    borderRadius: "8px",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    padding: "5px",
                    background: `${!record.active ? "#ffbbb6" : "#B42318"}`,
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
                  underline="none"
                  style={{
                    ...CenteringGrid,
                    width: "100%",
                    border: `${
                      !record.active
                        ? "1px solid var(--blue-dark-600, #ffbbb6)"
                        : "1px solid var(--blue-dark-600, #B42318)"
                    }`,
                    borderRadius: "8px",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    padding: "5px",
                    background: `${!record.active ? "#ffbbb6" : "#B42318"}`,
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
      {openModal && (
        <Choice openModal={openModal} setOpenModal={setOpenModal} />
      )}
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
      {triggerModal && <ReplaceDevice refetching={refetchingFn} />}
      {openModalToAssignDevice && <ModalAddingDeviceFromSearchbar />}
    </>
  );
};
export default StripeTransactionTable;
StripeTransactionTable.propTypes = {
  searchValue: PropTypes.string,
};

// const renderDataPerRow = (rowRecord) => {
// const foundTransactionAndDevicesAssigned = () => {
// if (foundAllTransactionsAndDevicesAssigned()) {
// const paymentIntentInRecord =
// foundAllTransactionsAndDevicesAssigned()[rowRecord.paymentIntent];
// if (paymentIntentInRecord) {
// return paymentIntentInRecord;
// }
// }
// return [];
// };
// const checkDevicesInTransaction = () => {
// const result = new Set();
// if (foundTransactionAndDevicesAssigned()) {
// for (let data of foundTransactionAndDevicesAssigned()) {
// result.add({ ...data.device });
// }
// }
// return Array.from(result);
// };
// const handleReturnSingleDevice = async (props) => {
// try {
// const deviceInPoolListQuery = await devitrakApi.post(
// "/receiver/receiver-pool-list",
// {
// eventSelected: event.eventInfoDetail.eventName,
// provider: event.company,
// device: props.serialNumber,
// type: props.deviceType,
// }
// );
// let returnedItem = {
// ...props,
// status: false,
// };
// const assignedDeviceData = _.groupBy(
// foundTransactionAndDevicesAssigned(),
// "device.serialNumber"
// );
// const respUpdate = await devitrakApi.patch(
// `/receiver/receiver-update/${
// assignedDeviceData[props.serialNumber].at(-1).id
// }`,
// {
// id: assignedDeviceData[props.serialNumber].at(-1).id,
// device: returnedItem,
// }
// );
// if (respUpdate.data) {
// if (deviceInPoolListQuery.data.receiversInventory.length > 0) {
// const dateString = new Date().toString();
// const dateRef = dateString.split(" ");
// const checkInPool =
// deviceInPoolListQuery.data.receiversInventory.at(-1);
// queryClient.invalidateQueries("assignedDeviceListQuery", {
// exact: true,
// });
// deviceAssignedListQuery.refetch();
// const deviceInPoolProfile = {
// id: checkInPool.id,
// activity: "No",
// };
// await devitrakApi.patch(
// `/receiver/receivers-pool-update/${deviceInPoolProfile.id}`,
// deviceInPoolProfile
// );
// await devitrakApi.post(
// "/nodemailer/confirm-returned-device-notification",
// {
// consumer: {
// name: `${customer.name} ${customer.lastName}`,
// email: customer.email,
// },
// device: {
// serialNumber: returnedItem.serialNumber,
// deviceType: returnedItem.deviceType,
// },
// event: event.eventInfoDetail.eventName,
// company: event.company,
// transaction: rowRecord.paymentIntent,
// date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
// time: dateRef[4],
// link: `https://app.devitrak.net/authentication/${encodeURI(
// event.eventInfoDetail.eventName
// )}/${encodeURI(event.company)}/${customer.uid}`,
// }
// );
// openNotificationWithIcon("success", "Device returned");
// }
// }
// } catch (error) {
// console.log(
// "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
// error
// );
// openNotificationWithIcon(
// "error",
// "Something went wrong, please try later!"
// );
// }
// };
//
// const handleAssignSingleDevice = async (props) => {
// try {
// const deviceInPoolListQuery = await devitrakApi.post(
// "/receiver/receiver-pool-list",
// {
// eventSelected: event.eventInfoDetail.eventName,
// provider: event.company,
// device: props.serialNumber,
// type: props.deviceType,
// }
// );
//
// let assignedItem = {
// ...props,
// status: true,
// };
// const findData = _.groupBy(
// foundTransactionAndDevicesAssigned(),
// "device.serialNumber"
// );
// const respUpdate = await devitrakApi.patch(
// `/receiver/receiver-update/${findData[props.serialNumber].at(-1).id}`,
// {
// id: findData[props.serialNumber].at(-1).id,
// device: assignedItem,
// }
// );
// if (respUpdate.data.ok) {
// if (deviceInPoolListQuery.data.receiversInventory.length > 0) {
// const dateString = new Date().toString();
// const dateRef = dateString.split(" ");
// const devicePoolData =
// deviceInPoolListQuery.data.receiversInventory.at(-1);
// queryClient.invalidateQueries("assignedDeviceListQuery", {
// exact: true,
// });
// deviceAssignedListQuery.refetch();
// const deviceInPoolProfile = {
// ...devicePoolData,
// activity: "YES",
// };
// await devitrakApi.patch(
// `/receiver/receivers-pool-update/${devicePoolData.id}`,
// deviceInPoolProfile
// );
// await devitrakApi.post("/nodemailer/assignig-device-notification", {
// consumer: {
// name: `${customer.name} ${customer.lastName}`,
// email: customer.email,
// },
// device: {
// serialNumber: assignedItem.serialNumber,
// deviceType: assignedItem.deviceType,
// },
// event: event.eventInfoDetail.eventName,
// company: event.company,
// transaction: rowRecord.paymentIntent,
// date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
// time: dateRef[4],
// link: `https://app.devitrak.net/authentication/${encodeURI(
// event.eventInfoDetail.eventName
// )}/${encodeURI(event.company)}/${customer.uid}`,
// });
// openNotificationWithIcon("success", "Device assigned");
// }
// }
// } catch (error) {
// console.log(
// "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
// error
// );
// openNotificationWithIcon(
// "error",
// "Something went wrong, please try later!"
// );
// }
// };
// const handleLostSingleDevice = (props) => {
// try {
// const findData = _.groupBy(
// foundTransactionAndDevicesAssigned(),
// "device.serialNumber"
// );
// setOpenModal(true);
// dispatch(onReceiverObjectToReplace(props));
// dispatch(
// onAddDevicesAssignedInPaymentIntent(findData[props.serialNumber])
// );
// handleRecord(props);
// } catch (error) {
// console.log(
// "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
// error
// );
// openNotificationWithIcon(
// "error",
// "Something went wrong, please try later!"
// );
// }
// };
// const checkingRenderBackgroundColor = (props, col1, col2, col3) => {
// if (typeof props === "string") {
// return col1;
// } else {
// if (props) return col2;
// return col3;
// }
// };
// const checkingRenderStatus = (props) => {
// if (typeof props === "string") {
// return props;
// } else {
// return props ? "In-use" : "Returned";
// }
// };
//
// const columns = [
// {
// title: "Device serial number",
// dataIndex: "serialNumber",
// key: "serialNumber",
// ...getColumnSearchProps("serialNumber"),
// sorter: {
// compare: (a, b) =>
// ("" + a.serialNumber).localeCompare(b.serialNumber),
// },
// sortDirections: ["descend", "ascend"],
// width: "30%",
// },
// {
// title: "Type",
// dataIndex: "deviceType",
// key: "deviceType",
// width: "20%",
// responsive: ["lg"],
// sorter: {
// compare: (a, b) => ("" + a.deviceType).localeCompare(b.deviceType),
// },
// sortDirections: ["descend", "ascend"],
// render: (deviceType) => (
// <span>
{
  /* <Typography */
}
// textTransform={"capitalize"}
// textAlign={"left"}
// fontWeight={400}
// fontSize={"14px"}
// fontFamily={"Inter"}
// lineHeight={"24px"}
// color={""}
// >
{
  /* {deviceType} */
}
{
  /* </Typography> */
}
{
  /* </span> */
}
// ),
// },
// {
// title: "Status",
// dataIndex: "status",
// key: "status",
// sorter: {
// compare: (a, b) => ("" + a.status).localeCompare(b.status),
// },
// sortDirections: ["descend", "ascend"],
// render: (status) => (
// <span
// style={{
// width: "fit-content",
// padding: "5px",
// borderRadius: "8px",
// display: "flex",
// alignItems: "center",
// backgroundColor: checkingRenderBackgroundColor(
// status,
// "#ffb5b5",
// "#ffe4b5",
// "#ECFDF3"
// ),
// color: checkingRenderBackgroundColor(
// status,
// "#ad0101",
// "#714904",
// "#027A48"
// ),
// }}
// >
{
  /* <p */
}
// style={{
// textTransform: "none",
// textAlign: "left",
// fontWeight: 400,
// fontSize: "14px",
// fontFamily: "Inter",
// lineHeight: "24px",
// }}
// >
{
  /* {checkingRenderStatus(status)} */
}
{
  /* </p> */
}
{
  /* </span> */
}
// ),
// },
// {
// title: "Action",
// dataIndex: "action",
// key: "action",
// width: "10%",
// render: (_, record) => (
// <Space size="middle">
{
  /* {record.status === "Lost" || record.status === false ? ( */
}
// <button
// onClick={() => handleAssignSingleDevice(record)}
// disabled={String(record.status).toLowerCase() === "lost"}
// style={{
// width: "fit-content",
// border: `${
// String(record.status).toLowerCase() === "lost"
// ? "1px solid var(--disabled-blue-button)"
// : "1px solid var(--blue-dark-600, #155EEF)"
// }`,
// backgroundColor: `${
// String(record.status).toLowerCase() === "lost"
// ? "var(--disabled-blue-button)"
// : "var(--blue-dark-600, #155EEF)"
// }`,
// borderRadius: "8px",
// boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
// padding: "5px",
// }}
// >
{
  /* <p */
}
// style={{
// cursor: "pointer",
// textTransform: "none",
// textAlign: "left",
// fontWeight: 400,
// fontSize: "16px",
// fontFamily: "Inter",
// lineHeight: "24px",
// color: "var(--basewhite)",
// }}
// >
{
  /* Assign */
}
{
  /* </p> */
}
{
  /* </button> */
}
// ) : (
// <button
// onClick={() => handleReturnSingleDevice(record)}
// disabled={!event.active}
// style={{
// width: "fit-content",
// border: "1px solid var(--error-700, #B42318)",
// backgroundColor: "var(--error-700, #B42318)",
// borderRadius: "8px",
// boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
// padding: "5px",
// color: "#B42318",
// }}
// >
{
  /* <p */
}
// style={{
// cursor: "pointer",
// textTransform: "none",
// textAlign: "left",
// fontWeight: 400,
// fontSize: "16px",
// fontFamily: "Inter",
// lineHeight: "24px",
// color: "var(--basewhite)",
// }}
// >
{
  /* Return */
}
{
  /* </p> */
}
{
  /* </button> */
}
// )}
{
  /* {record.status === true && ( */
}
// <button
// onClick={() => {
// dispatch(onTriggerModalToReplaceReceiver(true));
// dispatch(onReceiverObjectToReplace(record));
// handleRecord(rowRecord);
// }}
// disabled={!event.active}
// style={{
// width: "fit-content",
// border: "1px solid var(--blue-dark-600, #155EEF)",
// backgroundColor: "var(--blue-dark-600, #155EEF)",
// borderRadius: "8px",
// boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
// padding: "5px",
// }}
// >
{
  /* <p */
}
// style={{
// cursor: "pointer",
// textTransform: "none",
// textAlign: "left",
// fontWeight: 400,
// fontSize: "16px",
// fontFamily: "Inter",
// lineHeight: "24px",
// color: "var(--basewhite)",
// }}
// >
{
  /* Replace */
}
{
  /* </p> */
}
{
  /* </button> */
}
// )}
{
  /* {record.status === true && */
}
// event.staff.adminUser.some(
// (element) => element.email === user.email
// ) && (
// <Popconfirm
// title="Are you sure it is lost?"
// onConfirm={() => handleLostSingleDevice(record)}
// >
{
  /* {/* <div */
}
// disabled={!event.active}
// style={{
// width: "fit-content",
// border: "1px solid var(--blue-dark-600, #155EEF)",
// backgroundColor:"var(--blue-dark-600, #155EEF)",
// borderRadius: "8px",
// boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
// padding: "5px",
// }}
// > */}
{
  /* <p */
}
// style={{
// cursor: "pointer",
// textTransform: "none",
// textAlign: "left",
// fontWeight: 400,
// fontSize: "16px",
// fontFamily: "Inter",
// lineHeight: "24px",
// color: "#000",
// }}
// >
{
  /* Lost */
}
{
  /* </p> */
}
// </div>
{
  /* </Popconfirm> */
}
// )}
{
  /* </Space> */
}
// ),
// },
// ];
// return (
// <>
{
  /* <div */
}
// style={{
// display: `${
// checkDevicesInTransaction().length >=
// rowRecord.device[0].deviceNeeded && "none"
// }`,
// }}
// >
{
  /* {checkDevicesInTransaction().length !== */
}
// rowRecord.device[0].deviceNeeded && (
// <AddingDevicesToPaymentIntent
// refetchingFn={refetchingFn}
// record={rowRecord}
// />
// )}
{
  /* </div> */
}
{
  /* {checkDevicesInTransaction()?.length > 0 && ( */
}
// <Table
// columns={columns}
// dataSource={checkDevicesInTransaction()}
// pagination={{
// position: ["bottomLeft"],
// }}
// />
// )}
{
  /* </> */
}
// );
// };
//
