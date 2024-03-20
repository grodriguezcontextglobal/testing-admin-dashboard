import {
  Button,
  Grid,
  MenuItem,
  OutlinedInput,
  Select,
  Typography
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, notification } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { onReceiverObjectToReplace, onTriggerModalToReplaceReceiver } from "../../../../../../store/slices/helperSlice";
import { onAddPaymentIntentDetailSelected, onAddPaymentIntentSelected } from "../../../../../../store/slices/stripeSlice";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import "../../../../../../styles/global/ant-select.css";
const menuOptions = ["Network", "Hardware", "Damaged", "Battery", "Other"];
export const ReplaceDevice = ({ refetching }) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const { paymentIntentSelected, customer } = useSelector(
    (state) => state.stripe
  );
  const { triggerModal, receiverToReplaceObject } = useSelector(
    (state) => state.helper
  );
  // const refDeviceHasRecordInEvent = useRef(null);
  // const refDeviceSetInEvent = useRef(null);
  const stampTime = `${new Date()}`;
  // const { deviceSetup } = event;
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api[type]({
      message: msg,
    });
  };
  const queryClient = useQueryClient();

  const assignedDeviceInTransactionQuery = useQuery({
    queryKey: ["assignedDeviceInTransaction"],
    queryFn: () => devitrakApi.post('/receiver/receiver-assigned-list', {
      "eventSelected": event.eventInfoDetail.eventName,
      "provider": event.company,
      "device.serialNumber": receiverToReplaceObject.serialNumber,
      "device.deviceType": receiverToReplaceObject.deviceType,
      paymentIntent: paymentIntentSelected
    }),
    enabled: false,
    refetchOnMount: false,
    notifyOnChangeProps: ['data', 'dataUpdatedAt']
  })

  const deviceInPoolQuery = useQuery({
    queryKey: ["deviceInPoolList"],
    queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company,
      device: receiverToReplaceObject.serialNumber,
      type: receiverToReplaceObject.deviceType
    }),
    enabled: false,
    refetchOnMount: false,
    notifyOnChangeProps: ['data', 'dataUpdatedAt']
  })

  useEffect(() => {
    const controller = new AbortController()
    assignedDeviceInTransactionQuery.refetch()
    deviceInPoolQuery.refetch()

    return () => {
      controller.abort()
    }
  }, [])

  const deviceInPool = deviceInPoolQuery?.data?.data?.receiversInventory
  const assignedDeviceInTransaction = assignedDeviceInTransactionQuery?.data?.data?.listOfReceivers

  const handleClearRecord = () => {
    dispatch(onAddPaymentIntentSelected(undefined));
    dispatch(onAddPaymentIntentDetailSelected([]));
  };
  function closeModal() {
    setValue("serialNumber", "");
    setValue("reason", "");
    setValue("otherComment", "");
    dispatch(onTriggerModalToReplaceReceiver(false));
    dispatch(onReceiverObjectToReplace({}))
    handleClearRecord()
  }
  //!refactoring functions based on new schema from DB
  //*function to insert data of defected returned device
  const defectedDevice = async (props) => {
    const template = {
      device: receiverToReplaceObject.serialNumber,
      status: props.reason,
      activity: 'No',
      comment: props.otherComment,
      user: customer.email,
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company,
      admin: user.email,
      timeStamp: new Date().toDateString(),
    }
    await devitrakApi.post('/receiver/receiver-returned-issue', template)
  }

  //*function to create activity in repot document in DB
  const reportEventLog = async (props) => {
    const eventProfile = {
      user: user.email,
      actionTaken: `Device ${receiverToReplaceObject.serialNumber} was replaced for ${props.serialNumber}`,
      time: stampTime,
      action: "device",
      company: user.company
    };
    await devitrakApi.post("/event-log/feed-event-log", eventProfile);
  };

  //*function to update old device in pool
  const updateOldDeviceInPool = async (props) => {
    await devitrakApi.patch(
      `/receiver/receivers-pool-update/${deviceInPool.at(-1).id}`,
      {
        status: props.reason,
        activity: "No",
        comment: props.otherComment,
      }
    );
  }

  //*function to update new device in pool
  const updateNewDeviceInPool = async (props) => {
    const newDeviceToAssignData = await devitrakApi.post('/receiver/receiver-pool-list', {
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company,
      device: props.serialNumber,
      type: receiverToReplaceObject.deviceType
    })
    if (newDeviceToAssignData.data.ok) {
      const newDeviceInfo = newDeviceToAssignData.data.receiversInventory.at(-1)
      await devitrakApi.patch(
        `/receiver/receivers-pool-update/${newDeviceInfo.id}`,
        {
          status: "Operational",
          activity: "YES",
          comment: "No comment",
        }
      );
    }

  }

  //*function to update new device in transaction
  const updateNewDeviceInTransaction = async (props) => {
    await devitrakApi.patch(
      `/receiver/receiver-update/${assignedDeviceInTransaction.at(-1).id}`,
      {
        id: assignedDeviceInTransaction.at(-1).id,
        device: {
          ...assignedDeviceInTransaction.at(-1).device,
          serialNumber: props.serialNumber
        },
      }
    );
    queryClient.invalidateQueries({ queryKey: ['assginedDeviceList'], exact: true })
  }

  const replaceDevice = async (data) => {
    await updateOldDeviceInPool(data);
    await updateNewDeviceInPool(data);
    await updateNewDeviceInTransaction(data)
    await defectedDevice(data)
    reportEventLog(data);
    handleClearRecord()
    queryClient.invalidateQueries({ queryKey: ['assginedDeviceList'], exact: true })
    refetching()
    openNotificationWithIcon('success', 'Device replaced successfully.')
    closeModal();
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`Receiver to replace: ${receiverToReplaceObject?.serialNumber}`}
        centered
        open={triggerModal}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        maskClosable={false}
      >
        <form
          style={{
            ...CenteringGrid, flexDirection: "column",
            width: "100%",
          }}
          onSubmit={handleSubmit(replaceDevice)}
        >
          <Grid container>
            <Grid margin={'1rem auto'} item xs={12} sm={12} md={12} lg={12}>
              <OutlinedInput
                id="outlined-adornment-password"
                placeholder="Serial number"
                {...register("serialNumber", { required: true })}
                style={OutlinedInputStyle}
                fullWidth
              />
              {errors?.serialNumber && (
                <Typography>Field required</Typography>
              )}
            </Grid>
            <Grid margin={'1rem auto'} item xs={12} sm={12} md={12} lg={12}>
              {watch("serialNumber") !== "" && (
                <Select
                className="custom-autocomplete"
                  {...register("reason", { required: true })}
                  style={{ ...AntSelectorStyle, width: "100%" }}
                >
                  <MenuItem value="">None</MenuItem>
                  {menuOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Typography>{option}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              )}
            </Grid>
            <Grid margin={'1rem auto'} item xs={12} sm={12} md={12} lg={12}>
              {watch("reason") === "Other" && (
                <OutlinedInput
                  multiline
                  minRows={5}
                  style={{ ...OutlinedInputStyle, height: "" }}
                  type="text"
                  {...register("otherComment", { required: true })}
                  placeholder="Add comment..."
                  fullWidth
                />
              )}
            </Grid>
            {watch("reason") !== "" && (
              <Grid display={"flex"} alignItems={"center"} gap={2} container>
                <Button
                  disabled={watch("reason") !== ""}
                  onClick={closeModal}
                  style={{ ...GrayButton, width: "100%" }}
                >
                  <Typography
                    textTransform={"none"}
                    style={GrayButtonText}
                  >
                    Cancel
                  </Typography>
                </Button>

                <Button
                  disabled={watch("reason") === ""}
                  type="submit"
                  style={{ ...BlueButton, width: "100%" }}
                >
                  <Typography
                    textTransform={"none"}
                    style={BlueButtonText}
                  >
                    Save
                  </Typography>
                </Button>
              </Grid>
            )}{" "}
          </Grid>
        </form>
      </Modal>
    </>
  );
};

