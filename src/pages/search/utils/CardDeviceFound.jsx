import { PropTypes } from "prop-types";
import { GeneralDeviceIcon } from "../../../components/icons/GeneralDeviceIcon";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../components/UX/buttons/DangerButtonConfirmation";
import ReusableCardWithHeaderAndFooter from "../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import { Subtitle } from "../../../styles/global/Subtitle";
const CardDeviceFound = ({
  props,
  fn,
  returnFn,
  loadingStatus,
  returnLoading,
}) => {
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
    <ReusableCardWithHeaderAndFooter
      title={<p style={{ ...subtitleCardStyle, fontWeight: 600, fontSize:"20px" }}>{props?.type}</p>}
      key={props.data?._id}
      actions={[
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-start", margin:"0 24px", gap:3 }} key={props.data?._id}>
          <BlueButtonComponent
            title="Details"
            func={() => fn(props)}
            buttonType="button"
            loadingState={loadingStatus}
          />
          <DangerButtonConfirmationComponent
            loadingState={returnLoading}
            func={() => returnFn(props)}
            title="Return device"
            confirmationTitle="Are you sure to return this device?"
          />
        </div>,
      ]}
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
      <div style={{ ...subtitleCardStyle, fontWeight:500}}>{props?.serialNumber}</div>
      <div style={{ ...subtitleCardStyle, fontWeight:400}}>{props?.event}</div>
      <div
        style={{
          ...subtitleCardStyle,
          backgroundColor:
            styleDic[props.active]?.backgroundColor ?? "transparent",
          borderRadius: "16px",
          justifyContent: "center",
          display: "flex",
          padding: "2px 8px",
          alignItems: "center",
          margin: "5px 0",
        }}
      >
        <p
          style={{
            ...Subtitle,
            color: styleDic[props.active]?.color ?? "transparent",
          }}
        >
          {props?.active ? "In transaction" : "In event's stock"}
        </p>
      </div>
    </ReusableCardWithHeaderAndFooter>
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
