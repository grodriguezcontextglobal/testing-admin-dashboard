import { DeleteOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Form,
  List,
  Select,
  Typography,
  message,
} from "antd";
import { groupBy } from "lodash";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import DangerButtonComponent from "../../../../../../components/UX/buttons/DangerButton";

const { Title, Text } = Typography;

const AssignLocationManager = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch inventory locations
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

  // Fetch existing managed locations
  const { data: managedLocationsData, isLoading: isLoadingManaged } = useQuery({
    queryKey: ["managedLocations", profile.adminUserInfo.id],
    queryFn: () =>
      devitrakApi.get(
        `/db_location_manager?staff_id=${profile.adminUserInfo.id}&company_id=${user.sqlInfo.company_id}`
      ),
    enabled: !!profile.adminUserInfo.id && !!user.sqlInfo.company_id,
  });

  const managedLocations = managedLocationsData?.data?.result || [];

  const onFinish = async (values) => {
    try {
      await devitrakApi.post("/db_location_manager", {
        company_id: user.sqlInfo.company_id,
        staff_id: profile.adminUserInfo.id,
        location: values.location,
      });
      message.success("Location manager assigned successfully.");
      form.resetFields();
      queryClient.invalidateQueries({queryKey: ["managedLocations", profile.adminUserInfo.id]});
    } catch (error) {
      console.error(error);
      message.error("Failed to assign location manager.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await devitrakApi.delete("/db_location_manager", {
        data: { id },
      });
      message.success("Location manager assignment removed.");
      queryClient.invalidateQueries(["managedLocations"]);
    } catch (error) {
      console.error(error);
      message.error("Failed to remove assignment.");
    }
  };

  return (
    <Card style={{ maxWidth: 600, margin: "20px auto" }}>
      <Title level={4}>Assign Location Manager</Title>
      <Typography.Paragraph>
        Assign this staff member as a manager for specific locations.
      </Typography.Paragraph>
      <Form form={form} onFinish={onFinish} layout="vertical">
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
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Assign Manager
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      <Title level={5}>Managed Locations</Title>
      <List
        loading={isLoadingManaged}
        bordered
        dataSource={managedLocations}
        renderItem={(item) => (
          <List.Item
            actions={[
              <DangerButtonComponent 
                key={item.id}
                title="Remove Manager"
                func={() => handleDelete(item.id)}
                icon={<DeleteOutlined />}
                buttonType="button"
                titleStyles={{
                  textTransform: "none",
                  with: "100%",
                  gap: "2px",
                }}
              />,
            ]}
          >
            <Text>{item.location}</Text>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AssignLocationManager;
