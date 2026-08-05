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

// item_inv.status is free text but settles on these three in practice
const STATUS_COLOR = {
  operational: "success",
  lost: "error",
  "in repair": "warning",
};

// item_inv.sub_location is stored as a JSON-stringified array (see
// singleItemIserting / bulkItemActionsOptions), so render it as a readable
// path rather than the raw '["Room 102"]'.
const parseSubLocation = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "string") return [parsed];
    return [];
  } catch {
    return [raw];
  }
};

const CardInventoryFound = ({ props, fn }) => {
  const status = props?.status || "Operational";
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
          {props?.item_group || props?.category_name || "Item"}
        </p>
        <BadgeWithDot
          color={STATUS_COLOR[String(status).toLowerCase()] ?? "gray"}
          size="sm"
        >
          {status}
        </BadgeWithDot>
      </div>

      {props?.image_url ? (
        <img
          src={props.image_url}
          alt={props?.serial_number}
          style={{
            objectFit: "cover",
            height: "auto",
            width: "60%",
            marginBottom: "12px",
            display: "block",
          }}
        />
      ) : null}

      <div style={{ marginBottom: "8px" }}>
        <p style={FIELD_LABEL}>Serial number</p>
        <p style={FIELD_VALUE}>{props?.serial_number || "—"}</p>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <p style={FIELD_LABEL}>Brand</p>
        <p style={FIELD_VALUE}>{props?.brand || "—"}</p>
      </div>

      <div>
        <p style={FIELD_LABEL}>Location</p>
        <p style={{ ...FIELD_VALUE, fontSize: "13px" }}>
          {[props?.location, ...parseSubLocation(props?.sub_location)]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>
    </Card>
  );
};

export default CardInventoryFound;

CardInventoryFound.propTypes = {
  props: PropTypes.object.isRequired,
  fn: PropTypes.func.isRequired,
};
