import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectBalances,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { useEffect } from "react";

const StripeConnectedAccountDashboard = ({ clientSecret }) => {
  const connectInstance = loadConnectAndInitialize({
    publishableKey: import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    clientSecret: clientSecret,
    appearance: {
      variables: {
        colorPrimary: "#228403",
      },
    },
  });

  useEffect(() => {
    // Any additional setup can be done here
  }, []);

  return (
    <ConnectComponentsProvider connectInstance={connectInstance}>
      <ConnectBalances />
      {/* Add other components as needed */}
    </ConnectComponentsProvider>
  );
};

export default StripeConnectedAccountDashboard;
