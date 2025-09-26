import { Card, CardContent, Chip, Typography } from "@mui/material";

export const KPI = ({ label, value, color = "default" }) => (
  <Card variant="outlined" sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">
        <Chip label={String(value ?? 0)} color={color} sx={{ fontSize: 16 }} />
      </Typography>
    </CardContent>
  </Card>
);
