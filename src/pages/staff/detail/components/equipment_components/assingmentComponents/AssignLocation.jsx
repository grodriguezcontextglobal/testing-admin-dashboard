import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Form,
  message,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { onAddStaffProfile } from "../../../../../../store/slices/staffDetailSlide";

const { Title, Text } = Typography;

const AssignLocation = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
const dispatch = useDispatch()
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["inventoryForLocations", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: Number(
            user.companyData.employees.find((emp) => emp.user === user.email)
              .role
          ),
          preference:
            user.companyData.employees.find((emp) => emp.user === user.email)
              .preference || [],
        }
      ),
    enabled: !!user.sqlInfo.company_id && !!user.email,
  });

  const locations = inventoryData?.data?.data ? Object.keys(inventoryData.data.data) : [];

  const options = locations.map((loc) => ({ label: loc, value: loc }));

  useEffect(() => {
    if (profile?.preference?.inventory_location) {
      form.setFieldsValue({
        location: profile.preference.inventory_location,
      });
    }
  }, [profile, form]);

  const onFinish = async (values) => {
    try {
      // Fetch latest company data to ensure we have the most current employees list
      const companyResponse = await devitrakApi.post(
        "/company/search-company",
        {
          _id: user.companyData.id,
        }
      );

      if (
        companyResponse.data &&
        companyResponse.data.company &&
        companyResponse.data.company.length > 0
      ) {
        const companyInfo = companyResponse.data.company[0];
        const employeesList = [...companyInfo.employees];

        const employeeIndex = employeesList.findIndex(
          (e) => e.user === profile.email
        );

        if (employeeIndex > -1) {
          // Update the specific employee's preference
          employeesList[employeeIndex] = {
            ...employeesList[employeeIndex],
            preference: {
              ...employeesList[employeeIndex].preference,
              inventory_location: values.location, // Set the array directly
            },
          };

          // Patch the company with the updated employees list
          const updatingCompanyEmployeePreference = await devitrakApi.patch(
            `/company/update-company/${user.companyData.id}`,
            {
              employees: employeesList,
            }
          );
          dispatch(onAddStaffProfile({
            ...profile,
            preference:{
              ...updatingCompanyEmployeePreference.data.company.employees[employeeIndex].preference,
              inventory_location: values.location,
            },
            companyData: updatingCompanyEmployeePreference.data.company ?? profile.companyData,
          }))
          message.success("Locations assigned successfully.");
          // Invalidate relevant queries or trigger a reload if needed
          queryClient.invalidateQueries({
            queryKey: ["staffProfile"],
            exact: true,
          });
          // Also update Redux if necessary, but invalidating queries should trigger re-fetch if components are set up correctly.
        } else {
          message.error("Employee not found in company records.");
        }
      } else {
        message.error("Failed to retrieve company data.");
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to assign locations.");
    }
  };

  const currentLocations = profile?.preference?.inventory_location || [];

  return (
    <Card style={{ maxWidth: 600, margin: "20px auto" }}>
      <Title level={4}>Assign Location Preference</Title>
      <Typography.Paragraph>
        Select locations to restrict this user&lsquo;s inventory visibility.
      </Typography.Paragraph>

      {currentLocations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Text strong>Currently Assigned Locations:</Text>
          <div style={{ marginTop: 8 }}>
            <Space size={[0, 8]} wrap>
              {currentLocations.map((loc) => (
                <Tag color="blue" key={loc}>
                  {loc}
                </Tag>
              ))}
            </Space>
          </div>
          <Divider />
        </div>
      )}

      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="location"
          label="Select Locations"
          rules={[
            { required: true, message: "Please select at least one location" },
          ]}
        >
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            options={options}
            loading={isLoadingInventory}
            placeholder="Select locations"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Update Assigned Locations
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AssignLocation;
