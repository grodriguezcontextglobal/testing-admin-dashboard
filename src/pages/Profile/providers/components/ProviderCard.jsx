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

const ProviderCard = ({ provider, handleEditClick, handleViewDocuments }) => {

  const formatAddress = (address) => {
    if (typeof address === "string") return address; // Handle old format
    if (!address) return "No address provided.";
    const { street, city, state, postalCode } = address;
    return `${street}, ${city}, ${state} ${postalCode}`;
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)",
        borderRadius: "12px", // Modern border radius from Untitled UI
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
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
            }}
          >
            {provider.companyName}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleEditClick(provider)}
            sx={{ mt: -0.5, mr: -1 }} // Adjust for alignment
          >
            <EditIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {formatAddress(provider.address)}
        </Typography>
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 1 }}>
        <Button
          color="inherit"
          sx={{ fontWeight: 600, color: "text.secondary" }}
          size="small"
          onClick={() => handleViewDocuments(provider)}
        >
          View
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProviderCard;
