import "./text_link.css";

/**
 * Untitled UI text link.
 *
 * Always renders a bare <button> (keyboard-accessible, no native button chrome).
 * It used to branch to an <a> when `href` was passed, but no call site in the app
 * ever did — the anchor path was dead code, and the two branches had already
 * drifted apart: only the <a> rendered `iconLeading`, so the download icons in
 * QRCode.jsx and DownloadXlsx.jsx were silently invisible.
 *
 * If a link is ever genuinely needed, add it back deliberately rather than
 * reviving the branch: an anchor and a button are different elements with
 * different semantics, and one component quietly being either is what let the
 * icon bug hide.
 *
 * - color: "brand" (default) | "gray" | "error"  -> Untitled UI "Link color" /
 *   "Link gray" / destructive.
 * - Every other prop (onClick, disabled, aria-*, style…) is forwarded to the
 *   <button>.
 */
const TextLink = ({
  color = "brand",
  iconLeading = null,
  className = "",
  children,
  ...rest
}) => {
  const colorClass =
    color === "gray"
      ? " customized__textLink--gray"
      : color === "error"
        ? " customized__textLink--error"
        : "";
  const cls = `customized__textLink${colorClass} ${className}`.trim();

  return (
    <button type="button" className={cls} {...rest}>
      {iconLeading}
      {children}
    </button>
  );
};

export default TextLink;
