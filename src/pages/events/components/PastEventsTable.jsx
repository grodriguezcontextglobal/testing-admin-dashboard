import { Avatar, Table } from "antd"
import "../../../styles/global/ant-table.css"
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { onAddEventData, onAddQRCodeLink, onSelectCompany, onSelectEvent } from "../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { RightNarrowInCircle } from "../../../components/icons/Icons";
import { devitrakApi } from "../../../api/devitrakApi";
const PastEventsTable = ({ events }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const quickGlance = async (props) => {
        const sqpFetchInfo = await devitrakApi.post('/db_event/events_information', {
            zip_address: props.eventInfoDetail.address.split(' ').at(-1),
            event_name: props.eventInfoDetail.eventName
        })
        if (sqpFetchInfo.data.ok) {
            dispatch(onSelectEvent(props.eventInfoDetail.eventName));
            dispatch(onSelectCompany(props.company));
            dispatch(onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) }));
            dispatch(onAddSubscription(props.subscription));
            dispatch(
                onAddQRCodeLink(
                    props.qrCodeLink ??
                    `https://app.devitrak.net/?event=${encodeURI(
                        props.eventInfoDetail.eventName
                    )}&company=${encodeURI(props.company)}`
                )
            );
            return navigate("/events/event-quickglance");
        }
        dispatch(onSelectEvent(props.eventInfoDetail.eventName));
        dispatch(onSelectCompany(props.company));
        dispatch(onAddEventData(props));
        dispatch(onAddSubscription(props.subscription));
        dispatch(
            onAddQRCodeLink(
                props.qrCodeLink ??
                `https://app.devitrak.net/?event=${encodeURI(
                    props.eventInfoDetail.eventName
                )}&company=${encodeURI(props.company)}`
            )
        );
        navigate("/events/event-quickglance");
    };
    // const quickGlance = (props) => {
    //     dispatch(onSelectEvent(props.eventInfoDetail.eventName));
    //     dispatch(onSelectCompany(props.company));
    //     dispatch(onAddEventData(props));
    //     dispatch(onAddSubscription(props.subscription));
    //     dispatch(
    //         onAddQRCodeLink(
    //             props.qrCodeLink ??
    //             `https://app.devitrak.net/?event=${encodeURI(
    //                 props.eventInfoDetail.eventName
    //             )}&company=${encodeURI(props.company)}`
    //         )
    //     );
    //     navigate("/events/event-quickglance");
    // };

    const sortData = () => {
        const result = new Set()
        const currentDate = new Date();
        for (let data of events) {
            const ending = new Date(data.eventInfoDetail.dateEnd);
            if (!data.active || currentDate > ending) {
                result.add({ key: data.id, ...data })
            }
        }
        return Array.from(result)
    }
    const column = [
        {
            title: 'Event',
            dataIndex: 'eventInfoDetail',
            key: 'eventInfoDetail',
            sorter: {
                compare: (a, b) =>
                    ("" + a.eventInfoDetail.eventName).localeCompare(b.eventInfoDetail.eventName),
            },
            render: (eventInfoDetail) => (
                <span>
                    <Avatar src={eventInfoDetail.logo ?? eventInfoDetail.eventName.split(' ')[0]}></Avatar>&nbsp;
                    {eventInfoDetail.eventName}
                </span>
            )
        },
        {
            title: 'Status',
            dataIndex: 'active',
            key: 'active',
            sorter: {
                compare: (a, b) =>
                    ("" + a.active).localeCompare(b.active),
            },
            render: (active) => (
                <span>{active ? "Active" : "Closed"}</span>
            )
        },
        {
            title: 'Date',
            dataIndex: 'eventInfoDetail',
            key: 'eventInfoDetail',
            sorter: {
                compare: (a, b) =>
                    ("" + a.eventInfoDetail.dateBegin).localeCompare(b.eventInfoDetail.dateBegin),
            },
            render: (eventInfoDetail) => {
                const ending = new Date(eventInfoDetail.dateEnd).toString().split(' ')
                const begining = new Date(eventInfoDetail.dateBegin).toString().split(' ')
                return <span>{begining[1]} {begining[2]}-{ending[2]}</span>
            }
        },
        {
            title: 'Year',
            dataIndex: 'eventInfoDetail',
            key: 'eventInfoDetail',
            sorter: {
                compare: (a, b) =>
                    ("" + a.eventInfoDetail.dateBegin).localeCompare(b.eventInfoDetail.dateBegin),
            },
            render: (eventInfoDetail) => {
                const date = new Date(eventInfoDetail.dateBegin).getFullYear()
                return <span>{date}</span>
            }
        },
        {
            title: '',
            dataIndex: 'contactInfo',
            key: 'contactInfo',
            width: "5%",
            render: () => (
                <span><RightNarrowInCircle /></span>
            )
        },
    ];
    return (
        <Table
            className="table-ant-customized"
            style={{
                width: "100%",
                cursor: 'pointer'
            }}
            columns={column}
            dataSource={sortData()}
            onRow={(record) => {
                return {
                    onClick: () => quickGlance(record)
                }
            }}
        />
    )
}

export default PastEventsTable