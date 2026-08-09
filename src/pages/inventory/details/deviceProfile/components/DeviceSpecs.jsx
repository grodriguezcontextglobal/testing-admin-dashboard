import PropTypes from "prop-types";
import { checkValidJSON } from "../../../../../components/utils/checkValidJSON";
import { formatLoanDate } from "../../../../../components/UX/profile";
import { clean, parseSubLocations, resolveLocation } from "../utils/deviceProfileModel";
import "../deviceProfile.css";

/**
 * The spec sheet.
 *
 * These are the facts the old page put in 30px type at the top — true, but not
 * what anyone opens a device to find out. They live here, and the tiles above
 * answer the questions instead.
 */

const Row = ({ label, value }) =>
  value === null || value === undefined || value === "" ? null : (
    <div className="device-spec">
      <span className="device-spec__key">{label}</span>
      <span className="device-spec__value">{value}</span>
    </div>
  );

Row.propTypes = { label: PropTypes.string, value: PropTypes.node };

const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : null;
};

const DeviceSpecs = ({ item }) => {
  const subs = parseSubLocations(item.sub_location);

  // extra_serial_number is a JSON array of {keyObject, valueObject} pairs —
  // per-company custom fields (IMEI, asset tag, MAC).
  const extras = (() => {
    const parsed = checkValidJSON(item.extra_serial_number);
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.keyObject) : [];
  })();

  return (
    <div className="device-specs">
      <div className="device-spec-list">
        <Row label="Serial number" value={clean(item.serial_number) || null} />
        <Row label="Model" value={clean(item.item_group) || null} />
        <Row label="Category" value={clean(item.category_name) || null} />
        <Row label="Brand" value={clean(item.brand) || null} />
        <Row label="Description" value={clean(item.descript_item) || null} />
        {extras.map((entry) => (
          <Row
            key={entry.keyObject}
            label={entry.keyObject}
            value={clean(entry.valueObject) || null}
          />
        ))}
      </div>

      <div className="device-spec-list">
        <Row
          label="Ownership"
          value={clean(item.ownership) === "Rent" ? "Leased" : clean(item.ownership) || null}
        />
        <Row label="Value" value={money(item.cost)} />
        <Row label="Condition" value={clean(item.condition) || "Operational"} />
        <Row label="Location" value={resolveLocation(item) ?? "Not recorded"} />
        {subs.length > 1 && <Row label="Sub-locations" value={subs.join(" · ")} />}
        <Row label="Added" value={formatLoanDate(item.create_at)} />
        {clean(item.return_date) && (
          <Row label="Return to supplier" value={formatLoanDate(item.return_date)} />
        )}
      </div>
    </div>
  );
};

DeviceSpecs.propTypes = {
  item: PropTypes.object.isRequired,
};

export default DeviceSpecs;
