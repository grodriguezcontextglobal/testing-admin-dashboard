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
import Loading from "./components/animation/Loading";
import CenteringGrid from "./styles/global/CenteringGrid";
const InactivityLogout = lazy(() => import("./utils/CheckingInactivityAndTakeAction"));
const AuthRoutes = lazy(() => import("./routes/authorized/AuthRoutes"));
const NoAuthRoutes = lazy(() => import("./routes/no-authorized/NoAuthRoutes")); 

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
      return new Date().getTime() < decodedToken.exp * 1000;
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
      dispatch(onResetStripesInfo());
      dispatch(onResetSubscriptionInfo());
      localStorage.removeItem("admin-token");
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
      setTimeout(
        () =>
          openNotificationWithIcon(
            "The current internet connection is experiencing slowness. For improved performance, we recommend switching to a stronger network connection."
          ),
        3000
      );
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
    <Suspense fallback={<div style={CenteringGrid}><Loading /></div>}>
      {renderNetworkStatusMessage()}
      {contextHolder}
      {status === "authenticated" && adminToken ? (
        <InactivityLogout>
          <AuthRoutes />
        </InactivityLogout>
      ) : (
        <NoAuthRoutes />
      )}
    </Suspense>
  );
};

export default App;
