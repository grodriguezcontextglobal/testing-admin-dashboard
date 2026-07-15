import { notification } from "antd";
import { jwtDecode } from "jwt-decode";
import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import "./App.css";
// import AuthRoutes from "./routes/authorized/AuthRoutes";
// import NoAuthRoutes from "./routes/no-authorized/NoAuthRoutes";
import { onLogout } from "./store/slices/adminSlice";
import { onResetArticleEdited } from "./store/slices/articleSlide";
import { onResetBackgroundJobs } from "./store/slices/backgroundJobsSlice";
import { onResetCustomer } from "./store/slices/customerSlice";
import {
  onResetDeviceInQuickGlance,
  onResetDevicesHandle,
} from "./store/slices/devicesHandleSlice";
import { onResetEventInfo } from "./store/slices/eventSlice";
import { onResetHelpers } from "./store/slices/helperSlice";
import { onResetStaffProfile } from "./store/slices/staffDetailSlide";
import { onResetStripesInfo } from "./store/slices/stripeSlice";
import { onResetSubscriptionInfo } from "./store/slices/subscriptionSlice";
import DevitrakLoading from "./components/animation/DevitrakLoading";
import CenteringGrid from "./styles/global/CenteringGrid";
import { clearSessionStorage } from "./api/sessionHeaders";
// const InactivityLogout = lazy(() =>
//   import("./utils/CheckingInactivityAndTakeAction")
// );
const AuthRoutes = lazy(() => import("./routes/authorized/AuthRoutes"));
const NoAuthRoutes = lazy(() => import("./routes/no-authorized/NoAuthRoutes"));
const BackgroundJobsTracker = lazy(() =>
  import("./components/backgroundJobs/BackgroundJobsTracker")
);
const OfflineIndicator = lazy(() =>
  import("./components/offlineStatus/OfflineIndicator")
);
const InstallAppNotification = lazy(() =>
  import("./components/installPrompt/InstallAppNotification")
);

const App = () => {
  // const [displayReportBugsModal, setDisplayReportBugsModal] = useState(false);
  const { status } = useSelector((state) => state.admin);
  const adminToken = localStorage.getItem("admin-token");
  const dispatch = useDispatch();
  const location = useLocation();
  // const currentVersion = "1.0.0"; // Replace this with the current version of your app
  // useVersionCheck(currentVersion);
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg) => {
    api.open({
      description: msg,
    });
  };

  const isTokenValid = (token) => {
    if (token) {
      const decodedToken = jwtDecode(token);
      if (new Date().getTime() >= decodedToken.exp * 1000) return false;
      // Tokens issued before the sqlStaffId backend fix lack this field.
      // Treat them as invalid so the user re-authenticates and gets a fresh token.
      if (typeof decodedToken.sqlStaffId !== "number") return false;
      return true;
    }
    return false;
  };

  const dispatchActionBasedOnTokenValidation = () => {
    if (adminToken && !isTokenValid(adminToken)) {
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
      openNotificationWithIcon("Session has expired. Please sign in again.");
      return window.location.reload(true);
    }
  };

  const [connectionType, setConnectionType] = useState("");

  useEffect(() => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (connection) {
      setConnectionType(connection.effectiveType);
    }
  }, []);

  // Function to render the network status message based on connection type
  const renderNetworkStatusMessage = () => {
    if (connectionType === "slow-2g" || connectionType === "2g") {
      const networkNotification = sessionStorage.getItem("network-status");
      if (networkNotification) {
        return null;
      } else {
        sessionStorage.setItem("network-status", true);
        setTimeout(
          () =>
            openNotificationWithIcon(
              "The current internet connection is experiencing slowness. For improved performance, we recommend switching to a stronger network connection."
            ),
          3000
        );
      }
    } else {
      return null;
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    dispatchActionBasedOnTokenValidation();
    return () => {
      controller.abort();
    };
  }, [status, adminToken, location.pathname]);

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <DevitrakLoading />
        </div>
      }
    >
      {renderNetworkStatusMessage()}
      {contextHolder}
      <InstallAppNotification />
      {status === "authenticated" && adminToken ? (
        // <InactivityLogout>
        //   <AuthRoutes />
        // </InactivityLogout>
        <>
          <BackgroundJobsTracker />
          <OfflineIndicator />
          <AuthRoutes />
        </>
      ) : (
        <NoAuthRoutes />
      )}
    </Suspense>
  );
};

export default App;
