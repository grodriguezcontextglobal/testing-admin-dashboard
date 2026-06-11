import { Divider, Grid } from "@mui/material";
import { DatePicker, Form, Input, message, Select } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import { UploadIcon } from "../icons/UploadIcon";
import SectionFooter from "./new_form_components/SectionFooter";
import SectionHeader from "./new_form_components/SectionHeader";
import SectionLabel from "./new_form_components/SectionLabel";
import industries from "../navbar/component/industriesList.json";

const DocumentUpload = ({ activeTab, refetch }) => {
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
    formDataToSend.append("document_type", "document");
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
      } else {
        formDataToSend.append(key, values[key]);
      }
    });

    try {
      const response = await devitrakApi.post(
        "/document/upload",
        formDataToSend
      );

      const data = await response.data;
      if (data.ok) {
        form.resetFields();
        setFile(null);
        activeTab("1");
        return refetch();
      } else {
        console.error("Upload failed:", data.msg);
        throw Error(data.msg);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };
  const industry = String(user.companyData.industry);
  const representative = industries[industry][0];
  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ margin: "1rem 0" }}>
      <SectionHeader
        title="Document details"
        subtitle="Update your document details here."
        cancelButton={() => form.resetFields()}
        saveButton={() => form.submit()}
      />
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} lg={3}>
          <SectionLabel
            title="Document title"
            description="This will be displayed on the document."
          />
        </Grid>
        <Grid item xs={12} lg={9}>
          <Form.Item
            name="title"
            rules={[{ required: true, message: "Please input the title!" }]}
          >
            <Input />
          </Form.Item>
        </Grid>
      </Grid>
      <Divider />
      {/* <Grid container spacing={3} mt={2}>
        <Grid item xs={12} lg={3}>
          <SectionLabel
            title="Document type"
            description="Select the type of document."
          />
        </Grid>
        <Grid item xs={12} lg={9}>
          <Form.Item
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
      </Grid> */}
      <Divider />
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} lg={3}>
          <SectionLabel
            title="Uses for"
            description="Select the purpose of the document."
          />
        </Grid>
        <Grid item xs={12} lg={9}>
          <Form.Item name="trigger_action">
            <Select>
              <Select.Option value="onboarding">Staff</Select.Option>
              <Select.Option value="event">Event</Select.Option>
              <Select.Option value="consumer">Consumer</Select.Option>
              <Select.Option value={`${representative}`}>{representative}</Select.Option>
            </Select>
          </Form.Item>
        </Grid>
      </Grid>
      <Divider />
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} lg={3}>
          <SectionLabel
            title="Language"
            description="Select the language of the document."
          />
        </Grid>
        <Grid item xs={12} lg={9}>
          <Form.Item name="language" initialValue="en">
            <Select>
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="es">Spanish</Select.Option>
            </Select>
          </Form.Item>
        </Grid>
      </Grid>
      <Divider />
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} lg={3}>
          <SectionLabel
            title="Description"
            description="Write a short description of the document."
          />
        </Grid>
        <Grid item xs={12} lg={9}>
          <Form.Item name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Grid>
      </Grid>
      <Divider />
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} lg={3}>
          <SectionLabel
            title="Expiration Date"
            description="Set an expiration date for the document."
          />
        </Grid>
        <Grid item xs={12} lg={9}>
          <Form.Item name="expiration_date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Grid>
      </Grid>
      <Divider />
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} lg={3}>
          <SectionLabel
            title="Upload PDF Document"
            description="Upload the document in PDF format."
          />
        </Grid>
        <Grid item xs={12} lg={9}>
          <Form.Item>
            <Input
              type="file"
              onChange={handleFileChange}
              addonBefore={<UploadIcon />}
              accept="application/pdf"
            />
          </Form.Item>
        </Grid>
      </Grid>
      <SectionFooter
        cancelButton={() => form.resetFields()}
        saveButton={() => form.submit()}
      />
    </Form>
  );
};

export default DocumentUpload;