// //*found all devices of the event/company
// const sortAndFilterDeviceListPerCompanyAndEvent = () => {
//   if (poolQuery?.length > 0) {
//     return poolQuery;
//   }
//   return [];
// };
// sortAndFilterDeviceListPerCompanyAndEvent();

// //*substract device set for consumer in event
// const retrieveDeviceInfoSetInEventForConsumers = () => {
//   const result = new Set();
//   for (let data of deviceSetup) {
//     if (data.consumerUses) {
//       result.add(data);
//     }
//   }
//   refDeviceSetInEvent.current = Array.from(result);
//   return Array.from(result);
// };
// retrieveDeviceInfoSetInEventForConsumers();

// //*check new serial number to assign to get info to store new item
// const substractDeviceInfoToStoreNewItem = () => {
//   for (let data of retrieveDeviceInfoSetInEventForConsumers()) {
//     if (Number(serialNumber) >= Number(data.startingNumber) && Number(serialNumber) <= Number(data.endingNumber)) {
//       return data
//     }
//   }
// }
// substractDeviceInfoToStoreNewItem()

// //*check if device to assign is already assigned to some consumer in event
// const checkDeviceIsAssignedInEvent = () => {
//   if (sortAndFilterDeviceListPerCompanyAndEvent().length > 0) {
//     const deviceCheck = _.groupBy(
//       sortAndFilterDeviceListPerCompanyAndEvent(),
//       "device"
//     );

