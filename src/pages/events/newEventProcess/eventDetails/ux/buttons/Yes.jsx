import { Button } from "antd";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { Subtitle } from "../../../../../../styles/global/Subtitle";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { Icon } from "@iconify/react/dist/iconify.js";

const Yes = ({ merchant, setMerchant }) => {
  return (
    <div
      style={{
        textAlign: "left",
      }}
    >
      <Button
        style={{
          ...BlueButton,
          gap: "8px",
          margin: "0.1rem 0 1.5rem",
          border: `${
            merchant
              ? "1px solid var(--blue-dark-700, #004EEB)"
              : "1px solid #d5d5d5"
          }`,
          background: `${
            merchant
              ? "var(--blue-dark-700, #004EEB)"
              : "var(--base-white, #FFF)"
          }`,
        }}
        onClick={() => setMerchant(true)}
      >
        <p
          style={{
            ...Subtitle,
            ...CenteringGrid,
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            textTransform: "capitalize",
            color: `${merchant ? "#fff" : "#8f8f8f"}`,
          }}
        >
          {merchant ? (
            <Icon width={20} height={20} icon="iconoir:check" />
          ) : (
            <Icon width={20} height={20} icon="octicon:x-24" />
          )}
          &nbsp;Yes
        </p>
      </Button>
    </div>
  );
};

export default Yes;
