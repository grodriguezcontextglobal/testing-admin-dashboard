import { Grid, Typography } from "@mui/material";
import { PropTypes } from "prop-types";
import { lazy, Suspense } from "react";
import Loading from "../../../../components/animation/Loading";
import ReusableCardWithHeaderAndFooter from "../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
// import ChartsRenderer from "../../../../components/utils/ChartsRenderer";
const ChartsRenderer = lazy(
  () => import("../../../../components/utils/ChartsRenderer"),
);
const FormatQuickGlanceCardGraphRender = ({
  dataToRender,
  totalDeviceInRange,
  index,
}) => {
  // const style = {
  //   padding: 0,
  // };

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
          style={TextFontsize18LineHeight28}
          // fontFamily={"Inter"}
          // fontSize={"18px"}
          // fontStyle={"normal"}
          // fontWeight={600}
          // lineHeight={"28px"}
          // color={"var(--gray-900, #101828)"}
        >
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
  const cardActions = [
    <Typography
      style={{
        ...Subtitle,
        padding: "10px 24px",
        fontWeight: 600,
      }}
      key={"render-total-device-activity"}
      // fontFamily={"Inter"}
      // fontSize={"16px"}
      // fontStyle={"normal"}
      // lineHeight={"24px"}
      // textAlign={"right"}
      // padding={"10px 24px"}
      // color={"var(--gray-600, #475467)"}
    >
      Total:&nbsp;
      {totalDeviceInRange}
    </Typography>,
  ];
  const cardChildren = () => {
    return (
          <ChartsRenderer
            dataToRender={dataToRender}
            title=""
            orient="vertical"
            top="auto"
            right={0}
            showLabel={false}
            legendAlign="right"
            colors={["#84ADFF", "#155EEF", "#00359E", "#fb6b6b"]}
            radiusProps={["40%", "55%"]}
            innerWidth={'25rem'}
          />
    );
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      {/* <Grid key={index + 1} style={style} item xs={12}> */}
        <ReusableCardWithHeaderAndFooter
          id={`total-device-inventory-${index + 1}`}
          key={index + 1}
          title={renderTitle()}
          actions={cardActions}
          style={cardStyles}
        >
          {cardChildren()}
        </ReusableCardWithHeaderAndFooter>
      {/* </Grid> */}
    </Suspense>
  );
};

export default FormatQuickGlanceCardGraphRender;

FormatQuickGlanceCardGraphRender.propTypes = {
  dataToRender: PropTypes.Array,
  totalDeviceInRange: PropTypes.number,
  index: PropTypes.number,
};
