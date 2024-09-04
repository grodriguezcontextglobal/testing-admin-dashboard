import {
  Button,
  FormHelperText,
  Grid,
  InputLabel,
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
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import DeviceAssigned from "../../../../../../classes/deviceAssigned";
import axios from "axios";
const AddingDevicesToPaymentIntent = ({ record, refetchingFn }) => {
  const [submittedAction, setSubmittedAction] = useState(false);
  const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { choice, event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const { deviceSetup } = event;
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
        company: user.companyData.id,
        activity: false,
      }),
    refetchOnMount: false,
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
  let serialNumber = watch("serialNumber");
  const sortAndFilterDeviceListPerCompanyAndEvent = () => {
    if (checkDeviceInUseInOtherCustomerInTheSameEventQuery?.length > 0) {
      return checkDeviceInUseInOtherCustomerInTheSameEventQuery;
    }
    return [];
  };
  sortAndFilterDeviceListPerCompanyAndEvent();
  const sortedByDevice = _.groupBy(
    sortAndFilterDeviceListPerCompanyAndEvent(),
    "device"
  );

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
    if (sortedByDevice[serialNumber]) {
      refDeviceObjectRetrieve.current = sortedByDevice[serialNumber];
      return sortedByDevice[serialNumber];
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
          if (data.activity || String(data.status).toLowerCase() === "lost") {
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
      transaction: record.paymentIntent,
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
      openNotificationWithIcon(
        "warning",
        `Serial number ${data.serialNumber} is out of valid range for this event, please review and try another serial number.`
      );
      setValue("serialNumber", "");
      return setSubmittedAction(false);
    }
    const newDeviceObject = {
      serialNumber: data.serialNumber,
      deviceType: refDeviceObjectRetrieve.current.at(-1).type,
      status: true,
    };
    const template = new DeviceAssigned(
      record.paymentIntent,
      newDeviceObject,
      record.consumerInfo.email,
      true,
      choice,
      user.company,
      new Date().getTime(),
      user.companyData.id
    );

    try {
      if (checkDeviceIsAssignedInEvent()) {
        const resp = await devitrakApiAdmin.post(
          "/receiver-assignation",
          template.render()
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
          if (record.device[0].deviceNeeded == 1) {
            const dateString = new Date().toString();
            const dateRef = dateString.split(" ");
            await axios.post(
              "https://e78twzb8z4.execute-api.us-east-1.amazonaws.com/dev/emailnotifications/assigned_device",
              {
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
                link: `https://app.devitrak.net/authentication/${event.id}/${
                  user.companyData.id
                }/${customer.id ?? customer.iud}`,
              }
            );

            // await devitrakApi.post("/nodemailer/assignig-device-notification", {
            //   consumer: {
            //     name: `${customer.name} ${customer.lastName}`,
            //     email: customer.email,
            //   },
            //   device: {
            //     serialNumber: newDeviceObject.serialNumber,
            //     deviceType: newDeviceObject.deviceType,
            //   },
            //   event: event.eventInfoDetail.eventName,
            //   company: event.company,
            //   date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
            //   time: dateRef[4],
            //   transaction: record.paymentIntent,
            //   link: `https://app.devitrak.net/authentication/${event.id}/${
            //     user.companyData.id
            //   }/${customer.id ?? customer.iud}`,
            // });
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
