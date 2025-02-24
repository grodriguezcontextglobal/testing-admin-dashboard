import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import StripeConnectedAccountDashboard from "../../../components/stripe/connected_account/dashboard";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";
import { FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import countryList from "../../../components/json/countries.json";
import { useForm } from "react-hook-form";
import { ConfigEnvExport } from "../../../config/ConfigEnvExport";
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
    if (user.companyData.stripe_connected_account[stripeEnvMode.current].id) {
      return setClientSecret(true);
    }
  }, []);

  if (clientSecret) {
    return (
      <div style={{ width: "100%" }}>
        {user.companyData.stripe_connected_account[stripeEnvMode.current].id && clientSecret && (
          <StripeConnectedAccountDashboard />
        )}
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
      {!user.companyData.stripe_connected_account[stripeEnvMode.current].id &&
        !openModalStripeConnectedAccount && (
          <Button
            onClick={() => setOpenModalStripeConnectedAccount(true)}
            style={BlueButton}
          >
            <p style={BlueButtonText}>Create stripe connected account</p>
          </Button>
        )}
      {openModalStripeConnectedAccount && (
        <form
          onSubmit={handleSubmit(onSubmitRegister)}
          style={{ width: "45vw", margin:"5rem 0 0 0" }}
        >
          <Typography
            style={{
              color: "var(--gray900, #101828)",
              fontSize: "30px",
              fontWeight: "600",
              lineHeight: "38px",
              marginBottom: "1rem",
            }}
          >
            Register your company stripe account
          </Typography>
          <Typography
            style={{
              color: "var(--gray-500, #667085)",
              fontSize: "16px",
              lineHeight: "24px",
            }}
          >
            To set up a new company stripe account, please complete the steps
            below.
          </Typography>

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
                  color: "rgba(0, 0, 0, 0.6)",
                  width: "100%",
                }}
              >
                {countryList.map((item) => (
                  <option
                    style={{ color: "rgba(0, 0, 0, 0.6)" }}
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
            <Button
              htmlType="submit"
              disabled={loadingStatus}
              loading={loadingStatus}
              style={{ width: "100%", background: "#004EEB", color: "#fff" }}
            >
              {loadingStatus ? "Loading..." : "Register"}
            </Button>
          </Grid>
        </form>
      )}
    </div>
  );
};

export default Dashboard;
