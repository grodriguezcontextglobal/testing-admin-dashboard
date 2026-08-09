import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import ActivityFeed from "../../../../../components/UX/activityFeed/ActivityFeed";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import { formatLoanDate } from "../../../../../components/UX/profile";

/**
 * The device's chain of custody.
 *
 * The old table put four columns on screen, two of which (Ownership, Status)
 * repeated the same device-level value on every row. The same rows read as a
 * timeline answer the question people actually arrive with: where has this
 * been, and who still owes it back.
 */

const ICONS = {
  assigned: { icon: "tabler:user-plus", color: "var(--blue-dark-600, #155dee)" },
  returned: { icon: "tabler:check", color: "var(--success700, #027947)" },
  overdue: { icon: "tabler:alert-circle", color: "var(--error-700, #b42318)" },
  created: { icon: "tabler:plus", color: "var(--gray500, #667084)" },
};

const personNode = (entry) => {
  if (entry.personKind === "member" && entry.personId) {
    return <Link to={`/member/${entry.personId}/main`}>{entry.personLabel}</Link>;
  }
  return entry.personLabel;
};

const describe = (entry) => {
  const parts = [];
  if (entry.kind === "assigned") {
    if (entry.dueDate) parts.push(`Due back ${formatLoanDate(entry.dueDate)}`);
    if (entry.location) parts.push(entry.location);
    if (entry.legacy) {
      // Pre-lease records carry no due date at all; say so rather than
      // letting the gap read as "returned on time".
      parts.push("Legacy record — no due date was captured");
    }
  }
  if (entry.kind === "returned" && entry.detail) parts.push(entry.detail);
  if (entry.kind === "created") {
    if (entry.cost !== null && entry.cost !== undefined) {
      parts.push(`$${Number(entry.cost).toFixed(2)}`);
    }
    if (entry.ownership) {
      parts.push(entry.ownership === "Rent" ? "Leased" : entry.ownership);
    }
  }
  return parts.join(" · ") || null;
};

const titleFor = (entry) => {
  switch (entry.kind) {
    case "assigned":
      return <>Assigned to {personNode(entry)}</>;
    case "returned":
      return <>Returned by {personNode(entry)}</>;
    case "overdue":
      return "Due date passed";
    default:
      return "Added to inventory";
  }
};

const CustodyTimeline = ({ entries, loan }) => {
  // The overdue marker is derived from the open lease, not stored — but it's
  // the most important thing in the chain, so it belongs at the top of it.
  const withOverdue =
    loan?.key === "overdue"
      ? [
          {
            id: "derived-overdue",
            kind: "overdue",
            date: null,
            overdueLabel: loan.label,
          },
          ...entries,
        ]
      : entries;

  if (withOverdue.length === 0) {
    return (
      <EmptyState
        icon="tabler:route"
        title="This device has never left the warehouse"
        description="Assignments and returns will appear here as a timeline once it goes out."
      />
    );
  }

  const items = withOverdue.map((entry) => ({
    id: entry.id,
    icon: (ICONS[entry.kind] ?? ICONS.created).icon,
    iconColor: (ICONS[entry.kind] ?? ICONS.created).color,
    title: titleFor(entry),
    description:
      entry.kind === "overdue"
        ? "Nobody has been reminded yet."
        : describe(entry),
    timestamp:
      entry.kind === "overdue"
        ? loan.label
        : formatLoanDate(entry.date) ?? "Date not recorded",
  }));

  return <ActivityFeed items={items} />;
};

CustodyTimeline.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object),
  loan: PropTypes.object,
};

CustodyTimeline.defaultProps = {
  entries: [],
  loan: null,
};

export default CustodyTimeline;
