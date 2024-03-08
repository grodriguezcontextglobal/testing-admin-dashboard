import {
    Button,
    Grid,
    MenuItem,
    OutlinedInput,
    Select,
    Typography
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { onAddDeviceToDisplayInQuickGlance } from "../../../../../store/slices/devicesHandleSlice";
import { onReceiverObjectToReplace, onTriggerModalToReplaceReceiver } from "../../../../../store/slices/helperSlice";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
const menuOptions = ["Network", "Hardware", "Damaged", "Battery", "Other"];
export const Replace = () => {
    const [newDeviceInfoFromPool, setNewDeviceInfoFromPool] = useState([])
    const { user } = useSelector((state) => state.admin);
    const { event } = useSelector((state) => state.event);
    const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
    const { triggerModal } = useSelector((state) => state.helper);
    const { deviceSetup } = event;
    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm();
    const dispatch = useDispatch();
    let serialNumber = watch("serialNumber");
    const queryClient = useQueryClient();
    const deviceInPoolQuery = useQuery({
        queryKey: ['deviceInPool'],
        queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
            eventSelected: deviceInfoSelected.entireData.eventSelected,
            provider: deviceInfoSelected.entireData.provider,
            device: deviceInfoSelected.entireData.device,
            type: deviceInfoSelected.entireData.type,
            activity: deviceInfoSelected.entireData.activity
        })
    })

    const deviceInTransactionQuery = useQuery({
        queryKey: ['deviceInTransation'],
        queryFn: () => devitrakApi.post('/receiver/receiver-assigned-list', {
            eventSelected: deviceInfoSelected.entireData.eventSelected,
            provider: deviceInfoSelected.entireData.provider,
            'device.serialNumber': deviceInfoSelected.entireData.device,
            'device.deviceType': deviceInfoSelected.entireData.type,
            'device.status': true
        })
    })
    function closeModal() {
        setValue("serialNumber", "");
        setValue("reason", "");
        setValue("otherComment", "");
        dispatch(onTriggerModalToReplaceReceiver(false));
        dispatch(onReceiverObjectToReplace({}));
    }
    //!refactoring functions based on new schema from DB
    //*function to insert data of defected returned device
    const defectedDevice = async (props) => {
        const template = {
            device: deviceInfoSelected.entireData.serialNumber,
            status: props.reason,
            activity: 'No',
            comment: props.otherComment,
            user: deviceInTransactionQuery.data.data.user,
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company,
            admin: user.email,
            timeStamp: new Date().toDateString(),
        }
        await devitrakApi.post('/receiver/receiver-returned-issue', template)
    }
    //*function to update old device in pool
    const updateOldDeviceInPool = async (props) => {
        await devitrakApi.patch(
            `/receiver/receivers-pool-update/${deviceInPoolQuery?.data.data.receiversInventory.at(-1).id}`,
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
            type: deviceInfoSelected.entireData.type
        })
        if (newDeviceToAssignData.data.ok) {
            await devitrakApi.patch(
                `/receiver/receivers-pool-update/${newDeviceToAssignData.data.receiversInventory.at(-1).id}`,
                {
                    status: "Operational",
                    activity: "YES",
                    comment: "No comment",
                }
            );
            return setNewDeviceInfoFromPool(newDeviceToAssignData.data.receiversInventory.at(-1))
        }

    }

    //*function to update new device in transaction
    const updateNewDeviceInTransaction = async (props) => {
        await devitrakApi.patch(
            `/receiver/receiver-update/${deviceInTransactionQuery?.data.data.listOfReceivers.at(-1).id}`,
            {
                id: deviceInTransactionQuery?.data.data.listOfReceivers.at(-1).id,
                device: {
                    ...deviceInTransactionQuery?.data.data.listOfReceivers.at(-1).device,
                    serialNumber: props.serialNumber
                },
                timeStamp: new Date().getTime()
            }
        );
    }

    //*function to create activity in repot document in DB
    const replaceDevice = async (data) => {
        await updateOldDeviceInPool(data)
        await updateNewDeviceInPool(data)
        await updateNewDeviceInTransaction(data)
        await defectedDevice(data)
        queryClient.invalidateQueries([
            "assignedDeviceInEvent",
            "pool",
            "devicesAssignedPerTransaction",
            "listOfDevicesInPool",
        ]);
        dispatch(onAddDeviceToDisplayInQuickGlance({
            company: [event.eventInfoDetail.eventName, event.company],
            activity: "YES",
            status: "Operational",
            serialNumber: data.serialNumber,
            user: "YES",
            entireData: {
                eventSelected: event.eventInfoDetail.eventName,
                device: data.serialNumber,
                type: deviceInfoSelected.entireData.type,
                status: "Operational",
                activity: "YES",
                comment: "No comment",
                provider: event.company,
                id: newDeviceInfoFromPool.id
            }
        }))
        closeModal();
    };
    return (

            <Modal
                title={`Receiver to replace: ${deviceInfoSelected?.serialNumber}`}
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
    );
};

// //*found all devices of the event/company
// const sortAndFilterDeviceListPerCompanyAndEvent = () => {
//     if (poolQuery) {
//         return poolQuery;
//     }
//     return [];
// };
// sortAndFilterDeviceListPerCompanyAndEvent();

