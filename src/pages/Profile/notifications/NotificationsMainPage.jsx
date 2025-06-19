import { Grid } from "@mui/material";
import { Divider } from "antd";
import Body from "./components/Body";
import Header from "../components/Header";

const NotificationsMainPage = () => {
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
      <Header title={"Notifications"} description={"Update your notifications preferences."} />
      <Divider />
      <Body />
      <Divider />
    </Grid>
  );
};

export default NotificationsMainPage;