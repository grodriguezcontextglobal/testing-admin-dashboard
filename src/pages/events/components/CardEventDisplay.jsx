import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import ReusableCardWithFooter from "../../../components/UX/cards/ReusableCardWithFooter";
import {
  onAddEventData,
  onAddExtraServiceListSetup,
  onAddExtraServiceNeeded,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../store/slices/subscriptionSlice";
import { CardStyle } from "../../../styles/global/CardStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import displayMonth from "../quickGlance/components/formatEventDetailInfo/displayMonth";
import WeekdayDifference from "../utils/DateDifference";
import {
  countdownBadgeColors,
  getCountdownLabel,
  getEventMetrics,
  getLogisticsStatus,
  logisticsChipColors,
} from "../utils/eventStatusHelpers";
import convertMilitaryToRegularTime from "../utils/militaryTimeTransform";
import renderingStatusUIComponent from "./renderingStatusUIComponent";

const CardEventDisplay = ({ props }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)",
  );
  const checkActiveEvent = (active) => {
    return active;
  };
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
  const quickGlance = async (props) => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: props.eventInfoDetail.address.split(" ").at(-1),
        event_name: props.eventInfoDetail.eventName,
      },
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(props.eventInfoDetail.eventName));
      dispatch(onSelectCompany(props.company));
      dispatch(
        onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) }),
      );
      dispatch(onAddSubscription(props.subscription));
      dispatch(
        onAddQRCodeLink(
          props.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              props.eventInfoDetail.eventName,
            )}&company=${encodeURI(props.company)}`,
        ),
      );
      dispatch(onAddExtraServiceListSetup(props.extraServiceListSetup));
      dispatch(onAddExtraServiceNeeded(props.extraServiceNeeded));
      return navigate("/events/event-quickglance");
    }
    dispatch(onSelectEvent(props.eventInfoDetail.eventName));
    dispatch(onSelectCompany(props.company));
    dispatch(onAddEventData(props));
    dispatch(onAddSubscription(props.subscription));
    dispatch(
      onAddQRCodeLink(
        props.qrCodeLink ??
          `https://app.devitrak.net/?event=${encodeURI(
            props.eventInfoDetail.eventName,
          )}&company=${encodeURI(props.company)}`,
      ),
    );
    navigate("/events/event-quickglance");
  };
  const [weekdayCount, setWeekdayCount] = useState(null);

  const handleWeekdayCountCalculated = (count) => {
    return setWeekdayCount(count);
  };

  const reminderEventBegins = async () => {
    const adminMembers = props.staff.adminUser;
    for (let member of adminMembers) {
      await devitrakApi.post("/nodemailer/events-begin-reminder", {
        staff: member.email,
        subject: "Event begin reminder",
        daysToEvent: weekdayCount,
        event: props.eventInfoDetail.eventName,
        message: `Please ensure that the serial number range of each device is assigned before the event starts. If all serial numbers have already been assigned, please disregard this message.`,
      });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (weekdayCount !== null) {
      if (weekdayCount > 0 && weekdayCount <= 10) {
        reminderEventBegins();
        return setWeekdayCount(null);
      }
    }
    return () => {
      controller.abort();
    };
  }, []);
  const cardStyle = {
    ...CardStyle,
    border: "1px solid var(--gray-200)",
    boxShadow:
      "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
    background: "var(--basewhite)",
  };
  const cardActions = [renderingStatusUIComponent({ props, quickGlance, checkActiveEvent })];
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
                fontSize: "20px",
                lineHeight: "28px",
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
                  display: `${(isSmallDevice || isMediumDevice || !props.eventInfoDetail.logo) && "none"}`,
                }}
              >
                {props.eventInfoDetail.logo && (
                  <Avatar
                    src={
                      props.eventInfoDetail.logo
                    }
                    size={70}
                  />
                )}
              </div>
              <div style={{ width: props.eventInfoDetail.logo ? "85%" : "100%" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <Tooltip title={`${props.eventInfoDetail.eventName}`}>
                    {props.eventInfoDetail.eventName}
                  </Tooltip>
                  {(() => {
                    const { text, tone } = getCountdownLabel(props);
                    const { bg, fg } = countdownBadgeColors(tone);
                    return (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          lineHeight: "18px",
                          padding: "2px 9px",
                          borderRadius: "999px",
                          background: bg,
                          color: fg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {text}
                      </span>
                    );
                  })()}
                </span>
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
        {(() => {
          const { totalDevices, deviceGroups, staff } = getEventMetrics(props);
          const logistics = getLogisticsStatus(props);
          const statStyle = {
            display: "flex",
            flexDirection: "column",
            lineHeight: 1.2,
          };
          const numStyle = {
            fontFamily: "Inter",
            fontSize: "17px",
            fontWeight: 500,
            color: "var(--gray-900, #101828)",
          };
          const lblStyle = {
            fontFamily: "Inter",
            fontSize: "11px",
            color: "var(--gray-500, #667085)",
          };
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "24px",
                padding: "14px 0 4px",
                borderTop: "1px solid var(--gray-200, #EAECF0)",
                marginTop: "4px",
              }}
            >
              <div style={statStyle}>
                <span style={numStyle}>{totalDevices.toLocaleString()}</span>
                <span style={lblStyle}>Devices</span>
              </div>
              <div style={statStyle}>
                <span style={numStyle}>{deviceGroups}</span>
                <span style={lblStyle}>
                  {deviceGroups === 1 ? "Group" : "Groups"}
                </span>
              </div>
              <div style={statStyle}>
                <span style={numStyle}>{staff}</span>
                <span style={lblStyle}>
                  {staff === 1 ? "Staff member" : "Staff"}
                </span>
              </div>
              {logistics && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "12px",
                    fontWeight: 500,
                    lineHeight: "18px",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    ...(() => {
                      const { bg, fg } = logisticsChipColors(logistics.tone);
                      return { background: bg, color: fg };
                    })(),
                  }}
                >
                  {logistics.label}
                </span>
              )}
            </div>
          );
        })()}
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

export default CardEventDisplay;
