import { useEffect } from 'react';
import './App.css'
import NoAuthRoutes from './routes/no-authorized/NoAuthRoutes'
import { useDispatch, useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import AuthRoutes from './routes/authorized/AuthRoutes';
import { onLogout } from './store/slices/adminSlice';
import { onResetArticleEdited } from './store/slices/articleSlide';
import { onResetCustomer } from './store/slices/customerSlice';
import { onResetDeviceInQuickGlance, onResetDevicesHandle } from './store/slices/devicesHandleSlice';
import { onResetEventInfo } from './store/slices/eventSlice';
import { onResetStaffProfile } from './store/slices/staffDetailSlide';
import { onResetHelpers } from './store/slices/helperSlice';
import { onResetStripesInfo } from './store/slices/stripeSlice';
import { onResetSubscriptionInfo } from './store/slices/subscriptionSlice';
  const App = () => {
  const { status } = useSelector((state) => state.admin);
  const adminToken = localStorage.getItem('admin-token')
  const dispatch = useDispatch();
  const dispatchActionBasedOnTokenValidation = () => {
    if (adminToken) {
      const validateToken = jwtDecode(adminToken);
      if (
        new Date().getTime() < validateToken.exp
      ) {
        dispatch(onResetArticleEdited());
        dispatch(onResetCustomer());
        dispatch(onResetDevicesHandle());
        dispatch(onResetDeviceInQuickGlance());
        dispatch(onResetEventInfo());
        dispatch(onResetStaffProfile());
        dispatch(onResetHelpers());
        dispatch(onResetStripesInfo());
        dispatch(onResetSubscriptionInfo());
        localStorage.setItem("admin-token", "");
        dispatch(onLogout());
        return alert("Session has expired. Please sign in again.");
      }
    }
  };
  useEffect(() => {
    const controller = new AbortController()
    dispatchActionBasedOnTokenValidation();
    return () => { controller.abort() }

  }, [status, adminToken]);
  return (
    <>
      {
        status === "authenticated" && adminToken ?
          <AuthRoutes />
          :
          <NoAuthRoutes />
      }
    </>
  )
}

export default App
