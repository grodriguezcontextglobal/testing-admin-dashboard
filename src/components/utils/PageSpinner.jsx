/**
 * Full-page centered loading spinner (Untitled UI styling).
 * Reconstructed after the original was lost to a OneDrive sync failure
 * (original kept as PageSpinner.jsx.onedrive-dead).
 */
const PageSpinner = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      minHeight: "40vh",
    }}
  >
    <span
      aria-label="Loading"
      role="status"
      style={{
        width: 40,
        height: 40,
        border: "4px solid var(--gray-100, #eeefe9)",
        borderTopColor: "var(--action-600, #155eef)",
        borderRadius: "50%",
        display: "inline-block",
        animation: "page-spinner-rotate 0.8s linear infinite",
      }}
    />
    <style>{`@keyframes page-spinner-rotate { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default PageSpinner;
