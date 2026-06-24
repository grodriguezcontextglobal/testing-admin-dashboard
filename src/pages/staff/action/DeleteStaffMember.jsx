import { Icon } from "@iconify/react";
import { Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Typography, notification } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import dicRole from "../../../components/general/dicRole";
import DangerButtonConfirmationComponent from "../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import BaseTable from "../../../components/UX/tables/BaseTable";
import { onLogin } from "../../../store/slices/adminSlice";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";

const cellNameStyle = {
  fontSize: "14px",
  fontFamily: "Inter",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-900, #101828)",
};

const cellSubtextStyle = {
  fontSize: "12px",
  fontFamily: "Inter",
  fontWeight: 400,
  lineHeight: "18px",
  color: "var(--gray-600, #475467)",
  textTransform: "capitalize",
};

const DeleteStaffMember = ({ modalState, setModalState }) => {
  const [selectionType] = useState("checkbox");
  const [staffMemberList, setStaffMemberList] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const employeeListRef = useRef([]);
  const [api, contextHolder] = notification.useNotification();

  const companiesEmployees = useQuery({
    queryKey: ["employeesPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.companyData.company_name,
        type: "event",
        active: true,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    companiesEmployees.refetch();
    eventQuery.refetch();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, user.company, modalState]);

  const fetchEmployees = async () => {
    const result = new Set();
    const companiesData =
      companiesEmployees?.data?.data?.company[0]?.employees ?? [];
    for (let data of companiesData) {
      const individual = await devitrakApi.post("/staff/admin-users", {
        email: data.user,
      });
      if (individual.data) {
        result.add({
          ...data,
          email: data.user,
          status: data.status === "Pending" ? data.status : data.active,
          adminUserInfo: individual.data.adminUsers[0],
          companyData: companiesEmployees.data.data.company[0],
        });
      } else {
        result.add({
          ...data,
          status: data.status === "Pending" ? data.status : data.active,
          companyData: companiesEmployees.data.data.company[0],
          adminUserInfo: null,
        });
      }
    }
    employeeListRef.current = Array.from(result);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees();
    return () => controller.abort();
  }, [location.key, companiesEmployees.data]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const renderStatus = (active) => {
    if (typeof active === "string") return active;
    return active ? "Active" : "Inactive";
  };

  const handleDeleteStaffMember = async () => {
    const updatedEmployeeList = new Set();
    for (let data of user.companyData.employees) {
      if (!staffMemberList.some((el) => el.email === data.user)) {
        updatedEmployeeList.add(data);
      }
    }
    const response = await devitrakApi.patch(
      `/company/update-company/${user.companyData.id}`,
      { employees: Array.from(updatedEmployeeList) }
    );
    if (response.data) {
      dispatch(
        onLogin({
          ...user,
          companyData: {
            ...user.companyData,
            employees: Array.from(updatedEmployeeList),
          },
        })
      );
      await clearCacheMemory(`_id=${user.companyData.id}`);
      await clearCacheMemory(`company_id=${user.companyData.id}`);
      queryClient.invalidateQueries({ queryKey: ["listOfAdminUsers"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["employeesPerCompanyList"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["events"], exact: true });
      api.open({ message: "Staff members deleted" });
      setModalState(false);
    }
  };

  const rowSelection = {
    onChange: (_, selectedRows) => setStaffMemberList(selectedRows),
    getCheckboxProps: (record) => ({
      disabled: Number(record.role) === 0,
      name: record.name,
    }),
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      align: "left",
      sorter: { compare: (a, b) => ("" + a.name).localeCompare(b.name) },
      render: (name, record) => {
        const initials = String(name).split(" ");
        return (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Avatar src={record?.entireData?.adminUserInfo?.imageProfile}>
              {!record?.entireData?.adminUserInfo?.imageProfile &&
                initials.map((i) => i[0])}
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Typography style={cellNameStyle}>{name}</Typography>
              <Typography style={cellSubtextStyle}>
                {record?.entireData?.adminUserInfo?.phone ?? "+1-000-000-0000"}
              </Typography>
            </div>
          </span>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      responsive: ["lg"],
      sorter: { compare: (a, b) => ("" + a.role).localeCompare(b.role) },
      render: (role) => (
        <Typography style={cellSubtextStyle}>{dicRole[role]}</Typography>
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      responsive: ["lg"],
      sorter: { compare: (a, b) => ("" + a.active).localeCompare(b.active) },
      render: (active) => {
        const isNegative = !active || active === "Pending";
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "16px",
              width: "fit-content",
              background: isNegative ? "#ffefef" : "var(--success-50, #ECFDF3)",
            }}
          >
            <Icon
              icon="tabler:point-filled"
              color={isNegative ? "#d31717" : "#12B76A"}
            />
            <Typography
              style={{
                ...cellSubtextStyle,
                color: isNegative ? "#d31717" : "var(--success-700, #027A48)",
              }}
            >
              {renderStatus(active)}
            </Typography>
          </span>
        );
      },
    },
    {
      title: "Email address",
      dataIndex: "email",
      responsive: ["lg"],
      sorter: { compare: (a, b) => ("" + a.email).localeCompare(b.email) },
    },
  ];

  const getTableData = () => {
    const list = employeeListRef.current;
    const result = [];
    let index = list.length - 1;
    for (let data of list) {
      result.splice(index, 0, {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        role: data.role,
        active: data.status,
        entireData: data,
        key: data.email,
      });
      index--;
    }
    return result;
  };

  const tableData = getTableData();

  const bodyModal = () => (
    <Grid container margin={"15px 0 0 0"} padding={0}>
      <Grid
        item
        xs={12}
        display={"flex"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        border={"1px solid var(--gray-200, #eaecf0)"}
        borderRadius={"12px 12px 0 0"}
        padding={"8px 12px"}
        marginBottom={-1}
      >
        <GrayButtonComponent
          title="Refresh"
          iconLeading={<Icon icon="jam:refresh" />}
          func={() => companiesEmployees.refetch()}
          size="sm"
        />
      </Grid>

      {tableData.length > 0 && (
        <BaseTable
          style={{ width: "100%", cursor: "pointer" }}
          dataSource={tableData}
          columns={columns}
          rowClassName="editable-row"
          className="table-ant-customized"
          rowSelection={{ type: selectionType, ...rowSelection }}
        />
      )}

      <Grid item xs={12} marginTop={"0.5rem"}>
        <DangerButtonConfirmationComponent
          confirmationTitle="Are you sure you want to delete the selected staff members?"
          title="Delete staff members"
          func={handleDeleteStaffMember}
          styles={{ width: "100%" }}
        />
      </Grid>
    </Grid>
  );

  if (!companiesEmployees.data) return null;

  return (
    <>
      {contextHolder}
      <ModalUX
        title={<p style={TextFontSize30LineHeight38}>Deleting staff members</p>}
        openDialog={modalState}
        closeModal={() => setModalState(false)}
        body={bodyModal()}
      />
    </>
  );
};

DeleteStaffMember.propTypes = {
  modalState: PropTypes.bool,
  setModalState: PropTypes.func,
};

export default DeleteStaffMember;
