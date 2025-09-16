import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "antd";

const RefreshButton = ({ propsFn = null }) => {
  return (
    <Button
      style={{
        display: "flex",
        alignItems: "center",
        borderTop: "transparent",
        borderLeft: "transparent",
        borderBottom: "transparent",
        borderRadius: "8px 8px 0 0",
      }}
      onClick={() => propsFn()}
    >
      <p
        style={{
          textTransform: "none",
          textAlign: "left",
          fontWeight: 500,
          fontSize: "12px",
          fontFamily: "Inter",
          lineHeight: "28px",
          color: "var(--blue-dark-700, #004EEB)",
          padding: "0px",
        }}
      >
        <Icon icon="jam:refresh" /> Refresh
      </p>
    </Button>
  );
};

export default RefreshButton;