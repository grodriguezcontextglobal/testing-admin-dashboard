//

import { Grid, MenuItem, Select, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import renderingTitle from "../../../components/general/renderingTitle";
import ModalUX from "../../../components/UX/modal/ModalUX";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { formatDate } from "../../inventory/utils/dateFormat";
import {
  RETURN_CONDITIONS,
  conditionLabel,
} from "../../../utils/returnConditions";


const UpdatingConsumerLease = ({
  openReturnDeviceStaffModal,
  setOpenReturnDeviceStaffModal,
  deviceInfo,
  refetching,
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
    const response = await devitrakApi.post(
      "/db_lease/update-consumer-lease-info",
      {
        subscription_returned_date: returnedDate,
        staff_admin_id: deviceInfo.staff_admin_id,
        company_id: deviceInfo.company_id,
        subscription_current_in_use: 0,
        consumer_member_id: deviceInfo.consumer_member_id,
        device_id: deviceInfo.item_id_info.item_id,
        active: 0,
        subscription_initial_date: initialDate,
      }
    );
    if (response.data && response.data.ok) {
      queryClient.invalidateQueries({
        queryKey: ["consumerSqlInfoQuery"],
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
      refetching();
      return closeModal();
    }
  };

  const closeModal = () => {
    return setOpenReturnDeviceStaffModal(false);
  };

  const bodyModal = () => {
    return (
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
              value={watch("reason") ?? ""}
              displayEmpty
              renderValue={(selected) =>
                selected ? (
                  <Typography>{conditionLabel(selected)}</Typography>
                ) : (
                  <Typography style={{ color: "var(--gray-500, #667085)" }}>
                    Select a condition
                  </Typography>
                )
              }
              style={{ ...AntSelectorStyle, width: "100%" }}
            >
              {/* No "None": the absence of a condition is a blank field, not an
                  entry on the list. */}
              {RETURN_CONDITIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Typography>{option.label}</Typography>
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
              <BlueButtonComponent
                disabled={watch("reason") === ""}
                buttonType="submit"
                styles={{ width: "100%" }}
              >
                Save
              </BlueButtonComponent>
            </Grid>
          )}{" "}
        </Grid>
      </form>
    );
  };
  return (
    <ModalUX
      title={renderingTitle(
        `Returning device #: ${deviceInfo.item_id_info.serial_number}`
      )}
      openDialog={openReturnDeviceStaffModal}
      closeModal={closeModal}
      body={bodyModal()}
    />
    // <Modal
    //   title={renderingTitle(
    //     `Returning device #: ${deviceInfo.item_id_info.serial_number}`
    //   )}
    //   centered
    //   open={openReturnDeviceStaffModal}
    //   onCancel={() => closeModal()}
    //   footer={[]}
    //   maskClosable={false}
    //   style={{ zIndex: 30 }}
    // >
    // </Modal>
  );
};
export default UpdatingConsumerLease;
