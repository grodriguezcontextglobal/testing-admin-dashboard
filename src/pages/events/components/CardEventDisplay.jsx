import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, Card, Tooltip } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { PointFilled, RightBlueNarrow } from "../../../components/icons/Icons";
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
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import displayMonth from "../quickGlance/components/formatEventDetailInfo/displayMonth";
import WeekdayDifference from "../utils/DateDifference";
import { checkStatus } from "../utils/checkStatus";
import convertMilitaryToRegularTime from "../utils/militaryTimeTransform";
import { useEffect, useState } from "react";

const CardEventDisplay = ({ props }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
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
      }
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(props.eventInfoDetail.eventName));
      dispatch(onSelectCompany(props.company));
      dispatch(
        onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) })
      );
      dispatch(onAddSubscription(props.subscription));
      dispatch(
        onAddQRCodeLink(
          props.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              props.eventInfoDetail.eventName
            )}&company=${encodeURI(props.company)}`
        )
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
            props.eventInfoDetail.eventName
          )}&company=${encodeURI(props.company)}`
      )
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
  return (
    <Card
      id="card-event-status"
      key={`card-event-status-pending-active-upcoming-${props.eventInfoDetail.dateEnd}`}
      style={{
        ...CardStyle,
        border: "1px solid var(--gray-200)",
        boxShadow:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
        background: "var(--basewhite)",
      }}
      actions={[
        <Grid
          key={`grid-card-home-action-footer-${props.id}`}
          item
          xs={12}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          textAlign={"right"}
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={6}
            padding={"0 0 0 18px"}
          >
            <Typography
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                borderRadius: "12px",
                padding: "1px 5px",
                backgroundColor: `${
                  checkStatus(
                    props.eventInfoDetail.dateBegin,
                    props.eventInfoDetail.dateEnd,
                    props.active
                  ) === "Upcoming"
                    ? "var(--blue-50, #EFF8FF)"
                    : "var(--success-50, #ECFDF3)"
                }`,
                color: `${
                  checkStatus(
                    props.eventInfoDetail.dateBegin,
                    props.eventInfoDetail.dateEnd,
                    props.active
                  ) === "Upcoming"
                    ? "var(--blue-700, #175CD3)"
                    : "var(--success-700, #027A48)"
                }`,
              }}
            >
              {checkActiveEvent(props?.active) ? (
                <PointFilled style={{ color: "#12b76a" }} />
              ) : (
                <PointFilled style={{ color: "#D0D5DD" }} />
              )}{" "}
              {checkStatus(
                props.eventInfoDetail.dateBegin,
                props.eventInfoDetail.dateEnd,
                props.active
              )}
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            item
            xs={6}
          >
            <Typography
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={600}
              lineHeight={"20px"}
              color="#004EEB"
              padding={"16px 24px"}
              style={{
                ...CenteringGrid,
                justifyContent: "flex-end",
                width: "100%",
              }}
              onClick={() => quickGlance(props)}
            >
              View event details &nbsp;
              <RightBlueNarrow />
            </Typography>
          </Grid>
        </Grid>,
      ]}
    >
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
                  props.eventInfoDetail.logo ?? props.eventInfoDetail.eventName
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
                {substractingDateBeginInfo()[2]}-{substractingDateEndInfo()[2]}{" "}
                &nbsp;
                {convertMilitaryToRegularTime(
                  new Date(`${props.eventInfoDetail.dateBegin}`).toString()
                )}
                -
                {convertMilitaryToRegularTime(
                  new Date(`${props.eventInfoDetail.dateEnd}`).toString()
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
    </Card>
  );
};

export default CardEventDisplay;
