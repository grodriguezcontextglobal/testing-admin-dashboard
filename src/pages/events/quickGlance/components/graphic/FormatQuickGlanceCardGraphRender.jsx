import { PropTypes } from "prop-types";
import ChartGaugeActivity from "../../../../../components/utils/ChartGaugeActivity";
import ReusableCard from "../../../../../components/UX/cards/ReusableCard";

const COLORS = ["#00359E", "#155EEF", "#84ADFF", "#fb6b6b"];

const FormatQuickGlanceCardGraphRender = ({
  dataToRender,
  totalDeviceInRange,
}) => {
  return (
    <ReusableCard>
      <ChartGaugeActivity
        dataToRender={dataToRender}
        title={totalDeviceInRange}
        subtitle="Devices total"
        maxValue={totalDeviceInRange}
        colors={COLORS}
        height={280}
      />
    </ReusableCard>
  );
};

export default FormatQuickGlanceCardGraphRender;

FormatQuickGlanceCardGraphRender.propTypes = {
  dataToRender: PropTypes.array,
  totalDeviceInRange: PropTypes.number,
};
