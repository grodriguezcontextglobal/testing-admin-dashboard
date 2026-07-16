import { Grid } from "@mui/material";
import { Form, Input, message, Modal, Select } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";

const DocumentUpload = ({ openDialog, setOpenDialog, providerId, refetch }) => {
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useSelector((state) => state.admin);

  const handleFileChange = (e) => {
    const selected = e?.target?.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFile(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (values) => {
    if (!file) {
      return message.error("Please select a file.");
    }
    setUploading(true);
    // Create multipart form data with the correct structure
    const formDataToSend = new FormData();
    formDataToSend.append("document", file);
    formDataToSend.append("document_type", values.document_type);
    formDataToSend.append("title", values.title);
    formDataToSend.append("company_id", user?.companyData?.id);
    formDataToSend.append("created_by", user?.uid);
    formDataToSend.append("uploadedAt", new Date().toISOString());

    try {
      const response = await devitrakApi.post(
        `/company/provider-upload-document/${providerId}`,
        formDataToSend
      );

      const data = response?.data;
      if (data?.ok) {
        message.success("Document uploaded successfully");
        handleClose();
        if (typeof refetch === "function") refetch();
        return;
      }
      message.error(data?.msg || "Upload failed");
    } catch (error) {
      message.error(
        error?.response?.data?.msg || "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Upload provider document"
      open={openDialog}
      onCancel={handleClose}
      centered
      width={640}
      footer={null}
      styles={{ header: { marginBottom: "16px" } }}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Form.Item
              label="Document file"
              help={file ? `Selected file: ${file.name}` : undefined}
            >
              <Input
                type="file"
                onChange={handleFileChange}
                id="document-upload"
                accept="*/*"
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
                <Select.Option value="receipt">Receipt</Select.Option>
                <Select.Option value="invoice">Invoice</Select.Option>
                <Select.Option value="contract">Contract</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Form.Item>
          </Grid>

          <Grid item xs={12}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                borderTop: "1px solid var(--gray-200, #ddded6)",
                paddingTop: "16px",
              }}
            >
              <GrayButtonComponent
                title="Cancel"
                func={handleClose}
                disabled={uploading}
              />
              <BlueButtonComponent
                title="Upload document"
                func={() => form.submit()}
                loadingState={uploading}
              />
            </div>
          </Grid>
        </Grid>
      </Form>
    </Modal>
  );
};

export default DocumentUpload;
