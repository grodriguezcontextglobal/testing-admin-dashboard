import { Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popconfirm, Space, Table, notification } from "antd";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  onReceiverObjectToReplace,
  onTriggerModalToReplaceReceiver,
} from "../../../../../store/slices/helperSlice";
import {
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import "../../../../../styles/global/ant-table.css";
import Choice from "../lostFee/Choice";
import AddingDevicesToPaymentIntent from "./AssigningDevice/AddingDevicesToPaymentIntent";
import { ReplaceDevice } from "./actions/ReplaceDevice";
import EmailStructureUpdateItem from "../../../../../classes/emailStructureUpdateItem";
const ExpandedRowInTable = ({ rowRecord }) => {
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const [openModal, setOpenModal] = useState(false);
  const { triggerModal } = useSelector((state) => state.helper);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
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
  const deviceAssignedListQuery = useQuery({
    queryKey: ["assginedDeviceList"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        user: customer.email,
        company: user.companyData.id,
        eventSelected: event.eventInfoDetail.eventName,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    transactionsQuery.refetch();
    deviceAssignedListQuery.refetch();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetchingFn = () => {
    return deviceAssignedListQuery.refetch();
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (message) => {
    api.open({
      message: message,
      placement: "bottomRight",
    });
  };

  const foundAllTransactionsAndDevicesAssigned = () => {
    const assignedDevices =
      deviceAssignedListQuery?.data?.data?.listOfReceivers;
    if (assignedDevices?.length > 0) {
      const groupByPaymentIntent = _.groupBy(assignedDevices, "paymentIntent");
      if (groupByPaymentIntent) return groupByPaymentIntent;
      return [];
    }
    return [];
  };

  const handleRecord = (record) => {
    dispatch(onAddPaymentIntentSelected(record.paymentIntent));
    dispatch(onAddPaymentIntentDetailSelected({ ...record }));
  };
  const foundTransactionAndDevicesAssigned = () => {
    if (foundAllTransactionsAndDevicesAssigned()) {
      const paymentIntentInRecord =
        foundAllTransactionsAndDevicesAssigned()[rowRecord.paymentIntent];
      if (paymentIntentInRecord) {
        return paymentIntentInRecord;
      }
    }
    return [];
  };
  const checkDevicesInTransaction = () => {
    const result = new Set();
    if (foundTransactionAndDevicesAssigned()) {
      for (let data of foundTransactionAndDevicesAssigned()) {
        result.add({ ...data.device });
      }
    }
    return Array.from(result);
  };
  const handleReturnSingleDevice = async (props) => {
    try {
      const deviceInPoolListQuery = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          eventSelected: event.eventInfoDetail.eventName,
          company: user.companyData.id,
          device: props.serialNumber,
          type: props.deviceType,
        }
      );
      let returnedItem = {
        ...props,
        status: false,
      };
      const assignedDeviceData = _.groupBy(
        foundTransactionAndDevicesAssigned(),
        "device.serialNumber"
      );
      const respUpdate = await devitrakApi.patch(
        `/receiver/receiver-update/${
          assignedDeviceData[props.serialNumber].at(-1).id
        }`,
        {
          id: assignedDeviceData[props.serialNumber].at(-1).id,
          device: returnedItem,
        }
      );
      if (respUpdate.data) {
        if (deviceInPoolListQuery.data.receiversInventory?.length > 0) {
          const dateString = new Date().toString();
          const dateRef = dateString.split(" ");
          const checkInPool =
            deviceInPoolListQuery.data.receiversInventory.at(-1);
          queryClient.invalidateQueries("assignedDeviceListQuery", {
            exact: true,
          });
          deviceAssignedListQuery.refetch();
          const deviceInPoolProfile = {
            id: checkInPool.id,
            activity: false,
          };
          await devitrakApi.patch(
            `/receiver/receivers-pool-update/${deviceInPoolProfile.id}`,
            deviceInPoolProfile
          );
          const linkStructure = `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`;
          const emailStructure = new EmailStructureUpdateItem(
            customer.name,
            customer.lastName,
            customer.email,
            returnedItem.serialNumber,
            returnedItem.deviceType,
            event.eventInfoDetail.eventName,
            event.company,
            rowRecord.paymentIntent,
            String(dateRef.slice(0, 4)).replaceAll(",", " "),
            dateRef[4],
            linkStructure
          );
          await devitrakApi.post(
            "/nodemailer/confirm-returned-device-notification",
            emailStructure.render()
          );
          openNotificationWithIcon("Device returned.");
        }
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
        error
      );
    }
  };

  const handleAssignSingleDevice = async (props) => {
    try {
      const deviceInPoolListQuery = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          eventSelected: event.eventInfoDetail.eventName,
          company: user.companyData.id,
          device: props.serialNumber,
          type: props.deviceType,
        }
      );
      if (deviceInPoolListQuery.data.receiversInventory.at(-1).activity)
        return alert(
          `Device is already in use for another consumer. Please assign another device serial number.`
        );

      let assignedItem = {
        ...props,
        status: true,
      };
      const findData = _.groupBy(
        foundTransactionAndDevicesAssigned(),
        "device.serialNumber"
      );
      const respUpdate = await devitrakApi.patch(
        `/receiver/receiver-update/${findData[props.serialNumber].at(-1).id}`,
        {
          id: findData[props.serialNumber].at(-1).id,
          device: assignedItem,
        }
      );
      if (respUpdate.data.ok) {
        if (deviceInPoolListQuery.data.receiversInventory?.length > 0) {
          const dateString = new Date().toString();
          const dateRef = dateString.split(" ");
          const devicePoolData =
            deviceInPoolListQuery.data.receiversInventory.at(-1);
          queryClient.invalidateQueries("assignedDeviceListQuery", {
            exact: true,
          });
          deviceAssignedListQuery.refetch();
          const deviceInPoolProfile = {
            ...devicePoolData,
            activity: true,
          };

          await devitrakApi.patch(
            `/receiver/receivers-pool-update/${devicePoolData.id}`,
            deviceInPoolProfile
          );
          const linkStructure = `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`;

          const emailStructure = new EmailStructureUpdateItem(
            customer.name,
            customer.lastName,
            customer.email,
            assignedItem.serialNumber,
            assignedItem.deviceType,
            event.eventInfoDetail.eventName,
            event.company,
            rowRecord.paymentIntent,
            String(dateRef.slice(0, 4)).replaceAll(",", " "),
            dateRef[4],
            linkStructure
          );
          await devitrakApi.post(
            "/nodemailer/assignig-device-notification",
            emailStructure.render()
          );
          openNotificationWithIcon("Device assigned.");
        }
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
        error
      );
    }
  };
  const handleLostSingleDevice = (props) => {
    try {
      const findData = _.groupBy(
        foundTransactionAndDevicesAssigned(),
        "device.serialNumber"
      );
      setOpenModal(true);
      dispatch(onReceiverObjectToReplace(props));
      dispatch(
        onAddDevicesAssignedInPaymentIntent(findData[props.serialNumber])
      );
      handleRecord(props);
    } catch (error) {
      console.log(
        "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
        error
      );
    }
  };

  const checkingRenderBackgroundColor = (props, col1, col2, col3) => {
    if (typeof props === "string") {
      return col1;
    } else {
      if (props) return col2;
      return col3;
    }
  };
  const checkingRenderStatus = (props) => {
    if (typeof props === "string") {
      return props;
    } else {
      return props ? "In-use" : "Returned";
    }
  };

  const columns = [
    {
      title: "Device serial number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      sorter: {
        compare: (a, b) => ("" + a.serialNumber).localeCompare(b.serialNumber),
      },
      sortDirections: ["descend", "ascend"],
      width: "30%",
    },
    {
      title: "Type",
      dataIndex: "deviceType",
      key: "deviceType",
      width: "20%",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) => ("" + a.deviceType).localeCompare(b.deviceType),
      },
      sortDirections: ["descend", "ascend"],
      render: (deviceType) => (
        <span>
          <Typography
            textTransform={"capitalize"}
            textAlign={"left"}
            fontWeight={400}
            fontSize={"14px"}
            fontFamily={"Inter"}
            lineHeight={"24px"}
            color={""}
          >
            {deviceType}
          </Typography>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: {
        compare: (a, b) => ("" + a.status).localeCompare(b.status),
      },
      sortDirections: ["descend", "ascend"],
      render: (status) => (
        <span
          style={{
            width: "fit-content",
            padding: "5px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            backgroundColor: checkingRenderBackgroundColor(
              status,
              "#ffb5b5",
              "#ffe4b5",
              "#ECFDF3"
            ),
            color: checkingRenderBackgroundColor(
              status,
              "#ad0101",
              "#714904",
              "#027A48"
            ),
          }}
        >
          <p
            style={{
              textTransform: "none",
              textAlign: "left",
              fontWeight: 400,
              fontSize: "14px",
              fontFamily: "Inter",
              lineHeight: "24px",
            }}
          >
            {checkingRenderStatus(status)}
          </p>
        </span>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: "10%",
      render: (_, record) => (
        <Space size="middle">
          {record.status === "Lost" || record.status === false ? (
            <button
              onClick={() => handleAssignSingleDevice(record)}
              disabled={String(record.status).toLowerCase() === "lost"}
              style={{
                width: "fit-content",
                border: `${
                  String(record.status).toLowerCase() === "lost"
                    ? "1px solid var(--disabled-blue-button)"
                    : "1px solid var(--blue-dark-600, #155EEF)"
                }`,
                backgroundColor: `${
                  String(record.status).toLowerCase() === "lost"
                    ? "var(--disabled-blue-button)"
                    : "var(--blue-dark-600, #155EEF)"
                }`,
                borderRadius: "8px",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                padding: "5px",
              }}
            >
              <p
                style={{
                  cursor: "pointer",
                  textTransform: "none",
                  textAlign: "left",
                  fontWeight: 400,
                  fontSize: "16px",
                  fontFamily: "Inter",
                  lineHeight: "24px",
                  color: "var(--basewhite)",
                }}
              >
                Assign
              </p>
            </button>
          ) : (
            <button
              onClick={() => handleReturnSingleDevice(record)}
              disabled={!event.active}
              style={{
                width: "fit-content",
                border: "1px solid var(--error-700, #B42318)",
                backgroundColor: "var(--error-700, #B42318)",
                borderRadius: "8px",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                padding: "5px",
                color: "#B42318",
              }}
            >
              <p
                style={{
                  cursor: "pointer",
                  textTransform: "none",
                  textAlign: "left",
                  fontWeight: 400,
                  fontSize: "16px",
                  fontFamily: "Inter",
                  lineHeight: "24px",
                  color: "var(--basewhite)",
                }}
              >
                Return
              </p>
            </button>
          )}
          {record.status === true && (
            <button
              onClick={() => {
                dispatch(onTriggerModalToReplaceReceiver(true));
                dispatch(onReceiverObjectToReplace(record));
                handleRecord(rowRecord);
              }}
              disabled={!event.active}
              style={{
                width: "fit-content",
                border: "1px solid var(--blue-dark-600, #155EEF)",
                backgroundColor: "var(--blue-dark-600, #155EEF)",
                borderRadius: "8px",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                padding: "5px",
              }}
            >
              <p
                style={{
                  cursor: "pointer",
                  textTransform: "none",
                  textAlign: "left",
                  fontWeight: 400,
                  fontSize: "16px",
                  fontFamily: "Inter",
                  lineHeight: "24px",
                  color: "var(--basewhite)",
                }}
              >
                Replace
              </p>
            </button>
          )}
          {record.status === true &&
            event.staff.adminUser.some(
              (element) => element.email === user.email
            ) && (
              <Popconfirm
                title="Are you sure it is lost?"
                onConfirm={() => handleLostSingleDevice(record)}
              >
                <p
                  style={{
                    cursor: "pointer",
                    textTransform: "none",
                    textAlign: "left",
                    fontWeight: 400,
                    fontSize: "16px",
                    fontFamily: "Inter",
                    lineHeight: "24px",
                    color: "#000",
                  }}
                >
                  Lost
                </p>
              </Popconfirm>
            )}
        </Space>
      ),
    },
  ];
  return (
    <>
      {contextHolder}
      <div
        style={{
          display: `${
            checkDevicesInTransaction()?.length >=
              rowRecord.device[0].deviceNeeded && "none"
          }`,
        }}
      >
        {checkDevicesInTransaction()?.length !==
          rowRecord.device[0].deviceNeeded && (
          <AddingDevicesToPaymentIntent
            refetchingFn={refetchingFn}
            record={rowRecord}
          />
        )}
      </div>
      {checkDevicesInTransaction()?.length > 0 && (
        <Table
          columns={columns}
          dataSource={checkDevicesInTransaction()}
          pagination={{
            position: ["bottomLeft"],
          }}
        />
      )}
      {openModal && (
        <Choice openModal={openModal} setOpenModal={setOpenModal} />
      )}
      {triggerModal && <ReplaceDevice refetching={refetchingFn} />}
    </>
  );
};
export default ExpandedRowInTable;
