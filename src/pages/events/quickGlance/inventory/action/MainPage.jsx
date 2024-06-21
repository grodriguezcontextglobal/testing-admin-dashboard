import { Grid } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Popconfirm, notification } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  ExchangeIcon,
  LostItem,
  ReturnIcon,
} from "../../../../../components/icons/Icons";
import { onAddCustomerInfo } from "../../../../../store/slices/customerSlice";
import { onAddDeviceToDisplayInQuickGlance } from "../../../../../store/slices/devicesHandleSlice";
import {
  onReceiverObjectToReplace,
  onTriggerModalToReplaceReceiver,
} from "../../../../../store/slices/helperSlice";
import {
  onAddCustomer,
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import Choice from "../lostFee/Choice";
import { Replace } from "./Replace";
const ActionsMainPage = () => {
  const [openLostModal, setOpenLostModal] = useState(false);
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  const { event } = useSelector((state) => state.event);
  const { triggerModal } = useSelector((state) => state.helper);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: type,
      description: msg,
    });
  };
  const queryClient = useQueryClient();
  const handleReturnDevice = async () => {
    const respo = await devitrakApi.post("/receiver/receiver-assigned-list", {
      "device.serialNumber": deviceInfoSelected.entireData.device,
      "device.status": true,
      "device.deviceType": deviceInfoSelected.entireData.type,
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company,
    });
    if (respo.data.ok) {
      const assignedDevice = respo.data.listOfReceivers.at(-1);
      await devitrakApi.patch(
        `/receiver/receiver-update/${assignedDevice.id}`,
        {
          id: assignedDevice.id,
          device: { ...assignedDevice.device, status: false },
          timeStamp: new Date().getTime(),
        }
      );
      const respoPool = await devitrakApi.post("/receiver/receiver-pool-list", {
        device: deviceInfoSelected.entireData.device,
        type: deviceInfoSelected.entireData.type,
        activity: true,
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      });
      if (respoPool.data.ok) {
        const poolDevice = respoPool.data.receiversInventory.at(-1);
        await devitrakApi.patch(
          `/receiver/receivers-pool-update/${poolDevice.id}`,
          {
            id: poolDevice.id,
            activity: false,
          }
        );
        openNotificationWithIcon("success", "Device returned.");
        queryClient.invalidateQueries({
          queryKey: ["assignedDeviceListQuery"],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["deviceInPoolList"],
          exact: true,
        });
        dispatch(
          onAddDeviceToDisplayInQuickGlance({
            ...deviceInfoSelected,
            activity: false,
            entireData: {
              ...deviceInfoSelected.entireData,
              activity: true,
            },
          })
        );
      }
    }
  };
  const handleLostSingleDevice = async () => {
    try {
      const respo = await devitrakApi.post("/receiver/receiver-assigned-list", {
        "device.serialNumber": deviceInfoSelected.serialNumber,
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      });
      if (respo.data.ok) {
        const emailUser = respo.data.listOfReceivers.at(-1).user;
        const customerHTTP = await devitrakApi.post("/auth/users", {
          email: emailUser,
        });
        if (customerHTTP.data.ok) {
          const userFound = customerHTTP.data.users.at(-1);
          const templateConsumer = {
            ...userFound,
            uid: userFound.id,
          };
          dispatch(
            onAddDevicesAssignedInPaymentIntent([
              respo.data.listOfReceivers.at(-1),
            ])
          );
          dispatch(
            onAddPaymentIntentSelected(
              respo.data.listOfReceivers.at(-1).paymentIntent
            )
          );
          dispatch(
            onAddPaymentIntentDetailSelected(respo.data.listOfReceivers.at(-1))
          );
          dispatch(onAddCustomer(templateConsumer));
          dispatch(onAddCustomerInfo(templateConsumer));
          dispatch(
            onReceiverObjectToReplace({
              deviceType: deviceInfoSelected.entireData.type,
              serialNumber: deviceInfoSelected.entireData.device,
            })
          );
          dispatch(
            onAddDevicesAssignedInPaymentIntent(
              respo.data.listOfReceivers.at(-1)
            )
          );
          setOpenLostModal(true);
        }
      }
    } catch (error) {
      openNotificationWithIcon(
        "error",
        `Something went wrong, please try later! ${error.message}`
      );
    }
  };

  const exchangeDefectedDevice = () => {
    dispatch(onTriggerModalToReplaceReceiver(true));
    dispatch(
      onReceiverObjectToReplace({
        deviceType: deviceInfoSelected.entireData.type,
        serialNumber: deviceInfoSelected.entireData.device,
        status: true,
      })
    );
  };

  return (
    <>
      {contextHolder}
      <Grid
        padding={"0px"}
        display={"flex"}
        justifyContent={"space-between"}
        textAlign={"left"}
        alignItems={"flex-start"}
        alignSelf={"stretch"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Card
          style={{
            borderRadius: "12px",
            border: "none",
            background: "transparent",
            boxShadow: "none",
            textAlign: "right",
            padding: 0,
          }}
        >
          {deviceInfoSelected.activity && (
            <Grid
              container
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Grid
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                margin={"0 5px 0 0"}
                item
                xs={12}
                sm={12}
                md={4}
                lg={3}
              >
                <Button
                  onClick={() => handleLostSingleDevice()}
                  style={{ ...DangerButton, outline: "none" }}
                >
                  <LostItem />
                  <p
                    style={{
                      ...DangerButtonText,
                      textTransform: "capitalize",
                      textAlign: "left",
                    }}
                  >
                    lost
                  </p>
                </Button>
              </Grid>
              <Grid
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                margin={"0 5px 0 0"}
                gap={1}
                item
                xs={12}
                sm={12}
                md={4}
                lg={3}
              >
                <Button
                  onClick={() => exchangeDefectedDevice()}
                  style={{ ...DangerButton, outline: "none" }}
                >
                  <ExchangeIcon />
                  <p
                    style={{
                      ...DangerButtonText,
                      textTransform: "capitalize",
                      textAlign: "left",
                    }}
                  >
                    exchange
                  </p>
                </Button>
              </Grid>
              <Grid
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                item
                xs={12}
                sm={12}
                md={4}
                lg={3}
              >
                <Popconfirm
                  title="Are you sure?"
                  onConfirm={() => handleReturnDevice()}
                >
                  <Button style={{ ...LightBlueButton, outline: "none" }}>
                    <ReturnIcon />
                    <p style={{ ...LightBlueButtonText, textAlign: "left" }}>
                      Return
                    </p>
                  </Button>
                </Popconfirm>
              </Grid>
            </Grid>
          )}
        </Card>
      </Grid>
      {openLostModal && (
        <Choice openModal={openLostModal} setOpenModal={setOpenLostModal} />
      )}
      {triggerModal && <Replace />}
    </>
  );
};

export default ActionsMainPage;
