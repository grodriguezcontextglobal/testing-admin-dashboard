import {
  Button,
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { onAddDevicesAssignedInPaymentIntent } from "../../../../../../store/slices/stripeSlice";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
const AddingDevicesToPaymentIntent = ({ record, refetchingFn }) => {
  const [submittedAction, setSubmittedAction] = useState(false);
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { choice, event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const { deviceSetup } = event;
  // const [deviceInPoolQuery, setDeviceInPoolQuery] = useState([])
  const refDeviceObjectRetrieve = useRef(null);
  const refDeviceHasRecordInEvent = useRef(null);
  const refDeviceSetInEvent = useRef(null);
  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useForm();
  const queryClient = useQueryClient();
  const deviceInPoolQuery = useQuery({
    queryKey: ["poolInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
    // enabled: false,
    refetchOnMount: false,
    cacheTime: 1000 * 60 * 3,
  });

  const checkDeviceInUseInOtherCustomerInTheSameEventQuery =
    deviceInPoolQuery?.data?.data?.receiversInventory;

  useEffect(() => {
    const controller = new AbortController();
    deviceInPoolQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, message) => {
    api.open({
      message: `${type}`,
      description: `${message}`,
      placement: "bottomRight",
    });
  };
  //!refactoring functions to assign devices
  let serialNumber = watch("serialNumber");
  const sortAndFilterDeviceListPerCompanyAndEvent = () => {
    if (checkDeviceInUseInOtherCustomerInTheSameEventQuery?.length > 0) {
      return checkDeviceInUseInOtherCustomerInTheSameEventQuery;
    }
    return [];
  };
  sortAndFilterDeviceListPerCompanyAndEvent();
  const retrieveDeviceInfoSetInEventForConsumers = () => {
    const result = new Set();
    for (let data of deviceSetup) {
      if (data.consumerUses) {
        result.add(data);
      }
    }
    refDeviceSetInEvent.current = Array.from(result);
    return Array.from(result);
  };
  retrieveDeviceInfoSetInEventForConsumers();
  const retrieveDeviceSetupValueBaseOnTypeOfSerialNumber = () => {
    const dataToRetrieve = new Set();
    for (let data of refDeviceSetInEvent.current) {
      if (serialNumber?.length === data.startingNumber?.length) {
        const start = data.startingNumber;
        const end = data.endingNumber;
        if (serialNumber >= start && serialNumber <= end) {
          dataToRetrieve.add({
            ...data,
            deviceType: data.group,
          });
        }
      } else {
        return;
      }
    }
    refDeviceObjectRetrieve.current = Array.from(dataToRetrieve);
    return Array.from(dataToRetrieve);
  };
  if (serialNumber?.length > 0) {
    retrieveDeviceSetupValueBaseOnTypeOfSerialNumber();
  }

  const checkDeviceIsAssignedInEvent = () => {
    if (sortAndFilterDeviceListPerCompanyAndEvent()?.length > 0) {
      const deviceCheck = _.groupBy(
        sortAndFilterDeviceListPerCompanyAndEvent(),
        "device"
      );
      if (deviceCheck[serialNumber]) {
        for (let data of deviceCheck[serialNumber]) {
          if (data.activity === "YES" || data.status === "Lost") {
            openNotificationWithIcon(
              "info",
              `device ${serialNumber} is already assigned to other customer`
            );
            setValue("serialNumber", "");
          }
        }
        refDeviceHasRecordInEvent.current = deviceCheck[serialNumber].at(-1);
        return true;
      }
      refDeviceHasRecordInEvent.current = null;
      return false;
    }
  };
  checkDeviceIsAssignedInEvent();

  const retrieveDeviceDataInPoolToUpdateIt = () => {
    if (sortAndFilterDeviceListPerCompanyAndEvent()?.length > 0) {
      const deviceCheck = _.groupBy(
        sortAndFilterDeviceListPerCompanyAndEvent(),
        "device"
      );
      if (deviceCheck[serialNumber]) {
        return deviceCheck[serialNumber].at(-1);
      } else {
        return [];
      }
    } else {
      return [];
    }
  };
  const saveAndUpdateDeviceInPool = async () => {
    await devitrakApi.patch(
      `/receiver/receivers-pool-update/${
        retrieveDeviceDataInPoolToUpdateIt().id
      }`,
      {
        status: "Operational",
        activity: "YES",
        comment: "No comment",
      }
    );
  };
  const createEventInTransactionLog = async () => {
    await devitrakApi.post("/transaction-audit-log/create-audit", {
      transaction: record?.paymentIntent,
      user: user.email,
      actionTaken: `Receivers ${serialNumber} were assigned to transaction`,
      time: `${new Date()}`,
      action: "action",
      company: user.company,
    });
  };
  const handleDevicesAssignedToPaymentIntentInEvent = async (data) => {
    setSubmittedAction(true);
    if (
      !retrieveDeviceSetupValueBaseOnTypeOfSerialNumber() ||
      retrieveDeviceSetupValueBaseOnTypeOfSerialNumber()?.length < 1
    ) {
      return openNotificationWithIcon(
        "warning",
        `Serial number ${serialNumber} is out of valid range for this event, please review and try another serial number.`
      );
    }
    const newDeviceObject = {
      serialNumber: data.serialNumber,
      deviceType: refDeviceObjectRetrieve.current.at(-1).deviceType,
      status: true,
    };

    const template = {
      paymentIntent: record.paymentIntent,
      device: newDeviceObject,
      user: record.consumerInfo.email,
      active: true,
      eventSelected: choice,
      provider: user.company,
      timeStamp: new Date().getTime(),
    };
    try {
      if (checkDeviceIsAssignedInEvent()) {
        const resp = await devitrakApi.post(
          "/receiver/receiver-assignation",
          template
        );
        saveAndUpdateDeviceInPool();
        await createEventInTransactionLog();
        if (resp.data.ok) {
          dispatch(
            onAddDevicesAssignedInPaymentIntent(
              resp.data.receiversAssignedPerUser
            )
          );
          queryClient.invalidateQueries({
            queryKey: ["deviceInPoolQuery"],
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: ["poolInfoQuery"],
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: ["listOfDevicesAssigned"],
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: ["assignedDeviceListQuery"],
            exact: true,
          });
          deviceInPoolQuery.refetch();
          refetchingFn();
          const dateString = new Date().toString();
          const dateRef = dateString.split(" ");
          //* check if reach device requested to notify
          await devitrakApi.post("/nodemailer/assignig-device-notification", {
            consumer: {
              name: `${customer.name} ${customer.lastName}`,
              email: customer.email,
            },
            device: {
              serialNumber: newDeviceObject.serialNumber,
              deviceType: newDeviceObject.deviceType,
            },
            event: event.eventInfoDetail.eventName,
            company: event.company,
            date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
            time: dateRef[4],
            transaction: record.paymentIntent,
            link: `https://app.devitrak.net/authentication/${event.eventInfoDetail.eventName}/${event.company}/${customer.uid}`,
          });

          openNotificationWithIcon(
            "success",
            "devices are being added, they will be displayed shortly."
          );
          setValue("serialNumber", "");
          setSubmittedAction(false);
        }
      }
    } catch (error) {
      console.log(error);
      openNotificationWithIcon(
        "error",
        "something went wrong, please try later."
      );
      setSubmittedAction(false);
    }
  };
  return (
    <>
      {contextHolder}
      <form
        onSubmit={handleSubmit(handleDevicesAssignedToPaymentIntentInEvent)}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-around"}
          alignItems={"center"}
          marginY={1}
          container
        >
          <Grid item xs={9}>
            <InputLabel>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={400}
                fontSize={"18px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--gray-600, #475467)"}
              >
                Serial number
              </Typography>
            </InputLabel>
            <OutlinedInput
              disabled={submittedAction}
              autoFocus={true}
              {...register("serialNumber", { required: true })}
              fullWidth
              style={OutlinedInputStyle}
            />
            <FormHelperText id="outlined-weight-helper-text">
              {errors?.serialNumber && <p>Serial number is required</p>}
            </FormHelperText>
          </Grid>
          <Grid item xs={2}>
            <Button
              disabled={submittedAction}
              style={{
                width: "fit-content",
                border: "1px solid var(--blue-dark-600, #155EEF)",
                borderRadius: "8px",
                background: "var(--blue-dark-600, #155EEF)",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
              }}
              type="submit"
            >
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--base-white, #FFF",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Add
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
};

export default AddingDevicesToPaymentIntent;
