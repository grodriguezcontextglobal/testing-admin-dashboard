import { Grid, Typography } from "@mui/material";
import { Input, Button, Modal, Popconfirm, Tooltip, notification } from "antd";
import { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { onAddCompanyAccountStripe } from "../../../../../store/slices/adminSlice";
const { TextArea } = Input;
const ModalCancelOptions = ({
  openCancelOptionsModal,
  setOpenCancelOptionsModal,
}) => {
  const [openOptionFromDueDate, setOpenOptionFromDueDate] = useState(false);
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const [feedbackCancellation, setFeedbackCancellation] = useState("");
  const priceRefToPass = useRef(null);
  const dispatch = useDispatch();
  const closeModal = () => {
    setOpenCancelOptionsModal(false);
  };
  const renderTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        color="#475467"
        lineHeight={"24px"}
        textAlign={"center"}
        fontWeight={600}
        fontFamily={"Inter"}
        fontSize={"16px"}
        noWrap={true}
      >
        Cancel subscription feedback
      </Typography>
    );
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg, dscpt) => {
    api.open({
      message: msg,
      description: dscpt,
    });
  };
  const [confirmLoading, setConfirmLoading] = useState(false);
  const priceOptions = [
    { 3000: "price_1NzOBaJAluu3aB96XWZfQrBt" },
    { 6000: "price_1O6xsWJAluu3aB96sZsWjLGl" },
    { 36000: "price_1NzOBaJAluu3aB96XWZfQrBt" },
    { 72000: "price_1O6xuIJAluu3aB96AcmN6vtH" },
  ];
  const foundPriceRefToPass = useCallback(() => {
    for (let data of priceOptions) {
      if (
        data[
        companyAccountStripe?.subscriptionHistory?.at(-1)?.latest_invoice
          ?.total
        ]
      ) {
        return (priceRefToPass.current =
          data[
          companyAccountStripe?.subscriptionHistory?.at(
            -1
          )?.latest_invoice?.total
          ]);
      }
    }
  }, []);

  foundPriceRefToPass();

  const showPopconfirmOptionFromDueDate = () => {
    setOpenOptionFromDueDate(true);
  };

  const handleOkOptionFromDueDate = async () => {
    setConfirmLoading(true);
    const subscriptionExposedId =
      companyAccountStripe.subscriptionHistory.at(-1).subscription;
    try {
      const respUpdateCancelSubscription = await devitrakApi.post(
        `/stripe/subscriptions/${subscriptionExposedId}`,
        {
          cancelAtPeriodEnd: true,
          cancellationComment: feedbackCancellation,
        }
      );
      if (respUpdateCancelSubscription.data.ok) {
        await devitrakApi.patch(
          `/stripe/updating-subscription/${companyAccountStripe.id}`,
          {
            subscriptionHistory: [
              ...companyAccountStripe.subscriptionHistory,
              {
                ...companyAccountStripe?.subscriptionHistory?.at(-1),
                latest_invoice:
                  respUpdateCancelSubscription?.data?.companyCustomer
                    ?.latest_invoice,
                paymentIntent:
                  respUpdateCancelSubscription?.data?.companyCustomer
                    ?.latest_invoice?.payment_intent,
                status: "canceled",
              },
            ],
          }
        );
        dispatch(
          onAddCompanyAccountStripe({
            ...companyAccountStripe,
            subscriptionHistory: [
              ...companyAccountStripe.subscriptionHistory,
              {
                ...companyAccountStripe?.subscriptionHistory?.at(-1),
                latest_invoice:
                  respUpdateCancelSubscription?.data?.companyCustomer
                    ?.latest_invoice,
                paymentIntent:
                  respUpdateCancelSubscription?.data?.companyCustomer
                    ?.latest_invoice?.payment_intent,
                status: "canceled",
              },
            ],
          })
        );
        openNotificationWithIcon(
          "success",
          "Subscription cancelled.",
          "Subscription will be active until its due date."
        );
        setOpenOptionFromDueDate(false);
        setConfirmLoading(false);
      }
    } catch (error) {
      openNotificationWithIcon(
        "error",
        "Something went wrong!",
        "Please try later."
      );
      setOpenOptionFromDueDate(false);
      setConfirmLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={renderTitle()}
        style={{
          top: 20,
        }}
        open={openCancelOptionsModal}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        maskClosable={false}
      >
        <Grid container>
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={2}
            item
            xs={12}
            sm={12}
          >
            <TextArea
              allowClear
              required={true}
              name="feedbackCancellation"
              value={feedbackCancellation}
              onChange={(e) => setFeedbackCancellation(e.target.value)}
              autoSize={{
                minRows: 3,
                maxRows: 5,
              }}
              placeholder="We value your feedback and would like to understand your reasons for canceling your subscription. Your insights are valuable to us, and they can help us improve our services. Please share your reasons for canceling here."
              minLength={75}
            />
            <Tooltip
              style={{
                width: "100%",
              }}
              placement="right"
              title="Opting for this will allow you to continue using the full range of subscription features until the subscription's due date. This means that even if you've decided to cancel, you'll get the most out of your subscription until it naturally expires. Plus, this choice helps you avoid generating a new invoice and prorating the payment."
              color={"blue"}
              key={"blue"}
            >
              <Popconfirm
                title="Are you sure to cancel your subscription?"
                description="Your subscription will be active until the expiration date."
                open={openOptionFromDueDate}
                onConfirm={handleOkOptionFromDueDate}
                okButtonProps={{
                  loading: confirmLoading,
                }}
                onCancel={() => setOpenOptionFromDueDate(false)}
              >
                <Button
                  style={{
                    width: "100%",
                  }}
                  onClick={showPopconfirmOptionFromDueDate}
                >
                  Submit cancellation&nbsp;
                  <Icon icon="heroicons:question-mark-circle" />
                </Button>
              </Popconfirm>
            </Tooltip>
          </Grid>
        </Grid>
      </Modal>{" "}
    </>
  );
};

export default ModalCancelOptions;
