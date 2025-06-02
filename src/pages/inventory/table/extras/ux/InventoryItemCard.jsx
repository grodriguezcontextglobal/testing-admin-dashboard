import { Avatar, Box, Typography } from "@mui/material";

const InventoryItemCard = ({ item }) => {
  if (!item) return null;

  const {
    serial_number,
    descript_item,
    status,
    brand,
    location,
    image_url,
    return_date,
  } = item;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "operational":
        return "green";
      case "maintenance":
        return "orange";
      case "lost":
      case "damaged":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: 1,
        borderBottom: "1px solid #e0e0e0",
        '&:hover': {
          backgroundColor: '#f5f5f5'
        }
      }}
    >
      {/* Image/Avatar Column */}
      <Box sx={{ width: 60, flexShrink: 0 }}>
        {image_url ? (
          <Avatar
            variant="square"
            src={image_url}
            sx={{ width: 50, height: 50 }}
          />
        ) : (
          <Avatar
            variant="square"
            sx={{ bgcolor: "lightgray", width: 50, height: 50 }}
          >
            <img
              src={"https://res.cloudinary.com/dsuynhcgd/image/upload/c_thumb,w_200,g_face/v1738169822/material-symbols--enterprise-outline_vmmi7y.svg"}
              alt="Default Item"
            />
          </Avatar>
        )}
      </Box>

      {/* Serial Number Column */}
      <Box sx={{ width: 150, flexShrink: 0 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          {serial_number || "N/A"}
        </Typography>
      </Box>

      {/* Description Column */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2">
          {descript_item || "No description"}
        </Typography>
      </Box>

      {/* Brand Column */}
      <Box sx={{ width: 120, flexShrink: 0 }}>
        <Typography variant="body2">
          {brand || "—"}
        </Typography>
      </Box>

      {/* Location Column */}
      <Box sx={{ width: 120, flexShrink: 0 }}>
        <Typography variant="body2">
          {location || "—"}
        </Typography>
      </Box>

      {/* Return Date Column */}
      <Box sx={{ width: 180, flexShrink: 0 }}>
        <Typography variant="body2">
          {return_date ? new Date(return_date).toLocaleString() : "—"}
        </Typography>
      </Box>

      {/* Status Column */}
      <Box sx={{ width: 100, flexShrink: 0 }}>
        <Typography
          component="span"
          sx={{
            padding: "3px 8px",
            backgroundColor: getStatusColor(status),
            color: "white",
            borderRadius: 4,
            fontSize: 12,
            textTransform: "capitalize",
            display: "inline-block"
          }}
        >
          {status || "Unknown"}
        </Typography>
      </Box>
    </Box>
  );
};

export default InventoryItemCard;
