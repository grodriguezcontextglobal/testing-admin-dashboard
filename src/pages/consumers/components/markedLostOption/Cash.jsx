import {
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddPaymentIntentSelected } from "../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import CustomerHeader from "../UI/header";

const ConsumerDeviceLostFeeCash = () => {
  const navigator = useNavigate();
  const { event } = useSelector((state) => state.event);
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

  const findDeviceInfo = () => {
    const result = event.deviceSetup.find(
      (element) => element.group === receiverToReplaceObject.deviceType
    );
    if (Array.isArray(result)) {
      return result.at(-1);
    } else {
      return result;
    }
  };
  const { register, handleSubmit } = useForm({
    defaultValues: {
      total: findDeviceInfo().value,
    },
  });

  const checkTypeOfPaymentIntentReceiversAssigned = () => {
    if (Array.isArray(paymentIntentReceiversAssigned))
      return paymentIntentReceiversAssigned[0];
    return paymentIntentReceiversAssigned;
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const handleLostDeviceCashLostFee = async (data) => {
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
      event: event.id,
      company: user.companyData.id,
      typeCollection: "Cash",
    };
    loading();
    if (data.total) {
      const respo = await devitrakApi.post(
        "/cash-report/create-cash-report",
        cashReportProfile
      );
      if (respo.data) {
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
          device: {
            serialNumber: receiverToReplaceObject.serialNumber,
            deviceType: receiverToReplaceObject.deviceType,
          },
          transaction:
            checkTypeOfPaymentIntentReceiversAssigned().paymentIntent,
          link: `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`,
        });
        await messageApi.destroy;
        navigator(`/consumers/${customer.uid}`);
      }
    }
  };
  const handleBackAction = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigator(`/consumers/${customer.uid}`);
  };
  return (
    <>
      {contextHolder}
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          justifyContent: "center",
          alignSelf: "stretch",
        }}
        container
      >
        <CustomerHeader />
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <form
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onSubmit={handleSubmit(handleLostDeviceCashLostFee)}
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
                  <p
                    style={{
                      ...TextFontSize30LineHeight38,
                      textTransform: "none",
                    }}
                  >
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
                    value={receiverToReplaceObject?.serialNumber}
                    style={OutlinedInputStyle}
                    fullWidth
                  />
                </Grid>
                <Grid
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  margin={`${
                    (isSmallDevice || isMediumDevice) && "0 0 2dvh 0"
                  }`}
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
                      label="Amount"
                      type="text"
                      required
                      id="outlined-adornment-amount"
                      style={OutlinedInputStyle}
                      startAdornment={
                        <InputAdornment position="start">$</InputAdornment>
                      }
                      {...register("total")}
                      name="total"
                    />
                  </FormControl>
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
                    type="reset"
                    style={{
                      ...GrayButton,
                      width: "fit-content",
                    }}
                    onClick={() => handleBackAction()}
                  >
                    <p style={{ ...GrayButtonText, textTransform: "none" }}>
                      Cancel
                    </p>
                  </button>{" "}
                  <button
                    style={{
                      ...BlueButton,
                      width: "fit-content",
                    }}
                    type="submit"
                  >
                    <p style={{ ...BlueButtonText, textTransform: "none" }}>
                      Submit
                    </p>
                  </button>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ConsumerDeviceLostFeeCash;
