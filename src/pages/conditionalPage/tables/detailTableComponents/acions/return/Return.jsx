import {
  Grid,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import { Divider, message } from "antd";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { formatDate } from "../../../../../inventory/utils/dateFormat";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
const options = ["Operational", "Network", "Hardware", "Damaged", "Battery"];

const Return = ({ storedRecord, modalHandler, setStoredRecord }) => {
  const { register, handleSubmit, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector((state) => state.member);
  const queryClient = useQueryClient();
  const returnItemToInventoryCompany = useMutation({
    mutationKey: ["returnItemToInventoryCompany"],
    mutationFn: async (data) =>
      await devitrakApi.post("/db_event/returning-item", {
        warehouse: 1,
        status: data.reason,
        update_at: formatDate(new Date()),
        serial_number: storedRecord.device_serial_number,
        category_name: storedRecord.device_category_name,
        item_group: storedRecord.device_item_group,
        company_id: user.sqlInfo.company_id,
      }),
    onSuccess: () => {
      updateLeaseInfo();
    },
    onError: (error) => {
      setLoading(false);
      throw new Error(error);
    },
  });
  const deleteMemberLeaseRowInTable = useMutation({
    mutationFn: async () => {
      const response = await devitrakApi.post(
        "/db_member/delete-member-assigned-device-lease",
        {
          where: {
            company_id: storedRecord.company_id,
            member_id: storedRecord.member_id,
            device_id: storedRecord.device_id,
          },
        }
      );
      if (response.data && response.data.ok) {
        return response.data;
      }
    },
    onSuccess: async () => {
      await closingEventAndReturningDevice();
    },
  });
  const updateDeviceInPoolArea = useMutation({
    mutationKey: ["updateDeviceInPoolArea"],
    mutationFn: async (id) => {
      await devitrakApi.patch(`/receiver/receivers-pool-update/${id}`, {
        activity: false,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["devicesAssignedActive"],
        exact: true,
        refetchType: "active",
        refetchActive: true,
      });
      await sentReturnEmailNotification();
      setStoredRecord({});
      modalHandler(false);
    },
  });

  const sentReturnEmailNotification = async () => {
    const response = await devitrakApi.post(
      "/nodemailer/member-lease-return-device-notification",
      {
        member: {
          firstName: memberInfo?.first_name,
          lastName: memberInfo?.last_name,
          email: memberInfo?.email,
        },
        devices: [
          {
            device: {
              serialNumber: storedRecord.device_serial_number,
              deviceType: storedRecord.device_category_name,
            },
          },
        ],
      }
    );
    if (response.data && response.data.ok) {
      return message.success(
        `Return device success and an email notification sent to ${memberInfo?.email}`
      );
    }
  };
  const handleReturnDevice = async (data) => {
    try {
      setLoading(true);
      await returnItemToInventoryCompany.mutateAsync(data);
    } catch (error) {
      setLoading(false);
      throw new Error(error);
    }
  };
  const updateLeaseInfo = async () => {
    return await deleteMemberLeaseRowInTable.mutateAsync();
  };
  const closingEventAndReturningDevice = async () => {
    try {
      const checkEventByDevice = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          company: user.companyData.id,
          device: storedRecord.device_serial_number,
          type: storedRecord.device_item_group,
        }
      );
      if (checkEventByDevice.data) {
        await updateDeviceInPoolArea.mutateAsync(
          checkEventByDevice.data.receiversInventory.at(-1).id
        );
      }
    } catch (error) {
      setLoading(false);
      // console.log(error);
      // return closeModal();
    } finally {
      setLoading(false);
      // closeModal();
    }
  };
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
        <Grid item xs={12} sm={12} md={6} lg={4} margin={"0 1rem 0 0"}>
          <Typography>Device</Typography>
          <OutlinedInput
            value={storedRecord?.device_serial_number}
            style={{ ...OutlinedInputStyle, width: "100%" }}
            readOnly={true}
          />
        </Grid>
        <Grid item xs={12} sm={12} md={5} lg={4}>
          <Typography>Return Date</Typography>
          <OutlinedInput
            value={new Date().toLocaleDateString()}
            style={{ ...OutlinedInputStyle, width: "100%" }}
            readOnly={true}
          />
        </Grid>
        <Divider />
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <Typography>Returned device condition</Typography>
        </Grid>
        <Grid margin={"1rem auto"} item xs={12} sm={12} md={12} lg={12}>
          <Select
            className="custom-autocomplete"
            {...register("reason", { required: true })}
            style={{ ...AntSelectorStyle, width: "100%" }}
            autoComplete="off"
            clearable={true}
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
            <BlueButtonComponent
              title={"Return and Save"}
              loadingState={loading}
              disabled={watch("reason") === "" || loading}
              buttonType="submit"
            />
          </Grid>
        )}{" "}
      </Grid>
    </form>
  );
};
export default Return;
