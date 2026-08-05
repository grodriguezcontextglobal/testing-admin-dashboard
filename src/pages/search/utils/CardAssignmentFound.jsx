import { PropTypes } from "prop-types";
import { Card } from "antd";
import { BadgeWithDot } from "../../../components/base/badges/badges";

const CARD_STYLE = {
  borderRadius: "12px",
  border: "1px solid var(--gray-200, #EAECF0)",
  background: "var(--base-white, #FFF)",
  boxShadow:
    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
  cursor: "pointer",
  height: "100%",
};

const FIELD_LABEL = {
  fontFamily: "Inter",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "18px",
  color: "var(--gray-500, #667085)",
  margin: "0 0 2px",
};

const FIELD_VALUE = {
  fontFamily: "Inter",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-900, #101828)",
  textWrap: "pretty",
  overflowWrap: "anywhere",
  margin: 0,
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

/**
 * One open device assignment: who holds the unit and when it is due back.
 * This is what answers "who has this Chromebook" for a members-based company.
 */
const CardAssignmentFound = ({ props, fn }) => {
  const dueDate = props?.expected_return_date;
  const isOverdue = dueDate ? new Date(dueDate) < new Date() : false;
  const holder =
    [props?.first_name, props?.last_name].filter(Boolean).join(" ") ||
    "Unassigned";

  return (
    <Card
      onClick={() => fn(props)}
      style={CARD_STYLE}
      styles={{ body: { padding: "16px 20px" } }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <p
          style={{
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: 600,
            lineHeight: "24px",
            color: "var(--gray-900, #101828)",
            textWrap: "pretty",
            margin: 0,
          }}
        >
          {holder}
        </p>
        {isOverdue && (
          <BadgeWithDot color="error" size="sm">
            Overdue
          </BadgeWithDot>
        )}
      </div>

      <div style={{ marginBottom: "8px" }}>
        <p style={FIELD_LABEL}>Serial number</p>
        <p style={FIELD_VALUE}>{props?.serial_number || "—"}</p>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <p style={FIELD_LABEL}>Item</p>
        <p style={FIELD_VALUE}>
          {props?.item_group || props?.category_name || "—"}
        </p>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <p style={FIELD_LABEL}>Due back</p>
        <p
          style={{
            ...FIELD_VALUE,
            color: isOverdue
              ? "var(--Error-700, #B42318)"
              : "var(--gray-900, #101828)",
          }}
        >
          {formatDate(dueDate)}
        </p>
      </div>

      <div>
        <p style={FIELD_LABEL}>Location</p>
        <p style={{ ...FIELD_VALUE, fontSize: "13px" }}>
          {props?.lease_location || "—"}
        </p>
      </div>
    </Card>
  );
};

export default CardAssignmentFound;

CardAssignmentFound.propTypes = {
  props: PropTypes.object.isRequired,
  fn: PropTypes.func.isRequired,
};
