import { Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Badge, Space, Table, message } from "antd";
import { useEffect, useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { useDispatch, useSelector } from "react-redux";
import { onReceiverObjectToReplace } from "../../../store/slices/helperSlice";
import {
  onAddCustomer,
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../store/slices/stripeSlice";
import Choice from "../components/markedLostOption/Choice";
import {
  onAddEventData,
  onAddEventInfoDetail,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";

const ExpandedRow = ({ rowRecord, refetching }) => {
  const [openModal, setOpenModal] = useState(false);
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const assignedDevicesQuery = useQuery({
    queryKey: ["assignedDevicesByTransaction", rowRecord.key], // Include rowRecord.key in queryKey to differentiate queries
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-users-list", {
        paymentIntent: rowRecord.key,
      }),
    // enabled: false,
    refetchOnMount: false,
  });

  const eventsRelatedToTransactionQuery = useQuery({
    queryKey: ["eventsInfoPerTransactionQuery", rowRecord.key], // Include rowRecord.key in queryKey to differentiate queries
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        "eventInfoDetail.eventName": rowRecord.eventSelected[0],
      }),
    // enabled: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    assignedDevicesQuery.refetch();
    eventsRelatedToTransactionQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [assignedDevicesQuery]);

  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "success",
      content: "Device was returned",
    });
  };

  const displayTernary = (arg1, bg1, bg2, bg3) => {
    if (typeof arg1 === 'string') {
      return bg1;
    } else {
      if (arg1) {
        return bg2;
      }
      return bg3;
    }
  };
  const columns = [
    {
      title: "Date",
      dataIndex: "timeStamp",
      key: "timeStamp",
      render: (timeStamp) => <p>{new Date(timeStamp).toUTCString()}</p>,
    },
    {
      title: "Serial number",
      dataIndex: "serial_number",
      key: "serial_number",
      render: (serial_number) => <p>{serial_number}</p>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        (
          <Badge
            style={{
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              borderRadius: "16px",
              background: displayTernary(
                status,
                "#ffb5b5",
                "var(--Primary-50, #F9F5FF)",
                "var(--Success-50, #ECFDF3)"
              ),
              mixBlendMode: "multiply",
            }}
          >
            <Chip
              style={{
                backgroundColor: displayTernary(
                  status,
                  "#ffb5b5",
                  "var(--Success-50, #ECFDF3)",
                  "var(--Primary-50, #F9F5FF)"
                ),
              }}
              label={
                <p
                  style={{
                    color: displayTernary(
                      status,
                      "#f71212",
                      "var(--success-700, #027A48)",
                      "var(--Primary-700, #6941C6)"
                    ),
                    fontFamily: "Inter",
                    fontSize: "12px",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "18px",
                  }}
                >
                  {displayTernary(status, status, "Active", "Returned")}
                </p>
              }
            />
          </Badge>
        )
      ),
    },
    {
      title: "",
      key: "operation",
      render: (record) => (
        <Space
          size="middle"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => handleReturnSingleDevice(record)}
            style={{
              ...BlueButton,
              display: `${
                record.status === "Lost"
                  ? "none"
                  : record.status
                  ? "flex"
                  : "none"
              }`,
            }}
          >
            <p style={BlueButtonText}>Mark as returned</p>
          </button>
          <button
            onClick={() => handleLostSingleDevice(record)}
            style={{
              ...GrayButton,
              display: `${
                record.status === "Lost"
                  ? "none"
                  : record.status
                  ? "flex"
                  : "none"
              }`,
            }}
          >
            <p
              style={{
                ...GrayButtonText,
                color: `${
                  record.status
                    ? GrayButtonText.color
                    : "var(--disabled0gray-button-text)"
                }`,
              }}
            >
              Mark as lost
            </p>
          </button>
        </Space>
      ),
    },
  ];
  const dataRendering = () => {
    if (assignedDevicesQuery.data) {
      const query = assignedDevicesQuery.data.data.listOfReceivers;
      const dataForTable = new Set();
      for (let data of query) {
        dataForTable.add({
          key: data._id,
          serial_number: data.device.serialNumber,
          type: data.device.deviceType,
          status: data.device.status,
          timeStamp: data.timeStamp,
          entireData: data,
        });
      }
      return Array.from(dataForTable);
    }
    return [];
  };
  useEffect(() => {
    dataRendering();
  }, [assignedDevicesQuery.data]);

  const handleReturnSingleDevice = async (props) => {
    try {
      const respUpdate = await devitrakApi.patch(
        `/receiver/receiver-update/${props.entireData._id}`,
        {
          id: props.entireData._id,
          device: {
            serialNumber: props.serial_number,
            deviceType: props.type,
            status: false,
          },
        }
      );
      if (respUpdate.data) {
        const deviceInPoolListQuery = await devitrakApi.post(
          "/receiver/receiver-pool-list",
          {
            eventSelected: props.entireData.eventSelected[0],
            company:user.companyData.id,
            device: props.serial_number,
            type: props.type,
          }
        );
        if (deviceInPoolListQuery.data) {
          const dateString = new Date().toString();
          const dateRef = dateString.split(" ");
          const deviceInPoolProfile = {
            id: deviceInPoolListQuery.data.receiversInventory[0].id,
            activity: false,
          };

          const returningInPool = await devitrakApi.patch(
            `/receiver/receivers-pool-update/${deviceInPoolListQuery.data.receiversInventory[0].id}`,
            deviceInPoolProfile
          );
          if (returningInPool.data) {
            await devitrakApi.post(
              "/nodemailer/confirm-returned-device-notification",
              {
                consumer: {
                  name: `${customer.name} ${customer.lastName}`,
                  email: customer.email,
                },
                device: {
                  serialNumber: props.serial_number,
                  deviceType: props.type,
                },
                event: props.entireData.eventSelected[0],
                company: props.entireData.provider[0],
                transaction: props.entireData.paymentIntent,
                date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
                time: dateRef[4],
                link: `https://app.devitrak.net/authentication/${encodeURI(
                  props.entireData.eventSelected[0]
                )}/${encodeURI(props.entireData.provider[0])}/${customer.uid}`,
              }
            );
            await assignedDevicesQuery.refetch();
            await refetching();
            return success();
          }
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
      setOpenModal(true);
      dispatch(
        onAddEventData(eventsRelatedToTransactionQuery.data.data.list[0])
      );
      dispatch(
        onAddEventInfoDetail(
          eventsRelatedToTransactionQuery.data.data.list[0].eventInfoDetail
        )
      );
      dispatch(
        onSelectCompany(
          eventsRelatedToTransactionQuery.data.data.list[0].company
        )
      );
      dispatch(
        onSelectEvent(
          eventsRelatedToTransactionQuery.data.data.list[0].eventInfoDetail
            .eventName
        )
      );
      dispatch(
        onReceiverObjectToReplace({
          serialNumber: props.serial_number,
          deviceType: props.type,
          status: props.status,
        })
      );
      dispatch(onAddDevicesAssignedInPaymentIntent(props.entireData));
      dispatch(onAddPaymentIntentSelected(props.entireData.paymentIntent));
      dispatch(
        onAddPaymentIntentDetailSelected({
          serialNumber: props.serial_number,
          deviceType: props.type,
          status: props.status,
        })
      );
      dispatch(onAddCustomer(props.entireData.userInfo));
    } catch (error) {
      console.log(
        "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
        error
      );
    }
  };

  return (
    <>
      {contextHolder}
      <Table
        columns={columns}
        dataSource={dataRendering()}
        pagination={false}
      />
      {openModal && (
        <Choice openModal={openModal} setOpenModal={setOpenModal} />
      )}
    </>
  );
};

export default ExpandedRow;
