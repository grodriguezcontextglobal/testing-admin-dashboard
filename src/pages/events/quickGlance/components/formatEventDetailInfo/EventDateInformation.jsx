import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Card, Tooltip } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import UpdateEventInfo from "../../updateEvent/UpdateEventInfo";
import { EventPeriodFormatDisplay } from "./EventPeriodFormatDisplay";

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
          border: "1px solid var(--gray-200, #EAECF0)",
          borderRadius: "12px",
          width: "100%",
        }}
        styles={{
          header: {
            borderBottom: "1px solid var(--gray-200, #EAECF0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "var(--main-background-color)",
          },
          body: {
            background: "var(--main-background-color)",
            textAlign: "left",
            width: "100%",
            padding: "16px",
          },
        }}
      >
        <Grid container>
          <Grid item xs={12}>
            <EventPeriodFormatDisplay event={event} styleText={TextFontSize30LineHeight38} />
          </Grid>
          {/* Hide the time row when begin/end times are identical — an
              identical range ("8:07 PM – 8:07 PM") reads as a bug, and events
              created without explicit hours land in this state. */}
          {(() => {
            const beginTimeLabel = `${hourBeginTime}:${minutesBeginTime} ${new Date(`${event?.eventInfoDetail?.dateBegin}`).getHours() < 12 ? "AM" : "PM"}`;
            const endTimeLabel = `${hourEndTime}:${minutesEndTime} ${new Date(`${event?.eventInfoDetail?.dateEnd}`).getHours() < 12 ? "AM" : "PM"}`;
            if (beginTimeLabel === endTimeLabel) return null;
            return (
              <Grid item xs={12} style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mdi:clock-outline" width={16} style={{ color: "var(--gray-500, #667085)", flexShrink: 0 }} />
                <Typography style={Subtitle}>
                  {beginTimeLabel}
                  {" – "}
                  {endTimeLabel}
                  {" local time"}
                </Typography>
              </Grid>
            );
          })()}
          <Grid item xs={12} style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <Icon icon="mdi:map-marker-outline" width={16} style={{ color: "var(--gray-500, #667085)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <Typography style={{ ...Subtitle, fontWeight: 600 }}>
                  {event?.eventInfoDetail?.building}
                </Typography>
                <Typography style={{ ...Subtitle, marginTop: "2px" }}>
                  {[addressSplitting().address, addressSplitting().cityAndState, addressSplitting().zip]
                    .filter(Boolean)
                    .filter(
                      (segment) =>
                        segment.trim().toLowerCase() !==
                        (event?.eventInfoDetail?.building ?? "").trim().toLowerCase()
                    )
                    .join(", ")}
                </Typography>
              </div>
            </div>
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
