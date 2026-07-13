import PropTypes from "prop-types";
import { useRef, useState } from "react";

/**
 * Untitled UI verification-code input: N large digit boxes, auto-advance,
 * backspace to previous, paste fills all. Calls onComplete(code) when full.
 */
const boxStyle = (focused, filled) => ({
  width: "56px",
  height: "56px",
  textAlign: "center",
  fontFamily: "Inter, sans-serif",
  fontSize: "28px",
  fontWeight: 600,
  color: filled ? "var(--gray-900, #171d1a)" : "var(--gray-400, #9a9d93)",
  background: "var(--base-white, #fff)",
  border: `1px solid ${
    focused ? "var(--action-600, #155eef)" : "var(--gray-300, #c6c7bb)"
  }`,
  borderRadius: "var(--radius-md, 8px)",
  boxShadow: focused
    ? "var(--focus-ring-action, 0 0 0 4px #d1e0ff)"
    : "var(--shadow-xs)",
  outline: "none",
  transition: "border-color 0.12s ease, box-shadow 0.12s ease",
});

const VerificationCodeInput = ({ length, onComplete, onChange }) => {
  const [digits, setDigits] = useState(Array(length).fill(""));
  const [focusedIdx, setFocusedIdx] = useState(null);
  const refs = useRef([]);

  const commit = (next) => {
    setDigits(next);
    const code = next.join("");
    onChange?.(code);
    if (code.length === length && next.every(Boolean)) onComplete?.(code);
  };

  const handleChange = (idx, raw) => {
    const v = raw.replace(/\D/g, "");
    if (!v) return;
    const next = [...digits];
    // support typing/pasting multiple digits at once
    const chars = v.slice(0, length - idx).split("");
    chars.forEach((c, i) => (next[idx + i] = c));
    commit(next);
    const last = Math.min(idx + chars.length, length - 1);
    refs.current[last]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[idx]) {
        next[idx] = "";
        commit(next);
      } else if (idx > 0) {
        next[idx - 1] = "";
        commit(next);
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  return (
    <div style={{ display: "flex", gap: "12px" }}>
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          value={d}
          inputMode="numeric"
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          placeholder="0"
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onFocus={(e) => {
            setFocusedIdx(idx);
            e.target.select();
          }}
          onBlur={() => setFocusedIdx(null)}
          style={boxStyle(focusedIdx === idx, Boolean(d))}
        />
      ))}
    </div>
  );
};

VerificationCodeInput.propTypes = {
  length: PropTypes.number,
  onComplete: PropTypes.func,
  onChange: PropTypes.func,
};

VerificationCodeInput.defaultProps = {
  length: 4,
};

export default VerificationCodeInput;
