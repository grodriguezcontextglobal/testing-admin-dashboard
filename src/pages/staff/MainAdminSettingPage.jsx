import { Icon } from "@iconify/react";
import { Button, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Table,
  Typography
} from "antd";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { onAddStaffProfile } from "../../store/slices/staffDetailSlide";
import CenteringGrid from "../../styles/global/CenteringGrid";
import '../../styles/global/ant-table.css';
const MainAdminSettingPage = ({ searchAdmin, modalState }) => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation()
  const listAdminUsers = useQuery({
    queryKey: ["listOfAdminUsers"],
    queryFn: () => devitrakApi.post("/staff/admin-users", {
      company: user.company
    }),
    enabled: false,
    refetchOnMount: false,
  });

  const companiesEmployees = useQuery({
    queryKey: ['employeesPerCompanyList'],
    queryFn: () => devitrakApi.post('/company/search-company', {
      company_name: user.company
    }),
    enabled: false,
    refetchOnMount: false,
  })

  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () => devitrakApi.post("/event/event-list", {
      company: user.company,
      active: true
    }),
    enabled: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController()
    listAdminUsers.refetch()
    companiesEmployees.refetch()
    eventQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [location.key, user.company, modalState])  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleDetailStaff = (record) => {
    dispatch(onAddStaffProfile(record.entireData));
    return navigate(`/staff/${record.entireData.adminUserInfo.id}/main`)
  };

  const styling = {
    fontSize: "12px",
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "18px",
    textAlign: "left",
    textTransform: "capitalize",
    justifyContent: "flex-start",
    color: "var(--gray-600, #475467)"
  }
  const employeeListRef = useRef([])

  const employees = async () => {
    const result = new Set()
    const companiesData = companiesEmployees?.data?.data?.company[0]?.employees ?? []
    for (let data of companiesData) {
      const individual = await devitrakApi.post('/staff/admin-users', {
        email: data.user
      })
      if (individual.data) {
        result.add({ ...data, email: data.user, status: data.status === "Pending" ? data.status : data.active, adminUserInfo: individual.data.adminUsers[0], companyData: companiesEmployees.data.data.company[0] })
      } else {
        result.add({ ...data, status: data.status === "Pending" ? data.status : data.active, companyData: companiesEmployees.data.data.company[0], adminUserInfo: null })
      }
    }
    return employeeListRef.current = Array.from(result)
  }
  useEffect(() => {
    const controller = new AbortController()
    employees()
    return () => {
      controller.abort()
    }
  }, [location.key, companiesEmployees.data, searchAdmin])  // eslint-disable-next-line react-hooks/exhaustive-deps

  if (companiesEmployees.isLoading) return <div style={CenteringGrid}><Loading /></div>
  if (companiesEmployees.data) {
    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        align: "left",
        width: "25%",
        sorter: {
          compare: (a, b) => ("" + a.name).localeCompare(b.name),
        },
        render: (name, record) => {
          const initials = String(name).split(" ")
          return (
            <span key={`${name}`} style={{ width: "100%", display: "flex", justifyContent: "flex-start", alignSelf: "flex-start" }}>
              <Avatar src={record?.entireData?.adminUserInfo?.imageProfile}>{!record?.entireData?.adminUserInfo?.imageProfile && initials.map(initial => initial[0])}</Avatar>&nbsp;
              <div style={{
                width: "70%",
                flexDirection: "column",
                justifyContent: "flex-start"
              }}>
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
                <Typography
                  style={styling}
                >
                  {record?.entireData?.adminUserInfo?.phone ? record.entireData.adminUserInfo.phone : '+1-000-000-0000'}
                </Typography>
              </div>
            </span >
          )
        },
      },
      {
        title: "Role",
        dataIndex: "role",
        width: "10%",
        responsive: ['lg'],
        editable: true,
        sorter: {
          compare: (a, b) => ("" + a.role).localeCompare(b.role),
        },
        render: (role) => (
          <Typography
            style={styling}
          >
            {role}
          </Typography>
        ),
      },
      {
        title: "At event",
        dataIndex: "active",
        width: "10%",
        responsive: ['lg'],
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
              background: `${(!active || active === 'Pending') ? "#ffefef" : "var(--success-50, #ECFDF3)"}`,
              width: "fit-content",
            }}
          >
            <Typography
              color={`${(!active || active === 'Pending') ? "#d31717" : "var(--success-700, #027A48)"}`}
              style={styling}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={`${(!active || active === 'Pending') ? "#d31717" : "#12B76A"}`}
              />
              {active === 'Pending' ? active : active ? "Active" : "Inactive"}
            </Typography>
          </span>
        ),
      },
      {
        title: "Devices",
        dataIndex: "active",
        width: "10%",
        responsive: ['lg'],
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
              background: `${(!active || active === 'Pending') ? "#ffefef" : "var(--success-50, #ECFDF3)"}`,
              width: "fit-content",
            }}
          >
            <Typography
              color={`${(!active || active === 'Pending') ? "#d31717" : "var(--success-700, #027A48)"}`}
              style={styling}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={`${(!active || active === 'Pending') ? "#d31717" : "#12B76A"}`}
              />
              {active === 'Pending' ? active : active ? "Active" : "Inactive"}
            </Typography>
          </span>
        ),
      },
      {
        title: "Event status",
        dataIndex: "active",
        width: "10%",
        responsive: ['lg'],
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
              background: `${(!active || active === 'Pending') ? "#ffefef" : "var(--success-50, #ECFDF3)"}`,
              width: "fit-content",
            }}
          >
            <Typography
              color={`${(!active || active === 'Pending') ? "#d31717" : "var(--success-700, #027A48)"}`}
              style={styling}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={`${(!active || active === 'Pending') ? "#d31717" : "#12B76A"}`}
              />
              {active === 'Pending' ? active : active ? "Active" : "Inactive"}
            </Typography>
          </span>
        ),
      },
      {
        title: "Email address",
        dataIndex: "email",
        width: "30%",
        responsive: ['lg'],
        sorter: {
          compare: (a, b) => ("" + a.email).localeCompare(b.email),
        },
      },
      {
        title: "",
        key: "action",
        align: "center",
        width: "5%",
        render: (_, record) => {
          return (
            <>
              {
                record.active !== "Pending" && <Typography.Link
                  // disabled={editingKey !== ""}
                  onClick={() => handleDetailStaff(record)}
                >
                  <Icon icon="bxs:user-detail" width={30} />
                </Typography.Link>
              }
            </>
          )
        },
      },
    ];

    const sortDataAdminUser = () => {
      if (String(searchAdmin)?.length > 0) {
        const check = employeeListRef.current.filter(
          (item) =>
            String(item?.name)?.toLowerCase().includes(`${searchAdmin}`.toLowerCase()) ||
            String(item?.lastName)?.toLowerCase().includes(`${searchAdmin}`.toLowerCase()) ||
            String(item?.email)?.toLowerCase().includes(`${searchAdmin}`.toLowerCase())
        );
        return check;
      }
      return employeeListRef.current
    }
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

    return (
      <Grid margin={'15px 0 0 0'} padding={0} container>
        <Grid
          border={"1px solid var(--gray-200, #eaecf0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          justifyContent={'space-between'}
          alignItems={"center"}
          marginBottom={-1}
          paddingBottom={-1}
          item
          xs={12}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            marginRight: "5px",
            padding: "0 0 0 0"
          }}>
            <Button style={{ display: "flex", alignItems: "center" }} onClick={() => {
              listAdminUsers.refetch();
              companiesEmployees.refetch()
            }}>
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
          style={{ width: "100%" }}
          dataSource={getInfoNeededToBeRenderedInTable()}
          columns={columns}
          rowClassName="editable-row"
          className="table-ant-customized"
        />

      </Grid>
    );
  }
};

export default MainAdminSettingPage;
