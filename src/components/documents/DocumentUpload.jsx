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

const JOB_POLL_INTERVAL_MS = 1500;
const JOB_POLL_TIMEOUT_MS = 60000;

const generateIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const DocumentUpload = ({ activeTab, refetch }) => {
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const pollJobStatus = (jobId) =>
    new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const poll = async () => {
        try {
          const { data } = await devitrakApi.get(`/jobs/owned/${jobId}`);
          if (data.status === "done") {
            return resolve(data.result?.document);
          }
          if (data.status === "dead" || data.status === "failed") {
            return reject(
              new Error(data.lastError || "Document upload failed.")
            );
          }
          if (Date.now() - startedAt > JOB_POLL_TIMEOUT_MS) {
            return reject(
              new Error("Timed out waiting for the document to be processed.")
            );
          }
          setTimeout(poll, JOB_POLL_INTERVAL_MS);
        } catch (error) {
          reject(error);
        }
      };
      poll();
    });

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

    setUploading(true);
    try {
      const response = await devitrakApi.post(
        "/document/upload",
        formDataToSend,
        { headers: { "Idempotency-Key": generateIdempotencyKey() } }
      );

      const data = await response.data;
      if (!data.ok) {
        console.error("Upload failed:", data.msg);
        throw Error(data.msg);
      }

      message.loading({
        content: "Document queued — processing upload...",
        key: "document-upload",
        duration: 0,
      });
      await pollJobStatus(data.jobId);

      message.success({
        content: "Document uploaded successfully.",
        key: "document-upload",
      });
      form.resetFields();
      setFile(null);
      activeTab("1");
      return refetch();
    } catch (error) {
      console.error("Error uploading document:", error);
      message.error({
        content: error.message || "Failed to upload document.",
        key: "document-upload",
      });
      throw error;
    } finally {
      setUploading(false);
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
        saveLoading={uploading}
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
        saveLoading={uploading}
      />
    </Form>
  );
};

export default DocumentUpload;
