import { Grid, MenuItem, Select, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal, notification } from "antd";
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
import { Subtitle } from "../../../../../../styles/global/Subtitle";
const menuOptions = [
  "Operational",
  "Network",
  "Hardware",
  "Damaged",
  "Battery",
  "Other",
];

const UpdateStatus = ({ openUpdateStatusModal, setOpenUpdateStatusModal }) => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  const { register, setValue, watch, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  const queryClient = useQueryClient();

  const handleClearRecord = () => {
    dispatch(onAddPaymentIntentSelected(undefined));
    dispatch(onAddPaymentIntentDetailSelected([]));
  };

  function closeModal() {
    setValue("reason", "");
    dispatch(onTriggerModalToReplaceReceiver(false));
    dispatch(onReceiverObjectToReplace({}));
    handleClearRecord();
    setOpenUpdateStatusModal(false);
  }

  const replaceDevice = async (data) => {
    await devitrakApi.patch(
      `/receiver/receivers-pool-update/${deviceInfoSelected.entireData.id}`,
      { status: data.reason }
    );
    handleClearRecord();
    queryClient.invalidateQueries({
      queryKey: ["assginedDeviceList"],
      exact: true,
    });
    openNotificationWithIcon("Success", "Device status updated successfully.");
    return closeModal();
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`Update status of device: ${deviceInfoSelected?.serialNumber}`}
        centered
        open={openUpdateStatusModal}
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
                <p
                  style={{
                    ...Subtitle,
                    width: "100%",
                    display: `${
                      watch("serialNumber") !== "" ? "flex" : "none"
                    }`,
                  }}
                >
                  New status
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
                  htmlType="submit"
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

export default UpdateStatus;
