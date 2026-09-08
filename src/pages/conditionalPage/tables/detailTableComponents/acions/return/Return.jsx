import {
  Grid,
  IconButton,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { useForm } from "react-hook-form";
import { assertWriteSucceeded } from "../../../../../../utils/assignmentWrites";
import { X } from "lucide-react";
import {
  RETURN_CONDITIONS,
  conditionLabel,
} from "../../../../../../utils/returnConditions";
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
import { hasPermission, resolveRoleType } from "../../../../../../config/roles";
import {
  buildFeeFields,
  buildLostItemPayload,
  buildReturnNotification,
  shouldOfferFeeCollection,
} from "../../../../utils/leaseReturnUtils";

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
  const { register, handleSubmit, watch, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector((state) => state.member);
  const queryClient = useQueryClient();
  // Same gate as the collection modal in DetailMemberInfo. Recording a fee that
  // this staff member is not allowed to collect writes an amount nobody in the
  // room can settle, so the two must agree on who may put money on a lease.
  const canRecordFee =
    FEATURE_MEMBER_FEES &&
    hasPermission("member:charge_fee", resolveRoleType(user));
  const returnItemToInventoryCompany = useMutation({
    mutationKey: ["returnItemToInventoryCompany"],
    mutationFn: async (data) =>
      assertWriteSucceeded(
        await devitrakApi.post("/db_event/returning-item", {
          warehouse: 1,
          status: data.reason,
          update_at: formatDate(new Date()),
          serial_number: storedRecord.device_serial_number,
          category_name: storedRecord.device_category_name,
          item_group: storedRecord.device_item_group,
          company_id: user.sqlInfo.company_id,
        }),
        "Putting the unit back in stock"
      ),
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
      return assertWriteSucceeded(
        await devitrakApi.post("/db_item/item-out-warehouse", payload),
        "Marking the device lost"
      );
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
      // A refusal used to fall out of here as `undefined`, which react-query
      // still counts as a resolved mutation: onSuccess then invalidated the
      // list, logged the UNASSIGN and mailed the member about a return the
      // server had just declined to record.
      assertWriteSucceeded(response, "Closing the lease");
      return response.data;
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
      await sentReturnEmailNotification({
        outcome: variables?.outcome,
        note: variables?.note,
        fee: variables?.fee,
      });
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
        companyLogo: user?.companyData?.company_logo,
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
  const sentReturnEmailNotification = async ({ outcome, note, fee }) => {
    // Routed through the shared recipient resolver: a minor's notices go to the
    // guardian on file, never to the student. This used to post
    // memberInfo.email unconditionally, which mailed a 15-year-old about their
    // own lost laptop.
    //
    // The endpoint is chosen by outcome. All three used to hit the
    // return-confirmation template, so the guardian of a lost laptop was told it
    // came back successfully.
    const { endpoint, payload, recipient } = buildReturnNotification({
      member: memberInfo,
      record: storedRecord,
      outcome,
      note,
      fee,
    });
    if (!payload) {
      // Say so instead of silently sending nothing — or worse, sending it to
      // the student. The device record itself is already saved at this point.
      return message.warning(
        `Device saved, but no notification was sent: ${recipient.error}`
      );
    }
    const noun = outcome === "lost" ? "loss notice" : "notification";
    // A mail failure must not cost the receipt or the fee collection: this runs
    // inside onSuccess, before both, so an unhandled rejection here used to take
    // the rest of the flow down with it. The record is already saved either way,
    // so the honest outcome is a warning naming who was NOT reached.
    try {
      const response = await devitrakApi.post(endpoint, payload);
      if (response.data && response.data.ok) {
        return message.success(
          recipient.isGuardian
            ? `Device saved. A ${noun} was queued to the guardian (${recipient.email}).`
            : `Device saved. A ${noun} was queued to ${recipient.email}.`
        );
      }
      return message.warning(
        `Device saved, but the ${noun} to ${recipient.email} was not accepted. Contact them directly.`
      );
    } catch {
      return message.warning(
        `Device saved, but the ${noun} could not be sent to ${recipient.email}. Contact them directly.`
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
      const fee = canRecordFee
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
        {canRecordFee &&
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Select
              className="custom-autocomplete"
              {...register("reason", { required: watch("outcome") !== "lost" })}
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
              autoComplete="off"
            >
              {/* No "None": an absent condition is a blank field, not a choice
                  on the list -- and picking it left the form unable to submit. */}
              {RETURN_CONDITIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Typography>{option.label}</Typography>
                </MenuItem>
              ))}
            </Select>
            {/* Without this there is no way back to blank once something is
                picked, which is the state the form starts in. */}
            {watch("reason") ? (
              <IconButton
                aria-label="Clear the condition"
                size="small"
                onClick={() =>
                  setValue("reason", "", { shouldValidate: true })
                }
              >
                <X size={16} />
              </IconButton>
            ) : null}
          </div>
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
