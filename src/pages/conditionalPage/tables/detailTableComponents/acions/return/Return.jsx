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
import { registerStaffActivity } from "../../../../../../api/activityLog";
import { formatDate } from "../../../../../inventory/utils/dateFormat";
import { mapReturnToReceipt } from "../../../../../payment/utils/receiptUtils";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FEATURE_MEMBER_FEES } from "../../../../../../config/featureFlags";
import {
  buildFeeFields,
  buildLostItemPayload,
  buildReturnNotification,
  shouldOfferFeeCollection,
} from "../../../../utils/leaseReturnUtils";
const options = ["Operational", "Network", "Hardware", "Damaged", "Battery"];

/**
 * @param {Function} [onFeePending] called instead of a plain close when a fee
 *   was recorded, so the caller can offer to collect it right away. Lifted to
 *   the caller rather than opening a charge modal from inside this one, because
 *   this component lives inside a modal that is closing at that moment.
 * @param {Function} [onDeclarationRecorded] receives the constancia for what was
 *   just recorded, so the caller can offer to print it. Same lifting reason.
 */
const Return = ({
  storedRecord,
  modalHandler,
  setStoredRecord,
  onFeePending,
  onDeclarationRecorded,
}) => {
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
    onError: (error) => {
      setLoading(false);
      throw new Error(error);
    },
  });
  // A lost device is taken off the member WITHOUT being restocked. Skipping the
  // restock was already correct; what was missing is any write at all, which
  // left the item sitting at logistic_status "assigned" after its lease closed.
  const markItemAsLost = useMutation({
    mutationFn: async () => {
      const payload = buildLostItemPayload({
        record: storedRecord,
        companyId: user.sqlInfo.company_id,
      });
      if (!payload) return null;
      return await devitrakApi.post("/db_item/item-out-warehouse", payload);
    },
    onError: (error) => {
      setLoading(false);
      throw new Error(error);
    },
  });
  // History-preserving close: the lease row stays (with outcome + condition
  // note + returned_date) instead of being deleted.
  const closeMemberLeaseRowInTable = useMutation({
    mutationFn: async ({ outcome, note, fee = {} }) => {
      const response = await devitrakApi.post(
        "/db_member/update-member-assigned-device-lease",
        {
          company_id: storedRecord.company_id,
          where: {
            company_id: storedRecord.company_id,
            member_id: storedRecord.member_id,
            device_id: storedRecord.device_id,
          },
          update: {
            returned: 1,
            return_status: outcome,
            condition_note: note || null,
            returned_date: formatDate(new Date()),
            // Lost/damaged fee (B1) — only present when a positive amount was
            // entered and the fees feature is on; harmless no-op otherwise.
            ...fee,
          },
        }
      );
      if (response.data && response.data.ok) {
        return response.data;
      }
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["memberAssignedDevices"],
        exact: true,
        refetchType: "active",
        refetchActive: true,
      });
      registerStaffActivity({
        action: "UNASSIGN",
        target_model: "Lease",
        target_id: storedRecord.member_id,
        details: { device_id: storedRecord.device_id, outcome: variables?.outcome },
      });
      await sentReturnEmailNotification();
      // Hand the recorded fee up before tearing down, so the amount just
      // entered can be collected without retyping it. The lease row is already
      // closed at this point — declining the charge loses the collection, not
      // the record.
      const pendingFee = variables?.fee;
      // Constancia of what was just recorded. Built before the record is
      // cleared, and handed up because this component lives inside the modal
      // that is about to close.
      const receipt = mapReturnToReceipt({
        member: memberInfo,
        record: storedRecord,
        outcome: variables?.outcome,
        note: variables?.note,
        company: user?.company,
        date: new Date().toISOString(),
        staffName: [user?.name, user?.lastName].filter(Boolean).join(" "),
      });
      setStoredRecord({});
      modalHandler(false);
      setLoading(false);
      onDeclarationRecorded?.(receipt);
      if (onFeePending && shouldOfferFeeCollection(pendingFee)) {
        onFeePending({
          serial_number: storedRecord.device_serial_number,
          device_id: storedRecord.device_id,
          amount: pendingFee.fee_amount,
          reason: pendingFee.fee_reason,
        });
      }
    },
  });
  const sentReturnEmailNotification = async () => {
    // Routed through the shared recipient resolver: a minor's notices go to the
    // guardian on file, never to the student. This used to post
    // memberInfo.email unconditionally, which mailed a 15-year-old about their
    // own lost laptop.
    const { payload, recipient } = buildReturnNotification({
      member: memberInfo,
      record: storedRecord,
    });
    if (!payload) {
      // Say so instead of silently sending nothing — or worse, sending it to
      // the student. The device record itself is already saved at this point.
      return message.warning(
        `Device saved, but no notification was sent: ${recipient.error}`
      );
    }
    const response = await devitrakApi.post(
      "/nodemailer/member-lease-return-device-notification",
      payload
    );
    if (response.data && response.data.ok) {
      return message.success(
        recipient.isGuardian
          ? `Device saved. A notification was queued to the guardian (${recipient.email}).`
          : `Device saved. A notification was queued to ${recipient.email}.`
      );
    }
  };
  const handleReturnDevice = async (data) => {
    const outcome = data.outcome || "returned";
    try {
      setLoading(true);
      // Lost devices never come back — no restock. They still need an inventory
      // write, or the item stays "assigned" after the lease is closed.
      if (outcome === "lost") {
        await markItemAsLost.mutateAsync();
      } else {
        await returnItemToInventoryCompany.mutateAsync(data);
      }
      const fee = FEATURE_MEMBER_FEES
        ? buildFeeFields({
            outcome,
            feeAmount: data.fee_amount,
            feeReason: data.condition_note,
          })
        : {};
      await closeMemberLeaseRowInTable.mutateAsync({
        outcome,
        note: data.condition_note || (outcome === "returned" ? data.reason : null),
        fee,
      });
    } catch (error) {
      setLoading(false);
      throw new Error(error);
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
          <Typography>Outcome</Typography>
        </Grid>
        <Grid margin={"1rem auto 0"} item xs={12} sm={12} md={12} lg={12}>
          <Select
            className="custom-autocomplete"
            defaultValue="returned"
            {...register("outcome")}
            style={{ ...AntSelectorStyle, width: "100%" }}
          >
            <MenuItem value="returned"><Typography>Returned</Typography></MenuItem>
            <MenuItem value="damaged"><Typography>Returned damaged</Typography></MenuItem>
            <MenuItem value="lost"><Typography>Lost — device not recovered</Typography></MenuItem>
          </Select>
        </Grid>
        <Grid margin={"1rem auto 0"} item xs={12} sm={12} md={12} lg={12}>
          <Typography>Condition note {watch("outcome") === "returned" ? "(optional)" : ""}</Typography>
          <OutlinedInput
            {...register("condition_note", {
              required: watch("outcome") === "damaged" || watch("outcome") === "lost",
            })}
            placeholder={
              watch("outcome") === "lost"
                ? "e.g. Reported lost by student on 6/2"
                : "e.g. Cracked screen — marked as returned"
            }
            style={{ ...OutlinedInputStyle, width: "100%" }}
            multiline
          />
        </Grid>
        {FEATURE_MEMBER_FEES &&
          (watch("outcome") === "damaged" || watch("outcome") === "lost") && (
            <Grid margin={"1rem auto 0"} item xs={12} sm={12} md={12} lg={12}>
              <Typography>Fee to charge (optional)</Typography>
              <OutlinedInput
                {...register("fee_amount")}
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                placeholder="e.g. 250.00 — leave blank for no charge"
                style={{ ...OutlinedInputStyle, width: "100%" }}
                startAdornment={<span style={{ marginRight: 4 }}>$</span>}
              />
            </Grid>
          )}
        {watch("outcome") !== "lost" && (
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <Typography>Returned device condition</Typography>
        </Grid>
        )}
        {watch("outcome") !== "lost" && (
        <Grid margin={"1rem auto"} item xs={12} sm={12} md={12} lg={12}>
          <Select
            className="custom-autocomplete"
            {...register("reason", { required: watch("outcome") !== "lost" })}
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
        )}
        {(watch("outcome") === "lost" || watch("reason") !== "") && (
          <Grid
            display={"flex"}
            flexDirection={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={2}
            container
          >
            <BlueButtonComponent
              title={watch("outcome") === "lost" ? "Mark as Lost and Save" : "Return and Save"}
              loadingState={loading}
              disabled={loading || (watch("outcome") !== "lost" && watch("reason") === "")}
              buttonType="submit"
            />
          </Grid>
        )}{" "}
      </Grid>
    </form>
  );
};
export default Return;
