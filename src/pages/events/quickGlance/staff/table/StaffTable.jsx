import { Icon } from "@iconify/react";
import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Table } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import "../../../../../styles/global/ant-table.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import checkTypeFetchResponse from "../../../../../components/utils/checkTypeFetchResponse";
import { useNavigate } from "react-router-dom";
import StaffMemberStructure from "../../../../../classes/staffMemberStructure";
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";

const StaffTable = ({ searching }) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [staff, setStaff] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const staffEventQuery = useQuery({
    queryKey: ["newEndpointQuery"],
    queryFn: () => devitrakApi.get(`/event/event-staff-detail/${event.id}`), //devitrakApi.get("/staff/admin-users"),
    refetchOnMount: false,
    staleTime: 3 * 60 * 60 * 1000,
  });

  // useEffect(() => {
  //   const controller = new AbortController();
  //   staffEventQuery.refetch();
  //   return () => {
  //     controller.abort();
  //   };
  // }, []);
  const employeesString = staffEventQuery?.data?.data?.staff;
  const employees = checkTypeFetchResponse(employeesString);
  const renderingStaffInfo = async () => {
    const result = new Set();
    if (employees?.length > 0) {
      for (const data of employees) {
        if (data.admin_id === null) {
          result.add({
            id: data.admin_id,
            name: `${data.staff.firstName} ${data.staff.lastName}`,
            online: false,
            role:
              data.staff.role !== "Administrator"
                ? ("Assistant" || "headsetAttendees")
                : data.staff.role,
            email: data.staff.email,
            phone: "000-000-0000",
            photo: "",
          });
        } else {
          const onlineStatus = await devitrakApi.get(
            `/admin/check-online-status/${data.staff.email}`
          );
          result.add({
            id: data.admin_id,
            name: `${data.staff.firstName} ${data.staff.lastName}`,
            online: onlineStatus?.data?.online,
            role:
              data.staff.role !== "Administrator"
                ? "Assistant"
                : data.staff.role,
            email: data.staff.email,
            phone: data.phone ?? "000-000-0000",
            photo: data.photo ?? "",
          });
        }
      }
    }

    return setStaff(Array.from(result));
  };
  useEffect(() => {
    renderingStaffInfo();
  }, [
    staffEventQuery.isLoading,
    staffEventQuery.isFetched,
    staffEventQuery.data,
  ]);
  const dataToRender = () => {
    if (!searching || String(searching).length < 1) {
      return staff;
    } else {
      const responding = [...staff].filter((staff) =>
        JSON.stringify(staff)
          .toLowerCase()
          .includes(String(searching).toLowerCase())
      );
      return responding;
    }
  };
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => {
        const initials = String(name).toUpperCase().split(" ");
        return (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              alignSelf: "flex-start",
            }}
          >
            <Avatar
              src={record.photo}
            >{`${initials[0][0]}${initials[1][0]}`}</Avatar>
            &nbsp;
            <p>{name}</p>
          </div>
        );
      },
    },
    {
      title: "Status",
      width: "10%",
      dataIndex: "online",
      key: "online",
      render: (online) => (
        <span
          style={{
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${
              online ? "var(--success-50, #ECFDF3)" : "var(--blue-50, #EFF8FF)"
            }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${
              online
                ? "var(--success-700, #027A48)"
                : "var(--blue-700, #175CD3)"
            }`}
            textTransform={"capitalize"}
            style={{
              ...Subtitle,
              fontWeight: 500,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${online ? "#12B76A" : "#2E90FA"}`}
            />
            {online ? "Online" : "Offline"}
          </Typography>
        </span>
      ),
    },
    {
      title: "Role",
      width: "15%",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "",
      key: "action",
      align: "right",
      width: "5%",
      responsive: ["lg"],
      render: () => (
        <Icon
          style={{ cursor: "pointer" }}
          icon="fluent:arrow-circle-right-20-regular"
          color="#475467"
          width={25}
          height={25}
        />
      ),
    },
  ];

  const handleDataStaffMember = async (record) => {
    const infoFound = await devitrakApi.post(`/staff/admin-users`, {
      _id: record.id,
    });
    if (infoFound.data.ok) {
      const staffMemberStructure = new StaffMemberStructure(
        user.companyData,
        infoFound.data.adminUsers[0],
        record.role
      );
      dispatch(onAddStaffProfile(staffMemberStructure.fromStaffPage()));
      return navigate(`/staff/${record.id}/main`);
    }
  };
  return (
    <Table
      pagination={{
        position: ["bottomCenter"],
      }}
      className="table-ant-customized"
      columns={columns}
      dataSource={dataToRender()}
      onRow={(record) => {
        return {
          onClick: () =>
            record.id && user.role < 4 && handleDataStaffMember(record),
        };
      }}
    />
  );
};

export default StaffTable;
