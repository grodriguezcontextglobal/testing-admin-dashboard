import { Grid, Paper } from "@mui/material";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Select
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { UploadIcon } from "../icons/UploadIcon";

const DocumentUpload = ({activeTab, refetch}) => {
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const { user } = useSelector((state) => state.admin);
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (values) => {
    if (!file) {
      return message.error("Please select a PDF file.");
    }

    const formDataToSend = new FormData();
    formDataToSend.append("document", file);
    formDataToSend.append("company_id", user.companyData.id);
    formDataToSend.append("created_by", user.uid);
    formDataToSend.append("at_", new Date().toISOString());
    formDataToSend.append("requires_signature", false);

    // Append all form fields
    Object.keys(values).forEach((key) => {
      if (
        key === "applicable_locations" ||
        key === "applicable_items" ||
        key === "applicable_events" ||
        key === "tags" ||
        key === "metadata" ||
        key === "document_config"
      ) {
        formDataToSend.append(key, JSON.stringify(values[key] || []));
      } else if (key === "expiration_date") {
        formDataToSend.append(key, values[key]?.toISOString());
      } 
      // else if (key === "requires_signature") {
      //   formDataToSend.append(key, String(values[key]));
      // } 
      else {
        formDataToSend.append(key, values[key]);
      }
    });

    try {
      const response = await devitrakApi.post(
        "/document/upload",
        formDataToSend
      );

      const data = await response.data
      if (data.ok) {
        form.resetFields();
        setFile(null);
        activeTab("1")
        return refetch()
      } else {
        console.error("Upload failed:", data.msg);
        throw Error(data.msg);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Form.Item label="Upload PDF Document">
              <input
                type="file"
                onChange={handleFileChange}
                style={{ ...OutlinedInputStyle }}
                id="pdf-upload"
                accept="application/pdf"
                label={
                  <Button component="span">
                    <UploadIcon />
                    Upload PDF
                  </Button>
                }
              />
            </Form.Item>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: "Please input the title!" }]}
            >
              <Input />
            </Form.Item>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Form.Item
              label="Document Type"
              name="document_type"
              rules={[
                { required: true, message: "Please select document type!" },
              ]}
            >
              <Select>
                <Select.Option value="policy">Policy</Select.Option>
                <Select.Option value="procedure">Procedure</Select.Option>
                <Select.Option value="form">Form</Select.Option>
              </Select>
            </Form.Item>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Form.Item label="Trigger Action" name="trigger_action">
              <Select>
                <Select.Option value="onboarding">Onboarding</Select.Option>
                <Select.Option value="annual">Annual</Select.Option>
                <Select.Option value="event">Event</Select.Option>
              </Select>
            </Form.Item>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Form.Item label="Language" name="language" initialValue="en">
              <Select>
                <Select.Option value="en">English</Select.Option>
                <Select.Option value="es">Spanish</Select.Option>
              </Select>
            </Form.Item>
          </Grid>

          <Grid item xs={12}>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Form.Item label="Expiration Date" name="expiration_date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Grid>

          {/* <Grid item xs={12} sm={6}>
            <Form.Item
              label="Requires Signature"
              name="requires_signature"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Grid> */}

          <Grid item xs={12}>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Upload Document
              </Button>
            </Form.Item>
          </Grid>
        </Grid>
      </Form>
    </Paper>
  );
};

export default DocumentUpload;
