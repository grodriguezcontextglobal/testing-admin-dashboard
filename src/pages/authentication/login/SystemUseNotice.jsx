/**
 * The system use notice on the sign-in screen
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, B2 · AC-8).
 *
 * Shown on every sign-in step, before access is granted. Signing in is the
 * explicit acknowledgement. The wording is a draft pending approval by
 * legal; change it here, and the test lists what it must keep saying.
 */
export const SYSTEM_USE_NOTICE =
  "This is a private system for authorized users only. Activity is logged and monitored for security. Unauthorized access or use is prohibited and may lead to legal action. By signing in, you consent to this monitoring.";

const SystemUseNotice = () => (
  <p
    role="note"
    aria-label="System use notice"
    style={{
      margin: "24px 0 0",
      fontSize: "12px",
      lineHeight: "18px",
      color: "var(--gray-500, #667085)",
      textAlign: "left",
    }}
  >
    {SYSTEM_USE_NOTICE}
  </p>
);

export default SystemUseNotice;
