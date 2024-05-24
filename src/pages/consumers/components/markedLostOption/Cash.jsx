import { useMediaQuery } from "@uidotdev/usehooks";
import { Alert, message } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { BlueButton } from "../../../../styles/global/BlueButton";
import {
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { onAddPaymentIntentSelected } from "../../../../store/slices/stripeSlice";
import { devitrakApi } from "../../../../api/devitrakApi";

const ConsumerDeviceLostFeeCash = () => {
  const navigator = useNavigate();
  const { choice, company, event } = useSelector((state) => state.event);
  const { receiverToReplaceObject } = useSelector((state) => state.helper);
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const dispatch = useDispatch();
  const { paymentIntentReceiversAssigned } = useSelector(
    (state) => state.stripe
  );

  const [messageApi, contextHolder] = message.useMessage();
  const loading = () => {
    messageApi.open({
      type: "loading",
      content: "Action in progress..",
      duration: 0,
    });
  };
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();
  const checkTypeOfPaymentIntentReceiversAssigned = () => {
    if (Array.isArray(paymentIntentReceiversAssigned))
      return paymentIntentReceiversAssigned[0];
    return paymentIntentReceiversAssigned;
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const changeStatusInPool = async () => {
    const deviceInPoolListQuery = await devitrakApi.post(
      "/receiver/receiver-pool-list",
      {
        eventSelected: choice,
        provider: company,
        device: receiverToReplaceObject.serialNumber,
        type: receiverToReplaceObject.deviceType,
      }
    );
    if (deviceInPoolListQuery.data) {
      const deviceInPoolProfile = {
        id: deviceInPoolListQuery.data.receiversInventory[0].id,
        activity: "NO",
        comment: "Device lost",
        status: "Lost",
      };

      const returningInPool = await devitrakApi.patch(
        `/receiver/receivers-pool-update/${deviceInPoolListQuery.data.receiversInventory[0].id}`,
        deviceInPoolProfile
      );
      if (returningInPool.data) {
        const objectReturnIssueProfile = {
          ...deviceInPoolListQuery.data.receiversInventory[0],
          activity: "NO",
          comment: "Device lost",
          status: "Lost",
          user: customer?.email,
          admin: user?.email,
          timeStamp: Date.now(),
        };
        await devitrakApi.post(
          "/receiver/receiver-returned-issue",
          objectReturnIssueProfile
        );
      }
    }
  };
  const changeStatusInDeviceAssignedData = async () => {
    const assignedDeviceProfile = {
      id: checkTypeOfPaymentIntentReceiversAssigned()._id,
      device: {
        ...checkTypeOfPaymentIntentReceiversAssigned().device,
        status: "Lost",
      },
    };
    const updateAssignedDeviceList = await devitrakApi.patch(
      `/receiver/receiver-update/${assignedDeviceProfile.id}`,
      assignedDeviceProfile
    );
    if (updateAssignedDeviceList.data.ok) {
      changeStatusInPool();
    }
  };
  const handleSubmitForm = async (data) => {
    let cashReportProfile = {
      attendee: customer?.email,
      admin: user.email,
      deviceLost: [
        {
          label: receiverToReplaceObject.serialNumber,
          deviceType: receiverToReplaceObject.deviceType,
        },
      ],
      amount: data.total,
      event: choice,
      company: company,
      typeCollection: "Cash",
    };
    loading();
    await changeStatusInDeviceAssignedData();
    const respo = await devitrakApi.post(
      "/cash-report/create-cash-report",
      cashReportProfile
    );
    if (respo) {
      const stringDate = new Date().toString();
      const dateSplitting = stringDate.split(" ");
      await devitrakApi.post("/nodemailer/lost-device-fee-notification", {
        consumer: {
          name: `${customer.name} ${customer.lastName}`,
          email: customer.email,
        },
        amount: data.total,
        event: event.eventInfoDetail.eventName,
        company: event.company,
        date: dateSplitting.slice(0, 4),
        time: dateSplitting[4],
        transaction: checkTypeOfPaymentIntentReceiversAssigned().paymentIntent,
        link: `https://app.devitrak.net/authentication/${encodeURI(
          event.eventInfoDetail.eventName
        )}/${encodeURI(event.company)}/${customer.uid}`,
      });
      await messageApi.destroy;
      navigator(`/consumers/${customer.uid}`);
    }
  };
  const handleBackAction = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigator(`/consumers/${customer.uid}`);
  };
  return (
    <>
      {contextHolder}
      <form
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <Grid
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          container
        >
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"flex-start"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={3}
          >
            <p style={{ ...TextFontSize30LineHeight38, textTransform: "none" }}>
              Cash method
            </p>
          </Grid>
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            item
            xs={12}
            sm={12}
            md={4}
            lg={3}
          >
            <OutlinedInput
              disabled
              value={receiverToReplaceObject.serialNumber}
              style={OutlinedInputStyle}
              fullWidth
            />
          </Grid>
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            margin={`${(isSmallDevice || isMediumDevice) && "0 0 2dvh 0"}`}
            item
            xs={12}
            sm={12}
            md={4}
            lg={3}
          >
            <FormControl fullWidth>
              <InputLabel htmlFor="outlined-adornment-amount">
                <p
                  style={{
                    color: "#000",
                    fontSize: "14px",
                    fontWeight: "600",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                    textTransform: "none",
                  }}
                >
                  Amount
                </p>
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-amount"
                style={OutlinedInputStyle}
                startAdornment={
                  <InputAdornment position="start">$</InputAdornment>
                }
                {...register("total", { required: true })}
                aria-invalid={errors.total ? "true" : "false"}
                label="Amount"
                name="total"
              />
            </FormControl>
            {errors?.total && (
              <Alert message="Amount is required" type="error" />
            )}
          </Grid>
          <Grid
            display={"flex"}
            alignItems={"center"}
            justifyContent={"flex-end"}
            gap={1}
            item
            xs={12}
            sm={12}
            md={3}
            lg={2}
          >
            <button
              style={{
                ...BlueButton,
                width: "fit-content",
              }}
              onClick={() => handleBackAction()}
            >
              <p style={{ ...BlueButtonText, textTransform: "none" }}>Cancel</p>
            </button>{" "}
            <button
              style={{
                ...BlueButton,
                width: "fit-content",
              }}
              type="submit"
            >
              <p style={{ ...BlueButtonText, textTransform: "none" }}>Submit</p>
            </button>
          </Grid>
        </Grid>
      </form>
    </>
  );
};

export default ConsumerDeviceLostFeeCash;
