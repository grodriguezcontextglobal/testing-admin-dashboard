import { FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import countryList from "../../components/json/countries.json";
import { devitrakApi } from "../../api/devitrakApi";
import { checkArray } from "../../components/utils/checkArray";
import { useSelector } from "react-redux";
const RegisterStripeConnectedAccount = () => {
  const { register, handleSubmit, watch } = useForm();
  const [loadingStatus, setLoadingStatus] = useState(false);
  const { user } = useSelector((state) => state.admin);
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
  const isSmallDevice = useMediaQuery("only screen abd (max-width: 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width: 769px) and (max-width:992px)"
  );

  return (
    <Grid
      style={{
        backgroundColor: "var(--basewhite)",
        minHeight: "100vh",
        margin: 0,
        width: "100vw",
      }}
      container
    >
      <Grid
        className="register-container"
        style={{ padding: "2rem", margin: "4vh auto 0" }}
        item
        xs={6}
        sm={6}
      >
        <form
          onSubmit={handleSubmit(onSubmitRegister)}
          style={{ width: "45vw" }}
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

          <Grid item xs={12} textAlign="center">
            <p style={{ color: "#475467", fontSize: "14px" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ color: "#004EEB", fontWeight: "600" }}
              >
                Sign in
              </Link>
            </p>
          </Grid>
        </form>
      </Grid>{" "}
      <Grid
        display={(isSmallDevice || isMediumDevice) && "none"}
        id="section-img-login-component"
        item
        xs={6}
        sm={6}
      ></Grid>
    </Grid>
  );
};

export default RegisterStripeConnectedAccount;

      // console.log(data);
      // console.log({
      //   id: "acct_1QIGXUQvEEZGaW3J",
      //   object: "account",
      //   business_profile: {
      //     annual_revenue: null,
      //     estimated_worker_count: null,
      //     mcc: null,
      //     name: null,
      //     product_description: null,
      //     support_address: null,
      //     support_email: null,
      //     support_phone: null,
      //     support_url: null,
      //     url: null,
      //   },
      //   business_type: null,
      //   capabilities: {
      //     card_payments: "inactive",
      //     transfers: "inactive",
      //   },
      //   charges_enabled: false,
      //   controller: {
      //     fees: {
      //       payer: "application",
      //     },
      //     is_controller: true,
      //     losses: {
      //       payments: "application",
      //     },
      //     requirement_collection: "stripe",
      //     stripe_dashboard: {
      //       type: "express",
      //     },
      //     type: "application",
      //   },
      //   country: "US",
      //   created: 1730927602,
      //   default_currency: "usd",
      //   details_submitted: false,
      //   email: "as@garslkj.xyz",
      //   external_accounts: {
      //     object: "list",
      //     data: [],
      //     has_more: false,
      //     total_count: 0,
      //     url: "/v1/accounts/acct_1QIGXUQvEEZGaW3J/external_accounts",
      //   },
      //   future_requirements: {
      //     alternatives: [],
      //     current_deadline: null,
      //     currently_due: [],
      //     disabled_reason: null,
      //     errors: [],
      //     eventually_due: [],
      //     past_due: [],
      //     pending_verification: [],
      //   },
      //   login_links: {
      //     object: "list",
      //     data: [],
      //     has_more: false,
      //     total_count: 0,
      //     url: "/v1/accounts/acct_1QIGXUQvEEZGaW3J/login_links",
      //   },
      //   metadata: {},
      //   payouts_enabled: false,
      //   requirements: {
      //     alternatives: [],
      //     current_deadline: 1732137203,
      //     currently_due: [
      //       "business_profile.mcc",
      //       "business_profile.url",
      //       "business_type",
      //       "external_account",
      //       "representative.dob.day",
      //       "representative.dob.month",
      //       "representative.dob.year",
      //       "representative.email",
      //       "representative.first_name",
      //       "representative.last_name",
      //       "settings.payments.statement_descriptor",
      //       "tos_acceptance.date",
      //       "tos_acceptance.ip",
      //     ],
      //     disabled_reason: "requirements.past_due",
      //     errors: [],
      //     eventually_due: [
      //       "business_profile.mcc",
      //       "business_profile.url",
      //       "business_type",
      //       "external_account",
      //       "representative.dob.day",
      //       "representative.dob.month",
      //       "representative.dob.year",
      //       "representative.email",
      //       "representative.first_name",
      //       "representative.last_name",
      //       "settings.payments.statement_descriptor",
      //       "tos_acceptance.date",
      //       "tos_acceptance.ip",
      //     ],
      //     past_due: [
      //       "business_profile.mcc",
      //       "business_profile.url",
      //       "business_type",
      //       "external_account",
      //       "representative.dob.day",
      //       "representative.dob.month",
      //       "representative.dob.year",
      //       "representative.email",
      //       "representative.first_name",
      //       "representative.last_name",
      //       "settings.payments.statement_descriptor",
      //       "tos_acceptance.date",
      //       "tos_acceptance.ip",
      //     ],
      //     pending_verification: [],
      //   },
      //   settings: {
      //     bacs_debit_payments: {
      //       display_name: null,
      //       service_user_number: null,
      //     },
      //     branding: {
      //       icon: null,
      //       logo: null,
      //       primary_color: null,
      //       secondary_color: null,
      //     },
      //     card_issuing: {
      //       tos_acceptance: {
      //         date: null,
      //         ip: null,
      //       },
      //     },
      //     card_payments: {
      //       decline_on: {
      //         avs_failure: false,
      //         cvc_failure: false,
      //       },
      //       statement_descriptor_prefix: null,
      //       statement_descriptor_prefix_kana: null,
      //       statement_descriptor_prefix_kanji: null,
      //     },
      //     dashboard: {
      //       display_name: null,
      //       timezone: "Etc/UTC",
      //     },
      //     invoices: {
      //       default_account_tax_ids: null,
      //     },
      //     payments: {
      //       statement_descriptor: null,
      //       statement_descriptor_kana: null,
      //       statement_descriptor_kanji: null,
      //     },
      //     payouts: {
      //       debit_negative_balances: true,
      //       schedule: {
      //         delay_days: 2,
      //         interval: "daily",
      //       },
      //       statement_descriptor: null,
      //     },
      //     sepa_debit_payments: {},
      //   },
      //   tos_acceptance: {
      //     date: null,
      //     ip: null,
      //     user_agent: null,
      //   },
      //   type: "none",
      // });
      //
      // console.log("connect account link", {
      //   object: "account_link",
      //   created: 1730928560,
      //   expires_at: 1730928860,
      //   url: "https://connect.stripe.com/setup/e/acct_1QIGXUQvEEZGaW3J/BUudCHBkyi8P",
      // });
