import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { Button, Form, Input, message, Select, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import ArrowBackIcon from "../../../components/icons/arrow-left.svg";

const EditDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await devitrakApi.get(`/document/${id}`);
        form.setFieldsValue(response.data.document);
      } catch (error) {
        message.error("Error fetching document. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, form]);

  const handleBack = () => {
    navigate(-1);
  };

  const onFinish = async (values) => {
    try {
      await devitrakApi.put(`/document/${id}`, values);
      message.success("Document updated successfully");
      navigate(`/profile/documents/view/${id}`);
    } catch (error) {
      message.error("Failed to update document");
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Spin size="large" />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            type="text"
            icon={<img src={ArrowBackIcon} alt="back" />}
            onClick={handleBack}
          />
          <Typography variant="h5">Edit Document</Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Form.Item
                  name="title"
                  label="Title"
                  rules={[{ required: true, message: "Please enter title" }]}
                >
                  <Input />
                </Form.Item>
              </Grid>
              <Grid item xs={12}>
                <Form.Item
                  name="description"
                  label="Description"
                  rules={[{ required: true, message: "Please enter description" }]}
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Grid>
              <Grid item xs={12} md={6}>
                <Form.Item
                  name="document_type"
                  label="Document Type"
                  rules={[{ required: true, message: "Please select document type" }]}
                >
                  <Select>
                    <Select.Option value="policy">Policy</Select.Option>
                    <Select.Option value="procedure">Procedure</Select.Option>
                    <Select.Option value="form">Form</Select.Option>
                    <Select.Option value="guide">Guide</Select.Option>
                  </Select>
                </Form.Item>
              </Grid>
              <Grid item xs={12} md={6}>
                <Form.Item
                  name="trigger_action"
                  label="When Displayed"
                  rules={[{ required: true, message: "Please select when to display" }]}
                >
                  <Select>
                    <Select.Option value="on_login">On Login</Select.Option>
                    <Select.Option value="on_request">On Request</Select.Option>
                    <Select.Option value="scheduled">Scheduled</Select.Option>
                  </Select>
                </Form.Item>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button onClick={handleBack}>Cancel</Button>
                  <Button type="primary" htmlType="submit">
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        </Paper>
      </Stack>
    </Box>
  );
};

export default EditDocument;