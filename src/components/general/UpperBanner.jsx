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
        color:"var(--blue-dark--100)",
        fontFamily:"Inter, serif-sans",
        fontWeight:400,
        height:"1.5rem"
      }}
    />
  );
});

export default UpperBanner;
