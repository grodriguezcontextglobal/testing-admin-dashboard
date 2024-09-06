import { Icon } from "@iconify/react/dist/iconify.js";
import {
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button, Divider, message } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddPaymentIntentSelected } from "../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import CardRendered from "../../../inventory/utils/CardRendered";
import AssigmentAction from "../AssigmentAction";
import CardActionsButton from "../CardActionsButton";
import ConsumerDetailInformation from "../ConsumerDetailInformation";
import ConsumerDetailInfoCntact from "../ConsumerDetailinfoContact";
import NotesRendering from "../NotesCard";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";

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
  const substractingNotesAddedForCompany = () => {
    const result = customer?.data?.notes.filter(
      (ele) => ele.company === user.companyData.id
    );
    if (result.length > 0) {
      let final = [];
      final = [...final, ...result.map((item) => item)];
      // (note += item.notes)
      return final;
    }
    return [];
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
  const changeStatusInPool = async () => {
    const deviceInPoolListQuery = await devitrakApi.post(
      "/receiver/receiver-pool-list",
      {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        device: receiverToReplaceObject.serialNumber,
        type: receiverToReplaceObject.deviceType,
      }
    );
    if (deviceInPoolListQuery.data) {
      const deviceInPoolProfile = {
        id: deviceInPoolListQuery.data.receiversInventory[0].id,
        activity: false,
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
          activity: false,
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
      event: event.eventInfoDetail.eventName,
      company: event.company,
      typeCollection: "Cash",
    };
    // console.log(cashReportProfile);
    // console.log(data);
    loading();
    if (data.total) {
      await changeStatusInDeviceAssignedData();
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
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "0 0 1.5dvh",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Typography
              textTransform={"none"}
              style={TextFontSize30LineHeight38}
            >
              Consumer
            </Typography>
            {/* /event/new_subscription */}
            <Link to="/create-event-page/event-detail">
              <Button
                style={{
                  ...BlueButton,
                  ...CenteringGrid,
                }}
              >
                <Icon
                  icon="ic:baseline-plus"
                  color="var(--base-white, #FFF"
                  width={20}
                  height={20}
                />
                &nbsp;
                <Typography
                  textTransform={"none"}
                  style={{
                    ...BlueButtonText,
                  }}
                >
                  Add new event
                </Typography>
              </Button>
            </Link>
          </Grid>
        </Grid>
        <Grid
          style={{
            paddingTop: "0px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid marginY={0} item xs={8}>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                style={{
                  ...TextFontsize18LineHeight28,
                  textTransform: "capitalize",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--blue-dark-600, #155EEF)",
                  cursor: "pointer",
                }}
                onClick={() => handleBackAction()}
              >
                All consumers
              </Typography>
              <Typography
                style={{
                  ...TextFontsize18LineHeight28,
                  textTransform: "capitalize",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--gray-900, #101828)",
                }}
              >
                <Icon icon="mingcute:right-line" />
                {customer?.name} {customer?.lastName}
              </Typography>{" "}
            </Grid>
          </Grid>
          <Grid textAlign={"right"} item xs={4}></Grid>
        </Grid>
        <Divider />
        <Grid
          gap={"5px"}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={3}
            lg={3}
          >
            <ConsumerDetailInformation />
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <ConsumerDetailInfoCntact />
          </Grid>
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            sm={12}
            md={3}
            lg={3}
          >
            <CardActionsButton />
          </Grid>
        </Grid>
        <Divider />{" "}
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
          <CardRendered title={"Transactions"} props={`${0}`} optional={null} />
        </Grid>{" "}
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
          <CardRendered title={"Events"} props={0} optional={null} />
        </Grid>
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={6} lg={6}>
          <NotesRendering
            title={"Notes"}
            props={substractingNotesAddedForCompany()}
          />
        </Grid>
        <Divider />{" "}
        <p
          style={{
            ...TextFontsize18LineHeight28,
            width: "100%",
            textAlign: "left",
            margin: "0 0 1.5dvh",
          }}
        >
          Transactions
        </p>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            md={4}
            lg={4}
          >
            <OutlinedInput
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search a transaction here"
              startAdornment={
                <InputAdornment position="start">
                  <Icon
                    icon="radix-icons:magnifying-glass"
                    color="#344054"
                    width={20}
                    height={19}
                  />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            md={5}
            lg={5}
          >
            <AssigmentAction />
          </Grid>
        </Grid>
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
                    value={receiverToReplaceObject.serialNumber}
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
