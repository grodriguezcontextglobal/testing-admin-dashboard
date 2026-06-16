import { Grid, Typography } from "@mui/material";

const TableHeader = ({ title, leftCta, rightCta }) => {
  return (
    <Grid
      border={"1px solid var(--gray-200, #eaecf0)"}
      borderRadius={"12px 12px 0 0"}
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      padding={"16px 24px"}
      sx={{ mb: "-1px" }}
      item
      xs={12}
    >
      <Grid item xs={4} display={"flex"} justifyContent={"flex-start"}>
        {leftCta}
      </Grid>
      <Grid item xs={4} display={"flex"} justifyContent={"center"}>
        <Typography variant="h6">{title && title}</Typography>
      </Grid>
      <Grid item xs={4} display={"flex"} justifyContent={"flex-end"}>
        {rightCta}
      </Grid>
    </Grid>
  );
};

export default TableHeader;
