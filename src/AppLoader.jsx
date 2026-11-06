import React from "react";
import App from "./App.jsx";
// The global CSS goes right after App and before every other component: Vite
// injects CSS in import order, so a component imported above these loses the
// cascade to them (globalCssOrder.test.js has the 2026-11-03 regression).
import "./index.css";
import "./styles/untitled-ui/tokens.css";
import "./styles/untitled-ui/skin.css";
import { configureApi } from "./api/devitrakApi.jsx";
import DevitrakLoading from "./components/animation/DevitrakLoading.jsx";
import ServiceWorkerUpdateNotifier from "./components/serviceWorker/ServiceWorkerUpdateNotifier.jsx";

const AppLoader = () => {
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
};

export default AppLoader;
