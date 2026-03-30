import PropTypes from "prop-types";
import "./ButtonGroup.css";

const ButtonGroup = ({ children }) => {
  return <div className="button-group">{children}</div>;
};

const ButtonGroupItem = ({ iconLeading, children, ...props }) => {
  return (
    <button className="button-group-item" {...props}>
      {iconLeading && <span className="button-group-icon">{iconLeading}</span>}
      <span className="button-group-text">{children}</span>
    </button>
  );
};

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
};

ButtonGroupItem.propTypes = {
  iconLeading: PropTypes.node,
  children: PropTypes.node.isRequired,
};

export { ButtonGroup, ButtonGroupItem };