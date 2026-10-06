import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { Button, Form, Input, message, Select } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import DevitrakLoading from "../../../components/animation/DevitrakLoading";
import ArrowBackIcon from "../../../components/icons/arrow-left.svg";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import PillUIComponent from "../../../components/UX/Chip/PillUIComponent";
import {
  buildDocumentEditPayload,
  describeDocumentStatus,
  editableUsesForOptions,
  toDateInputValue,
} from "./utils/documentEditForm";

/**
 * Editing a document.
 *
 * It had neither the expiration date nor the status, so the one field that
 * decides whether a document can still be handed out was the one field it
 * could not change — and an expired document could not be brought back, which
 * is what the library keeps it for (meeting 2026-09-29 `37:36`–`38:18`:
 * "change it or change it back to active").
 *
 * The "When displayed" list came from six values written here by hand, missing
 * School consent and the company's own, so editing a document could only move
 * it to one of those six. It now offers the same uses as the upload form, plus
 * the document's current value when that is one no longer offered.
 */
const EditDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useSelector((state) => state.admin);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await devitrakApi.get(`/document/${id}`);
        if (response?.data?.document) {
          const record = response.data.document;
          setDocument(record);
          form.setFieldsValue({
            ...record,
            // The date input speaks YYYY-MM-DD, and so does the payload
            // builder, so the value needs no conversion either way.
            expiration_date: toDateInputValue(record.expiration_date),
          });
        } else {
          message.error("Document not found.");
        }
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
    if (saving) return;
    setSaving(true);
    try {
      await devitrakApi.put(
        `/document/${id}`,
        buildDocumentEditPayload({ document, values })
      );
      message.success("Document updated successfully");
      navigate(`/profile/documents/view/${id}`);
    } catch (error) {
      // The server had no route to edit a document when this was written
      // (FRONTEND_documents_backend_ask.md §1). Saying which failure it was
      // beats "Failed to update document" for whoever has to report it.
      message.error(
        error?.response?.status === 404
          ? "This server cannot edit documents yet. Nothing was changed."
          : error?.response?.data?.msg ||
              error?.response?.data?.message ||
              "Failed to update document"
      );
    } finally {
      setSaving(false);
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
        <DevitrakLoading />
      </Box>
    );
  }

  const status = describeDocumentStatus(document);
  const usesForOptions = editableUsesForOptions(
    user?.companyData?.industry,
    document?.trigger_action
  );

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            type="text"
            icon={<img src={ArrowBackIcon} alt="back" />}
            onClick={handleBack}
          />
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Inter",
              fontSize: "20px",
              lineHeight: "30px",
              fontWeight: 600,
              color: "var(--gray-900, #171d1a)",
            }}
          >
            Edit Document
          </Typography>
          <PillUIComponent color={status.tone}>{status.label}</PillUIComponent>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid var(--gray-200, #ddded6)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-xs, 0 1px 2px 0 rgba(23, 29, 26, 0.05))",
          }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
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
                    <Select.Option value="document">Document</Select.Option>
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
                  extra="Each screen only offers the documents meant for it."
                >
                  <Select
                    options={usesForOptions.map((option) => ({
                      value: option.id,
                      label: option.label,
                    }))}
                  />
                </Form.Item>
              </Grid>
              <Grid item xs={12} md={6}>
                <Form.Item
                  name="expiration_date"
                  label="Expires on"
                  extra={
                    status.key === "expired"
                      ? "This document expired, so it cannot be assigned anywhere. Pick a date ahead of today, or clear the field, to make it usable again."
                      : "Leave it empty and the document never expires. Once the date passes it can no longer be assigned."
                  }
                >
                  <Input type="date" />
                </Form.Item>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <GrayButtonComponent onClick={handleBack} disabled={saving}>
                    Cancel
                  </GrayButtonComponent>
                  <BlueButtonComponent buttonType="submit" loadingState={saving}>
                    Save Changes
                  </BlueButtonComponent>
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
