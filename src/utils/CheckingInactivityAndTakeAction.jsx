import { notification } from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom"; // Assuming you're using react-router
import { onLogout } from "../store/slices/adminSlice";

const InactivityLogout = ({ children }) => {
  const [isActive, setIsActive] = useState(true);
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
    const handleLogout = () => {
      setIsActive(false);
      // Perform logout actions here (e.g., clear user data, token, etc.)
      openNotification();
      dispatch(onLogout());
      localStorage.removeItem("admin-token");
      // window.location.reload; // Redirect to the login page
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
