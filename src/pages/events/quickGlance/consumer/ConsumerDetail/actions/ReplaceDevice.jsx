import {
  Button,
  Grid,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, notification } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import {
  onReceiverObjectToReplace,
  onTriggerModalToReplaceReceiver,
} from "../../../../../../store/slices/helperSlice";
import {
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../../store/slices/stripeSlice";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import "../../../../../../styles/global/ant-select.css";
import { Subtitle } from "../../../../../../styles/global/Subtitle";
const menuOptions = ["Network", "Hardware", "Damaged", "Battery", "Other"];
export const ReplaceDevice = ({ refetching }) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const { paymentIntentSelected, customer } = useSelector(
    (state) => state.stripe
  );
  const { triggerModal, receiverToReplaceObject } = useSelector(
    (state) => state.helper
  );
  const stampTime = `${new Date()}`;
  const { register, setValue, watch, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  const queryClient = useQueryClient();

  const assignedDeviceInTransactionQuery = useQuery({
    queryKey: ["assignedDeviceInTransaction"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        "device.serialNumber": receiverToReplaceObject.serialNumber,
        "device.deviceType": receiverToReplaceObject.deviceType,
        paymentIntent: paymentIntentSelected,
      }),
    refetchOnMount: false,
    notifyOnChangeProps: ["data", "dataUpdatedAt"],
  });

  const deviceInPoolQuery = useQuery({
    queryKey: ["deviceInPoolList"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName, //event.eventInfoDetail.eventName,
        company: user.companyData.id,
        activity: false,
        device: receiverToReplaceObject.serialNumber,
        type: receiverToReplaceObject.deviceType,
      }),
    // enabled: false,
    refetchOnMount: false,
    notifyOnChangeProps: ["data", "dataUpdatedAt"],
  });
  useEffect(() => {
    const controller = new AbortController();
    assignedDeviceInTransactionQuery.refetch();
    deviceInPoolQuery.refetch();

    return () => {
      controller.abort();
    };
  }, []);

  const deviceInPool = deviceInPoolQuery?.data?.data?.receiversInventory;
  const assignedDeviceInTransaction =
    assignedDeviceInTransactionQuery?.data?.data?.listOfReceivers;

  const handleClearRecord = () => {
    dispatch(onAddPaymentIntentSelected(undefined));
    dispatch(onAddPaymentIntentDetailSelected([]));
  };
  function closeModal() {
    setValue("serialNumber", "");
    setValue("reason", "");
    setValue("otherComment", "");
    dispatch(onTriggerModalToReplaceReceiver(false));
    dispatch(onReceiverObjectToReplace({}));
    handleClearRecord();
  }
  //!refactoring functions based on new schema from DB
  //*function to insert data of defected returned device
  const defectedDevice = async (props) => {
    const template = {
      device: receiverToReplaceObject.serialNumber,
      status: props.reason,
      activity: false,
      comment: props.otherComment,
      user: customer.email,
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company,
      admin: user.email,
      timeStamp: new Date().toDateString(),
    };
    await devitrakApi.post("/receiver/receiver-returned-issue", template);
  };

  //*function to create activity in repot document in DB
  const reportEventLog = async (props) => {
    const eventProfile = {
      user: user.email,
      actionTaken: `Device ${receiverToReplaceObject.serialNumber} was replaced for ${props.serialNumber}`,
      time: stampTime,
      action: "device",
      company: user.company,
    };
    await devitrakApi.post("/event-log/feed-event-log", eventProfile);
  };

  //*function to update old device in pool
  const updateOldDeviceInPool = async (props) => {
    await devitrakApi.patch(
      `/receiver/receivers-pool-update/${deviceInPool.at(-1).id}`,
      {
        status: props.reason,
        activity: false,
        comment: props.otherComment,
      }
    );
  };

  //*function to update new device in pool
  const updateNewDeviceInPool = async (props) => {
    const newDeviceToAssignData = await devitrakApi.post(
      "/receiver/receiver-pool-list",
      {
        eventSelected: event.eventInfoDetail.eventName, //event.eventInfoDetail.eventName,
        company: user.companyData.id,
        device: props.serialNumber,
        type: receiverToReplaceObject.deviceType,
      }
    );
    if (newDeviceToAssignData.data.ok) {
      const newDeviceInfo =
        newDeviceToAssignData.data.receiversInventory.at(-1);
      await devitrakApi.patch(
        `/receiver/receivers-pool-update/${newDeviceInfo.id}`,
        {
          status: "Operational",
          activity: true,
          comment: "No comment",
        }
      );
    }
  };

  //*function to update new device in transaction
  const updateNewDeviceInTransaction = async (props) => {
    await devitrakApi.patch(
      `/receiver/receiver-update/${assignedDeviceInTransaction.at(-1).id}`,
      {
        id: assignedDeviceInTransaction.at(-1).id,
        device: {
          ...assignedDeviceInTransaction.at(-1).device,
          serialNumber: props.serialNumber,
        },
      }
    );
    queryClient.invalidateQueries({
      queryKey: ["assginedDeviceList"],
      exact: true,
    });
  };

  //*funtion to check if new device is assigned to another customer
  const checkIfNewDeviceIsAssignedToAnotherCustomer = async (props) => {
    const check = await devitrakApi.post("/receiver/receiver-pool-list", {
      eventSelected: event.eventInfoDetail.eventName,
      company: user.companyData.id,
      device: props.serialNumber,
      type: receiverToReplaceObject.deviceType,
      activity: true,
    });
    return check.data.receiversInventory.length > 0;
  };
  const replaceDevice = async (data) => {
    const checkingBeforeContinueWithReplace =
      await checkIfNewDeviceIsAssignedToAnotherCustomer(data);
    if (checkingBeforeContinueWithReplace) {
      setValue("serialNumber", "");
      setValue("reason", "");
      setValue("otherComment", "");
      return alert(
        "New device is assigned to another customer. Please return this device first."
      );
    } else {
      await updateOldDeviceInPool(data);
      await updateNewDeviceInPool(data);
      await updateNewDeviceInTransaction(data);
      await defectedDevice(data);
      reportEventLog(data);
      handleClearRecord();
      queryClient.invalidateQueries({
        queryKey: ["assginedDeviceList"],
        exact: true,
      });
      refetching();
      openNotificationWithIcon("success", "Device replaced successfully.");
      closeModal();
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`Receiver to replace: ${receiverToReplaceObject?.serialNumber}`}
        centered
        open={triggerModal}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        maskClosable={false}
        style={{ zIndex: 30 }}
      >
        <form
          style={{
            ...CenteringGrid,
            flexDirection: "column",
            width: "100%",
          }}
          onSubmit={handleSubmit(replaceDevice)}
        >
          <Grid container>
            <Grid margin={"1rem auto"} item xs={12} sm={12} md={12} lg={12}>
              <label>
                <p style={Subtitle}>New serial number</p>
                <OutlinedInput
                  required
                  id="outlined-adornment-password"
                  placeholder="Serial number"
                  {...register("serialNumber")}
                  style={OutlinedInputStyle}
                  fullWidth
                />
              </label>
            </Grid>
            <Grid margin={"1rem auto"} item xs={12} sm={12} md={12} lg={12}>
              <label>
                <p
                  style={{
                    ...Subtitle,
                    width: "100%",
                    display: `${
                      watch("serialNumber") !== "" ? "flex" : "none"
                    }`,
                  }}
                >
                  Reason
                </p>
                {watch("serialNumber") !== "" && (
                  <Select
                    className="custom-autocomplete"
                    {...register("reason", { required: true })}
                    style={{ ...AntSelectorStyle, width: "100%" }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {menuOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        <Typography>{option}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </label>
            </Grid>
            <Grid margin={"1rem auto"} item xs={12} sm={12} md={12} lg={12}>
              <label>
                <p
                  style={{
                    ...Subtitle,
                    width: "100%",
                    display: `${watch("reason") === "Other" ? "flex" : "none"}`,
                  }}
                >
                  when Other Reason is selected, please add comment
                </p>
                {watch("reason") === "Other" && (
                  <OutlinedInput
                    multiline
                    minRows={5}
                    style={{ ...OutlinedInputStyle, height: "" }}
                    type="text"
                    {...register("otherComment", { required: true })}
                    placeholder="Add comment..."
                    fullWidth
                  />
                )}
              </label>
            </Grid>
            {watch("reason") !== "" && (
              <Grid display={"flex"} alignItems={"center"} gap={2} container>
                <Button
                  disabled={watch("reason") !== ""}
                  onClick={closeModal}
                  style={{ ...GrayButton, width: "100%" }}
                >
                  <Typography textTransform={"none"} style={GrayButtonText}>
                    Cancel
                  </Typography>
                </Button>

                <Button
                  disabled={watch("reason") === ""}
                  type="submit"
                  style={{ ...BlueButton, width: "100%" }}
                >
                  <Typography textTransform={"none"} style={BlueButtonText}>
                    Save
                  </Typography>
                </Button>
              </Grid>
            )}{" "}
          </Grid>
        </form>
      </Modal>
    </>
  );
};
