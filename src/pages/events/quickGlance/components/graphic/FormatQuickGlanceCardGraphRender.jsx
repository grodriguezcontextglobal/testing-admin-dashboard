import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { PropTypes } from "prop-types";
// import DevicesInventoryGraph from "../../../../home/components/graphic_components/DevicesInventoryGraph";
// import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import ChartsRenderer from "../../../../../components/utils/ChartsRenderer";

// const legend = ["Checked out", "Not-Functional Report", "On hands", "Lost"];
// const COLORS = ["#00359E", "#155EEF", "#84ADFF", "#fb6b6b"];

const FormatQuickGlanceCardGraphRender = ({
  dataToRender,
  totalDeviceInRange,
  index,
}) => {
  const style = {
    padding: 0,
  };

  const renderTitle = () => {
    return (
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        item
        xs={10}
      >
        <Typography
          fontFamily={"Inter"}
          fontSize={"18px"}
          fontStyle={"normal"}
          fontWeight={600}
          lineHeight={"28px"}
          color={"var(--gray-900, #101828)"}
        >
          Devices inventory
        </Typography>
      </Grid>
    );
  };
  return (
    <Grid key={index + 1} style={style} item xs={12}>
      <Card
        title={renderTitle()}
        extra={
          <Typography
            fontFamily={"Inter"}
            fontSize={"14px"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"20px"}
            textAlign={"right"}
            color={"var(--gray-600, #475467)"}
          >
            <Icon icon="simple-line-icons:options-vertical" color="#98A2B3" />
          </Typography>
        }
        style={{
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #EAECF0)",
          background: "var(--base-white, #FFF)",
          boxShadow:
            "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
        }}
        styles={{
          head: {
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
          body: {
            padding: "10px 10px 0px 10px",
            height: "19.5rem",
          },
        }}
        actions={[
          <Typography
            key={"render-total-device-activity"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"24px"}
            textAlign={"right"}
            padding={"10px 24px"}
            color={"var(--gray-600, #475467)"}
          >
            Total:&nbsp;
            {totalDeviceInRange}
          </Typography>,
        ]}
      >
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <ChartsRenderer
              dataToRender={dataToRender}
              title="Inventory"
              orient="vertical"
              top="auto"
              right={0}
              showLabel={false}
              legendAlign="right"
              colors={["#00359E", "#f5b700", "#528BFF", "#b42318"]}
            />
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default FormatQuickGlanceCardGraphRender;

FormatQuickGlanceCardGraphRender.propTypes = {
  dataToRender: PropTypes.object,
  totalDeviceInRange: PropTypes.number,
  index: PropTypes.number,
};
