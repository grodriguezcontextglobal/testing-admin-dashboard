import { Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { STRIPE_ACCOUNT_SETUP_ROUTE } from "../../utils/merchantAvailability";
import { TextFontSize20LineHeight30 } from "../../../../../../styles/global/TextFontSize20HeightLine30";
import { InputLabelStyle } from "../../../style/InputLabelStyle";
import Yes from "../buttons/Yes";
import No from "../buttons/No";

/**
 * Without the company's Stripe account, "Yes" is disabled and the reason is on
 * screen with the way to fix it (requested 2026-09-25) — the same shape as
 * lostFee/Choice.jsx. A hidden option reads as a bug; a disabled one that says
 * what is missing leads to the fix.
 */
const MainMerchantSection = ({ merchant, setMerchant, merchantAvailable = true }) => {
  return (
    <>
      <div style={{ width: "100%", textAlign: "left" }}>
        <Typography
          textTransform={"none"}
          textAlign={"left"}
          style={TextFontSize20LineHeight30}
        >
          Will this event need a merchant service?
        </Typography>
      </div>
      <div style={{ width: "100%", textAlign: "left" }}>
        <Typography style={{ ...InputLabelStyle, fontWeight: 400 }}>
          A merchant service is needed to process monetary transactions such as
          obtaining deposits and charging users for lost devices.
        </Typography>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          textAlign: "left",
          gap: "10px",
        }}
      >
        <Yes
          merchant={merchant}
          setMerchant={setMerchant}
          disabled={!merchantAvailable}
          key="button_yes"
        />
        <No merchant={merchant} setMerchant={setMerchant} key="button_no" />
      </div>
      {!merchantAvailable && (
        <div style={{ width: "100%", textAlign: "left", margin: "-0.75rem 0 1.5rem" }}>
          <Typography style={{ ...InputLabelStyle, fontWeight: 400 }}>
            Unavailable — this company has no Stripe account yet, so this event cannot
            take deposits or charge cards.{" "}
            <Link to={STRIPE_ACCOUNT_SETUP_ROUTE}>Set up the Stripe account</Link>
          </Typography>
        </div>
      )}
    </>
  );
};

export default MainMerchantSection;
