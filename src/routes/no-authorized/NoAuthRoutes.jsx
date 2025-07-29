import { Route, Routes } from "react-router";
import { Navigate } from "react-router-dom";
// import Loading from "../../components/animation/Loading";
import ResetPassword from "../../pages/authentication/ResetPassword";
// import CenteringGrid from "../../styles/global/CenteringGrid";
import InvitationLanding from "../../pages/authentication/InvitationLanding";
import Login from "../../pages/authentication/Login";
import RegisterCompany from "../../pages/authentication/RegisterCompany";
import RegisterStripeConnectedAccount from "../../pages/authentication/RegisterStripeConnectedAccount";
import Register from "../../pages/authentication/Registration";
import LandingPageForDownloadableDocuments from "../../pages/authentication/LandingPageForDownloadableDocuments";

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
        <Route path="/display-contracts" element={<LandingPageForDownloadableDocuments />} />
        <Route path="/*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default NoAuthRoutes;
