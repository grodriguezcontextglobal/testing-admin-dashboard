import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  Popconfirm,
  Select,
  Table,
  Typography,
  notification,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { onAddStaffProfile } from "../../store/slices/staffDetailSlide";
import CenteringGrid from "../../styles/global/CenteringGrid";
import '../../styles/global/ant-table.css';
const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  children,
  ...restProps
}) => {
  const inputNode =
    inputType === "text" ? (
      <Select
        options={[
          {
            value: "Administrator",
            label: "Administrator",
          },
          {
            value: "Approver",
            label: "Approver",
          },
          {
            value: "Editor",
            label: "Editor",
          },
        ]}
      />
    ) : null;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};
const MainAdminSettingPage = ({ searchAdmin, modalState }) => {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState("");
  const [api, contextHolder] = notification.useNotification();
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  useEffect(() => {
    const controller = new AbortController()
    listAdminUsers.refetch()
    companiesEmployees.refetch()
    return () => {
      controller.abort()
    }
  }, [user.company, modalState, editingKey])

  const queryClient = useQueryClient();
  const openNotification = (props) => {
    api.open({
      message: `${props ? "Updated" : "Upps"}`,
      description: `${props
        ? "Role has been updated"
        : "Somethings went wrong, please try later"
        }`,
      className: "custom-class",
      style: {
        width: 300,
      },
    });
  };

  const isEditing = (record) => record.key === editingKey;
  const edit = (record) => {
    const { entireData } = record;
    form.setFieldsValue({
      role: "",
      ...entireData,
    });
    setEditingKey(record.key);
  };
  const cancel = () => {
    setEditingKey("");
  };
  const save = async (record) => {
    try {
      const row = await form.validateFields();
      const employees = companiesEmployees.data.data.company[0].employees
      const foundEmployee = employees.findIndex(element => element.user === record.email)
      const result = employees.toSpliced(foundEmployee, 1, { ...employees[foundEmployee], role: row.role })
      const respoUpdateRoleStaffInCompany = await devitrakApi.patch(`/company/update-company/${companiesEmployees?.data?.data?.company?.at(-1).id}`, {
        employees: result
      })
      if (respoUpdateRoleStaffInCompany.data.ok) {
        queryClient.invalidateQueries('listOfAdminUsers')
        queryClient.invalidateQueries('employeesPerCompanyList')
        listAdminUsers.refetch()
        companiesEmployees.refetch()
        setEditingKey("")
        openNotification(true)
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
      openNotification(false);
    }
  };

  const handleDetailStaff = (record) => {
    dispatch(onAddStaffProfile(record.entireData));
    return navigate(`/staff/${record.entireData.adminUserInfo.id}/events`)
  };
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      align: "left",
      width: "25%",
      sorter: {
        compare: (a, b) => ("" + a.name).localeCompare(b.name),
      },
      render: (name) => (
        <span key={`${name}`}>
          {name.map((detail, index) => {
            return (
              <div
                key={`render-name-row-${index}`}
                style={{
                  flexDirection: "column",
                  color: `${index === 0
                    ? "var(--gray-900, #101828)"
                    : "var(--gray-600, #475467)"
                    }`,
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: `${index === 0 ? "500" : null}`,
                }}
              >
                <Typography
                  fontSize={"12px"}
                  fontFamily={"Inter"}
                  fontStyle={"normal"}
                  fontWeight={500}
                  lineHeight={"18px"}
                  textAlign={"center"}
                  textTransform={"capitalize"}
                >
                  {detail}
                </Typography>
              </div>
            );
          })}
        </span>
      ),
    },
    {
      title: "Status",
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
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
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
          fontSize={"12px"}
          fontFamily={"Inter"}
          fontStyle={"normal"}
          fontWeight={500}
          lineHeight={"18px"}
          textAlign={"center"}
          textTransform={"capitalize"}
        >
          {role}
        </Typography>
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
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record)}
              style={{
                marginRight: 8,
              }}
            >
              <Icon icon="tabler:check" width={25} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <Icon
                icon="material-symbols:cancel-outline"
                width={25}
                color="#ee1515"
              />
            </Popconfirm>
          </span>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            {record.active !== "Pending" && user.role === "Administrator" && <Typography.Link
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
            >
              <Icon icon="fluent:edit-16-regular" width={25} />
            </Typography.Link>}
            {record.active !== "Pending" && <Typography.Link
              disabled={editingKey !== ""}
              onClick={() => handleDetailStaff(record)}
            >
              <Icon icon="bxs:user-detail" width={30} />
            </Typography.Link>}
          </div>
        );
      },
    },
  ];

  const employeeListRef = useRef([])
  if (companiesEmployees.isLoading) return <div style={CenteringGrid}><Loading /></div>
  if (companiesEmployees.data) {
    const employees = async () => {
      const result = new Set()
      const companiesData = companiesEmployees.data.data.company[0].employees
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
    employees()

    const sortDataAdminUser = () => {
      if (searchAdmin?.length > 0) {
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
          name: [data.firstName, data.lastName],
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
    const mergedColumns = columns.map((col) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: (record) => ({
          record,
          inputType: col.dataIndex === "role" ? "text" : null,
          dataIndex: col.dataIndex,
          title: col.title,
          editing: isEditing(record),
        }),
      };
    });
    return (
      <>
        {contextHolder}
        <Form form={form} component={false}>
          <Table
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            dataSource={getInfoNeededToBeRenderedInTable()}
            columns={mergedColumns}
            rowClassName="editable-row"
            pagination={{
              onChange: cancel,
            }}
            className="table-ant-customized"
          />
        </Form>{" "}
      </>
    );
  }
};

export default MainAdminSettingPage;
