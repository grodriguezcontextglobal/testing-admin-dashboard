import { Grid, Typography } from "@mui/material";
import { Breadcrumb, Button, Divider } from "antd";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { Link, useNavigate } from "react-router-dom";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { useMediaQuery } from "@uidotdev/usehooks";

const Header = ({ title, category }) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const navigate = useNavigate();

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
        <Grid
          textAlign={"right"}
          display={`${isSmallDevice || isMediumDevice ? "none" : "flex"}`}
          justifyContent={"flex-end"}
          alignItems={"center"}
          gap={1}
          item
          md={6}
        >
          <Button
            onClick={() =>
              navigate("/inventory/edit-group", {
                state: {
                  deviceName: title,
                },
              })
            }
            style={{ ...BlueButton, width: "fit-content" }}
          >
            <p style={{ ...BlueButtonText, textTransform: "none" }}>
              Update a group of device
            </p>
          </Button>
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
