import { yupResolver } from "@hookform/resolvers/yup";
import {
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as yup from "yup";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import { describePaymentError } from "../../../../utils/paymentRequestState";
import { paymentIdempotencyHeaders } from "../../../../utils/paymentIdempotency";
import {
  depositStatusNotice,
  releaseDepositQueryKeys,
} from "../../../search/utils/searchQueries";
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
  const { notify, contextHolder } = useStatusNotification();
  const openNotificationWithIcon = (type, title) => {
    notify(type.toLowerCase(), title, 0);
  };
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  // Keyed on the payment intent, so opening another deposit fetches its own
  // data instead of showing the previous one until a manual refetch landed.
  // Same keys and requests as the search page's ReleaseDeposit.
  const paymentIntent = rowRecord?.paymentIntent;
  const queryKeys = releaseDepositQueryKeys(paymentIntent);
  const stripeTransactionQuery = useQuery({
    queryKey: queryKeys.intent,
    queryFn: () => devitrakApi.get(`/stripe/payment_intents/${paymentIntent}`),
    enabled: Boolean(paymentIntent),
  });
  const transactionQuery = useQuery({
    queryKey: queryKeys.transaction,
    queryFn: () =>
      devitrakApi.get(
        `/transaction/transaction?paymentIntent=${paymentIntent}&active=true`
      ),
    enabled: Boolean(paymentIntent),
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

  // Captured or released already: say so and block the form. The modal stays
  // open here, unlike Releasing.
  const paymentStatus = stripeTransactionQuery.data?.data?.paymentIntent?.status;
  useEffect(() => {
    const notice = depositStatusNotice(paymentStatus);
    if (!notice) return;
    setTransactionStatus(true);
    alert(notice.text);
  }, [paymentStatus]);

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
        // Only the capture itself is guarded: a failure in the email or the
        // cache invalidation below is not a failure to charge, and must not
        // be reported as one.
        let resp;
        try {
          resp = await devitrakApi.post(
            `/stripe/payment-intents/${rowRecord?.paymentIntent}/capture`,
            {
              id: rowRecord?.paymentIntent,
              amount_to_capture: data.amount,
            },
            // Keyed on the deposit: the amount is editable, so without this a
            // second capture for a different amount is a different request and
            // charges again.
            paymentIdempotencyHeaders("capture", rowRecord?.paymentIntent)
          );
        } catch (error) {
          const outcome = describePaymentError(error, {
            failure: "The deposit was not captured. Nothing was charged.",
            subject: "capture",
          });
          return openNotificationWithIcon(
            outcome.inProgress ? "Warning" : "Error",
            outcome.message
          );
        }
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
            link: `https://app.devitrak.net/authentication/${rowRecord?.eventInfo[0]?.event_id
              }/${user.companyData.id}/${rowRecord?.eventInfo[0].consumerInfo.uid ??
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
                      border: `${errors.serialNumberBase && "solid 1px #004EEB"
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
                  <BlueButtonComponent
                    disabled={
                      stripeTransactionQuery?.data?.data?.paymentIntent
                        .status !== "requires_capture"
                    }
                    buttonType="submit"
                    styles={{
                      display: transactionStatus ? "none" : "flex",
                    }}
                    title={"Capture deposit"} />
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
    );
  }
};

export default Capturing;

Capturing.propTypes = {
  openCapturingDepositModal: PropTypes.bool,
  setOpenCapturingDepositModal: PropTypes.bool,
  refetchingTransactionFn: PropTypes.func,
};
