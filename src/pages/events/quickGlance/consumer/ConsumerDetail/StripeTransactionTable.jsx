import { SearchOutlined } from "@ant-design/icons";
import { Grid, Link, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Button,
    Input,
    Popconfirm,
    Space,
    Table,
    Tooltip,
    notification
} from "antd";
import _ from "lodash";
import pkg from 'prop-types';
import { useEffect, useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
    onReceiverObjectToReplace,
    onTriggerModalToReplaceReceiver,
} from "../../../../../store/slices/helperSlice";
import {
    onAddDevicesAssignedInPaymentIntent,
    onAddPaymentIntentDetailSelected,
    onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import '../../../../../styles/global/ant-table.css';
import Choice from "../lostFee/Choice";
import AddingDevicesToPaymentIntent from "./AssigningDevice/AddingDevicesToPaymentIntent";
import ModalAddingDeviceFromSearchbar from "./AssigningDevice/components/ModalAddingDeviceFromSearchbar";
import { ReplaceDevice } from "./actions/ReplaceDevice";
import ReturningInBulkMethod from "./actions/ReturningInBulkMethod";
import Capturing from "./actions/deposit/Capturing";
import Releasing from "./actions/deposit/Releasing";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../../../styles/global/Subtitle";
const { PropTypes } = pkg;

const StripeTransactionTable = ({ searchValue }) => {
    const [searchText, setSearchText] = useState("");
    const [searchedColumn, setSearchedColumn] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [openCapturingDepositModal, setOpenCapturingDepositModal] =
        useState(false);
    const [openCancelingDepositModal, setOpenCancelingDepositModal] =
        useState(false);
    const [openReturnDeviceInBulkModal, setOpenReturnDeviceInBulkModal] = useState(false)
    const recordRef = useRef(null)
    const searchInput = useRef(null);
    const { event } = useSelector((state) => state.event);
    const { customer } =
        useSelector((state) => state.stripe);
    const { user } = useSelector((state) => state.admin);
    const { triggerModal } = useSelector(
        (state) => state.helper
    );
    const { openModalToAssignDevice } = useSelector(
        (state) => state.devicesHandle
    );
    const dispatch = useDispatch();
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, message) => {
        api.open({
            message: `${type === "success" ? type : ""}`,
            description: `${message}`,
            placement: "bottomRight",
        });
    };
    const queryClient = useQueryClient();
    const transactionsQuery = useQuery({
        queryKey: ['transactionPerConsumerListQuery'],
        queryFn: () => devitrakApi.post('/transaction/transaction', { eventSelected: event.eventInfoDetail.eventName, provider: event.company, 'consumerInfo.email': customer.email }),
        enabled: false,
        refetchOnMount: false,
        notifyOnChangeProps: ['data', 'dataUpdatedAt'],
    })
    const stripeTransactionsSavedQuery = transactionsQuery?.data?.data?.list
    const deviceAssignedListQuery = useQuery({
        queryKey: ['assginedDeviceList'],
        queryFn: () => devitrakApi.post('/receiver/receiver-assigned-list', {
            "user": customer.email,
            'provider': event.company,
            "eventSelected": event.eventInfoDetail.eventName
        }),
        enabled: false,
        refetchOnMount: false,
        notifyOnChangeProps: ['data', 'dataUpdatedAt'],
        cacheTime: 1000 * 60 * 3
    })
    useEffect(() => {
        const controller = new AbortController()
        transactionsQuery.refetch()
        deviceAssignedListQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [])

    const refetchingFn = () => {
        return deviceAssignedListQuery.refetch()
    }
    const refetchingTransactionFn = () => {
        return transactionsQuery.refetch()
    }

    const foundAllTransactionsAndDevicesAssigned = () => {
        const assignedDevices = deviceAssignedListQuery?.data?.data?.listOfReceivers
        if (assignedDevices?.length > 0) {
            const groupByPaymentIntent = _.groupBy(assignedDevices, 'paymentIntent')
            if (groupByPaymentIntent) return groupByPaymentIntent
            return []
        }
        return []
    };
    const filterDataBasedOnUserAndEvent = () => {
        if (stripeTransactionsSavedQuery) {
            const groupByPaymentIntent = _.groupBy(stripeTransactionsSavedQuery, 'consumerInfo.email')
            if (groupByPaymentIntent[customer.email]) {
                if (searchValue?.length < 1) {

                    return groupByPaymentIntent[customer.email].filter(element => String(element.paymentIntent).includes(searchValue))
                }
            }
            else {
                return []
            }
        }
        return []
    };

    const sourceData = () => {
        const result = new Set();
        if (filterDataBasedOnUserAndEvent().length > 0) {
            for (let data of filterDataBasedOnUserAndEvent()) {
                result.add({
                    key: data.id,
                    ...data,
                });
            }
            return Array.from(result);
        }
        return []
    };

    const handleRecord = (record) => {
        dispatch(onAddPaymentIntentSelected(record.paymentIntent));
        dispatch(onAddPaymentIntentDetailSelected({ ...record }));
    };
    const handleReturnDeviceInBulk = (record) => {
        setOpenReturnDeviceInBulkModal(true);
        return recordRef.current = record
    }
    //*nested table starts here
    const renderDataPerRow = (rowRecord) => {
        const foundTransactionAndDevicesAssigned = () => {
            if (foundAllTransactionsAndDevicesAssigned()) {
                const paymentIntentInRecord = foundAllTransactionsAndDevicesAssigned()[rowRecord.paymentIntent]
                if (paymentIntentInRecord) {
                    return paymentIntentInRecord
                }
            }
            return []
        }
        const handleSearch = (selectedKeys, confirm, dataIndex) => {
            confirm();
            setSearchText(selectedKeys[0]);
            setSearchedColumn(dataIndex);
        };
        const handleReset = (clearFilters) => {
            clearFilters();
            setSearchText("");
        };

        const getColumnSearchProps = (dataIndex) => ({
            filterDropdown: ({
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
                close,
            }) => (
                <div
                    key={dataIndex}
                    style={{
                        padding: 8,
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <Input
                        ref={searchInput}
                        placeholder={`Search ${dataIndex}`}
                        value={selectedKeys[0]}
                        onChange={(e) =>
                            setSelectedKeys(e.target.value ? [e.target.value] : [])
                        }
                        onPressEnter={() =>
                            handleSearch(selectedKeys, confirm, dataIndex)
                        }
                        style={{
                            marginBottom: 8,
                            display: "block",
                        }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{
                                width: 90,
                            }}
                        >
                            Search
                        </Button>
                        <Button
                            onClick={() => clearFilters && handleReset(clearFilters)}
                            size="small"
                            style={{
                                width: 90,
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                confirm({
                                    closeDropdown: false,
                                });
                                setSearchText(selectedKeys[0]);
                                setSearchedColumn(dataIndex);
                            }}
                        >
                            Filter
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                close();
                            }}
                        >
                            close
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => (
                <SearchOutlined
                    style={{
                        color: filtered ? "#1677ff" : undefined,
                    }}
                />
            ),
            onFilter: (value, record) =>
                record[dataIndex]
                    .toString()
                    .toLowerCase()
                    .includes(value.toLowerCase()),
            onFilterDropdownOpenChange: (visible) => {
                if (visible) {
                    setTimeout(() => searchInput.current?.select(), 100);

                }
            },
            render: (text) =>
                searchedColumn === dataIndex ? (
                    <Highlighter
                        highlightStyle={{
                            backgroundColor: "#ffc069",
                            padding: 0,
                        }}
                        searchWords={[searchText]}
                        autoEscape
                        textToHighlight={text ? text.toString() : ""}
                    />
                ) : (
                    text
                ),
        });
        const checkDevicesInTransaction = () => {
            const result = new Set()
            if (foundTransactionAndDevicesAssigned()) {
                for (let data of foundTransactionAndDevicesAssigned()) {
                    result.add({ ...data.device })
                }
            }
            return Array.from(result);
        };
        const handleReturnSingleDevice = async (props) => {
            try {
                const deviceInPoolListQuery = await devitrakApi.post('/receiver/receiver-pool-list', {
                    "eventSelected": event.eventInfoDetail.eventName,
                    "provider": event.company,
                    "device": props.serialNumber,
                    "type": props.deviceType
                })
                let returnedItem = {
                    ...props,
                    status: false,
                };
                const assignedDeviceData = _.groupBy(foundTransactionAndDevicesAssigned(), "device.serialNumber")
                const respUpdate = await devitrakApi.patch(`/receiver/receiver-update/${assignedDeviceData[props.serialNumber].at(-1).id}`, {
                    id: assignedDeviceData[props.serialNumber].at(-1).id,
                    device: returnedItem,
                })
                if (respUpdate.data) {
                    if (deviceInPoolListQuery.data.receiversInventory.length > 0) {
                        const dateString = new Date().toString()
                        const dateRef = dateString.split(' ')
                        const checkInPool = deviceInPoolListQuery.data.receiversInventory.at(-1)
                        queryClient.invalidateQueries('assignedDeviceListQuery', { exact: true });
                        deviceAssignedListQuery.refetch()
                        const deviceInPoolProfile = {
                            id: checkInPool.id,
                            activity: "No",
                        };
                        await devitrakApi.patch(
                            `/receiver/receivers-pool-update/${deviceInPoolProfile.id}`,
                            deviceInPoolProfile
                        )
                        await devitrakApi.post("/nodemailer/confirm-returned-device-notification", {
                            consumer: {
                                name: `${customer.name} ${customer.lastName}`,
                                email: customer.email,
                            },
                            device: {
                                serialNumber: returnedItem.serialNumber,
                                deviceType: returnedItem.deviceType,
                            },
                            event: event.eventInfoDetail.eventName,
                            company: event.company,
                            transaction: rowRecord.paymentIntent,
                            date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
                            time: dateRef[4],
                            link: `https://app.devitrak.net/authentication/${encodeURI(
                                event.eventInfoDetail.eventName
                            )}/${encodeURI(event.company)}/${customer.uid}`
                        });
                        openNotificationWithIcon("success", "Device returned");
                    }
                }
            } catch (error) {
                console.log(
                    "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
                    error
                );
                openNotificationWithIcon(
                    "error",
                    "Something went wrong, please try later!"
                );
            }
        };

        const handleAssignSingleDevice = async (props) => {
            try {
                const deviceInPoolListQuery = await devitrakApi.post('/receiver/receiver-pool-list', {
                    "eventSelected": event.eventInfoDetail.eventName,
                    "provider": event.company,
                    "device": props.serialNumber,
                    "type": props.deviceType
                })

                let assignedItem = {
                    ...props,
                    status: true,
                };
                const findData = _.groupBy(foundTransactionAndDevicesAssigned(), 'device.serialNumber')
                const respUpdate = await devitrakApi.patch(`/receiver/receiver-update/${findData[props.serialNumber].at(-1).id}`, {
                    id: findData[props.serialNumber].at(-1).id,
                    device: assignedItem,
                })
                if (respUpdate.data.ok) {
                    if (deviceInPoolListQuery.data.receiversInventory.length > 0) {
                        const dateString = new Date().toString()
                        const dateRef = dateString.split(' ')
                        const devicePoolData = deviceInPoolListQuery.data.receiversInventory.at(-1)
                        queryClient.invalidateQueries('assignedDeviceListQuery', { exact: true });
                        deviceAssignedListQuery.refetch()
                        const deviceInPoolProfile = {
                            ...devicePoolData,
                            activity: "YES",
                        };
                        await devitrakApi.patch(
                            `/receiver/receivers-pool-update/${devicePoolData.id}`,
                            deviceInPoolProfile
                        )
                        await devitrakApi.post("/nodemailer/assignig-device-notification", {
                            consumer: {
                                name: `${customer.name} ${customer.lastName}`,
                                email: customer.email,
                            },
                            device: {
                                serialNumber: assignedItem.serialNumber,
                                deviceType: assignedItem.deviceType,
                            },
                            event: event.eventInfoDetail.eventName,
                            company: event.company,
                            transaction: rowRecord.paymentIntent,
                            date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
                            time: dateRef[4],
                            link: `https://app.devitrak.net/authentication/${encodeURI(
                                event.eventInfoDetail.eventName
                            )}/${encodeURI(event.company)}/${customer.uid}`
                        });
                        openNotificationWithIcon("success", "Device assigned");
                    }
                }
            } catch (error) {
                console.log(
                    "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
                    error
                );
                openNotificationWithIcon(
                    "error",
                    "Something went wrong, please try later!"
                );
            }
        };
        const handleLostSingleDevice = (props) => {
            try {
                const findData = _.groupBy(foundTransactionAndDevicesAssigned(), 'device.serialNumber')
                setOpenModal(true);
                dispatch(onReceiverObjectToReplace(props));
                dispatch(
                    onAddDevicesAssignedInPaymentIntent(
                        findData[props.serialNumber]
                    )
                );
                handleRecord(props)
            } catch (error) {
                console.log(
                    "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
                    error
                );
                openNotificationWithIcon(
                    "error",
                    "Something went wrong, please try later!"
                );
            }
        };

        const columns = [
            {
                title: "Device serial number",
                dataIndex: "serialNumber",
                key: "serialNumber",
                ...getColumnSearchProps("serialNumber"),
                sorter: {
                    compare: (a, b) =>
                        ("" + a.serialNumber).localeCompare(b.serialNumber),
                },
                sortDirections: ["descend", "ascend"],
                width: "30%",
            },
            {
                title: "Type",
                dataIndex: "deviceType",
                key: "deviceType",
                width: "20%",
                responsive: ['lg'],
                sorter: {
                    compare: (a, b) => ("" + a.deviceType).localeCompare(b.deviceType),
                },
                sortDirections: ["descend", "ascend"],
                render: (deviceType) => (
                    <span>
                        <Typography textTransform={"capitalize"}
                            textAlign={"left"}
                            fontWeight={400}
                            fontSize={"14px"}
                            fontFamily={"Inter"}
                            lineHeight={"24px"}
                            color={""}
                        >{deviceType}
                        </Typography>
                    </span>)
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
                sorter: {
                    compare: (a, b) => ("" + a.status).localeCompare(b.status),
                },
                sortDirections: ["descend", "ascend"],
                render: (status) => (
                    <span style={{
                        width: "fit-content",
                        padding: "5px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: '#ECFDF3',
                        color: '#027A48',
                    }}>
                        <Typography
                            textTransform={"none"}
                            textAlign={"left"}
                            fontWeight={400}
                            fontSize={"14px"}
                            fontFamily={"Inter"}
                            lineHeight={"24px"}
                        >
                            {typeof status === "string"
                                ? status
                                : status
                                    ? "In-use"
                                    : "Returned"}
                        </Typography>
                    </span>
                ),
            },
            {
                title: "Action",
                dataIndex: "action",
                key: "action",
                width: "10%",
                render: (_, record) => (
                    <Space size="middle">
                        {record.status === "Lost" || record.status === false ? (
                            <Link
                                component="button"
                                underline="none"
                                disabled={String(record.status).toLowerCase() === "lost"}
                                style={{
                                    width: "fit-content",
                                    border: "1px solid var(--blue-dark-600, #155EEF)",
                                    borderRadius: "8px",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                    padding: "5px",
                                }}
                            >
                                <Typography
                                    textTransform={"none"}
                                    textAlign={"left"}
                                    fontWeight={400}
                                    fontSize={"16px"}
                                    fontFamily={"Inter"}
                                    lineHeight={"24px"}
                                    color={"var(--blue-dark-600, #155EEF)"}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleAssignSingleDevice(record)}
                                >
                                    Assign
                                </Typography>
                            </Link>
                        ) : (
                            <Link
                                disabled={!event.active}
                                component="button"
                                underline="none"
                                style={{
                                    width: "fit-content",
                                    border: "1px solid var(--error-700, #B42318)",
                                    borderRadius: "8px",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                    padding: "5px",
                                    color: "#B42318",
                                }}
                            >
                                <Typography
                                    textTransform={"none"}
                                    textAlign={"left"}
                                    fontWeight={400}
                                    fontSize={"16px"}
                                    fontFamily={"Inter"}
                                    lineHeight={"24px"}
                                    color={"var(--error-700, #B42318)"}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleReturnSingleDevice(record)}
                                >
                                    Return
                                </Typography>
                            </Link>
                        )}
                        {record.status === true && (
                            <Link
                                disabled={!event.active}
                                component="button"
                                underline="none"
                                style={{
                                    width: "fit-content",
                                    border: "1px solid var(--blue-dark-600, #155EEF)",
                                    borderRadius: "8px",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                    padding: "5px",
                                }}
                            >
                                <Typography
                                    textTransform={"none"}
                                    textAlign={"left"}
                                    fontWeight={400}
                                    fontSize={"16px"}
                                    fontFamily={"Inter"}
                                    lineHeight={"24px"}
                                    color={""}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        dispatch(onTriggerModalToReplaceReceiver(true));
                                        dispatch(onReceiverObjectToReplace(record));
                                        handleRecord(rowRecord)
                                    }}
                                >
                                    Replace
                                </Typography>
                            </Link>
                        )}
                        {record.status === true && event.staff.adminUser.some(element => element.email === user.email) && (
                            <Popconfirm
                                title="Are you sure it is lost?"
                                onConfirm={() => handleLostSingleDevice(record)}
                            >
                                <Link
                                    disabled={!event.active}
                                    component="button"
                                    underline="none"
                                    style={{
                                        width: "fit-content",
                                        border: "1px solid var(--blue-dark-600, #155EEF)",
                                        borderRadius: "8px",
                                        boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                        padding: "5px",
                                    }}
                                >
                                    <Typography
                                        textTransform={"none"}
                                        textAlign={"left"}
                                        fontWeight={400}
                                        fontSize={"16px"}
                                        fontFamily={"Inter"}
                                        lineHeight={"24px"}
                                        color={""}
                                        style={{ cursor: "pointer" }}
                                    >
                                        Lost
                                    </Typography>
                                </Link>
                            </Popconfirm>
                        )}
                    </Space>
                ),
            },
        ];
        return (
            <>
                <div style={{ display: `${checkDevicesInTransaction().length >= rowRecord.device[0].deviceNeeded && "none"}` }}>
                    {checkDevicesInTransaction().length !== rowRecord.device[0].deviceNeeded && <AddingDevicesToPaymentIntent refetchingFn={refetchingFn} record={rowRecord} />}
                </div>
                {checkDevicesInTransaction()?.length > 0 && (
                    <Table
                        columns={columns}
                        dataSource={checkDevicesInTransaction()}
                        pagination={{
                            position: ["bottomLeft"],
                        }}
                    />
                )}
            </>
        );
    };
    //!nested table ends

    const columns = [
        {
            title: `Date and time`,
            dataIndex: "paymentIntent",
            key: "paymentIntent",
            responsive: ["md", "lg"],
            render: (_, record) => (<span style={Subtitle}>{new Date(`${record.date}`).toUTCString()}</span>)
        },
        {
            title: "Transaction ID",
            dataIndex: "paymentIntent",
            key: "paymentIntent",
            render: (paymentIntent) => (<span style={Subtitle}>{paymentIntent}</span>)
        },
        {
            title: "Status",
            dataIndex: "device",
            key: "device",
            responsive: ["lg"],
            render: (_, record) => (
                <span style={Subtitle}> <Typography style={Subtitle}>{record.device[0].deviceNeeded} {record.device[0].deviceNeeded > 1 ? "devices" : "device"}</Typography></span>
            )
        },
        {
            title: "",
            dataIndex: "action",
            key: "action",
            width: "fit-content",
            align: "right",
            fixed: "right",
            render: (_, record) => (
                <Grid
                    container spacing={1}>
                    <Grid item xs={12} sm={12} md={4} display={'flex'} alignItems={'center'}>{record.paymentIntent?.length > 16 && <Popconfirm
                        title="Releasing deposit? This action can not be reversed."
                        onConfirm={() => {
                            setOpenCancelingDepositModal(true);
                            handleRecord(record);
                        }}
                    >
                        <Button
                            underline="none"
                            disabled={!record.active}
                            style={{
                                ...CenteringGrid,
                                width: "100%",
                                border: `${!record.active ? "1px solid var(--blue-dark-600, #ffbbb6)" : "1px solid var(--blue-dark-600, #B42318)"}`,
                                borderRadius: "8px",
                                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                padding: "5px",
                                background: `${!record.active ? "#ffbbb6" : "#B42318"}`
                            }}
                        >
                            <Typography
                                textTransform={"none"}
                                style={{ ...BlueButtonText, cursor: "pointer", color: "#fff" }}
                            >
                                Release
                            </Typography>
                        </Button>
                    </Popconfirm>}</Grid>
                    <Grid item xs={12} sm={12} md={4} display={'flex'} alignItems={'center'}>
                        {record.paymentIntent?.length > 16 &&
                            <Popconfirm
                                title="Capturing deposit? This action can not be reversed."
                                onConfirm={() => {
                                    setOpenCapturingDepositModal(true);
                                    handleRecord(record);
                                }}
                            >
                                <Button
                                    underline="none"
                                    disabled={!record.active}
                                    style={{
                                        ...CenteringGrid,
                                        width: "100%",
                                        border: `${!record.active ? "1px solid var(--blue-dark-600, #ffbbb6)" : "1px solid var(--blue-dark-600, #B42318)"}`,
                                        borderRadius: "8px",
                                        boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                        padding: "5px",
                                        background: `${!record.active ? "#ffbbb6" : "#B42318"}`
                                    }}
                                >
                                    <Typography
                                        textTransform={"none"}
                                        style={{ ...BlueButtonText, cursor: "pointer", color: "#fff" }}
                                    >
                                        Capture
                                    </Typography>
                                </Button>
                            </Popconfirm>}</Grid>
                    <Grid item xs={12} sm={12} md={4} display={'flex'} alignItems={'center'}>
                        {record.device[0].deviceNeeded > 4 && <Tooltip title="This option is to return bulk of devices">
                        <Button
                            onClick={() => handleReturnDeviceInBulk(record)}
                            underline="none"
                            style={{
                                ...CenteringGrid,
                                width: "100%",
                                border: `${!record.active ? "1px solid var(--blue-dark-600, #ffbbb6)" : "1px solid var(--blue-dark-600, #B42318)"}`,
                                borderRadius: "8px",
                                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                padding: "5px",
                                background: `${!record.active ? "#ffbbb6" : "#B42318"}`
                            }}
                        >
                            <Typography
                                textTransform={"none"}
                                style={{ ...BlueButtonText, cursor: "pointer", color: "#fff" }}
                            >
                                Bulk
                            </Typography>
                        </Button>
                    </Tooltip>}
                    </Grid>
                </Grid>
            ),
        },
    ];
    return (
        <>
            {contextHolder}
            <Table
                columns={columns}
                dataSource={sourceData()}
                className="table-ant-customized"
                pagination={{
                    position: ["bottomCenter"],
                }}
                style={{ cursor: "pointer" }}
                expandable={{
                    expandRowByClick: true,
                    expandedRowRender: (record) => (
                        renderDataPerRow(record))
                }}
            />
            {openModal && (
                <Choice
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                />
            )}
            {openCapturingDepositModal && (
                <Capturing
                    openCapturingDepositModal={openCapturingDepositModal}
                    setOpenCapturingDepositModal={setOpenCapturingDepositModal}
                    refetchingTransactionFn={refetchingTransactionFn}
                />
            )}
            {openCancelingDepositModal && (
                <Releasing
                    openCancelingDepositModal={openCancelingDepositModal}
                    setOpenCancelingDepositModal={setOpenCancelingDepositModal}
                    refetchingTransactionFn={refetchingTransactionFn}
                />
            )}
            {openReturnDeviceInBulkModal && <ReturningInBulkMethod openReturnDeviceBulkModal={openReturnDeviceInBulkModal} setOpenReturnDeviceInBulkModal={setOpenReturnDeviceInBulkModal} record={recordRef.current} refetching={refetchingFn} />}
            {triggerModal && <ReplaceDevice refetching={refetchingFn} />}
            {openModalToAssignDevice && <ModalAddingDeviceFromSearchbar />}
        </>
    );
};
export default StripeTransactionTable;
StripeTransactionTable.propTypes = {
    searchValue: PropTypes.string
}