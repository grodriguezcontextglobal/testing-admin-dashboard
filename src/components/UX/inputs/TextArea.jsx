import { FormControl, FormHelperText, InputLabel } from "@mui/material";
import { Input as AntInput } from "antd";
import { forwardRef } from "react";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";

const { TextArea } = AntInput;

/**
 * Reusable TextArea component based on Ant Design TextArea
 * Encapsulates standard styling and functionality used across the application.
 *
 * @param {Object} props - Component props
 * @param {string} [props.label] - Label for the input
 * @param {string} [props.id] - ID for the input
 * @param {string} [props.name] - Name attribute for the input
 * @param {string} [props.value] - Value of the input
 * @param {function} [props.onChange] - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.disabled] - Whether the input is disabled
 * @param {boolean} [props.readOnly] - Whether the input is read-only
 * @param {boolean} [props.required] - Whether the input is required
 * @param {boolean} [props.error] - Whether the input has an error
 * @param {string} [props.helperText] - Error message or helper text
 * @param {Object} [props.sx] - Custom styles override
 * @param {Object} [props.style] - Custom inline styles override
 * @param {boolean} [props.fullWidth=true] - Whether the input should take full width
 * @param {Object} [props.textAreaProps] - Specific props for AntD TextArea (rows, maxLength, showCount, etc.)
 */
const ReusableTextArea = forwardRef(
  (
    {
      label,
      id,
      name,
      value,
      onChange,
      placeholder,
      disabled = false,
      readOnly = false,
      required = false,
      error = false,
      helperText,
      sx = {},
      style = {},
      fullWidth = true,
      textAreaProps = {},
      ...props
    },
    ref,
  ) => {
    // Combine base styles with custom overrides
    const combinedStyle = {
      ...OutlinedInputStyle,
      height: "auto", // TextArea needs auto height
      minHeight: "2.5rem",
      ...style,
    };

    return (
      <FormControl
        variant="outlined"
        fullWidth={fullWidth}
        error={error}
        disabled={disabled}
        sx={{
          marginBottom: helperText ? 0 : 0,
          ...sx,
        }}
      >
        {label && (
          <InputLabel
            htmlFor={id || name}
            required={required}
            shrink
            sx={{
              position: "relative",
              transform: "none",
              marginBottom: "4px",
              fontSize: "0.875rem",
              color: "var(--gray-700, #344054)",
            }}
          >
            {label}
          </InputLabel>
        )}

        <TextArea
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          ref={ref}
          status={error ? "error" : ""}
          style={combinedStyle}
          {...textAreaProps}
          {...props}
        />

        {helperText && (
          <FormHelperText error={error} id={`${id || name}-helper-text`}>
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

ReusableTextArea.displayName = "ReusableTextArea";

export default ReusableTextArea;
