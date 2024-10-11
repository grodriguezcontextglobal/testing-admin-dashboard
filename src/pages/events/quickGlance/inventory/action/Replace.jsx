import {
  Button,
  Grid,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { onAddDeviceToDisplayInQuickGlance } from "../../../../../store/slices/devicesHandleSlice";
import {
  onReceiverObjectToReplace,
  onTriggerModalToReplaceReceiver,
} from "../../../../../store/slices/helperSlice";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
const menuOptions = ["Network", "Hardware", "Damaged", "Battery", "Other"];
export const Replace = () => {
  const [newDeviceInfoFromPool, setNewDeviceInfoFromPool] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  const { triggerModal } = useSelector((state) => state.helper);
  const { register, setValue, watch, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const deviceInPoolQuery = useQuery({
    queryKey: ["deviceInPool"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: deviceInfoSelected.entireData.eventSelected, //pass event id
        company: user.companyData.id,
        device: deviceInfoSelected.entireData.device,
        type: deviceInfoSelected.entireData.type,
        activity: deviceInfoSelected.entireData.activity,
      }),
    // enabled: false,
    refetchOnMount: false,
    cacheTime: 1000 * 60 * 2,
  });

  const deviceInTransactionQuery = useQuery({
    queryKey: ["deviceInTransation"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        eventSelected: deviceInfoSelected.entireData.eventSelected,
        company: user.companyData.id,
        "device.serialNumber": deviceInfoSelected.entireData.device,
        "device.deviceType": deviceInfoSelected.entireData.type,
        "device.status": true,
      }),
    // enabled: false,
    refetchOnMount: false,
    cacheTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    const controller = new AbortController();
    deviceInPoolQuery.refetch();
    deviceInTransactionQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  function closeModal() {
    setValue("serialNumber", "");
    setValue("reason", "");
    setValue("otherComment", "");
    dispatch(onTriggerModalToReplaceReceiver(false));
    dispatch(onReceiverObjectToReplace({}));
  }
  //!refactoring functions based on new schema from DB
  //*function to insert data of defected returned device
  const defectedDevice = async (props) => {
    const template = {
      device: deviceInfoSelected.entireData.serialNumber,
      status: props.reason,
      activity: false,
      comment: props.otherComment,
      user: deviceInTransactionQuery.data.data.user,
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company,
      admin: user.email,
      timeStamp: new Date().toDateString(),
    };
    await devitrakApi.post("/receiver/receiver-returned-issue", template);
  };
  //*function to update old device in pool
  const updateOldDeviceInPool = async (props) => {
    await devitrakApi.patch(
      `/receiver/receivers-pool-update/${
        deviceInPoolQuery?.data.data.receiversInventory.at(-1).id
      }`,
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
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        device: props.serialNumber,
        type: deviceInfoSelected.entireData.type,
      }
    );
    if (newDeviceToAssignData.data.ok) {
      await devitrakApi.patch(
        `/receiver/receivers-pool-update/${
          newDeviceToAssignData.data.receiversInventory.at(-1).id
        }`,
        {
          status: "Operational",
          activity: true,
          comment: "No comment",
        }
      );
      return setNewDeviceInfoFromPool(
        newDeviceToAssignData.data.receiversInventory.at(-1)
      );
    }
  };

  //*function to update new device in transaction
  const updateNewDeviceInTransaction = async (props) => {
    await devitrakApi.patch(
      `/receiver/receiver-update/${
        deviceInTransactionQuery?.data.data.listOfReceivers.at(-1).id
      }`,
      {
        id: deviceInTransactionQuery?.data.data.listOfReceivers.at(-1).id,
        device: {
          ...deviceInTransactionQuery?.data.data.listOfReceivers.at(-1).device,
          serialNumber: props.serialNumber,
        },
        timeStamp: new Date().getTime(),
      }
    );
  };

  //*function to create activity in repot document in DB
  const replaceDevice = async (data) => {
    await updateOldDeviceInPool(data);
    await updateNewDeviceInPool(data);
    await updateNewDeviceInTransaction(data);
    await defectedDevice(data);
    queryClient.invalidateQueries({
      queryKey: ["assignedDeviceInEvent"],
      exact: true,
    });
    queryClient.invalidateQueries({ queryKey: ["pool"], exact: true });
    queryClient.invalidateQueries({
      queryKey: ["devicesAssignedPerTransaction"],
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: ["assginedDeviceList"],
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: ["listOfDevicesInPool"],
      exact: true,
    });
    dispatch(
      onAddDeviceToDisplayInQuickGlance({
        company: [event.eventInfoDetail.eventName, event.company],
        activity: true,
        status: "Operational",
        serialNumber: data.serialNumber,
        user: "YES",
        entireData: {
          eventSelected: event.eventInfoDetail.eventName,
          device: data.serialNumber,
          type: deviceInfoSelected.entireData.type,
          status: "Operational",
          activity: true,
          comment: "No comment",
          provider: event.company,
          id: newDeviceInfoFromPool.id,
        },
      })
    );
    closeModal();
  };
  return (
    <Modal
      title={`Receiver to replace: ${deviceInfoSelected?.serialNumber}`}
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
              <p style={{ ...Subtitle, width: "100%" }}>New serial number</p>
              <OutlinedInput
                required
                id="outlined-adornment-password"
                placeholder="New serial number"
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
                  display: `${watch("serialNumber") !== "" ? "flex" : "none"}`,
                }}
              >
                Reason
              </p>
              {watch("serialNumber") !== "" && (
                <Select
                  {...register("reason")}
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
  );
};
