import { Grid, Typography } from "@mui/material";
import { Breadcrumb, Divider } from "antd";
import { Link } from "react-router-dom";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import HeaderInventaryComponent from "../../utils/HeaderInventaryComponent";
import { useSelector } from "react-redux";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";

const Header = ({ title, category }) => {
  const { user } = useSelector((state) => state.admin);

  const options = [
    {
      title: (
        <Link to="/inventory">
          <Typography
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            style={{ ...LightBlueButtonText, fontWeight: 600 }}
          >
            All devices
          </Typography>
        </Link>
      ),
    },
    {
      title: <Typography>{title}</Typography>,
    },
  ];
  return (
    <>
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
      >
        <Grid item xs={12} sm={12} md={12} lg={12}>
          {" "}
          <HeaderInventaryComponent
            user={user}
            TextFontSize30LineHeight38={TextFontSize30LineHeight38}
            LightBlueButton={LightBlueButton}
            LightBlueButtonText={LightBlueButtonText}
            BlueButton={BlueButton}
            BlueButtonText={BlueButtonText}
          />
        </Grid>
        <Divider />
        <Grid
          marginY={0}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={6}
        >
          <Typography style={TextFontSize30LineHeight38}>{category}</Typography>
        </Grid>
      </Grid>
      <Grid
        style={{
          paddingTop: "0px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
        marginTop={4}
      >
        <Grid marginY={0} item xs={12} sm={12} md={8}>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Breadcrumb separator=">" items={options} />
          </Grid>
        </Grid>
        <Grid textAlign={"right"} item xs={4}></Grid>
      </Grid>
      <Divider />
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        textAlign={"left"}
        alignItems={"center"}
        alignSelf={"start"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Typography style={TextFontSize30LineHeight38}>{title}</Typography>
      </Grid>
    </>
  );
};

export default Header;
