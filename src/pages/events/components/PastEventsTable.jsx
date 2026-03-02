import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import {
  onAddEventData,
  onAddExtraServiceListSetup,
  onAddExtraServiceNeeded,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import BaseTable from "../../../components/ux/tables/BaseTable";

const PastEventsTable = ({ events }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const quickGlance = async (props) => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: props.eventInfoDetail.address.split(" ").at(-1),
        event_name: props.eventInfoDetail.eventName,
      },
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(props.eventInfoDetail.eventName));
      dispatch(onSelectCompany(props.company));
      dispatch(
        onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) }),
      );
      dispatch(onAddSubscription(props.subscription));
      dispatch(
        onAddQRCodeLink(
          props.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              props.eventInfoDetail.eventName,
            )}&company=${encodeURI(props.company)}`,
        ),
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
            props.eventInfoDetail.eventName,
          )}&company=${encodeURI(props.company)}`,
      ),
    );
    dispatch(onAddExtraServiceListSetup(props.extraServiceListSetup));
    dispatch(onAddExtraServiceNeeded(props.extraServiceNeeded));

    navigate("/events/event-quickglance");
  };

  const sortData = () => {
    const currentDate = new Date();
    // Filter for past events first. An event is considered "past" if its end date is before the current date.
    const pastEvents = events.filter(
      (event) => new Date(event.eventInfoDetail.dateEnd) < currentDate,
    );

    // Sort the past events.
    pastEvents.sort((a, b) => {
      // "Past but active" events should come before "past and inactive" events.
      if (a.active && !b.active) {
        return -1; // a comes first
      }
      if (!a.active && b.active) {
        return 1; // b comes first
      }

      // For events with the same active status, apply secondary sorting.
      // Sorting by start date in descending order (most recent first).
      const dateA = new Date(a.eventInfoDetail.dateBegin);
      const dateB = new Date(b.eventInfoDetail.dateBegin);
      return dateB - dateA;
    });

    // Add a 'key' property to each event for the table rendering.
    return pastEvents.map((event) => ({ ...event, key: event.id }));
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)",
  );

  const column = [
    {
      title: "Event",
      dataIndex: "eventInfoDetail",
      key: "eventInfoDetail",
      sorter: {
        compare: (a, b) =>
          ("" + a.eventInfoDetail.eventName).localeCompare(
            b.eventInfoDetail.eventName,
          ),
      },
      render: (eventInfoDetail) => (
        <span
          style={{
            fontFamily: "Inter",
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <Avatar
            style={{
              display: isSmallDevice || isMediumDevice ? "none" : "flex",
            }}
            src={
              eventInfoDetail.logo ?? eventInfoDetail.eventName.split(" ")[0]
            }
          />
          &nbsp;
          {eventInfoDetail.eventName}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      sorter: {
        compare: (a, b) => ("" + a.active).localeCompare(b.active),
      },
      render: (active) => (
        <span
          style={{
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${active ? "#ffe4b5" : "#ffb5b5"}`,
            width: "fit-content",
            fontFamily: "Inter",
          }}
        >
          {active ? "Active" : "Closed"}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "eventInfoDetail",
      key: "eventInfoDetail",
      sorter: {
        compare: (a, b) =>
          ("" + a.eventInfoDetail.dateBegin).localeCompare(
            b.eventInfoDetail.dateBegin,
          ),
      },
      responsive: ["md", "lg"],
      render: (eventInfoDetail) => {
        const ending = new Date(eventInfoDetail.dateEnd).toString().split(" ");
        const begining = new Date(eventInfoDetail.dateBegin)
          .toString()
          .split(" ");
        return (
          <span style={{ fontFamily: "Inter" }}>
            {begining[1]} {begining[2]}-{ending[2]}
          </span>
        );
      },
    },
    {
      title: "Year",
      dataIndex: "eventInfoDetail",
      key: "eventInfoDetail",
      sorter: {
        compare: (a, b) =>
          ("" + a.eventInfoDetail.dateBegin).localeCompare(
            b.eventInfoDetail.dateBegin,
          ),
      },
      responsive: ["md", "lg"],
      render: (eventInfoDetail) => {
        const date = new Date(eventInfoDetail.dateBegin).getFullYear();
        return <span style={{ fontFamily: "Inter" }}>{date}</span>;
      },
    },
    {
      title: "",
      dataIndex: "contactInfo",
      key: "contactInfo",
      width: "5%",
      responsive: ["lg"],
      render: () => (
        <span>
          <RightNarrowInCircle />
        </span>
      ),
    },
  ];
  return (
    <BaseTable
      enablePagination={true}
      columns={column}
      dataSource={sortData()}
      onRow={(record) => {
        return {
          onClick: () => quickGlance(record),
        };
      }}
    />
  );
};

export default PastEventsTable;
