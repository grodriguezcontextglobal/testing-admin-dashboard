import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { Routes, Route } from "react-router";
import Loading from "../../components/animation/Loading";
import ResetPassword from "../../pages/authentication/ResetPassword";
import CenteringGrid from "../../styles/global/CenteringGrid";
import RegisterCompany from "../../pages/authentication/RegisterCompany";
import InvitationLanding from "../../pages/authentication/InvitationLanding";
import RegisterStripeConnectedAccount from "../../pages/authentication/RegisterStripeConnectedAccount";

const NoAuthRoutes = () => {
  const Register = lazy(() =>
    import("../../pages/authentication/Registration")
  );
  const Login = lazy(() => import("../../pages/authentication/Login"));
  return (
    <div style={{ width: "100%", margin: "auto" }}>
      <Suspense
        fallback={
          <div style={CenteringGrid}>
            <Loading />
          </div>
        }
      >
        <Routes>
          <Route path="/authenticate" element={""} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/company-setup" element={<RegisterCompany />} />
          <Route path="/register/connected-account" element={<RegisterStripeConnectedAccount />} />
          <Route path="/invitation" element={<InvitationLanding />} />
          <Route path="/*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default NoAuthRoutes;