// //*substract device set for consumer in event
// const retrieveDeviceInfoSetInEventForConsumers = () => {
//     const result = new Set();
//     for (let data of deviceSetup) {
//         if (data.consumerUses) {
//             result.add(data);
//         }
//     }
//     refDeviceSetInEvent.current = Array.from(result);
//     return Array.from(result);
// };
// retrieveDeviceInfoSetInEventForConsumers();

// //*check if device to assign is already assigned to some consumer in event
// const checkDeviceIsAssignedInEvent = () => {
//     if (sortAndFilterDeviceListPerCompanyAndEvent().length > 0) {
//         const deviceCheck = _.groupBy(
//             sortAndFilterDeviceListPerCompanyAndEvent(),
//             "device"
//         );
//         if (deviceCheck[serialNumber]) {
//             for (let data of deviceCheck[serialNumber]) {
//                 if (data.activity === "YES") {
//                     openNotificationWithIcon(
//                         "info",
//                         `device ${serialNumber} is already assigned to other customer`
//                     );
//                     setValue("serialNumber", "");
//                 }
//             }
//             refDeviceHasRecordInEvent.current = deviceCheck[serialNumber].at(-1);
//             return true;
//         }
//         refDeviceHasRecordInEvent.current = null;
//         return false;
//     }
// };
// checkDeviceIsAssignedInEvent();

// //*check if serial number to assign has record in pool
// const retrieveDeviceDataInPoolToUpdateIt = () => {
//     if (sortAndFilterDeviceListPerCompanyAndEvent().length > 0) {
//         const deviceCheck = _.groupBy(
//             sortAndFilterDeviceListPerCompanyAndEvent(),
//             "device"
//         );
//         if (deviceCheck[serialNumber]) {
//             return deviceCheck[serialNumber].at(-1);
//         } else {
//             return [];
//         }
//     } else {
//         return [];
//     }
// };

// //* function to save new serial number in pool based on if has record update or create
// const saveAndUpdateNewDeviceToAssignInPool = async (props) => {
//     await devitrakApi.patch(
//         `/receiver/receivers-pool-update/${retrieveDeviceDataInPoolToUpdateIt().id
//         }`,
//         {
//             status: "Operational",
//             activity: "YES",
//             comment: "No comment",
//         }
//     );
// };

// //*finding current device to report with defect in DB
// const currentDeviceToChangeInPool = () => {
//     const groupingByDevice = _.groupBy(
//         sortAndFilterDeviceListPerCompanyAndEvent(),
//         "device"
//     );
//     if (groupingByDevice[deviceInfoSelected.serialNumber]) {
//         return groupingByDevice[deviceInfoSelected.serialNumber].at(-1);
//     }
// };
// currentDeviceToChangeInPool();

// //*function to update device to change in pool
// const updateCurrentAssignedDeviceInDB = async (props) => {
//     await devitrakApi.patch(
//         `/receiver/receivers-pool-update/${currentDeviceToChangeInPool().id}`,
//         {
//             activity: "NO",
//             status: props.reason,
//             comment: `${props.otherComment ? props?.otherComment : "No comment"}`,
//         }
//     );
// };
// updateCurrentAssignedDeviceInDB.propTypes = {
//     reason: PropTypes.string,
//     otherComment: PropTypes.string,
// };
// //*finding assigned device list in payment intent
// const findingAssignedDeviceListInPaymentIntent = () => {
//     if (listOfDevicesAssignedInEventQuery.length > 0) {
//         const deviceGroup = _.groupBy(listOfDevicesAssignedInEventQuery, "device.serialNumber");
//         const deviceInfo = deviceGroup[deviceInfoSelected.serialNumber];
//         if (deviceInfo) {
//             refDeviceListOfUser.current = deviceInfo
//             return deviceInfo.at(-1);
//         }
//     }
// };
// findingAssignedDeviceListInPaymentIntent();
// const addingDefectDeviceInDB = async (props) => {
//     const issueDeviceProfile = {
//         ...currentDeviceToChangeInPool(),
//         activity: "NO",
//         status: props.reason,
//         comment: `${props.otherComment ? props?.otherComment : "No comment"}`,
//         user: findingAssignedDeviceListInPaymentIntent().user,
//         admin: user.email,
//         timeStamp: new Date().getTime()
//     };
//     await devitrakApi.post(
//         "/receiver/receiver-returned-issue",
//         issueDeviceProfile
//     );
// };
// //*function to update list of devices in payment intent
// const updateAssignedDevicesListInPaymentIntent = async (props) => {
//     if (findingAssignedDeviceListInPaymentIntent()) {
//         const template = {
//             deviceType: deviceInfoSelected.entireData.type,
//             serialNumber: props.serialNumber,
//             status: true,
//         };
//         const respoNewDeviceList = await devitrakApi.patch(
//             `/receiver/receiver-update/${findingAssignedDeviceListInPaymentIntent().id
//             }`,
//             {
//                 id: findingAssignedDeviceListInPaymentIntent().id,
//                 device: template,
//             }
//         );
//         if (respoNewDeviceList.data.ok) {
//             openNotificationWithIcon(
//                 "success",
//                 "New device assigned to transaction/consumer"
//             );
//         }
//     }
// };
