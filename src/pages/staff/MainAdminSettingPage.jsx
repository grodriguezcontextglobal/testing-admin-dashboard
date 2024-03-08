import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Form,
  Select,
  Popconfirm,
  Table,
  Typography,
  notification,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import '../../styles/global/ant-table.css'
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import CenteringGrid from "../../styles/global/CenteringGrid";
import Loading from "../../components/animation/Loading";
import { onAddStaffProfile } from "../../store/slices/staffDetailSlide";
const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
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
const MainAdminSettingPage = ({ searchAdmin }) => {
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
  });

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
      const { entireData } = record;
      const adminProfile = {
        ...entireData,
        role: row.role,
      };
      const respo = await devitrakApiAdmin.patch(
        `/profile/${adminProfile.id}`,
        adminProfile
      );
      if (respo) {
        queryClient.invalidateQueries("listOfAdminUsers");
        openNotification(true);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
      openNotification(false);
    }
  };

  const handleDetailStaff = (record) => {
    dispatch(onAddStaffProfile(record.entireData));
    navigate(`/staff/${record.entireData.id}`);
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
            background: `${!active ? "#ffefef" : "var(--success-50, #ECFDF3)"}`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${!active ? "#d31717" : "var(--success-700, #027A48)"}`}
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
              color={`${!active ? "#d31717" : "#12B76A"}`}
            />
            {active ? "Active" : "Inactive"}
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
            {user.role === 'Administrator' && <Typography.Link
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
            >
              <Icon icon="fluent:edit-16-regular" width={25} />
            </Typography.Link>}
            <Typography.Link
              disabled={editingKey !== ""}
              onClick={() => handleDetailStaff(record)}
            >
              <Icon icon="bxs:user-detail" width={30} />
            </Typography.Link>
          </div>
        );
      },
    },
  ];

  if (listAdminUsers.isLoading) return <div style={CenteringGrid}><Loading /></div>
  if (listAdminUsers.data) {
    const sortDataAdminUser = () => {
      if (searchAdmin?.length > 0) {
        const check = listAdminUsers.data.data.adminUsers?.filter(
          (item) =>
          String(item?.name)?.toLowerCase().includes(searchAdmin.toLowerCase()) ||
          String(item?.lastName)?.toLowerCase().includes(searchAdmin.toLowerCase()) ||
          String(item?.email)?.toLowerCase().includes(searchAdmin.toLowerCase())
        );
        return check;
      }
      return listAdminUsers.data.data.adminUsers
    }
    const getInfoNeededToBeRenderedInTable = () => {
      let result = [];
      let index = sortDataAdminUser().length - 1;
      const notElementToDelete = 0;
      let mapTemplate = {};
      for (let data of sortDataAdminUser()) {
        mapTemplate = {
          name: [data.name, data.lastName],
          email: data.email,
          role: data.role,
          active: data.active,
          entireData: data,
          key: data.id,
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
