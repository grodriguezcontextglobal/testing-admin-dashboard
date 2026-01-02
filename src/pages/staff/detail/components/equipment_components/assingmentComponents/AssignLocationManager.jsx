import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  List,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { groupBy } from "lodash";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import DangerButtonComponent from "../../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { onAddStaffProfile } from "../../../../../../store/slices/staffDetailSlide";

const { Title, Text } = Typography;

const AssignLocationManager = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const dispatch = useDispatch();
  // 1. Fetch Company Data (MongoDB)
  const { data: companyDataQuery, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["companyData", user.companyData.id, { type: "done" }],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    enabled: !!user.companyData.id,
  });

  // 2. Fetch Inventory Locations (for options)
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["inventoryForLocations", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  const locations = inventoryData?.data?.items
    ? Object.keys(groupBy(inventoryData.data.items, "location"))
    : [];

  const options = locations.map((loc) => ({ label: loc, value: loc }));

  // Get current employee data
  const companyInfo = companyDataQuery?.data?.company?.[0];
  const currentEmployeeIndex = companyInfo?.employees?.findIndex(
    (e) => e.user === profile.email
  );
  const currentEmployee =
    currentEmployeeIndex > -1
      ? companyInfo.employees[currentEmployeeIndex]
      : null;

  const managerLocations = currentEmployee?.preference?.managerLocation || [];

  const onFinish = async (values) => {
    if (!companyInfo || !currentEmployee) return;
    setLoadingUpdate(true);
    try {
      const newPermissions = {
        create: values.create || false,
        update: values.update || false,
        transfer: values.transfer || false,
        delete: values.delete || false,
      };

      const newAssignment = {
        location: values.location,
        actions: newPermissions,
      };
      let updatedManagerLocations = [...managerLocations];
      const existingIndex = updatedManagerLocations.findIndex(
        (m) => m.location === values.location
      );
      if (existingIndex > -1) {
        updatedManagerLocations[existingIndex] = newAssignment;
      } else {
        updatedManagerLocations.push(newAssignment);
      }
      // Sync with 'location' string array
      const updatedLocationStrings = updatedManagerLocations.map(
        (m) => m.location
      );

      const updatedEmployees = [...companyInfo.employees];
      updatedEmployees[currentEmployeeIndex] = {
        ...currentEmployee,
        preference: {
          ...currentEmployee.preference,
          inventory_location: updatedLocationStrings, // Set the array directly
          managerLocation: updatedManagerLocations,
        },
      };
      // Update company data in MongoDB
      const updatingCompanyEmployeePreference = await devitrakApi.patch(
        `/company/update-company/${companyInfo.id}`,
        {
          employees: updatedEmployees,
        }
      );

      message.success("Location manager assigned/updated successfully.");
      form.resetFields();
      setEditingLocation(null);
      queryClient.invalidateQueries({
        queryKey: ["companyData", user.companyData.id, { type: "done" }],
        exact: true,
        refetchType: "active",
      });
      dispatch(
        onAddStaffProfile({
          ...profile,
          preference: {
            ...updatingCompanyEmployeePreference.data.company.employees[
              currentEmployeeIndex
            ].preference,
          },
          companyData:
            updatingCompanyEmployeePreference.data.company ??
            profile.companyData,
        })
      );
    } catch (error) {
      console.error(error);
      message.error("Failed to assign location manager.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleDelete = async (locationToDelete) => {
    if (!companyInfo || !currentEmployee) return;
    setLoadingUpdate(true);
    try {
      const updatedManagerLocations = managerLocations.filter(
        (m) => m.location !== locationToDelete
      );
      const updatedLocationStrings = updatedManagerLocations.map(
        (m) => m.location
      );

      const updatedEmployees = [...companyInfo.employees];
      updatedEmployees[currentEmployeeIndex] = {
        ...currentEmployee,
        preference: {
          ...currentEmployee.preference,
          inventory_location: updatedLocationStrings, // Set the array directly
          managerLocation: updatedManagerLocations,
        },
      };

      await devitrakApi.patch(`/company/update-company/${companyInfo.id}`, {
        employees: updatedEmployees,
      });

      message.success("Location assignment removed.");
      queryClient.invalidateQueries(["companyData", user.companyData.id]);
    } catch (error) {
      console.error(error);
      message.error("Failed to remove assignment.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  /**
   * Populates the form with the selected location's data for editing.
   * Handles the preference schema structure:
   * - location: string (optional)
   * - actions: object (optional) with boolean flags
   *
   * @param {Object} item - The manager location object to edit
   */
  const handleEdit = (item) => {
    // Validate item structure
    if (!item || typeof item !== "object") {
      console.error("Invalid item passed to handleEdit");
      return;
    }

    const locationName = item.location || "";
    const actions = item.actions || {};

    setEditingLocation(locationName);

    // Set form values with defaults for missing fields
    form.setFieldsValue({
      location: locationName,
      create: Boolean(actions.create),
      update: Boolean(actions.update),
      transfer: Boolean(actions.transfer),
      delete: Boolean(actions.delete),
    });
  };

  return (
    <Card
      style={{ maxWidth: 800, margin: "20px auto" }}
      loading={isLoadingCompany}
    >
      <Title level={4}>Assign Location Manager</Title>
      <Typography.Paragraph>
        Assign this staff member as a manager for specific locations and define
        permissions.
      </Typography.Paragraph>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: "Please select a location" }]}
            >
              <Select
                options={options}
                loading={isLoadingInventory}
                placeholder="Select a location"
                showSearch
                disabled={!!editingLocation} // Disable location change when editing
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Permissions">
              <Row>
                <Col span={6}>
                  <Form.Item name="create" valuePropName="checked" noStyle>
                    <Checkbox>Create</Checkbox>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="update" valuePropName="checked" noStyle>
                    <Checkbox>Update</Checkbox>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="transfer" valuePropName="checked" noStyle>
                    <Checkbox>Transfer</Checkbox>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="delete" valuePropName="checked" noStyle>
                    <Checkbox>Delete</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loadingUpdate}>
              {editingLocation ? "Update Assignment" : "Assign Manager"}
            </Button>
            {editingLocation && (
              <Button
                onClick={() => {
                  setEditingLocation(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>

      <Divider />

      <Title level={5}>Managed Locations</Title>
      <List
        loading={isLoadingCompany || loadingUpdate}
        bordered
        dataSource={managerLocations}
        renderItem={(item) => (
          <List.Item
            actions={[
              <GrayButtonComponent
                key="edit"
                title="Edit"
                func={() => handleEdit(item)}
                icon={<EditOutlined />}
                buttonType="button"
                style={{ width: "fit-content" }}
              />,
              <DangerButtonComponent
                key="delete"
                title="Remove"
                func={() => handleDelete(item.location)}
                icon={<DeleteOutlined />}
                buttonType="button"
                style={{ width: "fit-content" }}
              />,
            ]}
          >
            <List.Item.Meta
              title={<Text strong>{item.location}</Text>}
              description={
                <Space wrap>
                  {item.actions.create && <Tag color="green">Create</Tag>}
                  {item.actions.update && <Tag color="blue">Update</Tag>}
                  {item.actions.transfer && <Tag color="orange">Transfer</Tag>}
                  {item.actions.delete && <Tag color="red">Delete</Tag>}
                  {!Object.values(item.actions).some(Boolean) && (
                    <Tag>Read Only</Tag>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AssignLocationManager;
