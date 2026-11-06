import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
// import CardRendered from "../../events/quickGlance/components/CardRendered"
import { lazy, Suspense, useEffect, useState } from "react";
import DevitrakLoading from "../../../components/animation/DevitrakLoading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
const ReusableCard = lazy(() =>
  import("../../../components/UX/cards/ReusableCard")
    // "../../../components/UX/cards/ReusableCard")
);
/** The inventory's total cost, formatted as dollars ("$1,234"). */
const formatTotalDeviceValue = (items) => {
  const total = items.reduce((accu, { cost }) => accu + Number(cost), 0);
  return `$${Number(total).toLocaleString("en-US")}`;
};

const TotalDevice = () => {
  const { user } = useSelector((state) => state.admin);
  const [device, setDevice] = useState("");
  const companyId = user.sqlInfo.company_id;

  useEffect(() => {
    let cancelled = false;
    const loadTotal = async () => {
      const response = await devitrakApi.post("db_item/consulting-item", {
        company_id: companyId,
      });
      if (!cancelled && response.data.ok) {
        setDevice(formatTotalDeviceValue(response.data.items));
      }
    };
    loadTotal().catch((error) => { console.error("Total device value:", error); });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <DevitrakLoading />
        </div>
      }
    >
      <ReusableCard props={device} title={"Total device value"} />
    </Suspense>
  );
};

export default TotalDevice;
