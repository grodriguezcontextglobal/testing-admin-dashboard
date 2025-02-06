import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectAccountManagement,
  ConnectAccountOnboarding,
  ConnectBalances,
  ConnectComponentsProvider,
  ConnectPayments,
  ConnectPayouts,
} from "@stripe/react-connect-js";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import "./dashboard.css";
import { Skeleton } from "antd";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";
const StripeConnectedAccountDashboard = () => {
  const { user } = useSelector((state) => state.admin);
  const [isLoading, setIsLoading] = useState(true);
  const [stripeConnectInstance] = useState(() => {
    const fetchClientSecret = async () => {
      // Fetch the AccountSession client secret
      const response = await devitrakApi.post("/stripe/account_sessions", {
        connectedAccountId: user.companyData.stripe_connected_account.id,
      });
      if (response.data.ok) {
        return response.data.client_secret;
      }
    };

    return loadConnectAndInitialize({
      // This is your test publishable API key.
      publishableKey: ConfigEnvExport.stripe_public_key,
      fetchClientSecret: fetchClientSecret,
      fonts: [
        {
          cssSrc:
            "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
        },
        {
          src: `url("https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap")`,
          family: "Inter",
        },
      ],
      appearance: {
        // See all possible variables below
        overlays: "drawer",
        variables: {
          fontFamily: "Inter",
          colorPrimary: "var(--basewhite)",
          colorBackground: "var(--basewhite)",
          colorText: "var(--gray900)",
          fontSizeBase: "16px",
          headingLgFontWeight: 600,
        },
      },
      locale: "en-US",
    });
  });

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => {
      setIsLoading(false);
      return controller.abort();
    }, 6000);
  }, []);
  return (
    <>
      {isLoading && <div style={{ width: "100%", height:"100%", margin: "auto", display: "flex", justifyContent: "center", alignItems: "center" }}><Skeleton active /></div>}
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountManagement />
        <ConnectPayments />
        <ConnectBalances />
        <ConnectPayouts />
        <ConnectAccountOnboarding />
      </ConnectComponentsProvider>
    </>
  );
};
export default StripeConnectedAccountDashboard;
