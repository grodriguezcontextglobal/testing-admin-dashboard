import PropTypes from "prop-types";
import "./profileShell.css";

/**
 * The at-a-glance row. Answers the question people actually open a profile
 * with — what is this person holding, and is any of it late?
 *
 * At most one tile should carry tone="critical": the severity stripe only
 * works as an alarm while it's the single loudest thing on the page.
 */
const ProfileStatTiles = ({ tiles, testId }) => {
  const visible = (tiles ?? []).filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <section className="profile-stats" aria-label="At a glance" data-testid={testId}>
      {visible.map((tile) => (
        <div
          key={tile.label}
          className={`profile-tile${tile.tone === "critical" ? " profile-tile--critical" : ""}`}
          data-testid={tile.testId}
        >
          <span className="profile-tile__value">{tile.value}</span>
          <span className="profile-tile__label">{tile.label}</span>
          {tile.sub && <span className="profile-tile__sub">{tile.sub}</span>}
        </div>
      ))}
    </section>
  );
};

ProfileStatTiles.propTypes = {
  tiles: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.node,
      label: PropTypes.string.isRequired,
      sub: PropTypes.node,
      tone: PropTypes.oneOf(["neutral", "critical"]),
      testId: PropTypes.string,
    })
  ),
  testId: PropTypes.string,
};

ProfileStatTiles.defaultProps = {
  tiles: [],
  testId: "profile-stats",
};

export default ProfileStatTiles;
