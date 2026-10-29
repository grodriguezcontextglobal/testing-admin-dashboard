import { SYSTEM_USE_NOTICE } from "../../../config/legalNotices";

/**
 * The system use notice on the sign-in screen
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, B2 · AC-8).
 *
 * Shown on every sign-in step, before access is granted. Signing in is the
 * explicit acknowledgement. The wording lives in src/config/legalNotices.js:
 * change it there, never here.
 */
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
    {SYSTEM_USE_NOTICE.text}
  </p>
);

export default SystemUseNotice;
