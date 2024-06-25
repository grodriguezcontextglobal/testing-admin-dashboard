import { useLocation, useNavigate } from "react-router-dom";
import CenteringGrid from "../../styles/global/CenteringGrid";
import Loading from "../animation/Loading";

const RedirectionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div style={CenteringGrid}>
      <Loading />
      {location.pathname === "/register/company-setup" &&
        setTimeout(() => {
          navigate("/");
        }, 2000)}
    </div>
  );
};

export default RedirectionPage;
