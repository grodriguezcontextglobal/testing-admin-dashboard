import {
  Box,
  Card,
  CardActions,
  CardContent,
  Divider,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { EditIcon } from "../../../../components/icons/EditIcon";

const ProviderCard = ({
  provider,
  handleEditClick,
  handleViewDocuments,
  handleUploadDocument,
}) => {
  const formatAddress = (address) => {
    if (typeof address === "string") return address; // Handle old format
    if (!address) return "No address provided.";
    const { street, city, state, postalCode } = address;
    return [street, city, state, postalCode].filter(Boolean).join(", ");
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-xs, 0 1px 2px 0 rgba(23, 29, 26, 0.05))",
        border: "1px solid var(--gray-200, #ddded6)",
        borderRadius: "12px",
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3, pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "1.125rem", // 18px
              lineHeight: "28px",
              color: "var(--gray-900, #171d1a)",
            }}
          >
            {provider?.companyName}
          </Typography>
          <IconButton
            size="small"
            aria-label="Edit provider"
            onClick={() => handleEditClick(provider)}
            sx={{ mt: -0.5, mr: -1 }} // Adjust for alignment
          >
            <EditIcon />
          </IconButton>
        </Box>
        <Typography
          variant="body2"
          sx={{ color: "var(--gray-600, #5d615a)" }}
        >
          {formatAddress(provider?.address)}
        </Typography>
      </CardContent>
      <Divider sx={{ borderColor: "var(--gray-200, #ddded6)" }} />
      <CardActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button
          color="inherit"
          sx={{ fontWeight: 600, color: "var(--gray-600, #5d615a)" }}
          size="small"
          onClick={() => handleViewDocuments(provider)}
        >
          View documents
        </Button>
        {typeof handleUploadDocument === "function" && (
          <Button
            color="inherit"
            sx={{ fontWeight: 600, color: "var(--action-600, #155eef)" }}
            size="small"
            onClick={() => handleUploadDocument(provider)}
          >
            Upload document
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ProviderCard;
