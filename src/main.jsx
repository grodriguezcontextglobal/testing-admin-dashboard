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
import DevitrakLoading from "./components/animation/DevitrakLoading.jsx";
import ThemeShell from "./components/theme/ThemeShell.jsx";
import EmptyState from "./components/UX/emptyState/EmptyState.jsx";
import ServiceWorkerUpdateNotifier from "./components/serviceWorker/ServiceWorkerUpdateNotifier.jsx";

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

const container = document.getElementById("root");
if (container && !container._reactRootContainer) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <Provider store={store}>
      <React.StrictMode>
        {/* The two v7 defaults, turned on a release early. They are the only
            ones that apply here: the rest of react-router's future flags
            (fetcherPersist, partialHydration, skipActionErrorRevalidation)
            belong to the data router, and this app mounts <Routes>, not
            createBrowserRouter. Turning them on separately means that if a
            navigation wobbles, it is this change and not the major bump. */}
        <BrowserRouter
          basename="/"
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <PersistGate persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <ThemeShell renderEmpty={renderEmpty}>
                {/* <ErrorBoundary FallbackComponent={ErrorBoundaryComponent} onError={ErrorLogFetch}> */}
                <Suspense fallback={<Loading />}>
                  <AppLoader />
                </Suspense>
                {/* </ErrorBoundary> */}
              </ThemeShell>
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

  if (!configured) return <DevitrakLoading />;
  return (
    <>
      <ServiceWorkerUpdateNotifier />
      <App />
    </>
  );
}