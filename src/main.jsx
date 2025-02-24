import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App.jsx";
import "./index.css";
import { persistor, store } from "./store/Store.js";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorBoundaryComponent, ErrorLogFetch } from "./components/utils/ErrorBoundaryComponent.jsx";
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <React.StrictMode>
      <BrowserRouter basename="/">
        <PersistGate persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary FallbackComponent={ErrorBoundaryComponent} onError={ErrorLogFetch}>
              <App />
            </ErrorBoundary>
          </QueryClientProvider>
        </PersistGate>
      </BrowserRouter>
    </React.StrictMode>
  </Provider>
);
