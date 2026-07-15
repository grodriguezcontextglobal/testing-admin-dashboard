import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notification } from "antd";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";
import { persistor, store } from "./store/Store.js";
import { configureApi } from "./api/devitrakApi.jsx";
// import { ErrorBoundary } from "react-error-boundary";
// import { ErrorBoundaryComponent, ErrorLogFetch } from "./components/utils/ErrorBoundaryComponent.jsx";
import DevitrakLoading from "./components/animation/DevitrakLoading.jsx";
import BlueButtonComponent from "./components/UX/buttons/BlueButton.jsx";

const queryClient = new QueryClient();

// registerType: "prompt" (see vite.config.js) — the deployment ships a single
// bundle with no partial-chunk-upload tolerance, so the update is surfaced to
// the user instead of silently swapped mid-session.
const updateServiceWorker = registerSW({
  onNeedRefresh() {
    notification.info({
      key: "pwa-update-available",
      message: "Update available",
      description: "A new version of the app is ready.",
      duration: 0,
      btn: <BlueButtonComponent title="Refresh" func={() => updateServiceWorker(true)} />,
    });
  },
  onOfflineReady() {
    notification.success({
      message: "Ready to work offline",
      description: "The app shell is cached and available without a connection.",
    });
  },
});

const container = document.getElementById("root");
if (container && !container._reactRootContainer) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <Provider store={store}>
      <React.StrictMode>
        <BrowserRouter basename="/">
          <PersistGate persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              {/* <ErrorBoundary FallbackComponent={ErrorBoundaryComponent} onError={ErrorLogFetch}> */}
              <Suspense fallback={<DevitrakLoading />}>
                <AppLoader />
              </Suspense>
              {/* </ErrorBoundary> */}
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