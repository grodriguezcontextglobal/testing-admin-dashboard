import { Route, Routes } from "react-router";
import { Navigate } from "react-router-dom";
// import DevitrakLoading from "../../components/animation/DevitrakLoading";
import ResetPassword from "../../pages/authentication/ResetPassword";
// import CenteringGrid from "../../styles/global/CenteringGrid";
import InvitationLanding from "../../pages/authentication/InvitationLanding";
import Login from "../../pages/authentication/Login";
import RegisterCompany from "../../pages/authentication/RegisterCompany";
import RegisterStripeConnectedAccount from "../../pages/authentication/RegisterStripeConnectedAccount";
import Register from "../../pages/authentication/Registration";
import MyDevicesPortal from "../../pages/authentication/MyDevicesPortal";
import LandingPageForDownloadableDocuments from "../../pages/authentication/LandingPageForDownloadableDocuments";
import ForceLogout from "../../pages/authentication/ForceLogout";
import AttendanceConfirmationLanding from "../../pages/authentication/AttendanceConfirmationLanding";

const NoAuthRoutes = () => {
  return (
    <div style={{ width: "100%", margin: "auto" }}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/authenticate" element={""} />
        <Route path="/register/company-setup" element={<RegisterCompany />} />
        <Route
          path="/register/connected-account"
          element={<RegisterStripeConnectedAccount />}
        />
        <Route path="/invitation" element={<InvitationLanding />} />
        <Route path="/force-logout" element={<ForceLogout />} />
        <Route path="/display-contracts" element={<LandingPageForDownloadableDocuments />} />
        <Route path="/my-devices" element={<MyDevicesPortal />} />
        <Route path="/attendance-confirmation" element={<AttendanceConfirmationLanding />} />
        <Route path="/*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default NoAuthRoutes;
