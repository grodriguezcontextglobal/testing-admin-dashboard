import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import { agreedAgreement, policyDocuments } from "./termsAgreement";
import ModalUX from "../../../components/UX/modal/ModalUX";
import BaseTable from "../../../components/UX/tables/BaseTable";

const DevitrakTermsAndConditions = ({
  open,
  setOpen,
  navigate,
  company_id = null,
  staffMember = null,
  action = null,
  setAcceptanceTermsAndPoliciesResult,
  staffEmail,
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
          staffEmail,
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
      window.open(document, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening document:", error);
    }
  };

  return (
    <ModalUX footer={
      <form
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px"
        }}
        onSubmit={handleFormSubmit}
      >
        <Input
          placeholder="Enter your full name"
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
          styles={{ width: "60%", padding: "10px 20px" }}
        />
        <BlueButtonComponent
          title={"Agree And Sign"}
          buttonType="submit"
          loadingState={isLoading}
          styles={{ width: "60%" }}
        />
      </form>
    }
      openDialog={open}
      closeModal={false}
      closable={false}
      body={
        <BaseTable
          columns={columns}
          dataSource={policyDocuments}
          enablePagination={false}
        />
      }
      width={1000}
    />
  );
};

export default DevitrakTermsAndConditions;
