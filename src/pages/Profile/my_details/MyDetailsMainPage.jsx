import { Grid } from "@mui/material";
import Body from "./components/Body";
import Header from "../components/Header";

const MyDetailsMainPage = () => {
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
      <Header title={"Personal Info"} description={"Update your photo and personal details."} />
      {/* <Divider /> */}
      <Body />
    </Grid>
  );
};

export default MyDetailsMainPage;
