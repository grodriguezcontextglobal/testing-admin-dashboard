import { useMediaQuery, useTheme } from "@mui/material";
import PropTypes from "prop-types";
import Chip from "../../../components/UX/Chip/Chip";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../components/UX/buttons/DangerButtonConfirmation";
import BaseTable from "../../../components/UX/tables/BaseTable";

/**
 * Events whose setup was started and not finished (meeting 2026-09-29
 * `38:42`–`40:16`). They used to sit in Past as "Closed"; here each one says
 * it is a draft and offers the two things you do with one — finish it, or
 * delete it.
 *
 * Presentational: resuming and deleting are the caller's (useDraftEventActions),
 * so this can be tested without a store, a router or a server.
 */
const formatRange = (detail) => {
  const begin = new Date(detail?.dateBegin);
  const end = new Date(detail?.dateEnd);
  if (Number.isNaN(begin.getTime())) return "—";
  const day = (date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return Number.isNaN(end.getTime()) || day(begin) === day(end)
    ? day(begin)
    : `${day(begin)} – ${day(end)}`;
};

const DraftEventsTable = ({ drafts, onResume, onDelete, canResume, canDelete, busyId }) => {
  // Side by side from md up, one above the other below it (2026-09-30).
  const theme = useTheme();
  const stacked = useMediaQuery(theme.breakpoints.down("md"));
  const columns = [
    {
      title: "Event",
      key: "name",
      render: (_, event) => (
        <span style={{ font: "500 14px/20px Inter, sans-serif" }}>
          {event?.eventInfoDetail?.eventName ?? "Untitled event"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: () => <Chip label="Draft" color="default" />,
    },
    {
      title: "Dates",
      key: "dates",
      responsive: ["md"],
      render: (_, event) => (
        <span style={{ fontFamily: "Inter" }}>{formatRange(event?.eventInfoDetail)}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, event) => {
        const busy = busyId === event.id;
        const name = event?.eventInfoDetail?.eventName ?? "this event";
        return (
          <div
            data-draft-actions
            style={{
              display: "flex",
              flexDirection: stacked ? "column" : "row",
              alignItems: stacked ? "flex-end" : "center",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            {canResume && (
              <BlueButtonComponent
                title="Continue setup"
                buttonType="button"
                size="sm"
                disabled={busy}
                func={() => onResume(event)}
              />
            )}
            {canDelete && (
              <DangerButtonConfirmationComponent
                title="Delete"
                size="sm"
                disabled={busy}
                func={() => onDelete(event)}
                confirmationTitle={`Delete the draft “${name}”?`}
                confirmationDescription="It was never set up, so nothing is shipped or assigned yet. This cannot be undone."
                okText="Yes, delete"
                cancelText="Keep it"
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <BaseTable
      columns={columns}
      // rowKey, not a copied `key`: the buttons hand back the event itself.
      dataSource={drafts}
      rowKey="id"
      enablePagination={drafts.length > 10}
    />
  );
};

DraftEventsTable.propTypes = {
  drafts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onResume: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  canResume: PropTypes.bool,
  canDelete: PropTypes.bool,
  busyId: PropTypes.string,
};

export default DraftEventsTable;
