import PropTypes from 'prop-types';
import './Label.css';

/**
 * A form label.
 *
 * `htmlFor` matters: without it the label is only visually near its input, so
 * clicking it does not focus the field and a screen reader announces the input
 * unnamed. Pass the same value as the input's `id`.
 */
const Label = ({ children, className = '', htmlFor }) => {
    return (
        <label className={`form-label ${className}`.trim()} htmlFor={htmlFor}>
            {children}
        </label>
    );
};

Label.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    htmlFor: PropTypes.string,
};

export default Label;
