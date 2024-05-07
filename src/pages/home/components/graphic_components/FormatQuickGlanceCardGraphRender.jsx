import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Card, Space } from "antd";
import DevicesInventoryGraph from "./DevicesInventoryGraph";
import { PropTypes } from "prop-types";
import CenteringGrid from "../../../../styles/global/CenteringGrid";

const legend = ['Checked out',
  'Not-Functional Report',
  'On hands',
  'Lost']
const COLORS = ["#00359E", "#155EEF", "#84ADFF", "#fb6b6b"];

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
          body:{
            padding: "10px 10px 0px 10px",
            height: "19.5rem",  
          },
          header:{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }
        }}
        // headStyle={{
        //   width: "100%",
        //   display: "flex",
        //   justifyContent: "space-between",
        //   alignItems: "center",
        // }}
        // bodyStyle={{
        //   padding: "10px 10px 0px 10px",
        //   height: "19.5rem",
        // }}
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
          justifyContent={"space-around"}
          alignItems={"center"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            padding={"0px 24px"}
            height={200}
            item
            xs={12}
          >
            <DevicesInventoryGraph dataToRender={dataToRender} />
          </Grid>

          <Space size={[8, 16]} wrap>
            {legend.map((item, index) => {
              return <Typography
                key={item}
                fontFamily={"Inter"}
                fontSize={"12px"}
                fontStyle={"normal"}
                fontWeight={400}
                lineHeight={"18px"}
                textAlign={"right"}
                color={COLORS[index]}
                style={CenteringGrid}
              >
                <Icon icon="tabler:point-filled" width={25} height={25} color={`${COLORS[index]}`}/>{item}
              </Typography>
            })}
          </Space>
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
