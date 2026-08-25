import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../api/devitrakApi";
import { getIndustryProfile } from "../../../config/industryProfiles";
import { notifyStatus } from "../../../components/notification/alerts/useStatusNotification";
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
  LOGISTICS_LEGEND,
  LOGISTICS_TOTAL_STEPS
} from "../utils/eventStatusHelpers";
import convertMilitaryToRegularTime from "../utils/militaryTimeTransform";
import renderingStatusUIComponent from "./renderingStatusUIComponent";

const CardEventDisplay = ({ props }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.admin);
  // Attendees per event (Students for schools, Consumers elsewhere) — shares
  // the home-KPI query key, so all cards reuse ONE cached request.
  const industryProfile = getIndustryProfile(user?.companyData?.industry);
  const audienceLabel = industryProfile.audience ?? "Consumers";
  const audienceSingular = audienceLabel.replace(/s$/i, "");
  const consumersStatsQuery = useQuery({
    queryKey: ["allConsumersBasedOnEventsPerCompany"],
    queryFn: () =>
      devitrakApi.get(
        `/auth/all-consumers-based-on-all-events-per-company/${user.companyData.id}`
      ),
    enabled: !!user?.companyData?.id,
    staleTime: 5 * 60 * 1000,
  });
  const attendeesByEvent = (() => {
    try {
      const raw = consumersStatsQuery.data?.data?.result?.usersList;
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(list)) return {};
      const map = {};
      for (const u of list) {
        const evs = Array.isArray(u?.eventSelected)
          ? u.eventSelected
          : [u?.eventSelected].filter(Boolean);
        for (const ev of evs) map[ev] = (map[ev] || 0) + 1;
      }
      return map;
    } catch {
      return {};
    }
  })();
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
    // This lookup is enrichment (it merges a `sql` field onto the event data),
    // not a precondition for opening quick glance. It used to be unguarded: any
    // non-2xx response from /db_event/events_information — a zip that doesn't
    // resolve to a company match, a 404, a 500 — rejects the promise, and
    // nothing here caught it. Both navigate() calls sit AFTER this await, so the
    // rejection stopped execution before either could run. The button did
    // nothing: no error, no navigation, nothing in the console. Wrapping it
    // means a failed lookup degrades to opening quick glance without the `sql`
    // merge, instead of not opening at all.
    let sqlEventInfo = null;
    try {
      const sqpFetchInfo = await devitrakApi.post(
        "/db_event/events_information",
        {
          zip_address: props.eventInfoDetail.address.split(" ").at(-1),
          event_name: props.eventInfoDetail.eventName,
        },
      );
      if (sqpFetchInfo.data.ok) {
        sqlEventInfo = sqpFetchInfo.data.events.at(-1);
      }
    } catch {
      notifyStatus(
        "warning",
        "Could not load additional event details",
        "Opening quick glance with what's already available.",
      );
    }
    dispatch(onSelectEvent(props.eventInfoDetail.eventName));
    dispatch(onSelectCompany(props.company));
    dispatch(
      onAddEventData(sqlEventInfo ? { ...props, sql: sqlEventInfo } : props),
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
    // Previously dispatched only on the ok:true branch, so a failed lookup also
    // meant quick glance opened with extra-services state missing from Redux —
    // this isn't enrichment, it's already sitting on `props`.
    dispatch(onAddExtraServiceListSetup(props.extraServiceListSetup));
    dispatch(onAddExtraServiceNeeded(props.extraServiceNeeded));
    return navigate("/events/event-quickglance");
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
          const { totalDevices, staff } = getEventMetrics(props);
          const eventName = props?.eventInfoDetail?.eventName;
          const attendeeCount = (attendeesByEvent && attendeesByEvent[eventName]) || 0;
          const logistics = getLogisticsStatus(props);
          const dicInventoryLogistic = {
            "no_received_yet": "Not Received Yet",
            "received": "Received",
            "in-idle": "Received At Event",
            "completed": "Returned to warehouse",
            "in-transit": "In Transit back to warehouse",
          }
          const inventoryLogisticStatus = dicInventoryLogistic[props.logistic_inventory_status] ?? "No data";
          // const inventoryBadge = getInventoryBadgeProps(props);
          const stats = [
            { value: totalDevices.toLocaleString(), label: "Devices" },
            {
              value: attendeeCount.toLocaleString(),
              label: attendeeCount === 1 ? audienceSingular : audienceLabel,
            },
            { value: staff, label: staff === 1 ? "Staff member" : "Staff" },
            { value: inventoryLogisticStatus, label: "Inventory logistic status" },
          ];
          return (
            <div
              style={{
                borderTop: "1px solid var(--gray-200, #EAECF0)",
                marginTop: "16px",
                paddingTop: "16px",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", gap: "32px", width: "100%" }}>
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}
                  >
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontSize: "18px",
                        fontWeight: 500,
                        lineHeight: "24px",
                        color: "var(--gray-900, #101828)",
                      }}
                    >
                      {stat.value}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontSize: "12px",
                        lineHeight: "16px",
                        color: "var(--gray-500, #667085)",
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* {inventoryBadge && (
                <div style={{ marginTop: "12px" }}>
                  <BadgeWithDot color={inventoryBadge.color} size="sm">
                    {inventoryBadge.label}
                  </BadgeWithDot>
                </div>
              )} */}
              {logistics && (
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontFamily: "Inter",
                      fontSize: "12px",
                      lineHeight: "16px",
                      color: "var(--gray-500, #667085)",
                      marginBottom: "8px",
                    }}
                  >
                    Equipment location
                    <Tooltip
                      title={
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            padding: "2px 0",
                          }}
                        >
                          {LOGISTICS_LEGEND.map((stage) => (
                            <div
                              key={stage.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "9999px",
                                  background: stage.color,
                                  flexShrink: 0,
                                }}
                              />
                              <span>
                                <span style={{ fontWeight: 500 }}>
                                  {stage.label}
                                </span>{" "}
                                — {stage.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      }
                    >
                      <span
                        aria-label="Equipment location statuses"
                        style={{
                          display: "inline-flex",
                          cursor: "help",
                          color: "var(--gray-400, #98A2B3)",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </span>
                    </Tooltip>
                  </div>
                  <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                    {Array.from({ length: LOGISTICS_TOTAL_STEPS }, (_, idx) => (
                      <span
                        key={idx}
                        style={{
                          flex: 1,
                          height: "6px",
                          borderRadius: "9999px",
                          background:
                            idx < logistics.step
                              ? logistics.barColor
                              : "var(--gray-200, #EAECF0)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      display: "block",
                      marginTop: "6px",
                      fontFamily: "Inter",
                      fontSize: "12px",
                      fontWeight: 500,
                      lineHeight: "16px",
                      color: logistics.labelColor,
                    }}
                  >
                    {logistics.label}
                  </span>
                </div>
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
