import {
  Chip,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Alert, Divider, Select, message } from "antd";
import PropTypes from "prop-types";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { registerStaffActivity } from "../../../../../../api/activityLog";
import StripeElementMemberFeeTransaction from "../../../../../../components/stripe/elements/StripeElementMemberFeeTransaction";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../../components/UX/buttons/LigthBlueButton";
import ModalUX from "../../../../../../components/UX/modal/ModalUX";
import ReceiptModal from "../../../../../payment/components/ReceiptModal";
import { mapFeeChargeToReceipt } from "../../../../../payment/utils/receiptUtils";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../../../styles/global/TextFontSize30LineHeight38";
import {
  buildFeeChargeSummary,
  buildFeeReceiptNotification,
  buildFeeSettlements,
  canSubmitFeeCharge,
  formatStripeAmount,
  resolveFeePayer,
  totalFeeCents,
} from "../../../../utils/memberFeeChargeUtils";

/**
 * Charges a device fee (lost / damaged) to a member, collecting the card on the
 * spot.
 *
 * Copied from the event Services flow (ServicesTransaction.jsx) rather than
 * reused: that one is bound to `event.extraServices`, the event's admin list and
 * the `customer` in the stripe slice, none of which exist for a member. What is
 * shared with it is the live direct-charge endpoint,
 * /stripe/create-payment-intent-subscription.
 *
 * Three things it does that the original did not:
 * - Names the payer. A minor is never billed directly; the guardian on file is,
 *   and the modal says so before staff types a card. If no guardian is on file
 *   the charge is blocked instead of quietly falling through to the student.
 * - Surfaces the failure. The original's submit handler ended in
 *   `catch { return null }`, so a rejected intent looked like a dead button.
 * - Hands over paper. A successful charge offers a printable receipt; the loss
 *   declaration carries no money on purpose, so this was the only document that
 *   could show the debt had been settled and it did not exist.
 *
 * SCOPE — this collects money; it does not yet record the debt. Writing
 * fee_amount / fee_reason onto the lease row is FRONTEND_school_backend_asks.md
 * §B1.1, still unimplemented server-side and gated by FEATURE_MEMBER_FEES. So a
 * charge made here is recorded in Stripe and in the activity log, but does not
 * appear as a settled fee on the member until that ships. The payer also gets no
 * confirmation EMAIL yet — that template is §B3.
 */
