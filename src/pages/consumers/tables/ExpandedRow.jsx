import { Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Space, Table, message } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";
import { formatDate } from "../../../components/utils/dateFormat";
import { renderingTernary } from "../../../components/utils/renderingTernary";
import {
  onAddEventData,
  onAddEventInfoDetail,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onReceiverObjectToReplace } from "../../../store/slices/helperSlice";
import {
  onAddCustomer,
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../store/slices/stripeSlice";
// import "../../../styles/global/ant-table.css";
import ReverseRightArrow from "../../../components/icons/reverse-right.svg";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
import Capturing from "../action/deposit/Capturing";
import Releasing from "../action/deposit/Releasing";
import ModalReturnItem from "../action/ModalReturnItem";
import Choice from "../components/markedLostOption/Choice";
import "../localStyles.css";
import FooterExpandedRow from "./FooterExpandedRow";
const ExpandedRow = ({ rowRecord, refetching, paymentIntentInfoRetrieved }) => {
  const [openModal, setOpenModal] = useState(false);
  const [openReturnDeviceStaffModal, setOpenReturnDeviceStaffModal] =
    useState(false);
  const [infoNeededToBeRenderedInTable, setInfoNeededToBeRenderedInTable] =
    useState([]);
  const [openModalCapturingDeposit, setOpenModalCapturingDeposit] =
    useState(false);
  const [openModalReleasingDeposit, setOpenModalReleasingDeposit] =
    useState(false);
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const assignedDevicesQuery = useQuery({
    queryKey: ["assignedDevicesByTransaction", rowRecord.key],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-users-list", {
        paymentIntent: rowRecord.key,
      }),
    refetchOnMount: false,
  });

  const matchingEventInventoryForValueItems = (props) => {
    const { device, type } = checkArray(rowRecord["eventInfo"]);
    if (type === "lease") {
      return device?.filter((element) => element.group === props)?.at(-1)
        ?.value;
    }
    return (
      device?.filter((element) => element.group === props)?.at(-1)?.value ??
      device[0]?.deviceValue
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    assignedDevicesQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "success",
      content: "Device was returned",
    });
  };

  const displayTernary = (arg1, bg1, bg2, bg3) => {
    if (typeof arg1 === "string") {
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
      title: "Device name",
      dataIndex: "type",
      key: "type",
      render: (type) => <p style={Subtitle}>{type}</p>,
    },
    {
      title: "Serial number",
      dataIndex: "serial_number",
      key: "serial_number",
      render: (serial_number) => <p style={Subtitle}>{serial_number}</p>,
    },
    {
      title: "Cost of device",
      dataIndex: "deviceValue",
      key: "deviceValue",
      render: (deviceValue) => <p style={Subtitle}>${deviceValue}</p>,
    },

    {
      title: "Status of device",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge
          style={{
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            borderRadius: "16px",
            background: renderingTernary(
              status,
              "string",
              "#ffb5b5",
              "var(--Primary-50, #F9F5FF)",
              "var(--Success-50, #ECFDF3)"
            ),
            mixBlendMode: "multiply",
          }}
        >
          <Chip
            style={{
              backgroundColor: renderingTernary(
                status,
                "string",
                "#ffb5b5",
                "var(--Success-50, #ECFDF3)",
                "var(--Primary-50, #F9F5FF)"
              ),
            }}
            label={
              <p
                style={{
                  color: renderingTernary(
                    status,
                    "string",
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
                {renderingTernary(
                  status,
                  "string",
                  status,
                  "Active",
                  "Returned"
                )}
              </p>
            }
          />
        </Badge>
      ),
    },
    {
      title: "Actions",
      key: "operation",
      render: (record) => (
        <Space
          size="middle"
          style={{
            display: `${
              typeof record.status !== "string" && record.status && "flex"
            }`,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() =>
              record.transactionData.type === "lease"
                ? handleReturnItemFromLeaseTransaction(record)
                : handleReturnSingleDevice(record)
            }
            style={{
              ...BlueButton,
            }}
          >
            {record.transactionData.type === "lease" ? (
              <p style={BlueButtonText}>Mark as ended lease</p>
            ) : (
              <p style={BlueButtonText}>
                <img src={ReverseRightArrow} alt="ReverseRightArrow" />{" "}
                &nbsp;Mark as returned
              </p>
            )}
          </Button>
          <Button
            // disabled
            onClick={() => handleLostSingleDevice(record)}
            style={{
              ...GrayButton,
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
          </Button>
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
          serial_number: data?.device?.serialNumber,
          type: data?.device?.deviceType,
          deviceValue: matchingEventInventoryForValueItems(
            data?.device?.deviceType
          ),
          status: data?.device?.status,
          timeStamp: data?.timeStamp,
          entireData: data,
          transactionData: rowRecord,
        });
      }
      return Array.from(dataForTable);
    }
    return [];
  };

  useEffect(() => {
    dataRendering();
  }, [assignedDevicesQuery.data, rowRecord.key]);

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
            eventSelected: props.entireData.eventSelected[0], //pass event id
            company: user.companyData.id,
            device: props.serial_number,
            type: props.type,
          }
        );
        if (deviceInPoolListQuery.data) {
          const deviceInPoolProfile = {
            id: deviceInPoolListQuery.data.receiversInventory[0].id,
            activity: false,
          };

          const returningInPool = await devitrakApi.patch(
            `/receiver/receivers-pool-update/${deviceInPoolListQuery.data.receiversInventory[0].id}`,
            deviceInPoolProfile
          );
          if (returningInPool.data) {
            const checkItemDetails = await devitrakApi.post(
              "/db_item/consulting-item",
              {
                serial_number: props.serial_number,
                item_group: props.type,
                company_id: user.sqlInfo.company_id,
              }
            );
            if (checkItemDetails.data.ok) {
              await devitrakApi.post("/db_event/returning-item", {
                warehouse: 1,
                status: "Operational",
                update_at: formatDate(new Date()),
                serial_number: props.serial_number,
                category_name: checkItemDetails.data.items[0].category_name,
                item_group: props.type,
                company_id: user.sqlInfo.company_id,
              });
            }
            await assignedDevicesQuery.refetch();
            await refetching();
            return success();
          }
        }
      }
    } catch (error) {
      return null;
    }
  };

  const handleLostSingleDevice = (props) => {
    try {
      setOpenModal(true);
      dispatch(onAddEventData(rowRecord.eventInfo));
      dispatch(onAddEventInfoDetail(rowRecord.eventInfo.eventInfoDetail));
      dispatch(onSelectCompany(rowRecord.eventInfo.company));
      dispatch(onSelectEvent(rowRecord.eventInfo.eventInfoDetail.eventName));
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
      return null;
    }
  };

  const handleReturnItemFromLeaseTransaction = async (props) => {
    setOpenReturnDeviceStaffModal(true);
    const sqlItemInfo = await devitrakApi.post("/db_item/consulting-item", {
      serial_number: props.serial_number,
      item_group: props.type,
      company_id: user.sqlInfo.company_id,
    });

    const sqlConsumerInfo = await devitrakApi.post(
      "/db_consumer/consulting-consumer",
      {
        email: customer.email,
      }
    );
    const sqlConsumerLeaseInfo = await devitrakApi.post(
      "/db_lease/consulting-consumer-lease",
      {
        consumer_member_id: sqlConsumerInfo.data.consumer[0].consumer_id,
        company_id: user.sqlInfo.company_id,
        device_id: sqlItemInfo.data.items[0].item_id,
        subscription_current_in_use: 1,
      }
    );
    if (
      sqlItemInfo.data.ok &&
      sqlConsumerInfo.data.ok &&
      sqlConsumerLeaseInfo.data.ok
    ) {
      const template = {
        ...sqlConsumerInfo.data.consumer[0],
        ...sqlConsumerLeaseInfo.data.lease[0],
        ...sqlItemInfo.data.items[0],
        item_id_info: sqlItemInfo.data.items[0],
        rowRecord: rowRecord,
      };
      return setInfoNeededToBeRenderedInTable(template);
    }
  };
  const [isLoading, setIsLoading] = useState(false);

  const handleRefund = async (record) => {
    try {
      setIsLoading(true);
      await devitrakApi.post(`/stripe/refund`, {
        paymentIntent: record.paymentIntent,
      });
      await devitrakApi.patch(
        `/transaction/update-transaction/${record.eventInfo[0].id}`,
        {
          id: record.eventInfo[0].id,
          active: false,
        }
      );
      const emailTemplate = {
        email: customer.email,
        amount: String(record.eventInfo[0].device[0].deviceValue),
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

  const checkTransaction = async () => {
    const transactionInfo = await devitrakApi.post("/transaction/transaction", {
      paymentIntent: rowRecord.key,
      active: true,
    });
    const result = await transactionInfo.data.list.at(-1);
    if (result.active) {
      return setOpenModalReleasingDeposit(true);
    }
    return null;
  };
  useEffect(() => {
    if (assignedDevicesQuery.data && !rowRecord) {
      const data = [...assignedDevicesQuery.data.data.listOfReceivers];
      if (
        !data.some((item) => item.device.status === true) &&
        rowRecord.paymentIntent.length > 15
      ) {
        checkTransaction();
      }
    }
  }, [refetching, assignedDevicesQuery.data]);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: 10,
  };

  return (
    <div style={{ gap: "10px" }}>
      {contextHolder}
      <div
        style={{ display: "flex", justifyContent: "flex-start", gap: "10px", padding:" 0 2rem" }}
      >
        <Button
          disabled={!rowRecord.eventInfo[0].active}
          style={{
            ...BlueButton,
            width: "100%",
            display: rowRecord.device > 0 ? "flex" : "none",
            border: `${
              !rowRecord.eventInfo[0].active
                ? "1px solid var(--disabled-blue-button)"
                : BlueButton.border
            }`,
            backgroundColor: !rowRecord.eventInfo[0].active
              ? "var(--disabled-blue-button)"
              : BlueButton.background,
          }}
          onClick={() => setOpenModalReleasingDeposit(true)}
        >
          <p
            style={{
              ...BlueButtonText,
              width: "100%",
              color: !rowRecord.eventInfo[0].active
                ? "var(--blue-dark--800)"
                : BlueButtonText.color,
            }}
          >
            Release deposit
          </p>
        </Button>
        <Button
          disabled={!rowRecord.eventInfo[0].active}
          style={{
            ...DangerButton,
            width: "100%",
            border: `${
              !rowRecord.eventInfo[0].active
                ? "1px solid var(--disabled-danger-button)"
                : DangerButton.border
            }`,
            background: `${
              !rowRecord.eventInfo[0].active
                ? "var(--disabled-danger-button)"
                : DangerButton.background
            }`,
          }}
          onClick={() => setOpenModalCapturingDeposit(true)}
        >
          <p
            style={{
              ...DangerButtonText,
              width: "100%",
              color: !rowRecord.eventInfo[0].active
                ? "var(--disabled-danger-button-text)"
                : DangerButtonText.color,
            }}
          >
            Capture deposit
          </p>
        </Button>
        <Button
          loading={isLoading}
          onClick={() => handleRefund(rowRecord)}
          style={{
            ...DangerButton,
            width: "50%",
            display: rowRecord.device === 0 ? "flex" : "none",
            border: `${
              !rowRecord.eventInfo[0].active
                ? "1px solid var(--disabled-danger-button)"
                : DangerButton.border
            }`,
            background: `${
              !rowRecord.eventInfo[0].active
                ? "var(--disabled-danger-button)"
                : DangerButton.background
            }`,
          }}
        >
          <p style={{ ...DangerButtonText, width: "100%" }}>Refund</p>
        </Button>
      </div>

      {rowRecord.device > 0 && (
        <Table
          id={rowRecord.key}
          key={rowRecord.key}
          columns={columns}
          dataSource={dataRendering()}
          pagination={{
            defaultPageSize: 10,
            position: ["bottomCenter"],
            style: {
              backgroundColor: "var(--gray100)",
              padding: "16px 0",
              margin: 0,
            },
          }}
          className="table-ant-expanded-row-customized"
          rowSelection={rowSelection}
          virtual={true}
          rowHoverable={false}
        />
      )}

      <FooterExpandedRow
        displayTernary={displayTernary}
        handleReturnSingleDevice={handleReturnSingleDevice}
        handleLostSingleDevice={handleLostSingleDevice}
        dataRendering={rowRecord}
        returningDevice={handleReturnSingleDevice}
        formattedData={dataRendering()}
        paymentIntentInfoRetrieved={paymentIntentInfoRetrieved}
        deviceListInfo={dataRendering()}
      />

      {openModal && (
        <Choice openModal={openModal} setOpenModal={setOpenModal} />
      )}

      {openReturnDeviceStaffModal && (
        <ModalReturnItem
          openReturnDeviceStaffModal={openReturnDeviceStaffModal}
          setOpenReturnDeviceStaffModal={setOpenReturnDeviceStaffModal}
          deviceInfo={infoNeededToBeRenderedInTable}
          returnFunction={handleReturnSingleDevice}
        />
      )}

      {openModalCapturingDeposit && (
        <Capturing
          openCapturingDepositModal={openModalCapturingDeposit}
          setOpenCapturingDepositModal={setOpenModalCapturingDeposit}
          refetchingTransactionFn={refetching}
          rowRecord={rowRecord}
        />
      )}

      {openModalReleasingDeposit && (
        <Releasing
          openCancelingDepositModal={openModalReleasingDeposit}
          setOpenCancelingDepositModal={setOpenModalReleasingDeposit}
          refetchingTransactionF={refetching}
          rowRecord={rowRecord}
        />
      )}
    </div>
  );
};

export default ExpandedRow;
