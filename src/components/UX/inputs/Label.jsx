import PropTypes from 'prop-types';
import './Label.css';

/**
 * A form label.
 *
 * `htmlFor` matters: without it the label is only visually near its input, so
 * clicking it does not focus the field and a screen reader announces the input
 * unnamed. Pass the same value as the input's `id`.
 *
 * `required` draws the asterisk. It lives here rather than in each screen
 * because it used to live in each screen: with no marker on the shared
 * component, every form wrote its own and they disagreed about which side of
 * the title it went on. After the title, in the danger colour, so the mark
 * reads as a requirement and not as decoration.
 *
 * The asterisk is `aria-hidden`: it repeats what the input's own `required`
 * attribute already tells assistive technology, and announcing "star" before
 * every mandatory field is noise. Set `required` on the input as well as here.
 */
const Label = ({ children, className = '', htmlFor, required = false }) => {
    return (
        <label className={`form-label ${className}`.trim()} htmlFor={htmlFor}>
            {children}
            {required && " "}
            {required && (
                <span className="form-label__required" aria-hidden="true">
                    *
                </span>
            )}
        </label>
    );
};

Label.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    htmlFor: PropTypes.string,
    required: PropTypes.bool,
};

export default Label;
