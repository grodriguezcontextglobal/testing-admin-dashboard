import { Grid, Typography } from "@mui/material";
import { Avatar, Tooltip } from "antd";
import ReusableCardWithFooter from "../../../../components/UX/cards/ReusableCardWithFooter";
import { CardStyle } from "../../../../styles/global/CardStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import renderingStatusUIComponent from "../../../events/components/renderingStatusUIComponent";
import WeekdayDifference from "../../../events/utils/DateDifference";
import displayMonth from "../../../events/quickGlance/components/formatEventDetailInfo/displayMonth";
import convertMilitaryToRegularTime from "../../../events/utils/militaryTimeTransform";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useState } from "react";

const Card = ({ props, checkStatus, checkActiveEvent, quickGlance }) => {
  const cardStyle = {
    ...CardStyle,
    border: "1px solid var(--gray-200)",
    boxShadow:
      "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
    background: "var(--basewhite)",
  };
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)",
  );
  const substractingDateBeginInfo = () => {
    const date = new Date(`${props.eventInfoDetail.dateBegin}`)
      .toString()
      .split(" ");
    return date;
  };
  const substractingDateEndInfo = () => {
    const date = new Date(`${props.eventInfoDetail.dateEnd}`)
      .toString()
      .split(" ");
    return date;
  };
  // eslint-disable-next-line no-unused-vars
  const [weekdayCount, setWeekdayCount] = useState(null);

  const handleWeekdayCountCalculated = (count) => {
    return setWeekdayCount(count);
  };

  const cardActions = [
    renderingStatusUIComponent({ props, quickGlance, checkActiveEvent }),
  ];
  const children = () => {
    return (
      <>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          marginX={"auto"}
          marginTop={1}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
            padding={"18px 0"}
          >
            <Typography
              textTransform={"none"}
              style={{
                ...TextFontSize30LineHeight38,
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                textWrap: "pretty",
              }}
            >
              <div
                style={{
                  alignSelf: "stretch",
                  width: "15%",
                  display: `${(isSmallDevice || isMediumDevice) && "none"}`,
                }}
              >
                <Avatar
                  src={
                    props.eventInfoDetail.logo ??
                    props.eventInfoDetail.eventName
                  }
                  size={70}
                ></Avatar>
              </div>
              <div style={{ width: "85%" }}>
                <Tooltip title={`${props.eventInfoDetail.eventName}`}>
                  {" "}
                  {props.eventInfoDetail.eventName}
                </Tooltip>
                <br />
                <div
                  style={{
                    ...Subtitle,
                    fontWeight: 500,
                    textTransform: "none",
                    margin: "0.3rem 0 0 0",
                  }}
                >
                  {displayMonth(props.eventInfoDetail.dateBegin)}{" "}
                  {substractingDateBeginInfo()[2]}-
                  {substractingDateEndInfo()[2]} &nbsp;
                  {convertMilitaryToRegularTime(
                    new Date(`${props.eventInfoDetail.dateBegin}`).toString(),
                  )}
                  -
                  {convertMilitaryToRegularTime(
                    new Date(`${props.eventInfoDetail.dateEnd}`).toString(),
                  )}
                  &nbsp; ({substractingDateBeginInfo()[4]}-
                  {substractingDateEndInfo()[4]})
                </div>
              </div>
            </Typography>
          </Grid>
        </Grid>
        {
          <WeekdayDifference
            dateBegin={`${props.eventInfoDetail.dateBegin}`}
            onWeekdayCountCalculated={handleWeekdayCountCalculated}
          />
        }
      </>
    );
  };
  return (
    <ReusableCardWithFooter
      id="card-event-status"
      key={`card-event-status-pending-active-upcoming-${props.eventInfoDetail.dateEnd}`}
      actions={cardActions}
      style={cardStyle}
    >
      {children()}
    </ReusableCardWithFooter>
  );
};

export default Card;
