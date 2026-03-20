import PropTypes from "prop-types";
import "./PillUIComponent.css";

const PillUIComponent = ({ color, size, children }) => {
  const className = `pill ${color} ${size}`;

  return <div className={className}>{children}</div>;
};

PillUIComponent.propTypes = {
  color: PropTypes.oneOf(["brand", "gray", "error", "warning", "success"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  children: PropTypes.node.isRequired,
};

PillUIComponent.defaultProps = {
  color: "gray",
  size: "md",
};

export default PillUIComponent;
