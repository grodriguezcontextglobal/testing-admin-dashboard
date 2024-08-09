import { Icon } from "@iconify/react";
import { Button, Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Modal, Table, Typography, notification } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import dicRole from "../../../components/general/dicRole";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { onLogin } from "../../../store/slices/adminSlice";

const DeleteStaffMember = ({ modalState, setModalState }) => {
  const [selectionType] = useState("checkbox");
  const [staffMemberList, setStaffMemberList] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const dispatch = useDispatch();
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
        active: true,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    companiesEmployees.refetch();
    eventQuery.refetch();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, user.company, modalState]);

  const queryClient = useQueryClient();
  function closeModal() {
    setModalState(false);
  }

  const styling = {
    fontSize: "12px",
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "18px",
    textAlign: "left",
    textTransform: "capitalize",
    justifyContent: "flex-start",
    color: "var(--gray-600, #475467)",
  };
  const employeeListRef = useRef([]);
  const employees = async () => {
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
    return (employeeListRef.current = Array.from(result));
  };
  useEffect(() => {
    const controller = new AbortController();
    employees();
    return () => {
      controller.abort();
    };
  }, [location.key, companiesEmployees.data]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.open({
      message: "Staff members deleted",
    });
  };
  const renderTernary = (props) => {
    if (typeof props === "string") {
      return props;
    } else {
      if (props) return "Active";
      return "Inactive";
    }
  };
  if (companiesEmployees.data) {
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        setStaffMemberList(selectedRows);
      },
      getCheckboxProps: (record) => ({
        disabled: Number(record.role) === 0,
        // Column configuration not to be checked
        name: record.name,
      }),
    };

    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        align: "left",
        sorter: {
          compare: (a, b) => ("" + a.name).localeCompare(b.name),
        },
        render: (name, record) => {
          const initials = String(name).split(" ");
          return (
            <span
              key={`${name}`}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignSelf: "flex-start",
              }}
            >
              <Avatar src={record?.entireData?.adminUserInfo?.imageProfile}>
                {!record?.entireData?.adminUserInfo?.imageProfile &&
                  initials.map((initial) => initial[0])}
              </Avatar>
              &nbsp;
              <div
                style={{
                  width: "70%",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Typography
                  style={{
                    justifyContent: "flex-start",
                    color: "var(--gray900, #101828)",
                    fontSize: "14px",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                    fontWeight: 500,
                  }}
                >
                  {name}
                </Typography>
                <Typography style={styling}>
                  {record?.entireData?.adminUserInfo?.phone
                    ? record.entireData.adminUserInfo.phone
                    : "+1-000-000-0000"}
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
        editable: true,
        sorter: {
          compare: (a, b) => ("" + a.role).localeCompare(b.role),
        },
        render: (role) => (
          <Typography style={styling}>{dicRole[role]}</Typography>
        ),
      },
      {
        title: "Status",
        dataIndex: "active",
        responsive: ["lg"],
        editable: true,
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
              background: `${
                !active || active === "Pending"
                  ? "#ffefef"
                  : "var(--success-50, #ECFDF3)"
              }`,
              width: "fit-content",
            }}
          >
            <Typography
              color={`${
                !active || active === "Pending"
                  ? "#d31717"
                  : "var(--success-700, #027A48)"
              }`}
              style={styling}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={`${
                  !active || active === "Pending" ? "#d31717" : "#12B76A"
                }`}
              />
              {renderTernary(active)}
            </Typography>
          </span>
        ),
      },
      {
        title: "Email address",
        dataIndex: "email",
        responsive: ["lg"],
        sorter: {
          compare: (a, b) => ("" + a.email).localeCompare(b.email),
        },
      },
    ];

    const handleDeleteStaffMember = async () => {
      const employeeList = user.companyData.employees;
      const updatedEmployeeList = new Set();
      for (let data of employeeList) {
        if (!staffMemberList.some((element) => element.email === data.user)) {
          updatedEmployeeList.add(data);
        }
      }
      const response = await devitrakApi.patch(
        `/company/update-company/${user.companyData.id}`,
        {
          employees: Array.from(updatedEmployeeList),
        }
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
        queryClient.invalidateQueries({
          queryKey: ["listOfAdminUsers"],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["employeesPerCompanyList"],
          exact: true,
        });

        queryClient.invalidateQueries({
          queryKey: ["events"],
          exact: true,
        });
        openNotification();
        return closeModal();
      }
    };
    const sortDataAdminUser = () => {
      return employeeListRef.current;
    };
    const getInfoNeededToBeRenderedInTable = () => {
      let result = [];
      let index = sortDataAdminUser().length - 1;
      const notElementToDelete = 0;
      let mapTemplate = {};
      for (let data of sortDataAdminUser()) {
        mapTemplate = {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          role: data.role,
          active: data.status,
          entireData: data,
          key: data.email,
        };
        result.splice(index, notElementToDelete, mapTemplate);
        index--;
      }
      return result;
    };
    const renderTitle = () => {
      return <p style={TextFontSize30LineHeight38}>Deleting staff members</p>;
    };

    return (
      <Modal
        title={renderTitle()}
        centered
        open={modalState}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        footer={[]}
        width={1000}
        maskClosable={false}
        style={{
          zIndex: 30,
          margin: "12dvh 0 0",
        }}
      >
        {contextHolder}
        <Grid margin={"15px 0 0 0"} padding={0} container>
          <Grid
            border={"1px solid var(--gray-200, #eaecf0)"}
            borderRadius={"12px 12px 0 0"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            marginBottom={-1}
            paddingBottom={-1}
            item
            xs={12}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: "5px",
                padding: "0 0 0 0",
              }}
            >
              <Button
                style={{
                  display: "flex",
                  alignItems: "center",
                  outline: "none",
                  backgroundColor: "transparent",
                }}
                onClick={() => {
                  companiesEmployees.refetch();
                }}
              >
                <p
                  style={{
                    textTransform: "none",
                    textAlign: "left",
                    fontWeight: 500,
                    fontSize: "12px",
                    fontFamily: "Inter",
                    lineHeight: "28px",
                    color: "var(--blue-dark-700, #004EEB)",
                    padding: "0px",
                  }}
                >
                  <Icon icon="jam:refresh" /> Refresh
                </p>
              </Button>
            </div>
          </Grid>
          <Table
            style={{ width: "100%", cursor: "pointer" }}
            dataSource={getInfoNeededToBeRenderedInTable()}
            columns={columns}
            rowClassName="editable-row"
            className="table-ant-customized"
            rowSelection={{
              type: selectionType,
              ...rowSelection,
            }}
          />
        </Grid>
        <button
          onClick={() => handleDeleteStaffMember()}
          style={{ ...DangerButton, width: "100%", margin: "20px 0" }}
        >
          <p style={DangerButtonText}>Delete staff members</p>
        </button>
      </Modal>
    );
  }
};

DeleteStaffMember.propTypes = {
  modalState: PropTypes.bool,
  setModalState: PropTypes.func,
};
export default DeleteStaffMember;
