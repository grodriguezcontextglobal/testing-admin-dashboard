import { Grid, Typography } from "@mui/material";

const FooterComponent = () => {
  return (
    <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} container>
      <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} style={{margin:"0 auto 3rem"}} item xs={12} sm={12} md={11} lg={11}>
          <Typography
            textAlign={"left"}
            fontWeight={400}
            fontFamily={"Inter"}
            fontSize={"14px"}
            fontStyle={"normal"}
            lineHeight={"20px"}
            color={"var(--gray-600, #475467)"}
          >
            © Devitrak 2023
          </Typography>
      </Grid>
    </Grid>
  );
};

export default FooterComponent;