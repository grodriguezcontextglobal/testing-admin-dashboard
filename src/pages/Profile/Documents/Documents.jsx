import { useState, useEffect } from "react";
import { Grid, Typography, Paper, Box } from "@mui/material";
import { Tabs } from "antd";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import DocumentUpload from "../../../components/documents/DocumentUpload";
import { Link } from "react-router-dom";
import Header from "../components/Header";

const Documents = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.admin);

  const fetchDocuments = async () => {
    try {
      const response = await devitrakApi.get(
        `/document/?company_id=${user.companyData.id}`
      );
      setDocuments(response.data.documents);
    } catch (error) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const renderDocumentContent = () => {
    if (loading) {
      return <Typography>Loading documents...</Typography>;
    }

    if (documents.length === 0) {
      return <Typography>No documents found</Typography>;
    }

    return (
      <Grid container spacing={2}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc._id}>
            <Paper
              sx={{
                borderRadius: "12px",
                border: "1px solid var(--gray-200)",
                background: "var(--basewhite)",
                boxShadow:
                  "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
                textAlign: "left",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" noWrap>
                  {doc.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {doc.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When displayed: {doc.trigger_action}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Type: {doc.document_type}
                </Typography>
              </Box>
              <Box
                sx={{
                  borderTop: "1px solid var(--gray-200)",
                  p: 2,
                  mt: "auto",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Link
                  to={`/profile/documents/view/${doc._id}`}
                  style={{
                    color: "#004EEB",
                    textDecoration: "none",
                    fontFamily: "Inter",
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: "20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Document details
                </Link>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const items = [
    {
      key: "1",
      label: "All Documents",
      children: <Paper sx={{ p: 2 }}>{renderDocumentContent()}</Paper>,
    },
    {
      key: "2",
      label: "Upload Document",
      children: (
        <DocumentUpload activeTab={setActiveTab} refetch={fetchDocuments} />
      ),
    },
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
      <Header
        title={"Documents"}
        description={"Upload and manage documents."}
        />
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key === "1") {
              fetchDocuments();
            }
          }}
          items={items}
        />
      </Grid>
    </Grid>
  );
};

export default Documents;
