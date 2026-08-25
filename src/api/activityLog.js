import { devitrakApiAdmin } from "./devitrakApi";

/**
 * Registers one row in the staff activity audit log (B2, FERPA/COPPA trail).
 * Per FRONTEND_staff_activity_log.md, only actions with no other server-side
 * log call site need this — most CRUD already gets auto-logged, but the
 * /db_member/* and /school/* routes (student, guardian, consent) don't.
 *
 * Fire-and-forget by design: a failure to log activity must never block or
 * fail the caller's real action, so errors are caught here, not propagated.
 */
export const registerStaffActivity = async ({ action, target_model, target_id, details }) => {
  try {
    await devitrakApiAdmin.post("/activity-logs", { action, target_model, target_id, details });
  } catch (error) {
    console.error("Failed to register staff activity:", error);
  }
};
