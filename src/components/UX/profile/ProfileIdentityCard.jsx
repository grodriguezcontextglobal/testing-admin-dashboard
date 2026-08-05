import PropTypes from "prop-types";
import ProfileAvatar from "./ProfileAvatar";
import "./profileShell.css";

/**
 * The identity block every profile opens with.
 *
 * One <h1> for the person. Everything else is a real <dl>, so a screen reader
 * hears "Contact: email, phone" instead of five sibling level-1 headings, and
 * sighted readers can tell a label from a value at a glance.
 *
 * `factGroups` is what makes the shell subject-agnostic: a student fills it
 * with Contact / Guardian / Consent, a consumer with Contact / Billing /
 * Account. A group with no renderable values drops out entirely, and because
 * the action rail is its own fixed column, dropping one never moves the buttons.
 */
const hasValue = (item) =>
  item && item.value !== null && item.value !== undefined && item.value !== "";

const hasChips = (chips) =>
  Array.isArray(chips) ? chips.filter(Boolean).length > 0 : Boolean(chips);

const ProfileIdentityCard = ({
  name,
  imageUrl,
  chips,
  factGroups,
  actions,
  testId,
}) => {
  const groups = (factGroups ?? []).filter(
    (group) => group && (group.items ?? []).some(hasValue)
  );

  return (
    <section className="profile-identity" data-testid={testId}>
      <div className="profile-identity__main">
        <div className="profile-identity__who">
          <ProfileAvatar name={name} src={imageUrl} />
          <div className="profile-identity__text">
            <h1 className="profile-identity__name" data-testid="profile-name">
              {name}
            </h1>
            {hasChips(chips) && <div className="profile-chiprow">{chips}</div>}
          </div>
        </div>

        {groups.length > 0 && (
          <dl className="profile-facts">
            {groups.map((group) => (
              <div className="profile-factgroup" key={group.label}>
                <dt>{group.label}</dt>
                {group.items.filter(hasValue).map((item, index) => (
                  <dd
                    // Values within a group are positional (name, email, phone),
                    // so index is the stable identity here.
                    key={`${group.label}-${index}`}
                    className={item.muted ? "is-muted" : undefined}
                  >
                    {item.href ? (
                      <a href={item.href}>{item.value}</a>
                    ) : (
                      item.value
                    )}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        )}
      </div>

      {actions && <div className="profile-identity__rail">{actions}</div>}
    </section>
  );
};

ProfileIdentityCard.propTypes = {
  name: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  chips: PropTypes.node,
  factGroups: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.node,
          href: PropTypes.string,
          muted: PropTypes.bool,
        })
      ),
    })
  ),
  actions: PropTypes.node,
  testId: PropTypes.string,
};

ProfileIdentityCard.defaultProps = {
  imageUrl: null,
  chips: null,
  factGroups: [],
  actions: null,
  testId: "profile-identity",
};

export default ProfileIdentityCard;
