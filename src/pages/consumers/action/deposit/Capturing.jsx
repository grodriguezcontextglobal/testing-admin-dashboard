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
import { notification } from "antd";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as yup from "yup";
import { devitrakApi } from "../../../../api/devitrakApi";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../../styles/global/Subtitle";
const schema = yup
  .object({
    amount: yup.number().required().positive().integer(),
  })
  .required();

const Capturing = ({
  openCapturingDepositModal,
  setOpenCapturingDepositModal,
  rowRecord,
}) => {
  const [transactionStatus, setTransactionStatus] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, title) => {
    api.open({
      message: title,
      duration: 0,
    });
  };
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const stripeTransactionQuery = useQuery({
    queryKey: ["oneStripeTransaction"],
    queryFn: () =>
      devitrakApi.get(`/stripe/payment_intents/${rowRecord?.paymentIntent}`),
    refetchOnMount: false,
  });
  const transactionQuery = useQuery({
    queryKey: ["transaction"],
    queryFn: () =>
      devitrakApi.get(
        `/transaction/transaction?paymentIntent=${
          rowRecord?.paymentIntent
        }&active=${true}`
      ),
    refetchOnMount: false,
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

  useEffect(() => {
    stripeTransactionQuery.refetch();
    transactionQuery.refetch();
  }, []);

  const maxAmount = stripeTransactionQuery?.data?.data?.paymentIntent?.amount;
  const amountWithNoDecimal = String(maxAmount).slice(0, -2);
  const initalValue = useCallback(() => {
    return setValue("amount", amountWithNoDecimal);
  }, [amountWithNoDecimal, setValue]);

  useEffect(() => {
    if (stripeTransactionQuery.data) {
      if (
        stripeTransactionQuery.data.data.paymentIntent.status === "canceled"
      ) {
        setTransactionStatus(true);
        return alert("This transaction has been released or canceled already.");
      }
      if (
        stripeTransactionQuery.data.data.paymentIntent.status === "succeeded"
      ) {
        setTransactionStatus(true);
        return alert("This transaction has been captured already.");
      }
    }
  }, [stripeTransactionQuery?.data?.data?.paymentIntent?.status]);

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
          `/stripe/payment-intents/${rowRecord?.paymentIntent}/capture`,
          {
            id: rowRecord?.paymentIntent,
            amount_to_capture: data.amount,
          }
        );
        if (resp.data.ok) {
          const transactionInfo = transactionQuery?.data?.data?.list.at(-1);
          const dateString = new Date().toString();
          const dateRef = dateString.split(" ");
          await devitrakApi.patch(
            `/transaction/update-transaction/${transactionInfo.id}`,
            { active: false, id: transactionInfo.id }
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
            event: rowRecord?.eventSelected,
            transaction: rowRecord?.paymentIntent,
            date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
            time: dateRef[4],
            company: rowRecord?.eventInfo[0].provider,
            link: `https://app.devitrak.net/authentication/${
              rowRecord?.eventInfo[0]?.event_id
            }/${user.companyData.id}/${
              rowRecord?.eventInfo[0].consumerInfo.uid ??
              rowRecord?.eventInfo[0]?.consumerInfo.id
            }`,
          });
          queryClient.invalidateQueries({
            queryKey: ["transactionPerConsumerListQuery"],
            exact: true,
          });
          openNotificationWithIcon("Success", "Deposit was captured.");
          setTimeout(() => {
            return closeModal();
          }, 2500);
        }
      }
    };

    const bodyModal = () => {
      return (
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
                    value={rowRecord?.paymentIntent}
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
                  <Button
                    disabled={
                      stripeTransactionQuery?.data?.data?.paymentIntent
                        .status !== "requires_capture"
                    }
                    type="submit"
                    style={{
                      ...BlueButton,
                      width: "100%",
                      display: transactionStatus ? "none" : "flex",
                    }}
                  >
                    <Typography
                      textTransform={"none"}
                      style={{
                        ...BlueButtonText,
                        width: "100%",
                      }}
                    >
                      Capture deposit
                    </Typography>
                  </Button>
                </form>
              </Grid>
            </Grid>{" "}
          </Grid>
        </Grid>
      );
    };
    return (
      <>
        {contextHolder}
        <ModalUX
          title={renderingTitle()}
          openDialog={openCapturingDepositModal}
          closeModal={closeModal}
          body={bodyModal()}
        />
      </>
      // <Modal
      //   open={openCapturingDepositModal}
      //   title={renderingTitle()}
      //   onOk={() => closeModal()}
      //   onCancel={() => closeModal()}
      //   footer={[]}
      //   maskClosable={false}
      //   centered
      //   style={{ zIndex: 30 }}
      // >
      //   {contextHolder}
      // </Modal>
    );
  }
};

export default Capturing;

Capturing.propTypes = {
  openCapturingDepositModal: PropTypes.bool,
  setOpenCapturingDepositModal: PropTypes.bool,
  refetchingTransactionFn: PropTypes.func,
};
