import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Typography } from "antd";
import { PropTypes } from "prop-types";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Chip from "../../components/UX/Chip/Chip";
import TableHeader from "../../components/UX/TableHeader";
import dicRole from "../../components/general/dicRole";
import { RightNarrowInCircle } from "../../components/icons/RightNarrowInCircle";
import PageSpinner from "../../components/utils/PageSpinner";
import RefreshButton from "../../components/utils/UX/RefreshButton";
import BaseTable from "../../components/ux/tables/BaseTable";
import { onAddStaffProfile } from "../../store/slices/staffDetailSlide";
import "../../styles/global/ant-table.css";
import DownLoadReportButton from "./components/DownLoadReportButton";

const secondaryTextStyle = {
  fontSize: "12px",
  fontFamily: "Inter",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "18px",
  textAlign: "left",
  justifyContent: "flex-start",
  color: "var(--gray-600, #5d615a)",
};

// 0 Root admin / 1 Admin -> primary, 2 Manager -> info, 3 Support / 4 Staff -> default
const roleChipColor = (role) => {
  const numericRole = Number(role);
  if (numericRole === 0 || numericRole === 1) return "primary";
  if (numericRole === 2) return "info";
  return "default";
};

// status is "Pending" (invitation) or the employee's active flag
const statusChipProps = (status) => {
  if (status === "Pending") return { label: "Pending", color: "warning" };
  if (typeof status === "string") {
    const isActive = status.toLowerCase() === "active";
    return {
      label: status,
      color: isActive ? "success" : "default",
    };
  }
  if (status) return { label: "Active", color: "success" };
  return { label: "Inactive", color: "default" };
};

const MainAdminSettingPage = ({ searchAdmin }) => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const companiesEmployees = useQuery({
    queryKey: ["employeesPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    enabled: !!user.companyData.id && user.companyData.id !== "",
  });

  const company = companiesEmployees?.data?.data?.company?.[0];
  const employees = useMemo(() => company?.employees ?? [], [company]);
  const employeeEmails = useMemo(
    () => employees.map((member) => member.user),
    [employees]
  );

  // One parallel batch (instead of the previous sequential N+1 loop),
  // keyed by the current employee emails so it refreshes with the company.
  const adminUsersQuery = useQuery({
    queryKey: [
      "staffAdminUsersByEmail",
      user.companyData.id,
      employeeEmails.join("|"),
    ],
    queryFn: async () => {
      const responses = await Promise.all(
        employeeEmails.map((email) =>
          devitrakApi
            .post("/staff/admin-users", { email })
            .catch(() => null)
        )
      );
      const adminUserByEmail = {};
      responses.forEach((response, index) => {
        adminUserByEmail[employeeEmails[index]] =
          response?.data?.adminUsers?.[0] ?? null;
      });
      return adminUserByEmail;
    },
    enabled: employeeEmails.length > 0,
  });

  const dataSource = useMemo(() => {
    const adminUserByEmail = adminUsersQuery.data ?? {};
    const term = String(searchAdmin ?? "")
      .toLowerCase()
      .trim();
    return employees
      .map((data) => {
        const status = data.status === "Pending" ? data.status : data.active;
        const adminUserInfo = adminUserByEmail[data.user] ?? null;
        const entireData = {
          ...data,
          email: data.user,
          status,
          adminUserInfo,
          companyData: company,
        };
        return {
          name: `${data.firstName} ${data.lastName}`,
          email: data.user,
          phone: adminUserInfo?.phone ?? data.phone ?? null,
          role: data.role,
          active: status,
          entireData,
          key: data.user,
        };
      })
      .filter((row) => {
        if (!term) return true;
        const haystack = `${row.name} ${row.email} ${
          dicRole[row.role] ?? ""
        } ${statusChipProps(row.active).label}`.toLowerCase();
        return haystack.includes(term);
      });
  }, [employees, adminUsersQuery.data, searchAdmin, company]);

  const handleDetailStaff = (record) => {
    if (record.active === "Pending" || !record?.entireData?.adminUserInfo?.id)
      return;
    dispatch(onAddStaffProfile(record.entireData));
    return navigate(`/staff/${record.entireData.adminUserInfo.id}/main`);
  };

  if (companiesEmployees.isLoading || adminUsersQuery.isInitialLoading)
    return <PageSpinner />;

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      align: "left",
      width: "35%",
      sorter: {
        compare: (a, b) => ("" + a.name).localeCompare(b.name),
      },
      render: (name, record) => {
        const initials = String(name)
          .split(" ")
          .map((word) => word[0]);
        return (
          <span
            key={`${name}`}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "12px",
            }}
          >
            <Avatar src={record?.entireData?.adminUserInfo?.imageProfile}>
              {!record?.entireData?.adminUserInfo?.imageProfile && initials}
            </Avatar>
            <div
              style={{
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <Typography
                style={{
                  justifyContent: "flex-start",
                  color: "var(--gray-900, #171d1a)",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: 500,
                }}
              >
                {name}
              </Typography>
              <Typography style={secondaryTextStyle}>
                {record.email}
              </Typography>
            </div>
          </span>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      width: "18%",
      sorter: {
        compare: (a, b) => Number(a.role) - Number(b.role),
      },
      render: (role) => (
        <Chip
          label={dicRole[role] ?? "Unknown"}
          color={roleChipColor(role)}
          size="small"
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      width: "12%",
      sorter: {
        compare: (a, b) => ("" + a.active).localeCompare("" + b.active),
      },
      render: (active) => {
        const { label, color } = statusChipProps(active);
        return <Chip label={label} color={color} size="small" />;
      },
    },
    {
      title: "Phone",
      dataIndex: "phone",
      width: "20%",
      responsive: ["lg"],
      render: (phone) => (
        <Typography style={secondaryTextStyle}>
          {phone || "—"}
        </Typography>
      ),
    },
    {
      title: "",
      key: "action",
      align: "center",
      width: "5%",
      render: (_, record) => {
        return (
          <>
            {record.active !== "Pending" && (
              <Typography.Link onClick={() => handleDetailStaff(record)}>
                <RightNarrowInCircle />
              </Typography.Link>
            )}
          </>
        );
      },
    },
  ];

  return (
    <Grid margin={"15px 0 0 0"} padding={0} container>
      <TableHeader
        leftCta={<RefreshButton propsFn={() => companiesEmployees.refetch()} />}
        rightCta={<DownLoadReportButton />}
      />
      <BaseTable
        enablePagination={true}
        style={{ width: "100%", cursor: "pointer" }}
        dataSource={dataSource}
        columns={columns}
        rowClassName="editable-row"
        className="table-ant-customized"
        locale={{
          emptyText: searchAdmin
            ? "No staff members match your search."
            : "No staff members yet. Use “Add new staff” to invite your team.",
        }}
        onRow={(record) => {
          return {
            onClick: () => handleDetailStaff(record),
          };
        }}
      />
    </Grid>
  );
};

MainAdminSettingPage.propTypes = {
  searchAdmin: PropTypes.string,
  modalState: PropTypes.bool,
};
export default MainAdminSettingPage;
