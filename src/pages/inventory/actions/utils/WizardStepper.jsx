import { Check } from "lucide-react";

const stepStyle = (state) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "8px",
  border: `1px solid ${state === "now" ? "var(--action-100, #d1e0ff)" : "transparent"}`,
  background: state === "now" ? "var(--action-50, #eff4ff)" : "transparent",
  color:
    state === "now"
      ? "var(--blue-700, #175cd3)"
      : state === "done"
        ? "var(--success-700, #027a48)"
        : "var(--gray-500, #667085)",
  font: `${state === "now" ? 600 : 500} 14px/20px Inter, sans-serif`,
});

const badgeStyle = (state) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "20px",
  height: "20px",
  borderRadius: "9999px",
  border: `1px solid ${state === "done" ? "var(--success-200, #abefc6)" : "currentColor"}`,
  background:
    state === "now"
      ? "var(--action-600, #155eef)"
      : state === "done"
        ? "var(--success-50, #ecfdf3)"
        : "transparent",
  color: state === "now" ? "#fff" : "inherit",
  fontSize: "11px",
  fontWeight: 600,
});

/**
 * The numbered step rail shared by every inventory wizard (update, create).
 * A step can only be reopened once it has been reached — the rail is a
 * progress indicator, not a way to skip ahead of unfinished steps.
 */
const WizardStepper = ({ steps, stepIndex, onSelectStep }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "24px 0 20px" }}>
      {steps.map((step, index) => {
        const state = index === stepIndex ? "now" : index < stepIndex ? "done" : "upcoming";
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {index > 0 && (
              <span style={{ width: "24px", height: "1px", background: "var(--gray-300, #d0d5dd)" }} />
            )}
            <button
              type="button"
              onClick={() => index <= stepIndex && onSelectStep(index)}
              disabled={index > stepIndex}
              style={{
                ...stepStyle(state),
                border: stepStyle(state).border,
                background: stepStyle(state).background,
                cursor: index <= stepIndex ? "pointer" : "default",
              }}
            >
              <span style={badgeStyle(state)}>
                {state === "done" ? <Check width={12} height={12} /> : index + 1}
              </span>
              {step.label}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default WizardStepper;
