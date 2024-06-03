import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Modal, Table } from "antd";
// import _ from 'lodash';
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onOpenDeviceAssignmentModalFromSearchPage } from "../../../../../../../store/slices/devicesHandleSlice";
import AddingDeviceToPaymentIntentFromSearchBar from "../AddingDeviceToPaymentIntentFromSearchBar";

const ModalAddingDeviceFromSearchbar = () => {
  const { paymentIntentSelected, paymentIntentDetailSelected, customer } =
    useSelector((state) => state.stripe);
  const findindAssignedInPaymentIntentQuery = useQuery({
    queryKey: ["assignedDeviceInPaymentIntent"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned", {
        paymentIntent: paymentIntentSelected,
      }),
    enabled: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    findindAssignedInPaymentIntentQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const dispatch = useDispatch();
  const { openModalToAssignDevice } = useSelector(
    (state) => state.devicesHandle
  );
  const refetchingFn = () => {
    return findindAssignedInPaymentIntentQuery.refetch();
  };
  const closeModal = () => {
    dispatch(onOpenDeviceAssignmentModalFromSearchPage(false));
  };

  if (findindAssignedInPaymentIntentQuery.data) {
    const deviceAssignedListQuery =
      findindAssignedInPaymentIntentQuery?.data?.data?.receiver; //*need to get the final result form finding assigned device query

    const foundTransactionAndDevicesAssigned = () => {
      if (deviceAssignedListQuery?.length) return deviceAssignedListQuery;
      return [];
    };
    const checkDevicesInTransaction = () => {
      const result = new Set();
      for (let data of foundTransactionAndDevicesAssigned()) {
        result.add(data.device);
      }
      return Array.from(result);
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
      },
      {
        title: "Type",
        dataIndex: "deviceType",
        key: "deviceType",
        width: "20%",
        sorter: {
          compare: (a, b) => ("" + a.deviceType).localeCompare(b.deviceType),
        },
        sortDirections: ["descend", "ascend"],
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
          <p
            style={{
              textTransform: "none",
              textAlign: "left",
              fontWeight: 400,
              fontSize: "16px",
              fontFamily: "Inter",
              lineHeight: "24px",
            }}
          >
            {typeof status === "string"
              ? status
              : status
              ? "In-use"
              : "Returned"}
          </p>
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
