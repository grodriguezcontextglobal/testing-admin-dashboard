import { Icon } from "@iconify/react";
import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Table } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import "../../../../../styles/global/ant-table.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const StaffTable = ({ searching }) => {
  const { event } = useSelector((state) => state.event);
  const [staff, setStaff] = useState([])
  const staffEventQuery = useQuery({
    queryKey: ["newEndpointQuery"],
    queryFn: () => devitrakApi.get(`/event/event-staff-detail/${event.id}`), //devitrakApi.get("/staff/admin-users"),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    staffEventQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  const employeesString = staffEventQuery?.data?.data?.staff;
  const employees = typeof employeesString === "string" ? JSON.parse(employeesString) : employeesString
  const renderingStaffInfo = async () => {
    const result = new Set()
    for (const data of employees) {
      const onlineStatus = await devitrakApi.get(`/admin/check-online-status/${data.staff.email}`)
      result.add({
        name: `${data.staff.firstName} ${data.staff.lastName}`,
        online: onlineStatus?.data?.online,
        role: data.staff.role ?? "Assistant",
        email: data.staff.email,
        phone: data.phone ?? "000-000-0000",
        photo: data.photo
      })
    }
    return setStaff(Array.from(result))
  }
  useEffect(() => {
    renderingStaffInfo()
  }, [staffEventQuery.isLoading, staffEventQuery.isFetched, staffEventQuery.data])
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
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-start", alignItems: "center", alignSelf: "flex-start" }}>
            <Avatar src={record.photo}>{`${initials[0][0]}${initials[1][0]}`}</Avatar>&nbsp;
            <p>{name}</p>
          </div>
        )
      }
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
            background: `${online
              ? "var(--success-50, #ECFDF3)"
              : "var(--blue-50, #EFF8FF)"
              }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${online
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
      render: () => (
        <Icon
          icon="fluent:arrow-circle-right-20-regular"
          color="#475467"
          width={25}
          height={25}
        />
      ),
    },

  ];
  return (
    <Table
      pagination={{
        position: ["bottomCenter"],
      }}
      className="table-ant-customized"
      columns={columns}
      dataSource={dataToRender()}
    />
  );
};

export default StaffTable;
