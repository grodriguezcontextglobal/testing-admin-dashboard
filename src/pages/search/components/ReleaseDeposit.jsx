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
import { Modal } from "antd";
import { useSelector } from "react-redux";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import { describePaymentError } from "../../../utils/paymentRequestState";
import { paymentIdempotencyHeaders } from "../../../utils/paymentIdempotency";
import {
  depositStatusNotice,
  releaseDepositQueryKeys,
} from "../utils/searchQueries";

const ReleaseDeposit = ({
  openCancelingDepositModal,
  setOpenCancelingDepositModal,
  refetchingTransactionFn,
}) => {
  const [transactionStatus, setTransactionStatus] = useState(false);
  const { notify, contextHolder } = useStatusNotification();
  const openNotificationWithIcon = (type, title) => {
    notify(type.toLowerCase(), title, 0);
  };
  const { paymentIntentDetailSelected, customer } = useSelector(
    (state) => state.stripe
  );
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const paymentIntent = paymentIntentDetailSelected?.paymentIntent;
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
  const maxAmount = stripeTransactionQuery?.data?.data?.paymentIntent?.amount;
  const amountWithNoDecimal = String(maxAmount).slice(0, -2);

  const paymentStatus = stripeTransactionQuery.data?.data?.paymentIntent?.status;
  useEffect(() => {
    const notice = depositStatusNotice(paymentStatus);
    if (!notice) return;
    setTransactionStatus(true);
    if (notice.closeModal) setOpenCancelingDepositModal(false);
    alert(notice.text);
  }, [paymentStatus, setOpenCancelingDepositModal]);

  const renderingTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        color="var(--gray-900, #101828)"
        lineHeight={"38px"}
        textAlign={"center"}
        fontWeight={600}
        fontFamily={"Inter"}
        fontSize={"30px"}
        textWrap={"balance"}
        textOverflow={"ellipsis"}
        padding={"1rem 1.5rem"}
      >
        Release deposit
      </Typography>
    );
  };
  const closeModal = () => {
    setOpenCancelingDepositModal(false);
  };

  const handleEventInfo = async (e) => {
    e.preventDefault();
    // Only the release itself is guarded: a failure in the email or the cache
    // invalidation below is not a failure to release the hold.
    let resp;
    try {
      resp = await devitrakApi.post(
        `/stripe/payment-intents/${paymentIntentDetailSelected.paymentIntent}/cancel`,
        {
          id: paymentIntentDetailSelected.paymentIntent,
        },
        paymentIdempotencyHeaders(
          "release",
          paymentIntentDetailSelected.paymentIntent
        )
      );
    } catch (error) {
      const outcome = describePaymentError(error, {
        failure: "The deposit was not released. The hold is still in place.",
        subject: "release",
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
      devitrakApi.post("/nodemailer/deposit-return-notification", {
        consumer: {
          name: `${customer.name}, ${customer.lastName}`,
          email: customer.email,
        },
        message: {
          paymentIntent: paymentIntentDetailSelected.paymentIntent,
          amount: amountWithNoDecimal,
        },
        amount: amountWithNoDecimal,
        event: event.eventInfoDetail.eventName,
        transaction: paymentIntentDetailSelected.paymentIntent,
        date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
        time: dateRef[4],
        company: event.company,
        link: `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`,
      });
      queryClient.invalidateQueries({
        queryKey: ["transactionPerConsumerListQuery"],
        exact: true,
      });
      refetchingTransactionFn();
      openNotificationWithIcon("Success", "Deposit was released.");
      await closeModal();
    }
  };

  return (
    <Modal
      open={openCancelingDepositModal}
      title={renderingTitle()}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
      maskClosable={false}
      style={{ zIndex: 30 }}
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
                onSubmit={handleEventInfo}
                className="form"
              >
                <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                  <Typography
                    textTransform={"none"}
                    textAlign={"left"}
                    fontFamily={"Inter"}
                    fontSize={"14px"}
                    fontStyle={"normal"}
                    fontWeight={500}
                    lineHeight={"20px"}
                    color={"var(--gray-700, #344054)"}
                  >
                    Transaction ID
                  </Typography>
                </InputLabel>
                <OutlinedInput
                  disabled
                  value={paymentIntentDetailSelected.paymentIntent}
                  style={{
                    borderRadius: "12px",
                    margin: "0.1rem auto 1rem",
                    display: "flex",
                    justifyContent: "flex-start",
                    width: "100%",
                  }}
                />

                <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                  <Typography
                    textTransform={"none"}
                    textAlign={"left"}
                    fontFamily={"Inter"}
                    fontSize={"14px"}
                    fontStyle={"normal"}
                    fontWeight={500}
                    lineHeight={"20px"}
                    color={"var(--gray-700, #344054)"}
                  >
                    Canceling deposit amount
                  </Typography>
                </InputLabel>
                <OutlinedInput
                  disabled
                  value={amountWithNoDecimal}
                  style={{
                    borderRadius: "12px",
                    margin: "0.1rem auto 1rem",
                    display: "flex",
                    width: "100%",
                    justifyContent: "flex-start",
                  }}
                  placeholder="e.g. $200"
                  startAdornment={
                    <InputAdornment position="start">
                      <Typography
                        textTransform={"none"}
                        textAlign={"left"}
                        fontFamily={"Inter"}
                        fontSize={"14px"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"20px"}
                        color={"var(--gray-700, #344054)"}
                      >
                        $
                      </Typography>
                    </InputAdornment>
                  }
                />
                <FormHelperText
                  style={{
                    marginBottom: "1rem",
                  }}
                  id="outlined-weight-helper-text"
                >
                  <Typography
                    textTransform={"none"}
                    textAlign={"left"}
                    fontFamily={"Inter"}
                    fontSize={"14px"}
                    fontStyle={"normal"}
                    fontWeight={400}
                    lineHeight={"20px"}
                    color={"var(--gray-600, #475467)"}
                  >
                    Please note that the displayed deposit amount will be
                    released. This action will result in the consumer observing
                    the corresponding transaction being removed from their bank
                    statement. Kindly inform consumers that this adjustment may
                    take approximately 7 to 10 business days to reflect on their
                    bank statement.
                  </Typography>
                </FormHelperText>

                <Button
                  type="submit"
                  disabled={
                    stripeTransactionQuery?.data?.data?.paymentIntent
                      ?.status === "canceled"
                  }
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
                    }}
                  >
                    Release deposit
                  </Typography>
                </Button>
              </form>
            </Grid>
          </Grid>{" "}
        </Grid>
      </Grid>{" "}
    </Modal>
  );
};

export default ReleaseDeposit;

ReleaseDeposit.propTypes = {
  openCancelingDepositModal: PropTypes.bool,
  setOpenCancelingDepositModal: PropTypes.bool,
  refetchingTransactionFn: PropTypes.func,
};
