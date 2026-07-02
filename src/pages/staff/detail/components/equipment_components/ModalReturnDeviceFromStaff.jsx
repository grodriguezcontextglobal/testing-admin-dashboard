import { MenuItem, Select, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import renderingTitle from "../../../../../components/general/renderingTitle";
import BlueButton from "../../../../../components/UX/buttons/BlueButton";
import GrayButton from "../../../../../components/UX/buttons/GrayButton";
import Label from "../../../../../components/UX/inputs/Label";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import { formatDate } from "../../../../inventory/utils/dateFormat";
import {
  RETURN_REASONS,
  buildDeleteLeasePayload,
  buildReturningItemPayload,
  buildUpdateLeasePayload,
  isReasonValid,
} from "./utils/returnDeviceUtils";

const ModalReturnDeviceFromStaff = ({
  openReturnDeviceStaffModal,
  setOpenReturnDeviceStaffModal,
  deviceInfo,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { reason: "" },
  });
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleReturnDevice = async (data) => {
    try {
      setIsLoading(true);
      const respoUpdateDeviceInStock = await devitrakApi.post(
        "/db_event/returning-item",
        buildReturningItemPayload(deviceInfo, user, data.reason, formatDate(new Date())),
      );
      if (respoUpdateDeviceInStock.data) {
        await updateLeaseInfo();
      }
    } catch (error) {
      setIsLoading(false);
      throw new Error(error);
    }
  };

  const updateLeaseInfo = async () => {
    const response = await devitrakApi.post(
      "/db_lease/update-lease-info",
      buildUpdateLeasePayload(deviceInfo, {
        initialDate: formatDate(new Date(deviceInfo.subscription_initial_date)),
        returnedDate: formatDate(new Date()),
      }),
    );
    if (response.data && response.data.ok) {
      await devitrakApi.post(
        "/db_lease/delete-lease-info",
        buildDeleteLeasePayload(deviceInfo),
      );
      const eventInfoForRemovingRow = await devitrakApi.post(
        "/db_record/checking",
        {
          item_id: deviceInfo.device_id,
          company_assigned_event_id: deviceInfo.company_id,
        },
      );

      if (eventInfoForRemovingRow.data) {
        await devitrakApi.post("/db_record/removing-row-item-event-record", {
          item_id: deviceInfo.device_id,
          event_id: eventInfoForRemovingRow.data.result[0].event_id,
        });
        queryClient.invalidateQueries({ queryKey: ["staffMemberInfo"], exact: true });
        queryClient.invalidateQueries({ queryKey: ["imagePerItemList"], exact: true });
        queryClient.invalidateQueries({
          queryKey: ["ItemsInventoryCheckingQuery"],
          exact: true,
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
        },
      );
      if (checkEventByDevice.data) {
        const deviceUpdate = await devitrakApi.patch(
          `/receiver/receivers-pool-update/${checkEventByDevice.data.receiversInventory.at(-1).id}`,
          { activity: false },
        );
        if (deviceUpdate.data) {
          return closeModal();
        }
      }
    } catch {
      return closeModal();
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const closeModal = async () => {
    await clearCacheMemory(
      `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`,
    );
    return setOpenReturnDeviceStaffModal(false);
  };

  const reasonSelected = isReasonValid(watch("reason"));

  const body = (
    <form
      style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}
      onSubmit={handleSubmit(handleReturnDevice)}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label>Reason for return</Label>
        <Select
          className="custom-autocomplete"
          defaultValue=""
          {...register("reason", { required: true })}
          style={{ ...AntSelectorStyle, width: "100%" }}
        >
          <MenuItem value="">None</MenuItem>
          {RETURN_REASONS.map((option) => (
            <MenuItem key={option} value={option}>
              <Typography>{option}</Typography>
            </MenuItem>
          ))}
        </Select>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          paddingTop: "16px",
          borderTop: "1px solid var(--gray-200, #EAECF0)",
        }}
      >
        <GrayButton title="Cancel" func={closeModal} buttonType="button" />
        <BlueButton
          title="Return and save"
          buttonType="submit"
          isLoading={isLoading}
          isDisabled={!reasonSelected || isLoading}
        />
      </div>
    </form>
  );

  return (
    <ModalUX
      title={renderingTitle(
        `Return device · SN: ${deviceInfo.item_id_info.serial_number}`,
      )}
      openDialog={openReturnDeviceStaffModal}
      closeModal={closeModal}
      width={440}
      footer={null}
      body={body}
    />
  );
};

ModalReturnDeviceFromStaff.propTypes = {
  openReturnDeviceStaffModal: PropTypes.bool,
  setOpenReturnDeviceStaffModal: PropTypes.func,
  deviceInfo: PropTypes.object,
};

export default ModalReturnDeviceFromStaff;
