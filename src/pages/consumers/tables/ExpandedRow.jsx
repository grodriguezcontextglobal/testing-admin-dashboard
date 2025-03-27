import { Chip } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Space, Spin, Table, message } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import Lost from "../../../components/icons/credit-card-x_whitebase.svg";
import ReverseRightArrow from "../../../components/icons/reverse-right.svg";
import { checkArray } from "../../../components/utils/checkArray";
import { renderingTernary } from "../../../components/utils/renderingTernary";
import handleReturnSingleDevice from "../../../components/utils/ReturnSingleItemInTransaction";
import {
  onAddEventData,
  onAddEventInfoDetail,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onReceiverObjectToReplace } from "../../../store/slices/helperSlice";
import {
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../store/slices/stripeSlice";
import "../../../styles/global/ant-table.css";
import { Subtitle } from "../../../styles/global/Subtitle";
import Capturing from "../action/deposit/Capturing";
import Releasing from "../action/deposit/Releasing";
import ModalReturnItem from "../action/ModalReturnItem";
import Choice from "../components/markedLostOption/Choice";
import ExpandedLostButton from "../components/UI/ExpandedLostButtons";
import ExpandedRowTableButtons from "../components/UI/ExpandedRowTableButtons";
import "../localStyles.css";
import FooterExpandedRow from "./FooterExpandedRow";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
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
  const [actionInProgress, setActionInProgress] = useState(false);
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
  const queryClient = useQueryClient();
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
  const returned = () => {
    messageApi.open({
      type: "success",
      content: "Device was marked as returned",
    });
  };
  const lost = () => {
    messageApi.open({
      type: "success",
      content: "Device was marked as lost",
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

  const handleReturnItemInTransaction = async (props) => {
    try {
      setActionInProgress(true);
      const responseDeviceInfoInTransaction = await devitrakApi.post(
        "/receiver/receiver-assigned-list",
        {
          paymentIntent: rowRecord.paymentIntent,
          "device.serialNumber": props.serial_number,
          "device.deviceType": props.type,
        }
      );
      const eventInfoInTransaction = await devitrakApi.post(
        "/event/event-list",
        {
          company: user.companyData.company_name,
          _id: props.entireData.event_id,
        }
      );
      if (responseDeviceInfoInTransaction.data.listOfReceivers.length > 0) {
        const dataAsProps = checkArray(
          responseDeviceInfoInTransaction.data.listOfReceivers
        );
        await handleReturnSingleDevice({
          user,
          serialNumber: dataAsProps.device.serialNumber,
          deviceType: dataAsProps.device.deviceType,
          deviceData: dataAsProps,
          event: checkArray(eventInfoInTransaction.data.list),
          customer,
          status: props.new_status ? props.new_status : false,
        });
        await refetching();
        queryClient.refetchQueries({
          queryKey: ["transactionsPerCustomer", customer.id ?? customer.uid],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["transactionsPerCustomer", customer.id ?? customer.uid],
          exact: true,
        });
        await refetchingQueries();
        if (props.new_status !== undefined) {
          if(props.new_status === "Lost"){
            lost();
          }else{
            returned();
          }
        } else {
          returned();
        }
        return setActionInProgress(false);
      }
      return setActionInProgress(false);
    } catch (error) {
      setActionInProgress(false);
      return message.error(error.message);
    }
  };

  const handleLostSingleDevice = async (props) => {
    try {
      const lostPropsToPass = {
        ...props,
        new_status: props.new_status,
      };
      await handleReturnItemInTransaction(lostPropsToPass);
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
  const [selectedRows, setSelectedRows] = useState([]);
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  useEffect(() => {
    const selectedDeviceInfo = () => {
      const data = dataRendering();
      const result = data.filter((element) =>
        selectedRowKeys.includes(element.key)
      );
      return setSelectedRows(result);
    };

    selectedDeviceInfo();
  }, [selectedRowKeys.length]);

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: 10,
  };

  const refetchingQueries = () => {
    queryClient.refetchQueries({
      queryKey: ["transactionsPerCustomer", customer.uid],
    });
    return assignedDevicesQuery.refetch();
  };

  const lostFeeChargeCustomer = async (props) => {
    setOpenModal(true);
    const responseEvent = await devitrakApi.post("/event/event-list", {
      company: user.company,
      "eventInfoDetail.eventName": rowRecord.eventSelected,
    });
    const receiversList = assignedDevicesQuery?.data?.data?.listOfReceivers;
    const foundDeviceToChargeLostFee = receiversList?.filter(
      (element) =>
        element.device.serialNumber === props.serial_number &&
        element.device.status === "Lost"
    );
    dispatch(onAddEventData(checkArray(responseEvent.data?.list)));
    dispatch(onAddEventInfoDetail(rowRecord.eventSelected));
    dispatch(onSelectCompany(rowRecord.company));
    dispatch(onSelectEvent(rowRecord.eventSelected));
    dispatch(
      onReceiverObjectToReplace({
        serialNumber: props.serial_number,
        deviceType: props.type,
        status: props.status,
      })
    );
    dispatch(
      onAddDevicesAssignedInPaymentIntent(
        checkArray(foundDeviceToChargeLostFee)
      )
    );
    dispatch(onAddPaymentIntentSelected(rowRecord.paymentIntent));
    dispatch(
      onAddPaymentIntentDetailSelected({
        serialNumber: props.serial_number,
        deviceType: props.type,
        status: props.status,
      })
    );
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
            width: "100%",
          }}
        >
          {typeof record.status !== "string" ? (
            <ExpandedRowTableButtons
              record={record}
              handleReturnItemInTransaction={handleReturnItemInTransaction}
              handleLostSingleDevice={handleLostSingleDevice}
              handleReturnItemFromLeaseTransaction={
                handleReturnItemFromLeaseTransaction
              }
              ReverseRightArrow={ReverseRightArrow}
              refetchingAfterAction={refetchingQueries}
            />
          ) : (
            <ExpandedLostButton
              record={record}
              handleFoundSingleDevice={handleLostSingleDevice}
              handleLostSingleDevice={lostFeeChargeCustomer}
              Lost={Lost}
              refetchingAfterAction={refetchingQueries}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ gap: "10px" }}>
      {contextHolder}

      <div
        style={{
          // width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0 2rem 0 0",
        }}
      >
        <Button onClick={refetchingQueries} style={BlueButton}>
          <p style={BlueButtonText}>Reload</p>
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
        handleReturnSingleDevice={handleReturnItemInTransaction}
        handleLostSingleDevice={handleLostSingleDevice}
        dataRendering={rowRecord}
        returningDevice={handleReturnItemInTransaction}
        formattedData={dataRendering()}
        paymentIntentInfoRetrieved={paymentIntentInfoRetrieved}
        deviceListInfo={dataRendering()}
        selectedItems={selectedRows}
        setSelectedItems={setSelectedRows}
        refetchingDevicePerTransaction={refetchingQueries}
        setOpenModalReleasingDeposit={setOpenModalReleasingDeposit}
        setOpenModalCapturingDeposit={setOpenModalCapturingDeposit}
        setOpenModal={setOpenModal}
        assignedItemsPerTransactionData={
          assignedDevicesQuery?.data?.data?.listOfReceivers
        }
      />

      {openModal && (
        <Choice openModal={openModal} setOpenModal={setOpenModal} />
      )}

      {openReturnDeviceStaffModal && (
        <ModalReturnItem
          openReturnDeviceStaffModal={openReturnDeviceStaffModal}
          setOpenReturnDeviceStaffModal={setOpenReturnDeviceStaffModal}
          deviceInfo={infoNeededToBeRenderedInTable}
          returnFunction={handleReturnItemInTransaction}
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
      {actionInProgress && <Spin indicator={<Loading />} fullscreen />}
    </div>
  );
};

export default ExpandedRow;