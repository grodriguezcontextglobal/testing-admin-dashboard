import { useState } from "react";
import { Grid, Typography } from "@mui/material";
import { Card, Tooltip } from "antd";
import { useSelector } from "react-redux";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Icon } from "@iconify/react";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import displayMonth from "./displayMonth";
import UpdateEventInfo from "../../updateEvent/UpdateEventInfo";

const EventDateInformation = () => {
  const [openUpdateEventModal, setOpenUpdateEventModal] = useState(false);
  const { event } = useSelector((state) => state.event);
  const hourBeginTime =
    new Date(event?.eventInfoDetail?.dateBegin).getHours() > 12
      ? new Date(event?.eventInfoDetail?.dateBegin).getHours() - 12
      : new Date(event?.eventInfoDetail?.dateBegin).getHours();

  const hourEndTime =
    new Date(event?.eventInfoDetail?.dateEnd).getHours() > 12
      ? new Date(event?.eventInfoDetail?.dateEnd).getHours() - 12
      : new Date(event?.eventInfoDetail?.dateEnd).getHours();
  const minutesBeginTime =
    new Date(event?.eventInfoDetail?.dateBegin).getMinutes().toString()
      ?.length > 1
      ? new Date(event?.eventInfoDetail?.dateBegin).getMinutes()
      : `0${new Date(event?.eventInfoDetail?.dateBegin).getMinutes()}`;

  const minutesEndTime =
    new Date(event?.eventInfoDetail?.dateEnd).getMinutes().toString()?.length >
    1
      ? new Date(event?.eventInfoDetail?.dateEnd).getMinutes()
      : `0${new Date(event?.eventInfoDetail?.dateEnd).getMinutes()}`;
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");

  const addressSplitting = () => {
    const address = event?.eventInfoDetail?.address.split(",");
    return {
      address: address[0] ?? "",
      cityAndState: address[1] ?? "",
      zip: address[2] ?? "",
    };
  };
  addressSplitting();
  const renderTitle = () => {
    return (
      <Typography
        style={{
          ...TextFontsize18LineHeight28,
          textAlign: "left",
          fontWeight: 600,
        }}
      >
        Event dates
      </Typography>
    );
  };
  return (
    <>
      <Card
        title={renderTitle()}
        extra={
          event.active && (
            <Tooltip title="Update this section of the event">
              <Icon
                onClick={() => setOpenUpdateEventModal(true)}
                icon="uil:ellipsis-v"
                width={25}
              />
            </Tooltip>
          )
        }
        style={{
          border: "none",
        }}
        styles={{
          border: "none",
          header: {
            borderBottom: "transparent",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px 0 0",
            background: "var(--main-background-color)",
            border: "none",
          },
          body: {
            borderRadius: "12px",
            border: "none",
            background: "var(--main-background-color)",
            boxShadow: "none",
            textAlign: "left",
            width: "100%",
            padding: 0,
          },
          cover: {
            border: "none",
          },
        }}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-around"}
          alignItems={"center"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"left"}
            alignItems={"center"}
            textAlign={"left"}
            item
            xs={12}
          >
            <p style={{...TextFontSize30LineHeight38, textAlign: "left", paddingTop: "8px"}}>
              {displayMonth(`${event?.eventInfoDetail?.dateBegin}`)}
              &nbsp;
              {new Date(`${event?.eventInfoDetail?.dateBegin}`).getDate()}{" "}
              &nbsp;-&nbsp;
              {displayMonth(`${event?.eventInfoDetail?.dateEnd}`) !==
                displayMonth(`${event?.eventInfoDetail?.dateBegin}`) && <br />}
              {displayMonth(`${event?.eventInfoDetail?.dateEnd}`) !==
                displayMonth(`${event?.eventInfoDetail?.dateBegin}`) &&
                displayMonth(`${event?.eventInfoDetail?.dateEnd}`)}{" "}
              {new Date(`${event?.eventInfoDetail?.dateEnd}`).getDate()}
            </p>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"left"}
            alignItems={"center"}
            textAlign={"left"}
            item
            xs={12}
          >
            <Typography textAlign={"left"} paddingTop={"8px"} style={Subtitle}>
              {`${hourBeginTime}:${minutesBeginTime}`}
              {new Date(`${event?.eventInfoDetail?.dateBegin}`).getHours() < 12
                ? "AM"
                : "PM"}
              -
            </Typography>
            <Typography textAlign={"left"} paddingTop={"8px"} style={Subtitle}>
              {`${hourEndTime}:${minutesEndTime}`}
              {new Date(`${event?.eventInfoDetail?.dateEnd}`).getHours() < 12
                ? "AM"
                : "PM"}{" "}
            </Typography>
            <Typography textAlign={"left"} paddingTop={"8px"} style={Subtitle}>
              (
              {`${new Date(
                `${event?.eventInfoDetail?.dateBegin}`
              ).getHours()}:${minutesBeginTime}`}
              -
              {`${new Date(
                `${event?.eventInfoDetail?.dateEnd}`
              ).getHours()}:${minutesEndTime}`}
              )
              {!isSmallDevice && (
                <span
                  style={{
                    textTransform: "capitalize",
                    textDecoration: "underline",
                    textDecorationColor: "var(--gray-600, #475467)",
                  }}
                >
                  local time
                </span>
              )}
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"flex-start"}
            textAlign={"left"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              style={{
                width: "100%",
                ...Subtitle,
                fontWeight: 600,
              }}
              textAlign={"left"}
              paddingTop={"8px"}
              fontFamily={"Inter"}
            >
              {event?.eventInfoDetail?.building}
            </Typography>
            <Typography
              style={{
                width: "100%",
                ...Subtitle,
              }}
              textAlign={"left"}
              paddingTop={"8px"}
            >
              {addressSplitting().address}
            </Typography>
            <Typography
              style={{
                width: "100%",
                ...Subtitle,
                textTransform: "capitalize",
              }}
              textAlign={"left"}
              paddingTop={"8px"}
            >
              {addressSplitting().cityAndState}, {addressSplitting().zip}
            </Typography>{" "}
          </Grid>
        </Grid>
      </Card>
      <UpdateEventInfo
        openUpdateEventModal={openUpdateEventModal}
        setOpenUpdateEventModal={setOpenUpdateEventModal}
        title={"Update event info"}
      />
    </>
  );
};

export default EventDateInformation;
