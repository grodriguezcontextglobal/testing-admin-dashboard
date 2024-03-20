import { Button, Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Popconfirm, notification } from "antd";
import _ from 'lodash';
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { useCallback, useEffect } from "react";
import { formatDate } from "../../../../../components/utils/dateFormat";

const EndEventButton = () => {
    const { user } = useSelector((state) => state.admin);
    const { event } = useSelector((state) => state.event);
    const listOfInventoryQuery = useQuery({
        queryKey: ["listOfInventory"],
        queryFn: () => devitrakApi.get("/inventory/list-inventories"),
        enabled: false,
        refetchOnMount: false
    });
    const listOfItemsInInventoryQuery = useQuery({
        queryKey: ["listOfItemsInInventory"],
        queryFn: () => devitrakApi.get("/item/list-items", {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        }),
        enabled: false,
        refetchOnMount: false
    });
    const itemsInPoolQuery = useQuery({
        queryKey: ["listOfItemsInInventoryPOST"],
        queryFn: () => devitrakApi.post("/item/list-items", {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        }),
        enabled: false,
        refetchOnMount: false
    });

    const eventInventoryQuery = useQuery({
        queryKey: ['inventoryInEventList'],
        queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        }),
        enabled: false,
        refetchOnMount: false
    })

    const transactionsRecordQuery = useQuery({
        queryKey: ['transactionList'],
        queryFn: () => devitrakApi.post('/receiver/receiver-assigned-list', {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        }),
        enabled: false,
        refetchOnMount: false
    })
    useEffect(() => {
        const controller = new AbortController()
        listOfInventoryQuery.refetch()
        listOfItemsInInventoryQuery.refetch()
        itemsInPoolQuery.refetch()
        eventInventoryQuery.refetch()
        transactionsRecordQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [])

    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api[type]({
            message: msg,
        });
    };
    const groupingByCompany = _.groupBy(
        listOfInventoryQuery?.data?.data?.listOfItems,
        "company"
    );

    const findInventoryStored = () => {
        if (groupingByCompany[user.company]) {
            const groupingByEvent = _.groupBy(
                groupingByCompany[user.company],
                "event"
            );
            if (groupingByEvent[event.eventInfoDetail.eventName]) {
                return groupingByEvent[event.eventInfoDetail.eventName];
            }
        }
        return [];
    };
    findInventoryStored();


    const findItemsInPoolEvent = () => {
        const listOfItemsInPoolQuery = itemsInPoolQuery?.data?.data?.receiversInventory
        if (listOfItemsInPoolQuery?.length > 0) {
            return listOfItemsInPoolQuery;
        }
        return [];
    };
    findItemsInPoolEvent();

    const sqlDeviceReturnedToCompanyStock = useCallback(async () => {
        const response = await eventInventoryQuery?.data?.data?.receiversInventory
        const groupingByDevice = _.groupBy(response, 'device')
        const deviceList = event.deviceSetup
        for (let data of deviceList) {
            for (let i = data.startingNumber; i <= data.endingNumber; i++) { // Number(data.startingNumber); i <= Number(data.endingNumber); i++
                if (groupingByDevice[String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)]) {
                    await devitrakApi.post('/db_event/returning-item', {
                        warehouse: true,
                        status: groupingByDevice[String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)].at(-1).status,
                        update_at: formatDate(new Date()),
                        serial_number: groupingByDevice[String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)].at(-1).device,
                        category_name: data.category,
                        item_group: data.group,
                        company: event.company,
                        location: `${user.sqlInfo.city_address}, ${user.sqlInfo.state_address}`
                    })
                }
            }
        }
    }, [])

    const sqlDeviceFinalStatusAtEventFinished = useCallback(async () => {
        const response = await eventInventoryQuery?.data?.data?.receiversInventory
        const groupingByDevice = _.groupBy(response, 'device')
        const deviceList = event.deviceSetup
        for (let data of deviceList) {
            for (let i = data.startingNumber; i <= data.endingNumber; i++) { // Number(data.startingNumber); i <= Number(data.endingNumber); i++
                if (groupingByDevice[String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)]) {
                    await devitrakApi.post('/db_event/device-final-status', {
                        status: groupingByDevice[String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)].at(-1).status,
                        condition: groupingByDevice[String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)].at(-1).status,
                        updated_at: formatDate(new Date()),
                        serial_number: groupingByDevice[String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)].at(-1).device,
                        event_id: event.sql.event_id,
                    })
                }
            }
        }
    }, [])

    const groupingItemsByCompany = _.groupBy(
        listOfItemsInInventoryQuery?.data?.data?.listOfItems,
        "company"
    );

    const itemsPerCompany = () => {
        if (groupingItemsByCompany[user.company]) {
            const groupingByGroup = _.groupBy(
                groupingItemsByCompany[user.company],
                "group"
            );
            return groupingByGroup
        }
        return [];
    };
    itemsPerCompany();

    const checkItemsInUseToUpdateInventory = () => {
        const result = {}
        for (let data of findItemsInPoolEvent()) {
            if (`${data.activity}`.toLowerCase() === "yes" || `${data.status}`.toLowerCase() === "lost") {
                if (!result[data.type]) {
                    result[data.type] = 1
                } else {
                    result[data.type]++
                }
            }
        }
        return Object.entries(result)
    }
    checkItemsInUseToUpdateInventory()

    const returningItemsInInventoryAfterEndingEvent = () => {
        const totalResult = new Set()
        for (let device of event.deviceSetup) {
            if (checkItemsInUseToUpdateInventory().length > 0) {
                for (let data of checkItemsInUseToUpdateInventory()) {
                    if (device.group === data[0]) {
                        const quantityResult = Number(device.quantity) - data[1]
                        const profile = {
                            ...device,
                            quantity: quantityResult
                        }
                        totalResult.add(profile)
                    } else { totalResult.add(device) }
                }
            } else {
                totalResult.add(device)
            }
        }
        return Array.from(totalResult)
    }
    const inactiveEventAfterEndIt = async () => {
        try {
            const resp = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                active: false
            })
            if (resp.data.ok) return openNotificationWithIcon("success", "Event is closed. Inventory is updated!")

        } catch (error) {
            console.log("🚀 ~ file: EndEventButton.jsx:140 ~ inactiveEventAfterEndIt ~ error:", error)
            openNotificationWithIcon("error", `${error.message}`)
        }
    }
    const addingRecordOfActivityInEvent = async () => {
        try {
            const groupingInventoryByGroupName = _.groupBy(event.deviceSetup, 'group')
            const dataToStoreAsRecord = transactionsRecordQuery?.data?.data?.listOfReceivers
            for (let data of dataToStoreAsRecord) {
                await devitrakApi.post('/db_record/inserting-record', {
                    email: data.user, serial_number: data.device.serialNumber, status: `${typeof data.device.status === 'string' ? data.device.status : data.device.status ? "In-Use" : "Returned"}`, activity: `${data.device.activity}`, payment_id: data.paymentIntent, event: data.eventSelected[0], item_group: data.device.deviceType, category_name: groupingInventoryByGroupName[data.device.deviceType].at(-1).category
                })
            }
        } catch (error) {
            console.log("🚀 ~ addingRecordOfActivityInEvent ~ error:", error)
        }
    }
    const updatingItemInDB = async () => {
        if (returningItemsInInventoryAfterEndingEvent().length > 0) {
            for (let data of returningItemsInInventoryAfterEndingEvent()) {
                if (itemsPerCompany()[data.group]) {
                    const newQty = `${Number(itemsPerCompany()[data.group].at(-1).quantity) + Number(data.quantity)}`
                    await devitrakApi.patch(`/item/edit-item/${itemsPerCompany()[data.group].at(-1)._id}`, { quantity: newQty })
                }
            }
        }
        await sqlDeviceFinalStatusAtEventFinished()
        await sqlDeviceReturnedToCompanyStock()
        await addingRecordOfActivityInEvent()
        return await inactiveEventAfterEndIt()

    }
    return (
        <>
            {contextHolder}
            <Grid
                display={"flex"}
                justifyContent={"space-around"}
                alignSelf={"stretch"}
                alignItems={"center"}
                container
            >
                <Grid
                    display={"flex"}
                    justifyContent={"left"}
                    alignItems={"center"}
                    textAlign={"left"}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                >
                    <Popconfirm title="Are you sure? This action can not be reversed." onConfirm={() => updatingItemInDB()}>
                        <Button
                            style={{ ...BlueButton, width: "100%" }}
                        >
                            <Typography
                                textTransform={"none"}
                                style={BlueButtonText}
                            >
                                &nbsp;End event
                            </Typography>
                        </Button>
                    </Popconfirm>
                </Grid>
            </Grid>
        </>
    );
};

export default EndEventButton;