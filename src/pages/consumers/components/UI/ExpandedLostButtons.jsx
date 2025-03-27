import { InputAdornment, OutlinedInput, Tooltip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Popconfirm } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../../../api/devitrakApi";
import { CheckIcon } from "../../../../components/icons/CheckIcon";
import { QuestionIcon } from "../../../../components/icons/QuestionIcon";
import { checkArray } from "../../../../components/utils/checkArray";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../styles/global/DangerButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import sendRefundReceiptEmail from "../../utils/sendRefundReceiptEmail";
import { useSelector } from "react-redux";

const ExpandedLostButton = ({
  record,
  handleFoundSingleDevice,
  handleLostSingleDevice,
  Lost,
  refetchingQueries,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit } = useForm();
  const [isLoadingState, setIsLoadingState] = useState(false);
  const propsUpdateSingleDevice = {
    ...record,
    new_status: true,
  };
  const checkChargedLostFee = useQuery({
    queryKey: [
      "chargedLostFee",
      `${record.key}-${record.serial_number}-${record.type}`,
    ],
    queryFn: () =>
      devitrakApi.post(`/cash-report/cash-reports`, {
        event: record.entireData.event_id,
        company: record.entireData.company,
        "deviceLost.label": record.serial_number,
        "deviceLost.deviceType": record.type,
        attendee: record.entireData.user,
      }),
    refetchOnMount: false,
  });

  const [openPartialRefundModal, setOpenPartialRefundModal] = useState(false);
  const [cashReportToPassAsProps, setCashReportToPassAsProps] = useState(null);

  const partialRefund = async (data) => {
    try {
      const newAmount =
        Number(checkArray(cashReportToPassAsProps).amount) -
        Number(data.amount);
      const updatedDeviceLostList = checkArray(
        cashReportToPassAsProps
      ).deviceLost.filter((ele) => ele.label !== record.serial_number);
      const template = {
        ...cashReportToPassAsProps,
        deviceLost: [...updatedDeviceLostList],
        amount: String(newAmount),
      };
      if (
        checkArray(cashReportToPassAsProps).paymentIntent_charge_transaction
          .length > 15 &&
        !checkArray(
          cashReportToPassAsProps
        ).paymentIntent_charge_transaction.includes("cash")
      ) {
        await devitrakApi.post(`/stripe/partial-refund`, {
          paymentIntent: checkArray(cashReportToPassAsProps)
            .paymentIntent_charge_transaction,
          total: data.amount,
        });
      }
      await devitrakApi.patch(
        `/cash-report/update-cash-report/${
          checkArray(cashReportToPassAsProps).id
        }`,
        {
          id: checkArray(cashReportToPassAsProps).id,
          template,
        }
      );
      sendRefundReceiptEmail({
        event:record.entireData.eventSelected[0],
        company: user.companyData.company_name,
        customer: record.entireData.userInfo,
        amount: data.amount,
        paymentIntent: checkArray(cashReportToPassAsProps)
          .paymentIntent_charge_transaction,
      });
      setIsLoadingState(false);
      setOpenPartialRefundModal(false);
      checkChargedLostFee.refetch();
      return refetchingQueries();
    } catch (error) {
      return error;
    }
  };
  const handleRefund = async () => {
    try {
      setIsLoadingState(true);
      const cashReportTransactionData = checkChargedLostFee?.data?.data?.report;
      if (checkArray(cashReportTransactionData).deviceLost.length > 1) {
        setCashReportToPassAsProps(checkArray(cashReportTransactionData));
        return setOpenPartialRefundModal(true);
      } else {
        if (
          checkArray(cashReportTransactionData).paymentIntent_charge_transaction
            .length > 15 &&
          !checkArray(
            cashReportTransactionData
          ).paymentIntent_charge_transaction.includes("cash")
        ) {
          await devitrakApi.post(`/stripe/refund`, {
            paymentIntent: checkArray(cashReportTransactionData)
              .paymentIntent_charge_transaction,
          });
        }
        await devitrakApi.post(
          `/cash-report/remove-cash-report/${
            checkArray(cashReportTransactionData).id
          }`
        );
      }
      sendRefundReceiptEmail({
        event:record.entireData.eventSelected[0],
        company: user.companyData.company_name,
        customer: record.entireData.userInfo,
        amount: checkArray(cashReportToPassAsProps).amount,
        paymentIntent: checkArray(cashReportToPassAsProps)
          .paymentIntent_charge_transaction,
      });

      setIsLoadingState(false);
      checkChargedLostFee.refetch();
      return refetchingQueries();
    } catch (error) {
      setIsLoadingState(false);
      return null;
    }
  };

  const checkingExistingData = () => {
    return (
      checkChargedLostFee?.data &&
      checkChargedLostFee?.data?.data?.report?.length > 0
    );
  };

  return (
    <>
      <div
        key={record.serial_number}
        style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}
      >
        <Button
          disabled={checkingExistingData()}
          onClick={() => handleLostSingleDevice(record)}
          style={{
            ...DangerButton,
            alignItems: "center",
          }}
        >
          <img src={Lost} alt="Lost" />
          <p
            style={{
              ...DangerButtonText,
              alignSelf: "center",
            }}
          >
            {checkingExistingData() ? "Charged" : "Charge customer"}
          </p>
        </Button>
        <Popconfirm
          title={
            checkingExistingData()
              ? "Are you sure that you want to refund?"
              : "Are you sure that you want to mark as found?"
          }
          onConfirm={() =>
            checkingExistingData()
              ? handleRefund(record)
              : handleFoundSingleDevice(propsUpdateSingleDevice)
          }
        >
          <Button
            loading={isLoadingState}
            style={{
              ...GrayButton,
            }}
          >
            <p
              style={{
                ...GrayButtonText,
                color: `${
                  record.status
                    ? GrayButtonText.color
                    : "var(--disabled0gray-button-text)"
                }`,
              }}
            >
              {checkingExistingData() ? "Refund" : "Mark as found"}
            </p>
          </Button>
        </Popconfirm>
      </div>
      {openPartialRefundModal && (
        <form
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
          onSubmit={handleSubmit(partialRefund)}
        >
          <label
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            Amount to refund:
            <OutlinedInput
              {...register("amount")}
              style={OutlinedInputStyle}
              type="text"
              placeholder={`${cashReportToPassAsProps.amount}`}
              startAdornment={
                <InputAdornment position="start">$</InputAdornment>
              }
              endAdornment={
                <InputAdornment
                  position="end"
                  style={{
                    width: "fit-content",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Tooltip title="Max amount to refund" placement="top">
                    <QuestionIcon />{" "}
                  </Tooltip>
                </InputAdornment>
              }
            />
            <div
              style={{
                display: "flex",
                margin: "5px 0 0",
                gap: "5px",
              }}
            >
              <Button
                htmlType="reset"
                style={{ ...GrayButton }}
                onClick={() => {
                  setOpenPartialRefundModal(false);
                  setIsLoadingState(false);
                }}
              >
                <p style={GrayButtonText}>X</p>
              </Button>
              <Button
                htmlType="submit"
                style={{ ...BlueButton }}
                onClick={() => false}
              >
                <p style={BlueButtonText}>
                  <CheckIcon />
                </p>
              </Button>
            </div>
          </label>
        </form>
      )}
    </>
  );
};

export default ExpandedLostButton;
