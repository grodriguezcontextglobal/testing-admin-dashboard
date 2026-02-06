import { FormControl, FormHelperText, InputLabel, OutlinedInput } from '@mui/material';
import { forwardRef } from 'react';
import { OutlinedInputStyle } from '../../../styles/global/OutlinedInputStyle';

/**
 * Reusable Input component based on MUI OutlinedInput
 * Encapsulates standard styling and functionality used across the application.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.label] - Label for the input
 * @param {string} [props.id] - ID for the input
 * @param {string} [props.name] - Name attribute for the input
 * @param {string} [props.value] - Value of the input
 * @param {function} [props.onChange] - Change handler
 * @param {string} [props.type] - Input type (text, password, email, etc.)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.disabled] - Whether the input is disabled
 * @param {boolean} [props.readOnly] - Whether the input is read-only
 * @param {boolean} [props.required] - Whether the input is required
 * @param {boolean} [props.error] - Whether the input has an error
 * @param {string} [props.helperText] - Error message or helper text
 * @param {React.ReactNode} [props.startAdornment] - Element to display at the start
 * @param {React.ReactNode} [props.endAdornment] - Element to display at the end
 * @param {Object} [props.sx] - Custom styles override
 * @param {Object} [props.style] - Custom inline styles override
 * @param {boolean} [props.fullWidth=true] - Whether the input should take full width
 */
const Input = forwardRef(({
    label,
    id,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    disabled = false,
    readOnly = false,
    required = false,
    error = false,
    helperText,
    startAdornment,
    endAdornment,
    sx = {},
    style = {},
    fullWidth = true,
    ...props
}, ref) => {
    
    // Combine base styles with custom overrides
    // Note: We merge style prop with OutlinedInputStyle, ensuring user overrides take precedence
    const combinedStyle = {
        ...OutlinedInputStyle,
        ...style,
        // If error, we might want to change border color, but OutlinedInput handles error prop for border color usually.
        // However, the custom style might override MUI's default error border.
        // Let's ensure standard behavior isn't broken by fixed styles if needed.
    };

    return (
        <FormControl 
            variant="outlined" 
            fullWidth={fullWidth} 
            error={error}
            disabled={disabled}
            sx={{ 
                // Ensure the FormControl doesn't collapse if there's no label but we want spacing
                marginBottom: helperText ? 0 : 0 
            }}
        >
            {label && (
                <InputLabel 
                    htmlFor={id || name} 
                    required={required}
                    shrink // Force shrink if we want consistent look with placeholders
                >
                    {label}
                </InputLabel>
            )}
            
            <OutlinedInput
                id={id || name}
                name={name}
                value={value}
                onChange={onChange}
                type={type}
                placeholder={placeholder}
                startAdornment={startAdornment}
                endAdornment={endAdornment}
                readOnly={readOnly}
                required={required}
                // label={label} // Pass label to OutlinedInput so the notch is calculated correctly if label exists
                inputRef={ref}
                style={combinedStyle}
                sx={{
                    // Default overrides to match the design system if needed beyond inline styles
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: error ? 'var(--danger-action, #d32f2f)' : undefined,
                    },
                    ...sx
                }}
                {...props}
            />
            
            {helperText && (
                <FormHelperText error={error} id={`${id || name}-helper-text`}>
                    {helperText}
                </FormHelperText>
            )}
        </FormControl>
    );
});

Input.displayName = 'Input';

export default Input;
