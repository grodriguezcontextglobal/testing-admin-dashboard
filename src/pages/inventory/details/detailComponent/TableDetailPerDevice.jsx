import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
// import {
//   onAddCustomerInfo,
// } from "../../../../store/slices/customerSlice";
// import { onAddCustomer } from "../../../../store/slices/stripeSlice";
// import {
//   onAddEventData,
//   onAddQRCodeLink,
//   onSelectCompany,
//   onSelectEvent,
// } from "../../../../store/slices/eventSlice";
import { onAddStaffProfile } from "../../../../store/slices/staffDetailSlide";
// import { onAddSubscription } from "../../../../store/slices/subscriptionSlice";
import "../../../../styles/global/ant-table.css";
import BaseTable from "../../../../components/UX/tables/BaseTable";
const TableDetailPerDevice = ({ dataFound }) => {
  const { user } = useSelector((state) => state.admin);
  // const { eventsPerAdmin } = useSelector((state) => state.event);
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

  // const storeEvntInfoFound = async (props) => {
  //   const sqpFetchInfo = await devitrakApi.post(
  //     "/db_event/events_information",
  //     {
  //       zip_address: props.eventInfoDetail.address.split(" ").at(-1),
  //       event_name: props.eventInfoDetail.eventName,
  //     },
  //   );
  //   if (sqpFetchInfo.data.ok) {
  //     dispatch(onSelectEvent(props.eventInfoDetail.eventName));
  //     dispatch(onSelectCompany(props.company));
  //     dispatch(
  //       onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) }),
  //     );
  //     dispatch(onAddSubscription(props.subscription));
  //     dispatch(
  //       onAddQRCodeLink(
  //         props.qrCodeLink ??
  //         `https://app.devitrak.net/?event=${encodeURI(
  //           props.eventInfoDetail.eventName,
  //         )}&company=${encodeURI(props.company)}`,
  //       ),
  //     );
  //     return navigate("/events/event-quickglance");
  //   }
  // };
  // const checkIfEventShowedExistsInAdminEventList = (event_name) => {
  //   if (eventsPerAdmin.active.length === 0)
  //     return alert("You're not assigned as staff to this event.");
  //   if (
  //     eventsPerAdmin.active.some(
  //       (element) => element.eventInfoDetail.eventName === event_name,
  //     )
  //   ) {
  //     const eventInfo = eventsPerAdmin.active.find(
  //       (element) => element.eventInfoDetail.eventName === event_name,
  //     );
  //     return storeEvntInfoFound(eventInfo);
  //   } else if (
  //     eventsPerAdmin.completed.some(
  //       (element) => element.eventInfoDetail.eventName === event_name,
  //     )
  //   ) {
  //     const eventInfo = eventsPerAdmin.completed.find(
  //       (element) => element.eventInfoDetail.eventName === event_name,
  //     );
  //     return storeEvntInfoFound(eventInfo);
  //   } else return alert("You're not assigned as staff to this event.");
  // };

  const staffingFN = async (reference) => {
    const individual = await devitrakApi.post("/staff/admin-users", {
      email: findEmail(reference),
    });
    const companyInfo = await devitrakApi.post("/company/search-company", {
      company_name: user.company,
    });
    if (individual.data && companyInfo.data) {
      const employeesInCompanyInfo =
        await companyInfo.data.company[0].employees.find(
          (element) => element.user === individual.data.adminUsers[0].email,
        );
      return handleDetailStaff({
        ...employeesInCompanyInfo,
        email: employeesInCompanyInfo.user,
        adminUserInfo: individual.data.adminUsers[0],
        companyData: companyInfo.data.company[0],
      });
    }
  }

  const consumersFN = async () => {
    // const consumerEmail = findEmail(String(record.event_name).split(" "));
    // if (consumerEmail) {
    //   const consumerQuery = await devitrakApi.post("/auth/users", {
    //     email: consumerEmail,
    //   });

    //   if (consumerQuery.data.ok) {
    //     const consumerInfo = consumerQuery.data.users[0];
    //     const userFormatData = {
    //       uid: consumerInfo.id,
    //       name: consumerInfo.name,
    //       lastName: consumerInfo.lastName,
    //       email: consumerInfo.email,
    //       phoneNumber: consumerInfo.phoneNumber,
    //       data: consumerInfo,
    //     };
    //     dispatch(onAddCustomerInfo(userFormatData));
    //     dispatch(onAddCustomer(userFormatData));
    //     return navigate(`/consumers/${consumerInfo.id}`);
    //   }
    // }
    return navigate(`/consumers`);
  };

  const membersFn = async () => {
    // const memberId = 0
    // return navigate(`/members/${memberId}`);
    return navigate(`/members`);

  }
  const navigateFn = async (event_name) => {
    console.log(event_name)
    const reference = String(event_name).split(" ");
    const findingEventInfo = await devitrakApi.post("/event/event-list", {
      "eventInfoDetail.eventName": event_name,
    })
    console.log(findingEventInfo?.data?.list?.at(-1)?.eventInfoDetail.eventName, findingEventInfo?.data?.list?.at(-1)?.contract_for)
    switch (findingEventInfo?.data?.list?.at(-1)?.contract_for) {
      case "staff":
        return staffingFN(reference);
      case "member":
        return membersFn();
      case "consumer":
        return consumersFN();
      default:
        return consumersFN();
    }
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
                ? navigate(`/inventory/location?${record.location}&search=`)
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
      align: "left",
      sorter: {
        compare: (a, b) =>
          ("" + a.state_address).localeCompare(b.state_address),
      },
      responsive: ["xs", "sm", "md", "lg"],
      render: (record) => {
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
    <BaseTable
      sticky
      size="large"
      columns={columns}
      dataSource={sortingAssignedDeviceTrack()}
      enablePagination
    />
  );
};

export default TableDetailPerDevice;
