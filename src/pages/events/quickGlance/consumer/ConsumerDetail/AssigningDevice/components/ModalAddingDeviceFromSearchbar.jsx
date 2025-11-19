import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, message, Modal, Table } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import Loading from "../../../../../../../components/animation/Loading";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import { onOpenDeviceAssignmentModalFromSearchPage } from "../../../../../../../store/slices/devicesHandleSlice";
import { DangerButton } from "../../../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../../../styles/global/DangerButtonText";
import { Subtitle } from "../../../../../../../styles/global/Subtitle";
import AddingDeviceToPaymentIntentFromSearchBar from "../AddingDeviceToPaymentIntentFromSearchBar";
import DisplayDeviceRequestedLegendPerTransaction from "./DisplayDeviceRequestedLegendPerTransaction";

const ModalAddingDeviceFromSearchbar = () => {
  const { paymentIntentSelected, paymentIntentDetailSelected, customer } =
    useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const dispatch = useDispatch();
  const findingAssignedInPaymentIntentQuery = useQuery({
    queryKey: ["assignedDeviceInPaymentIntent"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned", {
        paymentIntent: paymentIntentSelected,
      }),
    enabled: paymentIntentSelected !== "",
  });
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
  const [transactionInformation, setTransactionInformation] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    // findingAssignedInPaymentIntentQuery.refetch();
    const grouping = groupBy(stripeTransactionsSavedQuery, "paymentIntent");
    if (grouping[paymentIntentSelected]) {
      setTransactionInformation(grouping[paymentIntentSelected]?.[0]);
    } else {
      setTransactionInformation(null);
    }
    return () => {
      controller.abort();
    };
  }, [findingAssignedInPaymentIntentQuery.data]);

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
        key: "key",
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
              flexDirection={"column"}
              alignItems={"center"}
              justifyContent={"center"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              {transactionInformation && (
                <DisplayDeviceRequestedLegendPerTransaction
                  record={transactionInformation}
                  checked={checkDevicesInTransaction()}
                />
              )}

              <AddingDeviceToPaymentIntentFromSearchBar
                refetchingFn={refetchingFn}
                key={"adding-single-device"}
                record={transactionInformation}
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
            <BlueButtonComponent
              title={"Assigned and Save"}
              func={() => closeModal()}
              style={{
                display:
                  foundTransactionAndDevicesAssigned()?.length ===
                  paymentIntentDetailSelected?.device
                    ? "flex"
                    : "none",
              }}
            />
            <BlueButtonComponent
              title={"Continue later"}
              func={() => closeModal()}
            />
            {/* <Button
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
            </Button> */}
            {/* <Button
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
            </Button> */}
          </Grid>
          <Grid item xs={12}>
            {checkDevicesInTransaction().length > 0 && (
              <Table
                columns={columns}
                dataSource={checkDevicesInTransaction()}
                pagination={{
                  position: ["bottomLeft"],
                }}
              />
            )}
          </Grid>
        </Grid>
      </Modal>
    );
  }
};

export default ModalAddingDeviceFromSearchbar;
