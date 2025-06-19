import { Grid } from "@mui/material";
import { Divider } from "antd";
import Body from "./components/Body";
import Header from "../components/Header";

const CompanyInfo = () => {
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
      <Header
        title={"Company info"}
        description={"Update your company info."}
      />
      {/* <Divider /> */}
      <Body />
      <Divider />
    </Grid>
  );
};

export default CompanyInfo;
