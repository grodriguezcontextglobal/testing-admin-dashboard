import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../api/devitrakApi";
import { clearSessionStorage } from "../api/sessionHeaders";
import { persistor } from "../store/Store";
import { onLogout } from "../store/slices/adminSlice";
import { onResetArticleEdited } from "../store/slices/articleSlide";
import { onResetBackgroundJobs } from "../store/slices/backgroundJobsSlice";
import { onResetCustomer } from "../store/slices/customerSlice";
import {
  onResetDeviceInQuickGlance,
  onResetDevicesHandle,
} from "../store/slices/devicesHandleSlice";
import { onResetEventInfo } from "../store/slices/eventSlice";
import { onResetHelpers } from "../store/slices/helperSlice";
import { onResetStaffProfile } from "../store/slices/staffDetailSlide";
import { onResetStripesInfo } from "../store/slices/stripeSlice";
import { onResetSubscriptionInfo } from "../store/slices/subscriptionSlice";

/**
 * The one logout, for every place that offers it.
 *
 * There were two copies. The navigation bar's only marked the account
 * offline and never called POST /admin/logout, so the server kept the
 * session open and the next login answered "Active session already exists".
 * The profile page's called it without the `uid` the handler reads.
 *
 * Order matters: both requests authenticate with x-token, which the request
 * interceptor reads from localStorage, so they leave before
 * clearSessionStorage. Neither can hold the browser hostage — a failure is
 * logged, and the local session is torn down whatever the server answered.
 */
const useLogout = () => {
  const uid = useSelector((state) => state.admin.user?.uid);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useCallback(async () => {
    const results = await Promise.allSettled([
      devitrakApi.patch(`/staff/edit-admin/${uid}`, { online: false }),
      devitrakApi.post("/admin/logout", { uid }),
    ]);
    results
      .filter((result) => result.status === "rejected")
      .forEach((result) => console.error("Logout error:", result.reason));

    persistor.purge();
    dispatch(onResetArticleEdited());
    dispatch(onResetCustomer());
    dispatch(onResetDevicesHandle());
    dispatch(onResetDeviceInQuickGlance());
    dispatch(onResetEventInfo());
    dispatch(onResetStaffProfile());
    dispatch(onResetHelpers());
    dispatch(onResetBackgroundJobs());
    dispatch(onResetStripesInfo());
    dispatch(onResetSubscriptionInfo());
    clearSessionStorage();
    dispatch(onLogout());
    navigate("/login");
  }, [uid, dispatch, navigate]);
};

export default useLogout;
