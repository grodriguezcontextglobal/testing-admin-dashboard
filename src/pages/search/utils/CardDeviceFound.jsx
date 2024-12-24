import { Button, Card, Divider } from "antd";
import { PropTypes } from "prop-types";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { BlueButton } from "../../../styles/global/BlueButton";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GeneralDeviceIcon } from "../../../components/icons/GeneralDeviceIcon";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
const CardDeviceFound = ({ props, fn, returnFn, loadingStatus }) => {
  const styleDic = {
    true: {
      backgroundColor: "#FFF4ED",
      color: "#B93815",
    },
    false: {
      backgroundColor: "#ECFDF3",
      color: "#027A48",
    },
  };

  const subtitleCardStyle = {
    width: "100%",
    textAlign: "left",
    color: "var(--Gray-600, #475467)",
    fontFamily: "Inter",
    fontSize: "16px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "24px" /* 150% */,
    textWrap: "pretty",
  };
  return (
    <Card
      key={props.data?._id}
      style={{
        borderRadius: "12px",
        border: "1px solid #D0D5DD",
        background: "#FFF",
        boxShadow: "0px 2px 4px 0px rgba(0, 0, 0, 0.05)",
        display: "flex",
        padding: "5px",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "20px",
      }}
      styles={{
        body: {
          padding: "5px 20px 20px 20px",
        },
      }}
    >
      <div style={{ width: "100%", textAlign: "left" }}>
        {props.image ? (
          <img
            src={props?.image}
            alt={`${props?.image}`}
            style={{ objectFit: "cover", height: "auto", width: "70%" }}
          />
        ) : (
          <GeneralDeviceIcon dimensions={{ width: "150px", height: "auto" }} />
        )}
      </div>
      <div
        style={{
          width: "100%",
          textAlign: "left",
          color: "var(--Gray-900, #101828)",
          fontFamily: "Inter",
          fontSize: "18px",
          fontStyle: " normal",
          fontWeight: 600,
          lineHeight: "28px" /* 155.556% */,
          textWrap: "pretty",
        }}
      >
        {props?.serialNumber}
      </div>
      <div style={subtitleCardStyle}>{props?.type}</div>
      <div style={subtitleCardStyle}>{props?.event}</div>
      <div
        style={{
          ...subtitleCardStyle,
          backgroundColor: styleDic[props.active].backgroundColor,
          borderRadius: "16px",
          justifyContent: "center",
          display: "flex",
          padding: "2px 8px",
          alignItems: "center",
          margin:"5px 0"
        }}
      >
        <p style={{ ...Subtitle, color: styleDic[props.active].color }}>
          {props?.active ? "In transaction" : "In event's stock"}
        </p>
      </div>
      <Divider style={{ margin: "5px 0 10px" }} />
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <Button
          onClick={() => fn(props)}
          style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
        >
          <p style={BlueButtonText}>Details</p>
        </Button>
        <Button
          loading={loadingStatus}
          onClick={() => returnFn(props)}
          style={{
            ...DangerButton,
            ...CenteringGrid,
            width: "100%",
            display: props.active ? "flex" : "none",
          }}
        >
          <p style={DangerButtonText}>Return</p>
        </Button>
      </div>
    </Card>
  );
};

export default CardDeviceFound;

CardDeviceFound.propTypes = {
  props: PropTypes.object.isRequired,
  fn: PropTypes.func,
  image: PropTypes.string.isRequired,
  serialNumber: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};
