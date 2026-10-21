import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useStatusNotification } from "../../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import ReusableTextArea from "../../../../../../components/UX/inputs/TextArea";
import { onAddPaymentIntentSelected } from "../../../../../../store/slices/stripeSlice";
import ReceiptModal from "../../../../../payment/components/ReceiptModal";
import "../../consumerDetail.css";
import {
  LOST_FEE_METHOD,
  describeSettleFailure,
  formatCurrency,
  staffName,
  validateWaiverReason,
} from "../../utils/lostFee";
import LostFeeScreen from "../components/LostFeeScreen";
import { useLostFeeSettlement } from "../useLostFeeSettlement";

/**
 * Write a device off as lost without charging for it.
 *
 * The same write-off as Cash and Card, reported as a fee of 0 with the staff
 * member who waived it and the reason they gave — a waiver is a decision
 * someone has to answer for, so the reason is required. No fee email goes out
 * (nothing was charged); the receipt says the fee was waived.
 */
const Waiver = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customer } = useSelector((state) => state.customer);
  const { notify, contextHolder } = useStatusNotification();
  const { event, user, device, receiver, fee, settle } = useLostFeeSettlement({ customer });
  const [receipt, setReceipt] = useState(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { reason: "" } });

  const goBack = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigate(`/events/event-attendees/${customer?.uid}/transactions-details`);
  };

  const onSubmit = async ({ reason }) => {
    try {
      const outcome = await settle({
        method: LOST_FEE_METHOD.WAIVED,
        amount: "0",
        waiverReason: reason,
      });
      notify("success", `${device.serialNumber} written off with the fee waived.`);
      setReceipt(outcome.receipt);
    } catch (error) {
      notify("error", describeSettleFailure(error));
    }
  };

  if (!device?.serialNumber || !receiver?.id) {
    return (
      <LostFeeScreen
        title="Waive lost device fee"
        onCancel={goBack}
        error={{
          title: "No device selected",
          description: "Report a device as lost from its transaction to waive the fee.",
        }}
      />
    );
  }

  return (
    <>
      {contextHolder}
      {receipt && (
        <ReceiptModal
          openModal={Boolean(receipt)}
          setOpenModal={() => setReceipt(null)}
          receipt={receipt}
          title="Fee waived — print the record?"
          onClose={goBack}
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <LostFeeScreen
          title="Waive lost device fee"
          description={`The device is written off and nothing is charged. Recorded as a $0 fee waived by ${staffName(
            user
          )}.`}
          device={device}
          amount={0}
          consumerName={`${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim()}
          eventName={event?.eventInfoDetail?.eventName}
          onCancel={goBack}
          footer={
            <>
              <GrayButtonComponent title="Cancel" buttonType="button" func={goBack} />
              <BlueButtonComponent
                title="Waive fee and write off"
                buttonType="submit"
                loadingState={isSubmitting}
                disabled={Boolean(receipt)}
              />
            </>
          }
        >
          <div className="lost-fee__field">
            <label className="serial-capture__label" htmlFor="lost-fee-waiver-reason">
              Reason for waiving
            </label>
            <Controller
              name="reason"
              control={control}
              rules={{ validate: validateWaiverReason }}
              render={({ field }) => (
                <ReusableTextArea
                  id="lost-fee-waiver-reason"
                  fullWidth
                  placeholder="e.g. The unit was faulty when it was handed out"
                  textAreaProps={{ rows: 3, maxLength: 500, showCount: true }}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  error={Boolean(errors.reason)}
                />
              )}
            />
            {errors?.reason && (
              <p className="serial-capture__error">{errors.reason.message}</p>
            )}
            {fee.found && (
              <p className="transaction-panel__hint">
                The event&apos;s replacement value for this device is{" "}
                {formatCurrency(fee.amount)}; it will not be charged.
              </p>
            )}
          </div>
        </LostFeeScreen>
      </form>
    </>
  );
};

export default Waiver;
