import { Grid, MenuItem, Select, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import renderingTitle from "../../../components/general/renderingTitle";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { formatDate } from "../../inventory/utils/dateFormat";

const options = ["Operational", "Network", "Hardware", "Damaged", "Battery"];
const ModalReturnItem = ({
  openReturnDeviceStaffModal,
  setOpenReturnDeviceStaffModal,
  deviceInfo,
  returnFunction,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleReturnDevice = async (data) => {
    try {
      setIsLoading(true);
      const respoUpdateDeviceInStock = await devitrakApi.post(
        "/db_event/returning-item",
        {
          warehouse: 1,
          status: data.reason,
          update_at: formatDate(new Date()),
          serial_number: deviceInfo.item_id_info.serial_number,
          category_name: deviceInfo.item_id_info.category_name,
          item_group: deviceInfo.item_id_info.item_group,
          company_id: user.sqlInfo.company_id,
        }
      );
      if (respoUpdateDeviceInStock.data) {
        await updateLeaseInfo();
      }
    } catch (error) {
      return setIsLoading(false);
    }
  };

  const updateLeaseInfo = async () => {
    const returnedDate = formatDate(new Date());
    const response = await devitrakApi.post("/db_lease/update-consumer-lease-info", {
      subscription_returned_date: returnedDate,
      staff_admin_id: deviceInfo.staff_admin_id,
      company_id: deviceInfo.company_id,
      subscription_current_in_use: 0,
      consumer_member_id: deviceInfo.consumer_member_id,
      device_id: deviceInfo.item_id_info.item_id,
      active: 0,
    });
    if (response.data && response.data.ok) {
      await devitrakApi.post("/db_lease/delete-consumer-lease-info", {
        company_id: deviceInfo.company_id,
        consumer_member_id: deviceInfo.consumer_member_id,
        device_id: deviceInfo.item_id_info.item_id,
      });
      const eventInfoForRemovingRow = await devitrakApi.post(
        "/db_record/checking",
        {
          item_id: deviceInfo.device_id,
          company_assigned_event_id: deviceInfo.company_id,
        }
      );

      if (eventInfoForRemovingRow.data) {
        await devitrakApi.post("/db_record/removing-row-item-event-record", {
          item_id: deviceInfo.device_id,
          event_id: eventInfoForRemovingRow.data.result[0].event_id,
        });
        return closingEventAndReturningDevice();
      }
    }
  };

  const closingEventAndReturningDevice = async () => {
    try {
      const checkEventByDevice = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          company: user.companyData.id,
          device: deviceInfo.item_id_info.serial_number,
          type: deviceInfo.item_id_info.item_group,
        }
      );
      if (checkEventByDevice.data) {
        const deviceUpdate = await devitrakApi.patch(
          `/receiver/receivers-pool-update/${
            checkEventByDevice.data.receiversInventory.at(-1).id
          }`,
          {
            activity: false,
          }
        );

        if (deviceUpdate.data.ok) {
          await returnFunction(deviceInfo.rowRecord);
          queryClient.invalidateQueries({
            queryKey: ["assignedDevicesByTransaction"],
            exact: true,
          });
          return closeModal();
        }
      }
    } catch (error) {
      return null;
    }
  };

  const closeModal = () => {
    return setOpenReturnDeviceStaffModal(false);
  };
  return (
    <Modal
      title={renderingTitle(
        `Returning device #: ${deviceInfo?.item_id_info?.serial_number}`
      )}
      centered
      open={openReturnDeviceStaffModal}
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
        onSubmit={handleSubmit(handleReturnDevice)}
      >
        <Grid container>
          <Grid margin={"1rem auto"} item xs={12} sm={12} md={12} lg={12}>
            <Select
              className="custom-autocomplete"
              {...register("reason", { required: true })}
              style={{ ...AntSelectorStyle, width: "100%" }}
            >
              <MenuItem value="">None</MenuItem>
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  <Typography>{option}</Typography>
                </MenuItem>
              ))}
            </Select>
          </Grid>
          {watch("reason") !== "" && (
            <Grid
              display={"flex"}
              flexDirection={"row"}
              justifyContent={"space-between"}
              alignItems={"center"}
              gap={2}
              container
            >
              <Button
                loading={isLoading}
                disabled={watch("reason") === ""}
                htmlType="submit"
                style={{ ...BlueButton, width: "100%" }}
              >
                <Typography
                  textTransform={"none"}
                  style={{ ...BlueButtonText, ...CenteringGrid }}
                >
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

export default ModalReturnItem;
