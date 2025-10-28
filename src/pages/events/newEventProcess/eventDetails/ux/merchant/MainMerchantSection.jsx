import { Typography } from "@mui/material";
import { TextFontSize20LineHeight30 } from "../../../../../../styles/global/TextFontSize20HeightLine30";
import { InputLabelStyle } from "../../../style/InputLabelStyle";
import Yes from "../buttons/Yes";
import No from "../buttons/No";

const MainMerchantSection = ({ merchant, setMerchant }) => {
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
        <Yes merchant={merchant} setMerchant={setMerchant} key="button_yes" />
        <No merchant={merchant} setMerchant={setMerchant} key="button_no" />
      </div>
    </>
  );
};

export default MainMerchantSection;
