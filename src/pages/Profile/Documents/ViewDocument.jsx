import { message, Modal, Spin } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import ArrowBackIcon from "../../../components/icons/arrow-left.svg";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import DocumentPreview from "./DocumentPreview"; // Import the new component
import "./ViewDocument.css";

const ViewDocument = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocumentAndPdfUrl = async () => {
      try {
        const [docResponse, pdfResponse] = await Promise.all([
          devitrakApi.get(`/document/${id}`),
          devitrakApi.get(`/document/download/${id}/${user.uid}`),
        ]);

        setDocumentData(docResponse.data.document);

        if (pdfResponse.data?.ok && pdfResponse.data?.downloadUrl) {
          setPdfUrl(pdfResponse.data.downloadUrl);
        }
      } catch (error) {
        message.error(
          "Error fetching document details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentAndPdfUrl();

    const interval = setInterval(async () => {
      try {
        const { data } = await devitrakApi.get(
          `/document/download/${id}/${user.uid}`
        );
        if (data?.ok && data?.downloadUrl) {
          setPdfUrl(data.downloadUrl);
        }
      } catch (error) {
        console.error("Failed to refresh PDF URL:", error);
      }
    }, 270000); // Refresh every 4.5 minutes to renew the signed URL

    return () => clearInterval(interval);
  }, [id, user.uid]);

  const handleBack = () => {
    navigate("/profile/documents");
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

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="view-document-container">
        <p className="error-message">Document not found</p>
      </div>
    );
  }

  return (
    <div className="view-document-container">
      <div className="view-document-header">
        <GrayButtonComponent
          title="Back"
          icon={<img src={ArrowBackIcon} alt="Back" />}
          func={handleBack}
        />
        <div className="actions">
          <BlueButtonComponent
            title="View"
            func={handleDownload}
          />
          <GrayButtonComponent
            title="Edit"
            func={handleEdit}
          />
          <DangerButtonComponent
            title="Delete"
            func={handleDelete}
          />
        </div>
      </div>
      <div className="view-document-content">
        <h1 className="view-document-title">{documentData.title}</h1>
        <p className="view-document-description">{documentData.description || "No description available"}</p>
        <div className="view-document-tags">
          <span className="view-document-tag">{documentData.document_type}</span>
          {documentData.trigger_action && (
            <span className="view-document-tag">
              {String(documentData.trigger_action).toLocaleUpperCase()}
            </span>
          )}
        </div>
        {documentData.tags && documentData.tags.length > 0 && (
          <div className="view-document-tags">
            {documentData.tags.map((tag) => (
              <span key={tag} className="view-document-tag">
                {String(tag).toLocaleUpperCase()}
              </span>
            ))}
          </div>
        )}
        <p className="view-document-info">Language: {documentData.language}</p>
        {documentData.expiration_date && (
          <p className="view-document-info">
            Expires:{" "}
            {new Date(documentData.expiration_date).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="document-preview-container" style={{ marginTop: '24px' }}>
        <DocumentPreview pdfUrl={pdfUrl} />
      </div>
    </div>
  );
};


export default ViewDocument;
