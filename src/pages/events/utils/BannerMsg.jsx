import { Button, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { Title } from "../../../styles/global/Title";

const BannerMsg = () => {
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      marginTop={5}
      container
    >
      <Grid
        margin={"auto"}
        display={"flex"}
        flexDirection={"column"}
        alignSelf={"stretch"}
        gap={"40px"}
        alignItems={"center"}
        item
        xs={10}
      >
        <Typography style={Title}>Add your event</Typography>
        <Typography
          style={{
            ...TextFontSize20LineHeight30, //*global attribute
            alignSelf: "stretch",
            textAlign: "center",
            padding: "0 5px",
            textWrap: "balance",
          }}
        >
          Creating an event will let you assign and manage devices, as well as
          staff to an event with a start and end date. You will also be able to
          assign devices to consumers, collect retain deposits, collect fees for
          damaged devices, and keep track of your full inventory.
        </Typography>
        {/* /event/new_subscription */}
        <Link to="/create-event-page/event-detail">
          <Button style={BlueButton}>
            <Typography style={BlueButtonText}>
              <WhiteCirclePlusIcon />
              &nbsp;Add new event
            </Typography>
          </Button>
        </Link>
      </Grid>
    </Grid>
  );
};

export default BannerMsg;
