import { FormLabel, Grid, OutlinedInput } from "@mui/material";
import { message } from "antd";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import countryList from "../../../components/json/countries.json";
import StripeConnectedAccountDashboard from "../../../components/stripe/connected_account/dashboard";
import { checkArray } from "../../../components/utils/checkArray";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import Header from "../components/Header";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
const Dashboard = () => {
  const stripeEnvMode = useRef(
    String(ConfigEnvExport.stripe_public_key).includes("test") ? "test" : "live"
  );
  const [clientSecret, setClientSecret] = useState(null);
  const [openModalStripeConnectedAccount, setOpenModalStripeConnectedAccount] =
    useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const { register, watch, handleSubmit } = useForm();
  const { user } = useSelector((state) => state.admin);
  useEffect(() => {
    if (
      user?.companyData?.stripe_connected_account?.[stripeEnvMode.current]?.id
    ) {
      return setClientSecret(true);
    }
  }, []);

  if (clientSecret) {
    return (
      <div style={{ width: "100%" }}>
        {user?.companyData?.stripe_connected_account?.[stripeEnvMode.current]
          ?.id &&
          clientSecret && <StripeConnectedAccountDashboard />}
      </div>
    );
  }

  const onSubmitRegister = async (data) => {
    try {
      setLoadingStatus(true);
      const createConnectedAccount = await devitrakApi.post(
        "/stripe/accounts",
        data
      );
      if (createConnectedAccount.data) {
        const newConnectedAccount = checkArray(
          createConnectedAccount.data.account
        );
        await devitrakApi.patch(
          `/company/update-company/${user.companyData.id}`,
          {
            stripe_connected_account: {
              id: newConnectedAccount.id,
              login_links: newConnectedAccount.login_links,
            },
          }
        );
        const responseCreateAccount = await devitrakApi.post(
          "/stripe/account_link",
          {
            connectedAccountId: newConnectedAccount.id,
            origin: window.location.origin,
          }
        );
        if (responseCreateAccount.data) {
          setLoadingStatus(false);
          return window.location.assign(responseCreateAccount.data.account.url);
        }
      }
    } catch (error) {
      setLoadingStatus(false);
      message.error(
        error?.response?.data?.msg ||
          "Failed to create the Stripe connected account. Please try again."
      );
    }
  };

  return (
    <div
      style={{
        ...CenteringGrid,
        height: "100%",
        width: "100%",
      }}
    >
      {!user?.companyData?.stripe_connected_account?.[stripeEnvMode.current]
        ?.id &&
        !openModalStripeConnectedAccount && (
          <EmptyState
            icon="tabler:brand-stripe"
            title="No Stripe account connected"
            description="Connect a Stripe account to accept payments and manage payouts for your company."
            action={
              <BlueButtonComponent
                onClick={() => setOpenModalStripeConnectedAccount(true)}
              >
                Create stripe connected account
              </BlueButtonComponent>
            }
          />
        )}
      {openModalStripeConnectedAccount && (
        <form
          onSubmit={handleSubmit(onSubmitRegister)}
          style={{ width: "45vw", margin:"5rem 0 0 0" }}
        >
          <Header title={"Register your company stripe account"} description={"To set up a new company stripe account, please complete the steps below."} />

          <Grid textAlign={"left"} marginY={"20px"} item xs={12}>
            <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
              Email
              <OutlinedInput
                required
                {...register("email")}
                style={{ ...OutlinedInputStyle }}
                placeholder="Email"
                fullWidth
              />
            </FormLabel>
          </Grid>

          <Grid textAlign={"left"} marginY={"20px"} item xs={12}>
            <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
              Country
              <select
                {...register("country", { required: true })}
                name="country"
                value={watch("country")}
                style={{
                  ...OutlinedInputStyle,
                  backgroundColor: "transparent",
                  color: "var(--gray-600, #5d615a)",
                  width: "100%",
                }}
              >
                {countryList.map((item) => (
                  <option
                    style={{ color: "var(--gray-600, #5d615a)" }}
                    key={item.name}
                    value={item.code}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </FormLabel>
          </Grid>
          <Grid textAlign={"left"} marginY={"20px"} item xs={12}>
            <BlueButtonComponent
              buttonType="submit"
              disabled={loadingStatus}
              isLoading={loadingStatus}
              styles={{ width: "100%" }}
            >
              Register
            </BlueButtonComponent>
          </Grid>
        </form>
      )}
    </div>
  );
};

export default Dashboard;
