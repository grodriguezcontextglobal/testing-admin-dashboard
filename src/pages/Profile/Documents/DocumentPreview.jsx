import EmptyState from "../../../components/UX/emptyState/EmptyState";

const DocumentPreview = ({ pdfUrl }) => {
  if (!pdfUrl) {
    return (
      <EmptyState
        icon="tabler:file-search"
        title="No preview available"
        description="The PDF preview for this document could not be loaded."
        compact
      />
    );
  }

  return (
    <iframe
      src={pdfUrl}
      title="Document Preview"
      style={{
        width: "100%",
        height: "750px",
        border: "1px solid var(--gray-200, #ddded6)",
        borderRadius: "12px",
        background: "var(--base-white, #fff)",
      }}
    />
  );
};

export default DocumentPreview;
