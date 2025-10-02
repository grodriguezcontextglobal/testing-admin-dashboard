import {
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message, notification } from "antd";
import { groupBy } from "lodash";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  devitrakApi,
  devitrakApiAdmin,
} from "../../../../../../api/devitrakApi";
import DeviceAssigned from "../../../../../../classes/deviceAssigned";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import { onAddDevicesAssignedInPaymentIntent } from "../../../../../../store/slices/stripeSlice";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";
// import EmailStructureUpdateItem from "../../../../../../classes/emailStructureUpdateItem";

const AddingDevicesToPaymentIntent = ({ record, refetchingFn }) => {
  const [submittedAction, setSubmittedAction] = useState(false);
  // const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { choice, event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.customer);
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

  const assignItemEmailNotification = async (props) => {
    try {
      await devitrakApi.post("/nodemailer/assignig-device-notification", {
        consumer: {
          email: customer.email,
          firstName: customer.name,
          lastName: customer.lastName,
        },
        devices: [{ ...props.device, paymentIntent: props.paymentIntent }],
        event: props.eventSelected ?? props.event,
        transaction: props.paymentIntent,
        company: user.companyData.id,
        link: `https://app.devitrak.net/?event=${props.event_id}&company=${user.companyData.id}`,
        admin: user.email,
      });
      message.success("Assignment email has been sent successfully");
    } catch (error) {
      message.error(`There was an error. ${error}`);
    }
  };

  const sortAndFilterDeviceListPerCompanyAndEvent = () => {
    if (checkDeviceInUseInOtherCustomerInTheSameEventQuery?.length > 0) {
      return checkDeviceInUseInOtherCustomerInTheSameEventQuery;
    }
    return [];
  };
  sortAndFilterDeviceListPerCompanyAndEvent();

  const sortedByDevice = groupBy(
    sortAndFilterDeviceListPerCompanyAndEvent(),
    "device"
  );

  const retrieveDeviceInfoSetInEventForConsumers = () => {
    const sortInventory = groupBy(
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
      const deviceCheck = groupBy(
        sortAndFilterDeviceListPerCompanyAndEvent(),
        "device"
      );
      if (deviceCheck[serialNumber]) {
        for (let data of deviceCheck[serialNumber]) {
          if (data.activity || String(data.status).toLowerCase() === "lost") {
            openNotificationWithIcon(
              "Info",
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
      const deviceCheck = groupBy(
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
        "Warning",
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
      user.companyData.id,
      event.id
    );

    try {
      if (checkDeviceIsAssignedInEvent()) {
        const resp = await devitrakApiAdmin.post(
          "/receiver-assignation",
          template.render()
        );
        saveAndUpdateDeviceInPool();
        await createEventInTransactionLog();
        await clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
        );
        await clearCacheMemory(
          `eventSelected=${event.id}&company=${user.companyData.id}`
        );

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
          if (Number(record.device[0].deviceNeeded) === 1) {
            // const dateString = new Date().toString();
            // const dateRef = dateString.split(" ");
            // const linkStructure = `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`;
            // const emailStructure = new EmailStructureUpdateItem(
            //   customer.name,
            //   customer.lastName,
            //   customer.email,
            //   newDeviceObject.serialNumber,
            //   newDeviceObject.deviceType,
            //   event.eventInfoDetail.eventName,
            //   event.company,
            //   record.paymentIntent,
            //   String(dateRef.slice(0, 4)).replaceAll(",", " "),
            //   dateRef[4],
            //   linkStructure
            // );
            // await devitrakApi.post(
            //   "/nodemailer/assignig-device-notification",
            //   emailStructure.render()
            // );
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
            //   }/${customer.id ?? customer.iud}`
            // });
          }

          openNotificationWithIcon(
            "Success",
            "Devices are being added, they will be displayed shortly."
          );
          setValue("serialNumber", "");
          await assignItemEmailNotification(template.render());
          setSubmittedAction(false);
        }
      }
    } catch (error) {
      openNotificationWithIcon(
        "Error",
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
          <Grid height={"auto"} alignSelf={"flex-end"} item xs={2}>
          <BlueButtonComponent disabled={submittedAction} buttonType="submit" title={"Add"} />
            {/* <Button
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
            </Button> */}
          </Grid>
        </Grid>
      </form>
    </>
  );
};

export default AddingDevicesToPaymentIntent;