import { Card } from "antd";
import PropTypes from "prop-types";
import DevicesInventoryGraph from "./DevicesInventoryGraph";

const FormatQuickGlanceCardGraphRender = ({ dataToRender, totalDeviceInRange }) => {
  return (
    <Card
      title={
        <p
          style={{
            fontFamily: "Inter",
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "28px",
            color: "var(--gray-900, #101828)",
            margin: 0,
          }}
        >
          Devices inventory
        </p>
      }
      style={{
        borderRadius: "12px",
        border: "1px solid var(--gray-200, #EAECF0)",
        background: "var(--base-white, #FFF)",
        boxShadow:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
      }}
      styles={{
        header: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
        body: {
          padding: "8px 16px 16px",
        },
      }}
    >
      <DevicesInventoryGraph
        dataToRender={dataToRender}
        totalDeviceInRange={totalDeviceInRange}
      />
    </Card>
  );
};

export default FormatQuickGlanceCardGraphRender;

FormatQuickGlanceCardGraphRender.propTypes = {
  dataToRender: PropTypes.array,
  totalDeviceInRange: PropTypes.number,
};
