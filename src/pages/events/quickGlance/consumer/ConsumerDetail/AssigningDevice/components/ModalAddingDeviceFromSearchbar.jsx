import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, message, Modal, Table } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import Loading from "../../../../../../../components/animation/Loading";
import { onOpenDeviceAssignmentModalFromSearchPage } from "../../../../../../../store/slices/devicesHandleSlice";
import { BlueButton } from "../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../../../styles/global/DangerButtonText";
import { Subtitle } from "../../../../../../../styles/global/Subtitle";
import AddingDeviceToPaymentIntentFromSearchBar from "../AddingDeviceToPaymentIntentFromSearchBar";

const ModalAddingDeviceFromSearchbar = () => {
  const { paymentIntentSelected, paymentIntentDetailSelected, customer } =
    useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const dispatch = useDispatch();
  // const navigate = useNavigate();
  const findingAssignedInPaymentIntentQuery = useQuery({
    queryKey: ["assignedDeviceInPaymentIntent"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned", {
        paymentIntent: paymentIntentSelected,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    findingAssignedInPaymentIntentQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  const { openModalToAssignDevice } = useSelector(
    (state) => state.devicesHandle
  );
  const refetchingFn = () => {
    return findingAssignedInPaymentIntentQuery.refetch();
  };
  const closeModal = () => {
    dispatch(onOpenDeviceAssignmentModalFromSearchPage(false));
  };

  if (findingAssignedInPaymentIntentQuery.data) {
    const deviceAssignedListQuery =
      findingAssignedInPaymentIntentQuery?.data?.data?.receiver; //*need to get the final result form finding assigned device query

    const foundTransactionAndDevicesAssigned = () => {
      if (deviceAssignedListQuery?.length) return deviceAssignedListQuery;
      return [];
    };
    const checkDevicesInTransaction = () => {
      const result = new Set();
      for (let data of foundTransactionAndDevicesAssigned()) {
        result.add({ key: data.id, ...data.device });
      }
      return Array.from(result).reverse();
    };

    const removeDeviceFromTransaction = async (props) => {
      try {
        setIsLoadingStatus(true);
        const response = await devitrakApi.delete(
          `/receiver/remove-transaction/${props.key}`
        );
        if (response.data.ok) {
          const deviceInPool = await devitrakApi.post(
            "/receiver/receiver-pool-list",
            {
              activity: true,
              eventSelected: event.eventInfoDetail.eventName,
              company: user.companyData.id,
              device: props.serialNumber,
              type: props.deviceType,
            }
          );
          // console.log(deviceInPool.data.receiversInventory[0])
          await devitrakApi.patch(
            `/receiver/receivers-pool-update/${deviceInPool.data.receiversInventory[0].id}`,
            { activity: false }
          );
          await refetchingFn();
          setIsLoadingStatus(false);
          return message.success("Device removed from transaction");
        }
      } catch (error) {
        setIsLoadingStatus(false);
        return message.error("Something went wrong, please try again later.");
      }
    };

    const renderTernaryOption = (props) => {
      if (typeof props === "string") {
        return props;
      } else {
        if (props) return "In-use";
        return "Returned";
      }
    };

    const columns = [
      {
        title: "Device serial number",
        dataIndex: "serialNumber",
        key: "serialNumber",
        sorter: {
          compare: (a, b) =>
            ("" + a.serialNumber).localeCompare(b.serialNumber),
        },
        sortDirections: ["descend", "ascend"],
        width: "30%",
        render: (serialNumber) => (
          <p
            style={{
              ...Subtitle,
              textTransform: "none",
              fontSize: "16px",
              lineHeight: "24px",
            }}
          >
            {serialNumber}
          </p>
        ),
      },
      {
        title: "Type",
        dataIndex: "deviceType",
        key: "deviceType",
        sorter: {
          compare: (a, b) => ("" + a.deviceType).localeCompare(b.deviceType),
        },
        sortDirections: ["descend", "ascend"],
        render: (deviceType) => (
          <p
            style={{
              ...Subtitle,
              textTransform: "none",
              fontSize: "16px",
              lineHeight: "24px",
            }}
          >
            {deviceType}
          </p>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: "20%",
        sorter: {
          compare: (a, b) => ("" + a.status).localeCompare(b.status),
        },
        sortDirections: ["descend", "ascend"],
        render: (status) => (
          <p
            style={{
              ...Subtitle,
              textTransform: "none",
              fontSize: "16px",
              lineHeight: "24px",
            }}
          >
            {renderTernaryOption(status)}
          </p>
        ),
      },
      {
        title: "Remove",
        key:"key",
        width: "10%",
        render: (record) => (
          <Button
            loading={isLoadingStatus}
            style={DangerButton}
            onClick={() => removeDeviceFromTransaction(record)}
          >
            {isLoadingStatus ? <Loading /> : <p style={DangerButtonText}>X</p>}
          </Button>
        ),
      },
    ];
    const renderTitle = () => {
      return (
        <p
          style={{
            textWrap: "balance",
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: "24px",
            lineHeight: "30px",
            textAlign: "left",
            textTransform: "none",
            padding: "12px",
          }}
        >
          Assigning device to{" "}
          <span
            style={{
              textTransform: "capitalize",
            }}
          >
            {customer.name}, {customer.lastName}
          </span>
        </p>
      );
    };

    // const navigateToDeviceDetailPage = async (record) => {
    //   const deviceInPoolListQuery = await devitrakApi.post(
    //     "/receiver/receiver-pool-list",
    //     {
    //       eventSelected: event.eventInfoDetail.eventName,
    //       company: user.companyData.id,
    //       device: record.serialNumber,
    //       type: record.deviceType,
    //       activity: true,
    //     }
    //   );
    //   if (deviceInPoolListQuery.data) {
    //     const format = {
    //       company: [`${record.deviceType}`, `${event.company}`],
    //       activity: record.status,
    //       status: checkArray(deviceInPoolListQuery.data.receiversInventory)
    //         .status,
    //       serialNumber: record.serialNumber,
    //       user: true,
    //       entireData: {
    //         eventSelected: `${event.eventInfoDetail.eventName}`,
    //         device: `${record.serialNumber}`,
    //         type: `${record.deviceType}`,
    //         status: `${
    //           checkArray(deviceInPoolListQuery.data.receiversInventory).status
    //         }`,
    //         activity: record.status,
    //         comment: `${
    //           checkArray(deviceInPoolListQuery.data.receiversInventory).comment
    //         }`,
    //         provider: `${event.company}`,
    //         company: `${user.companyData.id}`,
    //         id: `${
    //           checkArray(deviceInPoolListQuery.data.receiversInventory).id
    //         }`,
    //       },
    //     };

    //     dispatch(onAddDeviceToDisplayInQuickGlance(format));
    //     navigate("/device-quick-glance");
    //   }
    // };
    return (
      <Modal
        title={renderTitle()}
        centered
        open={openModalToAssignDevice}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        width={1000}
        footer={[]}
        maskClosable={false}
        style={{ zIndex: 30 }}
      >
        <Grid container>
          {foundTransactionAndDevicesAssigned()?.length ===
          paymentIntentDetailSelected?.device ? null : (
            <Grid
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <AddingDeviceToPaymentIntentFromSearchBar
                refetchingFn={refetchingFn}
                key={"adding-single-device"}
              />
            </Grid>
          )}
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"flex-start"}
            marginY={1}
            gap={2}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Button
            onClick={() => closeModal()}
              style={{
                ...BlueButton,
                display:
                  foundTransactionAndDevicesAssigned()?.length ===
                  paymentIntentDetailSelected?.device
                    ? "flex"
                    : "none",
              }}
            >
              <p style={BlueButtonText}>Done</p>
            </Button>
            <Button
            onClick={() => closeModal()}
              style={{
                ...BlueButton,
                display:
                  foundTransactionAndDevicesAssigned()?.length ===
                  paymentIntentDetailSelected?.device
                    ? "none"
                    : "flex",
              }}
            >
              <p style={BlueButtonText}>Continue later</p>
            </Button>
          </Grid>
          <Grid item xs={12}>
            {checkDevicesInTransaction().length > 0 && (
              <Table
                columns={columns}
                dataSource={checkDevicesInTransaction()}
                pagination={{
                  position: ["bottomLeft"],
                }}
                // onRow={(record) => {
                //   return {
                //     onClick: () => {
                //       navigateToDeviceDetailPage(record);
                //     },
                //   };
                // }}
                // style={{ cursor: "pointer" }}
              />
            )}
          </Grid>
        </Grid>
      </Modal>
    );
  }
};

export default ModalAddingDeviceFromSearchbar;
