import { Icon } from "@iconify/react";
import PropTypes from "prop-types";
import Chip from "../../../../components/UX/Chip/Chip";
import { getEventStatus } from "../../utils/getEventStatus";

/**
 * Status chip for an event: Live / Upcoming / Ended / Past end date,
 * with a relative-time hint ("ends in 2 days", "starts in 30 days").
 */
const DOT_COLORS = {
  live: "var(--success-500)",
  upcoming: "var(--brand-400)",
  pastEnd: "var(--warning-500)",
  ended: "var(--gray-500)",
};

const EventStatusChip = ({ event }) => {
  if (!event?.eventInfoDetail) return null;
  const status = getEventStatus(event);
  return (
    <Chip
      label={status.label}
      color={status.color}
      icon={<Icon icon="tabler:point-filled" color={DOT_COLORS[status.key]} />}
    />
  );
};

EventStatusChip.propTypes = {
  event: PropTypes.object,
};

export default EventStatusChip;
