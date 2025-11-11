import { Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Table, message, notification } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import BlueButtonConfirmationComponent from "../../../../../components/UX/buttons/BlueButtonConfirmation";
import {
  onReceiverObjectToReplace,
  onTriggerModalToReplaceReceiver,
} from "../../../../../store/slices/helperSlice";
import {
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import "../../../../../styles/global/ant-table.css";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import Choice from "../lostFee/Choice";
import AddingDevicesToPaymentIntent from "./AssigningDevice/AddingDevicesToPaymentIntent";
import SignaturesProof from "./SignaturesProof";
import ExpressCheckInDevices from "./actions/ExpressCheckInDevices";
import { ReplaceDevice } from "./actions/ReplaceDevice";
import ReturningInBulkMethod from "./actions/ReturningInBulkMethod";
import ExpandedTableButtons from "./ux/ExpandedTableButtons";
import DisplayDeviceRequestedLegendPerTransaction from "./AssigningDevice/components/DisplayDeviceRequestedLegendPerTransaction";
// import EmailStructureUpdateItem from "../../../../../classes/emailStructureUpdateItem";
const ExpandedRowInTable = ({
  rowRecord,
  refetching,
  setOpenCancelingDepositModal,
  signatureProof,
}) => {
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const [openModal, setOpenModal] = useState(false);
  const { triggerModal } = useSelector((state) => state.helper);
  const [selectedItems, setSelectedItems] = useState([]);
  const [statusRecordState, setStatusRecordState] = useState(null);
  const [openReturnDeviceInBulkModal, setOpenReturnDeviceInBulkModal] =
    useState(false);
  const [
    openReturnExpressCheckInDeviceModal,
    setOpenReturnExpressCheckInDeviceModal,
  ] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const transactionsQuery = useQuery({
    queryKey: ["transactionPerConsumerListQuery"],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        "consumerInfo.id": customer.id,
        paymentIntent: rowRecord.paymentIntent,
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
        paymentIntent: rowRecord.paymentIntent,
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
    refetching();
    return deviceAssignedListQuery.refetch();
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (message) => {
    api.open({
      message: message,
      placement: "bottomRight",
    });
  };

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedItems(selectedRows);
    },
    getCheckboxProps: (record) => {
      return {
        disabled: record.status === false || typeof record.status === "string",
      };
    },
  };

  const foundAllTransactionsAndDevicesAssigned = () => {
    const assignedDevices =
      deviceAssignedListQuery?.data?.data?.listOfReceivers;
    if (assignedDevices?.length > 0) {
      const groupByPaymentIntent = groupBy(assignedDevices, "paymentIntent");
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
        result.add({ key: data.id, ...data.device });
      }
    }
    return Array.from(result);
  };

  const handleReturnSingleDevice = async (props) => {
    try {
      setStatusRecordState(props.key);
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
      const assignedDeviceData = groupBy(
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
          // const dateString = new Date().toString();
          // const dateRef = dateString.split(" ");
          await clearCacheMemory(
            `event_id=${event.id}&company=${
              user.companyData.id
            }&consumerInfo.id=${customer.id ?? customer.uid}`
          );
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
          openNotificationWithIcon("Device returned.");
          setStatusRecordState(null);

          await checkItemsStatusInTransactionForEmailNotification();
        }
      }
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`
      );
    } catch (error) {
      setStatusRecordState(null);
      return null;
    }
  };

  const handleAssignSingleDevice = async (props) => {
    try {
      setStatusRecordState(props.key);
      const deviceInPoolListQuery = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          eventSelected: event.eventInfoDetail.eventName,
          company: user.companyData.id,
          device: props.serialNumber,
          type: props.deviceType,
        }
      );
      if (deviceInPoolListQuery.data.receiversInventory.at(-1).activity) {
        setStatusRecordState(null);
        return alert(
          `Device is already in use for another consumer. Please assign another device serial number.`
        );
      }
      let assignedItem = {
        ...props,
        status: true,
      };
      const findData = groupBy(
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
          // const dateString = new Date().toString();
          // const dateRef = dateString.split(" ");
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
          openNotificationWithIcon("Device assigned.");
          setStatusRecordState(null);
        }
      }
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`
      );
      await devitrakApi.post("/nodemailer/assignig-device-notification", {
        consumer: {
          email: customer.email,
          firstName: customer.name,
          lastName: customer.lastName,
        },
        devices: [
          {
            serialNumber: props.serialNumber,
            deviceType: props.deviceType,
            paymentIntent: rowRecord.paymentIntent,
          },
        ],
        event: event.eventInfoDetail.eventName,
        transaction: rowRecord.paymentIntent,
        company: user.companyData.id,
        link: `https://app.devitrak.net/?event=${event.id}&company=${user.companyData.id}`,
        admin: user.email,
      });
    } catch (error) {
      setStatusRecordState(null);
      return null;
    }
  };

  const handleLostSingleDevice = (props) => {
    try {
      const findData = groupBy(
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
      return null;
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
        <ExpandedTableButtons
          record={record}
          handleAssignSingleDevice={handleAssignSingleDevice}
          handleReturnSingleDevice={handleReturnSingleDevice}
          statusRecordState={statusRecordState}
          handleRecord={handleRecord}
          handleLostSingleDevice={handleLostSingleDevice}
          user={user}
          event={event}
          dispatch={dispatch}
          rowRecord={rowRecord}
          onTriggerModalToReplaceReceiver={onTriggerModalToReplaceReceiver}
          onReceiverObjectToReplace={onReceiverObjectToReplace}
        />
      ),
    },
  ];

  const returnConfirmationEmailNotification = async (props) => {
    try {
      await devitrakApi.post(
        "/nodemailer/confirm-returned-device-notification",
        {
          consumer: {
            email: customer.email,
            firstName: customer.name,
            lastName: customer.lastName,
          },
          devices: props,
          event: event.eventInfoDetail.eventName,
          transaction: rowRecord.paymentIntent,
          company: user.companyData.id,
          link: `https://app.devitrak.net/?event=${event.id}&company=${user.companyData.id}`,
          admin: user.email,
        }
      );
    } catch (error) {
      message.error(`There was an error. ${error}`);
    }
  };

  const checkItemsStatusInTransactionForEmailNotification = async () => {
    try {
      const checkingNewStatus = await devitrakApi.post(
        "/receiver/receiver-assigned-list",
        {
          user: customer.email,
          company: user.companyData.id,
          eventSelected: event.eventInfoDetail.eventName,
          paymentIntent: rowRecord.paymentIntent,
        }
      );
      const data = checkingNewStatus?.data?.listOfReceivers;
      const groupingByStatus = groupBy(data, "device.status");
      returnConfirmationEmailNotification([...groupingByStatus[false]]);
      if (!groupingByStatus[true]) {
        handleRecord(rowRecord);
        return setOpenCancelingDepositModal(true);
      }
      return null;
    } catch (error) {
      message.error(`There was an error. ${error}`);
    }
  };

  const returnDevicesInTransaction = async (props) => {
    const template = {
      timeStamp: new Date().getTime(),
      device: props,
    };
    await devitrakApi.patch(
      `/receiver/transaction-all-items-returned-at-once`,
      template
    );
    queryClient.invalidateQueries("assginedDeviceList", { exact: true });
  };

  const returnDeviceInPool = async (props) => {
    const template = {
      device: props,
      company: user.companyData.id,
      activity: false,
      eventSelected: props[0].eventSelected[0],
    };
    await devitrakApi.patch(
      `/receiver/transaction-return-all-items-in-pool`,
      template
    );

    queryClient.invalidateQueries({
      queryKey: ["assginedDeviceList"],
      exact: true,
    });

    queryClient.invalidateQueries({
      queryKey: ["listOfreceiverInPool"],
      exact: true,
    });

    return null;
  };

  const handleAllItemsReturn = async () => {
    try {
      const groupingByStatus = groupBy(
        foundTransactionAndDevicesAssigned(),
        "device.status"
      );
      if (groupingByStatus[true]) {
        message.info("Returning all items in this transaction. Please wait!");
        await returnDevicesInTransaction(groupingByStatus[true]);
        await returnDeviceInPool(groupingByStatus[true]);
        await returnConfirmationEmailNotification(groupingByStatus[true]);
        await clearCacheMemory(
          `eventSelected=${event.id}&company=${user.companyData.id}`
        );
        await clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
        );
        message.success("All items returned successfully");
        handleRecord(rowRecord);
        return setOpenCancelingDepositModal(true);
      } else {
        return message.warning("No items to return");
      }
    } catch (error) {
      message.error(`There was an error. ${error}`);
    }
  };

  const sendEmailDeviceReport = async () => {
    try {
      setIsLoadingAction(true);
      const response = await devitrakApi.post(
        "/nodemailer/device-report-per-transaction",
        {
          consumer: {
            email: customer.email,
            firstName: customer.name,
            lastName: customer.lastName,
          },
          devices: [
            ...checkDevicesInTransaction().map((item) => {
              return {
                device: { ...item },
                paymentIntent: rowRecord.paymentIntent,
              };
            }),
          ],
          event: event.eventInfoDetail.eventName,
          transaction: rowRecord.paymentIntent,
          company: user.companyData.id,
          link: `https://app.devitrak.net/?event=${event.id}&company=${user.companyData.id}`,
          admin: user.email,
        }
      );
      if (response.data.ok) {
        setIsLoadingAction(false);
        return message.success(
          `Device report was sent successfully to ${customer.email}`
        );
      }
    } catch (error) {
      setIsLoadingAction(false);
      return message.error(`There was an error. ${error}`);
    }
  };

  return (
    <div key={rowRecord.paymentIntent}>
      {contextHolder}
      <div
        style={{
          display: `${
            checkDevicesInTransaction()?.length >=
              rowRecord.device[0].deviceNeeded && "none"
          }`,
        }}
      >
        <DisplayDeviceRequestedLegendPerTransaction record={rowRecord} checked={checkDevicesInTransaction()}/>
        {checkDevicesInTransaction()?.length !==
          rowRecord.device[0].deviceNeeded && (
          <AddingDevicesToPaymentIntent
            refetchingFn={refetchingFn}
            record={rowRecord}
          />
        )}
      </div>
      {checkDevicesInTransaction()?.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "100%",
              gap: "5px",
            }}
          >
            <Button
              style={{
                ...BlueButton,
                display: selectedItems.length > 0 ? "flex" : "none",
                gap: "5px",
              }}
              onClick={() => setOpenReturnDeviceInBulkModal(true)}
            >
              <p style={BlueButtonText}>
                Return multiple items of this transaction | Total items to
                return: {selectedItems.length}
              </p>
            </Button>
            <BlueButtonConfirmationComponent
              title={`Return all items of this transaction`}
              styles={{ gap: "5px" }}
              buttonType="button"
              func={() => handleAllItemsReturn(true)}
              confirmationTitle="Are you sure you want to return all items of this transaction?"
            />
            <BlueButtonComponent
              title={"Express check-in devices"}
              func={() => setOpenReturnExpressCheckInDeviceModal(true)}
              styles={{ gap: "5px" }}
            />
            <BlueButtonComponent
              loadingState={isLoadingAction}
              buttonType="button"
              title={"Send device report"}
              func={() => sendEmailDeviceReport()}
            />
          </div>

          <Table
            columns={columns}
            dataSource={checkDevicesInTransaction()}
            pagination={{
              position: ["bottomLeft"],
            }}
            rowSelection={{
              type: "checkbox",
              ...rowSelection,
            }}
          />
          <SignaturesProof data={signatureProof[rowRecord.paymentIntent]} />
        </div>
      )}
      {openModal && (
        <Choice openModal={openModal} setOpenModal={setOpenModal} />
      )}
      {triggerModal && <ReplaceDevice refetching={refetchingFn} />}
      {openReturnDeviceInBulkModal && (
        <ReturningInBulkMethod
          openReturnDeviceBulkModal={openReturnDeviceInBulkModal}
          setOpenReturnDeviceInBulkModal={setOpenReturnDeviceInBulkModal}
          record={rowRecord}
          refetching={refetchingFn}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          emailNotification={checkItemsStatusInTransactionForEmailNotification}
        />
      )}
      {openReturnExpressCheckInDeviceModal && (
        <ExpressCheckInDevices
          openReturnDeviceBulkModal={openReturnExpressCheckInDeviceModal}
          setOpenReturnDeviceInBulkModal={
            setOpenReturnExpressCheckInDeviceModal
          }
          record={rowRecord}
          refetching={refetchingFn}
          selectedItems={checkDevicesInTransaction()}
          setSelectedItems={setSelectedItems}
          emailNotification={checkItemsStatusInTransactionForEmailNotification}
        />
      )}
    </div>
  );
};
export default ExpandedRowInTable;
