import { Grid, Typography } from "@mui/material";

const OptionSubscriptionTitle = () => {
  return (
    <Grid container>
      <Grid item xs={3}></Grid>
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        marginTop={3}
        item
        xs={9}
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={3}
        >
          <Typography
            textTransform={"none"}
            color={"#000"}
            fontSize={"25px"}
            fontWeight={400}
            fontFamily={"Inter"}
            lineHeight={"30px"}
            marginBottom={0}
          >
            Basic
          </Typography>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={3}
        >
          <Typography
            textTransform={"none"}
            color={"#000"}
            fontSize={"25px"}
            fontWeight={400}
            fontFamily={"Inter"}
            lineHeight={"30px"}
            marginBottom={0}
          >
            Business
          </Typography>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={3}
        >
          <Typography
            textTransform={"none"}
            color={"#000"}
            fontSize={"25px"}
            fontWeight={400}
            fontFamily={"Inter"}
            lineHeight={"30px"}
            marginBottom={0}
          >
            Enterprise
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default OptionSubscriptionTitle;