const ChargeMemberDeviceFee = ({
  openModal,
  setOpenModal,
  devices = [],
  record = null,
  prefillLines = [],
}) => {
  const { memberInfo } = useSelector((state) => state.member);
  const { user } = useSelector((state) => state.admin);
  // Seeded from prefillLines so the return flow can hand over the fee it just
  // recorded instead of making staff retype an amount they already entered.
  // Read once on mount, which is correct because the caller renders this
  // conditionally — a fresh mount per open.
  const [feeLines, setFeeLines] = useState(() =>
    Array.isArray(prefillLines) ? prefillLines : []
  );
  const [clientSecret, setClientSecret] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState(null);
  const chargedAmountRef = useRef(0);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      serial_number: record?.device_serial_number ?? "",
      amount: "",
      reason: "",
    },
  });

  const payer = useMemo(() => resolveFeePayer(memberInfo), [memberInfo]);
  const totalCents = totalFeeCents(feeLines);
  const guard = canSubmitFeeCharge({ lines: feeLines, member: memberInfo });

  const closeModal = () => {
    setOpenModal(false);
  };

  const deviceOptions = useMemo(
    () =>
      (Array.isArray(devices) ? devices : [])
        .map((device) => `${device?.device_serial_number ?? ""}`.trim())
        .filter(Boolean)
        .map((serial) => ({ label: serial, value: serial })),
    [devices]
  );

  const addFeeLine = (data) => {
    setSubmitError(null);
    setFeeLines((current) => [
      ...current,
      {
        serial_number: data.serial_number,
        device_id: devices?.find(
          (device) => device?.device_serial_number === data.serial_number
        )?.device_id,
        amount: data.amount,
        reason: data.reason,
      },
    ]);
    setValue("amount", "");
    setValue("reason", "");
  };

  const removeFeeLine = (indexToDrop) => {
    setFeeLines((current) =>
      current.filter((_, index) => index !== indexToDrop)
    );
  };

  const createPaymentIntent = async () => {
    if (!guard.ok) {
      setSubmitError(guard.reason);
      return;
    }
    setSubmitError(null);
    setCreatingIntent(true);
    chargedAmountRef.current = totalCents;
    try {
      const response = await devitrakApi.post(
        "/stripe/create-payment-intent-subscription",
        {
          customerEmail: payer.email,
          total: totalCents,
        }
      );
      const secret =
        response?.data?.paymentSubscription?.client_secret ?? null;
      if (!secret) {
        // A 200 without a secret still means no card can be collected — say so
        // rather than rendering an empty Stripe element.
        setSubmitError(
          "The payment could not be started. Please try again or contact support."
        );
        return;
      }
      setClientSecret(secret);
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ??
          error?.message ??
          "The payment could not be started."
      );
    } finally {
      setCreatingIntent(false);
    }
  };

  /**
   * Records the payment against the lease and mails the payer a receipt.
   *
   * Both run AFTER the money has moved, which sets the error policy: nothing here
   * can be retried by re-charging, so a failure must be stated loudly with the
   * payment intent attached rather than swallowed. A silent failure here is worse
   * than the original bug — the school would believe the debt was cleared.
   */
  const recordSettlementAndNotify = async (paymentIntent) => {
    const settlements = buildFeeSettlements({
      member: memberInfo,
      companyId: user?.sqlInfo?.company_id,
      lines: feeLines,
      paymentIntent: paymentIntent?.id,
    });
    const notification = buildFeeReceiptNotification({
      member: memberInfo,
      payer,
      lines: feeLines,
      paymentIntent: paymentIntent?.id,
      company: user?.company,
      date: new Date().toISOString(),
    });

    // Settled one lease at a time on purpose — see buildFeeSettlements. Run in
    // sequence so a mid-way failure names how far it got.
    const unsettled = [];
    for (const settlement of settlements) {
      try {
        const response = await devitrakApi.post(
          "/db_member/settle-member-fee",
          settlement
        );
        if (!response?.data?.ok) unsettled.push(settlement.device_id);
      } catch {
        unsettled.push(settlement.device_id);
      }
    }

    let mailFailed = false;
    if (notification) {
      try {
        // 202 from the mail queue counts as sent — the job survives a SendGrid
        // outage, so a queued receipt is a delivered one as far as staff care.
        const response = await devitrakApi.post(
          "/nodemailer/member-device-fee-receipt-notification",
          notification
        );
        mailFailed = !response?.data?.ok;
      } catch {
        mailFailed = true;
      }
    }

    // Reported through `message`, not the modal's own Alert: by the time these
    // resolve the receipt is on screen and this modal is hidden behind it, so an
    // inline Alert would never be read. antd messages render above modals.
    // submitError is set too, for a staff member who stays in the charge form.
    if (unsettled.length > 0) {
      const text = `The card WAS charged (${paymentIntent?.id}) but the fee could not be marked as paid for device(s) ${unsettled.join(
        ", "
      )}. Record it manually — do not charge again.`;
      setSubmitError(text);
      // Duration 0: this one does not get to scroll past. A dismissed-too-soon
      // toast here means a family gets chased for a debt they already settled.
      message.error({ content: text, duration: 0, key: "fee-settle-failed" });
    } else if (mailFailed || !notification) {
      const text = `Payment recorded. The receipt email could not be sent to ${
        payer.email ?? "the payer"
      } — print the receipt instead.`;
      setSubmitError(text);
      message.warning({ content: text, duration: 8 });
    }
  };

  const onChargeSucceeded = (paymentIntent) => {
    // Proof the debt was settled. The loss declaration deliberately prints no
    // money, so without this the family paid and walked away with nothing on
    // paper — the only trace was Stripe and the activity log, neither of which
    // they can see. No QR: nothing writes a transaction document for a member
    // fee, so a scan would open a page that cannot look the charge up.
    setPaidReceipt(
      mapFeeChargeToReceipt({
        member: memberInfo,
        lines: feeLines,
        paymentIntent: paymentIntent?.id,
        payerEmail: payer.email,
        billedGuardian: payer.isGuardian,
        company: user?.company,
        date: new Date().toISOString(),
      })
    );
    registerStaffActivity({
      // No CHARGE verb exists in ACTIVITY_LOG_ACTIONS yet; CREATE + Fee keeps
      // the row inside the catalog the log filter and backend already accept.
      action: "CREATE",
      target_model: "Fee",
      target_id: memberInfo?.member_id ?? memberInfo?.id,
      details: {
        amount_cents: chargedAmountRef.current,
        devices: buildFeeChargeSummary(feeLines),
        payer_email: payer.email,
        billed_guardian: payer.isGuardian,
        payment_intent: paymentIntent?.id,
      },
    });

    // Not awaited: the receipt must appear the instant the charge clears. The
    // settlement reports its own failure into submitError, which renders inside
    // this same modal behind the receipt.
    recordSettlementAndNotify(paymentIntent);
  };

  const modalBody = (
    <div
      style={{
        minWidth: "fit-content",
        backgroundColor: "#ffffff",
        padding: "20px",
      }}
    >
      <Typography marginY={2} style={{ ...TextFontsize18LineHeight28 }}>
        {`Fee for ${memberInfo?.first_name ?? ""} ${
          memberInfo?.last_name ?? ""
        }`.trim()}
      </Typography>

      {/* Who gets billed is not obvious for a student, so it is stated up front
          rather than discovered from the receipt. */}
      {payer.email ? (
        <Alert
          type="info"
          showIcon
          message={
            payer.isGuardian
              ? `Billing the guardian on file: ${payer.email}`
              : `Billing the member: ${payer.email}`
          }
        />
      ) : (
        <Alert type="error" showIcon message={payer.error} />
      )}

      <Divider />

      <form
        style={{ width: "100%", display: clientSecret !== null ? "none" : "block" }}
        onSubmit={handleSubmit(addFeeLine)}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={2}
          container
        >
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Device
              </Typography>
            </InputLabel>
            {/* A select when the member's assigned devices are known, a plain
                field when they are not — a lost device may already be off the
                assignment list by the time the fee is collected. */}
            {deviceOptions.length > 0 ? (
              <Select
                defaultValue={record?.device_serial_number ?? ""}
                style={{ width: "100%" }}
                options={deviceOptions}
                onChange={(value) => setValue("serial_number", value)}
              />
            ) : (
              <OutlinedInput
                {...register("serial_number")}
                style={{ ...OutlinedInputStyle, width: "100%" }}
                placeholder="Serial number"
                fullWidth
              />
            )}
          </Grid>
          <Grid item xs={6} sm={6} md={3} lg={3}>
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Amount
              </Typography>
            </InputLabel>
            <OutlinedInput
              {...register("amount")}
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              style={{ ...OutlinedInputStyle, width: "100%" }}
              placeholder="250.00"
              required
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Reason
              </Typography>
            </InputLabel>
            <OutlinedInput
              {...register("reason")}
              style={{ ...OutlinedInputStyle, width: "100%" }}
              placeholder="Lost — not recovered"
              fullWidth
            />
          </Grid>
        </Grid>
        <LightBlueButtonComponent
          buttonType="submit"
          title="Add fee"
          styles={{ marginTop: "1rem" }}
        />
      </form>

      {feeLines.length > 0 && (
        <>
          <Divider />
          {feeLines.map((line, index) => (
            <Chip
              key={`${line.serial_number}-${line.amount}-${index}`}
              label={`${line.serial_number || "Device"} — ${formatStripeAmount(
                totalFeeCents([line])
              )}${line.reason ? ` (${line.reason})` : ""}`}
              style={{ margin: "0.5rem" }}
              onDelete={
                clientSecret === null ? () => removeFeeLine(index) : undefined
              }
            />
          ))}
        </>
      )}

      {submitError && (
        <Alert
          type="error"
          showIcon
          message={submitError}
          style={{ marginTop: "1rem" }}
        />
      )}

      {totalCents > 0 && clientSecret === null && (
        <BlueButtonComponent
          func={createPaymentIntent}
          disabled={creatingIntent || !guard.ok}
          loadingState={creatingIntent}
          title={`Total to charge: ${formatStripeAmount(
            totalCents
          )} | Continue to card details`}
          styles={{ ...CenteringGrid, width: "100%", marginTop: "1rem" }}
        />
      )}

      <StripeElementMemberFeeTransaction
        clientSecret={clientSecret}
        total={chargedAmountRef.current}
        onSucceeded={onChargeSucceeded}
      />
    </div>
  );

  return (
    <>
      <ModalUX
        title={
          <Typography
            textTransform={"none"}
            marginY={2}
            style={{ ...TextFontSize30LineHeight38, textWrap: "balance" }}
          >
            Charge device fee
          </Typography>
        }
        // Chained, not stacked — same reason the declaration and this modal are:
        // with both on screen it is not clear which one a Close button belongs
        // to. The card form steps aside once the money is in.
        openDialog={openModal && !paidReceipt}
        closeModal={closeModal}
        body={modalBody}
        width={900}
        footer={[]}
        modalStyles={{ top: "10dvh", zIndex: 30 }}
      />
      {paidReceipt && (
        <ReceiptModal
          openModal={Boolean(paidReceipt)}
          setOpenModal={() => setPaidReceipt(null)}
          receipt={paidReceipt}
          title={"Fee paid — print the receipt?"}
          onClose={() => {
            setPaidReceipt(null);
            setOpenModal(false);
          }}
        />
      )}
    </>
  );
};

ChargeMemberDeviceFee.propTypes = {
  openModal: PropTypes.bool,
  setOpenModal: PropTypes.func.isRequired,
  devices: PropTypes.arrayOf(
    PropTypes.shape({
      device_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      device_serial_number: PropTypes.string,
    })
  ),
  record: PropTypes.shape({
    device_serial_number: PropTypes.string,
  }),
  prefillLines: PropTypes.arrayOf(
    PropTypes.shape({
      serial_number: PropTypes.string,
      device_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      reason: PropTypes.string,
    })
  ),
};

export default ChargeMemberDeviceFee;
