import { Box, Grid, Typography } from "@mui/material"
import Chip from "../../../../../components/UX/Chip/Chip"

const RenderingItemsAddedForStore = ({ devices, handleRemoveDevice }) => {
  return (
    <>
        {devices?.length > 0 && (
            <Box sx={{ width: "100%", m: "0 0 1rem" }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, width:"100%", textAlign:"left" }}>
              {devices.length} devices entered
            </Typography>
            <Grid container spacing={1}>
              {devices.map((device) => (
                <Grid item key={device.id}>
                  <Chip
                    label={Object.keys(device.data)[0]}
                    onDelete={() => handleRemoveDevice(device.id)}
                    sx={{
                      backgroundColor: "rgba(40, 199, 111, 0.12)",
                      color: "rgb(40, 199, 111)",
                      fontWeight: 600,
                      "& .MuiChip-deleteIcon": {
                        color: "rgb(40, 199, 111)",
                        "&:hover": {
                          color: "rgb(20, 150, 90)",
                        },
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        </>
  )
}

export default RenderingItemsAddedForStore