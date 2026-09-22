import { Typography } from "@mui/material";

/**
 * What a field says when it is the reason you cannot continue.
 *
 * Fredrik clicked Continue on step 1, nothing moved, and he reported the button
 * as broken (P1 `13:27`, *"it doesn't continue to step 2 when I click it"*).
 * The error was on screen the whole time — small, thin, and several screens
 * above the button he was looking at.
 *
 * > P1 `13:40` — "Can we make this bold or somehow a little bit bigger because
 * > I missed it, that it was there."
 *
 * Weight and size are half the fix. The other half is `scrollToFirstFieldError`
 * — a message nobody can see is not made visible by making it bold — and that
 * is what `FIELD_ERROR_ATTRIBUTE` is for: it marks every one of these in the
 * DOM so the first can be found and scrolled to without anyone mapping field
 * names to inputs.
 *
 * This existed six times, byte for byte, across the inventory wizards, the
 * event flow and the staff assignment form. One copy now, so "more visible"
 * happened everywhere at once rather than in the one screen he happened to be
 * looking at.
 */

/** Marks a rendered field error so the first one on the page can be found. */
export const FIELD_ERROR_ATTRIBUTE = "data-field-error";

const errorStyle = {
  textAlign: "left",
  marginTop: "0.5rem",
  fontWeight: 600,
  fontSize: "0.95rem",
  lineHeight: 1.4,
};

/**
 * @param {{message?: string}|undefined} error - react-hook-form's error entry.
 * @returns {JSX.Element|null} null when the field is fine, so a caller can
 *   render the result directly.
 */
export const renderFieldError = (error) => {
  if (!error) return null;

  return (
    <Typography
      variant="body1"
      color="error"
      role="alert"
      {...{ [FIELD_ERROR_ATTRIBUTE]: true }}
      style={errorStyle}
    >
      {error.message}
    </Typography>
  );
};

export default renderFieldError;
