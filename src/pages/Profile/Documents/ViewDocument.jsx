import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { Button, message, Modal, Spin, Tag } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import ArrowBackIcon from "../../../components/icons/arrow-left.svg";
import DownloadIcon from "../../../components/icons/DownDoubleArrowIcon";
import EditIcon from "../../../components/icons/EditIcon.svg";
import DeleteIcon from "../../../components/icons/trash-01.svg";
import { useSelector } from "react-redux";

const ViewDocument = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await devitrakApi.get(
          `/document/${id}`
        );
        setDocumentData(response.data.document);
      } catch (error) {
        message.error("Error fetching document. Please try again later.");
        throw error;
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    navigate(`/profile/documents/edit/${id}`);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Document",
      content: "Are you sure you want to delete this document?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await devitrakApi.delete(`/document/${id}`);
          message.success("Document deleted successfully");
          navigate("/profile/documents");
        } catch (error) {
          message.error("Failed to delete document");
        }
      },
    });
  };

  const handleDownload = async () => {
    try {
      const { data } = await devitrakApi.get(`/document/download/${id}/${user.uid}`);
      window.open(data.downloadUrl, "_blank");
      if (!data?.ok || !data?.downloadUrl) {
        throw new Error("Invalid or missing download URL");
      }
      return message.success("Document displayed successfully");
    } catch (error) {
      message.error("Failed to download document");
      throw new Error(error);
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

  if (!documentData) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          Document not found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box
          sx={{
            my: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            startIcon={
              <img src={ArrowBackIcon} alt="Back" width={20} height={20} />
            }
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Stack direction="row" spacing={2} sx={{ float: "right" }}>
            <Button
              variant="outlined"
              startIcon={
                <img src={DownloadIcon} alt="Download" width={20} height={20} />
              }
              onClick={handleDownload}
            >
              View
            </Button>
            <Button
              variant="outlined"
              startIcon={
                <img src={EditIcon} alt="Edit" width={20} height={20} />
              }
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={
                <img src={DeleteIcon} alt="Delete" width={20} height={20} />
              }
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Stack>
        </Box>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {documentData.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {documentData.description}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
              Type:
            </Typography>
            <Tag color="blue">{documentData.document_type}</Tag>
            {documentData.trigger_action && (
              <Tag color="green">{documentData.trigger_action}</Tag>
            )}
          </Box>
          {documentData.tags && documentData.tags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {documentData.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Box>
          )}
          <Typography variant="subtitle2" gutterBottom>
            Language: {documentData.language}
          </Typography>
          {documentData.expiration_date && (
            <Typography variant="subtitle2" gutterBottom>
              Expires:{" "}
              {new Date(documentData.expiration_date).toLocaleDateString()}
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ViewDocument;
