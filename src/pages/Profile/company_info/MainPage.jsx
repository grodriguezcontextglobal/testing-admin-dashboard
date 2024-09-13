import { Grid } from "@mui/material";
import Header from "./components/Header";
import { Divider } from "antd";
import Body from "./components/Body";

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
      <Header />
      {/* <Divider /> */}
      <Body />
      <Divider />
    </Grid>
  );
};

export default CompanyInfo;
