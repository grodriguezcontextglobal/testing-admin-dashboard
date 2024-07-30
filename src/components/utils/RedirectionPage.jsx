import { notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { onLogout } from "../../store/slices/adminSlice";
import { onResetArticleEdited } from "../../store/slices/articleSlide";
import { onResetCustomer } from "../../store/slices/customerSlice";
import {
  onResetDeviceInQuickGlance,
  onResetDevicesHandle,
} from "../../store/slices/devicesHandleSlice";
import { onResetEventInfo } from "../../store/slices/eventSlice";
import { onResetHelpers } from "../../store/slices/helperSlice";
import { onResetStaffProfile } from "../../store/slices/staffDetailSlide";
import { onResetStripesInfo } from "../../store/slices/stripeSlice";
import { onResetSubscriptionInfo } from "../../store/slices/subscriptionSlice";
import { persistor } from "../../store/Store";
import CenteringGrid from "../../styles/global/CenteringGrid";
import Loading from "../animation/Loading";
import { useEffect } from "react";

const RedirectionPage = () => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.open({
      message: "Company has been created. Please log in.",
      placement: "top",
      duration: 2,
    });
  };
  const flow = async () => {
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
    return navigate("/login");
  };
useEffect(() => {
  openNotification()
}, [])

  return (
    <div style={CenteringGrid}>
      <Loading />
      {contextHolder}
      {location.pathname === "/register/company-setup" &&
        setTimeout(() => {
          flow();
        }, 3000)}
    </div>
  );
};

export default RedirectionPage;
