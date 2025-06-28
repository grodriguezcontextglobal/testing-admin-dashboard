import { Grid, Paper } from "@mui/material";
import { Button, Form, Input, message, Modal, Select } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { devitrakApi } from "../../../../api/devitrakApi";
import { UploadIcon } from "../../../../components/icons/UploadIcon";

const DocumentUpload = ({ openDialog, setOpenDialog, providerId }) => {
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
      return message.error("Please select a file.");
    }

    // Create multipart form data with the correct structure
    const formDataToSend = new FormData();
    formDataToSend.append("document", file);
    formDataToSend.append("document_type", values.document_type);
    formDataToSend.append("title", values.title);
    formDataToSend.append("company_id", user?.companyData?.id);
    formDataToSend.append("created_by", user?.uid);
    formDataToSend.append("uploadedAt", new Date().toISOString());

    try {
      // Set the correct headers for multipart/form-data
      //   const config = {
      //     headers: {
      //       'Content-Type': 'multipart/form-data'
      //     }
      //   };

      const response = await devitrakApi.post(
        `/company/provider-upload-document/${providerId}`,
        formDataToSend
        // config
      );

      const data = await response.data;
      if (data.ok) {
        form.resetFields();
        setFile(null);
        setOpenDialog(false);
        message.success("Document uploaded successfully");
        return;
      } else {
        message.error(data.msg || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      message.error("Failed to upload document");
    }
  };

  return (
    <Modal
      open={openDialog}
      onClose={() => setOpenDialog(false)}
      onCancel={() => setOpenDialog(false)}
      centered
      width={1000}
      footer={null}
    >
      <Paper sx={{ p: 1, boxShadow: "none" }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Form.Item label="Upload Document">
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ ...OutlinedInputStyle }}
                  id="document-upload"
                  accept="*/*"
                  label={
                    <Button component="span">
                      <UploadIcon />
                      Upload Document
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
                  <Select.Option value="receipt">Receipt</Select.Option>
                  <Select.Option value="invoice">Invoice</Select.Option>
                  <Select.Option value="contract">Contract</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Grid>

            <Grid item xs={12}>
              <Form.Item>
                <Button htmlType="submit">Upload Document</Button>
              </Form.Item>
            </Grid>
          </Grid>
        </Form>
      </Paper>
    </Modal>
  );
};

export default DocumentUpload;
