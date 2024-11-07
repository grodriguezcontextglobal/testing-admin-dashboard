import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import StripeConnectedAccountDashboard from "../../../components/stripe/connected_account/dashboard";

const Dashboard = () => {
  const { user } = useSelector((state) => state.admin);
  const [clientSecret, setClientSecret] = useState(null);

  const fetchClientSecret = async () => {
    try {
      const response = await devitrakApi.post("/stripe/account_sessions", {
        connectedAccountId: user.companyData.stripe_connected_account.id,
      });
      setClientSecret(response.data.client_secret);
    } catch (error) {
      console.error("Error fetching client secret:", error);
    }
  };

  useEffect(() => {
    fetchClientSecret();
  }, []);

  return (
    <div>
      {clientSecret && (
        <StripeConnectedAccountDashboard clientSecret={clientSecret} />
      )}
    </div>
  );
};

export default Dashboard;
