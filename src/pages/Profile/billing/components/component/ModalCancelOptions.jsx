import { Grid, Typography } from "@mui/material";
import { Input, Modal, Popconfirm, Tooltip } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { onAddCompanyAccountStripe } from "../../../../../store/slices/adminSlice";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
const { TextArea } = Input;
const ModalCancelOptions = ({
  openCancelOptionsModal,
  setOpenCancelOptionsModal,
}) => {
  const [openOptionFromDueDate, setOpenOptionFromDueDate] = useState(false);
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const [feedbackCancellation, setFeedbackCancellation] = useState("");
  const dispatch = useDispatch();
  const closeModal = () => {
    setOpenCancelOptionsModal(false);
  };
  const renderTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        color="var(--gray-600, #5d615a)"
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
  const { notify, contextHolder } = useStatusNotification();
  const openNotificationWithIcon = (type, msg, dscpt) => {
    notify(type, msg, dscpt);
  };
  const [confirmLoading, setConfirmLoading] = useState(false);
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
        centered
        open={openCancelOptionsModal}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        maskClosable={false}
        width={1000}
        style={{ zIndex: 30 }}
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
                <GrayButtonComponent
                  styles={{
                    width: "100%",
                  }}
                  iconTrailing={<Icon icon="heroicons:question-mark-circle" />}
                  onClick={showPopconfirmOptionFromDueDate}
                >
                  Submit cancellation
                </GrayButtonComponent>
              </Popconfirm>
            </Tooltip>
          </Grid>
        </Grid>
      </Modal>{" "}
    </>
  );
};

export default ModalCancelOptions;
