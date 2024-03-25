import { Typography } from "@mui/material";
import { Table } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../../../../styles/global/ant-table.css';
const TableDetailPerDevice = ({ dataFound }) => {
    const navigate = useNavigate();
    const sortingAssignedDeviceTrack = () => {
        const addingKey = new Set()
        for (let data of dataFound) {
            const jsonToStringForAvoidDuplicates = JSON.stringify({ key: `${data.item_id}*${data.event_name}`, ...data, data: { ...data } })
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
    const columns = [
        {
            title: "Event",
            dataIndex: "event_name",
            align: "left",
            sorter: {
                compare: (a, b) =>
                    ("" + a.event_name).localeCompare(b.event_name),
            },
            render: (event_name) => (
                <span
                    onClick={() => navigate(`${event_name ? "/events/event-quickglance" : window.location.reload()}`)}
                    style={{ margin: "auto", cursor: "pointer" }}
                >
                    <Typography
                        textTransform={"none"}
                        fontSize={"14px"}
                        fontFamily={"Inter"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"20px"}
                        color={"var(--blue-dark-600)"}
                    >
                        {event_name ?? 'Warehouse'}
                    </Typography>
                </span>
            ),
        },
        {
            title: "Location",
            dataIndex: "data",
            align: "left",
            sorter: {
                compare: (a, b) =>
                    ("" + a.state_address).localeCompare(b.state_address),
            },
            render: (data) => (
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
                        {data.warehouse === 1 ? data.location : data.event_name}
                    </Typography>
                </span>
            ),
        },
        {
            title: "Ownership",
            dataIndex: "ownership",
            align: "left",
            sorter: {
                compare: (a, b) =>
                    ("" + a.ownership).localeCompare(b.ownership),
            },
            render: (ownership) => (
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
                        {ownership === "Rent" ? "Leased" : ownership}
                    </Typography>
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "condition",
            align: "left",
            responsive: ["md", "lg"],
            sorter: {
                compare: (a, b) => ("" + a.condition).localeCompare(b.condition),
            },
            render: (condition) => (
                <span style={{ margin: "auto" }}>
                    <Typography
                        textTransform={"none"}
                        fontSize={"14px"}
                        fontFamily={"Inter"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"20px"}
                    >
                        {condition ?? "Operational"}
                    </Typography>
                </span>
            ),
        },
        // {
        //     title: "",
        //     dataIndex: "data",
        //     align: "left",
        //     responsive: ["md", "lg"],
        //    width:"5%",
        //     render: (record) => (
        //         <span style={{ margin: "auto" }} onClick={() => navigate(`/inventory/event-inventory?event_id=${record.event_id}`)}>
        //             <Tooltip title="Click to display inventory of event.">
        //                <Typography

        //                 textTransform={"none"}
        //                 fontSize={"14px"}
        //                 fontFamily={"Inter"}
        //                 fontStyle={"normal"}
        //                 fontWeight={400}
        //                 lineHeight={"20px"}
        //             >
        //                 <RightNarrowInCircle />
        //             </Typography> 
        //             </Tooltip>

        //         </span>
        //     ),
        // },
    ];

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

export default TableDetailPerDevice;