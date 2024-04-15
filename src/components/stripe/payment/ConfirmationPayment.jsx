import { Icon } from "@iconify/react";
import {
    Button,
    Grid,
    InputAdornment,
    OutlinedInput,
    Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, Result } from "antd";
import { useInterval } from "interval-hooks";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../apis/devitrakApi";
import FormatAttendeeDetailInfo from "../../components/admin/Attendees/quickGlancePerAttendee/FormatAttendeeDetailInfo";
import FormatToDisplayDetail from "../../components/admin/Attendees/quickGlancePerAttendee/FormatToDisplayDetail";
import { onAddNewPaymentIntent } from "../../store/slices/stripeSlice";
import "../../style/pages/admin/confirmedPaymentAdmin.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
const ConfirmationPaymentPage = () => {
    const { event } = useSelector((state) => state.event);
    const { deviceSelection, deviceSelectionPaidTransaction } = useSelector(
        (state) => state.devicesHandle
    );
    const { customer } = useSelector((state) => state.stripe);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { register, watch, setValue } = useForm();
    const ref = useRef(false);
    const payment_intent = new URLSearchParams(window.location.search).get(
        "payment_intent"
    );
    const clientSecret = new URLSearchParams(window.location.search).get(
        "payment_intent_client_secret"
    );
    const stripePaymentIntentQuery = useQuery({
        queryKey: ['listOfPaymentIntent'],
        queryFn: () => devitrakApi.get('/stripe-transactions-saved-list', {
            paymentIntent: payment_intent
        })
    })
    const checkDeviceInUseInOtherCustomerInTheSameEventQuery = useQuery({
        queryKey: ["devicesAssignedList"],
        queryFn: () => devitrakApi.post("/receiver/receiver-pool-list", { eventSelected: event.eventInfoDetail.eventName, provider: event.company, paymentIntent: payment_intent }),
    });

    const listOfTransactionsQuery = useQuery({
        queryKey: ["transactionList"],
        queryFn: () => devitrakApi.post("/transaction/transaction", { eventSelected: event.eventInfoDetail.eventName, provider: event.company, paymentIntent: payment_intent }),
    });
    const findingPaymentIntent = () => {
        if (stripePaymentIntentQuery.data) {
            const groupingByCompany = _.groupBy(stripePaymentIntentQuery.data.data.stripeTransactions, 'provider')
            if (groupingByCompany[event.company]) {
                const groupingByEvent = _.groupBy(groupingByCompany[event.company], 'eventSelected')
                const eventData = groupingByEvent[event.eventInfoDetail.eventName]
                if (eventData) {
                    const found = _.groupBy(eventData, 'paymentIntent')
                    return found
                }
                return []
            }
            return []
        }
        return []
    }

    const findingTransaction = () => {
        if (listOfTransactionsQuery.data) {
            const groupingByCompany = _.groupBy(listOfTransactionsQuery.data.data.list, 'provider')
            if (groupingByCompany[event.company]) {
                const groupingByEvent = _.groupBy(groupingByCompany[event.company], 'eventSelected')
                const eventData = groupingByEvent[event.eventInfoDetail.eventName]
                if (eventData) {
                    const found = _.groupBy(eventData, 'paymentIntent')
                    return found
                }
                return []
            }
            return []
        }
        return []
    }

    const createFormatForDevicesToBeStoredInTransactionDocument = () => {
        const finalFormat = new Set()
        const countingPerDeviceGroup = {}
        for (let data of deviceSelectionPaidTransaction) {
            if (!countingPerDeviceGroup[data.group]) {
                countingPerDeviceGroup[data.group] = {
                    deviceNeeded: 1,
                    deviceType: data.group,
                    deviceValue: data.value
                }
            } else {
                countingPerDeviceGroup[data.group].deviceNeeded += 1
            }
        }
        for (let [key, value] of Object.entries(countingPerDeviceGroup)) {
            finalFormat.add({ ...value })
        }
        return Array.from(finalFormat)
    }

    const formatToDeviceInAssignedReceiverInDocumentInDB = async () => {
        if (ref.current) {
            for (let data of deviceSelectionPaidTransaction) {
                await devitrakApi.post('/receiver/receiver-assignation', {
                    paymentIntent: payment_intent,
                    device: {
                        serialNumber: data.serialNumber,
                        deviceType: data.group,
                        status: true
                    },
                    active: true,
                    timeStamp: new Date().getTime(),
                    eventSelected: event.eventInfoDetail.eventName,
                    provider: event.company,
                    user: customer.email,
                })
            }
            return ref.current = false
        }
    }

    const checkIfDeviceIsInUsed = () => {
        if (checkDeviceInUseInOtherCustomerInTheSameEventQuery.data) {
            const groupingByCompany = _.groupBy(checkDeviceInUseInOtherCustomerInTheSameEventQuery.data.data.receiversInventory, 'provider')
            if (groupingByCompany[event.company]) {
                const groupingBYEvent = _.groupBy(groupingByCompany[event.company], "eventSelected")
                const eventData = groupingBYEvent[event.eventInfoDetail.eventName]
                if (eventData) return eventData
                return []
            }
            return []
        }
        return []
    }
    checkIfDeviceIsInUsed()
    const createDevicesInPool = useMemo(async () => {
        if (checkIfDeviceIsInUsed().length > 0) {
            const groupingByDevice = _.groupBy(checkIfDeviceIsInUsed(), "device")
            for (let data of deviceSelectionPaidTransaction) {
                if (groupingByDevice[data.serialNumber]) {
                    await devitrakApi.patch(`/receiver/receivers-pool-update/${groupingByDevice[data.serialNumber].at(-1).id}`, { activity: "YES", status: "Operational" })
                }
            }
        }
    }, [payment_intent, checkIfDeviceIsInUsed().length])  /// eslint-disable-line react-hooks/exhaustive-deps

    const saveTransaction = useMemo(async () => {
        const resp = await devitrakApi.post("/stripe/stripe-transaction-admin", {
            paymentIntent: payment_intent,
            clientSecret,
            device: deviceSelection,
            provider: event.company,
            eventSelected: event.eventInfoDetail.eventName,
            user: customer?.uid,
        });
        if (resp) {
            const transactionProfile = {
                paymentIntent: payment_intent,
                clientSecret,
                device: createFormatForDevicesToBeStoredInTransactionDocument(),//*subtract devices group/value/qty needed
                consumerInfo: customer,
                provider: event.company,
                eventSelected: event.eventInfoDetail.eventName,
                date: new Date(),
            };
            await devitrakApi.post("/stripe/save-transaction", transactionProfile);
        }
    }, [payment_intent]); // eslint-disable-line react-hooks/exhaustive-deps

    const confirmPaymentIntent = useCallback(async () => {
        try {
            const response = await devitrakApi.get(
                `/stripe/payment_intents/${payment_intent}`
            );
            if (response) {
                dispatch(onAddNewPaymentIntent(response.data))
                ref.current = true;
            }
        } catch (error) {
            console.log(
                "🚀 ~ file: NoticePaymentTransactionConfirmed.js:54 ~ confirmPaymentIntent ~ error:",
                error
            );
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        confirmPaymentIntent();
        formatToDeviceInAssignedReceiverInDocumentInDB()
    }, [payment_intent, clientSecret]); // eslint-disable-line react-hooks/exhaustive-deps
    const removeDuplicatesStripePaymentIntent = () => {
        const checkingDuplicates = {}
        if (findingPaymentIntent()[payment_intent]?.length > 1) {
            const values = findingPaymentIntent()[payment_intent]
            for (let data of values) {
                if (!checkingDuplicates[data.paymentIntent]) {
                    checkingDuplicates[data.paymentIntent] = data
                } else {
                    devitrakApi.delete(`/stripe/remove-duplicate/${data.id}`);
                }
            }
        }
    };
    const removeDuplicatesTransaction = () => {
        const checkingDuplicates = {}
        if (findingTransaction()[payment_intent]?.length > 1) {
            const values = findingTransaction()[payment_intent]
            for (let data of values) {
                if (!checkingDuplicates[data.paymentIntent]) {
                    checkingDuplicates[data.paymentIntent] = data
                } else {
                    devitrakApi.delete(`/transaction/remove-duplicate-transaction/${data.id}`);
                }
            }
        }
    };

    useInterval(() => {
        removeDuplicatesStripePaymentIntent();
        removeDuplicatesTransaction()
    }, [100]);

    const handleBackAction = () => {
        navigate(`/events/event-attendees/${customer.uid}`);
    };
    return (
        <Grid
            style={{
                padding: "5px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
            }}
            container
        >
            <Grid item xs={10}>
                <Grid
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                    marginTop={5}
                    container
                >
                    <Grid marginY={0} item xs={6}>
                        <Typography
                            textTransform={"none"}
                            style={{
                                color: "var(--gray-900, #101828)",
                                lineHeight: "38px",
                            }}
                            textAlign={"left"}
                            fontWeight={600}
                            fontFamily={"Inter"}
                            fontSize={"30px"}
                        >
                            Events
                        </Typography>
                    </Grid>
                    <Grid
                        textAlign={"right"}
                        display={"flex"}
                        justifyContent={"flex-end"}
                        alignItems={"center"}
                        gap={1}
                        item
                        xs={6}
                    >
                        <Link to="/event/new_subscription">
                            <Button
                                style={{
                                    width: "fit-content",
                                    border: "1px solid var(--blue-dark-600, #155EEF)",
                                    borderRadius: "8px",
                                    background: "var(--blue-dark-600, #155EEF)",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
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
                                        color: "var(--base-white, #FFF",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        fontFamily: "Inter",
                                        lineHeight: "20px",
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
                    marginTop={4}
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
                                textTransform={"none"}
                                textAlign={"left"}
                                fontWeight={600}
                                fontSize={"18px"}
                                fontFamily={"Inter"}
                                lineHeight={"28px"}
                                color={"var(--blue-dark-600, #155EEF)"}
                                onClick={() => handleBackAction()}
                            >
                                All events
                            </Typography>
                            <Typography
                                textTransform={"none"}
                                textAlign={"left"}
                                fontWeight={600}
                                fontSize={"18px"}
                                fontFamily={"Inter"}
                                lineHeight={"28px"}
                                color={"var(--gray-900, #101828)"}
                            >
                                <Icon icon="mingcute:right-line" />
                                {event.eventInfoDetail.eventName}
                            </Typography>
                            <Typography
                                textTransform={"capitalize"}
                                textAlign={"left"}
                                fontWeight={600}
                                fontSize={"18px"}
                                fontFamily={"Inter"}
                                lineHeight={"28px"}
                                color={"var(--gray-900, #101828)"}
                            >
                                <Icon icon="mingcute:right-line" />
                                {customer?.name} {customer?.lastName}
                            </Typography>{" "}
                        </Grid>
                        <Grid
                            paddingTop={1}
                            display={"flex"}
                            justifyContent={"flex-start"}
                            alignItems={"center"}
                            item
                            xs={12}
                        >
                            <Typography
                                textTransform={"none"}
                                textAlign={"left"}
                                fontWeight={400}
                                fontSize={"14px"}
                                fontFamily={"Inter"}
                                lineHeight={"20px"}
                                color={"var(--gray-600, #475467)"}
                            >
                                {event.eventInfoDetail.address}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid textAlign={"right"} item xs={4}></Grid>
                </Grid>
                <Divider />
                <Grid container>
                    <Grid item xs={12}>
                        <FormatAttendeeDetailInfo />
                    </Grid>
                    <Grid item xs={12}>
                        <FormatToDisplayDetail />
                    </Grid>
                </Grid>
                <Divider />{" "}
                <Grid
                    marginY={3}
                    display={"flex"}
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    gap={1}
                    container
                >
                    <Grid textAlign={"right"} item xs></Grid>
                    <Grid justifyContent={"right"} alignItems={"center"} item xs={3}>
                        <OutlinedInput
                            {...register("searchEvent")}
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
                            endAdornment={
                                <InputAdornment position="end">
                                    <Icon
                                        cursor={"pointer"}
                                        icon="ic:baseline-delete-forever"
                                        color="#1e73be"
                                        width="25"
                                        height="25"
                                        opacity={`${watch("searchEvent")?.length > 0 ? 1 : 0}`}
                                        onClick={() => {
                                            setValue("searchEvent", "");
                                        }}
                                    />
                                </InputAdornment>
                            }
                        />
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
                    <Grid
                        border={"1px solid var(--gray-200, #eaecf0)"}
                        borderRadius={"12px 12px 0 0"}
                        display={"flex"}
                        alignItems={"center"}
                        marginBottom={-2}
                        paddingBottom={-2}
                        item
                        xs={12}
                    >
                        <Result
                            status="success"
                            title="Successfully transaction!"
                            subTitle={`Order number: ${payment_intent} Now you can click in return button to return to consumer page.`}
                            extra={[
                                <Button style={{
                                    width: "fit-content",
                                    border: "1px solid var(--blue-dark-600, #155EEF)",
                                    borderRadius: "8px",
                                    background: "var(--blue-dark-600, #155EEF)",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }} onClick={() => navigate("/events/event-attendees")} key="console">
                                    <Typography
                                        textTransform={"none"}
                                        style={{
                                            color: "var(--base-white, #FFF",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            fontFamily: "Inter",
                                            lineHeight: "20px",
                                        }}
                                    >Return to event main page</Typography>
                                </Button>,
                                <Button style={{
                                    width: "fit-content",
                                    border: "1px solid var(--blue-dark-600, #155EEF)",
                                    borderRadius: "8px",
                                    background: "var(--blue-dark-600, #155EEF)",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }} onClick={() => handleBackAction()} key="consumer"><Typography
                                    textTransform={"none"}
                                    style={{
                                        color: "var(--base-white, #FFF",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        fontFamily: "Inter",
                                        lineHeight: "20px",
                                    }}
                                >Return to consumer page</Typography></Button>,
                            ]}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ConfirmationPaymentPage;