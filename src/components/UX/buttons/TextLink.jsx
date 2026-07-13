import "./text_link.css";

/**
 * Untitled UI text link.
 * - Renders an <a> when `href` is provided, otherwise a bare <button> (so it is
 *   keyboard-accessible and doesn't inherit native button chrome).
 * - color: "brand" (default) | "gray"  -> Untitled UI "Link color" / "Link gray".
 */
const TextLink = ({
  href = null,
  target,
  rel,
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

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        className={cls}
        {...rest}
      >
        {iconLeading}
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
};

export default TextLink;
