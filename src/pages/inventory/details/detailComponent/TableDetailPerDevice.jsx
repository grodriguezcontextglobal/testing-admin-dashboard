import { Table } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddStaffProfile } from "../../../../store/slices/staffDetailSlide";
import {
  onAddEventData,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../../store/slices/subscriptionSlice";
import "../../../../styles/global/ant-table.css";
const TableDetailPerDevice = ({ dataFound }) => {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sortingAssignedDeviceTrack = () => {
    const renderingData = new Map();
    const dbToRender = dataFound[0].data;

    for (let event of dbToRender) {
      if (!renderingData.has(event.event_id)) {
        renderingData.set(event.event_id, { key: event.event_id, ...event });
      }
    }
    return Array.from(renderingData.values());
  };
  useEffect(() => {
    const controller = new AbortController();
    sortingAssignedDeviceTrack();
    return () => {
      controller.abort();
    };
  }, []);
  const handleDetailStaff = (record) => {
    dispatch(onAddStaffProfile(record));
    return navigate(`/staff/${record.adminUserInfo.id}/main`);
  };

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  function findEmail(array) {
    for (let str of array) {
      const match = str.match(emailRegex);
      if (match) {
        return match[0];
      }
    }
    return null; // Return null if no email address is found
  }

  const storeEvntInfoFound = async (props) => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: props.eventInfoDetail.address.split(" ").at(-1),
        event_name: props.eventInfoDetail.eventName,
      }
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(props.eventInfoDetail.eventName));
      dispatch(onSelectCompany(props.company));
      dispatch(
        onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) })
      );
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
  };
  const checkIfEventShowedExistsInAdminEventList = (event_name) => {
    if (eventsPerAdmin.active.length === 0)
      return alert("You're not assigned as staff to this event.");
    if (
      eventsPerAdmin.active.some(
        (element) => element.eventInfoDetail.eventName === event_name
      )
    ) {
      const eventInfo = eventsPerAdmin.active.find(
        (element) => element.eventInfoDetail.eventName === event_name
      );
      return storeEvntInfoFound(eventInfo);
    } else if (
      eventsPerAdmin.completed.some(
        (element) => element.eventInfoDetail.eventName === event_name
      )
    ) {
      const eventInfo = eventsPerAdmin.completed.find(
        (element) => element.eventInfoDetail.eventName === event_name
      );
      return storeEvntInfoFound(eventInfo);
    } else return alert("You're not assigned as staff to this event.");
  };
  const navigateFn = async (event_name) => {
    const reference = String(event_name).split(" ");
    const leasedReference = String(event_name).split(" / ");
    if (reference[0] === "Leased" && reference[1] === "equipment:") {
      const individual = await devitrakApi.post("/staff/admin-users", {
        email: findEmail(reference),
      });
      const companyInfo = await devitrakApi.post("/company/search-company", {
        company_name: user.company,
      });
      if (individual.data && companyInfo.data) {
        const employeesInCompanyInfo =
          await companyInfo.data.company[0].employees.find(
            (element) => element.user === individual.data.adminUsers[0].email
          );
        return handleDetailStaff({
          ...employeesInCompanyInfo,
          email: employeesInCompanyInfo.user,
          adminUserInfo: individual.data.adminUsers[0],
          companyData: companyInfo.data.company[0],
        });
      }
    }
    if (leasedReference.length === 3) {
      const individual = await devitrakApi.post("/staff/admin-users", {
        email: leasedReference[1],
      });
      if (individual.data) {
        const employeesInCompanyInfo = await user.companyData.employees.find(
          (element) => element.user === individual.data.adminUsers[0].email
        );

        return handleDetailStaff({
          ...employeesInCompanyInfo,
          email: leasedReference[1],
          adminUserInfo: individual.data.adminUsers[0],
          companyData: user.companyData,
        });
      }
    }

    return checkIfEventShowedExistsInAdminEventList(event_name);
  };

  const columnsStyles = {
    textTransform: "none",
    textAlign: "left",
    fontSize: "14px",
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "20px",
    // color: "var(--blue-dark-600)",
    width: "100%",
  };

  const columns = [
    {
      title: "Event/Assigned to",
      dataIndex: "event_name",
      align: "left",
      sorter: {
        compare: (a, b) => ("" + a.event_name).localeCompare(b.event_name),
      },
      responsive: ["xs", "sm", "md", "lg"],
      render: (event_name, record) => {
        const renderingEventName = () => {
          if (record.warehouse === 1) {
            return `Warehouse (${record.location})`;
          } else {
            return event_name;
          }
        };
        return (
          <button
            onClick={() =>
              record.warehouse === 1
                ? navigate(
                    `/inventory/location?${record.location}&search=`
                  )
                : navigateFn(event_name)
            }
            style={{
              backgroundColor: "transparent",
              outline: "none",
              margin: "auto",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
            }}
          >
            <p
              style={{
                ...columnsStyles,
                color: "var(--blue-dark-600)",
              }}
            >
              {renderingEventName()}
            </p>
          </button>
        );
      },
    },
    {
      title: "Location",
      // dataIndex: "data",
      align: "left",
      sorter: {
        compare: (a, b) =>
          ("" + a.state_address).localeCompare(b.state_address),
      },
      responsive: ["xs", "sm", "md", "lg"],
      render: (record) => {
        // console.log(record);
        const renderingLocation = () => {
          if (record.warehouse === 1) {
            return record.location;
          }
          return `${record.street_address}, ${record.city_address}, ${record.state_address}, ${record.zip_address}`;
        };
        return (
          <span
            style={{
              backgroundColor: "transparent",
              outline: "none",
              margin: "auto",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
            }}
          >
            <p style={{}}>{renderingLocation()}</p>
          </span>
        );
      },
    },
    {
      title: "Ownership",
      dataIndex: "ownership",
      align: "left",
      sorter: {
        compare: (a, b) => ("" + a.ownership).localeCompare(b.ownership),
      },
      responsive: ["md", "lg"],
      render: (ownership) => (
        <span
          // onClick={() => navigate("/events/event-quickglance")}
          style={{ margin: "auto" }}
        >
          <p
            style={{
              ...columnsStyles,
            }}
          >
            {ownership === "Rent" ? "Leased" : ownership}
          </p>
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
          <p
            style={{
              ...columnsStyles,
            }}
          >
            {condition ?? "Operational"}
          </p>
        </span>
      ),
    },
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
      // style={{ cursor: 'pointer' }}
    />
  );
};

export default TableDetailPerDevice;
