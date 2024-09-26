import {
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Alert, message } from "antd";
import { groupBy } from "lodash";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import Loading from "../../../../../../components/animation/Loading";
import { onAddPaymentIntentSelected } from "../../../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../../../styles/global/TextFontSize30LineHeight38";
const Cash = () => {
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
  const returnDeviceValue = () => {
    const resultFound = new Set();
    const { deviceSetup } = event;
    for (let data of deviceSetup) {
      if (data.consumerUses) {
        resultFound.add(data);
      }
    }
    const arrayOfFound = Array.from(resultFound);
    for (let data of arrayOfFound) {
      if (data.group === receiverToReplaceObject.deviceType) {
        return data;
      }
    }
  };
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      total: `${returnDeviceValue().value}`,
    },
  });
  const listOfDeviceInPool = useQuery({
    queryKey: ["deviceListOfPool"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
  });
  const checkTypeOfPaymentIntentReceiversAssigned = () => {
    if (Array.isArray(paymentIntentReceiversAssigned))
      return paymentIntentReceiversAssigned[0];
    return paymentIntentReceiversAssigned;
  };
  const groupingByCompany = groupBy(
    listOfDeviceInPool.data?.data?.receiversInventory,
    "provider"
  );
  const findRightDataInEvent = () => {
    const eventCompanyData = groupingByCompany[user.company];
    if (eventCompanyData) {
      const eventGroup = groupBy(eventCompanyData, "eventSelected");
      const eventData = eventGroup[event.eventInfoDetail.eventName];
      if (eventData) {
        return eventData;
      }
    }
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  if (listOfDeviceInPool.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (listOfDeviceInPool.data) {
    const changeStatusInPool = async () => {
      let findTheOneInUsed;
      let findDeviceInPool = groupBy(findRightDataInEvent(), "device");
      if (findDeviceInPool[receiverToReplaceObject.serialNumber]) {
        findTheOneInUsed = findDeviceInPool[
          receiverToReplaceObject.serialNumber
        ].find((element) => element.activity === true);
      }
      await devitrakApi.patch(
        `/receiver/receivers-pool-update/${findTheOneInUsed.id}`,
        {
          id: findTheOneInUsed.id,
          activity: false,
          comment: "Device lost",
          status: "Lost",
        }
      );
      const objectReturnIssueProfile = {
        ...findTheOneInUsed,
        activity: false,
        comment: "Device lost",
        status: "Lost",
        user: customer?.email,
        admin: user?.email,
        timeStamp: new Date().getTime(),
      };
      await devitrakApi.post(
        "/receiver/receiver-returned-issue",
        objectReturnIssueProfile
      );
    };
    const changeStatusInDeviceAssignedData = async () => {
      const assignedDeviceProfile = {
        id: checkTypeOfPaymentIntentReceiversAssigned().id,
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
          device: `${receiverToReplaceObject.deviceType} - ${receiverToReplaceObject.serialNumber}`,
          amount: data.total,
          event: event.eventInfoDetail.eventName,
          company: event.company,
          date: dateSplitting.slice(0, 4),
          time: dateSplitting[4],
          transaction:
            checkTypeOfPaymentIntentReceiversAssigned().paymentIntent,
        });
        await messageApi.destroy;
        navigator(
          `/events/event-attendees/${customer.uid}/transactions-details`
        );
      }
    };
    const handleBackAction = () => {
      dispatch(onAddPaymentIntentSelected(""));
      navigator(`/events/event-attendees/${customer.uid}/transactions-details`);
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
              <Typography
                textTransform={"none"}
                style={TextFontSize30LineHeight38}
              >
                Cash method
              </Typography>
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
                  <Typography
                    textTransform={"none"}
                    style={{
                      color: "#000",
                      fontSize: "14px",
                      fontWeight: "600",
                      fontFamily: "Inter",
                      lineHeight: "20px",
                    }}
                  >
                    Amount
                  </Typography>
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
              <Button
                style={{
                  ...BlueButton,
                  width: "fit-content",
                }}
                onClick={() => handleBackAction()}
              >
                <Typography textTransform={"none"} style={BlueButtonText}>
                  Cancel
                </Typography>
              </Button>{" "}
              <Button
                style={{
                  ...BlueButton,
                  width: "fit-content",
                }}
                type="submit"
              >
                <Typography textTransform={"none"} style={BlueButtonText}>
                  Submit
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </form>
      </>
    );
  }
};

export default Cash;
