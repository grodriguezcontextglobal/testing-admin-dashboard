import './Label.css';

const Label = ({ children, className }) => {
  return <label className={`form-label ${className}`}>{children}</label>;
};

export default Label;