import { Link, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popconfirm, Space, Table } from "antd";
import _ from "lodash";
import { useEffect } from "react";
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
import AddingDevicesToPaymentIntent from "./AssigningDevice/AddingDevicesToPaymentIntent";

const ExpandedRowInTable = ({ rowRecord }) => {
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
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
    notifyOnChangeProps: ["data", "dataUpdatedAt"],
  });
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
    notifyOnChangeProps: ["data", "dataUpdatedAt"],
  });
  useEffect(() => {
    const controller = new AbortController();
    transactionsQuery.refetch();
    deviceAssignedListQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const refetchingFn = () => {
    return deviceAssignedListQuery.refetch();
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
  //*nested table starts here
  // const renderDataPerRow = (rowRecord) => {
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
          provider: event.company,
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
        if (deviceInPoolListQuery.data.receiversInventory.length > 0) {
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
            activity: "No",
          };
          await devitrakApi.patch(
            `/receiver/receivers-pool-update/${deviceInPoolProfile.id}`,
            deviceInPoolProfile
          );
          await devitrakApi.post(
            "/nodemailer/confirm-returned-device-notification",
            {
              consumer: {
                name: `${customer.name} ${customer.lastName}`,
                email: customer.email,
              },
              device: {
                serialNumber: returnedItem.serialNumber,
                deviceType: returnedItem.deviceType,
              },
              event: event.eventInfoDetail.eventName,
              company: event.company,
              transaction: rowRecord.paymentIntent,
              date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
              time: dateRef[4],
              link: `https://app.devitrak.net/authentication/${encodeURI(
                event.eventInfoDetail.eventName
              )}/${encodeURI(event.company)}/${customer.uid}`,
            }
          );
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
          provider: event.company,
          device: props.serialNumber,
          type: props.deviceType,
        }
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
        if (deviceInPoolListQuery.data.receiversInventory.length > 0) {
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
            activity: "YES",
          };
          await devitrakApi.patch(
            `/receiver/receivers-pool-update/${devicePoolData.id}`,
            deviceInPoolProfile
          );
          await devitrakApi.post("/nodemailer/assignig-device-notification", {
            consumer: {
              name: `${customer.name} ${customer.lastName}`,
              email: customer.email,
            },
            device: {
              serialNumber: assignedItem.serialNumber,
              deviceType: assignedItem.deviceType,
            },
            event: event.eventInfoDetail.eventName,
            company: event.company,
            transaction: rowRecord.paymentIntent,
            date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
            time: dateRef[4],
            link: `https://app.devitrak.net/authentication/${encodeURI(
              event.eventInfoDetail.eventName
            )}/${encodeURI(event.company)}/${customer.uid}`,
          });
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

  const columns = [
    {
      title: "Device serial number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      // ...getColumnSearchProps("serialNumber"),
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
            backgroundColor: "#ECFDF3",
            color: "#027A48",
          }}
        >
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontWeight={400}
            fontSize={"14px"}
            fontFamily={"Inter"}
            lineHeight={"24px"}
          >
            {typeof status === "string"
              ? status
              : status
              ? "In-use"
              : "Returned"}
          </Typography>
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
            <Link
              component="button"
              underline="none"
              disabled={String(record.status).toLowerCase() === "lost"}
              style={{
                width: "fit-content",
                border: "1px solid var(--blue-dark-600, #155EEF)",
                borderRadius: "8px",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                padding: "5px",
              }}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={400}
                fontSize={"16px"}
                fontFamily={"Inter"}
                lineHeight={"24px"}
                color={"var(--blue-dark-600, #155EEF)"}
                style={{ cursor: "pointer" }}
                onClick={() => handleAssignSingleDevice(record)}
              >
                Assign
              </Typography>
            </Link>
          ) : (
            <Link
              disabled={!event.active}
              component="button"
              underline="none"
              style={{
                width: "fit-content",
                border: "1px solid var(--error-700, #B42318)",
                borderRadius: "8px",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                padding: "5px",
                color: "#B42318",
              }}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={400}
                fontSize={"16px"}
                fontFamily={"Inter"}
                lineHeight={"24px"}
                color={"var(--error-700, #B42318)"}
                style={{ cursor: "pointer" }}
                onClick={() => handleReturnSingleDevice(record)}
              >
                Return
              </Typography>
            </Link>
          )}
          {record.status === true && (
            <Link
              disabled={!event.active}
              component="button"
              underline="none"
              style={{
                width: "fit-content",
                border: "1px solid var(--blue-dark-600, #155EEF)",
                borderRadius: "8px",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                padding: "5px",
              }}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={400}
                fontSize={"16px"}
                fontFamily={"Inter"}
                lineHeight={"24px"}
                color={""}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  dispatch(onTriggerModalToReplaceReceiver(true));
                  dispatch(onReceiverObjectToReplace(record));
                  handleRecord(rowRecord);
                }}
              >
                Replace
              </Typography>
            </Link>
          )}
          {record.status === true &&
            event.staff.adminUser.some(
              (element) => element.email === user.email
            ) && (
              <Popconfirm
                title="Are you sure it is lost?"
                onConfirm={() => handleLostSingleDevice(record)}
              >
                <Link
                  disabled={!event.active}
                  component="button"
                  underline="none"
                  style={{
                    width: "fit-content",
                    border: "1px solid var(--blue-dark-600, #155EEF)",
                    borderRadius: "8px",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    padding: "5px",
                  }}
                >
                  <Typography
                    textTransform={"none"}
                    textAlign={"left"}
                    fontWeight={400}
                    fontSize={"16px"}
                    fontFamily={"Inter"}
                    lineHeight={"24px"}
                    color={""}
                    style={{ cursor: "pointer" }}
                  >
                    Lost
                  </Typography>
                </Link>
              </Popconfirm>
            )}
        </Space>
      ),
    },
  ];
  return (
    <>
      <div
        style={{
          display: `${
            checkDevicesInTransaction().length >=
              rowRecord.device[0].deviceNeeded && "none"
          }`,
        }}
      >
        {checkDevicesInTransaction().length !==
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
    </>
  );
  // };
};

export default ExpandedRowInTable;
