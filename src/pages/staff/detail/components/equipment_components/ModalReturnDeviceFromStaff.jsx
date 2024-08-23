import { Grid, MenuItem, Select, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal } from "antd";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../../../../api/devitrakApi";
import renderingTitle from "../../../../../components/general/renderingTitle";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { formatDate } from "../../../../inventory/utils/dateFormat";
import { useSelector } from "react-redux";

const options = ["Operational", "Network", "Hardware", "Damaged", "Battery"];
const ModalReturnDeviceFromStaff = ({
  openReturnDeviceStaffModal,
  setOpenReturnDeviceStaffModal,
  deviceInfo,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit, watch } = useForm();
  const queryClient = useQueryClient();
  const handleReturnDevice = async (data) => {
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
  };

  const updateLeaseInfo = async () => {
    const initialDate = formatDate(
      new Date(deviceInfo.subscription_initial_date)
    );
    const returnedDate = formatDate(new Date());
    const response = await devitrakApi.post("/db_lease/update-lease-info", {
      subscription_returned_date: returnedDate,
      staff_admin_id: deviceInfo.staff_admin_id,
      company_id: deviceInfo.company_id,
      subscription_current_in_use: 0,
      staff_member_id: deviceInfo.staff_member_id,
      device_id: deviceInfo.item_id_info.item_id,
      active: 0,
      subscription_initial_date: initialDate,
    });
    if (response.data && response.data.ok) {
      await devitrakApi.post("/db_lease/delete-lease-info", {
        company_id: deviceInfo.company_id,
        staff_member_id: deviceInfo.staff_member_id,
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
        queryClient.invalidateQueries({
          queryKey: ["staffMemberInfo"],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["imagePerItemList"],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["ItemsInventoryCheckingQuery"],
          exact: true,
        });

        return closeModal();
      }
    }
  };

  const closeModal = () => {
    return setOpenReturnDeviceStaffModal(false);
  };
  return (
    <Modal
      title={renderingTitle(
        `Returning device #: ${deviceInfo.item_id_info.serial_number}`
      )}
      centered
      open={openReturnDeviceStaffModal}
      onCancel={() => closeModal()}
      footer={[]}
      maskClosable={false}
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

export default ModalReturnDeviceFromStaff;
