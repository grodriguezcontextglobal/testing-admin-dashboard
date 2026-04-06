import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App.jsx";
import "./index.css";
import { persistor, store } from "./store/Store.js";
import { configureApi } from "./api/devitrakApi.jsx";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorBoundaryComponent, ErrorLogFetch } from "./components/utils/ErrorBoundaryComponent.jsx";
import Loading from "./components/animation/Loading.jsx";

const queryClient = new QueryClient();

const container = document.getElementById("root");
if (container && !container._reactRootContainer) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <Provider store={store}>
      <React.StrictMode>
        <BrowserRouter basename="/">
          <PersistGate persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <ErrorBoundary FallbackComponent={ErrorBoundaryComponent} onError={ErrorLogFetch}>
              <Suspense fallback={<Loading />}>
                <AppLoader />
              </Suspense>
              </ErrorBoundary>
            </QueryClientProvider>
          </PersistGate>
        </BrowserRouter>
      </React.StrictMode>
    </Provider>
  );
}

function AppLoader() {
  const [configured, setConfigured] = React.useState(false);
  //http://127.0.0.1:34001/api/
  React.useEffect(() => {
    configureApi().then(() => setConfigured(true));
  }, []);

  return configured ? <App /> : <Loading />;
}