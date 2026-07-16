import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import checkTypeFetchResponse from "../../../components/utils/checkTypeFetchResponse";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import { getEventStatus } from "../../events/utils/getEventStatus";
import { sumDeviceSetup } from "./HomeKpiSection";

/**
 * Live-event snapshot for the home dashboard: which event is live right now
 * and how much of its device pool is checked out. Pool data via the same
 * receiver-pool endpoint the quick-glance page uses.
 */
const LiveEventSnapshot = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.get(
        `/event/event-list-per-company?company=${user.company}&type=event`
      ),
    enabled: !!user.companyData.id,
  });

  const events = eventsQuery.data?.data?.list ?? [];
  const liveEvent = events.find((e) => getEventStatus(e).key === "live");
  const liveEventName = liveEvent?.eventInfoDetail?.eventName;

  const poolQuery = useQuery({
    queryKey: ["home-live-pool", liveEventName],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: liveEventName,
        company: user.companyData.id,
      }),
    enabled: !!liveEventName,
  });

  if (!liveEvent) {
    return (
      <EmptyState
        compact
        icon="tabler:broadcast-off"
        title="No live event right now"
        description="When an event goes live, its device status will appear here."
      />
    );
  }

  const rawPool = poolQuery.data?.data?.receiversInventory;
  const pool = Array.isArray(checkTypeFetchResponse(rawPool))
    ? checkTypeFetchResponse(rawPool)
    : [];
  const total = pool.length || sumDeviceSetup(liveEvent);
  const checkedOut = pool.filter((d) => d.activity === true).length;
  const pct = total > 0 ? Math.round((checkedOut / total) * 100) : 0;
  const dates = liveEvent?.eventInfoDetail;

  const label = {
    margin: 0,
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    color: "var(--gray-600, #5d615a)",
  };

  return (
    <div style={{ textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "9999px",
            background: "var(--success-500, #12b76a)",
            flexShrink: 0,
          }}
        />
        <p
          style={{
            ...label,
            fontWeight: 600,
            color: "var(--gray-900, #171d1a)",
            fontSize: "16px",
          }}
        >
          {liveEventName}
        </p>
      </div>
      {dates?.dateBegin && dates?.dateEnd && (
        <p style={label}>
          {new Date(dates.dateBegin).toLocaleDateString()} –{" "}
          {new Date(dates.dateEnd).toLocaleDateString()}
        </p>
      )}
      <p
        style={{
          margin: "16px 0 8px",
          fontFamily: "Inter, sans-serif",
          fontSize: "30px",
          lineHeight: "38px",
          fontWeight: 600,
          color: "var(--gray-900, #171d1a)",
        }}
      >
        {checkedOut} of {total}
        <span
          style={{
            marginLeft: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--gray-500, #777b73)",
          }}
        >
          devices checked out
        </span>
      </p>
      <div
        style={{
          width: "100%",
          height: "10px",
          borderRadius: "9999px",
          background: "var(--gray-100, #f1f1f1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "9999px",
            background: "var(--action-600, #155eef)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <button
        onClick={() => navigate("/events")}
        style={{
          marginTop: "16px",
          background: "transparent",
          border: "none",
          padding: 0,
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--action-600, #155eef)",
          cursor: "pointer",
        }}
      >
        Go to events →
      </button>
    </div>
  );
};

export default LiveEventSnapshot;
