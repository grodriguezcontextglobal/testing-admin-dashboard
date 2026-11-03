import React from "react";
import App from "./App.jsx";
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
