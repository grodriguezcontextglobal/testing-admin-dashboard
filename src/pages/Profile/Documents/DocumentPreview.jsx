const DocumentPreview = ({ pdfUrl }) => {
  if (!pdfUrl) {
    return <p>No PDF to display.</p>;
  }

  return (
    <iframe
      src={pdfUrl}
      title="Document Preview"
      style={{ width: "100%", height: "750px" }}
    />
  );
};

export default DocumentPreview;
