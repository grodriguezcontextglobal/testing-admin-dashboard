import PropTypes from "prop-types";
import "./dashboardMock.css";

/**
 * A schematic of a screen, drawn from the mock's rows.
 *
 * Deliberately not a screenshot. A screenshot goes stale the first time a
 * button moves and nobody notices, and it cannot be highlighted region by
 * region. A labelled block diagram stays true for as long as the screen has
 * that block — and it is the same decomposition the articles use, so the tour
 * and the prose describe the page the same way.
 *
 * The active region is drawn at full strength and the rest are dimmed, which
 * reads as "this part" without needing a spotlight overlay that would have to
 * be positioned against real geometry.
 */
const Row = ({ row }) => {
  const cells = row.cells ?? [];

  if (row.kind === "cards" || row.kind === "pills") {
    return (
      <div className={`help-mock__${row.kind}`}>
        {cells.map((cell) => (
          <span key={cell} className={`help-mock__${row.kind}-cell`}>
            {cell}
          </span>
        ))}
      </div>
    );
  }

  if (row.kind === "table") {
    return (
      <div className="help-mock__table">
        <span className="help-mock__label">{row.label}</span>
        <span className="help-mock__table-lines">
          <span className="help-mock__table-line" />
          <span className="help-mock__table-line" />
          <span className="help-mock__table-line" />
        </span>
      </div>
    );
  }

  return (
    <div className={`help-mock__${row.kind}`}>
      <span className="help-mock__label">{row.label}</span>
      {row.aside && <span className="help-mock__aside">{row.aside}</span>}
    </div>
  );
};

Row.propTypes = { row: PropTypes.object.isRequired };

const DashboardMock = ({ mock, activeRegion, onRegionClick }) => {
  if (!mock) return null;
  const rows = mock.rows ?? [];

  return (
    <figure className="help-mock" data-testid="help-mock">
      <figcaption className="help-mock__caption">
        <strong>{mock.title}</strong>
        {mock.subtitle && <span> — {mock.subtitle}</span>}
      </figcaption>

      <div className="help-mock__screen">
        {rows.map((row) => {
          const active = row.id === activeRegion;
          return (
            <button
              key={row.id}
              type="button"
              data-region={row.id}
              aria-current={active}
              className={`help-mock__row${
                active ? " help-mock__row--active" : ""
              }${activeRegion && !active ? " help-mock__row--dimmed" : ""}`}
              onClick={() => onRegionClick?.(row.id)}
            >
              <Row row={row} />
            </button>
          );
        })}
      </div>
    </figure>
  );
};

DashboardMock.propTypes = {
  mock: PropTypes.object,
  /** Row id drawn at full strength; everything else dims. */
  activeRegion: PropTypes.string,
  /** Clicking a region jumps the tour to the first step about it. */
  onRegionClick: PropTypes.func,
};

export default DashboardMock;
