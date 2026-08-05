import { PropTypes } from "prop-types";
import { Avatar, Card } from "antd";

const CARD_STYLE = {
  borderRadius: "12px",
  border: "1px solid var(--gray-200, #EAECF0)",
  background: "var(--base-white, #FFF)",
  boxShadow:
    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
  cursor: "pointer",
  height: "100%",
};

const CardMemberFound = ({ props, fn }) => {
  const location = [props?.address_city, props?.address_state]
    .filter(Boolean)
    .join(", ");
  return (
    <Card
      onClick={() => fn(props)}
      style={CARD_STYLE}
      styles={{ body: { padding: "16px 20px 20px" } }}
    >
      <div style={{ marginBottom: "12px" }}>
        <Avatar
          src={props?.image_url || undefined}
          style={{ width: "3.5rem", height: "3.5rem" }}
        >
          {!props?.image_url &&
            `${props?.first_name?.[0] ?? ""}${props?.last_name?.[0] ?? ""}`}
        </Avatar>
      </div>
      <p
        style={{
          fontFamily: "Inter",
          fontSize: "16px",
          fontWeight: 600,
          lineHeight: "24px",
          color: "var(--gray-900, #101828)",
          textWrap: "pretty",
          margin: "0 0 4px",
        }}
      >
        {[props?.first_name, props?.last_name].filter(Boolean).join(" ") || "—"}
      </p>
      <p
        style={{
          fontFamily: "Inter",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "20px",
          color: "var(--Primary-700, #6941C6)",
          overflowWrap: "anywhere",
          textWrap: "pretty",
          margin: "0 0 4px",
        }}
      >
        {props?.email || "—"}
      </p>
      <p
        style={{
          fontFamily: "Inter",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "20px",
          color: "var(--gray-500, #667085)",
          margin: 0,
        }}
      >
        {props?.phone_number || location || "—"}
      </p>
    </Card>
  );
};

export default CardMemberFound;

CardMemberFound.propTypes = {
  props: PropTypes.object.isRequired,
  fn: PropTypes.func.isRequired,
};
