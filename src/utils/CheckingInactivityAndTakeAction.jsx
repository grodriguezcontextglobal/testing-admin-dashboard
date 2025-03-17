import { notification } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom"; // Assuming you're using react-router
import { onLogout } from "../store/slices/adminSlice";
import { devitrakApi } from "../api/devitrakApi";
import { onResetArticleEdited } from "../store/slices/articleSlide";
import { onResetCustomer } from "../store/slices/customerSlice";
import { onResetDeviceInQuickGlance, onResetDevicesHandle } from "../store/slices/devicesHandleSlice";
import { onResetEventInfo } from "../store/slices/eventSlice";
import { onResetStaffProfile } from "../store/slices/staffDetailSlide";
import { onResetHelpers } from "../store/slices/helperSlice";
import { onResetStripesInfo } from "../store/slices/stripeSlice";
import { onResetSubscriptionInfo } from "../store/slices/subscriptionSlice";
import { persistor } from "../store/Store";

const InactivityLogout = ({ children }) => {
  const [isActive, setIsActive] = useState(true);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.open({
      message: "You have been logged out due to inactivity.",
      duration: 0,
    });
  };
  useEffect(() => {
    let logoutTimer;

    // Function to reset the timer
    const resetTimer = () => {
      setIsActive(true);
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        handleLogout();
      }, 2 * 60 * 60 * 1000); 
    };

    // Function to handle logout
    const handleLogout = async () => {
      setIsActive(false);
      // Perform logout actions here (e.g., clear user data, token, etc.)
    await devitrakApi.patch(`/staff/edit-admin/${user.uid}`, {
      online: false,
    });
    persistor.purge();
    dispatch(onResetArticleEdited());
    dispatch(onResetCustomer());
    dispatch(onResetDevicesHandle());
    dispatch(onResetDeviceInQuickGlance());
    dispatch(onResetEventInfo());
    dispatch(onResetStaffProfile());
    dispatch(onResetHelpers());
    dispatch(onResetStripesInfo());
    dispatch(onResetSubscriptionInfo());
    localStorage.removeItem("admin-token", "");
    dispatch(onLogout());
    openNotification();
    return navigate("/login");
    };

    // Add event listeners for user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("click", resetTimer);

    // Start the timer
    resetTimer();

    // Cleanup on component unmount
    return () => {
      clearTimeout(logoutTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [navigate]);

  return (
    <>
      {contextHolder}
      {isActive ? children : <Navigate to="/login" replace={true} />}
    </>
  );
};

export default InactivityLogout;
