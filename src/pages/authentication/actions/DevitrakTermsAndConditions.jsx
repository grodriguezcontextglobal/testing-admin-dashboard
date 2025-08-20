import { Drawer, Space, Table } from "antd";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
// Import PDF documents
import document1 from "../../../assets/pdf/document_1.pdf";
import document2 from "../../../assets/pdf/document_2.pdf";
import document3 from "../../../assets/pdf/document_3.pdf";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { OutlinedInput } from "@mui/material";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import { useLocation } from "react-router-dom";
// import { devitrakApi } from "../../../api/devitrakApi";
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
}) => {
  const location = useLocation();
  const [name, setName] = useState(staffMember);
  const [isLoading, setIsLoading] = useState(false);
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
        <Space>
          <OutlinedInput
            placeholder="Enter your full name"
            style={OutlinedInputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <DangerButtonComponent
            title={"No agreed"}
            func={() =>
              location.pathname.includes("/invitation")
                ? navigate("/login", { replace: true })
                : navigate()
            }
          />
          <BlueButtonComponent
            title={"Agree"}
            func={() =>
              location.pathname.includes("/invitation")
                ? agreedAgreement({
                    staffMember,
                    company_id,
                    policyDocuments,
                    setOpen,
                    setIsLoading,
                  })
                : action()
            }
            loadingState={isLoading}
          />
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
  company_id,
  setOpen,
  setIsLoading,
}) => {
  try {
    setIsLoading(true);
    const date = new Date().toISOString();
    for (let data of policyDocuments) {
      await devitrakApi.post("/company/signatures", {
        signature: staffMember,
        date,
        contract_url: data.url,
        company_id: company_id,
      });
    }
    return setOpen();
  } catch (error) {
    console.error("Error opening document:", error);
  } finally {
    setIsLoading(false);
  }
};
