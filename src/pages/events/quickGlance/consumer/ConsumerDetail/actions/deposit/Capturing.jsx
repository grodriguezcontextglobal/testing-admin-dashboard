import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, notification } from "antd";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as yup from "yup";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { BlueButtonText } from "../../../../../../../styles/global/BlueButtonText";
import { BlueButton } from "../../../../../../../styles/global/BlueButton";
import PropTypes from "prop-types";
import { Subtitle } from "../../../../../../../styles/global/Subtitle";
const schema = yup
  .object({
    amount: yup.number().required().positive().integer(),
  })
  .required();

const Capturing = ({
  openCapturingDepositModal,
  setOpenCapturingDepositModal,
  refetchingTransactionFn,
}) => {
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, title) => {
    api.open({
      message: title,
      duration: 0,
    });
  };
  const { paymentIntentDetailSelected, customer } = useSelector(
    (state) => state.stripe
  );
  const { event } = useSelector((state) => state.event);
  const stripeTransactionQuery = useQuery({
    queryKey: ["oneStripeTransaction"],
    queryFn: () =>
      devitrakApi.get(
        `/stripe/payment_intents/${paymentIntentDetailSelected.paymentIntent}`
      ),
    refetchOnMount: false,
    staleTime: Infinity,
  });
  const transactionQuery = useQuery({
    queryKey: ["transaction"],
    queryFn: () =>
      devitrakApi.post(`/transaction/transaction`, {
        paymentIntent: paymentIntentDetailSelected.paymentIntent,
        active: true,
      }),
    refetchOnMount: false,
    staleTime: Infinity,
  });
  const queryClient = useQueryClient();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const maxAmount = stripeTransactionQuery?.data?.data?.paymentIntent?.amount;
  const amountWithNoDecimal = String(maxAmount).slice(0, -2);
  const initalValue = useCallback(() => {
    return setValue("amount", amountWithNoDecimal);
  }, [amountWithNoDecimal, setValue]);

  if (stripeTransactionQuery.data) {
    initalValue();
    const renderingTitle = () => {
      return <Typography textTransform={"none"}>Capturing deposit</Typography>;
    };

    const closeModal = () => {
      setValue("amount", "");
      return setOpenCapturingDepositModal(false);
    };

    const handleEventInfo = async (data) => {
      if (data.amount > parseInt(amountWithNoDecimal)) {
        return alert(`Max amount to capture: $${amountWithNoDecimal}`);
      } else {
        const resp = await devitrakApi.post(
          `/stripe/payment-intents/${paymentIntentDetailSelected.paymentIntent}/capture`,
          {
            id: paymentIntentDetailSelected.paymentIntent,
            amount_to_capture: data.amount,
          }
        );
        if (resp.data.ok) {
          const transactionInfo = transactionQuery?.data?.data?.list.at(-1);
          const dateString = new Date().toString();
          const dateRef = dateString.split(" ");
          await devitrakApi.patch(
            `/transaction/update-transaction/${transactionInfo.id}`,
            { active: false }
          );
          await devitrakApi.post("/nodemailer/deposit-collected-notification", {
            consumer: {
              name: `${customer.name}, ${customer.lastName}`,
              email: customer.email,
            },
            message: {
              amount: data.amount,
            },
            amount: data.amount,
            event: event.eventInfoDetail.eventName,
            transaction: paymentIntentDetailSelected.paymentIntent,
            date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
            time: dateRef[4],
            company: event.company,
            link: `https://app.devitrak.net/authentication/${encodeURI(
              event.eventInfoDetail.eventName
            )}/${encodeURI(event.company)}/${customer.uid}`,
          });
          queryClient.invalidateQueries({
            queryKey: ["transactionPerConsumerListQuery"],
            exact: true,
          });
          refetchingTransactionFn();
          openNotificationWithIcon("success", "Deposit was captured.");
          setTimeout(() => {
            return closeModal();
          }, 2500);
        }
      }
    };

    return (
      <Modal
        open={openCapturingDepositModal}
        title={renderingTitle()}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        maskClosable={false}
        centered
      >
        {contextHolder}
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"space-around"}
          alignItems={"center"}
          gap={2}
          container
        >
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"space-around"}
            alignItems={"center"}
            gap={2}
            item
            xs={11}
          >
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignSelf={"stretch"}
              gap={2}
              container
            >
              <Grid item xs={12}>
                <form
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    textAlign: "left",
                  }}
                  onSubmit={handleSubmit(handleEventInfo)}
                  className="form"
                >
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Transaction ID</p>
                  </InputLabel>
                  <OutlinedInput
                    disabled
                    value={paymentIntentDetailSelected.paymentIntent}
                    style={{
                      borderRadius: "12px",
                      border: `${
                        errors.serialNumberBase && "solid 1px #004EEB"
                      }`,
                      margin: "0.1rem auto 1rem",
                      display: "flex",
                      justifyContent: "flex-start",
                      width: "100%",
                    }}
                  />

                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Capturing deposit amount</p>
                  </InputLabel>
                  <OutlinedInput
                    {...register("amount")}
                    style={{
                      borderRadius: "12px",
                      border: `${errors.amount && "solid 1px #004EEB"}`,
                      margin: "0.1rem auto 1rem",
                      display: "flex",
                      width: "100%",
                      justifyContent: "flex-start",
                    }}
                    placeholder="e.g. $200"
                    startAdornment={
                      <InputAdornment position="start">
                        <p style={Subtitle}>$</p>
                      </InputAdornment>
                    }
                  />
                  {errors?.amount && (
                    <p style={Subtitle}>{errors?.amount?.message}</p>
                  )}
                  <FormHelperText
                    style={{
                      marginBottom: "1rem",
                    }}
                    id="outlined-weight-helper-text"
                  >
                    <p style={Subtitle}>
                      Please be aware that the displayed amount is the maximum
                      value that will be captured. If you wish to capture a
                      lesser amount, you have the option to manually input the
                      desired value before submitting.
                    </p>
                  </FormHelperText>
                  <Button type="submit" style={BlueButton}>
                    <Typography
                      textTransform={"none"}
                      style={{ ...BlueButtonText, width: "100%" }}
                    >
                      Capture deposit
                    </Typography>
                  </Button>
                </form>
              </Grid>
            </Grid>{" "}
          </Grid>
        </Grid>
      </Modal>
    );
  }
};

export default Capturing;

Capturing.propTypes = {
  openCapturingDepositModal: PropTypes.bool,
  setOpenCapturingDepositModal: PropTypes.bool,
  refetchingTransactionFn: PropTypes.func,
};
