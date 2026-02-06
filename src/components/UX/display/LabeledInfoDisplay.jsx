import { Typography, Box } from "@mui/material";

/**
 * Reusable component to display a label and its associated information.
 *
 * @param {Object} props
 * @param {string} props.label - The label text to display.
 * @param {React.ReactNode} props.children - The information/content to display associated with the label.
 * @param {Object} [props.labelStyle] - Custom styles for the label.
 * @param {Object} [props.contentStyle] - Custom styles for the content.
 * @param {Object} [props.containerStyle] - Custom styles for the container.
 * @param {boolean} [props.inline=false] - If true, displays label and content on the same line.
 */
const LabeledInfoDisplay = ({
  label,
  children,
  labelStyle = {},
  contentStyle = {},
  containerStyle = {},
  inline = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: inline ? "row" : "column",
        alignItems: inline ? "center" : "flex-start",
        gap: inline ? 1 : 0.5,
        mb: 2,
        ...containerStyle,
      }}
    >
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ fontWeight: 600, ...labelStyle }}
      >
        {label}
        {inline && ":"}
      </Typography>
      <Box sx={{ ...contentStyle }}>
        {typeof children === "string" || typeof children === "number" ? (
          <Typography variant="body1" color="text.primary">
            {children}
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

export default LabeledInfoDisplay;
