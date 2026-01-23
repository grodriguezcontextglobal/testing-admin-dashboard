import { Alert } from "antd";
import { forwardRef } from "react";
import { useSelector } from "react-redux";

const UpperBanner = forwardRef(function UpperBanner() {
  const { user } = useSelector((state) => state.admin);
  return (
    <Alert
      message={user.companyData.company_name}
      banner
      showIcon={false}
      style={{
        backgroundColor: "var(--blue-dark--800)",
        color:"#var(--gray300)",
        fontFamily:"Inter, serif-sans",
        fontWeight:400
      }}
    />
  );
});

export default UpperBanner;
