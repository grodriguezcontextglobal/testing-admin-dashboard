import { PropTypes } from "prop-types";
import { Card } from "antd";

const CARD_STYLE = {
  borderRadius: "12px",
  border: "1px solid var(--gray-200, #EAECF0)",
  background: "var(--base-white, #FFF)",
  boxShadow:
    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
  cursor: "pointer",
  height: "100%",
};

const LABEL = {
  fontFamily: "Inter",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "18px",
  color: "var(--gray-500, #667085)",
  margin: 0,
};

/**
 * The rollup answer to a keyword like "Chromebook": how many units of that
 * category/group/brand the company owns, one click away from the group page.
 *
 * This deliberately reports the whole group rather than just the units the
 * Inventory section lists — "how many Chromebooks do we have" is the question it
 * answers. The assigned/on-the-shelf split underneath says where they are.
 */
const CardInventoryGroupFound = ({ props, fn }) => {
  const total = Number(props?.total ?? 0);
  const assigned = Number(props?.assigned ?? 0);
  return (
  <Card
    onClick={() => fn(props)}
    style={CARD_STYLE}
    styles={{ body: { padding: "16px 20px" } }}
  >
    <p style={LABEL}>{props?.category_name || "Uncategorized"}</p>
    <p
      style={{
        fontFamily: "Inter",
        fontSize: "16px",
        fontWeight: 600,
        lineHeight: "24px",
        color: "var(--gray-900, #101828)",
        textWrap: "pretty",
        margin: "2px 0 4px",
      }}
    >
      {props?.item_group || "Ungrouped"}
    </p>
    <p style={{ ...LABEL, marginBottom: "8px" }}>{props?.brand || "—"}</p>
    <p
      style={{
        fontFamily: "Inter",
        fontSize: "24px",
        fontWeight: 600,
        lineHeight: "32px",
        color: "var(--Primary-700, #6941C6)",
        margin: 0,
      }}
    >
      {total}
      <span
        style={{
          fontSize: "14px",
          fontWeight: 400,
          color: "var(--gray-600, #475467)",
          marginLeft: "6px",
        }}
      >
        {total === 1 ? "unit" : "units"}
      </span>
    </p>
    {assigned > 0 && (
      <p style={{ ...LABEL, marginTop: "6px" }}>
        {assigned} assigned · {Math.max(0, total - assigned)} on the shelf
      </p>
    )}
  </Card>
  );
};

export default CardInventoryGroupFound;

CardInventoryGroupFound.propTypes = {
  props: PropTypes.object.isRequired,
  fn: PropTypes.func.isRequired,
};
