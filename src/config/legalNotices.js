/**
 * Legal wording shown in the dashboard. The single place to change it:
 * every screen that shows a notice reads it from here.
 *
 * SYSTEM_USE_NOTICE is the system use notice on the sign-in screen
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, B2 · AC-8), shown on every
 * sign-in step through login/SystemUseNotice.jsx. Signing in is the
 * explicit acknowledgement.
 *
 * When legal sends its wording: replace `text`, set `version` to the date it
 * takes effect and `approvedByLegal` to true. legalNotices.test.js lists the
 * four points AC-8 needs the text to keep.
 */
export const SYSTEM_USE_NOTICE = {
  text: "This is a private system for authorized users only. Activity is logged and monitored for security. Unauthorized access or use is prohibited and may lead to legal action. By signing in, you consent to this monitoring.",
  version: "2026-10-26",
  // Draft kept in use, as agreed on 2026-10-29, until legal sends changes.
  approvedByLegal: false,
};
