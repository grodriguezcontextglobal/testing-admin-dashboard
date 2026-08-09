import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { formatLoanDate } from "../../../../../components/UX/profile";
import { clean, resolveLocation } from "../utils/deviceProfileModel";
import "../deviceProfile.css";

/**
 * The right rail: the facts worth keeping on screen while you move between
 * tabs, plus the one piece of cross-device context an operator asks for next
 * ("do I have another one").
 */

const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "—";
};

const DeviceSidebar = ({ item, fleet, utilization }) => {
  const fleetHref = `/inventory?item_group=${encodeURIComponent(
    clean(item.item_group)
  )}`;

  return (
    <aside className="device-rail">
      <section className="device-card">
        <div className="device-card__head">
          <h3 className="device-card__title">At a glance</h3>
        </div>
        <div className="device-spec-list">
          <div className="device-spec">
            <span className="device-spec__key">Serial</span>
            <span className="device-spec__value">
              {clean(item.serial_number) || "—"}
            </span>
          </div>
          <div className="device-spec">
            <span className="device-spec__key">Value</span>
            <span className="device-spec__value">{money(item.cost)}</span>
          </div>
          <div className="device-spec">
            <span className="device-spec__key">Ownership</span>
            <span className="device-spec__value">
              {clean(item.ownership) === "Rent"
                ? "Leased"
                : clean(item.ownership) || "—"}
            </span>
          </div>
          <div className="device-spec">
            <span className="device-spec__key">Condition</span>
            <span className="device-spec__value">
              {clean(item.condition) || "Operational"}
            </span>
          </div>
          <div className="device-spec">
            <span className="device-spec__key">Location</span>
            <span className="device-spec__value">
              {resolveLocation(item) ?? "Not recorded"}
            </span>
          </div>
          <div className="device-spec">
            <span className="device-spec__key">Added</span>
            <span className="device-spec__value">
              {formatLoanDate(item.create_at) ?? "—"}
            </span>
          </div>
        </div>
      </section>

      {fleet && fleet.total > 1 && (
        <section className="device-card">
          <div className="device-card__head">
            <h3 className="device-card__title">Rest of the fleet</h3>
          </div>
          <p className="device-rail__text">
            <strong>
              {fleet.out} of {fleet.total}
            </strong>{" "}
            {clean(item.item_group) || "units"}{" "}
            {fleet.out === 1 ? "is" : "are"} out right now.
          </p>
          <div
            className="device-meter"
            role="img"
            aria-label={`${fleet.out} of ${fleet.total} out on assignment`}
          >
            <span
              className="device-meter__fill"
              style={{
                width: `${Math.round((fleet.out / fleet.total) * 100)}%`,
              }}
            />
          </div>
          <p className="device-card__note">
            {fleet.inStock} available ·{" "}
            <Link to={fleetHref}>See all {fleet.total}</Link>
          </p>
        </section>
      )}

      {utilization && (
        <section className="device-card">
          <div className="device-card__head">
            <h3 className="device-card__title">Utilization</h3>
            <span className="device-card__note">
              last {utilization.windowDays} days
            </span>
          </div>
          <p className="device-rail__text">
            Assigned on <strong>{utilization.daysOut}</strong> of the last{" "}
            {utilization.windowDays} days
            {utilization.daysOut === 0 && " — it has sat on the shelf."}
          </p>
          <div className="device-meter">
            <span
              className="device-meter__fill"
              style={{ width: `${Math.round(utilization.ratio * 100)}%` }}
            />
          </div>
        </section>
      )}
    </aside>
  );
};

DeviceSidebar.propTypes = {
  item: PropTypes.object.isRequired,
  fleet: PropTypes.shape({
    total: PropTypes.number,
    inStock: PropTypes.number,
    out: PropTypes.number,
  }),
  utilization: PropTypes.shape({
    daysOut: PropTypes.number,
    windowDays: PropTypes.number,
    ratio: PropTypes.number,
  }),
};

DeviceSidebar.defaultProps = {
  fleet: null,
  utilization: null,
};

export default DeviceSidebar;
