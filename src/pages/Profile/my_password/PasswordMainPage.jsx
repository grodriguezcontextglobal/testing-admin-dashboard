import { Grid } from "@mui/material";
import Body from "./components/Body";
import Header from "./components/Header";

const PasswordMainPage = () => {
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
      <Header />
      <Body />
    </Grid>
  );
};

export default PasswordMainPage;
