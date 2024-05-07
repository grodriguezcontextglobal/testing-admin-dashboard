import { Grid } from "@mui/material";
import { Divider } from "antd";
import Header from "./components/Header";
import Body from "./components/Body";

const ContactInfo = () => {
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
      <Divider />
      <Body />
      <Divider />
    </Grid>
  );
};

export default ContactInfo;
