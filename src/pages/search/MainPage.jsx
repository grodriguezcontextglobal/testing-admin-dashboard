import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, List } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from '../../api/devitrakApi'
import Loading from '../../components/animation/Loading'
import CenteringGrid from "../../styles/global/CenteringGrid";
import { onAddCustomerInfo } from "../../store/slices/customerSlice";
import { onAddCustomer, onAddPaymentIntentDetailSelected, onAddPaymentIntentSelected } from "../../store/slices/stripeSlice";
import { onAddDeviceToDisplayInQuickGlance, onOpenDeviceAssignmentModalFromSearchPage } from "../../store/slices/devicesHandleSlice";
import { onAddEventData, onAddQRCodeLink, onSelectCompany, onSelectEvent } from "../../store/slices/eventSlice";
import { onAddSubscription } from "../../store/slices/subscriptionSlice";
const SearchMainPage = () => {
    const searchParams = new URLSearchParams(window.location.search).get(
        "search"
    );
    const { user } = useSelector((state) => state.admin);
    const { eventsPerAdmin } = useSelector((state) => state.event);
    const [resultToDisplay, setResultToDisplay] = useState([])
    const [loadingStatus, setLoadingStatus] = useState(true)
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const deviceInUseRef = useRef([])
    const consumerUseRef = useRef([])

    const renderEventsPerAdmin = useCallback(() => {
        const result = new Set();

        if (eventsPerAdmin.active) {
            for (let data of eventsPerAdmin.active) {
                result.add(data.eventInfoDetail.eventName);
            }
        }

        if (eventsPerAdmin.completed) {
            for (let data of eventsPerAdmin.completed) {
                result.add(data.eventInfoDetail.eventName);
            }
        }
        return Array.from(result);
    }, []); // eslint-disable-next-line no-use-before-define

    renderEventsPerAdmin();

    const transactionsListQuery = useQuery({
        queryKey: ["transactionsList"],
        queryFn: () => devitrakApi.post("/transaction/transaction", { 'paymentIntent': searchParams }),
        // refetchOnMount: false,
        // cacheTime: 1000 * 60 * 2
    });
        console.log("🚀 ~ SearchMainPage ~ transactionsListQuery:", transactionsListQuery?.data?.data)

    const deviceInPoolQuery = useQuery({
        queryKey: ["deviceInPool"],
        queryFn: () => devitrakApi.post("/receiver/receiver-pool-list", { 'device': searchParams }),
        // refetchOnMount: false,
        // cacheTime: 1000 * 60 * 2
    });

    const handleConsumerInfo = (props) => {
        let userFormatData = {
            uid: props?.id,
            name: props?.name,
            lastName: props?.lastName,
            email: props?.email,
            phoneNumber: props?.phoneNumber,
            data: props
        };
        dispatch(onAddCustomerInfo(userFormatData));
        dispatch(onAddCustomer(userFormatData));
        navigate(`/consumers/${props.uid}`);

    }
    const mergeAssignedAndPoolInfo = async (props) => {
        const eventRef = await devitrakApi.post("/event/event-list", {
            company: props.provider[0],
            'eventInfoDetail.eventName': props.eventSelected[0]
        })
        const poolData = await deviceInPoolQuery?.data?.data?.receiversInventory
        let infoFoundToReturn = {}
        for (let data of poolData) {
            if (props.eventSelected[0] === data.eventSelected) {
                infoFoundToReturn = {
                    company: [data.type, data.provider],
                    activity: `${String(data.status).toLowerCase() === "lost" ? "LOST" : data.activity}`,
                    status: data.status,
                    serialNumber: data.device,
                    user: data.activity,
                    entireData: data,
                }
            }
        }

        dispatch(onAddDeviceToDisplayInQuickGlance(infoFoundToReturn));
        dispatch(onSelectEvent(eventRef.data.list[0].eventInfoDetail.eventName));
        dispatch(onSelectCompany(eventRef.data.list[0].company));
        dispatch(onAddEventData(eventRef.data.list[0]));
        dispatch(onAddSubscription(eventRef.data.list[0].subscription));
        dispatch(
            onAddQRCodeLink(
                eventRef.data.list[0].qrCodeLink ??
                `https://app.devitrak.net/?event=${encodeURI(
                    eventRef.data.list[0].eventInfoDetail.eventName
                )}&company=${encodeURI(eventRef.data.list[0].company)}`
            )
        );
        navigate('/device-quick-glance')

    }

    const resetPreviousResult = () => {
        setLoadingStatus(true)
        consumerUseRef.current = []
        deviceInUseRef.current = []
        setLoadingStatus(false)
    }
    //search payment intent
    const findingDataInTransactionDB = () => {
        const consumerInfo = transactionsListQuery?.data?.data?.list
        if (consumerInfo) {
            return consumerInfo[0]
        }
    }
    findingDataInTransactionDB()
    
    const transactionSearchActionTakenToRedirectStaffTosSearchValue = async () => {
        setLoadingStatus(true)
        if (findingDataInTransactionDB()) {
            let userProfile = {
                ...findingDataInTransactionDB().consumerInfo,
                uid: findingDataInTransactionDB().consumerInfo.uid ?? findingDataInTransactionDB().consumerInfo.id,
            };
            const paymentIntentDetailSelectedProfile = {
                ...findingDataInTransactionDB(),
                user: userProfile,
                device: findingDataInTransactionDB().device[0].deviceNeeded
            };
            dispatch(
                onOpenDeviceAssignmentModalFromSearchPage(true)
            );
            dispatch(
                onAddPaymentIntentDetailSelected(paymentIntentDetailSelectedProfile)
            );
            dispatch(onSelectEvent(paymentIntentDetailSelectedProfile.eventSelected));
            dispatch(onSelectCompany(paymentIntentDetailSelectedProfile.provider));
            dispatch(onAddCustomer(userProfile));
            dispatch(onAddCustomerInfo(userProfile));
            dispatch(onAddPaymentIntentSelected(paymentIntentDetailSelectedProfile.paymentIntent));
            setTimeout(() => {
                setLoadingStatus(false)
                return navigate(`/events/event-attendees/${userProfile.uid}/transactions-details`);
            }, 3500);

        }
    }
    //search device
    const searchDevice = async () => {
        resetPreviousResult()
        const result = new Set()
        for (let data of renderEventsPerAdmin()) {
            const check = await devitrakApi.post('/receiver/receiver-assigned-list', {
                eventSelected: data,
                provider: user.company,
                'device.serialNumber': searchParams
            })
            if (check.data.ok) {
                for (let data of check.data.listOfReceivers) {
                    result.add(data)
                }
            }
        }
        const final = new Set()
        for (let data of Array.from(result)) {
            final.add(data)
        }
        deviceInUseRef.current = Array.from(final)
        return setResultToDisplay([...consumerUseRef.current, ...deviceInUseRef.current])
    }

    //search consumer
    const searchCustomer = async () => {
        resetPreviousResult()
        const result = new Set()
        for (let data of renderEventsPerAdmin()) {
            const check = await devitrakApi.post('/auth/user-query', {
                eventSelected: data,
                provider: user.company,
            })
            if (check.data.ok) {
                for (let data of check.data.users) {
                    const jsonToString = JSON.stringify(data)
                    if (jsonToString.includes(searchParams)) {
                        if (!result.has(jsonToString)) {
                            result.add(jsonToString)
                        }
                    }
                }
            }
        }
        const res = new Set()
        for (let data of Array.from(result)) {
            const parsingString = JSON.parse(data)
            res.add(parsingString)
        }
        consumerUseRef.current = Array.from(res)
        return setResultToDisplay([...consumerUseRef.current, ...deviceInUseRef.current])
    }

    const triggerSearchingResult = useCallback(() => {
        setLoadingStatus(true)
        setTimeout(() => {
            const reference = /^[0-9]+$/;
            if (searchParams?.length > 0) {
                const check = searchParams.slice(0, 3)
                if (reference.test(searchParams)) {
                    setLoadingStatus(false)
                    return searchDevice()
                }
                if (check === "pi_") {
                    return transactionSearchActionTakenToRedirectStaffTosSearchValue()
                } else {
                    setLoadingStatus(false)
                    return searchCustomer()
                }
            }
            return setLoadingStatus(false)
        }, 3000)

        setLoadingStatus(false)

    }, [searchParams]) //eslint-disable-next-line

    useEffect(() => {
        const controller = new AbortController()
        triggerSearchingResult()
        return () => {
            controller.abort()
        }
    }, [searchParams]) //eslint-disable-next-line
    console.log("🚀 ~ SearchMainPage ~ searchParams:", searchParams)


    return (
        <>

            {transactionsListQuery.isLoading && deviceInPoolQuery.isLoading && <div style={CenteringGrid}><Loading /></div>}
            <Grid
                display={`${transactionsListQuery.isLoading && deviceInPoolQuery.isLoading ? "none" : "flex" || loadingStatus && "none"}`}
                justifyContent={"center"}
                alignItems={"center"}
                margin={'12dvh auto 1dvh'}
                container
            >
                <Grid margin={'auto'} display={'flex'} justifyContent={'space-between'} alignItems={'center'} item xs={12} sm={12} md={12} lg={12}>
                    <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} item xs={12} sm={12} md={12} lg={12}>
                        <Typography
                            textTransform={'capitalize'}
                            fontFamily={"Inter"}
                            fontSize={"14px"}
                            fontStyle={"normal"}
                            fontWeight={500}
                            lineHeight={"20px"}
                            color="var(--gray-600, #475467)"
                        >
                            Search parameter: {searchParams}
                        </Typography>
                    </Grid>
                    <Grid display={'flex'} justifyContent={'flex-end'} alignItems={'center'} item xs={12} sm={12} md={12} lg={12}>
                        <Typography
                            textTransform={'none'}
                            fontFamily={"Inter"}
                            fontSize={"14px"}
                            fontStyle={"normal"}
                            fontWeight={500}
                            lineHeight={"20px"}
                            color="var(--gray-600, #475467)"
                        >
                            results found:  {resultToDisplay.length}
                        </Typography>
                    </Grid>
                </Grid>
                {loadingStatus && <div style={CenteringGrid}><Loading /></div>}
                {resultToDisplay.length > 0 ?
                    <Grid
                        style={{
                            wordWrap: "break-word",
                        }}
                        boxSizing={"border-box"}
                        padding={"8px 12px"}
                        lineHeight={"1.57"}
                        position={"relative"}
                        item
                        xs={12} sm={12} md={12} lg={12}
                    >{consumerUseRef.current.length > 0 &&
                        <List
                            dataSource={resultToDisplay}
                            renderItem={(item) => (
                                <List.Item key={item.id} style={{
                                    display: "flex", justifyContent: "flex-start", alignItems: "center", width: "100%", border: "solid 1px var(--blue-dark-600, #e6f4ff)", background: "var(--blue-dark-600, #e6f4ff)", margin: "0 auto 0.3rem", padding: "25px", borderRadius: "12px"
                                }}>
                                    <List.Item.Meta
                                        title={
                                            <Typography
                                                textTransform={'capitalize'}
                                                fontFamily={"Inter"}
                                                fontSize={"14px"}
                                                fontStyle={"normal"}
                                                fontWeight={500}
                                                lineHeight={"20px"}
                                                color="var(--gray-600, #475467)"
                                            >
                                                {item.name} {item.lastName}
                                            </Typography>}
                                        description={<Typography
                                            fontFamily={"Inter"}
                                            fontSize={"14px"}
                                            fontStyle={"normal"}
                                            fontWeight={500}
                                            lineHeight={"20px"}
                                            color="var(--gray-600, #475467)"
                                        >
                                            {item.email}
                                        </Typography>}
                                    />
                                    <div>
                                        <Button style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }} onClick={() => handleConsumerInfo(item)}>
                                            <Typography
                                                fontFamily={"Inter"}
                                                fontSize={"14px"}
                                                fontStyle={"normal"}
                                                fontWeight={500}
                                                lineHeight={"20px"}
                                                color="var(--gray-600, #475467)"
                                                style={{
                                                    cursor: "pointer"
                                                }}
                                            >Detail</Typography>  </Button></div>
                                </List.Item>
                            )}
                        />
                        }
                        {
                            deviceInUseRef.current.length > 0 &&
                            <List
                                dataSource={resultToDisplay}
                                renderItem={(item) => (
                                    <List.Item key={item.id} style={{
                                        display: "flex", justifyContent: "flex-start", alignItems: "center", width: "100%", border: "solid 1px var(--blue-dark-600, #e6f4ff)", background: "var(--blue-dark-600, #e6f4ff)", margin: "0 auto 0.3rem", padding: "25px", borderRadius: "12px"
                                    }}>
                                        <List.Item.Meta
                                            title={
                                                <Typography
                                                    textTransform={'capitalize'}
                                                    fontFamily={"Inter"}
                                                    fontSize={"14px"}
                                                    fontStyle={"normal"}
                                                    fontWeight={500}
                                                    lineHeight={"20px"}
                                                    color="var(--gray-600, #475467)"
                                                >
                                                    {item.device.serialNumber} - {item.device.deviceType} - {item.eventSelected}
                                                </Typography>}
                                            description={<Typography
                                                fontFamily={"Inter"}
                                                fontSize={"14px"}
                                                fontStyle={"normal"}
                                                fontWeight={500}
                                                lineHeight={"20px"}
                                                color="var(--gray-600, #475467)"
                                            >consumer: {item.user} - {item.paymentIntent}</Typography>}
                                        />
                                        <div>
                                            <Button style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }} onClick={() => mergeAssignedAndPoolInfo(item)}>
                                                <Typography
                                                    fontFamily={"Inter"}
                                                    fontSize={"14px"}
                                                    fontStyle={"normal"}
                                                    fontWeight={500}
                                                    lineHeight={"20px"}
                                                    color="var(--gray-600, #475467)"
                                                    style={{
                                                        cursor: "pointer"
                                                    }}
                                                >Detail</Typography>  </Button></div>
                                    </List.Item>
                                )}
                            />
                        }</Grid> :
                    <Grid
                        display={`${transactionsListQuery.isLoading && deviceInPoolQuery.isLoading ? "none" : "flex" || loadingStatus && "none"}`}
                        border={"solid 1px var(--blue-dark-600, #e6f4ff)"}
                        borderRadius={"8px"}
                        style={{
                            background: "var(--blue-dark-600, #e6f4ff)",
                            wordWrap: "break-word",
                        }}
                        boxSizing={"border-box"}
                        padding={"8px 12px"}
                        lineHeight={"1.57"}
                        position={"relative"}
                        item
                        xs={12} sm={12} md={12} lg={12}
                    >
                        <Empty />
                    </Grid>}
            </Grid>
        </>
    );
};

export default SearchMainPage;