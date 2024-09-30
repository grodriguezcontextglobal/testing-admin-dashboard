import { Typography } from "@mui/material";
import { Table } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../../../../../styles/global/ant-table.css';
// import { devitrakApi } from "../../../../../api/devitrakApi";
// import { onAddCustomerInfo } from "../../../../../store/slices/customerSlice";
// import { onAddCustomer } from "../../../../../store/slices/stripeSlice";
import { Icon } from "@iconify/react";
import { RightNarrowInCircle } from "../../../../../components/icons/RightNarrowInCircle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
const EventInventoryTable = ({ dataFound }) => {
    // const dispatch = useDispatch();
    const navigate = useNavigate();
    const sortingAssignedDeviceTrack = () => {
        const addingKey = new Set()
        for (let data of dataFound) {
            const jsonToStringForAvoidDuplicates = JSON.stringify({ key: data.item_id, ...data, data: data })
            addingKey.add(jsonToStringForAvoidDuplicates)
        }
        const finalDatTodisplay = new Set()
        const dataToTransform = Array.from(addingKey)
        for (let data of dataToTransform) {
            const stringToJson = JSON.parse(data)
            finalDatTodisplay.add(stringToJson)
        }
        return Array.from(finalDatTodisplay)
    }
    useEffect(() => {
        const controller = new AbortController()
        sortingAssignedDeviceTrack()
        return () => {
            controller.abort()
        }
    }, [])

    // const handleConsumerNavigation = async (record) => {
    //     const consumerData = await devitrakApi.post("/auth/users", {
    //         email: record.user
    //     })
    //     if (consumerData.data) {
    //         const consumer = consumerData.data.users.at(-1)
    //         let userFormatData = {
    //             uid: consumer.id ?? consumer.uid,
    //             name: consumer.name,
    //             lastName: consumer.lastName,
    //             email: consumer.email,
    //             phoneNumber: consumer.phoneNumber,
    //         };
    //         dispatch(onAddCustomerInfo(userFormatData));
    //         dispatch(onAddCustomer(userFormatData));
    //         await navigate(
    //             `/events/event-attendees/${userFormatData.uid}`
    //         );
    //     }
    // };

    const cellStyle = {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center"
    }

    const columns = [{
        title: 'Device type',
        dataIndex: 'data',
        key: 'data',
        sorter: {
            compare: (a, b) => ("" + a.data.item_group).localeCompare(b.data.item_group),
        },
        render: (record) => (
            <span style={cellStyle}> <Typography
                style={Subtitle}
                textTransform={"capitalize"}
            >{record.item_group}<br />
                {record.category_name}</Typography></span>
        )
    },
    {
        title: 'Status',
        dataIndex: 'warehouse',
        key: 'warehouse',
        sorter: {
            compare: (a, b) => ("" + a.warehouse).localeCompare(b.warehouse),
        },
        render: (warehouse) => (
            <span
                style={{
                    borderRadius: "16px",
                    justifyContent: "center",
                    display: "flex",
                    padding: "2px 8px",
                    alignItems: "center",
                    background: `${warehouse === 0
                        ? "var(--blue-50, #EFF8FF)"
                        : "var(--success-50, #ECFDF3)"
                        }`,
                    width: "fit-content",
                }}
            >
                <Typography
                    color={`${warehouse === 0
                        ? "var(--blue-700, #175CD3)"
                        : "var(--success-700, #027A48)"
                        }`}
                    style={Subtitle}
                    textTransform={"capitalize"}
                >
                    <Icon
                        icon="tabler:point-filled"
                        rotate={3}
                        color={`${warehouse === 0
                            ? "#2E90FA"
                            : "#12B76A"
                            }`}
                    />
                    {warehouse === 0
                        ? "In Use"
                        : "In Stock"}
                </Typography>
            </span>
        )
    },
    {
        title: 'Status',
        dataIndex: 'ownership',
        key: 'ownership',
        sorter: {
            compare: (a, b) => ("" + a.ownership).localeCompare(b.ownership),
        },
        render: (ownership) => (
            <span
                style={{
                    borderRadius: "16px",
                    justifyContent: "center",
                    display: "flex",
                    padding: "2px 8px",
                    alignItems: "center",
                    background: `${ownership === 'Permanent'
                        ? "var(--blue-50, #EFF8FF)"
                        : "var(--success-50, #ECFDF3)"
                        }`,
                    width: "fit-content",
                }}
            >
                <Typography
                    color={`${ownership === 'Permanent'
                        ? "var(--blue-700, #175CD3)"
                        : "var(--success-700, #027A48)"
                        }`}
                    style={Subtitle}
                    textTransform={"capitalize"}
                >
                    <Icon
                        icon="tabler:point-filled"
                        rotate={3}
                        color={`${ownership === 'Permanent'
                            ? "#2E90FA"
                            : "#12B76A"
                            }`}
                    />
                    {ownership === 'Permanent'
                        ? "Owned"
                        : "Rented"}
                </Typography>
            </span>
        )
    }, {
        title: 'Group',
        dataIndex: 'data',
        key: 'data',
        sorter: {
            compare: (a, b) => ("" + a.data.warehouse).localeCompare(b.data.warehouse),
        },
        render: (data) => (
            <span style={cellStyle}> <Typography
                style={Subtitle}
                textTransform={"capitalize"}
            >{data.warehouse === 1 ? 'warehouse' : data.event_name}</Typography></span>
        )
    },
    {
        title: 'Location',
        dataIndex: 'data',
        key: 'data',
        sorter: {
            compare: (a, b) => ("" + a.data.warehouse).localeCompare(b.data.warehouse),
        },
        render: (data) => (
            <span style={cellStyle}> <Typography
                style={Subtitle}
                textTransform={"capitalize"}
            >{data.warehouse === 1 ? 'warehouse' : data.event_name}</Typography></span>
        )
    },
    {
        title: 'Main Serial Number',
        dataIndex: 'serial_number',
        key: 'serial_number',
        sorter: (a, b) => a.serial_number - b.serial_number,
        render: (serial_number) => (
            <span style={cellStyle}> <Typography
                style={Subtitle}
                textTransform={"capitalize"}
            >{serial_number}</Typography></span>
        )
    },
    {
        title: 'Value',
        dataIndex: 'cost',
        key: 'cost',
        sorter: {
            compare: (a, b) => ("" + a.cost).localeCompare(b.cost),
        },
        render: (cost) => (
            <span style={cellStyle}> <Typography
                style={Subtitle}
                textTransform={"capitalize"}
            >${cost}</Typography></span>
        )
    },
    {
        title: '',
        dataIndex: 'data',
        key: 'data',
        render: (record) => (
            <span style={cellStyle} onClick={() => navigate(`/inventory/item?id=${record.item_id}`)}>
                <RightNarrowInCircle />
            </span>
        )
    }]
    return (
        <Table
            sticky
            size="large"
            columns={columns}
            dataSource={sortingAssignedDeviceTrack()}
            pagination={{
                position: ["bottomCenter"],
            }}
            className="table-ant-customized"
            style={{ cursor: 'pointer' }}
        />
    );
};

export default EventInventoryTable;