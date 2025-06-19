import { Grid, Typography } from "@mui/material";

const Header = ({ title, description }) => {
  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignSelf={"stretch"}
          marginY={0}
          item
          xs={5}
          sm={5}
          md={6}
        >
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-900, #101828)",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={600}
            fontFamily={"Inter"}
            fontSize={"18px"}
            lineHeight={"28px"}
          >
            {title}
          </Typography>
          <Typography
            textTransform={"none"}
            style={{
              color: "#475467",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={400}
            fontFamily={"Inter"}
            fontSize={"14x"}
            lineHeight={"20px"}
          >
            {description}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Header;
