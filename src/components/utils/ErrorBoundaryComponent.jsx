import { Card } from "antd";
import { devitrakApi } from "../../api/devitrakApi";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { DevitrakLogo } from "../icons/DevitrakLogo";
import { DevitrakName } from "../icons/DevitrakName";

export const ErrorBoundaryComponent = ({ error, resetErrorBoundary }) => {
  const titleRendering = () => {
    return (
      <h3
        style={{
          ...BlueButtonText,
          fontWeight: 600,
          fontSize: "20px",
          lineHeight: "26px",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <DevitrakLogo />
        <DevitrakName />
      </h3>
    );
  };
  return (
    <Card
      style={{
        backgroundColor: "var(--blue700)",
        width: "50%",
        margin: "0 auto",
        padding: "12px",
        color: "var(--basewhite)",
      }}
      styles={{
        body: {
          margin: "15px 0 0",
          padding: "12px 24px",
          backgroundColor: "var(--basewhite)",
          borderRadius: "12px",
        },
      }}
      title={titleRendering()}
    >
      <div role="alert">
        <p
          style={{
            ...TextFontSize20LineHeight30,
            color: "var(--main-navbar-color)",
          }}
        >
          Something went wrong:
        </p>
        <pre
          style={{
            ...TextFontSize20LineHeight30,
            color: "var(--graphic-status-damage)",
            width:"100%",
            textWrap: "balance",
          }}
        >
          {error.message}
        </pre>
        <button
          style={{ ...BlueButton, width: "100%" }}
          onClick={resetErrorBoundary}
        >
          <p style={BlueButtonText}>Reset</p>
        </button>
      </div>
    </Card>
  );
};

export const ErrorLogFetch = async (error, info) => {
  const fetchingError = await devitrakApi.post("/error_log/error_log", {
    error: `${error}`,
    componentStack: info.componentStack,
  });
  if (fetchingError.data.ok) {
    return alert(`${fetchingError.data.msg}`);
  }
};
