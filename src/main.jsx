import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App.jsx";
import "./index.css";
import "./styles/untitled-ui/tokens.css";
import "./styles/untitled-ui/skin.css";
import { persistor, store } from "./store/Store.js";
import { configureApi } from "./api/devitrakApi.jsx";
// import { ErrorBoundary } from "react-error-boundary";
// import { ErrorBoundaryComponent, ErrorLogFetch } from "./components/utils/ErrorBoundaryComponent.jsx";
import Loading from "./components/animation/Loading.jsx";
import { ConfigProvider } from "antd";
import EmptyState from "./components/UX/emptyState/EmptyState.jsx";

// Untitled UI empty state everywhere antd would render its default Empty
// (tables, selects, lists). Compact variant keeps dropdowns tidy.
const renderEmpty = (componentName) => (
  <EmptyState
    compact={componentName !== "Table"}
    icon="tabler:database-search"
    title="Nothing here yet"
    description={
      componentName === "Table"
        ? "Once there is data to show, it will appear here."
        : undefined
    }
  />
);

const queryClient = new QueryClient();

// Devitrak Style Guide palette for antd's own components (pagination,
// switches, modal buttons, ...). Deep Blue (#021833) is the brand/chrome
// color; primary ACTIONS use the vivid action blue so CTAs pop against it.
// Shape/spacing/focus tokens follow Untitled UI (see styles/untitled-ui/).
const antdTheme = {
  token: {
    colorPrimary: "#155eef",
    colorError: "#d15334",
    colorLink: "#155eef",
    colorTextBase: "#171d1a",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    // Untitled UI neutrals (khaki-warmed gray ramp from tokens.css)
    colorBorder: "#c6c7bb",
    colorBorderSecondary: "#ddded6",
    colorSplit: "#ddded6",
    colorTextSecondary: "#5d615a",
    colorTextTertiary: "#777b73",
    colorTextPlaceholder: "#777b73",
    // Untitled UI focus ring: 4px soft ring in the action-blue family
    controlOutline: "#d1e0ff",
    controlOutlineWidth: 4,
    controlHeight: 40,
    colorBgMask: "rgba(23, 29, 26, 0.6)",
    boxShadow:
      "0 12px 16px -4px rgba(23, 29, 26, 0.08), 0 4px 6px -2px rgba(23, 29, 26, 0.03)",
    boxShadowSecondary:
      "0 12px 16px -4px rgba(23, 29, 26, 0.08), 0 4px 6px -2px rgba(23, 29, 26, 0.03)",
  },
  components: {
    Tooltip: { colorBgSpotlight: "#171d1a" },
    Table: {
      headerBg: "#f7f7f4",
      headerColor: "#5d615a",
      headerSplitColor: "transparent",
    },
    Select: { optionSelectedBg: "#f7f7f4", optionActiveBg: "#f7f7f4" },
    Modal: { titleFontSize: 18 },
  },
};

const container = document.getElementById("root");
if (container && !container._reactRootContainer) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <Provider store={store}>
      <React.StrictMode>
        <BrowserRouter basename="/">
          <PersistGate persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <ConfigProvider theme={antdTheme} renderEmpty={renderEmpty}>
                {/* <ErrorBoundary FallbackComponent={ErrorBoundaryComponent} onError={ErrorLogFetch}> */}
                <Suspense fallback={<Loading />}>
                  <AppLoader />
                </Suspense>
                {/* </ErrorBoundary> */}
              </ConfigProvider>
            </QueryClientProvider>
          </PersistGate>
        </BrowserRouter>
      </React.StrictMode>
    </Provider>
  );
}

function AppLoader() {
  const [configured, setConfigured] = React.useState(false);
//https://standby.invoxia.cc/api
  React.useEffect(() => {
    configureApi().then(() => setConfigured(true));
  }, []);

  return configured ? <App /> : <DevitrakLoading />;
}