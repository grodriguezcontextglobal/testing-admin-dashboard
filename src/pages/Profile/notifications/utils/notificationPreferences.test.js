import { describe, expect, it } from "vitest";
import adminReducer, { onLogin, onUpdateProfile } from "../../../../store/slices/adminSlice";
import {
  notificationPreferencesPatch,
  notificationSaveErrorMessage,
} from "./notificationPreferences";

const adminUpdated = {
  emailNotifications: { newsAndUpdates: true, tipsAndTutorials: false, userResearch: true },
  dailySummaries: "daily",
  subscriptionRenewals: "all",
  eventReminder: "none",
  password: "should-not-travel",
  role: "0",
};

describe("notificationPreferencesPatch", () => {
  it("patches only the four preference fields under data", () => {
    expect(notificationPreferencesPatch(adminUpdated)).toEqual({
      data: {
        emailNotifications: adminUpdated.emailNotifications,
        dailySummaries: "daily",
        subscriptionRenewals: "all",
        eventReminder: "none",
      },
    });
  });

  it("returns null without an updated admin", () => {
    expect(notificationPreferencesPatch(undefined)).toBeNull();
    expect(notificationPreferencesPatch(null)).toBeNull();
  });

  it("keeps the session status and MFA flag when applied through onUpdateProfile", () => {
    const loggedIn = adminReducer(
      undefined,
      onLogin({ uid: "u1", data: { mfaEnabled: true, name: "Ana" }, mfaEnabled: true }),
    );
    const next = adminReducer(loggedIn, onUpdateProfile(notificationPreferencesPatch(adminUpdated)));
    expect(next.status).toBe("authenticated");
    expect(next.mfaEnabled).toBe(true);
    expect(next.user.uid).toBe("u1");
    expect(next.user.data.name).toBe("Ana");
    expect(next.user.data.dailySummaries).toBe("daily");
    expect(next.user.data.password).toBeUndefined();
  });
});

describe("notificationSaveErrorMessage", () => {
  const fallback = "Failed to update notification settings. Please try again.";

  it("reads `message` from the server body", () => {
    const error = { response: { data: { message: "Forbidden" } } };
    expect(notificationSaveErrorMessage(error)).toBe("Forbidden");
  });

  it("still reads the legacy `msg`", () => {
    const error = { response: { data: { msg: "Old server" } } };
    expect(notificationSaveErrorMessage(error)).toBe("Old server");
  });

  it("prefers `message` over `msg`", () => {
    const error = { response: { data: { message: "New", msg: "Old" } } };
    expect(notificationSaveErrorMessage(error)).toBe("New");
  });

  it("falls back to a readable sentence, never a transport error", () => {
    expect(notificationSaveErrorMessage({ message: "Network Error" })).toBe(fallback);
    expect(notificationSaveErrorMessage(undefined)).toBe(fallback);
  });
});
