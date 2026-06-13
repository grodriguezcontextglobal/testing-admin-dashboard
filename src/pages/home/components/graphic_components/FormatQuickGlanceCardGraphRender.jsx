import { Grid, Typography } from "@mui/material";
import { PropTypes } from "prop-types";
import ReusableCardWithHeaderAndFooter from "../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import DevicesInventoryGraph from "./DevicesInventoryGraph";

const FormatQuickGlanceCardGraphRender = ({
  dataToRender,
  totalDeviceInRange,
  index,
}) => {
  const renderTitle = () => {
    return (
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        item
        xs={10}
      >
        <Typography style={TextFontsize18LineHeight28}>
          Devices inventory
        </Typography>
      </Grid>
    );
  };

  const cardStyles = {
    body: {
      padding: "10px 10px 0px 10px",
      height: "19.5rem",
    },
    header: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
  };

  // const cardActions = [
  //   <Typography
  //     style={{
  //       ...Subtitle,
  //       padding: "10px 24px",
  //       fontWeight: 600,
  //     }}
  //     key={"render-total-device-activity"}
  //   >
  //     Total:&nbsp;{totalDeviceInRange}
  //   </Typography>,
  // ];

  return (
    <ReusableCardWithHeaderAndFooter
      id={`total-device-inventory-${index + 1}`}
      key={index + 1}
      title={renderTitle()}
      // actions={cardActions}
      style={cardStyles}
    >
      <DevicesInventoryGraph
        dataToRender={dataToRender}
        total={totalDeviceInRange}
      />
    </ReusableCardWithHeaderAndFooter>
  );
};

export default FormatQuickGlanceCardGraphRender;

FormatQuickGlanceCardGraphRender.propTypes = {
  dataToRender: PropTypes.array,
  totalDeviceInRange: PropTypes.number,
  index: PropTypes.number,
};
