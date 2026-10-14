/**
 * Profile → Notifications: what a save writes back to the session, and what a
 * refused save says.
 */

const SAVE_FAILED = "Failed to update notification settings. Please try again.";

/**
 * The `onUpdateProfile` payload for a saved PATCH /admin/admin-user/:uid.
 * Only the four preference fields: the rest of `adminUpdated` is the server's
 * whole record and has no business replacing the session.
 */
export const notificationPreferencesPatch = (adminUpdated) => {
  if (!adminUpdated || typeof adminUpdated !== "object") return null;
  return {
    data: {
      emailNotifications: adminUpdated.emailNotifications,
      dailySummaries: adminUpdated.dailySummaries,
      subscriptionRenewals: adminUpdated.subscriptionRenewals,
      eventReminder: adminUpdated.eventReminder,
    },
  };
};

/** The server answers `message`; older routes still answer `msg`. */
export const notificationSaveErrorMessage = (error) =>
  error?.response?.data?.message || error?.response?.data?.msg || SAVE_FAILED;
