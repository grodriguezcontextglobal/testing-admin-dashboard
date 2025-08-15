import { Box, Grid, Paper, Typography } from "@mui/material";
import { Button, Spin } from "antd";
import { useState } from "react";
import Header from "../components/Header";

// Import PDF documents
import document1 from "../../../assets/pdf/document_1.pdf";
import document2 from "../../../assets/pdf/document_2.pdf";
import document3 from "../../../assets/pdf/document_3.pdf";

const PlatformPolicies = () => {
  const [loading, setLoading] = useState(false);

  // Define the PDF documents with metadata
  const policyDocuments = [
    {
      id: 1,
      title: "Privacy Policy",
      description: "Our privacy policy and data handling practices",
      fileName: "document_1.pdf",
      url: document1,
    },
    {
      id: 2,
      title: "Terms of Service",
      description: "Terms and conditions for using our platform",
      fileName: "document_2.pdf",
      url: document2,
    },
    {
      id: 3,
      title: "User Agreement",
      description: "User agreement and platform guidelines",
      fileName: "document_3.pdf",
      url: document3,
    },
  ];

  const handleViewDocument = (document) => {
    try {
      setLoading(true);
      // Open PDF in new tab
      window.open(document.url, "_blank");
    } catch (error) {
      console.error("Error opening document:", error);
    } finally {
      setLoading(false);
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
    <Grid container>
      <Grid item xs={12}>
        <Header title="Platform Policies" />
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {policyDocuments.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {doc.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      File: {doc.fileName}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      pt: 0,
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      type="primary"
                      onClick={() => handleViewDocument(doc)}
                      style={{
                        borderRadius: "8px",
                        fontWeight: 500,
                        fontSize: "14px",
                        flex: 1,
                        minWidth: "100px",
                      }}
                    >
                      View PDF
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default PlatformPolicies;
