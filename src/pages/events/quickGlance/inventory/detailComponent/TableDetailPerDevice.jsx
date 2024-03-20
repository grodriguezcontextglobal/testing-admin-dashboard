import { Typography } from "@mui/material";
import { Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { onAddCustomer } from "../../../../../store/slices/stripeSlice";
import { onAddCustomerInfo } from "../../../../../store/slices/customerSlice";
import { devitrakApi } from "../../../../../api/devitrakApi";
import '../../../../../styles/global/ant-table.css'
const TableDetailPerDevice = ({ searching }) => {
    const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
    const { event } = useSelector((state) => state.event);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [assignedDeviceList, setAssignedDeviceList] = useState([])
    const assignedDeviceTracking = useCallback(async () => {
        const respo = await devitrakApi.post('/receiver/receiver-assigned-list', {
            'device.serialNumber': deviceInfoSelected.serialNumber,
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        })
        if (respo.data.ok) {
            const result = [...assignedDeviceList, ...respo.data.listOfReceivers]
            setAssignedDeviceList(result)
        }
    }, [])

    const [defectedDevicesList, setDefectedDevicesList] = useState([])
    const defecedDeviceTracking = useCallback(async () => {
        const respo = await devitrakApi.post('/receiver/list-receiver-returned-issue', {
            'device.serialNumber': deviceInfoSelected.serialNumber,
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        })
        if (respo.data.ok) {
            const result = [...defectedDevicesList, ...respo.data.record]
            setDefectedDevicesList(result)
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        assignedDeviceTracking()
        defecedDeviceTracking()
        return () => {
            controller.abort()
        }
    }, [assignedDeviceList.length, defectedDevicesList.length])

    const sortingAssignedDeviceTrack = useCallback(() => {
        const addingKey = new Set()
        for (let data of assignedDeviceList) {
            addingKey.add({ key: data.id, ...data })
        }
        return Array.from(addingKey).reverse()
    }, [assignedDeviceList.length])

    const finalResult = () => {
        if (!searching || String(searching).length < 1) {
            return [...sortingAssignedDeviceTrack(), ...defectedDevicesList]
        } else {
            const data = [...sortingAssignedDeviceTrack(), ...defectedDevicesList]
            return data.filter(element => String(element.user).toLowerCase().includes(String(searching).toLowerCase()) || String(element.eventSelected[0]).toLowerCase().includes(String(searching).toLowerCase()))
        }
    }

    const handleConsumerNavigation = async (record) => {
        const consumerData = await devitrakApi.post("/auth/users", {
            email: record.user
        })
        if (consumerData.data) {
            const consumer = consumerData.data.users.at(-1)
            let userFormatData = {
                uid: consumer.id ?? consumer.uid,
                name: consumer.name,
                lastName: consumer.lastName,
                email: consumer.email,
                phoneNumber: consumer.phoneNumber,
            };
            dispatch(onAddCustomerInfo(userFormatData));
            dispatch(onAddCustomer(userFormatData));
            await navigate(
                `/events/event-attendees/${userFormatData.uid}/transactions-details`
            );
        }
    };
    const columns = [
        {
            title: "Event",
            dataIndex: "eventSelected",
            align: "left",
            sorter: {
                compare: (a, b) =>
                    ("" + a.eventSelected).localeCompare(b.eventSelected),
            },
            render: (eventSelected) => (
                <span
                    onClick={() => navigate("/events/event-quickglance")}
                    style={{ margin: "auto", cursor: "pointer" }}
                >
                    <Typography
                        textTransform={"none"}
                        fontSize={"14px"}
                        fontFamily={"Inter"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"20px"}
                        color={"var(--blue-dark-600, #155EEF)"}
                    >
                        {eventSelected}
                    </Typography>
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: "33%",
            align: "left",
            responsive: ["md", "lg"],
            sorter: {
                compare: (a, b) => ("" + a.status).localeCompare(b.status),
            },
            render: (status) => (
                <span style={{ margin: "auto" }}>
                    <Typography
                        textTransform={"none"}
                        fontSize={"14px"}
                        fontFamily={"Inter"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"20px"}
                    >
                        {typeof status === "string" ? status : "Operational"}
                    </Typography>
                </span>
            ),
        },
        {
            title: "Consumer",
            dataIndex: "user",
            width: "33%",
            align: "left",
            sorter: {
                compare: (a, b) => ("" + a.user).localeCompare(b.user),
            },
            render: (_, record) => (
                <span
                    onClick={() => handleConsumerNavigation(record)}
                    style={{ margin: "auto", cursor: "pointer" }}
                >
                    <Typography
                        textTransform={"none"}
                        fontSize={"14px"}
                        fontFamily={"Inter"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"20px"}
                        color={"var(--blue-dark-600, #155EEF)"}
                    >
                        {record.user}
                    </Typography>
                </span>
            ),
        },
    ];

    return (
        <Table
            sticky
            size="large"
            columns={columns}
            dataSource={finalResult()}
            pagination={{
                position: ["bottomCenter"],
            }}
            className="table-ant-customized"
        />
    );
};

export default TableDetailPerDevice;