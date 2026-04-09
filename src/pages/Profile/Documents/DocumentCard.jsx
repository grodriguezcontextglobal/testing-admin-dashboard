import { Link } from "react-router-dom";
import "./DocumentCard.css";

const DocumentCard = ({ doc }) => {
  return (
    <div className="document-card">
      <div className="document-card-content">
        <h3 className="document-card-title">{doc.title}</h3>
        <p className="document-card-description">{doc.description}</p>
        <p className="document-card-trigger">When displayed: {doc.trigger_action}</p>
        <p className="document-card-type">Type: {doc.document_type}</p>
      </div>
      <div className="document-card-actions">
        <Link to={`/profile/documents/view/${doc._id}`} className="document-card-link">
          Document details
        </Link>
      </div>
    </div>
  );
};

export default DocumentCard;
