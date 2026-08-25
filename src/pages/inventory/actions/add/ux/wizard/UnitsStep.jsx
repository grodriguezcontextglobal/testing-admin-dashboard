import { Typography } from "@mui/material";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import SerialNumberAndMoreInfoComponentForm from "../../../utils/uxForm/SerialNumberAndMoreInfoComponentForm";
import { cardBodyStyle, cardFootStyle, cardHeadStyle, cardStyle } from "./wizardStyles";

/**
 * Step 4: the units that make up this group. SerialNumberAndMoreInfoComponentForm
 * already offers paste / scan / one-at-a-time and reads as its own block —
 * it only moves into the wizard's card chrome here, unchanged otherwise.
 */
const UnitsStep = ({ moreInfo, scannedSerialNumbers, setMoreInfo, setScannedSerialNumbers, goBack, goNext }) => {
  const count = scannedSerialNumbers.length;
  return (
    <div style={cardStyle}>
      <div style={cardHeadStyle}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Which units are you creating?</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Each unit becomes one item in inventory, carrying everything you set in the steps above. Extra identifiers are optional.
        </Typography>
      </div>
      <div style={cardBodyStyle}>
        <SerialNumberAndMoreInfoComponentForm
          style={{ ...AntSelectorStyle, fontFamily: "Inter", fontSize: "14px", width: "100%" }}
          moreInfo={moreInfo}
          scannedSerialNumbers={scannedSerialNumbers}
          setMoreInfo={setMoreInfo}
          setScannedSerialNumbers={setScannedSerialNumbers}
        />
      </div>
      <div style={cardFootStyle}>
        <GrayButtonComponent title="Back" buttonType="button" func={goBack} />
        <BlueButtonComponent
          title={count > 0 ? `Review ${count} unit${count === 1 ? "" : "s"}` : "Review"}
          buttonType="button"
          func={goNext}
          disabled={count === 0}
        />
      </div>
    </div>
  );
};

export default UnitsStep;
