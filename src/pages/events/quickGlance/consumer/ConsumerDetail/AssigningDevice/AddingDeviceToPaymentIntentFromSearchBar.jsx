import {
  Button,
  FormHelperText,
  Grid,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import _ from "lodash";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  devitrakApi,
  devitrakApiAdmin,
} from "../../../../../../api/devitrakApi";
import { onAddDevicesAssignedInPaymentIntent } from "../../../../../../store/slices/stripeSlice";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
const AddingDeviceToPaymentIntentFromSearchBar = ({ refetchingFn }) => {
  const { paymentIntentDetailSelected, customer } = useSelector(
    (state) => state.stripe
  );
  const { user } = useSelector((state) => state.admin);
  const { choice, event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const { deviceSetup } = event;
  const [submittedAction, setSubmittedAction] = useState(false);
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
  const saveDevicesAssignedListInDataBasedMutation = useMutation({
    mutationFn: (template) => {
      devitrakApiAdmin.post("/receiver-assignation", template);
    },
  });
  const deviceInPoolQuery = useQuery({
    queryKey: ["poolInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        activity: false,
      }),
    // enabled: false,
    refetchOnMount: false,
    cacheTime: 1000 * 60 * 3,
  });

  const checkDeviceInUseInOtherCustomerInTheSameEventQuery =
    deviceInPoolQuery?.data?.data?.receiversInventory;
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
      // refDeviceSetInEvent.current = checkDeviceInUseInOtherCustomerInTheSameEventQuery;
      return checkDeviceInUseInOtherCustomerInTheSameEventQuery;
    }
    return [];
  };
  sortAndFilterDeviceListPerCompanyAndEvent();

  const retrieveDeviceInfoSetInEventForConsumers = () => {
    const sortInventory = _.groupBy(
      sortAndFilterDeviceListPerCompanyAndEvent(),
      "type"
    );
    const result = new Set();
    for (let data of deviceSetup) {
      if (data.consumerUses) {
        if (sortInventory[data.group]) {
          result.add({
            ...data,
            startingNumber: sortInventory[data.group][0].device,
            endingNumber: sortInventory[data.group].at(-1).device,
          });
        }
      }
    }
    refDeviceSetInEvent.current = Array.from(result);
    return Array.from(result);
  };
  retrieveDeviceInfoSetInEventForConsumers();
  const retrieveDeviceSetupValueBaseOnTypeOfSerialNumber = () => {
    const dataToRetrieve = new Set();
    for (let data of refDeviceSetInEvent.current) {
      if (serialNumber.length === data.startingNumber.length) {
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
    if (sortAndFilterDeviceListPerCompanyAndEvent().length > 0) {
      const deviceCheck = _.groupBy(
        sortAndFilterDeviceListPerCompanyAndEvent(),
        "device"
      );
      if (deviceCheck[serialNumber]) {
        for (let data of deviceCheck[serialNumber]) {
          if (
            data.activity || //String(data.activity).toLowerCase() === "yes" ||
            String(data.status).toLowerCase() === "lost"
          ) {
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
    if (sortAndFilterDeviceListPerCompanyAndEvent().length > 0) {
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
        activity: true,
        comment: "No comment",
      }
    );
  };
  const createEventInTransactionLog = async () => {
    await devitrakApi.post("/transaction-audit-log/create-audit", {
      transaction: paymentIntentDetailSelected.paymentIntent,
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
      retrieveDeviceSetupValueBaseOnTypeOfSerialNumber().length < 1
    ) {
      return openNotificationWithIcon(
        "warning",
        `Serial number ${data.serialNumber} is out of valid range for this event, please review and try another serial number.`
      );
    }
    const newDeviceObject = {
      serialNumber: data.serialNumber,
      deviceType: refDeviceObjectRetrieve.current.at(-1).deviceType,
      status: true,
    };

    const template = {
      paymentIntent: paymentIntentDetailSelected.paymentIntent,
      device: newDeviceObject,
      user: paymentIntentDetailSelected.consumerInfo.email,
      active: true,
      eventSelected: choice,
      provider: user.company,
      timeStamp: new Date().getTime(),
    };
    try {
      if (checkDeviceIsAssignedInEvent()) {
        const resp = await devitrakApiAdmin.post(
          "/receiver-assignation",
          template
        );
        saveAndUpdateDeviceInPool();
        await createEventInTransactionLog();

        if (resp.data.ok) {
          dispatch(
            onAddDevicesAssignedInPaymentIntent(
              saveDevicesAssignedListInDataBasedMutation.data
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
          if (paymentIntentDetailSelected.device === 1) {
            const dateString = new Date().toString();
            const dateRef = dateString.split(" ");
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
              transaction: paymentIntentDetailSelected.paymentIntent,
              link: `https://app.devitrak.net/authentication/${event.eventInfoDetail.eventName}/${event.company}/${customer.uid}`,
            });
          }

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
    <form
      onSubmit={handleSubmit(handleDevicesAssignedToPaymentIntentInEvent)}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {contextHolder}
      <Grid
        display={"flex"}
        justifyContent={"space-around"}
        alignItems={"center"}
        alignSelf={"flex-end"}
        marginY={1}
        container
      >
        <Grid
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          item
          xs={11}
          sm={11}
          md={11}
          lg={11}
        >
          <OutlinedInput
            disabled={submittedAction}
            autoFocus={true}
            {...register("serialNumber", { required: true })}
            placeholder="Scan a serial number here."
            fullWidth
            style={OutlinedInputStyle}
          />
          <FormHelperText id="outlined-weight-helper-text">
            {errors?.serialNumber && <p>Serial number is required</p>}
          </FormHelperText>
        </Grid>
        <Grid
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
          item
          xs
          sm
          md
          lg
        >
          <Button disabled={submittedAction} style={BlueButton} type="submit">
            <Typography textTransform={"none"} style={BlueButtonText}>
              Add
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </form>
  );
  // }
};

export default AddingDeviceToPaymentIntentFromSearchBar;
