import { Icon } from "@iconify/react";
import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import StaffMemberStructure from "../../../../../classes/staffMemberStructure";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import checkTypeFetchResponse from "../../../../../components/utils/checkTypeFetchResponse";
import { isNotAssistant } from "../../../../../config/roles";
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { buildStaffRows, staffInitials } from "../utils/eventStaffUtils";

/**
 * The event's staff.
 *
 * A member added through the manage-staff modal appeared here with no name.
 * Adding somebody who already works at the company stores
 * `{ firstName: "", lastName: "", email }` — the modal does not ask for a name
 * it already has on file — and this table read `staff.firstName` straight out
 * of that entry. `buildStaffRows` resolves the name against the registered
 * accounts first, which is how the modal's own list has always done it, so the
 * two now agree.
 */
const StaffTable = ({ searching }) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [onlineByEmail, setOnlineByEmail] = useState({});

  const staffEventQuery = useQuery({
    queryKey: ["newEndpointQuery"],
    queryFn: () => devitrakApi.get(`/event/event-staff-detail/${event.id}`),
    refetchOnMount: false,
    staleTime: 3 * 60 * 60 * 1000,
  });

  /* Same key and endpoint the manage-staff modal uses, so the two share one
     cached copy of the company's accounts instead of fetching it twice. */
  const accountsQuery = useQuery({
    queryKey: ["eventStaffAccounts"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
    staleTime: 1000 * 60 * 5,
  });

  /* Memoised because checkTypeFetchResponse JSON.parses a string response: a
     new object every render would make every downstream memo useless. */
  const employees = useMemo(
    () => checkTypeFetchResponse(staffEventQuery.data?.data?.staff) ?? [],
    [staffEventQuery.data]
  );

  const rows = useMemo(
    () =>
      buildStaffRows({
        rows: employees,
        event,
        accounts: accountsQuery.data?.data?.adminUsers,
      }),
    [employees, event, accountsQuery.data]
  );

  /* One request per member, in parallel and each with its own catch. It used to
     be a sequential `for` loop inside an un-awaited async function with no
     cleanup: a single rejected status check abandoned the loop and left the
     table empty, and a slow response could overwrite a newer one. */
  useEffect(() => {
    let cancelled = false;
    const withAccounts = rows.filter((row) => row.id);
    if (withAccounts.length === 0) {
      setOnlineByEmail({});
      return undefined;
    }
    Promise.all(
      withAccounts.map(async (row) => {
        try {
          const status = await devitrakApi.get(
            `/admin/check-online-status/${row.email}`
          );
          return [row.email, Boolean(status?.data?.online)];
        } catch {
          return [row.email, false];
        }
      })
    ).then((entries) => {
      if (!cancelled) setOnlineByEmail(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const dataToRender = useMemo(() => {
    const withStatus = rows.map((row) => ({
      ...row,
      online: Boolean(onlineByEmail[row.email]),
    }));
    const term = String(searching ?? "").trim().toLowerCase();
    if (!term) return withStatus;
    // Was JSON.stringify(row), which searched the photo URL too.
    return withStatus.filter((row) =>
      [row.name, row.email, row.role, row.phone].some((field) =>
        String(field ?? "").toLowerCase().includes(term)
      )
    );
  }, [rows, onlineByEmail, searching]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            alignSelf: "flex-start",
          }}
        >
          <Avatar src={record.photo}>{staffInitials(name)}</Avatar>
          &nbsp;
          <p>{name}</p>
        </div>
      ),
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
    <BaseTable
      columns={columns}
      dataSource={dataToRender}
      loading={staffEventQuery.isLoading}
      onRow={(record) => ({
        onClick: () =>
          record.id &&
          isNotAssistant(user.roleType) &&
          handleDataStaffMember(record),
      })}
      enablePagination={true}
      pageSize={10}
    />
  );
};

export default StaffTable;
