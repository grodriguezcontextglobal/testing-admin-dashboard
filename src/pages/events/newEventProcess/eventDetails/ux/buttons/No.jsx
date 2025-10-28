import { Button } from "antd";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { Subtitle } from "../../../../../../styles/global/Subtitle";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { Icon } from "@iconify/react/dist/iconify.js";

const No = ({ merchant, setMerchant }) => {
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
            !merchant
              ? "1px solid var(--blue-dark-700, #004EEB)"
              : "1px solid #d5d5d5"
          }`,
          background: `${!merchant ? "var(--blue-dark-700, #004EEB)" : "#fff"}`,
        }}
        onClick={() => setMerchant(false)}
      >
        <p
          style={{
            ...Subtitle,
            ...CenteringGrid,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            textTransform: "capitalize",
            fontFamily: "Inter",
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: 600,
            lineHeight: "20px",
            color: `${!merchant ? "#fff" : "#8f8f8f"}`,
          }}
        >
          {!merchant ? (
            <Icon width={20} height={20} icon="iconoir:check" />
          ) : (
            <Icon width={20} height={20} icon="octicon:x-24" />
          )}
          &nbsp;No
        </p>
      </Button>
    </div>
  );
};

export default No;
