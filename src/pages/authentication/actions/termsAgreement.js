import { message } from "antd";
import { devitrakApi } from "../../../api/devitrakApi";
import document1 from "../../../assets/pdf/document_1.pdf";
import document2 from "../../../assets/pdf/document_2.pdf";
import document3 from "../../../assets/pdf/document_3.pdf";

// The documents a staff member agrees to, and the call that records it.
// Kept out of DevitrakTermsAndConditions.jsx so that file exports only the
// component (react-refresh/only-export-components).
export const policyDocuments = [
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

export const agreedAgreement = async ({
  staffMember,
  staffEmail,
  setOpen,
  setIsLoading,
  setAcceptanceTermsAndPoliciesResult,
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
        email: staffEmail,
      },
    );
    if (acceptanceTermsAndPolicies.data.ok) {
      message.success("Agreement submitted successfully.");
      setAcceptanceTermsAndPoliciesResult(acceptanceTermsAndPolicies.data);
      return setOpen(false);
    }
  } catch (error) {
    const errorMessage = error.responseerror.dataerror.message || error.message || error.msg || error;
    // message.error(
    //   "Error submitting agreement:",
    //   errorMessage,
    // );
    //throw error; // Re-throw to be handled by the form submission
    setOpen(false);
    return errorMessage
  } finally {
    setIsLoading(false);
  }
};