//     if (deviceCheck[serialNumber]) {
//       for (let data of deviceCheck[serialNumber]) {
//         if (!substractDeviceInfoToStoreNewItem()) return openNotificationWithIcon(
//           "info",
//           `device ${serialNumber} is out of range for this event.`
//         );
//         if (String(data.activity).toLowerCase() === "yes" || String(data.status).toLowerCase() === "lost") {
//           openNotificationWithIcon(
//             "info",
//             `device ${serialNumber} is already assigned to other customer`
//           );
//           setValue("serialNumber", "");
//         }

//       }
//       refDeviceHasRecordInEvent.current = deviceCheck[serialNumber].at(-1);
//       return true;
//     }
//     refDeviceHasRecordInEvent.current = null;
//     return false;
//   }
// };
// checkDeviceIsAssignedInEvent();

// //*check if serial number to assign has record in pool
// const retrieveDeviceDataInPoolToUpdateIt = () => {
//   if (sortAndFilterDeviceListPerCompanyAndEvent().length > 0) {
//     const deviceCheck = _.groupBy(
//       sortAndFilterDeviceListPerCompanyAndEvent(),
//       "device"
//     );
//     if (deviceCheck[serialNumber]) {
//       return deviceCheck[serialNumber].at(-1);
//     } else {
//       return null;
//     }
//   } else {
//     return null;
//   }
// };

// //* function to save new serial number in pool based on if has record update or create
// const saveAndUpdateNewDeviceToAssignInPool = (props) => {
//   if (retrieveDeviceDataInPoolToUpdateIt()) {
//     devitrakApi.patch(
//       `/receiver/receivers-pool-update/${retrieveDeviceDataInPoolToUpdateIt().id
//       }`,
//       {
//         status: "Operational",
//         activity: "YES",
//         comment: "No comment",
//       }
//     );
//   }
// };

// //*finding current device to report with defect in DB
// const currentDeviceToChangeInPool = () => {
//   const groupingByDevice = _.groupBy(
//     sortAndFilterDeviceListPerCompanyAndEvent(),
//     "device"
//   );
//   if (groupingByDevice[receiverToReplaceObject.serialNumber]) {
//     return groupingByDevice[receiverToReplaceObject.serialNumber].at(-1);
//   }
// };
// currentDeviceToChangeInPool()

// //*function to update device to change in pool
// const updateCurrentAssignedDeviceInDB = async (props) => {
//   await devitrakApi.patch(
//     `/receiver/receivers-pool-update/${currentDeviceToChangeInPool().id}`,
//     {
//       activity: "NO",
//       status: props.reason,
//       comment: `${props.otherComment ? props?.otherComment : "No comment"}`,
//     }
//   );
// };
// updateCurrentAssignedDeviceInDB.propTypes = {
//   reason: PropTypes.string,
//   otherComment: PropTypes.string,
// };

// //*function to add issued device in defect device document in DB
// const addingDefectDeviceInDB = async (props) => {
//   const issueDeviceProfile = {
//     ...currentDeviceToChangeInPool(),
//     activity: "NO",
//     status: props.reason,
//     comment: `${props.otherComment ? props?.otherComment : "No comment"}`,
//     user: customer?.email,
//     admin: user.email,
//   };
//   await devitrakApi.post("/receiver/receiver-returned-issue", issueDeviceProfile)
// };
// //*finding assigned device list in payment intent
// const findingAssignedDeviceListInPaymentIntent = () => {

// };
// findingAssignedDeviceListInPaymentIntent();

// //*function to update list of devices in payment intent
// const updateAssignedDevicesListInPaymentIntent = async (props) => {
//   if (findingAssignedDeviceListInPaymentIntent()) {
//     const respoNewDeviceList = await devitrakApi.patch(
//       `/receiver/receiver-update/${findingAssignedDeviceListInPaymentIntent().id
//       }`,
//       {
//         id: findingAssignedDeviceListInPaymentIntent().id,
//         device: {
//           ...findingAssignedDeviceListInPaymentIntent().device,
//           serialNumber: props.serialNumber
//         },
//       }
//     );
//     if (respoNewDeviceList.data.ok) {
//       queryClient.invalidateQueries(['assignedDeviceListQuery', 'deviceInPoolQuery']);
//       openNotificationWithIcon(
//         "success",
//         "New device assigned to transaction/consumer"
//       );
//     }
//   }
// };