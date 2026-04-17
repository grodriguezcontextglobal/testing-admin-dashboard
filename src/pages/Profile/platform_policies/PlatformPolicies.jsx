import { Box, Grid } from "@mui/material";
import { useState } from "react";
import Header from "../components/Header";
import Card from "./Card";

// Import PDF documents
import document1 from "../../../assets/pdf/document_1.pdf";
import document2 from "../../../assets/pdf/document_2.pdf";
import document3 from "../../../assets/pdf/document_3.pdf";
import { Spin } from "antd";
import Loading from "../../../components/animation/Loading";

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
      <Spin fullscreen={true} indicator={<Loading />} />
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
              <Grid item xs={12} key={doc.id}>
                <Card doc={doc} handleViewDocument={handleViewDocument} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default PlatformPolicies;
