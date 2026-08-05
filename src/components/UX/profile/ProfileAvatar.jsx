import PropTypes from "prop-types";
import { getInitials, getTint } from "./utils/avatar";
import "./profileShell.css";

/**
 * Initials, not the whole name crushed into a circle — which is what the old
 * header did, because it passed the full title string as the avatar's child.
 */
const ProfileAvatar = ({ name, src, size }) => {
  const dimension = { width: size, height: size, fontSize: Math.round(size / 3.2) };

  if (src) {
    return (
      <span className="profile-avatar" style={dimension}>
        <img src={src} alt="" />
      </span>
    );
  }

  return (
    <span
      className="profile-avatar"
      style={{ ...dimension, ...getTint(name) }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
};

ProfileAvatar.propTypes = {
  name: PropTypes.string,
  src: PropTypes.string,
  size: PropTypes.number,
};

ProfileAvatar.defaultProps = {
  name: "",
  src: null,
  size: 64,
};

export default ProfileAvatar;
