import { Drawer, message, Space, Table } from "antd";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
// Import PDF documents
import { OutlinedInput } from "@mui/material";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import document1 from "../../../assets/pdf/document_1.pdf";
import document2 from "../../../assets/pdf/document_2.pdf";
import document3 from "../../../assets/pdf/document_3.pdf";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";

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

const DevitrakTermsAndConditions = ({
  open,
  setOpen,
  navigate,
  company_id = null,
  staffMember = null,
  action = null,
  setAcceptanceTermsAndPoliciesResult,
  staffEmail
}) => {
  const location = useLocation();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission properly
  const handleFormSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Validate name field
    if (!name.trim()) {
      return; // Let HTML5 validation handle this
    }

    try {
      if (location.pathname.includes("/invitation")) {
        await agreedAgreement({
          staffMember,
          company_id,
          policyDocuments,
          setOpen,
          setIsLoading,
          setAcceptanceTermsAndPoliciesResult,
          staffEmail
        });
      } else if (action) {
        await action();
      }
    } catch (error) {
      console.error("Error handling agreement:", error);
      setIsLoading(false);
    }
  };

  const columns = [
    {
      title: "Document Name",
      dataIndex: "title",
      key: "title",
      responsive: ["xs", "sm", "md", "lg"],
      render: (text) => (
        <div
          style={{
            ...TextFontsize18LineHeight28,
            fontWeight: 400,
            color: "var(--gray-600, #475467)",
            alignSelf: "stretch",
            fontFamily: "Inter",
            lineHeight: "24px",
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Document Type",
      dataIndex: "url",
      key: "url",
      responsive: ["xs", "sm", "md", "lg"],
      render: (record) => (
        <GrayButtonComponent
          title={"View Document"}
          func={() => handleViewDocument(record)}
        />
      ),
    },
  ];

  const handleViewDocument = (document) => {
    try {
      // Open PDF in new tab
      window.open(document, "_blank");
    } catch (error) {
      console.error("Error opening document:", error);
    }
  };

  return (
    <Drawer
      title="Devitrak App Agreement and Privacy Policy"
      placement="top"
      width={500}
      hideBackdrop={false}
      closeIcon={false}
      open={open}
      styles={{
        body: {
          paddingBottom: 80,
          zIndex: 100,
        },
      }}
      extra={
        <Space direction="horizontal" styles={{ display: "flex" }}>
          <form
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
            onSubmit={handleFormSubmit}
          >
            <OutlinedInput
              placeholder="Enter your full name"
              style={OutlinedInputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <GrayButtonComponent
              title={"Decline"}
              buttonType="button"
              func={() =>
                location.pathname.includes("/invitation")
                  ? navigate("/login", { replace: true })
                  : navigate()
              }
            />
            <BlueButtonComponent
              title={"Agree"}
              buttonType="submit"
              loadingState={isLoading}
            />
          </form>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={policyDocuments}
        pagination={false}
      />
    </Drawer>
  );
};

export default DevitrakTermsAndConditions;

export const agreedAgreement = async ({
  staffMember,
  staffEmail,
  setOpen,
  setIsLoading,
  setAcceptanceTermsAndPoliciesResult
}) => {
  try {
    setIsLoading(true);
    const acceptanceTermsAndPolicies = await devitrakApi.post(
      "/devitrak/new_acceptance",
      {
        signature: staffMember,
        documentsAndPolicies: [
          ...policyDocuments.map((item) => ({
            url: item.url,
            documentName: item.title,
          })),
        ],
        email: staffEmail
      }
    );
    if (acceptanceTermsAndPolicies.data.ok) {
      message.success("Agreement submitted successfully.");
      setAcceptanceTermsAndPoliciesResult(acceptanceTermsAndPolicies.data)
      return setOpen(false);
    }
  } catch (error) {
    message.error("Error submitting agreement:", (error?.message || error?.msg) || error);
    throw error; // Re-throw to be handled by the form submission
  } finally {
    setIsLoading(false);
  }
};
