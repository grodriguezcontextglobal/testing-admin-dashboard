import { Box, Button, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Divider, Modal } from "antd";
import _ from 'lodash';
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { BlueButton } from "../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../styles/global/BlueButtonText";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import Multiple from "./free_transaction_options/Multiple";
import SingleFreeTransaction from "./free_transaction_options/Single";

const FreeTransaction = ({
    createTransactionForNoRegularUser,
    setCreateTransactionForNoRegularUser,
}) => {
    const { register, handleSubmit, setValue } = useForm()
    const { user } = useSelector((state) => state.admin);
    const { customer } = useSelector((state) => state.customer);
    const { choice, company, event } = useSelector((state) => state.event);
    const [listOfDevices, setListOfDevices] = useState([])
    const receiversSelection = listOfDevices.length
    const [deviceSelection, setDeviceSelection] = useState(null);
    const adminUser = user.email;
    const queryClient = useQueryClient();
    const reference = useRef(null);
    const [optionToRender, setOptionToRender] = useState(0)
    const deviceTrackInPoolQuery = useQuery({
        queryKey: ['devicesInPoolListPerEvent'],
        queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        }),
        refetchOnMount: false,
        staleTime: Infinity
    })
    const checkDeviceInUseInOtherCustomerInTheSameEventQuery = deviceTrackInPoolQuery?.data?.data?.receiversInventory //*device in pool
    const stampTime = `${new Date()}`;

    const closeModal = () => {
        setCreateTransactionForNoRegularUser(false)
    }
    const checkIfDeviceIsInUsed = () => {
        if (checkDeviceInUseInOtherCustomerInTheSameEventQuery?.length > 0) return checkDeviceInUseInOtherCustomerInTheSameEventQuery
        return []
    }
    checkIfDeviceIsInUsed()

    const checkDeviceAssignedInListForNewTransaction = props => {
        const findingDeviceInList = listOfDevices.some(element => element.serialNumber === props.serialNumber && element.group === props.group)
        if (findingDeviceInList) return true
        return false
    }

    const formattingSerialNumberLeadingZero = (num, totalLength) => {
        return String(num).padStart(totalLength, "0")
    }
    const subtractRangePerGroupToDisplayItInScreen = useCallback(() => {
        const devicesInPool = checkIfDeviceIsInUsed()
        const deviceSelectionInfo = JSON.parse(deviceSelection)
        const findingRange = new Set()
        for (let i = 0; i < devicesInPool.length; i++) {
            if (devicesInPool[i]?.type === deviceSelectionInfo?.group) {
                if (`${devicesInPool[i]?.activity}`.toLocaleLowerCase() === "no")
                    findingRange.add(Number(devicesInPool[i].device))
            }
        }
        const result = Array.from(findingRange)
        const max = Math.max(...result)
        const min = Math.min(...result)
        if (result.length > 0) {
            return {
                max: formattingSerialNumberLeadingZero(max, deviceSelectionInfo.startingNumber.length),
                min: formattingSerialNumberLeadingZero(min, deviceSelectionInfo.startingNumber.length)
            }
        }
        return {
            max: 0,
            min: 0
        }
    }, [deviceSelection])
    subtractRangePerGroupToDisplayItInScreen()
    const handleAddSerialNumber = async (data) => {
        const deviceSelectionInfo = await JSON.parse(deviceSelection)
        if (String(data.serialNumber).length !== String(deviceSelectionInfo.startingNumber).length) return alert("Selected device is not valid due to length does not match.")

        if (
            (Number(deviceSelectionInfo.startingNumber) <= Number(data.serialNumber)) &&
            (Number(deviceSelectionInfo.endingNumber) >= Number(data.serialNumber))
        ) {
            if (checkIfDeviceIsInUsed().some(element => element.device === data.serialNumber &&
                element.activity === "YES" &&
                element.type === deviceSelectionInfo.group)) {
                return alert("Device is assigned to other consumer in this event! Please try another device.")
            }

            if (checkDeviceAssignedInListForNewTransaction({ serialNumber: data.serialNumber, group: deviceSelectionInfo.group })) return alert("Device was scanned already! Please try another device.")

            setValue('serialNumber', '')
            return setListOfDevices([...listOfDevices, { ...data, ...deviceSelectionInfo }])

        }
        return alert(`${data.serialNumber} is out of range for device selection.`)
    }

    const handleDeleteElementInList = (props) => {
        const filter = listOfDevices.filter(element => element.serialNumber !== props.serialNumber)
        return setListOfDevices(filter)
    }
    const createReceiverInTransaction = async (props) => {
        const deviceToAssign = new Set()
        for (let data of listOfDevices) {
            deviceToAssign.add({
                serialNumber: data.serialNumber,
                deviceType: data.group,
                status: true
            })
        }
        for (let data of Array.from(deviceToAssign)) {
            await devitrakApi.post('/receiver/receiver-assignation', {
                paymentIntent: props,
                device: data,
                active: true,
                eventSelected: event.eventInfoDetail.eventName,
                provider: user.company,
                user: customer.email,
                timeStamp: new Date().getTime()
            })
        }
    }



    const createDevicesInPool = async () => {
        if (checkIfDeviceIsInUsed().length > 0) {
            const groupingByDevice = _.groupBy(checkIfDeviceIsInUsed(), "device")
            for (let data of listOfDevices) {
                if (groupingByDevice[data.serialNumber]) {
                    await devitrakApi.patch(`/receiver/receivers-pool-update/${groupingByDevice[data.serialNumber].at(-1).id}`, { activity: "YES" })
                } else {
                    await devitrakApi.post('/receiver/receivers-pool', {
                        eventSelected: event.eventInfoDetail.eventName, device: `${data.serialNumber}`, activity: "YES", type: data.group, provider: user.company
                    })
                }
            }
        }
    }
    const onSubmitRegister = async () => {
        const id = nanoid(12);
        const max = 918273645;
        const transactionGenerated = "pi_" + id;
        reference.current = transactionGenerated;
        try {
            const { data } = await devitrakApi.post(
                "/stripe/stripe-transaction-no-regular-user",
                {
                    paymentIntent: transactionGenerated,
                    clientSecret:
                        receiversSelection + customer.uid + Math.floor(Math.random() * max),
                    device: receiversSelection,
                    user: customer.uid,
                    eventSelected: choice,
                    provider: user.company,
                }
            );
            if (data) {
                let deviceInfToStoreParsed = JSON.parse(deviceSelection)
                let deviceSelectedOption = {
                    deviceType: deviceInfToStoreParsed.group,
                    deviceValue: deviceInfToStoreParsed.value,
                    deviceNeeded: receiversSelection
                }
                const transactionProfile = {
                    paymentIntent: reference.current,
                    clientSecret: data.stripeTransaction.clientSecret ?? "unknown",
                    device: deviceSelectedOption,
                    consumerInfo: customer,
                    provider: company,
                    eventSelected: choice,
                    date: `${new Date()}`,
                };
                await createReceiverInTransaction(reference.current)
                await createDevicesInPool()
                await devitrakApi.post("/stripe/save-transaction", transactionProfile);
                await devitrakApi.post("/transaction-audit-log/create-audit", {
                    transaction: reference.current,
                    user: adminUser,
                    actionTaken: `Transaction with not payment required was created`,
                    time: stampTime,
                });
                queryClient.invalidateQueries("transactionListQuery");
                closeModal();
            }
        } catch (error) {
            console.log(
                "🚀 ~ file: ModalCreateUser.js ~ line 136 ~ onSubmitRegister ~ error",
                error
            );
            alert(error);
        }
    };
    const renderTitle = () => {
        return (
            <Typography
                textTransform={"none"}
                marginY={2}
                style={{ ...TextFontSize30LineHeight38, textWrap: "balance" }}
            >
                New transaction for free device
            </Typography>
        );
    };
    return (
        <Modal
            title={renderTitle()}
            open={createTransactionForNoRegularUser}
            onOk={() => closeModal()}
            onCancel={() => closeModal()}
            centered
            footer={[]}
            width={1000}
            maskClosable={false}
        >
            <div
                style={{
                    minWidth: "fit-content",
                    backgroundColor: "#ffffff",
                    padding: "20px",
                }}
            >
                <Typography
                    textTransform={"none"}
                    color={"var(--gray-900, #101828)"}
                    lineHeight={"26px"}
                    textAlign={"left"}
                    fontWeight={400}
                    fontFamily={"Inter"}
                    fontSize={"18px"}
                    marginY={2}
                >
                    Please scan device for free transaction:
                </Typography>
                <Divider />
                <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "5px" }}>
                    <Button style={{ ...BlueButton, width: "100%" }} onClick={() => setOptionToRender(0)}><Typography style={{ ...BlueButtonText, textDecoration: `${optionToRender === 0 ? "underline" : "none"}`, textTransform: `${optionToRender === 0 ? "uppercase" : "none"}` }}>single device</Typography></Button>
                    <Button style={{ ...BlueButton, width: "100%" }} onClick={() => setOptionToRender(1)}><Typography style={{ ...BlueButtonText, textDecoration: `${optionToRender === 1 ? "underline" : "none"}`, textTransform: `${optionToRender === 1 ? "uppercase" : "none"}` }}>multiple device</Typography></Button>
                </Box>
                <Divider />
                <Typography>{
                    optionToRender === 0 ? "Single device" : "Multiple devices"
                }
                </Typography>
                {
                    optionToRender === 0 ? <SingleFreeTransaction setCreateTransactionForNoRegularUser={setCreateTransactionForNoRegularUser} /> : <Multiple setCreateTransactionForNoRegularUser={setCreateTransactionForNoRegularUser} />
                }
            </div>
        </Modal>
    );
};


export default FreeTransaction